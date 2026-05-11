// SearchScreen.jsx — Liquid Glass + Flat search screen for a food-sharing social app
// Russian copy. Brand: #2ecc71.

const { useState, useMemo, useRef, useEffect } = React;

// ────────────────────────────────────────────────────────────
// Tiny inline icons (stroke-based, flat)
// ────────────────────────────────────────────────────────────
const Icon = {
  search: (s = 18, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
  ),
  close: (s = 14, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>
  ),
  star: (s = 12, c = '#FFB400') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={c} stroke="none"><path d="M12 2.5l2.9 6.4 7 .7-5.3 4.7 1.6 6.9L12 17.7l-6.2 3.5 1.6-6.9L2 9.6l7-.7L12 2.5z"/></svg>
  ),
  clock: (s = 14, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
  ),
  trend: (s = 14, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/></svg>
  ),
  pin: (s = 11, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13z"/><circle cx="12" cy="9" r="2.5"/></svg>
  ),
  filter: (s = 18, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M7 12h10M10 18h4"/></svg>
  ),
  // tab bar — flat
  feed: (s = 22, c, fill = false) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={fill ? c : 'none'} stroke={c} strokeWidth="1.8" strokeLinejoin="round"><rect x="3.5" y="4.5" width="17" height="6" rx="1.5"/><rect x="3.5" y="13.5" width="17" height="6" rx="1.5"/></svg>
  ),
  searchTab: (s = 22, c, fill = false) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={fill ? 2.4 : 1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
  ),
  plus: (s = 24, c) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
  ),
  map: (s = 22, c, fill = false) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={fill ? c : 'none'} stroke={c} strokeWidth="1.8" strokeLinejoin="round"><path d="M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20V6.5z"/><path d="M9 4v13.5M15 6.5V20"/></svg>
  ),
  user: (s = 22, c, fill = false) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={fill ? c : 'none'} stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>
  ),
};

// ────────────────────────────────────────────────────────────
// Liquid-glass surface — reusable
// ────────────────────────────────────────────────────────────
function Glass({ children, style, radius = 22, tint = 'rgba(255,255,255,0.55)', blur = 22, hi = true, onClick }) {
  return (
    <div onClick={onClick} style={{
      position: 'relative', borderRadius: radius, overflow: 'hidden',
      ...style,
    }}>
      <div style={{
        position: 'absolute', inset: 0, borderRadius: radius,
        backdropFilter: `blur(${blur}px) saturate(180%)`,
        WebkitBackdropFilter: `blur(${blur}px) saturate(180%)`,
        background: tint,
      }} />
      {hi && <div style={{
        position: 'absolute', inset: 0, borderRadius: radius,
        boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.85), inset -1px -1px 0 rgba(255,255,255,0.35)',
        border: '0.5px solid rgba(255,255,255,0.6)',
        pointerEvents: 'none',
      }} />}
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  );
}

// Colorful "dish photo" placeholder — striped gradient (system-prompt rule: no hand-drawn imagery)
function DishPhoto({ seed, h = 140, label }) {
  // deterministic palette pick from seed
  const palettes = [
    ['#F6C453', '#E76F51', '#2A9D8F'], // saffron / tomato / sage
    ['#FFB4A2', '#E5989B', '#6D597A'], // peach / rose / plum
    ['#A7C957', '#6A994E', '#386641'], // greens
    ['#F4A261', '#E9C46A', '#264653'], // ochre / dark teal
    ['#E07A5F', '#F2CC8F', '#81B29A'], // earth
    ['#CDB4DB', '#FFC8DD', '#FFAFCC'], // pastel pink
    ['#FFD6A5', '#FDFFB6', '#CAFFBF'], // creamy
    ['#90DBF4', '#A9DEF9', '#E4C1F9'], // cool
  ];
  const p = palettes[seed % palettes.length];
  const angle = (seed * 47) % 360;
  return (
    <div style={{
      width: '100%', height: h, position: 'relative', overflow: 'hidden',
      background: `linear-gradient(${angle}deg, ${p[0]} 0%, ${p[1]} 55%, ${p[2]} 100%)`,
    }}>
      {/* subtle stripe overlay so it reads as placeholder */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.06) 0 14px, rgba(0,0,0,0.04) 14px 28px)',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(120% 80% at 30% 20%, rgba(255,255,255,0.35), transparent 60%)',
      }} />
      {label && <div style={{
        position: 'absolute', left: 10, bottom: 8,
        fontFamily: 'ui-monospace, SF Mono, Menlo, monospace',
        fontSize: 9.5, letterSpacing: 0.3, color: 'rgba(255,255,255,0.85)',
        textShadow: '0 1px 2px rgba(0,0,0,0.25)',
      }}>{label}</div>}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Data
