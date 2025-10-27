import React, { useState, useEffect, useRef } from 'react';

// --- 동적인 캔버스 배경 컴포넌트 ---
const AnimatedBackground = ({ theme }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let particles = [];
    
    const themeColors = {
      default: 'rgba(255, 255, 255, 0.5)', calm: 'rgba(100, 150, 255, 0.6)',
      vibrant: 'rgba(255, 100, 100, 0.6)', romantic: 'rgba(255, 100, 200, 0.6)',
    };

    const setupCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particles = [];
      const particleCount = Math.floor(canvas.width * canvas.height / 20000);
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle(Math.random() * canvas.width, Math.random() * canvas.height));
      }
    };
    
    class Particle { /* ... Particle 로직은 이전과 동일 ... */ 
      constructor(x, y) {
        this.x = x; this.y = y;
        this.vx = Math.random() * 0.4 - 0.2;
        this.vy = Math.random() * 0.4 - 0.2;
      }
      update() {
        this.x += this.vx; this.y += this.vy;
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = themeColors[theme] || themeColors.default;
        ctx.fill();
      }
    }

    const connect = () => { /* ... connect 로직은 이전과 동일 ... */
      for (let i = 0; i < particles.length; i++) {
        for (let j = i; j < particles.length; j++) {
          const distance = Math.hypot(particles[i].x - particles[j].x, particles[i].y - particles[j].y);
          if (distance < 120) {
            ctx.beginPath();
            ctx.strokeStyle = themeColors[theme] || themeColors.default;
            ctx.lineWidth = 0.2;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    };

    let animationFrameId;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { p.update(); p.draw(); });
      connect();
      animationFrameId = requestAnimationFrame(animate);
    };

    setupCanvas();
    animate();
    window.addEventListener('resize', setupCanvas);

    return () => {
      window.removeEventListener('resize', setupCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  return <canvas ref={canvasRef} className="landing-canvas" />;
};

// --- 메인 페이지 컴포넌트 ---
const LandingPage = ({ onNavigate }) => {
  const [activeTheme, setActiveTheme] = useState('default');
  
  return (
    <div className="landing-page">
      <AnimatedBackground theme={activeTheme} />
      <h1>나만의 감성으로 발견하는 도시</h1>
      <p>기록하는 모든 발자국이 작품이 됩니다.</p>
      <div className="theme-filters">
        <button onMouseOver={() => setActiveTheme('calm')} onMouseOut={() => setActiveTheme('default')}>#고요한</button>
        <button onMouseOver={() => setActiveTheme('vibrant')} onMouseOut={() => setActiveTheme('default')}>#활기찬</button>
        <button onMouseOver={() => setActiveTheme('romantic')} onMouseOut={() => setActiveTheme('default')}>#낭만적인</button>
      </div>
      <button className="cta-button" onClick={onNavigate}>
        지도 보러가기 →
      </button>
    </div>
  );
};

export default LandingPage;
