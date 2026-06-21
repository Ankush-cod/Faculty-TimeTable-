import { useEffect, useRef } from 'react';

const COLORS = [
  '#6366f1', '#818cf8', '#a5b4fc', // indigo
  '#22d3ee', '#06b6d4',             // cyan
  '#f472b6', '#ec4899',             // pink
  '#fbbf24', '#f59e0b',             // amber
  '#4ade80', '#22c55e',             // green
  '#f87171', '#ef4444',             // red
  '#c084fc', '#a855f7',             // purple
];

const SHAPES = ['square', 'circle', 'triangle', 'line'];

export default function Confetti({ active, duration = 3000 }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    const container = containerRef.current;
    const pieces = [];
    const count = 120;

    for (let i = 0; i < count; i++) {
      const piece = document.createElement('div');
      const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      const left = Math.random() * 100;
      const size = Math.random() * 8 + 4;
      const animDuration = Math.random() * 2 + 1.5;
      const delay = Math.random() * 0.8;
      const rotateEnd = Math.random() * 720 - 360;

      piece.style.cssText = `
        position: absolute;
        left: ${left}%;
        top: -20px;
        width: ${size}px;
        height: ${shape === 'line' ? size * 3 : size}px;
        background: ${color};
        opacity: 0;
        pointer-events: none;
        animation: confettiPieceFall ${animDuration}s ${delay}s ease-out forwards;
        border-radius: ${shape === 'circle' ? '50%' : shape === 'triangle' ? '0' : '2px'};
        ${shape === 'triangle' ? `
          width: 0;
          height: 0;
          background: none;
          border-left: ${size/2}px solid transparent;
          border-right: ${size/2}px solid transparent;
          border-bottom: ${size}px solid ${color};
        ` : ''}
      `;

      // Create unique keyframe for each piece
      const keyframeName = `confettiPieceFall_${i}`;
      const xDrift = (Math.random() - 0.5) * 300;
      const style = document.createElement('style');
      style.textContent = `
        @keyframes ${keyframeName} {
          0% { transform: translateY(0) translateX(0) rotate(0deg) scale(1); opacity: 1; }
          70% { opacity: 1; }
          100% { transform: translateY(${window.innerHeight + 100}px) translateX(${xDrift}px) rotate(${rotateEnd}deg) scale(0.3); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
      piece.style.animation = `${keyframeName} ${animDuration}s ${delay}s ease-out forwards`;

      container.appendChild(piece);
      pieces.push({ piece, style });
    }

    const cleanup = setTimeout(() => {
      pieces.forEach(({ piece, style }) => {
        piece.remove();
        style.remove();
      });
    }, duration + 1000);

    return () => {
      clearTimeout(cleanup);
      pieces.forEach(({ piece, style }) => {
        piece.remove();
        style.remove();
      });
    };
  }, [active, duration]);

  if (!active) return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999,
        overflow: 'hidden',
      }}
    />
  );
}
