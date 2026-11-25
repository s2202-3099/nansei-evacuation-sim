import React from 'react';
import {Sequence, Track} from 'remotion';
import {ChartScene, CHART_LEN} from './scenes/ChartScene';
import {ClosingScene} from './scenes/ClosingScene';
import {MAP_SCENE_LEN, MapScene} from './scenes/MapScene';
import {TitleScene} from './scenes/TitleScene';

export const TITLE_LEN = 150;
export const CLOSING_LEN = 240;
export const TOTAL_LEN = TITLE_LEN + MAP_SCENE_LEN + CHART_LEN + CLOSING_LEN;

export const EvacuationVideo: React.FC = () => (
  <Track name="Scenes">
    <Sequence name="タイトル" from={0} durationInFrames={TITLE_LEN}>
      <TitleScene />
    </Sequence>
    <Sequence name="地図：10日間の避難" from={TITLE_LEN} durationInFrames={MAP_SCENE_LEN}>
      <MapScene />
    </Sequence>
    <Sequence name="受入先の比較" from={TITLE_LEN + MAP_SCENE_LEN} durationInFrames={CHART_LEN}>
      <ChartScene />
    </Sequence>
    <Sequence name="結び" from={TITLE_LEN + MAP_SCENE_LEN + CHART_LEN} durationInFrames={CLOSING_LEN}>
      <ClosingScene />
    </Sequence>
  </Track>
);
