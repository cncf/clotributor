use anyhow::Result;
use async_trait::async_trait;
use deadpool_postgres::Pool;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio_postgres::types::Json;

/// Type alias to represent a DB trait object.
pub(crate) type DynDB = Arc<dyn DB + Send + Sync>;

/// Type alias to represent a json string.
type JsonString = String;

/// Type alias to represent a counter value.
type Count = i64;

/// Trait that defines some operations a DB implementation must support.
#[async_trait]
pub(crate) trait DB {
    /// Search issues that match the criteria provided.
    async fn search_issues(&self, input: &SearchIssuesInput) -> Result<(Count, JsonString)>;
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
    async fn search_issues(&self, input: &SearchIssuesInput) -> Result<(Count, JsonString)> {
        let db = self.pool.get().await?;
        let row = db
            .query_one(
                "select total_count, issues::text from search_issues($1::jsonb)",
                &[&Json(input)],
            )
            .await?;
        let count: i64 = row.get("total_count");
        let issues: String = row.get("issues");
        Ok((count, issues))
    }
}

/// Query input used when searching for issues.
#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
pub(crate) struct SearchIssuesInput {
    pub limit: Option<usize>,
    pub offset: Option<usize>,
    pub sort_by: Option<String>,
    pub foundation: Option<Vec<String>>,
    pub maturity: Option<Vec<String>>,
    pub ts_query_web: Option<String>,
}
