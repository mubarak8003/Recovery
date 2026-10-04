import React, { useState } from 'react';
import { useTrade } from '../context/TradeContext';
import { Currency } from '../types/trading';
import {
  TrendingUp,
  Languages,
  RotateCcw,
  Check,
  Wallet,
  AlertTriangle,
  X,
  Sparkles,
  Sun,
  Moon,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

export const HeaderBar: React.FC = () => {
  const {
    tradingCapital,
    setTradingCapital,
    language,
    setLanguage,
    settings,
    updateSettings,
    resetAll,
    currencyFormat,
    theme,
    toggleTheme,
  } = useTrade();

  const [isEditingCapital, setIsEditingCapital] = useState(false);
  const [tempCapital, setTempCapital] = useState<string>(String(tradingCapital));
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetCapitalInput, setResetCapitalInput] = useState<string>(String(tradingCapital || 10000));

  const handleSaveCapital = () => {
    const val = parseFloat(tempCapital);
    if (!isNaN(val) && val > 0) {
      setTradingCapital(val);
      setIsEditingCapital(false);
    }
  };

  const handleConfirmReset = () => {
    const cap = parseFloat(resetCapitalInput) || 10000;
    resetAll(cap);
    setIsResetModalOpen(false);
  };

  const currencies: { id: Currency; symbol: string; label: string }[] = [
    { id: 'INR', symbol: '₹', label: 'INR' },
    { id: 'USD', symbol: '$', label: 'USD' },
    { id: 'EUR', symbol: '€', label: 'EUR' },
  ];

  return (
    <>
      <header className="border-b border-slate-800 bg-[#090e1a]/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-[1440px] mx-auto px-2 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-4 overflow-x-auto scrollbar-none overscroll-x-contain">
          {/* Brand Zone */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <img
              src="/icon.png"
              alt="TradeSizer Logo"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg shadow-md shadow-emerald-500/20 shrink-0 object-cover border border-emerald-500/30"
            />
            <div className="flex items-baseline gap-2 overflow-hidden">
              <span className="text-sm sm:text-lg font-extrabold tracking-tight text-white whitespace-nowrap">
                TradeSizer
              </span>
              <span className="hidden md:inline-block text-[10px] font-mono text-emerald-400 font-semibold uppercase tracking-wider whitespace-nowrap">
                Loss Recovery & Yield
              </span>
            </div>
          </div>

          {/* Action Controls & Overview (Horizontally scrollable on small screens) */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Auto-Saved Status Indicator */}
            <div
              className="hidden lg:flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] text-emerald-400 font-mono"
              title="All tasks, losses, and trades are auto-saved to local browser storage"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{language === 'hi' ? 'ऑटो-सेव्ड ✓' : 'Auto-Saved ✓'}</span>
            </div>

            {/* Trading Capital */}
            <div className="flex items-center gap-1 sm:gap-1.5 bg-[#080d19] border border-slate-800 px-2 sm:px-3 py-1 rounded-lg sm:rounded-xl font-mono text-xs shrink-0">
              <Wallet className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 shrink-0" />
              <div className="text-right">
                <span className="text-[9px] text-slate-500 uppercase block leading-none mb-0.5 hidden xs:block">
                  {language === 'hi' ? 'कैपिटल' : 'Capital'}
                </span>
                {isEditingCapital ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={tempCapital}
                      onChange={(e) => setTempCapital(e.target.value)}
                      onFocus={(e) => e.target.select()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveCapital();
                        if (e.key === 'Escape') setIsEditingCapital(false);
                      }}
                      className="w-16 sm:w-20 px-1 py-0.5 bg-slate-800 border border-slate-600 rounded text-white text-xs font-bold font-mono focus:outline-none focus:border-emerald-500"
                      placeholder="1000"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleSaveCapital}
                      className="p-1 rounded bg-emerald-500 text-slate-950 hover:bg-emerald-400 cursor-pointer"
                      title="Save"
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingCapital(false)}
                      className="p-1 rounded bg-slate-700 text-slate-300 hover:bg-slate-600 cursor-pointer"
                      title="Cancel"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setTempCapital(String(tradingCapital));
                      setIsEditingCapital(true);
                    }}
                    className="font-bold text-white hover:text-emerald-400 transition-colors tabular-nums cursor-pointer text-xs sm:text-sm whitespace-nowrap"
                    title="Click to edit starting capital"
                  >
                    {currencyFormat(tradingCapital)}
                  </button>
                )}
              </div>
            </div>

            {/* Currency Selector */}
            <div className="flex items-center bg-[#080d19] p-0.5 rounded-lg border border-slate-800 font-mono text-xs shrink-0">
              {currencies.map((c) => (
                <button
                  key={c.id}
                  onClick={() =>
                    updateSettings({
                      currency: c.id,
                      currencySymbol: c.symbol,
                    })
                  }
                  className={`px-1.5 sm:px-2 py-0.5 rounded transition-colors cursor-pointer ${
                    settings.currency === c.id
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {c.symbol}
                </button>
              ))}
            </div>

            {/* Language Toggle */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              className="flex items-center gap-1 px-1.5 sm:px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors cursor-pointer shrink-0"
              title="भाषा बदलें (Hindi / English)"
            >
              <Languages className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-bold text-[10px] sm:text-xs">
                {language === 'en' ? 'हिन्दी' : 'EN'}
              </span>
            </button>

            {/* Theme Toggle (Light / Dark) */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1 p-1.5 sm:px-2.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors cursor-pointer shrink-0"
              title={
                theme === 'dark'
                  ? language === 'hi'
                    ? 'लाइट थीम चालू करें (Light Mode)'
                    : 'Switch to Light Mode'
                  : language === 'hi'
                  ? 'डार्क थीम चालू करें (Dark Mode)'
                  : 'Switch to Dark Mode'
              }
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-[11px] font-bold hidden md:inline">
                    {language === 'hi' ? 'लाइट' : 'Light'}
                  </span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="text-[11px] font-bold hidden md:inline">
                    {language === 'hi' ? 'डार्क' : 'Dark'}
                  </span>
                </>
              )}
            </button>

            {/* PWA Install Button */}
            <PWAInstallButton />

            {/* Refresh / Reset Session Button */}
            <button
              onClick={() => {
                setResetCapitalInput(String(tradingCapital || 10000));
                setIsResetModalOpen(true);
              }}
              className="flex items-center gap-1 p-1.5 sm:px-2.5 rounded-lg border border-cyan-500/40 bg-cyan-950/30 hover:bg-cyan-900/40 text-cyan-300 hover:text-white transition-colors cursor-pointer shrink-0 text-xs font-mono shadow-sm"
              title={language === 'hi' ? 'रिफ्रेश / नया सेशन शुरू करें' : 'Refresh / Start Fresh Session'}
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="hidden sm:inline text-[11px] font-semibold">
                {language === 'hi' ? 'रिफ्रेश' : 'Refresh'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* IN-APP REFRESH / RESET CONFIRMATION MODAL */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0b1222] border border-slate-700 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  {language === 'hi'
                    ? 'डेटा रिफ्रेश / नया सेशन शुरू करें'
                    : 'Refresh & Start Fresh Session'}
                </h3>
              </div>
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {language === 'hi'
                ? 'आपका सारा काम अभी तक ब्राउज़र में ऑटो-सेव्ड था। क्या आप पुराना ट्रेड इतिहास, सक्रिय लॉस और वॉलेट रीसेट करके नया सेशन शुरू करना चाहते हैं?'
                : 'Your session has been auto-saved. Are you sure you want to clear trade history, reset active loss, and begin a fresh trading session?'}
            </p>

            <div className="bg-[#080d19] p-3 rounded-xl border border-slate-800 space-y-1.5">
              <label className="text-[11px] text-slate-400 block font-medium">
                {language === 'hi'
                  ? 'नए सेशन के लिए स्टार्टिंग कैपिटल दर्ज करें:'
                  : 'Starting Capital for Fresh Session:'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm font-bold">
                  {settings.currencySymbol}
                </span>
                <input
                  type="number"
                  value={resetCapitalInput}
                  onChange={(e) => setResetCapitalInput(e.target.value)}
                  className="w-full pl-7 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold text-sm focus:outline-none focus:border-emerald-400"
                  placeholder="10000"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
              >
                {language === 'hi' ? 'रद्द करें (Cancel)' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'हाँ, नया सेशन शुरू करें' : 'Reset & Start Fresh'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
