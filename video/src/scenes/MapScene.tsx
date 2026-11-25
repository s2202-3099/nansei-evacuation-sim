import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {GEO, SCN, type Island} from '../data';
import {arc, cameraAt, H, project, W, type Camera} from '../geo';
import {C, fmt, fontFamily, man} from '../theme';

const S = SCN.kyushu;
import {DAYS, INTRO, INTRO_A, MAP_SCENE_LEN, dayAt, dayLen, dayStart} from '../timing';

// ── カメラ
const WIDE: Camera = {lng: 126.0, lat: 29.3, span: 22.5};
const SAKI: Camera = {lng: 124.6, lat: 24.45, span: 4.4};
const CAM_KEYS: [number, Camera][] = [
  [0, WIDE],
  [INTRO_A - 60, WIDE],
  [INTRO_A + 40, SAKI],
  [dayStart(6) - 30, SAKI],
  [dayStart(6) + 50, WIDE],
];

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = Easing.bezier(0.33, 0, 0.2, 1);

// その時点の値を、前日→当日の間で補間して返す
const tween = (frame: number, pick: (d: number) => number) => {
  const {d, p} = dayAt(frame);
  if (d === 0) return pick(0);
  return pick(d - 1) + (pick(d) - pick(d - 1)) * ease(p);
};

const KAGO_PORT = {lat: 31.58, lng: 130.56};
const isHubLike = (i: Island) => i.type === 'hub' || i.type === 'bridge';
const aps = GEO.airports.filter((a) => S.aps.includes(a.id));
const apShareTot = aps.reduce((s, a) => s + a.share, 0);

// ── 1日ごとの流れ（地図上の点の元になる）
type Flow = {
  key: string; from: {lat: number; lng: number}; to: {lat: number; lng: number};
  amount: number; color: string; travel: number; bend: number; r: number;
};
const flowsOfDay = (d: number): Flow[] => {
  const prev = S.frames[d - 1], cur = S.frames[d];
  const out: Flow[] = [];
  if (d <= S.startDelay) {
    // 公示前：定期便で観光客と一部住民が自力で出る（那覇便が中心）
    for (const h of ['ISG', 'MYK'] as const) {
      const ids = GEO.islands.filter((i) => i.hub === h).map((i) => i.id);
      const amt = ids.reduce((s, id) => s + prev.left[id] - cur.left[id], 0);
      out.push({key: `self-${h}`, from: GEO.hubs[h], to: GEO.naha, amount: amt,
        color: C.self, travel: 46, bend: -0.08, r: 4});
    }
    return out;
  }
  // 末端：小さな島 → 拠点島
  for (const i of GEO.islands.filter((x) => !isHubLike(x))) {
    const amt = prev.home[i.id] - cur.home[i.id];
    if (amt > 1) out.push({key: `feed-${i.id}`, from: i, to: GEO.hubs[i.hub], amount: amt,
      color: C.island, travel: 30, bend: 0.15, r: 4});
  }
  // 幹線：拠点島 → 九州（空路は各空港へ配分、海路は鹿児島へ）
  for (const h of ['ISG', 'MYK'] as const) {
    const ids = GEO.islands.filter((i) => i.hub === h).map((i) => i.id);
    const amt = ids.reduce((s, id) => s + prev.left[id] - cur.left[id], 0);
    const sea = amt * S.seaShare[d];
    out.push({key: `sea-${h}`, from: {lat: GEO.hubs[h].port[0], lng: GEO.hubs[h].port[1]},
      to: KAGO_PORT, amount: sea, color: C.sea_route, travel: 110, bend: 0.1, r: 5});
    for (const a of aps) {
      out.push({key: `air-${h}-${a.id}`, from: GEO.hubs[h], to: a,
        amount: ((amt - sea) * a.share) / apShareTot, color: C.air, travel: 58, bend: -0.06, r: 3.2});
    }
  }
  return out;
};
const FLOWS = Array.from({length: DAYS}, (_, i) => flowsOfDay(i + 1));
const PER_DOT = 110; // 点1つ＝およそ110人

