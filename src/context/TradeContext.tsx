import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  ReactNode,
} from 'react';
import {
  Currency,
  Language,
  NextTradeRecommendation,
  RecoveryStepDetail,
  Settings,
  TradeRecord,
  TradeResult,
} from '../types/trading';
import { calculateNextTradeRecommendation } from '../utils/tradeSizingEngine';
import confetti from 'canvas-confetti';

interface TradeContextType {
  tradingCapital: number;
  regularProfitWallet: number;
  lifetimeYieldEarned: number;
  activeLoss: number;
  initialLoss: number;
  totalRecovered: number;
  currentStepIndex: number;
  tradeHistory: TradeRecord[];
  settings: Settings;
  language: Language;
  consecutiveLossCount: number;
  totalLossCount: number;
  totalTradesCount: number;
  totalWinsCount: number;
  totalTurnover: number;
  winRatePercent: number;
  recommendation: NextTradeRecommendation;
  stepDetails: RecoveryStepDetail[];
  customTradeAmountOverride: number | null;
  setCustomTradeAmountOverride: (amount: number | null) => void;
  recentYieldToast: { amount: number; id: number } | null;
  clearYieldToast: () => void;
  recoveryCompletedModal: boolean;
  setRecoveryCompletedModal: (val: boolean) => void;

  // Actions
  recordTrade: (params: {
    amount: number;
    result: TradeResult;
    actualPnL?: number;
    note?: string;
  }) => void;
  undoLastTrade: () => void;
  offsetLossWithWallet: (amount: number) => boolean;
  compoundWalletToCapital: (amount: number) => boolean;
  updateSettings: (newSettings: Partial<Settings>) => void;
  setTradingCapital: (amount: number) => void;
  setActiveLossAmount: (amount: number) => void;
  theme: 'dark' | 'light';
  setTheme: (t: 'dark' | 'light') => void;
  toggleTheme: () => void;
  setLanguage: (lang: Language) => void;
  resetAll: (newCapital?: number) => void;
  currencyFormat: (amount: number) => string;
}

const DEFAULT_SETTINGS: Settings = {
  currency: 'INR',
  currencySymbol: '₹',
  baseTradePercent: 2.0, // 2% per normal trade
  yieldRatePercent: 1.0, // 1% regular profit to wallet on every trade
  payoutPercentOnWin: 85, // 85% payout
  riskRewardRatio: 1.0, // 1:1 R:R default for direct loss divide
  maxRiskPercentCap: 15, // Max 15% risk cap in recovery
  strategy: 'SMART_LADDER',
  recoveryStepsCount: 1, // Default Divide by 1 se start hoga
};

const STORAGE_KEY = 'tradesizer_saved_session_v2';

interface SavedSessionData {
  tradingCapital: number;
  regularProfitWallet: number;
  lifetimeYieldEarned: number;
  activeLoss: number;
  initialLoss: number;
  totalRecovered: number;
  currentStepIndex: number;
  consecutiveLossCount: number;
  totalLossCount: number;
  language: Language;
  settings: Settings;
  tradeHistory: TradeRecord[];
}

function getInitialSavedData(): SavedSessionData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.settings && (!parsed.activeLoss || parsed.activeLoss <= 0)) {
      parsed.settings.recoveryStepsCount = 1;
    }
    return parsed;
  } catch {
    return null;
  }
}

const TradeContext = createContext<TradeContextType | undefined>(undefined);

