import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  // Hide bottom nav on specific pages like JobDetail or Apply where we have back buttons
  const hideOnPaths = ['/job/', '/apply/'];
  const shouldHide = hideOnPaths.some(path => location.pathname.includes(path));

  if (shouldHide) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-3 bg-background/90 backdrop-blur-xl border-t border-white/5 z-50">
      <div className="flex justify-around items-center max-w-md mx-auto">
        <button
          onClick={() => navigate('/')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
            location.pathname === '/' ? 'text-accent' : 'text-white/40 hover:text-white/80'
          }`}
        >
          <span className="text-xl">🏠</span>
          <span className="text-[10px] font-medium">Home</span>
        </button>
        <button
          onClick={() => navigate('/profile')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
            location.pathname === '/profile' ? 'text-accent' : 'text-white/40 hover:text-white/80'
          }`}
        >
          <span className="text-xl">👤</span>
          <span className="text-[10px] font-medium">Profile</span>
        </button>
      </div>
    </div>
  );
}
