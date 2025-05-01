use std::{fmt::Display, path::Path, sync::Arc};

use anyhow::{Error, Result};
use axum::{
    body::Body,
    extract::{FromRef, RawQuery, State},
    http::{
        header::{CACHE_CONTROL, CONTENT_TYPE},
        HeaderValue, Response, StatusCode,
    },
    response::IntoResponse,
    routing::{get, get_service},
    Router,
};
use config::Config;
use mime::APPLICATION_JSON;
use tower::ServiceBuilder;
use tower_http::{
    services::{ServeDir, ServeFile},
    set_header::SetResponseHeader,
    trace::TraceLayer,
};
use tracing::error;

use crate::db::{DynDB, SearchIssuesInput};

/// Index HTML document cache duration.
const INDEX_CACHE_MAX_AGE: usize = 300;

/// Default cache duration for some API endpoints.
const DEFAULT_API_MAX_AGE: usize = 300;

/// Static files cache duration.
const STATIC_CACHE_MAX_AGE: usize = 365 * 24 * 60 * 60;

/// Header that indicates the number of items available for pagination purposes.
const PAGINATION_TOTAL_COUNT: &str = "pagination-total-count";

/// API server router's state.
#[derive(Clone, FromRef)]
struct RouterState {
    db: DynDB,
}

/// Setup HTTP server router.
pub(crate) fn setup_router(cfg: &Arc<Config>, db: DynDB) -> Result<Router> {
    // Setup some paths
    let static_path = cfg.get_string("apiserver.staticPath")?;
    let index_path = Path::new(&static_path).join("index.html");

    // Setup index handler
    let index = SetResponseHeader::overriding(
        ServeFile::new(index_path),
        CACHE_CONTROL,
        HeaderValue::try_from(format!("max-age={INDEX_CACHE_MAX_AGE}"))?,
    );

    // Setup router
    let router = Router::new()
        .route("/api/filters/issues", get(issues_filters))
        .route("/api/issues/search", get(search_issues))
        .route("/", get_service(index.clone()))
        .nest_service(
            "/static",
            get_service(SetResponseHeader::overriding(
                ServeDir::new(static_path),
                CACHE_CONTROL,
                HeaderValue::try_from(format!("max-age={STATIC_CACHE_MAX_AGE}"))?,
            )),
        )
        .fallback_service(get_service(index))
        .layer(ServiceBuilder::new().layer(TraceLayer::new_for_http()))
        .with_state(RouterState { db });

    Ok(router)
}

/// Handler that returns the filters that can be used when searching for issues.
async fn issues_filters(State(db): State<DynDB>) -> impl IntoResponse {
    // Get issues filters from database
    let filters = db.get_issues_filters().await.map_err(internal_error)?;

    // Return issues filters as json
    Response::builder()
        .header(CACHE_CONTROL, format!("max-age={DEFAULT_API_MAX_AGE}"))
        .header(CONTENT_TYPE, APPLICATION_JSON.as_ref())
        .body(Body::from(filters))
        .map_err(internal_error)
}

/// Handler that allows searching for issues.
async fn search_issues(State(db): State<DynDB>, RawQuery(query): RawQuery) -> impl IntoResponse {
    // Search issues in database
    let query = query.unwrap_or_default();
    let input: SearchIssuesInput =
        serde_qs::from_str(&query).map_err(|_| StatusCode::BAD_REQUEST)?;
    let (count, issues) = db.search_issues(&input).await.map_err(internal_error)?;

    // Return search results as json
    Response::builder()
        .header(CACHE_CONTROL, format!("max-age={DEFAULT_API_MAX_AGE}"))
        .header(CONTENT_TYPE, APPLICATION_JSON.as_ref())
        .header(PAGINATION_TOTAL_COUNT, count.to_string())
        .body(Body::from(issues))
        .map_err(internal_error)
}

/// Helper for mapping any error into a `500 Internal Server Error` response.
#[allow(clippy::needless_pass_by_value)]
fn internal_error<E>(err: E) -> StatusCode
where
    E: Into<Error> + Display,
{
    error!(%err);
    StatusCode::INTERNAL_SERVER_ERROR
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::MockDB;
    use axum::{
        body::{to_bytes, Body},
        http::Request,
    };
    use futures::future;
    use mockall::predicate::eq;
    use tower::ServiceExt;

    #[tokio::test]
    async fn get_issues_filters() {
        let mut db = MockDB::new();
        db.expect_get_issues_filters()
            .times(1)
            .returning(|| Box::pin(future::ready(Ok(r#"{"some": "filters"}"#.to_string()))));

        let response = setup_test_router(db)
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri("/api/filters/issues")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        assert_eq!(
            response.headers()[CACHE_CONTROL],
            format!("max-age={DEFAULT_API_MAX_AGE}")
        );
        assert_eq!(response.headers()[CONTENT_TYPE], APPLICATION_JSON.as_ref());
        assert_eq!(
            to_bytes(response.into_body(), usize::MAX).await.unwrap(),
            r#"{"some": "filters"}"#.to_string(),
        );
    }

    #[tokio::test]
    async fn search_issues() {
        let mut db = MockDB::new();
        db.expect_search_issues()
            .with(eq(SearchIssuesInput {
                limit: Some(10),
                offset: Some(1),
                sort_by: Some("most_recent".to_string()),
                foundation: Some(vec!["cncf".to_string()]),
                maturity: Some(vec!["graduated".to_string(), "incubating".to_string()]),
                project: Some(vec!["artifacthub".to_string()]),
                area: Some(vec!["docs".to_string()]),
                kind: Some(vec!["bug".to_string()]),
                difficulty: Some(vec!["easy".to_string()]),
                language: Some(vec!["rust".to_string()]),
                mentor_available: Some(true),
                good_first_issue: Some(true),
                ts_query_web: Some("text".to_string()),
                no_linked_prs: Some(true),
            }))
            .times(1)
            .returning(|_| Box::pin(future::ready(Ok((1, r#"[{"issue": "info"}]"#.to_string())))));

        let response = setup_test_router(db)
            .oneshot(
                Request::builder()
                    .method("GET")
                    .uri(
                        "\
                        /api/issues/search?\
                            limit=10&\
                            offset=1&\
                            sort_by=most_recent&\
                            foundation[0]=cncf&\
                            maturity[0]=graduated&\
                            maturity[1]=incubating&\
                            project[0]=artifacthub&\
                            area[0]=docs&\
                            kind[0]=bug&\
                            difficulty[0]=easy&\
                            language[0]=rust&\
                            mentor_available=true&\
                            good_first_issue=true&\
                            no_linked_prs=true&\
                            ts_query_web=text&\
                        ",
                    )
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        assert_eq!(
            response.headers()[CACHE_CONTROL],
            format!("max-age={DEFAULT_API_MAX_AGE}")
        );
        assert_eq!(response.headers()[CONTENT_TYPE], APPLICATION_JSON.as_ref());
        assert_eq!(response.headers()[PAGINATION_TOTAL_COUNT], "1");
        assert_eq!(
            to_bytes(response.into_body(), usize::MAX).await.unwrap(),
            r#"[{"issue": "info"}]"#.to_string(),
        );
    }

    fn setup_test_router(db: MockDB) -> Router {
        let cfg = Config::builder()
            .set_default("apiserver.staticPath", "")
            .unwrap()
            .build()
            .unwrap();
        setup_router(&Arc::new(cfg), Arc::new(db)).unwrap()
    }
}
