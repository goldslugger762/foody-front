// FeedScreen.jsx — main feed for the food-sharing social app, matching SearchScreen style.
// Liquid Glass + Flat. Russian copy. Brand: #2ecc71.

const { useState: useStateF, useRef: useRefF, useEffect: useEffectF } = React;

// ────────────────────────────────────────────────────────────
// Tiny inline icons
// ────────────────────────────────────────────────────────────
const FIcon = {
  search: (s = 18, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
  ),
  heart: (s = 22, c, fill = false) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={fill ? c : 'none'} stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z"/></svg>
  ),
  bubble: (s = 20, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 21 12z"/></svg>
  ),
  bookmark: (s = 20, c = 'currentColor', fill = false) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={fill ? c : 'none'} stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12v18l-6-4-6 4z"/></svg>
  ),
  share: (s = 20, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8"/><path d="M16 6l-4-4-4 4"/><path d="M12 2v14"/></svg>
  ),
  more: (s = 18, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={c} stroke="none"><circle cx="12" cy="5" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="12" cy="19" r="1.7"/></svg>
  ),
  star: (s = 12, c = '#FFB400') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={c} stroke="none"><path d="M12 2.5l2.9 6.4 7 .7-5.3 4.7 1.6 6.9L12 17.7l-6.2 3.5 1.6-6.9L2 9.6l7-.7L12 2.5z"/></svg>
  ),
  pin: (s = 11, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13z"/><circle cx="12" cy="9" r="2.5"/></svg>
  ),
  bell: (s = 20, c = 'currentColor') => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8z"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>
  ),
  // tab bar
  feed: (s = 22, c, fill = false) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={fill ? c : 'none'} stroke={c} strokeWidth={fill ? 2.4 : 1.8} strokeLinejoin="round"><rect x="3.5" y="4.5" width="17" height="6" rx="1.5"/><rect x="3.5" y="13.5" width="17" height="6" rx="1.5"/></svg>
  ),
  searchTab: (s = 22, c, fill = false) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
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
// Glass surface (re-used pattern)
// ────────────────────────────────────────────────────────────
function FGlass({ children, style, radius = 22, tint = 'rgba(255,255,255,0.6)', blur = 22, hi = true, onClick }) {
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

// Striped placeholder photo
function FDishPhoto({ seed, h = 360, label }) {
  const palettes = [
    ['#F6C453', '#E76F51', '#2A9D8F'],
    ['#FFB4A2', '#E5989B', '#6D597A'],
    ['#A7C957', '#6A994E', '#386641'],
    ['#F4A261', '#E9C46A', '#264653'],
    ['#E07A5F', '#F2CC8F', '#81B29A'],
    ['#CDB4DB', '#FFC8DD', '#FFAFCC'],
    ['#FFD6A5', '#FDFFB6', '#CAFFBF'],
    ['#90DBF4', '#A9DEF9', '#E4C1F9'],
  ];
  const p = palettes[seed % palettes.length];
  const angle = (seed * 47) % 360;
  return (
    <div style={{
      width: '100%', height: h, position: 'relative', overflow: 'hidden',
      background: `linear-gradient(${angle}deg, ${p[0]} 0%, ${p[1]} 55%, ${p[2]} 100%)`,
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.06) 0 14px, rgba(0,0,0,0.04) 14px 28px)',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(120% 80% at 30% 20%, rgba(255,255,255,0.35), transparent 60%)',
      }} />
      {label && <div style={{
        position: 'absolute', left: 12, bottom: 10,
        fontFamily: 'ui-monospace, SF Mono, Menlo, monospace',
        fontSize: 10, letterSpacing: 0.3, color: 'rgba(255,255,255,0.85)',
        textShadow: '0 1px 2px rgba(0,0,0,0.25)',
      }}>{label}</div>}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Avatar — initial circle with a deterministic pastel gradient
// ────────────────────────────────────────────────────────────
function FAvatar({ name, size = 36 }) {
  const seed = (name || '').charCodeAt(1) || 7;
  const pals = [
    ['#FFD6A5', '#FF8FAB'],
    ['#A7C957', '#386641'],
    ['#FFC25C', '#E76F51'],
    ['#90DBF4', '#A78BFA'],
    ['#F2CC8F', '#81B29A'],
    ['#CDB4DB', '#FFAFCC'],
  ];
  const [a, b] = pals[seed % pals.length];
  const initial = (name || '?').replace('@','').slice(0, 1).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `linear-gradient(135deg, ${a}, ${b})`,
      display: 'grid', placeItems: 'center',
      color: '#fff', fontWeight: 800, fontSize: size * 0.42,
      letterSpacing: -0.3,
      boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.55)',
      fontFamily: "'Inter', Arial, sans-serif",
      flexShrink: 0,
    }}>{initial}</div>
  );
}

