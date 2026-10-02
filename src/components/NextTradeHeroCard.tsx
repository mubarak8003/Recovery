import React, { useState, useEffect } from 'react';
import { useTrade } from '../context/TradeContext';
import {
  ShieldAlert,
  Sparkles,
  Coins,
  TrendingDown,
  Target,
  Edit3,
  Check,
  RotateCcw,
  Percent,
  Sliders,
  X,
  RefreshCw,
} from 'lucide-react';

export const NextTradeHeroCard: React.FC = () => {
  const {
    recommendation,
    activeLoss,
    setActiveLossAmount,
    consecutiveLossCount,
    language,
    currencyFormat,
    settings,
    updateSettings,
    tradingCapital,
    customTradeAmountOverride,
    setCustomTradeAmountOverride,
  } = useTrade();

  const isRecovery = recommendation.isRecoveryMode;

  // Local state for direct manual trade amount edit
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const [tradeAmountInput, setTradeAmountInput] = useState<string>(String(recommendation.amount));

  // Local state for direct manual loss edit in top card ("10 loss hua to 7 ya 8 pe kat dega")
  const [isEditingTopLoss, setIsEditingTopLoss] = useState(false);
  const [topLossInput, setTopLossInput] = useState<string>(String(activeLoss));

  // Local state for base capital percent edit (only used in normal mode)
  const [isEditingCapitalPercent, setIsEditingCapitalPercent] = useState(false);
  const [capitalPercentInput, setCapitalPercentInput] = useState<string>(
    String(settings.baseTradePercent)
  );

  // Sync inputs with recommendation or settings changes
  useEffect(() => {
    if (!isEditingAmount) {
      setTradeAmountInput(String(recommendation.amount));
    }
  }, [recommendation.amount, isEditingAmount]);

  useEffect(() => {
    if (!isEditingTopLoss) {
      setTopLossInput(String(activeLoss));
    }
  }, [activeLoss, isEditingTopLoss]);

  useEffect(() => {
    if (!isEditingCapitalPercent) {
      setCapitalPercentInput(String(settings.baseTradePercent));
    }
  }, [settings.baseTradePercent, isEditingCapitalPercent]);

  // Handle saving custom trade amount
  const handleSaveAmount = () => {
    const parsed = parseFloat(tradeAmountInput);
    if (!isNaN(parsed) && parsed > 0) {
      setCustomTradeAmountOverride(parsed);
    }
    setIsEditingAmount(false);
  };

  // Handle saving manually reduced/adjusted loss (e.g. 10 -> 7 or 8)
  const handleSaveTopLoss = () => {
    const parsed = parseFloat(topLossInput);
    if (!isNaN(parsed) && parsed >= 0) {
      setActiveLossAmount(parsed);
    }
    setIsEditingTopLoss(false);
  };

  // Reset to auto-calculated algorithm amount
  const handleResetToAuto = () => {
    setCustomTradeAmountOverride(null);
    setIsEditingAmount(false);
  };

  // Handle saving custom base capital percent
  const handleSaveCapitalPercent = (valStr?: string) => {
    const textToParse = valStr !== undefined ? valStr : capitalPercentInput;
    const parsed = parseFloat(textToParse);
    if (!isNaN(parsed) && parsed > 0) {
      updateSettings({ baseTradePercent: parsed });
      if (!isRecovery) {
        setCustomTradeAmountOverride(null);
      }
    }
    setIsEditingCapitalPercent(false);
  };

  // Divide factors (लॉस को कितने भागों में बांटना है - फिक्स नहीं, लगातार चलता रहेगा)
  const divideOptions = [1, 2, 3, 4, 5, 6, 8];

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-6 transition-all relative overflow-hidden ${
        isRecovery
          ? 'bg-gradient-to-br from-[#121b2f] via-[#0d1628] to-[#090f1d] border-amber-500/40 shadow-xl shadow-amber-950/20'
          : 'bg-gradient-to-br from-[#0c1a2e] via-[#0a1525] to-[#080e1a] border-emerald-500/40 shadow-xl shadow-emerald-950/20'
      }`}
    >
      {/* Background soft glow */}
      <div
        className={`absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl pointer-events-none ${
          isRecovery ? 'bg-amber-500/10' : 'bg-emerald-500/10'
        }`}
      />

      <div className="relative z-10 space-y-3">
        {/* Mode Tag & Status Banner - Continuous Rolling Divide System */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                isRecovery ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
            />
            <span className="text-[11px] sm:text-xs font-mono font-bold tracking-wider uppercase text-slate-300">
              {isRecovery
                ? language === 'hi'
                  ? `लाइव डिवाइड रिकवरी (÷${settings.recoveryStepsCount} भाग - नॉन-फिक्स रोलिंग)`
                  : `LIVE ROLLING RECOVERY (÷${settings.recoveryStepsCount} DIVIDE)`
                : language === 'hi'
                ? 'नॉर्मल ट्रेडिंग (सुरक्षित बेस साइज़)'
                : 'Normal Trade (Safe Base Size)'}
            </span>

            {customTradeAmountOverride !== null && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold">
                {language === 'hi' ? 'कस्टम सेट' : 'Custom Manual'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Consecutive Losses Badge */}
            {isRecovery && consecutiveLossCount > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-0.5 sm:py-1 rounded-full bg-rose-500/20 border border-rose-500/35 text-rose-300 text-[11px] font-mono font-bold">
                <TrendingDown className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>
                  {language === 'hi'
                    ? `${consecutiveLossCount} मर्तबा लॉस`
                    : `${consecutiveLossCount} Losses`}
                </span>
              </div>
            )}

            {/* Unrecovered Loss Badge with DIRECT INLINE EDIT ("10 loss hua to 7-8 pe kat dega") */}
            {isRecovery && (
              isEditingTopLoss ? (
                <div className="flex items-center gap-1 bg-[#080d19] border border-amber-500 px-2 py-0.5 rounded-full">
                  <span className="text-[10px] text-amber-400 font-mono font-bold">
                    {settings.currencySymbol}
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={topLossInput}
                    onChange={(e) => setTopLossInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveTopLoss();
                    }}
                    className="w-16 bg-transparent text-amber-300 font-mono font-bold text-xs focus:outline-none"
                    placeholder="7"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleSaveTopLoss}
                    className="text-emerald-400 hover:text-emerald-300 p-0.5 cursor-pointer"
                    title="Save adjusted loss"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingTopLoss(false)}
                    className="text-slate-400 hover:text-slate-300 p-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => {
                    setTopLossInput(String(activeLoss));
                    setIsEditingTopLoss(true);
                  }}
                  className="flex items-center gap-1 px-2.5 py-0.5 sm:py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-mono font-bold cursor-pointer hover:border-amber-400 hover:bg-amber-500/25 transition-all"
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

        {/* DYNAMIC DIVIDE CONTROLLER: "Fixed nahi hona chahiye, age loss ya win add hota rahe" */}
        {isRecovery && (
          <div className="p-2.5 sm:p-3 bg-[#080d19]/90 border border-amber-500/30 rounded-xl space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-semibold text-slate-200">
                  {language === 'hi'
                    ? 'लॉस को कितने भागों में बांटना है? (Divide Factor):'
                    : 'Divide Loss by How Many Parts?'}
                </span>
                <span className="text-[10px] text-amber-400 font-mono font-bold">
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
                    <span>⚡ {language === 'hi' ? `${consecutiveLossCount} लॉस के अनुसार ÷${consecutiveLossCount} करें` : `Match ÷${consecutiveLossCount}`}</span>
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

            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
              <RefreshCw className="w-3 h-3 text-cyan-400 shrink-0" />
              <span>
                {language === 'hi'
                  ? 'यह कोई फिक्स स्टेप नहीं है — आगे होने वाला नया लॉस या विन अपने आप इसमें जुड़ता/घटता रहेगा और डिवाइड होता रहेगा।'
                  : 'Open-ended rolling pool: Future losses and wins continuously add and subtract into this live divide.'}
              </span>
            </div>
          </div>
        )}

        {/* The Big Trade Amount: LIVE DIVIDE SYSTEM */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 sm:gap-4 border-b border-slate-800/80 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
                {isRecovery
                  ? language === 'hi'
                    ? 'अगली ट्रेड साइज़ (DIVIDED TRADE AMOUNT)'
                    : 'DIVIDED TRADE AMOUNT'
                  : language === 'hi'
                  ? 'अगली ट्रेड राशि (NORMAL TRADE AMOUNT)'
                  : 'NORMAL TRADE AMOUNT'}
              </span>

              {/* Edit trade amount pencil */}
              <button
                type="button"
                onClick={() => {
                  setTradeAmountInput(String(recommendation.amount));
                  setIsEditingAmount(!isEditingAmount);
                }}
                className="text-slate-400 hover:text-emerald-400 transition-colors p-0.5 rounded cursor-pointer"
                title="Manually edit trade amount (अंक से सीधे बदलें)"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>

              {customTradeAmountOverride !== null && (
                <button
                  type="button"
                  onClick={handleResetToAuto}
                  className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 font-mono underline cursor-pointer"
                  title="Reset to algorithm calculation"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>{language === 'hi' ? 'ऑटो रीसेट' : 'Auto Reset'}</span>
                </button>
              )}
            </div>

            {/* Editable Amount Display */}
            {isEditingAmount ? (
              <div className="flex items-center gap-2 pt-1">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xl font-bold">
                    {settings.currencySymbol}
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={tradeAmountInput}
                    onChange={(e) => setTradeAmountInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveAmount();
                    }}
                    className="w-40 sm:w-52 pl-8 pr-3 py-1.5 bg-[#080d19] border border-emerald-500 rounded-xl text-white font-mono font-extrabold text-2xl sm:text-3xl focus:outline-none"
                    placeholder="100"
                    autoFocus
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSaveAmount}
                  className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1 cursor-pointer shadow-md shadow-emerald-500/20"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>{language === 'hi' ? 'सेव' : 'Set'}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setTradeAmountInput(String(recommendation.amount));
                    setIsEditingAmount(true);
                  }}
                  className="text-3xl sm:text-5xl font-extrabold font-mono text-white tracking-tight tabular-nums hover:text-amber-400 transition-colors cursor-pointer text-left"
                  title="Click to edit trade amount manually (अंक से बदलें)"
                >
                  {currencyFormat(recommendation.amount)}
                </button>

                {/* Subtitle Badge: SHOW EXACT ROLLING DIVIDE FORMULA */}
                {isRecovery ? (
                  <span className="text-xs sm:text-sm font-mono text-amber-300 font-semibold bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                    {currencyFormat(activeLoss)} ÷ {settings.recoveryStepsCount}
                  </span>
                ) : (
                  <div className="flex items-center gap-1 text-xs font-mono text-slate-400">
                    <span>(</span>
                    <button
                      type="button"
                      onClick={() => {
                        setCapitalPercentInput(String(settings.baseTradePercent));
                        setIsEditingCapitalPercent(!isEditingCapitalPercent);
                      }}
                      className="hover:text-emerald-400 underline decoration-dotted font-semibold text-slate-300 cursor-pointer"
                      title="Click to change % of capital (कैपिटल % बदलें)"
                    >
                      {recommendation.riskPercentOfCapital}% capital
                    </button>
                    <span>)</span>
                  </div>
                )}
              </div>
            )}

            {/* Quick Capital % Selector if editing % (in Normal mode) */}
            {!isRecovery && isEditingCapitalPercent && (
              <div className="p-2.5 bg-[#080d19] border border-slate-700 rounded-xl mt-2 space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-semibold flex items-center gap-1">
                    <Percent className="w-3 h-3 text-emerald-400" />
                    <span>
                      {language === 'hi'
                        ? 'कैपिटल का कितना % ट्रेड करना है?'
                        : 'Base Risk % of Capital:'}
                    </span>
                  </span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {settings.baseTradePercent}%
                  </span>
                </div>

                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <div className="relative w-24">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={capitalPercentInput}
                      onChange={(e) => setCapitalPercentInput(e.target.value)}
                      onBlur={() => handleSaveCapitalPercent()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveCapitalPercent();
                      }}
                      className="w-full px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold text-xs focus:outline-none focus:border-emerald-400"
                      placeholder="2.0"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">
                      %
                    </span>
                  </div>

                  {[0.5, 1.0, 1.5, 2.0, 3.0, 5.0].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handleSaveCapitalPercent(String(pct))}
                      className={`px-2 py-1 rounded-lg font-bold text-center cursor-pointer transition-colors text-[11px] ${
                        settings.baseTradePercent === pct
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Trade Specs & RR */}
          <div className="flex items-center gap-4 sm:gap-5 text-xs font-mono shrink-0">
            <div>
              <div className="text-[9px] sm:text-[10px] text-slate-400 uppercase">
                {language === 'hi' ? 'टारगेट लाभ (Win)' : 'Target Profit'}
              </div>
              <div className="text-sm sm:text-base font-bold text-emerald-400 tabular-nums">
                +{currencyFormat(recommendation.targetProfit)}
              </div>
            </div>

            <div className="h-7 w-px bg-slate-800" />

            <div>
              <div className="text-[9px] sm:text-[10px] text-cyan-400 uppercase flex items-center gap-1">
                <Coins className="w-3 h-3 shrink-0" />
                <span>{language === 'hi' ? 'वॉलेट लाभ' : 'Wallet Profit'}</span>
              </div>
              <div className="text-sm sm:text-base font-bold text-cyan-300 tabular-nums">
                +{currencyFormat(recommendation.walletYieldWillAdd)}
              </div>
            </div>

            <div className="h-7 w-px bg-slate-800" />

            <div>
              <div className="text-[9px] sm:text-[10px] text-slate-400 uppercase flex items-center gap-1">
                <Target className="w-3 h-3 shrink-0 text-cyan-400" />
                <span>R:R</span>
              </div>
              <div className="text-sm sm:text-base font-bold text-white tabular-nums">
                1:{settings.riskRewardRatio}
              </div>
            </div>
          </div>
        </div>

        {/* Clear Mathematical Divide Insight Banner */}
        <div className="flex items-start gap-2.5 bg-[#070d18]/70 border border-slate-800 p-3 rounded-xl text-xs leading-relaxed text-slate-300">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold text-white">
              {language === 'hi' ? 'रोलिंग डिवाइड सिस्टम: ' : 'Rolling Divide System: '}
            </span>
            {isRecovery ? (
              <span>
                {language === 'hi'
                  ? `वर्तमान बकाया लॉस ${currencyFormat(activeLoss)} को ÷${settings.recoveryStepsCount} में बांटा गया है = ${currencyFormat(recommendation.amount)} प्रति ट्रेड। आगे जो भी नया लॉस या विन होगा, वो सीधे इस पूल में जुड़ता/घटता रहेगा और डिवाइड होता रहेगा।`
                  : `Active unrecovered loss ${currencyFormat(activeLoss)} is divided by ${settings.recoveryStepsCount} = ${currencyFormat(recommendation.amount)} per trade. All forward wins or losses continuously add/subtract into this rolling pool.`}
              </span>
            ) : (
              <span>{language === 'hi' ? recommendation.reasonHindi : recommendation.reason}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
