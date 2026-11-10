---
name: gravitas-highstakes
description: Mandatory checkpoint and safety override skill for high-risk or irreversible operations such as database schema migrations, file deletions, auth/security rule changes, and git force-pushes.
license: MIT
---

# Gravitas High-Stakes Checkpoint Skill

Trigger this skill whenever an operation carries high risk, broad blast radius, or hard-to-reverse state mutations.

## High-Stakes Triggers
- Database schema changes or migrations (Mongoose models, migrations, column drops)
- Authentication, authorization, session management, or encryption changes
- Bulk data modifications or mass deletion scripts
- Production environment configurations and secret handling (never touch `.env`)
- Git history rewriting (`git push --force`, `git reset --hard`)

## Mandatory Checkpoint Protocol
1. **Explicit Pre-flight Review:**
   State the exact blast radius, rollback plan, and affected downstream dependencies before touching the code.
2. **Double Grounding:**
   Read all consuming endpoints, middleware, and tests that touch the affected schema or security boundary.
3. **Hermetic Mock Testing:**
   Write or run isolated unit tests with mocked models/services to verify failure modes, permission denials, and boundary conditions.
4. **Never Bypass Safeguards:**
   Never disable security linters, weaken authorization checks, or comment out validation guards.
