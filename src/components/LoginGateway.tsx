import React, { useState } from 'react';
import { Lock, User as UserIcon, Eye, EyeOff, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { SchoolBranding } from '../types';

interface LoginGatewayProps {
  branding: SchoolBranding;
  onLoginSuccess: (role: 'student' | 'panel' | 'admin') => void;
}

export default function LoginGateway({ branding, onLoginSuccess }: LoginGatewayProps) {
  const [role, setRole] = useState<'student' | 'panel' | 'admin'>('student');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Password change flow state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);

  // Get active password for a given role
  const getActivePassword = (roleType: 'student' | 'panel' | 'admin'): string => {
    const saved = localStorage.getItem(`cabinet_password_${roleType}`);
    if (saved) return saved;
    // Defaults from branding configurations if specified
    if (roleType === 'admin') return branding.adminPassword || 'admin123';
    if (roleType === 'panel') return branding.teacherPassword || 'teacher123';
    return branding.studentPassword || 'FLOW';
  };

  // Check if a password is a default one
  const isDefaultPassword = (roleType: 'student' | 'panel' | 'admin', pass: string): boolean => {
    const defaultPass = roleType === 'admin' 
      ? (branding.adminPassword || 'admin123')
      : roleType === 'panel'
        ? (branding.teacherPassword || 'teacher123')
        : (branding.studentPassword || 'FLOW');
    
    const hardcodedDefault = roleType === 'admin' 
      ? 'admin123' 
      : roleType === 'panel' 
        ? 'teacher123' 
        : 'FLOW';

    return pass === defaultPass || pass === hardcodedDefault || (roleType === 'student' && (pass === 'student' || pass === 'student23'));
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Normalize username comparison
    const normUser = username.trim().toLowerCase();
    const expectedUser = role === 'panel' ? 'teacher' : role;

    if (normUser !== expectedUser) {
      setError(`Invalid username for ${role === 'panel' ? 'Teacher' : role.toUpperCase()} login. Try "${expectedUser}".`);
      return;
    }

    const correctPassword = getActivePassword(role);

    // Also support default "student" if not yet changed and role is student
    const isStudentDefaultMatch = role === 'student' && isDefaultPassword('student', password);

    if (password === correctPassword || isStudentDefaultMatch) {
      // Is it a default password? If yes, force them to change it (but bypass for student role to prevent local lockout)
      if (isDefaultPassword(role, password) && role !== 'student') {
        setIsChangingPassword(true);
      } else {
        // Correct changed password entered, log in immediately
        localStorage.setItem('cabinet_is_logged_in', 'true');
        localStorage.setItem('cabinet_logged_in_user', role);
        onLoginSuccess(role);
      }
    } else {
      setError('Incorrect password. Please try again.');
    }
  };

  const handlePasswordChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newPassword.trim()) {
      setError('New password cannot be empty.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (isDefaultPassword(role, newPassword)) {
      setError('New password must be different from the default password.');
      return;
    }

    // Save changed password
    localStorage.setItem(`cabinet_password_${role}`, newPassword);
    
    // Set logged in state
    localStorage.setItem('cabinet_is_logged_in', 'true');
    localStorage.setItem('cabinet_logged_in_user', role);

    setPasswordChangeSuccess(true);
    setTimeout(() => {
      onLoginSuccess(role);
    }, 1200);
  };

  // Helper to pre-fill credentials for easy testing
  const handleQuickFill = (userType: 'student' | 'teacher' | 'admin') => {
    setRole(userType === 'teacher' ? 'panel' : userType);
    setUsername(userType);
    setPassword(getActivePassword(userType === 'teacher' ? 'panel' : userType));
    setIsChangingPassword(false);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 font-sans selection:bg-amber-400 selection:text-slate-950">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(11,60,140,0.15),transparent_40%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(212,175,55,0.05),transparent_45%)] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        
        {/* Header Branding Container */}
        <div className="text-center mb-8 space-y-4">
          <div className="w-24 h-24 bg-white/5 rounded-3xl p-3 mx-auto border border-white/10 flex items-center justify-center shadow-2xl backdrop-blur-md">
            {branding.logo ? (
              branding.logo.trim().startsWith('<svg') ? (
                <div dangerouslySetInnerHTML={{ __html: branding.logo }} className="w-full h-full text-white flex items-center justify-center" />
              ) : (
                <img src={branding.logo} alt="School Logo" className="w-full h-full object-contain rounded-xl" />
              )
            ) : (
              <div className="w-16 h-16 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-2xl">
                {branding.name?.charAt(0) || 'G'}
              </div>
            )}
          </div>
          <div className="space-y-1 px-4">
            <h1 className="text-2xl font-black tracking-tight text-white font-display">
              {branding.name}
            </h1>
            <p className="text-xs text-slate-400 font-medium tracking-wide">
              {branding.tagline || 'School Leadership Cabinet Selection Desk'}
            </p>
          </div>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          
          {!isChangingPassword ? (
            <>
              <div className="space-y-1 text-center">
                <h2 className="text-lg font-bold text-white tracking-tight">Portal Access Gateway</h2>
                <p className="text-xs text-slate-400">Enter your credentials to access your console</p>
              </div>

              {/* Role Picker (Tabs) */}
              <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1.5 rounded-xl border border-white/5">
                <button
                  type="button"
                  onClick={() => { setRole('student'); setUsername('student'); setPassword(''); setError(''); }}
                  className={`py-2 px-1 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                    role === 'student'
                      ? 'bg-amber-400 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => { setRole('panel'); setUsername('teacher'); setPassword(''); setError(''); }}
                  className={`py-2 px-1 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                    role === 'panel'
                      ? 'bg-amber-400 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Teacher
                </button>
                <button
                  type="button"
                  onClick={() => { setRole('admin'); setUsername('admin'); setPassword(''); setError(''); }}
                  className={`py-2 px-1 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                    role === 'admin'
                      ? 'bg-amber-400 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Admin
                </button>
              </div>

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Credentials form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Username</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                      <UserIcon className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={`Enter "${role === 'panel' ? 'teacher' : role}"`}
                      className="w-full bg-slate-950 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-400/50"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-500">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-950 border border-white/5 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-400/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-amber-400 text-slate-950 font-extrabold text-xs uppercase tracking-widest rounded-xl hover:bg-amber-300 active:scale-[0.98] transition-all shadow-lg shadow-amber-400/10 mt-2"
                >
                  Verify & Proceed
                </button>

                <div className="mt-3 p-3 bg-slate-950/80 border border-white/5 rounded-xl text-center space-y-0.5">
                  <p className="text-[11px] text-slate-400">
                    Username: <strong className="text-white font-bold">{role === 'panel' ? 'teacher' : role}</strong>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Password: <strong className="text-amber-400 font-mono font-bold">{getActivePassword(role)}</strong>
                  </p>
                </div>
              </form>
            </>
          ) : (
            // Force Password Change Screen
            <div className="space-y-5">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 bg-amber-400/10 text-amber-400 border border-amber-400/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <RefreshCw className="w-5 h-5 animate-spin-slow" />
                </div>
                <h2 className="text-lg font-bold text-white tracking-tight">Security Action Required</h2>
                <p className="text-xs text-slate-400">
                  Please change the default password for <span className="font-extrabold text-amber-400 capitalize">{role === 'panel' ? 'teacher' : role}</span> to proceed.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {passwordChangeSuccess ? (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex flex-col items-center gap-2 text-center animate-pulse">
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                  <span className="font-bold text-sm">Password Updated Successfully!</span>
                  <span>Configuring custom secure session...</span>
                </div>
              ) : (
                <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">New Password</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 6 characters recommended"
                      className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-400/50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full bg-slate-950 border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-400/50"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl hover:bg-emerald-400 active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/10 mt-2"
                  >
                    Update Password & Launch
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Quick Demo Access Bar */}
          <div className="border-t border-white/5 pt-4">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest text-center mb-3">
              Developer Quick-Fill Demo Accounts
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickFill('student')}
                className="py-1.5 px-1 bg-white/5 hover:bg-white/10 text-[10px] text-slate-300 font-bold rounded-lg border border-white/5 hover:border-white/10 transition"
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('teacher')}
                className="py-1.5 px-1 bg-white/5 hover:bg-white/10 text-[10px] text-slate-300 font-bold rounded-lg border border-white/5 hover:border-white/10 transition"
              >
                Teacher
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('admin')}
                className="py-1.5 px-1 bg-white/5 hover:bg-white/10 text-[10px] text-slate-300 font-bold rounded-lg border border-white/5 hover:border-white/10 transition"
              >
                Admin
              </button>
            </div>
          </div>

        </div>

        {/* Portal Footer Info */}
        <p className="text-center text-[10px] text-slate-600 mt-6 font-medium">
          GD Goenka Leadership Selection Desk • Powered by Google AI Studio & Gemini Flash
        </p>
        <p className="text-center text-[9px] text-slate-700 font-semibold tracking-wider uppercase mt-1">
          developed by GDG AGRA
        </p>

      </div>
    </div>
  );
}
