import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, KeyRound, Mail, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';

interface LoginPageProps {
  onNavigate: (page: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
      onNavigate('dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    }
  };

  const handleDemoFill = (type: 'inspector' | 'citizen') => {
    if (type === 'inspector') {
      setEmail('inspector@roadsense.gov');
      setPassword('RoadSense123!');
    } else {
      setEmail('citizen@example.com');
      setPassword('RoadSense123!');
    }
  };

  return (
    <div className="max-w-lg mx-auto my-12 p-8 sm:p-10 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-6">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-md shadow-blue-500/25">
          <KeyRound className="w-7 h-7" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Sign In to RoadSense AI</h2>
        <p className="text-sm text-slate-500 font-medium">Access municipal damage reports and priority triage</p>
      </div>

      {/* Demo Credentials Quick-Fill Helpers */}
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 text-xs sm:text-sm">
        <p className="font-bold text-slate-700 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span>Quick Demo Logins (Mini-Project Evaluation):</span>
        </p>
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={() => handleDemoFill('inspector')}
            className="flex-1 py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs sm:text-sm font-bold text-center transition-colors cursor-pointer"
          >
            Lead Inspector Login
          </button>
          <button
            type="button"
            onClick={() => handleDemoFill('citizen')}
            className="flex-1 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-xl text-xs sm:text-sm font-bold text-center transition-colors cursor-pointer"
          >
            Citizen Reporter Login
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-medium flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-sm font-medium">
        <div className="space-y-1.5">
          <label className="font-bold text-slate-700">Email Address</label>
          <div className="relative">
            <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. inspector@roadsense.gov"
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="font-bold text-slate-700">Password</label>
          <div className="relative">
            <KeyRound className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-base cursor-pointer"
        >
          {isLoading ? (
            <span>Signing in...</span>
          ) : (
            <>
              <LogIn className="w-5 h-5" />
              <span>Sign In</span>
            </>
          )}
        </button>
      </form>

      <div className="pt-3 text-center text-sm text-slate-500 border-t border-slate-100 font-medium">
        <span>Don't have an account yet? </span>
        <button
          type="button"
          onClick={() => onNavigate('register')}
          className="text-blue-600 font-bold hover:underline cursor-pointer"
        >
          Register here
        </button>
      </div>
    </div>
  );
};
