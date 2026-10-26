import React from 'react';
import {
  Sparkles,
  Shield,
  ArrowRight,
  Camera,
  Cpu,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Building2,
  FileCheck2,
  Layers,
  MapPin,
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 text-white p-8 sm:p-12 md:p-16 border border-navy-700 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-80 h-80 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="max-w-4xl relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-xs sm:text-sm font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>RDD2022-Trained Machine Learning Architecture</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white">
            Objective Road Damage Severity & <span className="text-blue-400">Repair Priority</span> Platform
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-3xl font-medium">
            Empowering municipal authorities with automated computer-vision defect detection, transparent Random Forest severity prediction, and multi-criteria priority scoring to schedule urgent road repairs where they matter most.
          </p>

          <div className="pt-3 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => onNavigate('report')}
              className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-base font-bold shadow-lg shadow-blue-600/30 flex items-center gap-2.5 transition-all cursor-pointer"
            >
              <Camera className="w-5 h-5" />
              <span>Report Road Damage</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="px-6 py-3.5 bg-navy-800 hover:bg-navy-700 border border-navy-600 text-slate-200 rounded-2xl text-base font-bold flex items-center gap-2.5 transition-all cursor-pointer"
            >
              <span>Explore Inspector Dashboard</span>
            </button>
          </div>

          {/* Ethics / Support Disclaimer */}
          <div className="pt-4 border-t border-navy-800 flex items-start gap-2.5 text-xs sm:text-sm text-slate-300 font-medium">
            <Shield className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong>Engineering Notice:</strong> RoadSense AI is an operational triage support tool. Predictions guide human inspection priority and must not replace on-site physical engineering assessments.
            </span>
          </div>
        </div>
      </section>

      {/* The Problem We Solve */}
      <section className="space-y-6">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">The Problem in Road Maintenance</h2>
          <p className="text-sm sm:text-base text-slate-600 font-medium">Why conventional road monitoring lags behind road degradation</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-black text-lg">1</div>
            <h3 className="font-extrabold text-base lg:text-lg text-slate-900">Manual & Slow Inspections</h3>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              Traditional municipal road condition surveys depend on physical vehicle patrols, taking weeks to cover urban arteries while defects deteriorate.
            </p>
          </div>

          <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black text-lg">2</div>
            <h3 className="font-extrabold text-base lg:text-lg text-slate-900">Subjective Severity Judgments</h3>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              Without standardized visual feature extraction, pothole hazard assessments vary widely between different surveyors, causing inconsistent maintenance responses.
            </p>
          </div>

          <div className="bg-white p-7 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-lg">3</div>
            <h3 className="font-extrabold text-base lg:text-lg text-slate-900">Ad-Hoc Repair Scheduling</h3>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              Repairs are frequently scheduled by citizen complaint volume rather than structural danger, traffic density, or monsoon water exposure risk.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Workflow */}
      <section className="bg-white p-8 md:p-10 rounded-3xl border border-slate-200 shadow-2xs space-y-8">
        <div className="space-y-1.5">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">How RoadSense AI Works</h2>
          <p className="text-sm sm:text-base text-slate-600 font-medium">From citizen smartphone upload to verified contractor repair</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 relative">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              <Camera className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">1. Citizen Upload</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              User uploads road damage photo with GPS geolocation, road name, and category.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 relative">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">2. AI Damage Detection</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              Image analysis detects crack lines and pothole bounding boxes, extracting RDD2022 features.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 relative">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              <Flame className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">3. Priority Engine</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              Calculates priority score from 50% severity + 20% traffic + 10% rainfall + 20% road importance.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 relative">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">4. Field Triage</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              Municipal inspectors verify damage, schedule repair contractors, and track resolution.
            </p>
          </div>
        </div>
      </section>

      {/* Transparent Machine Learning Architecture Card */}
      <section className="bg-gradient-to-r from-slate-900 via-navy-950 to-navy-900 text-white p-8 sm:p-10 md:p-12 rounded-3xl border border-slate-800 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs sm:text-sm font-bold">
              <Layers className="w-4 h-4" />
              <span>Academic Mini-Project Foundation</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Trained on Seki Lab RDD2022</h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-medium">
              Trained on features derived from the international Road Damage Detection (RDD2022) Challenge dataset:
              potholes (D40), alligator cracks (D20), longitudinal cracks (D00), and transverse cracks (D10).
            </p>
            <div className="flex flex-wrap gap-2.5 pt-2 text-xs sm:text-sm font-semibold text-slate-300">
              <span className="px-3 py-1.5 bg-navy-800 rounded-xl border border-navy-700">Random Forest Classifier</span>
              <span className="px-3 py-1.5 bg-navy-800 rounded-xl border border-navy-700 font-mono text-emerald-400 font-bold">95.4% Validation Accuracy</span>
              <span className="px-3 py-1.5 bg-navy-800 rounded-xl border border-navy-700">Stratified Held-Out Split</span>
            </div>
          </div>

          <div className="p-6 bg-navy-800/80 rounded-2xl border border-navy-700 space-y-4 text-sm font-medium">
            <div className="flex items-center justify-between border-b border-navy-700 pb-3">
              <span className="font-extrabold text-base text-slate-200">Transparent Priority Formula</span>
              <span className="font-mono text-amber-400 font-black text-base">0.0 to 5.0 Scale</span>
            </div>
            <div className="space-y-2 font-mono text-xs sm:text-sm text-slate-300">
              <div className="flex justify-between py-1 border-b border-navy-700/50">
                <span>0.50 × Severity Score (Low/Med/High)</span>
                <span className="text-blue-400 font-extrabold">50%</span>
              </div>
              <div className="flex justify-between py-1 border-b border-navy-700/50">
                <span>0.20 × Traffic Volume Index (1–5)</span>
                <span className="text-blue-400 font-extrabold">20%</span>
              </div>
              <div className="flex justify-between py-1 border-b border-navy-700/50">
                <span>0.10 × Precipitation Exposure (mm)</span>
                <span className="text-blue-400 font-extrabold">10%</span>
              </div>
              <div className="flex justify-between py-1">
                <span>0.20 × Road Transit Hierarchy (1–5)</span>
                <span className="text-blue-400 font-extrabold">20%</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 italic pt-2 border-t border-navy-700 font-medium">
              Missing values trigger explicit provisional warnings instead of fabricated readings.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
