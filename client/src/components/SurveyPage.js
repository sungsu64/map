// client/src/components/SurveyPage.js
import React, { useMemo, useState } from 'react';
import '../style/Survey.css';

const QUESTIONS = [
  {
    key: 'relax',
    title: '오늘은 조용한 곳이 좋아요',
    desc: '소음이 적고 편안한 분위기를 선호하나요?',
  },
  {
    key: 'activity',
    title: '몸이 들썩! 활동적인 장소가 좋아요',
    desc: '걷기, 체험, 놀이 등 에너지가 필요한 활동을 원하나요?',
  },
  {
    key: 'novelty',
    title: '새로움에 끌려요',
    desc: '트렌디하거나 색다른 경험을 찾고 있나요?',
  },
  {
    key: 'outdoor',
    title: '실내보다 야외가 좋아요',
    desc: '공원/산책 등 자연과 함께하는 공간을 선호하나요?',
  },
  {
    key: 'crowd_averse',
    title: '사람 많은 곳은 피하고 싶어요',
    desc: '붐비는 장소를 피하고 한적함을 원하나요?',
  },
];

const Scale = ({ value, onChange }) => {
  return (
    <div className="scale">
      {[1, 2, 3, 4, 5].map((v) => (
        <button
          key={v}
          type="button"
          className={`scale-dot ${value === v ? 'active' : ''}`}
          onClick={() => onChange(v)}
          aria-label={`${v}점`}
        >
          {v}
        </button>
      ))}
    </div>
  );
};

export default function SurveyPage({ onComplete, onCancel }) {
  const [answers, setAnswers] = useState({});
  
  const progress = useMemo(() => {
    const filled = Object.keys(answers).length;
    return Math.round((filled / QUESTIONS.length) * 100);
  }, [answers]);

  const handleChange = (key, value) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    const normalize = (v) => (v - 1) / 4;
    const profile = {
      relax: normalize(answers.relax),
      activity: normalize(answers.activity),
      novelty: normalize(answers.novelty),
      outdoor: normalize(answers.outdoor),
      crowd_averse: normalize(answers.crowd_averse),
      createdAt: Date.now(),
    };
    onComplete(profile);
  };

  const canSubmit = Object.keys(answers).length === QUESTIONS.length;

  return (
    <div className="survey-page">
      <div className="survey-card">
        <div className="survey-header">
          <h1>지금의 당신에게 맞춘 추천</h1>
          <p>아래 5개 문항을 선택하면, 당신의 감성 레이더가 켜집니다.</p>
          <div className="progress">
            <div className="bar" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <form className="survey-form" onSubmit={(e) => e.preventDefault()}>
          {QUESTIONS.map((q) => (
            <div className="question" key={q.key}>
              <div className="q-titles">
                <h3>{q.title}</h3>
                <p>{q.desc}</p>
              </div>
              <Scale value={answers[q.key]} onChange={(v) => handleChange(q.key, v)} />
            </div>
          ))}

          <div className="survey-actions">
            <button type="button" className="btn ghost" onClick={onCancel}>
              취소
            </button>
            <button
              type="button"
              className="btn primary"
              disabled={!canSubmit}
              onClick={handleSubmit}
            >
              결과 보기 →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
