/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FileDown,
  SlidersHorizontal,
  ArrowLeft,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Sparkles,
  CheckCircle2,
  FileText,
  DollarSign,
  Car,
  User,
  ShieldAlert,
} from 'lucide-react';
import { InsuranceApplicationRecord } from '../../types/insurance';
import { generateQuotationPDF } from '../../services/pdfService';

interface QuotationResultsViewProps {
  record: InsuranceApplicationRecord;
  onBack: () => void;
  onOpenSimulator: (record: InsuranceApplicationRecord) => void;
}

interface AIInsightResponse {
  underwriterSummary: string;
  keyRiskDrivers: string[];
  mitigationRecommendations: string[];
  actuarialNote: string;
  source: string;
}

export const QuotationResultsView: React.FC<QuotationResultsViewProps> = ({
  record,
  onBack,
  onOpenSimulator,
}) => {
  const [aiInsight, setAiInsight] = useState<AIInsightResponse | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const currencySymbol = record.marketConfig.currencySymbol;
  const isNigeria = record.applicant.country === 'NG';

  const riskClass = record.riskAssessment.riskClassification;
  const riskColor =
    riskClass === 'Low'
      ? 'text-teal-700 bg-teal-50 border-teal-200'
      : riskClass === 'High'
      ? 'text-rose-700 bg-rose-50 border-rose-200'
      : 'text-amber-700 bg-amber-50 border-amber-200';

  const fetchAiUnderwritingReview = async () => {
    setLoadingAi(true);
    setAiError(null);
    try {
      const response = await fetch('/api/ai/actuarial-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicant: record.applicant,
          vehicle: record.vehicle,
          riskAssessment: record.riskAssessment,
          premiumBreakdown: record.pricing,
          marketConfig: record.marketConfig,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      setAiInsight(data);
    } catch (err: any) {
      console.warn('AI insight fetch failed:', err);
      setAiError('Could not connect to actuarial insight service. Using deterministic ratings.');
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            title="Return"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Application Reference</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono font-medium text-slate-800">{record.id}</span>
              <span aria-hidden="true">·</span>
              <span>{record.marketConfig.countryName}</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Indicative Motor Insurance Schedule
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onOpenSimulator(record)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
          >
            <SlidersHorizontal className="w-4 h-4 text-slate-600" />
            <span>What-If Simulator</span>
          </button>

          <button
            onClick={() => generateQuotationPDF(record)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
          >
            <FileDown className="w-4 h-4 text-slate-200" />
            <span>Download Official PDF Schedule</span>
          </button>
        </div>
      </div>

      {/* Primary Highlights: 3 Card Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Final Payable Premium */}
        <div className="p-5 bg-white rounded-lg border border-slate-200 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Estimated Annual Gross Premium
            </span>
            <div className="text-3xl font-extrabold text-slate-900 mt-2 font-mono tabular-nums">
              {currencySymbol}
              {record.pricing.finalGrossPremium.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Inclusive of expenses, loadings & statutory charges
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Coverage Class:</span>
            <span className="font-semibold text-slate-900">
              {record.coverage.coverageType === 'COMPREHENSIVE'
                ? 'Comprehensive'
                : record.coverage.coverageType === 'THIRD_PARTY_FIRE_THEFT'
                ? 'TP Fire & Theft'
                : 'Third-Party Only'}
            </span>
          </div>
        </div>

        {/* Card 2: Risk Classification & Score */}
        <div className="p-5 bg-white rounded-lg border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Risk Classification
              </span>
              <span className={`px-2 py-0.5 rounded text-xs font-bold border ${riskColor}`}>
                {riskClass.toUpperCase()} RISK
              </span>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 mt-2 font-mono tabular-nums">
              {record.riskAssessment.overallScore}
              <span className="text-sm font-normal text-slate-400">/100</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Normalized actuarial loss propensity index
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Score Thresholds:</span>
            <span className="text-slate-500">
              Low &lt;{record.marketConfig.lowRiskThreshold} · Med {record.marketConfig.lowRiskThreshold}-{record.marketConfig.mediumRiskThreshold - 1} · High ≥{record.marketConfig.mediumRiskThreshold}
            </span>
          </div>
        </div>

        {/* Card 3: Expected Loss (Pure Premium) */}
        <div className="p-5 bg-white rounded-lg border border-slate-200 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Pure Risk Premium (Expected Loss)
            </span>
            <div className="text-3xl font-extrabold text-teal-700 mt-2 font-mono tabular-nums">
              {currencySymbol}
              {record.pricing.purePremium.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Expected Claim Frequency ({(record.pricing.claimFrequency * 100).toFixed(2)}%) × Severity ({currencySymbol}{record.pricing.claimSeverity.toLocaleString()})
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Deductible Excess:</span>
            <span className="font-mono text-slate-900">
              {currencySymbol}
              {record.coverage.deductibleAmount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Actuarial Premium Breakdown Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <h2 className="text-sm font-bold text-slate-900">Actuarial Cost Decomposition</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent breakdown of frequency, severity, administrative expenses, loadings, and statutory levies
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Actuarial Element</th>
                <th className="py-2.5 px-4 font-semibold">Description & Mathematical Basis</th>
                <th className="py-2.5 px-4 font-semibold text-right">Proportion / Basis</th>
                <th className="py-2.5 px-4 font-semibold text-right">Amount ({record.marketConfig.currencyCode})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="py-2.5 px-4 font-medium text-slate-900">Expected Claim Frequency (λ)</td>
                <td className="py-2.5 px-4 text-slate-500">Annual probability of collision / loss occurrence</td>
                <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-600">
                  {(record.pricing.claimFrequency * 100).toFixed(2)}%
                </td>
                <td className="py-2.5 px-4 text-right font-mono text-slate-500">-</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-medium text-slate-900">Expected Claim Severity (S)</td>
                <td className="py-2.5 px-4 text-slate-500">Conditional average cost per loss event</td>
                <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-600">
                  {record.marketConfig.baseSeverityPercent * 100}% of value
                </td>
                <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-900">
                  {currencySymbol}
                  {record.pricing.claimSeverity.toLocaleString()}
                </td>
              </tr>
              <tr className="bg-teal-50/40">
                <td className="py-2.5 px-4 font-semibold text-teal-900">Pure Risk Premium (Expected Losses)</td>
                <td className="py-2.5 px-4 text-teal-800">Frequency (λ) × Severity (S) - Deductible Credit</td>
                <td className="py-2.5 px-4 text-right font-mono tabular-nums text-teal-800">Direct Pure Loss</td>
                <td className="py-2.5 px-4 text-right font-mono font-semibold tabular-nums text-teal-900">
                  {currencySymbol}
                  {record.pricing.purePremium.toLocaleString()}
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-medium text-slate-900">Fixed Administrative Expenses</td>
                <td className="py-2.5 px-4 text-slate-500">Policy documentation, e-certificate, MID & database admin</td>
                <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-600">Flat Fixed</td>
                <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-900">
                  {currencySymbol}
                  {record.pricing.fixedExpenses.toLocaleString()}
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-medium text-slate-900">Reinsurance Treaty Cost</td>
                <td className="py-2.5 px-4 text-slate-500">Excess-of-loss & catastrophe treaty protection loading</td>
                <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-600">
                  {(record.marketConfig.reinsuranceLoadingRatio * 100).toFixed(1)}% of Pure
                </td>
                <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-900">
                  {currencySymbol}
                  {record.pricing.reinsuranceCost.toLocaleString()}
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-medium text-slate-900">Variable Acquisition & Commissions</td>
                <td className="py-2.5 px-4 text-slate-500">Intermediary broker remuneration, card fees & acquisition</td>
                <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-600">
                  {(record.marketConfig.variableExpenseRatio * 100).toFixed(1)}% of Gross
                </td>
                <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-900">
                  {currencySymbol}
                  {record.pricing.variableExpenses.toLocaleString()}
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-medium text-slate-900">Risk & Profit Loading Margin</td>
                <td className="py-2.5 px-4 text-slate-500">Underwriting return on solvency capital and volatility margin</td>
                <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-600">
                  {(record.marketConfig.riskProfitLoadingRatio * 100).toFixed(1)}% of Gross
                </td>
                <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-900">
                  {currencySymbol}
                  {record.pricing.riskAndProfitLoading.toLocaleString()}
                </td>
              </tr>
              {record.pricing.statutoryChargesBreakdown.map((charge, i) => (
                <tr key={i} className="bg-slate-50/30">
                  <td className="py-2.5 px-4 font-medium text-slate-900">{charge.name}</td>
                  <td className="py-2.5 px-4 text-slate-500">Statutory government tax / regulatory supervision levy</td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-600">{charge.rateStr}</td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-900">
                    {currencySymbol}
                    {charge.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-900 text-white font-bold">
                <td colSpan={2} className="py-3 px-4 text-sm font-semibold text-white">
                  Total Final Estimated Premium Payable
                </td>
                <td className="py-3 px-4 text-right text-xs text-slate-300 font-normal">
                  Annual 12-Month Period
                </td>
                <td className="py-3 px-4 text-right font-mono text-base text-teal-300 tabular-nums">
                  {currencySymbol}
                  {record.pricing.finalGrossPremium.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Risk Assessment Breakdown & Factors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Risk Sub-score Category Breakdown */}
        <div className="p-5 bg-white rounded-lg border border-slate-200">
          <h3 className="text-sm font-bold text-slate-900 mb-1">Risk Factor Contribution Analysis</h3>
          <p className="text-xs text-slate-500 mb-4">Underwriting score across five primary rating dimensions</p>

          <div className="space-y-3.5">
            {Object.entries(record.riskAssessment.scoreBreakdown).map(([key, item]) => {
              const pct = (item.score / item.max) * 100;
              return (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-800">{item.label}</span>
                    <span className="font-mono text-slate-600 tabular-nums">
                      {item.score} / {item.max} ({Math.round(pct)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        pct > 70 ? 'bg-rose-500' : pct > 45 ? 'bg-amber-500' : 'bg-teal-600'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-slate-500">{item.details}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Risk Drivers: Increasing vs Decreasing */}
        <div className="p-5 bg-white rounded-lg border border-slate-200 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Key Underwriting Risk Drivers</h3>
            <p className="text-xs text-slate-500 mb-3">Empirical factors influencing this applicant's rating</p>

            {/* Increasing factors */}
            <div className="space-y-2 mb-4">
              <div className="text-xs font-semibold text-rose-700 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Factors Increasing Estimated Risk:</span>
              </div>
              {record.riskAssessment.riskDriversIncreasing.length > 0 ? (
                record.riskAssessment.riskDriversIncreasing.map((driver, idx) => (
                  <div key={idx} className="p-2 rounded bg-rose-50/60 border border-rose-100 text-xs">
                    <div className="font-medium text-rose-900">{driver.factor}</div>
                    <div className="text-[11px] text-rose-700 mt-0.5">{driver.impact}</div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 italic">No adverse risk drivers detected.</div>
              )}
            </div>

            {/* Decreasing factors */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-teal-700 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Factors Mitigating Estimated Risk:</span>
              </div>
              {record.riskAssessment.riskDriversDecreasing.length > 0 ? (
                record.riskAssessment.riskDriversDecreasing.map((driver, idx) => (
                  <div key={idx} className="p-2 rounded bg-teal-50/60 border border-teal-100 text-xs">
                    <div className="font-medium text-teal-900">{driver.factor}</div>
                    <div className="text-[11px] text-teal-700 mt-0.5">{driver.impact}</div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 italic">No mitigating risk factors recorded.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actionable Risk Reduction Recommendations */}
      <div className="p-5 bg-white rounded-lg border border-slate-200">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-bold text-slate-900">Actuarial Risk Reduction Recommendations</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
          {record.riskAssessment.recommendations.map((rec, i) => (
            <div key={i} className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <span>{rec}</span>
            </div>
          ))}
        </div>
      </div>

      {/* AI Actuarial Underwriter Commentary Panel */}
      <div className="p-5 bg-white rounded-lg border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Actuarial Underwriter Insights & Commentary
            </h3>
          </div>
          {!aiInsight && (
            <button
              onClick={fetchAiUnderwritingReview}
              disabled={loadingAi}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors disabled:opacity-50"
            >
              {loadingAi ? 'Analyzing Portfolio...' : 'Generate Actuarial Commentary'}
            </button>
          )}
        </div>

        {loadingAi && (
          <div className="p-6 text-center text-xs text-slate-500">
            Synthesizing risk factors, expected frequencies, and portfolio relativity notes...
          </div>
        )}

        {aiError && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-xs text-amber-800 rounded-lg mb-2">
            {aiError}
          </div>
        )}

        {aiInsight && (
          <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div>
              <span className="font-bold text-slate-900 block mb-1">Underwriter Executive Summary:</span>
              <p className="text-slate-700 leading-relaxed">{aiInsight.underwriterSummary}</p>
            </div>
            {aiInsight.keyRiskDrivers?.length > 0 && (
              <div>
                <span className="font-bold text-slate-900 block mb-1">Key Risk Drivers:</span>
                <ul className="list-disc pl-5 text-slate-700 space-y-1">
                  {aiInsight.keyRiskDrivers.map((driver, idx) => (
                    <li key={idx}>{driver}</li>
                  ))}
                </ul>
              </div>
            )}
            {aiInsight.actuarialNote && (
              <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 italic">
                Note: {aiInsight.actuarialNote} (Engine source: {aiInsight.source})
              </div>
            )}
          </div>
        )}

        {!aiInsight && !loadingAi && (
          <p className="text-xs text-slate-500">
            Click above to generate comprehensive AI-assisted actuarial commentary synthesized with the latest risk model parameters.
          </p>
        )}
      </div>

      {/* Mandatory Statutory & Educational Disclaimer */}
      <div className="p-4 bg-slate-100/80 rounded-lg border border-slate-200 text-[11px] text-slate-600 space-y-1.5 leading-relaxed">
        <div className="font-bold text-slate-800 uppercase tracking-wide text-[10px]">
          Statutory Disclosure & Educational Prototype Notice
        </div>
        <p>
          "This is an illustrative insurance premium estimate generated using configurable prototype assumptions. It is not a binding insurance quotation, an offer of insurance or a policy of insurance. Actual premiums and acceptance are subject to insurer underwriting, policy terms and applicable regulations."
        </p>
        <p className="text-slate-500">
          Supervisory context: Federal Republic of Nigeria insurance activities are regulated by the National Insurance Commission (NAICOM). United Kingdom motor insurance operations are regulated by the Prudential Regulation Authority (PRA) and Financial Conduct Authority (FCA).
        </p>
      </div>
    </div>
  );
};
