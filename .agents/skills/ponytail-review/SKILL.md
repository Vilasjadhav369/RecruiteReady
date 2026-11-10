---
name: ponytail-review
description: "Review a diff for over-engineering. Finds what to delete: reinvented stdlib, needless deps, speculative abstractions. One line per finding."
license: MIT
---

# Ponytail Review

Review changes exclusively for over-engineering and code bloat. Your goal is to find what can be safely cut, deleted, or simplified.

## Evaluation Categories
- `delete:` Dead code, unused flexibility, speculative features, or orphaned helpers that should be removed.
- `stdlib:` Hand-rolled or custom utility implementations that are already provided natively by the language's standard library.
- `native:` External dependencies or custom code doing tasks that the browser/runtime platform natively supports.
- `yagni:` Over-engineered abstractions with only a single implementation, unnecessary configuration options nobody sets, or layers with only one caller.
- `shrink:` Verbose implementation logic that can achieve the exact same behavior with fewer, simpler lines.

## Output Format
One line per finding:
`<file>:<line> [<tag>] <what to cut> -> <what replaces it>`

Conclude with:
`net: -<N> lines possible`

## Safety Invariant
Lazy, not negligent: Never suggest deleting trust-boundary validation, security checks, error recovery paths, or accessibility attributes.
