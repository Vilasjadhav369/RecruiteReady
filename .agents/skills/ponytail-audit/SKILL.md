---
name: ponytail-audit
description: "Scan the repository for over-engineering, dead abstractions, and bloat."
license: MIT
---

# Ponytail Audit

Audit repository code for architectural bloat, single-caller abstractions, and dead code.

## Audit Targets
1. Single-use wrappers, interfaces with single implementations, and premature factory patterns.
2. Hand-rolled utility functions replicating built-in language APIs.
3. External dependencies used for trivial tasks (e.g., micro-packages that a native one-liner handles).
4. Unused exports, deprecated dead paths, and dead parameters.

## Report Format
List high-impact targets grouped by estimated line savings with clear replacement recommendations.
