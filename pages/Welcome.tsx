
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const FEATURES = [
  { icon: '💬', label: 'Live Shouts' },
  { icon: '🏏', label: 'Cricket League' },
  { icon: '🎮', label: 'Mini Games' },
  { icon: '🏆', label: 'Tournaments' },
  { icon: '💰', label: 'Earn Coins' },
  { icon: '👥', label: 'Friends' },
  { icon: '🔥', label: 'Challenges' },
  { icon: '🎁', label: 'Rewards' },
];

const AVATARS = [
  'https://picsum.photos/seed/av1/80',
  'https://picsum.photos/seed/av2/80',
  'https://picsum.photos/seed/av3/80',
  'https://picsum.photos/seed/av4/80',
  'https://picsum.photos/seed/av5/80',
];

const Welcome: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [count, setCount] = useState({ users: 0, tournaments: 0, posts: 0 });
  const [pill, setPill] = useState(0);

  // Animated counter
  useEffect(() => {
    const targets = { users: 2500, tournaments: 150, posts: 500 };
    const duration = 1800;
    const steps = 60;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const progress = step / steps;
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount({
        users: Math.round(ease * targets.users),
        tournaments: Math.round(ease * targets.tournaments),
        posts: Math.round(ease * targets.posts),
      });
      if (step >= steps) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, []);

  // Rotating feature pill
  useEffect(() => {
    const t = setInterval(() => setPill(p => (p + 1) % FEATURES.length), 2000);
    return () => clearInterval(t);
  }, []);

  // Canvas particle animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 55 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 2 + 0.5,
      dx: (Math.random() - 0.5) * 0.4,
      dy: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.5 + 0.1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(167,139,250,${p.alpha})`;
        ctx.fill();
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="welcome-root overflow-x-hidden">
      {/* Particle canvas */}
      <canvas ref={canvasRef} className="welcome-canvas" />

      {/* Glow blobs */}
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      {/* Content */}
      <div className="welcome-content">

        {/* TOP NAV */}
        <nav className="welcome-nav">
          <div className="nav-brand">
            <span className="brand-dot" />
            <span className="brand-name">friends bd</span>
          </div>
          <div className="nav-pill">
            <span className="live-dot" />
            {count.users.toLocaleString()}+ Online
          </div>
        </nav>

        {/* HERO */}
        <section className="hero-section">
          {/* Floating avatars cluster */}
          <div className="avatar-cluster">
            {AVATARS.map((src, i) => (
              <img
                key={i}
                src={src}
                alt=""
                className="avatar-img"
                style={{ '--i': i } as React.CSSProperties}
              />
            ))}
            <div className="avatar-badge">🔴 Live</div>
          </div>

          {/* Rotating feature chip */}
          <div className="feature-chip">
            <span className="chip-icon">{FEATURES[pill].icon}</span>
            <span className="chip-label">{FEATURES[pill].label}</span>
          </div>

          {/* Main headline */}
          <h1 className="hero-title">
            Bangladesh's
            <span className="gradient-text"> #1 Social</span>
            <br />Gaming Community
          </h1>

          <p className="hero-sub">
            Chat, compete, earn rewards & make friends — all in one vibrant platform built for Bangladesh.
          </p>

          {/* CTA Buttons */}
          <div className="cta-group">
            <button
              id="welcome-login-btn"
              className="cta-primary"
              onClick={() => navigate('/login')}
            >
              <span>Login to Account</span>
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
            <button
              id="welcome-signup-btn"
              className="cta-secondary"
              onClick={() => navigate('/signup')}
            >
              <span>Create Free Account</span>
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </button>
          </div>

          {/* Trust line */}
          <div className="trust-line">
            <div className="trust-avatars">
              {AVATARS.slice(0, 3).map((src, i) => (
                <img key={i} src={src} alt="" className="trust-av" style={{ marginLeft: i > 0 ? '-8px' : '0' }} />
              ))}
            </div>
            <span className="trust-text">Joined by <strong>2,500+</strong> members this month</span>
          </div>
        </section>

        {/* STATS BAR */}
        <div className="stats-bar">
          {[
            { value: `${count.users.toLocaleString()}+`, label: 'Active Users', icon: '👥' },
            { value: `${count.tournaments}+`, label: 'Tournaments', icon: '🏆' },
            { value: `${count.posts}+`, label: 'Daily Posts', icon: '📣' },
            { value: '24/7', label: 'Community', icon: '🌐' },
          ].map((s, i) => (
            <div key={i} className="stat-item">
              <span className="stat-icon">{s.icon}</span>
              <span className="stat-value">{s.value}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* FEATURE PILLS ROW */}
        <div className="pills-row">
          {FEATURES.map((f, i) => (
            <div key={i} className={`feature-pill ${i === pill ? 'pill-active' : ''}`}>
              {f.icon} {f.label}
            </div>
          ))}
        </div>

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');

        .welcome-root {
          min-height: 100vh;
          background: #0a0612;
          font-family: 'Inter', sans-serif;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .welcome-canvas {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
        }

        /* Glow blobs */
        .blob {
          position: fixed;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.18;
          pointer-events: none;
          z-index: 0;
          animation: blobFloat 8s ease-in-out infinite alternate;
        }
        .blob-1 {
          width: 500px; height: 500px;
          background: #7c3aed;
          top: -150px; left: -100px;
          animation-delay: 0s;
        }
        .blob-2 {
          width: 400px; height: 400px;
          background: #db2777;
          bottom: -100px; right: -100px;
          animation-delay: 3s;
        }
        .blob-3 {
          width: 300px; height: 300px;
          background: #2563eb;
          top: 40%; left: 50%;
          transform: translate(-50%, -50%);
          animation-delay: 1.5s;
        }
        @keyframes blobFloat {
          from { transform: scale(1) translateY(0); }
          to { transform: scale(1.1) translateY(-30px); }
        }

        /* Content wrapper */
        .welcome-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          padding: 0 1.25rem 2rem;
          max-width: 480px;
          margin: 0 auto;
          width: 100%;
        }

        /* NAV */
        .welcome-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 0;
        }
        .nav-brand {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .brand-dot {
          width: 10px; height: 10px;
          border-radius: 50%;
          background: linear-gradient(135deg, #a78bfa, #ec4899);
          box-shadow: 0 0 10px #a78bfa99;
        }
        .brand-name {
          font-size: 1.1rem;
          font-weight: 900;
          color: #fff;
          letter-spacing: -0.02em;
          font-style: italic;
        }
        .nav-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 999px;
          padding: 6px 14px;
          font-size: 0.7rem;
          font-weight: 700;
          color: #e2e8f0;
          backdrop-filter: blur(8px);
        }
        .live-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: #4ade80;
          box-shadow: 0 0 8px #4ade80;
          animation: pulse 1.5s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.85); }
        }

        /* HERO */
        .hero-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 1rem 0 2rem;
          gap: 1.25rem;
        }

        /* Avatar cluster */
        .avatar-cluster {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0.5rem;
        }
        .avatar-img {
          width: 52px; height: 52px;
          border-radius: 50%;
          border: 2.5px solid #0a0612;
          object-fit: cover;
          position: relative;
          transition: transform 0.3s;
          box-shadow: 0 0 20px rgba(167,139,250,0.3);
          animation: floatAv 3s ease-in-out infinite alternate;
          animation-delay: calc(var(--i) * 0.4s);
          margin-left: -10px;
        }
        .avatar-img:first-child { margin-left: 0; }
        @keyframes floatAv {
          from { transform: translateY(0); }
          to { transform: translateY(-6px); }
        }
        .avatar-badge {
          position: absolute;
          bottom: -10px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #7c3aed, #ec4899);
          color: #fff;
          font-size: 0.6rem;
          font-weight: 800;
          padding: 3px 10px;
          border-radius: 999px;
          white-space: nowrap;
          box-shadow: 0 4px 15px rgba(124,58,237,0.5);
        }

        /* Rotating feature chip */
        .feature-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(167,139,250,0.12);
          border: 1px solid rgba(167,139,250,0.25);
          border-radius: 999px;
          padding: 8px 18px;
          font-size: 0.72rem;
          font-weight: 700;
          color: #c4b5fd;
          backdrop-filter: blur(8px);
          transition: all 0.4s ease;
          margin-top: 0.75rem;
        }
        .chip-icon { font-size: 1rem; }
        .chip-label { letter-spacing: 0.04em; }

        /* Headline */
        .hero-title {
          font-size: clamp(2rem, 8vw, 2.6rem);
          font-weight: 900;
          color: #fff;
          line-height: 1.1;
          letter-spacing: -0.03em;
          margin: 0;
        }
        .gradient-text {
          background: linear-gradient(135deg, #a78bfa 0%, #ec4899 60%, #f59e0b 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Sub */
        .hero-sub {
          font-size: 0.85rem;
          color: #94a3b8;
          line-height: 1.65;
          max-width: 340px;
          margin: 0 auto;
        }

        /* CTAs */
        .cta-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
          max-width: 360px;
          margin: 0 auto;
        }
        .cta-primary {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          background: linear-gradient(135deg, #7c3aed, #9333ea);
          color: #fff;
          font-size: 0.8rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 17px 24px;
          border-radius: 1.25rem;
          border: none;
          cursor: pointer;
          box-shadow: 0 8px 30px rgba(124,58,237,0.45), inset 0 1px 0 rgba(255,255,255,0.15);
          transition: all 0.22s ease;
          position: relative;
          overflow: hidden;
        }
        .cta-primary::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #8b5cf6, #a855f7);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .cta-primary:hover::before { opacity: 1; }
        .cta-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 35px rgba(124,58,237,0.6); }
        .cta-primary:active { transform: scale(0.97); }
        .cta-primary span, .cta-primary svg { position: relative; z-index: 1; }

        .cta-secondary {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          background: rgba(255,255,255,0.05);
          color: #e2e8f0;
          font-size: 0.8rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 17px 24px;
          border-radius: 1.25rem;
          border: 1.5px solid rgba(255,255,255,0.12);
          cursor: pointer;
          backdrop-filter: blur(8px);
          transition: all 0.22s ease;
        }
        .cta-secondary:hover {
          background: rgba(255,255,255,0.1);
          border-color: rgba(167,139,250,0.4);
          transform: translateY(-2px);
          color: #fff;
        }
        .cta-secondary:active { transform: scale(0.97); }

        /* Trust line */
        .trust-line {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.72rem;
          color: #64748b;
          font-weight: 500;
        }
        .trust-avatars { display: flex; }
        .trust-av {
          width: 24px; height: 24px;
          border-radius: 50%;
          border: 2px solid #0a0612;
          object-fit: cover;
        }
        .trust-text strong { color: #a78bfa; }

        /* STATS BAR */
        .stats-bar {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 1.5rem;
          padding: 1rem 0.5rem;
          backdrop-filter: blur(12px);
          gap: 0;
        }
        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          padding: 0.25rem 0;
          border-right: 1px solid rgba(255,255,255,0.06);
        }
        .stat-item:last-child { border-right: none; }
        .stat-icon { font-size: 1rem; }
        .stat-value {
          font-size: 0.9rem;
          font-weight: 900;
          color: #fff;
          letter-spacing: -0.02em;
        }
        .stat-label {
          font-size: 0.55rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        /* FEATURE PILLS ROW */
        .pills-row {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding: 0.75rem 0 0.25rem;
          scrollbar-width: none;
          -ms-overflow-style: none;
          mask-image: linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%);
        }
        .pills-row::-webkit-scrollbar { display: none; }
        .feature-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 999px;
          padding: 7px 14px;
          font-size: 0.68rem;
          font-weight: 700;
          color: #94a3b8;
          transition: all 0.3s ease;
          cursor: default;
          flex-shrink: 0;
        }
        .pill-active {
          background: rgba(167,139,250,0.15);
          border-color: rgba(167,139,250,0.35);
          color: #c4b5fd;
          box-shadow: 0 0 15px rgba(167,139,250,0.15);
        }
      `}</style>
    </div>
  );
};

export default Welcome;

