import raw from './data/sim.json';

export type Island = {
  id: string; n: string; pop: number; lat: number; lng: number;
  type: 'hub' | 'bridge' | 'strip' | 'heli' | 'port'; hub: 'ISG' | 'MYK';
};
export type Frame = {
  day: number; left: Record<string, number>; home: Record<string, number>;
  q: {ISG: number; MYK: number}; inSaki: number; arrived: number; selfOut: number; selfRes: number;
};
export type Scenario = {
  dest: string; destName: string; destCap: number; aps: string[]; startDelay: number; warn: number;
  frames: Frame[]; seaShare: number[]; target: number; residents: number; tourists: number;
  selfOut: number; selfRes: number; sakiDay: number | null; capShort: number; capFull: number | null;
  atWar: number; feederDone: number | null; eff: number;
};
type Airport = {id: string; n: string; lat: number; lng: number; share: number};
type LatLng = {n: string; lat: number; lng: number};

export const GEO = raw.geo as unknown as {
  islands: Island[];
  hubs: Record<'ISG' | 'MYK', LatLng & {port: [number, number]}>;
  naha: LatLng; kago: LatLng; airports: Airport[];
  coast: Record<string, [number, number][]>;
};
export const SCN = raw.scenarios as unknown as Record<'kagoshima' | 'kyushu' | 'national', Scenario>;
