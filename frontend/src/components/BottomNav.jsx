import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const TABS = [
  { path: '/', icon: '🏠', label: 'Jobs' },
  { path: '/post-job', icon: '➕', label: 'Post Job' },
  { path: '/profile', icon: '👤', label: 'Profile' },
];

const HIDE_ON = ['/job/', '/apply/'];

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const shouldHide = HIDE_ON.some(p => location.pathname.includes(p));
  if (shouldHide) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-t border-white/[0.07]">
      <div className="flex justify-around items-center max-w-md mx-auto py-2 px-3">
        {TABS.map(({ path, icon, label }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-2xl transition-all duration-200 ${
                active
                  ? 'text-accent'
                  : 'text-white/35 hover:text-white/70'
              }`}
            >
              <span className={`text-xl transition-transform duration-200 ${active ? 'scale-110' : ''}`}>
                {icon}
              </span>
              <span className={`text-[10px] font-semibold tracking-wide ${active ? 'text-accent' : ''}`}>
                {label}
              </span>
              {active && (
                <span className="absolute bottom-1 w-1 h-1 bg-accent rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
