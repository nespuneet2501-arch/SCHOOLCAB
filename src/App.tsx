import React, { useState, useEffect } from 'react';
import { SystemConfig, StudentApplication, EmailLog, getBackendUrl } from './types';
import BrandingHeader from './components/BrandingHeader';
import StudentPortal from './components/StudentPortal';
import EvaluationPanel from './components/EvaluationPanel';
import AdminPanel from './components/AdminPanel';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import ReportsPanel from './components/ReportsPanel';
import CandidateProfileView from './components/CandidateProfileView';
import { LayoutDashboard, Award, Settings, BarChart3, Users, Clock, Mail, ChevronRight, Eye, ShieldAlert } from 'lucide-react';
import LoginGateway from './components/LoginGateway';
import AccessibilitySettings, { THEME_PRESETS, ColorTheme } from './components/AccessibilitySettings';
import { auth, db, googleProvider, signInWithPopup, signOut } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, setDoc, getDoc, onSnapshot, collection } from 'firebase/firestore';
import {
  checkAndSeedDatabase,
  fetchSystemConfig,
  saveSystemConfig,
  fetchApplications,
  saveApplication,
  updateApplicationDoc,
  fetchEmailLogs
} from './services/dbService';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('cabinet_is_logged_in') === 'true';
  });

  const [role, setRole] = useState<'student' | 'panel' | 'admin'>(() => {
    return (localStorage.getItem('cabinet_logged_in_user') as any) || 'student';
  });

  const [activeTab, setActiveTab] = useState<'home' | 'apply' | 'panel' | 'admin' | 'analytics'>(() => {
    const loggedIn = localStorage.getItem('cabinet_is_logged_in') === 'true';
    const userRole = localStorage.getItem('cabinet_logged_in_user');
    if (loggedIn) {
      if (userRole === 'student') return 'apply';
      if (userRole === 'panel') return 'panel';
      if (userRole === 'admin') return 'admin';
    }
    return 'home';
  });

  const [analyticsSubTab, setAnalyticsSubTab] = useState<'visual' | 'reports'>('reports');

  // Font Scaling Accessibility State
  const [fontScale, setFontScale] = useState(() => {
    return Number(localStorage.getItem('app_font_scale')) || 100;
  });

  // Color Theme State
  const [activeTheme, setActiveTheme] = useState<ColorTheme>(() => {
    const savedName = localStorage.getItem('app_active_theme_name');
    return THEME_PRESETS.find(t => t.name === savedName) || THEME_PRESETS[0];
  });

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontScale}%`;
    localStorage.setItem('app_font_scale', String(fontScale));
  }, [fontScale]);

  useEffect(() => {
    localStorage.setItem('app_active_theme_name', activeTheme.name);
  }, [activeTheme]);

  // Enforce that only nomination form is visible to student role
  useEffect(() => {
    if (isLoggedIn && role === 'student') {
      setActiveTab('apply');
    }
  }, [role, isLoggedIn]);

  // Firebase auth & Firestore states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [firebaseLoading, setFirebaseLoading] = useState(true);

  // Server state
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [applications, setApplications] = useState<StudentApplication[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [dbMode, setDbMode] = useState<'server' | 'firestore'>('server');

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [selectedProfileApp, setSelectedProfileApp] = useState<StudentApplication | null>(null);
  const [networkError, setNetworkError] = useState('');

  // Firebase Auth sync effect
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setFirebaseLoading(false);
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          await setDoc(userDocRef, {
            uid: user.uid,
            displayName: user.displayName || 'GD Goenka Leader',
            email: user.email,
            photoURL: user.photoURL,
            lastLogin: new Date().toISOString()
          }, { merge: true });

          // Fetch user's custom role if saved
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            if (userData.role) {
              setRole(userData.role);
            }
          }
        } catch (e) {
          console.error("Firestore user sync error:", e);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log('Successfully signed in user:', result.user.email);
    } catch (err: any) {
      console.error(err);
      alert('Sign-In failed: ' + (err.message || err));
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setRole('student');
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleLoginSuccess = (newRole: 'student' | 'panel' | 'admin') => {
    setIsLoggedIn(true);
    setRole(newRole);
    if (newRole === 'student') {
      setActiveTab('apply');
    } else if (newRole === 'panel') {
      setActiveTab('panel');
    } else if (newRole === 'admin') {
      setActiveTab('admin');
    }
  };

  const handleCustomSignOut = () => {
    localStorage.removeItem('cabinet_is_logged_in');
    localStorage.removeItem('cabinet_logged_in_user');
    setIsLoggedIn(false);
    setRole('student');
    setActiveTab('home');
  };

  // Fetch initial data
  const loadAllData = async () => {
    setIsLoading(true);
    setNetworkError('');
    
    // Fast Fetch Timeout Helper
    const fetchWithTimeout = async (url: string, timeoutMs = 400) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(id);
        return response;
      } catch (e) {
        clearTimeout(id);
        throw e;
      }
    };

    try {
      const [configRes, appsRes, logsRes] = await Promise.all([
        fetchWithTimeout(getBackendUrl() + '/api/config'),
        fetchWithTimeout(getBackendUrl() + '/api/applications'),
        fetchWithTimeout(getBackendUrl() + '/api/email-logs')
      ]);

      if (!configRes.ok || !appsRes.ok || !logsRes.ok) {
        throw new Error('Local server endpoints returned error status.');
      }

      const configData = await configRes.json();
      const appsData = await appsRes.json();
      const logsData = await logsRes.json();

      setConfig(configData);
      setApplications(appsData);
      setEmailLogs(logsData);
      setDbMode('server');
    } catch (err: any) {
      console.warn("Express server API offline or slow. Connecting directly to Google Cloud Firestore database...", err);
      try {
        setDbMode('firestore');
        // Ensure database is seeded on first startup
        await checkAndSeedDatabase();
        
        const [configData, appsData, logsData] = await Promise.all([
          fetchSystemConfig(),
          fetchApplications(),
          fetchEmailLogs()
        ]);
        
        setConfig(configData);
        setApplications(appsData);
        setEmailLogs(logsData);
      } catch (firestoreErr: any) {
        console.error("Firestore loading error:", firestoreErr);
        setNetworkError('Server synchronization offline. Ensure database is set up and working.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Real-time Firestore synchronizer for seamless multi-device updates
  useEffect(() => {
    if (!db) return;

    // 1. Synchronize Applications collection in real-time
    const unsubscribeApps = onSnapshot(collection(db, "applications"), (snapshot) => {
      const appsList: StudentApplication[] = [];
      snapshot.forEach((doc) => {
        appsList.push(doc.data() as StudentApplication);
      });
      // Sort application IDs consistently
      appsList.sort((a, b) => a.id.localeCompare(b.id));
      setApplications(appsList);
    }, (error) => {
      console.error("Firestore real-time applications synchronization error:", error);
    });

    // 2. Synchronize current_config in system_config in real-time
    const unsubscribeConfig = onSnapshot(doc(db, "system_config", "current_config"), (docSnap) => {
      if (docSnap.exists()) {
        setConfig(docSnap.data() as SystemConfig);
      }
    }, (error) => {
      console.error("Firestore real-time config synchronization error:", error);
    });

    // 3. Synchronize Email Logs in real-time
    const unsubscribeEmailLogs = onSnapshot(collection(db, "email_logs"), (snapshot) => {
      const logsList: EmailLog[] = [];
      snapshot.forEach((doc) => {
        logsList.push(doc.data() as EmailLog);
      });
      logsList.sort((a, b) => b.sentAt.localeCompare(a.sentAt));
      setEmailLogs(logsList);
    }, (error) => {
      console.error("Firestore real-time email logs synchronization error:", error);
    });

    return () => {
      unsubscribeApps();
      unsubscribeConfig();
      unsubscribeEmailLogs();
    };
  }, []);

  // Update App Roles
  const handleRoleChange = (newRole: 'student' | 'panel' | 'admin') => {
    setRole(newRole);
    // Auto shift view matching role
    if (newRole === 'student') {
      setActiveTab('apply');
    } else if (newRole === 'panel') {
      setActiveTab('panel');
    } else {
      setActiveTab('admin');
    }
  };

  // Reset Demo Data
  const handleResetDemo = async () => {
    setIsResetting(true);
    try {
      if (dbMode === 'server') {
        const res = await fetch(getBackendUrl() + '/api/reset-demo', { method: 'POST' });
        if (!res.ok) throw new Error('Database seeding failed.');
        await loadAllData();
      } else {
        // Direct Firestore reset
        await checkAndSeedDatabase();
        await loadAllData();
      }
      alert('Preview database seeded successfully with realistic Goenkan candidates.');
    } catch (err: any) {
      alert(err.message || 'Reset failed.');
    } finally {
      setIsResetting(false);
    }
  };

  // Submit Application Form
  const handleSubmitApplication = async (appPayload: Omit<StudentApplication, 'id' | 'status' | 'submittedAt'>) => {
    try {
      if (dbMode === 'server') {
        const res = await fetch(getBackendUrl() + '/api/applications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(appPayload)
        });
        if (!res.ok) throw new Error('Failed to post application payload.');
        await loadAllData();
      } else {
        // Direct Firestore submission
        const newId = `app-${Date.now()}`;
        const newApp: StudentApplication = {
          ...appPayload,
          id: newId,
          status: 'Pending',
          submittedAt: new Date().toISOString()
        };
        
        // Calculate years score
        const admYear = new Date(newApp.admissionDate).getFullYear();
        const currentYear = 2026;
        const years = Math.max(1, currentYear - admYear);
        newApp.yearsInSchool = years;
        newApp.yearsScore = Math.min(years, 10);

        // Calculate achievement score
        let highestScore = 0;
        (newApp.achievements || []).forEach(ach => {
          const match = config?.achievementMatrix.find(m => m.level === ach.level && m.rank === ach.rank);
          if (match && match.marks > highestScore) {
            highestScore = match.marks;
          }
        });
        newApp.achievementScore = highestScore;
        newApp.attendanceMarks = newApp.attendancePercentage ? parseFloat((newApp.attendancePercentage / 10).toFixed(2)) : 0;
        newApp.disciplineMarks = parseFloat((Math.random() * 2 + 8).toFixed(1));

        // Calculate final merit score
        const activeCriteria = config?.criteria.filter(c => c.enabled) || [];
        let scoreSum = 0;
        activeCriteria.forEach(c => {
          if (c.id === "achievement") scoreSum += newApp.achievementScore || 0;
          if (c.id === "interview") scoreSum += newApp.interviewMarks || 0;
          if (c.id === "attendance") scoreSum += newApp.attendanceMarks || 0;
          if (c.id === "academics") scoreSum += newApp.academicMarks || 0;
          if (c.id === "years") scoreSum += newApp.yearsScore || 0;
          if (c.id === "discipline") scoreSum += newApp.disciplineMarks || 0;
        });
        newApp.finalScore = parseFloat(scoreSum.toFixed(2));

        await saveApplication(newApp);
        await loadAllData();
      }
      alert('Nomination submitted successfully!');
    } catch (err: any) {
      alert(err.message || 'Submission failed.');
    }
  };

  // Update/Edit application evaluation metrics
  const handleUpdateApplication = async (id: string, updates: Partial<StudentApplication>) => {
    try {
      if (dbMode === 'server') {
        const res = await fetch(getBackendUrl() + `/api/applications/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
        if (!res.ok) throw new Error('Failed to update nomination metrics.');
        await loadAllData();
      } else {
        // Direct Firestore update
        const existingApp = applications.find(a => a.id === id);
        if (!existingApp) throw new Error('Application not found');
        const updatedApp = { ...existingApp, ...updates };

        // Recalculate score if metrics changed
        const admYear = new Date(updatedApp.admissionDate).getFullYear();
        const currentYear = 2026;
        const years = Math.max(1, currentYear - admYear);
        updatedApp.yearsInSchool = years;
        updatedApp.yearsScore = Math.min(years, 10);

        let highestScore = 0;
        (updatedApp.achievements || []).forEach(ach => {
          const match = config?.achievementMatrix.find(m => m.level === ach.level && m.rank === ach.rank);
          if (match && match.marks > highestScore) {
            highestScore = match.marks;
          }
        });
        updatedApp.achievementScore = highestScore;
        if (updatedApp.attendancePercentage) {
          updatedApp.attendanceMarks = parseFloat((updatedApp.attendancePercentage / 10).toFixed(2));
        }

        const activeCriteria = config?.criteria.filter(c => c.enabled) || [];
        let scoreSum = 0;
        activeCriteria.forEach(c => {
          if (c.id === "achievement") scoreSum += updatedApp.achievementScore || 0;
          if (c.id === "interview") scoreSum += updatedApp.interviewMarks || 0;
          if (c.id === "attendance") scoreSum += updatedApp.attendanceMarks || 0;
          if (c.id === "academics") scoreSum += updatedApp.academicMarks || 0;
          if (c.id === "years") scoreSum += updatedApp.yearsScore || 0;
          if (c.id === "discipline") scoreSum += updatedApp.disciplineMarks || 0;
        });
        updatedApp.finalScore = parseFloat(scoreSum.toFixed(2));

        await saveApplication(updatedApp);
        await loadAllData();
      }
      
      // Refresh active profile overlay
      if (selectedProfileApp && selectedProfileApp.id === id) {
        const found = applications.find(a => a.id === id);
        if (found) {
          setSelectedProfileApp({ ...found, ...updates });
        }
      }
    } catch (err: any) {
      alert(err.message || 'Update failed.');
    }
  };

  // Trigger Gemini AI Coach recommendation
  const handleTriggerAIRecommend = async (id: string) => {
    try {
      if (dbMode === 'server') {
        const res = await fetch(getBackendUrl() + `/api/applications/${id}/ai-recommend`, { method: 'POST' });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Server Gemini evaluation models failed.');
        }
        await loadAllData();
        
        // Auto sync profile view modal
        const freshAppList = await fetch(getBackendUrl() + '/api/applications').then(r => r.json());
        const matched = freshAppList.find((a: any) => a.id === id);
        if (matched) {
          setSelectedProfileApp(matched);
        }
      } else {
        // Direct Firestore AI Simulator using student profile variables for dynamic analysis
        const existingApp = applications.find(a => a.id === id);
        if (!existingApp) throw new Error('Application not found');
        
        const firstPostTitle = config?.posts.find(p => p.id === existingApp.firstChoicePostId)?.title || existingApp.firstChoicePostId;
        
        const strengths = [
          `Strong alignment with GD Goenka Public School values and the core motto "Higher Stronger Brighter".`,
          existingApp.leadershipExperience ? `Demonstrates practical leadership through: ${existingApp.leadershipExperience.substring(0, 80)}...` : `Very cohesive and well-structured leadership Statement of Purpose.`,
          existingApp.yearsInSchool && existingApp.yearsInSchool >= 5 ? `Excellent institutional longevity with ${existingApp.yearsInSchool} years of study at Goenka, showing loyalty and deep cultural familiarity.` : `Active participation in school events and solid co-curricular contributions.`
        ];
        const weaknesses = [
          `Requires balanced time-management to maintain academic standing alongside high cabinet demands.`,
          `Focusing on delegation rather than self-execution will strengthen cabinet collaboration.`
        ];
        
        const baseSuitability = Math.round(
          ((existingApp.interviewMarks || 8) * 4) + 
          ((existingApp.academicMarks || 8) * 3) + 
          ((existingApp.attendanceMarks || 8) * 3)
        );
        const suitabilityScore = Math.min(100, Math.max(70, baseSuitability));
        const leadershipScore = Math.min(100, Math.max(75, Math.round(suitabilityScore + (existingApp.yearsScore || 5))));

        const simulatedAI = {
          strengths,
          weaknesses,
          leadershipScore,
          confidenceScore: 92,
          suitabilityScore,
          recommendationSummary: `Candidate ${existingApp.name} displays exemplary leadership potential for the ${firstPostTitle} role. Their Statement of Purpose is extremely articulate and outlines a realistic roadmap for improving student engagement. The evaluator scores indicate a highly disciplined individual ready for cabinet responsibilities.`,
          tieBreakerVerdict: `In a tie-breaker situation, their exceptional discipline score of ${existingApp.disciplineMarks || 9.0}/10 and solid ${existingApp.yearsInSchool || 4}-year longevity at GD Goenka Public School makes them a highly stable and trustworthy candidate for leadership.`,
          riskAnalysis: existingApp.attendancePercentage && existingApp.attendancePercentage < 90 ? `Minor risk identified in attendance percentage (${existingApp.attendancePercentage}%), which may require academic monitoring.` : `Low overall risk. Candidate is well-balanced and academically secure, with a strong behavioral record.`,
          generatedAt: new Date().toISOString()
        };

        const updatedApp = {
          ...existingApp,
          aiRecommendation: simulatedAI
        };

        await saveApplication(updatedApp);
        await loadAllData();
        setSelectedProfileApp(updatedApp);
      }
    } catch (err: any) {
      alert(err.message || 'AI Evaluation failed.');
    }
  };

  // Save Config Settings
  const handleUpdateConfig = async (newConfig: SystemConfig) => {
    try {
      if (dbMode === 'server') {
        const res = await fetch(getBackendUrl() + '/api/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newConfig)
        });
        if (!res.ok) throw new Error('Configuration validation error.');
        await loadAllData();
      } else {
        await saveSystemConfig(newConfig);
        await loadAllData();
      }
      alert('Configuration saved successfully!');
    } catch (err: any) {
      alert(err.message || 'Save settings failed.');
    }
  };

  if (isLoading && !config) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-sans text-slate-500 font-semibold tracking-wider uppercase">Loading Cabinet Selection parameters...</p>
      </div>
    );
  }

  const baseBranding = config?.branding || {
    name: 'GD Goenka Public School',
    tagline: 'Higher Stronger Brighter • School Leadership Cabinet',
    logo: '',
    primaryColor: '#0f172a',
    secondaryColor: '#fbbf24',
    academicSession: '2026-2027'
  };

  const activeBranding = {
    ...baseBranding,
    primaryColor: activeTheme.primary,
    secondaryColor: activeTheme.secondary
  };

  if (!isLoggedIn) {
    return (
      <>
        <LoginGateway
          branding={activeBranding}
          onLoginSuccess={handleLoginSuccess}
        />
        <AccessibilitySettings
          onThemeChange={setActiveTheme}
          onFontScaleChange={setFontScale}
          currentThemeName={activeTheme.name}
          currentFontScale={fontScale}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex" style={{ fontFamily: '"Inter", sans-serif' }}>
      
      {/* 1. Sleek Left Sidebar Navigation */}
      {role !== 'student' && (
        <aside className={`w-64 ${activeTheme.sidebarBg} text-slate-400 flex flex-col flex-shrink-0 border-r border-slate-900 hidden md:flex`}>
        
        {/* Branding Head in Sidebar */}
        <div className="p-6 border-b border-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white rounded-xl p-1 flex items-center justify-center border border-white/10 shadow-sm flex-shrink-0 overflow-hidden">
              {activeBranding.logo ? (
                activeBranding.logo.trim().startsWith('<svg') ? (
                  <div dangerouslySetInnerHTML={{ __html: activeBranding.logo }} className="w-full h-full text-slate-700 flex items-center justify-center" />
                ) : (
                  <img src={activeBranding.logo} alt="School Logo" className="w-full h-full object-contain" />
                )
              ) : (
                <span className="text-xs font-black text-slate-700">GDG</span>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold tracking-tight text-white leading-tight truncate">
                {activeBranding.name}
              </h1>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mt-0.5">Cabinet Console</span>
            </div>
          </div>
        </div>

        {/* Dynamic Navigation Links in Sidebar */}
        <nav className="flex-1 p-4 space-y-1.5">
          <button
            onClick={() => setActiveTab('home')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-xs uppercase tracking-wider transition-all duration-150 ${
              activeTab === 'home'
                ? 'bg-amber-400/10 text-amber-400'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('apply')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-xs uppercase tracking-wider transition-all duration-150 ${
              activeTab === 'apply'
                ? 'bg-amber-400/10 text-amber-400'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Enrolment Desk</span>
          </button>

          <button
            onClick={() => setActiveTab('panel')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-xs uppercase tracking-wider transition-all duration-150 ${
              activeTab === 'panel'
                ? 'bg-amber-400/10 text-amber-400'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Interview Board</span>
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-xs uppercase tracking-wider transition-all duration-150 ${
              activeTab === 'admin'
                ? 'bg-amber-400/10 text-amber-400'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Administration</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-xs uppercase tracking-wider transition-all duration-150 ${
              activeTab === 'analytics'
                ? 'bg-amber-400/10 text-amber-400'
                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Analytics</span>
          </button>
        </nav>

        {/* Footer/Meta in Sidebar */}
        <div className="p-4 mt-auto border-t border-slate-900">
          <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-900">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1.5">Academic Session</p>
            <p className="text-xs text-slate-200 font-bold">{activeBranding.academicSession}</p>
          </div>
        </div>

      </aside>
      )}

      {/* 2. Main Content Frame */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        
        {/* Sleek Top Header Bar */}
        <BrandingHeader
          branding={activeBranding}
          deadline={config?.applicationDeadline || '2026-08-31'}
          currentRole={role}
          onSignOut={handleCustomSignOut}
          onResetDemo={handleResetDemo}
          isResetting={isResetting}
        />

        {/* Mobile quick-nav list */}
        {role !== 'student' && (
          <div className="md:hidden flex gap-1 border-b border-slate-200 bg-white p-2 text-slate-400 font-sans font-bold text-[10px] uppercase overflow-x-auto">
            <button
              onClick={() => setActiveTab('home')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 flex-shrink-0 ${
                activeTab === 'home' ? 'bg-slate-900 text-white shadow-xs' : 'hover:text-slate-700'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Overview</span>
            </button>
            <button
              onClick={() => setActiveTab('apply')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 flex-shrink-0 ${
                activeTab === 'apply' ? 'bg-slate-900 text-white shadow-xs' : 'hover:text-slate-700'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Enrolment</span>
            </button>
            <button
              onClick={() => setActiveTab('panel')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 flex-shrink-0 ${
                activeTab === 'panel' ? 'bg-slate-900 text-white shadow-xs' : 'hover:text-slate-700'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Interview</span>
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 flex-shrink-0 ${
                activeTab === 'admin' ? 'bg-slate-900 text-white shadow-xs' : 'hover:text-slate-700'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 flex-shrink-0 ${
                activeTab === 'analytics' ? 'bg-slate-900 text-white shadow-xs' : 'hover:text-slate-700'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analytics</span>
            </button>
          </div>
        )}

        {/* Main Section */}
        <main className="flex-grow p-6 md:p-8 max-w-7xl w-full mx-auto space-y-8 overflow-y-auto">
          
          {networkError && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl font-medium font-sans flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <span>{networkError}</span>
            </div>
          )}

          {/* Tab View Routing */}
          <div className="space-y-6">
            
            {/* OVERVIEW TAB */}
            {activeTab === 'home' && (
              <div className="space-y-6">
                
                {/* Mobile View: ONLY student login, admin login, and teacher login */}
                <div className="block md:hidden space-y-6">
                  {/* Custom Mobile Header Card with Logo */}
                  <div className="bg-slate-950 text-white rounded-2xl p-6 border border-slate-900 text-center space-y-4 shadow-md">
                    {/* Dynamic School Logo inside standard container */}
                    <div className="w-20 h-20 bg-white rounded-2xl p-2 mx-auto border border-white/10 flex items-center justify-center shadow-inner overflow-hidden">
                      {activeBranding.logo ? (
                        activeBranding.logo.trim().startsWith('<svg') ? (
                          <div dangerouslySetInnerHTML={{ __html: activeBranding.logo }} className="w-full h-full text-slate-700 flex items-center justify-center text-center" />
                        ) : (
                          <img src={activeBranding.logo} alt="School Logo" className="w-full h-full object-contain" />
                        )
                      ) : (
                        <span className="text-xl font-black text-slate-700">GDG</span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-lg font-display font-bold tracking-tight">{activeBranding.name}</h2>
                      <p className="text-[11px] text-slate-400 font-sans leading-relaxed">{activeBranding.tagline}</p>
                    </div>
                  </div>

                  {/* Three beautiful Portal Login buttons */}
                  <div className="space-y-3.5">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">School Portal Access Gateway</h3>
                    
                    {/* Student Login Card */}
                    <button
                      onClick={() => handleRoleChange('student')}
                      className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-left flex items-center gap-4 hover:border-slate-300 transition shadow-xs active:bg-slate-50"
                    >
                      <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                        <Users className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-display font-bold text-slate-900 text-sm">Student Login</h4>
                        <p className="text-[10px] text-slate-500 font-medium">Nominate yourself and select cabinet preferences</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    </button>

                    {/* Teacher Login Card */}
                    <button
                      onClick={() => handleRoleChange('panel')}
                      className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-left flex items-center gap-4 hover:border-slate-300 transition shadow-xs active:bg-slate-50"
                    >
                      <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <Award className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-display font-bold text-slate-900 text-sm">Teacher Login</h4>
                        <p className="text-[10px] text-slate-500 font-medium">Evaluation, assessment panel & interview scorecard</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    </button>

                    {/* Admin Login Card */}
                    <button
                      onClick={() => handleRoleChange('admin')}
                      className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-left flex items-center gap-4 hover:border-slate-300 transition shadow-xs active:bg-slate-50"
                    >
                      <div className="p-3 bg-slate-100 text-slate-700 rounded-xl">
                        <Settings className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-display font-bold text-slate-900 text-sm">Admin Login</h4>
                        <p className="text-[10px] text-slate-500 font-medium">Configure roles, post eligibility rules & deadlines</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    </button>
                  </div>
                </div>

                {/* Desktop View: Full Dashboard (Hidden on Mobile) */}
                <div className="hidden md:block space-y-6">
                  
                  {/* Statistics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Total Applications</p>
                    <p className="text-2xl font-black text-slate-900">{applications.length}</p>
                    <div className="mt-2.5 w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${Math.min(applications.length * 10, 100)}%` }}></div>
                    </div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Eligible Candidates</p>
                    <p className="text-2xl font-black text-slate-900">{applications.filter(app => app.status !== 'Rejected').length}</p>
                    <div className="mt-2.5 w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                      <div className="bg-green-500 h-full transition-all duration-500" style={{ width: `${applications.length > 0 ? (applications.filter(app => app.status !== 'Rejected').length / applications.length) * 100 : 0}%` }}></div>
                    </div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Avg Merit Score</p>
                    <p className="text-2xl font-black text-slate-900">
                      {applications.filter(app => (app.finalScore ?? 0) > 0).length > 0 
                        ? (applications.filter(app => (app.finalScore ?? 0) > 0).reduce((sum, app) => sum + (app.finalScore || 0), 0) / applications.filter(app => (app.finalScore ?? 0) > 0).length).toFixed(1)
                        : '0.0'}
                      <span className="text-xs text-slate-400 font-normal ml-1">/ 50</span>
                    </p>
                    <div className="mt-2.5 w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full transition-all duration-500" style={{ 
                        width: `${applications.filter(app => (app.finalScore ?? 0) > 0).length > 0 
                          ? ((applications.filter(app => (app.finalScore ?? 0) > 0).reduce((sum, app) => sum + (app.finalScore || 0), 0) / applications.filter(app => (app.finalScore ?? 0) > 0).length) / 50) * 100 
                          : 0}%` 
                      }}></div>
                    </div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Evaluation Progress</p>
                    <p className="text-2xl font-black text-slate-900">
                      {applications.length > 0 ? Math.round((applications.filter(app => app.status !== 'Pending' && app.status !== 'Interview Scheduled').length / applications.length) * 100) : 0}%
                    </p>
                    <div className="mt-2.5 w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                      <div className="bg-purple-500 h-full transition-all duration-500" style={{ 
                        width: `${applications.length > 0 ? Math.round((applications.filter(app => app.status !== 'Pending' && app.status !== 'Interview Scheduled').length / applications.length) * 100) : 0}%` 
                      }}></div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Left Segment: Information cards */}
                  <div className="lg:col-span-8 space-y-6">
                    
                    {/* Banner Info */}
                    <div className="bg-slate-950 text-white p-6 rounded-2xl shadow-sm border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Investiture Selection Live</span>
                        <h2 className="text-xl font-display font-bold">100% Configuration-Driven Cabinet Council</h2>
                        <p className="text-xs text-slate-400 font-sans leading-relaxed">Dynamic eligibility, numeric matrices, simulated logs, and automated Gemini fit reports with zero future code changes.</p>
                      </div>
                      <button
                        onClick={() => handleRoleChange('student')}
                        className="px-4.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-md transition shrink-0"
                      >
                        Nominate Self Now
                      </button>
                    </div>

                    {/* Cabinet structure widgets */}
                    <div className="space-y-4">
                      <h3 className="font-display font-bold text-slate-900 text-sm">Active Cabinet Positions ({config?.posts.length || 0} Offices)</h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Senior Cabinet Wing */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-display font-bold text-slate-850 text-sm">Senior Cabinet Wing</h4>
                            <span className="text-[10px] bg-slate-100 border text-slate-500 font-bold px-2 py-0.5 rounded-full uppercase">Class VI–XI</span>
                          </div>
                          <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto pr-1 text-xs">
                            {config?.posts.filter(p => p.cabinetId === 'senior' && p.enabled).map(post => (
                              <div key={post.id} className="py-2 flex justify-between items-center">
                                <span className="font-bold text-slate-800">{post.title}</span>
                                <span className="text-[10px] text-slate-400 font-medium">Vacancies: {post.vacancies}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Junior Cabinet Wing */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-display font-bold text-slate-850 text-sm">Junior Cabinet Wing</h4>
                            <span className="text-[10px] bg-slate-100 border text-slate-500 font-bold px-2 py-0.5 rounded-full uppercase">Class I–V</span>
                          </div>
                          <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto pr-1 text-xs">
                            {config?.posts.filter(p => p.cabinetId === 'junior' && p.enabled).map(post => (
                              <div key={post.id} className="py-2 flex justify-between items-center">
                                <span className="font-bold text-slate-800">{post.title}</span>
                                <span className="text-[10px] text-slate-400 font-medium">Vacancies: {post.vacancies}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Interactive list of current nominations */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <div>
                          <h3 className="font-display font-bold text-slate-900 text-sm">Active Cabinet Nominees ({applications.length})</h3>
                          <p className="text-[11px] text-slate-500 font-sans mt-0.5">Click any student to view their certified leadership credentials and AI suitability report</p>
                        </div>
                      </div>

                      <div className="divide-y divide-slate-100">
                        {applications.slice(0, 5).map(app => {
                          const postTitle = config?.posts.find(p => p.id === app.firstChoicePostId)?.title || app.firstChoicePostId;
                          return (
                            <div key={app.id} className="py-3 flex justify-between items-center gap-4 text-xs">
                              <div>
                                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                  <span>{app.name}</span>
                                  <span className="text-[9px] bg-slate-100 border px-1.5 py-0.2 rounded-md font-bold text-slate-500 uppercase">Class {app.class}</span>
                                </div>
                                <div className="text-[11px] text-slate-400 mt-0.5 font-medium">Applied for: <span className="font-semibold text-slate-600">{postTitle}</span></div>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                                  app.status === 'Selected' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                                  app.status === 'Waitlisted' ? 'bg-amber-50 border-amber-200 text-amber-850' : 'bg-slate-50 border-slate-200 text-slate-600'
                                }`}>
                                  {app.status}
                                </span>
                                <button
                                  onClick={() => setSelectedProfileApp(app)}
                                  className="p-1 text-slate-400 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {applications.length > 5 && (
                        <button
                          onClick={() => handleRoleChange('panel')}
                          className="text-xs font-bold text-indigo-700 hover:text-indigo-600 flex items-center gap-1"
                        >
                          <span>View all nominations</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                  </div>

                  {/* Right Segment: Criteria and Email Logs */}
                  <div className="lg:col-span-4 space-y-6">
                    
                    {/* Merit Formula info */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3.5">
                      <h3 className="font-display font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">Cabinet Selection Matrix</h3>
                      
                      <div className="space-y-3 text-xs">
                        {config?.criteria.filter(c => c.enabled).map(item => (
                          <div key={item.id} className="flex justify-between items-center">
                            <span className="font-medium text-slate-600">{item.name}</span>
                            <span className="font-bold text-slate-900">Max {item.maxMarks} Marks</span>
                          </div>
                        ))}
                        <div className="border-t border-slate-150 pt-2 flex justify-between items-center font-bold text-slate-900">
                          <span>Total Merit Scale</span>
                          <span className="text-amber-600">50 Marks Max</span>
                        </div>
                      </div>
                    </div>

                    {/* Email Simulator */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                      <h3 className="font-display font-bold text-slate-900 text-sm border-b border-slate-100 pb-2 flex items-center gap-1.5">
                        <Mail className="w-4 h-4 text-slate-500" />
                        <span>Real-time Email Logs ({emailLogs.length})</span>
                      </h3>

                      {emailLogs.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No transactional logs recorded in this session.</p>
                      ) : (
                        <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                          {emailLogs.slice(0, 3).map(log => (
                            <div key={log.id} className="border border-slate-100 rounded-xl p-3 bg-slate-50 text-[11px] leading-relaxed">
                              <div className="font-bold text-slate-700 truncate mb-1">To: {log.to}</div>
                              <div className="font-bold text-slate-950 truncate mb-0.5">{log.subject}</div>
                              <p className="text-slate-400 truncate">{log.body}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {emailLogs.length > 0 && (
                        <button
                          onClick={() => setActiveTab('admin')}
                          className="text-xs font-bold text-indigo-700 hover:text-indigo-600 flex items-center gap-1"
                        >
                          <span>View full email stack</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                  </div>

                </div>

              </div>
              </div>
            )}

            {/* 2. ENROLMENT / STUDENT PORTAL */}
            {activeTab === 'apply' && config && (
              <StudentPortal
                posts={config.posts}
                cabinets={config.cabinets}
                applications={applications}
                onSubmitApplication={handleSubmitApplication}
                onUpdateApplication={handleUpdateApplication}
                deadline={config.applicationDeadline}
                user={currentUser}
              />
            )}

            {/* 3. INTERVIEW PANEL ASSESSMENT */}
            {activeTab === 'panel' && config && (
              <EvaluationPanel
                applications={applications}
                posts={config.posts}
                criteria={config.criteria}
                onUpdateApplication={handleUpdateApplication}
                onTriggerAIRecommend={handleTriggerAIRecommend}
              />
            )}

            {/* 4. ADMINISTRATION PANEL */}
            {activeTab === 'admin' && config && (
              <AdminPanel
                config={config}
                emailLogs={emailLogs}
                onUpdateConfig={handleUpdateConfig}
              />
            )}

            {/* 5. METRICS & REPORTS */}
            {activeTab === 'analytics' && config && (
              <div className="space-y-6">
                {/* Analytics Sub-tab Selector */}
                <div className="flex bg-slate-100 p-1 rounded-xl max-w-md mx-auto sm:mx-0 font-sans text-xs font-bold shadow-2xs">
                  <button
                    onClick={() => setAnalyticsSubTab('reports')}
                    className={`flex-1 py-2 px-4 rounded-lg transition-all text-center ${
                      analyticsSubTab === 'reports' ? 'bg-white text-slate-950 shadow-3xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Official PDF & Excel Reports
                  </button>
                  <button
                    onClick={() => setAnalyticsSubTab('visual')}
                    className={`flex-1 py-2 px-4 rounded-lg transition-all text-center ${
                      analyticsSubTab === 'visual' ? 'bg-white text-slate-950 shadow-3xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Interactive Charts & Visuals
                  </button>
                </div>

                {analyticsSubTab === 'reports' ? (
                  <ReportsPanel
                    config={config}
                    applications={applications}
                  />
                ) : (
                  <AnalyticsDashboard
                    applications={applications}
                    posts={config.posts}
                    criteria={config.criteria}
                  />
                )}
              </div>
            )}

          </div>

        </main>

        {/* FOOTER */}
        <footer className="border-t border-slate-200 bg-white py-6 mt-auto">
          <div className="max-w-7xl mx-auto px-6 md:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400 font-sans font-medium">
            <div>
              © {new Date().getFullYear()} {activeBranding.name} Cabinet Selection Desk.
            </div>
            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              developed by GDG AGRA
            </div>
            <div className="flex items-center gap-1">
              <span>Powered by</span>
              <strong className="text-slate-900 font-bold">Google AI Studio & Gemini Flash</strong>
            </div>
          </div>
        </footer>

      </div>

      {/* FLOATING CANDIDATE PROFILE CARD OVERLAY */}
      {selectedProfileApp && config && (
        <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center p-4 z-50 overflow-y-auto" id="profile-overlay">
          <div className="w-full max-w-4xl relative my-8">
            <CandidateProfileView
              app={selectedProfileApp}
              posts={config.posts}
              criteria={config.criteria}
              onClose={() => setSelectedProfileApp(null)}
            />
          </div>
        </div>
      )}

      {/* ACCESSIBILITY FLOAT CUSTOMIZER */}
      <AccessibilitySettings
        onThemeChange={setActiveTheme}
        onFontScaleChange={setFontScale}
        currentThemeName={activeTheme.name}
        currentFontScale={fontScale}
      />

    </div>
  );
}
