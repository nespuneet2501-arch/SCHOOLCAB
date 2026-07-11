import React from 'react';
import { SchoolBranding } from '../types';
import { Shield, Users, Award, RefreshCw, Calendar } from 'lucide-react';

interface BrandingHeaderProps {
  branding: SchoolBranding;
  deadline: string;
  currentRole: 'student' | 'panel' | 'admin';
  onChangeRole: (role: 'student' | 'panel' | 'admin') => void;
  onResetDemo: () => void;
  isResetting: boolean;
}

export default function BrandingHeader({
  branding,
  deadline,
  currentRole,
  onChangeRole,
  onResetDemo,
  isResetting
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

        {/* Demo reset button */}
        <button
          onClick={onResetDemo}
          disabled={isResetting}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-50 transition shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
          <span>Reset Demo</span>
        </button>

      </div>
    </header>
  );
}

