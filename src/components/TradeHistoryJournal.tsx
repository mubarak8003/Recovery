import React, { useState } from 'react';
import { useTrade } from '../context/TradeContext';
import { ArrowUpRight, ArrowDownRight, Coins, ScrollText } from 'lucide-react';

export const TradeHistoryJournal: React.FC = () => {
  const { tradeHistory, language, currencyFormat, theme } = useTrade();
  const [filter, setFilter] = useState<'ALL' | 'WIN' | 'LOSS'>('ALL');

  const isDark = theme === 'dark';

  const filtered = tradeHistory.filter((t) => {
    if (filter === 'WIN') return t.result === 'WIN';
    if (filter === 'LOSS') return t.result === 'LOSS';
    return true;
  });

  const totalYieldInLedger = tradeHistory.reduce((acc, curr) => acc + curr.walletYieldAdded, 0);

  return (
    <div
      className={`rounded-2xl overflow-hidden flex flex-col border transition-colors ${
        isDark
          ? 'bg-[#0b1222] border-slate-800 shadow-lg text-slate-100'
          : 'bg-white border-slate-200 shadow-sm text-slate-900'
      }`}
    >
      {/* Header */}
      <div
        className={`p-4 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 ${
          isDark ? 'bg-[#0b1222] border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div>
          <div className="flex items-center gap-1.5">
            <ScrollText className="w-4 h-4 text-cyan-400" />
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {language === 'hi' ? 'ट्रेड जर्नल एवं लेजर' : 'Trade Journal & Yield Ledger'}
            </h3>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                isDark
                  ? 'bg-slate-800 text-slate-400 border-slate-700'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {filtered.length} {language === 'hi' ? 'ट्रेड्स' : 'Trades'}
            </span>
          </div>
          <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {language === 'hi'
              ? 'स्क्रॉल करने योग्य हिस्ट्री — वॉलेट में जमा हुई नियमित राशि का लेजर'
              : 'Scrollable history of logged trades and regular profits credited to wallet'}
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Total Yield Tag */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono border ${
              isDark
                ? 'bg-cyan-950/40 border-cyan-500/30 text-cyan-300'
                : 'bg-cyan-50 border-cyan-200 text-cyan-800'
            }`}
          >
            <Coins className={`w-3 h-3 shrink-0 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
            <span className={isDark ? 'text-slate-400 text-[11px]' : 'text-slate-600 text-[11px]'}>
              Yield:
            </span>
            <span className={`font-bold tabular-nums ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>
              +{currencyFormat(totalYieldInLedger)}
            </span>
          </div>

          {/* Filter tabs */}
          <div
            className={`flex items-center p-0.5 rounded-lg border text-xs font-mono ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}
          >
            {(['ALL', 'WIN', 'LOSS'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setFilter(m)}
                className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded transition-colors cursor-pointer text-[11px] ${
                  filter === m
                    ? isDark
                      ? 'bg-slate-700 text-white font-bold'
                      : 'bg-white text-slate-900 font-bold shadow-sm'
                    : isDark
                    ? 'text-slate-400 hover:text-white'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div
          className={`p-8 text-center text-xs ${
            isDark ? 'bg-[#0b1222] text-slate-500' : 'bg-white text-slate-500'
          }`}
        >
          {language === 'hi'
            ? 'अभी तक कोई ट्रेड दर्ज नहीं की गई है। ऊपर WIN या LOSS दबाएं।'
            : 'No trades recorded yet. Tap WIN or LOSS above to start.'}
        </div>
      ) : (
        <>
          {/* Mobile Card View (sm:hidden) - Fixed Max Height with Vertical Scroll */}
          <div
            className={`sm:hidden max-h-72 overflow-y-auto divide-y overscroll-contain ${
              isDark ? 'bg-[#0b1222] divide-slate-800/80' : 'bg-white divide-slate-100'
            }`}
          >
            {filtered.map((item) => {
              const isWin = item.result === 'WIN';
              return (
                <div
                  key={item.id}
                  className={`p-3.5 space-y-2 transition-colors ${
                    isDark
                      ? 'bg-[#0b1222] hover:bg-slate-800/30'
                      : 'bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-mono text-xs font-bold ${
                          isDark ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      >
                        #{item.tradeNumber}
                      </span>
                      <span
                        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          isWin
                            ? isDark
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : isDark
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {isWin ? (
                          <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3 stroke-[2.5]" />
                        )}
                        {item.result}
                      </span>
                      <span className={`text-[10px] font-mono ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                        {new Date(item.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="text-right font-mono">
                      <span
                        className={`text-xs font-bold tabular-nums ${
                          isWin
                            ? isDark
                              ? 'text-emerald-400'
                              : 'text-emerald-600'
                            : isDark
                            ? 'text-rose-400'
                            : 'text-rose-600'
                        }`}
                      >
                        {isWin ? '+' : ''}
                        {currencyFormat(item.pnl)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono pt-1">
                    <div>
                      <span className={`text-[10px] block ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                        Trade Size
                      </span>
                      <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                        {currencyFormat(item.tradeAmount)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className={`text-[10px] block ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                        Wallet Added
                      </span>
                      <span
                        className={`font-bold tabular-nums ${
                          isDark ? 'text-cyan-300' : 'text-cyan-700'
                        }`}
                      >
                        +{currencyFormat(item.walletYieldAdded)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className={`text-[10px] block ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                        Loss Status
                      </span>
                      <span
                        className={`text-[11px] tabular-nums ${
                          item.lossAfterTrade > 0
                            ? isDark
                              ? 'text-rose-400 font-semibold'
                              : 'text-rose-600 font-semibold'
                            : isDark
                            ? 'text-emerald-400'
                            : 'text-emerald-600'
                        }`}
                      >
                        {item.lossAfterTrade > 0 ? currencyFormat(item.lossAfterTrade) : '₹0'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop & Tablet Table View (hidden sm:block) - Fixed Max Height with Vertical & Horizontal Scroll */}
          <div
            className={`hidden sm:block max-h-80 overflow-y-auto overflow-x-auto overscroll-contain ${
              isDark ? 'bg-[#0b1222]' : 'bg-white'
            }`}
          >
            <table className={`w-full text-left text-xs font-mono ${isDark ? 'bg-[#0b1222]' : 'bg-white'}`}>
              <thead
                className={`sticky top-0 uppercase text-[10px] tracking-wider border-b z-10 shadow-sm ${
                  isDark
                    ? 'bg-[#080d19] text-slate-400 border-slate-800'
                    : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                <tr>
                  <th className="py-2.5 px-4 font-semibold">#</th>
                  <th className="py-2.5 px-4 font-semibold">Time</th>
                  <th className="py-2.5 px-4 font-semibold">Trade Size</th>
                  <th className="py-2.5 px-4 font-semibold">Result</th>
                  <th className="py-2.5 px-4 font-semibold">PnL</th>
                  <th className="py-2.5 px-4 font-semibold">Wallet Profit Added</th>
                  <th className="py-2.5 px-4 font-semibold">Remaining Loss</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Note</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-slate-800/80 bg-[#0b1222]' : 'divide-slate-100 bg-white'}`}>
                {filtered.map((item) => {
                  const isWin = item.result === 'WIN';

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        isDark ? 'bg-[#0b1222] hover:bg-slate-800/30' : 'bg-white hover:bg-slate-50'
                      }`}
                    >
                      <td className={`py-3 px-4 font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        #{item.tradeNumber}
                      </td>
                      <td className={`py-3 px-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {new Date(item.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className={`py-3 px-4 font-semibold tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {currencyFormat(item.tradeAmount)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            isWin
                              ? isDark
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isDark
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {isWin ? (
                            <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3 stroke-[2.5]" />
                          )}
                          {item.result}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-bold tabular-nums ${
                            isWin
                              ? isDark
                                ? 'text-emerald-400'
                                : 'text-emerald-600'
                              : isDark
                              ? 'text-rose-400'
                              : 'text-rose-600'
                          }`}
                        >
                          {isWin ? '+' : ''}
                          {currencyFormat(item.pnl)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div
                          className={`flex items-center gap-1 font-bold tabular-nums ${
                            isDark ? 'text-cyan-300' : 'text-cyan-700'
                          }`}
                        >
                          <span>+{currencyFormat(item.walletYieldAdded)}</span>
                          <span className={`text-[10px] font-normal ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            {isWin ? '(locked)' : '(buffer)'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`tabular-nums ${
                            item.lossAfterTrade > 0
                              ? isDark
                                ? 'text-rose-400 font-semibold'
                                : 'text-rose-600 font-semibold'
                              : isDark
                              ? 'text-emerald-400'
                              : 'text-emerald-600'
                          }`}
                        >
                          {item.lossAfterTrade > 0 ? currencyFormat(item.lossAfterTrade) : '₹0 (Recovered)'}
                        </span>
                      </td>
                      <td className={`py-3 px-4 text-right text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {item.assetOrMarket || 'Trade'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Scrolling Helper Footer */}
          {filtered.length > 3 && (
            <div
              className={`px-4 py-2 border-t text-[10px] font-mono flex items-center justify-between shrink-0 ${
                isDark
                  ? 'border-slate-800 bg-[#080d19] text-slate-500'
                  : 'border-slate-200 bg-white text-slate-500'
              }`}
            >
              <span>
                {language === 'hi'
                  ? '↕ स्क्रॉल करके पिछली ट्रेड्स देखें'
                  : '↕ Scroll inside to view older trades'}
              </span>
              <span>
                {filtered.length} {language === 'hi' ? 'ट्रेड्स दर्ज' : 'logged'}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
};
