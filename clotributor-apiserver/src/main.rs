#![warn(clippy::all, clippy::pedantic)]
#![allow(clippy::doc_markdown)]

use std::{net::SocketAddr, path::PathBuf, sync::Arc};

use anyhow::{Context, Result};
use clap::Parser;
use config::{Config, File};
use deadpool_postgres::{Config as DbConfig, Runtime};
use openssl::ssl::{SslConnector, SslMethod, SslVerifyMode};
use postgres_openssl::MakeTlsConnector;
use tokio::{net::TcpListener, signal};
use tracing::{debug, info};
use tracing_subscriber::EnvFilter;

use crate::db::PgDB;

mod db;
mod handlers;

#[derive(Debug, Parser)]
#[clap(author, version, about)]
struct Args {
    /// Config file path
    #[clap(short, long)]
    config: PathBuf,
}

#[tokio::main]
async fn main() -> Result<()> {
    let args = Args::parse();

    // Setup configuration
    let cfg = Config::builder()
        .set_default("apiserver.addr", "127.0.0.1:8000")?
        .add_source(File::from(args.config))
        .build()
        .context("error setting up configuration")?;
    let cfg = Arc::new(cfg);

    // Setup logging
    if std::env::var_os("RUST_LOG").is_none() {
        std::env::set_var("RUST_LOG", "clotributor_apiserver=debug,tower_http=debug");
    }
    let s = tracing_subscriber::fmt().with_env_filter(EnvFilter::from_default_env());
    match cfg.get_string("log.format").as_deref() {
        Ok("json") => s.json().init(),
        _ => s.init(),
    }

    // Setup database
    debug!("setting up database");
    let mut builder = SslConnector::builder(SslMethod::tls())?;
    builder.set_verify(SslVerifyMode::NONE);
    let connector = MakeTlsConnector::new(builder.build());
    let db_cfg: DbConfig = cfg.get("db")?;
    let pool = db_cfg.create_pool(Some(Runtime::Tokio1), connector)?;
    let db = Arc::new(PgDB::new(pool));

    // Setup and launch API HTTP server
    debug!("setting up apiserver");
    let router = handlers::setup_router(&cfg.clone(), db)?;
    let addr: SocketAddr = cfg.get_string("apiserver.addr")?.parse()?;
    let listener = TcpListener::bind(addr).await?;
    info!("apiserver started");
    info!(%addr, "listening");
    axum::serve(listener, router)
        .with_graceful_shutdown(shutdown_signal())
        .await?;
    info!("apiserver stopped");

    Ok(())
}

async fn shutdown_signal() {
    // Setup signal handlers
    let ctrl_c = async {
        signal::ctrl_c()
            .await
            .expect("ctrl+c signal handler to be installed");
    };

    #[cfg(unix)]
    let terminate = async {
        signal::unix::signal(signal::unix::SignalKind::terminate())
            .expect("terminate signal handler to be installed")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    // Wait for any of the signals
    tokio::select! {
        () = ctrl_c => {},
        () = terminate => {},
    }
    info!("apiserver stopping");
}
