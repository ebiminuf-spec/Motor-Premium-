/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Globe2,
  Car,
  ShieldAlert,
  Calendar,
  Filter,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { InsuranceApplicationRecord, CountryCode } from '../../types/insurance';

interface AnalyticsDashboardProps {
  applications: InsuranceApplicationRecord[];
  activeMarket: CountryCode;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  applications,
  activeMarket,
}) => {
  const [filterCountry, setFilterCountry] = useState<'ALL' | 'NG' | 'GB'>('ALL');
  const [filterCoverage, setFilterCoverage] = useState<string>('ALL');
  const [filterRisk, setFilterRisk] = useState<string>('ALL');

  // Filter records
  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      const matchCountry = filterCountry === 'ALL' || app.applicant.country === filterCountry;
      const matchCoverage = filterCoverage === 'ALL' || app.coverage.coverageType === filterCoverage;
      const matchRisk = filterRisk === 'ALL' || app.riskAssessment.riskClassification === filterRisk;
      return matchCountry && matchCoverage && matchRisk;
    });
  }, [applications, filterCountry, filterCoverage, filterRisk]);

  // Aggregate KPI stats
  const analyticsSummary = useMemo(() => {
    const total = filteredApps.length;
    let totalVal = 0;
    let totalScore = 0;
    let totalAccidents = 0;

    filteredApps.forEach((app) => {
      totalVal += app.vehicle.vehicleValue;
      totalScore += app.riskAssessment.overallScore;
      totalAccidents += app.drivingHistory.previousAccidents;
    });

    const avgVal = total > 0 ? Math.round(totalVal / total) : 0;
    const avgScore = total > 0 ? Math.round(totalScore / total) : 0;
    const avgAccidents = total > 0 ? (totalAccidents / total).toFixed(2) : '0';

    return { total, avgVal, avgScore, avgAccidents };
  }, [filteredApps]);

  // Chart 1: Applications by Country
  const countryBreakdown = useMemo(() => {
    let ngCount = 0;
    let gbCount = 0;
    filteredApps.forEach((a) => {
      if (a.applicant.country === 'NG') ngCount++;
      else gbCount++;
    });
    return [
      { name: 'Nigeria (NG)', count: ngCount, color: '#0D9488' },
      { name: 'United Kingdom (GB)', count: gbCount, color: '#0F172A' },
    ].filter((item) => item.count > 0);
  }, [filteredApps]);

  // Chart 2: Average Premium by Vehicle Type
  const vehicleTypePremiums = useMemo(() => {
    const stats: Record<string, { totalNG: number; countNG: number; totalGB: number; countGB: number }> = {};
    filteredApps.forEach((app) => {
      const t = app.vehicle.vehicleType;
      if (!stats[t]) stats[t] = { totalNG: 0, countNG: 0, totalGB: 0, countGB: 0 };
      if (app.applicant.country === 'NG') {
        stats[t].totalNG += app.pricing.finalGrossPremium;
        stats[t].countNG++;
      } else {
        stats[t].totalGB += app.pricing.finalGrossPremium;
        stats[t].countGB++;
      }
    });

    return Object.entries(stats).map(([type, s]) => ({
      type: type.replace('_', ' ').toUpperCase(),
      avgNG: s.countNG > 0 ? Math.round(s.totalNG / s.countNG) : 0,
      avgGB: s.countGB > 0 ? Math.round(s.totalGB / s.countGB) : 0,
    }));
  }, [filteredApps]);

  // Chart 3: Average Premium by Coverage Type
  const coveragePremiums = useMemo(() => {
    const stats: Record<string, { totalNG: number; countNG: number; totalGB: number; countGB: number }> = {
      COMPREHENSIVE: { totalNG: 0, countNG: 0, totalGB: 0, countGB: 0 },
      THIRD_PARTY_FIRE_THEFT: { totalNG: 0, countNG: 0, totalGB: 0, countGB: 0 },
      THIRD_PARTY: { totalNG: 0, countNG: 0, totalGB: 0, countGB: 0 },
    };

    filteredApps.forEach((app) => {
      const c = app.coverage.coverageType;
      if (stats[c]) {
        if (app.applicant.country === 'NG') {
          stats[c].totalNG += app.pricing.finalGrossPremium;
          stats[c].countNG++;
        } else {
          stats[c].totalGB += app.pricing.finalGrossPremium;
          stats[c].countGB++;
        }
      }
    });

    return [
      {
        coverage: 'Comprehensive',
        avgNG: stats.COMPREHENSIVE.countNG > 0 ? Math.round(stats.COMPREHENSIVE.totalNG / stats.COMPREHENSIVE.countNG) : 0,
        avgGB: stats.COMPREHENSIVE.countGB > 0 ? Math.round(stats.COMPREHENSIVE.totalGB / stats.COMPREHENSIVE.countGB) : 0,
      },
      {
        coverage: 'TP Fire & Theft',
        avgNG: stats.THIRD_PARTY_FIRE_THEFT.countNG > 0 ? Math.round(stats.THIRD_PARTY_FIRE_THEFT.totalNG / stats.THIRD_PARTY_FIRE_THEFT.countNG) : 0,
        avgGB: stats.THIRD_PARTY_FIRE_THEFT.countGB > 0 ? Math.round(stats.THIRD_PARTY_FIRE_THEFT.totalGB / stats.THIRD_PARTY_FIRE_THEFT.countGB) : 0,
      },
      {
        coverage: 'Third Party',
        avgNG: stats.THIRD_PARTY.countNG > 0 ? Math.round(stats.THIRD_PARTY.totalNG / stats.THIRD_PARTY.countNG) : 0,
        avgGB: stats.THIRD_PARTY.countGB > 0 ? Math.round(stats.THIRD_PARTY.totalGB / stats.THIRD_PARTY.countGB) : 0,
      },
    ];
  }, [filteredApps]);

  // Chart 4: Risk Distribution
  const riskClassData = useMemo(() => {
    let low = 0;
    let med = 0;
    let high = 0;
    filteredApps.forEach((a) => {
      if (a.riskAssessment.riskClassification === 'Low') low++;
      else if (a.riskAssessment.riskClassification === 'Medium') med++;
      else high++;
    });

    return [
      { name: 'Low Risk', count: low, color: '#0D9488' },
      { name: 'Medium Risk', count: med, color: '#D97706' },
      { name: 'High Risk', count: high, color: '#DC2626' },
    ];
  }, [filteredApps]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="text-xs text-slate-500 mb-1">
            <span>Executive Portfolio Reporting</span>
            <span aria-hidden="true" className="mx-1.5">·</span>
            <span>Actuarial Analytics & Cross-Market Benchmarking</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Portfolio Actuarial Analytics
          </h1>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterCountry}
            onChange={(e) => setFilterCountry(e.target.value as any)}
            className="py-1.5 px-3 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
          >
            <option value="ALL">All Markets (NG & GB)</option>
            <option value="NG">Nigeria (₦)</option>
            <option value="GB">United Kingdom (£)</option>
          </select>

          <select
            value={filterCoverage}
            onChange={(e) => setFilterCoverage(e.target.value)}
            className="py-1.5 px-3 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="ALL">All Coverages</option>
            <option value="COMPREHENSIVE">Comprehensive</option>
            <option value="THIRD_PARTY_FIRE_THEFT">TP Fire & Theft</option>
            <option value="THIRD_PARTY">Third Party</option>
          </select>

          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            className="py-1.5 px-3 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="ALL">All Risk Tiers</option>
            <option value="Low">Low Risk</option>
            <option value="Medium">Medium Risk</option>
            <option value="High">High Risk</option>
          </select>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-lg border border-slate-200">
          <span className="text-xs text-slate-500 font-medium">Portfolio Sample Size</span>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono tabular-nums">
            {analyticsSummary.total}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Policies evaluated</div>
        </div>

        <div className="p-4 bg-white rounded-lg border border-slate-200">
          <span className="text-xs text-slate-500 font-medium">Mean Risk Score</span>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono tabular-nums">
            {analyticsSummary.avgScore}
            <span className="text-xs font-normal text-slate-400">/100</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Underwriting index</div>
        </div>

        <div className="p-4 bg-white rounded-lg border border-slate-200">
          <span className="text-xs text-slate-500 font-medium">Mean Historical Accidents</span>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono tabular-nums">
            {analyticsSummary.avgAccidents}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Per applicant past 5 yrs</div>
        </div>

        <div className="p-4 bg-white rounded-lg border border-slate-200">
          <span className="text-xs text-slate-500 font-medium">Portfolio Split</span>
          <div className="text-2xl font-bold text-teal-700 mt-1 font-mono tabular-nums">
            {countryBreakdown.map((c) => `${c.count} ${c.name.includes('NG') ? 'NG' : 'GB'}`).join(' / ') || 'None'}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Market representation</div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Risk Distribution */}
        <div className="p-5 bg-white rounded-lg border border-slate-200 flex flex-col">
          <div className="mb-3">
            <h3 className="text-sm font-bold text-slate-900">Risk Tier Classification</h3>
            <p className="text-xs text-slate-500 mt-0.5">Proportion of portfolio by loss severity score</p>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskClassData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  formatter={(val: any) => [`${val} policies`, 'Count']}
                  contentStyle={{ fontSize: '12px', borderRadius: '6px' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {riskClassData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Portfolio by Market */}
        <div className="p-5 bg-white rounded-lg border border-slate-200 flex flex-col">
          <div className="mb-3">
            <h3 className="text-sm font-bold text-slate-900">Applications by Territorial Market</h3>
            <p className="text-xs text-slate-500 mt-0.5">Underwriting volume: Nigeria vs United Kingdom</p>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={countryBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {countryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any, name: any) => [`${val} applications`, name]}
                  contentStyle={{ fontSize: '12px', borderRadius: '6px' }}
                />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Coverage Average Rate */}
        <div className="p-5 bg-white rounded-lg border border-slate-200 md:col-span-2">
          <div className="mb-3">
            <h3 className="text-sm font-bold text-slate-900">Average Premium by Coverage Class</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Empirical rates across Comprehensive, Third-Party Fire & Theft, and Third-Party legal liability
            </p>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={coveragePremiums} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="coverage" tick={{ fontSize: 11, fill: '#334155' }} />
                <YAxis
                  yAxisId="left"
                  orientation="left"
                  stroke="#0D9488"
                  tick={{ fontSize: 10, fill: '#0D9488' }}
                  tickFormatter={(v) => `₦${Math.round(v / 1000)}k`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#0F172A"
                  tick={{ fontSize: 10, fill: '#0F172A' }}
                  tickFormatter={(v) => `£${v}`}
                />
                <Tooltip
                  formatter={(val: any, name: any) => [
                    name === 'Nigeria Average (₦)' ? `₦${Number(val).toLocaleString()}` : `£${Number(val).toLocaleString()}`,
                    name,
                  ]}
                  contentStyle={{ fontSize: '12px', borderRadius: '6px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar yAxisId="left" dataKey="avgNG" name="Nigeria Average (₦)" fill="#0D9488" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="avgGB" name="UK Average (£)" fill="#0F172A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Analytical Disclaimer */}
      <div className="p-4 bg-slate-100 rounded-lg border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
        <strong>Actuarial Data Governance Note:</strong> Aggregated charts and distribution metrics are computed live from the application database. They reflect mathematical model estimates and educational prototype distributions, not certified retrospective claims experience or audited loss ratios.
      </div>
    </div>
  );
};
