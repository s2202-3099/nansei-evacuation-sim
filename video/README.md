# 避難の流れを地図で見せる動画（Remotion）

親フォルダの `index.html`（南西諸島 住民避難シミュレータ）の既定シナリオを、地図上のアニメーションにした約68秒の動画です。

## 中身

1. タイトル
2. 地図：先島諸島の位置 → 18島の人口 → 1日ごとの避難（定期便での自力退避、小さな島から拠点島への集約、九州・山口への空路・海路）
3. 受入先の比較：九州・山口／全国／鹿児島だけ、の3通りで「先島に残る人」の推移
4. 結び：読み方と注意書き

数字はすべてシミュレータ本体のモデルをそのまま動かして得たものです。手で書き写した値はありません。

## 使い方

```bash
npm i
node scripts/export-sim.mjs   # index.html のモデルを実行して src/data/sim.json を作り直す
npm run dev                   # Remotion Studio でプレビュー
npx remotion render NanseiEvacuation out/nansei-evacuation.mp4
```

`index.html` の前提（PAR や資産の数）を変えたら `export-sim.mjs` を再実行すれば、動画も追従します。

ネットワークが制限された環境では、Remotion が描画用のブラウザを取得できないことがあります。その場合は手元の Chrome Headless Shell を指定してください。

```bash
REMOTION_BROWSER=/path/to/chrome-headless-shell npx remotion render NanseiEvacuation out/nansei-evacuation.mp4
```

## フォント

Noto Sans JP（SIL Open Font License 1.1）を `public/fonts` に同梱しています。
