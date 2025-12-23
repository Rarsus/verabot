# Rust Migration Testing Strategy

Comprehensive testing approach for the VeraBot Rust migration to ensure quality, performance, and security.

## Table of Contents

1. [Unit Testing Framework](#unit-testing-framework)
2. [Integration Testing](#integration-testing)
3. [Coverage Strategy](#coverage-strategy)
4. [Load Testing](#load-testing)
5. [Security Testing](#security-testing)
6. [CI/CD Integration](#cicd-integration)

---

## Unit Testing Framework

### Test Organization

```
rust/
├── core/
│   ├── src/
│   │   └── lib.rs
│   └── tests/
│       ├── command_tests.rs
│       ├── error_tests.rs
│       └── registry_tests.rs
├── app/
│   ├── src/
│   │   └── lib.rs
│   └── tests/
│       ├── bus_tests.rs
│       └── middleware_tests.rs
└── handlers/
    ├── src/
    │   └── lib.rs
    └── tests/
        ├── core_handlers.rs
        ├── admin_handlers.rs
        └── common/
            └── mod.rs  # Shared test utilities
```

### Test Fixtures

**File:** `tests/common/fixtures.rs`

```rust
//! Shared test fixtures and utilities

use verabot_core::command::{Command, CommandSource};
use verabot_core::registry::{CommandMetadata, CommandCategory, PermissionLevel};

/// Create a test command with default values
pub fn test_command(name: &str) -> Command {
    Command::builder()
        .name(name)
        .source(CommandSource::Discord)
        .user_id("test_user_123")
        .channel_id("test_channel_456")
        .build()
        .unwrap()
}

/// Create a test command with custom user
pub fn test_command_with_user(name: &str, user_id: &str) -> Command {
    Command::builder()
        .name(name)
        .user_id(user_id)
        .build()
        .unwrap()
}

/// Create test command metadata
pub fn test_metadata(name: &str, category: CommandCategory) -> CommandMetadata {
    CommandMetadata {
        name: name.to_string(),
        description: format!("Test command: {}", name),
        usage: format!("/{}", name),
        category,
        permission: PermissionLevel::User,
        aliases: vec![],
        examples: vec![],
        enabled: true,
    }
}

/// Setup test logger (non-production)
pub fn setup_test_logger() -> slog::Logger {
    use slog::{Drain, o};
    let drain = slog::Discard;
    slog::Logger::root(drain, o!())
}
```

### Mocking Strategies

**Using mockall for trait mocking:**

```rust
use mockall::predicate::*;
use mockall::mock;

// Define mock
mock! {
    pub Repository {}
    
    #[async_trait]
    impl CommandRepository for Repository {
        async fn find_by_name(&self, name: &str) -> Result<Option<Command>>;
        async fn insert(&self, cmd: &Command) -> Result<()>;
        async fn delete(&self, name: &str) -> Result<()>;
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_with_mock_repository() {
        let mut mock_repo = MockRepository::new();
        
        // Setup expectations
        mock_repo.expect_find_by_name()
            .with(eq("ping"))
            .times(1)
            .returning(|_| Ok(Some(test_command("ping"))));
        
        // Use mock in test
        let service = MyService::new(Arc::new(mock_repo));
        let result = service.do_something("ping").await;
        
        assert!(result.is_ok());
    }
}
```

### Async Testing with tokio::test

```rust
#[cfg(test)]
mod async_tests {
    use super::*;
    use tokio::time::{sleep, Duration};
    
    #[tokio::test]
    async fn test_async_operation() {
        let result = async_function().await;
        assert!(result.is_ok());
    }
    
    #[tokio::test]
    async fn test_with_timeout() {
        let result = tokio::time::timeout(
            Duration::from_secs(5),
            long_running_operation()
        ).await;
        
        assert!(result.is_ok(), "Operation timed out");
    }
    
    #[tokio::test(flavor = "multi_thread", worker_threads = 4)]
    async fn test_concurrent_operations() {
        let futures = vec![
            tokio::spawn(operation_1()),
            tokio::spawn(operation_2()),
            tokio::spawn(operation_3()),
        ];
        
        for future in futures {
            assert!(future.await.is_ok());
        }
    }
}
```

### Property-Based Testing

**Using proptest for property testing:**

```rust
use proptest::prelude::*;

proptest! {
    #[test]
    fn test_command_name_validation(name in "[a-z]{1,50}") {
        // Property: valid names should always pass validation
        assert!(validate_command_name(&name).is_ok());
    }
    
    #[test]
    fn test_command_serialization(
        name in "[a-z]+",
        user_id in "[0-9]{10,20}",
    ) {
        // Property: serialization roundtrip should preserve data
        let cmd = Command::builder()
            .name(&name)
            .user_id(&user_id)
            .build()
            .unwrap();
        
        let json = serde_json::to_string(&cmd).unwrap();
        let deserialized: Command = serde_json::from_str(&json).unwrap();
        
        assert_eq!(cmd.name, deserialized.name);
        assert_eq!(cmd.user_id, deserialized.user_id);
    }
}
```

### Test Coverage Targets

| Module | Target Coverage | Priority |
|--------|-----------------|----------|
| core/command.rs | 90% | Critical |
| core/error.rs | 85% | Critical |
| app/bus.rs | 90% | Critical |
| app/middleware/ | 85% | High |
| handlers/core/ | 80% | High |
| handlers/admin/ | 75% | Medium |
| infra/ | 70% | Medium |

---

## Integration Testing

### Database Test Setup

**File:** `tests/integration/db_setup.rs`

```rust
//! Database setup utilities for integration tests

use verabot_infra::db::Database;
use verabot_infra::repositories::*;

/// Setup in-memory test database
pub async fn setup_test_db() -> Database {
    let db = Database::new(":memory:").await.unwrap();
    db.run_migrations().await.unwrap();
    db
}

/// Setup test database with seed data
pub async fn setup_test_db_with_data() -> Database {
    let db = setup_test_db().await;
    
    // Insert test data
    let repo = SqliteCommandRepository::new(db.clone());
    repo.add_allowed("ping", "admin").await.unwrap();
    repo.add_allowed("help", "admin").await.unwrap();
    
    db
}

/// Cleanup test database
pub async fn cleanup_test_db(db: Database) {
    drop(db);
}
```

### Discord Mock Setup

**File:** `tests/integration/discord_mock.rs`

```rust
//! Mock Discord client for integration testing

use serenity::client::Context;
use std::sync::Arc;
use tokio::sync::RwLock;

pub struct MockDiscordContext {
    pub guilds: Vec<u64>,
    pub channels: std::collections::HashMap<u64, Vec<u64>>,
    pub messages: Arc<RwLock<Vec<(u64, String)>>>, // (channel_id, content)
}

impl MockDiscordContext {
    pub fn new() -> Self {
        Self {
            guilds: vec![123456789],
            channels: std::collections::HashMap::new(),
            messages: Arc::new(RwLock::new(Vec::new())),
        }
    }
    
    pub fn with_channel(mut self, guild_id: u64, channel_id: u64) -> Self {
        self.channels.entry(guild_id)
            .or_insert_with(Vec::new)
            .push(channel_id);
        self
    }
    
    pub async fn get_sent_messages(&self) -> Vec<(u64, String)> {
        self.messages.read().await.clone()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_mock_context_creation() {
        let ctx = MockDiscordContext::new()
            .with_channel(123456789, 987654321);
        
        assert_eq!(ctx.guilds.len(), 1);
        assert_eq!(ctx.channels.get(&123456789).unwrap().len(), 1);
    }
}
```

### HTTP Server Tests

**File:** `tests/integration/http_tests.rs`

```rust
//! Integration tests for HTTP server

use actix_web::{test, App};
use verabot_infra::http::HealthMetricsServer;

#[actix_web::test]
async fn test_health_endpoint() {
    let server = HealthMetricsServer::new();
    let app = test::init_service(
        App::new().configure(server.configure())
    ).await;
    
    let req = test::TestRequest::get()
        .uri("/health")
        .to_request();
    
    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());
    
    let body = test::read_body(resp).await;
    let health: serde_json::Value = serde_json::from_slice(&body).unwrap();
    
    assert_eq!(health["status"], "healthy");
}

#[actix_web::test]
async fn test_metrics_endpoint() {
    let server = HealthMetricsServer::new();
    let app = test::init_service(
        App::new().configure(server.configure())
    ).await;
    
    let req = test::TestRequest::get()
        .uri("/metrics")
        .to_request();
    
    let resp = test::call_service(&app, req).await;
    assert!(resp.status().is_success());
    
    let body = test::read_body(resp).await;
    let body_str = String::from_utf8(body.to_vec()).unwrap();
    
    // Check for Prometheus format
    assert!(body_str.contains("# HELP"));
    assert!(body_str.contains("# TYPE"));
}
```

### Full Command Execution Flow

**File:** `tests/integration/command_flow.rs`

```rust
//! End-to-end command execution tests

use verabot_app::bus::CommandBus;
use verabot_core::command::Command;
use verabot_handlers::core::PingHandler;

#[tokio::test]
async fn test_full_command_flow() {
    // Setup
    let bus = CommandBus::new();
    bus.register("ping", PingHandler::new()).await;
    
    // Execute command
    let command = Command::builder()
        .name("ping")
        .user_id("test_user")
        .build()
        .unwrap();
    
    let result = bus.execute(command).await;
    
    // Verify
    assert!(result.is_ok());
    let cmd_result = result.unwrap();
    assert!(cmd_result.is_ok());
}

#[tokio::test]
async fn test_command_with_middleware() {
    // Setup
    let mut bus = CommandBus::new();
    
    // Add middleware
    let logger = setup_test_logger();
    bus.add_middleware(LoggingMiddleware::new(logger));
    
    // Register handler
    bus.register("ping", PingHandler::new()).await;
    
    // Execute
    let command = Command::builder()
        .name("ping")
        .user_id("test_user")
        .build()
        .unwrap();
    
    let result = bus.execute(command).await;
    
    // Verify middleware ran
    assert!(result.is_ok());
}
```

---

## Coverage Strategy

### Coverage Targets by Module

```toml
# tarpaulin.toml
[package.coverage]
minimum-coverage = 70.0

[module.coverage]
"verabot_core" = 85.0
"verabot_app" = 80.0
"verabot_handlers" = 75.0
"verabot_infra" = 70.0
```

### CI/CD Integration with Tarpaulin

**File:** `.github/workflows/rust-coverage.yml`

```yaml
name: Coverage

on:
  pull_request:
    paths:
      - 'rust/**'
  push:
    branches: [main, develop]

jobs:
  coverage:
    name: Code Coverage
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Install Rust
        uses: dtolnay/rust-toolchain@stable
      
      - name: Install tarpaulin
        run: cargo install cargo-tarpaulin
      
      - name: Generate coverage
        working-directory: rust
        run: |
          cargo tarpaulin \
            --workspace \
            --timeout 300 \
            --out Xml \
            --out Html \
            --output-dir coverage \
            --exclude-files "*/tests/*" "*/benches/*"
      
      - name: Upload to Codecov
        uses: codecov/codecov-action@v4
        with:
          files: rust/coverage/cobertura.xml
          flags: rust
          name: rust-coverage
      
      - name: Check coverage threshold
        working-directory: rust
        run: |
          COVERAGE=$(cargo tarpaulin --workspace --out Json | jq '.coverage')
          echo "Coverage: $COVERAGE%"
          
          if (( $(echo "$COVERAGE < 70" | bc -l) )); then
            echo "❌ Coverage is below 70%"
            exit 1
          else
            echo "✅ Coverage meets threshold"
          fi
      
      - name: Upload HTML report
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: rust/coverage/
```

### Coverage Badges

**Add to README.md:**

```markdown
[![Coverage](https://codecov.io/gh/Rarsus/verabot/branch/main/graph/badge.svg?flag=rust)](https://codecov.io/gh/Rarsus/verabot)
```

### Failing Builds on Coverage Drop

```yaml
- name: Comment on PR
  if: github.event_name == 'pull_request'
  uses: actions/github-script@v7
  with:
    script: |
      const coverage = process.env.COVERAGE;
      const threshold = 70;
      
      if (coverage < threshold) {
        github.rest.issues.createComment({
          issue_number: context.issue.number,
          owner: context.repo.owner,
          repo: context.repo.repo,
          body: `⚠️ Coverage dropped to ${coverage}% (threshold: ${threshold}%)`
        });
      }
```

---

## Load Testing

### Benchmark Setup

**File:** `benches/command_throughput.rs`

```rust
use criterion::{criterion_group, criterion_main, Criterion, Throughput};
use verabot_app::bus::CommandBus;
use verabot_core::command::Command;
use verabot_handlers::core::PingHandler;
use std::sync::Arc;

fn bench_command_throughput(c: &mut Criterion) {
    let rt = tokio::runtime::Runtime::new().unwrap();
    
    c.benchmark_group("command_throughput")
        .throughput(Throughput::Elements(1))
        .bench_function("ping_handler", |b| {
            let handler = Arc::new(PingHandler::new());
            
            b.to_async(&rt).iter(|| {
                let h = Arc::clone(&handler);
                async move {
                    let cmd = Command::builder()
                        .name("ping")
                        .user_id("bench_user")
                        .build()
                        .unwrap();
                    
                    h.handle(cmd).await
                }
            });
        });
}

criterion_group!(benches, bench_command_throughput);
criterion_main!(benches);
```

### 1000 cmd/sec Target

**File:** `benches/throughput_target.rs`

```rust
use criterion::{criterion_group, criterion_main, Criterion};
use std::time::Duration;
use tokio::runtime::Runtime;

fn bench_1000_commands_per_second(c: &mut Criterion) {
    let rt = Runtime::new().unwrap();
    let bus = rt.block_on(async {
        let mut bus = CommandBus::new();
        bus.register("ping", PingHandler::new()).await;
        Arc::new(bus)
    });
    
    c.benchmark_group("throughput")
        .sample_size(100)
        .measurement_time(Duration::from_secs(10))
        .bench_function("1000_cmds_per_sec", |b| {
            b.to_async(&rt).iter(|| {
                let bus = Arc::clone(&bus);
                async move {
                    let mut handles = vec![];
                    
                    // Spawn 1000 concurrent requests
                    for i in 0..1000 {
                        let bus = Arc::clone(&bus);
                        let handle = tokio::spawn(async move {
                            let cmd = Command::builder()
                                .name("ping")
                                .user_id(&format!("user{}", i))
                                .build()
                                .unwrap();
                            
                            bus.execute(cmd).await
                        });
                        handles.push(handle);
                    }
                    
                    // Wait for all to complete
                    for handle in handles {
                        handle.await.unwrap().unwrap();
                    }
                }
            });
        });
}

criterion_group!(benches, bench_1000_commands_per_second);
criterion_main!(benches);
```

### Memory Profiling

**Using valgrind/massif:**

```bash
# Profile memory usage
valgrind --tool=massif --massif-out-file=massif.out \
    ./target/release/verabot

# Visualize results
ms_print massif.out > memory_profile.txt
```

**Cargo-specific memory profiling:**

```bash
cargo install cargo-profiler
cargo profiler cachegrind --bin verabot
```

### Latency Tracking

**File:** `benches/latency.rs`

```rust
use criterion::{criterion_group, criterion_main, Criterion};
use criterion::measurement::WallTime;

fn bench_command_latency(c: &mut Criterion) {
    let rt = tokio::runtime::Runtime::new().unwrap();
    
    c.benchmark_group("latency")
        .bench_function("p50_latency", |b| {
            b.to_async(&rt).iter(|| {
                async {
                    let start = std::time::Instant::now();
                    execute_command().await;
                    start.elapsed()
                }
            });
        });
}

criterion_group!(benches, bench_command_latency);
criterion_main!(benches);
```

---

## Security Testing

### Dependency Scanning (cargo-audit)

**File:** `.github/workflows/security.yml`

```yaml
name: Security Audit

on:
  push:
    branches: [main, develop]
  pull_request:
  schedule:
    - cron: '0 0 * * *'  # Daily

jobs:
  security-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Install cargo-audit
        run: cargo install cargo-audit
      
      - name: Run security audit
        working-directory: rust
        run: cargo audit --deny warnings
      
      - name: Check for yanked crates
        working-directory: rust
        run: cargo audit --deny yanked
```

### OWASP Compliance

**Security checklist:**

- [ ] Input validation on all user inputs
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (output encoding)
- [ ] CSRF protection (token validation)
- [ ] Authentication and authorization
- [ ] Secure configuration management
- [ ] Logging and monitoring
- [ ] Error handling (no sensitive data leakage)

### Input Validation Testing

**File:** `tests/security/input_validation.rs`

```rust
#[cfg(test)]
mod security_tests {
    use super::*;
    
    #[tokio::test]
    async fn test_sql_injection_prevention() {
        let handler = AllowHandler::new(repo);
        
        // Try SQL injection in command name
        let malicious_commands = vec![
            "'; DROP TABLE commands; --",
            "1' OR '1'='1",
            "admin'--",
        ];
        
        for cmd_name in malicious_commands {
            let command = Command::builder()
                .name("allow")
                .user_id("attacker")
                .args(vec![cmd_name.to_string()])
                .build()
                .unwrap();
            
            let result = handler.handle(command).await;
            
            // Should either error or sanitize input
            assert!(result.is_err() || !result.unwrap().is_ok());
        }
    }
    
    #[tokio::test]
    async fn test_command_injection_prevention() {
        // Test for command injection in system commands
        let dangerous_inputs = vec![
            "; rm -rf /",
            "| cat /etc/passwd",
            "& whoami",
        ];
        
        for input in dangerous_inputs {
            // Verify input is rejected or sanitized
            assert!(validate_input(input).is_err());
        }
    }
    
    #[tokio::test]
    async fn test_path_traversal_prevention() {
        let paths = vec![
            "../../../etc/passwd",
            "..\\..\\windows\\system32",
            "/etc/passwd",
        ];
        
        for path in paths {
            assert!(validate_path(path).is_err());
        }
    }
}
```

### Permission Enforcement Testing

**File:** `tests/security/permissions.rs`

```rust
#[cfg(test)]
mod permission_tests {
    use super::*;
    
    #[tokio::test]
    async fn test_admin_command_blocks_users() {
        let handler = AllowHandler::new(repo);
        
        let command = Command::builder()
            .name("allow")
            .user_id("regular_user")
            .args(vec!["ping".to_string()])
            .build()
            .unwrap();
        
        let result = handler.handle(command).await;
        
        // Should be unauthorized
        assert!(matches!(result, Ok(CommandResult::Unauthorized { .. })));
    }
    
    #[tokio::test]
    async fn test_channel_restrictions() {
        // Verify commands respect channel restrictions
    }
}
```

---

## CI/CD Integration

### Complete Test Pipeline

**File:** `.github/workflows/test.yml`

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    name: Test
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        rust: [stable, beta]
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Install Rust
        uses: dtolnay/rust-toolchain@master
        with:
          toolchain: ${{ matrix.rust }}
      
      - name: Cache dependencies
        uses: actions/cache@v4
        with:
          path: |
            ~/.cargo/registry
            ~/.cargo/git
            rust/target
          key: ${{ runner.os }}-cargo-${{ hashFiles('**/Cargo.lock') }}
      
      - name: Run tests
        working-directory: rust
        run: cargo test --workspace --all-features -- --nocapture
      
      - name: Run doc tests
        working-directory: rust
        run: cargo test --doc
```

### Benchmarks in CI

```yaml
benchmarks:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    
    - name: Run benchmarks
      working-directory: rust
      run: cargo bench --no-fail-fast
    
    - name: Store benchmark result
      uses: benchmark-action/github-action-benchmark@v1
      with:
        tool: 'cargo'
        output-file-path: rust/target/criterion/reports/index.html
```

---

## Troubleshooting Guide

### Common Test Failures

**1. Async tests timing out:**
```rust
// Increase timeout
#[tokio::test]
#[timeout(Duration::from_secs(30))]
async fn test_slow_operation() {
    // ...
}
```

**2. Flaky tests:**
```rust
// Add retries for flaky external deps
#[tokio::test]
async fn test_external_service() {
    for attempt in 1..=3 {
        match try_test().await {
            Ok(_) => return,
            Err(e) if attempt < 3 => {
                tokio::time::sleep(Duration::from_secs(1)).await;
                continue;
            }
            Err(e) => panic!("Test failed after 3 attempts: {}", e),
        }
    }
}
```

**3. Database connection errors:**
```rust
// Use connection pools properly
let pool = r2d2::Pool::builder()
    .max_size(10)
    .connection_timeout(Duration::from_secs(30))
    .build(manager)?;
```

---

## Performance Benchmarks

### Target Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Command Latency (p50) | <50ms | TBD | 🟡 |
| Command Latency (p95) | <200ms | TBD | 🟡 |
| Throughput | 1000 cmd/sec | TBD | 🟡 |
| Memory (idle) | <100MB | TBD | 🟡 |
| Memory (load) | <500MB | TBD | 🟡 |
| Test Coverage | >70% | TBD | 🟡 |

---

**Last Updated:** December 2024  
**Version:** 1.0  
**Status:** Ready for Implementation
