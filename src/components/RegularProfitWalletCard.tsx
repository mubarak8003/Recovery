import React, { useState, useEffect } from 'react';
import { useTrade } from '../context/TradeContext';
import { Coins, ShieldCheck, ArrowRight, Sparkles, TrendingUp, RefreshCw, Check, Edit3 } from 'lucide-react';

export const RegularProfitWalletCard: React.FC = () => {
  const {
    regularProfitWallet,
    lifetimeYieldEarned,
    activeLoss,
    offsetLossWithWallet,
    compoundWalletToCapital,
    settings,
    updateSettings,
    language,
    currencyFormat,
  } = useTrade();

  const [yieldText, setYieldText] = useState<string>(String(settings.yieldRatePercent));
  const [offsetInput, setOffsetInput] = useState<number>(Math.min(regularProfitWallet, activeLoss));
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setYieldText(String(settings.yieldRatePercent));
  }, [settings.yieldRatePercent]);

  const handleYieldChange = (valStr: string) => {
    setYieldText(valStr);
    const parsed = parseFloat(valStr);
    if (!isNaN(parsed) && parsed >= 0) {
      updateSettings({ yieldRatePercent: parsed });
    }
  };

  const handleYieldBlur = () => {
    const parsed = parseFloat(yieldText);
    if (isNaN(parsed) || parsed < 0) {
      setYieldText('1.0');
      updateSettings({ yieldRatePercent: 1.0 });
    } else {
      setYieldText(String(parsed));
    }
  };

  const handleOffset = () => {
    if (offsetInput <= 0) return;
    const ok = offsetLossWithWallet(offsetInput);
    if (ok) {
      setSuccessMsg(
        language === 'hi'
          ? `वॉलेट से ${currencyFormat(offsetInput)} का उपयोग करके बकाया लॉस कम कर दिया गया!`
          : `Applied ${currencyFormat(offsetInput)} from wallet to reduce loss!`
      );
      setTimeout(() => setSuccessMsg(null), 3500);
    }
  };

  const handleCompound = () => {
    if (regularProfitWallet <= 0) return;
    const ok = compoundWalletToCapital(regularProfitWallet);
    if (ok) {
      setSuccessMsg(
        language === 'hi'
          ? `वॉलेट का पूरा लाभ ट्रेडिंग कैपिटल में जुड़ गया!`
          : `Compounded entire wallet balance into trading capital!`
      );
      setTimeout(() => setSuccessMsg(null), 3500);
    }
  };

  return (
    <div className="bg-[#0b1222] border border-cyan-500/30 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 blur-2xl pointer-events-none" />

      <div className="relative z-10 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {language === 'hi' ? 'रेगुलर प्रॉफ़िट वॉलेट (सुरक्षित तिजोरी)' : 'Regular Profit Wallet'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {language === 'hi'
                  ? 'हर ट्रेड पर बिना रिस्क के प्रतिशत लाभ जमा होता है'
                  : 'Guaranteed percentage added on every single trade'}
              </p>
            </div>
          </div>

          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 shrink-0">
            {settings.yieldRatePercent}% / Trade
          </span>
        </div>

        {/* Big Balance */}
        <div className="p-3.5 sm:p-4 bg-[#080d19] border border-slate-800 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
              {language === 'hi' ? 'सुरक्षित वॉलेट बैलेंस' : 'Current Vault Balance'}
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-cyan-300 tabular-nums">
              {currencyFormat(regularProfitWallet)}
            </div>
          </div>

          <div className="text-right font-mono text-xs">
            <div className="text-[10px] text-slate-500 uppercase">
              {language === 'hi' ? 'कुल अर्जित लाभ' : 'Lifetime Yield'}
            </div>
            <div className="text-emerald-400 font-bold tabular-nums">
              +{currencyFormat(lifetimeYieldEarned)}
            </div>
          </div>
        </div>

        {/* MANUAL NUMBER INPUT: WALLET PROFIT % (0 हटाकर नया अंक टाइप कर सकते हैं, 1 से कम भी मान्य) */}
        <div className="p-3 bg-[#080d19] border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
              <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                {language === 'hi'
                  ? 'प्रति-ट्रेड वॉलेट लाभ % (1 से कम जैसे 0.5% भी संभव):'
                  : 'Wallet Profit % (Supports < 1, e.g. 0.5%):'}
              </span>
            </div>
            <span className="text-[10px] text-cyan-300 font-mono font-bold">
              {settings.yieldRatePercent}%
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-28 shrink-0">
              <input
                type="text"
                inputMode="decimal"
                value={yieldText}
                onChange={(e) => handleYieldChange(e.target.value)}
                onBlur={handleYieldBlur}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono font-bold text-sm focus:outline-none focus:border-cyan-400"
                placeholder="1.0"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-cyan-400 font-mono font-bold text-xs pointer-events-none">
                %
              </span>
            </div>

            {/* Quick preset buttons */}
            <div className="flex-1 flex items-center gap-1 font-mono text-xs overflow-x-auto py-0.5">
              {[0.5, 0.8, 1.0, 1.5, 2.0, 3.0].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => {
                    setYieldText(String(rate));
                    updateSettings({ yieldRatePercent: rate });
                  }}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition-all text-center whitespace-nowrap cursor-pointer text-[11px] ${
                    settings.yieldRatePercent === rate
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {rate}%
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Synergistic Action: Settle Loss from Wallet if active loss exists */}
        {activeLoss > 0 && regularProfitWallet > 0 && (
          <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300">
                {language === 'hi' ? 'वॉलेट प्रॉफ़िट से लॉस घटाएं' : 'Offset Loss with Wallet Profit'}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Loss: {currencyFormat(activeLoss)}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {language === 'hi'
                ? 'क्योंकि हर ट्रेड से वॉलेट में लाभ जुड़ा है, आप इस पैसे से सीधे लॉस घटा सकते हैं ताकि अगली ट्रेड छोटी और सुरक्षित हो जाए।'
                : 'Use your regular profit buffer to forgive active drawdown, immediately reducing the required next trade size.'}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOffset}
                className="w-full py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
              >
                {language === 'hi'
                  ? `${currencyFormat(Math.min(regularProfitWallet, activeLoss))} से लॉस घटाएं`
                  : `Apply ${currencyFormat(Math.min(regularProfitWallet, activeLoss))} to Loss`}
              </button>
            </div>
          </div>
        )}

        {/* Compound Button */}
        {regularProfitWallet > 0 && (
          <button
            type="button"
            onClick={handleCompound}
            className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {language === 'hi'
                ? 'वॉलेट प्रॉफ़िट को ट्रेडिंग कैपिटल में जोड़ें (Compound)'
                : 'Compound Vault Profit to Trading Capital'}
            </span>
          </button>
        )}

        {successMsg && (
          <div className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
};
