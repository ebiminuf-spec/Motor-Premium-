/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Sidebar,
  NavSection,
} from './components/Navigation/Sidebar';
import { OverviewDashboard } from './components/Dashboard/OverviewDashboard';
import { MultiStepApplicationForm } from './components/ApplicationForm/MultiStepApplicationForm';
import { QuotationResultsView } from './components/Results/QuotationResultsView';
import { WhatIfSimulator } from './components/Simulator/WhatIfSimulator';
import { QuotationManager } from './components/Quotations/QuotationManager';
import { AnalyticsDashboard } from './components/Analytics/AnalyticsDashboard';
import { AdminSettings } from './components/Settings/AdminSettings';
import { RiskAssessmentDeepDive } from './components/RiskAssessment/RiskAssessmentDeepDive';
import { StandaloneCalculator } from './components/Calculator/StandaloneCalculator';
import {
  InsuranceApplicationRecord,
  CountryCode,
  MarketPricingConfig,
} from './types/insurance';
import {
  getApplications,
  getStoredMarketConfigs,
} from './services/storageService';
import { DEFAULT_MARKET_CONFIGS } from './config/marketDefaults';
import { PlusCircle, Globe2, Sparkles, Shield, ChevronRight } from 'lucide-react';

export default function App() {
  const [currentSection, setCurrentSection] = useState<NavSection>('overview');
  const [activeMarket, setActiveMarket] = useState<CountryCode>('NG');
  const [isAdmin, setIsAdmin] = useState<boolean>(true); // default true in demo mode for convenient evaluation
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Stored application records
  const [applications, setApplications] = useState<InsuranceApplicationRecord[]>([]);

  // Market configurations
  const [marketConfigs, setMarketConfigs] = useState<Record<CountryCode, MarketPricingConfig>>(() =>
    getStoredMarketConfigs()
  );

  // Selected application for detail view
  const [selectedRecord, setSelectedRecord] = useState<InsuranceApplicationRecord | null>(null);

  // Refresh application data from storage
  const refreshApplications = useCallback(() => {
    const apps = getApplications();
    setApplications(apps);
  }, []);

  // Refresh configs from storage
  const refreshConfigs = useCallback(() => {
    const configs = getStoredMarketConfigs();
    setMarketConfigs(configs);
  }, []);

  useEffect(() => {
    refreshApplications();
    refreshConfigs();
  }, [refreshApplications, refreshConfigs]);

  const activeMarketConfig = marketConfigs[activeMarket] || DEFAULT_MARKET_CONFIGS[activeMarket];

  const handleSelectApplication = (app: InsuranceApplicationRecord) => {
    setSelectedRecord(app);
  };

  const handleApplicationCreated = (app: InsuranceApplicationRecord) => {
    refreshApplications();
    setSelectedRecord(app);
  };

  const handleOpenSimulatorWithApp = (app: InsuranceApplicationRecord) => {
    setSelectedRecord(null);
    setCurrentSection('simulator');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col lg:flex-row antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        currentSection={selectedRecord ? 'overview' : currentSection}
        onSelectSection={(sec) => {
          setSelectedRecord(null);
          setCurrentSection(sec);
        }}
        activeMarket={activeMarket}
        onMarketChange={(m) => setActiveMarket(m)}
        isAdmin={isAdmin}
        onToggleAdmin={() => setIsAdmin(!isAdmin)}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Main Content Viewport Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between gap-4">
          {/* Breadcrumb Trail */}
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 overflow-hidden">
            <span className="text-slate-900 font-semibold truncate">Motor Insurance Predictor</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="capitalize truncate">
              {selectedRecord ? 'Quotation Schedule' : currentSection.replace('_', ' ')}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-mono text-slate-700">
              {activeMarket === 'NG' ? 'NGN ₦' : 'GBP £'}
            </span>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-3 shrink-0">
            {currentSection !== 'new_application' && !selectedRecord && (
              <button
                onClick={() => {
                  setSelectedRecord(null);
                  setCurrentSection('new_application');
                }}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>New Application</span>
              </button>
            )}

            <div className="text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-500" />
              <span>{activeMarket === 'NG' ? 'Nigeria Portfolio' : 'UK Portfolio'}</span>
            </div>
          </div>
        </header>

        {/* Viewport Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {selectedRecord ? (
            <QuotationResultsView
              record={selectedRecord}
              onBack={() => setSelectedRecord(null)}
              onOpenSimulator={handleOpenSimulatorWithApp}
            />
          ) : (
            <>
              {currentSection === 'overview' && (
                <OverviewDashboard
                  applications={applications}
                  activeMarket={activeMarket}
                  onSelectApplication={handleSelectApplication}
                  onNavigateNewApp={() => setCurrentSection('new_application')}
                />
              )}

              {currentSection === 'new_application' && (
                <MultiStepApplicationForm
                  initialMarket={activeMarket}
                  marketConfig={activeMarketConfig}
                  onApplicationCreated={handleApplicationCreated}
                  onCancel={() => setCurrentSection('overview')}
                />
              )}

              {currentSection === 'risk_assessment' && (
                <RiskAssessmentDeepDive activeMarket={activeMarket} />
              )}

              {currentSection === 'calculator' && (
                <StandaloneCalculator
                  activeMarket={activeMarket}
                  marketConfig={activeMarketConfig}
                />
              )}

              {currentSection === 'simulator' && (
                <WhatIfSimulator
                  applications={applications}
                  onOpenDetails={handleSelectApplication}
                />
              )}

              {currentSection === 'quotations' && (
                <QuotationManager
                  applications={applications}
                  activeMarket={activeMarket}
                  onSelectApplication={handleSelectApplication}
                  onRefreshList={refreshApplications}
                />
              )}

              {currentSection === 'analytics' && (
                <AnalyticsDashboard
                  applications={applications}
                  activeMarket={activeMarket}
                />
              )}

              {currentSection === 'settings' && (
                <AdminSettings
                  isAdmin={isAdmin}
                  onToggleAdmin={() => setIsAdmin(!isAdmin)}
                  activeMarket={activeMarket}
                  onMarketConfigUpdated={refreshConfigs}
                />
              )}
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white py-4 px-6 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Motor Insurance Premium Predictor</span>
            <span aria-hidden="true">·</span>
            <span>Educational InsurTech Prototype</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>Actuarial Model: Frequency × Severity</span>
            <span>·</span>
            <span>NAICOM (NG) & PRA/FCA (UK) Compliant Framing</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
