import React, { useState } from 'react';
import { MineralItem } from '../types/mineral';

interface MineralVisualProps {
  mineral: MineralItem;
  className?: string;
}

export const MineralVisual: React.FC<MineralVisualProps> = ({ mineral, className = '' }) => {
  const [imageError, setImageError] = useState(false);
  const resolvedPhotoUrl = mineral.imageUrl || `minerals/${mineral.visualPreset}.jpg`;

  if (resolvedPhotoUrl && !imageError) {
    return (
      <div className={`relative overflow-hidden bg-[#0c0d10] select-none ${className}`}>
        <img
          src={resolvedPhotoUrl}
          alt={mineral.title}
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={() => setImageError(true)}
          className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />
        {/* Measured contrast scrim at top and bottom so text overlays remain legible */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/45 pointer-events-none" />
        <div className="hidden md:flex absolute top-3.5 left-4 right-4 items-center justify-between text-[11px] font-mono text-white/85 drop-shadow pointer-events-none">
          <span>{mineral.chemicalFormula}</span>
          <span>Моос {mineral.mohsHardness}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden bg-[#0c0d10] flex items-center justify-center select-none ${className}`}
    >
      {/* Studio ambient spotlight */}
      <div
        className="absolute inset-0 opacity-85 transition-transform duration-700 group-hover:scale-105"
        style={{
          background: getBackdropGradient(mineral.visualPreset),
        }}
      />

      {/* Basalt studio pedestal shadow */}
      <div className="absolute bottom-4 w-3/4 h-7 rounded-full bg-black/75 blur-md" />
      <div className="absolute bottom-6 w-2/3 h-2.5 rounded-full bg-white/[0.04] border border-white/[0.06]" />

      {/* Bespoke high-precision SVG mineral specimen */}
      <div className="relative z-10 w-full h-full flex items-center justify-center p-6 transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-[1.04]">
        {renderMineralSvg(mineral.visualPreset, mineral.id)}
      </div>

      {/* Subtle studio rim light & chemical formula */}
      <div className="absolute top-3.5 left-4 right-4 flex items-center justify-between text-[11px] font-mono text-white/45 pointer-events-none">
        <span>{mineral.chemicalFormula}</span>
        <span>Моос {mineral.mohsHardness}</span>
      </div>
    </div>
  );
};

function getBackdropGradient(preset: MineralItem['visualPreset']): string {
  switch (preset) {
    case 'amethyst':
      return 'radial-gradient(circle at 50% 42%, rgba(147, 51, 234, 0.34), rgba(59, 7, 100, 0.16) 48%, rgba(9, 9, 11, 0.98) 80%)';
    case 'malachite':
      return 'radial-gradient(circle at 50% 42%, rgba(16, 185, 129, 0.34), rgba(6, 78, 59, 0.18) 48%, rgba(9, 9, 11, 0.98) 80%)';
    case 'labradorite':
      return 'radial-gradient(circle at 48% 40%, rgba(14, 165, 233, 0.36), rgba(234, 179, 8, 0.15) 45%, rgba(9, 9, 11, 0.98) 80%)';
    case 'charoite':
      return 'radial-gradient(circle at 50% 42%, rgba(192, 132, 252, 0.35), rgba(107, 33, 168, 0.16) 48%, rgba(9, 9, 11, 0.98) 80%)';
    case 'smoky_quartz':
      return 'radial-gradient(circle at 50% 42%, rgba(217, 119, 6, 0.28), rgba(120, 53, 15, 0.15) 48%, rgba(9, 9, 11, 0.98) 80%)';
    case 'lapis':
      return 'radial-gradient(circle at 50% 42%, rgba(37, 99, 235, 0.38), rgba(30, 58, 138, 0.18) 48%, rgba(9, 9, 11, 0.98) 80%)';
    case 'fluorite':
      return 'radial-gradient(circle at 50% 42%, rgba(45, 212, 191, 0.32), rgba(139, 92, 246, 0.22) 48%, rgba(9, 9, 11, 0.98) 80%)';
    case 'aquamarine':
      return 'radial-gradient(circle at 50% 42%, rgba(56, 189, 248, 0.36), rgba(12, 74, 110, 0.16) 48%, rgba(9, 9, 11, 0.98) 80%)';
    case 'agate':
      return 'radial-gradient(circle at 50% 42%, rgba(245, 158, 11, 0.3), rgba(124, 45, 18, 0.16) 48%, rgba(9, 9, 11, 0.98) 80%)';
    case 'garnet':
      return 'radial-gradient(circle at 50% 42%, rgba(225, 29, 72, 0.35), rgba(136, 19, 55, 0.16) 48%, rgba(9, 9, 11, 0.98) 80%)';
    case 'tigers_eye':
      return 'radial-gradient(circle at 50% 42%, rgba(234, 179, 8, 0.34), rgba(113, 63, 18, 0.18) 48%, rgba(9, 9, 11, 0.98) 80%)';
    case 'rose_quartz':
      return 'radial-gradient(circle at 50% 42%, rgba(244, 114, 182, 0.33), rgba(131, 24, 67, 0.15) 48%, rgba(9, 9, 11, 0.98) 80%)';
  }
}

function renderMineralSvg(preset: MineralItem['visualPreset'], uid: string) {
  switch (preset) {
    case 'amethyst':
      return (
        <svg viewBox="0 0 240 200" className="w-44 h-44 drop-shadow-[0_18px_28px_rgba(0,0,0,0.85)]">
          <defs>
            <linearGradient id={`am-a-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f3e8ff" />
              <stop offset="35%" stopColor="#a855f7" />
              <stop offset="75%" stopColor="#6b21a8" />
              <stop offset="100%" stopColor="#2e1065" />
            </linearGradient>
            <linearGradient id={`am-b-${uid}`} x1="0%" y1="100%" x2="80%" y2="0%">
              <stop offset="0%" stopColor="#3b0764" />
              <stop offset="55%" stopColor="#9333ea" />
              <stop offset="100%" stopColor="#e9d5ff" />
            </linearGradient>
          </defs>
          {/* Basalt matrix base */}
          <polygon points="34,158 65,174 178,172 206,152 184,132 58,134" fill="#27272a" stroke="#52525b" strokeWidth="1" />
          {/* Left crystal */}
          <polygon points="52,148 44,82 68,50 92,76 88,148" fill={`url(#am-b-${uid})`} opacity="0.92" />
          <polygon points="68,50 92,76 74,92 44,82" fill="#d8b4fe" opacity="0.55" />
          {/* Center tall crystal prism */}
          <polygon points="86,154 88,52 120,22 152,54 148,154" fill={`url(#am-a-${uid})`} />
          <polygon points="120,22 152,54 122,74 88,52" fill="#f3e8ff" opacity="0.65" />
          <polygon points="88,52 122,74 118,154 86,154" fill="#581c87" opacity="0.55" />
          {/* Right crystal */}
          <polygon points="142,150 150,74 178,48 198,80 182,150" fill={`url(#am-b-${uid})`} />
          <polygon points="178,48 198,80 172,94 150,74" fill="#e9d5ff" opacity="0.6" />
          {/* Front smaller druse points */}
          <polygon points="72,162 66,112 86,92 106,114 98,162" fill={`url(#am-a-${uid})`} />
          <polygon points="118,164 116,104 138,84 158,108 152,164" fill={`url(#am-b-${uid})`} />
          {/* Specular facet highlights */}
          <polyline points="88,52 120,22 122,74 152,54" fill="none" stroke="#ffffff" strokeWidth="1.2" opacity="0.7" />
          <line x1="122" y1="74" x2="118" y2="154" stroke="#f5d0fe" strokeWidth="0.9" opacity="0.5" />
        </svg>
      );

    case 'malachite':
      return (
        <svg viewBox="0 0 240 200" className="w-44 h-44 drop-shadow-[0_18px_28px_rgba(0,0,0,0.85)]">
          <defs>
            <radialGradient id={`mal-eye1-${uid}`} cx="38%" cy="44%" r="58%">
              <stop offset="0%" stopColor="#022c22" />
              <stop offset="14%" stopColor="#34d399" />
              <stop offset="28%" stopColor="#065f46" />
              <stop offset="44%" stopColor="#6ee7b7" />
              <stop offset="60%" stopColor="#047857" />
              <stop offset="78%" stopColor="#10b981" />
              <stop offset="92%" stopColor="#064e3b" />
              <stop offset="100%" stopColor="#a7f3d0" />
            </radialGradient>
            <radialGradient id={`mal-eye2-${uid}`} cx="70%" cy="62%" r="45%">
              <stop offset="0%" stopColor="#064e3b" />
              <stop offset="22%" stopColor="#6ee7b7" />
              <stop offset="45%" stopColor="#047857" />
              <stop offset="70%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#022c22" />
            </radialGradient>
            <clipPath id={`mal-clip-${uid}`}>
              <path d="M44,88 C38,52 76,30 124,32 C172,34 202,60 198,104 C194,146 156,168 106,166 C58,164 48,122 44,88 Z" />
            </clipPath>
          </defs>
          {/* Slab 3D rim */}
          <path
            d="M44,96 C38,60 76,38 124,40 C172,42 202,68 198,112 C194,154 156,176 106,174 C58,172 48,130 44,96 Z"
            fill="#022c22"
            stroke="#065f46"
            strokeWidth="1.5"
          />
          <g clipPath={`url(#mal-clip-${uid})`}>
            <rect x="30" y="20" width="180" height="160" fill={`url(#mal-eye1-${uid})`} />
            <circle cx="162" cy="122" r="56" fill={`url(#mal-eye2-${uid})`} opacity="0.88" />
            <path
              d="M36,70 Q95,95 128,60 T204,85"
              fill="none"
              stroke="#a7f3d0"
              strokeWidth="2"
              opacity="0.45"
            />
          </g>
          <path
            d="M44,88 C38,52 76,30 124,32 C172,34 202,60 198,104 C194,146 156,168 106,166 C58,164 48,122 44,88 Z"
            fill="none"
            stroke="#6ee7b7"
            strokeWidth="1.2"
            opacity="0.55"
          />
        </svg>
      );

    case 'labradorite':
      return (
        <svg viewBox="0 0 240 200" className="w-44 h-44 drop-shadow-[0_18px_28px_rgba(0,0,0,0.85)]">
          <defs>
            <linearGradient id={`lab-${uid}`} x1="15%" y1="10%" x2="85%" y2="90%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="25%" stopColor="#0284c7" />
              <stop offset="50%" stopColor="#38bdf8" />
              <stop offset="68%" stopColor="#facc15" />
              <stop offset="85%" stopColor="#0369a1" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>
          </defs>
          <path
            d="M68,162 C46,144 48,96 66,58 C82,26 118,20 148,38 C178,56 190,104 174,142 C158,172 96,178 68,162 Z"
            fill={`url(#lab-${uid})`}
            stroke="#7dd3fc"
            strokeWidth="1.2"
          />
          {/* Natural cleavage lines in feldspar */}
          <line x1="68" y1="68" x2="164" y2="112" stroke="#0c4a6e" strokeWidth="1.4" opacity="0.65" />
          <line x1="60" y1="108" x2="170" y2="140" stroke="#fef08a" strokeWidth="1" opacity="0.5" />
          <line x1="92" y1="34" x2="132" y2="164" stroke="#e0f2fe" strokeWidth="0.9" opacity="0.45" />
          {/* Specular polish highlight */}
          <ellipse cx="102" cy="68" rx="28" ry="12" transform="rotate(-24 102 68)" fill="#ffffff" opacity="0.28" />
        </svg>
      );

    case 'charoite':
      return (
        <svg viewBox="0 0 240 200" className="w-44 h-44 drop-shadow-[0_18px_28px_rgba(0,0,0,0.85)]">
          <defs>
            <linearGradient id={`cha-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f5d0fe" />
              <stop offset="30%" stopColor="#c084fc" />
              <stop offset="65%" stopColor="#7e22ce" />
              <stop offset="100%" stopColor="#3b0764" />
            </linearGradient>
          </defs>
          <ellipse cx="120" cy="102" rx="68" ry="58" fill={`url(#cha-${uid})`} stroke="#e9d5ff" strokeWidth="1.2" />
          {/* Swirling fibrous chatoyant plumes */}
          <path d="M68,86 C95,62 135,118 172,82" fill="none" stroke="#fae8ff" strokeWidth="3" opacity="0.55" />
          <path d="M64,108 C102,82 138,140 176,104" fill="none" stroke="#d8b4fe" strokeWidth="2.4" opacity="0.6" />
          <path d="M78,128 C110,108 140,148 164,124" fill="none" stroke="#f3e8ff" strokeWidth="1.8" opacity="0.45" />
          <ellipse cx="98" cy="72" rx="30" ry="11" transform="rotate(-18 98 72)" fill="#ffffff" opacity="0.26" />
        </svg>
      );

    case 'smoky_quartz':
      return (
        <svg viewBox="0 0 240 200" className="w-44 h-44 drop-shadow-[0_18px_28px_rgba(0,0,0,0.85)]">
          <defs>
            <linearGradient id={`smk-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef3c7" stopOpacity="0.9" />
              <stop offset="35%" stopColor="#b45309" stopOpacity="0.88" />
              <stop offset="75%" stopColor="#451a03" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#1c1917" />
            </linearGradient>
          </defs>
          <polygon points="86,168 78,64 120,20 162,64 154,168" fill={`url(#smk-${uid})`} stroke="#fcd34d" strokeWidth="1" />
          <polygon points="120,20 162,64 124,82 78,64" fill="#fde68a" opacity="0.45" />
          <polygon points="78,64 124,82 118,168 86,168" fill="#78350f" opacity="0.45" />
          {/* Internal phantom growth chevron */}
          <polyline points="92,96 120,66 148,96" fill="none" stroke="#fef3c7" strokeWidth="1.3" opacity="0.55" />
          <polyline points="96,120 120,92 144,120" fill="none" stroke="#fde68a" strokeWidth="1" opacity="0.4" />
        </svg>
      );

    case 'lapis':
      return (
        <svg viewBox="0 0 240 200" className="w-44 h-44 drop-shadow-[0_18px_28px_rgba(0,0,0,0.85)]">
          <defs>
            <linearGradient id={`lap-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="40%" stopColor="#1d4ed8" />
              <stop offset="80%" stopColor="#1e3a8a" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
          </defs>
          <polygon
            points="52,138 46,78 88,36 156,40 192,82 178,150 112,166"
            fill={`url(#lap-${uid})`}
            stroke="#60a5fa"
            strokeWidth="1.2"
          />
          <polygon points="88,36 156,40 134,94 46,78" fill="#2563eb" opacity="0.45" />
          {/* Golden pyrite inclusions */}
          <circle cx="96" cy="76" r="2.5" fill="#facc15" />
          <circle cx="112" cy="84" r="1.8" fill="#fde047" />
          <circle cx="144" cy="70" r="3" fill="#eab308" />
          <circle cx="128" cy="112" r="2.2" fill="#facc15" />
          <circle cx="84" cy="118" r="1.6" fill="#fde047" />
          <circle cx="158" cy="108" r="2.6" fill="#facc15" />
          <path d="M74,94 L108,82 L138,102" fill="none" stroke="#fef08a" strokeWidth="1.2" strokeDasharray="3 4" />
        </svg>
      );

    case 'fluorite':
      return (
        <svg viewBox="0 0 240 200" className="w-44 h-44 drop-shadow-[0_18px_28px_rgba(0,0,0,0.85)]">
          <defs>
            <linearGradient id={`flu-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#5eead4" />
              <stop offset="42%" stopColor="#14b8a6" />
              <stop offset="68%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#4c1d95" />
            </linearGradient>
          </defs>
          {/* Octahedral crystal geometry */}
          <polygon points="120,24 188,98 120,172 52,98" fill={`url(#flu-${uid})`} stroke="#99f6e4" strokeWidth="1.2" />
          <polygon points="120,24 188,98 120,108" fill="#ccfbf1" opacity="0.35" />
          <polygon points="120,24 52,98 120,108" fill="#2dd4bf" opacity="0.25" />
          <polyline points="74,98 120,52 166,98" fill="none" stroke="#e9d5ff" strokeWidth="1.5" opacity="0.65" />
          <polyline points="88,98 120,68 152,98" fill="none" stroke="#99f6e4" strokeWidth="1.2" opacity="0.65" />
        </svg>
      );

    case 'aquamarine':
      return (
        <svg viewBox="0 0 240 200" className="w-44 h-44 drop-shadow-[0_18px_28px_rgba(0,0,0,0.85)]">
          <defs>
            <linearGradient id={`aq-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e0f2fe" />
              <stop offset="40%" stopColor="#38bdf8" />
              <stop offset="80%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0c4a6e" />
            </linearGradient>
          </defs>
          {/* Hexagonal beryl column */}
          <polygon points="88,32 152,32 164,164 76,164" fill={`url(#aq-${uid})`} stroke="#bae6fd" strokeWidth="1.2" />
          <polygon points="88,32 112,24 134,24 152,32 134,42 106,42" fill="#f0f9ff" opacity="0.75" />
          <line x1="106" y1="42" x2="98" y2="164" stroke="#ffffff" strokeWidth="1.2" opacity="0.55" />
          <line x1="134" y1="42" x2="140" y2="164" stroke="#0369a1" strokeWidth="1.2" opacity="0.45" />
        </svg>
      );

    case 'agate':
      return (
        <svg viewBox="0 0 240 200" className="w-44 h-44 drop-shadow-[0_18px_28px_rgba(0,0,0,0.85)]">
          <defs>
            <radialGradient id={`ag-${uid}`} cx="50%" cy="50%" r="52%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="18%" stopColor="#fde68a" />
              <stop offset="32%" stopColor="#d97706" />
              <stop offset="48%" stopColor="#fef3c7" />
              <stop offset="64%" stopColor="#92400e" />
              <stop offset="80%" stopColor="#f59e0b" />
              <stop offset="94%" stopColor="#451a03" />
              <stop offset="100%" stopColor="#78350f" />
            </radialGradient>
          </defs>
          <path
            d="M52,96 C48,50 86,28 128,32 C174,36 196,68 188,112 C180,154 142,170 96,166 C56,162 56,134 52,96 Z"
            fill={`url(#ag-${uid})`}
            stroke="#fcd34d"
            strokeWidth="1.4"
          />
          <polygon points="108,88 122,78 136,90 130,108 112,106" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
        </svg>
      );

    case 'garnet':
      return (
        <svg viewBox="0 0 240 200" className="w-44 h-44 drop-shadow-[0_18px_28px_rgba(0,0,0,0.85)]">
          <defs>
            <linearGradient id={`gar-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fda4af" />
              <stop offset="30%" stopColor="#e11d48" />
              <stop offset="70%" stopColor="#881337" />
              <stop offset="100%" stopColor="#4c0519" />
            </linearGradient>
          </defs>
          {/* Dark mica schist matrix */}
          <polygon points="40,148 68,68 158,52 198,118 168,168 74,170" fill="#27272a" stroke="#52525b" strokeWidth="1.2" />
          {/* Rhombododecahedron garnet crystal */}
          <polygon points="120,44 166,76 154,132 96,142 74,94" fill={`url(#gar-${uid})`} stroke="#fecdd3" strokeWidth="1.1" />
          <polygon points="120,44 166,76 124,96 74,94" fill="#fb7185" opacity="0.45" />
          <polygon points="124,96 166,76 154,132" fill="#4c0519" opacity="0.55" />
        </svg>
      );

    case 'tigers_eye':
      return (
        <svg viewBox="0 0 240 200" className="w-44 h-44 drop-shadow-[0_18px_28px_rgba(0,0,0,0.85)]">
          <defs>
            <linearGradient id={`tig-${uid}`} x1="15%" y1="15%" x2="85%" y2="85%">
              <stop offset="0%" stopColor="#422006" />
              <stop offset="28%" stopColor="#ca8a04" />
              <stop offset="48%" stopColor="#fef08a" />
              <stop offset="65%" stopColor="#a16207" />
              <stop offset="85%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#422006" />
            </linearGradient>
          </defs>
          <circle cx="120" cy="100" r="64" fill={`url(#tig-${uid})`} stroke="#fde047" strokeWidth="1.1" />
          <ellipse cx="98" cy="72" rx="26" ry="10" transform="rotate(-28 98 72)" fill="#ffffff" opacity="0.32" />
        </svg>
      );

    case 'rose_quartz':
      return (
        <svg viewBox="0 0 240 200" className="w-44 h-44 drop-shadow-[0_18px_28px_rgba(0,0,0,0.85)]">
          <defs>
            <radialGradient id={`rq-${uid}`} cx="40%" cy="38%" r="60%">
              <stop offset="0%" stopColor="#fce7f3" />
              <stop offset="45%" stopColor="#f472b6" />
              <stop offset="85%" stopColor="#be185d" />
              <stop offset="100%" stopColor="#831843" />
            </radialGradient>
          </defs>
          <circle cx="120" cy="100" r="64" fill={`url(#rq-${uid})`} stroke="#fbcfe8" strokeWidth="1.2" />
          {/* 6-ray star asterism */}
          <g stroke="#fdf2f8" strokeWidth="1.3" opacity="0.65">
            <line x1="104" y1="48" x2="104" y2="116" />
            <line x1="74" y1="65" x2="134" y2="99" />
            <line x1="74" y1="99" x2="134" y2="65" />
          </g>
          <circle cx="104" cy="82" r="5" fill="#ffffff" opacity="0.6" />
        </svg>
      );
  }
}
