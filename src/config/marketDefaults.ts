/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MarketPricingConfig } from '../types/insurance';

export const DEFAULT_NIGERIA_CONFIG: MarketPricingConfig = {
  countryCode: 'NG',
  countryName: 'Nigeria',
  currencyCode: 'NGN',
  currencySymbol: '₦',
  baseFrequencyComprehensive: 0.075, // 7.5% expected annual claim incidence
  baseSeverityPercent: 0.18,          // 18% of vehicle value average comprehensive repair/loss
  thirdPartyBaseCost: 15000,          // NAICOM statutory liability baseline
  fixedExpenses: 12000,               // ₦12,000 fixed administrative, certificate & portal fees
  variableExpenseRatio: 0.14,         // 14% commissions, processing & underwriting acquisition
  riskProfitLoadingRatio: 0.09,       // 9% target underwriting profit margin
  reinsuranceLoadingRatio: 0.035,     // 3.5% catastrophe and quota share reinsurance treaty
  statutoryCharges: [
    {
      name: 'NAICOM Regulatory Levy',
      ratePercent: 1.0,
      description: 'National Insurance Commission statutory supervision charge',
    },
    {
      name: 'Nigeria Police Trust Fund Levy',
      flatAmount: 500,
      description: 'Statutory national security contribution levy',
    },
    {
      name: 'Electronic Stamp Duty',
      flatAmount: 500,
      description: 'Federal Inland Revenue Service documentation stamp',
    },
  ],
  lowRiskThreshold: 40,
  mediumRiskThreshold: 70,
  quotationValidityDays: 30,
  modelVersion: 'NG-ACT-v2.6',
  lastUpdated: '2026-11-01',
};

export const DEFAULT_UK_CONFIG: MarketPricingConfig = {
  countryCode: 'GB',
  countryName: 'United Kingdom',
  currencyCode: 'GBP',
  currencySymbol: '£',
  baseFrequencyComprehensive: 0.095, // 9.5% annual motor claim frequency
  baseSeverityPercent: 0.22,          // 22% average severity reflecting UK repair and credit hire
  thirdPartyBaseCost: 280,            // £280 baseline statutory Road Traffic Act liability
  fixedExpenses: 65,                  // £65 policy administration, MID registration & credit validation
  variableExpenseRatio: 0.16,         // 16% broker distribution and aggregators cost
  riskProfitLoadingRatio: 0.08,       // 8% target underwriting return on capital
  reinsuranceLoadingRatio: 0.04,      // 4% motor excess of loss protection
  statutoryCharges: [
    {
      name: 'Insurance Premium Tax (IPT)',
      ratePercent: 12.0,
      description: 'HMRC statutory motor insurance tax at standard 12% rate',
    },
    {
      name: 'FSCS & MIB Uninsured Drivers Levy',
      flatAmount: 18,
      description: 'Financial Services Compensation Scheme & Motor Insurers Bureau levy',
    },
  ],
  lowRiskThreshold: 40,
  mediumRiskThreshold: 70,
  quotationValidityDays: 30,
  modelVersion: 'UK-ACT-v3.1',
  lastUpdated: '2026-11-01',
};

export const DEFAULT_MARKET_CONFIGS: Record<'NG' | 'GB', MarketPricingConfig> = {
  NG: DEFAULT_NIGERIA_CONFIG,
  GB: DEFAULT_UK_CONFIG,
};
