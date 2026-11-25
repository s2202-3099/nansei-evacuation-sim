import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {C, fontFamily} from '../theme';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const ClosingScene: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: C.ink, fontFamily, justifyContent: 'center', padding: '0 160px', color: C.paper}}>
      <div style={{fontSize: 76, fontWeight: 900, lineHeight: 1.4, opacity: interpolate(f, [5, 30], [0, 1], clamp)}}>
        日数の絶対値ではなく、<br />どこが先に詰まるかを読む
      </div>
      <div style={{fontSize: 36, lineHeight: 1.7, marginTop: 50, opacity: interpolate(f, [35, 60], [0, 1], clamp), color: '#C9C2B2'}}>
        座席数・回転日数・収容人員などは公表されていないため推定値です。<br />
        個人による非公式な図上検討で、政府・自治体・自衛隊・海保の見解ではありません。
      </div>
      <div style={{fontSize: 30, marginTop: 50, opacity: interpolate(f, [60, 85], [0, 1], clamp), color: '#9FA6AC'}}>
        出所：内閣官房国家危機管理室「沖縄県の離島からの住民避難・受入れに係る取組」、住民基本台帳（令和7年1月1日）
      </div>
      <div style={{fontSize: 30, marginTop: 16, opacity: interpolate(f, [60, 85], [0, 1], clamp), color: '#9FA6AC'}}>
        ナレーション　VOICEVOX:ずんだもん
      </div>
    </AbsoluteFill>
  );
};
