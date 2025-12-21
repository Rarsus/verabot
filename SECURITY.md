# Security Policy

## Supported Versions

| Version | Supported          | Node.js Version |
| ------- | ------------------ | --------------- |
| 1.0.x   | ✅ Current         | 24.x            |

## Reporting Security Vulnerabilities

If you discover a security vulnerability, please email security@example.com instead of using the issue tracker.

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if available)

## Security Best Practices

### Environment Variables
- Never commit `.env` files to version control
- Use `.env.example` to document required variables
- Store secrets securely in production environments

### Dependencies
- All dependencies are regularly updated
- Security audits performed via `npm audit`
- No known CVEs in current version
- Pin critical dependency versions if needed

### Code Security
- All code reviewed before merge
- Linting enforced via ESLint
- Pre-commit hooks via Husky
- Jest testing with code coverage

### Infrastructure Security
- Use HTTPS for all Discord API communications
- Validate all user input via Zod schema validation
- Rate limiting on messaging commands
- Permission-based command execution

## Current Vulnerability Status

**Last Audit**: December 21, 2025
**Status**: ✅ 0 known vulnerabilities
**Audit Tool**: npm audit

## Dependency Update Schedule

- **Security patches**: Immediate
- **Minor updates**: Monthly review
- **Major updates**: Quarterly review with breaking change assessment

## Contact

For security concerns, contact: security@example.com
