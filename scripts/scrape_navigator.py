#!/usr/bin/env python3
"""Cache Purdue Innovates' public embedded Navigator resource list."""
import json
from pathlib import Path
import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
URL = "https://purdueinnovates.org/navigator/"
response = requests.get(URL, headers={"Accept-Encoding": "gzip, deflate", "User-Agent": "PurdueFounderMap/1.0 (+https://github.com/sharziki/purdue-founder-map)"}, timeout=30)
response.raise_for_status()
soup = BeautifulSoup(response.content, "html.parser")
payload = next((json.loads(x.string or x.get_text()) for x in soup.select('script[type="application/json"]') if '"res"' in (x.string or x.get_text())[:100]), None)
if not payload or len(payload.get("res", [])) < 80:
    raise SystemExit("Navigator resource payload missing or unexpectedly small; existing cache preserved")
rows = [{key: item.get(key) for key in ("uid", "name", "description", "url", "type", "aud", "stages")} for item in payload["res"]]
(ROOT / "data" / "navigator.json").write_text(json.dumps({"source": URL, "resources": rows}, indent=2) + "\n")
print(f"Cached {len(rows)} first-party Navigator records")
