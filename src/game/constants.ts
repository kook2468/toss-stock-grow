import type { MilestoneDef, ShopItemDef, Stock } from './types';

export const STOCKS_DEF: Omit<Stock, 'price' | 'prevPrice' | 'changePct' | 'eventType'>[] = [
  { id: 'ant',   name: '개미전자',   emoji: '🐜', basePrice: 50_000,  color: '#FF6B6B' },
  { id: 'apple', name: '사과테크',   emoji: '🍎', basePrice: 150_000, color: '#4ECDC4' },
  { id: 'coin',  name: '가즈아코인', emoji: '🚀', basePrice: 10_000,  color: '#FFE66D' },
  { id: 'mars',  name: '화성자동차', emoji: '🚗', basePrice: 80_000,  color: '#A8E6CF' },
  { id: 'gpu',   name: '그래픽맨',   emoji: '💻', basePrice: 200_000, color: '#DDA0DD' },
];

export const MILESTONES: MilestoneDef[] = [
  { amount: 1e8,  label: '1억',    emoji: '🎉', color: '#FFD700' },
  { amount: 5e8,  label: '5억',    emoji: '🎊', color: '#FF8C00' },
  { amount: 1e9,  label: '10억',   emoji: '💰', color: '#FF4500' },
  { amount: 3e9,  label: '30억',   emoji: '🏆', color: '#DC143C' },
  { amount: 5e9,  label: '50억',   emoji: '👑', color: '#9400D3' },
  { amount: 1e10, label: '100억',  emoji: '💎', color: '#4169E1' },
  { amount: 1e11, label: '1000억', emoji: '🌟', color: '#00CED1' },
];

export const SHOP: Record<string, { label: string; items: ShopItemDef[] }> = {
  style: {
    label: '👗 스타일',
    items: [
      { id: 'worker',   name: '직장인룩',  emoji: '👔', price: 5_000_000,     desc: '평범한 직장인' },
      { id: 'rich',     name: '부자룩',    emoji: '🤵', price: 50_000_000,    desc: '여유로운 부자' },
      { id: 'chaebol',  name: '재벌룩',    emoji: '👑', price: 500_000_000,   desc: '대한민국 재벌' },
    ],
  },
  pet: {
    label: '🐾 펫',
    items: [
      { id: 'dog',    name: '강아지', emoji: '🐶', price: 10_000_000,  desc: '충성스러운 친구' },
      { id: 'cat',    name: '고양이', emoji: '🐱', price: 30_000_000,  desc: '도도한 동반자' },
      { id: 'dragon', name: '용',     emoji: '🐉', price: 300_000_000, desc: '행운을 부르는 용' },
    ],
  },
  car: {
    label: '🚗 자동차',
    items: [
      { id: 'bike',     name: '자전거',  emoji: '🚲', price: 1_000_000,   desc: '친환경 출근' },
      { id: 'sedan',    name: '중형차',  emoji: '🚙', price: 30_000_000,  desc: '편안한 이동' },
      { id: 'supercar', name: '슈퍼카', emoji: '🏎️', price: 500_000_000,  desc: '압도적 존재감' },
    ],
  },
  house: {
    label: '🏠 집',
    items: [
      { id: 'oneroom',   name: '원룸',       emoji: '🏠', price: 20_000_000,    maintenance: 100_000,   desc: '아늑한 나만의 공간' },
      { id: 'apt',       name: '아파트',     emoji: '🏢', price: 200_000_000,   maintenance: 500_000,   desc: '중산층의 꿈' },
      { id: 'penthouse', name: '펜트하우스', emoji: '🏰', price: 2_000_000_000, maintenance: 3_000_000, desc: '최고급 주거' },
    ],
  },
};

export const SURGE_MSGS = [
  (n: string) => `🚀 ${n} 대박! 외계인 기술 공개!!`,
  (n: string) => `📈 ${n} 폭등! 워런 버핏이 대량 매수!!`,
  (n: string) => `🔥 ${n} 핫! 정부가 집중 육성 선언!!`,
  (n: string) => `💎 ${n} 대세! 전 국민이 몰려든다!!`,
  (n: string) => `⚡ ${n} 급등! 천재 CEO 등장!!`,
];

export const CRASH_MSGS = [
  (n: string) => `💀 ${n} 폭락! 대표가 도주 중!!`,
  (n: string) => `📉 ${n} 붕괴! 회계 부정 발각!!`,
  (n: string) => `🔥 ${n} 공장 전소! 보험도 없음!!`,
  (n: string) => `😱 ${n} 위기! 외국인 투매 시작!!`,
  (n: string) => `☠️ ${n} 상폐 위기! 거래 정지!!`,
];