const Dots: React.FC<{frame: number; cam: Camera}> = ({frame, cam}) => {
  const dots: React.ReactNode[] = [];
  FLOWS.forEach((flows, idx) => {
    const ds = dayStart(idx + 1);
    const len = dayLen(idx + 1);
    if (frame < ds || frame > ds + len + 120) return;
    for (const f of flows) {
      const n = Math.min(36, Math.round(f.amount / PER_DOT));
      if (n <= 0) continue;
      const path = arc(project(cam, f.from.lng, f.from.lat), project(cam, f.to.lng, f.to.lat), f.bend);
      for (let k = 0; k < n; k++) {
        const t = (frame - (ds + (k * len) / n)) / f.travel;
        if (t < 0 || t > 1) continue;
        const p = path.at(ease(t));
        const o = interpolate(t, [0, 0.08, 0.85, 1], [0, 0.9, 0.9, 0]);
        dots.push(<circle key={`${f.key}-${idx}-${k}`} cx={p.x} cy={p.y} r={f.r} fill={f.color} opacity={o} />);
      }
    }
  });
  return <>{dots}</>;
};

// 道筋の線。その日に動いている経路だけ濃く
const Routes: React.FC<{frame: number; cam: Camera}> = ({frame, cam}) => {
  const d = Math.max(1, dayAt(frame).d);
  if (frame < INTRO - 20) return null;
  const fadeIn = interpolate(frame, [INTRO - 20, INTRO + 10], [0, 1], clamp);
  const active = new Map(FLOWS[d - 1].filter((f) => f.amount > 1).map((f) => [f.key, f]));
  const all = new Map<string, Flow>();
  FLOWS.flat().forEach((f) => all.set(f.key, f));
  return (
    <g opacity={fadeIn}>
      {[...all.values()].map((f) => {
        const on = active.has(f.key);
        const path = arc(project(cam, f.from.lng, f.from.lat), project(cam, f.to.lng, f.to.lat), f.bend);
        return (
          <path key={f.key} d={path.d} fill="none" stroke={f.color}
            strokeWidth={on ? 1.4 : 1} strokeOpacity={on ? 0.3 : 0.08}
            strokeDasharray={f.key.startsWith('sea') || f.key.startsWith('feed') ? '5 6' : undefined} />
        );
      })}
    </g>
  );
};

const Coast: React.FC<{cam: Camera}> = ({cam}) => (
  <>
    {Object.entries(GEO.coast).map(([k, pts]) => (
      <polygon key={k}
        points={pts.map(([lng, lat]) => { const p = project(cam, lng, lat); return `${p.x},${p.y}`; }).join(' ')}
        fill={C.land} stroke={C.coast} strokeWidth={1.2} strokeLinejoin="round" />
    ))}
  </>
);

const Label: React.FC<{x: number; y: number; children: React.ReactNode; size?: number;
  color?: string; opacity?: number; weight?: number; anchor?: 'start' | 'end' | 'middle'}> =
  ({x, y, children, size = 24, color = C.ink, opacity = 1, weight = 700, anchor = 'start'}) => (
    <text x={x} y={y} fontSize={size} fill={color} opacity={opacity} fontWeight={weight}
      textAnchor={anchor} dominantBaseline="middle" fontFamily={fontFamily}
      stroke={C.paper} strokeWidth={size / 5} paintOrder="stroke" strokeLinejoin="round">
      {children}
    </text>
  );

