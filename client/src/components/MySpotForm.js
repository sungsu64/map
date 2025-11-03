import React, { useState } from 'react';
import './MySpot.css';

const MySpotForm = ({ onSubmit }) => {
  const [form, setForm] = useState({
    name: '',
    description: '',
    emotion: 'happy',
    visited_date: '',
    is_public: true,
  });

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    onSubmit(form);
    setForm({ name: '', description: '', emotion: 'happy', visited_date: '', is_public: true });
  };

  return (
    <form className="spot-form" onSubmit={handleSubmit}>
      <h3>나만의 장소 기록하기</h3>
      <input name="name" placeholder="장소 이름" value={form.name} onChange={handleChange} required />
      <textarea name="description" placeholder="설명" value={form.description} onChange={handleChange} />
      <label>감정</label>
      <select name="emotion" value={form.emotion} onChange={handleChange}>
        <option value="happy">😊 행복</option>
        <option value="neutral">😐 평범</option>
        <option value="sad">😢 아쉬움</option>
      </select>
      <label>방문 날짜</label>
      <input type="date" name="visited_date" value={form.visited_date} onChange={handleChange} />
      <label>
        <input type="checkbox" name="is_public" checked={form.is_public} onChange={handleChange} /> 공개하기
      </label>
      <button type="submit">등록하기</button>
    </form>
  );
};

export default MySpotForm;
