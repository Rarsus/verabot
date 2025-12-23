# Rust Handler Examples Index

Comprehensive Rust implementations for key VeraBot handlers, demonstrating all major patterns needed for the migration.

## Overview

These examples provide production-ready reference implementations that demonstrate:
- Handler patterns (simple, database, service composition, external API)
- Middleware implementation
- Error handling
- Testing strategies
- Performance optimization
- Documentation standards

## Handler Examples

### 1. PingHandler - Simple Handler
**File:** [handlers-part1.md#pinghandler](./handlers-part1.md#pinghandler)

**Complexity:** ⭐ Simple  
**Dependencies:** None  
**Purpose:** Baseline example, simplest possible handler

**Key Learnings:**
- Basic handler structure
- Async trait implementation
- Zero-dependency design
- Sub-microsecond performance

**Code Highlights:**
```rust
pub struct PingHandler;

#[async_trait]
impl CommandHandler for PingHandler {
    async fn handle(&self, _command: Command) -> Result<CommandResult> {
        Ok(CommandResult::ok("pong"))
    }
}
```

**Tests:**
- Unit tests with tokio::test
- Performance benchmarks (<1μs)
- Concurrent execution tests

---

### 2. AllowHandler - Database Operations
**File:** [handlers-part1.md#allowhandler](./handlers-part1.md#allowhandler)

**Complexity:** ⭐⭐ Medium  
**Dependencies:** Database Repository  
**Purpose:** Database integration and business logic

**Key Learnings:**
- Repository pattern
- Input validation
- Transaction handling
- Error propagation
- Mock-based testing

**Code Highlights:**
```rust
pub struct AllowHandler {
    command_repo: Arc<dyn CommandRepository>,
}

#[async_trait]
impl CommandHandler for AllowHandler {
    async fn handle(&self, command: Command) -> Result<CommandResult> {
        let command_name = command.arg(0)
            .ok_or_else(|| Error::Command(CommandError::InvalidArguments(...)))?;
        
        Self::validate_command_name(command_name)?;
        
        if self.command_repo.is_allowed(command_name).await? {
            return Ok(CommandResult::ok(...));
        }
        
        self.command_repo.add_allowed(command_name, &command.user_id).await?;
        Ok(CommandResult::ok(...))
    }
}
```

**Tests:**
- Unit tests with mockall
- Integration tests with test database
- Validation tests
- Error handling tests

---

### 3. HelpHandler - Service Composition
**File:** [handlers-part1.md#helphandler](./handlers-part1.md#helphandler)

**Complexity:** ⭐⭐ Medium  
**Dependencies:** CommandRegistry, HelpService  
**Purpose:** Service composition and dynamic content

**Key Learnings:**
- Multiple service dependencies
- Registry integration
- Dynamic content generation
- Conditional logic

**Code Highlights:**
```rust
pub struct HelpHandler {
    registry: Arc<CommandRegistry>,
    help_service: Arc<HelpService>,
}

async fn generate_overview(&self) -> String {
    let mut output = String::from("**Available Commands**\n\n");
    
    for category in &[Core, Admin, Messaging, Operations, Quotes] {
        let commands = self.registry.list_by_category(category.clone()).await;
        // Format and append...
    }
    
    output
}
```

**Tests:**
- Overview generation tests
- Specific command help tests
- Category filtering tests
- Missing command handling

---

### 4. BroadcastHandler - Discord Integration
**File:** [handlers-part2.md#broadcasthandler](./handlers-part2.md#broadcasthandler)

**Complexity:** ⭐⭐⭐ High  
**Dependencies:** Discord Client (Serenity)  
**Purpose:** External API integration and async operations

**Key Learnings:**
- Discord API integration
- Async iteration over channels
- Error accumulation
- Rate limit awareness
- Partial failure handling

**Code Highlights:**
```rust
pub struct BroadcastHandler {
    discord_ctx: Arc<RwLock<Option<Context>>>,
}

async fn handle(&self, command: Command) -> Result<CommandResult> {
    let message = Self::extract_message(&command)?;
    
    let mut success_count = 0;
    let mut error_count = 0;
    
    let guilds = ctx.cache.guilds();
    for guild_id in guilds {
        let channels = guild_id.channels(&ctx.http).await?;
        
        for (channel_id, channel) in channels {
            match channel_id.say(&ctx.http, &message).await {
                Ok(_) => success_count += 1,
                Err(e) => error_count += 1,
            }
        }
    }
    
    Ok(CommandResult::ok_with_data(...))
}
```

**Tests:**
- Message extraction tests
- Mock-based Discord tests
- Error aggregation tests
- Integration tests (requires Discord)

---

### 5. RateLimitMiddleware - Middleware Pattern
**File:** [handlers-part2.md#ratelimitmiddleware](./handlers-part2.md#ratelimitmiddleware)

**Complexity:** ⭐⭐⭐ High  
**Dependencies:** Redis, RateLimiterService  
**Purpose:** Middleware pattern and distributed state

**Key Learnings:**
- Middleware trait implementation
- Redis integration
- Token bucket algorithm
- Per-user/per-category limits
- Distributed rate limiting

**Code Highlights:**
```rust
pub struct RateLimitMiddleware {
    rate_limiter: Arc<RateLimiterService>,
    configs: HashMap<String, RateLimitConfig>,
}

#[async_trait]
impl Middleware for RateLimitMiddleware {
    async fn handle(
        &self,
        context: CommandContext,
        next: Next<'_>,
    ) -> Result<CommandResult> {
        let config = self.configs.get(&context.category)?;
        let key = self.get_key(&context);
        
        let allowed = self.rate_limiter.check_rate_limit(
            &key, config.max_requests, config.window
        ).await?;
        
        if !allowed {
            return Ok(CommandResult::error_typed(...));
        }
        
        self.rate_limiter.increment(&key, config.window).await?;
        next(context).await
    }
}
```

**Tests:**
- Under-limit allows execution
- Over-limit blocks execution
- Key generation tests
- Redis integration tests

---

## Pattern Summary

### Handler Patterns

| Pattern | Example | Use Case |
|---------|---------|----------|
| Simple | PingHandler | No dependencies, pure logic |
| Database | AllowHandler | CRUD operations, validation |
| Service Composition | HelpHandler | Multiple services, aggregation |
| External API | BroadcastHandler | Third-party integration |
| Middleware | RateLimitMiddleware | Cross-cutting concerns |

### Testing Patterns

| Pattern | Tool | Example |
|---------|------|---------|
| Unit Tests | tokio::test | All handlers |
| Mock Tests | mockall | Database/Service mocks |
| Integration Tests | Real dependencies | Database, Redis |
| Property Tests | proptest | Validation functions |
| Benchmarks | criterion | Performance tests |

### Error Handling Patterns

| Pattern | Use Case | Example |
|---------|----------|---------|
| Early Return | Validation | `arg.ok_or_else(...)?` |
| Error Conversion | Type mapping | `From<T>` implementations |
| Error Aggregation | Batch operations | BroadcastHandler |
| Typed Errors | Result variants | CommandError, PermissionError |

---

## Implementation Guide

### Step 1: Choose Pattern

Identify which pattern your handler needs:
- **Simple?** → Start with PingHandler
- **Database?** → Start with AllowHandler
- **Services?** → Start with HelpHandler
- **External API?** → Start with BroadcastHandler
- **Cross-cutting?** → Start with RateLimitMiddleware

### Step 2: Copy Template

Copy the closest example and modify:
```rust
// 1. Define struct with dependencies
pub struct MyHandler {
    dependency: Arc<dyn MyDependency>,
}

// 2. Implement constructor
impl MyHandler {
    pub fn new(dependency: Arc<dyn MyDependency>) -> Self {
        Self { dependency }
    }
}

// 3. Implement CommandHandler trait
#[async_trait]
impl CommandHandler for MyHandler {
    async fn handle(&self, command: Command) -> Result<CommandResult> {
        // Your logic here
        Ok(CommandResult::ok("success"))
    }
    
    fn name(&self) -> &str {
        "mycommand"
    }
}
```

### Step 3: Add Tests

Follow testing pattern from examples:
```rust
#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_basic_functionality() {
        // Arrange
        let handler = MyHandler::new(...);
        let command = test_command("mycommand");
        
        // Act
        let result = handler.handle(command).await;
        
        // Assert
        assert!(result.is_ok());
    }
}
```

### Step 4: Add Documentation

Document your handler:
```rust
//! My handler module
//! 
//! This handler does X by:
//! 1. Validating input
//! 2. Calling service
//! 3. Formatting result

/// Handler for mycommand
/// 
/// # Examples
/// 
/// ```
/// let handler = MyHandler::new(...);
/// let result = handler.handle(command).await?;
/// ```
pub struct MyHandler {
    // ...
}
```

---

## Performance Characteristics

| Handler | Latency | Memory | Throughput | Limiting Factor |
|---------|---------|--------|------------|-----------------|
| PingHandler | <1μs | 0 KB | Unlimited | CPU |
| AllowHandler | <50ms | ~2 KB | ~100/sec | Database |
| HelpHandler | <100ms | ~10 KB | ~50/sec | Text generation |
| BroadcastHandler | Variable | ~100 KB | ~5/sec | Discord API |
| RateLimitMiddleware | ~5-10ms | ~100 B | ~50k/sec | Redis RTT |

---

## Best Practices

### Do's ✅

- Use async/await throughout
- Implement proper error handling
- Write comprehensive tests
- Document public APIs
- Use type safety
- Handle partial failures
- Profile performance
- Validate all inputs

### Don'ts ❌

- Don't block on async operations
- Don't panic in production code
- Don't ignore errors
- Don't leak sensitive data in logs
- Don't forget cleanup
- Don't hardcode configuration
- Don't skip tests
- Don't trust user input

---

## Migration Checklist

For each handler:

- [ ] Identify pattern (simple/database/service/API)
- [ ] Copy closest example
- [ ] Adapt to specific needs
- [ ] Implement error handling
- [ ] Write unit tests (>70% coverage)
- [ ] Write integration tests
- [ ] Add documentation
- [ ] Run benchmarks
- [ ] Review with team
- [ ] Create PR

---

## Additional Resources

### Documentation
- [Testing Strategy](../testing/comprehensive-strategy.md)
- [GitHub Issues](../issues/README.md)
- [Architecture Guide](../../7-ARCHITECTURE.md)

### External Resources
- [Async Rust Book](https://rust-lang.github.io/async-book/)
- [Tokio Documentation](https://tokio.rs/)
- [Serenity Examples](https://github.com/serenity-rs/serenity/tree/current/examples)
- [Mockall Guide](https://docs.rs/mockall/)

### Community
- Rust Discord: #help channel
- VeraBot Discord: #rust-migration
- Stack Overflow: [rust] tag

---

## Questions?

- **Pattern Selection:** See pattern summary above
- **Testing:** See testing patterns section
- **Performance:** See performance characteristics
- **Issues:** Create GitHub issue with `question` label

---

**Ready to implement?** Pick an example that matches your needs and start coding! 🦀

---

**Last Updated:** December 2024  
**Version:** 1.0  
**Status:** Production Ready
