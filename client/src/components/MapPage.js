import React, { useEffect, useMemo, useState } from 'react';
import MapComponent from './MapComponent';
import { rankPlaces } from '../utils/scoring';
import '../style/MapPage.css';
import axios from 'axios';

// 안양시 바운딩 박스
const ANYANG_BOUNDS = {
  sw: { lat: 37.33, lng: 126.88 },
  ne: { lat: 37.46, lng: 127.03 },
};

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

const FALLBACK_PLACES = [
  { id: 1, name: '평촌 중앙공원', description: '잔디·분수·산책로가 잘 정비된 힐링 스폿', lat: 37.3926, lng: 127.0069, category: 'park', tags: ['야외선호','휴식','조용함'] },
  { id: 2, name: '안양예술공원', description: '자연과 설치미술이 어우러진 산책 명소', lat: 37.4216, lng: 126.9953, category: 'park', tags: ['야외선호','걷기좋음','조용함'] },
  { id: 3, name: '평촌 카페거리', description: '조용한 카페부터 트렌디한 스폿까지', lat: 37.3917, lng: 126.9559, category: 'cafe', tags: ['한적함','새로움','조용함'] },
  { id: 4, name: '안양1번가', description: '맛집과 쇼핑이 모여있는 번화가', lat: 37.3928, lng: 126.9532, category: 'family', tags: ['활동성','라이브선호','혼잡함'] },
  { id: 5, name: '안양천 산책로(비산동)', description: '물소리와 함께 걷기 좋은 러닝 코스', lat: 37.4038, lng: 126.9417, category: 'park', tags: ['야외선호','런닝','조용함'] },
];

function withinAnyang(lat, lng) {
  return (
    lat >= ANYANG_BOUNDS.sw.lat &&
    lat <= ANYANG_BOUNDS.ne.lat &&
    lng >= ANYANG_BOUNDS.sw.lng &&
    lng <= ANYANG_BOUNDS.ne.lng
  );
}

function matchCategory(place, catKey) {
  if (!place) return false;
  if (catKey === 'all') return true;
  const pCat = String(place.category || '').toLowerCase();
  const tags = (place.tags || []).map(t => String(t).toLowerCase());
  if (catKey === 'study') return pCat === 'solo' || pCat === 'cafe' || tags.includes('study');
  if (catKey === 'pet') return tags.includes('pet') || tags.includes('애견') || pCat === 'pet';
  return pCat === catKey || tags.includes(catKey);
}

const approxKm = (a, b) => {
  if (!a || !b) return null;
  const dy = (a.lat - b.lat) * 111;
  const dx = (a.lng - b.lng) * 88;
  return Math.round(Math.hypot(dx, dy) * 10) / 10;
};

