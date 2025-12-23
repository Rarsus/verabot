# Phase 3: Infrastructure Issues (3-4 weeks)

## ISSUE-3.1.1: Configuration Management

**Epic:** Phase 3 - Infrastructure  
**Priority:** P0 - Critical  
**Effort:** 5 Story Points  
**Dependencies:** ISSUE-1.1.2

### Description
Implement configuration management using environment variables, config files, and validation with serde.

### Acceptance Criteria
- [ ] Config struct with all application settings
- [ ] Environment variable loading with dotenv
- [ ] Config validation with custom validators
- [ ] Default values for optional settings
- [ ] Unit tests for config loading
- [ ] Documentation for all config options

### Implementation Highlights
```rust
use serde::{Deserialize, Serialize};
use std::env;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub discord_token: String,
    pub discord_client_id: String,
    pub database_url: String,
    pub redis_url: Option<String>,
    pub log_level: String,
    pub health_port: u16,
    pub metrics_port: u16,
}

impl Config {
    pub fn from_env() -> Result<Self> {
        dotenv::dotenv().ok();
        envy::from_env::<Config>()
            .map_err(|e| Error::Config(e.to_string()))
    }
}
```

---

## ISSUE-3.2.1: Database Layer Setup

**Epic:** Phase 3 - Infrastructure  
**Priority:** P0 - Critical  
**Effort:** 8 Story Points  
**Dependencies:** ISSUE-3.1.1

### Description
Set up SQLite database layer with migrations, connection pooling, and repository pattern.

### Acceptance Criteria
- [ ] Database connection pool with r2d2
- [ ] Migration system with refinery
- [ ] Repository traits and implementations
- [ ] Transaction support
- [ ] Error handling for database operations
- [ ] Unit tests with in-memory database
- [ ] Integration tests with test database

### Implementation Highlights
```rust
use r2d2_sqlite::SqliteConnectionManager;
use r2d2::Pool;

pub struct Database {
    pool: Pool<SqliteConnectionManager>,
}

impl Database {
    pub fn new(database_url: &str) -> Result<Self> {
        let manager = SqliteConnectionManager::file(database_url);
        let pool = Pool::new(manager)?;
        Ok(Self { pool })
    }
    
    pub fn get_connection(&self) -> Result<PooledConnection> {
        self.pool.get().map_err(|e| Error::Database(
            DatabaseError::ConnectionFailed(e.to_string())
        ))
    }
}

pub trait Repository<T> {
    async fn find_by_id(&self, id: i64) -> Result<Option<T>>;
    async fn find_all(&self) -> Result<Vec<T>>;
    async fn insert(&self, entity: &T) -> Result<i64>;
    async fn update(&self, entity: &T) -> Result<()>;
    async fn delete(&self, id: i64) -> Result<()>;
}
```

---

## ISSUE-3.3.1: Logging & Metrics

**Epic:** Phase 3 - Infrastructure  
**Priority:** P1 - High  
**Effort:** 5 Story Points  
**Dependencies:** ISSUE-3.1.1

### Description
Implement structured logging with slog and Prometheus metrics.

### Acceptance Criteria
- [ ] Structured logging with slog
- [ ] Log levels (debug, info, warn, error)
- [ ] Context-aware logging
- [ ] Prometheus metrics collection
- [ ] Custom metrics for commands, errors, latency
- [ ] Metrics HTTP endpoint
- [ ] Unit tests for metrics

### Implementation Highlights
```rust
use slog::{Logger, Drain};
use prometheus::{Counter, Histogram, Registry};

pub struct Metrics {
    registry: Registry,
    commands_total: Counter,
    command_duration: Histogram,
    errors_total: Counter,
}

impl Metrics {
    pub fn new() -> Self {
        let registry = Registry::new();
        
        let commands_total = Counter::new("commands_total", "Total commands executed").unwrap();
        let command_duration = Histogram::new("command_duration_seconds", "Command execution time").unwrap();
        let errors_total = Counter::new("errors_total", "Total errors").unwrap();
        
        registry.register(Box::new(commands_total.clone())).unwrap();
        registry.register(Box::new(command_duration.clone())).unwrap();
        registry.register(Box::new(errors_total.clone())).unwrap();
        
        Self {
            registry,
            commands_total,
            command_duration,
            errors_total,
        }
    }
    
    pub fn record_command(&self, duration: f64) {
        self.commands_total.inc();
        self.command_duration.observe(duration);
    }
}
```

---

## ISSUE-3.4.1: Redis Integration

**Epic:** Phase 3 - Infrastructure  
**Priority:** P2 - Medium  
**Effort:** 5 Story Points  
**Dependencies:** ISSUE-3.1.1

### Description
Integrate Redis for caching and rate limiting.

### Acceptance Criteria
- [ ] Redis connection pool
- [ ] Cache abstraction layer
- [ ] TTL support
- [ ] Rate limiter using Redis
- [ ] Error handling for Redis operations
- [ ] Fallback when Redis unavailable
- [ ] Unit tests with mock Redis

### Implementation Highlights
```rust
use redis::{Client, Commands, Connection};
use std::time::Duration;

pub struct RedisCache {
    client: Client,
}

impl RedisCache {
    pub fn new(url: &str) -> Result<Self> {
        let client = Client::open(url)?;
        Ok(Self { client })
    }
    
    pub fn get<T: serde::de::DeserializeOwned>(&self, key: &str) -> Result<Option<T>> {
        let mut conn = self.client.get_connection()?;
        let value: Option<String> = conn.get(key)?;
        
        match value {
            Some(v) => Ok(Some(serde_json::from_str(&v)?)),
            None => Ok(None),
        }
    }
    
    pub fn set<T: serde::Serialize>(&self, key: &str, value: &T, ttl: Duration) -> Result<()> {
        let mut conn = self.client.get_connection()?;
        let serialized = serde_json::to_string(value)?;
        conn.set_ex(key, serialized, ttl.as_secs() as usize)?;
        Ok(())
    }
}

pub struct RateLimiter {
    cache: RedisCache,
}

impl RateLimiter {
    pub async fn check_rate_limit(&self, key: &str, limit: u32, window: Duration) -> Result<bool> {
        let count: u32 = self.cache.get(key)?.unwrap_or(0);
        
        if count >= limit {
            return Ok(false);
        }
        
        self.cache.set(key, &(count + 1), window)?;
        Ok(true)
    }
}
```

---

## Summary

Phase 3 builds infrastructure:

- **ISSUE-3.1.1**: Configuration Management (5 SP)
- **ISSUE-3.2.1**: Database Layer Setup (8 SP)
- **ISSUE-3.3.1**: Logging & Metrics (5 SP)
- **ISSUE-3.4.1**: Redis Integration (5 SP)

**Total: 23 Story Points (~3-4 weeks)**