// ────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'all', label: 'Всё', emoji: '✨' },
  { id: 'breakfast', label: 'Завтраки', emoji: '🍳' },
  { id: 'burgers', label: 'Бургеры', emoji: '🍔' },
  { id: 'sushi', label: 'Суши', emoji: '🍣' },
  { id: 'pasta', label: 'Паста', emoji: '🍝' },
  { id: 'pizza', label: 'Пицца', emoji: '🍕' },
  { id: 'desserts', label: 'Десерты', emoji: '🍰' },
  { id: 'drinks', label: 'Напитки', emoji: '🥤' },
  { id: 'vegan', label: 'Веган', emoji: '🥗' },
  { id: 'street', label: 'Стрит-фуд', emoji: '🌮' },
];

const RECENT = [
  'рамен с уткой',
  'смэшбургер',
  'тирамису',
  'паста карбонара',
  'матча латте',
];

const POPULAR = [
  { id: 1, name: 'Тако с лангустином', place: 'El Camino', rating: 4.9, reviews: 312, price: '₽680', distance: '0.4 км', tag: 'Огонь недели' },
  { id: 2, name: 'Смэшбургер Дабл', place: 'Patty & Bun', rating: 4.8, reviews: 1204, price: '₽590', distance: '1.2 км' },
  { id: 3, name: 'Пад-тай с креветкой', place: 'Bangkok 75', rating: 4.7, reviews: 487, price: '₽720', distance: '0.9 км' },
  { id: 4, name: 'Раф соляной', place: 'Surf Coffee', rating: 4.9, reviews: 2103, price: '₽320', distance: '0.2 км' },
  { id: 5, name: 'Хачапури по‑аджарски', place: 'Сулико', rating: 4.8, reviews: 894, price: '₽650', distance: '1.8 км' },
  { id: 6, name: 'Маття чизкейк', place: 'Hokkaidō', rating: 4.7, reviews: 233, price: '₽490', distance: '2.1 км' },
];

const TRENDING_NOW = [
  { tag: '#корюшка', count: '2.4к' },
  { tag: '#севиче', count: '1.8к' },
  { tag: '#ванильныйраф', count: '1.1к' },
  { tag: '#пельменисмалом', count: '870' },
];

// ────────────────────────────────────────────────────────────
// Header — search field + filter
// ────────────────────────────────────────────────────────────
function Header({ brand, query, setQuery, focused, setFocused }) {
  return (
    <div style={{ padding: '4px 18px 10px' }}>
      <div style={{
        fontFamily: "'Inter', Arial, sans-serif",
        fontWeight: 800, fontSize: 34, letterSpacing: -0.6,
        color: '#15291C', marginBottom: 12,
      }}>
        Поиск
      </div>

      <Glass radius={18} style={{ height: 50 }} tint="rgba(255,255,255,0.6)">
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          height: 50, padding: '0 14px', color: '#3A4A40',
        }}>
          {Icon.search(20, focused ? brand : '#5C6B62')}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Найти блюдо, ресторан или автора"
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              fontFamily: "'Inter', Arial, sans-serif",
              fontSize: 15.5, color: '#15291C', fontWeight: 500,
            }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{
              border: 'none', background: 'rgba(20,40,28,0.08)',
              width: 22, height: 22, borderRadius: 999,
              display: 'grid', placeItems: 'center', cursor: 'pointer', color: '#3A4A40',
            }}>{Icon.close(11)}</button>
          )}
        </div>
      </Glass>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Category strip