export default function MapPage({ onNavigate, userProfile }) {
  const [places, setPlaces] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [hoverId, setHoverId] = useState(null);
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [userLoc, setUserLoc] = useState(null);
  const [compareIds, setCompareIds] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPlace, setNewPlace] = useState({
    name: '', description: '', lat: '', lng: '', emotion: 'happy', is_public: true,
  });

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
    navigator.geolocation?.getCurrentPosition(
      p => setUserLoc({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => {}
    );
  }, []);

  const anyangOnly = useMemo(() => {
    const inside = places.filter(p => withinAnyang(p.lat, p.lng));
    return inside.length ? inside : FALLBACK_PLACES;
  }, [places]);

  const filtered = useMemo(() => {
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

  const rankedBase = useMemo(() => {
    if (!userProfile) return filtered;
    try { return rankPlaces(userProfile, filtered); }
    catch {
      setError('추천 계산에 문제가 있어 기본 순서로 보여드려요.');
      return filtered;
    }
  }, [userProfile, filtered]);

  const ranked = useMemo(() => {
    if (sortBy === 'distance' && userLoc) {
      const d = (a) => approxKm(a, userLoc) ?? 0;
      return [...rankedBase].sort((a, b) => d(a) - d(b));
    }
    if (sortBy === 'novelty') {
      const score = p => (p._reasons?.includes('새로움') ? 1 : 0);
      return [...rankedBase].sort((a, b) => score(b) - score(a));
    }
    return rankedBase;
  }, [rankedBase, sortBy, userLoc]);

  useEffect(() => { setSelected(null); }, [category, query, sortBy]);

  const toggleCompare = (id) => {
    setCompareIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const compareList = ranked.filter(p => compareIds.includes(p.id));

  // ✅ 새 장소 추가 함수
  const handleAddPlace = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: newPlace.name,
        description: newPlace.description,
        lat: parseFloat(newPlace.lat),
        lng: parseFloat(newPlace.lng),
        category: 'custom',
        emotion: newPlace.emotion,
        is_public: newPlace.is_public,
      };
      await axios.post('http://localhost:5000/api/spots', payload);
      setPlaces(prev => [...prev, { id: Date.now(), ...payload }]);
      setShowAddForm(false);
      setNewPlace({ name: '', description: '', lat: '', lng: '', emotion: 'happy', is_public: true });
    } catch {
      alert('장소 추가 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="mp-page warm">
      <header className="mp-header">
        <div className="mp-title">
          <h1>안양 맞춤 추천</h1>
          <span className="mp-badge">경기도 안양시</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="mp-home-btn" onClick={onNavigate}>메인으로</button>
          <button className="mp-home-btn" onClick={() => setShowAddForm(true)}>＋ 장소 추가</button>
        </div>
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

      {/* 검색/정렬 */}
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

      {/* 지도 */}
      <section className="mp-hero">
        <MapComponent
          places={ranked}
          selectedId={selected?.id}
          hoverId={hoverId}
          compareIds={compareIds}
          onSelect={(pl) => setSelected(pl)}
          focusBounds={ANYANG_BOUNDS}
        />
      </section>

      {/* 리스트 */}
      <section className="mp-list-block">
        <div className="mp-list-header">
          <h2>추천 리스트</h2>
          {error && <p className="mp-error">{error}</p>}
        </div>
        {loading ? (
          <div className="mp-empty">로딩중...</div>
        ) : ranked.length === 0 ? (
          <div className="mp-empty">해당 조건에 맞는 장소가 없어요.</div>
        ) : (
          <ul className="mp-cards">
            {ranked.map((p) => {
              const checked = compareIds.includes(p.id);
              return (
                <li key={p.id} className={`mp-card ${selected?.id === p.id ? 'active' : ''}`}>
                  <div className="mp-thumb" />
                  <div className="mp-info" onClick={() => setSelected(p)}>
                    <div className="mp-name">{p.name}</div>
                    <div className="mp-desc">{p.description}</div>
                    <div className="mp-meta">
                      <span className="mp-cat">{p.category || '기타'}</span>
                      {userLoc && (
                        <span className="mp-distance">≈ {approxKm(p, userLoc)} km</span>
                      )}
                    </div>
                  </div>
                  <label className="cmp-check">
                    <input type="checkbox" checked={checked} onChange={() => toggleCompare(p.id)} />
                    <span>비교</span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* 비교 패널 */}
      {compareList.length > 0 && (
        <section className="mp-compare">
          <div className="cmp-header">
            <div className="cmp-title">비교하기</div>
            <button className="cmp-clear" onClick={() => setCompareIds([])}>전체 해제</button>
          </div>
          <div className="cmp-grid">
            {compareList.map(p => (
              <div key={p.id} className="cmp-card">
                <div className="cmp-name">{p.name}</div>
                <div className="cmp-desc">{p.description}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 🌟 나만의 장소 추가 모달 */}
      {showAddForm && (
        <div className="spot-modal">
          <form className="spot-form" onSubmit={handleAddPlace}>
            <h3>나만의 장소 추가</h3>
            <input
              placeholder="장소 이름"
              value={newPlace.name}
              onChange={(e) => setNewPlace({ ...newPlace, name: e.target.value })}
              required
            />
            <textarea
              placeholder="설명"
              value={newPlace.description}
              onChange={(e) => setNewPlace({ ...newPlace, description: e.target.value })}
            />
            <div className="spot-row">
              <input
                placeholder="위도(lat)"
                value={newPlace.lat}
                onChange={(e) => setNewPlace({ ...newPlace, lat: e.target.value })}
                required
              />
              <input
                placeholder="경도(lng)"
                value={newPlace.lng}
                onChange={(e) => setNewPlace({ ...newPlace, lng: e.target.value })}
                required
              />
            </div>
            <label>감정</label>
            <select
              value={newPlace.emotion}
              onChange={(e) => setNewPlace({ ...newPlace, emotion: e.target.value })}
            >
              <option value="happy">😊 행복</option>
              <option value="neutral">😐 평범</option>
              <option value="sad">😢 아쉬움</option>
            </select>
            <label>
              <input
                type="checkbox"
                checked={newPlace.is_public}
                onChange={(e) => setNewPlace({ ...newPlace, is_public: e.target.checked })}
              /> 공개하기
            </label>
            <div className="spot-actions">
              <button type="submit">등록</button>
              <button type="button" onClick={() => setShowAddForm(false)}>취소</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
