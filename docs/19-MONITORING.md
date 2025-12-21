# 19. Monitoring

Health checks, metrics, and alerting for production.

---

## Health Checks

### Endpoint: `/health`

```bash
curl http://localhost:9090/health
```

### Response

```json
{
  "status": "healthy",
  "timestamp": 1703001600000,
  "uptime": 3600,
  "checks": {
    "database": "ok",
    "redis": "ok",
    "discord": "connected"
  }
}
```

### Health Check Frequency

- Internal: Every 30 seconds
- External: Every 60 seconds
- Alert threshold: 2 consecutive failures

---

## Metrics

### Endpoint: `/metrics`

Returns Prometheus-format metrics.

### Key Metrics

- `bot_commands_executed_total` - Total commands executed
- `bot_command_duration_seconds` - Command execution time
- `bot_command_errors_total` - Command failures
- `bot_queue_jobs_total` - Job queue statistics
- `bot_uptime_seconds` - Bot uptime
- `discord_api_latency` - API response time
- `redis_commands_total` - Redis operations

### Prometheus Config

```yaml
scrape_configs:
  - job_name: 'verabot'
    static_configs:
      - targets: ['localhost:9090']
    scrape_interval: 15s
```

---

## Logging

### Log Levels

- `error` - Critical issues requiring attention
- `warn` - Warnings of potential issues
- `info` - Important events
- `debug` - Detailed debugging information

### Log Output

```bash
# View logs
docker logs -f verabot

# Follow recent logs
tail -f logs/app.log
```

### Log Structure

```json
{
  "level": "info",
  "message": "Command executed",
  "timestamp": "2024-01-01T12:00:00Z",
  "command": "help",
  "userId": "123",
  "duration": 150
}
```

---

## Job Queue Monitoring

### Admin Dashboard

Access Bull Board UI: `http://localhost:3000/admin/queues`

### Queue Metrics

- **Active Jobs:** Currently processing
- **Waiting Jobs:** In queue
- **Completed Jobs:** Successfully processed
- **Failed Jobs:** Error count
- **Delayed Jobs:** Scheduled for later

### Job Inspection

```javascript
const job = await queue.getJob(jobId);
console.log(job.data);
console.log(job.progress());
console.log(job.logs);
```

---

## Alerting

### Alert Rules

```yaml
groups:
  - name: verabot
    rules:
      - alert: BotUnhealthy
        expr: bot_up != 1
        for: 2m
        annotations:
          summary: "Bot is down"
      
      - alert: HighErrorRate
        expr: rate(bot_errors_total[5m]) > 0.05
        annotations:
          summary: "Error rate exceeds 5%"
      
      - alert: SlowCommands
        expr: histogram_quantile(0.95, bot_command_duration_seconds) > 1
        annotations:
          summary: "Commands are slow"
```

### Notification Channels

- Slack
- Discord
- Email
- PagerDuty

---

## Performance Monitoring

### Database Performance

```sql
-- Query execution time
EXPLAIN QUERY PLAN SELECT ...
```

### Redis Performance

```bash
redis-cli INFO stats
redis-cli MONITOR
```

### Memory Usage

```bash
node --max-old-space-size=512
```

---

## Troubleshooting Alerts

| Alert | Cause | Action |
|-------|-------|--------|
| Bot Down | Process crashed | Restart container |
| High Error Rate | Bad deployment | Rollback version |
| Slow Commands | DB bottleneck | Check queries |
| Queue Backlog | Job processor slow | Scale workers |
| Memory Leak | Memory not freed | Restart and profile |

---

**Previous:** [Deployment](./18-DEPLOYMENT.md) | **Next:** [Glossary](./21-GLOSSARY.md)
