#[cfg(not(test))]
use crate::github;
use crate::{
    db::DynDB,
    github::{repo_view, DynGH},
};
use anyhow::{format_err, Context, Error, Result};
use config::Config;
use deadpool::unmanaged::{Object, Pool};
use futures::stream::{self, StreamExt};
use postgres_types::{FromSql, ToSql};
use serde::{Deserialize, Serialize};
#[cfg(not(test))]
use serde_json::Value;
use sha2::{Digest, Sha256};
use std::time::{Duration, Instant};
use time::OffsetDateTime;
use tokio::time::timeout;
use tracing::{debug, info, instrument};
use uuid::Uuid;

/// Maximum time that can take tracking a single repository.
const REPOSITORY_TRACK_TIMEOUT: u64 = 300;

/// Repository information.
#[derive(Debug, Clone, PartialEq, Default)]
pub(crate) struct Repository {
    pub repository_id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub url: String,
    pub homepage_url: Option<String>,
    pub topics: Option<Vec<String>>,
    pub languages: Option<Vec<String>>,
    pub stars: Option<i32>,
    pub digest: Option<String>,
    pub project_name: String,
}

impl Repository {
    /// Update repository's GitHub data.
    fn update_gh_data(&mut self, gh_repo: &repo_view::RepoViewRepository) -> Result<bool> {
        // Description
        self.description = gh_repo.description.clone();

        // Homepage url
        self.homepage_url = gh_repo.homepage_url.clone();

        // Languages
        self.languages = gh_repo.languages.as_ref().and_then(|languages| {
            languages.nodes.as_ref().map(|nodes| {
                nodes
                    .iter()
                    .flatten()
                    .map(|node| node.name.clone())
                    .collect()
            })
        });

        // Stars
        self.stars = Some(gh_repo.stargazer_count as i32);

        // Topics
        self.topics = gh_repo.repository_topics.nodes.as_ref().map(|nodes| {
            nodes
                .iter()
                .flatten()
                .map(|node| node.topic.name.clone())
                .collect()
        });

        // Digest
        let prev_digest = self.digest.clone();
        self.update_digest()?;
        Ok(self.digest != prev_digest)
    }

    /// Update repository's digest.
    fn update_digest(&mut self) -> Result<()> {
        let data = bincode::serialize(&(
            &self.description,
            &self.homepage_url,
            &self.languages,
            &self.topics,
            &self.stars,
        ))?;
        let digest = hex::encode(Sha256::digest(data));
        self.digest = Some(digest);
        Ok(())
    }
}

/// Issue area.
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize, ToSql, FromSql)]
#[serde(rename_all = "kebab-case")]
#[postgres(name = "area")]
pub enum IssueArea {
    #[postgres(name = "docs")]
    Docs,
}

/// Issue kind.
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize, ToSql, FromSql)]
#[serde(rename_all = "kebab-case")]
#[postgres(name = "kind")]
pub enum IssueKind {
    #[postgres(name = "bug")]
    Bug,
    #[postgres(name = "feature")]
    Feature,
    #[postgres(name = "enhancement")]
    Enhancement,
}

/// Issue difficulty.
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize, ToSql, FromSql)]
#[serde(rename_all = "kebab-case")]
#[postgres(name = "difficulty")]
pub enum IssueDifficulty {
    #[postgres(name = "easy")]
    Easy,
    #[postgres(name = "medium")]
    Medium,
    #[postgres(name = "hard")]
    Hard,
}

/// Issue information.
#[derive(Debug, Clone, PartialEq)]
pub(crate) struct Issue {
    pub issue_id: i64,
    pub title: String,
    pub url: String,
    pub number: i32,
    pub labels: Vec<String>,
    pub published_at: OffsetDateTime,
    pub digest: Option<String>,
    pub area: Option<IssueArea>,
    pub kind: Option<IssueKind>,
    pub difficulty: Option<IssueDifficulty>,
    pub mentor_available: Option<bool>,
    pub mentor: Option<String>,
    pub good_first_issue: Option<bool>,
}

impl Issue {
    /// Update issue's digest.
    pub(crate) fn update_digest(&mut self) {
        let Ok(data) = bincode::serialize(&(&self.title, &self.labels)) else {
            return;
        };
        let digest = hex::encode(Sha256::digest(data));
        self.digest = Some(digest);
    }

