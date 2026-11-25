"""ナレーションを VOICEVOX（ずんだもん）で作る。

前提: VOICEVOX エンジンが http://127.0.0.1:50021 で動いていること。
  手元なら VOICEVOX アプリを起動しておくだけでよい。Docker なら:
  docker run -d -p 50021:50021 voicevox/voicevox_engine:cpu-latest
使い方: python scripts/make-narration-voicevox.py   （そのあと長さを測って src/data/narration.json を更新する）
数字は「十八」が「ジュウ／ハチ」と切れて読まれるので、原稿ではカタカナで書いている。
音声を使うときは「VOICEVOX:ずんだもん」のクレジット表記が必要。
"""
import io, json, re, sys, urllib.parse, urllib.request, wave
from pathlib import Path

ENGINE = 'http://127.0.0.1:50021'
SPEAKER = 3  # ずんだもん（ノーマル）
SPEED = 1.05
COMMA_PAUSE = 1.5      # 読点「、」の間（エンジン既定の何倍か）
SENTENCE_GAP = 0.55    # 文と文のあいだの息継ぎ（秒）
LEAD, TAIL = 0.15, 0.3
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

def synth(text):
    q = json.loads(post('/audio_query', {'text': text, 'speaker': SPEAKER}))
    q.update(speedScale=SPEED, pauseLengthScale=COMMA_PAUSE,
             prePhonemeLength=0.05, postPhonemeLength=0.05, volumeScale=1.1)
    kana = '/'.join(''.join(m['text'] for m in ap['moras']) + ('、' if ap['pause_mora'] else '')
                    for ap in q['accent_phrases'])
    wav = post('/synthesis', {'speaker': SPEAKER}, json.dumps(q).encode())
    with wave.open(io.BytesIO(wav)) as w:
        return w.getframerate(), w.readframes(w.getnframes()), kana

for line in LINES:
    # 文ごとに分けて合成し、文のあいだに息継ぎの無音を挟む。
    # 1つにまとめて合成すると「。」が「、」と同じ短い間になり、続けて読んでいるように聞こえる
    sentences = [x for x in re.split(r'(?<=[。？！])', line['text']) if x.strip()]
    parts, sr = [], 24000
    for k, sen in enumerate(sentences):
        sr, pcm, kana = synth(sen)
        print(line['id'], kana, file=sys.stderr)
        parts.append(pcm)
        if k < len(sentences) - 1:
            parts.append(b'\0\0' * int(sr * SENTENCE_GAP))
    pcm = b'\0\0' * int(sr * LEAD) + b''.join(parts) + b'\0\0' * int(sr * TAIL)
    with wave.open(str(OUT / f"{line['id']}.wav"), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(pcm)
