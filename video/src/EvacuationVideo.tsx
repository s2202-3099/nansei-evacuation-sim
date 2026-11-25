import {Audio} from '@remotion/media';
import React from 'react';
import {Sequence, staticFile, Track} from 'remotion';
import {ChartScene} from './scenes/ChartScene';
import {ClosingScene} from './scenes/ClosingScene';
import {MapScene} from './scenes/MapScene';
import {TitleScene} from './scenes/TitleScene';
import {
  CHART_FROM, CHART_LEN, CLOSING_FROM, CLOSING_LEN, dayStart, DAYS, INTRO_A,
  MAP_FROM, MAP_SCENE_LEN, N, TITLE_LEN,
} from './timing';

export const EvacuationVideo: React.FC = () => (
  <>
    <Track name="Scenes">
      <Sequence name="タイトル" from={0} durationInFrames={TITLE_LEN}>
        <TitleScene />
      </Sequence>
      <Sequence name="地図：10日間の避難" from={MAP_FROM} durationInFrames={MAP_SCENE_LEN}>
        <MapScene />
      </Sequence>
      <Sequence name="受入先の比較" from={CHART_FROM} durationInFrames={CHART_LEN}>
        <ChartScene />
      </Sequence>
      <Sequence name="結び" from={CLOSING_FROM} durationInFrames={CLOSING_LEN}>
        <ClosingScene />
      </Sequence>
    </Track>
    <Track name="ナレーション">
      <Audio name="N1 タイトル" src={staticFile('narration/title.wav')} from={15} durationInFrames={N.title} />
      <Audio name="N2 先島の位置" src={staticFile('narration/introA.wav')} from={MAP_FROM + 10} durationInFrames={N.introA} />
      <Audio name="N3 島と人口" src={staticFile('narration/introB.wav')} from={MAP_FROM + INTRO_A + 10} durationInFrames={N.introB} />
      <Audio name="N4 1〜3日目" src={staticFile('narration/days1.wav')} from={MAP_FROM + dayStart(1) + 6} durationInFrames={N.days1} />
      <Audio name="N5 4〜5日目" src={staticFile('narration/days4.wav')} from={MAP_FROM + dayStart(4) + 6} durationInFrames={N.days4} />
      <Audio name="N6 6〜10日目" src={staticFile('narration/days6.wav')} from={MAP_FROM + dayStart(6) + 6} durationInFrames={N.days6} />
      <Audio name="N7 全員退避" src={staticFile('narration/outro.wav')} from={MAP_FROM + dayStart(DAYS + 1) + 10} durationInFrames={N.outro} />
      <Audio name="N8 受入先の比較" src={staticFile('narration/chart.wav')} from={CHART_FROM + 15} durationInFrames={N.chart} />
      <Audio name="N9 結び" src={staticFile('narration/closing.wav')} from={CLOSING_FROM + 10} durationInFrames={N.closing} />
    </Track>
  </>
);
