import React, { useState } from 'react';
import { StudentApplication, Post, EvaluationCriterion } from '../types';
import { Search, Filter, Award, CheckSquare, Brain, Clock, ShieldAlert, CheckCircle2, AlertTriangle, AlertCircle, RefreshCw, Eye, Save, Undo, Check, User, LayoutGrid } from 'lucide-react';

interface EvaluationPanelProps {
  applications: StudentApplication[];
  posts: Post[];
  criteria: EvaluationCriterion[];
  onUpdateApplication: (id: string, updates: Partial<StudentApplication>) => void;
  onTriggerAIRecommend: (id: string) => Promise<any>;
}

export default function EvaluationPanel({
  applications,
  posts,
  criteria,
  onUpdateApplication,
  onTriggerAIRecommend
}: EvaluationPanelProps) {
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCabinet, setFilterCabinet] = useState('all');
  const [filterPost, setFilterPost] = useState('all');
  const [filterGender, setFilterGender] = useState('all');
  const [filterHouse, setFilterHouse] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterRecommendation, setFilterRecommendation] = useState('all');

  // Selected candidate for detailed evaluation
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  // Evaluation states for the selected candidate
  const [interviewMarks, setInterviewMarks] = useState<number>(10);
  const [attendancePercentage, setAttendancePercentage] = useState<number>(95);
  const [attendanceMarks, setAttendanceMarks] = useState<number>(9.5);
  const [academicMarks, setAcademicMarks] = useState<number>(10);
  const [yearsScore, setYearsScore] = useState<number>(10);
  const [achievementScore, setAchievementScore] = useState<number>(10);
  const [disciplineMarks, setDisciplineMarks] = useState<number>(10);
  const [remarks, setRemarks] = useState('');
  const [recommendation, setRecommendation] = useState<'Highly Recommended' | 'Recommended' | 'Waitlisted' | 'Not Recommended'>('Recommended');
  const [appStatus, setAppStatus] = useState<any>('Under Evaluation');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');

  // AI loading indicator
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const selectedApp = applications.find(a => a.id === selectedAppId);

  // Mode selection: 'individual' (one-by-one detail) or 'bulk' (interactive spreadsheet grid)
  const [evaluationMode, setEvaluationMode] = useState<'individual' | 'bulk'>('individual');

  // Bulk grid draft states (map of appId -> Partial<StudentApplication>)
  const [gridDrafts, setGridDrafts] = useState<Record<string, Partial<StudentApplication>>>({});

  // Handle updates to a draft field in the grid
  const handleGridFieldChange = (appId: string, field: keyof StudentApplication, value: any) => {
    setGridDrafts(prev => {
      const currentDraft = prev[appId] || {};
      const updatedDraft = { ...currentDraft, [field]: value };
      
      // If editing attendanceMarks, also calculate attendancePercentage automatically
      if (field === 'attendanceMarks') {
        updatedDraft.attendancePercentage = parseFloat((value * 10).toFixed(1));
      }
      
      return {
        ...prev,
        [appId]: updatedDraft
      };
    });
  };

  // Undo changes for a specific application in the grid
  const handleGridRowReset = (appId: string) => {
    setGridDrafts(prev => {
      const updated = { ...prev };
      delete updated[appId];
      return updated;
    });
  };

  // Save changes for a single row in the grid
  const handleGridRowSave = async (appId: string) => {
    const draft = gridDrafts[appId];
    if (!draft) return;

    try {
      await onUpdateApplication(appId, draft);
      // Remove from drafts on success
      setGridDrafts(prev => {
        const updated = { ...prev };
        delete updated[appId];
        return updated;
      });
      alert('Candidate marks updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Row save failed.');
    }
  };

  // Save all changed drafts in the grid at once
  const handleGridSaveAll = async () => {
    const appIdsWithDrafts = Object.keys(gridDrafts);
    if (appIdsWithDrafts.length === 0) {
      alert('No draft changes found to save.');
      return;
    }

    let successCount = 0;
    try {
      await Promise.all(
        appIdsWithDrafts.map(async appId => {
          const draft = gridDrafts[appId];
          await onUpdateApplication(appId, draft);
          successCount++;
        })
      );
      
      // Clear drafts
      setGridDrafts({});
      alert(`Successfully saved assessment marks and status for ${successCount} candidates!`);
    } catch (err: any) {
      alert(`Saved ${successCount} updates, but encountered an error: ${err.message || err}`);
    }
  };

  // Calculate row total dynamically using enabled criteria
  const getCalculatedTotalForGridRow = (app: StudentApplication) => {
    const draft = gridDrafts[app.id] || {};
    let totalScore = 0;
    criteria.forEach(c => {
      if (!c.enabled) return;
      let marks = 0;
      if (c.id === "achievement") marks = draft.achievementScore !== undefined ? draft.achievementScore : (app.achievementScore || 0);
      else if (c.id === "interview") marks = draft.interviewMarks !== undefined ? draft.interviewMarks : (app.interviewMarks || 0);
      else if (c.id === "attendance") marks = draft.attendanceMarks !== undefined ? draft.attendanceMarks : (app.attendanceMarks || 0);
      else if (c.id === "academics") marks = draft.academicMarks !== undefined ? draft.academicMarks : (app.academicMarks || 0);
      else if (c.id === "years") marks = draft.yearsScore !== undefined ? draft.yearsScore : (app.yearsScore || 0);
      else if (c.id === "discipline") marks = draft.disciplineMarks !== undefined ? draft.disciplineMarks : (app.disciplineMarks || 0);
      totalScore += Math.min(marks, c.maxMarks);
    });
    return parseFloat(totalScore.toFixed(1));
  };

  // Initialize evaluation fields when candidate selected
  const handleSelectApp = (app: StudentApplication) => {
    setSelectedAppId(app.id);
    setInterviewMarks(app.interviewMarks !== undefined ? app.interviewMarks : 10);
    setAttendancePercentage(app.attendancePercentage !== undefined ? app.attendancePercentage : 95);
    setAttendanceMarks(app.attendanceMarks !== undefined ? app.attendanceMarks : 9.5);
    setAcademicMarks(app.academicMarks !== undefined ? app.academicMarks : 10);
    setYearsScore(app.yearsScore !== undefined ? app.yearsScore : 10);
    setAchievementScore(app.achievementScore !== undefined ? app.achievementScore : 10);
    setDisciplineMarks(app.disciplineMarks !== undefined ? app.disciplineMarks : 10);
    setRemarks(app.remarks || '');
    setRecommendation(app.recommendation || 'Recommended');
    setAppStatus(app.status);
    setInterviewDate(app.interviewDate || '');
    setInterviewTime(app.interviewTime || '');
    setAiError('');
  };

  // Filter application list
  const filteredApps = applications.filter(app => {
    // Search name/admission
    const nameMatch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      app.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Cabinet Filter
    const firstPost = posts.find(p => p.id === app.firstChoicePostId);
    const cabinetMatch = filterCabinet === 'all' || firstPost?.cabinetId === filterCabinet;
    
    // Post Filter
    const postMatch = filterPost === 'all' || app.firstChoicePostId === filterPost || app.secondChoicePostId === filterPost;
    
    // Gender Filter
    const genderMatch = filterGender === 'all' || app.gender === filterGender;
    
    // House Filter
    const houseMatch = filterHouse === 'all' || app.house === filterHouse;
    
    // Status Filter
    const statusMatch = filterStatus === 'all' || app.status === filterStatus;

    // Recommendation Filter
    const recMatch = filterRecommendation === 'all' || app.recommendation === filterRecommendation;

    return nameMatch && cabinetMatch && postMatch && genderMatch && houseMatch && statusMatch && recMatch;
  });

  // Handle Save Evaluation
  const handleSaveEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppId) return;

    const updates: Partial<StudentApplication> = {
      interviewMarks,
      attendancePercentage,
      attendanceMarks,
      academicMarks,
      yearsScore,
      achievementScore,
      disciplineMarks,
      remarks: remarks.trim(),
      recommendation,
      status: appStatus,
      interviewDate: interviewDate || undefined,
      interviewTime: interviewTime || undefined
    };

    onUpdateApplication(selectedAppId, updates);
    alert('Candidate assessment marks and status successfully saved! Total merit score out of 60 recalculated.');
  };

  // Call server-side Gemini AI Recommendation
  const handleTriggerAICoach = async () => {
    if (!selectedAppId) return;
    setIsAiLoading(true);
    setAiError('');

    try {
      await onTriggerAIRecommend(selectedAppId);
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'Failed to connect with server Gemini AI Coach. Ensure API Key is active.');
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="space-y-6" id="evaluation-panel">
      
      {/* HEADER WITH MODE SWITCHERS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
        <div>
          <h2 className="text-sm font-display font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600" />
            <span>Cabinet Nomination Evaluation Desk</span>
          </h2>
          <p className="text-[11px] text-slate-500 font-sans mt-0.5">Evaluate applicants individually or manage all marks at once using the bulk grid.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 self-stretch sm:self-auto justify-center">
          <button
            type="button"
            onClick={() => setEvaluationMode('individual')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold font-sans transition-all flex items-center gap-1.5 ${
              evaluationMode === 'individual' ? 'bg-white text-slate-950 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Individual Mode</span>
          </button>
          <button
            type="button"
            onClick={() => setEvaluationMode('bulk')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold font-sans transition-all flex items-center gap-1.5 ${
              evaluationMode === 'bulk' ? 'bg-white text-slate-950 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Bulk Grid Mode</span>
          </button>
        </div>
      </div>

      {/* INDIVIDUAL EVALUATION MODE */}
      {evaluationMode === 'individual' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: CANDIDATE SELECTOR & SEARCH (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
              <div>
                <h3 className="font-display font-bold text-slate-900 text-sm">Cabinet Nominees</h3>
                <p className="text-[11px] text-slate-500 font-sans mt-0.5">Filter, select, and process applications</p>
              </div>

              {/* Search Row */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by name or ID..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs focus:ring-1 focus:ring-slate-900 focus:border-slate-900 font-sans"
                />
              </div>

              {/* Filter Rows (Collapsible style or just grid) */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 font-sans uppercase">Cabinet</label>
                  <select
                    value={filterCabinet}
                    onChange={e => setFilterCabinet(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-1.5 text-xs bg-white text-slate-750"
                  >
                    <option value="all">All Cabinets</option>
                    <option value="senior">Senior (VI–XI)</option>
                    <option value="junior">Junior (I–V)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 font-sans uppercase">House</label>
                  <select
                    value={filterHouse}
                    onChange={e => setFilterHouse(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-1.5 text-xs bg-white text-slate-750"
                  >
                    <option value="all">All Houses</option>
                    <option value="Radhakrishnan">Radhakrishnan</option>
                    <option value="Tagore">Tagore</option>
                    <option value="Vivekanand">Vivekanand</option>
                    <option value="Teresa">Teresa</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 font-sans uppercase">Status</label>
                  <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-1.5 text-xs bg-white text-slate-750"
                  >
                    <option value="all">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Interview Scheduled">Interview Scheduled</option>
                    <option value="Under Evaluation">Under Evaluation</option>
                    <option value="Selected">Selected</option>
                    <option value="Waitlisted">Waitlisted</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 font-sans uppercase">Recommendation</label>
                  <select
                    value={filterRecommendation}
                    onChange={e => setFilterRecommendation(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-1.5 text-xs bg-white text-slate-750"
                  >
                    <option value="all">All Recs</option>
                    <option value="Highly Recommended">Highly Recommended</option>
                    <option value="Recommended">Recommended</option>
                    <option value="Waitlisted">Waitlisted</option>
                    <option value="Not Recommended">Not Recommended</option>
                  </select>
                </div>
              </div>
            </div>

            {/* CANDIDATE LIST CARD */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs max-h-[550px] overflow-y-auto">
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex justify-between items-center">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Candidate Pool ({filteredApps.length})</span>
              </div>

              <div className="divide-y divide-slate-100">
                {filteredApps.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 italic">No candidates found matching the filters.</div>
                ) : (
                  filteredApps.map(app => {
                    const firstChoiceTitle = posts.find(p => p.id === app.firstChoicePostId)?.title || app.firstChoicePostId;
                    const isSelected = app.id === selectedAppId;
                    
                    return (
                      <button
                        key={app.id}
                        onClick={() => handleSelectApp(app)}
                        className={`w-full text-left p-4 hover:bg-slate-50 transition flex justify-between items-center gap-3 border-l-4 ${
                          isSelected ? 'bg-slate-50/80 border-slate-900' : 'border-transparent'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="font-display font-bold text-slate-900 text-sm flex items-center gap-1.5">
                            <span>{app.name}</span>
                            <span className="text-[9px] bg-slate-100 border border-slate-200 text-slate-500 font-mono px-1.5 py-0.2 rounded-md font-semibold">Class {app.class}-{app.section}</span>
                          </div>
                          <div className="text-[11px] font-medium text-slate-400 mt-1 truncate">
                            Choice 1: <span className="font-semibold text-slate-600">{firstChoiceTitle}</span>
                          </div>
                          
                          {/* Quick metrics */}
                          <div className="flex gap-2.5 text-[10px] text-slate-400 font-sans mt-2">
                            <span>Score: <strong className="text-slate-700">{app.finalScore || 0}</strong></span>
                            <span>House: <strong className="text-slate-700">{app.house}</strong></span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold ${
                            app.status === 'Selected' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                            app.status === 'Waitlisted' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                            app.status === 'Rejected' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-slate-50 border-slate-200 text-slate-600'
                          }`}>
                            {app.status}
                          </span>
                          {app.recommendation && (
                            <span className="text-[9px] text-indigo-700 font-semibold">{app.recommendation}</span>
                          )}
                          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-md transition mt-1 flex items-center gap-1 border border-indigo-200">
                            <Eye className="w-3 h-3" />
                            <span>View & Rate</span>
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: EVALUATOR DESK (7 cols) */}
          <div className="lg:col-span-7">
            {!selectedApp ? (
              <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-12 text-center h-full flex flex-col items-center justify-center space-y-3">
                <Award className="w-12 h-12 text-slate-300 stroke-1" />
                <h4 className="font-display font-bold text-slate-700 text-sm">Evaluator Bench</h4>
                <p className="text-xs text-slate-400 max-w-sm">Select a student candidate from the left panel to begin score audits, verification, and trigger the AI coaching recommendation.</p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* 1. SCORE ASSESSMENT SHEET */}
                <form onSubmit={handleSaveEvaluation} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider font-sans">Active Nominee Assessment</span>
                      <h3 className="font-display font-bold text-slate-900 text-lg mt-0.5">{selectedApp.name} ({selectedApp.admissionNumber})</h3>
                      <p className="text-xs text-slate-500 font-sans mt-0.5">Applied for: <span className="font-bold">{posts.find(p => p.id === selectedApp.firstChoicePostId)?.title || selectedApp.firstChoicePostId}</span> (First Choice)</p>
                    </div>
                    <div className="flex-shrink-0 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-center sm:text-right">
                      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-sans">Calculated Score</div>
                      <div className="text-2xl font-display font-bold text-slate-900">{selectedApp.finalScore || 0} <span className="text-xs text-slate-400 font-sans">/ 60</span></div>
                    </div>
                  </div>
                  {/* Slider Inputs for Panel Marks (ALL 6 PARAMETERS, max 10 each) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 pt-1">
                    
                    {/* 1. Academics */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <label className="font-bold text-slate-700">Academics Rating Score (Max 10)</label>
                        <span className="font-bold text-indigo-600 text-sm">{academicMarks} / 10</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min={0}
                          max={10}
                          step={0.5}
                          value={academicMarks}
                          onChange={e => setAcademicMarks(parseFloat(e.target.value))}
                          className="flex-1 accent-slate-900 h-1.5 bg-slate-150 rounded-lg cursor-pointer"
                        />
                        <input
                          type="number"
                          min={0}
                          max={10}
                          step={0.1}
                          value={academicMarks}
                          onChange={e => setAcademicMarks(Math.min(10, Math.max(0, parseFloat(e.target.value) || 0)))}
                          className="w-14 px-1.5 py-1 text-xs border border-slate-300 rounded text-center font-bold"
                        />
                      </div>
                    </div>

                    {/* 2. Attendance */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <label className="font-bold text-slate-700">Attendance Score (Max 10)</label>
                        <span className="font-bold text-indigo-600 text-sm">{attendanceMarks} / 10</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min={0}
                          max={10}
                          step={0.1}
                          value={attendanceMarks}
                          onChange={e => {
                            const val = parseFloat(e.target.value);
                            setAttendanceMarks(val);
                            setAttendancePercentage(parseFloat((val * 10).toFixed(1)));
                          }}
                          className="flex-1 accent-slate-900 h-1.5 bg-slate-150 rounded-lg cursor-pointer"
                        />
                        <input
                          type="number"
                          min={0}
                          max={10}
                          step={0.1}
                          value={attendanceMarks}
                          onChange={e => {
                            const val = Math.min(10, Math.max(0, parseFloat(e.target.value) || 0));
                            setAttendanceMarks(val);
                            setAttendancePercentage(parseFloat((val * 10).toFixed(1)));
                          }}
                          className="w-14 px-1.5 py-1 text-xs border border-slate-300 rounded text-center font-bold"
                        />
                      </div>
                    </div>

                    {/* 3. Number of Years */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <label className="font-bold text-slate-700 flex items-center gap-1.5">
                          <span>Years in School (Max 10)</span>
                          <span className="text-[10px] text-slate-400 font-normal">Registered: {selectedApp.yearsInSchool} yrs</span>
                        </label>
                        <span className="font-bold text-indigo-600 text-sm">{yearsScore} / 10</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min={0}
                          max={10}
                          step={1}
                          value={yearsScore}
                          onChange={e => setYearsScore(parseInt(e.target.value))}
                          className="flex-1 accent-slate-900 h-1.5 bg-slate-150 rounded-lg cursor-pointer"
                        />
                        <input
                          type="number"
                          min={0}
                          max={10}
                          step={1}
                          value={yearsScore}
                          onChange={e => setYearsScore(Math.min(10, Math.max(0, parseInt(e.target.value) || 0)))}
                          className="w-14 px-1.5 py-1 text-xs border border-slate-300 rounded text-center font-bold"
                        />
                      </div>
                    </div>

                    {/* 4. Achievement Score */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <label className="font-bold text-slate-700">Achievements Portfolio (Max 10)</label>
                        <span className="font-bold text-indigo-600 text-sm">{achievementScore} / 10</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min={0}
                          max={10}
                          step={1}
                          value={achievementScore}
                          onChange={e => setAchievementScore(parseInt(e.target.value))}
                          className="flex-1 accent-slate-900 h-1.5 bg-slate-150 rounded-lg cursor-pointer"
                        />
                        <input
                          type="number"
                          min={0}
                          max={10}
                          step={1}
                          value={achievementScore}
                          onChange={e => setAchievementScore(Math.min(10, Math.max(0, parseInt(e.target.value) || 0)))}
                          className="w-14 px-1.5 py-1 text-xs border border-slate-300 rounded text-center font-bold"
                        />
                      </div>
                    </div>

                    {/* 5. Interview Marks */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <label className="font-bold text-slate-700">Interview Rating (Max 10)</label>
                        <span className="font-bold text-indigo-600 text-sm">{interviewMarks} / 10</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min={0}
                          max={10}
                          step={0.5}
                          value={interviewMarks}
                          onChange={e => setInterviewMarks(parseFloat(e.target.value))}
                          className="flex-1 accent-slate-900 h-1.5 bg-slate-150 rounded-lg cursor-pointer"
                        />
                        <input
                          type="number"
                          min={0}
                          max={10}
                          step={0.1}
                          value={interviewMarks}
                          onChange={e => setInterviewMarks(Math.min(10, Math.max(0, parseFloat(e.target.value) || 0)))}
                          className="w-14 px-1.5 py-1 text-xs border border-slate-300 rounded text-center font-bold"
                        />
                      </div>
                    </div>

                    {/* 6. Discipline & Behavior */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <label className="font-bold text-slate-700">Discipline & Conduct (Max 10)</label>
                        <span className="font-bold text-indigo-600 text-sm">{disciplineMarks} / 10</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min={0}
                          max={10}
                          step={0.5}
                          value={disciplineMarks}
                          onChange={e => setDisciplineMarks(parseFloat(e.target.value))}
                          className="flex-1 accent-slate-900 h-1.5 bg-slate-150 rounded-lg cursor-pointer"
                        />
                        <input
                          type="number"
                          min={0}
                          max={10}
                          step={0.1}
                          value={disciplineMarks}
                          onChange={e => setDisciplineMarks(Math.min(10, Math.max(0, parseFloat(e.target.value) || 0)))}
                          className="w-14 px-1.5 py-1 text-xs border border-slate-300 rounded text-center font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Status & Recommendation Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600">Cabinet Recommendation</label>
                      <select
                        value={recommendation}
                        onChange={e => setRecommendation(e.target.value as any)}
                        className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white text-slate-750 font-semibold"
                      >
                        <option value="Highly Recommended">Highly Recommended</option>
                        <option value="Recommended">Recommended</option>
                        <option value="Waitlisted">Waitlisted</option>
                        <option value="Not Recommended">Not Recommended</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600">Enrolment Status</label>
                      <select
                        value={appStatus}
                        onChange={e => setAppStatus(e.target.value as any)}
                        className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white text-slate-750 font-semibold"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Interview Scheduled">Interview Scheduled</option>
                        <option value="Under Evaluation">Under Evaluation</option>
                        <option value="Selected">Selected</option>
                        <option value="Waitlisted">Waitlisted</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>
                  </div>

                  {/* Interview scheduling inputs (Conditional on status) */}
                  {appStatus === 'Interview Scheduled' && (
                    <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 font-sans uppercase">Interview Date</label>
                        <input
                          type="date"
                          value={interviewDate}
                          onChange={e => setInterviewDate(e.target.value)}
                          className="w-full border border-slate-300 rounded-md p-1.5 text-xs bg-white text-slate-750"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 font-sans uppercase">Interview Time</label>
                        <input
                          type="time"
                          value={interviewTime}
                          onChange={e => setInterviewTime(e.target.value)}
                          className="w-full border border-slate-300 rounded-md p-1.5 text-xs bg-white text-slate-750"
                        />
                      </div>
                    </div>
                  )}

                  {/* Remarks Text Box */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 block">Evaluator Committee Remarks</label>
                    <textarea
                      rows={2}
                      placeholder="Summarize interview findings, leadership maturity levels, and discipline evaluation..."
                      value={remarks}
                      onChange={e => setRemarks(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-sans text-slate-850"
                    />
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end gap-2 pt-1.5 border-t border-slate-100">
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold font-sans flex items-center gap-1.5 transition"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>Update Assessment</span>
                    </button>
                  </div>
                </form>

                {/* 2. GEMINI AI COACH RECOMMENDATION SECTION */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-md text-white space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/30">
                        <Brain className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-display font-bold text-sm text-slate-100 flex items-center gap-1.5">
                          <span>Gemini Coach Fit Engine</span>
                          <span className="text-[10px] bg-amber-500/20 border border-amber-400/40 text-amber-300 px-2 py-0.2 rounded-md font-bold uppercase tracking-wider">PRO</span>
                        </h4>
                        <p className="text-[10px] text-slate-400 font-sans mt-0.5">Automated Merit fit-score, risk, strengths & tie-breaker analysis</p>
                      </div>
                    </div>

                    <button
                      onClick={handleTriggerAICoach}
                      disabled={isAiLoading}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition active:bg-indigo-700 shadow-lg"
                    >
                      {isAiLoading ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Brain className="w-3.5 h-3.5" />
                      )}
                      <span>{selectedApp.aiRecommendation ? 'Re-Run Coach' : 'Request Coach Recommendation'}</span>
                    </button>
                  </div>

                  {/* Display AI Results if loaded */}
                  {isAiLoading && (
                    <div className="p-6 text-center space-y-3 bg-slate-900/60 border border-slate-800 rounded-xl">
                      <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto stroke-1" />
                      <p className="text-xs text-slate-300">Assembling candidate essay parameters, achievements matrices, interview scores, and loyalty credits. Generating fit intelligence report...</p>
                    </div>
                  )}

                  {aiError && (
                    <div className="p-4 bg-rose-950/40 border border-rose-900/50 rounded-xl text-rose-200 text-xs flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 flex-shrink-0 text-rose-400" />
                      <p>{aiError}</p>
                    </div>
                  )}

                  {!isAiLoading && !aiError && selectedApp.aiRecommendation && (
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-5">
                      {/* Scores */}
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                          <div className="text-xl font-display font-bold text-amber-400">{selectedApp.aiRecommendation.leadershipScore}%</div>
                          <div className="text-[10px] text-slate-400 font-medium font-sans mt-0.5">Leadership Potential</div>
                        </div>
                        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                          <div className="text-xl font-display font-bold text-indigo-400">{selectedApp.aiRecommendation.suitabilityScore}%</div>
                          <div className="text-[10px] text-slate-400 font-medium font-sans mt-0.5">Role Cabinet Fit</div>
                        </div>
                        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                          <div className="text-xl font-display font-bold text-emerald-400">{selectedApp.aiRecommendation.confidenceScore}%</div>
                          <div className="text-[10px] text-slate-400 font-medium font-sans mt-0.5">Confidence Score</div>
                        </div>
                      </div>

                      {/* Summary */}
                      <div className="text-xs space-y-1">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Cabinet Fit Summary</span>
                        <p className="text-slate-200 leading-relaxed font-sans">{selectedApp.aiRecommendation.recommendationSummary}</p>
                      </div>

                      {/* Strengths & Weaknesses */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Strengths Highlights
                          </span>
                          <ul className="list-disc pl-4 text-xs text-slate-300 space-y-1 font-sans">
                            {selectedApp.aiRecommendation.strengths.map((str, i) => (
                              <li key={i}>{str}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="space-y-1.5">
                          <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" /> Improvement Areas
                          </span>
                          <ul className="list-disc pl-4 text-xs text-slate-300 space-y-1 font-sans">
                            {selectedApp.aiRecommendation.weaknesses.map((wk, i) => (
                              <li key={i}>{wk}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Tie-Breaker & Risk Analysis */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-800">
                        <div className="space-y-1 text-xs">
                          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Tie-Breaker Advantage</span>
                          <p className="text-slate-300 leading-relaxed font-sans">{selectedApp.aiRecommendation.tieBreakerVerdict}</p>
                        </div>

                        <div className="space-y-1 text-xs">
                          <span className="text-[10px] uppercase font-bold tracking-widest text-rose-400 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-400" /> Executive Risk Analysis
                          </span>
                          <p className="text-slate-300 leading-relaxed font-sans">{selectedApp.aiRecommendation.riskAnalysis}</p>
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-500 font-mono text-right">
                        Analyzed at: {new Date(selectedApp.aiRecommendation.generatedAt).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BULK GRID MODE */}
      {evaluationMode === 'bulk' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-display font-bold text-slate-900 text-sm">Interactive Marks Evaluation Grid</h3>
              <p className="text-[11px] text-slate-500 font-sans mt-0.5">
                Type directly in the cells to enter marks (Max 10 per parameter). Changes are stored as drafts until saved.
              </p>
            </div>
            <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end">
              {Object.keys(gridDrafts).length > 0 && (
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 animate-pulse">
                  {Object.keys(gridDrafts).length} pending changes
                </span>
              )}
              <button
                type="button"
                onClick={handleGridSaveAll}
                disabled={Object.keys(gridDrafts).length === 0}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold font-sans flex items-center gap-1.5 transition shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save All Grid Changes</span>
              </button>
            </div>
          </div>

          {/* Quick Filters in Grid Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-150">
            <div>
              <label className="text-[10px] font-bold text-slate-400 font-sans uppercase">Search Name/ID</label>
              <div className="relative mt-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-slate-300 bg-white rounded-lg text-xs focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 font-sans uppercase">Cabinet Wing</label>
              <select
                value={filterCabinet}
                onChange={e => setFilterCabinet(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-1.5 mt-1 text-xs bg-white text-slate-750"
              >
                <option value="all">All Cabinets</option>
                <option value="senior">Senior (VI–XI)</option>
                <option value="junior">Junior (I–V)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 font-sans uppercase">House</label>
              <select
                value={filterHouse}
                onChange={e => setFilterHouse(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-1.5 mt-1 text-xs bg-white text-slate-750"
              >
                <option value="all">All Houses</option>
                <option value="Radhakrishnan">Radhakrishnan</option>
                <option value="Tagore">Tagore</option>
                <option value="Vivekanand">Vivekanand</option>
                <option value="Teresa">Teresa</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 font-sans uppercase">Status</label>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-1.5 mt-1 text-xs bg-white text-slate-750"
              >
                <option value="all">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Interview Scheduled">Interview Scheduled</option>
                <option value="Under Evaluation">Under Evaluation</option>
                <option value="Selected">Selected</option>
                <option value="Waitlisted">Waitlisted</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Large Table/Grid */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 min-w-[160px]">Candidate</th>
                  <th className="px-4 py-3">Applied Post</th>
                  <th className="px-3 py-3 text-center">Academics (10)</th>
                  <th className="px-3 py-3 text-center">Attendance (10)</th>
                  <th className="px-3 py-3 text-center">Years (10)</th>
                  <th className="px-3 py-3 text-center">Achievement (10)</th>
                  <th className="px-3 py-3 text-center">Interview (10)</th>
                  <th className="px-3 py-3 text-center">Discipline (10)</th>
                  <th className="px-3 py-3 text-center font-bold text-indigo-600">Total Score</th>
                  <th className="px-4 py-3">Recommendation</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 bg-white">
                {filteredApps.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-4 py-8 text-center text-slate-400 italic">
                      No candidates match your current filters.
                    </td>
                  </tr>
                ) : (
                  filteredApps.map(app => {
                    const draft = gridDrafts[app.id] || {};
                    const isEdited = Object.keys(draft).length > 0;
                    
                    const academicsVal = draft.academicMarks !== undefined ? draft.academicMarks : (app.academicMarks ?? 10);
                    const attendanceVal = draft.attendanceMarks !== undefined ? draft.attendanceMarks : (app.attendanceMarks ?? 9.5);
                    const yearsVal = draft.yearsScore !== undefined ? draft.yearsScore : (app.yearsScore ?? 10);
                    const achievementVal = draft.achievementScore !== undefined ? draft.achievementScore : (app.achievementScore ?? 10);
                    const interviewVal = draft.interviewMarks !== undefined ? draft.interviewMarks : (app.interviewMarks ?? 10);
                    const disciplineVal = draft.disciplineMarks !== undefined ? draft.disciplineMarks : (app.disciplineMarks ?? 10);
                    const recVal = draft.recommendation !== undefined ? draft.recommendation : (app.recommendation || 'Recommended');
                    const statusVal = draft.status !== undefined ? draft.status : app.status;
                    
                    const calculatedTotal = getCalculatedTotalForGridRow(app);
                    const appliedPostTitle = posts.find(p => p.id === app.firstChoicePostId)?.title || app.firstChoicePostId;

                    return (
                      <tr key={app.id} className={`hover:bg-slate-50/80 transition-colors ${isEdited ? 'bg-amber-50/25' : ''}`}>
                        {/* 1. Candidate Info */}
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{app.name}</span>
                            {isEdited && (
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Draft changes unsaved" />
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {app.admissionNumber} • Cl {app.class}-{app.section}
                          </div>
                        </td>
                        
                        {/* 2. Applied Post */}
                        <td className="px-4 py-3 text-slate-600 font-semibold truncate max-w-[130px]" title={appliedPostTitle}>
                          {appliedPostTitle}
                        </td>
                        
                        {/* 3. Academics */}
                        <td className="px-2 py-2 text-center">
                          <input
                            type="number"
                            min={0}
                            max={10}
                            step={0.1}
                            value={academicsVal}
                            onChange={e => {
                              const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                              handleGridFieldChange(app.id, 'academicMarks', isNaN(val) ? 0 : Math.min(10, Math.max(0, val)));
                            }}
                            className="w-14 px-1 py-1 text-xs text-center border border-slate-300 rounded font-bold bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </td>
                        
                        {/* 4. Attendance */}
                        <td className="px-2 py-2 text-center">
                          <input
                            type="number"
                            min={0}
                            max={10}
                            step={0.1}
                            value={attendanceVal}
                            onChange={e => {
                              const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                              handleGridFieldChange(app.id, 'attendanceMarks', isNaN(val) ? 0 : Math.min(10, Math.max(0, val)));
                            }}
                            className="w-14 px-1 py-1 text-xs text-center border border-slate-300 rounded font-bold bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </td>
                        
                        {/* 5. Years Studied */}
                        <td className="px-2 py-2 text-center">
                          <input
                            type="number"
                            min={0}
                            max={10}
                            step={1}
                            value={yearsVal}
                            onChange={e => {
                              const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                              handleGridFieldChange(app.id, 'yearsScore', isNaN(val) ? 0 : Math.min(10, Math.max(0, val)));
                            }}
                            className="w-12 px-1 py-1 text-xs text-center border border-slate-300 rounded font-bold bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </td>
                        
                        {/* 6. Achievements */}
                        <td className="px-2 py-2 text-center">
                          <input
                            type="number"
                            min={0}
                            max={10}
                            step={1}
                            value={achievementVal}
                            onChange={e => {
                              const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                              handleGridFieldChange(app.id, 'achievementScore', isNaN(val) ? 0 : Math.min(10, Math.max(0, val)));
                            }}
                            className="w-12 px-1 py-1 text-xs text-center border border-slate-300 rounded font-bold bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </td>
                        
                        {/* 7. Interview */}
                        <td className="px-2 py-2 text-center">
                          <input
                            type="number"
                            min={0}
                            max={10}
                            step={0.1}
                            value={interviewVal}
                            onChange={e => {
                              const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                              handleGridFieldChange(app.id, 'interviewMarks', isNaN(val) ? 0 : Math.min(10, Math.max(0, val)));
                            }}
                            className="w-14 px-1 py-1 text-xs text-center border border-slate-300 rounded font-bold bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </td>
                        
                        {/* 8. Discipline */}
                        <td className="px-2 py-2 text-center">
                          <input
                            type="number"
                            min={0}
                            max={10}
                            step={0.1}
                            value={disciplineVal}
                            onChange={e => {
                              const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                              handleGridFieldChange(app.id, 'disciplineMarks', isNaN(val) ? 0 : Math.min(10, Math.max(0, val)));
                            }}
                            className="w-14 px-1 py-1 text-xs text-center border border-slate-300 rounded font-bold bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </td>
                        
                        {/* 9. Calculated Total Score */}
                        <td className="px-2 py-2 text-center font-bold text-sm text-indigo-600">
                          {calculatedTotal} <span className="text-[10px] text-slate-400 font-normal">/ 60</span>
                        </td>
                        
                        {/* 10. Recommendation */}
                        <td className="px-3 py-2">
                          <select
                            value={recVal}
                            onChange={e => handleGridFieldChange(app.id, 'recommendation', e.target.value)}
                            className="border border-slate-300 rounded-lg p-1 text-[11px] bg-white text-slate-750 font-semibold focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="Highly Recommended">Highly Recommended</option>
                            <option value="Recommended">Recommended</option>
                            <option value="Waitlisted">Waitlisted</option>
                            <option value="Not Recommended">Not Recommended</option>
                          </select>
                        </td>
                        
                        {/* 11. Enrolment Status */}
                        <td className="px-3 py-2">
                          <select
                            value={statusVal}
                            onChange={e => handleGridFieldChange(app.id, 'status', e.target.value)}
                            className="border border-slate-300 rounded-lg p-1 text-[11px] bg-white text-slate-750 font-semibold focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Interview Scheduled">Interview Scheduled</option>
                            <option value="Under Evaluation">Under Evaluation</option>
                            <option value="Selected">Selected</option>
                            <option value="Waitlisted">Waitlisted</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                        </td>
                        
                        {/* 12. Actions */}
                        <td className="px-4 py-2 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isEdited ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleGridRowSave(app.id)}
                                  className="p-1.5 text-emerald-600 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-250 rounded-lg transition"
                                  title="Save draft updates for this row"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleGridRowReset(app.id)}
                                  className="p-1.5 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition"
                                  title="Reset draft updates"
                                >
                                  <Undo className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setEvaluationMode('individual');
                                  handleSelectApp(app);
                                }}
                                className="p-1.5 text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg text-[10px] font-bold px-2.5 transition"
                                title="View detailed dashboard"
                              >
                                View
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
