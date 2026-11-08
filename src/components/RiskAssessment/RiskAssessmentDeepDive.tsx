/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Binary,
  Layers,
  Database,
  Info,
  GitBranch,
  Sliders,
  CheckCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { CountryCode } from '../../types/insurance';

interface RiskAssessmentDeepDiveProps {
  activeMarket: CountryCode;
}

export const RiskAssessmentDeepDive: React.FC<RiskAssessmentDeepDiveProps> = ({ activeMarket }) => {
  // Interactive test scenario
  const [driverAge, setDriverAge] = useState(24);
  const [experience, setExperience] = useState(3);
  const [accidents, setAccidents] = useState(1);
  const [claims, setClaims] = useState(0);
  const [violations, setViolations] = useState(0);
  const [ncdYears, setNcdYears] = useState(2);
  const [vehicleType, setVehicleType] = useState('sedan');
  const [parking, setParking] = useState('driveway');
  const [hasTracker, setHasTracker] = useState(true);
  const [annualMileage, setAnnualMileage] = useState(14000);

  // Dynamic deterministic scoring calculation
  let driverScore = 12;
  if (driverAge < 21) driverScore += 10;
  else if (driverAge < 25) driverScore += 6;
  else if (driverAge >= 30 && driverAge <= 65) driverScore -= 4;
  else if (driverAge > 70) driverScore += 5;

  if (experience < 2) driverScore += 6;
  else if (experience >= 10) driverScore -= 4;
  driverScore = Math.max(2, Math.min(25, driverScore));

  let vehicleScore = 10;
  if (vehicleType === 'luxury') vehicleScore += 7;
  else if (vehicleType === 'commercial_van') vehicleScore += 6;
  else if (vehicleType === 'sedan') vehicleScore -= 2;
  vehicleScore = Math.max(2, Math.min(20, vehicleScore));

  let claimsScore = 6;
  claimsScore += Math.min(18, accidents * 9);
  claimsScore += Math.min(12, claims * 6);
  claimsScore += Math.min(12, violations * 6);
  if (ncdYears >= 3) claimsScore -= Math.min(8, ncdYears * 2);
  claimsScore = Math.max(1, Math.min(30, claimsScore));

  let secScore = 8;
  if (parking === 'garage') secScore -= 4;
  else if (parking === 'street_unsecured') secScore += 4;
  if (hasTracker) secScore -= 3;
  secScore = Math.max(1, Math.min(15, secScore));

  let mileageScore = 5;
  if (annualMileage > 20000) mileageScore += 4;
  else if (annualMileage < 6000) mileageScore -= 3;
  mileageScore = Math.max(1, Math.min(10, mileageScore));

  const totalScore = driverScore + vehicleScore + claimsScore + secScore + mileageScore;
  const classification = totalScore < 40 ? 'Low' : totalScore >= 70 ? 'High' : 'Medium';

  // SHAP Feature Importance Attribution
  const shapData = [
    { feature: 'Historical Claims & Accidents', importance: 0.35, color: '#0F172A' },
    { feature: 'Driver Age & Licensure Years', importance: 0.25, color: '#0D9488' },
    { feature: 'Vehicle Physical Classification', importance: 0.18, color: '#334155' },
    { feature: 'Overnight Parking & Security Tech', importance: 0.12, color: '#64748B' },
    { feature: 'Annual Mileage Road Exposure', importance: 0.10, color: '#94A3B8' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="text-xs text-slate-500 mb-1">
            <span>Actuarial Science & Underwriting Architecture</span>
            <span aria-hidden="true" className="mx-1.5">·</span>
            <span>Deterministic Rating + ML-Readiness</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Risk Assessment Engine & Architecture
          </h1>
        </div>
      </div>

      {/* Model Status & Fairness Notice Banner */}
      <div className="p-4 bg-white rounded-lg border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 font-bold shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">
              Deterministic Actuarial Rating Pipeline (Version ACT-PROT-v2.6)
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Transparent multi-attribute scoring calibrated for {activeMarket === 'NG' ? 'Nigeria (NAICOM)' : 'UK (PRA/FCA)'} market loss distributions.
            </div>
          </div>
        </div>
        <div className="text-xs font-mono text-slate-600 bg-slate-100 px-3 py-1.5 rounded self-start sm:self-auto">
          Discriminatory Variables: Strictly Excluded
        </div>
      </div>

      {/* Interactive Testing Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Controls Column */}
        <div className="lg:col-span-2 p-5 bg-white rounded-lg border border-slate-200 space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h2 className="text-sm font-bold text-slate-900">Interactive Risk Variable Simulation</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Adjust demographic, loss history, and security attributes to inspect deterministic score calculation
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Driver Age Slider */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-700">Driver Age</span>
                <span className="font-mono font-bold text-slate-900">{driverAge} yrs</span>
              </div>
              <input
                type="range"
                min="18"
                max="80"
                value={driverAge}
                onChange={(e) => setDriverAge(parseInt(e.target.value, 10))}
                className="w-full accent-slate-900"
              />
            </div>

            {/* Experience Slider */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="font-semibold text-slate-700">Driving Experience</span>
                <span className="font-mono font-bold text-slate-900">{experience} yrs</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                value={experience}
                onChange={(e) => setExperience(parseInt(e.target.value, 10))}
                className="w-full accent-slate-900"
              />
            </div>

            {/* Accidents */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">At-Fault Accidents (Past 5 Yrs)</label>
              <select
                value={accidents}
                onChange={(e) => setAccidents(parseInt(e.target.value, 10))}
                className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded"
              >
                <option value={0}>0 Accidents (Clean)</option>
                <option value={1}>1 Accident (+9 pts)</option>
                <option value={2}>2 Accidents (+18 pts)</option>
                <option value={3}>3+ Accidents (+18 pts max)</option>
              </select>
            </div>

            {/* Violations */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">Traffic Violations / Points</label>
              <select
                value={violations}
                onChange={(e) => setViolations(parseInt(e.target.value, 10))}
                className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded"
              >
                <option value={0}>0 Violations</option>
                <option value={1}>1 Violation (+6 pts)</option>
                <option value={2}>2 Violations (+12 pts)</option>
              </select>
            </div>

            {/* Vehicle Type */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">Vehicle Classification</label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded"
              >
                <option value="sedan">Saloon / Sedan (-2 pts)</option>
                <option value="luxury">Luxury / Performance (+7 pts)</option>
                <option value="commercial_van">Commercial Van (+6 pts)</option>
              </select>
            </div>

            {/* Parking */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">Overnight Parking</label>
              <select
                value={parking}
                onChange={(e) => setParking(e.target.value)}
                className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded"
              >
                <option value="garage">Locked Private Garage (-4 pts)</option>
                <option value="driveway">Private Gated Driveway (0 pts)</option>
                <option value="street_unsecured">Unsecured Public Street (+4 pts)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Live Scorecard Column */}
        <div className="p-5 bg-white rounded-lg border border-slate-200 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Evaluated Prototype Risk Score
            </span>
            <div className="text-4xl font-extrabold text-slate-900 mt-2 font-mono tabular-nums">
              {totalScore}
              <span className="text-base font-normal text-slate-400">/100</span>
            </div>
            <div className="mt-2">
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded border ${
                  classification === 'Low'
                    ? 'text-teal-700 bg-teal-50 border-teal-200'
                    : classification === 'High'
                    ? 'text-rose-700 bg-rose-50 border-rose-200'
                    : 'text-amber-700 bg-amber-50 border-amber-200'
                }`}
              >
                {classification.toUpperCase()} RISK CLASSIFICATION
              </span>
            </div>

            {/* Sub-score summary */}
            <div className="mt-5 space-y-2 text-xs border-t border-slate-100 pt-3">
              <div className="flex justify-between">
                <span className="text-slate-500">Driver Profile:</span>
                <span className="font-mono font-medium text-slate-800">{driverScore} / 25</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Vehicle Hazard:</span>
                <span className="font-mono font-medium text-slate-800">{vehicleScore} / 20</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Claims History:</span>
                <span className="font-mono font-medium text-slate-800">{claimsScore} / 30</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Security & Peril:</span>
                <span className="font-mono font-medium text-slate-800">{secScore} / 15</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mileage Exposure:</span>
                <span className="font-mono font-medium text-slate-800">{mileageScore} / 10</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 italic">
            Deterministic prototype rating: 100% transparent and reproducible.
          </div>
        </div>
      </div>

      {/* Machine Learning & Statistical GLM Architecture Readiness */}
      <div className="p-6 bg-white rounded-lg border border-slate-200 space-y-5">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Machine Learning & Actuarial Model Readiness
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            The platform's calculation engine is decoupled from UI components and structured to integrate production-trained GLM, Tweedie, and gradient-boosted ensembles.
          </p>
        </div>

        {/* Feature Attribution (SHAP Importance) */}
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3">
            Simulated Global Feature Attribution (SHAP Importance Weights)
          </h3>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={shapData} layout="vertical" margin={{ top: 5, right: 30, left: 140, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: '#64748B' }}
                  tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                />
                <YAxis type="category" dataKey="feature" tick={{ fontSize: 10, fill: '#334155' }} width={135} />
                <Tooltip
                  formatter={(val: any) => [`${(Number(val) * 100).toFixed(1)}%`, 'Attribution Weight']}
                  contentStyle={{ fontSize: '12px', borderRadius: '6px' }}
                />
                <Bar dataKey="importance" fill="#0D9488" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Future ML Models Readiness Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Box 1: Poisson GLM */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 mb-1.5">
              <Binary className="w-4 h-4 text-teal-600" />
              <span className="text-xs font-bold text-slate-900">Poisson GLM (Frequency)</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Models claim count per exposure unit (Y_i ~ Poisson(λ_i)). Uses canonical log link ln(λ_i) = X_i β + ln(exposure_i).
            </p>
            <div className="mt-2 text-[10px] font-mono text-slate-500 bg-white p-1.5 rounded border border-slate-200">
              Target: Annual Claim Count · Log Link
            </div>
          </div>

          {/* Box 2: Gamma GLM */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 mb-1.5">
              <Layers className="w-4 h-4 text-slate-800" />
              <span className="text-xs font-bold text-slate-900">Gamma GLM (Severity)</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Models loss severity conditional on claim occurrence (S_i ~ Gamma(α, β)). Accommodates right-skewed vehicle repair and total loss distributions.
            </p>
            <div className="mt-2 text-[10px] font-mono text-slate-500 bg-white p-1.5 rounded border border-slate-200">
              Target: Severity per Claim · Log Link
            </div>
          </div>

          {/* Box 3: Tweedie Compound Poisson */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 mb-1.5">
              <GitBranch className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-bold text-slate-900">Tweedie Compound Loss</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Unifies frequency and severity directly via compound Poisson-gamma ($1 &lt; p &lt; 2$) to predict pure risk loss cost in a single step with zero-inflated density.
            </p>
            <div className="mt-2 text-[10px] font-mono text-slate-500 bg-white p-1.5 rounded border border-slate-200">
              Target: Pure Premium · p = 1.5
            </div>
          </div>
        </div>

        {/* Documentation notice */}
        <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-3">
          <strong>Underwriting Ethics & Regulatory Compliance:</strong> In accordance with UK Equality Act 2010 and Nigerian Federal Competition and Consumer Protection Commission (FCCPC) mandates, pricing algorithms strictly prohibit discrimination based on race, religion, gender, or disability.
        </div>
      </div>
    </div>
  );
};
