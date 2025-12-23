# Phase 1: Setup Issues (2 weeks)

## ISSUE-1.1.1: Initialize Rust Project Structure

**Epic:** Phase 1 - Project Setup  
**Priority:** P0 - Critical  
**Effort:** 5 Story Points  
**Dependencies:** None

### Description

Set up the foundational Rust project structure with Cargo workspace, proper directory organization, and initial configuration files. This establishes the base for all future development.

### Acceptance Criteria

- [ ] Cargo workspace configured with multiple crates (core, app, infra, handlers)
- [ ] Directory structure matches the layered architecture (core/, app/, infra/, handlers/)
- [ ] Basic `Cargo.toml` with workspace members and shared dependencies
- [ ] `.gitignore` configured for Rust artifacts (target/, Cargo.lock for binaries)
- [ ] Initial `README.md` with build instructions
- [ ] Project builds successfully with `cargo build`
- [ ] Basic integration with existing repository (separate rust/ directory)

### Implementation Details

**Directory Structure:**
```
rust/
├── Cargo.toml (workspace root)
├── Cargo.lock
├── README.md
├── core/
│   ├── Cargo.toml
│   └── src/
│       └── lib.rs
├── app/
│   ├── Cargo.toml
│   └── src/
│       └── lib.rs
├── infra/
│   ├── Cargo.toml
│   └── src/
│       └── lib.rs
├── handlers/
│   ├── Cargo.toml
│   └── src/
│       └── lib.rs
└── verabot/
    ├── Cargo.toml
    └── src/
        └── main.rs
```

**Workspace Cargo.toml:**
```toml
[workspace]
members = ["core", "app", "infra", "handlers", "verabot"]
resolver = "2"

[workspace.package]
version = "0.1.0"
edition = "2021"
authors = ["VeraBot Team"]
license = "MIT"
rust-version = "1.75"

[workspace.dependencies]
# Async runtime
tokio = { version = "1.35", features = ["full"] }
async-trait = "0.1"

# Error handling
thiserror = "1.0"
anyhow = "1.0"

# Serialization
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

# Discord
serenity = { version = "0.12", default-features = false, features = ["client", "gateway", "rustls_backend", "model"] }

# Testing
mockall = "0.12"
tokio-test = "0.4"
```

### Testing Requirements

- [ ] Workspace builds without errors: `cargo build`
- [ ] All crates compile independently
- [ ] Basic smoke test in each crate (empty test that passes)
- [ ] Cargo check passes: `cargo check --workspace`

### Code Example

**core/src/lib.rs:**
```rust
//! Core domain types and abstractions for VeraBot

#[cfg(test)]
mod tests {
    #[test]
    fn it_works() {
        assert_eq!(2 + 2, 4);
    }
}
```

---

## ISSUE-1.1.2: Define Core Error Types

**Epic:** Phase 1 - Project Setup  
**Priority:** P0 - Critical  
**Effort:** 3 Story Points  
**Dependencies:** ISSUE-1.1.1

### Description

Create a comprehensive error type hierarchy using `thiserror` for all possible error conditions across the application. This provides consistent error handling and propagation throughout the codebase.

### Acceptance Criteria

- [ ] `Error` type defined in `core/src/error.rs`
- [ ] All major error categories covered (CommandError, PermissionError, DatabaseError, etc.)
- [ ] Errors implement `std::error::Error` and `Display`
- [ ] Error conversion traits implemented (From<T> for Error)
- [ ] Errors are serializable for API responses
- [ ] Documentation for each error variant
- [ ] Unit tests for error creation and conversion

### Implementation Details

**core/src/error.rs:**
```rust
use thiserror::Error;

/// Main error type for VeraBot
#[derive(Error, Debug)]
pub enum Error {
    #[error("Command error: {0}")]
    Command(#[from] CommandError),
    
    #[error("Permission denied: {0}")]
    Permission(#[from] PermissionError),
    
    #[error("Database error: {0}")]
    Database(#[from] DatabaseError),
    
    #[error("Configuration error: {0}")]
    Config(String),
    
    #[error("Rate limit exceeded: {0}")]
    RateLimit(String),
    
    #[error("Discord API error: {0}")]
    Discord(#[from] serenity::Error),
    
    #[error("Internal error: {0}")]
    Internal(String),
}

#[derive(Error, Debug)]
pub enum CommandError {
    #[error("Command not found: {0}")]
    NotFound(String),
    
    #[error("Invalid arguments: {0}")]
    InvalidArguments(String),
    
    #[error("Command execution failed: {0}")]
    ExecutionFailed(String),
    
    #[error("Command not allowed: {0}")]
    NotAllowed(String),
}

#[derive(Error, Debug)]
pub enum PermissionError {
    #[error("Insufficient permissions: required {required}, has {actual}")]
    Insufficient { required: String, actual: String },
    
    #[error("User {user_id} is denied access to {resource}")]
    Denied { user_id: String, resource: String },
    
    #[error("Channel {channel_id} is restricted")]
    ChannelRestricted { channel_id: String },
}

#[derive(Error, Debug)]
pub enum DatabaseError {
    #[error("Connection failed: {0}")]
    ConnectionFailed(String),
    
    #[error("Query failed: {0}")]
    QueryFailed(String),
    
    #[error("Record not found: {0}")]
    NotFound(String),
    
    #[error("Constraint violation: {0}")]
    ConstraintViolation(String),
}

/// Result type alias for VeraBot operations
pub type Result<T> = std::result::Result<T, Error>;
```

