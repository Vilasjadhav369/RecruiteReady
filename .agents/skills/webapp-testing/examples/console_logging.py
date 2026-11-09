"""
console_logging.py — Example of capturing browser console logs and errors during Playwright runs.

Captures all runtime console messages (info, warnings, errors) and unhandled page exceptions.
"""

import sys
from playwright.sync_api import sync_playwright

def run_with_logging(url: str):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        console_logs = []
        page_errors = []

        page.on("console", lambda msg: console_logs.append(f"[{msg.type.upper()}] {msg.text}"))
        page.on("pageerror", lambda err: page_errors.append(str(err)))

        print(f"Navigating to {url}...")
        page.goto(url)
        page.wait_for_load_state("networkidle")

        print(f"\n--- Captured Console Logs ({len(console_logs)}) ---")
        for log in console_logs:
            print(f"  {log}")

        print(f"\n--- Captured Page Errors ({len(page_errors)}) ---")
        for err in page_errors:
            print(f"  [ERROR] {err}")

        browser.close()

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:5173"
    run_with_logging(target)
