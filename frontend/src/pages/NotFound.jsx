import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="text-center animate-[fadeIn_0.5s_ease-out]">
        <div className="text-8xl mb-6">🏜️</div>
        <h1 className="text-4xl font-bold text-accent mb-4">404</h1>
        <p className="text-xl text-white font-medium mb-2">Page Not Found</p>
        <p className="text-white/60 mb-8">Oops! The page you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate('/')}
          className="px-8 py-3 bg-accent text-background font-bold rounded-xl transition-all hover:shadow-lg hover:shadow-accent/30 active:scale-[0.98]"
        >
          Go Home
        </button>
      </div>
    </div>
  );
}
