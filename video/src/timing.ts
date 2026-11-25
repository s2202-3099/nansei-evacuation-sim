// 尺はナレーションの長さから決める。音声を差し替えて narration.json を測り直せば、動画の尺も追従する
import NARR from './data/narration.json';

export const FPS = 30;
const f = (sec: number) => Math.ceil(sec * FPS);
export const N = Object.fromEntries(Object.entries(NARR).map(([k, v]) => [k, f(v)])) as Record<keyof typeof NARR, number>;

// ── タイトル
export const TITLE_LEN = Math.max(150, 15 + N.title + 25);

// ── 地図（シーン内のフレーム）
export const INTRO_A = Math.max(140, 10 + N.introA + 20); // 広域：先島の位置
export const INTRO = INTRO_A + Math.max(130, 10 + N.introB + 25); // ズーム：島と人口
// 1日の長さは段階ごとに、その段階のナレーションが収まるように伸ばす（最短2.4秒）
const L1 = Math.max(72, Math.ceil((N.days1 + 24) / 3));
const L2 = Math.max(72, Math.ceil((N.days4 + 24) / 2));
const L3 = Math.max(72, Math.ceil((N.days6 + 24) / 5));
export const dayLen = (d: number) => (d <= 3 ? L1 : d <= 5 ? L2 : L3);
export const DAYS = 10;
export const dayStart = (d: number) => {
  let s = INTRO;
  for (let i = 1; i < d; i++) s += dayLen(i);
  return s;
};
export const OUTRO = Math.max(180, 10 + N.outro + 40);
export const MAP_SCENE_LEN = dayStart(DAYS + 1) + OUTRO;

// フレーム → 何日目か（d）と、その日の進み具合（p: 0〜1）
export const dayAt = (frame: number) => {
  if (frame < INTRO) return {d: 0, p: 0};
  for (let d = 1; d <= DAYS; d++) {
    const s = dayStart(d), l = dayLen(d);
    if (frame < s + l) return {d, p: (frame - s) / l};
  }
  return {d: DAYS, p: 1};
};

// ── 比較グラフと結び
export const CHART_LEN = Math.max(480, 15 + N.chart + 90);
export const CLOSING_LEN = Math.max(240, 10 + N.closing + 110);

export const MAP_FROM = TITLE_LEN;
export const CHART_FROM = MAP_FROM + MAP_SCENE_LEN;
export const CLOSING_FROM = CHART_FROM + CHART_LEN;
export const TOTAL_LEN = CLOSING_FROM + CLOSING_LEN;
