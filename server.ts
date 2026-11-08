import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize Gemini client if API key is provided
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  aiClient = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    geminiConfigured: !!process.env.GEMINI_API_KEY,
  });
});

// AI Actuarial Insight endpoint
app.post('/api/ai/actuarial-insight', async (req: Request, res: Response) => {
  const { applicant, vehicle, riskAssessment, premiumBreakdown, marketConfig } = req.body;

  // Fallback deterministic response generator
  const generateDeterministicInsight = () => {
    const isHighRisk = (riskAssessment?.overallScore || 50) >= 70;
    const isLowRisk = (riskAssessment?.overallScore || 50) < 40;
    const currency = marketConfig?.currencySymbol || '$';

    return {
      underwriterSummary: `Actuarial evaluation for ${applicant?.fullName || 'Applicant'} (${marketConfig?.countryName || 'Market'} portfolio). Overall risk score is evaluated at ${riskAssessment?.overallScore || 50}/100, placing the policyholder in the ${riskAssessment?.riskClassification || 'Medium'} risk tier. Indicative pure risk premium of ${currency}${(premiumBreakdown?.purePremium || 0).toLocaleString()} reflects baseline expected loss exposure with a gross estimated premium of ${currency}${(premiumBreakdown?.grossPremium || 0).toLocaleString()}.`,
      keyRiskDrivers: riskAssessment?.riskDrivers || [
        `Driver age (${applicant?.age || 30} yrs) and driving experience (${applicant?.yearsOfDriving || 5} yrs).`,
        `Vehicle value and specification (${vehicle?.year || 2020} ${vehicle?.make || 'Vehicle'} ${vehicle?.model || ''}).`,
        `Reported claims and violation history (${applicant?.claimsHistory?.previousAccidents || 0} accidents).`,
      ],
      mitigationRecommendations: isHighRisk
        ? [
            'Install certified telematics / GPS tracking unit to monitor driving behavior.',
            'Opt for secure overnight garage parking to lower theft/vandalism probability.',
            'Consider increasing voluntary policy excess (deductible) to reduce annual payable premium.',
          ]
        : isLowRisk
        ? [
            'Applicant qualifies for maximum preferred no-claims discount retention.',
            'Maintain zero-claims record to lock in optimal renewal loading tiers.',
          ]
        : [
            'Recommend telematics driving score review after 6 months for premium discount.',
            'Review vehicle security accessories to qualify for anti-theft credit.',
          ],
      actuarialNote: `Model calibrated using Frequency × Severity baseline with ${marketConfig?.fixedExpenses ? `${currency}${marketConfig.fixedExpenses} fixed expense loading` : 'standard expense loading'} and ${marketConfig?.statutoryTaxRate ? `${marketConfig.statutoryTaxRate}% statutory charge` : 'statutory levies'}. Not a binding commercial policy document.`,
      source: 'deterministic_engine',
    };
  };

  if (!aiClient) {
    return res.json(generateDeterministicInsight());
  }

  try {
    const prompt = `You are a Senior Actuary and Chief Underwriting Officer specializing in motor insurance portfolios in ${marketConfig?.countryName || 'International markets'} (${marketConfig?.currencyCode || 'NGN'}).
Review the following motor insurance risk application and provide concise, professional underwriting commentary.

Applicant:
- Name: ${applicant?.fullName || 'Anonymous'}
- Age: ${applicant?.age}
- Driving Experience: ${applicant?.yearsOfDriving} years
- Country: ${marketConfig?.countryName}
- Previous Accidents: ${applicant?.claimsHistory?.previousAccidents || 0}
- Previous Claims: ${applicant?.claimsHistory?.previousClaims || 0}
- Violations: ${applicant?.claimsHistory?.violations || 0}

Vehicle:
- Make & Model: ${vehicle?.year} ${vehicle?.make} ${vehicle?.model} (${vehicle?.vehicleType})
- Insured Value: ${marketConfig?.currencySymbol}${(vehicle?.vehicleValue || 0).toLocaleString()}
- Usage: ${vehicle?.usage} (${vehicle?.annualMileage || 12000} km/miles per year)
- Security: ${vehicle?.securityFeatures?.join(', ') || 'Standard factory equipment'}

Actuarial Results:
- Risk Score: ${riskAssessment?.overallScore}/100 (${riskAssessment?.riskClassification} Risk)
- Expected Claim Frequency: ${((premiumBreakdown?.claimFrequency || 0) * 100).toFixed(2)}%
- Expected Claim Severity: ${marketConfig?.currencySymbol}${(premiumBreakdown?.claimSeverity || 0).toLocaleString()}
- Pure Premium: ${marketConfig?.currencySymbol}${(premiumBreakdown?.purePremium || 0).toLocaleString()}
- Final Estimated Gross Premium: ${marketConfig?.currencySymbol}${(premiumBreakdown?.grossPremium || 0).toLocaleString()}

Provide your assessment formatted in valid JSON with these exact fields:
{
  "underwriterSummary": "A concise 2-3 sentence executive actuarial assessment for this applicant",
  "keyRiskDrivers": ["3 specific bullet points highlighting primary mathematical drivers of this premium"],
  "mitigationRecommendations": ["2-3 concrete risk-mitigation measures the applicant can take to qualify for a lower premium rate"],
  "actuarialNote": "A 1-sentence note addressing rate adequacy, market risk context, and verification stipulations"
}
Respond with only the valid JSON.`;

    const generatePromise = aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Gemini API timeout')), 6000)
    );

    const response = await Promise.race([generatePromise, timeoutPromise]);

    const responseText = response.text;
    if (responseText) {
      const parsed = JSON.parse(responseText.trim());
      return res.json({
        ...parsed,
        source: 'gemini-3.8-flash',
      });
    }

    return res.json(generateDeterministicInsight());
  } catch (error) {
    console.warn('Gemini actuarial commentary fallback to deterministic:', error);
    return res.json(generateDeterministicInsight());
  }
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    // Serve production static assets
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    // Development mode with Vite middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Motor Insurance Premium Predictor running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
