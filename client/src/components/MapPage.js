import React, { useEffect, useMemo, useState } from 'react';
import MapComponent from './MapComponent';
import { rankPlaces } from '../utils/scoring';
import '../style/MapPage.css';

// 안양시 바운딩 박스(여유 포함)
const ANYANG_BOUNDS = {
  sw: { lat: 37.33, lng: 126.88 },
  ne: { lat: 37.46, lng: 127.03 },
};

// 상단 카테고리 탭
const CATEGORIES = [
  { key: 'all', label: '전체' },
  { key: 'solo', label: '혼밥/혼자' },
  { key: 'family', label: '가족' },
  { key: 'pet', label: '애견동반' },
  { key: 'couple', label: '데이트' },
  { key: 'study', label: '공부/작업' },
  { key: 'park', label: '공원' },
  { key: 'cafe', label: '카페' },
];

// 안양 데모(최소 보장)
const FALLBACK_PLACES = [
  { id: 1, name: '평촌 중앙공원', description: '잔디·분수·산책로가 잘 정비된 힐링 스폿', lat: 37.3926, lng: 127.0069, category: 'park' },
  { id: 2, name: '안양예술공원', description: '자연과 설치미술이 어우러진 산책 명소', lat: 37.4216, lng: 126.9953, category: 'park' },
  { id: 3, name: '평촌 카페거리', description: '조용한 카페부터 트렌디한 스폿까지', lat: 37.3917, lng: 126.9559, category: 'cafe' },
  { id: 4, name: '안양1번가', description: '맛집과 쇼핑이 모여있는 번화가', lat: 37.3928, lng: 126.9532, category: 'family' },
  { id: 5, name: '안양천 산책로(비산동)', description: '물소리와 함께 걷기 좋은 러닝 코스', lat: 37.4038, lng: 126.9417, category: 'park' },
];

function withinAnyang(lat, lng) {
  return (
    lat >= ANYANG_BOUNDS.sw.lat &&
    lat <= ANYANG_BOUNDS.ne.lat &&
    lng >= ANYANG_BOUNDS.sw.lng &&
    lng <= ANYANG_BOUNDS.ne.lng
  );
}

// 느슨한 카테고리 매칭
function matchCategory(place, catKey) {
  if (!place) return false;
  if (catKey === 'all') return true;
  const pCat = String(place.category || '').toLowerCase();
  const tags = (place.tags || []).map(t => String(t).toLowerCase());
  if (catKey === 'study') return pCat === 'solo' || pCat === 'cafe' || tags.includes('study');
  if (catKey === 'pet') return tags.includes('pet') || tags.includes('애견') || pCat === 'pet';
  return pCat === catKey || tags.includes(catKey);
}

