import React, { useState, useEffect, useMemo } from 'react';
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
  Info,
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
    tradingCapital,
    theme,
  } = useTrade();

  const isDark = theme === 'dark';

  const isRecovery = activeLoss > 0;

  // STRICT MATHEMATICAL SYSTEM DIVIDED AMOUNT: NEVER mutated by manual typing
  const currentFactor = settings.recoveryStepsCount || 1;
  const effectiveRR = Math.max(0.1, Number(settings.riskRewardRatio) || 0.85);

  const systemDividedAmount = useMemo(() => {
    if (activeLoss > 0) {
      return Math.max(1, Math.round((activeLoss / currentFactor) / effectiveRR));
    }
    return Math.max(1, Math.round((tradingCapital * (settings.baseTradePercent || 2)) / 100));
  }, [activeLoss, currentFactor, effectiveRR, tradingCapital, settings.baseTradePercent]);

  // Local state for trade amount text - KHIALI / EMPTY BY DEFAULT so user types freely
  const [tradeAmountText, setTradeAmountText] = useState<string>('');

  // Local state for direct manual loss edit ("10 loss hua to manual se 7-8 pe kat dega")
  const [isEditingLoss, setIsEditingLoss] = useState(false);
  const [lossInput, setLossInput] = useState<string>(String(Math.max(0, activeLoss || 0)));

  // Local state for note and feedback
  const [note, setNote] = useState<string>('');
  const [lastActionMessage, setLastActionMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isEditingLoss) {
      setLossInput(String(Math.max(0, Number(activeLoss) || 0)));
    }
  }, [activeLoss, isEditingLoss]);

  // Numerical sanitization: If user typed, use user's value; else fallback to suggested amount
  const parsedAmt = parseFloat(tradeAmountText);
  const numericTradeAmount = (!isNaN(parsedAmt) && isFinite(parsedAmt) && parsedAmt > 0)
    ? parsedAmt
    : systemDividedAmount;

  // REAL MONEY FLOW:
  // Full broker payout based on trade:
  const totalWinPayout = Number((numericTradeAmount * effectiveRR).toFixed(2));

  // In recovery mode, the target profit MUST cover the full loss being recovered:
  const stepTargetLoss = isRecovery
    ? (recommendation.stepLossTarget || Math.round(activeLoss / (settings.recoveryStepsCount || 1)))
    : 0;

  // Wallet extra profit is ALWAYS based on the Trade Amount:
  const estimatedYield = Number(((numericTradeAmount * (Number(settings.yieldRatePercent) / 100)).toFixed(2)));

  // Target profit:
  const estimatedTRProfit = isRecovery
    ? stepTargetLoss
    : Number(Math.max(0, totalWinPayout - estimatedYield).toFixed(2));

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
    const cur = numericTradeAmount;
    const next = Math.max(1, cur + delta);
    setTradeAmountText(String(next));
    setCustomTradeAmountOverride(next);
  };

  const handleAmountBlur = () => {
    const parsed = parseFloat(tradeAmountText);
    if (!isNaN(parsed) && parsed > 0) {
      setCustomTradeAmountOverride(parsed);
    } else {
      setCustomTradeAmountOverride(null);
    }
  };

  const handleResetToAuto = () => {
    setCustomTradeAmountOverride(null);
    setTradeAmountText('');
  };

  // Record trade execution (WIN or LOSS) - EXACT MANUAL AMOUNT SENT TO HISTORY
  const handleExecuteTrade = (result: 'WIN' | 'LOSS') => {
    const rawVal = parseFloat(tradeAmountText);
    const validAmount = (!isNaN(rawVal) && rawVal > 0) ? rawVal : numericTradeAmount;
    if (validAmount <= 0 || isNaN(validAmount)) return;

    recordTrade({
      amount: validAmount,
      result,
      actualPnL: result === 'WIN' ? Number((validAmount * effectiveRR).toFixed(2)) : -validAmount,
      note: note.trim() || undefined,
    });

    setLastActionMessage(
      result === 'WIN'
        ? language === 'hi'
          ? `जीत दर्ज हुई (+${currencyFormat(totalWinPayout)})! वॉलेट में अतिरिक्त लाभ: +${currencyFormat(estimatedYield)}!`
          : `WIN recorded (+${currencyFormat(totalWinPayout)})! Extra profit to wallet: +${currencyFormat(estimatedYield)}!`
        : language === 'hi'
        ? `लॉस दर्ज हुआ (-${currencyFormat(numericTradeAmount)})। अगली रिकवरी ट्रेड तुरंत कैलकुलेट हो गई।`
        : `LOSS recorded (-${currencyFormat(numericTradeAmount)}). Next recovery trade calculated.`
    );

    // Keep input empty for next user trade
    setTradeAmountText('');
    setCustomTradeAmountOverride(null);
    setNote('');
    setTimeout(() => setLastActionMessage(null), 3500);
  };

  // Dynamic Divide factor options (expanded beyond 10 up to 50+)
  const baseDivideOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 25, 30, 40, 50];
  const divideOptions = Array.from(new Set([...baseDivideOptions, currentFactor])).sort((a, b) => a - b);

  return (
    <div
      className={`w-full rounded-2xl border p-3.5 sm:p-6 space-y-3 sm:space-y-4 transition-all ${
        isDark ? 'bg-[#0a1120] border-slate-800 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
      }`}
    >
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
                ? `लाइव डिवाइड रिकवरी (÷${currentFactor} भाग)`
                : `LIVE ROLLING RECOVERY (÷${currentFactor} DIVIDE)`
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
                  setLossInput(String(Math.max(0, Number(activeLoss) || 0)));
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
            <div className="flex items-center gap-1 bg-[#090f1d] border border-slate-700 px-1 py-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => updateSettings({ recoveryStepsCount: Math.max(1, currentFactor - 1) })}
                className="w-5 h-5 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                title="कम करें (-1)"
              >
                -
              </button>
              <span className="text-xs text-amber-400 font-mono font-bold px-1">
                ÷{currentFactor}
              </span>
              <button
                type="button"
                onClick={() => updateSettings({ recoveryStepsCount: Math.min(100, currentFactor + 1) })}
                className="w-5 h-5 flex items-center justify-center rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
                title="बढ़ाएं (+1)"
              >
                +
              </button>
            </div>

            {/* Instant Sync with Current Consecutive Losses */}
            {consecutiveLossCount > 1 && currentFactor !== consecutiveLossCount && (
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
          <div className="flex items-center gap-1 font-mono text-xs overflow-x-auto max-w-full pb-1 sm:pb-0">
            {divideOptions.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => updateSettings({ recoveryStepsCount: n })}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all text-center cursor-pointer text-xs shrink-0 ${
                  currentFactor === n
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

      {/* 3A. SYSTEM DIVIDED TRADE AMOUNT SUGGESTION (Alag Dikhayein - Clean Display) */}
      <div
        className={`p-2.5 sm:p-3 rounded-xl border flex flex-wrap items-center justify-between gap-2 transition-colors ${
          isDark
            ? 'bg-[#080e1d] border-amber-500/40 text-amber-300'
            : 'bg-amber-50/90 border-amber-300 text-amber-900'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider">
            {isRecovery
              ? language === 'hi'
                ? 'सिस्टम सुझाया गया ट्रेड (DIVIDED SUGGESTION)'
                : 'SYSTEM DIVIDED SUGGESTION'
              : language === 'hi'
              ? 'सिस्टम सुझाई गई सामान्य ट्रेड (SUGGESTED TRADE)'
              : 'SYSTEM SUGGESTED TRADE'}
          </span>
        </div>

        <div className="flex items-baseline gap-2 font-mono">
          <span className="text-xl sm:text-2xl font-black tracking-tight tabular-nums">
            {currencyFormat(systemDividedAmount)}
          </span>
          {isRecovery && (
            <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              ({currencyFormat(activeLoss)} ÷ {currentFactor} भाग)
            </span>
          )}
        </div>
      </div>

      {/* 3B. MANUAL / ACTUAL TRADE AMOUNT FIELD (Jo Trade History me jayega) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs flex-wrap gap-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`font-bold uppercase tracking-wider text-[11px] sm:text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {language === 'hi' ? 'मैन्युअल ट्रेड राशि (ACTUAL TRADE PLACED)' : 'ACTUAL TRADE PLACED (MANUAL)'}
            </span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                isDark
                  ? 'bg-cyan-950/50 text-cyan-300 border border-cyan-500/30'
                  : 'bg-cyan-50 text-cyan-800 border border-cyan-200'
              }`}
            >
              {language === 'hi' ? '✓ यही राशि हिस्ट्री में जाएगी' : '✓ Exactly logged to history'}
            </span>
          </div>
        </div>

        {/* The Direct Manual Amount Input Box (Khali / Empty by default) */}
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
              if (!isNaN(p) && p > 0) {
                setCustomTradeAmountOverride(p);
              } else {
                setCustomTradeAmountOverride(null);
              }
            }}
            onBlur={handleAmountBlur}
            className={`w-full pl-10 pr-4 py-3 sm:py-3.5 border rounded-xl font-mono font-extrabold text-2xl sm:text-3xl focus:outline-none transition-colors ${
              isDark
                ? 'bg-[#080d19] border-slate-700 text-white placeholder-slate-600 focus:border-cyan-400'
                : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-cyan-600'
            }`}
            placeholder={String(systemDividedAmount)}
          />
        </div>

        {/* Quick Steppers: -50, -10, +10, +50, +100 */}
        <div className="flex items-center justify-between gap-1.5 text-xs font-mono">
          {[-50, -10, 10, 50, 100].map((delta) => (
            <button
              key={delta}
              type="button"
              onClick={() => handleStepDelta(delta)}
              className={`flex-1 py-1.5 rounded-lg border font-bold cursor-pointer text-xs transition-colors text-center ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700/60'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
              }`}
            >
              {delta > 0 ? `+${delta}` : delta}
            </button>
          ))}
        </div>

        {/* 3C. BROKER PAYOUT SELECTOR ("kyun ki kai bar payout different bhi aajata hai") */}
        <div
          className={`p-2 sm:p-2.5 rounded-xl border flex flex-wrap items-center justify-between gap-2 text-xs font-mono ${
            isDark ? 'bg-[#070d18] border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span className={`text-[11px] font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {language === 'hi' ? 'ब्रोकर पेआउट % (Broker Payout):' : 'Broker Payout %:'}
            </span>
            <span className="font-bold text-amber-400 text-xs">
              {Math.round(effectiveRR * 100)}%
            </span>
          </div>

          <div className="flex items-center gap-1 flex-wrap">
            {[75, 80, 82, 85, 88, 90, 95].map((pct) => {
              const isCurrent = Math.round(effectiveRR * 100) === pct;
              return (
                <button
                  key={pct}
                  type="button"
                  onClick={() => updateSettings({ riskRewardRatio: pct / 100 })}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : isDark
                      ? 'bg-slate-800 text-slate-400 hover:text-white'
                      : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  {pct}%
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. REAL MONEY METRICS STRIP: Both TR and Wallet funded by broker payout */}
      <div className="bg-[#070d18] p-3 rounded-xl border border-slate-800/80 space-y-2">
        <div className="grid grid-cols-3 gap-2 text-center font-mono">
          <div>
            <div className="text-[10px] text-slate-400 uppercase">
              {language === 'hi' ? 'टारगेट लाभ (R:R)' : 'Target Profit (R:R)'}
            </div>
            <div className="text-xs sm:text-sm font-bold text-emerald-400 tabular-nums">
              +{currencyFormat(estimatedTRProfit)}
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
            <div className="text-[10px] text-slate-400 uppercase">
              {language === 'hi' ? 'कुल पेआउट (Payout)' : 'Total Payout'}
            </div>
            <div className="text-xs sm:text-sm font-bold text-amber-300 tabular-nums">
              +{currencyFormat(totalWinPayout)}
            </div>
          </div>
        </div>
      </div>

      {/* 5. COMPACT, CLEAN ACTION BUTTONS: WIN & LOSS */}
      <div className="grid grid-cols-2 gap-2.5 pt-0.5">
        {/* COMPACT WIN BUTTON */}
        <button
          type="button"
          onClick={() => handleExecuteTrade('WIN')}
          className="py-2.5 px-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold flex flex-col items-center justify-center shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-all cursor-pointer min-w-0"
        >
          <div className="flex items-center gap-1 text-xs sm:text-sm font-extrabold uppercase tracking-wide">
            <ArrowUpRight className="w-4 h-4 stroke-[3] shrink-0" />
            <span>{language === 'hi' ? 'WIN (जीत)' : 'WIN'}</span>
          </div>
          <div className="font-mono font-black text-sm sm:text-base leading-tight mt-0.5 truncate max-w-full">
            +{currencyFormat(totalWinPayout)}
          </div>
        </button>

        {/* COMPACT LOSS BUTTON */}
        <button
          type="button"
          onClick={() => handleExecuteTrade('LOSS')}
          className="py-2.5 px-2 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white font-bold flex flex-col items-center justify-center shadow-md shadow-rose-500/20 active:scale-[0.98] transition-all cursor-pointer min-w-0"
        >
          <div className="flex items-center gap-1 text-xs sm:text-sm font-extrabold uppercase tracking-wide">
            <ArrowDownRight className="w-4 h-4 stroke-[3] shrink-0" />
            <span>{language === 'hi' ? 'LOSS (लॉस)' : 'LOSS'}</span>
          </div>
          <div className="font-mono font-black text-sm sm:text-base leading-tight mt-0.5 truncate max-w-full">
            -{currencyFormat(numericTradeAmount)}
          </div>
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
