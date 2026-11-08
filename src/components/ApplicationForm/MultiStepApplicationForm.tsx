/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  User,
  Car,
  ShieldAlert,
  Lock,
  FileCheck,
  ClipboardList,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import {
  ApplicantInfo,
  VehicleInfo,
  DrivingHistory,
  SecurityAndRisk,
  CoveragePreferences,
  CountryCode,
  InsuranceApplicationRecord,
  MarketPricingConfig,
} from '../../types/insurance';
import { calculateRiskAssessment } from '../../engines/riskAssessmentEngine';
import { calculateActuarialPremium } from '../../engines/actuarialPricingEngine';
import { saveApplication } from '../../services/storageService';

interface MultiStepApplicationFormProps {
  initialMarket: CountryCode;
  marketConfig: MarketPricingConfig;
  onApplicationCreated: (app: InsuranceApplicationRecord) => void;
  onCancel: () => void;
}

const NIGERIAN_STATES = [
  'Lagos State',
  'Abuja FCT',
  'Rivers State',
  'Kano State',
  'Oyo State',
  'Ogun State',
  'Delta State',
  'Kaduna State',
  'Enugu State',
  'Edo State',
  'Anambra State',
  'Akwa Ibom State',
  'Other State',
];

const UK_REGIONS = [
  'Greater London',
  'South East England',
  'North West England',
  'Scotland',
  'West Midlands',
  'South West England',
  'Yorkshire & Humber',
  'East of England',
  'Wales',
  'Northern Ireland',
];

