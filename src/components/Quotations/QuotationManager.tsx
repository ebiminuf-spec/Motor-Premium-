/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  FileDown,
  Eye,
  Trash2,
  Download,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import {
  InsuranceApplicationRecord,
  CountryCode,
  QuotationStatus,
} from '../../types/insurance';
import { generateQuotationPDF } from '../../services/pdfService';
import {
  updateApplicationStatus,
  deleteApplication,
  exportApplicationsToCSV,
} from '../../services/storageService';

interface QuotationManagerProps {
  applications: InsuranceApplicationRecord[];
  activeMarket: CountryCode;
  onSelectApplication: (app: InsuranceApplicationRecord) => void;
  onRefreshList: () => void;
}

export const QuotationManager: React.FC<QuotationManagerProps> = ({
  applications,
  activeMarket,
  onSelectApplication,
  onRefreshList,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState<'ALL' | 'NG' | 'GB'>(activeMarket);
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [coverageFilter, setCoverageFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Filtered quotations
  const filteredQuotations = useMemo(() => {
    return applications.filter((app) => {
      const matchCountry = countryFilter === 'ALL' || app.applicant.country === countryFilter;
      const matchRisk = riskFilter === 'ALL' || app.riskAssessment.riskClassification === riskFilter;
      const matchCoverage = coverageFilter === 'ALL' || app.coverage.coverageType === coverageFilter;
      const matchStatus = statusFilter === 'ALL' || app.status === statusFilter;

      const q = searchTerm.toLowerCase();
      const matchSearch =
        q === '' ||
        app.id.toLowerCase().includes(q) ||
        app.applicant.fullName.toLowerCase().includes(q) ||
        app.applicant.email.toLowerCase().includes(q) ||
        app.vehicle.make.toLowerCase().includes(q) ||
        app.vehicle.model.toLowerCase().includes(q);

      return matchCountry && matchRisk && matchCoverage && matchStatus && matchSearch;
    });
  }, [applications, countryFilter, riskFilter, coverageFilter, statusFilter, searchTerm]);

  const handleStatusChange = (id: string, newStatus: QuotationStatus) => {
    updateApplicationStatus(id, newStatus);
    onRefreshList();
  };

  const handleDelete = (id: string) => {
    if (confirm(`Are you sure you want to delete quotation ${id}?`)) {
      deleteApplication(id);
      onRefreshList();
    }
  };

  const handleExportCSV = () => {
    const csvData = exportApplicationsToCSV();
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Motor_Insurance_Quotations_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="text-xs text-slate-500 mb-1">
            <span>Policy Underwriting Administration</span>
            <span aria-hidden="true" className="mx-1.5">·</span>
            <span>Quotation Lifecycle Management</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Quotation Management</h1>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4 text-teal-600" />
          <span>Export All to CSV</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by ID, applicant name, vehicle, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Country Selector */}
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value as any)}
              className="py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 font-medium"
            >
              <option value="ALL">All Markets</option>
              <option value="NG">Nigeria (₦)</option>
              <option value="GB">United Kingdom (£)</option>
            </select>

            {/* Risk Tier */}
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="ALL">All Risk Tiers</option>
              <option value="Low">Low Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="High">High Risk</option>
            </select>

            {/* Coverage Type */}
            <select
              value={coverageFilter}
              onChange={(e) => setCoverageFilter(e.target.value)}
              className="py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="ALL">All Coverages</option>
              <option value="COMPREHENSIVE">Comprehensive</option>
              <option value="THIRD_PARTY_FIRE_THEFT">TP Fire & Theft</option>
              <option value="THIRD_PARTY">Third Party</option>
            </select>

            {/* Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Estimated">Estimated</option>
              <option value="Under Review">Under Review</option>
              <option value="Expired">Expired</option>
            </select>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex items-center justify-between">
          <span>Showing {filteredQuotations.length} of {applications.length} total recorded quotations</span>
          <span className="italic">Note: Prototype quotations expire after 30 days</span>
        </div>
      </div>

      {/* Quotations Data Grid */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
              <tr>
                <th className="py-3 px-4 font-semibold">Quotation ID</th>
                <th className="py-3 px-4 font-semibold">Applicant</th>
                <th className="py-3 px-4 font-semibold">Vehicle Specs</th>
                <th className="py-3 px-4 font-semibold">Coverage</th>
                <th className="py-3 px-4 font-semibold">Risk Class</th>
                <th className="py-3 px-4 font-semibold text-right">Gross Premium</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredQuotations.length > 0 ? (
                filteredQuotations.map((app) => {
                  const symbol = app.marketConfig.currencySymbol;
                  const riskColor =
                    app.riskAssessment.riskClassification === 'Low'
                      ? 'text-teal-700 font-semibold'
                      : app.riskAssessment.riskClassification === 'High'
                      ? 'text-rose-700 font-semibold'
                      : 'text-amber-700 font-semibold';

                  return (
                    <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-900 whitespace-nowrap">
                        {app.id}
                        {app.isDemo && (
                          <span className="ml-1.5 text-[10px] text-slate-400 font-normal">sample</span>
                        )}
                        <div className="text-[10px] text-slate-400 font-normal">
                          {new Date(app.createdAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{app.applicant.fullName}</div>
                        <div className="text-[11px] text-slate-500">
                          {app.applicant.city}, {app.applicant.stateOrRegion} ({app.applicant.country})
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-slate-900">
                          {app.vehicle.year} {app.vehicle.make} {app.vehicle.model}
                        </div>
                        <div className="text-[11px] text-slate-500 uppercase font-mono">
                          {symbol}
                          {app.vehicle.vehicleValue.toLocaleString()} · {app.vehicle.vehicleType}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="text-slate-800 font-medium">
                          {app.coverage.coverageType === 'COMPREHENSIVE'
                            ? 'Comprehensive'
                            : app.coverage.coverageType === 'THIRD_PARTY_FIRE_THEFT'
                            ? 'TP Fire & Theft'
                            : 'Third Party'}
                        </span>
                        <div className="text-[11px] text-slate-400">
                          Excess: {symbol}
                          {app.coverage.deductibleAmount.toLocaleString()}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={riskColor}>
                          {app.riskAssessment.riskClassification} ({app.riskAssessment.overallScore}/100)
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap tabular-nums">
                        {symbol}
                        {app.pricing.finalGrossPremium.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <select
                          value={app.status}
                          onChange={(e) => handleStatusChange(app.id, e.target.value as QuotationStatus)}
                          className="text-[11px] font-medium py-1 px-2 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-700"
                        >
                          <option value="Draft">Draft</option>
                          <option value="Estimated">Estimated</option>
                          <option value="Under Review">Under Review</option>
                          <option value="Expired">Expired</option>
                        </select>
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onSelectApplication(app)}
                            className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-md transition-colors"
                            title="View Full Breakdown Schedule"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => generateQuotationPDF(app)}
                            className="p-1.5 text-slate-600 hover:text-teal-700 hover:bg-slate-100 rounded-md transition-colors"
                            title="Download PDF Quotation Schedule"
                          >
                            <FileDown className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(app.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-md transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No quotation records matching the selected search and filter criteria.
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