### Testing Requirements

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_command_error_display() {
        let err = CommandError::NotFound("ping".to_string());
        assert_eq!(err.to_string(), "Command not found: ping");
    }

    #[test]
    fn test_error_conversion() {
        let cmd_err = CommandError::InvalidArguments("missing name".to_string());
        let err: Error = cmd_err.into();
        assert!(matches!(err, Error::Command(_)));
    }

    #[test]
    fn test_permission_error_formatting() {
        let err = PermissionError::Insufficient {
            required: "admin".to_string(),
            actual: "user".to_string(),
        };
        let msg = err.to_string();
        assert!(msg.contains("admin"));
        assert!(msg.contains("user"));
    }
}
```

### Documentation

- Explain when to use each error type
- Provide error handling patterns
- Document error propagation with `?` operator
- Include examples of custom error messages

---

## ISSUE-1.1.3: Create Command Structure

**Epic:** Phase 1 - Project Setup  
**Priority:** P0 - Critical  
**Effort:** 5 Story Points  
**Dependencies:** ISSUE-1.1.2

### Description

Define the core `Command` struct and `CommandResult` enum that encapsulates all command execution context and results. This is the fundamental abstraction used throughout the application.

### Acceptance Criteria

- [ ] `Command` struct defined with all necessary fields
- [ ] `CommandResult` enum with Ok, Error, and Unauthorized variants
- [ ] Builder pattern for Command creation
- [ ] Serialization/deserialization support
- [ ] Comprehensive unit tests
- [ ] Documentation with examples
- [ ] Integration with error types from ISSUE-1.1.2

### Implementation Details

**core/src/command.rs:**
```rust
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use crate::error::{Error, Result};

/// Represents a command execution request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Command {
    /// Command name (e.g., "ping", "allow")
    pub name: String,
    
    /// Command source (discord, http, websocket)
    pub source: CommandSource,
    
    /// User ID who invoked the command
    pub user_id: String,
    
    /// Channel ID where command was invoked
    pub channel_id: Option<String>,
    
    /// Guild/Server ID
    pub guild_id: Option<String>,
    
    /// Command arguments
    pub args: Vec<String>,
    
    /// Additional metadata
    pub metadata: HashMap<String, String>,
    
    /// Timestamp of command creation
    pub timestamp: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CommandSource {
    Discord,
    Http,
    WebSocket,
}

/// Result of command execution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CommandResult {
    /// Successful execution
    Ok {
        message: String,
        data: Option<serde_json::Value>,
    },
    
    /// Execution error
    Error {
        message: String,
        error_type: String,
    },
    
    /// Permission denied
    Unauthorized {
        message: String,
        required_permission: Option<String>,
    },
}

impl Command {
    /// Create a new command builder
    pub fn builder() -> CommandBuilder {
        CommandBuilder::default()
    }
    
    /// Check if command has a specific argument
    pub fn has_arg(&self, index: usize) -> bool {
        self.args.len() > index
    }
    
    /// Get argument at index
    pub fn arg(&self, index: usize) -> Option<&str> {
        self.args.get(index).map(|s| s.as_str())
    }
    
    /// Get all arguments as a single string
    pub fn args_string(&self) -> String {
        self.args.join(" ")
    }
}

/// Builder for Command
#[derive(Default)]
pub struct CommandBuilder {
    name: Option<String>,
    source: Option<CommandSource>,
    user_id: Option<String>,
    channel_id: Option<String>,
    guild_id: Option<String>,
    args: Vec<String>,
    metadata: HashMap<String, String>,
}

impl CommandBuilder {
    pub fn name(mut self, name: impl Into<String>) -> Self {
        self.name = Some(name.into());
        self
    }
    
    pub fn source(mut self, source: CommandSource) -> Self {
        self.source = Some(source);
        self
    }
    
    pub fn user_id(mut self, user_id: impl Into<String>) -> Self {
        self.user_id = Some(user_id.into());
        self
    }
    
    pub fn channel_id(mut self, channel_id: impl Into<String>) -> Self {
        self.channel_id = Some(channel_id.into());
        self
    }
    
