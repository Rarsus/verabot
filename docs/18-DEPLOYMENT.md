# 18. Deployment

Production deployment and configuration guide.

---

## System Requirements

- **Node.js:** 18+ (LTS recommended)
- **Redis:** 6+ (for job queue and caching)
- **SQLite:** 3+ (bundled with Node)
- **Memory:** 256MB minimum, 512MB recommended
- **Disk:** 1GB for logs and database
- **Network:** Outbound access to Discord API, HuggingFace (optional)

---

## Docker Deployment

### Build Image

```bash
docker build -t verabot .
```

### Run Container

```bash
docker run -d \
  --name verabot \
  -e DISCORD_TOKEN=$TOKEN \
  -e CLIENT_ID=$CLIENT_ID \
  -e REDIS_URL=redis://host:6379 \
  -v /data/db:/app/data \
  -v /data/logs:/app/logs \
  verabot
```

### Docker Compose

```yaml
version: '3.8'
services:
  redis:
    image: redis:7
    ports:
      - '6379:6379'

  verabot:
    build: .
    environment:
      - DISCORD_TOKEN=${DISCORD_TOKEN}
      - CLIENT_ID=${CLIENT_ID}
      - REDIS_URL=redis://redis:6379
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    depends_on:
      - redis
```

---

## Environment Configuration

### Critical Variables

```env
# Discord
DISCORD_TOKEN=your_bot_token
CLIENT_ID=your_client_id

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_password_optional

# App
NODE_ENV=production
LOG_LEVEL=info
```

### Optional Variables

```env
HUGGINGFACE_API_KEY=hf_xxx
SENTRY_DSN=https://xxx
METRICS_PORT=9090
ADMIN_PORT=3000
```

---

## Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Redis instance available and accessible
- [ ] Database migrations run
- [ ] Logs directory writable
- [ ] Discord bot permissions correct
- [ ] Slash commands registered
- [ ] Load testing completed
- [ ] Error tracking configured (Sentry optional)

---

## Monitoring Setup

### Health Check

```bash
curl http://localhost:9090/health
```

### Metrics Endpoint

```bash
curl http://localhost:9090/metrics
```

### Job Queue Admin

```
http://localhost:3000/admin/queues
```

---

## Scaling

### Horizontal Scaling

- Multiple bot instances with shared Redis/SQLite
- Load balance WebSocket connections
- Distributed job processing

### Performance Tuning

- Increase Redis connection pool
- Configure database connection pooling
- Adjust job queue concurrency
- Monitor memory usage

---

## Rollback Procedure

1. Keep previous image tagged:

   ```bash
   docker tag verabot:latest verabot:previous
   ```

2. If issues occur:

   ```bash
   docker run -d --name verabot-new -e ... verabot:previous
   ```

3. Verify stability before deleting old container

---

**Previous:** [Test Examples](./17-TEST-EXAMPLES.md) | **Next:** [Monitoring](./19-MONITORING.md)
