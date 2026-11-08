/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CountryCode,
  InsuranceApplicationRecord,
  MarketPricingConfig,
  QuotationStatus,
} from '../types/insurance';
import { DEFAULT_MARKET_CONFIGS } from '../config/marketDefaults';
import { calculateRiskAssessment } from '../engines/riskAssessmentEngine';
import { calculateActuarialPremium } from '../engines/actuarialPricingEngine';

const STORAGE_KEYS = {
  APPLICATIONS: 'mip_applications_v2',
  MARKET_CONFIGS: 'mip_market_configs_v2',
  ADMIN_MODE: 'mip_admin_mode_v2',
};

// Generates 8 realistic demo applications (4 Nigerian, 4 UK)
function generateSeedDemoRecords(): InsuranceApplicationRecord[] {
  const seedInputs = [
    {
      id: 'MIP-2026-NG-1042',
      createdAt: '2026-11-02T10:15:00.000Z',
      status: 'Estimated' as QuotationStatus,
      applicant: {
        fullName: 'Chukwuma Adeyemi',
        email: 'c.adeyemi@example.ng',
        phone: '+234 803 555 0192',
        age: 38,
        country: 'NG' as CountryCode,
        stateOrRegion: 'Lagos State',
        city: 'Ikeja',
        yearsOfDriving: 14,
      },
      vehicle: {
        make: 'Toyota',
        model: 'Corolla 1.8 Elegance',
        year: 2021,
        vehicleType: 'sedan' as const,
        vehicleValue: 14500000, // ₦14.5M
        engineCapacityCc: 1800,
        transmission: 'automatic' as const,
        fuelType: 'petrol' as const,
        usage: 'private' as const,
        annualMileage: 11500,
      },
      drivingHistory: {
        previousAccidents: 0,
        previousClaims: 0,
        totalClaimsValue: 0,
        violations: 0,
        previousCoverage: true,
        noClaimsYears: 5,
      },
      security: {
        parkingLocation: 'garage' as const,
        hasAntiTheftDevice: true,
        securityFeatures: ['GPS Tracker', 'Immobilizer'],
        usageFrequency: 'daily' as const,
        drivingEnvironment: 'suburban' as const,
      },
      coverage: {
        coverageType: 'COMPREHENSIVE' as const,
        insuredValue: 14500000,
        policyDurationMonths: 12,
        deductibleAmount: 100000,
        optionalAddons: ['Flood & Storm Extension'],
      },
    },
    {
      id: 'MIP-2026-NG-2189',
      createdAt: '2026-11-04T14:30:00.000Z',
      status: 'Under Review' as QuotationStatus,
      applicant: {
        fullName: 'Folashade Balogun',
        email: 'f.balogun@logistics.ng',
        phone: '+234 812 444 8821',
        age: 23,
        country: 'NG' as CountryCode,
        stateOrRegion: 'Abuja FCT',
        city: 'Maitama',
        yearsOfDriving: 2,
      },
      vehicle: {
        make: 'Lexus',
        model: 'RX 350 Luxury AWD',
        year: 2023,
        vehicleType: 'luxury' as const,
        vehicleValue: 38000000, // ₦38M
        engineCapacityCc: 3500,
        transmission: 'automatic' as const,
        fuelType: 'petrol' as const,
        usage: 'private' as const,
        annualMileage: 18000,
      },
      drivingHistory: {
        previousAccidents: 1,
        previousClaims: 1,
        totalClaimsValue: 1200000,
        violations: 1,
        previousCoverage: true,
        noClaimsYears: 0,
      },
      security: {
        parkingLocation: 'driveway' as const,
        hasAntiTheftDevice: true,
        securityFeatures: ['GPS Tracker'],
        usageFrequency: 'daily' as const,
        drivingEnvironment: 'urban_heavy' as const,
      },
      coverage: {
        coverageType: 'COMPREHENSIVE' as const,
        insuredValue: 38000000,
        policyDurationMonths: 12,
        deductibleAmount: 250000,
        optionalAddons: ['Flood & Storm Extension', 'Excess Buy-Back'],
      },
    },
    {
      id: 'MIP-2026-NG-3410',
      createdAt: '2026-11-05T09:00:00.000Z',
      status: 'Draft' as QuotationStatus,
      applicant: {
        fullName: 'Emeka Nwosu',
        email: 'e.nwosu@consulting.ng',
        phone: '+234 809 333 7712',
        age: 46,
        country: 'NG' as CountryCode,
        stateOrRegion: 'Rivers State',
        city: 'Port Harcourt',
        yearsOfDriving: 19,
      },
      vehicle: {
        make: 'Toyota',
        model: 'Hilux Double Cabin 4x4',
        year: 2019,
        vehicleType: 'pickup' as const,
        vehicleValue: 22000000,
        engineCapacityCc: 2700,
        transmission: 'manual' as const,
        fuelType: 'diesel' as const,
        usage: 'commercial' as const,
        annualMileage: 24000,
      },
      drivingHistory: {
        previousAccidents: 0,
        previousClaims: 1,
        totalClaimsValue: 450000,
        violations: 0,
        previousCoverage: true,
        noClaimsYears: 3,
      },
      security: {
        parkingLocation: 'driveway' as const,
        hasAntiTheftDevice: true,
        securityFeatures: ['GPS Tracker', 'Steering Lock'],
        usageFrequency: 'business_fleet' as const,
        drivingEnvironment: 'highway_commute' as const,
      },
      coverage: {
        coverageType: 'THIRD_PARTY_FIRE_THEFT' as const,
        insuredValue: 22000000,
        policyDurationMonths: 12,
        deductibleAmount: 150000,
        optionalAddons: ['Roadside Assistance'],
      },
    },
    {
      id: 'MIP-2026-NG-4081',
      createdAt: '2026-11-06T16:20:00.000Z',
      status: 'Estimated' as QuotationStatus,
      applicant: {
        fullName: 'Amina Danjuma',
        email: 'amina.d@fintech.ng',
        phone: '+234 705 222 9901',
        age: 29,
        country: 'NG' as CountryCode,
        stateOrRegion: 'Kano State',
        city: 'Kano Municipal',
        yearsOfDriving: 7,
      },
      vehicle: {
        make: 'Hyundai',
        model: 'Elantra GLS',
        year: 2018,
        vehicleType: 'sedan' as const,
        vehicleValue: 9800000,
        engineCapacityCc: 1600,
        transmission: 'automatic' as const,
        fuelType: 'petrol' as const,
        usage: 'private' as const,
        annualMileage: 8500,
      },
      drivingHistory: {
        previousAccidents: 0,
        previousClaims: 0,
        totalClaimsValue: 0,
        violations: 0,
        previousCoverage: true,
        noClaimsYears: 4,
      },
      security: {
        parkingLocation: 'garage' as const,
        hasAntiTheftDevice: false,
        securityFeatures: ['Steering Lock'],
        usageFrequency: 'daily' as const,
        drivingEnvironment: 'suburban' as const,
      },
      coverage: {
        coverageType: 'THIRD_PARTY' as const,
        insuredValue: 9800000,
        policyDurationMonths: 12,
        deductibleAmount: 0,
        optionalAddons: [],
      },
    },
    // UK Applications
    {
      id: 'MIP-2026-GB-5012',
      createdAt: '2026-11-03T11:45:00.000Z',
      status: 'Estimated' as QuotationStatus,
      applicant: {
        fullName: 'Oliver Davies',
        email: 'oliver.davies@ukmail.co.uk',
        phone: '+44 7700 900123',
        age: 34,
        country: 'GB' as CountryCode,
        stateOrRegion: 'Greater London',
        city: 'Richmond',
        yearsOfDriving: 12,
      },
      vehicle: {
        make: 'BMW',
        model: '330e M Sport Touring Plug-in',
        year: 2022,
        vehicleType: 'sedan' as const,
        vehicleValue: 32500, // £32,500
        engineCapacityCc: 1998,
        transmission: 'automatic' as const,
        fuelType: 'hybrid' as const,
        usage: 'private' as const,
        annualMileage: 9500,
      },
      drivingHistory: {
        previousAccidents: 0,
        previousClaims: 0,
        totalClaimsValue: 0,
        violations: 0,
        previousCoverage: true,
        noClaimsYears: 6,
      },
      security: {
        parkingLocation: 'driveway' as const,
        hasAntiTheftDevice: true,
        securityFeatures: ['GPS Tracker', 'Immobilizer', 'Dashcam'],
        usageFrequency: 'daily' as const,
        drivingEnvironment: 'suburban' as const,
      },
      coverage: {
        coverageType: 'COMPREHENSIVE' as const,
        insuredValue: 32500,
        policyDurationMonths: 12,
        deductibleAmount: 250,
        optionalAddons: ['Legal Defense Cover', 'Roadside Assistance'],
      },
    },
    {
      id: 'MIP-2026-GB-6184',
      createdAt: '2026-11-05T13:10:00.000Z',
      status: 'Estimated' as QuotationStatus,
      applicant: {
        fullName: 'Sophie MacLeod',
        email: 'sophie.macleod@edinburgh.scot',
        phone: '+44 7800 910456',
        age: 22,
        country: 'GB' as CountryCode,
        stateOrRegion: 'Scotland',
        city: 'Edinburgh',
        yearsOfDriving: 3,
      },
      vehicle: {
        make: 'Volkswagen',
        model: 'Golf 1.5 TSI Life',
        year: 2020,
        vehicleType: 'hatchback' as const,
        vehicleValue: 16800,
        engineCapacityCc: 1498,
        transmission: 'manual' as const,
        fuelType: 'petrol' as const,
        usage: 'private' as const,
        annualMileage: 11000,
      },
      drivingHistory: {
        previousAccidents: 1,
        previousClaims: 1,
        totalClaimsValue: 1450,
        violations: 1,
        previousCoverage: true,
        noClaimsYears: 1,
      },
      security: {
        parkingLocation: 'street_residential' as const,
        hasAntiTheftDevice: true,
        securityFeatures: ['Immobilizer'],
        usageFrequency: 'daily' as const,
        drivingEnvironment: 'urban_heavy' as const,
      },
      coverage: {
        coverageType: 'COMPREHENSIVE' as const,
        insuredValue: 16800,
        policyDurationMonths: 12,
        deductibleAmount: 400,
        optionalAddons: ['Roadside Assistance'],
      },
    },
    {
      id: 'MIP-2026-GB-7299',
      createdAt: '2026-11-06T15:40:00.000Z',
      status: 'Under Review' as QuotationStatus,
      applicant: {
        fullName: 'Alexander Wright',
        email: 'a.wright@cotswolds.co.uk',
        phone: '+44 7911 123789',
        age: 52,
        country: 'GB' as CountryCode,
        stateOrRegion: 'Gloucestershire',
        city: 'Cheltenham',
        yearsOfDriving: 31,
      },
      vehicle: {
        make: 'Land Rover',
        model: 'Defender 110 D250 SE',
        year: 2023,
        vehicleType: 'suv' as const,
        vehicleValue: 62000,
        engineCapacityCc: 2996,
        transmission: 'automatic' as const,
        fuelType: 'diesel' as const,
        usage: 'private' as const,
        annualMileage: 7500,
      },
      drivingHistory: {
        previousAccidents: 0,
        previousClaims: 0,
        totalClaimsValue: 0,
        violations: 0,
        previousCoverage: true,
        noClaimsYears: 9,
      },
      security: {
        parkingLocation: 'garage' as const,
        hasAntiTheftDevice: true,
        securityFeatures: ['GPS Tracker', 'Immobilizer', 'Steering Lock'],
        usageFrequency: 'occasional' as const,
        drivingEnvironment: 'rural' as const,
      },
      coverage: {
        coverageType: 'COMPREHENSIVE' as const,
        insuredValue: 62000,
        policyDurationMonths: 12,
        deductibleAmount: 500,
        optionalAddons: ['Legal Defense Cover', 'Excess Buy-Back'],
      },
    },
    {
      id: 'MIP-2026-GB-8341',
      createdAt: '2026-11-07T08:25:00.000Z',
      status: 'Draft' as QuotationStatus,
      applicant: {
        fullName: 'Liam Evans',
        email: 'liam.evans@cardiff.wales',
        phone: '+44 7420 456789',
        age: 41,
        country: 'GB' as CountryCode,
        stateOrRegion: 'South Wales',
        city: 'Cardiff',
        yearsOfDriving: 20,
      },
      vehicle: {
        make: 'Ford',
        model: 'Transit Custom 300 Leader',
        year: 2021,
        vehicleType: 'commercial_van' as const,
        vehicleValue: 21500,
        engineCapacityCc: 1995,
        transmission: 'manual' as const,
        fuelType: 'diesel' as const,
        usage: 'commercial' as const,
        annualMileage: 22000,
      },
      drivingHistory: {
        previousAccidents: 0,
        previousClaims: 1,
        totalClaimsValue: 800,
        violations: 0,
        previousCoverage: true,
        noClaimsYears: 4,
      },
      security: {
        parkingLocation: 'driveway' as const,
        hasAntiTheftDevice: true,
        securityFeatures: ['GPS Tracker', 'Steering Lock'],
        usageFrequency: 'business_fleet' as const,
        drivingEnvironment: 'highway_commute' as const,
      },
      coverage: {
        coverageType: 'THIRD_PARTY_FIRE_THEFT' as const,
        insuredValue: 21500,
        policyDurationMonths: 12,
        deductibleAmount: 250,
        optionalAddons: ['Roadside Assistance'],
      },
    },
  ];

  return seedInputs.map((input) => {
    const marketConfig = DEFAULT_MARKET_CONFIGS[input.applicant.country];
    const riskAssessment = calculateRiskAssessment(
      input.applicant,
      input.vehicle,
      input.drivingHistory,
      input.security,
      marketConfig
    );
    const pricing = calculateActuarialPremium(
      input.applicant,
      input.vehicle,
      input.drivingHistory,
      input.security,
      input.coverage,
      riskAssessment,
      marketConfig
    );

    return {
      id: input.id,
      createdAt: input.createdAt,
      updatedAt: input.createdAt,
      status: input.status,
      applicant: input.applicant,
      vehicle: input.vehicle,
      drivingHistory: input.drivingHistory,
      security: input.security,
      coverage: input.coverage,
      riskAssessment,
      pricing,
      marketConfig,
      isDemo: true,
    };
  });
}

