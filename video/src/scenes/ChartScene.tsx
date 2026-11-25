import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {SCN} from '../data';
import {C, fmt, fontFamily, man} from '../theme';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const X0 = 230, X1 = 1500, Y0 = 400, Y1 = 930, XMAX = 14, YMAX = 140000;
const sx = (d: number) => X0 + (d / XMAX) * (X1 - X0);
const sy = (v: number) => Y1 - (v / YMAX) * (Y1 - Y0);

const LINES = [
  {s: SCN.kyushu, color: C.done, label: '九州・山口に分散', w: 7},
  {s: SCN.national, color: C.naha, label: '全国に分散', w: 5},
  {s: SCN.kagoshima, color: C.dest, label: '鹿児島だけ', w: 7},
];

export const ChartScene: React.FC = () => {
  const f = useCurrentFrame();
  const drawn = interpolate(f, [40, 220], [0, XMAX], {...clamp, easing: Easing.bezier(0.4, 0, 0.6, 1)});
  const k = SCN.kagoshima;
  const kEnd = k.frames[k.frames.length - 1];
  const ann = (a: number) => interpolate(f, [a, a + 20], [0, 1], clamp);
  return (
    <AbsoluteFill style={{background: C.paper, fontFamily}}>
      <div style={{position: 'absolute', left: 120, top: 80, right: 120}}>
        <div style={{fontSize: 34, fontWeight: 700, color: C.island}}>受入先を変えると</div>
        <div style={{fontSize: 64, fontWeight: 900, color: C.ink, marginTop: 8, lineHeight: 1.25}}>
          運ぶ手段があっても、行き先がなければ止まる
        </div>
      </div>
      <svg width={1920} height={1080} style={{position: 'absolute', inset: 0}}>
        <defs>
          <clipPath id="draw"><rect x={0} y={0} width={sx(drawn) + 6} height={1080} /></clipPath>
        </defs>
        {[0, 40000, 80000, 120000].map((v) => (
          <g key={v}>
            <line x1={X0} x2={X1} y1={sy(v)} y2={sy(v)} stroke={C.coast} strokeOpacity={0.3} />
            <text x={X0 - 18} y={sy(v)} fontSize={26} fill={C.sub} textAnchor="end" dominantBaseline="middle">{v === 0 ? '0' : `${v / 10000}万`}</text>
          </g>
        ))}
        {[0, 2, 4, 6, 8, 10, 12, 14].map((d) => (
          <text key={d} x={sx(d)} y={Y1 + 40} fontSize={26} fill={C.sub} textAnchor="middle">{d}日</text>
        ))}
        <text x={X0 - 18} y={Y0 - 40} fontSize={26} fill={C.sub} textAnchor="end">先島に残る人</text>
        {/* 猶予の線 */}
        <g opacity={ann(30)}>
          <line x1={sx(10)} x2={sx(10)} y1={Y0 - 10} y2={Y1} stroke={C.ink} strokeWidth={2} strokeDasharray="8 8" />
          <text x={sx(10) + 12} y={Y0 + 4} fontSize={26} fill={C.ink} fontWeight={700}>猶予の想定 10日</text>
        </g>
        <g clipPath="url(#draw)">
          {LINES.map(({s, color, w}) => (
            <polyline key={s.dest} fill="none" stroke={color} strokeWidth={w} strokeLinejoin="round" strokeLinecap="round"
              points={s.frames.filter((fr) => fr.day <= XMAX).map((fr) => `${sx(fr.day)},${sy(fr.inSaki)}`).join(' ')} />
          ))}
        </g>
        {/* 凡例 */}
        {LINES.map(({color, label}, i) => (
          <g key={label} opacity={ann(20)}>
            <rect x={X0 + i * 380} y={292} width={44} height={10} fill={color} />
            <text x={X0 + 60 + i * 380} y={298} fontSize={30} fill={C.ink} fontWeight={700} dominantBaseline="middle">{label}</text>
          </g>
        ))}
        <text x={X1 + 12} y={sy(kEnd.inSaki) - 6} fontSize={24} fill={C.dest} fontWeight={700} opacity={ann(230)}>→ 60日目も</text>
        <text x={X1 + 12} y={sy(kEnd.inSaki) + 26} fontSize={24} fill={C.dest} fontWeight={700} opacity={ann(230)}>{fmt(kEnd.inSaki)}人</text>
      </svg>
      {/* 注記 */}
      <Note x={sx(5.2)} y={sy(k.atWar) - 150} o={ann(140)} color={C.dest}>
        鹿児島だけでは、{k.capFull}日目に受入枠{fmt(k.destCap)}人が満杯。<br />
        約{man(k.atWar)}人が島に残る
      </Note>
      <Note x={sx(10.3)} y={sy(20000) - 20} o={ann(320)} color={C.naha}>
        全国分散は遠いぶん1便の往復が長く、<br />{SCN.national.sakiDay}日目までかかる
      </Note>
    </AbsoluteFill>
  );
};

const Note: React.FC<{x: number; y: number; o: number; color: string; children: React.ReactNode}> = ({x, y, o, color, children}) => (
  <div style={{position: 'absolute', left: x, top: y, opacity: o, translate: `0 ${(1 - o) * 12}px`,
    fontSize: 32, fontWeight: 700, color: C.ink, lineHeight: 1.5, background: 'rgba(246,241,228,0.94)',
    borderLeft: `8px solid ${color}`, padding: '12px 22px'}}>{children}</div>
);
