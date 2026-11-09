"""
element_discovery.py — Example of dynamic element discovery using Playwright.

Demonstrates discovering inputs, buttons, links, and text on a rendered page
during the reconnaissance phase before executing actions.
"""

import sys
from playwright.sync_api import sync_playwright

def discover_page_elements(url: str):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print(f"Navigating to {url}...")
        page.goto(url)
        page.wait_for_load_state("networkidle")

        print("\n--- Discovered Inputs ---")
        inputs = page.locator("input, textarea, select").all()
        for i, el in enumerate(inputs, 1):
            name = el.get_attribute("name") or el.get_attribute("id") or el.get_attribute("placeholder") or "unnamed"
            input_type = el.get_attribute("type") or "text"
            print(f"  [{i}] type={input_type} identifier={name}")

        print("\n--- Discovered Buttons ---")
        buttons = page.locator("button, [role='button'], input[type='submit']").all()
        for i, btn in enumerate(buttons, 1):
            text = btn.inner_text().strip() or btn.get_attribute("value") or "unlabeled"
            print(f"  [{i}] label='{text}'")

        print("\n--- Discovered Links ---")
        links = page.locator("a[href]").all()
        for i, link in enumerate(links[:10], 1):
            text = link.inner_text().strip() or "unlabeled"
            href = link.get_attribute("href")
            print(f"  [{i}] text='{text}' -> {href}")

        browser.close()

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:5173"
    discover_page_elements(target)