// ────────────────────────────────────────────────────────────
// Data — 4 posts
// ────────────────────────────────────────────────────────────
const POSTS = [
  {
    id: 1,
    user: '@ivanov_ivan',
    realName: 'Иван Иванов',
    when: '2 ч',
    dish: 'Тако с лангустином и манго',
    place: 'El Camino · Никольская, 10',
    rating: 4.9,
    price: '₽680',
    text: 'Шеф уговорил попробовать с тёплой сальсой — мякоть просто тает, а перчик чили работает на финале. Возьму ещё.',
    tags: ['#тако', '#морепродукты', '#центр'],
    photos: 3,
    likes: 999,
    comments: 262,
    seed: 0,
  },
  {
    id: 2,
    user: '@masha.eats',
    realName: 'Маша Петрова',
    when: '5 ч',
    dish: 'Маття чизкейк',
    place: 'Hokkaidō · Патрики',
    rating: 4.7,
    price: '₽490',
    text: 'Текстура воздушная, маття не горчит. Подача мини — на двоих маловато, заказывайте по штуке каждому.',
    tags: ['#чизкейк', '#маття', '#патрики'],
    photos: 4,
    likes: 1413,
    comments: 88,
    seed: 5,
  },
  {
    id: 3,
    user: '@kostya.cooks',
    realName: 'Костя',
    when: 'вчера',
    dish: 'Хачапури по-аджарски',
    place: 'Сулико · Кутузовский 22',
    rating: 4.8,
    price: '₽650',
    text: 'Жёлток разбили прямо на лодочке. Хлеб — хрустит снаружи, тянется внутри. Лучшее в районе, проверено.',
    tags: ['#хачапури', '#грузинская', '#ужин'],
    photos: 2,
    likes: 742,
    comments: 41,
    seed: 2,
  },
];

