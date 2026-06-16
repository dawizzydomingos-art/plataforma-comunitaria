import React, { useState, useEffect } from "react";
import { Shield, ArrowRight, Globe } from "lucide-react";

interface IntroSplashProps {
  onComplete: () => void;
}

export const IntroSplash: React.FC<IntroSplashProps> = ({ onComplete }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [stars, setStars] = useState<Array<{ id: number; top: number; left: number; delay: number; dur: number; size: number }>>([]);

  // Generate randomized stars client-side to prevent SSR hidration mismatch
  useEffect(() => {
    const starArray = Array.from({ length: 90 }).map((_, i) => ({
      id: i,
      top: Math.random() * 100,
      left: Math.random() * 100,
      delay: Math.random() * 5,
      dur: 2 + Math.random() * 5,
      size: 1 + Math.random() * 2,
    }));
    setStars(starArray);
  }, []);

  const handleStart = () => {
    setIsExiting(true);
    // Let the epic zoom/fade transition play out for 1000ms before removing the overlay
    setTimeout(() => {
      onComplete();
    }, 1100);
  };

  return (
    <div
      className={`fixed inset-0 z-50 bg-[#020205] overflow-hidden flex flex-col justify-between transition-all duration-[1100ms] cubic-bezier(0.16, 1, 0.3, 1) ${
        isExiting ? "opacity-0 pointer-events-none scale-110" : "opacity-100"
      }`}
    >
      {/* Space Celestial Background with Nebulae */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Cosmos deep nebulae */}
        <div 
          className="absolute -top-1/4 -right-1/4 w-[80vw] h-[80vw] rounded-full bg-indigo-900/10 blur-[150px] animate-nebula"
          style={{ animationDuration: "35s" }}
        />
        <div 
          className="absolute -bottom-1/4 -left-1/4 w-[75vw] h-[75vw] rounded-full bg-red-950/15 blur-[160px] animate-nebula"
          style={{ animationDuration: "25s" }}
        />
        <div className="absolute top-[40%] left-[30%] w-[50vw] h-[50vw] rounded-full bg-cyan-950/15 blur-[140px] animate-nebula" />

        {/* Twinkling Stars */}
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full bg-white animate-twinkle"
            style={{
              top: `${star.top}%`,
              left: `${star.left}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDelay: `${star.delay}s`,
              "--twinkle-dur": `${star.dur}s`,
              boxShadow: star.size > 2 ? "0 0 8px #fff" : "none",
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Header Top - Brand Reveal */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-10 sm:pt-14 flex justify-between items-center animate-reveal">
        {/* Requested layout with customized dark-adapted text colors for contrast */}
        <div className="flex items-center gap-3 select-none">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-indigo-700 flex items-center justify-center text-white font-black text-lg shadow-xl shadow-red-900/30 ring-1 ring-white/10 animate-pulse">
            PC
          </div>
          <div>
            <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white block">
              Plataforma Comunitária de Apoio
            </span>
            <span className="text-xs text-indigo-400 font-extrabold block leading-none uppercase tracking-wider mt-0.5">
              Moçambique
            </span>
          </div>
        </div>

        {/* Live System Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] text-white font-bold uppercase tracking-wider">
            Canal Seguro de Moçambique
          </span>
        </div>
      </header>

      {/* Main Center - Hero Pitch */}
      <main className="relative z-10 w-full max-w-4xl mx-auto px-6 text-center flex flex-col items-center justify-center my-auto space-y-6">
        <div 
          className="animate-reveal space-y-4"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-red-500/10 to-indigo-500/10 border border-indigo-500/30 text-white text-xs font-bold uppercase tracking-widest bg-black/40 backdrop-blur-sm shadow-md">
            <Shield className="w-3.5 h-3.5 text-red-500" />
            Vigilância Comunitária e Confidencialidade Total
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-400 tracking-tight leading-none py-1 max-w-3xl">
            SEGURANÇA E SOLIDARIEDADE
          </h1>
          
          <p className="text-sm sm:text-base md:text-lg text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
            Una-se ao maior pilar de segurança comunitária de Moçambique. Denuncie de forma 100% anónima, consulte alertas em tempo real e proteja quem mais precisa de forma sigilosa.
          </p>
        </div>

        {/* Action button */}
        <div 
          className="animate-reveal pt-4"
          style={{ animationDelay: "0.4s" }}
        >
          <button
            onClick={handleStart}
            className="group relative inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-red-600 via-indigo-600 to-indigo-700 text-white font-extrabold text-[15px] tracking-wide shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer select-none border-none animate-ripple"
          >
            <span>ENTRAR NA PLATAFORMA</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
          </button>
        </div>
      </main>

      {/* Footer / Planet Globe Reveal (Spaceedu Earth Rotation style) */}
      <footer 
        className="relative z-10 w-full flex flex-col items-center justify-end animate-reveal"
        style={{ animationDelay: "0.5s" }}
      >
        {/* Globe interactive preview */}
        <div className="relative w-[360px] h-[180px] sm:w-[500px] sm:h-[250px] md:w-[700px] md:h-[350px] lg:w-[900px] lg:h-[450px] overflow-hidden flex justify-center items-end">
          {/* Earth celestial body */}
          <div className="absolute w-[720px] h-[720px] sm:w-[1000px] sm:h-[1000px] md:w-[1400px] md:h-[1400px] lg:w-[1800px] lg:h-[1800px] rounded-full bg-gradient-to-t from-black via-[#080f25] to-[#1a2d5e] shadow-2xl flex justify-center items-start pt-[5%] animate-planet animate-atmosphere select-none pointer-events-none border border-cyan-500/10">
            {/* Styled continents and cities glowing vector details simulating Earth */}
            <svg 
              className="w-full h-full opacity-65 text-emerald-400 absolute top-0 left-0 mix-blend-screen"
              viewBox="0 0 1000 1000"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Outer Atmosphere Glow overlay */}
              <circle cx="500" cy="500" r="495" stroke="rgba(14, 165, 233, 0.45)" strokeWidth="4" />
              <circle cx="500" cy="500" r="490" stroke="rgba(99, 102, 241, 0.25)" strokeWidth="6" />

              {/* Africa outline representation including Madagascar & Mozambique coastline */}
              <g className="text-emerald-500/30" stroke="currentColor" strokeWidth="2.5" fill="currentColor" fillOpacity="0.05">
                {/* Simulated geometric beautiful map lands */}
                <path d="M 450,150 Q 480,180 500,220 T 550,280 Q 580,310 600,360 T 580,450 Q 560,500 590,560 T 630,680 Q 640,730 620,780 T 580,840 Q 550,880 500,900 T 450,850 Q 400,800 370,720 T 360,600 Q 320,530 350,450 T 410,300 Q 420,200 450,150 Z" />
                <path d="M 680,680 Q 700,700 710,740 T 690,820 Q 660,840 650,800 T 680,680 Z" /> {/* Madagascar block */}
              </g>

              {/* Mozambique Glowing Area Accent (highlight region) */}
              <g className="animate-pulse">
                <path 
                  d="M 580,640 Q 610,655 600,680 T 575,760" 
                  stroke="#ef4444" 
                  strokeWidth="4" 
                  strokeLinecap="round" 
                  fill="none" 
                  className="drop-shadow-[0_0_15px_#ef4444]"
                />
                {/* Glowing points representing Maputo, Beira, Nampula city coordinates */}
                <circle cx="575" cy="760" r="6" fill="#ef4444" className="animate-ping" />
                <circle cx="575" cy="760" r="4" fill="#ef4444" />
                <circle cx="598" cy="670" r="3.5" fill="#f59e0b" />
                <circle cx="583" cy="710" r="3.5" fill="#10b981" />
              </g>

              {/* Atmospheric Sunlight Shadow Mask overlay */}
              <ellipse cx="500" cy="180" rx="460" ry="250" fill="rgba(6, 182, 212, 0.12)" />
              <radialGradient id="sunlight" cx="50%" cy="10%" r="50%">
                <stop offset="0%" stopColor="rgba(56, 189, 248, 0.45)" />
                <stop offset="60%" stopColor="rgba(2, 6, 23, 0)" />
              </radialGradient>
              <circle cx="500" cy="500" r="500" fill="url(#sunlight)" />
            </svg>
          </div>
          
          {/* Shadow Overlay mapping into viewport */}
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#020205] via-[#020205]/45 to-transparent z-10 pointer-events-none" />

          {/* Scrolling Down arrow graphic like the video */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5 animate-bounce select-none pointer-events-none">
            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest">SCROLL / DESCUBRA</span>
            <div className="w-5 h-8 rounded-full border-2 border-slate-650 flex justify-center pt-1.5">
              <div className="w-1 h-2 rounded-full bg-indigo-500 animate-pulse" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
