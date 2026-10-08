import React, { useState, useEffect, useRef } from 'react';
import { Clock, Move, X, Minimize2, Maximize2, Zap } from 'lucide-react';
import { useTrade } from '../context/TradeContext';

interface Position {
  x: number;
  y: number;
}

export const FloatingSecondsClock: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { theme, language } = useTrade();
  const isDark = theme === 'dark';

  const [time, setTime] = useState<Date>(new Date());
  const [is24Hour, setIs24Hour] = useState<boolean>(() => {
    try {
      return localStorage.getItem('tradesizer_clock_24h') === 'true';
    } catch {
      return true;
    }
  });
  const [isCompact, setIsCompact] = useState<boolean>(() => {
    try {
      return localStorage.getItem('tradesizer_clock_compact') === 'true';
    } catch {
      return false;
    }
  });

  // Position state (persisted)
  const [position, setPosition] = useState<Position>(() => {
    try {
      const saved = localStorage.getItem('tradesizer_clock_pos');
      if (saved) return JSON.parse(saved);
    } catch {}
    // Default position: top right corner just below header
    return { x: window.innerWidth > 640 ? window.innerWidth - 220 : 16, y: 76 };
  });

  const cardRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ isDragging: boolean; startX: number; startY: number; posX: number; posY: number }>({
    isDragging: false,
    startX: 0,
    startY: 0,
    posX: 0,
    posY: 0,
  });

  // Live second ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 250); // High precision tick

    return () => clearInterval(timer);
  }, []);

  // Save format preference
  useEffect(() => {
    try {
      localStorage.setItem('tradesizer_clock_24h', String(is24Hour));
    } catch {}
  }, [is24Hour]);

  useEffect(() => {
    try {
      localStorage.setItem('tradesizer_clock_compact', String(isCompact));
    } catch {}
  }, [isCompact]);

  // Dragging handlers (mouse & touch)
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only drag from handle or card background, not buttons
    if ((e.target as HTMLElement).closest('button')) return;

    dragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      posX: position.x,
      posY: position.y,
    };

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current.isDragging) return;

    const deltaX = e.clientX - dragRef.current.startX;
    const deltaY = e.clientY - dragRef.current.startY;

    const cardWidth = cardRef.current?.offsetWidth || 180;
    const cardHeight = cardRef.current?.offsetHeight || 60;

    const maxX = window.innerWidth - cardWidth - 8;
    const maxY = window.innerHeight - cardHeight - 8;

    const nextX = Math.max(8, Math.min(maxX, dragRef.current.posX + deltaX));
    const nextY = Math.max(8, Math.min(maxY, dragRef.current.posY + deltaY));

    setPosition({ x: nextX, y: nextY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragRef.current.isDragging) {
      dragRef.current.isDragging = false;
      try {
        localStorage.setItem('tradesizer_clock_pos', JSON.stringify(position));
      } catch {}
    }
  };

  if (!isOpen) return null;

  // Format time components
  const hoursRaw = time.getHours();
  const hours = is24Hour
    ? String(hoursRaw).padStart(2, '0')
    : String(hoursRaw % 12 || 12).padStart(2, '0');
  const minutes = String(time.getMinutes()).padStart(2, '0');
  const seconds = String(time.getSeconds()).padStart(2, '0');
  const ampm = hoursRaw >= 12 ? 'PM' : 'AM';

  // Binary option candle expiry (seconds left in current 1-min candle: 60 - seconds)
  const secNumber = time.getSeconds();
  const candleRemaining = 60 - secNumber;
  const candleRemainingStr = candleRemaining === 60 ? '00' : String(candleRemaining).padStart(2, '0');
  const candleProgress = ((secNumber / 60) * 100).toFixed(0);

  return (
    <div
      ref={cardRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        touchAction: 'none',
      }}
      className={`fixed z-50 select-none shadow-2xl transition-shadow cursor-grab active:cursor-grabbing backdrop-blur-md border ${
        isDark
          ? 'bg-[#080e1d]/90 border-cyan-500/40 text-white shadow-cyan-950/40'
          : 'bg-white/95 border-slate-300 text-slate-900 shadow-slate-400/30'
      } ${isCompact ? 'rounded-full px-3 py-1.5' : 'rounded-2xl p-2.5 sm:p-3 min-w-[200px]'}`}
    >
      {isCompact ? (
        /* Compact Pill View */
        <div className="flex items-center gap-2 font-mono">
          <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0 animate-pulse" />
          <div className="text-sm font-extrabold tracking-wider tabular-nums">
            <span>{hours}:{minutes}:</span>
            <span className="text-cyan-400 font-black">{seconds}</span>
            {!is24Hour && <span className="text-[10px] ml-1 text-slate-400 font-sans">{ampm}</span>}
          </div>
          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
            :{candleRemainingStr}s
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsCompact(false);
            }}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Expand Clock"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
        </div>
      ) : (
        /* Full Draggable Floating Card View */
        <div className="space-y-2">
          {/* Top Control Bar */}
          <div className="flex items-center justify-between gap-2 text-slate-400">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider font-mono">
              <Move className="w-3 h-3 text-cyan-400 shrink-0" />
              <span className="text-cyan-400">{language === 'hi' ? 'लाइव क्लॉक' : 'LIVE CLOCK'}</span>
            </div>

            <div className="flex items-center gap-1">
              {/* 12h / 24h toggle */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIs24Hour(!is24Hour);
                }}
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold transition-colors cursor-pointer ${
                  is24Hour
                    ? 'bg-slate-800 text-slate-300 hover:text-white'
                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                }`}
                title="Toggle 12h / 24h"
              >
                {is24Hour ? '24H' : '12H'}
              </button>

              {/* Minimize to compact pill */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCompact(true);
                }}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                title="Minimize"
              >
                <Minimize2 className="w-3 h-3" />
              </button>

              {/* Close floating clock */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Big Live Seconds Clock Display */}
          <div className="text-center font-mono py-0.5">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-2xl sm:text-3xl font-black tracking-tight tabular-nums">
                {hours}:{minutes}
              </span>
              <span className="text-xs text-slate-500 font-bold">:</span>
              {/* Glowing High-Visibility Seconds */}
              <span className="text-2xl sm:text-3xl font-black text-cyan-400 drop-shadow-md tabular-nums animate-pulse">
                {seconds}
              </span>
              {!is24Hour && (
                <span className="text-[10px] text-slate-400 font-bold ml-1 font-sans">
                  {ampm}
                </span>
              )}
            </div>
          </div>

          {/* Candle Expiry Countdown (1-Min Candle Sync) */}
          <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
            <span className="text-slate-400 flex items-center gap-1">
              <Zap className="w-2.5 h-2.5 text-amber-400 shrink-0" />
              {language === 'hi' ? 'कैंडल क्लोज:' : 'Candle Close:'}
            </span>
            <span className="font-extrabold text-amber-400 tabular-nums">
              :{candleRemainingStr}s
            </span>
          </div>

          {/* Micro Second Progress Bar (0s to 60s) */}
          <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-amber-400 transition-all duration-200"
              style={{ width: `${candleProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
