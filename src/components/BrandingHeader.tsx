import React from 'react';
import { SchoolBranding } from '../types';
import { Shield, Users, Award, RefreshCw, Calendar, LogOut } from 'lucide-react';

interface BrandingHeaderProps {
  branding: SchoolBranding;
  deadline: string;
  currentRole: 'student' | 'panel' | 'admin';
  onSignOut: () => void;
  onResetDemo: () => void;
  isResetting: boolean;
}

export default function BrandingHeader({
  branding,
  deadline,
  currentRole,
  onSignOut,
  onResetDemo,
  isResetting
}: BrandingHeaderProps) {
  const deadlineDate = new Date(deadline);
  const isDeadlinePassed = new Date() > deadlineDate;

  // Active Role badge configuration
  const roleMeta = {
    student: { label: 'Student Portal', icon: Users, color: 'bg-amber-400 text-slate-950 border-amber-300' },
    panel: { label: 'Teacher Panel', icon: Award, color: 'bg-blue-600 text-white border-blue-500' },
    admin: { label: 'Admin Console', icon: Shield, color: 'bg-slate-900 text-white border-slate-800' }
  };

  const activeMeta = roleMeta[currentRole] || roleMeta.student;
  const RoleIcon = activeMeta.icon;

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

        {/* Current Logged-In User Badge */}
        <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-xl text-xs font-bold shadow-xs ${activeMeta.color}`}>
          <RoleIcon className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="capitalize">{activeMeta.label}</span>
        </div>

        {/* Custom Logout Button */}
        <button
          onClick={onSignOut}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 transition shadow-xs"
          title="Log out of active session"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>

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
