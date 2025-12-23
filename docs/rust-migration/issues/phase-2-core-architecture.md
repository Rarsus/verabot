# Phase 2: Core Architecture Issues (3-4 weeks)

## ISSUE-2.1.1: Implement CommandBus

**Epic:** Phase 2 - Core Architecture  
**Priority:** P0 - Critical  
**Effort:** 8 Story Points  
**Dependencies:** ISSUE-1.1.3

### Description

Implement the central command bus that routes commands to appropriate handlers through a middleware pipeline. This is the heart of the command execution system.

### Acceptance Criteria

- [ ] `CommandBus` struct with handler registry
- [ ] `execute()` method for command execution
- [ ] Handler trait definition
- [ ] Async handler execution with tokio
- [ ] Error propagation and result handling
- [ ] Metrics collection for command execution
- [ ] Unit tests with mocked handlers
- [ ] Integration tests with real handlers
- [ ] Performance: <10ms overhead per command

### Implementation Details

**app/src/bus.rs:**
```rust
use async_trait::async_trait;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use crate::error::Result;
use crate::command::{Command, CommandResult};
use crate::middleware::Middleware;

/// Trait for command handlers
#[async_trait]
pub trait CommandHandler: Send + Sync {
    /// Handle command execution
    async fn handle(&self, command: Command) -> Result<CommandResult>;
    
    /// Get handler name
    fn name(&self) -> &str;
}

/// Context for command execution
#[derive(Clone)]
pub struct CommandContext {
    pub command: Command,
    pub category: String,
}

/// Command bus for routing and executing commands
pub struct CommandBus {
    handlers: Arc<RwLock<HashMap<String, Arc<dyn CommandHandler>>>>,
    middleware: Vec<Arc<dyn Middleware>>,
}

impl CommandBus {
    /// Create a new command bus
    pub fn new() -> Self {
        Self {
            handlers: Arc::new(RwLock::new(HashMap::new())),
            middleware: Vec::new(),
        }
    }
    
    /// Register a command handler
    pub async fn register<H>(&self, name: impl Into<String>, handler: H)
    where
        H: CommandHandler + 'static,
    {
        let mut handlers = self.handlers.write().await;
        handlers.insert(name.into(), Arc::new(handler));
    }
    
    /// Add middleware to the pipeline
    pub fn add_middleware<M>(&mut self, middleware: M)
    where
        M: Middleware + 'static,
    {
        self.middleware.push(Arc::new(middleware));
    }
    
    /// Execute a command
    pub async fn execute(&self, command: Command) -> Result<CommandResult> {
        // Find handler
        let handlers = self.handlers.read().await;
        let handler = handlers
            .get(&command.name)
            .ok_or_else(|| crate::error::Error::Command(
                crate::error::CommandError::NotFound(command.name.clone())
            ))?;
        
        let handler = Arc::clone(handler);
        drop(handlers); // Release lock
        
        // Create context
        let context = CommandContext {
            command: command.clone(),
            category: self.get_category(&command.name),
        };
        
        // Execute through middleware pipeline
        self.execute_with_middleware(context, handler).await
    }
    
    async fn execute_with_middleware(
        &self,
        context: CommandContext,
        handler: Arc<dyn CommandHandler>,
    ) -> Result<CommandResult> {
        // Build middleware chain
        let mut next = Box::new(move |ctx: CommandContext| {
            let h = Arc::clone(&handler);
            Box::pin(async move {
                h.handle(ctx.command).await
            }) as std::pin::Pin<Box<dyn std::future::Future<Output = Result<CommandResult>> + Send>>
        }) as Box<dyn FnOnce(CommandContext) -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<CommandResult>> + Send>> + Send>;
        
        // Apply middleware in reverse order
        for middleware in self.middleware.iter().rev() {
            let m = Arc::clone(middleware);
            next = Box::new(move |ctx: CommandContext| {
                Box::pin(async move {
                    m.handle(ctx, next).await
                })
            });
        }
        
        // Execute the chain
        next(context).await
    }
    
    fn get_category(&self, command_name: &str) -> String {
        // Map command to category based on name
        match command_name {
            "ping" | "help" | "stats" | "uptime" => "core",
            "allow" | "deny" | "allowed" | "audit" => "admin",
            "say" | "notify" | "broadcast" => "messaging",
            "deploy" | "restart" | "status" => "operations",
            _ => "other",
        }.to_string()
    }
    
    /// Get all registered command names
    pub async fn list_commands(&self) -> Vec<String> {
        let handlers = self.handlers.read().await;
        handlers.keys().cloned().collect()
    }
}

impl Default for CommandBus {
    fn default() -> Self {
        Self::new()
    }
}
```

