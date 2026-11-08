/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ApplicantInfo,
  VehicleInfo,
  DrivingHistory,
  SecurityAndRisk,
  CoveragePreferences,
  MarketPricingConfig,
  RiskAssessmentResult,
  PremiumBreakdown,
  StatutoryChargeItem,
} from '../types/insurance';

export function calculateActuarialPremium(
  applicant: ApplicantInfo,
  vehicle: VehicleInfo,
  history: DrivingHistory,
  security: SecurityAndRisk,
  coverage: CoveragePreferences,
  riskAssessment: RiskAssessmentResult,
  marketConfig: MarketPricingConfig
): PremiumBreakdown {
  const riskScore = riskAssessment.overallScore;

  // 1. RISK SCORE RELATIVITY (Actuarial adjustment centered at score 50)
  // Low risk (e.g. 25) -> relativity ~0.65; High risk (e.g. 80) -> relativity ~1.65
  const riskRelativity = Math.max(0.45, Math.min(2.5, 0.5 + (riskScore / 50) * 0.5));

  // 2. EXPECTED CLAIM FREQUENCY (λ)
  let claimFrequency = 0;
  if (coverage.coverageType === 'COMPREHENSIVE') {
    claimFrequency = marketConfig.baseFrequencyComprehensive * riskRelativity;
  } else if (coverage.coverageType === 'THIRD_PARTY_FIRE_THEFT') {
    claimFrequency = marketConfig.baseFrequencyComprehensive * 0.58 * riskRelativity;
  } else {
    // THIRD_PARTY only
    claimFrequency = marketConfig.baseFrequencyComprehensive * 0.38 * riskRelativity;
  }

  // Mileage adjustment to frequency (exposure units)
  const mileageFactor = Math.max(0.7, Math.min(1.4, vehicle.annualMileage / 12000));
  claimFrequency = claimFrequency * (0.8 + 0.2 * mileageFactor);

  // Round frequency to 4 decimals
  claimFrequency = Math.max(0.015, Math.min(0.55, Number(claimFrequency.toFixed(4))));

  // 3. EXPECTED CLAIM SEVERITY (S)
  let claimSeverity = 0;
  const insuredVal = Math.max(1000, coverage.insuredValue || vehicle.vehicleValue);

  if (coverage.coverageType === 'COMPREHENSIVE') {
    // Expected severity is a percentage of vehicle value plus third party liability component
    const baseSev = insuredVal * marketConfig.baseSeverityPercent;
    // Luxury or high performance vehicles carry higher repair severity
    const typeSeverityMultiplier =
      vehicle.vehicleType === 'luxury'
        ? 1.35
        : vehicle.vehicleType === 'suv'
        ? 1.15
        : vehicle.vehicleType === 'commercial_van'
        ? 1.2
        : 1.0;
    claimSeverity = Math.round(baseSev * typeSeverityMultiplier);
  } else if (coverage.coverageType === 'THIRD_PARTY_FIRE_THEFT') {
    // Partial loss fire/theft + third party property
    claimSeverity = Math.round(insuredVal * (marketConfig.baseSeverityPercent * 0.65));
  } else {
    // THIRD_PARTY only: loss is statutory liability, not own damage
    claimSeverity = Math.round(marketConfig.thirdPartyBaseCost * 4.2 * (0.8 + (riskScore / 100) * 0.4));
  }

  // Ensure severity is at least minimum threshold
  claimSeverity = Math.max(Math.round(marketConfig.thirdPartyBaseCost * 0.8), claimSeverity);

  // 4. PURE PREMIUM (Expected Claims Cost = Frequency × Severity)
  let purePremium = Math.round(claimFrequency * claimSeverity);

  // If Third Party, ensure pure premium aligns with statutory minimum baseline
  if (coverage.coverageType === 'THIRD_PARTY') {
    purePremium = Math.max(Math.round(marketConfig.thirdPartyBaseCost * riskRelativity), purePremium);
  }

  // 5. DEDUCTIBLE / EXCESS ADJUSTMENT
  // Higher deductible absorbs small claims, reducing insurer expected loss
  let deductibleCredit = 0;
  if (coverage.deductibleAmount > 0 && coverage.coverageType !== 'THIRD_PARTY') {
    const deductibleRatio = coverage.deductibleAmount / insuredVal;
    // Discount up to 18% for substantial excess
    const discountPercent = Math.min(0.18, deductibleRatio * 1.5);
    deductibleCredit = Math.round(purePremium * discountPercent);
    purePremium = Math.max(Math.round(purePremium * 0.7), purePremium - deductibleCredit);
  }

  // 6. OPTIONAL ADD-ONS (Flat Pure Risk Additions)
  let addonsCost = 0;
  if (coverage.optionalAddons && coverage.optionalAddons.length > 0) {
    coverage.optionalAddons.forEach((addon) => {
      if (addon.includes('Flood') || addon.includes('Storm')) {
        addonsCost += marketConfig.countryCode === 'NG' ? 6500 : 45;
      } else if (addon.includes('Excess Buy-Back')) {
        addonsCost += marketConfig.countryCode === 'NG' ? 10000 : 70;
      } else if (addon.includes('Roadside') || addon.includes('Breakdown')) {
        addonsCost += marketConfig.countryCode === 'NG' ? 8000 : 40;
      } else if (addon.includes('Legal') || addon.includes('Defense')) {
        addonsCost += marketConfig.countryCode === 'NG' ? 5000 : 30;
      } else if (addon.includes('Medical')) {
        addonsCost += marketConfig.countryCode === 'NG' ? 4500 : 25;
      }
    });
  }
  purePremium += addonsCost;

  // 7. FIXED EXPENSES
  const fixedExpenses = Math.round(marketConfig.fixedExpenses);

  // 8. REINSURANCE LOADING
  // Reinsurance layer covers catastrophic and shock losses
  const reinsuranceCost = Math.round(purePremium * marketConfig.reinsuranceLoadingRatio);

  // 9. GROSS PREMIUM BEFORE STATUTORY CHARGES
  // Formula: Gross Premium = (Expected Claims Cost + Fixed Expenses + Reinsurance Cost) / (1 - Variable Expense Ratio - Risk Loading Ratio)
  const variableRatio = Math.max(0.01, Math.min(0.35, marketConfig.variableExpenseRatio));
  const riskLoadingRatio = Math.max(0.01, Math.min(0.25, marketConfig.riskProfitLoadingRatio));
  
  // Safe denominator validation (must be > 0.05 to avoid division instability)
  const denominator = Math.max(0.1, 1 - variableRatio - riskLoadingRatio);
  
  const numerator = purePremium + fixedExpenses + reinsuranceCost;
  const grossBeforeStatutory = Math.round(numerator / denominator);

  const variableExpenses = Math.round(grossBeforeStatutory * variableRatio);
  const riskAndProfitLoading = Math.round(grossBeforeStatutory * riskLoadingRatio);

  // 10. STATUTORY CHARGES & LEVIES
  const statutoryChargesBreakdown: StatutoryChargeItem[] = [];
  let totalStatutory = 0;

  if (marketConfig.statutoryCharges && marketConfig.statutoryCharges.length > 0) {
    marketConfig.statutoryCharges.forEach((charge) => {
      let chargeAmt = 0;
      let rateStr = '';
      if (charge.ratePercent) {
        chargeAmt = Math.round((grossBeforeStatutory * charge.ratePercent) / 100);
        rateStr = `${charge.ratePercent}%`;
      } else if (charge.flatAmount) {
        chargeAmt = charge.flatAmount;
        rateStr = `${marketConfig.currencySymbol}${charge.flatAmount.toLocaleString()}`;
      }
      totalStatutory += chargeAmt;
      statutoryChargesBreakdown.push({
        name: charge.name,
        amount: chargeAmt,
        rateStr,
      });
    });
  }

  // 11. FINAL ESTIMATED AMOUNT PAYABLE
  let finalGrossPremium = grossBeforeStatutory + totalStatutory;

  // Pro-rate if policy duration is different from 12 months
  if (coverage.policyDurationMonths && coverage.policyDurationMonths !== 12) {
    const prorata = coverage.policyDurationMonths / 12;
    finalGrossPremium = Math.round(finalGrossPremium * prorata);
  }

  return {
    claimFrequency,
    claimSeverity,
    purePremium,
    fixedExpenses,
    reinsuranceCost,
    variableExpenses,
    riskAndProfitLoading,
    deductibleCredit,
    grossPremiumBeforeStatutory: grossBeforeStatutory,
    statutoryChargesBreakdown,
    totalStatutoryCharges: totalStatutory,
    finalGrossPremium,
  };
}
