/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Save,
  RotateCcw,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Info,
  SlidersHorizontal,
  Lock,
} from 'lucide-react';
import {
  MarketPricingConfig,
  CountryCode,
} from '../../types/insurance';
import {
  DEFAULT_MARKET_CONFIGS,
} from '../../config/marketDefaults';
import {
  getStoredMarketConfigs,
  saveStoredMarketConfigs,
  resetAllStorageToDemo,
} from '../../services/storageService';

interface AdminSettingsProps {
  isAdmin: boolean;
  onToggleAdmin: () => void;
  activeMarket: CountryCode;
  onMarketConfigUpdated: () => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({
  isAdmin,
  onToggleAdmin,
  activeMarket,
  onMarketConfigUpdated,
}) => {
  const [targetMarket, setTargetMarket] = useState<CountryCode>(activeMarket);
  const [configs, setConfigs] = useState<Record<CountryCode, MarketPricingConfig>>(() =>
    getStoredMarketConfigs()
  );
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const currentConfig = configs[targetMarket];

  const handleFieldChange = (field: keyof MarketPricingConfig, value: any) => {
    setConfigs((prev) => ({
      ...prev,
      [targetMarket]: {
        ...prev[targetMarket],
        [field]: value,
        lastUpdated: new Date().toISOString().slice(0, 10),
      },
    }));
  };

  const handleStatutoryChange = (index: number, key: string, value: any) => {
    const updated = [...currentConfig.statutoryCharges];
    updated[index] = { ...updated[index], [key]: value };
    handleFieldChange('statutoryCharges', updated);
  };

  const handleSave = () => {
    saveStoredMarketConfigs(configs);
    setSaveSuccess(true);
    onMarketConfigUpdated();
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleResetDefaults = () => {
    if (confirm(`Reset ${targetMarket === 'NG' ? 'Nigerian' : 'UK'} market configurations to default actuarial assumptions?`)) {
      const updated = {
        ...configs,
        [targetMarket]: { ...DEFAULT_MARKET_CONFIGS[targetMarket] },
      };
      setConfigs(updated);
      saveStoredMarketConfigs(updated);
      onMarketConfigUpdated();
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 3000);
    }
  };

  const handleFullStorageReset = () => {
    if (confirm('Reset entire application database and seed sample records? All custom applications will revert.')) {
      resetAllStorageToDemo();
      window.location.reload();
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white rounded-lg border border-slate-200 text-center space-y-4">
        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-700">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Administrator Access Restricted</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
          Underwriting assumptions, regulatory loadings, and pricing parameters are restricted to actuarial pricing administrators. Enable Demo Administrator Mode to test and calibrate market assumptions.
        </p>
        <button
          onClick={onToggleAdmin}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <span>Enable Demo Administrator Mode</span>
        </button>
        <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
          Note: In a commercial production environment, this panel requires enterprise OAuth/RBAC authentication.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="text-xs text-slate-500 mb-1">
            <span>Portfolio Governance</span>
            <span aria-hidden="true" className="mx-1.5">·</span>
            <span className="font-semibold text-teal-700">Demo Administrator Mode Active</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Market Pricing Assumptions & Settings
          </h1>
        </div>

        {/* Market Switcher */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600">Active Market Config:</label>
          <div className="flex items-center gap-1 p-1 bg-white border border-slate-300 rounded-lg">
            <button
              onClick={() => setTargetMarket('NG')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                targetMarket === 'NG' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600'
              }`}
            >
              Nigeria (₦)
            </button>
            <button
              onClick={() => setTargetMarket('GB')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                targetMarket === 'GB' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600'
              }`}
            >
              UK (£)
            </button>
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg flex items-center gap-2 text-xs text-teal-800">
          <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
          <span>Market pricing configurations updated and persisted. Future quotations will reflect these calibrated rates.</span>
        </div>
      )}

      {resetSuccess && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2 text-xs text-slate-700">
          <Info className="w-4 h-4 text-slate-500 shrink-0" />
          <span>Market settings restored to standard actuarial defaults.</span>
        </div>
      )}