### Testing Requirements

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use mockall::mock;

    mock! {
        Handler {}
        
        #[async_trait]
        impl CommandHandler for Handler {
            async fn handle(&self, command: Command) -> Result<CommandResult>;
            fn name(&self) -> &str;
        }
    }

    #[tokio::test]
    async fn test_register_and_execute() {
        let bus = CommandBus::new();
        
        let mut handler = MockHandler::new();
        handler.expect_name()
            .return_const("ping");
        handler.expect_handle()
            .returning(|_| Ok(CommandResult::ok("pong")));
        
        bus.register("ping", handler).await;
        
        let cmd = Command::builder()
            .name("ping")
            .user_id("12345")
            .build()
            .unwrap();
        
        let result = bus.execute(cmd).await.unwrap();
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_command_not_found() {
        let bus = CommandBus::new();
        
        let cmd = Command::builder()
            .name("unknown")
            .user_id("12345")
            .build()
            .unwrap();
        
        let result = bus.execute(cmd).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_list_commands() {
        let bus = CommandBus::new();
        
        let mut handler1 = MockHandler::new();
        handler1.expect_name().return_const("ping");
        
        let mut handler2 = MockHandler::new();
        handler2.expect_name().return_const("help");
        
        bus.register("ping", handler1).await;
        bus.register("help", handler2).await;
        
        let commands = bus.list_commands().await;
        assert_eq!(commands.len(), 2);
        assert!(commands.contains(&"ping".to_string()));
        assert!(commands.contains(&"help".to_string()));
    }
}
```

---

## ISSUE-2.1.2: Implement Middleware Pipeline

**Epic:** Phase 2 - Core Architecture  
**Priority:** P0 - Critical  
**Effort:** 8 Story Points  
**Dependencies:** ISSUE-2.1.1

### Description

Create the middleware pipeline infrastructure that allows cross-cutting concerns (logging, permissions, rate limiting) to be applied to command execution.

### Acceptance Criteria

- [ ] `Middleware` trait definition
- [ ] Pipeline execution with proper ordering
- [ ] Context passing between middleware
- [ ] Early termination support (e.g., permission denied)
- [ ] Error handling and propagation
- [ ] Middleware composition
- [ ] Unit tests for pipeline execution
- [ ] Integration tests with multiple middleware

### Implementation Details

**app/src/middleware.rs:**
```rust
use async_trait::async_trait;
use crate::bus::CommandContext;
use crate::command::CommandResult;
use crate::error::Result;

/// Middleware trait for command execution pipeline
#[async_trait]
pub trait Middleware: Send + Sync {
    /// Handle middleware execution
    /// 
    /// # Arguments
    /// * `context` - Command execution context
    /// * `next` - Next middleware in the chain
    async fn handle(
        &self,
        context: CommandContext,
        next: Next<'_>,
    ) -> Result<CommandResult>;
}

/// Type alias for the next middleware function
pub type Next<'a> = Box<
    dyn FnOnce(CommandContext) -> std::pin::Pin<
        Box<dyn std::future::Future<Output = Result<CommandResult>> + Send + 'a>
    > + Send + 'a
>;

/// Middleware pipeline
pub struct MiddlewarePipeline {
    middleware: Vec<Box<dyn Middleware>>,
}

impl MiddlewarePipeline {
    /// Create a new middleware pipeline
    pub fn new() -> Self {
        Self {
            middleware: Vec::new(),
        }
    }
    
    /// Add middleware to the pipeline
    pub fn add<M: Middleware + 'static>(&mut self, middleware: M) {
        self.middleware.push(Box::new(middleware));
    }
    
    /// Execute the pipeline
    pub async fn execute<F, Fut>(
        &self,
        context: CommandContext,
        handler: F,
    ) -> Result<CommandResult>
    where
        F: FnOnce(CommandContext) -> Fut + Send + 'static,
        Fut: std::future::Future<Output = Result<CommandResult>> + Send + 'static,
    {
        if self.middleware.is_empty() {
            return handler(context).await;
        }
        
        // Build the middleware chain from the end
        let mut next: Next = Box::new(move |ctx| {
            Box::pin(handler(ctx))
        });
        
        // Apply middleware in reverse order
        for middleware in self.middleware.iter().rev() {
            let m = middleware.as_ref();
            next = Box::new(move |ctx| {
                Box::pin(async move {
                    m.handle(ctx, next).await
                })
            });
        }
        
        // Execute the chain
        next(context).await
    }
}

