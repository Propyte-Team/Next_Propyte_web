# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it responsibly:

1. **Do NOT** open a public GitHub issue
2. Email: marketing@propyte.com
3. Include: description, steps to reproduce, potential impact

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest  | Yes       |

## Security Practices

- All secrets stored in environment variables (never hardcoded)
- Supabase Row Level Security (RLS) enabled on all tables
- Service role key used only in server-side code
- Form inputs validated with Zod schemas
- Rate limiting on public API endpoints
- CSRF protection on form submissions
- Content Security Policy headers configured
- Dependencies audited regularly with `npm audit`
