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
    async fn register_issue(&self, repository_id: Uuid, issue: &Issue) -> Result<()>;

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
                    repository_id,
                    url,
                    topics,
                    languages,
                    stars,
                    digest
                from repository
                where tracked_at is null
                or tracked_at < current_timestamp - '1 hour'::interval
                order by url asc;
                ",
                &[],
            )
            .await?
            .iter()
            .map(|row| Repository {
                repository_id: row.get("repository_id"),
                url: row.get("url"),
                topics: row.get("topics"),
                languages: row.get("languages"),
                stars: row.get("stars"),
                digest: row.get("digest"),
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
                    digest
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
            })
            .collect();
        Ok(issues_ids)
    }

    async fn register_issue(&self, repository_id: Uuid, issue: &Issue) -> Result<()> {
        let db = self.pool.get().await?;
        db.execute(
            "
            insert into issue (
                issue_id,
                title,
                url,
                number,
                labels,
                digest,
                published_at,
                repository_id
            ) values (
                $1, $2, $3, $4, $5, $6, $7, $8
            ) on conflict (issue_id) do update
            set
                title = excluded.title,
                labels = excluded.labels;
            ",
            &[
                &issue.issue_id,
                &issue.title,
                &issue.url,
                &issue.number,
                &issue.labels,
                &issue.digest,
                &issue.published_at,
                &repository_id,
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
                topics = $2,
                languages = $3,
                stars = $4,
                digest = $5,
                updated_at = current_timestamp
            where repository_id = $1;
            ",
            &[
                &repository.repository_id,
                &repository.topics,
                &repository.languages,
                &repository.stars,
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