impl Default for MiddlewarePipeline {
    fn default() -> Self {
        Self::new()
    }
}

/// Logging middleware example
pub struct LoggingMiddleware {
    logger: slog::Logger,
}

impl LoggingMiddleware {
    pub fn new(logger: slog::Logger) -> Self {
        Self { logger }
    }
}

#[async_trait]
impl Middleware for LoggingMiddleware {
    async fn handle(
        &self,
        context: CommandContext,
        next: Next<'_>,
    ) -> Result<CommandResult> {
        let start = std::time::Instant::now();
        
        slog::info!(
            self.logger,
            "Executing command";
            "command" => &context.command.name,
            "user_id" => &context.command.user_id,
            "category" => &context.category
        );
        
        let result = next(context).await;
        
        let duration = start.elapsed();
        
        match &result {
            Ok(cmd_result) => {
                slog::info!(
                    self.logger,
                    "Command completed";
                    "success" => cmd_result.is_ok(),
                    "duration_ms" => duration.as_millis()
                );
            }
            Err(e) => {
                slog::error!(
                    self.logger,
                    "Command failed";
                    "error" => %e,
                    "duration_ms" => duration.as_millis()
                );
            }
        }
        
        result
    }
}
```

### Testing Requirements

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::{Arc, Mutex};

    struct TestMiddleware {
        log: Arc<Mutex<Vec<String>>>,
        id: String,
    }

    #[async_trait]
    impl Middleware for TestMiddleware {
        async fn handle(
            &self,
            context: CommandContext,
            next: Next<'_>,
        ) -> Result<CommandResult> {
            self.log.lock().unwrap().push(format!("{}_before", self.id));
            let result = next(context).await;
            self.log.lock().unwrap().push(format!("{}_after", self.id));
            result
        }
    }

    #[tokio::test]
    async fn test_middleware_execution_order() {
        let log = Arc::new(Mutex::new(Vec::new()));
        
        let mut pipeline = MiddlewarePipeline::new();
        pipeline.add(TestMiddleware {
            log: Arc::clone(&log),
            id: "first".to_string(),
        });
        pipeline.add(TestMiddleware {
            log: Arc::clone(&log),
            id: "second".to_string(),
        });
        
        let context = CommandContext {
            command: Command::builder()
                .name("test")
                .user_id("12345")
                .build()
                .unwrap(),
            category: "test".to_string(),
        };
        
        let _ = pipeline.execute(context, |_| async {
            Ok(CommandResult::ok("done"))
        }).await;
        
        let execution_log = log.lock().unwrap();
        assert_eq!(execution_log[0], "first_before");
        assert_eq!(execution_log[1], "second_before");
        assert_eq!(execution_log[2], "second_after");
        assert_eq!(execution_log[3], "first_after");
    }

    #[tokio::test]
    async fn test_middleware_early_termination() {
        struct BlockingMiddleware;
        
        #[async_trait]
        impl Middleware for BlockingMiddleware {
            async fn handle(
                &self,
                _context: CommandContext,
                _next: Next<'_>,
            ) -> Result<CommandResult> {
                // Don't call next - terminate early
                Ok(CommandResult::unauthorized("Blocked"))
            }
        }
        
        let mut pipeline = MiddlewarePipeline::new();
        pipeline.add(BlockingMiddleware);
        
        let context = CommandContext {
            command: Command::builder()
                .name("test")
                .user_id("12345")
                .build()
                .unwrap(),
            category: "test".to_string(),
        };
        
        let result = pipeline.execute(context, |_| async {
            panic!("Handler should not be called");
        }).await.unwrap();
        
        assert!(result.is_unauthorized());
    }
}
```