    pub fn guild_id(mut self, guild_id: impl Into<String>) -> Self {
        self.guild_id = Some(guild_id.into());
        self
    }
    
    pub fn args(mut self, args: Vec<String>) -> Self {
        self.args = args;
        self
    }
    
    pub fn metadata(mut self, key: impl Into<String>, value: impl Into<String>) -> Self {
        self.metadata.insert(key.into(), value.into());
        self
    }
    
    pub fn build(self) -> Result<Command> {
        Ok(Command {
            name: self.name.ok_or_else(|| Error::Config("Command name is required".to_string()))?,
            source: self.source.unwrap_or(CommandSource::Discord),
            user_id: self.user_id.ok_or_else(|| Error::Config("User ID is required".to_string()))?,
            channel_id: self.channel_id,
            guild_id: self.guild_id,
            args: self.args,
            metadata: self.metadata,
            timestamp: chrono::Utc::now().timestamp(),
        })
    }
}

impl CommandResult {
    /// Create a successful result
    pub fn ok(message: impl Into<String>) -> Self {
        CommandResult::Ok {
            message: message.into(),
            data: None,
        }
    }
    
    /// Create a successful result with data
    pub fn ok_with_data(message: impl Into<String>, data: serde_json::Value) -> Self {
        CommandResult::Ok {
            message: message.into(),
            data: Some(data),
        }
    }
    
    /// Create an error result
    pub fn error(message: impl Into<String>) -> Self {
        CommandResult::Error {
            message: message.into(),
            error_type: "Unknown".to_string(),
        }
    }
    
    /// Create an error result with type
    pub fn error_typed(message: impl Into<String>, error_type: impl Into<String>) -> Self {
        CommandResult::Error {
            message: message.into(),
            error_type: error_type.into(),
        }
    }
    
    /// Create an unauthorized result
    pub fn unauthorized(message: impl Into<String>) -> Self {
        CommandResult::Unauthorized {
            message: message.into(),
            required_permission: None,
        }
    }
    
    /// Check if result is successful
    pub fn is_ok(&self) -> bool {
        matches!(self, CommandResult::Ok { .. })
    }
    
    /// Check if result is error
    pub fn is_error(&self) -> bool {
        matches!(self, CommandResult::Error { .. })
    }
    
    /// Check if result is unauthorized
    pub fn is_unauthorized(&self) -> bool {
        matches!(self, CommandResult::Unauthorized { .. })
    }
}
```

### Testing Requirements

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_command_builder() {
        let cmd = Command::builder()
            .name("ping")
            .source(CommandSource::Discord)
            .user_id("12345")
            .channel_id("67890")
            .args(vec![])
            .build()
            .unwrap();
        
        assert_eq!(cmd.name, "ping");
        assert_eq!(cmd.user_id, "12345");
    }

    #[test]
    fn test_command_builder_missing_required() {
        let result = Command::builder()
            .name("ping")
            .build();
        
        assert!(result.is_err());
    }

    #[test]
    fn test_command_args() {
        let cmd = Command::builder()
            .name("allow")
            .user_id("12345")
            .args(vec!["ping".to_string()])
            .build()
            .unwrap();
        
        assert_eq!(cmd.arg(0), Some("ping"));
        assert_eq!(cmd.arg(1), None);
        assert!(cmd.has_arg(0));
        assert!(!cmd.has_arg(1));
    }

    #[test]
    fn test_command_result_ok() {
        let result = CommandResult::ok("Success");
        assert!(result.is_ok());
        assert!(!result.is_error());
    }

    #[test]
    fn test_command_result_error() {
        let result = CommandResult::error("Failed");
        assert!(result.is_error());
        assert!(!result.is_ok());
    }

    #[test]
    fn test_command_result_serialization() {
        let result = CommandResult::ok("test");
        let json = serde_json::to_string(&result).unwrap();
        let deserialized: CommandResult = serde_json::from_str(&json).unwrap();
        assert!(deserialized.is_ok());
    }
}
```

---

## ISSUE-1.1.4: Set up CI/CD Pipeline

**Epic:** Phase 1 - Project Setup  
**Priority:** P0 - Critical  
**Effort:** 5 Story Points  
**Dependencies:** ISSUE-1.1.1, ISSUE-1.1.2, ISSUE-1.1.3

### Description

Configure GitHub Actions workflows for continuous integration and deployment of the Rust codebase. This includes building, testing, linting, security scanning, and coverage reporting.

### Acceptance Criteria

- [ ] GitHub Actions workflow for Rust CI
- [ ] Build check on all platforms (Linux, macOS, Windows)
- [ ] Test execution with coverage reporting
- [ ] Clippy linting enforcement
- [ ] Rustfmt formatting check
- [ ] Security audit with cargo-audit
- [ ] Coverage reporting with tarpaulin
- [ ] Workflow triggers on PR and push to main
- [ ] Cache configuration for faster builds
- [ ] Slack/Discord notifications on failure