      {/* Assumptions Configuration Cards */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-6">
        <div>
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">
              1. Baseline Actuarial Parameters ({currentConfig.countryName})
            </h2>
            <span className="text-xs font-mono text-slate-500">Model: {currentConfig.modelVersion}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
          {/* Base Claim Frequency */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <label className="font-semibold text-slate-700">Baseline Annual Claim Frequency (λ)</label>
              <span className="font-mono font-bold text-slate-900">
                {(currentConfig.baseFrequencyComprehensive * 100).toFixed(2)}%
              </span>
            </div>
            <input
              type="number"
              step="0.005"
              min="0.01"
              max="0.4"
              value={currentConfig.baseFrequencyComprehensive}
              onChange={(e) =>
                handleFieldChange('baseFrequencyComprehensive', parseFloat(e.target.value) || 0.05)
              }
              className="w-full px-3 py-1.5 font-mono bg-slate-50 border border-slate-200 rounded-lg"
            />
            <p className="text-[11px] text-slate-400">Baseline loss probability for comprehensive policies</p>
          </div>

          {/* Base Severity Percent */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <label className="font-semibold text-slate-700">Baseline Claim Severity (% of Insured Value)</label>
              <span className="font-mono font-bold text-slate-900">
                {(currentConfig.baseSeverityPercent * 100).toFixed(1)}%
              </span>
            </div>
            <input
              type="number"
              step="0.01"
              min="0.05"
              max="0.6"
              value={currentConfig.baseSeverityPercent}
              onChange={(e) =>
                handleFieldChange('baseSeverityPercent', parseFloat(e.target.value) || 0.15)
              }
              className="w-full px-3 py-1.5 font-mono bg-slate-50 border border-slate-200 rounded-lg"
            />
            <p className="text-[11px] text-slate-400">Average repair/loss severity ratio per collision</p>
          </div>

          {/* Third Party Base Cost */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <label className="font-semibold text-slate-700">Third-Party Minimum Statutory Cost ({currentConfig.currencySymbol})</label>
              <span className="font-mono font-bold text-slate-900">
                {currentConfig.currencySymbol}{currentConfig.thirdPartyBaseCost.toLocaleString()}
              </span>
            </div>
            <input
              type="number"
              step={targetMarket === 'NG' ? 1000 : 20}
              value={currentConfig.thirdPartyBaseCost}
              onChange={(e) =>
                handleFieldChange('thirdPartyBaseCost', parseFloat(e.target.value) || 0)
              }
              className="w-full px-3 py-1.5 font-mono bg-slate-50 border border-slate-200 rounded-lg"
            />
            <p className="text-[11px] text-slate-400">Statutory floor for third-party bodily injury & property liability</p>
          </div>

          {/* Fixed Admin Expenses */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <label className="font-semibold text-slate-700">Fixed Policy Administration Expenses ({currentConfig.currencySymbol})</label>
              <span className="font-mono font-bold text-slate-900">
                {currentConfig.currencySymbol}{currentConfig.fixedExpenses.toLocaleString()}
              </span>
            </div>
            <input
              type="number"
              step={targetMarket === 'NG' ? 1000 : 10}
              value={currentConfig.fixedExpenses}
              onChange={(e) =>
                handleFieldChange('fixedExpenses', parseFloat(e.target.value) || 0)
              }
              className="w-full px-3 py-1.5 font-mono bg-slate-50 border border-slate-200 rounded-lg"
            />
            <p className="text-[11px] text-slate-400">Underwriting operations, database indexing, and documentation costs</p>
          </div>

          {/* Variable Expense Ratio */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <label className="font-semibold text-slate-700">Variable Expense Ratio (Commissions & Processing)</label>
              <span className="font-mono font-bold text-slate-900">
                {(currentConfig.variableExpenseRatio * 100).toFixed(1)}%
              </span>
            </div>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max="0.30"
              value={currentConfig.variableExpenseRatio}
              onChange={(e) =>
                handleFieldChange('variableExpenseRatio', parseFloat(e.target.value) || 0.1)
              }
              className="w-full px-3 py-1.5 font-mono bg-slate-50 border border-slate-200 rounded-lg"
            />
            <p className="text-[11px] text-slate-400">Brokerage commissions, card merchant fees, and distribution cost</p>
          </div>

          {/* Risk and Profit Loading Ratio */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <label className="font-semibold text-slate-700">Risk & Profit Loading Margin Ratio</label>
              <span className="font-mono font-bold text-slate-900">
                {(currentConfig.riskProfitLoadingRatio * 100).toFixed(1)}%
              </span>
            </div>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max="0.25"
              value={currentConfig.riskProfitLoadingRatio}
              onChange={(e) =>
                handleFieldChange('riskProfitLoadingRatio', parseFloat(e.target.value) || 0.05)
              }
              className="w-full px-3 py-1.5 font-mono bg-slate-50 border border-slate-200 rounded-lg"
            />
            <p className="text-[11px] text-slate-400">Target underwriting return on solvency capital and volatility reserve</p>
          </div>

          {/* Reinsurance Loading Ratio */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <label className="font-semibold text-slate-700">Reinsurance Treaty Loading Ratio</label>
              <span className="font-mono font-bold text-slate-900">
                {(currentConfig.reinsuranceLoadingRatio * 100).toFixed(1)}%
              </span>
            </div>
            <input
              type="number"
              step="0.005"
              min="0.01"
              max="0.15"
              value={currentConfig.reinsuranceLoadingRatio}
              onChange={(e) =>
                handleFieldChange('reinsuranceLoadingRatio', parseFloat(e.target.value) || 0.02)
              }
              className="w-full px-3 py-1.5 font-mono bg-slate-50 border border-slate-200 rounded-lg"
            />
            <p className="text-[11px] text-slate-400">Catastrophe and excess of loss treaty protection factor</p>
          </div>

          {/* Quotation Validity Days */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <label className="font-semibold text-slate-700">Quotation Schedule Validity Period</label>
              <span className="font-mono font-bold text-slate-900">
                {currentConfig.quotationValidityDays} Days
              </span>
            </div>
            <input
              type="number"
              min="7"
              max="90"
              value={currentConfig.quotationValidityDays}
              onChange={(e) =>
                handleFieldChange('quotationValidityDays', parseInt(e.target.value, 10) || 30)
              }
              className="w-full px-3 py-1.5 font-mono bg-slate-50 border border-slate-200 rounded-lg"
            />
            <p className="text-[11px] text-slate-400">Standard validity period before binding quote expiry</p>
          </div>
        </div>

        {/* Section 2: Statutory Levies Table */}
        <div className="pt-4 border-t border-slate-100">
          <h2 className="text-sm font-bold text-slate-900 mb-2">
            2. Statutory Taxes & Regulatory Levies ({currentConfig.countryName})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-medium">
                <tr>
                  <th className="p-2.5">Statutory Levy / Charge Name</th>
                  <th className="p-2.5">Rate (% of Gross)</th>
                  <th className="p-2.5">Flat Amount ({currentConfig.currencySymbol})</th>
                  <th className="p-2.5">Statutory Purpose / Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentConfig.statutoryCharges.map((charge, idx) => (
                  <tr key={idx}>
                    <td className="p-2.5 font-medium text-slate-800">{charge.name}</td>
                    <td className="p-2.5">
                      {charge.ratePercent !== undefined ? (
                        <input
                          type="number"
                          step="0.5"
                          value={charge.ratePercent}
                          onChange={(e) =>
                            handleStatutoryChange(idx, 'ratePercent', parseFloat(e.target.value) || 0)
                          }
                          className="w-20 px-2 py-1 font-mono text-xs bg-slate-50 border border-slate-200 rounded"
                        />
                      ) : (
                        <span className="text-slate-400 font-mono">-</span>
                      )}
                    </td>
                    <td className="p-2.5">
                      {charge.flatAmount !== undefined ? (
                        <input
                          type="number"
                          step="50"
                          value={charge.flatAmount}
                          onChange={(e) =>
                            handleStatutoryChange(idx, 'flatAmount', parseFloat(e.target.value) || 0)
                          }
                          className="w-24 px-2 py-1 font-mono text-xs bg-slate-50 border border-slate-200 rounded"
                        />
                      ) : (
                        <span className="text-slate-400 font-mono">-</span>
                      )}
                    </td>
                    <td className="p-2.5 text-slate-500 text-[11px]">{charge.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Risk Classification Thresholds */}
        <div className="pt-4 border-t border-slate-100">
          <h2 className="text-sm font-bold text-slate-900 mb-2">
            3. Risk Classification Scoring Thresholds
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">Low Risk Ceiling (Score &lt; X)</label>
              <input
                type="number"
                min="20"
                max="50"
                value={currentConfig.lowRiskThreshold}
                onChange={(e) =>
                  handleFieldChange('lowRiskThreshold', parseInt(e.target.value, 10) || 40)
                }
                className="w-full px-3 py-1.5 font-mono bg-slate-50 border border-slate-200 rounded-lg"
              />
              <p className="text-[11px] text-slate-400">Scores below this value are classified as Low Risk</p>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 block">High Risk Floor (Score ≥ Y)</label>
              <input
                type="number"
                min="55"
                max="85"
                value={currentConfig.mediumRiskThreshold}
                onChange={(e) =>
                  handleFieldChange('mediumRiskThreshold', parseInt(e.target.value, 10) || 70)
                }
                className="w-full px-3 py-1.5 font-mono bg-slate-50 border border-slate-200 rounded-lg"
              />
              <p className="text-[11px] text-slate-400">Scores at or above this value are classified as High Risk</p>
            </div>
          </div>
        </div>

        {/* Actions Button Strip */}
        <div className="pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>Save Market Configurations</span>
            </button>

            <button
              onClick={handleResetDefaults}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Market to Defaults</span>
            </button>
          </div>

          <button
            onClick={handleFullStorageReset}
            className="text-xs text-rose-700 hover:underline font-medium"
          >
            Reset All Application Seed Records
          </button>
        </div>
      </div>
    </div>
  );
};
