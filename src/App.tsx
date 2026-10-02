import React, { useState } from 'react';
import { TradeProvider, useTrade } from './context/TradeContext';
import { HeaderBar } from './components/HeaderBar';
import { FullDisplayTradingConsole } from './components/FullDisplayTradingConsole';
import { RecoveryLadderView } from './components/RecoveryLadderView';
import { RegularProfitWalletCard } from './components/RegularProfitWalletCard';
import { TradeHistoryJournal } from './components/TradeHistoryJournal';
import {
  Coins,
  PartyPopper,
  BookOpen,
  Layers,
  Wallet,
  LayoutGrid,
} from 'lucide-react';

const MainWorkspace: React.FC = () => {
  const {
    language,
    recentYieldToast,
    clearYieldToast,
    currencyFormat,
    recoveryCompletedModal,
    setRecoveryCompletedModal,
  } = useTrade();

  // Tab switcher for below the trading console: 'journal' | 'ladder' | 'wallet' | 'all'
  const [activeTab, setActiveTab] = useState<'journal' | 'ladder' | 'wallet' | 'all'>('journal');

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Header Bar */}
      <HeaderBar />

      {/* Floating Toast Notification for Guaranteed Regular Profit Wallet Credit */}
      {recentYieldToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-[#0b162c] border border-cyan-500/50 shadow-2xl shadow-cyan-950/60 rounded-2xl p-4 flex items-center gap-3 max-w-sm">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0">
              <Coins className="w-5 h-5 animate-bounce" />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                {language === 'hi' ? 'वॉलेट में लाभ जमा हुआ!' : 'Regular Profit Credited!'}
              </h4>
              <p className="text-xs text-white font-mono font-extrabold mt-0.5">
                +{currencyFormat(recentYieldToast.amount)}{' '}
                <span className="text-slate-400 font-normal font-sans text-[11px]">
                  {language === 'hi' ? 'सुरक्षित वॉलेट में' : 'to safe wallet'}
                </span>
              </p>
            </div>
            <button
              onClick={clearYieldToast}
              className="text-slate-400 hover:text-white text-xs p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Recovery Celebration Modal */}
      {recoveryCompletedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0b162c] border border-emerald-500/50 rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl shadow-emerald-950/40">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <PartyPopper className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-extrabold text-white">
              {language === 'hi' ? 'लॉस सफलतापूर्वक रिकवर हुआ!' : 'Loss Fully Recovered!'}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {language === 'hi'
                ? 'बधाई हो! आपने अपने पिछले लॉस को अनुशासित डिवाइड स्टेप्स में पूरा रिकवर कर लिया है। आपका नियमित प्रॉफिट वॉलेट भी इस दौरान सुरक्षित बढ़ता रहा।'
                : 'Congratulations! You have methodically recovered your previous loss across safe ladder steps. Your regular profit wallet also grew continuously during this session.'}
            </p>
            <button
              onClick={() => setRecoveryCompletedModal(false)}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm transition-colors cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              {language === 'hi' ? 'सामान्य ट्रेडिंग जारी रखें' : 'Continue Safe Trading'}
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace: Direct Full Display Console (No bulky separate main card) */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-2 sm:px-6 py-3 sm:py-6 space-y-4 sm:space-y-6 pb-28">
        {/* UNIFIED FULL DISPLAY TRADING CONSOLE: Amount, Divide, Loss & Big WIN/LOSS Buttons in 1 View */}
        <FullDisplayTradingConsole />

        {/* View Switcher Bar for Auxiliary Sections */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto p-1 bg-[#090f1d] border border-slate-800 rounded-xl text-xs font-medium">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('journal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'journal'
                  ? 'bg-slate-800 text-emerald-400 font-bold border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'ट्रेड जर्नल (History)' : 'Journal'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ladder')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'ladder'
                  ? 'bg-slate-800 text-amber-400 font-bold border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'रिकवरी लैडर (R:R)' : 'Ladder'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('wallet')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'wallet'
                  ? 'bg-slate-800 text-cyan-400 font-bold border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'प्रॉफिट वॉलेट' : 'Wallet'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] transition-all cursor-pointer shrink-0 ${
              activeTab === 'all'
                ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <LayoutGrid className="w-3 h-3" />
            <span>{language === 'hi' ? 'सब कुछ देखें (All)' : 'View All'}</span>
          </button>
        </div>

        {/* Dynamic Display of Selected Section(s) */}
        {activeTab === 'journal' && <TradeHistoryJournal />}
        {activeTab === 'ladder' && <RecoveryLadderView />}
        {activeTab === 'wallet' && <RegularProfitWalletCard />}
        {activeTab === 'all' && (
          <div className="space-y-4 sm:space-y-6">
            <TradeHistoryJournal />
            <RecoveryLadderView />
            <RegularProfitWalletCard />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-[#090e1a] py-4 px-4 sm:px-6 text-xs text-slate-500">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div>
            <span className="font-bold text-slate-300">TradeSizer</span>
            <span className="mx-2">·</span>
            <span>
              {language === 'hi'
                ? 'स्मार्ट मनी मैनेजमेंट, लॉस रिकवरी एवं प्रति-ट्रेड नियमित वॉलेट लाभ'
                : 'Smart Trade Sizing, Loss Recovery & Guaranteed Per-Trade Regular Profit Wallet'}
            </span>
          </div>

          <div className="text-[11px] text-slate-400">
            {language === 'hi'
              ? 'अनुशासित ट्रेडिंग · शून्य भावनाएं · स्थिर लाभ'
              : 'Disciplined Trading · Zero Emotions · Steady Growth'}
          </div>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <TradeProvider>
      <MainWorkspace />
    </TradeProvider>
  );
};

export default App;
