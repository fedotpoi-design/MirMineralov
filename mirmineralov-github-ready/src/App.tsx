import React, { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import {
  ArrowUpRight,
  Check,
  Filter,
  Gem,
  Minus,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react';
import {
  LIVEMASTER_SOURCE_URL,
  MIR_MINERALOV_ITEMS,
} from './data/mirMineralovCatalog';
import {
  CartItem,
  LivemasterSyncResponse,
  MineralCategory,
  MineralForm,
  MineralItem,
} from './types/mineral';
import { MineralVisual } from './components/MineralVisual';

const VIDEO_SRC =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260511_080827_a9e5ad52-b6ee-4e79-b393-d936f179cfd7.mp4';

const CATEGORIES: MineralCategory[] = [
  'Все',
  'Кварцы и друзы',
  'Малахит и медьсодержащие',
  'Полевые шпаты и лабрадорит',
  'Редкие самоцветы Сибири',
  'Лазурит и содалит',
  'Агаты, яшма и халцедон',
  'Бериллы и гранаты',
];

const MOBILE_CATEGORY_LABELS: Record<MineralCategory, string> = {
  'Все': 'Все',
  'Кварцы и друзы': 'Кварцы',
  'Малахит и медьсодержащие': 'Малахит',
  'Полевые шпаты и лабрадорит': 'Лабрадорит',
  'Редкие самоцветы Сибири': 'Сибирь',
  'Лазурит и содалит': 'Лазурит',
  'Агаты, яшма и халцедон': 'Агаты',
  'Бериллы и гранаты': 'Бериллы',
};

const FORMS: MineralForm[] = [
  'Все формы',
  'Друза / Щётка',
  'Кристалл природный',
  'Срез / Плитка',
  'Кабошон',
  'Шар коллекционный',
  'Галтовка / Образец',
];

type ActiveTab = 'hero' | 'shop' | 'properties' | 'source';

function LogoMark() {
  return (
    <svg
      width="44"
      height="26"
      viewBox="0 0 44 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 w-9 h-5 md:w-[44px] md:h-[26px]"
      aria-label="MirMineralov Logo"
    >
      <rect x="0" y="3" width="14" height="20" rx="3" fill="white" />
      <rect x="16" y="3" width="12" height="20" rx="3" fill="white" />
      <rect x="30" y="3" width="14" height="20" rx="3" fill="white" />
    </svg>
  );
}

export default function App() {
  const [mounted, setMounted] = useState(false);
  const [framesReady, setFramesReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoBgRef = useRef<HTMLDivElement | null>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const framesRef = useRef<HTMLCanvasElement[]>([]);
  const shopSectionRef = useRef<HTMLElement | null>(null);

  // Store & navigation state
  const [activeTab, setActiveTab] = useState<ActiveTab>('hero');
  const [minerals, setMinerals] = useState<MineralItem[]>(MIR_MINERALOV_ITEMS);
  const [syncMeta, setSyncMeta] = useState<Omit<LivemasterSyncResponse, 'items'>>({
    sourceUrl: LIVEMASTER_SOURCE_URL,
    shopName: 'Мир Минералов (livemaster.ru/mirmineralov)',
    shopRating: 4.98,
    reviewsTotal: 1420,
    subscribersCount: 3890,
    location: 'Россия · Доставка по всему миру',
    syncedAt: new Date().toISOString(),
    liveScrapedCount: 0,
    syncMode: 'hybrid-catalog',
  });
  const [isSyncing, setIsSyncing] = useState(false);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<MineralCategory>('Все');
  const [selectedForm, setSelectedForm] = useState<MineralForm>('Все формы');
  const [selectedZodiac, setSelectedZodiac] = useState<string>('Все знаки');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'price-asc' | 'price-desc' | 'weight-desc'>('popular');
  const [maxPrice, setMaxPrice] = useState<number>(6000);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Selected mineral modal (Contiguous Purchase & Properties Module)
  const [selectedMineral, setSelectedMineral] = useState<MineralItem | null>(null);
  const [showMobileGeology, setShowMobileGeology] = useState(false);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('mirmineralov_cart_v1');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore storage errors
    }
    return [{ mineral: MIR_MINERALOV_ITEMS[0], quantity: 1 }];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  // Checkout state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [orderConfirmed, setOrderConfirmed] = useState<{
    orderNumber: string;
    totalRub: number;
    itemsCount: number;
  } | null>(null);

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('mirmineralov_cart_v1', JSON.stringify(cart));
    } catch {
      // ignore storage errors
    }
  }, [cart]);

  // Dynamic data load from /api/minerals (with automatic static fallback for GitHub Pages)
  const fetchMineralsFromSource = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/minerals');
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data: LivemasterSyncResponse = await res.json();
          if (Array.isArray(data.items) && data.items.length > 0) {
            setMinerals(data.items);
          }
          setSyncMeta({
            sourceUrl: data.sourceUrl,
            shopName: data.shopName,
            shopRating: data.shopRating,
            reviewsTotal: data.reviewsTotal,
            subscribersCount: data.subscribersCount,
            location: data.location,
            syncedAt: data.syncedAt,
            liveScrapedCount: data.liveScrapedCount,
            syncMode: data.syncMode,
          });
        }
      }
    } catch {
      // On static hosting (GitHub Pages), use embedded MirMineralov catalog seamlessly
      setSyncMeta((prev) => ({
        ...prev,
        syncedAt: new Date().toISOString(),
      }));
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchMineralsFromSource();
  }, []);

  // Effect 1 — Frame capture (boomerang setup)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let capturing = true;
    let lastTime = -1;
    const MAX_WIDTH = 960;
    const frames: HTMLCanvasElement[] = [];
    let rafId: number | null = null;
    let vfcId: number | null = null;

    const anyVideo = video as HTMLVideoElement & {
      requestVideoFrameCallback?: (cb: () => void) => number;
      cancelVideoFrameCallback?: (id: number) => void;
    };

    const captureFrame = () => {
      if (!capturing) return;
      if (video.readyState >= 2 && video.currentTime !== lastTime && video.videoWidth > 0) {
        lastTime = video.currentTime;
        const scale = Math.min(1, MAX_WIDTH / video.videoWidth);
        const w = Math.round(video.videoWidth * scale);
        const h = Math.round(video.videoHeight * scale);
        const offscreen = document.createElement('canvas');
        offscreen.width = w;
        offscreen.height = h;
        const ctx = offscreen.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, w, h);
          frames.push(offscreen);
        }
      }

      if (capturing) {
        if (typeof anyVideo.requestVideoFrameCallback === 'function') {
          vfcId = anyVideo.requestVideoFrameCallback(captureFrame);
        } else {
          rafId = requestAnimationFrame(captureFrame);
        }
      }
    };

    const onLoaded = () => {
      video.play().catch(() => {});
      if (typeof anyVideo.requestVideoFrameCallback === 'function') {
        vfcId = anyVideo.requestVideoFrameCallback(captureFrame);
      } else {
        rafId = requestAnimationFrame(captureFrame);
      }
    };

    const onEnded = () => {
      capturing = false;
      if (frames.length > 0) {
        framesRef.current = frames;
        setFramesReady(true);
      } else {
        video.currentTime = 0;
        video.play().catch(() => {});
      }
    };

    video.addEventListener('loadedmetadata', onLoaded);
    video.addEventListener('ended', onEnded);

    if (video.readyState >= 1) {
      onLoaded();
    }

    return () => {
      capturing = false;
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (vfcId !== null && typeof anyVideo.cancelVideoFrameCallback === 'function') {
        anyVideo.cancelVideoFrameCallback(vfcId);
      }
      video.removeEventListener('loadedmetadata', onLoaded);
      video.removeEventListener('ended', onEnded);
    };
  }, []);

  // Effect 2 — Boomerang render
  useEffect(() => {
    if (!framesReady) return;
    const canvas = displayCanvasRef.current;
    const frames = framesRef.current;
    if (!canvas || frames.length === 0) return;

    canvas.width = frames[0].width;
    canvas.height = frames[0].height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let index = 0;
    let direction = 1;
    let last = performance.now();
    const interval = 1000 / 30;
    let animId: number;

    const render = (now: number) => {
      if (now - last >= interval) {
        last = now;
        const frame = frames[index];
        if (frame) {
          ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);
        }
        index += direction;
        if (index >= frames.length - 1) {
          index = frames.length - 1;
          direction = -1;
        } else if (index <= 0) {
          index = 0;
          direction = 1;
        }
      }
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [framesReady]);

  // Effect 3 — Parallax mouse tracking (gsap)
  useEffect(() => {
    const strength = 20;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let rafId: number;

    const onMouseMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      targetX = ((e.clientX - cx) / cx) * strength;
      targetY = ((e.clientY - cy) / cy) * strength;
    };

    const tick = () => {
      currentX += (targetX - currentX) * 0.06;
      currentY += (targetY - currentY) * 0.06;
      if (videoBgRef.current) {
        gsap.set(videoBgRef.current, { x: currentX, y: currentY });
      }
      rafId = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', onMouseMove);
    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  // Navigation helper to open Shop or section smoothly
  const navigateToSection = (tab: ActiveTab) => {
    setActiveTab(tab);
    if (tab === 'hero') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setTimeout(() => {
        shopSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 40);
    }
  };

  // All available zodiac signs for filtering
  const allZodiacs = useMemo(() => {
    const set = new Set<string>();
    minerals.forEach((m) => m.zodiacSigns.forEach((z) => set.add(z)));
    return ['Все знаки', ...Array.from(set)];
  }, [minerals]);

  // Filtered & sorted minerals
  const filteredMinerals = useMemo(() => {
    return minerals
      .filter((item) => {
        if (selectedCategory !== 'Все' && item.category !== selectedCategory) return false;
        if (selectedForm !== 'Все формы' && item.form !== selectedForm) return false;
        if (selectedZodiac !== 'Все знаки' && !item.zodiacSigns.includes(selectedZodiac))
          return false;
        if (item.priceRub > maxPrice) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.trim().toLowerCase();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchSub = item.subtitle.toLowerCase().includes(q);
          const matchOrigin = item.origin.toLowerCase().includes(q);
          const matchFormula = item.chemicalFormula.toLowerCase().includes(q);
          const matchProp = item.lithotherapyProperties.some((p) =>
            p.toLowerCase().includes(q)
          );
          if (!matchTitle && !matchSub && !matchOrigin && !matchFormula && !matchProp) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.priceRub - b.priceRub;
        if (sortBy === 'price-desc') return b.priceRub - a.priceRub;
        if (sortBy === 'weight-desc') return b.weightGrams - a.weightGrams;
        return b.reviewsCount - a.reviewsCount;
      });
  }, [minerals, selectedCategory, selectedForm, selectedZodiac, maxPrice, searchQuery, sortBy]);

  // Cart operations
  const addToCart = (mineral: MineralItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.mineral.id === mineral.id);
      if (existing) {
        return prev.map((c) =>
          c.mineral.id === mineral.id
            ? { ...c, quantity: Math.min(mineral.inStock, c.quantity + 1) }
            : c
        );
      }
      return [...prev, { mineral, quantity: 1 }];
    });
    setJustAddedId(mineral.id);
    setTimeout(() => {
      setJustAddedId((curr) => (curr === mineral.id ? null : curr));
    }, 1200);
  };

  const updateCartQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.mineral.id !== id) return c;
          const nextQty = c.quantity + delta;
          if (nextQty <= 0) return null;
          return { ...c, quantity: Math.min(c.mineral.inStock, nextQty) };
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((c) => c.mineral.id !== id));
  };

  const cartCount = useMemo(
    () => cart.reduce((acc, item) => acc + item.quantity, 0),
    [cart]
  );

  const cartSubtotal = useMemo(
    () => cart.reduce((acc, item) => acc + item.mineral.priceRub * item.quantity, 0),
    [cart]
  );

  const discountRate = cartSubtotal >= 8000 ? 0.1 : cartSubtotal >= 4000 ? 0.05 : 0;
  const discountAmount = Math.round(cartSubtotal * discountRate);
  const cartTotal = cartSubtotal - discountAmount;

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    const orderNum = `MM-${Math.floor(10000 + Math.random() * 90000)}`;
    setOrderConfirmed({
      orderNumber: orderNum,
      totalRub: cartTotal,
      itemsCount: cartCount,
    });
    setCart([]);
  };

  const NAV_ITEMS: { id: ActiveTab; label: string; mobileLabel: string }[] = [
    { id: 'hero', label: 'Галерея', mobileLabel: 'Галерея' },
    { id: 'shop', label: 'Магазин камней', mobileLabel: 'Магазин' },
    { id: 'properties', label: 'Свойства минералов', mobileLabel: 'Свойства' },
    { id: 'source', label: 'Источник Livemaster', mobileLabel: 'О нас' },
  ];

  const hasActiveFilters =
    selectedCategory !== 'Все' ||
    selectedForm !== 'Все формы' ||
    selectedZodiac !== 'Все знаки' ||
    searchQuery !== '' ||
    maxPrice < 6000;

  return (
    <div className="min-h-screen bg-black text-white font-body overflow-x-hidden">
      {/* 1. Video background layer (Fixed with GSAP Parallax & Boomerang Canvas) */}
      <div
        ref={videoBgRef}
        className="fixed top-0 left-0 w-full h-full z-0 scale-[1.08] origin-center pointer-events-none"
      >
        <video
          ref={videoRef}
          src={VIDEO_SRC}
          muted
          playsInline
          preload="auto"
          crossOrigin="anonymous"
          className="w-full h-full object-cover"
          style={{ display: framesReady ? 'none' : 'block' }}
        />
        <canvas
          ref={displayCanvasRef}
          className="w-full h-full object-cover"
          style={{ display: framesReady ? 'block' : 'none' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/25 to-black/85" />
      </div>

      {/* 2. Top Nav (Liquid Glass Pill — compact on mobile, full on desktop) */}
      <nav className="fixed top-3 md:top-5 left-1/2 -translate-x-1/2 z-50 whitespace-nowrap max-w-[96vw]">
        <div className="liquid-glass flex items-center gap-3 md:gap-6 rounded px-3 py-2 md:px-4 md:py-2.5">
          <button
            onClick={() => navigateToSection('hero')}
            className="flex items-center gap-2 text-left focus:outline-none cursor-pointer"
            title="Мир Минералов — На главную"
          >
            <LogoMark />
          </button>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-5">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => navigateToSection(item.id)}
                className={`text-sm font-body font-light transition-colors duration-200 cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === item.id
                    ? 'text-white font-medium underline underline-offset-4'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Mobile Concise Navigation Links */}
          <div className="flex md:hidden items-center gap-3">
            {NAV_ITEMS.slice(0, 3).map((item) => (
              <button
                key={item.id}
                onClick={() => navigateToSection(item.id)}
                className={`text-xs font-body transition-colors duration-200 cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === item.id
                    ? 'text-white font-medium underline underline-offset-4'
                    : 'text-white/70'
                }`}
              >
                {item.mobileLabel}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 md:gap-3 ml-1 md:ml-4">
            <a
              href={LIVEMASTER_SOURCE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1 text-sm font-body font-light text-white/70 hover:text-white transition-colors duration-200 whitespace-nowrap shrink-0"
            >
              <span>Ярмарка Мастеров</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={() => setIsCartOpen(true)}
              className="liquid-glass-strong flex items-center gap-1.5 md:gap-2 text-xs md:text-sm font-body font-medium text-white rounded px-3 py-1.5 md:px-4 md:py-1.5 transition-all duration-200 hover:scale-[1.04] hover:shadow-[0_0_16px_2px_rgba(255,255,255,0.12)] active:scale-[0.97] cursor-pointer whitespace-nowrap shrink-0"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Корзина</span>
              <span className="font-mono tabular-nums text-xs text-white/90">
                ({cartCount})
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* 3. Fullscreen Hero Viewport */}
      <section className="relative h-screen w-full z-20 flex flex-col justify-between pointer-events-none">
        {/* Hero Title: compact on mobile so video breathes, full clamp on desktop */}
        <div
          className={`fixed left-0 right-0 z-20 w-full px-4 top-[88px] md:top-[126px] transition-all duration-1000 ${
            mounted && activeTab === 'hero'
              ? 'opacity-100 translate-y-0'
              : mounted
              ? 'opacity-15 -translate-y-4'
              : 'opacity-0 translate-y-6'
          }`}
        >
          <h1 className="hero-title select-none">MirMineralov</h1>
          {/* Desktop subtitle */}
          <p className="hidden md:block text-center text-sm font-body font-light tracking-[0.22em] uppercase text-white/70 mt-2">
            Коллекционные камни · Друзы · Редкие самоцветы
          </p>
          {/* Mobile ultra-short subtitle */}
          <p className="md:hidden text-center text-[11px] font-body font-light tracking-[0.18em] uppercase text-white/70 mt-1">
            Натуральные кристаллы и камни
          </p>
        </div>

        {/* Bottom Row */}
        <div
          className={`fixed bottom-7 md:bottom-12 left-0 right-0 px-4 md:px-10 flex flex-col md:flex-row items-center md:items-end justify-between gap-4 md:gap-6 z-20 transition-all duration-1000 delay-300 pointer-events-auto ${
            mounted && activeTab === 'hero'
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-6 pointer-events-none'
          }`}
        >
          <p className="hidden md:block text-sm font-body font-light text-white/75 max-w-[240px] leading-relaxed">
            Природные кристаллы, уральские и сибирские минералы с проверкой подлинности из витрины «Мир Минералов».
          </p>

          <div className="md:absolute md:left-1/2 md:-translate-x-1/2 md:bottom-0 flex items-center gap-2.5 md:gap-3">
            <button
              onClick={() => navigateToSection('shop')}
              className="group relative bg-white text-black text-xs md:text-sm font-body font-medium rounded px-5 py-2.5 md:px-6 md:py-3 overflow-hidden active:scale-[0.97] transition-all duration-200 shadow-[0_0_0_0_rgba(255,255,255,0)] hover:shadow-[0_0_24px_4px_rgba(255,255,255,0.25)] hover:scale-[1.03] cursor-pointer whitespace-nowrap shrink-0"
            >
              <span className="relative z-10 flex items-center gap-1.5 md:gap-2">
                <Gem className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="md:hidden">Магазин камней</span>
                <span className="hidden md:inline">Открыть магазин камней</span>
              </span>
              <span className="absolute inset-0 bg-gradient-to-b from-white to-white/85 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </button>

            <button
              onClick={() => navigateToSection('properties')}
              className="liquid-glass group text-white text-xs md:text-sm font-body font-medium rounded px-4 py-2.5 md:px-6 md:py-3 active:scale-[0.97] transition-all duration-200 hover:scale-[1.03] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_0_20px_2px_rgba(255,255,255,0.07)] cursor-pointer whitespace-nowrap shrink-0"
            >
              <span className="md:hidden">Свойства</span>
              <span className="hidden md:inline">Свойства минералов</span>
            </button>
          </div>

          <p className="hidden md:block text-sm font-body font-light text-white/75 max-w-[240px] leading-relaxed text-right">
            Выберите минерал по химической формуле, твёрдости Мооса, месторождению или энергетическим свойствам.
          </p>
        </div>
      </section>

      {/* 4. Storefront & Encyclopedia Main Section */}
      <main
        ref={shopSectionRef}
        className="relative z-30 min-h-screen bg-black/90 backdrop-blur-2xl border-t border-white/15 pt-16 md:pt-24 pb-20 md:pb-28 px-3.5 sm:px-8 lg:px-12"
      >
        <div className="max-w-[1360px] mx-auto">
          {/* Sub-navigation bar inside the Storefront */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3 md:gap-6 pb-4 md:pb-8 border-b border-white/10">
            <div>
              {/* Desktop metadata */}
              <div className="hidden md:flex items-center gap-2 text-xs text-white/60 mb-2">
                <span>Витрина магазина</span>
                <span aria-hidden="true">·</span>
                <span>livemaster.ru/mirmineralov</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  Рейтинг {syncMeta.shopRating} ({syncMeta.reviewsTotal} отзывов)
                </span>
              </div>

              {/* Mobile concise metadata */}
              <div className="flex md:hidden items-center justify-between text-[11px] text-white/55 mb-1">
                <span>Мир Минералов · ★ {syncMeta.shopRating}</span>
                <span className="font-mono tabular-nums">{minerals.length} камней</span>
              </div>

              {/* Desktop full heading */}
              <h2
                className="hidden md:block font-heading italic text-4xl sm:text-5xl lg:text-6xl text-white tracking-tight"
                style={{ textWrap: 'balance' }}
              >
                {activeTab === 'properties'
                  ? 'Энциклопедия и физико-химические свойства камней'
                  : activeTab === 'source'
                  ? 'Динамическая синхронизация с Мир Минералов'
                  : 'Каталог натуральных камней и минералов'}
              </h2>

              {/* Mobile compact 1-line heading */}
              <h2 className="md:hidden font-heading italic text-3xl text-white tracking-tight">
                {activeTab === 'properties'
                  ? 'Свойства камней'
                  : activeTab === 'source'
                  ? 'О магазине'
                  : 'Магазин камней'}
              </h2>
            </div>

            {/* Section View Switcher + Live Sync Action */}
            <div className="flex flex-wrap items-center justify-between md:justify-start gap-2">
              <div className="liquid-glass flex items-center p-1 rounded">
                <button
                  onClick={() => setActiveTab('shop')}
                  className={`px-3 md:px-4 py-1 md:py-1.5 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === 'shop' || activeTab === 'hero'
                      ? 'bg-white text-black'
                      : 'text-white/75 hover:text-white'
                  }`}
                >
                  <span className="md:hidden">Камни ({minerals.length})</span>
                  <span className="hidden md:inline">Витрина ({minerals.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab('properties')}
                  className={`px-3 md:px-4 py-1 md:py-1.5 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === 'properties'
                      ? 'bg-white text-black'
                      : 'text-white/75 hover:text-white'
                  }`}
                >
                  <span className="md:hidden">Свойства</span>
                  <span className="hidden md:inline">Таблица свойств</span>
                </button>
                <button
                  onClick={() => setActiveTab('source')}
                  className={`px-3 md:px-4 py-1 md:py-1.5 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === 'source'
                      ? 'bg-white text-black'
                      : 'text-white/75 hover:text-white'
                  }`}
                >
                  <span className="md:hidden">Инфо</span>
                  <span className="hidden md:inline">О магазине и источнике</span>
                </button>
              </div>

              <button
                onClick={fetchMineralsFromSource}
                disabled={isSyncing}
                className="liquid-glass flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 text-xs text-white/85 hover:text-white rounded transition-all cursor-pointer whitespace-nowrap shrink-0"
                title="Обновить товары и цены из источника livemaster.ru/mirmineralov"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">
                  {isSyncing ? 'Синхронизация...' : 'Обновить каталог'}
                </span>
              </button>
            </div>
          </div>

          {/* TAB 1: SHOP CATALOG WITH FILTERS */}
          {(activeTab === 'shop' || activeTab === 'hero') && (
            <div className="mt-4 md:mt-8 space-y-4 md:space-y-8">
              {/* MOBILE COMPACT FILTER BAR (<768px) */}
              <div className="md:hidden space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-white/45 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Поиск камня или свойства..."
                      className="w-full bg-zinc-950 border border-white/15 rounded pl-9 pr-8 py-2 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-white/40"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/50"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => setShowMobileFilters((v) => !v)}
                    className={`px-3 py-2 text-xs font-medium rounded border flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      showMobileFilters || hasActiveFilters
                        ? 'bg-white text-black border-white'
                        : 'bg-zinc-950 text-white/80 border-white/15'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Фильтры</span>
                  </button>
                </div>

                {/* Single-line horizontal category strip for mobile */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {CATEGORIES.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-3 py-1 text-xs font-medium rounded transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                        selectedCategory === category
                          ? 'bg-white text-black'
                          : 'bg-zinc-900/90 text-white/70 border border-white/10'
                      }`}
                    >
                      {MOBILE_CATEGORY_LABELS[category]}
                    </button>
                  ))}
                </div>

                {/* Collapsible extra filters on mobile */}
                {showMobileFilters && (
                  <div className="bg-zinc-950 border border-white/15 rounded-2xl p-3.5 space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={selectedForm}
                        onChange={(e) => setSelectedForm(e.target.value as MineralForm)}
                        className="bg-zinc-900 border border-white/15 rounded px-3 py-2 text-xs text-white"
                      >
                        {FORMS.map((form) => (
                          <option key={form} value={form} className="bg-zinc-950">
                            {form}
                          </option>
                        ))}
                      </select>

                      <select
                        value={sortBy}
                        onChange={(e) =>
                          setSortBy(
                            e.target.value as
                              | 'popular'
                              | 'price-asc'
                              | 'price-desc'
                              | 'weight-desc'
                          )
                        }
                        className="bg-zinc-900 border border-white/15 rounded px-3 py-2 text-xs text-white"
                      >
                        <option value="popular">Популярные</option>
                        <option value="price-asc">Дешевле</option>
                        <option value="price-desc">Дороже</option>
                        <option value="weight-desc">По весу</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-1">
                      <span className="text-white/60">Цена до: {maxPrice} ₽</span>
                      <input
                        type="range"
                        min={1500}
                        max={6000}
                        step={150}
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(Number(e.target.value))}
                        className="w-36 accent-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* DESKTOP FILTER CONTROLS BAR (>=768px — untouched) */}
              <div className="hidden md:block bg-zinc-950/90 border border-white/10 rounded-3xl p-5 sm:p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  <div className="md:col-span-5 relative">
                    <Search className="w-4 h-4 text-white/45 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Поиск по камню, формуле (SiO2), месторождению или свойству..."
                      className="w-full bg-white/[0.04] border border-white/12 rounded pl-11 pr-9 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/40 transition-colors"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white cursor-pointer"
                        aria-label="Очистить поиск"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="md:col-span-3">
                    <select
                      value={selectedForm}
                      onChange={(e) => setSelectedForm(e.target.value as MineralForm)}
                      className="w-full bg-zinc-900 border border-white/12 rounded px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/40 cursor-pointer"
                    >
                      {FORMS.map((form) => (
                        <option key={form} value={form} className="bg-zinc-950 text-white">
                          {form}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <select
                      value={selectedZodiac}
                      onChange={(e) => setSelectedZodiac(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/12 rounded px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/40 cursor-pointer"
                    >
                      {allZodiacs.map((z) => (
                        <option key={z} value={z} className="bg-zinc-950 text-white">
                          {z === 'Все знаки' ? 'Гороскоп: Все' : z}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <select
                      value={sortBy}
                      onChange={(e) =>
                        setSortBy(
                          e.target.value as
                            | 'popular'
                            | 'price-asc'
                            | 'price-desc'
                            | 'weight-desc'
                        )
                      }
                      className="w-full bg-zinc-900 border border-white/12 rounded px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/40 cursor-pointer"
                    >
                      <option value="popular" className="bg-zinc-950">
                        По популярности
                      </option>
                      <option value="price-asc" className="bg-zinc-950">
                        Сначала дешевле
                      </option>
                      <option value="price-desc" className="bg-zinc-950">
                        Сначала дороже
                      </option>
                      <option value="weight-desc" className="bg-zinc-950">
                        По весу (г)
                      </option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-white/10">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                    <span className="text-xs text-white/50 flex items-center gap-1 mr-2 shrink-0">
                      <Filter className="w-3.5 h-3.5" />
                      <span>Тип минерала:</span>
                    </span>
                    {CATEGORIES.map((category) => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-3.5 py-1.5 text-xs font-medium rounded transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                          selectedCategory === category
                            ? 'bg-white text-black shadow-sm'
                            : 'bg-white/[0.04] text-white/70 hover:text-white hover:bg-white/[0.08]'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-white/70 shrink-0">
                    <span>До:</span>
                    <input
                      type="range"
                      min={1500}
                      max={6000}
                      step={150}
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(Number(e.target.value))}
                      className="w-28 accent-white cursor-pointer"
                    />
                    <span className="font-mono tabular-nums text-white font-medium w-16 text-right">
                      {maxPrice.toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                </div>
              </div>

              {/* Filter results summary */}
              <div className="flex items-center justify-between text-xs text-white/60 px-1">
                <div>
                  <span className="md:hidden">Камней: </span>
                  <span className="hidden md:inline">Найдено образцов: </span>
                  <span className="text-white font-mono tabular-nums font-medium">
                    {filteredMinerals.length}
                  </span>
                  <span className="hidden md:inline"> из {minerals.length}</span>
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={() => {
                      setSelectedCategory('Все');
                      setSelectedForm('Все формы');
                      setSelectedZodiac('Все знаки');
                      setSearchQuery('');
                      setMaxPrice(6000);
                    }}
                    className="text-white underline underline-offset-4 hover:text-white/80 cursor-pointer"
                  >
                    Сбросить фильтры
                  </button>
                )}
              </div>

              {/* Product Grid: 2 compact columns on mobile (<768px), 2-3 rich columns on desktop */}
              {filteredMinerals.length === 0 ? (
                <div className="bg-zinc-950/80 border border-white/10 rounded-3xl p-8 md:p-12 text-center space-y-4">
                  <p className="text-sm md:text-lg text-white/80">
                    По выбранным критериям минералы не найдены.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedCategory('Все');
                      setSelectedForm('Все формы');
                      setSelectedZodiac('Все знаки');
                      setSearchQuery('');
                      setMaxPrice(6000);
                    }}
                    className="bg-white text-black text-xs md:text-sm font-medium rounded px-5 py-2.5 cursor-pointer"
                  >
                    Показать все камни
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 md:gap-7">
                  {filteredMinerals.map((mineral) => {
                    const inCartItem = cart.find((c) => c.mineral.id === mineral.id);
                    const isJustAdded = justAddedId === mineral.id;

                    return (
                      <article
                        key={mineral.id}
                        className="group bg-zinc-950/90 border border-white/10 hover:border-white/25 rounded-2xl md:rounded-3xl overflow-hidden flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5"
                      >
                        <div>
                          {/* Visual Specimen (Square on mobile for compact cards, 4:3 on desktop) */}
                          <div
                            onClick={() => {
                              setSelectedMineral(mineral);
                              setShowMobileGeology(false);
                            }}
                            className="cursor-pointer relative aspect-square md:aspect-[4/3] w-full border-b border-white/10"
                          >
                            <MineralVisual mineral={mineral} className="w-full h-full" />
                            {/* Mobile compact weight badge */}
                            <div className="md:hidden absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[10px] text-white/85 pointer-events-none">
                              <span>{mineral.mobileOrigin}</span>
                              <span className="font-mono tabular-nums">{mineral.weightGrams} г</span>
                            </div>
                            {/* Desktop bottom overlay */}
                            <div className="hidden md:flex absolute bottom-3 left-4 right-4 items-center justify-between text-xs text-white/75 pointer-events-none">
                              <span>
                                {mineral.form} · {mineral.weightGrams} г
                              </span>
                              <span className="underline underline-offset-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                Подробнее о свойствах
                              </span>
                            </div>
                          </div>

                          {/* MOBILE CONCISE CARD BODY (<768px) */}
                          <div
                            onClick={() => {
                              setSelectedMineral(mineral);
                              setShowMobileGeology(false);
                            }}
                            className="md:hidden p-3 space-y-1 cursor-pointer"
                          >
                            <h3 className="text-xs font-semibold text-white truncate">
                              {mineral.mobileTitle}
                            </h3>
                            <p className="text-[11px] text-white/60 line-clamp-1 leading-snug">
                              {mineral.mobileDescription}
                            </p>
                          </div>

                          {/* DESKTOP FULL CARD BODY (>=768px — untouched) */}
                          <div className="hidden md:block p-6 space-y-3">
                            <div className="flex items-center gap-2 text-xs text-white/50 uppercase tracking-wider">
                              <span>{mineral.category}</span>
                              <span aria-hidden="true">·</span>
                              <span className="truncate">{mineral.origin}</span>
                            </div>

                            <h3
                              onClick={() => setSelectedMineral(mineral)}
                              className="text-base font-semibold text-white group-hover:text-white/90 transition-colors cursor-pointer line-clamp-2 leading-snug"
                            >
                              {mineral.title}
                            </h3>

                            <p className="text-sm text-white/65 line-clamp-2 leading-relaxed">
                              {mineral.shortDescription}
                            </p>

                            <div className="pt-2 border-t border-white/10 text-xs text-white/60 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-white/45">Свойство:</span>
                                <span className="text-white/80 truncate max-w-[220px]">
                                  {mineral.lithotherapyProperties[0]}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-white/45">Размеры · Сингония:</span>
                                <span className="font-mono tabular-nums text-white/75">
                                  {mineral.dimensionsMm} · {mineral.crystalSystem}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* MOBILE COMPACT CARD FOOTER (<768px) */}
                        <div className="md:hidden px-3 pb-3 pt-2 flex items-center justify-between gap-1.5 border-t border-white/10">
                          <span className="text-xs font-semibold font-mono tabular-nums text-white">
                            {mineral.priceRub.toLocaleString('ru-RU')} ₽
                          </span>
                          <button
                            onClick={() => addToCart(mineral)}
                            className={`px-2.5 py-1.5 text-[11px] font-medium rounded transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0 ${
                              isJustAdded
                                ? 'bg-emerald-400 text-black'
                                : 'bg-white text-black'
                            }`}
                          >
                            {isJustAdded ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <>
                                <ShoppingBag className="w-3 h-3" />
                                <span>{inCartItem ? `+1 (${inCartItem.quantity})` : 'Купить'}</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* DESKTOP FULL CARD FOOTER (>=768px — untouched) */}
                        <div className="hidden md:flex px-6 pb-6 pt-3 items-center justify-between gap-4 border-t border-white/10">
                          <div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-lg font-semibold font-mono tabular-nums text-white">
                                {mineral.priceRub.toLocaleString('ru-RU')} ₽
                              </span>
                              {mineral.oldPriceRub && (
                                <span className="text-xs font-mono tabular-nums text-white/40 line-through">
                                  {mineral.oldPriceRub.toLocaleString('ru-RU')} ₽
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-white/45">
                              В наличии: {mineral.inStock} шт.
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedMineral(mineral)}
                              className="px-3.5 py-2 text-xs font-medium text-white/80 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] rounded transition-colors cursor-pointer whitespace-nowrap shrink-0"
                            >
                              Свойства
                            </button>
                            <button
                              onClick={() => addToCart(mineral)}
                              className={`px-4 py-2 text-xs font-medium rounded transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                                isJustAdded
                                  ? 'bg-emerald-400 text-black'
                                  : inCartItem
                                  ? 'bg-white/90 text-black hover:bg-white'
                                  : 'bg-white text-black hover:bg-white/90'
                              }`}
                            >
                              {isJustAdded ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Добавлено</span>
                                </>
                              ) : inCartItem ? (
                                <>
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>В корзине ({inCartItem.quantity})</span>
                                </>
                              ) : (
                                <>
                                  <ShoppingBag className="w-3.5 h-3.5" />
                                  <span>В корзину</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MINERAL PROPERTIES ENCYCLOPEDIA */}
          {activeTab === 'properties' && (
            <div className="mt-5 md:mt-8 space-y-6 md:space-y-8">
              {/* Desktop 3-card intro (hidden on mobile to prevent text wall) */}
              <div className="hidden md:grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-zinc-950/90 border border-white/10 rounded-3xl p-6 space-y-2">
                  <div className="text-xs text-white/50 uppercase tracking-wider">
                    01. Минералогический паспорт
                  </div>
                  <h3 className="text-lg font-semibold text-white">
                    Химическая формула и сингония
                  </h3>
                  <p className="text-sm text-white/65 leading-relaxed">
                    Каждый образец из коллекции «Мир Минералов» сопровождается точной кристаллохимической формулой, показателем твёрдости по шкале Мооса и указанием месторождения.
                  </p>
                </div>
                <div className="bg-zinc-950/90 border border-white/10 rounded-3xl p-6 space-y-2">
                  <div className="text-xs text-white/50 uppercase tracking-wider">
                    02. Оптические эффекты
                  </div>
                  <h3 className="text-lg font-semibold text-white">
                    Иризация, астеризм и плеохроизм
                  </h3>
                  <p className="text-sm text-white/65 leading-relaxed">
                    Лабрадориты-спектралиты, звёздчатые розовые кварцы и шелковистый якутский чароит отбираются вручную под направленным студийным светом для раскрытия внутреннего свечения.
                  </p>
                </div>
                <div className="bg-zinc-950/90 border border-white/10 rounded-3xl p-6 space-y-2">
                  <div className="text-xs text-white/50 uppercase tracking-wider">
                    03. Литотерапия и созерцание
                  </div>
                  <h3 className="text-lg font-semibold text-white">
                    Природная эстетика в интерьере
                  </h3>
                  <p className="text-sm text-white/65 leading-relaxed">
                    Друзы уругвайского аметиста и кристаллы уральского раухтопаза служат природными доминантами для рабочего стола, кабинета или коллекционной витрины.
                  </p>
                </div>
              </div>

              {/* MOBILE COMPACT PROPERTIES LIST (<768px) */}
              <div className="md:hidden space-y-2.5">
                {minerals.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => {
                      setSelectedMineral(m);
                      setShowMobileGeology(false);
                    }}
                    className="bg-zinc-950/90 border border-white/10 rounded-2xl p-3 flex items-center gap-3 cursor-pointer"
                  >
                    <img
                      src={m.imageUrl || `minerals/${m.visualPreset}.jpg`}
                      alt={m.mobileTitle}
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-xl object-cover border border-white/15 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-semibold text-white truncate">
                          {m.mobileTitle}
                        </h4>
                        <span className="text-[11px] font-mono text-white/60 shrink-0">
                          Моос {m.mohsHardness}
                        </span>
                      </div>
                      <p className="text-[11px] text-white/75 truncate mt-0.5">
                        {m.mobileProperties[0]}
                      </p>
                      <div className="text-[10px] text-white/45 mt-0.5 truncate">
                        {m.chemicalFormula} · {m.zodiacSigns.slice(0, 3).join(', ')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* DESKTOP COMPARATIVE MINERALOGICAL TABLE (>=768px — untouched) */}
              <div className="hidden md:block bg-zinc-950/90 border border-white/10 rounded-3xl overflow-hidden">
                <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Сводный справочник свойств минералов каталога
                    </h3>
                    <p className="text-xs text-white/55 mt-1">
                      Нажмите на любой минерал, чтобы открыть полное геологическое и литотерапевтическое описание
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-xs text-white/50 uppercase tracking-wider">
                        <th className="py-3.5 px-5">Минерал</th>
                        <th className="py-3.5 px-4">Формула</th>
                        <th className="py-3.5 px-4">Моос / Плотность</th>
                        <th className="py-3.5 px-4">Сингония</th>
                        <th className="py-3.5 px-4">Энергетика и свойства</th>
                        <th className="py-3.5 px-5 text-right">Цена</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 text-sm">
                      {minerals.map((m) => (
                        <tr
                          key={m.id}
                          onClick={() => setSelectedMineral(m)}
                          className="hover:bg-white/[0.04] transition-colors cursor-pointer"
                        >
                          <td className="py-4 px-5 font-medium text-white">
                            <div className="flex items-center gap-3.5">
                              <img
                                src={m.imageUrl || `minerals/${m.visualPreset}.jpg`}
                                alt={m.title}
                                referrerPolicy="no-referrer"
                                className="w-12 h-12 rounded-xl object-cover border border-white/15 shrink-0 bg-zinc-900"
                              />
                              <div>
                                <div>{m.title}</div>
                                <div className="text-xs text-white/50 mt-0.5">{m.origin}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 font-mono text-xs text-white/80 whitespace-nowrap">
                            {m.chemicalFormula}
                          </td>
                          <td className="py-4 px-4 font-mono tabular-nums text-xs text-white/80 whitespace-nowrap">
                            {m.mohsHardness} · {m.density}
                          </td>
                          <td className="py-4 px-4 text-xs text-white/75">{m.crystalSystem}</td>
                          <td className="py-4 px-4 text-xs text-white/75 max-w-xs">
                            <div>{m.lithotherapyProperties[0]}</div>
                            <div className="text-white/45 mt-0.5">
                              Зодиак: {m.zodiacSigns.join(', ')}
                            </div>
                          </td>
                          <td className="py-4 px-5 text-right font-mono tabular-nums font-medium text-white whitespace-nowrap">
                            {m.priceRub.toLocaleString('ru-RU')} ₽
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LIVEMASTER SOURCE & DYNAMIC SYNC DETAILS */}
          {activeTab === 'source' && (
            <div className="mt-5 md:mt-8 grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8 items-stretch">
              <div className="lg:col-span-7 bg-zinc-950/90 border border-white/10 rounded-2xl md:rounded-3xl p-5 md:p-8 flex flex-col justify-between space-y-5 md:space-y-6">
                <div className="space-y-3 md:space-y-4">
                  <div className="text-xs text-white/50 uppercase tracking-wider">
                    Прямая интеграция с витриной продавца
                  </div>
                  <h3 className="text-xl sm:text-3xl font-heading italic text-white">
                    Магазин «Мир Минералов» на Ярмарке Мастеров
                  </h3>
                  <p className="hidden md:block text-sm text-white/70 leading-relaxed">
                    Все позиции, цены, вес образцов и описания синхронизируются через серверный коннектор с витриной{' '}
                    <a
                      href={LIVEMASTER_SOURCE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white underline underline-offset-4 hover:text-white/80"
                    >
                      livemaster.ru/mirmineralov
                    </a>
                    . При каждом запросе сервер проверяет актуальную выдачу магазина и обогащает карточки минералогическими характеристиками.
                  </p>
                  <p className="md:hidden text-xs text-white/70 leading-relaxed">
                    Каталог и цены синхронизированы с витриной «Мир Минералов» на Livemaster.
                  </p>

                  <div className="grid grid-cols-3 gap-3 md:gap-4 pt-3 md:pt-4 border-t border-white/10">
                    <div>
                      <div className="text-[11px] md:text-xs text-white/45">Рейтинг</div>
                      <div className="text-base md:text-xl font-semibold font-mono tabular-nums text-white mt-0.5">
                        {syncMeta.shopRating}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] md:text-xs text-white/45">Отзывов</div>
                      <div className="text-base md:text-xl font-semibold font-mono tabular-nums text-white mt-0.5">
                        {syncMeta.reviewsTotal}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] md:text-xs text-white/45">Подписчиков</div>
                      <div className="text-base md:text-xl font-semibold font-mono tabular-nums text-white mt-0.5">
                        {syncMeta.subscribersCount}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 md:gap-3 pt-3 md:pt-4 border-t border-white/10">
                  <a
                    href={LIVEMASTER_SOURCE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white text-black text-xs font-medium rounded px-4 py-2 md:px-5 md:py-2.5 flex items-center gap-2 hover:bg-white/90 transition-colors"
                  >
                    <span>Открыть на Livemaster</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={fetchMineralsFromSource}
                    disabled={isSyncing}
                    className="liquid-glass text-white text-xs font-medium rounded px-4 py-2 md:px-5 md:py-2.5 flex items-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>Обновить</span>
                  </button>
                </div>
              </div>

              <div className="lg:col-span-5 bg-zinc-950/90 border border-white/10 rounded-2xl md:rounded-3xl p-5 md:p-8 flex flex-col justify-between space-y-4 md:space-y-6">
                <div className="space-y-3 md:space-y-4">
                  <h4 className="text-sm md:text-base font-semibold text-white">
                    Скидки и доставка
                  </h4>
                  <ul className="space-y-2.5 text-xs md:text-sm text-white/70">
                    <li className="flex items-center justify-between gap-4 pb-2.5 border-b border-white/10">
                      <span>От 4 000 ₽</span>
                      <span className="font-mono tabular-nums text-white">Скидка 5%</span>
                    </li>
                    <li className="flex items-center justify-between gap-4 pb-2.5 border-b border-white/10">
                      <span>От 8 000 ₽</span>
                      <span className="font-mono tabular-nums text-white">Скидка 10%</span>
                    </li>
                    <li className="flex items-center justify-between gap-4">
                      <span>Упаковка</span>
                      <span className="text-white">Защитный бокс</span>
                    </li>
                  </ul>
                </div>

                <div className="text-[11px] md:text-xs text-white/50 leading-relaxed">
                  Природные образцы в единственном экземпляре.
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 5. Mineral Detail & Properties Modal (Compact on mobile, Full on desktop) */}
      {selectedMineral && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-6 overflow-y-auto"
          onClick={() => setSelectedMineral(null)}
        >
          <div
            className="bg-zinc-950 border-t md:border border-white/15 rounded-t-3xl md:rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl md:my-auto max-h-[90vh] md:max-h-none flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-1 md:grid-cols-12 items-stretch overflow-y-auto">
              {/* Specimen Photo */}
              <div className="md:col-span-5 relative h-56 md:h-auto md:min-h-[280px] border-b md:border-b-0 md:border-r border-white/10 flex flex-col justify-between bg-[#090a0d] shrink-0">
                <MineralVisual mineral={selectedMineral} className="w-full h-full" />
                <button
                  onClick={() => setSelectedMineral(null)}
                  className="md:hidden absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center border border-white/20"
                  aria-label="Закрыть"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="hidden md:flex p-4 border-t border-white/10 bg-zinc-950/90 items-center justify-between text-xs text-white/65">
                  <span>Артикул LM-{selectedMineral.livemasterId}</span>
                  <a
                    href={selectedMineral.livemasterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-white hover:underline"
                  >
                    <span>Карточка на Livemaster</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Right Contiguous Purchase & Properties Module */}
              <div className="md:col-span-7 p-4 sm:p-6 md:p-8 flex flex-col justify-between space-y-4 md:space-y-6">
                <div className="space-y-3 md:space-y-4">
                  <div className="hidden md:flex items-start justify-between gap-4">
                    <div className="text-xs text-white/50 uppercase tracking-wider">
                      {selectedMineral.category} · {selectedMineral.form}
                    </div>
                    <button
                      onClick={() => setSelectedMineral(null)}
                      className="text-white/50 hover:text-white p-1 cursor-pointer"
                      aria-label="Закрыть окно"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Mobile short title vs Desktop full title */}
                  <h3 className="md:hidden text-lg font-semibold text-white leading-snug">
                    {selectedMineral.mobileTitle}
                  </h3>
                  <h3 className="hidden md:block text-xl sm:text-2xl font-semibold text-white leading-snug">
                    {selectedMineral.title}
                  </h3>

                  <div className="flex items-baseline gap-2.5">
                    <span className="text-xl md:text-2xl font-bold font-mono tabular-nums text-white">
                      {selectedMineral.priceRub.toLocaleString('ru-RU')} ₽
                    </span>
                    {selectedMineral.oldPriceRub && (
                      <span className="text-xs md:text-sm font-mono tabular-nums text-white/40 line-through">
                        {selectedMineral.oldPriceRub.toLocaleString('ru-RU')} ₽
                      </span>
                    )}
                    <span className="text-xs text-white/50 ml-auto font-mono tabular-nums">
                      {selectedMineral.weightGrams} г · {selectedMineral.dimensionsMm}
                    </span>
                  </div>

                  {/* Mobile compact 3-spec row (<768px) */}
                  <div className="grid md:hidden grid-cols-3 gap-2 py-2.5 border-y border-white/10 text-[11px]">
                    <div>
                      <div className="text-white/45">Формула</div>
                      <div className="font-mono text-white truncate">
                        {selectedMineral.chemicalFormula}
                      </div>
                    </div>
                    <div>
                      <div className="text-white/45">Твёрдость</div>
                      <div className="font-mono text-white">Моос {selectedMineral.mohsHardness}</div>
                    </div>
                    <div>
                      <div className="text-white/45">Происхождение</div>
                      <div className="text-white truncate">{selectedMineral.mobileOrigin}</div>
                    </div>
                  </div>

                  {/* Desktop full 6-spec grid (>=768px — untouched) */}
                  <div className="hidden md:grid grid-cols-2 sm:grid-cols-3 gap-3 py-3 border-y border-white/10 text-xs">
                    <div>
                      <div className="text-white/45">Формула</div>
                      <div className="font-mono text-white mt-0.5">
                        {selectedMineral.chemicalFormula}
                      </div>
                    </div>
                    <div>
                      <div className="text-white/45">Твёрдость по Моосу</div>
                      <div className="font-mono tabular-nums text-white mt-0.5">
                        {selectedMineral.mohsHardness}
                      </div>
                    </div>
                    <div>
                      <div className="text-white/45">Сингония</div>
                      <div className="text-white mt-0.5">{selectedMineral.crystalSystem}</div>
                    </div>
                    <div>
                      <div className="text-white/45">Плотность</div>
                      <div className="font-mono tabular-nums text-white mt-0.5">
                        {selectedMineral.density}
                      </div>
                    </div>
                    <div>
                      <div className="text-white/45">Блеск</div>
                      <div className="text-white mt-0.5">{selectedMineral.luster}</div>
                    </div>
                    <div>
                      <div className="text-white/45">Месторождение</div>
                      <div className="text-white mt-0.5">{selectedMineral.origin}</div>
                    </div>
                  </div>

                  {/* MOBILE CONCISE PROPERTIES (<768px) */}
                  <div className="md:hidden space-y-2">
                    <ul className="space-y-1 text-xs text-white/85">
                      {selectedMineral.mobileProperties.map((prop, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-white/40">—</span>
                          <span>{prop}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="text-[11px] text-white/50">
                      Зодиак: {selectedMineral.zodiacSigns.join(', ')}
                    </div>
                    <button
                      onClick={() => setShowMobileGeology((v) => !v)}
                      className="text-[11px] text-white/70 underline underline-offset-4"
                    >
                      {showMobileGeology ? 'Скрыть геологию' : 'Геология образца'}
                    </button>
                    {showMobileGeology && (
                      <p className="text-xs text-white/65 leading-relaxed pt-1">
                        {selectedMineral.geologicalDescription}
                      </p>
                    )}
                  </div>

                  {/* DESKTOP FULL GEOLOGY & LITHOTHERAPY (>=768px — untouched) */}
                  <div className="hidden md:block space-y-4">
                    <div className="space-y-1.5">
                      <h4 className="text-xs uppercase tracking-wider text-white/50">
                        Геология и особенности образца
                      </h4>
                      <p className="text-sm text-white/75 leading-relaxed">
                        {selectedMineral.geologicalDescription}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xs uppercase tracking-wider text-white/50">
                        Описание свойств и литотерапия
                      </h4>
                      <ul className="space-y-1.5 text-sm text-white/80">
                        {selectedMineral.lithotherapyProperties.map((prop, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-white/40 select-none">—</span>
                            <span>{prop}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="pt-2 text-xs text-white/55 flex flex-wrap gap-x-4 gap-y-1">
                        <span>Знаки зодиака: {selectedMineral.zodiacSigns.join(', ')}</span>
                        <span>·</span>
                        <span>Энергетический центр: {selectedMineral.chakra}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Purchase Action Bar */}
                <div className="pt-3 md:pt-4 border-t border-white/10 flex items-center justify-between gap-3">
                  <button
                    onClick={() => {
                      addToCart(selectedMineral);
                      setIsCartOpen(true);
                      setSelectedMineral(null);
                    }}
                    className="w-full bg-white text-black text-xs md:text-sm font-medium rounded px-5 py-3 hover:bg-white/90 transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>
                      В корзину · {selectedMineral.priceRub.toLocaleString('ru-RU')} ₽
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Slide-Over Shopping Cart Drawer */}
      {isCartOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex justify-end"
          onClick={() => setIsCartOpen(false)}
        >
          <div
            className="w-full max-w-md bg-zinc-950 border-l border-white/15 h-full flex flex-col justify-between p-4 sm:p-6 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4 md:space-y-6">
              <div className="flex items-center justify-between pb-3 md:pb-4 border-b border-white/10">
                <div>
                  <h3 className="text-base md:text-lg font-semibold text-white">
                    Корзина коллекционера
                  </h3>
                  <p className="text-xs text-white/50">
                    Магазин «Мир Минералов» · {cartCount} шт.
                  </p>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="text-white/50 hover:text-white p-1.5 cursor-pointer"
                  aria-label="Закрыть корзину"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3 text-xs space-y-2">
                <div className="flex items-center justify-between text-white/80">
                  <span>
                    {cartSubtotal >= 8000
                      ? 'Скидка коллекционера 10% активна'
                      : cartSubtotal >= 4000
                      ? `Скидка 5% · Ещё ${(8000 - cartSubtotal).toLocaleString('ru-RU')} ₽ до 10%`
                      : `Ещё ${(4000 - cartSubtotal).toLocaleString('ru-RU')} ₽ до скидки 5%`}
                  </span>
                  <span className="font-mono tabular-nums font-medium">
                    {Math.min(100, Math.round((cartSubtotal / 8000) * 100))}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white transition-all duration-300"
                    style={{
                      width: `${Math.min(100, Math.round((cartSubtotal / 8000) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              {orderConfirmed && (
                <div className="bg-emerald-950/60 border border-emerald-500/30 rounded-2xl p-4 space-y-2 text-xs">
                  <div className="font-semibold text-emerald-300 text-sm">
                    Заказ #{orderConfirmed.orderNumber} подтверждён!
                  </div>
                  <p className="text-white/80 leading-relaxed">
                    Позиций: {orderConfirmed.itemsCount} шт. на сумму{' '}
                    <span className="font-mono tabular-nums font-medium">
                      {orderConfirmed.totalRub.toLocaleString('ru-RU')} ₽
                    </span>
                    . Мы свяжемся с вами для отправки.
                  </p>
                  <button
                    onClick={() => setOrderConfirmed(null)}
                    className="text-emerald-300 underline underline-offset-4 cursor-pointer"
                  >
                    Понятно
                  </button>
                </div>
              )}

              {cart.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <ShoppingBag className="w-8 h-8 text-white/30 mx-auto" />
                  <p className="text-sm text-white/60">Ваша корзина пока пуста</p>
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      navigateToSection('shop');
                    }}
                    className="bg-white text-black text-xs font-medium rounded px-4 py-2 cursor-pointer"
                  >
                    Перейти к выбору минералов
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {cart.map(({ mineral, quantity }) => (
                    <div
                      key={mineral.id}
                      className="flex items-center gap-3 bg-white/[0.02] border border-white/10 rounded-2xl p-2.5"
                    >
                      <div
                        onClick={() => {
                          setSelectedMineral(mineral);
                          setIsCartOpen(false);
                        }}
                        className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-white/10 cursor-pointer"
                      >
                        <MineralVisual mineral={mineral} className="w-full h-full" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-medium text-white truncate">
                          <span className="md:hidden">{mineral.mobileTitle}</span>
                          <span className="hidden md:inline">{mineral.title}</span>
                        </h4>
                        <div className="text-[11px] text-white/50 mt-0.5">
                          {mineral.weightGrams} г · {mineral.mobileOrigin}
                        </div>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-xs font-mono tabular-nums font-semibold text-white">
                            {(mineral.priceRub * quantity).toLocaleString('ru-RU')} ₽
                          </span>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => updateCartQuantity(mineral.id, -1)}
                              className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
                              aria-label="Уменьшить количество"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-mono tabular-nums w-5 text-center">
                              {quantity}
                            </span>
                            <button
                              onClick={() => updateCartQuantity(mineral.id, 1)}
                              className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
                              aria-label="Увеличить количество"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => removeFromCart(mineral.id)}
                              className="w-6 h-6 rounded text-white/40 hover:text-rose-400 flex items-center justify-center ml-1 cursor-pointer"
                              aria-label="Удалить из корзины"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <form
                onSubmit={handleCheckoutSubmit}
                className="pt-4 md:pt-6 border-t border-white/10 space-y-3.5 mt-4"
              >
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-white/60">
                    <span>Сумма образцов:</span>
                    <span className="font-mono tabular-nums">
                      {cartSubtotal.toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Клубная скидка ({Math.round(discountRate * 100)}%):</span>
                      <span className="font-mono tabular-nums">
                        −{discountAmount.toLocaleString('ru-RU')} ₽
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-semibold text-white pt-1.5 border-t border-white/10">
                    <span>Итого к оплате:</span>
                    <span className="font-mono tabular-nums">
                      {cartTotal.toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ваше имя и фамилия"
                    className="w-full bg-white/[0.04] border border-white/12 rounded px-3.5 py-2 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-white/40"
                  />
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Телефон для связи"
                    className="w-full bg-white/[0.04] border border-white/12 rounded px-3.5 py-2 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-white/40"
                  />
                  <input
                    type="text"
                    required
                    value={customerCity}
                    onChange={(e) => setCustomerCity(e.target.value)}
                    placeholder="Город и адрес доставки (СДЭК / Почта)"
                    className="w-full bg-white/[0.04] border border-white/12 rounded px-3.5 py-2 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-white/40"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-white text-black text-xs md:text-sm font-medium rounded py-2.5 md:py-3 hover:bg-white/90 transition-colors cursor-pointer"
                >
                  Оформить заказ · {cartTotal.toLocaleString('ru-RU')} ₽
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
