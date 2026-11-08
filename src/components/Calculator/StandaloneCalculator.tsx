/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Calculator,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  FileCheck,
  RefreshCw,
  Coins,
} from 'lucide-react';
import {
  CountryCode,
  CoverageType,
  MarketPricingConfig,
} from '../../types/insurance';
import { calculateRiskAssessment } from '../../engines/riskAssessmentEngine';
import { calculateActuarialPremium } from '../../engines/actuarialPricingEngine';

interface StandaloneCalculatorProps {
  activeMarket: CountryCode;
  marketConfig: MarketPricingConfig;
  onNavigateNewAppWithPrefill?: (prefill: any) => void;
}

export const StandaloneCalculator: React.FC<StandaloneCalculatorProps> = ({
  activeMarket,
  marketConfig,
  onNavigateNewAppWithPrefill,
}) => {
  const [market, setMarket] = useState<CountryCode>(activeMarket);
  const [age, setAge] = useState<number>(34);
  const [drivingExp, setDrivingExp] = useState<number>(10);
  const [vehicleValue, setVehicleValue] = useState<number>(market === 'NG' ? 14000000 : 28000);
  const [vehicleType, setVehicleType] = useState<any>('sedan');
  const [coverageType, setCoverageType] = useState<CoverageType>('COMPREHENSIVE');
  const [accidents, setAccidents] = useState<number>(0);
  const [ncdYears, setNcdYears] = useState<number>(4);
  const [deductible, setDeductible] = useState<number>(market === 'NG' ? 100000 : 250);
  const [parking, setParking] = useState<any>('driveway');
  const [hasTracker, setHasTracker] = useState<boolean>(true);
  const [annualMileage, setAnnualMileage] = useState<number>(market === 'NG' ? 12000 : 9000);

  // Sync market changes
  const handleMarketChange = (newMarket: CountryCode) => {
    setMarket(newMarket);
    if (newMarket === 'NG') {
      setVehicleValue(14000000);
      setDeductible(100000);
    } else {
      setVehicleValue(28000);
      setDeductible(250);
    }
  };

  const currencySymbol = market === 'NG' ? '₦' : '£';

  // Calculate live results
  const calculation = useMemo(() => {
    const applicantDummy = {
      fullName: 'Quick Estimation Applicant',
      email: 'calc@estimate.local',
      phone: '',
      age,
      country: market,
      stateOrRegion: market === 'NG' ? 'Lagos State' : 'Greater London',
      city: 'Capital Metro',
      yearsOfDriving: drivingExp,
    };

    const vehicleDummy = {
      make: 'Generic Vehicle',
      model: 'Class Estimator',
      year: 2022,
      vehicleType,
      vehicleValue,
      engineCapacityCc: 2000,
      transmission: 'automatic' as const,
      fuelType: 'petrol' as const,
      usage: 'private' as const,
      annualMileage,
    };

    const historyDummy = {
      previousAccidents: accidents,
      previousClaims: 0,
      totalClaimsValue: 0,
      violations: 0,
      previousCoverage: true,
      noClaimsYears: ncdYears,
    };

    const securityDummy = {
      parkingLocation: parking,
      hasAntiTheftDevice: hasTracker,
      securityFeatures: hasTracker ? ['GPS Tracker'] : [],
      usageFrequency: 'daily' as const,
      drivingEnvironment: 'suburban' as const,
    };

    const coverageDummy = {
      coverageType,
      insuredValue: vehicleValue,
      policyDurationMonths: 12,
      deductibleAmount: deductible,
      optionalAddons: [],
    };

    const risk = calculateRiskAssessment(
      applicantDummy,
      vehicleDummy,
      historyDummy,
      securityDummy,
      marketConfig
    );

    const pricing = calculateActuarialPremium(
      applicantDummy,
      vehicleDummy,
      historyDummy,
      securityDummy,
      coverageDummy,
      risk,
      marketConfig
    );

    return { risk, pricing };
  }, [
    market,
    age,
    drivingExp,
    vehicleValue,
    vehicleType,
    coverageType,
    accidents,
    ncdYears,
    deductible,
    parking,
    hasTracker,
    annualMileage,
    marketConfig,
  ]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="text-xs text-slate-500 mb-1">
            <span>Instant Actuarial Workbench</span>
            <span aria-hidden="true" className="mx-1.5">·</span>
            <span>Real-Time Loss Simulation</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Interactive Premium Calculator
          </h1>
        </div>

        {/* Market Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-300 rounded-lg">
          <button
            onClick={() => handleMarketChange('NG')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              market === 'NG' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Nigeria (₦ NGN)
          </button>
          <button
            onClick={() => handleMarketChange('GB')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              market === 'GB' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            UK (£ GBP)
          </button>
        </div>
      </div>

      {/* Main Calculator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs: 7 Columns */}
        <div className="lg:col-span-7 space-y-4 bg-white p-6 rounded-lg border border-slate-200 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Pricing Assumptions & Risk Inputs
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Driver Age */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-700">Driver Age</span>
                <span className="font-mono font-bold text-slate-900">{age} yrs</span>
              </div>
              <input
                type="range"
                min="18"
                max="80"
                value={age}
                onChange={(e) => setAge(parseInt(e.target.value, 10))}
                className="w-full accent-slate-900"
              />
            </div>

            {/* Driving Experience */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-700">Years Licensed</span>
                <span className="font-mono font-bold text-slate-900">{drivingExp} yrs</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                value={drivingExp}
                onChange={(e) => setDrivingExp(parseInt(e.target.value, 10))}
                className="w-full accent-slate-900"
              />
            </div>

            {/* Vehicle Value */}
            <div className="space-y-1 sm:col-span-2">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-700">Vehicle Insured Value</span>
                <span className="font-mono font-bold text-slate-900">
                  {currencySymbol}
                  {vehicleValue.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min={market === 'NG' ? 1000000 : 2000}
                max={market === 'NG' ? 50000000 : 80000}
                step={market === 'NG' ? 500000 : 1000}
                value={vehicleValue}
                onChange={(e) => setVehicleValue(parseInt(e.target.value, 10))}
                className="w-full accent-slate-900"
              />
            </div>

            {/* Vehicle Type */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">Vehicle Category</label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded text-xs"
              >
                <option value="sedan">Saloon / Sedan</option>
                <option value="suv">SUV / 4x4 Crossover</option>
                <option value="hatchback">Hatchback</option>
                <option value="pickup">Pickup Truck</option>
                <option value="luxury">Luxury / Performance</option>
                <option value="commercial_van">Commercial Van</option>
              </select>
            </div>

            {/* Coverage Type */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">Insurance Coverage</label>
              <select
                value={coverageType}
                onChange={(e) => setCoverageType(e.target.value as CoverageType)}
                className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded text-xs font-medium"
              >
                <option value="COMPREHENSIVE">Comprehensive Motor</option>
                <option value="THIRD_PARTY_FIRE_THEFT">TP, Fire & Theft</option>
                <option value="THIRD_PARTY">Third-Party Only</option>
              </select>
            </div>

            {/* Prior Accidents */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">At-Fault Accidents</label>
              <select
                value={accidents}
                onChange={(e) => setAccidents(parseInt(e.target.value, 10))}
                className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded text-xs"
              >
                <option value={0}>0 (Clean record)</option>
                <option value={1}>1 Accident</option>
                <option value={2}>2 Accidents</option>
                <option value={3}>3+ Accidents</option>
              </select>
            </div>

            {/* NCD Years */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">No-Claims Discount (NCD)</label>
              <select
                value={ncdYears}
                onChange={(e) => setNcdYears(parseInt(e.target.value, 10))}
                className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded text-xs"
              >
                <option value={0}>0 Years</option>
                <option value={1}>1 Year (10% credit)</option>
                <option value={3}>3 Years (20% credit)</option>
                <option value={5}>5+ Years (Max bonus)</option>
              </select>
            </div>

            {/* Voluntary Deductible */}
            <div className="space-y-1 sm:col-span-2">
              <label className="font-semibold text-slate-700 block">Voluntary Deductible Excess</label>
              <select
                value={deductible}
                onChange={(e) => setDeductible(parseInt(e.target.value, 10))}
                className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded text-xs font-mono"
              >
                {market === 'NG' ? (
                  <>
                    <option value={0}>₦0 (Standard only)</option>
                    <option value={50000}>₦50,000 Deductible</option>
                    <option value={100000}>₦100,000 Deductible</option>
                    <option value={250000}>₦250,000 Deductible</option>
                  </>
                ) : (
                  <>
                    <option value={0}>£0 (Compulsory only)</option>
                    <option value={150}>£150 Deductible</option>
                    <option value={250}>£250 Deductible</option>
                    <option value={500}>£500 Deductible</option>
                  </>
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Right Output Card: 5 Columns */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 text-white p-6 rounded-lg border border-slate-800 shadow-md">
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-400">
              Estimated Gross Premium
            </span>
            <div className="text-4xl font-extrabold text-white mt-2 font-mono tabular-nums">
              {currencySymbol}
              {calculation.pricing.finalGrossPremium.toLocaleString()}
            </div>
            <div className="text-xs text-slate-300 mt-1">
              Annual 12-Month Indicative Rate ({market === 'NG' ? 'NGN' : 'GBP'})
            </div>

            <div className="mt-5 pt-4 border-t border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Risk Assessment Index:</span>
                <span className="font-mono font-bold text-teal-300">
                  {calculation.risk.overallScore}/100 ({calculation.risk.riskClassification} Risk)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Expected Claim Frequency (λ):</span>
                <span className="font-mono tabular-nums">
                  {(calculation.pricing.claimFrequency * 100).toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Pure Risk Premium:</span>
                <span className="font-mono tabular-nums text-white">
                  {currencySymbol}
                  {calculation.pricing.purePremium.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Expenses & Reinsurance:</span>
                <span className="font-mono tabular-nums text-white">
                  {currencySymbol}
                  {(
                    calculation.pricing.fixedExpenses +
                    calculation.pricing.variableExpenses +
                    calculation.pricing.reinsuranceCost
                  ).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Statutory Levies & Taxes:</span>
                <span className="font-mono tabular-nums text-white">
                  {currencySymbol}
                  {calculation.pricing.totalStatutoryCharges.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white rounded-lg border border-slate-200 text-xs text-slate-600 space-y-2">
            <div className="font-bold text-slate-900">Actuarial Formulation:</div>
            <p className="leading-relaxed">
              Gross Premium = (Pure Risk Loss + Fixed Admin + Reinsurance) / (1 - Variable Ratio - Risk Profit) + Statutory Charges.
            </p>
            <p className="text-[11px] text-slate-500">
              Pricing calibrated to {marketConfig.countryName} portfolio baseline assumptions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
