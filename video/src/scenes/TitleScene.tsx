import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {SCN} from '../data';
import {C, fmt, fontFamily} from '../theme';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const TitleScene: React.FC = () => {
  const f = useCurrentFrame();
  const S = SCN.kyushu;
  return (
    <AbsoluteFill style={{background: C.paper, fontFamily, justifyContent: 'center', padding: '0 160px'}}>
      <div style={{fontSize: 40, fontWeight: 700, color: C.island, letterSpacing: '0.08em',
        opacity: interpolate(f, [5, 25], [0, 1], clamp)}}>南西諸島 住民避難シミュレータ</div>
      <div style={{fontSize: 120, fontWeight: 900, color: C.ink, lineHeight: 1.2, marginTop: 20,
        opacity: interpolate(f, [15, 40], [0, 1], clamp),
        translate: `0 ${interpolate(f, [15, 45], [30, 0], {...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1)})}px`}}>
        先島諸島から<br />{fmt(S.target)}人を運び出す
      </div>
      <div style={{width: interpolate(f, [40, 80], [0, 900], {...clamp, easing: Easing.bezier(0.16, 1, 0.3, 1)}),
        height: 8, background: C.island, marginTop: 40}} />
      <div style={{fontSize: 40, color: C.sub, marginTop: 36, lineHeight: 1.6,
        opacity: interpolate(f, [55, 80], [0, 1], clamp)}}>
        受入先を九州・山口とした既定シナリオを、地図の上で1日ずつ追う
      </div>
    </AbsoluteFill>
  );
};