export function getStoredMarketConfigs(): Record<CountryCode, MarketPricingConfig> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MARKET_CONFIGS);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        NG: parsed.NG || DEFAULT_MARKET_CONFIGS.NG,
        GB: parsed.GB || DEFAULT_MARKET_CONFIGS.GB,
      };
    }
  } catch (e) {
    console.warn('Failed to load market configs from storage:', e);
  }
  return { ...DEFAULT_MARKET_CONFIGS };
}

export function saveStoredMarketConfigs(configs: Record<CountryCode, MarketPricingConfig>): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MARKET_CONFIGS, JSON.stringify(configs));
  } catch (e) {
    console.error('Failed to save market configs to storage:', e);
  }
}

export function getApplications(): InsuranceApplicationRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.APPLICATIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load applications from storage:', e);
  }

  // Seed default demo applications
  const seed = generateSeedDemoRecords();
  try {
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(seed));
  } catch (e) {
    console.error('Failed to persist seed applications:', e);
  }
  return seed;
}

export function getApplicationById(id: string): InsuranceApplicationRecord | undefined {
  const apps = getApplications();
  return apps.find((app) => app.id === id);
}

export function saveApplication(record: InsuranceApplicationRecord): void {
  const apps = getApplications();
  const existingIdx = apps.findIndex((app) => app.id === record.id);
  if (existingIdx >= 0) {
    apps[existingIdx] = { ...record, updatedAt: new Date().toISOString() };
  } else {
    apps.unshift(record);
  }
  try {
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));
  } catch (e) {
    console.error('Failed to save application to storage:', e);
  }
}