const Islands: React.FC<{frame: number; cam: Camera}> = ({frame, cam}) => {
  const z = 4.4 / cam.span; // 1＝先島ズーム、0.23＝広域
  const k = Math.pow(z, 0.6);
  const zoomLabel = interpolate(z, [0.45, 0.9], [0, 1], clamp);
  return (
    <>
      {GEO.islands.map((i, idx) => {
        const p = project(cam, i.lng, i.lat);
        const pop = interpolate(frame, [INTRO_A - 15 + idx * 4, INTRO_A + 5 + idx * 4], [0, 1], {...clamp, easing: Easing.out(Easing.back(1.6))});
        if (i.type === 'bridge') {
          return <circle key={i.id} cx={p.x} cy={p.y} r={3.5 * k * pop} fill={C.island} opacity={0.6} />;
        }
        const init = i.type === 'hub' ? S.frames[0].q[i.hub] : S.frames[0].home[i.id];
        const now = tween(frame, (d) => (i.type === 'hub' ? S.frames[d].q[i.hub] : S.frames[d].home[i.id]));
        const r = (5 + Math.sqrt(Math.max(0, now)) * 0.17) * k * pop;
        const emptied = now < 1;
        const col = emptied ? C.done : C.island;
        const ring = (5 + Math.sqrt(init) * 0.17) * k * pop;
        const showName = i.type === 'hub' || ['yonaguni', 'hateruma', 'tarama', 'iriomote'].includes(i.id);
        return (
          <g key={i.id}>
            <circle cx={p.x} cy={p.y} r={ring} fill="none" stroke={C.island} strokeOpacity={0.35}
              strokeWidth={1.2} strokeDasharray="3 4" />
            <circle cx={p.x} cy={p.y} r={Math.max(r, emptied ? 5 * k * pop : 0)} fill={col}
              fillOpacity={emptied ? 0.3 : 0.55} stroke={col} strokeWidth={1.6} />
            {showName && (
              <Label x={p.x + ring + 8} y={p.y - (i.type === 'hub' ? 16 : 0)} size={i.type === 'hub' ? 30 : 22}
                opacity={zoomLabel * pop}>{i.n}</Label>
            )}
            {i.type === 'hub' && (
              <Label x={p.x + ring + 8} y={p.y + 20} size={26} weight={900} color={C.island}
                opacity={zoomLabel * pop}>{`拠点で待機 ${man(now)}人`}</Label>
            )}
          </g>
        );
      })}
    </>
  );
};

const Places: React.FC<{frame: number; cam: Camera}> = ({frame, cam}) => {
  const z = 4.4 / cam.span;
  const wide = interpolate(z, [0.3, 0.55], [1, 0], clamp);
  const apOn = interpolate(frame, [dayStart(4), dayStart(4) + 20], [0, 1], clamp);
  const naha = project(cam, GEO.naha.lng, GEO.naha.lat);
  const tw = project(cam, 121.0, 23.8);
  const saki = project(cam, 124.2, 24.0);
  return (
    <>
      <Label x={tw.x} y={tw.y} size={30} color={C.sub} opacity={wide} anchor="middle">台湾</Label>
      <Label x={saki.x} y={saki.y - 90} size={34} color={C.island} weight={900}
        opacity={wide * interpolate(frame, [20, 45], [0, 1], clamp)} anchor="middle">先島諸島</Label>
      <circle cx={naha.x} cy={naha.y} r={7} fill={C.naha} opacity={0.8} />
      <Label x={naha.x - 14} y={naha.y} size={26} color={C.naha} opacity={Math.max(wide, 0.6)} anchor="end">那覇</Label>
      {aps.map((a) => {
        const p = project(cam, a.lng, a.lat);
        const big = ['fukuoka', 'kagoshima', 'kumamoto', 'nagasaki', 'miyazaki'].includes(a.id);
        return (
          <g key={a.id} opacity={apOn}>
            <circle cx={p.x} cy={p.y} r={4 + Math.sqrt(a.share) * 1.4} fill={C.dest} fillOpacity={0.55} stroke={C.ink} strokeWidth={1.2} />
            {big && <Label x={p.x + 14} y={p.y} size={22} color={C.ink} opacity={wide}>{a.n}</Label>}
          </g>
        );
      })}
    </>
  );
};

// ── 見出し（段階ごとに切り替え）
type Phase = {from: number; to: number; head: string; sub: string};
const PHASES: Phase[] = [
  {from: 0, to: INTRO_A, head: '先島諸島　九州から約1,000km', sub: '宮古・八重山の18の有人島。与那国島から台湾までは約110km'},
  {from: INTRO_A, to: INTRO, head: `住民${fmt(S.residents)}人＋観光客など${fmt(S.tourists)}人`,
    sub: '空港のある石垣・宮古が拠点。ほかの島からは小型機・ヘリ・船で拠点へ'},
  {from: INTRO, to: dayStart(S.startDelay + 1), head: `1〜${S.startDelay}日目　定期便で自力退避`,
    sub: '公的輸送の準備が整うまで、観光客と一部の住民が定期便で島を出る'},
  {from: dayStart(S.startDelay + 1), to: dayStart(6), head: '4〜5日目　小さな島から拠点島へ',
    sub: '滑走路のない島はヘリと船で石垣・宮古へ集め、そこから九州へ送り出す'},
  {from: dayStart(6), to: dayStart(DAYS + 1), head: `6〜${DAYS}日目　九州・山口の9空港へ`,
    sub: `空と海で1日約${man(S.eff)}人。先島側空港の駐機スポット（78便/日）が上限`},
  {from: dayStart(DAYS + 1), to: MAP_SCENE_LEN, head: `${DAYS}日目　先島から全員が退避`,
    sub: `想定した猶予${S.warn}日に、ちょうど間に合う計算`},
];