### Implementation Details

**.github/workflows/rust-ci.yml:**
```yaml
name: Rust CI

on:
  push:
    branches: [main, develop]
    paths:
      - 'rust/**'
      - '.github/workflows/rust-ci.yml'
  pull_request:
    branches: [main, develop]
    paths:
      - 'rust/**'
      - '.github/workflows/rust-ci.yml'

env:
  CARGO_TERM_COLOR: always
  RUST_BACKTRACE: 1

jobs:
  check:
    name: Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Install Rust
        uses: dtolnay/rust-toolchain@stable
      
      - name: Cache cargo registry
        uses: actions/cache@v4
        with:
          path: ~/.cargo/registry
          key: ${{ runner.os }}-cargo-registry-${{ hashFiles('**/Cargo.lock') }}
      
      - name: Cache cargo index
        uses: actions/cache@v4
        with:
          path: ~/.cargo/git
          key: ${{ runner.os }}-cargo-index-${{ hashFiles('**/Cargo.lock') }}
      
      - name: Cache target directory
        uses: actions/cache@v4
        with:
          path: rust/target
          key: ${{ runner.os }}-cargo-target-${{ hashFiles('**/Cargo.lock') }}
      
      - name: Check
        working-directory: rust
        run: cargo check --workspace --all-targets

  test:
    name: Test Suite
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        rust: [stable]
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
        run: cargo test --workspace --all-features

  fmt:
    name: Rustfmt
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Install Rust
        uses: dtolnay/rust-toolchain@stable
        with:
          components: rustfmt
      
      - name: Check formatting
        working-directory: rust
        run: cargo fmt --all -- --check

  clippy:
    name: Clippy
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Install Rust
        uses: dtolnay/rust-toolchain@stable
        with:
          components: clippy
      
      - name: Cache dependencies
        uses: actions/cache@v4
        with:
          path: |
            ~/.cargo/registry
            ~/.cargo/git
            rust/target
          key: ${{ runner.os }}-cargo-${{ hashFiles('**/Cargo.lock') }}
      
      - name: Run clippy
        working-directory: rust
        run: cargo clippy --workspace --all-targets --all-features -- -D warnings

  security-audit:
    name: Security Audit
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Install cargo-audit
        run: cargo install cargo-audit
      
      - name: Run security audit
        working-directory: rust
        run: cargo audit

  coverage:
    name: Code Coverage
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Install Rust
        uses: dtolnay/rust-toolchain@stable
      
      - name: Install tarpaulin
        run: cargo install cargo-tarpaulin
      
      - name: Cache dependencies
        uses: actions/cache@v4
        with:
          path: |
            ~/.cargo/registry
            ~/.cargo/git
            rust/target
          key: ${{ runner.os }}-cargo-${{ hashFiles('**/Cargo.lock') }}
      
      - name: Generate coverage
        working-directory: rust
        run: cargo tarpaulin --workspace --out Xml --output-dir coverage
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          files: rust/coverage/cobertura.xml
          flags: rust
          fail_ci_if_error: false
      
      - name: Check coverage threshold
        working-directory: rust
        run: |
          COVERAGE=$(cargo tarpaulin --workspace --out Json | jq '.files | map(.coverage) | add / length')
          echo "Coverage: $COVERAGE%"
          if (( $(echo "$COVERAGE < 70" | bc -l) )); then
            echo "Coverage is below 70%"
            exit 1
          fi

  build:
    name: Build Release
    runs-on: ubuntu-latest
    needs: [check, test, fmt, clippy]
    steps:
      - uses: actions/checkout@v4
      
      - name: Install Rust
        uses: dtolnay/rust-toolchain@stable
      
      - name: Build release
        working-directory: rust
        run: cargo build --release --workspace
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: verabot-rust
          path: rust/target/release/verabot
```

### Testing Requirements

- [ ] Workflow runs successfully on sample PR
- [ ] All jobs complete without errors
- [ ] Coverage report is generated and uploaded
- [ ] Build artifacts are created
- [ ] Security audit passes
- [ ] Format and lint checks pass

### Documentation

- Document workflow triggers and conditions
- Explain each job's purpose
- Provide troubleshooting guide for common CI failures
- Document how to run checks locally

---

## Summary

Phase 1 establishes the foundational infrastructure for the Rust migration:

- **ISSUE-1.1.1**: Project structure (5 SP)
- **ISSUE-1.1.2**: Error types (3 SP)
- **ISSUE-1.1.3**: Command structure (5 SP)
- **ISSUE-1.1.4**: CI/CD pipeline (5 SP)

**Total: 18 Story Points (~2 weeks)**

All issues include:
✅ Clear acceptance criteria
✅ Complete implementation code
✅ Comprehensive tests
✅ Documentation
✅ Dependency tracking
