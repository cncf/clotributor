use crate::tracker::{Issue, Repository};
use anyhow::Result;
use async_trait::async_trait;
use deadpool_postgres::Pool;
use std::sync::Arc;
use uuid::Uuid;

/// Type alias to represent a DB trait object.
pub(crate) type DynDB = Arc<dyn DB + Send + Sync>;

/// Trait that defines some operations a DB implementation must support.
#[async_trait]
pub(crate) trait DB {
    /// Get repositories that need to be tracked.
    async fn get_repositories_to_track(&self) -> Result<Vec<Repository>>;

    /// Get repository's issues.
    async fn get_repository_issues(&self, repository_id: Uuid) -> Result<Vec<Issue>>;

    /// Register issue provided in the database.
    async fn register_issue(&self, repository: &Repository, issue: &Issue) -> Result<()>;

    /// Unregister issue provided from the database.
    async fn unregister_issue(&self, issue_id: i64) -> Result<()>;

    /// Update repository's GitHub data in the database.
    async fn update_repository_gh_data(&self, repository: &Repository) -> Result<()>;

    /// Update repository's last track timestamp.
    async fn update_repository_last_track_ts(&self, repository_id: Uuid) -> Result<()>;
}

/// DB implementation backed by PostgreSQL.
pub(crate) struct PgDB {
    pool: Pool,
}

impl PgDB {
    /// Create a new PgDB instance.
    pub(crate) fn new(pool: Pool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl DB for PgDB {
    async fn get_repositories_to_track(&self) -> Result<Vec<Repository>> {
        let db = self.pool.get().await?;
        let repositories = db
            .query(
                "
                select
                    r.repository_id,
                    r.name,
                    r.description,
                    r.url,
                    r.homepage_url,
                    r.topics,
                    r.languages,
                    r.stars,
                    r.digest,
                    p.name as project_name
                from repository r
                join project p using (project_id)
                where r.tracked_at is null
                or r.tracked_at < current_timestamp - '30 minutes'::interval
                order by r.url asc;
                ",
                &[],
            )
            .await?
            .iter()
            .map(|row| Repository {
                repository_id: row.get("repository_id"),
                name: row.get("name"),
                description: row.get("description"),
                url: row.get("url"),
                homepage_url: row.get("homepage_url"),
                topics: row.get("topics"),
                languages: row.get("languages"),
                stars: row.get("stars"),
                digest: row.get("digest"),
                project_name: row.get("project_name"),
            })
            .collect();
        Ok(repositories)
    }

    async fn get_repository_issues(&self, repository_id: Uuid) -> Result<Vec<Issue>> {
        let db = self.pool.get().await?;
        let issues_ids = db
            .query(
                "
                select
                    issue_id,
                    title,
                    url,
                    number,
                    labels,
                    published_at,
                    digest,
                    area,
                    kind,
                    difficulty,
                    mentor_available,
                    mentor,
                    good_first_issue
                from issue
                where repository_id = $1;
                ",
                &[&repository_id],
            )
            .await?
            .iter()
            .map(|row| Issue {
                issue_id: row.get("issue_id"),
                title: row.get("title"),
                url: row.get("title"),
                number: row.get("number"),
                labels: row.get("labels"),
                published_at: row.get("published_at"),
                digest: row.get("digest"),
                area: row.get("area"),
                kind: row.get("kind"),
                difficulty: row.get("difficulty"),
                mentor_available: row.get("mentor_available"),
                mentor: row.get("mentor"),
                good_first_issue: row.get("good_first_issue"),
            })
            .collect();
        Ok(issues_ids)
    }

    async fn register_issue(&self, repository: &Repository, issue: &Issue) -> Result<()> {
        let db = self.pool.get().await?;
        let ts_texts = issue.prepare_ts_texts(repository);
        db.execute(
            "
            insert into issue (
                issue_id,
                title,
                url,
                number,
                labels,
                digest,
                area,
                kind,
                difficulty,
                mentor_available,
                mentor,
                good_first_issue,
                published_at,
                repository_id,
                tsdoc
            ) values (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
                setweight(to_tsvector($15), 'A') ||
                setweight(to_tsvector($16), 'B') ||
                setweight(to_tsvector($17), 'C')
            ) on conflict (issue_id) do update
            set
                title = excluded.title,
                labels = excluded.labels,
                digest = excluded.digest,
                area = excluded.area,
                kind = excluded.kind,
                difficulty = excluded.difficulty,
                mentor_available = excluded.mentor_available,
                mentor = excluded.mentor,
                good_first_issue = excluded.good_first_issue;
            ",
            &[
                &issue.issue_id,
                &issue.title,
                &issue.url,
                &issue.number,
                &issue.labels,
                &issue.digest,
                &issue.area,
                &issue.kind,
                &issue.difficulty,
                &issue.mentor_available,
                &issue.mentor,
                &issue.good_first_issue,
                &issue.published_at,
                &repository.repository_id,
                &ts_texts.weight_a,
                &ts_texts.weight_b,
                &ts_texts.weight_c,
            ],
        )
        .await?;
        Ok(())
    }

    async fn unregister_issue(&self, issue_id: i64) -> Result<()> {
        let db = self.pool.get().await?;
        db.execute("delete from issue where issue_id = $1;", &[&issue_id])
            .await?;
        Ok(())
    }

    async fn update_repository_gh_data(&self, repository: &Repository) -> Result<()> {
        let db = self.pool.get().await?;
        db.execute(
            "
            update repository set
                description = $2,
                homepage_url = $3,
                languages = $4,
                stars = $5,
                topics = $6,
                digest = $7,
                updated_at = current_timestamp
            where repository_id = $1;
            ",
            &[
                &repository.repository_id,
                &repository.description,
                &repository.homepage_url,
                &repository.languages,
                &repository.stars,
                &repository.topics,
                &repository.digest,
            ],
        )
        .await?;
        Ok(())
    }

    async fn update_repository_last_track_ts(&self, repository_id: Uuid) -> Result<()> {
        let db = self.pool.get().await?;
        db.execute(
            "update repository set tracked_at = current_timestamp where repository_id = $1;",
            &[&repository_id],
        )
        .await?;
        Ok(())
    }
}