export const TradeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const initialData = useMemo(() => getInitialSavedData(), []);

  const [tradingCapital, setTradingCapitalState] = useState<number>(
    () => initialData?.tradingCapital ?? 10000
  );
  const [regularProfitWallet, setRegularProfitWallet] = useState<number>(
    () => initialData?.regularProfitWallet ?? 0
  );
  const [lifetimeYieldEarned, setLifetimeYieldEarned] = useState<number>(
    () => initialData?.lifetimeYieldEarned ?? 0
  );
  const [activeLoss, setActiveLoss] = useState<number>(
    () => initialData?.activeLoss ?? 0
  );
  const [initialLoss, setInitialLoss] = useState<number>(
    () => initialData?.initialLoss ?? 0
  );
  const [totalRecovered, setTotalRecovered] = useState<number>(
    () => initialData?.totalRecovered ?? 0
  );
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(
    () => initialData?.currentStepIndex ?? 0
  );
  const [consecutiveLossCount, setConsecutiveLossCount] = useState<number>(
    () => initialData?.consecutiveLossCount ?? 0
  );
  const [totalLossCount, setTotalLossCount] = useState<number>(
    () => initialData?.totalLossCount ?? 0
  );
  const [theme, setThemeState] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('tradesizer_theme');
      if (saved === 'light' || saved === 'dark') return saved;
      return 'dark';
    } catch {
      return 'dark';
    }
  });

  const setTheme = useCallback((t: 'dark' | 'light') => {
    setThemeState(t);
    try {
      localStorage.setItem('tradesizer_theme', t);
    } catch {}
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem('tradesizer_theme', next);
      } catch {}
      return next;
    });
  }, []);

  // Sync theme class on document
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
      document.body.classList.add('light-theme');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.remove('light-theme');
      document.body.classList.remove('light-theme');
      document.documentElement.classList.add('dark');
    }
  }, [theme]);

  const [language, setLanguage] = useState<Language>(
    () => initialData?.language ?? 'hi'
  );
  const [settings, setSettings] = useState<Settings>(
    () => initialData?.settings ?? DEFAULT_SETTINGS
  );
  const [recentYieldToast, setRecentYieldToast] = useState<{ amount: number; id: number } | null>(null);
  const [customTradeAmountOverride, setCustomTradeAmountOverride] = useState<number | null>(null);
  const [recoveryCompletedModal, setRecoveryCompletedModal] = useState<boolean>(false);

  // Auto-dismiss toast after 3 seconds
  const clearYieldToast = useCallback(() => {
    setRecentYieldToast(null);
  }, []);

  useEffect(() => {
    if (!recentYieldToast) return;
    const timer = setTimeout(() => {
      setRecentYieldToast(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, [recentYieldToast]);

  const [tradeHistory, setTradeHistory] = useState<TradeRecord[]>(
    () => initialData?.tradeHistory ?? []
  );

  // AUTO-SAVE: Automatically save all tasks, trades, losses, and settings to localStorage
  useEffect(() => {
    try {
      const dataToSave: SavedSessionData = {
        tradingCapital,
        regularProfitWallet,
        lifetimeYieldEarned,
        activeLoss,
        initialLoss,
        totalRecovered,
        currentStepIndex,
        consecutiveLossCount,
        totalLossCount,
        language,
        settings,
        tradeHistory,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch {
      // storage quota or private browsing fallback
    }
  }, [
    tradingCapital,
    regularProfitWallet,
    lifetimeYieldEarned,
    activeLoss,
    initialLoss,
    totalRecovered,
    currentStepIndex,
    consecutiveLossCount,
    totalLossCount,
    language,
    settings,
    tradeHistory,
  ]);

  const totalTradesCount = tradeHistory.length;
  const totalWinsCount = useMemo(
    () => tradeHistory.filter((t) => t.result === 'WIN').length,
    [tradeHistory]
  );
  const totalTurnover = useMemo(
    () =>
      Number(
        tradeHistory
          .reduce((acc, curr) => acc + (Number(curr.tradeAmount) || 0), 0)
          .toFixed(2)
      ),
    [tradeHistory]
  );
  const winRatePercent = useMemo(
    () =>
      totalTradesCount > 0
        ? Number(((totalWinsCount / totalTradesCount) * 100).toFixed(1))
        : 0,
    [totalWinsCount, totalTradesCount]
  );

  const currencyFormat = useCallback(
    (amount: number) => {
      const sym = settings.currencySymbol;
      const num = Number(amount) || 0;
      const hasDecimals = Math.abs(num % 1) > 0.0001;
      return `${sym}${num.toLocaleString('en-IN', {
        minimumFractionDigits: hasDecimals ? 2 : 0,
        maximumFractionDigits: 2,
      })}`;
    },
    [settings.currencySymbol]
  );

  // Recalculate recommendation whenever capital, activeLoss, step or settings change
  const { recommendation, stepDetails } = useMemo(() => {
    return calculateNextTradeRecommendation(
      tradingCapital,
      activeLoss,
      currentStepIndex,
      consecutiveLossCount,
      settings
    );
  }, [
    tradingCapital,
    activeLoss,
    currentStepIndex,
    consecutiveLossCount,
    settings,
  ]);

  // Core action: Record Trade (Win or Loss)
  const recordTrade = useCallback(
    (params: {
      amount: number;
      result: TradeResult;
      actualPnL?: number;
      note?: string;
    }) => {
      const { amount, result, actualPnL, note } = params;
      if (amount <= 0 || isNaN(amount)) return;

      const lossBefore = activeLoss;
      let lossAfter = activeLoss;
      let calculatedPnL = 0;

      // Regular Profit Wallet earns yield on EVERY trade (WIN and LOSS dono me hoga):
      const safeYieldRate = Number(settings.yieldRatePercent) || 15;
      const walletYieldAdded = Number(((amount * (safeYieldRate / 100)).toFixed(2)));

      if (walletYieldAdded > 0) {
        setRegularProfitWallet((prev) => Number((prev + walletYieldAdded).toFixed(2)));
        setLifetimeYieldEarned((prev) => Number((prev + walletYieldAdded).toFixed(2)));
        setRecentYieldToast({ amount: walletYieldAdded, id: Date.now() });
      }

      if (result === 'LOSS') {
        calculatedPnL = actualPnL !== undefined ? -Math.abs(actualPnL) : -amount;
        setTradingCapitalState((prev) => Number((prev + calculatedPnL).toFixed(2)));

        lossAfter = Number((lossBefore + Math.abs(calculatedPnL)).toFixed(2));
        setActiveLoss(lossAfter);
        setInitialLoss((prev) => Math.max(prev, lossAfter));
        setConsecutiveLossCount((prev) => prev + 1);
        setTotalLossCount((prev) => prev + 1);

        // Advance Divide Factor dynamically on forward loss:
        // "By default pahla loss hai to Divide Loss by How Many Parts pe bhi start me 1 se chale"
        setSettings((prev) => {
          if (lossBefore === 0) {
            return {
              ...prev,
              recoveryStepsCount: 1,
            };
          }
          const currentFactor = prev.recoveryStepsCount || 1;
          const nextFactor = Math.min(100, currentFactor + 1);
          return {
            ...prev,
            recoveryStepsCount: nextFactor,
          };
        });

        // Advance to next recovery step (first loss is step 0)
        setCurrentStepIndex((prev) => (lossBefore === 0 ? 0 : prev + 1));
      } else {
        // WIN: Total real payout from broker
        const totalWinPayout =
          actualPnL !== undefined
            ? Math.abs(actualPnL)
            : Number((amount * settings.riskRewardRatio).toFixed(2));

        calculatedPnL = totalWinPayout;
        setTradingCapitalState((prev) => Number((prev + totalWinPayout).toFixed(2)));

        if (activeLoss > 0) {
          const recovered = Math.min(activeLoss, totalWinPayout);
          lossAfter = Math.max(0, Number((activeLoss - totalWinPayout).toFixed(2)));
          setActiveLoss(lossAfter);
          setTotalRecovered((prev) => Number((prev + recovered).toFixed(2)));

          if (lossAfter <= 0) {
            // Full recovery achieved!
            setCurrentStepIndex(0);
            setConsecutiveLossCount(0);
            setSettings((prev) => ({ ...prev, recoveryStepsCount: 1 }));
            try {
              confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#10b981', '#06b6d4', '#f59e0b'],
              });
            } catch {
              // fallback
            }
            setRecoveryCompletedModal(true);
          } else {
            // Partially recovered, step down consecutive loss and divide factor
            setConsecutiveLossCount((prev) => Math.max(0, prev - 1));
            setSettings((prev) => {
              const currentFactor = prev.recoveryStepsCount || 2;
              const nextFactor = Math.max(1, currentFactor - 1);
              return {
                ...prev,
                recoveryStepsCount: nextFactor,
              };
            });
            setCurrentStepIndex((prev) => Math.max(0, prev - 1));
          }
        }
      }

      // Record to history
      const newRecord: TradeRecord = {
        id: `TRD-${Date.now()}`,
        tradeNumber: tradeHistory.length + 1,
        tradeAmount: amount,
        result,
        pnl: calculatedPnL,
        walletYieldAdded,
        lossBeforeTrade: lossBefore,
        lossAfterTrade: lossAfter,
        recoveryStep: activeLoss > 0 ? currentStepIndex + 1 : 0,
        recommendedTradeWas: recommendation.amount,
        timestamp: Date.now(),
        assetOrMarket: note || 'Trade Entry',
      };

      setTradeHistory((prev) => [newRecord, ...prev]);
      // Always recalculate next trade purely on divide system after each trade
      setCustomTradeAmountOverride(null);
    },
    [
      activeLoss,
      currentStepIndex,
      settings,
      tradeHistory.length,
      recommendation.amount,
    ]
  );

  // Undo last trade
  const undoLastTrade = useCallback(() => {
    if (tradeHistory.length === 0) return;
    const last = tradeHistory[0];

    // Revert capital & wallet
    setTradingCapitalState((prev) => Number((prev - last.pnl).toFixed(2)));
    setRegularProfitWallet((prev) =>
      Math.max(0, Number((prev - last.walletYieldAdded).toFixed(2)))
    );
    setLifetimeYieldEarned((prev) =>
      Math.max(0, Number((prev - last.walletYieldAdded).toFixed(2)))
    );
    setActiveLoss(last.lossBeforeTrade);

    setTradeHistory((prev) => prev.slice(1));
  }, [tradeHistory]);

  // Use Regular Profit Wallet to offset active loss
  const offsetLossWithWallet = useCallback(
    (amount: number) => {
      if (amount <= 0 || activeLoss <= 0 || regularProfitWallet <= 0) return false;
      const amtToUse = Math.min(amount, activeLoss, regularProfitWallet);

      setRegularProfitWallet((prev) => Number((prev - amtToUse).toFixed(2)));
      const remaining = Math.max(0, Number((activeLoss - amtToUse).toFixed(2)));
      setActiveLoss(remaining);
      setTotalRecovered((prev) => Number((prev + amtToUse).toFixed(2)));

      if (remaining <= 0) {
        setCurrentStepIndex(0);
        try {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#06b6d4', '#10b981'],
          });
        } catch {
          // fallback
        }
        setRecoveryCompletedModal(true);
      }

      return true;
    },
    [activeLoss, regularProfitWallet]
  );

  // Transfer regular profit wallet into trading capital
  const compoundWalletToCapital = useCallback(
    (amount: number) => {
      if (amount <= 0 || amount > regularProfitWallet) return false;
      const amt = Number(amount.toFixed(2));
      setRegularProfitWallet((prev) => Number((prev - amt).toFixed(2)));
      setTradingCapitalState((prev) => Number((prev + amt).toFixed(2)));
      return true;
    },
    [regularProfitWallet]
  );

  const updateSettings = useCallback((newSettings: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    if (
      newSettings.recoveryStepsCount !== undefined ||
      newSettings.riskRewardRatio !== undefined ||
      newSettings.strategy !== undefined
    ) {
      setCustomTradeAmountOverride(null);
    }
  }, []);

  const setTradingCapital = useCallback((amount: number) => {
    setTradingCapitalState(Math.max(100, amount));
  }, []);

  const setActiveLossAmount = useCallback((amount: number) => {
    const val = Math.max(0, Number(amount.toFixed(2)));
    setActiveLoss(val);
    setInitialLoss(val);
    setTotalRecovered(0);
    setCurrentStepIndex(0);
    setCustomTradeAmountOverride(null);
    if (val > 0) {
      setConsecutiveLossCount((prev) => (prev > 0 ? prev : 1));
      setSettings((prev) => ({ ...prev, recoveryStepsCount: prev.recoveryStepsCount || 1 }));
    } else {
      setConsecutiveLossCount(0);
      setSettings((prev) => ({ ...prev, recoveryStepsCount: 1 }));
    }
  }, []);

  const resetAll = useCallback((newCapital: number = 10000) => {
    setTradingCapitalState(newCapital);
    setRegularProfitWallet(0);
    setLifetimeYieldEarned(0);
    setActiveLoss(0);
    setInitialLoss(0);
    setTotalRecovered(0);
    setCurrentStepIndex(0);
    setConsecutiveLossCount(0);
    setTotalLossCount(0);
    setTradeHistory([]);
    setCustomTradeAmountOverride(null);
    setSettings((prev) => ({ ...prev, recoveryStepsCount: 1 }));
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // fallback
    }
  }, []);

  return (
    <TradeContext.Provider
      value={{
        tradingCapital,
        regularProfitWallet,
        lifetimeYieldEarned,
        activeLoss,
        initialLoss,
        totalRecovered,
        currentStepIndex,
        consecutiveLossCount,
        totalLossCount,
        totalTradesCount,
        totalWinsCount,
        totalTurnover,
        winRatePercent,
        tradeHistory,
        settings,
        language,
        recommendation,
        stepDetails,
        customTradeAmountOverride,
        setCustomTradeAmountOverride,
        recentYieldToast,
        clearYieldToast,
        recoveryCompletedModal,
        setRecoveryCompletedModal,
        recordTrade,
        undoLastTrade,
        offsetLossWithWallet,
        compoundWalletToCapital,
        updateSettings,
        setTradingCapital,
        setActiveLossAmount,
        theme,
        setTheme,
        toggleTheme,
        setLanguage,
        resetAll,
        currencyFormat,
      }}
    >
      {children}
    </TradeContext.Provider>
  );
};

export const useTrade = () => {
  const context = useContext(TradeContext);
  if (!context) {
    throw new Error('useTrade must be used within a TradeProvider');
  }
  return context;
};
