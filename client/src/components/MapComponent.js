/* global kakao */
import React, { useEffect, useState } from 'react';
import { Map, MapMarker, Polyline, ZoomControl } from 'react-kakao-maps-sdk';
import '../style/MapComponent.css';

// 🧮 거리 계산 (Haversine)
function getDistance(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(x));
}

// 🧭 Greedy 경로 탐색
function shortestPath(places) {
  if (places.length <= 2) return places;
  const remaining = [...places];
  const path = [remaining.shift()];
  while (remaining.length > 0) {
    const last = path[path.length - 1];
    const next = remaining.reduce((a, b) =>
      getDistance(last, a) < getDistance(last, b) ? a : b
    );
    path.push(next);
    remaining.splice(remaining.indexOf(next), 1);
  }
  return path;
}

// 감정별 색상
const emotionColors = {
  happy: '#FFD166', // 노랑
  neutral: '#6DB1FF', // 파랑
  sad: '#A3A3A3', // 회색
};

export default function MapComponent({ places = [] }) {
  const [mapCenter, setMapCenter] = useState({ lat: 37.3943, lng: 126.9568 });
  const [selectedPlaces, setSelectedPlaces] = useState([]);
  const [optimizedPath, setOptimizedPath] = useState([]);
  const [emotionFilter, setEmotionFilter] = useState('all');

  // 마커 클릭 시 선택/해제
  const toggleSelect = (place) => {
    setSelectedPlaces((prev) => {
      const exists = prev.find((p) => p.id === place.id);
      if (exists) return prev.filter((p) => p.id !== place.id);
      return [...prev, place];
    });
  };

  // 경로 최적화
  const handleOptimize = () => {
    if (selectedPlaces.length < 2) {
      alert('두 개 이상의 장소를 선택하세요!');
      return;
    }
    const path = shortestPath(selectedPlaces);
    setOptimizedPath(path);
  };

  // 지도 중심 이동
  useEffect(() => {
    if (optimizedPath.length) {
      setMapCenter({
        lat: optimizedPath[0].lat,
        lng: optimizedPath[0].lng,
      });
    }
  }, [optimizedPath]);

  // 감정 필터 적용
  const filteredPlaces =
    emotionFilter === 'all'
      ? places
      : places.filter((p) => p.emotion === emotionFilter);

  return (
    <div className="mc-wrap">
      <Map
        center={mapCenter}
        style={{ width: '100%', height: '100%' }}
        level={7}
      >
        {filteredPlaces.map((place) => {
          const selected = selectedPlaces.some((p) => p.id === place.id);
          const number = optimizedPath.findIndex((p) => p.id === place.id) + 1;

          return (
            <MapMarker
              key={place.id}
              position={{ lat: place.lat, lng: place.lng }}
              title={place.name}
              onClick={() => toggleSelect(place)}
              image={{
                src:
                  selected
                    ? 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png'
                    : `https://via.placeholder.com/30/${emotionColors[
                        place.emotion || 'neutral'
                      ].substring(1)}/ffffff?text=•`,
                size: { width: 30, height: 42 },
              }}
            >
              {number > 0 && (
                <div
                  style={{
                    color: '#fff',
                    fontWeight: 'bold',
                    textShadow: '0 0 3px #000',
                  }}
                >
                  {number}
                </div>
              )}
            </MapMarker>
          );
        })}

        {optimizedPath.length > 1 && (
          <Polyline
            path={optimizedPath.map((p) => ({
              lat: p.lat,
              lng: p.lng,
            }))}
            strokeWeight={5}
            strokeColor="#c38b66"
            strokeOpacity={0.9}
            strokeStyle="solid"
          />
        )}

        <ZoomControl position="RIGHT" />
      </Map>

      {/* 🔘 상단 컨트롤 UI */}
      <div className="route-controls">
        <button className="rc-btn" onClick={handleOptimize}>
          🚗 경로 최적화
        </button>
        {optimizedPath.length > 1 && (
          <div className="rc-info">
            {optimizedPath.length}개 장소 경로 표시 중
          </div>
        )}
      </div>

      {/* 😊 감정 필터 UI */}
      <div className="emotion-filter">
        <button
          onClick={() => setEmotionFilter('all')}
          className={emotionFilter === 'all' ? 'active' : ''}
        >
          전체
        </button>
        <button
          onClick={() => setEmotionFilter('happy')}
          className={emotionFilter === 'happy' ? 'active' : ''}
        >
          😊 행복
        </button>
        <button
          onClick={() => setEmotionFilter('neutral')}
          className={emotionFilter === 'neutral' ? 'active' : ''}
        >
          😐 평범
        </button>
        <button
          onClick={() => setEmotionFilter('sad')}
          className={emotionFilter === 'sad' ? 'active' : ''}
        >
          😢 아쉬움
        </button>
      </div>

      {/* 🧾 하단 나의 장소 리스트 */}
      <div className="map-card-list">
        {filteredPlaces.map((p) => (
          <div
            key={p.id}
            className={`map-card ${
              selectedPlaces.some((s) => s.id === p.id) ? 'active' : ''
            }`}
            onClick={() => toggleSelect(p)}
          >
            <h4>{p.name}</h4>
            <p>{p.description}</p>
            <div className="route-indicator">
              {p.emotion === 'happy'
                ? '😊 행복한 추억'
                : p.emotion === 'sad'
                ? '😢 아쉬운 기억'
                : '😐 평범한 하루'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