    /// Prepare texts for text search document.
    pub(crate) fn prepare_ts_texts(&self, repo: &Repository) -> IssueTsTexts {
        // Weight A
        let weight_a = repo.project_name.clone();

        // Weight B
        let weight_b = format!(
            "{} {} {} {}",
            &repo.name,
            &repo.description.clone().unwrap_or_default(),
            &repo
                .topics
                .as_ref()
                .map(|topics| topics.join(" "))
                .unwrap_or_default(),
            &repo
                .languages
                .as_ref()
                .map(|languages| languages.join(" "))
                .unwrap_or_default()
        )
        .trim()
        .to_owned();

        // Weight C
        let weight_c = format!("{} {}", self.title, self.labels.join(" "));

        IssueTsTexts {
            weight_a,
            weight_b,
            weight_c,
        }
    }

    /// Populate the issue with information extracted from the labels, like the
    /// issue kind, its difficulty, etc.
    pub(crate) fn populate_from_labels(&mut self) {
        for label in self.labels.iter() {
            // Area
            if label.contains("docs") || label.contains("documentation") {
                self.area = Some(IssueArea::Docs);
                continue;
            }

            // Kind
            if let Some(kind) = {
                if label.contains("enhancement") || label.contains("improvement") {
                    Some(IssueKind::Enhancement)
                } else if label.contains("feature") {
                    Some(IssueKind::Feature)
                } else if label.contains("bug") {
                    Some(IssueKind::Bug)
                } else {
                    None
                }
            } {
                self.kind = Some(kind);
                continue;
            }

            // Difficulty
            let labels_easy = ["difficulty/easy", "level/easy"];
            let labels_medium = ["difficulty/medium", "level/medium"];
            let labels_hard = ["difficulty/hard", "level/hard"];
            if let Some(difficulty) = {
                if labels_easy.contains(&label.as_str()) {
                    Some(IssueDifficulty::Easy)
                } else if labels_medium.contains(&label.as_str()) {
                    Some(IssueDifficulty::Medium)
                } else if labels_hard.contains(&label.as_str()) {
                    Some(IssueDifficulty::Hard)
                } else {
                    None
                }
            } {
                self.difficulty = Some(difficulty);
                continue;
            }

            // Mentor available
            if label == "mentor available" {
                self.mentor_available = Some(true);
                continue;
            }

            // Good first issue
            if label == "good first issue" {
                self.good_first_issue = Some(true);
                continue;
            }
        }
    }
}

/// Texts used to build the issue's text search document.
#[derive(Debug, Clone, PartialEq)]
pub(crate) struct IssueTsTexts {
    pub weight_a: String,
    pub weight_b: String,
    pub weight_c: String,
}

/// Track repositories that need to be tracked.
pub(crate) async fn run(cfg: &Config, db: DynDB, gh: DynGH) -> Result<()> {
    // Setup GitHub tokens pool
    let gh_tokens = cfg.get::<Vec<String>>("creds.githubTokens")?;
    if gh_tokens.is_empty() {
        return Err(format_err!(
            "GitHub tokens not found in config file (creds.githubTokens)"
        ));
    }
    let gh_tokens_pool = Pool::from(gh_tokens.clone());

    // Get repositories to track
    debug!("getting repositories to track");
    let repositories_to_track = db.get_repositories_to_track().await?;
    if repositories_to_track.is_empty() {
        info!("no repositories to track");
        info!("tracker finished");
        return Ok(());
    }

    // Track repositories
    info!("tracking repositories");
    let result = stream::iter(repositories_to_track)
        .map(|repository| async {
            let db = db.clone();
            let gh = gh.clone();
            let gh_token = gh_tokens_pool.get().await.expect("token -when available-");
            let repo_url = repository.url.clone();

            match timeout(
                Duration::from_secs(REPOSITORY_TRACK_TIMEOUT),
                track_repository(db, gh, gh_token, repository),
            )
            .await
            {
                Ok(result) => result,
                Err(err) => Err(format_err!("{}", err)),
            }
            .context(format!("error tracking repository {repo_url}"))
        })
        .buffer_unordered(cfg.get("tracker.concurrency")?)
        .collect::<Vec<Result<()>>>()
        .await
        .into_iter()
        .fold(
            Ok::<(), Error>(()),
            |final_result, task_result| match task_result {
                Ok(()) => final_result,
                Err(task_err) => match final_result {
                    Ok(()) => Err(task_err).map_err(Into::into),
                    Err(final_err) => Err(format_err!("{:#}\n{:#}", final_err, task_err)),
                },
            },
        );

    // Check Github API rate limit status for each token
    #[cfg(not(test))]
    for (i, gh_token) in gh_tokens.into_iter().enumerate() {
        let gh_client = github::setup_http_client(&gh_token)?;
        let response: Value = gh_client
            .get("https://api.github.com/rate_limit")
            .send()
            .await?
            .json()
            .await?;
        debug!(
            "token [{}] github rate limit info: [rate: {}] [graphql: {}]",
            i, response["rate"], response["resources"]["graphql"]
        );
    }

    info!("tracker finished");
    result
}

