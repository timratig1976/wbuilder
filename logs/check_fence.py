import json

lines = [l.strip() for l in open('/Users/timratig/wbuilder/logs/ai-runs.ndjson') if l.strip()]
entries = [json.loads(l) for l in lines]

# Check last 20 entries for fence issues
for e in entries[-20:]:
    html = e.get('outputHtml', '')
    stripped = html.strip()
    has_fence = stripped.startswith('```')
    has_backtick = '`' in stripped[:20]
    if has_fence or has_backtick:
        print(f'FENCE FOUND: [{e["step"]}] {e["sectionType"]} | first80={repr(stripped[:80])}')
    else:
        print(f'ok: [{e["step"]}] {e["sectionType"]} | first30={repr(stripped[:30])}')