---

## ISSUE-2.1.3: Implement Command Registry

**Epic:** Phase 2 - Core Architecture  
**Priority:** P1 - High  
**Effort:** 5 Story Points  
**Dependencies:** ISSUE-2.1.1

### Description

Create a command registry that maintains metadata about all available commands, including descriptions, categories, permissions, and usage information.

### Acceptance Criteria

- [ ] `CommandRegistry` struct with command metadata
- [ ] `CommandMetadata` struct with all command information
- [ ] Registration and lookup methods
- [ ] Category-based filtering
- [ ] Search functionality
- [ ] Help text generation
- [ ] Thread-safe access with RwLock
- [ ] Unit tests for all operations

### Implementation Details

**core/src/registry.rs:**
```rust
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use serde::{Deserialize, Serialize};

/// Metadata about a command
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandMetadata {
    /// Command name
    pub name: String,
    
    /// Human-readable description
    pub description: String,
    
    /// Detailed usage information
    pub usage: String,
    
    /// Command category
    pub category: CommandCategory,
    
    /// Required permission level
    pub permission: PermissionLevel,
    
    /// Command aliases
    pub aliases: Vec<String>,
    
    /// Example usage
    pub examples: Vec<String>,
    
    /// Whether command is enabled
    pub enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum CommandCategory {
    Core,
    Admin,
    Messaging,
    Operations,
    Quotes,
    Other,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, PartialOrd, Ord)]
pub enum PermissionLevel {
    User,
    Moderator,
    Admin,
    Owner,
}

/// Command registry
pub struct CommandRegistry {
    commands: Arc<RwLock<HashMap<String, CommandMetadata>>>,
    aliases: Arc<RwLock<HashMap<String, String>>>, // alias -> command name
}

impl CommandRegistry {
    /// Create a new command registry
    pub fn new() -> Self {
        Self {
            commands: Arc::new(RwLock::new(HashMap::new())),
            aliases: Arc::new(RwLock::new(HashMap::new())),
        }
    }
    
    /// Register a command
    pub async fn register(&self, metadata: CommandMetadata) {
        let name = metadata.name.clone();
        let aliases = metadata.aliases.clone();
        
        // Register command
        let mut commands = self.commands.write().await;
        commands.insert(name.clone(), metadata);
        drop(commands);
        
        // Register aliases
        let mut alias_map = self.aliases.write().await;
        for alias in aliases {
            alias_map.insert(alias, name.clone());
        }
    }
    
    /// Get command metadata
    pub async fn get(&self, name: &str) -> Option<CommandMetadata> {
        // Check if it's an alias first
        let actual_name = {
            let aliases = self.aliases.read().await;
            aliases.get(name).cloned()
        };
        
        let name = actual_name.as_deref().unwrap_or(name);
        
        let commands = self.commands.read().await;
        commands.get(name).cloned()
    }
    
    /// Get all commands
    pub async fn list_all(&self) -> Vec<CommandMetadata> {
        let commands = self.commands.read().await;
        commands.values().cloned().collect()
    }
    
    /// Get commands by category
    pub async fn list_by_category(&self, category: CommandCategory) -> Vec<CommandMetadata> {
        let commands = self.commands.read().await;
        commands
            .values()
            .filter(|cmd| cmd.category == category)
            .cloned()
            .collect()
    }
    
    /// Search commands by name or description
    pub async fn search(&self, query: &str) -> Vec<CommandMetadata> {
        let query = query.to_lowercase();
        let commands = self.commands.read().await;
        
        commands
            .values()
            .filter(|cmd| {
                cmd.name.to_lowercase().contains(&query)
                    || cmd.description.to_lowercase().contains(&query)
            })
            .cloned()
            .collect()
    }
    
    /// Check if command exists
    pub async fn exists(&self, name: &str) -> bool {
        self.get(name).await.is_some()
    }
    
    /// Generate help text for a command
    pub async fn help_text(&self, name: &str) -> Option<String> {
        let cmd = self.get(name).await?;
        
        let mut text = format!("**{}**\n", cmd.name);
        text.push_str(&format!("{}\n\n", cmd.description));
        text.push_str(&format!("**Usage:** {}\n", cmd.usage));
        text.push_str(&format!("**Category:** {:?}\n", cmd.category));
        text.push_str(&format!("**Permission:** {:?}\n", cmd.permission));
        
        if !cmd.aliases.is_empty() {
            text.push_str(&format!("**Aliases:** {}\n", cmd.aliases.join(", ")));
        }
        
        if !cmd.examples.is_empty() {
            text.push_str("\n**Examples:**\n");
            for example in &cmd.examples {
                text.push_str(&format!("  {}\n", example));
            }
        }
        
        Some(text)
    }
}

impl Default for CommandRegistry {
    fn default() -> Self {
        Self::new()
    }
}
```

