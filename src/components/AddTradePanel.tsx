import React, { useState, useEffect } from 'react';
import { useTrade } from '../context/TradeContext';
import { ArrowUpRight, ArrowDownRight, CheckCircle2, Coins } from 'lucide-react';

export const AddTradePanel: React.FC = () => {
  const {
    recommendation,
    recordTrade,
    language,
    currencyFormat,
    settings,
  } = useTrade();

  const [amountText, setAmountText] = useState<string>(String(recommendation.amount));
  const [note, setNote] = useState<string>(() => {
    try {
      return localStorage.getItem('tradesizer_quick_note') || '';
    } catch {
      return '';
    }
  });
  const [lastActionMessage, setLastActionMessage] = useState<string | null>(null);

  const handleNoteChange = (val: string) => {
    setNote(val);
    try {
      localStorage.setItem('tradesizer_quick_note', val);
    } catch {
      // ignore
    }
  };

  // Sync with recommendation when recommendation updates
  useEffect(() => {
    setAmountText(String(recommendation.amount));
  }, [recommendation.amount]);

  const numericTradeAmount = parseFloat(amountText) || 0;
  const estimatedYield = Number(((numericTradeAmount * (settings.yieldRatePercent / 100)).toFixed(2)));
  const estimatedWinPayout = Number((numericTradeAmount * settings.riskRewardRatio).toFixed(2));

  const handleRecord = (result: 'WIN' | 'LOSS') => {
    if (numericTradeAmount <= 0 || isNaN(numericTradeAmount)) return;

    recordTrade({
      amount: numericTradeAmount,
      result,
      actualPnL: result === 'WIN' ? estimatedWinPayout : -numericTradeAmount,
      note: undefined,
    });

    setLastActionMessage(
      result === 'WIN'
        ? language === 'hi'
          ? `जीत दर्ज हुई (+${currencyFormat(estimatedWinPayout)}) और वॉलेट में +${currencyFormat(estimatedYield)} जुड़े!`
          : `WIN recorded (+${currencyFormat(estimatedWinPayout)}) & +${currencyFormat(estimatedYield)} added to wallet!`
        : language === 'hi'
        ? `लॉस दर्ज हुआ (-${currencyFormat(numericTradeAmount)})। अगली रिकवरी ट्रेड तुरंत कैलकुलेट हो गई। वॉलेट में +${currencyFormat(estimatedYield)} जुड़े!`
        : `LOSS recorded (-${currencyFormat(numericTradeAmount)}). Next recovery trade calculated. +${currencyFormat(estimatedYield)} added to wallet!`
    );

    setNote('');
    setTimeout(() => setLastActionMessage(null), 4000);
  };

  const handleStepDelta = (delta: number) => {
    const cur = parseFloat(amountText) || 0;
    const next = Math.max(1, cur + delta);
    setAmountText(String(next));
  };

  const handleAmountBlur = () => {
    const parsed = parseFloat(amountText);
    if (isNaN(parsed) || parsed <= 0) {
      setAmountText(String(recommendation.amount));
    }
  };

  return (
    <div className="bg-[#0b1222] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-white">
            {language === 'hi' ? 'ट्रेड परिणाम दर्ज करें' : 'Record Trade Outcome'}
          </h2>
          <p className="text-xs text-slate-400">
            {language === 'hi'
              ? 'सिर्फ राशि जांचें और WIN या LOSS बटन दबाएं'
              : 'Verify trade size and tap WIN or LOSS'}
          </p>
        </div>
      </div>

      {/* Trade Amount Field & Quick Modifiers */}
      <div className="mb-4 sm:mb-5">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-semibold text-slate-300">
            {language === 'hi' ? 'ट्रेड की राशि (Trade Amount)' : 'Trade Amount'}
          </span>
          <button
            type="button"
            onClick={() => setAmountText(String(recommendation.amount))}
            className="text-[11px] font-mono text-emerald-400 hover:underline cursor-pointer"
          >
            {language === 'hi'
              ? `अनुशंसित सेट करें (${currencyFormat(recommendation.amount)})`
              : `Use Recommended (${currencyFormat(recommendation.amount)})`}
          </button>
        </div>

        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-lg font-bold pointer-events-none">
            {settings.currencySymbol}
          </span>
          <input
            type="text"
            inputMode="decimal"
            value={amountText}
            onChange={(e) => setAmountText(e.target.value)}
            onBlur={handleAmountBlur}
            className="w-full pl-8 pr-4 py-2.5 sm:py-3 bg-[#080d19] border border-slate-700 rounded-xl text-white font-mono font-bold text-xl sm:text-2xl focus:outline-none focus:border-emerald-500 transition-colors"
            placeholder="0"
          />
        </div>

        {/* Quick Amount Steppers */}
        <div className="flex items-center justify-between gap-1.5 mt-2 text-xs font-mono">
          {[-50, -10, 10, 50, 100].map((delta) => (
            <button
              key={delta}
              type="button"
              onClick={() => handleStepDelta(delta)}
              className="flex-1 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors text-center border border-slate-700/60 cursor-pointer"
            >
              {delta > 0 ? `+${delta}` : delta}
            </button>
          ))}
        </div>
      </div>

      {/* Guaranteed Regular Profit Callout */}
      <div className="mb-4 sm:mb-5 p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="text-slate-300">
            {language === 'hi'
              ? `इस ट्रेड पर वॉलेट में नियमित जुड़ेगा (${settings.yieldRatePercent}%):`
              : `Regular profit added to wallet on this trade (${settings.yieldRatePercent}%):`}
          </span>
        </div>
        <span className="font-mono font-bold text-cyan-300 tabular-nums text-sm">
          +{currencyFormat(estimatedYield)}
        </span>
      </div>

      {/* Main Action Buttons: WIN and LOSS */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* WIN Button */}
        <button
          type="button"
          onClick={() => handleRecord('WIN')}
          className="py-3.5 sm:py-4 px-3 sm:px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm sm:text-base flex flex-col items-center justify-center gap-1 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all cursor-pointer"
        >
          <div className="flex items-center gap-1.5 text-base sm:text-lg">
            <ArrowUpRight className="w-5 h-5 stroke-[3]" />
            <span>{language === 'hi' ? '+ WIN (जीत दर्ज)' : '+ RECORD WIN'}</span>
          </div>
          <span className="text-xs font-mono font-semibold text-slate-900/80">
            +{currencyFormat(estimatedWinPayout)} PnL
          </span>
        </button>

        {/* LOSS Button */}
        <button
          type="button"
          onClick={() => handleRecord('LOSS')}
          className="py-3.5 sm:py-4 px-3 sm:px-4 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-extrabold text-sm sm:text-base flex flex-col items-center justify-center gap-1 shadow-lg shadow-rose-500/20 active:scale-[0.98] transition-all cursor-pointer"
        >
          <div className="flex items-center gap-1.5 text-base sm:text-lg">
            <ArrowDownRight className="w-5 h-5 stroke-[3]" />
            <span>{language === 'hi' ? '- LOSS (लॉस दर्ज)' : '- RECORD LOSS'}</span>
          </div>
          <span className="text-xs font-mono font-semibold text-white/80">
            -{currencyFormat(numericTradeAmount)} PnL
          </span>
        </button>
      </div>

      {/* Optional Quick Market Note */}
      <div className="mt-2.5">
        <input
          type="text"
          placeholder={
            language === 'hi'
              ? 'वैकल्पिक नोट (उदा. BTC, Nifty, Trade #2)...'
              : 'Optional note (e.g. BTC, Nifty, Trade #2)...'
          }
          value={note}
          onChange={(e) => handleNoteChange(e.target.value)}
          className="w-full px-3 py-1.5 bg-[#080d19] border border-slate-800 rounded-lg text-slate-300 text-xs focus:outline-none focus:border-slate-600"
        />
      </div>

      {/* Feedback banner */}
      {lastActionMessage && (
        <div className="mt-3 p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{lastActionMessage}</span>
        </div>
      )}
    </div>
  );
};
