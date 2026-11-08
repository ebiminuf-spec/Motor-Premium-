/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CountryCode = 'NG' | 'GB';

export type CoverageType = 'THIRD_PARTY' | 'THIRD_PARTY_FIRE_THEFT' | 'COMPREHENSIVE';

export type VehicleUsage = 'private' | 'commercial';

export type Transmission = 'automatic' | 'manual';

export type FuelType = 'petrol' | 'diesel' | 'electric' | 'hybrid';

export type ParkingLocation = 'garage' | 'driveway' | 'street_residential' | 'street_unsecured';

export type DrivingEnvironment = 'urban_heavy' | 'suburban' | 'rural' | 'highway_commute';

export type QuotationStatus = 'Draft' | 'Estimated' | 'Under Review' | 'Expired';

export interface ApplicantInfo {
  fullName: string;
  email: string;
  phone: string;
  age: number;
  country: CountryCode;
  stateOrRegion: string;
  city: string;
  yearsOfDriving: number;
}

export interface VehicleInfo {
  make: string;
  model: string;
  year: number;
  vehicleType: 'sedan' | 'suv' | 'hatchback' | 'pickup' | 'luxury' | 'commercial_van';
  vehicleValue: number;
  engineCapacityCc: number;
  transmission: Transmission;
  fuelType: FuelType;
  usage: VehicleUsage;
  annualMileage: number;
}

export interface DrivingHistory {
  previousAccidents: number;
  previousClaims: number;
  totalClaimsValue: number;
  violations: number;
  previousCoverage: boolean;
  noClaimsYears: number;
}

export interface SecurityAndRisk {
  parkingLocation: ParkingLocation;
  hasAntiTheftDevice: boolean;
  securityFeatures: string[];
  usageFrequency: 'daily' | 'occasional' | 'weekend' | 'business_fleet';
  drivingEnvironment: DrivingEnvironment;
}

export interface CoveragePreferences {
  coverageType: CoverageType;
  insuredValue: number;
  policyDurationMonths: number;
  deductibleAmount: number;
  optionalAddons: string[];
}

export interface StatutoryChargeConfig {
  name: string;
  ratePercent?: number; // e.g. 12 for 12%
  flatAmount?: number;  // fixed fee in local currency
  description: string;
}

export interface MarketPricingConfig {
  countryCode: CountryCode;
  countryName: string;
  currencyCode: string;
  currencySymbol: string;
  baseFrequencyComprehensive: number; // e.g. 0.08
  baseSeverityPercent: number;        // e.g. 0.22 of insured vehicle value
  thirdPartyBaseCost: number;         // flat liability pure risk baseline
  fixedExpenses: number;              // policy admin cost in currency
  variableExpenseRatio: number;       // e.g. 0.15 (15%)
  riskProfitLoadingRatio: number;     // e.g. 0.10 (10%)
  reinsuranceLoadingRatio: number;    // e.g. 0.04 (4%)
  statutoryCharges: StatutoryChargeConfig[];
  lowRiskThreshold: number;           // default 40
  mediumRiskThreshold: number;        // default 70
  quotationValidityDays: number;      // default 30
  modelVersion: string;
  lastUpdated?: string;
}

export interface RiskFactorScore {
  score: number;
  max: number;
  label: string;
  details: string;
}

export interface RiskDriverItem {
  factor: string;
  impact: string;
  weight: number;
  direction: 'increase' | 'decrease';
}

export interface RiskAssessmentResult {
  overallScore: number; // 0 to 100
  riskClassification: 'Low' | 'Medium' | 'High';
  scoreBreakdown: {
    driverProfile: RiskFactorScore;
    vehicleHazard: RiskFactorScore;
    claimsHistory: RiskFactorScore;
    securityEnvironment: RiskFactorScore;
    mileageUsage: RiskFactorScore;
  };
  riskDriversIncreasing: RiskDriverItem[];
  riskDriversDecreasing: RiskDriverItem[];
  recommendations: string[];
  mlReadiness: {
    glmPoissonFrequencyLambda: number;
    glmGammaSeverityExpected: number;
    tweediePurePremiumEstimate: number;
    modelConfidenceInterval: [number, number];
    featureAttributions: Array<{ feature: string; shapImportance: number }>;
  };
  disclaimer: string;
}

export interface StatutoryChargeItem {
  name: string;
  amount: number;
  rateStr: string;
}

export interface PremiumBreakdown {
  claimFrequency: number;
  claimSeverity: number;
  purePremium: number;
  fixedExpenses: number;
  reinsuranceCost: number;
  variableExpenses: number;
  riskAndProfitLoading: number;
  deductibleCredit: number;
  grossPremiumBeforeStatutory: number;
  statutoryChargesBreakdown: StatutoryChargeItem[];
  totalStatutoryCharges: number;
  finalGrossPremium: number;
}

export interface InsuranceApplicationRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: QuotationStatus;
  applicant: ApplicantInfo;
  vehicle: VehicleInfo;
  drivingHistory: DrivingHistory;
  security: SecurityAndRisk;
  coverage: CoveragePreferences;
  riskAssessment: RiskAssessmentResult;
  pricing: PremiumBreakdown;
  marketConfig: MarketPricingConfig;
  isDemo?: boolean;
  notes?: string;
}