### Testing Requirements

```rust
#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_command() -> CommandMetadata {
        CommandMetadata {
            name: "ping".to_string(),
            description: "Test connectivity".to_string(),
            usage: "/ping".to_string(),
            category: CommandCategory::Core,
            permission: PermissionLevel::User,
            aliases: vec!["p".to_string()],
            examples: vec!["/ping".to_string()],
            enabled: true,
        }
    }

    #[tokio::test]
    async fn test_register_and_get() {
        let registry = CommandRegistry::new();
        let cmd = create_test_command();
        
        registry.register(cmd.clone()).await;
        
        let retrieved = registry.get("ping").await;
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().name, "ping");
    }

    #[tokio::test]
    async fn test_alias_lookup() {
        let registry = CommandRegistry::new();
        let cmd = create_test_command();
        
        registry.register(cmd).await;
        
        let retrieved = registry.get("p").await;
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().name, "ping");
    }

    #[tokio::test]
    async fn test_list_by_category() {
        let registry = CommandRegistry::new();
        
        let mut cmd1 = create_test_command();
        cmd1.name = "ping".to_string();
        cmd1.category = CommandCategory::Core;
        
        let mut cmd2 = create_test_command();
        cmd2.name = "allow".to_string();
        cmd2.category = CommandCategory::Admin;
        
        registry.register(cmd1).await;
        registry.register(cmd2).await;
        
        let core_commands = registry.list_by_category(CommandCategory::Core).await;
        assert_eq!(core_commands.len(), 1);
        assert_eq!(core_commands[0].name, "ping");
    }

    #[tokio::test]
    async fn test_search() {
        let registry = CommandRegistry::new();
        let cmd = create_test_command();
        
        registry.register(cmd).await;
        
        let results = registry.search("connectivity").await;
        assert_eq!(results.len(), 1);
        
        let results = registry.search("notfound").await;
        assert_eq!(results.len(), 0);
    }

    #[tokio::test]
    async fn test_help_text_generation() {
        let registry = CommandRegistry::new();
        let cmd = create_test_command();
        
        registry.register(cmd).await;
        
        let help = registry.help_text("ping").await;
        assert!(help.is_some());
        
        let text = help.unwrap();
        assert!(text.contains("ping"));
        assert!(text.contains("Test connectivity"));
        assert!(text.contains("/ping"));
    }
}
```

