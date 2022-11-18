use crate::db::{DynDB, SearchIssuesInput};
use anyhow::{Error, Result};
use axum::{
    body::Full,
    extract::RawQuery,
    http::{
        header::{CACHE_CONTROL, CONTENT_TYPE},
        HeaderValue, Response, StatusCode,
    },
    response::IntoResponse,
    routing::{get, get_service},
    Extension, Router,
};
use config::Config;
use mime::APPLICATION_JSON;
use std::{fmt::Display, path::Path, sync::Arc};
use tower::ServiceBuilder;
use tower_http::{
    services::{ServeDir, ServeFile},
    set_header::SetResponseHeader,
    trace::TraceLayer,
};
use tracing::error;

/// Static files cache duration.
const STATIC_CACHE_MAX_AGE: usize = 365 * 24 * 60 * 60;

/// Default cache duration for some API endpoints.
const DEFAULT_API_MAX_AGE: usize = 300;

/// Header that indicates the number of items available for pagination purposes.
const PAGINATION_TOTAL_COUNT: &str = "pagination-total-count";

/// Setup HTTP server router.
pub(crate) fn setup_router(cfg: Arc<Config>, db: DynDB) -> Result<Router> {
    // Setup error handler
    let error_handler = |err: std::io::Error| async move {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("internal error: {}", err),
        )
    };

    // Setup some paths
    let static_path = cfg.get_string("apiserver.staticPath")?;
    let index_path = Path::new(&static_path).join("index.html");

    // Setup router
    let router = Router::new()
        .route("/api/issues/search", get(search_issues))
        .route(
            "/",
            get_service(ServeFile::new(&index_path)).handle_error(error_handler),
        )
        .nest(
            "/static",
            get_service(SetResponseHeader::overriding(
                ServeDir::new(static_path),
                CACHE_CONTROL,
                HeaderValue::try_from(format!("max-age={}", STATIC_CACHE_MAX_AGE))?,
            ))
            .handle_error(error_handler),
        )
        .fallback(get_service(ServeFile::new(&index_path)).handle_error(error_handler))
        .layer(
            ServiceBuilder::new()
                .layer(TraceLayer::new_for_http())
                .layer(Extension(db)),
        );

    Ok(router)
}

/// Handler that allows searching for issues.
async fn search_issues(
    Extension(db): Extension<DynDB>,
    RawQuery(query): RawQuery,
) -> impl IntoResponse {
    // Search issues in database
    let query = query.unwrap_or_default();
    let input: SearchIssuesInput =
        serde_qs::from_str(&query).map_err(|_| StatusCode::BAD_REQUEST)?;
    let (count, issues) = db.search_issues(&input).await.map_err(internal_error)?;

    // Return search results as json
    Response::builder()
        .header(CACHE_CONTROL, format!("max-age={}", DEFAULT_API_MAX_AGE))
        .header(CONTENT_TYPE, APPLICATION_JSON.as_ref())
        .header(PAGINATION_TOTAL_COUNT, count.to_string())
        .body(Full::from(issues))
        .map_err(internal_error)
}

/// Helper for mapping any error into a `500 Internal Server Error` response.
fn internal_error<E>(err: E) -> StatusCode
where
    E: Into<Error> + Display,
{
    error!("{err}");
    StatusCode::INTERNAL_SERVER_ERROR
}
