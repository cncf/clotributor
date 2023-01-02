use anyhow::{format_err, Context, Result};
use async_trait::async_trait;
use graphql_client::{GraphQLQuery, Response};
use lazy_static::lazy_static;
use regex::Regex;
use reqwest::StatusCode;
use std::sync::Arc;
use time::{
    ext::NumericalDuration,
    format_description::well_known::{Iso8601, Rfc3339},
    OffsetDateTime,
};

use crate::tracker::Issue;

/// GitHub GraphQL API URL.
const GITHUB_GRAPHQL_API_URL: &str = "https://api.github.com/graphql";

lazy_static! {
    static ref GITHUB_REPO_URL: Regex =
        Regex::new("^https://github.com/(?P<owner>[^/]+)/(?P<repo>[^/]+)/?$")
            .expect("exprs in GITHUB_REPO_URL to be valid");
}

/// Type alias to represent a GH trait object.
pub(crate) type DynGH = Arc<dyn GH + Send + Sync>;

/// Type alias for GraphQL URI scalar type.
#[allow(clippy::upper_case_acronyms)]
type URI = String;

/// Type alias for GraphQL DateTime scalar type.
type DateTime = String;

/// GitHub repository view (represents GitHub GraphQL API query).
#[derive(Debug, Clone, GraphQLQuery)]
#[graphql(
    schema_path = "src/graphql/github_schema.graphql",
    query_path = "src/graphql/repo_view.graphql",
    response_derives = "Debug, PartialEq, Eq"
)]
pub struct RepoView;

impl repo_view::RepoViewRepository {
    /// Return repository issues.
    pub(crate) fn issues(&self) -> Vec<Issue> {
        self.issues
            .nodes
            .as_ref()
            .map(|nodes| {
                nodes
                    .iter()
                    .flatten()
                    .filter_map(|node| {
                        // Check if required fields are present
                        if node.database_id.is_none() || node.published_at.is_none() {
                            return None;
                        }

                        // Prepare labels
                        let labels = node
                            .labels
                            .as_ref()
                            .expect("at least one label")
                            .nodes
                            .as_ref()
                            .map(|nodes| {
                                nodes
                                    .iter()
                                    .flatten()
                                    .map(|node| node.name.clone())
                                    .collect()
                            })
                            .unwrap();

                        // Prepare published date
                        let published_at =
                            OffsetDateTime::parse(node.published_at.as_ref().unwrap(), &Rfc3339)
                                .expect("date to be valid");

                        // Prepare issue
                        let mut issue = Issue {
                            issue_id: node.database_id.unwrap(),
                            title: node.title.clone(),
                            url: node.url.clone(),
                            number: node.number as i32,
                            labels,
                            published_at,
                            digest: None,
                            area: None,
                            kind: None,
                            difficulty: None,
                            mentor_available: None,
                            mentor: None,
                            good_first_issue: None,
                        };
                        issue.populate_from_labels();
                        issue.update_digest();

                        Some(issue)
                    })
                    .collect()
            })
            .unwrap_or_default()
    }
}

/// Trait that defines some operations a GH implementation must support.
#[async_trait]
pub(crate) trait GH {
    /// Get repository information from GitHub.
    async fn repository(&self, token: &str, url: &str) -> Result<repo_view::RepoViewRepository>;
}

/// GH implementation backed by the GitHub GraphQL API.
pub(crate) struct GHGraphQL {}

impl GHGraphQL {
    /// Create a new GHGraphQL instance.
    pub(crate) fn new() -> Self {
        Self {}
    }
}

#[async_trait]
impl GH for GHGraphQL {
    async fn repository(&self, token: &str, url: &str) -> Result<repo_view::RepoViewRepository> {
        // Do request to GraphQL API
        let http_client = setup_http_client(token)?;
        let (owner, repo) = get_owner_and_repo(url)?;
        let issues_since = OffsetDateTime::now_utc()
            .saturating_sub(365.days())
            .format(&Iso8601::DEFAULT)?;
        let vars = repo_view::Variables {
            owner,
            repo,
            issues_since,
        };
        let req_body = &RepoView::build_query(vars);
        let resp = http_client
            .post(GITHUB_GRAPHQL_API_URL)
            .json(req_body)
            .send()
            .await
            .context("error querying graphql api")?;
        if resp.status() != StatusCode::OK {
            return Err(format_err!(
                "unexpected status code querying graphql api: {} - {}",
                resp.status(),
                resp.text().await?,
            ));
        }

        // Parse response body and extract repository data
        let resp_body = resp.text().await?;
        let repo = serde_json::from_str::<Response<repo_view::ResponseData>>(&resp_body)
            .context(format!("error deserializing query response: {resp_body}"))?
            .data
            .ok_or_else(|| format_err!("data field not found: {resp_body}"))?
            .repository
            .ok_or_else(|| format_err!("repository field not found: {resp_body}"))?;

        Ok(repo)
    }
}

// Setup a new authenticated http client to interact with the GitHub API.
pub(crate) fn setup_http_client(github_token: &str) -> Result<reqwest::Client, reqwest::Error> {
    reqwest::Client::builder()
        .user_agent("clotributor")
        .default_headers(
            std::iter::once((
                reqwest::header::AUTHORIZATION,
                reqwest::header::HeaderValue::from_str(&format!("Bearer {}", github_token))
                    .expect("header value only uses visible ascii chars"),
            ))
            .collect(),
        )
        .build()
}

/// Extract the owner and repository from the repository url provided.
fn get_owner_and_repo(repo_url: &str) -> Result<(String, String)> {
    let c = GITHUB_REPO_URL
        .captures(repo_url)
        .ok_or_else(|| format_err!("invalid repository url"))?;
    Ok((c["owner"].to_string(), c["repo"].to_string()))
}
