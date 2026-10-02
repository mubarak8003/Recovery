import React, { useState, useEffect } from 'react';
import { useTrade } from '../context/TradeContext';
import {
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  TrendingDown,
  Edit3,
  Check,
  RotateCcw,
  Sliders,
  X,
  Coins,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

export const FullDisplayTradingConsole: React.FC = () => {
  const {
    recommendation,
    activeLoss,
    setActiveLossAmount,
    consecutiveLossCount,
    language,
    currencyFormat,
    settings,
    updateSettings,
    customTradeAmountOverride,
    setCustomTradeAmountOverride,
    recordTrade,
  } = useTrade();

  const isRecovery = recommendation.isRecoveryMode;

  // Local state for trade amount text
  const [tradeAmountText, setTradeAmountText] = useState<string>(String(recommendation.amount));

  // Local state for direct manual loss edit ("10 loss hua to manual se 7-8 pe kat dega")
  const [isEditingLoss, setIsEditingLoss] = useState(false);
  const [lossInput, setLossInput] = useState<string>(String(activeLoss));

  // Local state for note and feedback
  const [note, setNote] = useState<string>('');
  const [lastActionMessage, setLastActionMessage] = useState<string | null>(null);

  // Sync inputs with recommendation or activeLoss changes
  useEffect(() => {
    setTradeAmountText(String(recommendation.amount));
  }, [recommendation.amount]);

  useEffect(() => {
    if (!isEditingLoss) {
      setLossInput(String(activeLoss));
    }
  }, [activeLoss, isEditingLoss]);

  const numericTradeAmount = parseFloat(tradeAmountText) || 0;
  const estimatedYield = Number(((numericTradeAmount * (settings.yieldRatePercent / 100)).toFixed(2)));
  const estimatedWinPayout = Number((numericTradeAmount * settings.riskRewardRatio).toFixed(2));

  // Handle saving manually reduced/adjusted loss (e.g. 10 -> 7 or 8)
  const handleSaveLoss = () => {
    const parsed = parseFloat(lossInput);
    if (!isNaN(parsed) && parsed >= 0) {
      setActiveLossAmount(parsed);
    }
    setIsEditingLoss(false);
  };

  // Quick Amount Steppers (-50, -10, +10, +50, +100)
  const handleStepDelta = (delta: number) => {
    const cur = parseFloat(tradeAmountText) || 0;
    const next = Math.max(1, cur + delta);
    setTradeAmountText(String(next));
    setCustomTradeAmountOverride(next);
  };

  const handleAmountBlur = () => {
    const parsed = parseFloat(tradeAmountText);
    if (isNaN(parsed) || parsed <= 0) {
      setTradeAmountText(String(recommendation.amount));
      setCustomTradeAmountOverride(null);
    } else {
      setCustomTradeAmountOverride(parsed);
    }
  };

  const handleResetToAuto = () => {
    setCustomTradeAmountOverride(null);
    setTradeAmountText(String(recommendation.amount));
  };

  // Record trade execution (WIN or LOSS)
  const handleExecuteTrade = (result: 'WIN' | 'LOSS') => {
    if (numericTradeAmount <= 0 || isNaN(numericTradeAmount)) return;

    recordTrade({
      amount: numericTradeAmount,
      result,
      actualPnL: result === 'WIN' ? estimatedWinPayout : -numericTradeAmount,
      note: note.trim() || undefined,
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
    setTimeout(() => setLastActionMessage(null), 3500);
  };

  // Divide factor options
  const divideOptions = [1, 2, 3, 4, 5, 6, 8];

  return (
    <div className="w-full bg-[#0a1120] border-y sm:border sm:rounded-2xl border-slate-800 p-3.5 sm:p-6 space-y-4 sm:space-y-5 transition-all">
      {/* 1. TOP LIVE STATUS STRIP (Loss, Streak, Mode) - NO CLUNKY MAIN CARD BOX */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`w-2.5 h-2.5 rounded-full animate-pulse ${
              isRecovery ? 'bg-amber-400' : 'bg-emerald-400'
            }`}
          />
          <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-200">
            {isRecovery
              ? language === 'hi'
                ? `लाइव डिवाइड रिकवरी (÷${settings.recoveryStepsCount} भाग)`
                : `LIVE ROLLING RECOVERY (÷${settings.recoveryStepsCount} DIVIDE)`
              : language === 'hi'
              ? 'नॉर्मल ट्रेडिंग (सुरक्षित बेस साइज़)'
              : 'Normal Trade (Safe Base Size)'}
          </span>

          {customTradeAmountOverride !== null && (
            <button
              type="button"
              onClick={handleResetToAuto}
              className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 cursor-pointer"
              title="Click to reset to auto calculation"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>{language === 'hi' ? 'कस्टम (ऑटो रीसेट)' : 'Custom (Reset)'}</span>
            </button>
          )}
        </div>

        {/* Losses Streak & Unrecovered Loss Indicator */}
        <div className="flex items-center gap-2 flex-wrap">
          {isRecovery && consecutiveLossCount > 0 && (
            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/35 text-rose-300 text-xs font-mono font-bold">
              <TrendingDown className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>
                {language === 'hi'
                  ? `${consecutiveLossCount} मर्तबा लॉस`
                  : `${consecutiveLossCount} Losses`}
              </span>
            </div>
          )}

          {/* Unrecovered Loss Badge with DIRECT INLINE EDIT ("10 loss hua to manual se 7-8 pe kat dega") */}
          {isRecovery && (
            isEditingLoss ? (
              <div className="flex items-center gap-1 bg-[#080d19] border border-amber-500 px-2 py-0.5 rounded-full">
                <span className="text-[11px] text-amber-400 font-mono font-bold">
                  {settings.currencySymbol}
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={lossInput}
                  onChange={(e) => setLossInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveLoss();
                  }}
                  className="w-16 bg-transparent text-amber-300 font-mono font-bold text-xs focus:outline-none"
                  placeholder="7"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveLoss}
                  className="text-emerald-400 hover:text-emerald-300 p-0.5 cursor-pointer"
                  title="Save adjusted loss"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingLoss(false)}
                  className="text-slate-400 hover:text-slate-300 p-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => {
                  setLossInput(String(activeLoss));
                  setIsEditingLoss(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold cursor-pointer hover:border-amber-400 hover:bg-amber-500/25 transition-all"
                title="लॉस घटाने या बदलने के लिए क्लिक करें (उदा. 10 को 7 या 8 करें)"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>
                  {language === 'hi' ? 'बकाया लॉस:' : 'Unrecovered:'}{' '}
                  <strong className="underline decoration-dotted">{currencyFormat(activeLoss)}</strong>
                </span>
                <Edit3 className="w-2.5 h-2.5 text-amber-400/80 ml-0.5" />
              </div>
            )
          )}
        </div>
      </div>

      {/* 2. LIVE DIVIDE SELECTOR: "लॉस को कितने भागों में बांटना है" */}
      {isRecovery && (
        <div className="flex flex-wrap items-center justify-between gap-2 bg-[#070d18] p-2.5 sm:p-3 rounded-xl border border-slate-800">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Sliders className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-200">
              {language === 'hi'
                ? 'लॉस डिवाइड भाग (Divide Factor):'
                : 'Divide Loss by How Many Parts?'}
            </span>
            <span className="text-xs text-amber-400 font-mono font-bold">
              (÷{settings.recoveryStepsCount})
            </span>

            {/* Instant Sync with Current Consecutive Losses */}
            {consecutiveLossCount > 1 && settings.recoveryStepsCount !== consecutiveLossCount && (
              <button
                type="button"
                onClick={() => updateSettings({ recoveryStepsCount: consecutiveLossCount })}
                className="ml-1 px-2 py-0.5 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1"
                title={`Auto match to ${consecutiveLossCount} losses`}
              >
                <span>⚡ {language === 'hi' ? `${consecutiveLossCount} लॉस = ÷${consecutiveLossCount}` : `Match ÷${consecutiveLossCount}`}</span>
              </button>
            )}
          </div>

          {/* Quick Divide Factor Chips */}
          <div className="flex items-center gap-1 font-mono text-xs overflow-x-auto">
            {divideOptions.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => updateSettings({ recoveryStepsCount: n })}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all text-center cursor-pointer text-xs ${
                  settings.recoveryStepsCount === n
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30 scale-105'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                ÷{n}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. TRADE AMOUNT INPUT & QUICK STEPPERS (FULL DISPLAY) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px] sm:text-xs">
            {isRecovery
              ? language === 'hi'
                ? 'ट्रेड की राशि (DIVIDED TRADE AMOUNT)'
                : 'DIVIDED TRADE AMOUNT'
              : language === 'hi'
              ? 'ट्रेड की राशि (NORMAL TRADE AMOUNT)'
              : 'NORMAL TRADE AMOUNT'}
          </span>

          <div className="flex items-center gap-2">
            {isRecovery && (
              <span className="text-xs font-mono text-amber-300 font-semibold">
                {currencyFormat(activeLoss)} ÷ {settings.recoveryStepsCount}
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setTradeAmountText(String(recommendation.amount));
                setCustomTradeAmountOverride(null);
              }}
              className="text-[11px] font-mono text-emerald-400 hover:underline cursor-pointer"
            >
              {language === 'hi'
                ? `अनुशंसित (${currencyFormat(recommendation.amount)})`
                : `Recommended (${currencyFormat(recommendation.amount)})`}
            </button>
          </div>
        </div>

        {/* The Direct Amount Input Box */}
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-2xl font-bold pointer-events-none">
            {settings.currencySymbol}
          </span>
          <input
            type="text"
            inputMode="decimal"
            value={tradeAmountText}
            onChange={(e) => {
              setTradeAmountText(e.target.value);
              const p = parseFloat(e.target.value);
              if (!isNaN(p) && p > 0) setCustomTradeAmountOverride(p);
            }}
            onBlur={handleAmountBlur}
            className="w-full pl-10 pr-4 py-3 sm:py-3.5 bg-[#080d19] border border-slate-700 rounded-xl text-white font-mono font-extrabold text-2xl sm:text-3xl focus:outline-none focus:border-emerald-500 transition-colors"
            placeholder="0"
          />
        </div>

        {/* Quick Steppers: -50, -10, +10, +50, +100 */}
        <div className="flex items-center justify-between gap-1.5 text-xs font-mono">
          {[-50, -10, 10, 50, 100].map((delta) => (
            <button
              key={delta}
              type="button"
              onClick={() => handleStepDelta(delta)}
              className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors text-center border border-slate-700/60 font-bold cursor-pointer text-xs"
            >
              {delta > 0 ? `+${delta}` : delta}
            </button>
          ))}
        </div>
      </div>

      {/* 4. LIVE METRICS STRIP: PnL, Wallet Profit, R:R */}
      <div className="grid grid-cols-3 gap-2 bg-[#070d18] p-2.5 sm:p-3 rounded-xl border border-slate-800/80 text-center font-mono">
        <div>
          <div className="text-[10px] text-slate-400 uppercase">
            {language === 'hi' ? 'जीतने पर (WIN)' : 'Target Profit'}
          </div>
          <div className="text-xs sm:text-sm font-bold text-emerald-400 tabular-nums">
            +{currencyFormat(estimatedWinPayout)}
          </div>
        </div>

        <div className="border-x border-slate-800">
          <div className="text-[10px] text-cyan-400 uppercase flex items-center justify-center gap-1">
            <Coins className="w-3 h-3 shrink-0" />
            <span>{language === 'hi' ? 'वॉलेट लाभ' : 'Wallet Profit'}</span>
          </div>
          <div className="text-xs sm:text-sm font-bold text-cyan-300 tabular-nums">
            +{currencyFormat(estimatedYield)}
          </div>
        </div>

        <div>
          <div className="text-[10px] text-slate-400 uppercase">R:R</div>
          <div className="text-xs sm:text-sm font-bold text-white tabular-nums">
            1:{settings.riskRewardRatio}
          </div>
        </div>
      </div>

      {/* 5. HUGE PRIMARY ACTION BUTTONS: WIN & LOSS (NO SCROLLING NEEDED) */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        {/* BIG WIN BUTTON */}
        <button
          type="button"
          onClick={() => handleExecuteTrade('WIN')}
          className="py-4 sm:py-5 px-3 sm:px-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-base sm:text-lg flex flex-col items-center justify-center gap-1 shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all cursor-pointer"
        >
          <div className="flex items-center gap-1.5">
            <ArrowUpRight className="w-6 h-6 stroke-[3]" />
            <span>{language === 'hi' ? '+ WIN (जीत)' : '+ WIN RECORD'}</span>
          </div>
          <span className="text-xs font-mono font-semibold text-slate-950/90">
            +{currencyFormat(estimatedWinPayout)}
          </span>
        </button>

        {/* BIG LOSS BUTTON */}
        <button
          type="button"
          onClick={() => handleExecuteTrade('LOSS')}
          className="py-4 sm:py-5 px-3 sm:px-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white font-extrabold text-base sm:text-lg flex flex-col items-center justify-center gap-1 shadow-lg shadow-rose-500/25 active:scale-[0.98] transition-all cursor-pointer"
        >
          <div className="flex items-center gap-1.5">
            <ArrowDownRight className="w-6 h-6 stroke-[3]" />
            <span>{language === 'hi' ? '- LOSS (लॉस)' : '- LOSS RECORD'}</span>
          </div>
          <span className="text-xs font-mono font-semibold text-white/90">
            -{currencyFormat(numericTradeAmount)}
          </span>
        </button>
      </div>

      {/* Optional Note input */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder={
            language === 'hi'
              ? 'वैकल्पिक ट्रेड नोट (उदा. BTC, Nifty, Trade #2)...'
              : 'Optional note (e.g. BTC, Nifty, Trade #2)...'
          }
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="flex-1 px-3 py-1.5 bg-[#080d19] border border-slate-800 rounded-lg text-slate-300 text-xs focus:outline-none focus:border-slate-700"
        />
        {isRecovery && (
          <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono shrink-0">
            <RefreshCw className="w-3 h-3 text-cyan-400 shrink-0" />
            <span className="hidden sm:inline">
              {language === 'hi' ? 'रोलिंग डिवाइड एक्टिव' : 'Rolling Divide Active'}
            </span>
          </div>
        )}
      </div>

      {/* Action feedback banner */}
      {lastActionMessage && (
        <div className="p-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{lastActionMessage}</span>
        </div>
      )}
    </div>
  );
};
