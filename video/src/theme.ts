import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

// シミュレータ本体（index.html）と同じ配色
export const C = {
  paper: '#F6F1E4',
  sea: '#DCE6E4',
  land: '#E9DDC2',
  coast: '#8C7F63',
  ink: '#17242F',
  sub: '#4A5560',
  island: '#96256B',
  done: '#1F6E7B',
  air: '#17242F',
  sea_route: '#1F6E7B',
  self: '#7A6F5C',
  dest: '#C05A24',
  naha: '#5B4A87',
};

// Noto Sans JP（SIL Open Font License）を public/fonts に同梱して読み込む。
// 描画時に外部へ取りに行かないので、ネットワークが制限された環境でも書き出せる
export const fontFamily = 'Noto Sans JP';
for (const weight of ['400', '700', '900']) {
  loadFont({family: fontFamily, url: staticFile(`fonts/NotoSansJP-${weight}.ttf`), weight});
}

export const fmt = (n: number) => Math.round(n).toLocaleString('ja-JP');
export const man = (n: number) => `${(n / 10000).toFixed(1)}万`;
