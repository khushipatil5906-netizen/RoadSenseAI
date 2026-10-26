import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserPlus, User, Mail, KeyRound, AlertCircle, Shield } from 'lucide-react';

interface RegisterPageProps {
  onNavigate: (page: string) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate }) => {
  const { register, isLoading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'citizen' | 'inspector'>('citizen');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }
    try {
      await register(name, email, password, role);
      onNavigate('dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    }
  };

  return (
    <div className="max-w-lg mx-auto my-12 p-8 sm:p-10 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-6">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-md shadow-blue-500/25">
          <UserPlus className="w-7 h-7" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Create RoadSense AI Account</h2>
        <p className="text-sm text-slate-500 font-medium">Register to submit road reports or conduct field inspections</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-medium flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-sm font-medium">
        <div className="space-y-1.5">
          <label className="font-bold text-slate-700">Full Name</label>
          <div className="relative">
            <User className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="font-bold text-slate-700">Email Address</label>
          <div className="relative">
            <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. user@example.com"
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="font-bold text-slate-700">Password (min 6 characters)</label>
          <div className="relative">
            <KeyRound className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="font-bold text-slate-700">Select User Role</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole('citizen')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                role === 'citizen'
                  ? 'border-blue-500 bg-blue-50 text-blue-900 font-bold ring-2 ring-blue-500/20 shadow-2xs'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <p className="font-extrabold text-sm">Citizen Reporter</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Report potholes & monitor repair progress</p>
            </button>

            <button
              type="button"
              onClick={() => setRole('inspector')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                role === 'inspector'
                  ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold ring-2 ring-amber-500/20 shadow-2xs'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <p className="font-extrabold text-sm">Field Inspector</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Verify damage, triage, schedule repairs</p>
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5 font-medium">
            <Shield className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Administrator privilege is restricted and cannot be granted via public registration.</span>
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-base cursor-pointer"
        >
          {isLoading ? <span>Registering...</span> : <span>Create Account</span>}
        </button>
      </form>

      <div className="pt-3 text-center text-sm text-slate-500 border-t border-slate-100 font-medium">
        <span>Already have an account? </span>
        <button
          type="button"
          onClick={() => onNavigate('login')}
          className="text-blue-600 font-bold hover:underline cursor-pointer"
        >
          Sign in
        </button>
      </div>
    </div>
  );
};
