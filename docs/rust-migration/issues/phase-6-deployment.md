# Phase 6: Deployment Issues (1-2 weeks)

## ISSUE-6.1.1: Performance Optimization

**Epic:** Phase 6 - Deployment  
**Priority:** P1 - High  
**Effort:** 8 Story Points  
**Dependencies:** All Phase 5 issues

### Description
Optimize performance to meet production requirements: <200ms command latency, 1000 cmd/sec throughput.

### Acceptance Criteria
- [ ] Command execution <200ms average
- [ ] 1000 commands/second throughput
- [ ] Memory usage <100MB idle
- [ ] Benchmarks for all handlers
- [ ] Performance regression tests
- [ ] Profiling with flamegraph
- [ ] Optimization documentation

### Implementation Highlights
```rust
// Benchmarking with criterion
use criterion::{black_box, criterion_group, criterion_main, Criterion};

fn bench_ping_handler(c: &mut Criterion) {
    let handler = PingHandler::new();
    let rt = tokio::runtime::Runtime::new().unwrap();
    
    c.bench_function("ping_handler", |b| {
        b.iter(|| {
            rt.block_on(async {
                let cmd = Command::builder()
                    .name("ping")
                    .user_id("12345")
                    .build()
                    .unwrap();
                
                handler.handle(black_box(cmd)).await
            })
        })
    });
}

criterion_group!(benches, bench_ping_handler);
criterion_main!(benches);
```

---

## ISSUE-6.2.1: Docker & Deployment

**Epic:** Phase 6 - Deployment  
**Priority:** P0 - Critical  
**Effort:** 5 Story Points  
**Dependencies:** ISSUE-6.1.1

### Description
Create production-ready Docker image and deployment configuration.

### Acceptance Criteria
- [ ] Multi-stage Dockerfile
- [ ] Optimized image size (<50MB)
- [ ] Health checks in container
- [ ] Docker Compose for local development
- [ ] Kubernetes manifests
- [ ] Deployment documentation
- [ ] Rollback procedures

### Implementation Highlights

**Dockerfile:**
```dockerfile
# Build stage
FROM rust:1.75-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache musl-dev

# Copy manifests
COPY Cargo.toml Cargo.lock ./
COPY core/Cargo.toml core/
COPY app/Cargo.toml app/
COPY infra/Cargo.toml infra/
COPY handlers/Cargo.toml handlers/
COPY verabot/Cargo.toml verabot/

# Build dependencies (cached layer)
RUN mkdir -p core/src app/src infra/src handlers/src verabot/src && \
    echo "fn main() {}" > verabot/src/main.rs && \
    cargo build --release && \
    rm -rf core/src app/src infra/src handlers/src verabot/src

# Copy source code
COPY core/ core/
COPY app/ app/
COPY infra/ infra/
COPY handlers/ handlers/
COPY verabot/ verabot/

# Build application
RUN cargo build --release --bin verabot

# Runtime stage
FROM alpine:latest

RUN apk add --no-cache ca-certificates

WORKDIR /app

# Copy binary from builder
COPY --from=builder /app/target/release/verabot /usr/local/bin/verabot

# Create non-root user
RUN addgroup -g 1000 verabot && \
    adduser -D -u 1000 -G verabot verabot && \
    chown -R verabot:verabot /app

USER verabot

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

EXPOSE 3000 3001

CMD ["verabot"]
```

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  verabot:
    build: ./rust
    container_name: verabot
    environment:
      - DISCORD_TOKEN=${DISCORD_TOKEN}
      - DISCORD_CLIENT_ID=${DISCORD_CLIENT_ID}
      - DATABASE_URL=/data/verabot.db
      - REDIS_URL=redis://redis:6379
      - LOG_LEVEL=info
      - HEALTH_PORT=3000
      - METRICS_PORT=3001
    volumes:
      - ./data:/data
    ports:
      - "3000:3000"
      - "3001:3001"
    depends_on:
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 40s

  redis:
    image: redis:7-alpine
    container_name: verabot-redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    restart: unless-stopped

volumes:
  redis-data:
```

**Kubernetes Deployment:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: verabot
  labels:
    app: verabot
spec:
  replicas: 2
  selector:
    matchLabels:
      app: verabot
  template:
    metadata:
      labels:
        app: verabot
    spec:
      containers:
      - name: verabot
        image: verabot:latest
        ports:
        - containerPort: 3000
          name: health
        - containerPort: 3001
          name: metrics
        env:
        - name: DISCORD_TOKEN
          valueFrom:
            secretKeyRef:
              name: verabot-secrets
              key: discord-token
        - name: DATABASE_URL
          value: "/data/verabot.db"
        - name: REDIS_URL
          value: "redis://verabot-redis:6379"
        - name: LOG_LEVEL
          value: "info"
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        volumeMounts:
        - name: data
          mountPath: /data
      volumes:
      - name: data
        persistentVolumeClaim:
          claimName: verabot-data
---
apiVersion: v1
kind: Service
metadata:
  name: verabot
spec:
  selector:
    app: verabot
  ports:
  - name: health
    port: 3000
    targetPort: 3000
  - name: metrics
    port: 3001
    targetPort: 3001
  type: ClusterIP
```

---

## Summary

Phase 6 finalizes deployment:

- **ISSUE-6.1.1**: Performance Optimization (8 SP)
- **ISSUE-6.2.1**: Docker & Deployment (5 SP)

**Total: 13 Story Points (~1-2 weeks)**

---

## Overall Migration Summary

### Total Story Points: 158 SP (~14-18 weeks)

- Phase 1: Setup - 18 SP (2 weeks)
- Phase 2: Core Architecture - 37 SP (3-4 weeks)
- Phase 3: Infrastructure - 23 SP (3-4 weeks)
- Phase 4: Interfaces - 23 SP (2-3 weeks)
- Phase 5: Handlers - 44 SP (4-5 weeks)
- Phase 6: Deployment - 13 SP (1-2 weeks)

### Total Issues: 25+

All issues are:
✅ Production-ready
✅ Fully documented
✅ Have acceptance criteria
✅ Include code examples
✅ Have testing requirements
✅ Track dependencies
✅ Effort estimated
