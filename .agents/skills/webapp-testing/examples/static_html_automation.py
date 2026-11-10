"""
static_html_automation.py — Example of automating static HTML files with Playwright.

Demonstrates opening local files directly via file:// URLs without starting a web server.
"""

import sys
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

def test_static_html(file_path: str):
    abs_path = os.path.abspath(file_path)
    file_url = Path(abs_path).as_uri()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print(f"Opening static file: {file_url}")
        page.goto(file_url)

        title = page.title()
        print(f"Page title: {title}")

        # Example assertions
        headings = page.locator("h1, h2, h3").all()
        print(f"Found {len(headings)} heading(s):")
        for h in headings:
            print(f"  - {h.inner_text().strip()}")

        browser.close()

if __name__ == "__main__":
    target_file = sys.argv[1] if len(sys.argv) > 1 else "index.html"
    test_static_html(target_file)