/// Track repository provided.
#[instrument(fields(url = %repo.url), skip_all, err)]
async fn track_repository(
    db: DynDB,
    gh: DynGH,
    gh_token: Object<String>,
    mut repo: Repository,
) -> Result<()> {
    let start = Instant::now();
    debug!("started");

    // Fetch repository data from GitHub
    let gh_repo = gh.repository(&gh_token, &repo.url).await?;

    // Update repository's GitHub data in db if needed
    let changed = repo.update_gh_data(&gh_repo)?;
    if changed {
        db.update_repository_gh_data(&repo).await?;
        debug!("github data updated in database");
    }

    // Sync issues in GitHub with database
    let mut issues_in_gh = gh_repo.issues();
    let issues_in_db = db.get_repository_issues(repo.repository_id).await?;

    // Register/update new or outdated issues
    for issue in issues_in_gh.iter_mut() {
        let digest_in_db = find_issue(issue.issue_id, &issues_in_db);
        if issue.digest != digest_in_db {
            db.register_issue(&repo, issue).await?;
            debug!("registering issue #{}", issue.number);
        }
    }

    // Unregister issues no longer available in GitHub
    for issue in &issues_in_db {
        if find_issue(issue.issue_id, &issues_in_gh).is_none() {
            db.unregister_issue(issue.issue_id).await?;
            debug!("unregistering issue #{}", issue.number);
        }
    }

    // Update repository's last track timestamp in db
    db.update_repository_last_track_ts(repo.repository_id)
        .await?;

    debug!("completed in {}ms", start.elapsed().as_millis());
    Ok(())
}

