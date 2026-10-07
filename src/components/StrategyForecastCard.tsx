import React, { useState, useMemo } from 'react';
import { useTrade } from '../context/TradeContext';
import {
  TrendingDown,
  TrendingUp,
  Activity,
  ShieldAlert,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Sparkles,
  Info,
} from 'lucide-react';

type ForecastScenario = 'ALL_LOSS' | 'ALL_WIN' | 'ALTERNATING';

interface SimulatedStep {
  step: number;
  tradeAmount: number;
  factor: number;
  lossToRecover: number;
  pnl: number;
  capitalAfter: number;
  activeLossAfter: number;
  walletYieldEarned: number;
}

export const StrategyForecastCard: React.FC = () => {
  const {
    tradingCapital,
    activeLoss,
    settings,
    language,
    currencyFormat,
    theme,
  } = useTrade();

  const isDark = theme === 'dark';
  const [tradeCount, setTradeCount] = useState<number>(20);
  const [customCountInput, setCustomCountInput] = useState<string>('20');
  const [scenario, setScenario] = useState<ForecastScenario>('ALL_LOSS');
  const [showFullTable, setShowFullTable] = useState<boolean>(false);

  const effectiveRR = Math.max(0.1, Number(settings.riskRewardRatio) || 0.85);
  const rawYield = settings.yieldRatePercent;
  const safeYieldRate =
    typeof rawYield === 'number' && !isNaN(rawYield) && rawYield >= 0
      ? rawYield / 100
      : 0.15;
  const baseTradePct = (Number(settings.baseTradePercent) || 2) / 100;
  const startFactor = Math.max(1, Number(settings.recoveryStepsCount) || 1);

  // Run dynamic simulation for next N trades
  const simulation = useMemo(() => {
    let currentCap = Math.max(1, tradingCapital);
    let currentLoss = Math.max(0, activeLoss);
    let currentFactor = startFactor;
    let totalWalletYield = 0;
    let totalLossAccumulated = 0;
    let totalProfitEarned = 0;

    const steps: SimulatedStep[] = [];

    for (let i = 1; i <= tradeCount; i++) {
      // 1. Calculate trade size
      let tradeAmount = 0;
      if (currentLoss > 0) {
        const portionLoss = currentLoss / currentFactor;
        const netRate = Math.max(0.1, effectiveRR - safeYieldRate);
        tradeAmount = Number((portionLoss / netRate).toFixed(2));
      } else {
        tradeAmount = Math.max(
          10,
          Number((currentCap * baseTradePct).toFixed(2))
        );
      }

      // Ensure trade amount is not below 1
      tradeAmount = Math.max(1, tradeAmount);

      // Determine outcome based on scenario
      let isWin = false;
      if (scenario === 'ALL_WIN') {
        isWin = true;
      } else if (scenario === 'ALL_LOSS') {
        isWin = false;
      } else {
        // Alternating: Loss first, then Win
        isWin = i % 2 === 0;
      }

      const yieldEarned = Number((tradeAmount * safeYieldRate).toFixed(2));
      totalWalletYield += yieldEarned;

      let pnl = 0;
      if (isWin) {
        const grossPayout = Number((tradeAmount * effectiveRR).toFixed(2));
        const netCapProfit = Math.max(0, Number((grossPayout - yieldEarned).toFixed(2)));
        pnl = netCapProfit;
        currentCap = Number((currentCap + netCapProfit).toFixed(2));
        totalProfitEarned += netCapProfit;

        // Loss recovered
        if (currentLoss > 0) {
          currentLoss = Math.max(0, Number((currentLoss - netCapProfit).toFixed(2)));
          if (currentLoss === 0) {
            currentFactor = 1; // Reset factor on full recovery
          }
        }
      } else {
        // LOSS (Identical to live TradeContext execution):
        pnl = -tradeAmount;
        currentCap = Number((currentCap - tradeAmount).toFixed(2));
        const deficitToAdd = Number((tradeAmount + yieldEarned).toFixed(2));
        const lossBeforeThis = currentLoss;
        currentLoss = Number((currentLoss + deficitToAdd).toFixed(2));
        totalLossAccumulated = Number((totalLossAccumulated + tradeAmount).toFixed(2));

        // Advance factor: if starting from clean account, first recovery stays at factor 1:
        if (lossBeforeThis > 0) {
          currentFactor = Math.min(100, currentFactor + 1);
        } else {
          currentFactor = 1;
        }
      }

      steps.push({
        step: i,
        tradeAmount,
        factor: currentFactor,
        lossToRecover: currentLoss,
        pnl,
        capitalAfter: currentCap,
        activeLossAfter: currentLoss,
        walletYieldEarned: yieldEarned,
      });
    }

    const netChange = Number((currentCap - tradingCapital).toFixed(2));
    const drawdownPct =
      tradingCapital > 0
        ? Math.min(100, Number(((totalLossAccumulated / tradingCapital) * 100).toFixed(1)))
        : 100;

    return {
      steps,
      finalCapital: currentCap,
      netChange,
      totalLossAccumulated,
      totalProfitEarned,
      totalWalletYield,
      drawdownPct,
    };
  }, [
    tradingCapital,
    activeLoss,
    effectiveRR,
    safeYieldRate,
    baseTradePct,
    startFactor,
    tradeCount,
    scenario,
  ]);

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 transition-all space-y-4 ${
        isDark
          ? 'bg-[#0a1120] border-slate-800 text-white shadow-lg'
          : 'bg-white border-slate-200 text-slate-900 shadow-sm'
      }`}
    >
      {/* 1. Header with Title & Scenario Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <h3 className="text-sm sm:text-base font-extrabold tracking-wide uppercase font-mono">
              {language === 'hi'
                ? `रणनीति पूर्वानुमान (STRATEGY FORECAST: NEXT ${tradeCount})`
                : `STRATEGY FORECAST: NEXT ${tradeCount} TRADES`}
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {language === 'hi'
              ? 'अगली ट्रेड्स का लाइव सिमुलेशन: जानें लगातार लॉस होने पर कितना पैसा लॉस होगा'
              : 'Live stress test: What happens if the next trades are all losses vs wins'}
          </p>
        </div>

        {/* Trade count selector: Quick Presets + Manual Number Input */}
        <div className="flex items-center gap-1.5 font-mono text-xs flex-wrap">
          <div className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-lg border border-slate-800">
            {[5, 10, 20].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => {
                  setTradeCount(n);
                  setCustomCountInput(String(n));
                }}
                className={`px-2 py-0.5 rounded font-bold transition-all cursor-pointer text-xs ${
                  tradeCount === n
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                NEXT {n}
              </button>
            ))}
          </div>

          {/* Manual numeric input box */}
          <div className="flex items-center gap-1 bg-slate-900/60 px-2 py-1 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase">
              {language === 'hi' ? 'मैन्युअल:' : 'Manual:'}
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={customCountInput}
              onChange={(e) => {
                setCustomCountInput(e.target.value);
                const p = parseInt(e.target.value, 10);
                if (!isNaN(p) && p >= 1) {
                  setTradeCount(Math.min(100, Math.max(1, p)));
                }
              }}
              onBlur={() => {
                const p = parseInt(customCountInput, 10);
                if (isNaN(p) || p < 1) {
                  setCustomCountInput(String(tradeCount));
                } else {
                  const clamped = Math.min(100, Math.max(1, p));
                  setTradeCount(clamped);
                  setCustomCountInput(String(clamped));
                }
              }}
              onFocus={(e) => e.target.select()}
              className="w-12 px-1 py-0.5 bg-slate-800 border border-slate-700 focus:border-cyan-400 rounded text-cyan-300 font-mono font-black text-xs text-center focus:outline-none"
              placeholder="20"
            />
            <span className="text-[10px] text-slate-400">
              {language === 'hi' ? 'ट्रेड्स' : 'Trades'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Scenario Switcher (All Losses / All Wins / 50% Win Rate) */}
      <div className="grid grid-cols-3 gap-1.5 font-mono text-xs">
        {/* Scenario 1: All Losses (Worst Case) */}
        <button
          type="button"
          onClick={() => setScenario('ALL_LOSS')}
          className={`py-2 px-1.5 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer text-center ${
            scenario === 'ALL_LOSS'
              ? 'bg-rose-500/15 border-rose-500/50 text-rose-300 font-bold shadow-sm shadow-rose-950/30'
              : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-[11px] font-extrabold uppercase">
              {language === 'hi' ? 'लगातार लॉस' : 'All Losses'}
            </span>
          </div>
          <span className="text-[9px] text-slate-400 font-sans">
            {language === 'hi' ? '(वर्स्ट केस स्ट्रेस टेस्ट)' : '(Worst Case Stress Test)'}
          </span>
        </button>

        {/* Scenario 2: All Wins (Best Case) */}
        <button
          type="button"
          onClick={() => setScenario('ALL_WIN')}
          className={`py-2 px-1.5 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer text-center ${
            scenario === 'ALL_WIN'
              ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 font-bold shadow-sm shadow-emerald-950/30'
              : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] font-extrabold uppercase">
              {language === 'hi' ? 'लगातार विन' : 'All Wins'}
            </span>
          </div>
          <span className="text-[9px] text-slate-400 font-sans">
            {language === 'hi' ? '(बेस्ट केस ग्रोथ)' : '(Best Case Growth)'}
          </span>
        </button>

        {/* Scenario 3: 50% Win Rate */}
        <button
          type="button"
          onClick={() => setScenario('ALTERNATING')}
          className={`py-2 px-1.5 rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer text-center ${
            scenario === 'ALTERNATING'
              ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 font-bold shadow-sm shadow-amber-950/30'
              : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] font-extrabold uppercase">
              {language === 'hi' ? '50% विन रेट' : '50% Win Rate'}
            </span>
          </div>
          <span className="text-[9px] text-slate-400 font-sans">
            {language === 'hi' ? '(सामान्य मार्केट)' : '(Normal Market)'}
          </span>
        </button>
      </div>

      {/* 3. High-Impact Result Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
        {/* Card 1: Total Loss Amount / Profit Amount */}
        <div
          className={`p-2.5 rounded-xl border ${
            scenario === 'ALL_LOSS'
              ? 'bg-rose-950/20 border-rose-500/30 text-rose-300'
              : scenario === 'ALL_WIN'
              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
              : 'bg-amber-950/20 border-amber-500/30 text-amber-300'
          }`}
        >
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">
            {scenario === 'ALL_LOSS'
              ? language === 'hi'
                ? 'कुल कितना पैसा लॉस होगा'
                : 'Total Money Lost'
              : scenario === 'ALL_WIN'
              ? language === 'hi'
                ? 'कुल शुद्ध लाभ (Profit)'
                : 'Total Net Profit'
              : language === 'hi'
              ? 'नेट लाभ/हानि'
              : 'Net P&L'}
          </span>
          <div className="text-base sm:text-lg font-black tabular-nums mt-0.5">
            {scenario === 'ALL_LOSS' ? (
              <span className="text-rose-400">-{currencyFormat(simulation.totalLossAccumulated)}</span>
            ) : simulation.netChange >= 0 ? (
              <span className="text-emerald-400">+{currencyFormat(simulation.netChange)}</span>
            ) : (
              <span className="text-rose-400">-{currencyFormat(Math.abs(simulation.netChange))}</span>
            )}
          </div>
        </div>

        {/* Card 2: Ending Balance */}
        <div className="p-2.5 rounded-xl border bg-slate-900/40 border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">
            {language === 'hi' ? 'बचा हुआ कैपिटल' : 'Final Capital'}
          </span>
          <div
            className={`text-base sm:text-lg font-black tabular-nums mt-0.5 ${
              simulation.finalCapital < 0 ? 'text-rose-400' : 'text-cyan-300'
            }`}
          >
            {currencyFormat(simulation.finalCapital)}
          </div>
        </div>

        {/* Card 3: Max Drawdown % */}
        <div className="p-2.5 rounded-xl border bg-slate-900/40 border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">
            {language === 'hi' ? 'ड्रॉडडाउन प्रभाव' : 'Drawdown Impact'}
          </span>
          <div className="text-base sm:text-lg font-black tabular-nums mt-0.5 text-amber-300">
            {simulation.drawdownPct}%
          </div>
        </div>

        {/* Card 4: Wallet Yield Earned */}
        <div className="p-2.5 rounded-xl border bg-slate-900/40 border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">
            {language === 'hi' ? 'वॉलेट में जमा लाभ' : 'Vault Yield Earned'}
          </span>
          <div className="text-base sm:text-lg font-black tabular-nums mt-0.5 text-emerald-400">
            +{currencyFormat(simulation.totalWalletYield)}
          </div>
        </div>
      </div>

      {/* 4. Strategic Insight Banner (Comparing with Dangerous Martingale) */}
      <div
        className={`p-3 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5 ${
          scenario === 'ALL_LOSS'
            ? 'bg-rose-950/20 border-rose-500/30 text-rose-200'
            : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
        }`}
      >
        <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-cyan-400" />
        <div className="space-y-1">
          <p className="font-bold text-white">
            {scenario === 'ALL_LOSS'
              ? language === 'hi'
                ? `💡 डिवाइड सिस्टम की सुरक्षा (Divide System Protection):`
                : `💡 Divide System vs Martingale Protection:`
              : language === 'hi'
              ? `💡 नियंत्रित रिकवरी प्रभाव (Controlled Recovery):`
              : `💡 Steady Compound Effect:`}
          </p>
          <p className="text-[11px] text-slate-300 leading-normal">
            {scenario === 'ALL_LOSS'
              ? language === 'hi'
                ? `यदि आप सामान्य मार्टिंगेल (दोगुना) करते, तो केवल 5वीं ट्रेड में ही पूरा खाता (₹0) साफ हो जाता। लेकिन TradeSizer के रोलिंग डिवाइड (÷ भाग) के कारण हर लॉस पर रिस्क छोटे हिस्सों में बंटता रहता है, जिससे अगली ${tradeCount} ट्रेड्स लगातार लॉस होने पर भी कुल लॉस ${currencyFormat(simulation.totalLossAccumulated)} तक ही सीमित रहता है!`
                : `In traditional Martingale (2x doubling), an account blows up in just 5 trades. With TradeSizer's Rolling Divide system, risk is fractionally divided across steps, ensuring survival even through an extreme streak of ${tradeCount} losses.`
              : language === 'hi'
              ? `प्रत्येक जीत पर ब्रोकर पेआउट के साथ सुरक्षित वॉलेट में भी मुनाफा लॉक होता रहता है।`
              : `Each winning trade compounds the trading capital while locking steady yield in your safe vault.`}
          </p>
        </div>
      </div>

      {/* 5. Trade-by-Trade Forecast Table (Expandable) */}
      <div className="space-y-1.5 pt-1">
        <button
          type="button"
          onClick={() => setShowFullTable(!showFullTable)}
          className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-900/50 hover:bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 transition-colors cursor-pointer"
        >
          <span className="font-bold">
            {language === 'hi'
              ? `अगली ${tradeCount} ट्रेड्स का ट्रेड-दर-ट्रेड चार्ट (${showFullTable ? 'छुपाएं' : 'देखें'})`
              : `Trade-by-trade breakdown (${showFullTable ? 'Hide' : 'Show'})`}
          </span>
          {showFullTable ? (
            <ChevronUp className="w-4 h-4 text-cyan-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-cyan-400" />
          )}
        </button>

        {showFullTable && (
          <div className="overflow-x-auto rounded-xl border border-slate-800 mt-2">
            <table className="w-full text-left font-mono text-[11px]">
              <thead className="bg-[#070d18] text-slate-400 uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-2 px-2.5">#</th>
                  <th className="py-2 px-2.5">
                    {language === 'hi' ? 'ट्रेड साइज़' : 'Trade Size'}
                  </th>
                  <th className="py-2 px-2.5">
                    {language === 'hi' ? 'डिवाइड भाग' : 'Divide'}
                  </th>
                  <th className="py-2 px-2.5">
                    {language === 'hi' ? 'परिणाम' : 'P&L'}
                  </th>
                  <th className="py-2 px-2.5 text-right">
                    {language === 'hi' ? 'बचा हुआ बैलेंस' : 'Balance After'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-[#090f1d]">
                {simulation.steps.map((step) => (
                  <tr key={step.step} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-1.5 px-2.5 text-slate-400 font-bold">#{step.step}</td>
                    <td className="py-1.5 px-2.5 text-white font-bold">
                      {currencyFormat(step.tradeAmount)}
                    </td>
                    <td className="py-1.5 px-2.5 text-amber-400 font-semibold">
                      ÷{step.factor}
                    </td>
                    <td
                      className={`py-1.5 px-2.5 font-bold ${
                        step.pnl > 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {step.pnl > 0 ? `+${currencyFormat(step.pnl)}` : currencyFormat(step.pnl)}
                    </td>
                    <td
                      className={`py-1.5 px-2.5 text-right font-black ${
                        step.capitalAfter < 0 ? 'text-rose-400' : 'text-cyan-300'
                      }`}
                    >
                      {currencyFormat(step.capitalAfter)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
