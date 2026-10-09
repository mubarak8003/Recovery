import React, { useState, useEffect } from 'react';
import { useTrade } from '../context/TradeContext';
import { StrategyForecastCard } from './StrategyForecastCard';
import {
  Layers,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  TrendingDown,
  Target,
  Edit3,
  Check,
  Sparkles,
} from 'lucide-react';

export const RecoveryLadderView: React.FC = () => {
  const {
    activeLoss,
    setActiveLossAmount,
    initialLoss,
    totalRecovered,
    stepDetails,
    consecutiveLossCount,
    totalLossCount,
    settings,
    updateSettings,
    language,
    currencyFormat,
  } = useTrade();

  // Local string states to allow seamless typing, backspacing to empty, and decimals < 1
  const [rrInput, setRrInput] = useState<string>(String(settings.riskRewardRatio));
  const [stepsInput, setStepsInput] = useState<string>(String(settings.recoveryStepsCount));

  const [isEditingLoss, setIsEditingLoss] = useState(false);
  const [customLossInput, setCustomLossInput] = useState<string>(String(activeLoss));

  // Sync when settings change externally
  useEffect(() => {
    setRrInput(String(settings.riskRewardRatio));
  }, [settings.riskRewardRatio]);

  useEffect(() => {
    setStepsInput(String(settings.recoveryStepsCount));
  }, [settings.recoveryStepsCount]);

  useEffect(() => {
    setCustomLossInput(String(activeLoss));
  }, [activeLoss]);

  const isRecoveryActive = activeLoss > 0;
  const progressPercent =
    initialLoss > 0
      ? Math.min(100, Math.round((totalRecovered / initialLoss) * 100))
      : 100;

  // Options for quick step chips - expanded up to 50 steps
  const stepOptions = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20, 25, 30, 40, 50];

  // Options for quick RR chips, INCLUDING values < 1 (e.g. 0.8 for 80% binary payout, 0.85 for 85%)
  const rrOptions: { label: string; value: number }[] = [
    { label: '0.8 (80%)', value: 0.8 },
    { label: '0.85 (85%)', value: 0.85 },
    { label: '1 : 1', value: 1.0 },
    { label: '1 : 1.5', value: 1.5 },
    { label: '1 : 2', value: 2.0 },
    { label: '1 : 3', value: 3.0 },
  ];

  // Handle R:R input change allowing 0 to be removed and values < 1
  const handleRRTextChange = (valStr: string) => {
    setRrInput(valStr);
    const parsed = parseFloat(valStr);
    if (!isNaN(parsed) && parsed > 0) {
      updateSettings({ riskRewardRatio: parsed });
    }
  };

  const handleRRBlur = () => {
    const parsed = parseFloat(rrInput);
    if (isNaN(parsed) || parsed <= 0) {
      setRrInput('0.85');
      updateSettings({ riskRewardRatio: 0.85 });
    } else {
      setRrInput(String(parsed));
    }
  };

  // Handle Steps input change allowing backspace to empty
  const handleStepsTextChange = (valStr: string) => {
    setStepsInput(valStr);
    const parsed = parseInt(valStr, 10);
    if (!isNaN(parsed) && parsed >= 1) {
      updateSettings({ recoveryStepsCount: parsed });
    }
  };

  const handleStepsBlur = () => {
    const parsed = parseInt(stepsInput, 10);
    if (isNaN(parsed) || parsed < 1) {
      setStepsInput('3');
      updateSettings({ recoveryStepsCount: 3 });
    } else {
      setStepsInput(String(parsed));
      updateSettings({ recoveryStepsCount: parsed });
    }
  };

  const handleSaveLoss = () => {
    const parsed = parseFloat(customLossInput);
    if (!isNaN(parsed) && parsed >= 0) {
      setActiveLossAmount(parsed);
    }
    setIsEditingLoss(false);
  };

  return (
    <div className="bg-[#0b1222] border border-slate-800 rounded-2xl p-2.5 sm:p-5 shadow-lg space-y-1.5 sm:space-y-3">
      {/* Title & Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              {language === 'hi'
                ? 'स्मार्ट रिकवरी प्लानर (Custom Steps & R:R)'
                : 'Smart Recovery Planner'}
            </h3>
            <p className="text-[11px] text-slate-400">
              {language === 'hi'
                ? '1 से कम अंक (जैसे 0.8, 0.85) भी टाइप कर सकते हैं, 0 हटाकर नया अंक डालें'
                : 'Supports values < 1 (e.g. 0.8, 0.85) and effortless backspace'}
            </p>
          </div>
        </div>

        {/* Strategy Switcher */}
        <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px] font-mono">
          <button
            type="button"
            onClick={() => updateSettings({ strategy: 'SMART_LADDER' })}
            className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
              settings.strategy === 'SMART_LADDER'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Smart Ladder
          </button>
          <button
            type="button"
            onClick={() => updateSettings({ strategy: 'FIBONACCI' })}
            className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
              settings.strategy === 'FIBONACCI'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Fibonacci
          </button>
        </div>
      </div>

      {/* 1. KITNE MARTABA LOSS HUA & MANUAL LOSS AMOUNT EDIT */}
      <div className="p-3.5 bg-[#080d19] border border-slate-800 rounded-xl space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                consecutiveLossCount > 0
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-emerald-500/20 text-emerald-400'
              }`}
            >
              {consecutiveLossCount > 0 ? (
                <TrendingDown className="w-4 h-4" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
            </div>

            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>
                  {language === 'hi'
                    ? `${consecutiveLossCount} मर्तबा लॉस हुआ`
                    : `${consecutiveLossCount} Consecutive Losses`}
                </span>
                {consecutiveLossCount > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-semibold">
                    Streak: {consecutiveLossCount}
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                {language === 'hi' ? 'कुल दर्ज लॉस:' : 'Total recorded losses:'}{' '}
                <strong className="text-slate-200">{totalLossCount}</strong>
              </div>
            </div>
          </div>

          {/* Editable Active Loss Amount */}
          <div className="text-right font-mono">
            <div className="text-[10px] text-slate-500 uppercase flex items-center justify-end gap-1">
              <span>{language === 'hi' ? 'बकाया लॉस' : 'Active Drawdown'}</span>
              <button
                type="button"
                onClick={() => {
                  setCustomLossInput(String(activeLoss));
                  setIsEditingLoss(!isEditingLoss);
                }}
                className="text-slate-400 hover:text-white"
                title="Edit loss amount manually"
              >
                <Edit3 className="w-3 h-3" />
              </button>
            </div>

            {isEditingLoss ? (
              <div className="flex items-center gap-1 mt-1 justify-end">
                <input
                  type="text"
                  inputMode="decimal"
                  value={customLossInput}
                  onChange={(e) => setCustomLossInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveLoss();
                  }}
                  className="w-20 px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-rose-300 font-bold text-xs font-mono focus:outline-none focus:border-rose-400"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveLoss}
                  className="p-1 rounded bg-emerald-500 text-slate-950 hover:bg-emerald-400 cursor-pointer"
                >
                  <Check className="w-3 h-3 stroke-[3]" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => {
                  setCustomLossInput(String(activeLoss));
                  setIsEditingLoss(true);
                }}
                className={`text-sm font-bold tabular-nums cursor-pointer hover:underline ${
                  activeLoss > 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}
                title="Click to edit loss amount manually"
              >
                {activeLoss > 0 ? currencyFormat(activeLoss) : '₹0 (Safe)'}
              </div>
            )}
          </div>
        </div>

        {/* Visual Dots for consecutive losses */}
        {consecutiveLossCount > 0 && (
          <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800/80">
            <span className="text-[10px] text-slate-400 font-mono mr-1">
              {language === 'hi' ? 'लॉस स्ट्रीक:' : 'Streak:'}
            </span>
            {Array.from({ length: Math.min(8, consecutiveLossCount) }).map((_, i) => (
              <span
                key={i}
                className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50"
              />
            ))}
          </div>
        )}
      </div>

      {/* 2. MANUAL NUMBER INPUT: TARGET R:R (1 से कम जैसे 0.8, 0.85 भी संभव, 0 हटाकर नया अंक) */}
      <div className="p-3.5 bg-[#080d19] border border-cyan-500/30 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-semibold text-slate-200">
              {language === 'hi'
                ? 'टारगेट रिस्क : रिवार्ड (R:R Ratio / पेआउट):'
                : 'Target Risk : Reward (R:R / Payout):'}
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-cyan-300">
            1 : {settings.riskRewardRatio}
          </span>
        </div>

        <p className="text-[11px] text-slate-300 leading-relaxed">
          {language === 'hi'
            ? '💡 1 से कम (जैसे 0.8 या 0.85 बाइनरी पेआउट) या 1 से ज्यादा (जैसे 1.5, 2.0) कोई भी अंक आसानी से 0 हटाकर टाइप करें:'
            : '💡 Enter any value including < 1 (e.g. 0.8, 0.85) or > 1 (e.g. 1.5, 2.0). Zero clears cleanly.'}
        </p>

        <div className="flex items-center gap-2">
          {/* Manual Numeric/Text Input for R:R allowing clearing 0 and decimals < 1 */}
          <div className="relative w-32 shrink-0">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">
              1:
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={rrInput}
              onChange={(e) => handleRRTextChange(e.target.value)}
              onBlur={handleRRBlur}
              className="w-full pl-7 pr-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold text-sm focus:outline-none focus:border-cyan-400 transition-colors"
              placeholder="0.85"
            />
          </div>

          {/* Quick preset chips including 0.8, 0.85, 1:1, 1:1.5, 1:2, 1:3 */}
          <div className="flex-1 flex items-center gap-1 font-mono text-xs overflow-x-auto py-0.5">
            {rrOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setRrInput(String(opt.value));
                  updateSettings({ riskRewardRatio: opt.value });
                }}
                className={`px-2 py-1.5 rounded-lg font-bold transition-all text-center whitespace-nowrap cursor-pointer shrink-0 text-[11px] ${
                  settings.riskRewardRatio === opt.value
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. MANUAL NUMBER INPUT: KITNE MARTABA ME RECOVERY KARNI HAI (0 हटाकर नया अंक टाइप करें) */}
      <div className="p-3.5 bg-[#080d19] border border-slate-800 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-semibold text-slate-200">
              {language === 'hi'
                ? 'कितने मर्तबा में रिकवरी करनी है? (Trades Count):'
                : 'Recover in How Many Trades? (Steps Count):'}
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400">
            {settings.recoveryStepsCount} {language === 'hi' ? 'मर्तबा' : 'Trades'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Manual Numeric/Text Input allowing clean clearing */}
          <div className="relative w-32 shrink-0">
            <input
              type="text"
              inputMode="numeric"
              value={stepsInput}
              onChange={(e) => handleStepsTextChange(e.target.value)}
              onBlur={handleStepsBlur}
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold text-sm focus:outline-none focus:border-emerald-400 transition-colors"
              placeholder="3"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono pointer-events-none">
              स्टेप्स
            </span>
          </div>

          {/* Quick preset chips */}
          <div className="flex-1 flex items-center gap-1 font-mono text-xs overflow-x-auto py-0.5">
            {stepOptions.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => {
                  setStepsInput(String(n));
                  updateSettings({ recoveryStepsCount: n });
                }}
                className={`px-2 py-1.5 rounded-lg font-bold transition-all text-center whitespace-nowrap cursor-pointer shrink-0 text-[11px] ${
                  settings.recoveryStepsCount === n
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Progress Bar (If active loss) */}
      {isRecoveryActive ? (
        <div className="p-3 bg-[#080d19] border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between text-xs font-mono mb-2">
            <span className="text-slate-400">
              {language === 'hi' ? 'रिकवरी प्रगति' : 'Recovery Progress'}:
            </span>
            <span className="text-emerald-400 font-bold">{progressPercent}% Completed</span>
          </div>

          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-2">
            <div
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.max(5, progressPercent)}%` }}
            />
          </div>

          <div className="flex justify-between text-[11px] font-mono text-slate-500">
            <span>
              {language === 'hi' ? 'प्रारंभिक लॉस' : 'Initial'}: {currencyFormat(initialLoss)}
            </span>
            <span className="text-rose-400 font-semibold">
              {language === 'hi' ? 'शेष' : 'Remaining'}: {currencyFormat(activeLoss)}
            </span>
          </div>
        </div>
      ) : (
        <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>
            {language === 'hi'
              ? 'खाता सुरक्षित स्थिति में है। कोई सक्रिय नुकसान नहीं है।'
              : 'Account healthy. Zero active loss.'}
          </span>
        </div>
      )}

      {/* Step Breakdown Cards */}
      {stepDetails.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            <span>{language === 'hi' ? 'कैलकुलेटेड स्टेप शेड्यूल' : 'Calculated Step Schedule'}</span>
            <span className="font-mono text-slate-500">
              {settings.recoveryStepsCount} {language === 'hi' ? 'मर्तबा' : 'Trades'} @ 1:{settings.riskRewardRatio}
            </span>
          </div>

          {stepDetails.map((step) => {
            const isCurrent = step.status === 'CURRENT';
            const isDone = step.status === 'COMPLETED';

            return (
              <div
                key={step.stepNumber}
                className={`p-2.5 sm:p-3 rounded-xl border flex items-center justify-between transition-all ${
                  isCurrent
                    ? 'bg-amber-950/20 border-amber-500/50 shadow-md shadow-amber-950/40'
                    : isDone
                    ? 'bg-slate-900/30 border-slate-800 opacity-60'
                    : 'bg-[#080d19] border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                      isDone
                        ? 'bg-emerald-500 text-slate-950'
                        : isCurrent
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" /> : step.stepNumber}
                  </div>

                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>
                        {language === 'hi' ? `ट्रेड ${step.stepNumber}` : `Trade ${step.stepNumber}`}
                      </span>
                      {isCurrent && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          {language === 'hi' ? 'वर्तमान' : 'CURRENT'}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Target R:R {step.targetRR}
                    </div>
                  </div>
                </div>

                <div className="text-right font-mono text-xs">
                  <div className="text-white font-bold tabular-nums">
                    {currencyFormat(step.suggestedAmount)}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-semibold tabular-nums">
                    Win: +{currencyFormat(step.targetProfit)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Strategy Forecast: NEXT 20 Trades Simulation */}
      <div className="pt-2">
        <StrategyForecastCard />
      </div>
    </div>
  );
};
