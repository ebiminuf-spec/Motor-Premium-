/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  FileText,
  Calculator,
  ShieldCheck,
  TrendingUp,
  Search,
  Filter,
  Eye,
  ArrowRight,
  ShieldAlert,
  Car,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from 'recharts';
import { InsuranceApplicationRecord, CountryCode, CoverageType } from '../../types/insurance';

interface OverviewDashboardProps {
  applications: InsuranceApplicationRecord[];
  activeMarket: CountryCode;
  onSelectApplication: (app: InsuranceApplicationRecord) => void;
  onNavigateNewApp: () => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  applications,
  activeMarket,
  onSelectApplication,
  onNavigateNewApp,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCoverageFilter, setSelectedCoverageFilter] = useState<string>('ALL');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string>('ALL');

  // Filter applications by market
  const marketApps = useMemo(() => {
    return applications.filter((app) => app.applicant.country === activeMarket);
  }, [applications, activeMarket]);

  const currencySymbol = activeMarket === 'NG' ? '₦' : '£';
  const currencyCode = activeMarket === 'NG' ? 'NGN' : 'GBP';

  // Computed metrics from real underlying records
  const metrics = useMemo(() => {
    const totalSubmitted = marketApps.length;
    const totalQuotations = marketApps.filter((a) => a.status !== 'Draft').length;

    let totalScore = 0;
    let totalPremium = 0;
    let lowCount = 0;
    let medCount = 0;
    let highCount = 0;

    marketApps.forEach((app) => {
      totalScore += app.riskAssessment.overallScore;
      totalPremium += app.pricing.finalGrossPremium;
      if (app.riskAssessment.riskClassification === 'Low') lowCount++;
      else if (app.riskAssessment.riskClassification === 'Medium') medCount++;
      else if (app.riskAssessment.riskClassification === 'High') highCount++;
    });

    const avgRiskScore = totalSubmitted > 0 ? Math.round(totalScore / totalSubmitted) : 0;
    const avgPremium = totalSubmitted > 0 ? Math.round(totalPremium / totalSubmitted) : 0;

    return {
      totalSubmitted,
      totalQuotations,
      avgRiskScore,
      avgPremium,
      lowCount,
      medCount,
      highCount,
    };
  }, [marketApps]);

  // Risk Category Distribution for Pie Chart
  const riskDistributionData = useMemo(() => {
    return [
      { name: 'Low Risk (0-39)', value: metrics.lowCount, color: '#0D9488' }, // Teal
      { name: 'Medium Risk (40-69)', value: metrics.medCount, color: '#D97706' }, // Amber
      { name: 'High Risk (70-100)', value: metrics.highCount, color: '#DC2626' }, // Crimson
    ].filter((item) => item.value > 0);
  }, [metrics]);

  // Premium Distribution Bands
  const premiumBandsData = useMemo(() => {
    if (marketApps.length === 0) return [];
    if (activeMarket === 'NG') {
      const bands = [
        { band: '< ₦50k', count: 0 },
        { band: '₦50k - ₦200k', count: 0 },
        { band: '₦200k - ₦500k', count: 0 },
        { band: '₦500k - ₦1M', count: 0 },
        { band: '> ₦1M', count: 0 },
      ];
      marketApps.forEach((app) => {
        const p = app.pricing.finalGrossPremium;
        if (p < 50000) bands[0].count++;
        else if (p < 200000) bands[1].count++;
        else if (p < 500000) bands[2].count++;
        else if (p < 1000000) bands[3].count++;
        else bands[4].count++;
      });
      return bands;
    } else {
      const bands = [
        { band: '< £400', count: 0 },
        { band: '£400 - £750', count: 0 },
        { band: '£750 - £1.2k', count: 0 },
        { band: '£1.2k - £2k', count: 0 },
        { band: '> £2k', count: 0 },
      ];
      marketApps.forEach((app) => {
        const p = app.pricing.finalGrossPremium;
        if (p < 400) bands[0].count++;
        else if (p < 750) bands[1].count++;
        else if (p < 1200) bands[2].count++;
        else if (p < 2000) bands[3].count++;
        else bands[4].count++;
      });
      return bands;
    }
  }, [marketApps, activeMarket]);

  // Average Premium by Coverage Type
  const coverageComparisonData = useMemo(() => {
    const coverageMap: Record<CoverageType, { total: number; count: number; label: string }> = {
      COMPREHENSIVE: { total: 0, count: 0, label: 'Comprehensive' },
      THIRD_PARTY_FIRE_THEFT: { total: 0, count: 0, label: 'TP Fire & Theft' },
      THIRD_PARTY: { total: 0, count: 0, label: 'Third-Party Only' },
    };

    marketApps.forEach((app) => {
      const cov = app.coverage.coverageType;
      if (coverageMap[cov]) {
        coverageMap[cov].total += app.pricing.finalGrossPremium;
        coverageMap[cov].count++;
      }
    });

    return Object.entries(coverageMap).map(([_, data]) => ({
      coverage: data.label,
      averagePremium: data.count > 0 ? Math.round(data.total / data.count) : 0,
      count: data.count,
    }));
  }, [marketApps]);

  // Vehicle Type Breakdown
  const vehicleTypeData = useMemo(() => {
    const counts: Record<string, number> = {};
    marketApps.forEach((app) => {
      const t = app.vehicle.vehicleType;
      counts[t] = (counts[t] || 0) + 1;
    });
    return Object.entries(counts).map(([type, count]) => ({
      type: type.replace('_', ' ').toUpperCase(),
      count,
    }));
  }, [marketApps]);

  // Applications timeline
  const timelineData = useMemo(() => {
    const dates: Record<string, number> = {};
    marketApps.forEach((app) => {
      const d = new Date(app.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dates[d] = (dates[d] || 0) + 1;
    });
    return Object.entries(dates).map(([date, count]) => ({ date, applications: count }));
  }, [marketApps]);

  // Filtered recent applications table
  const filteredApps = useMemo(() => {
    return marketApps.filter((app) => {
      const matchSearch =
        searchTerm === '' ||
        app.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.applicant.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.vehicle.model.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCoverage =
        selectedCoverageFilter === 'ALL' || app.coverage.coverageType === selectedCoverageFilter;

      const matchRisk =
        selectedRiskFilter === 'ALL' || app.riskAssessment.riskClassification === selectedRiskFilter;

      return matchSearch && matchCoverage && matchRisk;
    });
  }, [marketApps, searchTerm, selectedCoverageFilter, selectedRiskFilter]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Portfolio Intelligence</span>
            <span aria-hidden="true">·</span>
            <span className="font-medium text-slate-700">
              {activeMarket === 'NG' ? 'Nigeria Motor Portfolio (₦)' : 'United Kingdom Motor Portfolio (£)'}
            </span>
            <span aria-hidden="true">·</span>
            <span>Actuarial Models Active</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Overview Dashboard</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateNewApp}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
          >
            <span>New Insurance Application</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Stat Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="p-4 bg-white rounded-lg border border-slate-200">
          <div className="text-xs text-slate-500 font-medium">Total Applications</div>
          <div className="text-xl font-bold text-slate-900 mt-1 font-mono tabular-nums">
            {metrics.totalSubmitted}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Logged records</div>
        </div>

        <div className="p-4 bg-white rounded-lg border border-slate-200">
          <div className="text-xs text-slate-500 font-medium">Quotations Active</div>
          <div className="text-xl font-bold text-teal-700 mt-1 font-mono tabular-nums">
            {metrics.totalQuotations}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Generated schedules</div>
        </div>

        <div className="p-4 bg-white rounded-lg border border-slate-200">
          <div className="text-xs text-slate-500 font-medium">Average Premium</div>
          <div className="text-xl font-bold text-slate-900 mt-1 font-mono tabular-nums">
            {currencySymbol}
            {metrics.avgPremium.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Per annualized risk</div>
        </div>

        <div className="p-4 bg-white rounded-lg border border-slate-200">
          <div className="text-xs text-slate-500 font-medium">Avg Risk Score</div>
          <div className="text-xl font-bold text-slate-900 mt-1 font-mono tabular-nums">
            {metrics.avgRiskScore}
            <span className="text-xs font-normal text-slate-400">/100</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Normalized index</div>
        </div>

        <div className="p-4 bg-white rounded-lg border border-slate-200">
          <div className="text-xs text-slate-500 font-medium">Low Risk</div>
          <div className="text-xl font-bold text-teal-600 mt-1 font-mono tabular-nums">
            {metrics.lowCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Score 0 - 39</div>
        </div>

        <div className="p-4 bg-white rounded-lg border border-slate-200">
          <div className="text-xs text-slate-500 font-medium">Medium Risk</div>
          <div className="text-xl font-bold text-amber-600 mt-1 font-mono tabular-nums">
            {metrics.medCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Score 40 - 69</div>
        </div>

        <div className="p-4 bg-white rounded-lg border border-slate-200">
          <div className="text-xs text-slate-500 font-medium">High Risk</div>
          <div className="text-xl font-bold text-rose-600 mt-1 font-mono tabular-nums">
            {metrics.highCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Score 70 - 100</div>
        </div>
      </div>

      {/* Visualizations Section (Grid Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Risk Distribution Donut */}
        <div className="p-5 bg-white rounded-lg border border-slate-200 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Risk Category Distribution</h3>
              <p className="text-xs text-slate-500 mt-0.5">Underwriting portfolio risk tiers</p>
            </div>
          </div>
          <div className="h-56 w-full">
            {riskDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {riskDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any) => [`${value} applications`, name]}
                    contentStyle={{ fontSize: '12px', borderRadius: '6px' }}
                  />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No market data logged yet
              </div>
            )}
          </div>
        </div>

        {/* Premium Band Distribution Bar */}
        <div className="p-5 bg-white rounded-lg border border-slate-200 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Estimated Premium Distribution</h3>
              <p className="text-xs text-slate-500 mt-0.5">Applications per gross premium tier</p>
            </div>
          </div>
          <div className="h-56 w-full">
            {premiumBandsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={premiumBandsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="band" tick={{ fontSize: 10, fill: '#64748B' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                  <Tooltip
                    formatter={(value: any) => [`${value} applications`, 'Volume']}
                    contentStyle={{ fontSize: '12px', borderRadius: '6px' }}
                  />
                  <Bar dataKey="count" fill="#0F172A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No distribution data
              </div>
            )}
          </div>
        </div>

        {/* Average Premium by Coverage Type */}
        <div className="p-5 bg-white rounded-lg border border-slate-200 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Premium by Coverage Type</h3>
              <p className="text-xs text-slate-500 mt-0.5">Average estimated rate per policy class</p>
            </div>
          </div>
          <div className="h-56 w-full">
            {coverageComparisonData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={coverageComparisonData}
                  layout="vertical"
                  margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: '#64748B' }}
                    tickFormatter={(v) => `${currencySymbol}${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`}
                  />
                  <YAxis type="category" dataKey="coverage" tick={{ fontSize: 10, fill: '#334155' }} width={85} />
                  <Tooltip
                    formatter={(val: any) => [`${currencySymbol}${Number(val).toLocaleString()}`, 'Average Premium']}
                    contentStyle={{ fontSize: '12px', borderRadius: '6px' }}
                  />
                  <Bar dataKey="averagePremium" fill="#0D9488" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No coverage comparison data
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Applications Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Recent Applications & Quotations</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live underwriting log for {activeMarket === 'NG' ? 'Nigeria' : 'United Kingdom'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search ID, name, vehicle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            {/* Coverage Filter */}
            <select
              value={selectedCoverageFilter}
              onChange={(e) => setSelectedCoverageFilter(e.target.value)}
              className="py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-700"
            >
              <option value="ALL">All Coverage</option>
              <option value="COMPREHENSIVE">Comprehensive</option>
              <option value="THIRD_PARTY_FIRE_THEFT">TP Fire & Theft</option>
              <option value="THIRD_PARTY">Third Party</option>
            </select>

            {/* Risk Filter */}
            <select
              value={selectedRiskFilter}
              onChange={(e) => setSelectedRiskFilter(e.target.value)}
              className="py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-700"
            >
              <option value="ALL">All Risk Tiers</option>
              <option value="Low">Low Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="High">High Risk</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-600 font-medium">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Application ID</th>
                <th className="py-2.5 px-4 font-semibold">Applicant</th>
                <th className="py-2.5 px-4 font-semibold">Vehicle</th>
                <th className="py-2.5 px-4 font-semibold">Coverage</th>
                <th className="py-2.5 px-4 font-semibold">Risk Tier</th>
                <th className="py-2.5 px-4 font-semibold text-right">Estimated Premium</th>
                <th className="py-2.5 px-4 font-semibold">Date</th>
                <th className="py-2.5 px-4 font-semibold">Status</th>
                <th className="py-2.5 px-4 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredApps.length > 0 ? (
                filteredApps.map((app) => {
                  const riskColor =
                    app.riskAssessment.riskClassification === 'Low'
                      ? 'text-teal-700 font-medium'
                      : app.riskAssessment.riskClassification === 'High'
                      ? 'text-rose-700 font-medium'
                      : 'text-amber-700 font-medium';

                  return (
                    <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-900 whitespace-nowrap">
                        {app.id}
                        {app.isDemo && (
                          <span className="ml-1.5 text-[10px] text-slate-400 font-normal">sample</span>
                        )}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-900">{app.applicant.fullName}</div>
                        <div className="text-[11px] text-slate-500">
                          {app.applicant.city}, {app.applicant.stateOrRegion}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="text-slate-900">
                          {app.vehicle.year} {app.vehicle.make} {app.vehicle.model}
                        </div>
                        <div className="text-[11px] text-slate-500 uppercase">
                          {app.vehicle.vehicleType.replace('_', ' ')} · {currencySymbol}
                          {app.vehicle.vehicleValue.toLocaleString()}
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                        {app.coverage.coverageType === 'COMPREHENSIVE'
                          ? 'Comprehensive'
                          : app.coverage.coverageType === 'THIRD_PARTY_FIRE_THEFT'
                          ? 'TP Fire & Theft'
                          : 'Third Party'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={riskColor}>
                          {app.riskAssessment.riskClassification} ({app.riskAssessment.overallScore})
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900 whitespace-nowrap tabular-nums">
                        {currencySymbol}
                        {app.pricing.finalGrossPremium.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        {new Date(app.createdAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="text-[11px] text-slate-600 font-medium">{app.status}</span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => onSelectApplication(app)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-teal-700 hover:text-teal-800 hover:bg-teal-50 rounded-md transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No matching application records found for this market.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