export function updateApplicationStatus(id: string, status: QuotationStatus): void {
  const apps = getApplications();
  const record = apps.find((app) => app.id === id);
  if (record) {
    record.status = status;
    record.updatedAt = new Date().toISOString();
    try {
      localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));
    } catch (e) {
      console.error('Failed to update status in storage:', e);
    }
  }
}

export function deleteApplication(id: string): void {
  const apps = getApplications().filter((app) => app.id !== id);
  try {
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(apps));
  } catch (e) {
    console.error('Failed to delete application:', e);
  }
}

export function resetAllStorageToDemo(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.APPLICATIONS);
    localStorage.removeItem(STORAGE_KEYS.MARKET_CONFIGS);
  } catch (e) {
    console.error('Failed to reset storage:', e);
  }
}

export function exportApplicationsToCSV(): string {
  const apps = getApplications();
  if (apps.length === 0) return '';

  const headers = [
    'Application ID',
    'Created At',
    'Status',
    'Market',
    'Currency',
    'Applicant Name',
    'Email',
    'Age',
    'State / Region',
    'Driving Experience (Yrs)',
    'Vehicle Make',
    'Vehicle Model',
    'Vehicle Year',
    'Vehicle Type',
    'Insured Value',
    'Annual Mileage',
    'Coverage Type',
    'Risk Score',
    'Risk Classification',
    'Expected Claim Frequency',
    'Expected Claim Severity',
    'Pure Premium',
    'Fixed Expenses',
    'Variable Expenses',
    'Reinsurance Loading',
    'Statutory Charges',
    'Final Gross Premium',
    'Is Demo Data',
  ];

  const rows = apps.map((app) => [
    app.id,
    app.createdAt,
    app.status,
    app.applicant.country === 'NG' ? 'Nigeria' : 'United Kingdom',
    app.marketConfig.currencyCode,
    `"${app.applicant.fullName.replace(/"/g, '""')}"`,
    app.applicant.email,
    app.applicant.age,
    `"${app.applicant.stateOrRegion.replace(/"/g, '""')}"`,
    app.applicant.yearsOfDriving,
    app.vehicle.make,
    `"${app.vehicle.model.replace(/"/g, '""')}"`,
    app.vehicle.year,
    app.vehicle.vehicleType,
    app.vehicle.vehicleValue,
    app.vehicle.annualMileage,
    app.coverage.coverageType,
    app.riskAssessment.overallScore,
    app.riskAssessment.riskClassification,
    app.pricing.claimFrequency,
    app.pricing.claimSeverity,
    app.pricing.purePremium,
    app.pricing.fixedExpenses,
    app.pricing.variableExpenses,
    app.pricing.reinsuranceCost,
    app.pricing.totalStatutoryCharges,
    app.pricing.finalGrossPremium,
    app.isDemo ? 'Yes' : 'No',
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