// ────────────────────────────────────────────────────────────
// Top app bar — Foody / tabs / bell
// ────────────────────────────────────────────────────────────
function FHeader({ brand, tab, setTab, currentUser }) {
  const tabs = [
    { id: 'new',  label: 'Новое' },
    { id: 'subs', label: 'Подписки' },
  ];
  const isLoggedIn = !!currentUser;
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 20,
      padding: '10px 14px 12px',
    }}>
      <FGlass radius={22} tint="rgba(255,255,255,0.6)" style={{ height: 60 }}>
        <div style={{
          height: 60, padding: '0 8px 0 14px',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          {/* Wordmark */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            paddingRight: 4,
          }}>
            <span style={{
              width: 26, height: 26, borderRadius: 9,
              background: `linear-gradient(135deg, ${brand}, #1FA85C)`,
              display: 'grid', placeItems: 'center',
              fontSize: 14, lineHeight: 1,
              boxShadow: `0 4px 12px ${brand}55`,
            }}>🍴</span>
            <span style={{
              fontFamily: "'Inter', Arial, sans-serif",
              fontWeight: 900, fontSize: 20, letterSpacing: -0.6, color: '#15291C',
            }}>Foody</span>
          </div>

          {/* Segmented tabs */}
          <div style={{
            flex: 1, display: 'flex', gap: 4,
            background: 'rgba(20,40,28,0.06)', borderRadius: 999,
            padding: 3, marginLeft: 4,
          }}>
            {tabs.map(t => {
              const isActive = tab === t.id;
              return (
                <button key={t.id} onClick={() => setTab(t.id)} style={{
                  flex: 1, height: 30, borderRadius: 999, border: 'none',
                  background: isActive ? '#fff' : 'transparent',
                  color: isActive ? '#15291C' : '#5C6B62',
                  fontFamily: "'Inter', Arial, sans-serif",
                  fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                  boxShadow: isActive ? '0 2px 8px rgba(20,40,28,0.10)' : 'none',
                  letterSpacing: -0.1,
                }}>{t.label}</button>
              );
            })}
          </div>

          {/* Account corner — username pill or Register CTA */}
          {isLoggedIn ? (
            <button style={{
              height: 36, padding: '0 10px 0 4px', borderRadius: 999, border: 'none',
              background: 'rgba(20,40,28,0.06)',
              display: 'inline-flex', alignItems: 'center', gap: 7,
              cursor: 'pointer', color: '#15291C',
              fontFamily: "'Inter', Arial, sans-serif",
              fontSize: 12.5, fontWeight: 700, letterSpacing: -0.1,
              maxWidth: 140,
            }}>
              <FAvatar name={currentUser} size={28} />
              <span style={{
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{currentUser}</span>
            </button>
          ) : (
            <button style={{
              height: 36, padding: '0 14px', borderRadius: 999, border: 'none',
              background: brand, color: '#06301A',
              fontFamily: "'Inter', Arial, sans-serif",
              fontSize: 12.5, fontWeight: 800, letterSpacing: -0.1,
              cursor: 'pointer',
              boxShadow: `0 4px 12px ${brand}55`,
            }}>Регистрация</button>
          )}
        </div>
      </FGlass>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Story rail — friends posting now
// ────────────────────────────────────────────────────────────
function FStoryRail({ brand }) {
  const stories = [
    { name: '@ваше', isYou: true },
    { name: '@anya', live: true },
    { name: '@nikita' },
    { name: '@dasha' },
    { name: '@petr' },
    { name: '@elena' },
    { name: '@max' },
  ];
  return (
    <div style={{ padding: '10px 0 14px' }}>
      <div className="hide-scroll" style={{
        display: 'flex', gap: 12, padding: '0 16px',
        overflowX: 'auto',
      }}>
        {stories.map((s, i) => (
          <div key={s.name} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
            flexShrink: 0, width: 64,
          }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              padding: 2.5,
              background: s.live
                ? `conic-gradient(from 220deg, ${brand}, #FFC25C, #E76F51, ${brand})`
                : (s.isYou ? 'rgba(20,40,28,0.10)' : 'linear-gradient(135deg, #FFC25C, #E76F51)'),
              position: 'relative',
            }}>
              <div style={{
                width: '100%', height: '100%', borderRadius: '50%',
                background: '#fff',
                padding: 2, boxSizing: 'border-box',
              }}>
                <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden' }}>
                  <FAvatar name={s.name} size={50} />
                </div>
              </div>
              {s.isYou && (
                <div style={{
                  position: 'absolute', right: -2, bottom: -2,
                  width: 22, height: 22, borderRadius: '50%',
                  background: brand, color: '#06301A',
                  display: 'grid', placeItems: 'center',
                  boxShadow: '0 0 0 2px #fff',
                }}>{FIcon.plus(14, '#06301A')}</div>
              )}
              {s.live && (
                <div style={{
                  position: 'absolute', left: '50%', bottom: -6,
                  transform: 'translateX(-50%)',
                  height: 16, padding: '0 6px', borderRadius: 999,
                  background: '#E5443B', color: '#fff',
                  fontSize: 9, fontWeight: 800, letterSpacing: 0.4,
                  textTransform: 'uppercase',
                  display: 'inline-flex', alignItems: 'center',
                }}>LIVE</div>
              )}
            </div>
            <div style={{
              fontSize: 11, color: '#3A4A40',
              fontWeight: 600, fontFamily: "'Inter', Arial, sans-serif",
              maxWidth: 64, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{s.isYou ? 'Ваш пост' : s.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Single post card
// ────────────────────────────────────────────────────────────
function FPostCard({ post, brand, density }) {
  const [liked, setLiked] = useStateF(false);
  const [saved, setSaved] = useStateF(false);
  const [photoIdx, setPhotoIdx] = useStateF(0);
  const photoH = density === 'cozy' ? 360 : 320;
  const [mainTag, ...restTags] = post.tags;

  return (
    <div style={{
      scrollSnapAlign: 'start', scrollSnapStop: 'always',
      minHeight: '100%', boxSizing: 'border-box',
      padding: '0 14px 14px',
      display: 'flex', flexDirection: 'column',
    }}>
      <article style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        borderRadius: 26, overflow: 'hidden',
        background: 'rgba(255,255,255,0.94)',
        border: '0.5px solid rgba(255,255,255,0.85)',
        boxShadow: '0 14px 36px rgba(20,40,28,0.14), inset 1px 1px 0 rgba(255,255,255,0.85)',
      }}>
        {/* Header row — avatar, username, share, more */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 12px 10px 14px',
        }}>
          <FAvatar name={post.user} size={34} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: "'Inter', Arial, sans-serif",
              fontSize: 14, fontWeight: 700, color: '#15291C', letterSpacing: -0.2,
              display: 'flex', alignItems: 'center', gap: 6,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              <span>{post.user}</span>
              <span style={{
                width: 14, height: 14, borderRadius: '50%',
                background: brand, display: 'grid', placeItems: 'center',
                fontSize: 8, color: '#06301A', fontWeight: 900, flexShrink: 0,
              }}>✓</span>
            </div>
            <div style={{ fontSize: 11.5, color: '#5C6B62', fontWeight: 500, marginTop: 1 }}>
              {post.realName} · {post.when}
            </div>
          </div>
          <button title="Поделиться" style={{
            width: 32, height: 32, borderRadius: 9, border: 'none',
            background: 'rgba(20,40,28,0.06)',
            display: 'grid', placeItems: 'center', cursor: 'pointer',
            color: '#15291C',
          }}>{FIcon.share(17, '#15291C')}</button>
          <button title="Ещё" style={{
            width: 32, height: 32, borderRadius: 9, border: 'none',
            background: 'rgba(20,40,28,0.06)',
            display: 'grid', placeItems: 'center', cursor: 'pointer',
          }}>{FIcon.more(16, '#15291C')}</button>
        </div>

        {/* Photo with dots overlaid */}
        <div style={{ position: 'relative', margin: '0 12px', borderRadius: 18, overflow: 'hidden' }}>
          <FDishPhoto seed={post.seed + photoIdx} h={photoH} label={`dish photo ${photoIdx + 1} / ${post.photos} · ${post.dish.toLowerCase()}`} />
          {post.photos > 1 && (
            <div style={{
              position: 'absolute', left: 0, right: 0, bottom: 10,
              display: 'flex', justifyContent: 'center', gap: 5,
            }}>
              {Array.from({ length: post.photos }).map((_, i) => (
                <button key={i} onClick={() => setPhotoIdx(i)} style={{
                  width: i === photoIdx ? 22 : 6, height: 6, borderRadius: 999,
                  background: i === photoIdx ? '#fff' : 'rgba(255,255,255,0.55)',
                  border: 'none', cursor: 'pointer', padding: 0,
                  boxShadow: i === photoIdx ? '0 2px 6px rgba(0,0,0,0.25)' : 'none',
                  transition: 'width 180ms ease',
                }} />
              ))}
            </div>
          )}
        </div>

        {/* Engagement row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16,
          padding: '12px 16px 8px',
        }}>
          <button onClick={() => setLiked(l => !l)} style={{
            border: 'none', background: 'transparent', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: 0,
          }}>
            {FIcon.heart(22, liked ? '#E5443B' : '#15291C', liked)}
            <span style={{
              fontFamily: "'Inter', Arial, sans-serif", fontSize: 13.5, fontWeight: 700,
              color: '#15291C', letterSpacing: -0.1,
            }}>{(post.likes + (liked ? 1 : 0)).toLocaleString('ru-RU')}</span>
          </button>
          <button style={{
            border: 'none', background: 'transparent', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: 0,
          }}>
            {FIcon.bubble(20, '#15291C')}
            <span style={{
              fontFamily: "'Inter', Arial, sans-serif", fontSize: 13.5, fontWeight: 700,
              color: '#15291C', letterSpacing: -0.1,
            }}>{post.comments}</span>
          </button>
          <button onClick={() => setSaved(s => !s)} title="В избранное" style={{
            marginLeft: 'auto',
            width: 36, height: 36, borderRadius: 10, border: 'none',
            background: saved ? `${brand}22` : 'rgba(20,40,28,0.06)',
            display: 'grid', placeItems: 'center', cursor: 'pointer',
            color: saved ? brand : '#15291C',
          }}>{FIcon.bookmark(18, saved ? brand : '#15291C', saved)}</button>
        </div>

        {/* Dish title */}
        <div style={{ padding: '0 16px 4px' }}>
          <div style={{
            fontFamily: "'Inter', Arial, sans-serif",
            fontSize: 19, fontWeight: 800, color: '#15291C',
            letterSpacing: -0.4, lineHeight: 1.2,
          }}>{post.dish}</div>
        </div>

        {/* Place pill */}
        <div style={{ padding: '4px 16px 10px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontSize: 12.5, color: '#3A4A40', fontWeight: 600,
            padding: '5px 10px', borderRadius: 9,
            background: 'rgba(20,40,28,0.05)',
            maxWidth: '100%',
          }}>
            {FIcon.pin(11, '#3A4A40')}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.place}</span>
          </div>
        </div>

        {/* Rating ←→ Price (liquid-glass price) */}
        <div style={{
          padding: '4px 16px 10px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{
              fontFamily: "'Inter', Arial, sans-serif",
              fontSize: 11, fontWeight: 700, letterSpacing: 0.4,
              textTransform: 'uppercase', color: '#5C6B62',
            }}>Оценка</span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontFamily: "'Inter', Arial, sans-serif",
              fontSize: 18, fontWeight: 800, color: '#15291C', letterSpacing: -0.3,
            }}>
              {FIcon.star(14, '#FFB400')} {post.rating}
            </span>
          </div>
          <div style={{
            position: 'relative',
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 14px',
            borderRadius: 14,
            background: `linear-gradient(135deg, rgba(255,255,255,0.85), rgba(255,255,255,0.55))`,
            backdropFilter: 'blur(14px) saturate(200%)',
            WebkitBackdropFilter: 'blur(14px) saturate(200%)',
            border: '0.5px solid rgba(255,255,255,0.85)',
            boxShadow: `inset 1px 1px 0 rgba(255,255,255,0.95), inset -1px -1px 0 rgba(255,255,255,0.45), 0 6px 16px ${brand}33`,
          }}>
            <span style={{
              fontFamily: "'Inter', Arial, sans-serif",
              fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4,
              textTransform: 'uppercase', color: '#5C6B62',
            }}>Цена</span>
            <span style={{
              fontFamily: "'Inter', Arial, sans-serif",
              fontSize: 18, fontWeight: 800, color: '#15291C', letterSpacing: -0.3,
            }}>{post.price}</span>
          </div>
        </div>

        {/* Body text */}
        <div style={{
          margin: '0 12px 12px',
          padding: '10px 12px',
          borderRadius: 14,
          background: 'rgba(20,40,28,0.04)',
          fontFamily: "'Inter', Arial, sans-serif",
          fontSize: 13.5, lineHeight: 1.45, color: '#15291C',
          textWrap: 'pretty',
        }}>{post.text}</div>

        {/* Tags — main category highlighted */}
        <div style={{
          padding: '0 14px 14px', marginTop: 'auto',
          display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center',
        }}>
          {mainTag && (
            <span style={{
              height: 28, padding: '0 12px', borderRadius: 999,
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: `linear-gradient(135deg, ${brand}, #1FA85C)`,
              color: '#06301A',
              fontFamily: "'Inter', Arial, sans-serif",
              fontSize: 12.5, fontWeight: 800, letterSpacing: -0.1,
              boxShadow: `0 4px 12px ${brand}55, inset 1px 1px 0 rgba(255,255,255,0.5)`,
            }}>
              <span style={{ fontSize: 11, opacity: 0.75 }}>★</span>
              {mainTag}
            </span>
          )}
          {restTags.map(t => (
            <span key={t} style={{
              height: 26, padding: '0 10px', borderRadius: 999,
              display: 'inline-flex', alignItems: 'center',
              background: 'rgba(46, 204, 113, 0.14)',
              color: '#0E8A4F',
              fontFamily: "'Inter', Arial, sans-serif",
              fontSize: 11.5, fontWeight: 700, letterSpacing: -0.1,
            }}>{t}</span>
          ))}
        </div>
      </article>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Tab bar (same as search)
// ────────────────────────────────────────────────────────────
function FTabBar({ active, setActive, brand }) {
  const tabs = [
    { id: 'feed',   label: 'Лента',   icon: FIcon.feed },
    { id: 'search', label: 'Поиск',   icon: FIcon.searchTab },
    { id: 'add',    label: '',         icon: FIcon.plus, primary: true },
    { id: 'saved',  label: 'Избранное', icon: FIcon.bookmark },
    { id: 'me',     label: 'Профиль', icon: FIcon.user },
  ];
  return (
    <div style={{
      position: 'absolute', left: 14, right: 14, bottom: 18,
      height: 64, borderRadius: 28, zIndex: 30,
    }}>
      <FGlass radius={28} blur={26} tint="rgba(255,255,255,0.6)" style={{ height: 64 }}>
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
                  width: 50, height: 50, padding: 0, background: 'transparent',
                  display: 'grid', placeItems: 'center',
                  filter: `drop-shadow(0 6px 14px ${brand}55)`,
                }}>
                  <svg width="50" height="50" viewBox="0 0 50 50" style={{ display: 'block' }}>
                    <defs>
                      <linearGradient id="plusRingF" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor={brand}/>
                        <stop offset="100%" stopColor="#1FA85C"/>
                      </linearGradient>
                    </defs>
                    <circle cx="25" cy="25" r="23" fill="none" stroke="url(#plusRingF)" strokeWidth="2.5"/>
                    <path d="M25 16v18M16 25h18" stroke="url(#plusRingF)" strokeWidth="2.5" strokeLinecap="round"/>
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
      </FGlass>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Background blobs (matches Search)
// ────────────────────────────────────────────────────────────
function FBackground({ brand, palette }) {
  const palettes = {
    fresh:  { base: '#F4FAF3', blobs: [['46DA8F', 0.55, '20% 18%'], ['8DE0B0', 0.45, '85% 8%'], ['F5D08C', 0.35, '85% 78%'], ['B8E6CC', 0.4, '8% 78%']] },
    citrus: { base: '#FFF8EC', blobs: [['FFC25C', 0.55, '15% 14%'], [brand.replace('#',''), 0.4, '88% 12%'], ['FF9A6B', 0.35, '90% 80%'], ['CDEBA8', 0.45, '12% 80%']] },
    dusk:   { base: '#1A2620', blobs: [[brand.replace('#',''), 0.45, '20% 20%'], ['1FA85C', 0.5, '85% 12%'], ['254A38', 0.6, '90% 78%'], ['0F2E1F', 0.7, '8% 80%']] },
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
function FeedScreen({ tweaks }) {
  const brand = tweaks.brand;
  const [tab, setTab] = useStateF('new');
  const [activeTab, setActiveTab] = useStateF('feed');
  // logged-in user (set to null to see the "Регистрация" CTA)
  const currentUser = null;

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <FBackground brand={brand} palette={tweaks.palette} />

      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        paddingTop: 50, paddingBottom: 0,
      }}>
        <FHeader brand={brand} tab={tab} setTab={setTab} currentUser={currentUser} />

        <div className="hide-scroll" style={{
          flex: 1, overflowY: 'auto',
          scrollSnapType: 'y mandatory',
          paddingBottom: 96,
        }}>
          {POSTS.map(p => (
            <FPostCard key={p.id} post={p} brand={brand} density={tweaks.density} />
          ))}
        </div>
      </div>

      <FTabBar active={activeTab} setActive={setActiveTab} brand={brand} />
    </div>
  );
}

window.FeedScreen = FeedScreen;
