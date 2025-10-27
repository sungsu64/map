import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import SurveyPage from './components/SurveyPage';
import MapPage from './components/MapPage';
import './style/App.css';


function App() {
const [view, setView] = useState('landing'); // 'landing' | 'survey' | 'map'
const [userProfile, setUserProfile] = useState(null); // 설문 결과 벡터


if (view === 'landing') {
return <LandingPage onNavigate={() => setView('survey')} />;
}


if (view === 'survey') {
return (
<SurveyPage
onCancel={() => setView('landing')}
onComplete={(profile) => {
setUserProfile(profile);
setView('map');
}}
/>
);
}


if (view === 'map') {
return <MapPage onNavigate={() => setView('landing')} userProfile={userProfile} />;
}
}


export default App;