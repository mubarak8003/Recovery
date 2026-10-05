import {
  Currency,
  NextTradeRecommendation,
  RecoveryStepDetail,
  RecoveryStrategy,
  Settings,
} from '../types/trading';

/**
 * Pure Loss Recovery & Normal Trade Sizing with True Dual-Account Funding:
 * 
 * "Agar 67 investment karega to sirf tr ka hi payout hoga waloka kaha se aayega dono ke liye socho"
 * 
 * Mathematical Truth:
 * If you invest 67 at 85% payout, the broker ONLY pays 56.95 (only TR profit).
 * The wallet cannot get 10.05 out of thin air!
 * 
 * Therefore, to get BOTH TR Profit (56.95) + Wallet Profit (10.05) = Total 67.00:
 * The investment (trade amount) MUST be sized so that broker payout pays for BOTH:
 * 
 * Trade Size = (TR Target Profit + Wallet Target Profit) / Effective RR
 * Example: (56.95 + 10.05) / 0.85 = 67.00 / 0.85 = ₹79!
 * 
 * When ₹79 is won at 85%:
 * Broker pays: ₹79 × 0.85 = +₹67.15!
 * - TR receives: ₹56.95!
 * - Wallet receives: ₹10.20!
 * Both are 100% paid by the broker! Zero fake money!
 */
