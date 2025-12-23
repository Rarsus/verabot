# Phase 4: Interfaces Issues (2-3 weeks)

## ISSUE-4.1.1: Discord Integration

**Epic:** Phase 4 - Interfaces  
**Priority:** P0 - Critical  
**Effort:** 8 Story Points  
**Dependencies:** ISSUE-2.1.1, ISSUE-3.1.1

### Description
Integrate Serenity Discord library for bot functionality.

### Acceptance Criteria
- [ ] Discord client initialization
- [ ] Event handler implementation
- [ ] Message parsing
- [ ] Command extraction from messages
- [ ] Response formatting
- [ ] Error handling
- [ ] Integration tests with mock Discord

---

## ISSUE-4.1.2: Slash Command Registration

**Epic:** Phase 4 - Interfaces  
**Priority:** P0 - Critical  
**Effort:** 5 Story Points  
**Dependencies:** ISSUE-4.1.1, ISSUE-2.1.3

### Description
Implement automatic slash command registration with Discord API.

### Acceptance Criteria
- [ ] Slash command builder from registry
- [ ] Global vs guild command support
- [ ] Automatic registration on startup
- [ ] Command update detection
- [ ] Interaction handling
- [ ] Option parsing
- [ ] Unit tests

---

## ISSUE-4.2.1: HTTP Server Setup

**Epic:** Phase 4 - Interfaces  
**Priority:** P1 - High  
**Effort:** 5 Story Points  
**Dependencies:** ISSUE-3.3.1

### Description
Set up HTTP server for health checks, metrics, and admin API.

### Acceptance Criteria
- [ ] Actix-web HTTP server
- [ ] Health check endpoint
- [ ] Metrics endpoint
- [ ] Admin API endpoints
- [ ] Authentication middleware
- [ ] Error responses
- [ ] Integration tests

---

## ISSUE-4.3.1: WebSocket Support

**Epic:** Phase 4 - Interfaces  
**Priority:** P2 - Medium  
**Effort:** 5 Story Points  
**Dependencies:** ISSUE-2.1.1

### Description
Add WebSocket interface for real-time command execution.

### Acceptance Criteria
- [ ] WebSocket server with tokio-tungstenite
- [ ] Connection handling
- [ ] Command parsing from WS messages
- [ ] Result streaming
- [ ] Authentication
- [ ] Error handling
- [ ] Integration tests

---

## Summary

Phase 4 builds interfaces:

- **ISSUE-4.1.1**: Discord Integration (8 SP)
- **ISSUE-4.1.2**: Slash Command Registration (5 SP)
- **ISSUE-4.2.1**: HTTP Server Setup (5 SP)
- **ISSUE-4.3.1**: WebSocket Support (5 SP)

**Total: 23 Story Points (~2-3 weeks)**
