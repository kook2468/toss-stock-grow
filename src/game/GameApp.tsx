import { useCallback, useMemo, useRef, useState } from 'react';
import { CRASH_MSGS, MILESTONES, SHOP, STOCKS_DEF, SURGE_MSGS } from './constants';
import type { EventBanner, GameState, MilestoneDef, Stock } from './types';
import { calcStockValue, fmt, fmtFull, mkState, pick, rnd } from './utils';
import './GameApp.css';

// ─── NEXT DAY LOGIC ──────────────────────────────────────────────────────────

function computeNextDay(
  prev: GameState,
  onEvent: (e: EventBanner) => void,
  onMilestone: (m: MilestoneDef) => void,
  onFlash: (id: string, up: boolean) => void,
): GameState {
  const day = prev.day + 1;

  // Stock price update
  let firstEvent: { type: 'surge' | 'crash'; msg: string; stockId: string } | null = null;
  const stocks = prev.stocks.map((s) => {
    const isEvent = Math.random() < 0.08;
    let rate = rnd(-0.12, 0.12);
    let evType: 'surge' | 'crash' | null = null;

    if (isEvent) {
      evType = Math.random() < 0.5 ? 'surge' : 'crash';
      rate = evType === 'surge' ? rnd(0.25, 0.55) : rnd(-0.52, -0.25);
      if (!firstEvent) {
        const msgs = evType === 'surge' ? SURGE_MSGS : CRASH_MSGS;
        firstEvent = { type: evType, msg: pick(msgs)(s.name), stockId: s.id };
      }
    }

    const newPrice = Math.max(100, Math.round(s.price * (1 + rate)));
    return { ...s, prevPrice: s.price, price: newPrice, changePct: rate * 100, eventType: evType };
  });

  const salary = day % 10 === 0 ? prev.salary + 500_000 : prev.salary;
  const newCash = prev.cash + salary - prev.maintenance;

  const sv = calcStockValue(stocks, prev.portfolio);
  const total = newCash + sv;
  const milestonesDone = [...prev.milestonesDone];
  let newMs: MilestoneDef | null = null;
  for (const m of MILESTONES) {
    if (total >= m.amount && !milestonesDone.includes(m.amount)) {
      milestonesDone.push(m.amount);
      newMs = m;
      break;
    }
  }

  // Side effects deferred so they run after state update
  if (firstEvent) {
    const ev = firstEvent;
    setTimeout(() => {
      onEvent({ type: ev.type, msg: ev.msg });
      onFlash(ev.stockId, ev.type === 'surge');
    }, 80);
  }
  stocks.forEach((s) => {
    if (!firstEvent || s.id !== firstEvent.stockId) {
      setTimeout(() => onFlash(s.id, s.price >= s.prevPrice), 80);
    }
  });
  if (newMs) {
    const ms = newMs;
    setTimeout(() => onMilestone(ms), firstEvent ? 3600 : 400);
  }

  return { ...prev, day, salary, cash: newCash, stocks, milestonesDone };
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export function GameApp() {
  const [gs, setGs] = useState<GameState>(mkState);
  const [tab, setTab] = useState<'market' | 'portfolio' | 'shop'>('market');

  // Trade modal
  const [tradeStock, setTradeStock] = useState<Stock | null>(null);
  const [tradeQty, setTradeQty] = useState(1);

  // Overlays
  const [showRevival, setShowRevival] = useState(false);
  const [msModal, setMsModal] = useState<MilestoneDef | null>(null);

  // Event banner
  const [eventBanner, setEventBanner] = useState<EventBanner | null>(null);
  const [eventAnim, setEventAnim] = useState('');
  const eventTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Per-stock flash class
  const [flashMap, setFlashMap] = useState<Record<string, string>>({});

  // ── Animations ─────────────────────────────────────────────

  const triggerEvent = useCallback((e: EventBanner) => {
    clearTimeout(eventTimerRef.current);
    setEventBanner(e);
    setEventAnim('event-enter');
    eventTimerRef.current = setTimeout(() => {
      setEventAnim('event-exit');
      setTimeout(() => setEventBanner(null), 500);
    }, 3000);
  }, []);

  const triggerFlash = useCallback((id: string, up: boolean) => {
    const cls = up ? 'flash-up' : 'flash-down';
    setFlashMap((prev) => ({ ...prev, [id]: cls }));
    setTimeout(() => setFlashMap((prev) => ({ ...prev, [id]: '' })), 500);
  }, []);

  const triggerMilestone = useCallback((m: MilestoneDef) => setMsModal(m), []);

  // ── Game actions ───────────────────────────────────────────

  const nextDay = useCallback(() => {
    if (gs.cash < 0) { setShowRevival(true); return; }
    setGs((prev) => computeNextDay(prev, triggerEvent, triggerMilestone, triggerFlash));
  }, [gs.cash, triggerEvent, triggerMilestone, triggerFlash]);

  const buy = useCallback(() => {
    if (!tradeStock) return;
    const cost = tradeStock.price * tradeQty;
    if (gs.cash < cost) { alert(`잔액이 ${fmt(cost - gs.cash)}원 부족합니다.`); return; }
    setGs((p) => ({
      ...p,
      cash: p.cash - cost,
      portfolio: { ...p.portfolio, [tradeStock.id]: (p.portfolio[tradeStock.id] ?? 0) + tradeQty },
    }));
    setTradeStock(null);
  }, [tradeStock, tradeQty, gs.cash]);

  const sell = useCallback(() => {
    if (!tradeStock) return;
    const owned = gs.portfolio[tradeStock.id] ?? 0;
    if (owned < tradeQty) { alert(`${owned}주만 보유 중입니다.`); return; }
    setGs((p) => {
      const np = { ...p.portfolio };
      np[tradeStock.id] = owned - tradeQty;
      if (np[tradeStock.id] === 0) delete np[tradeStock.id];
      return { ...p, cash: p.cash + tradeStock.price * tradeQty, portfolio: np };
    });
    setTradeStock(null);
  }, [tradeStock, tradeQty, gs.portfolio]);

  const buyItem = useCallback((cat: string, itemId: string, price: number, maintenance?: number) => {
    if (gs.cash < price) { alert('현금이 부족합니다.'); return; }
    setGs((p) => ({
      ...p,
      cash: p.cash - price,
      owned: { ...p.owned, [cat]: itemId },
      maintenance: cat === 'house' && maintenance != null ? maintenance : p.maintenance,
    }));
  }, [gs.cash]);

  const reviveFree = useCallback(() => {
    setGs((p) => ({ ...p, cash: 2_000_000, freeRevivals: p.freeRevivals - 1 }));
    setShowRevival(false);
  }, []);

  const restart = useCallback(() => { setGs(mkState()); setShowRevival(false); }, []);

  // ── Derived ────────────────────────────────────────────────

  const sv = useMemo(() => calcStockValue(gs.stocks, gs.portfolio), [gs.stocks, gs.portfolio]);
  const totalAssets = gs.cash + sv;
  const isBankrupt = gs.cash < 0;

  const ownedStyle  = SHOP.style.items.find((i) => i.id === gs.owned.style);
  const ownedPet    = SHOP.pet.items.find((i) => i.id === gs.owned.pet);
  const ownedCar    = SHOP.car.items.find((i) => i.id === gs.owned.car);
  const ownedHouse  = SHOP.house.items.find((i) => i.id === gs.owned.house);

  const portfolioEntries = Object.entries(gs.portfolio).filter(([, q]) => q > 0);

  // ── Render ─────────────────────────────────────────────────

  return (
    <div className="game-root">

      {/* ══ EVENT BANNER ══════════════════════════════════════ */}
      {eventBanner && (
        <div className={`event-banner ${eventBanner.type === 'surge' ? 'event-surge' : 'event-crash'} ${eventAnim}`}>
          <span className="event-emoji">{eventBanner.type === 'surge' ? '🚀🔥📈' : '💀📉😱'}</span>
          <span className="event-msg">{eventBanner.msg}</span>
        </div>
      )}

      {/* ══ MILESTONE MODAL ═══════════════════════════════════ */}
      {msModal && (
        <div className="overlay">
          <div className="popup-box ms-box pop-in">
            <div className="ms-emoji">{msModal.emoji}</div>
            <div className="ms-title">🎉 축하합니다!</div>
            <div className="ms-amt">총자산 {msModal.label} 돌파!</div>
            <div className="ms-sub">이제 진짜 부자의 길로… 🤑</div>
            <button className="btn btn-blue" onClick={() => setMsModal(null)}>계속 키우기 💪</button>
          </div>
        </div>
      )}

      {/* ══ REVIVAL MODAL ═════════════════════════════════════ */}
      {showRevival && (
        <div className="overlay">
          <div className="popup-box" style={{ borderColor: '#cc2222' }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>💸</div>
            <div className="popup-title" style={{ color: '#ff5555' }}>현금이 마이너스!</div>
            <div className="popup-body">
              현금: <strong style={{ color: '#ff4444' }}>{fmtFull(gs.cash)}원</strong>
            </div>
            <div className="popup-body" style={{ marginBottom: 20 }}>주식을 팔거나 부활을 이용하세요.</div>

            {gs.freeRevivals > 0 ? (
              <button className="btn btn-green" onClick={reviveFree}>
                🔄 다시 키우기 (무료 {gs.freeRevivals}회 남음)
              </button>
            ) : (
              <>
                <button className="btn btn-yellow" onClick={() => alert('광고 시청 기능 연동 후 이용 가능합니다!')}>
                  📺 광고 보고 부활하기
                </button>
                <button className="btn btn-purple" onClick={() => alert('결제 기능 연동 후 이용 가능합니다!')}>
                  💳 결제하고 부활 (500원)
                </button>
              </>
            )}

            <button className="btn btn-navy" onClick={() => { setShowRevival(false); setTab('portfolio'); }}>
              주식 팔러 가기
            </button>
            <button className="btn btn-gray" onClick={restart}>🏳️ 처음부터 다시</button>
          </div>
        </div>
      )}

      {/* ══ TRADE MODAL ═══════════════════════════════════════ */}
      {tradeStock && (
        <div className="overlay" onClick={() => setTradeStock(null)}>
          <div className="popup-box trade-box" style={{ borderColor: tradeStock.color }} onClick={(e) => e.stopPropagation()}>
            <div className="trade-title">{tradeStock.emoji} {tradeStock.name}</div>
            <div className="trade-price">{tradeStock.price.toLocaleString()}원 / 주</div>
            <div className="trade-sub">보유: {gs.portfolio[tradeStock.id] ?? 0}주 &nbsp;|&nbsp; 현금: {fmt(gs.cash)}원</div>

            <div className="qty-row">
              {[1, 5, 10, 50, 100].map((q) => (
                <button
                  key={q}
                  className={`qty-btn ${tradeQty === q ? 'qty-btn-active' : ''}`}
                  style={tradeQty === q ? { backgroundColor: tradeStock.color, borderColor: tradeStock.color } : {}}
                  onClick={() => setTradeQty(q)}
                >
                  {q}주
                </button>
              ))}
            </div>

            <div className="trade-cost">총 {(tradeStock.price * tradeQty).toLocaleString()}원</div>

            <div className="trade-action-row">
              <button className="trade-btn buy-btn" onClick={buy}>매수 📈</button>
              <button className="trade-btn sell-btn" onClick={sell}>매도 📉</button>
            </div>

            <button className="btn btn-gray" onClick={() => setTradeStock(null)}>닫기</button>
          </div>
        </div>
      )}

      {/* ══ HEADER ════════════════════════════════════════════ */}
      <header className="game-header">
        <div className="h-left">
          <span className="h-avatar">{ownedStyle?.emoji ?? '👤'}</span>
          <div>
            <div className="h-day">📅 {gs.day}일차</div>
            <div className="h-salary">💰 월급 {fmt(gs.salary)}원</div>
          </div>
        </div>
        <div className="h-right">
          {ownedPet && <span className="h-pet">{ownedPet.emoji}</span>}
          {ownedCar && <span className="h-car">{ownedCar.emoji}</span>}
          {gs.freeRevivals < 3 && (
            <span className="h-revival">부활 {gs.freeRevivals}회</span>
          )}
        </div>
      </header>

      {/* ══ ASSET CARD ════════════════════════════════════════ */}
      <div className="asset-card">
        <div className="a-label">총 자산</div>
        <div className={`a-total ${totalAssets < 0 ? 'red' : ''}`}>{fmtFull(totalAssets)}원</div>
        <div className="a-row">
          <div className="a-item">
            <div className="a-item-label">현금</div>
            <div className={`a-item-value ${gs.cash < 0 ? 'red' : ''}`}>{fmt(gs.cash)}원</div>
          </div>
          <div className="a-item">
            <div className="a-item-label">주식 평가</div>
            <div className="a-item-value">{fmt(sv)}원</div>
          </div>
          {gs.maintenance > 0 && (
            <div className="a-item">
              <div className="a-item-label">관리비/일</div>
              <div className="a-item-value red">-{fmt(gs.maintenance)}원</div>
            </div>
          )}
        </div>
        {ownedHouse && (
          <div className="house-tag">{ownedHouse.emoji} {ownedHouse.name} 거주 중</div>
        )}
      </div>

      {/* ══ TABS ══════════════════════════════════════════════ */}
      <div className="tab-bar">
        {([
          { key: 'market',    label: '📊 주식장' },
          { key: 'portfolio', label: '💼 포트폴리오' },
          { key: 'shop',      label: '🏪 상점' },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            className={`tab-btn ${tab === key ? 'tab-btn-active' : ''}`}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ══ SCROLL CONTENT ════════════════════════════════════ */}
      <div className="scroll-area">

        {/* ── Market ── */}
        {tab === 'market' && gs.stocks.map((s) => (
          <div
            key={s.id}
            className={`stock-card ${flashMap[s.id] ?? ''}`}
            style={{ borderLeftColor: s.color }}
            onClick={() => { setTradeStock(s); setTradeQty(1); }}
          >
            <div className="s-left">
              <span className="s-emoji">{s.emoji}</span>
              <div>
                <div className="s-name">{s.name}</div>
                <div className="s-owned">보유 {gs.portfolio[s.id] ?? 0}주</div>
              </div>
            </div>
            <div className="s-right">
              <div className="s-price">{s.price.toLocaleString()}원</div>
              <div className={`s-chg ${s.price >= s.prevPrice ? 'chg-up' : 'chg-dn'}`}>
                {s.price >= s.prevPrice ? '▲' : '▼'} {Math.abs(s.changePct).toFixed(1)}%
              </div>
              {s.eventType && (
                <div className="ev-badge">{s.eventType === 'surge' ? '🔥 대박' : '☠️ 폭락'}</div>
              )}
            </div>
          </div>
        ))}

        {/* ── Portfolio ── */}
        {tab === 'portfolio' && (
          portfolioEntries.length === 0
            ? <div className="empty-card"><div className="empty-msg">보유 주식 없음</div><div className="empty-sub">주식장에서 매수해보세요!</div></div>
            : portfolioEntries.map(([id, qty]) => {
                const s = gs.stocks.find((x) => x.id === id);
                if (!s) return null;
                return (
                  <div
                    key={id}
                    className="stock-card"
                    style={{ borderLeftColor: s.color }}
                    onClick={() => { setTradeStock(s); setTradeQty(1); }}
                  >
                    <div className="s-left">
                      <span className="s-emoji">{s.emoji}</span>
                      <div>
                        <div className="s-name">{s.name}</div>
                        <div className="s-owned">{qty}주 보유</div>
                      </div>
                    </div>
                    <div className="s-right">
                      <div className="s-price">{fmt(s.price * qty)}원</div>
                      <div className="s-owned">{s.price.toLocaleString()}원/주</div>
                    </div>
                  </div>
                );
              })
        )}

        {/* ── Shop ── */}
        {tab === 'shop' && Object.entries(SHOP).map(([cat, { label, items }]) => (
          <div key={cat}>
            <div className="shop-cat-label">{label}</div>
            {items.map((item) => {
              const isOwned = gs.owned[cat] === item.id;
              const canAfford = gs.cash >= item.price;
              return (
                <div key={item.id} className={`shop-card ${isOwned ? 'shop-owned' : ''}`}>
                  <span className="shop-emoji">{item.emoji}</span>
                  <div className="shop-info">
                    <div className="shop-name">{item.name}</div>
                    <div className="shop-desc">{item.desc}</div>
                    {item.maintenance != null && (
                      <div className="shop-maint">관리비 {fmt(item.maintenance)}원/일</div>
                    )}
                  </div>
                  <div className="shop-right">
                    <div className="shop-price">{fmt(item.price)}원</div>
                    {isOwned ? (
                      <span className="owned-badge">보유 ✓</span>
                    ) : (
                      <button
                        className={`shop-btn ${!canAfford ? 'shop-btn-off' : ''}`}
                        onClick={() => buyItem(cat, item.id, item.price, item.maintenance)}
                        disabled={!canAfford}
                      >
                        구매
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        <div style={{ height: 32 }} />
      </div>

      {/* ══ FOOTER ════════════════════════════════════════════ */}
      <footer className="game-footer">
        {isBankrupt ? (
          <button className="next-btn next-btn-danger" onClick={() => setShowRevival(true)}>
            💸 현금 마이너스! 대처하기
          </button>
        ) : (
          <button className="next-btn" onClick={nextDay}>
            <span className="next-btn-label">다음 날로 ➡️</span>
            <span className="next-btn-sub">+{fmt(gs.salary)}원 월급 입금</span>
          </button>
        )}
      </footer>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  STOCK_DEF re-export for flash keying
// ─────────────────────────────────────────────────────────────
export { STOCKS_DEF };
