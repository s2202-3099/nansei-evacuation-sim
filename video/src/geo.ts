import {Easing, interpolate} from 'remotion';

export const W = 1920;
export const H = 1080;
const COS = Math.cos((26 * Math.PI) / 180);

// span＝画面の横幅に入る経度の幅
export type Camera = {lng: number; lat: number; span: number};

export const project = (cam: Camera, lng: number, lat: number) => {
  const ppd = W / cam.span; // 経度1度あたりのピクセル
  return {
    x: W / 2 + (lng - cam.lng) * ppd,
    y: H / 2 - ((lat - cam.lat) * ppd) / COS,
  };
};

// [frame, camera] のキーフレームを補間。ズームは対数で補間すると速度が均一に見える
export const cameraAt = (frame: number, keys: [number, Camera][]): Camera => {
  const fr = keys.map((k) => k[0]);
  const opt = {
    extrapolateLeft: 'clamp' as const,
    extrapolateRight: 'clamp' as const,
    easing: Easing.bezier(0.45, 0, 0.55, 1),
  };
  // 区間ごとにイージングをかけるため、区間を探してから補間する
  let i = fr.findIndex((f) => f > frame);
  if (i === -1) return keys[keys.length - 1][1];
  if (i === 0) return keys[0][1];
  const [f0, a] = keys[i - 1];
  const [f1, b] = keys[i];
  const t = interpolate(frame, [f0, f1], [0, 1], opt);
  return {
    lng: a.lng + (b.lng - a.lng) * t,
    lat: a.lat + (b.lat - a.lat) * t,
    span: Math.exp(Math.log(a.span) + (Math.log(b.span) - Math.log(a.span)) * t),
  };
};

// 2点を結ぶゆるい弧（二次ベジェ）。bend は弦長に対するふくらみ
export const arc = (
  p: {x: number; y: number},
  q: {x: number; y: number},
  bend = 0.12,
) => {
  const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2;
  const dx = q.x - p.x, dy = q.y - p.y;
  const c = {x: mx - dy * bend, y: my + dx * bend};
  return {
    d: `M${p.x},${p.y} Q${c.x},${c.y} ${q.x},${q.y}`,
    at: (t: number) => ({
      x: (1 - t) * (1 - t) * p.x + 2 * (1 - t) * t * c.x + t * t * q.x,
      y: (1 - t) * (1 - t) * p.y + 2 * (1 - t) * t * c.y + t * t * q.y,
    }),
  };
};
