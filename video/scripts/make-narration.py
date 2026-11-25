"""ナレーション音声を Open JTalk（pyopenjtalk-plus）で作り、長さを src/data/narration.json に書く。

使い方: pip install pyopenjtalk-plus numpy && python scripts/make-narration.py
別の音声（自分の録音や VOICEVOX など）に差し替えるときは、public/narration/<id>.wav を
置き換えてから --measure-only を付けて実行すれば、長さだけ測り直して動画の尺が追従する。
"""
import json, sys, wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LINES = json.loads((ROOT / 'scripts/narration.json').read_text())
OUT = ROOT / 'public/narration'
OUT.mkdir(parents=True, exist_ok=True)

if '--measure-only' not in sys.argv:
    import numpy as np
    import pyopenjtalk
    for line in LINES:
        x, sr = pyopenjtalk.tts(line['text'], speed=1.08)
        pad = np.zeros(int(sr * 0.15))
        x = np.concatenate([pad, x, pad])
        x = x / max(1.0, np.abs(x).max() / 30000)  # クリップしないよう正規化
        with wave.open(str(OUT / f"{line['id']}.wav"), 'wb') as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
            w.writeframes(x.astype(np.int16).tobytes())

durations = {}
for line in LINES:
    with wave.open(str(OUT / f"{line['id']}.wav")) as w:
        durations[line['id']] = round(w.getnframes() / w.getframerate(), 3)
(ROOT / 'src/data/narration.json').write_text(json.dumps(durations, ensure_ascii=False, indent=1))
print(durations)
