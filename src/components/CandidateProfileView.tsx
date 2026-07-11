import React from 'react';
import { StudentApplication, Post, EvaluationCriterion } from '../types';
import { Award, Trophy, User, Calendar, ShieldCheck, Mail, Phone, Printer, Brain, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';

interface CandidateProfileViewProps {
  app: StudentApplication;
  posts: Post[];
  criteria: EvaluationCriterion[];
  onClose: () => void;
}

export default function CandidateProfileView({
  app,
  posts,
  criteria,
  onClose
}: CandidateProfileViewProps) {
  const firstPostTitle = posts.find(p => p.id === app.firstChoicePostId)?.title || app.firstChoicePostId;
  const secondPostTitle = posts.find(p => p.id === app.secondChoicePostId)?.title || app.secondChoicePostId;

  // Custom House themed badges
  const houseConfig = {
    Radhakrishnan: { bg: 'bg-rose-50 border-rose-200 text-rose-800', dot: 'bg-rose-500', hex: '#f43f5e' },
    Tagore: { bg: 'bg-amber-50 border-amber-200 text-amber-800', dot: 'bg-amber-400', hex: '#fbbf24' },
    Vivekanand: { bg: 'bg-blue-50 border-blue-200 text-blue-800', dot: 'bg-blue-600', hex: '#2563eb' },
    Teresa: { bg: 'bg-emerald-50 border-emerald-200 text-emerald-800', dot: 'bg-emerald-500', hex: '#10b981' }
  };

  const houseStyle = houseConfig[app.house] || { bg: 'bg-slate-50 border-slate-200 text-slate-800', dot: 'bg-slate-500', hex: '#64748b' };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden" id="candidate-profile-view">
      
      {/* Dynamic Header colored by House affiliation */}
      <div 
        className="px-6 py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-white"
        style={{ backgroundColor: '#0f172a', borderBottom: `4px solid ${houseStyle.hex}` }}
      >
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${houseStyle.bg} border`}>
              {app.house} House
            </span>
            <span className="text-xs text-slate-400 font-mono font-medium">ID: {app.id}</span>
          </div>
          <h3 className="font-display font-bold text-2xl text-slate-100 mt-1">{app.name}</h3>
          <p className="text-xs text-slate-400 font-sans mt-0.5">Nominee for <strong className="text-amber-400">{firstPostTitle}</strong></p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 border border-slate-700 text-slate-200 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Profile</span>
          </button>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-200 transition"
          >
            Close Card
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="p-6 space-y-6">
        
        {/* Row 1: Photo & Bio Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
          
          {/* Photograph Container */}
          <div className="flex flex-col items-center">
            <div className="w-36 h-36 rounded-xl bg-slate-50 border border-slate-250 overflow-hidden shadow-2xs flex items-center justify-center text-slate-300 relative">
              {app.photo ? (
                <img src={app.photo} alt={app.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 stroke-1" />
              )}
            </div>

            <div className={`mt-3.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border text-center font-sans ${
              app.status === 'Selected' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
              app.status === 'Waitlisted' ? 'bg-amber-50 border-amber-200 text-amber-850' :
              app.status === 'Rejected' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-sky-50 border-sky-200 text-sky-850'
            }`}>
              {app.status}
            </div>
          </div>

          {/* Profile Bio Details */}
          <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-3.5 text-xs">
            <div>
              <span className="text-slate-400 block font-sans uppercase tracking-wider text-[9px] font-bold">Admission Number</span>
              <span className="font-semibold text-slate-850 font-sans">{app.admissionNumber}</span>
            </div>

            <div>
              <span className="text-slate-400 block font-sans uppercase tracking-wider text-[9px] font-bold">Class & Section</span>
              <span className="font-semibold text-slate-850 font-sans">Class {app.class}-{app.section} (Roll: {app.rollNumber})</span>
            </div>

            <div>
              <span className="text-slate-400 block font-sans uppercase tracking-wider text-[9px] font-bold">School Longevity</span>
              <span className="font-semibold text-slate-850 font-sans">{app.yearsInSchool} Years studied</span>
            </div>

            <div>
              <span className="text-slate-400 block font-sans uppercase tracking-wider text-[9px] font-bold">Student Mobile</span>
              <span className="font-semibold text-slate-850 font-mono flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" /> {app.mobile}</span>
            </div>

            <div>
              <span className="text-slate-400 block font-sans uppercase tracking-wider text-[9px] font-bold">Email Contact</span>
              <span className="font-semibold text-slate-850 font-mono flex items-center gap-1"><Mail className="w-3 h-3 text-slate-400" /> {app.email}</span>
            </div>

            <div>
              <span className="text-slate-400 block font-sans uppercase tracking-wider text-[9px] font-bold">House Affiliation</span>
              <span className="font-semibold text-slate-850 font-sans flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${houseStyle.dot}`} />
                {app.house}
              </span>
            </div>

            <div className="sm:col-span-3 border-t border-slate-100 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-slate-400 block font-sans uppercase tracking-wider text-[9px] font-bold">First Choice Post Selection</span>
                <span className="font-bold text-indigo-700 font-sans">{firstPostTitle}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-sans uppercase tracking-wider text-[9px] font-bold">Second Choice Post Selection</span>
                <span className="font-semibold text-slate-700 font-sans">{secondPostTitle}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Ranks and Scores */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-4 border-t border-slate-150">
          
          {/* Score breakdown bar charts (7 cols) */}
          <div className="md:col-span-7 space-y-4">
            <h4 className="font-display font-bold text-slate-800 text-xs uppercase tracking-wider">Evaluation Score breakdowns</h4>
            
            <div className="space-y-3">
              {/* Achievement */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-slate-600">Highest Achievements Certified Score</span>
                  <span className="font-bold text-slate-900">{app.achievementScore || 0} <span className="text-slate-400 text-[10px]">/ 10</span></span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div style={{ width: `${(app.achievementScore || 0) * 10}%` }} className="h-full bg-slate-800 rounded-full" />
                </div>
              </div>

              {/* Academic */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-slate-600">Academic Standing Score</span>
                  <span className="font-bold text-slate-900">{app.academicMarks || 0} <span className="text-slate-400 text-[10px]">/ 10</span></span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div style={{ width: `${(app.academicMarks || 0) * 10}%` }} className="h-full bg-slate-800 rounded-full" />
                </div>
              </div>

              {/* Attendance */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-slate-600">3-Year Attendance rating ({app.attendancePercentage || 95}%)</span>
                  <span className="font-bold text-slate-900">{app.attendanceMarks || 0} <span className="text-slate-400 text-[10px]">/ 10</span></span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div style={{ width: `${(app.attendanceMarks || 0) * 10}%` }} className="h-full bg-slate-800 rounded-full" />
                </div>
              </div>

              {/* Interview */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-slate-600">Interview Board marks</span>
                  <span className="font-bold text-slate-900">{app.interviewMarks !== undefined ? app.interviewMarks : 0} <span className="text-slate-400 text-[10px]">/ 10</span></span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div style={{ width: `${(app.interviewMarks || 0) * 10}%` }} className="h-full bg-slate-800 rounded-full" />
                </div>
              </div>

              {/* Loyalty longevity */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-slate-600">Loyalty longevity (Years studying)</span>
                  <span className="font-bold text-slate-900">{app.yearsScore || 0} <span className="text-slate-400 text-[10px]">/ 10</span></span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div style={{ width: `${(app.yearsScore || 0) * 10}%` }} className="h-full bg-slate-800 rounded-full" />
                </div>
              </div>
            </div>

            {/* Total score box */}
            <div className="bg-slate-900 border border-slate-800 text-white rounded-xl p-4 flex justify-between items-center text-xs mt-3.5">
              <div>
                <div className="text-slate-400 uppercase text-[9px] font-bold tracking-wider">Final Accumulated Merit</div>
                <div className="font-mono text-slate-300 text-[10px] mt-0.5">Sum of all enabled cabinet parameters</div>
              </div>
              <div className="text-2xl font-display font-bold text-amber-400">{app.finalScore || 0} <span className="text-xs text-slate-400 font-normal">/ 50</span></div>
            </div>
          </div>

          {/* Ranks and Remarks (5 cols) */}
          <div className="md:col-span-5 space-y-4 bg-slate-50 border p-4 rounded-xl flex flex-col justify-between">
            <div className="space-y-4">
              <h4 className="font-display font-bold text-slate-800 text-xs uppercase tracking-wider">Campaign standings</h4>
              
              <div className="grid grid-cols-2 gap-3.5 text-center">
                <div className="bg-white border rounded-xl p-3 shadow-2xs">
                  <span className="text-[9px] font-bold uppercase text-slate-400 font-sans block">Overall School Rank</span>
                  <span className="text-lg font-display font-bold text-slate-900 mt-1 block">#{app.rankOverall || 'TBD'}</span>
                </div>
                <div className="bg-white border rounded-xl p-3 shadow-2xs">
                  <span className="text-[9px] font-bold uppercase text-slate-400 font-sans block">House Standing</span>
                  <span className="text-lg font-display font-bold text-slate-900 mt-1 block">#{app.rankHouse || 'TBD'}</span>
                </div>
                <div className="bg-white border rounded-xl p-3 shadow-2xs col-span-2">
                  <span className="text-[9px] font-bold uppercase text-slate-400 font-sans block">Nominated Post standing</span>
                  <span className="text-base font-display font-bold text-indigo-700 mt-1 block">Rank #{app.rankPost || 'TBD'}</span>
                </div>
              </div>
            </div>

            {/* Panel recommendations */}
            <div className="border-t border-slate-200 pt-3.5 space-y-2 text-xs">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Panel Verdict:</span>
                <span className="font-bold text-slate-850 ml-1.5">{app.recommendation || 'Pending'}</span>
              </div>
              {app.remarks ? (
                <div className="italic text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200/50 leading-relaxed">
                  "{app.remarks}"
                </div>
              ) : (
                <div className="text-slate-400 italic">No evaluator remarks entered yet.</div>
              )}
            </div>
          </div>
        </div>

        {/* Row 3: SOP & Achievements Portfolio */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-150">
          <div className="space-y-2 text-xs">
            <h4 className="font-display font-bold text-slate-800 uppercase tracking-wider text-[10px]">Essay SOP Statements</h4>
            <div className="bg-slate-50 border p-4 rounded-xl leading-relaxed text-slate-700 font-sans max-h-40 overflow-y-auto whitespace-pre-line">
              {app.sop}
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <h4 className="font-display font-bold text-slate-800 uppercase tracking-wider text-[10px]">Honors & Certificates</h4>
            <div className="bg-slate-50 border p-4 rounded-xl leading-relaxed text-slate-700 max-h-40 overflow-y-auto space-y-2">
              {(app.achievements || []).length === 0 ? (
                <p className="italic text-slate-400">No achievements recorded</p>
              ) : (
                app.achievements.map((ach, idx) => (
                  <div key={idx} className="flex gap-2.5 bg-white border border-slate-150 rounded-lg p-2.5 items-center">
                    <Trophy className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="font-bold text-slate-800 truncate">{ach.title}</div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{ach.level} • {ach.rank} ({ach.year})</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Row 4: AI Assessment (Gemini Report) if available */}
        {app.aiRecommendation && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-lg text-white space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Brain className="w-5 h-5 text-indigo-400" />
              <div>
                <h4 className="font-display font-bold text-slate-100 text-sm">Gemini Selection Audit Report</h4>
                <p className="text-[10px] text-slate-500 font-sans mt-0.5">Automated AI selection model fit verification</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <div className="text-lg font-display font-bold text-amber-400">{app.aiRecommendation.leadershipScore}%</div>
                <div className="text-[9px] text-slate-400 font-sans mt-0.5">Leadership Quotient</div>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <div className="text-lg font-display font-bold text-indigo-400">{app.aiRecommendation.suitabilityScore}%</div>
                <div className="text-[9px] text-slate-400 font-sans mt-0.5">Cabinet Office Fit</div>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <div className="text-lg font-display font-bold text-emerald-400">{app.aiRecommendation.confidenceScore}%</div>
                <div className="text-[9px] text-slate-400 font-sans mt-0.5">Confidence Level</div>
              </div>
            </div>

            {/* Summary */}
            <div className="text-xs space-y-1">
              <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 font-sans">Executive Fit Analysis</span>
              <p className="text-slate-300 leading-relaxed font-sans">{app.aiRecommendation.recommendationSummary}</p>
            </div>

            {/* Strengths & Weaknesses list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-bold tracking-widest text-emerald-400 flex items-center gap-1 font-sans">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Strengths
                </span>
                <ul className="list-disc pl-4 text-xs text-slate-300 space-y-1 font-sans">
                  {app.aiRecommendation.strengths.map((str, i) => (
                    <li key={i}>{str}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] uppercase font-bold tracking-widest text-amber-400 flex items-center gap-1 font-sans">
                  <AlertTriangle className="w-3.5 h-3.5" /> constructive risks / concerns
                </span>
                <ul className="list-disc pl-4 text-xs text-slate-300 space-y-1 font-sans">
                  {app.aiRecommendation.weaknesses.map((wk, i) => (
                    <li key={i}>{wk}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Tie-breaker & risk */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3.5 border-t border-slate-800 text-xs">
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 font-sans font-semibold">Tie-Breaking Value</span>
                <p className="text-slate-300 leading-relaxed font-sans">{app.aiRecommendation.tieBreakerVerdict}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-bold tracking-widest text-rose-400 font-sans font-semibold">Risk Analysis</span>
                <p className="text-slate-300 leading-relaxed font-sans">{app.aiRecommendation.riskAnalysis}</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
