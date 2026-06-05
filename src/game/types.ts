export interface Stock {
  id: string;
  name: string;
  emoji: string;
  basePrice: number;
  color: string;
  price: number;
  prevPrice: number;
  changePct: number;
  eventType: 'surge' | 'crash' | null;
}

export interface ShopItemDef {
  id: string;
  name: string;
  emoji: string;
  price: number;
  desc: string;
  maintenance?: number;
}

export interface MilestoneDef {
  amount: number;
  label: string;
  emoji: string;
  color: string;
}

export interface GameState {
  day: number;
  cash: number;
  salary: number;
  stocks: Stock[];
  portfolio: Record<string, number>; // stockId → qty
  freeRevivals: number;
  milestonesDone: number[];
  owned: Record<string, string | null>; // category → itemId
  maintenance: number;
}

export interface EventBanner {
  type: 'surge' | 'crash';
  msg: string;
}