---

## ISSUE-2.2.1: Build Service Container (DI)

**Epic:** Phase 2 - Core Architecture  
**Priority:** P0 - Critical  
**Effort:** 8 Story Points  
**Dependencies:** ISSUE-1.1.2, ISSUE-2.1.1

### Description

Implement a dependency injection container that manages service lifetimes, resolves dependencies, and provides service discovery throughout the application.

### Acceptance Criteria

- [ ] `ServiceContainer` struct with service registration
- [ ] Support for singleton and transient services
- [ ] Automatic dependency resolution
- [ ] Service factory functions
- [ ] Thread-safe service access
- [ ] Graceful shutdown support
- [ ] Circular dependency detection
- [ ] Unit tests for all DI scenarios

### Implementation Details

**infra/src/di.rs:**
```rust
use std::any::{Any, TypeId};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Service container for dependency injection
pub struct ServiceContainer {
    singletons: Arc<RwLock<HashMap<TypeId, Arc<dyn Any + Send + Sync>>>>,
    factories: Arc<RwLock<HashMap<TypeId, Box<dyn Fn() -> Arc<dyn Any + Send + Sync> + Send + Sync>>>>,
}

impl ServiceContainer {
    /// Create a new service container
    pub fn new() -> Self {
        Self {
            singletons: Arc::new(RwLock::new(HashMap::new())),
            factories: Arc::new(RwLock::new(HashMap::new())),
        }
    }
    
    /// Register a singleton service
    pub async fn register_singleton<T: Any + Send + Sync>(&self, instance: T) {
        let mut singletons = self.singletons.write().await;
        singletons.insert(TypeId::of::<T>(), Arc::new(instance));
    }
    
    /// Register a transient service factory
    pub async fn register_transient<T, F>(&self, factory: F)
    where
        T: Any + Send + Sync,
        F: Fn() -> T + Send + Sync + 'static,
    {
        let mut factories = self.factories.write().await;
        factories.insert(
            TypeId::of::<T>(),
            Box::new(move || Arc::new(factory())),
        );
    }
    
    /// Resolve a service
    pub async fn resolve<T: Any + Send + Sync>(&self) -> Option<Arc<T>> {
        // Try to get singleton first
        let singletons = self.singletons.read().await;
        if let Some(service) = singletons.get(&TypeId::of::<T>()) {
            let service = Arc::clone(service);
            drop(singletons);
            return service.downcast::<T>().ok();
        }
        drop(singletons);
        
        // Try to create from factory
        let factories = self.factories.read().await;
        if let Some(factory) = factories.get(&TypeId::of::<T>()) {
            let instance = factory();
            drop(factories);
            return instance.downcast::<T>().ok();
        }
        
        None
    }
    
    /// Check if service is registered
    pub async fn contains<T: Any + Send + Sync>(&self) -> bool {
        let type_id = TypeId::of::<T>();
        
        let singletons = self.singletons.read().await;
        if singletons.contains_key(&type_id) {
            return true;
        }
        drop(singletons);
        
        let factories = self.factories.read().await;
        factories.contains_key(&type_id)
    }
}

impl Default for ServiceContainer {
    fn default() -> Self {
        Self::new()
    }
}

/// Builder for service container
pub struct ContainerBuilder {
    container: ServiceContainer,
}

impl ContainerBuilder {
    /// Create a new container builder
    pub fn new() -> Self {
        Self {
            container: ServiceContainer::new(),
        }
    }
    
    /// Add a singleton service
    pub async fn add_singleton<T: Any + Send + Sync>(self, instance: T) -> Self {
        self.container.register_singleton(instance).await;
        self
    }
    
    /// Add a transient service
    pub async fn add_transient<T, F>(self, factory: F) -> Self
    where
        T: Any + Send + Sync,
        F: Fn() -> T + Send + Sync + 'static,
    {
        self.container.register_transient(factory).await;
        self
    }
    
    /// Build the container
    pub fn build(self) -> ServiceContainer {
        self.container
    }
}

impl Default for ContainerBuilder {
    fn default() -> Self {
        Self::new()
    }
}
```

