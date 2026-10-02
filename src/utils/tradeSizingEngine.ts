import {
  Currency,
  NextTradeRecommendation,
  RecoveryStepDetail,
  RecoveryStrategy,
  Settings,
} from '../types/trading';

/**
 * Pure, transparent Loss Recovery Trade Sizing:
 * When in recovery mode, the trade size is strictly and purely calculated
 * to recover the ACTUAL LOSS that occurred, divided across the user-selected
 * number of trades (steps), based on the user-selected Risk:Reward ratio.
 * No arbitrary capital percentage inflation is added!
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
    baseTradePercent,
    yieldRatePercent,
    riskRewardRatio = 1.5,
    maxRiskPercentCap,
    strategy,
    recoveryStepsCount = 3,
  } = settings;

  const baseTradeAmount = Math.max(
    10,
    Number(((tradingCapital * baseTradePercent) / 100).toFixed(0))
  );

  // If there is NO active loss to recover (Clean / Healthy Account)
  if (activeLoss <= 0) {
    const yieldAmount = Number(
      ((baseTradeAmount * yieldRatePercent) / 100).toFixed(2)
    );
    const targetProfit = Number(
      (baseTradeAmount * riskRewardRatio).toFixed(2)
    );

    return {
      recommendation: {
        amount: baseTradeAmount,
        stepNumber: 1,
        totalSteps: 1,
        isRecoveryMode: false,
        targetProfit,
        targetRiskReward: `1 : ${riskRewardRatio}`,
        walletYieldWillAdd: yieldAmount,
        riskPercentOfCapital: Number(
          ((baseTradeAmount / tradingCapital) * 100).toFixed(1)
        ),
        stepLossTarget: 0,
        consecutiveLossCount: 0,
        reason: `Normal Trade: Risking ${baseTradePercent}% of capital. Target R:R 1:${riskRewardRatio}.`,
        reasonHindi: `सामान्य बेस ट्रेड: कैपिटल का ${baseTradePercent}%, टारगेट R:R 1:${riskRewardRatio}। कोई पिछला लॉस नहीं है।`,
      },
      stepDetails: [],
    };
  }

  // ACTIVE LOSS RECOVERY MODE:
  // Sizing is purely based on the loss to be recovered!
  const stepsCount = Math.max(1, recoveryStepsCount || 3);
  const stepDetails: RecoveryStepDetail[] = [];
  const maxSafeRisk = (tradingCapital * maxRiskPercentCap) / 100;
  const effectiveRR = Math.max(0.05, riskRewardRatio || 0.85);

  // Distribute the exact loss across the steps
  let stepFactors: number[] = [];
  if (strategy === 'FIBONACCI') {
    const fib = [1, 1, 2, 3, 5, 8, 13];
    stepFactors = fib.slice(0, stepsCount);
  } else if (strategy === 'CONSERVATIVE_5STEP') {
    stepFactors = Array.from({ length: stepsCount }, (_, idx) => 1 + idx * 0.1);
  } else {
    // Standard / Equal distribution or very slight progression
    // If user chose 2 steps, each step recovers ~50% of the loss
    // If 3 steps, each step recovers ~33.3% of the loss
    stepFactors = Array.from({ length: stepsCount }, () => 1);
  }

  const factorSum = stepFactors.reduce((a, b) => a + b, 0);
  const basePortion = activeLoss / factorSum;

  for (let i = 0; i < stepsCount; i++) {
    const factor = stepFactors[i];
    const portionLoss = basePortion * factor;

    // Direct mathematical sizing:
    // Profit needed to recover this step's loss slice = portionLoss
    // Required Trade Size = portionLoss / effectiveRR
    let calculatedTrade = portionLoss / effectiveRR;

    // Apply strict safety cap so a single trade never blows the account
    calculatedTrade = Math.min(calculatedTrade, maxSafeRisk);
    calculatedTrade = Math.max(1, Math.round(calculatedTrade));

    const finalTargetProfit = Number((calculatedTrade * effectiveRR).toFixed(1));

    let status: 'PENDING' | 'CURRENT' | 'COMPLETED' = 'PENDING';
    if (i < currentStepIndex) {
      status = 'COMPLETED';
    } else if (i === currentStepIndex) {
      status = 'CURRENT';
    }

    stepDetails.push({
      stepNumber: i + 1,
      suggestedAmount: calculatedTrade,
      targetProfit: finalTargetProfit,
      targetRR: `1 : ${riskRewardRatio}`,
      status,
    });
  }

  const clampedIndex = Math.min(currentStepIndex, stepDetails.length - 1);
  const currentStep = stepDetails[clampedIndex] || stepDetails[0];
  const finalAmount = currentStep.suggestedAmount;
  const stepTarget = Math.round(basePortion * stepFactors[clampedIndex]);

  const yieldAmount = Number(((finalAmount * yieldRatePercent) / 100).toFixed(2));
  const riskPct = Number(((finalAmount / tradingCapital) * 100).toFixed(1));

  return {
    recommendation: {
      amount: finalAmount,
      stepNumber: clampedIndex + 1,
      totalSteps: stepsCount,
      isRecoveryMode: true,
      targetProfit: currentStep.targetProfit,
      targetRiskReward: `1 : ${riskRewardRatio}`,
      walletYieldWillAdd: yieldAmount,
      riskPercentOfCapital: riskPct,
      stepLossTarget: stepTarget,
      consecutiveLossCount,
      reason: `Step ${clampedIndex + 1}/${stepsCount} Recovery: Calculated strictly to recover ₹${stepTarget} of your ₹${Math.round(
        activeLoss
      )} loss at 1:${riskRewardRatio} R:R.`,
      reasonHindi: `स्टेप ${clampedIndex + 1}/${stepsCount} रिकवरी: ₹${Math.round(
        activeLoss
      )} के लॉस में से ₹${stepTarget} को 1:${riskRewardRatio} R:R पर सीधे रिकवर करने की साइज़िंग।`,
    },
    stepDetails,
  };
}
