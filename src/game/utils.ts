import type { GameState, Stock } from './types';
import { STOCKS_DEF } from './constants';

export const rnd = (min: number, max: number) => Math.random() * (max - min) + min;
export const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const fmt = (n: number): string => {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1e12) return `${sign}${(abs / 1e12).toFixed(1)}조`;
  if (abs >= 1e8)  return `${sign}${(abs / 1e8).toFixed(1)}억`;
  if (abs >= 1e4)  return `${sign}${(abs / 1e4).toFixed(0)}만`;
  return `${sign}${abs.toLocaleString()}`;
};

export const fmtFull = (n: number): string => {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1e8) {
    const ok = Math.floor(abs / 1e8);
    const man = Math.floor((abs % 1e8) / 1e4);
    return man > 0 ? `${sign}${ok}억 ${man}만` : `${sign}${ok}억`;
  }
  return `${sign}${abs.toLocaleString()}`;
};

export const calcStockValue = (stocks: Stock[], portfolio: Record<string, number>): number =>
  Object.entries(portfolio).reduce((sum, [id, qty]) => {
    const s = stocks.find((x) => x.id === id);
    return sum + (s ? s.price * qty : 0);
  }, 0);

export const mkStocks = (): Stock[] =>
  STOCKS_DEF.map((s) => ({
    ...s,
    price: s.basePrice,
    prevPrice: s.basePrice,
    changePct: 0,
    eventType: null,
  }));

export const mkState = (): GameState => ({
  day: 1,
  cash: 2_000_000,
  salary: 2_000_000,
  stocks: mkStocks(),
  portfolio: {},
  freeRevivals: 3,
  milestonesDone: [],
  owned: { style: null, pet: null, car: null, house: null },
  maintenance: 0,
});
