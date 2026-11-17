# HW15 — Security Audit + Final Deployment

**Week 15 · DSAW · Universidad de La Sabana**

## Objective

Audit your project's security and ensure the final Vercel deployment is stable and clean.

## Deliverables

### `security-audit.md`

A completed checklist with justifications. For each item, explain **how you addressed it** — not just yes/no.

```markdown
## Security Audit — [Project name]

### XSS (Cross-Site Scripting)
- [ ] Are user inputs sanitized before being rendered in the DOM?
- How you addressed it: ...

### NoSQL Injection
- [ ] Are fields validated before being passed to Mongoose queries?
- How you addressed it: ...

### CORS
- [ ] Is CORS configured to allow only your frontend domain?
- How you addressed it: ...

### Server-side input validation
- [ ] Are all user inputs validated on the server, not just the client?
- How you addressed it: ...

### Environment variables
- [ ] Are there zero hardcoded secrets (API keys, JWT secret, DB string) in the source code?
- How you addressed it: ...

### Security headers (helmet)
- [ ] Is the helmet middleware present in Express?
- How you addressed it: ...
```

### Helmet in Express

```bash
npm install helmet
```

```javascript
import helmet from 'helmet';
app.use(helmet());
```

### `deployment.txt`

The final URL of the complete project on Vercel — this is the URL you will use on Demo Day.

## Layer 2

Add basic rate limiting with `express-rate-limit` to protect your auth endpoints:

```bash
npm install express-rate-limit
```

## AI Log (`AI-LOG.md`)

- Did you use AI to identify vulnerabilities in your code? Did it find anything you hadn't noticed?
- Which vulnerability was hardest to understand and fix?

## Deployment

Vercel — the complete project (frontend + backend + DB) must work from the public URL.

## Autograding

The pipeline will check:
- ✅ `security-audit.md`, `deployment.txt`
- ✅ ESLint passes with no errors
- ✅ URL responds with HTTP 200
- ✅ Complete audit with justifications, helmet, server-side validation, no hardcoded secrets (reviewed by Claude)

> **Submission rule:** If it is not deployed and public on Vercel, it cannot be graded.
> **This is the final state of the project.** Demo Day is the following week.
