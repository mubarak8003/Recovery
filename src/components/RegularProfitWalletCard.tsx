import React, { useState, useEffect } from 'react';
import { useTrade } from '../context/TradeContext';
import { Coins, RefreshCw, Check, Edit3 } from 'lucide-react';

export const RegularProfitWalletCard: React.FC = () => {
  const {
    regularProfitWallet,
    lifetimeYieldEarned,
    activeLoss,
    offsetLossWithWallet,
    compoundWalletToCapital,
    sweepSurplusToWallet,
    tradingCapital,
    settings,
    updateSettings,
    language,
    currencyFormat,
    setRegularProfitWalletAmount,
    theme,
  } = useTrade();

  const isDark = theme !== 'light';

  const [yieldText, setYieldText] = useState<string>(String(settings.yieldRatePercent));
  const [customOffsetStr, setCustomOffsetStr] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [isEditingVault, setIsEditingVault] = useState<boolean>(false);
  const [vaultInput, setVaultInput] = useState<string>(String(regularProfitWallet));

  // Base / Starting Capital for session (defaults to settings.initialBaseCapital or tradingCapital, NOT 1000)
  const baseCap = (settings.initialBaseCapital && settings.initialBaseCapital > 0)
    ? settings.initialBaseCapital
    : tradingCapital;
  const surplusCapital = Math.max(0, Number((tradingCapital - baseCap).toFixed(2)));

  const [isEditingBaseCap, setIsEditingBaseCap] = useState<boolean>(false);
  const [baseCapInput, setBaseCapInput] = useState<string>(String(baseCap));

  useEffect(() => {
    if (!isEditingVault) {
      setVaultInput(String(regularProfitWallet));
    }
  }, [regularProfitWallet, isEditingVault]);

  useEffect(() => {
    if (!isEditingBaseCap) {
      setBaseCapInput(String(baseCap));
    }
  }, [baseCap, isEditingBaseCap]);

  const handleSaveVault = () => {
    const parsed = parseFloat(vaultInput);
    if (!isNaN(parsed) && parsed >= 0) {
      setRegularProfitWalletAmount(parsed);
      setSuccessMsg(
        language === 'hi'
          ? `वॉलेट बैलेंस अपडेट कर दिया गया: ${currencyFormat(parsed)}`
          : `Current vault balance updated: ${currencyFormat(parsed)}`
      );
      setTimeout(() => setSuccessMsg(null), 3500);
    }
    setIsEditingVault(false);
  };

  const handleSaveBaseCap = () => {
    const parsed = parseFloat(baseCapInput);
    if (!isNaN(parsed) && parsed > 0) {
      updateSettings({ initialBaseCapital: parsed });
      setSuccessMsg(
        language === 'hi'
          ? `स्टार्टिंग बेस कैपिटल सेट किया गया: ${currencyFormat(parsed)}`
          : `Starting base capital set to: ${currencyFormat(parsed)}`
      );
      setTimeout(() => setSuccessMsg(null), 3500);
    }
    setIsEditingBaseCap(false);
  };

  const handleSweepSurplus = () => {
    if (surplusCapital <= 0) return;
    const ok = sweepSurplusToWallet();
    if (ok) {
      setSuccessMsg(
        language === 'hi'
          ? `अतिरिक्त ${currencyFormat(surplusCapital)} सीधे वॉलेट में सुरक्षित कर दिया गया! ट्रेडिंग कैपिटल अब स्टार्टिंग बैलेंस ${currencyFormat(baseCap)} है।`
          : `Transferred surplus ${currencyFormat(surplusCapital)} into wallet! Trading balance restored to starting capital ${currencyFormat(baseCap)}.`
      );
      setTimeout(() => setSuccessMsg(null), 3500);
    }
  };

  const maxOffsetAvailable = Number(Math.min(regularProfitWallet, activeLoss).toFixed(2));
  const parsedOffset = parseFloat(customOffsetStr);
  const effectiveOffsetAmt = (!isNaN(parsedOffset) && parsedOffset > 0)
    ? Number(Math.min(parsedOffset, maxOffsetAvailable).toFixed(2))
    : maxOffsetAvailable;

  useEffect(() => {
    setYieldText(String(settings.yieldRatePercent));
  }, [settings.yieldRatePercent]);

  const handleYieldChange = (valStr: string) => {
    setYieldText(valStr);
    if (valStr.trim() === '') {
      updateSettings({ yieldRatePercent: 0 });
      return;
    }
    const parsed = parseFloat(valStr);
    if (!isNaN(parsed) && parsed >= 0) {
      updateSettings({ yieldRatePercent: parsed });
    }
  };

  const handleYieldBlur = () => {
    const trimmed = yieldText.trim();
    if (trimmed === '') {
      setYieldText('0');
      updateSettings({ yieldRatePercent: 0 });
      return;
    }
    const parsed = parseFloat(trimmed);
    if (isNaN(parsed) || parsed < 0) {
      setYieldText('0');
      updateSettings({ yieldRatePercent: 0 });
    } else {
      setYieldText(String(parsed));
      updateSettings({ yieldRatePercent: parsed });
    }
  };

  const handleOffset = () => {
    if (effectiveOffsetAmt <= 0) return;
    const ok = offsetLossWithWallet(effectiveOffsetAmt);
    if (ok) {
      setSuccessMsg(
        language === 'hi'
          ? `वॉलेट से ${currencyFormat(effectiveOffsetAmt)} का उपयोग करके बकाया लॉस कम कर दिया गया!`
          : `Applied ${currencyFormat(effectiveOffsetAmt)} from wallet to reduce loss!`
      );
      setCustomOffsetStr('');
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
    <div
      className={`rounded-2xl p-2.5 sm:p-4 shadow-lg relative overflow-hidden border transition-colors ${
        isDark ? 'bg-[#0b1222] border-cyan-500/30 text-white' : 'bg-white border-cyan-300 text-slate-900'
      }`}
    >
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 blur-2xl pointer-events-none" />

      <div className="relative z-10 space-y-2 sm:space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {language === 'hi' ? 'रेगुलर प्रॉफ़िट वॉलेट (सुरक्षित तिजोरी)' : 'Regular Profit Wallet'}
              </h3>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {language === 'hi'
                  ? 'हर ट्रेड पर बिना रिस्क के प्रतिशत लाभ जमा होता है'
                  : 'Guaranteed percentage added on every single trade'}
              </p>
            </div>
          </div>

          <span
            className={`text-xs font-mono font-bold px-2 py-0.5 rounded border shrink-0 ${
              isDark
                ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                : 'bg-cyan-50 text-cyan-700 border-cyan-300'
            }`}
          >
            {settings.yieldRatePercent}% / Trade
          </span>
        </div>

        {/* Big Balance */}
        <div
          className={`p-3.5 sm:p-4 rounded-xl flex items-center justify-between border transition-colors ${
            isDark ? 'bg-[#080d19] border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div>
            <div
              className={`text-[10px] uppercase tracking-wider font-mono flex items-center gap-1.5 ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              <span>{language === 'hi' ? 'सुरक्षित वॉलेट बैलेंस' : 'Current Vault Balance'}</span>
              <button
                type="button"
                onClick={() => {
                  setVaultInput(String(regularProfitWallet));
                  setIsEditingVault(!isEditingVault);
                }}
                className="text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
                title="Edit vault balance"
              >
                <Edit3 className="w-3 h-3" />
              </button>
            </div>

            {isEditingVault ? (
              <div className="flex items-center gap-1 mt-1">
                <input
                  type="text"
                  inputMode="decimal"
                  value={vaultInput}
                  onChange={(e) => setVaultInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveVault();
                  }}
                  className={`w-28 px-2 py-0.5 rounded text-base font-bold font-mono focus:outline-none border ${
                    isDark
                      ? 'bg-slate-900 border-slate-700 text-cyan-300 focus:border-cyan-400'
                      : 'bg-white border-slate-300 text-cyan-700 focus:border-cyan-500'
                  }`}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveVault}
                  className="px-2 py-1 rounded bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 cursor-pointer"
                >
                  <Check className="w-3 h-3 stroke-[3]" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => {
                  setVaultInput(String(regularProfitWallet));
                  setIsEditingVault(true);
                }}
                className={`text-2xl sm:text-3xl font-extrabold font-mono tabular-nums cursor-pointer hover:underline ${
                  isDark ? 'text-cyan-300' : 'text-cyan-600'
                }`}
                title="Click to edit balance"
              >
                {currencyFormat(regularProfitWallet)}
              </div>
            )}
          </div>

          <div className="text-right font-mono text-xs">
            <div className={`text-[10px] uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {language === 'hi' ? 'कुल अर्जित लाभ' : 'Lifetime Yield'}
            </div>
            <div className="text-emerald-500 font-bold tabular-nums">
              +{currencyFormat(lifetimeYieldEarned)}
            </div>
          </div>
        </div>

        {/* Starting Capital for Fresh Session Reference & Sync */}
        <div
          className={`p-2.5 sm:p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
            isDark ? 'bg-[#080d19] border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div>
            <div
              className={`text-[10px] uppercase font-semibold flex items-center gap-1.5 ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              <span>
                {language === 'hi' ? 'सेशन स्टार्टिंग कैपिटल (सरप्लस बेस):' : 'Starting Capital for Session:'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setBaseCapInput(String(baseCap));
                  setIsEditingBaseCap(!isEditingBaseCap);
                }}
                className="text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
                title="Edit session starting capital"
              >
                <Edit3 className="w-3 h-3" />
              </button>
            </div>

            {isEditingBaseCap ? (
              <div className="flex items-center gap-1 mt-1">
                <input
                  type="text"
                  inputMode="decimal"
                  value={baseCapInput}
                  onChange={(e) => setBaseCapInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveBaseCap();
                  }}
                  className={`w-28 px-2 py-0.5 rounded text-sm font-bold font-mono focus:outline-none border ${
                    isDark
                      ? 'bg-slate-900 border-slate-700 text-cyan-300 focus:border-cyan-400'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500'
                  }`}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveBaseCap}
                  className="px-2 py-1 rounded bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 cursor-pointer"
                >
                  <Check className="w-3 h-3 stroke-[3]" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => {
                  setBaseCapInput(String(baseCap));
                  setIsEditingBaseCap(true);
                }}
                className={`font-mono font-bold text-sm sm:text-base tabular-nums cursor-pointer hover:underline ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
                title="Click to change starting base capital"
              >
                {currencyFormat(baseCap)}
              </div>
            )}
          </div>

          <div className="text-right">
            <button
              type="button"
              onClick={() => {
                updateSettings({ initialBaseCapital: tradingCapital });
                setSuccessMsg(
                  language === 'hi'
                    ? `स्टार्टिंग बेस कैपिटल को मौजूदा बैलेंस (${currencyFormat(tradingCapital)}) पर सेट कर दिया गया!`
                    : `Base capital updated to current trading balance (${currencyFormat(tradingCapital)})!`
                );
                setTimeout(() => setSuccessMsg(null), 3500);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-cyan-300'
                  : 'bg-white hover:bg-slate-100 border-slate-300 text-cyan-700 shadow-sm'
              }`}
              title="Set base capital to current trading balance"
            >
              {language === 'hi' ? 'मौजूदा बैलेंस बनाएं' : 'Sync Current'}
            </button>
          </div>
        </div>

        {/* Sweep Surplus Capital Profit into Wallet */}
        {surplusCapital > 0 && (
          <div
            className={`p-3 rounded-xl space-y-2 border transition-colors ${
              isDark ? 'bg-cyan-950/30 border-cyan-500/40' : 'bg-cyan-50/80 border-cyan-300'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-cyan-600 dark:text-cyan-300">
              <span className="flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-cyan-500" />
                <span>
                  {language === 'hi' ? 'अतिरिक्त कैपिटल प्रॉफ़िट वॉलेट में भेजें' : 'Sweep Surplus Profit to Wallet'}
                </span>
              </span>
              <span className="font-mono text-emerald-500 font-bold">+{currencyFormat(surplusCapital)}</span>
            </div>
            <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {language === 'hi'
                ? `ट्रेडिंग बैलेंस स्टार्टिंग कैपिटल (${currencyFormat(baseCap)}) से ${currencyFormat(surplusCapital)} ज्यादा है। इसे वॉलेट में भेजकर ट्रेडिंग बैलेंस को वापस शुद्ध ${currencyFormat(baseCap)} कर सकते हैं!`
                : `Trading balance has ${currencyFormat(surplusCapital)} surplus above session starting capital ${currencyFormat(baseCap)}. Transfer it to wallet to keep trading balance locked at ${currencyFormat(baseCap)}.`}
            </p>
            <button
              type="button"
              onClick={handleSweepSurplus}
              className="w-full py-2 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20"
            >
              <Coins className="w-3.5 h-3.5" />
              <span>
                {language === 'hi'
                  ? `अतिरिक्त ${currencyFormat(surplusCapital)} वॉलेट में भेजें (ट्रेडिंग बैलेंस ${currencyFormat(baseCap)} करें)`
                  : `Transfer Surplus ${currencyFormat(surplusCapital)} to Wallet (Set Capital to ${currencyFormat(baseCap)})`}
              </span>
            </button>
          </div>
        )}

        {/* MANUAL NUMBER INPUT: WALLET PROFIT % */}
        <div
          className={`p-3 rounded-xl space-y-2 border transition-colors ${
            isDark ? 'bg-[#080d19] border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs">
            <div className={`flex items-center gap-1.5 font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              <Edit3 className="w-3.5 h-3.5 text-cyan-500" />
              <span>
                {language === 'hi'
                  ? 'प्रति-ट्रेड वॉलेट लाभ % (1 से कम जैसे 0.5% भी संभव):'
                  : 'Wallet Profit % (Supports < 1, e.g. 0.5%):'}
              </span>
            </div>
            <span className="text-[10px] text-cyan-500 font-mono font-bold">
              {settings.yieldRatePercent}%
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-24 sm:w-28 shrink-0">
              <input
                type="text"
                inputMode="decimal"
                value={yieldText}
                onChange={(e) => handleYieldChange(e.target.value)}
                onBlur={handleYieldBlur}
                onFocus={(e) => e.target.select()}
                className={`w-full px-2.5 py-1.5 rounded-lg font-mono font-bold text-sm focus:outline-none border ${
                  isDark
                    ? 'bg-slate-900 border-slate-700 text-white focus:border-cyan-400'
                    : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-500'
                }`}
                placeholder="0"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-cyan-500 font-mono font-bold text-xs pointer-events-none">
                %
              </span>
            </div>

            {/* Quick preset buttons */}
            <div className="flex-1 flex items-center gap-1 font-mono text-xs overflow-x-auto py-0.5">
              {[0, 0.5, 0.8, 1.0, 1.5, 2.0, 3.0].map((rate) => (
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
                      : isDark
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
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
          <div
            className={`p-3 rounded-xl space-y-2.5 border transition-colors ${
              isDark ? 'bg-amber-950/20 border-amber-500/30' : 'bg-amber-50/80 border-amber-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-300">
                {language === 'hi' ? 'वॉलेट प्रॉफ़िट से लॉस घटाएं' : 'Offset Loss with Wallet Profit'}
              </span>
              <span className={`text-[10px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Loss: {currencyFormat(activeLoss)}
              </span>
            </div>
            <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              {language === 'hi'
                ? 'वॉलेट में से जितनी मर्ज़ी उतनी राशि (मैन्युअल) डालकर सीधे बकाया लॉस कम कर सकते हैं।'
                : 'Enter any custom amount from your wallet balance to forgive active drawdown.'}
            </p>

            {/* Manual Amount Input Box + MAX button */}
            <div className="space-y-1.5">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs font-bold pointer-events-none">
                  {settings.currencySymbol}
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={customOffsetStr}
                  onChange={(e) => setCustomOffsetStr(e.target.value)}
                  placeholder={String(maxOffsetAvailable)}
                  className={`w-full pl-7 pr-16 py-1.5 rounded-lg font-mono font-bold text-xs focus:outline-none border ${
                    isDark
                      ? 'bg-slate-900 border-slate-700 focus:border-amber-400 text-white'
                      : 'bg-white border-slate-300 focus:border-amber-500 text-slate-900'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setCustomOffsetStr(String(maxOffsetAvailable))}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-600 dark:text-amber-300 text-[10px] font-bold font-mono transition-colors cursor-pointer"
                >
                  {language === 'hi' ? 'पूरा (MAX)' : 'MAX'}
                </button>
              </div>

              {/* Quick % Chips */}
              <div className="flex items-center gap-1 font-mono text-[10px]">
                {[25, 50, 75, 100].map((pct) => {
                  const val = Number(((maxOffsetAvailable * pct) / 100).toFixed(2));
                  return (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setCustomOffsetStr(String(val))}
                      className={`flex-1 py-1 rounded font-semibold border transition-colors text-center cursor-pointer ${
                        isDark
                          ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700/60'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                    >
                      {pct}%
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-0.5">
              <button
                type="button"
                onClick={handleOffset}
                disabled={effectiveOffsetAmt <= 0}
                className="w-full py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-xs transition-colors cursor-pointer shadow-sm shadow-amber-500/20"
              >
                {language === 'hi'
                  ? `${currencyFormat(effectiveOffsetAmt)} से लॉस घटाएं`
                  : `Apply ${currencyFormat(effectiveOffsetAmt)} to Loss`}
              </button>
            </div>
          </div>
        )}

        {/* Auto-Lock Base Capital Toggle */}
        <div
          className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-colors ${
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}
        >
          <div className="space-y-0.5">
            <span className={`font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {language === 'hi'
                ? `🔒 फिक्स्ड कैपिटल मोड (Auto-Lock ${currencyFormat(baseCap)})`
                : `🔒 Auto-Lock Capital at ${currencyFormat(baseCap)}`}
            </span>
            <span className={`text-[10px] block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {language === 'hi'
                ? `ट्रेडिंग बैलेंस हमेशा स्टार्टिंग कैपिटल (${currencyFormat(baseCap)}) रहेगा, सारा अतिरिक्त लाभ सीधा वॉलेट में जाएगा`
                : `Keep trading balance locked at starting capital (${currencyFormat(baseCap)}); auto-route surplus into vault`}
            </span>
          </div>
          <button
            type="button"
            onClick={() => updateSettings({ fixedBaseCapitalMode: !settings.fixedBaseCapitalMode })}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
              settings.fixedBaseCapitalMode ? 'bg-cyan-500 justify-end' : 'bg-slate-700 justify-start'
            }`}
          >
            <span className="bg-white w-4 h-4 rounded-full shadow-md" />
          </button>
        </div>

        {/* Compound Button */}
        {regularProfitWallet > 0 && (
          <button
            type="button"
            onClick={handleCompound}
            className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-colors cursor-pointer ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-500" />
            <span>
              {language === 'hi'
                ? 'वॉलेट प्रॉफ़िट को ट्रेडिंग कैपिटल में जोड़ें (Compound)'
                : 'Compound Vault Profit to Trading Capital'}
            </span>
          </button>
        )}

        {successMsg && (
          <div className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
};
