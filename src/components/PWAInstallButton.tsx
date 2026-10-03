import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useTrade } from '../context/TradeContext';
import { Download, Share2, PlusSquare, X } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { language } = useTrade();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer shrink-0"
        title={language === 'hi' ? 'ऐप को फ़ोन या कंप्यूटर पर इंस्टॉल करें' : 'Install TradeSizer App'}
      >
        <Download className="w-3.5 h-3.5 stroke-[2.5]" />
        <span>{language === 'hi' ? 'इंस्टॉल करें' : 'Install App'}</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all cursor-pointer shrink-0"
          title="Install on iPhone / iPad"
        >
          <Download className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>{language === 'hi' ? 'iPhone में इंस्टॉल' : 'Install on iOS'}</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-2xl bg-[#0b1222] border border-slate-700 p-5 shadow-2xl text-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Download className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-white">
                    {language === 'hi' ? 'TradeSizer ऐप इंस्टॉल करें' : 'Install TradeSizer App'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs text-slate-300">
                <div className="flex items-start gap-2.5 bg-[#080d19] p-2.5 rounded-xl border border-slate-800">
                  <div className="w-6 h-6 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Share2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">
                      {language === 'hi' ? '1. शेयर बटन दबाएं' : '1. Tap Share in Safari'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {language === 'hi'
                        ? 'Safari ब्राउज़र के नीचे शेयर (Share) आइकन पर टैप करें।'
                        : 'Tap the Share icon at the bottom of Safari.'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 bg-[#080d19] p-2.5 rounded-xl border border-slate-800">
                  <div className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <PlusSquare className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">
                      {language === 'hi' ? '2. "Add to Home Screen" चुनें' : '2. Tap "Add to Home Screen"'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {language === 'hi'
                        ? 'मेन्यू में नीचे स्क्रॉल करके "Add to Home Screen" चुनें।'
                        : 'Scroll down and select "Add to Home Screen".'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
              >
                {language === 'hi' ? 'समझ गया (Close)' : 'Got it'}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback prompt button when beforeinstallprompt hasn't fired yet or in preview iframe
  return (
    <button
      type="button"
      onClick={() => {
        // If not triggered directly, show tips for Chrome/Android
        const isChrome = /chrome|crios/i.test(navigator.userAgent);
        const alertMsg = language === 'hi'
          ? 'ब्राउज़र के ऊपर 3 डॉट्स (⋮) पर टैप करें और "Install App" या "Add to Home Screen" चुनें।'
          : 'Tap the 3 dots (⋮) in your browser and select "Install app" or "Add to Home screen".';
        alert(alertMsg);
      }}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer shrink-0"
      title={language === 'hi' ? 'ऐप इंस्टॉल करें' : 'Install App'}
    >
      <Download className="w-3.5 h-3.5 stroke-[2.5]" />
      <span className="hidden xs:inline">{language === 'hi' ? 'इंस्टॉल' : 'Install'}</span>
    </button>
  );
};
