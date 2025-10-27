// client/src/utils/scoring.js

// 장소 객체에서 성향 벡터를 추론하는 헬퍼
export function placeToVector(place) {
  const hasDBVibes =
    place.vibe_relax !== undefined ||
    place.vibe_activity !== undefined ||
    place.vibe_trendy !== undefined ||
    place.vibe_outdoor !== undefined ||
    place.vibe_crowd_averse !== undefined;

  if (hasDBVibes) {
    return {
      relax: Number(place.vibe_relax ?? 0.5),
      activity: Number(place.vibe_activity ?? 0.5),
      novelty: Number(place.vibe_trendy ?? 0.5),
      outdoor: Number(place.vibe_outdoor ?? 0.5),
      crowd_averse: Number(place.vibe_crowd_averse ?? 0.5),
    };
  }

  const base = {
    relax: 0.5,
    activity: 0.5,
    novelty: 0.5,
    outdoor: 0.5,
    crowd_averse: 0.5,
  };

  const cat = (place.category || '').toLowerCase();
  const presets = {
    solo: { relax: 0.85, activity: 0.2, novelty: 0.4, outdoor: 0.2, crowd_averse: 0.8 },
    couple: { relax: 0.6, activity: 0.5, novelty: 0.6, outdoor: 0.6, crowd_averse: 0.5 },
    family: { relax: 0.4, activity: 0.8, novelty: 0.6, outdoor: 0.5, crowd_averse: 0.3 },
    park: { relax: 0.7, activity: 0.5, novelty: 0.4, outdoor: 0.9, crowd_averse: 0.6 },
    museum: { relax: 0.8, activity: 0.2, novelty: 0.5, outdoor: 0.2, crowd_averse: 0.8 },
    amusement: { relax: 0.3, activity: 0.95, novelty: 0.8, outdoor: 0.6, crowd_averse: 0.1 },
    cafe: { relax: 0.7, activity: 0.2, novelty: 0.5, outdoor: 0.2, crowd_averse: 0.7 },
  };

  return { ...base, ...(presets[cat] || {}) };
}

// 점수 산출
export function scorePlace(user, place) {
  const v = placeToVector(place);
  const w = { relax: 1.0, activity: 0.9, novelty: 0.8, outdoor: 0.7, crowd_averse: 1.0 };

  const contributions = {
    relax: w.relax * user.relax * v.relax,
    activity: w.activity * user.activity * v.activity,
    novelty: w.novelty * user.novelty * v.novelty,
    outdoor: w.outdoor * user.outdoor * v.outdoor,
    crowd_averse: w.crowd_averse * user.crowd_averse * v.crowd_averse,
  };

  const raw = Object.values(contributions).reduce((a, b) => a + b, 0);
  
  return { raw: Number(raw.toFixed(4)), contributions };
}

const MAX_SUM = 1.0 + 0.9 + 0.8 + 0.7 + 1.0;

// 점수 → 퍼센트
export function scoreToPercent(rawScore) {
  const pct = Math.round((rawScore / MAX_SUM) * 100);
  return Math.max(0, Math.min(100, pct));
}

// 추천 이유 텍스트
export function reasonsFromContrib(contributions) {
  const label = {
    relax: '조용함',
    activity: '활동성',
    novelty: '새로움',
    outdoor: '야외선호',
    crowd_averse: '한적함',
  };

  return Object.entries(contributions)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k]) => label[k]);
}

// 전체 장소 추천 정렬
export function rankPlaces(user, places) {
  return [...places]
    .map((p) => {
      const s = scorePlace(user, p);
      return {
        ...p,
        _scoreRaw: s.raw,
        score: scoreToPercent(s.raw),
        _reasons: reasonsFromContrib(s.contributions),
      };
    })
    .sort((a, b) => b._scoreRaw - a._scoreRaw);
}
