# Version Information

**Last Updated:** 2025-12-22T09:46:40.946Z

## Project

- **Name:** verabot
- **Current Version:** 1.0.0
- **Type:** commonjs
- **Main Entry:** src/index.js

## Runtime Requirements

### Node.js & npm

- **Node.js:** v18+
- **npm:** v9+

## Production Dependencies

| Package             | Version  | Purpose |
| ------------------- | -------- | ------- |
| @bull-board/api     | ^6.0.0   |         |
| @bull-board/express | ^6.0.0   |         |
| better-sqlite3      | ^12.0.0  |         |
| bullmq              | ^5.9.0   |         |
| discord.js          | ^14.16.0 |         |
| dotenv              | ^17.0.0  |         |
| express             | ^5.0.0   |         |
| ioredis             | ^5.4.1   |         |
| pino                | ^10.0.0  |         |
| pino-pretty         | ^13.0.0  |         |
| prom-client         | ^15.0.0  |         |
| ws                  | ^8.18.0  |         |
| zod                 | ^4.0.0   |         |

## Development Dependencies

| Package            | Version | Purpose |
| ------------------ | ------- | ------- |
| eslint             | ^9.39.2 |         |
| eslint-plugin-jest | ^29.5.0 |         |
| eslint-plugin-node | ^11.1.0 |         |
| husky              | ^9.1.7  |         |
| jest               | ^30.0.0 |         |
| jest-mock-extended | ^4.0.0  |         |
| lint-staged        | ^16.2.7 |         |
| prettier           | ^3.7.4  |         |

## Compatibility Matrix

### Critical Dependencies

- **discord.js**: ^14.16.0
- **express**: ^5.0.0
- **better-sqlite3**: ^12.0.0
- **bullmq**: ^5.9.0
- **ioredis**: ^5.4.1
- **pino**: ^10.0.0
- **zod**: ^4.0.0
- **jest**: ^30.0.0
- **eslint**: ^9.39.2
- **prettier**: ^3.7.4

### Important Notes

- Node.js: v18+
- npm: v9+
- Discord.js v14+ requires Node.js v16.11.0 or higher
- Express v5.x dropped Node.js v14 and v15 support
- Bull/BullMQ requires Redis 5.0 or higher
