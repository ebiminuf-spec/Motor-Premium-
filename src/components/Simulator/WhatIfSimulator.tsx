/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Info,
  Car,
  ShieldCheck,
  Check,
  ArrowRight,
} from 'lucide-react';
import {
  InsuranceApplicationRecord,
  CoverageType,
  ParkingLocation,
} from '../../types/insurance';
import { calculateRiskAssessment } from '../../engines/riskAssessmentEngine';
import { calculateActuarialPremium } from '../../engines/actuarialPricingEngine';

interface WhatIfSimulatorProps {
  applications: InsuranceApplicationRecord[];
  selectedAppId?: string;
  onOpenDetails: (app: InsuranceApplicationRecord) => void;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({
  applications,
  selectedAppId,
  onOpenDetails,
}) => {
  // Choose initial application
  const activeRecord = useMemo(() => {
    if (selectedAppId) {
      const found = applications.find((a) => a.id === selectedAppId);
      if (found) return found;
    }
    return applications[0];
  }, [applications, selectedAppId]);

  const [currentAppId, setCurrentAppId] = useState<string>(activeRecord?.id || '');

  const baseRecord = useMemo(() => {
    return applications.find((a) => a.id === currentAppId) || applications[0];
  }, [applications, currentAppId]);

  // Simulated editable inputs
  const [simInsuredValue, setSimInsuredValue] = useState<number>(baseRecord?.vehicle.vehicleValue || 10000);
  const [simAnnualMileage, setSimAnnualMileage] = useState<number>(baseRecord?.vehicle.annualMileage || 10000);
  const [simDeductible, setSimDeductible] = useState<number>(baseRecord?.coverage.deductibleAmount || 0);
  const [simCoverageType, setSimCoverageType] = useState<CoverageType>(baseRecord?.coverage.coverageType || 'COMPREHENSIVE');
  const [simParking, setSimParking] = useState<ParkingLocation>(baseRecord?.security.parkingLocation || 'driveway');
  const [simHasTracker, setSimHasTracker] = useState<boolean>(baseRecord?.security.hasAntiTheftDevice ?? true);

  // Sync state when application selector changes
  React.useEffect(() => {
    if (baseRecord) {
      setSimInsuredValue(baseRecord.vehicle.vehicleValue);
      setSimAnnualMileage(baseRecord.vehicle.annualMileage);
      setSimDeductible(baseRecord.coverage.deductibleAmount);
      setSimCoverageType(baseRecord.coverage.coverageType);
      setSimParking(baseRecord.security.parkingLocation);
      setSimHasTracker(baseRecord.security.hasAntiTheftDevice);
    }
  }, [baseRecord]);

  const currencySymbol = baseRecord ? baseRecord.marketConfig.currencySymbol : '$';

  // Run dynamic recalculation using the EXACT same actuarial engine
  const simulationResult = useMemo(() => {
    if (!baseRecord) return null;

    const modifiedVehicle = {
      ...baseRecord.vehicle,
      vehicleValue: simInsuredValue,
      annualMileage: simAnnualMileage,
    };

    const modifiedSecurity = {
      ...baseRecord.security,
      parkingLocation: simParking,
      hasAntiTheftDevice: simHasTracker,
      securityFeatures: simHasTracker
        ? Array.from(new Set([...baseRecord.security.securityFeatures, 'GPS Tracker']))
        : baseRecord.security.securityFeatures.filter((f) => f !== 'GPS Tracker'),
    };

    const modifiedCoverage = {
      ...baseRecord.coverage,
      coverageType: simCoverageType,
      insuredValue: simInsuredValue,
      deductibleAmount: simDeductible,
    };

    const simRisk = calculateRiskAssessment(
      baseRecord.applicant,
      modifiedVehicle,
      baseRecord.drivingHistory,
      modifiedSecurity,
      baseRecord.marketConfig
    );

    const simPricing = calculateActuarialPremium(
      baseRecord.applicant,
      modifiedVehicle,
      baseRecord.drivingHistory,
      modifiedSecurity,
      modifiedCoverage,
      simRisk,
      baseRecord.marketConfig
    );

    const originalPremium = baseRecord.pricing.finalGrossPremium;
    const revisedPremium = simPricing.finalGrossPremium;
    const diffAmount = revisedPremium - originalPremium;
    const diffPercent = originalPremium > 0 ? (diffAmount / originalPremium) * 100 : 0;

    // Actuarial sensitivity explanation
    const explanations: string[] = [];
    if (simCoverageType !== baseRecord.coverage.coverageType) {
      explanations.push(
        `Coverage altered from ${baseRecord.coverage.coverageType} to ${simCoverageType}, directly adjusting expected loss frequency and own-damage repair indemnity.`
      );
    }
    if (simInsuredValue !== baseRecord.vehicle.vehicleValue) {
      const valDiff = ((simInsuredValue - baseRecord.vehicle.vehicleValue) / baseRecord.vehicle.vehicleValue) * 100;
      explanations.push(
        `Insured vehicle sum shifted by ${valDiff > 0 ? '+' : ''}${valDiff.toFixed(1)}%, recalibrating conditional expected claim severity (S).`
      );
    }
    if (simDeductible !== baseRecord.coverage.deductibleAmount) {
      explanations.push(
        `Voluntary deductible adjusted to ${currencySymbol}${simDeductible.toLocaleString()}, ${
          simDeductible > baseRecord.coverage.deductibleAmount ? 'increasing policyholder risk retention and lowering insurer pure claims cost' : 'lowering excess and increasing insurer net claims exposure'
        }.`
      );
    }
    if (simAnnualMileage !== baseRecord.vehicle.annualMileage) {
      explanations.push(
        `Road exposure altered to ${simAnnualMileage.toLocaleString()} km/mi/yr, shifting annual collision probability.`
      );
    }
    if (simHasTracker !== baseRecord.security.hasAntiTheftDevice) {
      explanations.push(
        simHasTracker
          ? 'Active GPS tracker added, granting anti-theft recovery credit.'
          : 'Anti-theft tracker removed, removing loss recovery credit.'
      );
    }
    if (simParking !== baseRecord.security.parkingLocation) {
      explanations.push(
        `Parking changed to ${simParking.replace('_', ' ')}, modifying overnight theft & vandalism exposure relativity.`
      );
    }

    if (explanations.length === 0) {
      explanations.push('Parameters currently match baseline schedule.');
    }

    return {
      originalPremium,
      revisedPremium,
      diffAmount,
      diffPercent,
      simRisk,
      simPricing,
      explanations,
    };
  }, [
    baseRecord,
    simInsuredValue,
    simAnnualMileage,
    simDeductible,
    simCoverageType,
    simParking,
    simHasTracker,
    currencySymbol,
  ]);

  if (!baseRecord || !simulationResult) {
    return (
      <div className="p-12 text-center text-slate-500 text-sm">
        No application records available to simulate. Submit an application first.
      </div>
    );
  }

  const handleResetToBaseline = () => {
    setSimInsuredValue(baseRecord.vehicle.vehicleValue);
    setSimAnnualMileage(baseRecord.vehicle.annualMileage);
    setSimDeductible(baseRecord.coverage.deductibleAmount);
    setSimCoverageType(baseRecord.coverage.coverageType);
    setSimParking(baseRecord.security.parkingLocation);
    setSimHasTracker(baseRecord.security.hasAntiTheftDevice);
  };

  const isLower = simulationResult.diffAmount < 0;
  const isHigher = simulationResult.diffAmount > 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="text-xs text-slate-500 mb-1">
            <span>Sensitivity Analysis Engine</span>
            <span aria-hidden="true" className="mx-1.5">·</span>
            <span>Real-Time Actuarial Recalculation</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">What-If Premium Simulator</h1>
        </div>

        {/* Application Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600">Select Base Profile:</label>
          <select
            value={currentAppId}
            onChange={(e) => setCurrentAppId(e.target.value)}
            className="text-xs font-medium py-1.5 px-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            {applications.map((app) => (
              <option key={app.id} value={app.id}>
                {app.id} - {app.applicant.fullName} ({app.vehicle.make} {app.vehicle.model})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Variance Output Banner */}
      <div className="p-6 bg-white rounded-lg border border-slate-200 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          {/* Original */}
          <div className="border-r border-slate-100 pr-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Original Baseline Premium
            </span>
            <div className="text-2xl font-bold text-slate-700 mt-1 font-mono tabular-nums">
              {currencySymbol}
              {simulationResult.originalPremium.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Score: {baseRecord.riskAssessment.overallScore}/100 ({baseRecord.riskAssessment.riskClassification})
            </div>
          </div>

          {/* Revised */}
          <div className="border-r border-slate-100 pr-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Revised Simulated Premium
            </span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1 font-mono tabular-nums">
              {currencySymbol}
              {simulationResult.revisedPremium.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Revised Score: {simulationResult.simRisk.overallScore}/100 ({simulationResult.simRisk.riskClassification})
            </div>
          </div>

          {/* Difference */}
          <div className="border-r border-slate-100 pr-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Variance / Delta
            </span>
            <div
              className={`text-2xl font-extrabold mt-1 font-mono tabular-nums flex items-center gap-1 ${
                isLower ? 'text-teal-700' : isHigher ? 'text-rose-700' : 'text-slate-700'
              }`}
            >
              {isLower ? <TrendingDown className="w-5 h-5" /> : isHigher ? <TrendingUp className="w-5 h-5" /> : null}
              <span>
                {isHigher ? '+' : ''}
                {currencySymbol}
                {Math.abs(simulationResult.diffAmount).toLocaleString()}
              </span>
            </div>
            <div
              className={`text-xs font-bold font-mono mt-0.5 ${
                isLower ? 'text-teal-700' : isHigher ? 'text-rose-700' : 'text-slate-500'
              }`}
            >
              {isHigher ? '+' : ''}
              {simulationResult.diffPercent.toFixed(1)}% change
            </div>
          </div>

          {/* Reset Action */}
          <div className="flex flex-col gap-2">
            <button
              onClick={handleResetToBaseline}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset to Baseline</span>
            </button>
            <button
              onClick={() => onOpenDetails(baseRecord)}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors"
            >
              <span>View Full Schedule</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Dynamic Explanations Box */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="text-xs font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-500" />
            <span>Actuarial Impact Rationale:</span>
          </div>
          <ul className="text-xs text-slate-600 space-y-1 list-disc pl-5">
            {simulationResult.explanations.map((exp, i) => (
              <li key={i}>{exp}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Interactive Controls Laboratory */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left Control Column: Valuation, Mileage, Deductible */}
        <div className="p-5 bg-white rounded-lg border border-slate-200 space-y-5">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Vehicle & Exposure Parameters
          </h3>

          {/* Insured Value Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700">Insured Declared Value</span>
              <span className="font-mono font-bold text-slate-900">
                {currencySymbol}
                {simInsuredValue.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min={baseRecord.applicant.country === 'NG' ? 1000000 : 3000}
              max={baseRecord.applicant.country === 'NG' ? 60000000 : 100000}
              step={baseRecord.applicant.country === 'NG' ? 500000 : 1000}
              value={simInsuredValue}
              onChange={(e) => setSimInsuredValue(parseInt(e.target.value, 10))}
              className="w-full accent-slate-900 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>{baseRecord.applicant.country === 'NG' ? '₦1M' : '£3k'}</span>
              <span>Baseline: {currencySymbol}{baseRecord.vehicle.vehicleValue.toLocaleString()}</span>
              <span>{baseRecord.applicant.country === 'NG' ? '₦60M' : '£100k'}</span>
            </div>
          </div>

          {/* Annual Mileage Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700">Annual Road Mileage</span>
              <span className="font-mono font-bold text-slate-900">
                {simAnnualMileage.toLocaleString()} {baseRecord.applicant.country === 'NG' ? 'km/yr' : 'mi/yr'}
              </span>
            </div>
            <input
              type="range"
              min="2000"
              max="40000"
              step="1000"
              value={simAnnualMileage}
              onChange={(e) => setSimAnnualMileage(parseInt(e.target.value, 10))}
              className="w-full accent-slate-900 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>2,000</span>
              <span>Baseline: {baseRecord.vehicle.annualMileage.toLocaleString()}</span>
              <span>40,000</span>
            </div>
          </div>

          {/* Voluntary Deductible / Excess */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-700">Voluntary Policy Deductible</span>
              <span className="font-mono font-bold text-slate-900">
                {currencySymbol}
                {simDeductible.toLocaleString()}
              </span>
            </div>
            <select
              value={simDeductible}
              onChange={(e) => setSimDeductible(parseInt(e.target.value, 10))}
              className="w-full text-xs font-mono py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              {baseRecord.applicant.country === 'NG' ? (
                <>
                  <option value={0}>₦0 Voluntary Deductible</option>
                  <option value={50000}>₦50,000 Deductible (~5% discount)</option>
                  <option value={100000}>₦100,000 Deductible (~10% discount)</option>
                  <option value={250000}>₦250,000 Deductible (~15% discount)</option>
                  <option value={500000}>₦500,000 Deductible (~18% discount)</option>
                </>
              ) : (
                <>
                  <option value={0}>£0 Voluntary Deductible</option>
                  <option value={150}>£150 Voluntary Deductible</option>
                  <option value={250}>£250 Voluntary Deductible</option>
                  <option value={500}>£500 Voluntary Deductible</option>
                  <option value={1000}>£1,000 Voluntary Deductible</option>
                </>
              )}
            </select>
          </div>
        </div>

        {/* Right Control Column: Coverage Type & Security */}
        <div className="p-5 bg-white rounded-lg border border-slate-200 space-y-5">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Coverage Tier & Security Safeguards
          </h3>

          {/* Coverage Type Radios */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">Insurance Coverage Class</label>
            <div className="grid grid-cols-1 gap-2">
              {[
                { id: 'COMPREHENSIVE', label: 'Comprehensive Motor', desc: 'Own damage, collision, fire, theft & 3rd party' },
                { id: 'THIRD_PARTY_FIRE_THEFT', label: 'Third-Party, Fire & Theft', desc: 'No accidental own damage cover' },
                { id: 'THIRD_PARTY', label: 'Third-Party Only', desc: 'Statutory road traffic legal liability only' },
              ].map((cov) => (
                <button
                  key={cov.id}
                  type="button"
                  onClick={() => setSimCoverageType(cov.id as CoverageType)}
                  className={`p-2.5 rounded-lg border text-left text-xs transition-colors flex items-center justify-between ${
                    simCoverageType === cov.id
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div>
                    <div className="font-semibold">{cov.label}</div>
                    <div className={`text-[11px] ${simCoverageType === cov.id ? 'text-slate-300' : 'text-slate-500'}`}>
                      {cov.desc}
                    </div>
                  </div>
                  {simCoverageType === cov.id && <Check className="w-4 h-4 text-teal-400 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Security Features & Parking */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Overnight Parking</label>
              <select
                value={simParking}
                onChange={(e) => setSimParking(e.target.value as ParkingLocation)}
                className="w-full text-xs py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="garage">Locked Private Garage</option>
                <option value="driveway">Private Gated Driveway</option>
                <option value="street_residential">Residential Street</option>
                <option value="street_unsecured">Unsecured Public Street</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Anti-Theft Telematics</label>
              <button
                type="button"
                onClick={() => setSimHasTracker(!simHasTracker)}
                className={`w-full py-2 px-3 text-xs font-medium rounded-lg border flex items-center justify-between transition-colors ${
                  simHasTracker
                    ? 'bg-teal-50 border-teal-500 text-teal-900 font-semibold'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <span>GPS Tracker Active</span>
                <span className={`w-3.5 h-3.5 rounded-full ${simHasTracker ? 'bg-teal-600' : 'bg-slate-300'}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Simulator Warning */}
      <div className="p-4 bg-slate-100/70 rounded-lg border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
        <strong>Underwriting Notice:</strong> This simulator demonstrates mathematical parameter sensitivities using the unified actuarial pricing engine. It does not suggest or imply that misrepresenting vehicle value, parking location, or operational mileage will secure commercial policy coverage. Inaccurate disclosures void statutory insurance contracts at the time of claim settlement.
      </div>
    </div>
  );
};
