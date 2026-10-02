import React, { useState } from 'react';
import { useTrade } from '../context/TradeContext';
import { ArrowUpRight, ArrowDownRight, Coins, ScrollText } from 'lucide-react';

export const TradeHistoryJournal: React.FC = () => {
  const { tradeHistory, language, currencyFormat } = useTrade();
  const [filter, setFilter] = useState<'ALL' | 'WIN' | 'LOSS'>('ALL');

  const filtered = tradeHistory.filter((t) => {
    if (filter === 'WIN') return t.result === 'WIN';
    if (filter === 'LOSS') return t.result === 'LOSS';
    return true;
  });

  const totalYieldInLedger = tradeHistory.reduce((acc, curr) => acc + curr.walletYieldAdded, 0);

  return (
    <div className="bg-[#0b1222] border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-1.5">
            <ScrollText className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">
              {language === 'hi' ? 'ट्रेड जर्नल एवं लेजर' : 'Trade Journal & Yield Ledger'}
            </h3>
            <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">
              {filtered.length} {language === 'hi' ? 'ट्रेड्स' : 'Trades'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {language === 'hi'
              ? 'स्क्रॉल करने योग्य हिस्ट्री — वॉलेट में जमा हुई नियमित राशि का लेजर'
              : 'Scrollable history of logged trades and regular profits credited to wallet'}
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Total Yield Tag */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-xs font-mono">
            <Coins className="w-3 h-3 text-cyan-400 shrink-0" />
            <span className="text-slate-400 text-[11px]">Yield:</span>
            <span className="text-cyan-300 font-bold tabular-nums">
              +{currencyFormat(totalYieldInLedger)}
            </span>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs font-mono">
            {(['ALL', 'WIN', 'LOSS'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setFilter(m)}
                className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded transition-colors cursor-pointer text-[11px] ${
                  filter === m ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-500">
          {language === 'hi'
            ? 'अभी तक कोई ट्रेड दर्ज नहीं की गई है। ऊपर WIN या LOSS दबाएं।'
            : 'No trades recorded yet. Tap WIN or LOSS above to start.'}
        </div>
      ) : (
        <>
          {/* Mobile Card View (sm:hidden) - Fixed Max Height with Vertical Scroll */}
          <div className="sm:hidden max-h-72 overflow-y-auto divide-y divide-slate-800/80 overscroll-contain">
            {filtered.map((item) => {
              const isWin = item.result === 'WIN';
              return (
                <div key={item.id} className="p-3.5 space-y-2 bg-[#080d19]/40 hover:bg-slate-800/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-400">
                        #{item.tradeNumber}
                      </span>
                      <span
                        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          isWin
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {isWin ? <ArrowUpRight className="w-3 h-3 stroke-[2.5]" /> : <ArrowDownRight className="w-3 h-3 stroke-[2.5]" />}
                        {item.result}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(item.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="text-right font-mono">
                      <span
                        className={`text-xs font-bold tabular-nums ${
                          isWin ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isWin ? '+' : ''}
                        {currencyFormat(item.pnl)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono pt-1">
                    <div className="text-slate-300">
                      <span className="text-slate-500 text-[10px] block">Trade Size</span>
                      <span className="font-semibold">{currencyFormat(item.tradeAmount)}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-cyan-500 text-[10px] block">Wallet Added</span>
                      <span className="text-cyan-300 font-bold tabular-nums">
                        +{currencyFormat(item.walletYieldAdded)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-slate-500 text-[10px] block">Loss Status</span>
                      <span
                        className={`text-[11px] tabular-nums ${
                          item.lossAfterTrade > 0 ? 'text-rose-400 font-semibold' : 'text-emerald-400'
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
          <div className="hidden sm:block max-h-80 overflow-y-auto overflow-x-auto overscroll-contain">
            <table className="w-full text-left text-xs font-mono">
              <thead className="sticky top-0 bg-[#080d19] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 z-10 shadow-sm">
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
              <tbody className="divide-y divide-slate-800/80">
                {filtered.map((item) => {
                  const isWin = item.result === 'WIN';

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-400">#{item.tradeNumber}</td>
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(item.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 text-white font-semibold tabular-nums">
                        {currencyFormat(item.tradeAmount)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            isWin
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {isWin ? <ArrowUpRight className="w-3 h-3 stroke-[2.5]" /> : <ArrowDownRight className="w-3 h-3 stroke-[2.5]" />}
                          {item.result}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-bold tabular-nums ${
                            isWin ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isWin ? '+' : ''}
                          {currencyFormat(item.pnl)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 font-bold text-cyan-300 tabular-nums">
                          <span>+{currencyFormat(item.walletYieldAdded)}</span>
                          <span className="text-[10px] text-slate-500 font-normal">
                            {isWin ? '(locked)' : '(buffer)'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`tabular-nums ${
                            item.lossAfterTrade > 0 ? 'text-rose-400 font-semibold' : 'text-emerald-400'
                          }`}
                        >
                          {item.lossAfterTrade > 0 ? currencyFormat(item.lossAfterTrade) : '₹0 (Recovered)'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400 text-[11px]">
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
            <div className="px-4 py-2 border-t border-slate-800 bg-[#080d19]/80 text-[10px] text-slate-500 font-mono flex items-center justify-between shrink-0">
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
