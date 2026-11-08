/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  LayoutDashboard,
  FilePlus2,
  ShieldCheck,
  Calculator,
  FileText,
  BarChart3,
  Sliders,
  SlidersHorizontal,
  Globe2,
  Menu,
  X,
  ShieldAlert,
} from 'lucide-react';
import { CountryCode } from '../../types/insurance';

export type NavSection =
  | 'overview'
  | 'new_application'
  | 'risk_assessment'
  | 'calculator'
  | 'quotations'
  | 'analytics'
  | 'settings'
  | 'simulator';

interface SidebarProps {
  currentSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  activeMarket: CountryCode;
  onMarketChange: (market: CountryCode) => void;
  isAdmin: boolean;
  onToggleAdmin: () => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  onSelectSection,
  activeMarket,
  onMarketChange,
  isAdmin,
  onToggleAdmin,
  mobileMenuOpen,
  setMobileMenuOpen,
}) => {
  const navItems: Array<{ id: NavSection; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'overview', label: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'new_application', label: 'New Application', icon: FilePlus2 },
    { id: 'risk_assessment', label: 'Risk Assessment', icon: ShieldCheck },
    { id: 'calculator', label: 'Premium Calculator', icon: Calculator },
    { id: 'simulator', label: 'What-If Simulator', icon: SlidersHorizontal },
    { id: 'quotations', label: 'Quotations', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Sliders },
  ];

  const handleNavClick = (section: NavSection) => {
    onSelectSection(section);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Top Header */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-teal-600 flex items-center justify-center font-bold text-white text-sm">
            MI
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-white leading-tight">Motor Insurance Predictor</h1>
            <p className="text-[11px] text-slate-400">Actuarial Pricing Engine</p>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-300 hover:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Backdrop for mobile */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Area */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center font-bold text-white shadow-sm">
              MI
            </div>
            <div>
              <div className="text-base font-bold tracking-tight text-white leading-snug">
                Motor Insurance
              </div>
              <div className="text-xs text-teal-400 font-medium">Premium Predictor</div>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Market Filter Switcher */}
        <div className="p-4 border-b border-slate-800">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <Globe2 className="w-3.5 h-3.5 text-teal-400" />
            <span>Target Underwriting Market</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950/70 rounded-lg border border-slate-800">
            <button
              onClick={() => onMarketChange('NG')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-medium rounded-md transition-all ${
                activeMarket === 'NG'
                  ? 'bg-teal-600 text-white shadow-xs font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="font-bold">NG</span>
              <span>Nigeria (₦)</span>
            </button>
            <button
              onClick={() => onMarketChange('GB')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-medium rounded-md transition-all ${
                activeMarket === 'GB'
                  ? 'bg-teal-600 text-white shadow-xs font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="font-bold">GB</span>
              <span>UK (£)</span>
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium rounded-lg transition-colors text-left ${
                  isActive
                    ? 'bg-teal-600/15 text-teal-300 font-semibold border-l-2 border-teal-500'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Demo Admin Mode Toggle & Version Info */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex flex-col">
              <span className="font-medium text-slate-200">Demo Admin Mode</span>
              <span className="text-[10px] text-slate-400">Unlock pricing assumptions</span>
            </div>
            <button
              onClick={onToggleAdmin}
              role="switch"
              aria-checked={isAdmin}
              className={`w-10 h-5 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                isAdmin ? 'bg-teal-600' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.75 ${
                  isAdmin ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Actuarial Engine</span>
            <span className="font-mono text-slate-300">v2.6 Stable</span>
          </div>
        </div>
      </aside>
    </>
  );
};