// ────────────────────────────────────────────────────────────
function CategoryPicker({ active, setActive, brand, open, setOpen }) {
  const current = CATEGORIES.find(c => c.id === active) || CATEGORIES[0];
  return (
    <div style={{ padding: '14px 18px 16px', position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', height: 52, borderRadius: 18,
        display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px',
        cursor: 'pointer', textAlign: 'left',
        background: 'rgba(255,255,255,0.6)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: '0.5px solid rgba(255,255,255,0.7)',
        boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.7), inset -1px -1px 0 rgba(255,255,255,0.3), 0 4px 14px rgba(20,40,28,0.06)',
        color: '#15291C',
      }}>
        <span style={{
          width: 32, height: 32, borderRadius: 10,
          background: brand, display: 'grid', placeItems: 'center',
          fontSize: 17, lineHeight: 1,
          boxShadow: `0 4px 12px ${brand}55`,
        }}>{current.emoji}</span>
        <span style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <span style={{
            fontSize: 11, fontWeight: 600, letterSpacing: 0.3,
            textTransform: 'uppercase', color: '#5C6B62', lineHeight: 1.2,
          }}>Категория</span>
          <span style={{
            fontSize: 15.5, fontWeight: 700, color: '#15291C',
            fontFamily: "'Inter', Arial, sans-serif",
            letterSpacing: -0.2, lineHeight: 1.3,
          }}>{active === 'all' ? 'Выберите категорию' : current.label}</span>
        </span>
        <span style={{
          width: 26, height: 26, borderRadius: 999,
          background: 'rgba(20,40,28,0.06)',
          display: 'grid', placeItems: 'center',
          transition: 'transform 200ms ease',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#15291C" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </span>
      </button>

      {open && (
        <div style={{
          marginTop: 8, padding: 8, borderRadius: 18,
          background: 'rgba(255,255,255,0.75)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: '0.5px solid rgba(255,255,255,0.7)',
          boxShadow: '0 12px 30px rgba(20,40,28,0.12), inset 1px 1px 0 rgba(255,255,255,0.7)',
          display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6,
        }}>
          {CATEGORIES.map(c => {
            const isActive = active === c.id;
            return (
              <button key={c.id} onClick={() => { setActive(c.id); setOpen(false); }} style={{
                border: 'none', cursor: 'pointer',
                height: 40, padding: '0 12px', borderRadius: 12,
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: isActive ? brand : 'transparent',
                color: isActive ? '#06301A' : '#15291C',
                fontFamily: "'Inter', Arial, sans-serif",
                fontSize: 14, fontWeight: 600, letterSpacing: -0.1,
                textAlign: 'left',
                boxShadow: isActive ? `0 4px 12px ${brand}55` : 'none',
              }}>
                <span style={{ fontSize: 16, lineHeight: 1 }}>{c.emoji}</span>
                <span>{c.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Recent — chips with X
// ────────────────────────────────────────────────────────────
function Recent({ items, onRemove, onPick, brand }) {
  if (!items.length) return null;
  return (
    <div style={{ padding: '0 18px 16px' }}>
      <SectionHeader icon={Icon.clock(15, '#3A4A40')} title="Последнее" action="Очистить" onAction={() => items.forEach(i => onRemove(i))} />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
        {items.map((q, i) => (
          <div key={q} onClick={() => onPick(q)} style={{
            height: 34, paddingLeft: 12, paddingRight: 6, borderRadius: 999,
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.55)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '0.5px solid rgba(255,255,255,0.6)',
            boxShadow: 'inset 1px 1px 0 rgba(255,255,255,0.6)',
            color: '#15291C',
            fontFamily: "'Inter', Arial, sans-serif",
            fontSize: 13.5, fontWeight: 500, cursor: 'pointer',
          }}>
            <span>{q}</span>
            <button onClick={(e) => { e.stopPropagation(); onRemove(q); }} style={{
              border: 'none', background: 'rgba(20,40,28,0.08)',
              width: 22, height: 22, borderRadius: 999,
              display: 'grid', placeItems: 'center', cursor: 'pointer', color: '#3A4A40',
            }}>{Icon.close(10)}</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Trending row
// ────────────────────────────────────────────────────────────
function Trending({ brand }) {
  return (
    <div style={{ padding: '0 18px 16px' }}>
      <SectionHeader icon={Icon.trend(15, '#3A4A40')} title="Сейчас в городе" />
      <div style={{ display: 'flex', gap: 8, marginTop: 10, overflowX: 'auto', scrollbarWidth: 'none' }} className="hide-scroll">
        {TRENDING_NOW.map((t, i) => (
          <div key={t.tag} style={{
            flexShrink: 0,
            height: 64, minWidth: 150, borderRadius: 16,
            padding: '10px 14px',
            position: 'relative', overflow: 'hidden',
            background: i === 0
              ? `linear-gradient(135deg, ${brand} 0%, #1FA85C 100%)`
              : 'rgba(255,255,255,0.6)',
            color: i === 0 ? '#06301A' : '#15291C',
            backdropFilter: i === 0 ? 'none' : 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: i === 0 ? 'none' : 'blur(20px) saturate(180%)',
            border: i === 0 ? 'none' : '0.5px solid rgba(255,255,255,0.6)',
            boxShadow: i === 0
              ? `0 8px 22px ${brand}40`
              : 'inset 1px 1px 0 rgba(255,255,255,0.7)',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          }}>
            <div style={{
              fontFamily: "'Inter', Arial, sans-serif", fontSize: 10.5, fontWeight: 700,
              letterSpacing: 0.4, textTransform: 'uppercase',
              opacity: i === 0 ? 0.7 : 0.55,
            }}>
              {i === 0 ? '🔥 в тренде' : `+${t.count} постов`}
            </div>
            <div style={{
              fontFamily: "'Inter', Arial, sans-serif",
              fontSize: 17, fontWeight: 700, letterSpacing: -0.3,
            }}>{t.tag}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Section header
// ────────────────────────────────────────────────────────────
function SectionHeader({ icon, title, action, onAction }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span style={{ display: 'inline-flex' }}>{icon}</span>
        <span style={{
          fontFamily: "'Inter', Arial, sans-serif",
          fontSize: 17, fontWeight: 700, color: '#15291C', letterSpacing: -0.2,
        }}>{title}</span>
      </div>
      {action && <button onClick={onAction} style={{
        border: 'none', background: 'transparent', cursor: 'pointer',
        fontFamily: "'Inter', Arial, sans-serif", fontSize: 13, fontWeight: 600,
        color: '#3A4A40', padding: 4,
      }}>{action}</button>}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Popular — 2-col card grid
// ────────────────────────────────────────────────────────────
function Popular({ items, brand, density }) {
  const photoH = density === 'cozy' ? 158 : 132;
  return (
    <div style={{ padding: '0 18px 28px' }}>
      <SectionHeader icon={<span style={{
        width: 18, height: 18, borderRadius: 6, background: brand,
        display: 'grid', placeItems: 'center', fontSize: 11,
      }}>🔥</span>} title="Популярное" action="Все" />
      <div style={{
        marginTop: 12,
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
      }}>
        {items.map((d, i) => (
          <div key={d.id} style={{
            borderRadius: 20, overflow: 'hidden',
            background: 'rgba(255,255,255,0.65)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '0.5px solid rgba(255,255,255,0.7)',
            boxShadow: '0 6px 20px rgba(20,40,28,0.06), inset 1px 1px 0 rgba(255,255,255,0.6)',
            cursor: 'pointer', position: 'relative',
          }}>
            <div style={{ position: 'relative' }}>
              <DishPhoto seed={i + 3} h={photoH} label={`dish photo / ${d.name.toLowerCase()}`} />
              {/* rating pill (liquid glass) */}
              <div style={{
                position: 'absolute', top: 8, left: 8,
                height: 24, padding: '0 8px', borderRadius: 999,
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: 'rgba(20,40,28,0.45)',
                backdropFilter: 'blur(12px) saturate(180%)',
                WebkitBackdropFilter: 'blur(12px) saturate(180%)',
                color: '#fff', fontSize: 11.5, fontWeight: 700,
                fontFamily: "'Inter', Arial, sans-serif",
              }}>
                {Icon.star(11, '#FFD24A')} <span>{d.rating}</span>
                <span style={{ opacity: 0.65, fontWeight: 500 }}>· {d.reviews}</span>
              </div>
              {d.tag && (
                <div style={{
                  position: 'absolute', top: 8, right: 8,
                  height: 22, padding: '0 8px', borderRadius: 999,
                  display: 'inline-flex', alignItems: 'center',
                  background: brand, color: '#06301A',
                  fontSize: 10.5, fontWeight: 800, letterSpacing: 0.2,
                  textTransform: 'uppercase',
                }}>{d.tag}</div>
              )}
              {/* price (bottom-right, glass) */}
              <div style={{
                position: 'absolute', bottom: 8, right: 8,
                height: 24, padding: '0 9px', borderRadius: 8,
                display: 'inline-flex', alignItems: 'center',
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                color: '#15291C', fontSize: 12, fontWeight: 700,
              }}>{d.price}</div>
            </div>
            <div style={{ padding: '10px 12px 12px' }}>
              <div style={{
                fontFamily: "'Inter', Arial, sans-serif",
                fontSize: 14, fontWeight: 700, color: '#15291C',
                letterSpacing: -0.2, lineHeight: 1.2,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                minHeight: 34,
              }}>{d.name}</div>
              <div style={{
                marginTop: 6, display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 11.5, color: '#5C6B62', fontWeight: 500,
              }}>
                {Icon.pin(11, '#5C6B62')}
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.place}</span>
                <span style={{ opacity: 0.55 }}>·</span>
                <span>{d.distance}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Bottom tab bar — floating liquid glass
// ────────────────────────────────────────────────────────────
function TabBar({ active, setActive, brand }) {
  const tabs = [
    { id: 'feed', label: 'Лента', icon: Icon.feed },
    { id: 'search', label: 'Поиск', icon: Icon.searchTab },
    { id: 'add', label: '', icon: Icon.plus, primary: true },
    { id: 'map', label: 'Карта', icon: Icon.map },
    { id: 'me', label: 'Профиль', icon: Icon.user },
  ];
  return (
    <div style={{
      position: 'absolute', left: 14, right: 14, bottom: 18,
      height: 64, borderRadius: 28, overflow: 'visible',
      zIndex: 30,
    }}>
      <Glass radius={28} blur={26} tint="rgba(255,255,255,0.6)" style={{ height: 64 }}>
        <div style={{
          height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-around',
          padding: '0 8px',
        }}>
          {tabs.map(t => {
            const isActive = active === t.id;
            if (t.primary) {
              return (
                <button key={t.id} onClick={() => setActive(t.id)} style={{
                  border: 'none', cursor: 'pointer',
                  width: 50, height: 50, padding: 0,
                  background: 'transparent',
                  display: 'grid', placeItems: 'center',
                  filter: `drop-shadow(0 6px 14px ${brand}55)`,
                }}>
                  <svg width="50" height="50" viewBox="0 0 50 50" style={{ display: 'block' }}>
                    <defs>
                      <linearGradient id="plusRingG" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={brand}/>
                        <stop offset="100%" stopColor="#1FA85C"/>
                      </linearGradient>
                    </defs>
                    <circle cx="25" cy="25" r="23" fill="none" stroke="url(#plusRingG)" strokeWidth="2.5"/>
                    <path d="M25 16v18M16 25h18" stroke="url(#plusRingG)" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                </button>
              );
            }
            return (
              <button key={t.id} onClick={() => setActive(t.id)} style={{
                border: 'none', background: 'transparent', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                color: isActive ? brand : '#5C6B62',
                fontFamily: "'Inter', Arial, sans-serif", fontSize: 10.5, fontWeight: 600,
                padding: '6px 8px',
              }}>
                {t.icon(22, isActive ? brand : '#5C6B62', isActive)}
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </Glass>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Background — soft warm + green blobs (so glass blur shows)
// ────────────────────────────────────────────────────────────
function Background({ brand, palette }) {
  const palettes = {
    fresh: { base: '#F4FAF3', blobs: [['46DA8F', 0.55, '20% 18%'], ['8DE0B0', 0.45, '85% 8%'], ['F5D08C', 0.35, '85% 78%'], ['B8E6CC', 0.4, '8% 78%']] },
    citrus: { base: '#FFF8EC', blobs: [['FFC25C', 0.55, '15% 14%'], [brand.replace('#',''), 0.4, '88% 12%'], ['FF9A6B', 0.35, '90% 80%'], ['CDEBA8', 0.45, '12% 80%']] },
    dusk: { base: '#1A2620', blobs: [[brand.replace('#',''), 0.45, '20% 20%'], ['1FA85C', 0.5, '85% 12%'], ['254A38', 0.6, '90% 78%'], ['0F2E1F', 0.7, '8% 80%']] },
  };
  const p = palettes[palette] || palettes.fresh;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: p.base }}>
      {p.blobs.map(([c, o, pos], i) => (
        <div key={i} style={{
          position: 'absolute', width: 320, height: 320, borderRadius: '50%',
          background: `#${c}`, opacity: o, filter: 'blur(60px)',
          left: `calc(${pos.split(' ')[0]} - 160px)`,
          top: `calc(${pos.split(' ')[1]} - 160px)`,
        }} />
      ))}
      {/* film grain-ish noise via gradient */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(120% 80% at 50% 0%, rgba(255,255,255,0.4), transparent 60%)',
      }} />
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────
function SearchScreen({ tweaks }) {
  const brand = tweaks.brand;
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [activeCat, setActiveCat] = useState('all');
  const [catOpen, setCatOpen] = useState(false);
  const [recent, setRecent] = useState(RECENT);
  const [activeTab, setActiveTab] = useState('search');

  const isDark = tweaks.palette === 'dusk';
  const fg = isDark ? '#E9F3EC' : '#15291C';

  return (
    <div style={{
      position: 'absolute', inset: 0, overflow: 'hidden',
      // dark mode override
      ...(isDark ? { color: fg } : {}),
    }}>
      <Background brand={brand} palette={tweaks.palette} />

      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        paddingTop: 60,
      }}>
        <div className="hide-scroll" style={{
          flex: 1, overflowY: 'auto', paddingBottom: 100,
        }}>
          <Header brand={brand} query={query} setQuery={setQuery} focused={focused} setFocused={setFocused} />
          <CategoryPicker active={activeCat} setActive={setActiveCat} brand={brand} open={catOpen} setOpen={setCatOpen} />
          <Recent items={recent} onRemove={(q) => setRecent(r => r.filter(x => x !== q))} onPick={(q) => setQuery(q)} brand={brand} />
          <Popular items={POPULAR} brand={brand} density={tweaks.density} />
        </div>
      </div>

      <TabBar active={activeTab} setActive={setActiveTab} brand={brand} />

      {/* dark mode adjustment */}
      {isDark && <style>{`
        .dish-fg { color: #E9F3EC !important; }
      `}</style>}
    </div>
  );
}

window.SearchScreen = SearchScreen;
