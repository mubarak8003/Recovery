export type Currency = 'INR' | 'USD' | 'EUR';

export type TradeResult = 'WIN' | 'LOSS';

export type RecoveryStrategy =
  | 'SMART_LADDER'       // Controlled step ladder, user-selected steps & R:R
  | 'CONSERVATIVE_5STEP' // 5 Gentle steps, small risk per trade
  | 'FIBONACCI'          // 1, 1, 2, 3 progression with circuit breakers
  | 'VAULT_ASSISTED';    // 25% absorbed by accumulated regular profit wallet

export interface TradeRecord {
  id: string;
  tradeNumber: number;
  tradeAmount: number;
  result: TradeResult;
  pnl: number;
  walletYieldAdded: number;
  lossBeforeTrade: number;
  lossAfterTrade: number;
  recoveryStep: number;
  recommendedTradeWas: number;
  timestamp: number;
  assetOrMarket?: string;
}

export interface NextTradeRecommendation {
  amount: number;
  stepNumber: number;
  totalSteps: number;
  isRecoveryMode: boolean;
  targetProfit: number;
  targetRiskReward: string;
  walletYieldWillAdd: number;
  riskPercentOfCapital: number;
  stepLossTarget: number;
  consecutiveLossCount: number;
  reason: string;
  reasonHindi: string;
}

export interface RecoveryStepDetail {
  stepNumber: number;
  suggestedAmount: number;
  targetProfit: number;
  targetRR: string;
  status: 'PENDING' | 'CURRENT' | 'COMPLETED';
}

export interface Settings {
  currency: Currency;
  currencySymbol: string;
  baseTradePercent: number; // e.g. 2% of capital for normal trades
  yieldRatePercent: number; // e.g. 1.0% added to wallet on every trade
  payoutPercentOnWin: number; // e.g. 85% payout
  riskRewardRatio: number; // e.g. 1.5, 2.0, 2.5, 3.0 (R:R)
  maxRiskPercentCap: number; // e.g. 10% max of capital per trade
  strategy: RecoveryStrategy;
  recoveryStepsCount: number; // "Kitne martaba me recovery karni hai" (e.g. 2, 3, 4, 5, 6, 8)
  fixedBaseCapitalMode?: boolean; // When true, trading balance stays locked at session starting capital and all surplus profit goes directly to Regular Profit Wallet
  initialBaseCapital?: number; // Starting Capital for fresh session (e.g. 10000)
}

export type Language = 'en' | 'hi';