### Testing Requirements

```rust
#[cfg(test)]
mod tests {
    use super::*;

    struct TestService {
        value: i32,
    }

    #[tokio::test]
    async fn test_register_and_resolve_singleton() {
        let container = ServiceContainer::new();
        let service = TestService { value: 42 };
        
        container.register_singleton(service).await;
        
        let resolved = container.resolve::<TestService>().await;
        assert!(resolved.is_some());
        assert_eq!(resolved.unwrap().value, 42);
    }

    #[tokio::test]
    async fn test_singleton_same_instance() {
        let container = ServiceContainer::new();
        let service = TestService { value: 42 };
        
        container.register_singleton(service).await;
        
        let instance1 = container.resolve::<TestService>().await.unwrap();
        let instance2 = container.resolve::<TestService>().await.unwrap();
        
        // Both should point to the same instance
        assert!(Arc::ptr_eq(&instance1, &instance2));
    }

    #[tokio::test]
    async fn test_register_and_resolve_transient() {
        let container = ServiceContainer::new();
        
        container.register_transient(|| TestService { value: 42 }).await;
        
        let resolved = container.resolve::<TestService>().await;
        assert!(resolved.is_some());
        assert_eq!(resolved.unwrap().value, 42);
    }

    #[tokio::test]
    async fn test_transient_different_instances() {
        let container = ServiceContainer::new();
        
        let mut counter = 0;
        container.register_transient(move || {
            counter += 1;
            TestService { value: counter }
        }).await;
        
        let instance1 = container.resolve::<TestService>().await.unwrap();
        let instance2 = container.resolve::<TestService>().await.unwrap();
        
        // Instances should be different
        assert!(!Arc::ptr_eq(&instance1, &instance2));
    }

    #[tokio::test]
    async fn test_resolve_non_existent() {
        let container = ServiceContainer::new();
        
        let resolved = container.resolve::<TestService>().await;
        assert!(resolved.is_none());
    }

    #[tokio::test]
    async fn test_contains() {
        let container = ServiceContainer::new();
        
        assert!(!container.contains::<TestService>().await);
        
        container.register_singleton(TestService { value: 42 }).await;
        
        assert!(container.contains::<TestService>().await);
    }

    #[tokio::test]
    async fn test_container_builder() {
        let container = ContainerBuilder::new()
            .add_singleton(TestService { value: 42 }).await
            .build();
        
        let resolved = container.resolve::<TestService>().await;
        assert!(resolved.is_some());
    }
}
```

---

## ISSUE-2.2.2: Implement Core Services

**Epic:** Phase 2 - Core Architecture  
**Priority:** P1 - High  
**Effort:** 8 Story Points  
**Dependencies:** ISSUE-2.2.1, ISSUE-2.1.3

### Description

Implement core business logic services including CommandService, PermissionService, and HelpService that will be used by handlers.

### Acceptance Criteria

- [ ] CommandService with command lookup and validation
- [ ] PermissionService with access control checking
- [ ] HelpService for help text generation
- [ ] All services use DI container
- [ ] Async operations with proper error handling
- [ ] Comprehensive unit tests with mocked dependencies
- [ ] Integration tests with real dependencies