/// Find an issue in the provided collection, returning its digest if found.
fn find_issue(issue_id: i64, issues: &[Issue]) -> Option<String> {
    issues
        .iter()
        .find(|i| i.issue_id == issue_id)
        .map(|i| i.digest.clone().expect("to be present"))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        db::MockDB,
        github::{repo_view::*, MockGH},
    };
    use futures::future;
    use lazy_static::lazy_static;
    use mockall::predicate::eq;
    use std::sync::Arc;
    use time::format_description::well_known::Rfc3339;

    const TOKEN1: &str = "0001";
    const REPOSITORY_URL: &str = "https://repo1.url";

    lazy_static! {
        static ref REPOSITORY_ID: Uuid =
            Uuid::parse_str("00000000-0001-0000-0000-000000000000").unwrap();
    }

    #[test]
    fn repository_update_gh_data_no_changes() {
        let mut repo = Repository {
            repository_id: *REPOSITORY_ID,
            url: REPOSITORY_URL.to_string(),
            stars: Some(0),
            digest: Some(
                "ac07f8e8751d1696c492c15d0b812feeb05c783b7584385986770192a058a85b".to_string(),
            ),
            ..Default::default()
        };
        let gh_repo = RepoViewRepository {
            description: None,
            homepage_url: Some(REPOSITORY_URL.to_string()),
            issues: RepoViewRepositoryIssues { nodes: None },
            languages: None,
            repository_topics: RepoViewRepositoryRepositoryTopics { nodes: None },
            stargazer_count: 0,
        };

        assert!(!repo.update_gh_data(&gh_repo).unwrap());
    }

    #[test]
    fn repository_update_gh_data_description_changed() {
        let mut repo = Repository {
            repository_id: *REPOSITORY_ID,
            url: REPOSITORY_URL.to_string(),
            stars: Some(0),
            digest: Some(
                "ac07f8e8751d1696c492c15d0b812feeb05c783b7584385986770192a058a85b".to_string(),
            ),
            ..Default::default()
        };
        let gh_repo = RepoViewRepository {
            description: Some("description".to_string()),
            homepage_url: Some(REPOSITORY_URL.to_string()),
            issues: RepoViewRepositoryIssues { nodes: None },
            languages: None,
            repository_topics: RepoViewRepositoryRepositoryTopics { nodes: None },
            stargazer_count: 0,
        };

        assert!(repo.update_gh_data(&gh_repo).unwrap());
        assert_eq!(
            repo.digest,
            Some("5a31ae9579be1f97427de912fdd1943a9b0ef07cefe07b23a614b8d02384b7ea".to_string())
        );
    }

    #[test]
    fn repository_update_digest() {
        let mut repo = Repository {
            repository_id: *REPOSITORY_ID,
            url: REPOSITORY_URL.to_string(),
            stars: Some(0),
            ..Default::default()
        };

        repo.update_digest().unwrap();
        assert_eq!(
            repo.digest,
            Some("cdb032de4c6cb506da0606e0934e69ad1ae64773ffaa76f9d6e28192067c43cf".to_string())
        );
    }

    #[test]
    fn issue_update_digest() {
        let mut issue = Issue {
            issue_id: 1,
            title: "issue1".to_string(),
            url: "issue1_url".to_string(),
            number: 1,
            labels: vec!["label1".to_string()],
            published_at: OffsetDateTime::parse("1985-04-12T23:20:50.52Z", &Rfc3339).unwrap(),
            digest: None,
            area: None,
            kind: None,
            difficulty: None,
            mentor_available: None,
            mentor: None,
            good_first_issue: None,
        };

        issue.update_digest();
        assert_eq!(
            issue.digest,
            Some("1538f7e131ac0277d3a4a7239fc0dd9b02e579dadb4fa1e9e9b074c9a789a594".to_string())
        );
    }

    #[test]
    fn issue_prepare_ts_texts() {
        let repo = Repository {
            repository_id: *REPOSITORY_ID,
            name: "repo".to_string(),
            description: Some("description".to_string()),
            url: REPOSITORY_URL.to_string(),
            topics: Some(vec!["topic1".to_string(), "topic2".to_string()]),
            languages: Some(vec!["language1".to_string()]),
            project_name: "project".to_string(),
            ..Default::default()
        };
        let issue = Issue {
            issue_id: 1,
            title: "issue1".to_string(),
            url: "issue1_url".to_string(),
            number: 1,
            labels: vec!["label1".to_string(), "label2".to_string()],
            published_at: OffsetDateTime::parse("1985-04-12T23:20:50.52Z", &Rfc3339).unwrap(),
            digest: None,
            area: None,
            kind: None,
            difficulty: None,
            mentor_available: None,
            mentor: None,
            good_first_issue: None,
        };

        assert_eq!(
            issue.prepare_ts_texts(&repo),
            IssueTsTexts {
                weight_a: "project".to_string(),
                weight_b: "repo description topic1 topic2 language1".to_string(),
                weight_c: "issue1 label1 label2".to_string(),
            },
        );
    }

    #[test]
    fn issue_populate_from_labels() {
        let mut issue = Issue {
            issue_id: 1,
            title: "issue1".to_string(),
            url: "issue1_url".to_string(),
            number: 1,
            labels: vec![
                "documentation".to_string(),
                "bug".to_string(),
                "difficulty/medium".to_string(),
                "mentor available".to_string(),
                "good first issue".to_string(),
            ],
            published_at: OffsetDateTime::parse("1985-04-12T23:20:50.52Z", &Rfc3339).unwrap(),
            digest: None,
            area: None,
            kind: None,
            difficulty: None,
            mentor_available: None,
            mentor: None,
            good_first_issue: None,
        };

        issue.populate_from_labels();
        assert_eq!(issue.area, Some(IssueArea::Docs));
        assert_eq!(issue.kind, Some(IssueKind::Bug));
        assert_eq!(issue.difficulty, Some(IssueDifficulty::Medium));
        assert_eq!(issue.mentor_available, Some(true));
        assert_eq!(issue.good_first_issue, Some(true));
    }

    #[tokio::test]
    async fn run_error_getting_github_tokens() {
        let cfg = Config::builder().build().unwrap();
        let db = MockDB::new();
        let gh = MockGH::new();

        let result = run(&cfg, Arc::new(db), Arc::new(gh)).await;
        assert_eq!(
            result.unwrap_err().to_string(),
            r#"configuration property "creds.githubTokens" not found"#
        );
    }

    #[tokio::test]
    async fn run_empty_list_of_github_tokens_provided() {
        let cfg = Config::builder()
            .set_default("creds.githubTokens", Vec::<String>::new())
            .unwrap()
            .build()
            .unwrap();
        let db = MockDB::new();
        let gh = MockGH::new();

        let result = run(&cfg, Arc::new(db), Arc::new(gh)).await;
        assert_eq!(
            result.unwrap_err().to_string(),
            "GitHub tokens not found in config file (creds.githubTokens)"
        );
    }

    #[tokio::test]
    async fn run_error_getting_repositories_to_track() {
        let cfg = Config::builder()
            .set_default("creds.githubTokens", vec![TOKEN1.to_string()])
            .unwrap()
            .build()
            .unwrap();
        let mut db = MockDB::new();
        let gh = MockGH::new();

        db.expect_get_repositories_to_track()
            .times(1)
            .returning(|| Box::pin(future::ready(Err(format_err!("fake error")))));

        let result = run(&cfg, Arc::new(db), Arc::new(gh)).await;
        assert_eq!(result.unwrap_err().to_string(), "fake error");
    }

    #[tokio::test]
    async fn run_no_repositories_found() {
        let cfg = Config::builder()
            .set_default("creds.githubTokens", vec![TOKEN1.to_string()])
            .unwrap()
            .build()
            .unwrap();
        let mut db = MockDB::new();
        let gh = MockGH::new();

        db.expect_get_repositories_to_track()
            .times(1)
            .returning(|| Box::pin(future::ready(Ok(vec![]))));

        run(&cfg, Arc::new(db), Arc::new(gh)).await.unwrap();
    }

    #[tokio::test]
    async fn run_error_getting_repository_data_from_gh() {
        let cfg = Config::builder()
            .set_default("tracker.concurrency", 1)
            .unwrap()
            .set_default("creds.githubTokens", vec![TOKEN1.to_string()])
            .unwrap()
            .build()
            .unwrap();
        let mut db = MockDB::new();
        let mut gh = MockGH::new();

        db.expect_get_repositories_to_track()
            .times(1)
            .returning(|| {
                Box::pin(future::ready(Ok(vec![Repository {
                    url: REPOSITORY_URL.to_string(),
                    ..Default::default()
                }])))
            });
        gh.expect_repository()
            .with(eq(TOKEN1), eq(REPOSITORY_URL))
            .times(1)
            .returning(|_, _| Box::pin(future::ready(Err(format_err!("fake error")))));

        let result = run(&cfg, Arc::new(db), Arc::new(gh)).await;
        assert_eq!(
            format!("{:#}", result.err().unwrap()),
            "error tracking repository https://repo1.url: fake error"
        );
    }

    #[tokio::test]
    async fn run_register_one_issue_and_unregister_another_successfully() {
        let cfg = Config::builder()
            .set_default("tracker.concurrency", 1)
            .unwrap()
            .set_default("creds.githubTokens", vec![TOKEN1.to_string()])
            .unwrap()
            .build()
            .unwrap();
        let mut db = MockDB::new();
        let mut gh = MockGH::new();

        db.expect_get_repositories_to_track()
            .times(1)
            .returning(|| {
                Box::pin(future::ready(Ok(vec![Repository {
                    repository_id: *REPOSITORY_ID,
                    url: REPOSITORY_URL.to_string(),
                    ..Default::default()
                }])))
            });
        gh.expect_repository()
            .with(eq(TOKEN1), eq(REPOSITORY_URL))
            .times(1)
            .returning(|_, _| {
                Box::pin(future::ready(Ok(RepoViewRepository {
                    description: Some("description".to_string()),
                    homepage_url: None,
                    issues: RepoViewRepositoryIssues {
                        nodes: Some(vec![Some(RepoViewRepositoryIssuesNodes {
                            database_id: Some(1),
                            title: "issue1".to_string(),
                            url: "issue1_url".to_string(),
                            number: 1,
                            published_at: Some("1985-04-12T23:20:50.52Z".to_string()),
                            labels: Some(RepoViewRepositoryIssuesNodesLabels {
                                nodes: Some(vec![
                                    Some(RepoViewRepositoryIssuesNodesLabelsNodes {
                                        name: "good first issue".to_string(),
                                    }),
                                    Some(RepoViewRepositoryIssuesNodesLabelsNodes {
                                        name: "bug".to_string(),
                                    }),
                                    Some(RepoViewRepositoryIssuesNodesLabelsNodes {
                                        name: "difficulty/easy".to_string(),
                                    }),
                                ]),
                            }),
                        })]),
                    },
                    languages: None,
                    repository_topics: RepoViewRepositoryRepositoryTopics { nodes: None },
                    stargazer_count: 0,
                })))
            });
        db.expect_update_repository_gh_data()
            .with(eq(Repository {
                repository_id: *REPOSITORY_ID,
                url: REPOSITORY_URL.to_string(),
                description: Some("description".to_string()),
                stars: Some(0),
                digest: Some(
                    "16139cdd47898d43806d0fd1fb6b2596dbf618362f6b9c22a5a2ec1ec0b882f9".to_string(),
                ),
                ..Default::default()
            }))
            .times(1)
            .returning(|_| Box::pin(future::ready(Ok(()))));
        db.expect_get_repository_issues()
            .with(eq(*REPOSITORY_ID))
            .times(1)
            .returning(|_| {
                Box::pin(future::ready(Ok(vec![Issue {
                    issue_id: 2,
                    title: "issue2".to_string(),
                    url: "issue2_url".to_string(),
                    number: 2,
                    labels: vec![],
                    published_at: OffsetDateTime::now_utc(),
                    digest: None,
                    area: None,
                    kind: None,
                    difficulty: None,
                    mentor_available: None,
                    mentor: None,
                    good_first_issue: None,
                }])))
            });
        db.expect_register_issue()
            .with(
                eq(Repository {
                    repository_id: *REPOSITORY_ID,
                    url: REPOSITORY_URL.to_string(),
                    description: Some("description".to_string()),
                    stars: Some(0),
                    digest: Some(
                        "16139cdd47898d43806d0fd1fb6b2596dbf618362f6b9c22a5a2ec1ec0b882f9"
                            .to_string(),
                    ),
                    ..Default::default()
                }),
                eq(Issue {
                    issue_id: 1,
                    title: "issue1".to_string(),
                    url: "issue1_url".to_string(),
                    number: 1,
                    labels: vec![
                        "good first issue".to_string(),
                        "bug".to_string(),
                        "difficulty/easy".to_string(),
                    ],
                    published_at: OffsetDateTime::parse("1985-04-12T23:20:50.52Z", &Rfc3339)
                        .unwrap(),
                    digest: Some(
                        "3b9c21b338d14e57e8e590a434bdf4f5bd7e71528519ebdce8bf0907c647f94f"
                            .to_string(),
                    ),
                    area: None,
                    kind: Some(IssueKind::Bug),
                    difficulty: Some(IssueDifficulty::Easy),
                    mentor_available: None,
                    mentor: None,
                    good_first_issue: Some(true),
                }),
            )
            .times(1)
            .returning(|_, _| Box::pin(future::ready(Ok(()))));
        db.expect_unregister_issue()
            .with(eq(2))
            .times(1)
            .returning(|_| Box::pin(future::ready(Ok(()))));
        db.expect_update_repository_last_track_ts()
            .with(eq(*REPOSITORY_ID))
            .times(1)
            .returning(|_| Box::pin(future::ready(Ok(()))));

        run(&cfg, Arc::new(db), Arc::new(gh)).await.unwrap();
    }
}
