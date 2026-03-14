import json
from collections import defaultdict

lines = [l for l in open('/Users/timratig/wbuilder/logs/ai-runs.ndjson').read().strip().split('\n') if l.strip()]
entries = []
for l in lines:
    try: entries.append(json.loads(l))
    except: pass

runs = defaultdict(list)
for e in entries:
    runs[e.get('runId','unknown')].append(e)

for rid, ents in sorted(runs.items(), key=lambda x: x[1][0].get('ts',''))[-3:]:
    sections = [e.get('sectionType') for e in ents if e.get('step') == 'generate']
    errors = [e for e in ents if e.get('status') == 'error']
    # Wall-clock: last timestamp - first timestamp (correct for parallel runs)
    timestamps = [e.get('ts','') for e in ents if e.get('ts')]
    wall_ms = 0
    if len(timestamps) >= 2:
        from datetime import datetime
        try:
            t0 = datetime.fromisoformat(timestamps[0].replace('Z','+00:00'))
            t1 = datetime.fromisoformat(timestamps[-1].replace('Z','+00:00'))
            wall_ms = int((t1-t0).total_seconds()*1000) + ents[-1].get('durationMs',0)
        except: pass
    print(f'RUN: {rid}')
    print(f'  Sections ({len(sections)}): {sections}')
    print(f'  Wall-clock: {round(wall_ms/1000,1)}s  |  Errors: {len(errors)}')
    for e in ents:
        out = e.get('outputHtml','')
        err = f' ERR={e.get("error","")}' if e.get('status') == 'error' else ''
        short = ' *** TOO SHORT ***' if len(out) < 100 and e.get('step') == 'generate' else ''
        print(f'    [{e.get("step","?"):8s}] {e.get("sectionType","?"):15s} {e.get("model","?"):12s} {e.get("status","?"):8s} {e.get("durationMs")}ms out={len(out)}chars{err}{short}')
    print()
