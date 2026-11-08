/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from 'jspdf';
import { InsuranceApplicationRecord } from '../types/insurance';

export function generateQuotationPDF(record: InsuranceApplicationRecord): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const currency = record.marketConfig.currencySymbol;

  // Colors
  const navy = [15, 23, 42]; // #0F172A
  const slate = [71, 85, 105]; // #475569
  const teal = [13, 148, 136]; // #0D9488
  const lightBg = [248, 250, 252]; // #F8FAFC
  const borderCol = [226, 232, 240]; // #E2E8F0

  // 1. Header Banner
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('MOTOR INSURANCE PREMIUM PREDICTOR', 14, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text('Actuarial Risk Assessment & Indicative Quotation Schedule', 14, 20);

  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(`Market: ${record.marketConfig.countryName} (${record.marketConfig.currencyCode})`, pageWidth - 14, 13, { align: 'right' });
  doc.text(`ID: ${record.id}`, pageWidth - 14, 20, { align: 'right' });

  // 2. Sub-Header Notice
  let y = 36;
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
  doc.roundedRect(14, y, pageWidth - 28, 14, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text('DOCUMENT CLASSIFICATION: PROTOTYPE UNDERWRITING ESTIMATE', 18, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  const createdDate = new Date(record.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const expiryDate = new Date(new Date(record.createdAt).getTime() + (record.marketConfig.quotationValidityDays || 30) * 86400000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  doc.text(`Quotation Date: ${createdDate}   |   Valid Until: ${expiryDate}   |   Status: ${record.status.toUpperCase()}`, 18, y + 11);

  // 3. Section: Applicant & Vehicle Details (2-Column Grid)
  y = 56;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text('1. APPLICANT & RISK EXPOSURE PROFILE', 14, y);

  y += 5;
  const colWidth = (pageWidth - 32) / 2;

  // Left Column Box: Applicant
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(14, y, colWidth, 42, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(teal[0], teal[1], teal[2]);
  doc.text('Policyholder Credentials', 18, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text(`Full Name: ${record.applicant.fullName}`, 18, y + 14);
  doc.text(`Age & Licensure: ${record.applicant.age} yrs (${record.applicant.yearsOfDriving} yrs licensed)`, 18, y + 20);
  doc.text(`Contact: ${record.applicant.email}`, 18, y + 26);
  doc.text(`Location: ${record.applicant.city}, ${record.applicant.stateOrRegion}`, 18, y + 32);
  doc.text(`Claims & Violations: ${record.drivingHistory.previousAccidents} accident(s) / ${record.drivingHistory.violations} violation(s)`, 18, y + 38);

  // Right Column Box: Vehicle
  const rightX = 14 + colWidth + 4;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(rightX, y, colWidth, 42, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(teal[0], teal[1], teal[2]);
  doc.text('Insured Vehicle Specifications', rightX + 4, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text(`Vehicle: ${record.vehicle.year} ${record.vehicle.make} ${record.vehicle.model}`, rightX + 4, y + 14);
  doc.text(`Category & Engine: ${record.vehicle.vehicleType.toUpperCase()} / ${record.vehicle.engineCapacityCc}cc`, rightX + 4, y + 20);
  doc.text(`Insured Declared Value: ${currency}${record.vehicle.vehicleValue.toLocaleString()}`, rightX + 4, y + 26);
  doc.text(`Usage & Annual Mileage: ${record.vehicle.usage.toUpperCase()} (${record.vehicle.annualMileage.toLocaleString()} km/mi)`, rightX + 4, y + 32);
  doc.text(`Security / Parking: ${record.security.parkingLocation.replace('_', ' ')} (${record.security.hasAntiTheftDevice ? 'Anti-Theft Active' : 'Standard'})`, rightX + 4, y + 38);

  // 4. Section: Risk Score Summary
  y += 48;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text('2. ACTUARIAL RISK SCORE & UNDERWRITING TIER', 14, y);

  y += 5;
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.roundedRect(14, y, pageWidth - 28, 20, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  const score = record.riskAssessment.overallScore;
  const riskClass = record.riskAssessment.riskClassification;
  doc.setTextColor(riskClass === 'Low' ? 16 : riskClass === 'High' ? 220 : 217, riskClass === 'Low' ? 163 : riskClass === 'High' ? 38 : 119, riskClass === 'Low' ? 74 : riskClass === 'High' ? 38 : 6);
  doc.text(`Overall Risk Score: ${score}/100  [${riskClass.toUpperCase()} RISK CLASSIFICATION]`, 18, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  doc.text(
    `Sub-Scores: Driver (${record.riskAssessment.scoreBreakdown.driverProfile.score}/25)  ·  Vehicle (${record.riskAssessment.scoreBreakdown.vehicleHazard.score}/20)  ·  Claims (${record.riskAssessment.scoreBreakdown.claimsHistory.score}/30)  ·  Security (${record.riskAssessment.scoreBreakdown.securityEnvironment.score}/15)  ·  Mileage (${record.riskAssessment.scoreBreakdown.mileageUsage.score}/10)`,
    18,
    y + 14
  );

  // 5. Section: Actuarial Premium Breakdown Table
  y += 26;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text('3. ACTUARIAL PREMIUM CALCULATION BREAKDOWN', 14, y);

  y += 4;
  doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
  doc.setFillColor(navy[0], navy[1], navy[2]);
  doc.rect(14, y, pageWidth - 28, 7, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('Item / Actuarial Component', 18, y + 5);
  doc.text('Basis / Formula Reference', 90, y + 5);
  doc.text(`Amount (${record.marketConfig.currencyCode})`, pageWidth - 18, y + 5, { align: 'right' });

  y += 7;
  const tableRows = [
    {
      item: 'Expected Claim Frequency (λ)',
      basis: 'Poisson GLM annual collision incidence',
      amount: `${(record.pricing.claimFrequency * 100).toFixed(2)}%`,
      isHeader: false,
    },
    {
      item: 'Expected Claim Severity (S)',
      basis: 'Gamma GLM repair & total loss severity',
      amount: `${currency}${record.pricing.claimSeverity.toLocaleString()}`,
      isHeader: false,
    },
    {
      item: 'Pure Premium (Expected Loss Cost)',
      basis: 'Frequency × Severity (Pure Risk)',
      amount: `${currency}${record.pricing.purePremium.toLocaleString()}`,
      isHeader: false,
    },
    {
      item: 'Fixed Administrative Expenses',
      basis: 'Underwriting ops, portal & MID admin',
      amount: `${currency}${record.pricing.fixedExpenses.toLocaleString()}`,
      isHeader: false,
    },
    {
      item: 'Reinsurance Loading',
      basis: `${(record.marketConfig.reinsuranceLoadingRatio * 100).toFixed(1)}% treaty protection`,
      amount: `${currency}${record.pricing.reinsuranceCost.toLocaleString()}`,
      isHeader: false,
    },
    {
      item: 'Variable Acquisition & Distribution',
      basis: `${(record.marketConfig.variableExpenseRatio * 100).toFixed(1)}% intermediary brokerage`,
      amount: `${currency}${record.pricing.variableExpenses.toLocaleString()}`,
      isHeader: false,
    },
    {
      item: 'Risk & Profit Loading Margin',
      basis: `${(record.marketConfig.riskProfitLoadingRatio * 100).toFixed(1)}% target return on capital`,
      amount: `${currency}${record.pricing.riskAndProfitLoading.toLocaleString()}`,
      isHeader: false,
    },
    {
      item: 'Statutory Taxes & Regulatory Charges',
      basis: record.pricing.statutoryChargesBreakdown.map((c) => `${c.name} (${c.rateStr})`).join(', ') || 'Applicable duties',
      amount: `${currency}${record.pricing.totalStatutoryCharges.toLocaleString()}`,
      isHeader: false,
    },
  ];

  tableRows.forEach((row, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
    doc.rect(14, y, pageWidth - 28, 6.5, 'F');
    doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
    doc.line(14, y + 6.5, pageWidth - 14, y + 6.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.text(row.item, 18, y + 4.5);
    doc.setTextColor(slate[0], slate[1], slate[2]);
    doc.text(row.basis, 90, y + 4.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(navy[0], navy[1], navy[2]);
    doc.text(row.amount, pageWidth - 18, y + 4.5, { align: 'right' });

    y += 6.5;
  });

  // Final Total Row
  doc.setFillColor(15, 23, 42);
  doc.rect(14, y, pageWidth - 28, 9, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL ESTIMATED ANNUAL PREMIUM PAYABLE', 18, y + 6);
  doc.setFontSize(10);
  doc.setTextColor(45, 212, 191); // Teal 400
  doc.text(`${currency}${record.pricing.finalGrossPremium.toLocaleString()}`, pageWidth - 18, y + 6, { align: 'right' });

  // 6. Underwriting & Legal Disclaimers
  y += 16;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(navy[0], navy[1], navy[2]);
  doc.text('IMPORTANT REGULATORY NOTICE & UNDERWRITING DISCLAIMER', 14, y);

  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(slate[0], slate[1], slate[2]);
  const disclaimerText =
    'This document provides an illustrative insurance premium estimate generated using configurable prototype actuarial assumptions and deterministic risk relativities for educational and portfolio demonstration. It does not constitute a legally binding insurance contract, binder, or official policy of insurance. Final acceptance, actual premiums, deductible terms, and statutory levies are strictly subject to physical vehicle inspection, document verification, and underwriter discretion under applicable local insurance regulations (NAICOM in Nigeria / PRA & FCA in the United Kingdom).';
  
  const splitDisclaimer = doc.splitTextToSize(disclaimerText, pageWidth - 28);
  doc.text(splitDisclaimer, 14, y);

  // Footer
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Motor Insurance Premium Predictor · Model Engine Version: ${record.marketConfig.modelVersion} · Generated: ${new Date().toISOString()}`,
    14,
    285
  );

  doc.save(`Quotation_${record.id}.pdf`);
}
