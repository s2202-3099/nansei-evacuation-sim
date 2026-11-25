// index.html のモデル部分をそのまま切り出して実行し、動画用のJSONを書き出す。
// 使い方: node scripts/export-sim.mjs  （モデルを変えたら再実行する）
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const html = fs.readFileSync(path.resolve(import.meta.dirname, '../../index.html'), 'utf8');
const start = html.indexOf('/* ===== 島（先島・有人14島） ===== */');
const end = html.indexOf('function addCoast(map)');
if (start < 0 || end < 0) throw new Error('index.html のモデル部分が見つかりません');

const code = html.slice(start, end) + `
;globalThis.__out = (() => {
  const scenarios = {};
  for (const dest of ['kagoshima', 'kyushu', 'national']) {
    const P = {...PAR, dest};
    const R = simulate(P);
    const A = assets(P);
    // 日ごとの幹線のうち海路の比率（道筋の描き分けに使う）
    const seaShare = R.frames.map((f, d) => {
      if (d === 0) return 0;
      const C = dayCaps(A, R.frames[d - 1].deployLeft > 0, d > P.warn, P, d);
      const air = C.airOk + C.airDir, sea = C.seaOk + C.seaDir;
      return air + sea > 0 ? sea / (air + sea) : 0;
    });
    scenarios[dest] = {
      dest, destName: DESTS[dest].n, destCap: A.destCap, aps: DESTS[dest].aps,
      startDelay: P.startDelay, warn: P.warn,
      frames: R.frames.map(f => ({day: f.day, left: f.left, home: f.home, q: f.q,
        inSaki: f.inSaki, arrived: f.arrived, selfOut: f.selfOut, selfRes: f.selfRes})),
      seaShare, target: R.target, residents: R.residents, tourists: R.tourists,
      selfOut: R.selfOut, selfRes: R.selfRes, sakiDay: R.sakiDay, capShort: R.capShort,
      capFull: R.capFull, atWar: R.atWar, feederDone: R.feederDone, eff: R.eff,
    };
  }
  return {
    geo: {islands: ISLANDS, hubs: HUBS, naha: NAHA, kago: KAGO, airports: KYUSHU_AP, coast: COAST},
    scenarios,
  };
})();`;

const ctx = {Math, Object, Array, JSON, Number};
vm.createContext(ctx);
vm.runInContext(code, ctx);
const out = path.resolve(import.meta.dirname, '../src/data/sim.json');
fs.mkdirSync(path.dirname(out), {recursive: true});
fs.writeFileSync(out, JSON.stringify(ctx.__out));
for (const s of Object.values(ctx.__out.scenarios)) {
  console.log(s.dest, 'sakiDay', s.sakiDay, 'capFull', s.capFull, 'atWar', Math.round(s.atWar),
    'sea', s.seaShare.slice(0, 12).map(x => x.toFixed(2)).join(','));
}