export const MultiStepApplicationForm: React.FC<MultiStepApplicationFormProps> = ({
  initialMarket,
  marketConfig,
  onApplicationCreated,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form State
  const [applicant, setApplicant] = useState<ApplicantInfo>({
    fullName: '',
    email: '',
    phone: '',
    age: 32,
    country: initialMarket,
    stateOrRegion: initialMarket === 'NG' ? 'Lagos State' : 'Greater London',
    city: '',
    yearsOfDriving: 8,
  });

  const [vehicle, setVehicle] = useState<VehicleInfo>({
    make: '',
    model: '',
    year: 2022,
    vehicleType: 'sedan',
    vehicleValue: initialMarket === 'NG' ? 12000000 : 25000,
    engineCapacityCc: 1800,
    transmission: 'automatic',
    fuelType: 'petrol',
    usage: 'private',
    annualMileage: initialMarket === 'NG' ? 12000 : 8500,
  });

  const [drivingHistory, setDrivingHistory] = useState<DrivingHistory>({
    previousAccidents: 0,
    previousClaims: 0,
    totalClaimsValue: 0,
    violations: 0,
    previousCoverage: true,
    noClaimsYears: 3,
  });

  const [security, setSecurity] = useState<SecurityAndRisk>({
    parkingLocation: 'driveway',
    hasAntiTheftDevice: true,
    securityFeatures: ['GPS Tracker'],
    usageFrequency: 'daily',
    drivingEnvironment: 'suburban',
  });

  const [coverage, setCoverage] = useState<CoveragePreferences>({
    coverageType: 'COMPREHENSIVE',
    insuredValue: initialMarket === 'NG' ? 12000000 : 25000,
    policyDurationMonths: 12,
    deductibleAmount: initialMarket === 'NG' ? 100000 : 250,
    optionalAddons: initialMarket === 'NG' ? ['Flood & Storm Extension'] : ['Legal Defense Cover'],
  });

  const [consentDataProcessing, setConsentDataProcessing] = useState(false);
  const [confirmAccuracy, setConfirmAccuracy] = useState(false);

  const currencySymbol = applicant.country === 'NG' ? '₦' : '£';

  // Step Validation logic
  const validateStep = (step: number): boolean => {
    const errs: Record<string, string> = {};

    if (step === 1) {
      if (!applicant.fullName.trim()) errs.fullName = 'Full legal name is required';
      if (!applicant.email.trim() || !applicant.email.includes('@'))
        errs.email = 'Valid email address is required';
      if (!applicant.phone.trim()) errs.phone = 'Phone contact is required';
      if (!applicant.city.trim()) errs.city = 'City is required';
      if (applicant.age < 18 || applicant.age > 99)
        errs.age = 'Applicant must be between 18 and 99 years of age';
      if (applicant.yearsOfDriving < 0 || applicant.yearsOfDriving > applicant.age - 16)
        errs.yearsOfDriving = 'Driving experience cannot exceed age minus legal driving age (16-18)';
    }

    if (step === 2) {
      if (!vehicle.make.trim()) errs.make = 'Vehicle make is required (e.g. Toyota, Honda, BMW)';
      if (!vehicle.model.trim()) errs.model = 'Vehicle model is required (e.g. Corolla, Civic, 320i)';
      if (vehicle.vehicleValue <= 0) errs.vehicleValue = 'Vehicle value must be greater than zero';
      if (vehicle.engineCapacityCc < 600 || vehicle.engineCapacityCc > 8000)
        errs.engineCapacityCc = 'Engine capacity must be between 600cc and 8,000cc';
      if (vehicle.annualMileage < 500) errs.annualMileage = 'Estimated mileage must be at least 500';
    }

    if (step === 3) {
      if (drivingHistory.previousAccidents < 0) errs.previousAccidents = 'Cannot be negative';
      if (drivingHistory.previousClaims < 0) errs.previousClaims = 'Cannot be negative';
      if (drivingHistory.violations < 0) errs.violations = 'Cannot be negative';
    }

    if (step === 5) {
      if (coverage.coverageType === 'COMPREHENSIVE' && coverage.insuredValue <= 0) {
        errs.insuredValue = 'Insured value is required for Comprehensive coverage';
      }
    }

    if (step === 6) {
      if (!confirmAccuracy) errs.confirmAccuracy = 'You must confirm the truthfulness of the declarations';
      if (!consentDataProcessing) errs.consentDataProcessing = 'Consent to actuarial processing is required';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setErrors({});
      setCurrentStep((prev) => Math.min(6, prev + 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setErrors({});
    setCurrentStep((prev) => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleJumpToStep = (stepNumber: number) => {
    if (stepNumber < currentStep || validateStep(currentStep)) {
      setErrors({});
      setCurrentStep(stepNumber);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSecurityFeatureToggle = (feature: string) => {
    setSecurity((prev) => {
      const exists = prev.securityFeatures.includes(feature);
      return {
        ...prev,
        securityFeatures: exists
          ? prev.securityFeatures.filter((f) => f !== feature)
          : [...prev.securityFeatures, feature],
      };
    });
  };

  const handleAddonToggle = (addon: string) => {
    setCoverage((prev) => {
      const exists = prev.optionalAddons.includes(addon);
      return {
        ...prev,
        optionalAddons: exists
          ? prev.optionalAddons.filter((a) => a !== addon)
          : [...prev.optionalAddons, addon],
      };
    });
  };

  const handleCountryChange = (newCountry: CountryCode) => {
    setApplicant((prev) => ({
      ...prev,
      country: newCountry,
      stateOrRegion: newCountry === 'NG' ? 'Lagos State' : 'Greater London',
    }));

    if (newCountry === 'NG') {
      setVehicle((v) => ({ ...v, vehicleValue: 12000000 }));
      setCoverage((c) => ({ ...c, insuredValue: 12000000, deductibleAmount: 100000 }));
    } else {
      setVehicle((v) => ({ ...v, vehicleValue: 25000 }));
      setCoverage((c) => ({ ...c, insuredValue: 25000, deductibleAmount: 250 }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(6)) return;

    // Generate unique ID
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const appId = `MIP-2026-${applicant.country}-${randomSuffix}`;
    const timestamp = new Date().toISOString();

    // Run calculation engines
    const riskAssessment = calculateRiskAssessment(
      applicant,
      vehicle,
      drivingHistory,
      security,
      marketConfig
    );

    const pricing = calculateActuarialPremium(
      applicant,
      vehicle,
      drivingHistory,
      security,
      coverage,
      riskAssessment,
      marketConfig
    );

    const newApplication: InsuranceApplicationRecord = {
      id: appId,
      createdAt: timestamp,
      updatedAt: timestamp,
      status: 'Estimated',
      applicant,
      vehicle,
      drivingHistory,
      security,
      coverage,
      riskAssessment,
      pricing,
      marketConfig,
      isDemo: false,
    };

    saveApplication(newApplication);
    onApplicationCreated(newApplication);
  };

  const stepsList = [
    { num: 1, label: 'Applicant', icon: User },
    { num: 2, label: 'Vehicle', icon: Car },
    { num: 3, label: 'History', icon: ShieldAlert },
    { num: 4, label: 'Security', icon: Lock },
    { num: 5, label: 'Coverage', icon: FileCheck },
    { num: 6, label: 'Review', icon: ClipboardList },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200">
        <div>
          <div className="text-xs text-slate-500 mb-1">
            <span>Motor Underwriting Portal</span>
            <span aria-hidden="true" className="mx-1.5">·</span>
            <span>Market: {applicant.country === 'NG' ? 'Nigeria (₦)' : 'United Kingdom (£)'}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">New Insurance Application</h1>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors self-start sm:self-auto"
        >
          Cancel and return to dashboard
        </button>
      </div>

      {/* Progress Stepper Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2 z-0" />
          <div
            className="absolute top-1/2 left-0 h-0.5 bg-teal-600 -translate-y-1/2 z-0 transition-all duration-300"
            style={{ width: `${((currentStep - 1) / (stepsList.length - 1)) * 100}%` }}
          />

          {stepsList.map((step) => {
            const isCompleted = currentStep > step.num;
            const isCurrent = currentStep === step.num;
            const StepIcon = step.icon;

            return (
              <button
                key={step.num}
                type="button"
                onClick={() => handleJumpToStep(step.num)}
                className={`relative z-10 flex flex-col items-center group focus:outline-none`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                    isCompleted
                      ? 'bg-teal-600 text-white'
                      : isCurrent
                      ? 'bg-slate-900 text-white ring-4 ring-slate-100'
                      : 'bg-white text-slate-400 border-2 border-slate-300 group-hover:border-slate-400'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : <StepIcon className="w-4 h-4" />}
                </div>
                <span
                  className={`mt-1.5 text-[11px] font-medium hidden sm:block ${
                    isCurrent ? 'text-slate-900 font-semibold' : 'text-slate-500'
                  }`}
                >
                  {step.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Form Container */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 md:p-8">
        {/* STEP 1: PERSONAL INFORMATION */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900">Step 1: Policyholder & Personal Details</h2>
              <p className="text-xs text-slate-500 mt-1">
                Collect essential applicant identity, market territory, and driving licensing history.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Full Legal Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Chukwuma Adeyemi or Oliver Davies"
                  value={applicant.fullName}
                  onChange={(e) => setApplicant({ ...applicant, fullName: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                {errors.fullName && <p className="text-xs text-rose-600">{errors.fullName}</p>}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Email Address *</label>
                <input
                  type="email"
                  placeholder="applicant@example.com"
                  value={applicant.email}
                  onChange={(e) => setApplicant({ ...applicant, email: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                {errors.email && <p className="text-xs text-rose-600">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Telephone / Mobile *</label>
                <input
                  type="tel"
                  placeholder={applicant.country === 'NG' ? '+234 803 123 4567' : '+44 7700 900123'}
                  value={applicant.phone}
                  onChange={(e) => setApplicant({ ...applicant, phone: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                {errors.phone && <p className="text-xs text-rose-600">{errors.phone}</p>}
              </div>

              {/* Country Selection */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Underwriting Country / Market *</label>
                <select
                  value={applicant.country}
                  onChange={(e) => handleCountryChange(e.target.value as CountryCode)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="NG">Nigeria (NGN ₦)</option>
                  <option value="GB">United Kingdom (GBP £)</option>
                </select>
              </div>

              {/* State or Region */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">State / Region *</label>
                <select
                  value={applicant.stateOrRegion}
                  onChange={(e) => setApplicant({ ...applicant, stateOrRegion: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  {(applicant.country === 'NG' ? NIGERIAN_STATES : UK_REGIONS).map((reg) => (
                    <option key={reg} value={reg}>
                      {reg}
                    </option>
                  ))}
                </select>
              </div>

              {/* City */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">City / Postal Town *</label>
                <input
                  type="text"
                  placeholder="e.g. Ikeja, Lekki, Westminster, Manchester"
                  value={applicant.city}
                  onChange={(e) => setApplicant({ ...applicant, city: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                {errors.city && <p className="text-xs text-rose-600">{errors.city}</p>}
              </div>

              {/* Driver Age */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-700">Driver Age *</label>
                  <span className="text-xs font-mono font-semibold text-slate-900">{applicant.age} yrs</span>
                </div>
                <input
                  type="range"
                  min="18"
                  max="85"
                  value={applicant.age}
                  onChange={(e) => setApplicant({ ...applicant, age: parseInt(e.target.value, 10) })}
                  className="w-full accent-slate-900 cursor-pointer"
                />
                {errors.age && <p className="text-xs text-rose-600">{errors.age}</p>}
              </div>

              {/* Years of Driving Experience */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-700">Years of Driving Experience *</label>
                  <span className="text-xs font-mono font-semibold text-slate-900">
                    {applicant.yearsOfDriving} yrs
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={applicant.yearsOfDriving}
                  onChange={(e) =>
                    setApplicant({ ...applicant, yearsOfDriving: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-slate-900 cursor-pointer"
                />
                {errors.yearsOfDriving && (
                  <p className="text-xs text-rose-600">{errors.yearsOfDriving}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: VEHICLE INFORMATION */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900">Step 2: Vehicle Specifications & Value</h2>
              <p className="text-xs text-slate-500 mt-1">
                Provide vehicle physical characteristics, insured market valuation, and expected operational mileage.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Make */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Vehicle Make *</label>
                <input
                  type="text"
                  placeholder="e.g. Toyota, Lexus, BMW, Mercedes-Benz, Ford"
                  value={vehicle.make}
                  onChange={(e) => setVehicle({ ...vehicle, make: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                {errors.make && <p className="text-xs text-rose-600">{errors.make}</p>}
              </div>

              {/* Model */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Vehicle Model *</label>
                <input
                  type="text"
                  placeholder="e.g. Corolla 1.8, RAV4, 320d M Sport"
                  value={vehicle.model}
                  onChange={(e) => setVehicle({ ...vehicle, model: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                {errors.model && <p className="text-xs text-rose-600">{errors.model}</p>}
              </div>

              {/* Year */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Year of Manufacture *</label>
                <select
                  value={vehicle.year}
                  onChange={(e) => setVehicle({ ...vehicle, year: parseInt(e.target.value, 10) })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  {Array.from({ length: 25 }, (_, i) => 2026 - i).map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vehicle Type */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Vehicle Classification *</label>
                <select
                  value={vehicle.vehicleType}
                  onChange={(e) =>
                    setVehicle({ ...vehicle, vehicleType: e.target.value as any })
                  }
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="sedan">Saloon / Sedan</option>
                  <option value="suv">SUV / 4x4 Crossover</option>
                  <option value="hatchback">Hatchback / Compact</option>
                  <option value="pickup">Pickup Truck / Utility</option>
                  <option value="luxury">Luxury / Performance Sport</option>
                  <option value="commercial_van">Commercial Van / Fleet</option>
                </select>
              </div>

              {/* Vehicle Value */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Estimated Vehicle Market Value ({currencySymbol}) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-mono text-sm">
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    min="100"
                    step={applicant.country === 'NG' ? 100000 : 500}
                    value={vehicle.vehicleValue}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setVehicle({ ...vehicle, vehicleValue: val });
                      setCoverage((c) => ({ ...c, insuredValue: val }));
                    }}
                    className="w-full pl-8 pr-3.5 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                {errors.vehicleValue && <p className="text-xs text-rose-600">{errors.vehicleValue}</p>}
              </div>

              {/* Engine Capacity */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Engine Displacement (cc) *</label>
                <input
                  type="number"
                  step="100"
                  value={vehicle.engineCapacityCc}
                  onChange={(e) =>
                    setVehicle({ ...vehicle, engineCapacityCc: parseInt(e.target.value, 10) || 0 })
                  }
                  className="w-full px-3.5 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                {errors.engineCapacityCc && (
                  <p className="text-xs text-rose-600">{errors.engineCapacityCc}</p>
                )}
              </div>

              {/* Transmission & Fuel */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Transmission</label>
                <select
                  value={vehicle.transmission}
                  onChange={(e) =>
                    setVehicle({ ...vehicle, transmission: e.target.value as any })
                  }
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="automatic">Automatic</option>
                  <option value="manual">Manual</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Fuel Propulsion</label>
                <select
                  value={vehicle.fuelType}
                  onChange={(e) =>
                    setVehicle({ ...vehicle, fuelType: e.target.value as any })
                  }
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="petrol">Petrol (Gasoline)</option>
                  <option value="diesel">Diesel</option>
                  <option value="hybrid">Hybrid (HEV / PHEV)</option>
                  <option value="electric">Battery Electric (BEV)</option>
                </select>
              </div>

              {/* Usage & Mileage */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Vehicle Usage Purpose</label>
                <select
                  value={vehicle.usage}
                  onChange={(e) =>
                    setVehicle({ ...vehicle, usage: e.target.value as any })
                  }
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="private">Private Social, Domestic & Commuting</option>
                  <option value="commercial">Commercial / Carriage of Goods / Business</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Estimated Annual Mileage ({applicant.country === 'NG' ? 'km/year' : 'miles/year'})
                </label>
                <input
                  type="number"
                  step="500"
                  value={vehicle.annualMileage}
                  onChange={(e) =>
                    setVehicle({ ...vehicle, annualMileage: parseInt(e.target.value, 10) || 0 })
                  }
                  className="w-full px-3.5 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                {errors.annualMileage && (
                  <p className="text-xs text-rose-600">{errors.annualMileage}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: DRIVING AND CLAIMS HISTORY */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900">Step 3: Driving Record & Claims History</h2>
              <p className="text-xs text-slate-500 mt-1">
                Disclose past 5 years motor loss experience, at-fault collisions, and verified no-claims discount credits.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Previous Accidents */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Previous At-Fault Accidents (Past 5 Years) *
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={drivingHistory.previousAccidents}
                  onChange={(e) =>
                    setDrivingHistory({
                      ...drivingHistory,
                      previousAccidents: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="w-full px-3.5 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              {/* Previous Claims */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Previous Insurance Claims Lodged *
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={drivingHistory.previousClaims}
                  onChange={(e) =>
                    setDrivingHistory({
                      ...drivingHistory,
                      previousClaims: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="w-full px-3.5 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              {/* Traffic Violations */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Driving Convictions / Fixed Penalty Violations *
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={drivingHistory.violations}
                  onChange={(e) =>
                    setDrivingHistory({
                      ...drivingHistory,
                      violations: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="w-full px-3.5 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              {/* No-Claims Discount Years */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Verified No-Claims Discount (NCD) Bonus Years
                </label>
                <select
                  value={drivingHistory.noClaimsYears}
                  onChange={(e) =>
                    setDrivingHistory({
                      ...drivingHistory,
                      noClaimsYears: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value={0}>0 Years (No bonus discount)</option>
                  <option value={1}>1 Year (10% standard reduction)</option>
                  <option value={2}>2 Years (15% standard reduction)</option>
                  <option value={3}>3 Years (20% standard reduction)</option>
                  <option value={4}>4 Years (25% standard reduction)</option>
                  <option value={5}>5+ Years (Maximum preferred rate)</option>
                </select>
              </div>

              {/* Previous Coverage Check */}
              <div className="md:col-span-2 pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={drivingHistory.previousCoverage}
                    onChange={(e) =>
                      setDrivingHistory({ ...drivingHistory, previousCoverage: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-teal-600 accent-teal-600 border-slate-300"
                  />
                  <span className="text-xs text-slate-700">
                    Applicant currently maintains continuous, unexpired motor insurance policy without coverage lapse.
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: VEHICLE SECURITY & RISK EXPOSURE */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900">Step 4: Vehicle Security & Peril Exposure</h2>
              <p className="text-xs text-slate-500 mt-1">
                Evaluate physical overnight storage, theft deterrent accessories, and territorial traffic congestion.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Parking Location */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Overnight Parking Location *</label>
                <select
                  value={security.parkingLocation}
                  onChange={(e) =>
                    setSecurity({ ...security, parkingLocation: e.target.value as any })
                  }
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="garage">Locked Private Garage (Safest)</option>
                  <option value="driveway">Private Gated Driveway / Compound</option>
                  <option value="street_residential">Residential Street Outside Home</option>
                  <option value="street_unsecured">Unsecured Public Street / Commercial Lot</option>
                </select>
              </div>

              {/* Driving Environment */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Primary Operating Environment *</label>
                <select
                  value={security.drivingEnvironment}
                  onChange={(e) =>
                    setSecurity({ ...security, drivingEnvironment: e.target.value as any })
                  }
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="urban_heavy">High-Density Urban / Heavy City Congestion</option>
                  <option value="suburban">Suburban Residential / Ring Roads</option>
                  <option value="highway_commute">Interstate / Motorway Highway Commuter</option>
                  <option value="rural">Rural / Low Traffic Flow</option>
                </select>
              </div>

              {/* Security Features Checklist */}
              <div className="md:col-span-2 space-y-2 pt-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Installed Vehicle Security Features (Select all that apply)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                  {[
                    'GPS Tracker',
                    'Immobilizer',
                    'Steering Wheel Lock',
                    'Dashcam (Front/Rear)',
                  ].map((feat) => {
                    const checked = security.securityFeatures.includes(feat);
                    return (
                      <button
                        key={feat}
                        type="button"
                        onClick={() => handleSecurityFeatureToggle(feat)}
                        className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs text-left transition-colors ${
                          checked
                            ? 'bg-teal-50/80 border-teal-500 text-teal-900 font-medium'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                            checked ? 'bg-teal-600 text-white' : 'border border-slate-300'
                          }`}
                        >
                          {checked && <Check className="w-3 h-3" />}
                        </div>
                        <span>{feat}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: INSURANCE COVERAGE SELECTION */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900">Step 5: Coverage Tier & Deductible Options</h2>
              <p className="text-xs text-slate-500 mt-1">
                Select your required level of indemnity protection, voluntary excess, and supplemental policy extensions.
              </p>
            </div>

            {/* 3 Main Coverage Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Comprehensive */}
              <button
                type="button"
                onClick={() => setCoverage({ ...coverage, coverageType: 'COMPREHENSIVE' })}
                className={`p-4 rounded-lg border text-left transition-all relative ${
                  coverage.coverageType === 'COMPREHENSIVE'
                    ? 'border-slate-900 bg-slate-50/80 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-teal-700 uppercase tracking-wide">
                    Full Indemnity
                  </span>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      coverage.coverageType === 'COMPREHENSIVE'
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-300'
                    }`}
                  >
                    {coverage.coverageType === 'COMPREHENSIVE' && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                </div>
                <h3 className="text-sm font-bold text-slate-900">Comprehensive Motor</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Full cover including own damage, accidental collision, rollover, fire, theft, and third-party liabilities.
                </p>
              </button>

              {/* Third Party Fire & Theft */}
              <button
                type="button"
                onClick={() => setCoverage({ ...coverage, coverageType: 'THIRD_PARTY_FIRE_THEFT' })}
                className={`p-4 rounded-lg border text-left transition-all ${
                  coverage.coverageType === 'THIRD_PARTY_FIRE_THEFT'
                    ? 'border-slate-900 bg-slate-50/80 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Intermediate
                  </span>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      coverage.coverageType === 'THIRD_PARTY_FIRE_THEFT'
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-300'
                    }`}
                  >
                    {coverage.coverageType === 'THIRD_PARTY_FIRE_THEFT' && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                </div>
                <h3 className="text-sm font-bold text-slate-900">Third-Party, Fire & Theft</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Covers third-party injury & property damages plus loss or destruction caused by fire, lightning, explosion, or vehicle theft.
                </p>
              </button>

              {/* Third Party Only */}
              <button
                type="button"
                onClick={() => setCoverage({ ...coverage, coverageType: 'THIRD_PARTY' })}
                className={`p-4 rounded-lg border text-left transition-all ${
                  coverage.coverageType === 'THIRD_PARTY'
                    ? 'border-slate-900 bg-slate-50/80 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Statutory
                  </span>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      coverage.coverageType === 'THIRD_PARTY'
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-300'
                    }`}
                  >
                    {coverage.coverageType === 'THIRD_PARTY' && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                </div>
                <h3 className="text-sm font-bold text-slate-900">Third-Party Only</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Baseline legal compliance covering statutory road traffic liability to third parties for property damage and bodily injury.
                </p>
              </button>
            </div>

            {/* Deductible / Excess Preference */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Voluntary Policy Excess / Deductible ({currencySymbol})
                </label>
                <p className="text-[11px] text-slate-500">
                  Higher voluntary excess reduces your gross pure premium.
                </p>
                <select
                  value={coverage.deductibleAmount}
                  onChange={(e) =>
                    setCoverage({ ...coverage, deductibleAmount: parseInt(e.target.value, 10) })
                  }
                  className="w-full px-3.5 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  {applicant.country === 'NG' ? (
                    <>
                      <option value={0}>₦0 (Standard statutory excess only)</option>
                      <option value={50000}>₦50,000 Excess (~5% discount)</option>
                      <option value={100000}>₦100,000 Excess (~10% discount)</option>
                      <option value={250000}>₦250,000 Excess (~15% discount)</option>
                    </>
                  ) : (
                    <>
                      <option value={0}>£0 (Compulsory excess only)</option>
                      <option value={150}>£150 Voluntary Excess</option>
                      <option value={250}>£250 Voluntary Excess</option>
                      <option value={500}>£500 Voluntary Excess (Max discount)</option>
                    </>
                  )}
                </select>
              </div>

              {/* Policy Duration */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Policy Period</label>
                <p className="text-[11px] text-slate-500">Standard annual underwriting period</p>
                <select
                  value={coverage.policyDurationMonths}
                  onChange={(e) =>
                    setCoverage({
                      ...coverage,
                      policyDurationMonths: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value={12}>12 Months (Full Annual Cover)</option>
                  <option value={6}>6 Months (Short-term pro-rata)</option>
                </select>
              </div>
            </div>

            {/* Optional Additional Add-ons */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-semibold text-slate-700">
                Optional Supplementary Extensions & Endorsements
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {[
                  applicant.country === 'NG' ? 'Flood & Storm Extension' : 'Legal Defense Cover',
                  'Excess Buy-Back',
                  'Roadside Assistance & Towing',
                ].map((addon) => {
                  const checked = coverage.optionalAddons.includes(addon);
                  return (
                    <button
                      key={addon}
                      type="button"
                      onClick={() => handleAddonToggle(addon)}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs text-left transition-colors ${
                        checked
                          ? 'bg-teal-50/80 border-teal-500 text-teal-900 font-medium'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                          checked ? 'bg-teal-600 text-white' : 'border border-slate-300'
                        }`}
                      >
                        {checked && <Check className="w-3 h-3" />}
                      </div>
                      <span>{addon}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: REVIEW AND SUBMISSION */}
        {currentStep === 6 && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900">Step 6: Review Application & Submit</h2>
              <p className="text-xs text-slate-500 mt-1">
                Verify all information carefully before running actuarial rating algorithms.
              </p>
            </div>

            {/* Summary Review Sections */}
            <div className="space-y-4">
              {/* Section 1: Applicant */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 mb-2">
                  <span className="text-xs font-bold text-slate-800">1. Applicant Details</span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="text-xs text-teal-700 hover:underline font-medium"
                  >
                    Edit
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">Name:</span>
                    <span className="font-medium text-slate-900">{applicant.fullName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Age / Experience:</span>
                    <span className="font-medium text-slate-900">
                      {applicant.age} yrs / {applicant.yearsOfDriving} yrs lic.
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Location:</span>
                    <span className="font-medium text-slate-900">
                      {applicant.city}, {applicant.stateOrRegion} ({applicant.country})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Contact:</span>
                    <span className="font-medium text-slate-900">{applicant.email}</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Vehicle */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 mb-2">
                  <span className="text-xs font-bold text-slate-800">2. Vehicle Specifications</span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="text-xs text-teal-700 hover:underline font-medium"
                  >
                    Edit
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">Vehicle:</span>
                    <span className="font-medium text-slate-900">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Category:</span>
                    <span className="font-medium text-slate-900 uppercase">
                      {vehicle.vehicleType.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Declared Market Value:</span>
                    <span className="font-medium text-slate-900 font-mono">
                      {currencySymbol}
                      {vehicle.vehicleValue.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Engine & Fuel:</span>
                    <span className="font-medium text-slate-900">
                      {vehicle.engineCapacityCc}cc · {vehicle.fuelType}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 3: History & Security */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 mb-2">
                  <span className="text-xs font-bold text-slate-800">3. Risk Factors & History</span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="text-xs text-teal-700 hover:underline font-medium"
                  >
                    Edit
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">Accidents / Violations:</span>
                    <span className="font-medium text-slate-900">
                      {drivingHistory.previousAccidents} accidents / {drivingHistory.violations} violations
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">No-Claims Discount:</span>
                    <span className="font-medium text-slate-900">{drivingHistory.noClaimsYears} Years NCD</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Overnight Parking:</span>
                    <span className="font-medium text-slate-900 capitalize">
                      {security.parkingLocation.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Anti-Theft Features:</span>
                    <span className="font-medium text-slate-900">
                      {security.securityFeatures.join(', ') || 'None listed'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 4: Coverage Selection */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 mb-2">
                  <span className="text-xs font-bold text-slate-800">4. Selected Insurance Terms</span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(5)}
                    className="text-xs text-teal-700 hover:underline font-medium"
                  >
                    Edit
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">Coverage Class:</span>
                    <span className="font-bold text-slate-900">
                      {coverage.coverageType === 'COMPREHENSIVE'
                        ? 'Comprehensive Motor'
                        : coverage.coverageType === 'THIRD_PARTY_FIRE_THEFT'
                        ? 'Third-Party, Fire & Theft'
                        : 'Third-Party Only'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Voluntary Deductible:</span>
                    <span className="font-medium text-slate-900 font-mono">
                      {currencySymbol}
                      {coverage.deductibleAmount.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Add-ons:</span>
                    <span className="font-medium text-slate-900">
                      {coverage.optionalAddons.join(', ') || 'None'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mandatory Checkboxes */}
            <div className="p-4 bg-slate-100/60 rounded-lg border border-slate-200 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmAccuracy}
                  onChange={(e) => setConfirmAccuracy(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-teal-600 accent-teal-600 border-slate-300"
                />
                <span className="text-xs text-slate-700">
                  I confirm that all statements, vehicle particulars, and claims history disclosed above are true, complete, and accurate.
                </span>
              </label>
              {errors.confirmAccuracy && (
                <p className="text-xs text-rose-600 pl-7">{errors.confirmAccuracy}</p>
              )}

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentDataProcessing}
                  onChange={(e) => setConsentDataProcessing(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-teal-600 accent-teal-600 border-slate-300"
                />
                <span className="text-xs text-slate-700">
                  I consent to the actuarial risk evaluation, frequency-severity loss modeling, and statistical premium estimation under prototype underwriting terms.
                </span>
              </label>
              {errors.consentDataProcessing && (
                <p className="text-xs text-rose-600 pl-7">{errors.consentDataProcessing}</p>
              )}
            </div>
          </form>
        )}

        {/* Navigation Buttons Strip */}
        <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {currentStep < 6 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
            >
              <span>Continue</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors shadow-xs"
            >
              <span>Calculate Premium & Generate Quotation</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