const Caption: React.FC<{frame: number}> = ({frame}) => {
  const ph = PHASES.find((p) => frame >= p.from && frame < p.to) ?? PHASES[PHASES.length - 1];
  const o = interpolate(frame, [ph.from, ph.from + 14, ph.to - 10, ph.to], [0, 1, 1, ph === PHASES[PHASES.length - 1] ? 1 : 0], clamp);
  const y = interpolate(frame, [ph.from, ph.from + 18], [16, 0], {...clamp, easing: ease});
  return (
    <div style={{position: 'absolute', left: 90, top: 80, maxWidth: 1120, opacity: o, translate: `0 ${y}px`,
      background: 'rgba(246,241,228,0.92)', padding: '26px 36px', borderLeft: `10px solid ${C.island}`}}>
      <div style={{fontSize: 58, fontWeight: 900, color: C.ink, lineHeight: 1.25}}>{ph.head}</div>
      <div style={{fontSize: 32, fontWeight: 400, color: C.sub, marginTop: 12, lineHeight: 1.5}}>{ph.sub}</div>
    </div>
  );
};

const Panel: React.FC<{frame: number}> = ({frame}) => {
  const o = interpolate(frame, [INTRO - 30, INTRO], [0, 1], clamp);
  const day = dayAt(frame).d;
  const inSaki = tween(frame, (d) => S.frames[d].inSaki);
  const arrived = tween(frame, (d) => S.frames[d].arrived);
  const pct = (arrived / S.target) * 100;
  return (
    <div style={{position: 'absolute', right: 90, bottom: 90, width: 520, opacity: o,
      background: 'rgba(246,241,228,0.95)', border: `2px solid ${C.ink}`, padding: '28px 34px'}}>
      <div style={{display: 'flex', alignItems: 'baseline', gap: 14}}>
        <span style={{fontSize: 108, fontWeight: 900, color: C.ink, lineHeight: 1}}>{day}</span>
        <span style={{fontSize: 44, fontWeight: 700, color: C.ink}}>日目</span>
      </div>
      <div style={{fontSize: 30, color: C.sub, marginTop: 18}}>先島に残っている人</div>
      <div style={{fontSize: 64, fontWeight: 900, color: inSaki < 1 ? C.done : C.island, lineHeight: 1.1}}>
        {fmt(inSaki)}<span style={{fontSize: 32, fontWeight: 700}}> 人</span>
      </div>
      <div style={{fontSize: 30, color: C.sub, marginTop: 18}}>本土に到着　{pct.toFixed(0)}%</div>
      <div style={{height: 18, background: '#E2D8C3', marginTop: 10}}>
        <div style={{height: '100%', width: `${pct}%`, background: C.done}} />
      </div>
      <div style={{display: 'flex', gap: 22, marginTop: 22, fontSize: 22, color: C.sub, flexWrap: 'wrap'}}>
        <span><Dot c={C.air} />空路</span>
        <span><Dot c={C.sea_route} />海路</span>
        <span><Dot c={C.island} />島内・島間</span>
        <span><Dot c={C.self} />定期便</span>
      </div>
    </div>
  );
};
const Dot: React.FC<{c: string}> = ({c}) => (
  <span style={{display: 'inline-block', width: 14, height: 14, borderRadius: 7, background: c, marginRight: 8, verticalAlign: 'middle'}} />
);

export const MapScene: React.FC = () => {
  const frame = useCurrentFrame();
  const cam = cameraAt(frame, CAM_KEYS);
  return (
    <AbsoluteFill style={{background: C.sea, fontFamily}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Coast cam={cam} />
        <Routes frame={frame} cam={cam} />
        <Places frame={frame} cam={cam} />
        <Dots frame={frame} cam={cam} />
        <Islands frame={frame} cam={cam} />
      </svg>
      <Caption frame={frame} />
      <Panel frame={frame} />
    </AbsoluteFill>
  );
};