export function calculateNextTradeRecommendation(
  tradingCapital: number,
  activeLoss: number,
  currentStepIndex: number,
  consecutiveLossCount: number,
  settings: Settings
): {
  recommendation: NextTradeRecommendation;
  stepDetails: RecoveryStepDetail[];
} {
  const {
    baseTradePercent = 2,
    yieldRatePercent = 15,
    riskRewardRatio = 0.85,
    maxRiskPercentCap = 25,
    strategy = 'SMART_LADDER',
    recoveryStepsCount = 1,
  } = settings;

  const safeCapital = Math.max(10, Number(tradingCapital) || 10000);
  const safeActiveLoss = Math.max(0, Number(activeLoss) || 0);
  const effectiveRR = Math.max(0.1, Number(riskRewardRatio) || 0.85);
  const rawYield = settings.yieldRatePercent;
  const safeYieldRate = (typeof rawYield === 'number' && !isNaN(rawYield) && rawYield >= 0)
    ? rawYield
    : (parseFloat(String(rawYield)) >= 0 ? parseFloat(String(rawYield)) : 15);

  // BASE / NORMAL TRADE SIZING (Both TR + Wallet Funded by Broker):
  // Desired Base Risk/Size reference:
  const baseTarget = Math.max(
    10,
    Math.round((safeCapital * baseTradePercent) / 100)
  );

  // If there is NO active loss to recover (Normal Clean Trading)
  if (safeActiveLoss <= 0) {
    const baseTargetTrade = Math.max(10, Math.round((safeCapital * baseTradePercent) / 100));
    const trProfitOnBase = Number((baseTargetTrade * effectiveRR).toFixed(2));
    const walletProfitOnBase = Number(((baseTargetTrade * (safeYieldRate / 100)).toFixed(2)));
    const totalProfitNeeded = Number((trProfitOnBase + walletProfitOnBase).toFixed(2));
    const suggestedTradeAmount = Number((totalProfitNeeded / effectiveRR).toFixed(2));

    // Real payout broker will pay on this suggested amount:
    const totalWinPayout = Number((suggestedTradeAmount * effectiveRR).toFixed(2));
    const walletShare = Number(((suggestedTradeAmount * (safeYieldRate / 100)).toFixed(2)));
    const trShare = Number(Math.max(0, totalWinPayout - walletShare).toFixed(2));

    return {
      recommendation: {
        amount: suggestedTradeAmount,
        stepNumber: 1,
        totalSteps: 1,
        isRecoveryMode: false,
        targetProfit: totalWinPayout,
        targetRiskReward: `1 : ${riskRewardRatio}`,
        walletYieldWillAdd: walletShare,
        riskPercentOfCapital: Number(
          ((suggestedTradeAmount / safeCapital) * 100).toFixed(1)
        ),
        stepLossTarget: 0,
        consecutiveLossCount: 0,
        reason: `Normal Trade: ₹${suggestedTradeAmount} sized so broker payout (+₹${totalWinPayout}) covers both TR (+₹${trShare}) & Wallet (+₹${walletShare}).`,
        reasonHindi: `नॉर्मल ट्रेड: ₹${suggestedTradeAmount} निवेश ताकि ब्रोकर पेआउट (+₹${totalWinPayout}) से TR (+₹${trShare}) और वॉलेट (+₹${walletShare}) दोनों का पूरा पैसा मिले।`,
      },
      stepDetails: [],
    };
  }

  // ACTIVE LOSS RECOVERY MODE:
  // "recovery me wallet ke liya extra profit hai payout me mat dalo recovery me dalo"
  const stepsCount = Math.max(1, Number(recoveryStepsCount) || 1);
  const stepDetails: RecoveryStepDetail[] = [];
  const maxSafeRisk = (safeCapital * maxRiskPercentCap) / 100;

  // Dynamic step factors (Fibonacci / Conservative / Equal)
  let stepFactors: number[] = [];
  if (strategy === 'FIBONACCI') {
    stepFactors = [];
    let a = 1, b = 1;
    for (let i = 0; i < stepsCount; i++) {
      stepFactors.push(a);
      const next = a + b;
      a = b;
      b = next;
    }
  } else if (strategy === 'CONSERVATIVE_5STEP') {
    stepFactors = Array.from({ length: stepsCount }, (_, idx) => 1 + idx * 0.1);
  } else {
    // Standard Equal distribution (e.g. ÷2, ÷3, ÷4, ÷8, ÷9)
    stepFactors = Array.from({ length: stepsCount }, () => 1);
  }

  const factorSum = stepFactors.reduce((a, b) => a + (Number(b) || 1), 0) || 1;
  const basePortion = safeActiveLoss / factorSum;

  for (let i = 0; i < stepsCount; i++) {
    const factor = Number(stepFactors[i]) || 1;
    const portionLoss = basePortion * factor;

    // Exact mathematical formula:
    // To recover portionLoss (बकाया लॉस) while earning safeYieldRate (15% wallet profit):
    // Trade * effectiveRR = portionLoss + Trade * (safeYieldRate / 100)
    // Trade * (effectiveRR - safeYieldRate / 100) = portionLoss
    // Trade = portionLoss / (effectiveRR - safeYieldRate / 100)
    const netRate = Math.max(0.1, Number((effectiveRR - safeYieldRate / 100).toFixed(4)));
    let calculatedTrade = Number((portionLoss / netRate).toFixed(2));

    // Strict NaN & Infinity Prevention
    if (isNaN(calculatedTrade) || !isFinite(calculatedTrade) || calculatedTrade <= 0) {
      calculatedTrade = Math.max(1, Number((safeActiveLoss / stepsCount).toFixed(2)));
    }

    calculatedTrade = Math.max(1, calculatedTrade);

    // Payout is purely based on the calculated trade amount: Trade Amount × Effective RR
    const actualWinPayout = Number((calculatedTrade * effectiveRR).toFixed(2));
    const stepWalletExtra = Number(((calculatedTrade * (safeYieldRate / 100)).toFixed(2)));

    let status: 'PENDING' | 'CURRENT' | 'COMPLETED' = 'PENDING';
    if (i < currentStepIndex) {
      status = 'COMPLETED';
    } else if (i === currentStepIndex) {
      status = 'CURRENT';
    }

    stepDetails.push({
      stepNumber: i + 1,
      suggestedAmount: calculatedTrade,
      targetProfit: actualWinPayout,
      targetRR: `1 : ${riskRewardRatio}`,
      status,
    });
  }

  const clampedIndex = Math.min(
    Math.max(0, Number(currentStepIndex) || 0),
    stepDetails.length - 1
  );
  const currentStep = stepDetails[clampedIndex] || stepDetails[0];

  let finalAmount = Number(currentStep?.suggestedAmount);
  if (isNaN(finalAmount) || !isFinite(finalAmount) || finalAmount <= 0) {
    finalAmount = Math.max(1, Math.round(safeActiveLoss / stepsCount));
  }

  const stepTarget = Number(
    (basePortion * (Number(stepFactors[clampedIndex]) || 1)).toFixed(2)
  );
  // Wallet extra profit is ALWAYS based on the Trade Amount (trade amount hisaab se):
  const stepWalletExtra = Number((finalAmount * (safeYieldRate / 100)).toFixed(2));

  // Payout is purely based on Trade Amount × RR
  const finalWinPayout = Number((finalAmount * effectiveRR).toFixed(2));
  const riskPct = Number(((finalAmount / safeCapital) * 100).toFixed(1));

  return {
    recommendation: {
      amount: finalAmount,
      stepNumber: clampedIndex + 1,
      totalSteps: stepsCount,
      isRecoveryMode: true,
      targetProfit: finalWinPayout,
      targetRiskReward: `1 : ${riskRewardRatio}`,
      walletYieldWillAdd: stepWalletExtra,
      riskPercentOfCapital: isNaN(riskPct) ? 1 : riskPct,
      stepLossTarget: isNaN(stepTarget) ? 0 : stepTarget,
      consecutiveLossCount: Number(consecutiveLossCount) || 0,
      reason: `Step ${clampedIndex + 1}/${stepsCount} Recovery: Trade ₹${finalAmount} sized for ₹${stepTarget} loss recovery + ₹${stepWalletExtra} wallet extra profit.`,
      reasonHindi: `स्टेप ${clampedIndex + 1}/${stepsCount} रिकवरी: ट्रेड ₹${finalAmount} को ₹${stepTarget} लॉस रिकवरी + ₹${stepWalletExtra} वॉलेट के अतिरिक्त लाभ को मिलाकर बनाया गया है।`,
    },
    stepDetails,
  };
}