export default function MapPage({ onNavigate, userProfile }) {
  const [places, setPlaces] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState(null);
  const [hoverId, setHoverId] = useState(null);

  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('default'); // default | distance | novelty
  const [userLoc, setUserLoc] = useState(null);

  useEffect(() => {
    let alive = true;
    fetch('http://localhost:5000/api/places')
      .then((res) => res.json())
      .then((data) => {
        if (!alive) return;
        const base = Array.isArray(data) && data.length ? data : FALLBACK_PLACES;
        setPlaces(base);
      })
      .catch(() => setPlaces(FALLBACK_PLACES))
      .finally(() => setLoading(false));
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    // 현재 위치 얻기(정렬용)
    navigator.geolocation?.getCurrentPosition(
      p => setUserLoc({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {}
    );
  }, []);

  // 1) 안양시 한정
  const anyangOnly = useMemo(() => {
    const inside = places.filter(p => withinAnyang(p.lat, p.lng));
    return inside.length ? inside : FALLBACK_PLACES;
  }, [places]);

  // 2) 카테고리 + 검색
  const filteredByCategory = useMemo(() => {
    const q = query.trim().toLowerCase();
    return anyangOnly
      .filter(p => matchCategory(p, category))
      .filter(p => {
        if (!q) return true;
        const name = String(p.name || '').toLowerCase();
        const desc = String(p.description || '').toLowerCase();
        return name.includes(q) || desc.includes(q);
      });
  }, [anyangOnly, category, query]);

  // 3) 성향 기반 정렬(표시는 안 함)
  const rankedBase = useMemo(() => {
    if (!userProfile) return filteredByCategory;
    try { return rankPlaces(userProfile, filteredByCategory); }
    catch {
      setError('추천 계산에 문제가 있어 기본 순서로 보여드려요.');
      return filteredByCategory;
    }
  }, [userProfile, filteredByCategory]);

  // 4) 정렬 옵션
  const ranked = useMemo(() => {
    if (sortBy === 'distance' && userLoc) {
      const d = (a) => Math.hypot((a.lat - userLoc.lat) * 111, (a.lng - userLoc.lng) * 88);
      return [...rankedBase].sort((a, b) => d(a) - d(b));
    }
    if (sortBy === 'novelty') {
      const score = p => (p._reasons?.includes('새로움') ? 1 : 0);
      return [...rankedBase].sort((a, b) => score(b) - score(a));
    }
    return rankedBase;
  }, [rankedBase, sortBy, userLoc]);

  useEffect(() => { setSelected(null); }, [category, query, sortBy]);

  return (
    <div className="mp-page warm">
      <header className="mp-header">
        <div className="mp-title">
          <h1>안양 맞춤 추천</h1>
          <span className="mp-badge">경기도 안양시</span>
        </div>
        <button className="mp-home-btn" onClick={onNavigate}>메인으로</button>
      </header>

      {/* 카테고리 */}
      <div className="mp-categories">
        {CATEGORIES.map(c => (
          <button
            key={c.key}
            className={`mp-cat-btn ${category === c.key ? 'active' : ''}`}
            onClick={() => setCategory(c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* 툴바: 검색/정렬/카운트 */}
      <div className="mp-toolbar">
        <div className="mp-toolbar-left">
          <input
            className="mp-search"
            placeholder="장소 검색 (예: 공원, 카페, 산책)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <span className="mp-count">{loading ? '로딩중...' : `${ranked.length}개`}</span>
        </div>
        <select className="mp-sort" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="default">추천순</option>
          <option value="distance">거리순</option>
          <option value="novelty">새로움 높은순</option>
        </select>
      </div>

      {/* 상단 공백 없이 지도 */}
      <section className="mp-hero">
        <MapComponent
          places={ranked}
          selectedId={selected?.id}
          hoverId={hoverId}
          onSelect={(pl) => setSelected(pl)}
          focusBounds={ANYANG_BOUNDS}
        />
      </section>

      {/* 지도 아래 추천 리스트 */}
      <section className="mp-list-block">
        <div className="mp-list-header">
          <h2>추천 리스트</h2>
          {error && <p className="mp-error">{error}</p>}
        </div>

        {loading ? (
          <ul className="mp-cards">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="mp-card skeleton">
                <div className="mp-thumb sk" />
                <div className="mp-info">
                  <div className="sk-line w60"></div>
                  <div className="sk-line w90"></div>
                  <div className="sk-line w40"></div>
                </div>
              </li>
            ))}
          </ul>
        ) : ranked.length === 0 ? (
          <div className="mp-empty">해당 조건에 맞는 장소가 없어요.</div>
        ) : (
          <ul className="mp-cards">
            {ranked.map((p) => (
              <li
                key={p.id}
                className={`mp-card ${selected?.id === p.id ? 'active' : ''}`}
                onClick={() => setSelected(p)}
                onMouseEnter={() => setHoverId(p.id)}
                onMouseLeave={() => setHoverId(null)}
              >
                <div className="mp-thumb" />
                <div className="mp-info">
                  <div className="mp-name">{p.name}</div>
                  <div className="mp-desc">{p.description}</div>
                  <div className="mp-meta">
                    <span className="mp-cat">{p.category || '기타'}</span>
                    {userLoc && (
                      <span className="mp-distance">
                        ≈ {Math.round(Math.hypot((p.lat - userLoc.lat) * 111, (p.lng - userLoc.lng) * 88) * 10) / 10} km
                      </span>
                    )}
                  </div>
                  {Array.isArray(p._reasons) && p._reasons.length > 0 && (
                    <div className="mp-chips">
                      {p._reasons.map((r) => <span key={r} className="mp-chip">#{r}</span>)}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
