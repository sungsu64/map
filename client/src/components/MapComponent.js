import React, { useEffect, useRef } from 'react';
import { Map, MapMarker, ZoomControl, MarkerClusterer } from 'react-kakao-maps-sdk';
import '../style/MapComponent.css';

export default function MapComponent({ places, selectedId, hoverId, onSelect, focusBounds }) {
  const mapRef = useRef(null);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const kakao = window.kakao;

    if (places?.length) {
      const bounds = new kakao.maps.LatLngBounds();
      places.forEach(p => bounds.extend(new kakao.maps.LatLng(p.lat, p.lng)));
      map.setBounds(bounds, 36, 36, 36, 36);
      return;
    }
    if (focusBounds) {
      const b = new kakao.maps.LatLngBounds(
        new kakao.maps.LatLng(focusBounds.sw.lat, focusBounds.sw.lng),
        new kakao.maps.LatLng(focusBounds.ne.lat, focusBounds.ne.lng)
      );
      map.setBounds(b, 36, 36, 36, 36);
    }
  }, [places, focusBounds]);

  return (
    <div className="mc-wrap">
      <Map
        ref={mapRef}
        center={{ lat: 37.3943, lng: 126.9568 }}  // 안양시청 근처
        style={{ width: '100%', height: '100%' }}
        level={7}
      >
        <MarkerClusterer averageCenter minLevel={6}>
          {places.map((place) => {
            const highlighted = place.id === selectedId || place.id === hoverId;
            return (
              <MapMarker
                key={place.id}
                position={{ lat: place.lat, lng: place.lng }}
                title={place.name}
                onClick={() => onSelect?.(place)}
                image={highlighted ? {
                  src: 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png',
                  size: { width: 24, height: 35 },
                } : undefined}
              />
            );
          })}
        </MarkerClusterer>
        <ZoomControl position="RIGHT" />
      </Map>
    </div>
  );
}
