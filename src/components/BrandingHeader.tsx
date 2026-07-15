import React from 'react';
import { SchoolBranding } from '../types';
import { Shield, Users, Award, RefreshCw, Calendar } from 'lucide-react';
import { User } from 'firebase/auth';

interface BrandingHeaderProps {
  branding: SchoolBranding;
  deadline: string;
  currentRole: 'student' | 'panel' | 'admin';
  onChangeRole: (role: 'student' | 'panel' | 'admin') => void;
  onResetDemo: () => void;
  isResetting: boolean;
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
}

export default function BrandingHeader({
  branding,
  deadline,
  currentRole,
  onChangeRole,
  onResetDemo,
  isResetting,
  user,
  onSignIn,
  onSignOut
}: BrandingHeaderProps) {
  const deadlineDate = new Date(deadline);
  const isDeadlinePassed = new Date() > deadlineDate;

  return (
    <header className="h-16 md:h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 md:px-8 shadow-xs flex-shrink-0" id="branding-header">
      {/* Left Segment: Tagline & Live Badge */}
      <div className="flex items-center gap-4">
        <h2 className="text-xs md:text-sm font-bold text-slate-850 tracking-tight truncate max-w-[200px] sm:max-w-md">
          {branding.tagline || 'Leadership Cabinet Council'}
        </h2>
        <span className="flex-shrink-0 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold uppercase rounded-md tracking-wider">
          Live Selection
        </span>
      </div>

      {/* Right Segment: Switchers, Deadlines & Actions */}
      <div className="flex items-center gap-3 md:gap-4">
        
        {/* Role Switcher (Segmented Control) */}
        <div className="hidden xl:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/60 text-xs font-semibold">
          <button
            onClick={() => onChangeRole('student')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              currentRole === 'student'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>Student Desk</span>
          </button>
          
          <button
            onClick={() => onChangeRole('panel')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              currentRole === 'panel'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-slate-400" />
            <span>Interview Board</span>
          </button>
          
          <button
            onClick={() => onChangeRole('admin')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              currentRole === 'admin'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-slate-400" />
            <span>Admin Control</span>
          </button>
        </div>

        {/* Dynamic Deadline Badge */}
        <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-medium">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-500 font-semibold">Deadline:</span>
          <span className="text-slate-800 font-bold">
            {deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
          {isDeadlinePassed ? (
            <span className="text-[9px] bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.2 rounded-md font-bold">
              PASSED
            </span>
          ) : (
            <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded-md font-bold">
              ACTIVE
            </span>
          )}
        </div>

        {/* Google Authentication Profile / Button */}
        {user ? (
          <div className="flex items-center gap-2.5 bg-slate-100 border border-slate-200/80 px-3 py-1 rounded-xl shadow-xs">
            <img
              src={user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=60'}
              alt={user.displayName || 'User'}
              className="w-7 h-7 rounded-full border border-slate-300"
              referrerPolicy="no-referrer"
            />
            <div className="hidden lg:block text-left max-w-[120px]">
              <p className="text-[10px] font-bold text-slate-800 leading-tight truncate">
                {user.displayName}
              </p>
              <p className="text-[8px] text-slate-500 font-mono leading-none truncate">
                {user.email}
              </p>
            </div>
            <button
              onClick={onSignOut}
              className="text-[10px] font-bold text-rose-600 hover:text-rose-700 px-2 py-1 hover:bg-rose-50 rounded-lg transition"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <button
            onClick={onSignIn}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.514 5.514 0 0 1 8.5 13a5.514 5.514 0 0 1 5.491-5.514c1.474 0 2.805.556 3.822 1.464l3.125-3.125C18.98 3.856 16.638 3 13.991 3 8.473 3 4 7.473 4 13s4.473 10 9.991 10c5.753 0 10.009-4.04 10.009-10 0-.675-.06-1.32-.172-1.954l-11.588.239z" />
            </svg>
            <span>Sign In</span>
          </button>
        )}

        {/* Demo reset button */}
        {currentRole !== 'student' && (
          <button
            onClick={onResetDemo}
            disabled={isResetting}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-50 transition shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span>Reset Demo</span>
          </button>
        )}

      </div>
    </header>
  );
}

