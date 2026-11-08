/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ApplicantInfo,
  VehicleInfo,
  DrivingHistory,
  SecurityAndRisk,
  RiskAssessmentResult,
  RiskDriverItem,
  MarketPricingConfig,
} from '../types/insurance';

export function calculateRiskAssessment(
  applicant: ApplicantInfo,
  vehicle: VehicleInfo,
  history: DrivingHistory,
  security: SecurityAndRisk,
  marketConfig: MarketPricingConfig
): RiskAssessmentResult {
  const driversIncreasing: RiskDriverItem[] = [];
  const driversDecreasing: RiskDriverItem[] = [];

  // 1. DRIVER PROFILE SCORE (Max: 25)
  // Base driver score centered around 12
  let driverRaw = 12;

  // Age evaluation
  if (applicant.age < 21) {
    driverRaw += 10;
    driversIncreasing.push({
      factor: 'Young Driver Age (<21)',
      impact: 'Statistically higher collision frequency in demographic risk tables',
      weight: 12,
      direction: 'increase',
    });
  } else if (applicant.age < 25) {
    driverRaw += 6;
    driversIncreasing.push({
      factor: 'Driver Under 25',
      impact: 'Elevated baseline loss frequency cohort',
      weight: 7,
      direction: 'increase',
    });
  } else if (applicant.age >= 30 && applicant.age <= 65) {
    driverRaw -= 4;
    driversDecreasing.push({
      factor: 'Mature Experienced Driver (30-65)',
      impact: 'Lowest historical motor accident loss frequency bracket',
      weight: 6,
      direction: 'decrease',
    });
  } else if (applicant.age > 70) {
    driverRaw += 5;
    driversIncreasing.push({
      factor: 'Senior Driver (>70)',
      impact: 'Moderate increase in physical response and severity metrics',
      weight: 5,
      direction: 'increase',
    });
  }

  // Driving experience
  if (applicant.yearsOfDriving < 2) {
    driverRaw += 6;
    driversIncreasing.push({
      factor: 'Novice Driver (<2 yrs experience)',
      impact: 'Higher probability of maneuvering and hazard misjudgments',
      weight: 8,
      direction: 'increase',
    });
  } else if (applicant.yearsOfDriving >= 10) {
    driverRaw -= 4;
    driversDecreasing.push({
      factor: '10+ Years Driving Experience',
      impact: 'Proven road handling and situational defensive competence',
      weight: 6,
      direction: 'decrease',
    });
  }

  const driverScore = Math.max(2, Math.min(25, Math.round(driverRaw)));

  // 2. VEHICLE HAZARD SCORE (Max: 20)
  let vehicleRaw = 10;
  const currentYear = new Date().getFullYear();
  const vehicleAge = Math.max(0, currentYear - vehicle.year);

  if (vehicle.vehicleType === 'luxury') {
    vehicleRaw += 7;
    driversIncreasing.push({
      factor: 'Luxury / Exotic Class Vehicle',
      impact: 'Substantially higher parts replacement and specialized workshop costs',
      weight: 8,
      direction: 'increase',
    });
  } else if (vehicle.vehicleType === 'commercial_van' || vehicle.usage === 'commercial') {
    vehicleRaw += 6;
    driversIncreasing.push({
      factor: 'Commercial Vehicle Exposure',
      impact: 'Higher operational road duty cycles and loading stress',
      weight: 7,
      direction: 'increase',
    });
  } else if (vehicle.vehicleType === 'sedan' || vehicle.vehicleType === 'hatchback') {
    vehicleRaw -= 2;
    driversDecreasing.push({
      factor: 'Standard Passenger Vehicle Classification',
      impact: 'Readily available OEM replacement parts and stable loss ratios',
      weight: 4,
      direction: 'decrease',
    });
  }

  if (vehicle.engineCapacityCc >= 3000) {
    vehicleRaw += 4;
    driversIncreasing.push({
      factor: 'High Engine Capacity (≥3.0L)',
      impact: 'Elevated power-to-weight performance hazard',
      weight: 5,
      direction: 'increase',
    });
  }

  if (vehicleAge > 12) {
    vehicleRaw += 4;
    driversIncreasing.push({
      factor: 'Vehicle Age > 12 Years',
      impact: 'Depreciated structural safety systems and higher mechanical failure rate',
      weight: 4,
      direction: 'increase',
    });
  }

  const vehicleScore = Math.max(2, Math.min(20, Math.round(vehicleRaw)));

  // 3. CLAIMS & VIOLATION HISTORY (Max: 30)
  let claimsRaw = 6; // Clean driver baseline

  if (history.previousAccidents > 0) {
    const accPoints = Math.min(18, history.previousAccidents * 9);
    claimsRaw += accPoints;
    driversIncreasing.push({
      factor: `${history.previousAccidents} Prior At-Fault Accident(s)`,
      impact: 'Direct empirical indicator of recurrence probability',
      weight: accPoints,
      direction: 'increase',
    });
  }

  if (history.previousClaims > 0) {
    const clmPoints = Math.min(12, history.previousClaims * 6);
    claimsRaw += clmPoints;
    driversIncreasing.push({
      factor: `${history.previousClaims} Prior Insurance Claim(s)`,
      impact: 'Historical claims propensity loading',
      weight: clmPoints,
      direction: 'increase',
    });
  }

  if (history.violations > 0) {
    const violPoints = Math.min(12, history.violations * 6);
    claimsRaw += violPoints;
    driversIncreasing.push({
      factor: `${history.violations} Traffic Violation(s)`,
      impact: 'Non-compliance regulatory penalty factor',
      weight: violPoints,
      direction: 'increase',
    });
  }

  if (history.noClaimsYears >= 3) {
    const ncdPoints = Math.min(8, history.noClaimsYears * 2);
    claimsRaw -= ncdPoints;
    driversDecreasing.push({
      factor: `${history.noClaimsYears}-Year Verified No-Claims History`,
      impact: 'High-performing risk profile bonus deduction',
      weight: ncdPoints,
      direction: 'decrease',
    });
  }

  const claimsScore = Math.max(1, Math.min(30, Math.round(claimsRaw)));

  // 4. SECURITY & ENVIRONMENT SCORE (Max: 15)
  let secRaw = 8;

  if (security.parkingLocation === 'garage') {
    secRaw -= 4;
    driversDecreasing.push({
      factor: 'Secure Locked Garage Overnight Parking',
      impact: 'Minimizes opportunistic theft, malicious damage and weather perils',
      weight: 5,
      direction: 'decrease',
    });
  } else if (security.parkingLocation === 'street_unsecured') {
    secRaw += 4;
    driversIncreasing.push({
      factor: 'Unsecured Public Street Overnight Parking',
      impact: 'Vulnerability to side-swipe collisions, vandalism and auto theft',
      weight: 5,
      direction: 'increase',
    });
  }

  if (security.hasAntiTheftDevice || security.securityFeatures.includes('GPS Tracker') || security.securityFeatures.includes('Immobilizer')) {
    secRaw -= 3;
    driversDecreasing.push({
      factor: 'Active Anti-Theft / Telematics Tracking System',
      impact: 'Enhanced vehicle recovery rate and reduced total loss probability',
      weight: 5,
      direction: 'decrease',
    });
  }

  if (security.drivingEnvironment === 'urban_heavy') {
    secRaw += 3;
    driversIncreasing.push({
      factor: 'Heavy Urban Traffic Density Operating Zone',
      impact: 'Elevated rush-hour congestion and fender-bender frequency',
      weight: 4,
      direction: 'increase',
    });
  } else if (security.drivingEnvironment === 'rural') {
    secRaw -= 2;
    driversDecreasing.push({
      factor: 'Rural Low-Density Driving Environment',
      impact: 'Significantly fewer multi-vehicle intersection conflicts',
      weight: 3,
      direction: 'decrease',
    });
  }

  const securityScore = Math.max(1, Math.min(15, Math.round(secRaw)));

  // 5. MILEAGE & USAGE EXPOSURE (Max: 10)
  let mileageRaw = 5;

  if (vehicle.annualMileage > 20000) {
    mileageRaw += 4;
    driversIncreasing.push({
      factor: `High Annual Exposure (${vehicle.annualMileage.toLocaleString()} km/mi/yr)`,
      impact: 'Direct linear exposure increase per cumulative road mile traveled',
      weight: 4,
      direction: 'increase',
    });
  } else if (vehicle.annualMileage < 6000) {
    mileageRaw -= 3;
    driversDecreasing.push({
      factor: `Low Annual Mileage (<6,000 km/mi/yr)`,
      impact: 'Restricted road exposure substantially reduces loss likelihood',
      weight: 4,
      direction: 'decrease',
    });
  }

  const mileageScore = Math.max(1, Math.min(10, Math.round(mileageRaw)));

  // TOTAL NORMALIZED RISK SCORE (0 - 100)
  const totalScore = Math.max(0, Math.min(100, driverScore + vehicleScore + claimsScore + securityScore + mileageScore));

  // CLASSIFICATION
  let riskClassification: 'Low' | 'Medium' | 'High' = 'Medium';
  if (totalScore < marketConfig.lowRiskThreshold) {
    riskClassification = 'Low';
  } else if (totalScore >= marketConfig.mediumRiskThreshold) {
    riskClassification = 'High';
  }

  // ACTIONABLE RECOMMENDATIONS
  const recommendations: string[] = [];
  if (security.parkingLocation === 'street_unsecured' || security.parkingLocation === 'street_residential') {
    recommendations.push('Transfer overnight parking to an enclosed garage or gated driveway to gain up to an 8% security risk discount.');
  }
  if (!security.hasAntiTheftDevice) {
    recommendations.push('Install a certified Thatcham/NAICOM recognized GPS tracker and immobilizer to qualify for anti-theft premium credit.');
  }
  if (vehicle.annualMileage > 15000) {
    recommendations.push('Enrol in a verified low-mileage or telematics driving program if annual commute routes reduce.');
  }
  if (history.previousAccidents > 0 || history.violations > 0) {
    recommendations.push('Complete an approved advanced defensive driving certification to offset past violation points.');
  }
  if (recommendations.length < 3) {
    recommendations.push('Maintain an active consecutive policy history to accumulate maximum No-Claims Discount (NCD) bonuses.');
    recommendations.push('Opt for a higher voluntary excess/deductible to immediately lower annual gross premium commitments.');
  }

  // ML-READINESS ARCHITECTURE
  // Structure simulated Generalized Linear Models (GLM) for Frequency & Severity
  // Poisson Log-Link: ln(λ) = β0 + β1*Age + β2*Claims + ...
  const lambdaBase = marketConfig.baseFrequencyComprehensive;
  const scoreMultiplier = Math.exp((totalScore - 50) / 45); // Exponential actuarial relativity curve
  const simulatedLambda = Math.max(0.02, Math.min(0.40, Number((lambdaBase * scoreMultiplier).toFixed(4))));

  // Gamma Severity Model: E[Y] = S0 * vehicleValueRatio * severityMultiplier
  const baseSev = vehicle.vehicleValue * marketConfig.baseSeverityPercent;
  const simulatedGammaExpected = Math.round(baseSev * (0.85 + (totalScore / 100) * 0.4));
  const tweedieEstimate = Math.round(simulatedLambda * simulatedGammaExpected);

  return {
    overallScore: totalScore,
    riskClassification,
    scoreBreakdown: {
      driverProfile: {
        score: driverScore,
        max: 25,
        label: 'Driver Age & Experience',
        details: `${applicant.age} yrs old, ${applicant.yearsOfDriving} yrs driving`,
      },
      vehicleHazard: {
        score: vehicleScore,
        max: 20,
        label: 'Vehicle Performance & Type',
        details: `${vehicle.vehicleType.toUpperCase()}, ${vehicle.engineCapacityCc}cc, ${vehicleAge} yrs old`,
      },
      claimsHistory: {
        score: claimsScore,
        max: 30,
        label: 'Historical Claims & Violations',
        details: `${history.previousAccidents} accidents, ${history.previousClaims} claims, ${history.noClaimsYears} yrs NCD`,
      },
      securityEnvironment: {
        score: securityScore,
        max: 15,
        label: 'Security & Parking Exposure',
        details: `${security.parkingLocation.replace('_', ' ')}, ${security.drivingEnvironment}`,
      },
      mileageUsage: {
        score: mileageScore,
        max: 10,
        label: 'Annual Mileage & Duty',
        details: `${vehicle.annualMileage.toLocaleString()} km/mi/yr, ${vehicle.usage}`,
      },
    },
    riskDriversIncreasing: driversIncreasing.sort((a, b) => b.weight - a.weight).slice(0, 4),
    riskDriversDecreasing: driversDecreasing.sort((a, b) => b.weight - a.weight).slice(0, 4),
    recommendations: recommendations.slice(0, 4),
    mlReadiness: {
      glmPoissonFrequencyLambda: simulatedLambda,
      glmGammaSeverityExpected: simulatedGammaExpected,
      tweediePurePremiumEstimate: tweedieEstimate,
      modelConfidenceInterval: [Math.round(tweedieEstimate * 0.88), Math.round(tweedieEstimate * 1.14)],
      featureAttributions: [
        { feature: 'Historical Claims & Accidents', shapImportance: 0.34 },
        { feature: 'Driver Age & Licensure Years', shapImportance: 0.26 },
        { feature: 'Vehicle Physical Classification', shapImportance: 0.18 },
        { feature: 'Overnight Parking & Security Tech', shapImportance: 0.12 },
        { feature: 'Annual Mileage Road Exposure', shapImportance: 0.10 },
      ],
    },
    disclaimer:
      'This is an illustrative insurance risk assessment generated using deterministic prototype algorithms and actuarial relativities. It is an educational tool and does not constitute a certified underwriter policy warranty or binding commercial insurance score.',
  };
}
