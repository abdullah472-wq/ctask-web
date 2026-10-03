'use client';

import React from 'react';

export function HeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float {
          0% { transform: translateY(0px) translateX(0px) scale(1); }
          33% { transform: translateY(-50px) translateX(50px) scale(1.1); }
          66% { transform: translateY(20px) translateX(-20px) scale(0.9); }
          100% { transform: translateY(0px) translateX(0px) scale(1); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.3; }
        }
        .orb-1 {
          animation: float 15s ease-in-out infinite, pulse-slow 10s ease-in-out infinite;
        }
        .orb-2 {
          animation: float 20s ease-in-out infinite reverse, pulse-slow 12s ease-in-out infinite 2s;
        }
        .orb-3 {
          animation: float 18s ease-in-out infinite 5s, pulse-slow 15s ease-in-out infinite 1s;
        }
      `}} />
      
      {/* Cyan Orb - Top Right */}
      <div className="orb-1 absolute -top-[10%] -right-[10%] w-[50%] h-[60%] rounded-full bg-brand-cyan opacity-20 blur-[100px]"></div>
      
      {/* Emerald Orb - Bottom Left */}
      <div className="orb-2 absolute -bottom-[10%] -left-[10%] w-[60%] h-[70%] rounded-full bg-brand-emerald opacity-20 blur-[120px]"></div>

      {/* Mixed Center Orb */}
      <div className="orb-3 absolute top-[20%] left-[30%] w-[40%] h-[50%] rounded-full bg-gradient-to-r from-brand-cyan to-brand-emerald opacity-20 blur-[150px]"></div>
      
      {/* Grid overlay for a tech feel */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTAgMGg0MHYxSDB6IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+CjxwYXRoIGQ9Ik0wIDBoMXY0MEgweiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPgo8L3N2Zz4=')] opacity-20 mask-image:linear-gradient(to_bottom,white,transparent)"></div>
    </div>
  );
}
