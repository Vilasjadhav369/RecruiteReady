---
name: webapp-testing
description: Toolkit for interacting with and testing local web applications using Playwright. Supports verifying frontend functionality, debugging UI behavior, capturing browser screenshots, and viewing browser logs.
license: Complete terms in LICENSE.txt
---

# Web Application Testing

Toolkit for interacting with and testing local web applications using Playwright. Supports verifying frontend functionality, debugging UI behavior, capturing browser screenshots, and viewing browser logs.

## Decision tree: choosing your approach

Follow this decision tree when testing web applications:

1. **Is it static HTML?**
   - **Yes**: Read the HTML file directly to identify selectors.
     - **Success**: Write a Playwright script using discovered selectors.
     - **Fails/Incomplete**: Treat as dynamic (see below).
   - **No (dynamic webapp)**: Is the server already running?
     - **No**: Run `python scripts/with_server.py --help` to see how to start the server, then use the helper to launch the server and run your Playwright script.
     - **Yes**: Use the **Reconnaissance-then-action** pattern:
       1. Navigate to the page and wait for `networkidle`.
       2. Take a screenshot or inspect DOM elements.
       3. Identify selectors from the rendered state.
       4. Execute actions with discovered selectors.

## Core testing workflow: reconnaissance-then-action

For dynamic applications, never guess selectors before inspecting the rendered state.

1. **Navigate and wait**:
   ```python
   page.goto(url)
   page.wait_for_load_state('networkidle')
   ```

2. **Inspect rendered state**:
   - Take a screenshot: `page.screenshot(path='/tmp/screenshot.png')`
   - Or dump HTML: `print(page.content())`
   - Or query elements: search for inputs, buttons, headings, links.

3. **Identify stable selectors**:
   - Prefer role-based locators: `page.get_by_role("button", name="...")`
   - Prefer labels: `page.get_by_label("...")`
   - Prefer text: `page.get_by_text("...")`
   - Prefer test IDs: `page.get_by_test_id("...")`

4. **Execute actions and assertions**:
   - Fill inputs, click buttons, assert visibility and content.

## Managing local servers with with_server.py

When a server is not running, use `scripts/with_server.py` to start it, wait for it to be ready, run your test, and shut it down cleanly.

### Usage examples:

**Single server (e.g., Vite/React):**
```bash
python scripts/with_server.py --server "npm run dev" --port 5173 -- python test_script.py
```

**Multiple servers (e.g., backend API + frontend):**
```bash
python scripts/with_server.py \
  --server "cd backend && npm start" --port 5000 \
  --server "cd frontend && npm run dev" --port 5173 \
  -- python test_script.py
```

### Key guidelines:
- Always run `python scripts/with_server.py --help` to review supported options.
- Treat helper scripts as tested black-box utilities to keep your context window focused.

## Critical pitfalls to avoid

- **Inspecting DOM too early**: Always wait for `page.wait_for_load_state('networkidle')` or explicit element states before inspecting.
- **Brittle selectors**: Avoid auto-generated or deeply nested CSS/XPath selectors. Prefer semantic, user-facing locators.
- **Unclosed browsers**: Always ensure the browser closes cleanly (use context managers or `try...finally`).
- **Ignoring console logs**: Capture page console messages (`page.on('console', ...)`) when debugging failures.
