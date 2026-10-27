"""Pitch-check every published vocal against its melody.

python scripts/vocal/audit.py <voiced.json> > audit.jsonl   (voiced.json: npx tsx scripts/vocal/export.ts voiced)
"""
import json, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from qa import check
from paths import AUDIO, MANIFEST
man = json.load(open(MANIFEST))
for mel in json.load(open(sys.argv[1])):
    k = mel["key"]
    if k not in man: continue
    try:
        n, med, bad, octv = check(str(AUDIO / f"{k}.mp3"), mel, man[k][0], 0)
        print(json.dumps({"key": k, "book": mel["book"], "name": mel["name"], "index": mel["index"], "n": n, "median": med, "bad": bad, "octave": octv}, ensure_ascii=False), flush=True)
    except Exception as e:
        print(json.dumps({"key": k, "name": mel["name"], "error": repr(e)}, ensure_ascii=False), flush=True)