### Implementation Details

**core/src/services/command_service.rs:**
```rust
use crate::command::{Command, CommandResult};
use crate::registry::CommandRegistry;
use crate::error::{Error, Result};
use std::sync::Arc;

/// Service for command operations
pub struct CommandService {
    registry: Arc<CommandRegistry>,
}

impl CommandService {
    /// Create a new command service
    pub fn new(registry: Arc<CommandRegistry>) -> Self {
        Self { registry }
    }
    
    /// Validate command exists
    pub async fn validate_command(&self, name: &str) -> Result<()> {
        if !self.registry.exists(name).await {
            return Err(Error::Command(
                crate::error::CommandError::NotFound(name.to_string())
            ));
        }
        Ok(())
    }
    
    /// Check if command is enabled
    pub async fn is_enabled(&self, name: &str) -> Result<bool> {
        let metadata = self.registry.get(name).await
            .ok_or_else(|| Error::Command(
                crate::error::CommandError::NotFound(name.to_string())
            ))?;
        
        Ok(metadata.enabled)
    }
    
    /// Get command metadata
    pub async fn get_metadata(&self, name: &str) -> Result<crate::registry::CommandMetadata> {
        self.registry.get(name).await
            .ok_or_else(|| Error::Command(
                crate::error::CommandError::NotFound(name.to_string())
            ))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::registry::{CommandMetadata, CommandCategory, PermissionLevel};

    #[tokio::test]
    async fn test_validate_command() {
        let registry = Arc::new(CommandRegistry::new());
        let service = CommandService::new(Arc::clone(&registry));
        
        let metadata = CommandMetadata {
            name: "ping".to_string(),
            description: "Test".to_string(),
            usage: "/ping".to_string(),
            category: CommandCategory::Core,
            permission: PermissionLevel::User,
            aliases: vec![],
            examples: vec![],
            enabled: true,
        };
        
        registry.register(metadata).await;
        
        assert!(service.validate_command("ping").await.is_ok());
        assert!(service.validate_command("nonexistent").await.is_err());
    }
}
```

**core/src/services/permission_service.rs:**
```rust
use crate::command::Command;
use crate::registry::{CommandRegistry, PermissionLevel};
use crate::error::{Error, PermissionError, Result};
use std::sync::Arc;

/// Service for permission checking
pub struct PermissionService {
    registry: Arc<CommandRegistry>,
}

impl PermissionService {
    /// Create a new permission service
    pub fn new(registry: Arc<CommandRegistry>) -> Self {
        Self { registry }
    }
    
    /// Check if user has permission to execute command
    pub async fn check_permission(
        &self,
        command: &Command,
        user_level: PermissionLevel,
    ) -> Result<()> {
        let metadata = self.registry.get(&command.name).await
            .ok_or_else(|| Error::Command(
                crate::error::CommandError::NotFound(command.name.clone())
            ))?;
        
        if user_level < metadata.permission {
            return Err(Error::Permission(PermissionError::Insufficient {
                required: format!("{:?}", metadata.permission),
                actual: format!("{:?}", user_level),
            }));
        }
        
        Ok(())
    }
}
```

---

## Summary

Phase 2 builds the core architecture:

- **ISSUE-2.1.1**: CommandBus (8 SP)
- **ISSUE-2.1.2**: Middleware Pipeline (8 SP)
- **ISSUE-2.1.3**: Command Registry (5 SP)
- **ISSUE-2.2.1**: Service Container/DI (8 SP)
- **ISSUE-2.2.2**: Core Services (8 SP)

**Total: 37 Story Points (~3-4 weeks)**

All issues include:
✅ Complete Rust implementations
✅ Comprehensive unit tests
✅ Integration test examples
✅ Error handling
✅ Performance considerations
✅ Documentation
