"""ナレーションを VOICEVOX（ずんだもん）で作る。

前提: VOICEVOX エンジンが http://127.0.0.1:50021 で動いていること。
  手元なら VOICEVOX アプリを起動しておくだけでよい。Docker なら:
  docker run -d -p 50021:50021 voicevox/voicevox_engine:cpu-latest
使い方: python scripts/make-narration-voicevox.py   （そのあと長さを測って src/data/narration.json を更新する）
音声を使うときは「VOICEVOX:ずんだもん」のクレジット表記が必要。
"""
import json, sys, urllib.parse, urllib.request
from pathlib import Path

ENGINE = 'http://127.0.0.1:50021'
SPEAKER = 3  # ずんだもん（ノーマル）
SPEED = 1.12
ROOT = Path(__file__).resolve().parent.parent
LINES = json.loads((ROOT / 'scripts/narration.json').read_text())
OUT = ROOT / 'public/narration'
OUT.mkdir(parents=True, exist_ok=True)
opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))  # localhost にプロキシを通さない

def post(path, params, body=None):
    url = f'{ENGINE}{path}?{urllib.parse.urlencode(params)}'
    req = urllib.request.Request(url, data=body or b'', method='POST',
                                 headers={'Content-Type': 'application/json'})
    with opener.open(req) as r:
        return r.read()

for line in LINES:
    q = json.loads(post('/audio_query', {'text': line['text'], 'speaker': SPEAKER}))
    q.update(speedScale=SPEED, prePhonemeLength=0.15, postPhonemeLength=0.2, volumeScale=1.1)
    # 読みの確認用（誤読があれば原稿をひらがなに直す）
    kana = '/'.join(''.join(m['text'] for m in ap['moras']) for ap in q['accent_phrases'])
    print(line['id'], kana, file=sys.stderr)
    wav = post('/synthesis', {'speaker': SPEAKER}, json.dumps(q).encode())
    (OUT / f"{line['id']}.wav").write_bytes(wav)
