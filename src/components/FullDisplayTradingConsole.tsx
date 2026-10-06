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
  Target,
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
    totalTradesCount,
    totalWinsCount,
    totalLossCount,
    totalTurnover,
    winRatePercent,
  } = useTrade();

  const isDark = theme === 'dark';

  const isRecovery = activeLoss > 0;

  // STRICT MATHEMATICAL SYSTEM DIVIDED AMOUNT: NEVER mutated by manual typing
  const currentFactor = settings.recoveryStepsCount || 1;
  const effectiveRR = Math.max(0.1, Number(settings.riskRewardRatio) || 0.85);

  // Exact user formula:
  // In recovery: Broker payout covers portionLoss (बकाया लॉस) + 15% wallet profit
  // Trade = portionLoss / (effectiveRR - safeYieldRate)
  const suggestionBreakdown = useMemo(() => {
    const rawYield = settings.yieldRatePercent;
    const safeYieldPercent = (typeof rawYield === 'number' && !isNaN(rawYield) && rawYield >= 0)
      ? rawYield
      : (parseFloat(String(rawYield)) >= 0 ? parseFloat(String(rawYield)) : 15);
    const safeYieldRate = safeYieldPercent / 100;
    if (activeLoss > 0) {
      // 1. Portion of unrecovered loss to cover in this step (e.g. 27.06 / 1 = 27.06)
      const portionLoss = Number((activeLoss / currentFactor).toFixed(2));
      // 2. Net rate left to cover loss after 15% wallet profit is set aside:
      // (e.g. 0.85 broker payout - 0.15 wallet = 0.70 net recovery rate)
      const netRate = Math.max(0.10, Number((effectiveRR - safeYieldRate).toFixed(4)));
      // 3. Exact suggested trade amount on broker:
      const exactAmount = Number((portionLoss / netRate).toFixed(2));
      // 4. Wallet profit (15%) on this trade:
      const walletProfit = Number(((exactAmount * safeYieldRate).toFixed(2)));
      // 5. Total Payout Needed from broker = portionLoss + walletProfit (e.g. 27.06 + 5.80 = 32.86):
      const totalNeeded = Number((portionLoss + walletProfit).toFixed(2));
      return {
        baseTargetTrade: portionLoss,
        trProfit: portionLoss,
        walletProfit,
        totalNeeded,
        exactAmount,
      };
    }
    const baseTargetTrade = Math.max(10, Math.round((tradingCapital * (settings.baseTradePercent || 2)) / 100));
    const trProfit = Number((baseTargetTrade * effectiveRR).toFixed(2));
    const walletProfit = Number(((baseTargetTrade * safeYieldRate).toFixed(2)));
    const totalNeeded = trProfit;
    const exactAmount = baseTargetTrade;
    return {
      baseTargetTrade,
      trProfit,
      walletProfit,
      totalNeeded,
      exactAmount,
    };
  }, [activeLoss, currentFactor, effectiveRR, settings.yieldRatePercent, tradingCapital, settings.baseTradePercent]);

  const systemDividedAmount = useMemo(() => {
    return Number(suggestionBreakdown.exactAmount.toFixed(2));
  }, [suggestionBreakdown.exactAmount]);

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

  // In recovery mode, the target loss being recovered:
  const stepTargetLoss = isRecovery
    ? Number((activeLoss / (settings.recoveryStepsCount || 1)).toFixed(2))
    : 0;

  // Wallet extra profit (15% yield rate):
  const estimatedYield = Number(((numericTradeAmount * (Number(settings.yieldRatePercent) / 100)).toFixed(2)));

  // Target profit (R:R):
  // IN RECOVERY MODE: The exact unrecovered loss being recovered (e.g. 27.06)!
  // "Jo nakaya hai wohi exta target me ho no miss mach"
  // IN NORMAL MODE: Full broker payout (e.g. 55 at 85% = 46.75)
  const estimatedTRProfit = isRecovery ? stepTargetLoss : totalWinPayout;

  // Total Target Needed in Recovery = Unrecovered Loss + 15% Wallet Profit (e.g. 27.06 + 6.88 = 33.94)
  const totalRecoveryTarget = isRecovery
    ? Number((stepTargetLoss + estimatedYield).toFixed(2))
    : totalWinPayout;

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
                  onFocus={(e) => e.target.select()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveLoss();
                    if (e.key === 'Escape') setIsEditingLoss(false);
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

      {/* 3A. SYSTEM DIVIDED TRADE AMOUNT SUGGESTION (Title Outside Card) */}
      <div className="space-y-1.5">
        {/* Title OUTSIDE Card */}
        <div className="flex items-center gap-2 px-1">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
          <span className={`text-[11px] sm:text-xs font-mono font-bold uppercase tracking-wider ${
            isDark ? 'text-amber-400' : 'text-amber-700'
          }`}>
            {isRecovery
              ? language === 'hi'
                ? 'सिस्टम सुझाया गया ट्रेड (DIVIDED SUGGESTION)'
                : 'SYSTEM DIVIDED SUGGESTION'
              : language === 'hi'
              ? 'सिस्टम सुझाई गई सामान्य ट्रेड (SUGGESTED TRADE)'
              : 'SYSTEM SUGGESTED TRADE'}
          </span>
        </div>

        {/* Card containing Amount and Formula Breakdown */}
        <div
          className={`p-2.5 sm:p-3 rounded-xl border flex flex-wrap items-baseline justify-between gap-2 font-mono transition-colors ${
            isDark
              ? 'bg-[#080e1d] border-amber-500/40 text-amber-300'
              : 'bg-amber-50/90 border-amber-300 text-amber-900 shadow-xs'
          }`}
        >
          <span className="text-xl sm:text-2xl font-black tracking-tight tabular-nums">
            {currencyFormat(systemDividedAmount)}
          </span>
          <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {language === 'hi'
              ? `(${currencyFormat(suggestionBreakdown.trProfit)} R:R + ${currencyFormat(suggestionBreakdown.walletProfit)} वॉलेट = ${currencyFormat(suggestionBreakdown.totalNeeded)} पेआउट)`
              : `(${currencyFormat(suggestionBreakdown.trProfit)} R:R + ${currencyFormat(suggestionBreakdown.walletProfit)} Wallet = ${currencyFormat(suggestionBreakdown.totalNeeded)} Payout Target)`}
          </span>
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
            placeholder={String(Number(systemDividedAmount).toFixed(2))}
          />
        </div>

        {/* 3C. BROKER PAYOUT SELECTOR ("kyun ki kai bar payout different bhi aajata hai") */}
        <div
          className={`p-2 sm:p-2.5 rounded-xl border flex flex-wrap items-center justify-between gap-2 text-xs font-mono ${
            isDark ? 'bg-[#070d18] border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span className={`text-[11px] font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {language === 'hi' ? 'पेआउट %:' : 'Payout %:'}
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

      {/* 4. REAL MONEY METRICS STRIP: Clean 2-Box Split with Labels Outside Cards */}
      <div className={`p-2.5 sm:p-3 rounded-xl border ${isDark ? 'bg-[#070d18] border-slate-800/80' : 'bg-slate-50 border-slate-200'}`}>
        <div className="grid grid-cols-2 gap-2.5 font-mono">
          {/* Column 1: Target Recovery / Target Profit */}
          <div className="space-y-1">
            <div className={`text-[10px] sm:text-[11px] uppercase font-bold tracking-wider flex items-center justify-center gap-1 text-center truncate ${
              isDark ? 'text-emerald-400' : 'text-emerald-700'
            }`}>
              <Target className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
              <span className="truncate">
                {isRecovery
                  ? (language === 'hi' ? 'बकाया रिकवरी (R:R)' : 'Target Recovery (R:R)')
                  : (language === 'hi' ? 'टारगेट लाभ (R:R)' : 'Target Profit (R:R)')}
              </span>
            </div>
            <div className={`py-2 px-2.5 rounded-xl border text-center transition-all ${
              isDark
                ? 'bg-emerald-950/30 border-emerald-500/25 text-emerald-300'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-xs'
            }`}>
              <div className={`text-base sm:text-xl font-black tabular-nums ${
                isDark ? 'text-emerald-300' : 'text-emerald-600'
              }`}>
                +{currencyFormat(estimatedTRProfit)}
              </div>
            </div>
          </div>

          {/* Column 2: Wallet Profit */}
          <div className="space-y-1">
            <div className={`text-[10px] sm:text-[11px] uppercase font-bold tracking-wider flex items-center justify-center gap-1 text-center truncate ${
              isDark ? 'text-cyan-400' : 'text-cyan-700'
            }`}>
              <Coins className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
              <span className="truncate">
                {language === 'hi' ? `वॉलेट लाभ (${settings.yieldRatePercent}%)` : `Wallet Profit (${settings.yieldRatePercent}%)`}
              </span>
            </div>
            <div className={`py-2 px-2.5 rounded-xl border text-center transition-all ${
              isDark
                ? 'bg-cyan-950/30 border-cyan-500/25 text-cyan-300'
                : 'bg-cyan-50 border-cyan-200 text-cyan-900 shadow-xs'
            }`}>
              <div className={`text-base sm:text-xl font-black tabular-nums ${
                isDark ? 'text-cyan-300' : 'text-cyan-600'
              }`}>
                +{currencyFormat(estimatedYield)}
              </div>
            </div>
          </div>
        </div>

        {/* Exact Total Recovery Equation Strip (e.g. 27.06 + 6.88 = 33.94) */}
        {isRecovery && (
          <div className={`mt-2 pt-2 border-t text-[11px] font-mono text-center flex items-center justify-center gap-1.5 flex-wrap ${
            isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-600'
          }`}>
            <span className="font-semibold">
              {language === 'hi' ? 'कुल टारगेट:' : 'Total Target:'}
            </span>
            <span className="font-bold text-emerald-400">
              {currencyFormat(estimatedTRProfit)}
            </span>
            <span>+</span>
            <span className="font-bold text-cyan-400">
              {currencyFormat(estimatedYield)}
            </span>
            <span>=</span>
            <span className="font-black text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
              {currencyFormat(totalRecoveryTarget)}
            </span>
            <span className={`text-[10px] font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              ({language === 'hi' ? `पेआउट: ${currencyFormat(totalWinPayout)}` : `Payout: ${currencyFormat(totalWinPayout)}`})
            </span>
          </div>
        )}
      </div>

      {/* 5. COMPACT, CLEAN ACTION BUTTONS: WIN & LOSS */}
      <div className="grid grid-cols-2 gap-2.5 pt-0.5">
        {/* COMPACT WIN BUTTON (Very Light / Subtle Soft Styling) */}
        <button
          type="button"
          onClick={() => handleExecuteTrade('WIN')}
          className={`py-2.5 px-2 rounded-xl font-bold flex flex-col items-center justify-center border active:scale-[0.98] transition-all cursor-pointer min-w-0 ${
            isDark
              ? 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/35 text-emerald-300 shadow-sm shadow-emerald-950/40'
              : 'bg-emerald-50 hover:bg-emerald-100/80 border-emerald-200 text-emerald-700 shadow-xs'
          }`}
        >
          <div className="flex items-center gap-1 text-xs sm:text-sm font-extrabold uppercase tracking-wide">
            <ArrowUpRight className="w-4 h-4 stroke-[2.5] shrink-0 text-emerald-400" />
            <span>{language === 'hi' ? 'WIN (जीत)' : 'WIN'}</span>
          </div>
          <div className="font-mono font-black text-sm sm:text-base leading-tight mt-0.5 truncate max-w-full text-emerald-400">
            +{currencyFormat(totalWinPayout)}
          </div>
        </button>

        {/* COMPACT LOSS BUTTON (Very Light / Subtle Soft Styling) */}
        <button
          type="button"
          onClick={() => handleExecuteTrade('LOSS')}
          className={`py-2.5 px-2 rounded-xl font-bold flex flex-col items-center justify-center border active:scale-[0.98] transition-all cursor-pointer min-w-0 ${
            isDark
              ? 'bg-rose-500/15 hover:bg-rose-500/25 border-rose-500/35 text-rose-300 shadow-sm shadow-rose-950/40'
              : 'bg-rose-50 hover:bg-rose-100/80 border-rose-200 text-rose-700 shadow-xs'
          }`}
        >
          <div className="flex items-center gap-1 text-xs sm:text-sm font-extrabold uppercase tracking-wide">
            <ArrowDownRight className="w-4 h-4 stroke-[2.5] shrink-0 text-rose-400" />
            <span>{language === 'hi' ? 'LOSS (लॉस)' : 'LOSS'}</span>
          </div>
          <div className="font-mono font-black text-sm sm:text-base leading-tight mt-0.5 truncate max-w-full text-rose-400">
            -{currencyFormat(numericTradeAmount)}
          </div>
        </button>
      </div>

      {/* Real-time Session Performance Stats: Turnover, Win Rate, Total Trades */}
      <div
        className={`grid grid-cols-3 gap-2 p-2 sm:p-2.5 rounded-xl border font-mono text-center text-xs ${
          isDark ? 'bg-[#070d18] border-slate-800/90' : 'bg-slate-50 border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex flex-col items-center justify-center">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            {language === 'hi' ? 'कुल टर्नओवर' : 'Turnover'}
          </span>
          <span className="text-xs sm:text-sm font-black text-amber-400 tabular-nums mt-0.5">
            {currencyFormat(totalTurnover)}
          </span>
        </div>

        <div className={`flex flex-col items-center justify-center border-x ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            {language === 'hi' ? 'विन रेट' : 'Win Rate'}
          </span>
          <span className="text-xs sm:text-sm font-black text-emerald-400 tabular-nums mt-0.5">
            {winRatePercent}%
          </span>
        </div>

        <div className="flex flex-col items-center justify-center">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            {language === 'hi' ? 'कुल ट्रेड्स' : 'Trades'}
          </span>
          <span className="text-xs sm:text-sm font-black text-cyan-300 tabular-nums mt-0.5">
            {totalTradesCount} <span className="text-[10px] font-normal text-slate-400">({totalWinsCount}W/{totalLossCount}L)</span>
          </span>
        </div>
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
