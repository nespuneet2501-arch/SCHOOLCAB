import React, { useState, useEffect } from 'react';
import { SystemConfig, Cabinet, Post, EvaluationCriterion, AchievementMatrixItem, EmailLog } from '../types';
import { Settings, Shield, Edit, Plus, Trash2, Mail, Database, Check, CheckSquare, Clock, Users, Upload, RefreshCw, FileText, Sparkles, AlertTriangle } from 'lucide-react';
import { saveRegisteredStudent, fetchRegisteredStudents } from '../services/dbService';

interface AdminPanelProps {
  config: SystemConfig;
  emailLogs: EmailLog[];
  onUpdateConfig: (newConfig: SystemConfig) => void;
}

export default function AdminPanel({
  config,
  emailLogs,
  onUpdateConfig
}: AdminPanelProps) {
  // Navigation within Admin Panel
  const [activeTab, setActiveTab] = useState<'branding' | 'cabinets' | 'criteria' | 'emails' | 'supabase' | 'students'>('branding');

  // STUDENT DIRECTORY STATE
  const [students, setStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentAdmn, setNewStudentAdmn] = useState('');
  const [newStudentClass, setNewStudentClass] = useState(11);
  const [newStudentSec, setNewStudentSec] = useState('A');
  const [newStudentRoll, setNewStudentRoll] = useState('');
  const [newStudentGender, setNewStudentGender] = useState<'Boy' | 'Girl'>('Boy');
  const [bulkText, setBulkText] = useState('');
  const [bulkMode, setBulkMode] = useState<'append' | 'replace'>('append');
  const [uploadStatus, setUploadStatus] = useState('');

  // SUPABASE CONFIG STATE
  const [dbConfig, setDbConfig] = useState({
    connectionString: '',
    connected: false,
    useSupabase: false,
    lastSyncedAt: ''
  });
  const [testStatus, setTestStatus] = useState<{ type: 'success' | 'error' | ''; message: string }>({ type: '', message: '' });
  const [provisionStatus, setProvisionStatus] = useState<{ type: 'success' | 'error' | ''; message: string }>({ type: '', message: '' });

  // Load students and supabase config on mount
  const loadAdminExtraData = async () => {
    try {
      const sRes = await fetch('/api/registered-students');
      if (sRes.ok) {
        const sData = await sRes.json();
        setStudents(sData);
      } else {
        const sData = await fetchRegisteredStudents();
        setStudents(sData || []);
      }
    } catch (e) {
      console.warn("registered-students API offline, loading from Firestore fallback", e);
      try {
        const sData = await fetchRegisteredStudents();
        setStudents(sData || []);
      } catch (err) {
        console.error(err);
      }
    }

    try {
      const cRes = await fetch('/api/supabase/config');
      if (cRes.ok) {
        const cData = await cRes.json();
        setDbConfig({
          connectionString: cData.connectionString || '',
          connected: cData.connected || false,
          useSupabase: cData.useSupabase || false,
          lastSyncedAt: cData.lastSyncedAt || ''
        });
      }
    } catch (e) {
      console.warn("Supabase config API offline", e);
    }
  };

  useEffect(() => {
    loadAdminExtraData();
  }, []);

  // BRANDING STATE
  const [schoolName, setSchoolName] = useState(config.branding.name);
  const [tagline, setTagline] = useState(config.branding.tagline);
  const [primaryColor, setPrimaryColor] = useState(config.branding.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(config.branding.secondaryColor);
  const [sessionName, setSessionName] = useState(config.branding.academicSession);
  const [deadline, setDeadline] = useState(config.applicationDeadline);

  // CABINETS STATE
  const [cabinets, setCabinets] = useState<Cabinet[]>(config.cabinets);
  const [newCabinetName, setNewCabinetName] = useState('');
  const [newCabStart, setNewCabStart] = useState(1);
  const [newCabEnd, setNewCabEnd] = useState(5);

  // POSTS STATE
  const [posts, setPosts] = useState<Post[]>(config.posts);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostCab, setNewPostCab] = useState(config.cabinets[0]?.id || 'senior');
  const [newPostVacancies, setNewPostVacancies] = useState(1);
  const [newPostGender, setNewPostGender] = useState<'boy' | 'girl' | 'any'>('any');
  const [newPostClasses, setNewPostClasses] = useState('6,7,8,9,10,11');

  // CRITERIA STATE
  const [criteria, setCriteria] = useState<EvaluationCriterion[]>(config.criteria);

  // MATRIX STATE
  const [matrix, setMatrix] = useState<AchievementMatrixItem[]>(config.achievementMatrix);

  // Save Branding changes
  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: SystemConfig = {
      ...config,
      applicationDeadline: deadline,
      branding: {
        ...config.branding,
        name: schoolName.trim(),
        tagline: tagline.trim(),
        primaryColor,
        secondaryColor,
        academicSession: sessionName.trim()
      }
    };
    onUpdateConfig(updated);
    alert('School branding & session configs saved successfully!');
  };

  // Add Cabinet
  const handleAddCabinet = () => {
    if (!newCabinetName.trim()) return alert('Cabinet Name is required.');
    const id = newCabinetName.trim().toLowerCase().replace(/\s+/g, '-');
    if (cabinets.some(c => c.id === id)) return alert('A cabinet with this name already exists.');

    const newCab: Cabinet = {
      id,
      name: newCabinetName.trim(),
      classRangeStart: newCabStart,
      classRangeEnd: newCabEnd,
      enabled: true
    };

    const updatedCabs = [...cabinets, newCab];
    setCabinets(updatedCabs);
    onUpdateConfig({ ...config, cabinets: updatedCabs });
    setNewCabinetName('');
  };

  // Delete Cabinet
  const handleDeleteCabinet = (id: string) => {
    const updatedCabs = cabinets.filter(c => c.id !== id);
    const updatedPosts = posts.filter(p => p.cabinetId !== id); // delete orphan posts
    setCabinets(updatedCabs);
    setPosts(updatedPosts);
    onUpdateConfig({ ...config, cabinets: updatedCabs, posts: updatedPosts });
  };

  // Add Post
  const handleAddPost = () => {
    if (!newPostTitle.trim()) return alert('Post Title is required.');
    const id = newPostTitle.trim().toLowerCase().replace(/\s+/g, '-');
    if (posts.some(p => p.id === id)) return alert('A post with this title already exists.');

    const classesArray = newPostClasses.split(',').map(c => parseInt(c.trim())).filter(c => !isNaN(c));

    const newPost: Post = {
      id,
      cabinetId: newPostCab,
      title: newPostTitle.trim(),
      vacancies: newPostVacancies,
      genderRule: newPostGender,
      eligibleClasses: classesArray,
      enabled: true
    };

    const updatedPosts = [...posts, newPost];
    setPosts(updatedPosts);
    onUpdateConfig({ ...config, posts: updatedPosts });
    setNewPostTitle('');
  };

  // Delete Post
  const handleDeletePost = (id: string) => {
    const updatedPosts = posts.filter(p => p.id !== id);
    setPosts(updatedPosts);
    onUpdateConfig({ ...config, posts: updatedPosts });
  };

  // Update Criteria Marks or Toggles
  const handleUpdateCriterion = (id: string, maxMarks: number, enabled: boolean) => {
    const updated = criteria.map(c => {
      if (c.id === id) return { ...c, maxMarks, enabled };
      return c;
    });
    setCriteria(updated);
    onUpdateConfig({ ...config, criteria: updated });
  };

  // Update Achievement Matrix marks
  const handleUpdateMatrixItem = (level: string, rank: string, marks: number) => {
    const updated = matrix.map(m => {
      if (m.level === level && m.rank === rank) return { ...m, marks };
      return m;
    });
    setMatrix(updated);
    onUpdateConfig({ ...config, achievementMatrix: updated });
  };

  return (
    <div className="space-y-6" id="admin-panel">
      
      {/* Navigation tabs within Admin Panel */}
      <div className="flex border-b border-slate-200 text-xs md:text-sm font-semibold text-slate-500 overflow-x-auto">
        <button
          onClick={() => setActiveTab('branding')}
          className={`flex items-center gap-1.5 px-5 py-3 border-b-2 font-display transition-all whitespace-nowrap ${
            activeTab === 'branding' ? 'border-slate-900 text-slate-900' : 'border-transparent hover:text-slate-700'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Branding & Dates</span>
        </button>

        <button
          onClick={() => setActiveTab('cabinets')}
          className={`flex items-center gap-1.5 px-5 py-3 border-b-2 font-display transition-all whitespace-nowrap ${
            activeTab === 'cabinets' ? 'border-slate-900 text-slate-900' : 'border-transparent hover:text-slate-700'
          }`}
        >
          <Edit className="w-4 h-4" />
          <span>Cabinets & Positions</span>
        </button>

        <button
          onClick={() => setActiveTab('criteria')}
          className={`flex items-center gap-1.5 px-5 py-3 border-b-2 font-display transition-all whitespace-nowrap ${
            activeTab === 'criteria' ? 'border-slate-900 text-slate-900' : 'border-transparent hover:text-slate-700'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Evaluation Metrics</span>
        </button>

        <button
          onClick={() => setActiveTab('emails')}
          className={`flex items-center gap-1.5 px-5 py-3 border-b-2 font-display transition-all whitespace-nowrap ${
            activeTab === 'emails' ? 'border-slate-900 text-slate-900' : 'border-transparent hover:text-slate-700'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>System Email Logs</span>
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`flex items-center gap-1.5 px-5 py-3 border-b-2 font-display transition-all whitespace-nowrap ${
            activeTab === 'students' ? 'border-slate-900 text-slate-900' : 'border-transparent hover:text-slate-700'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Student Directory</span>
        </button>

        <button
          onClick={() => setActiveTab('supabase')}
          className={`flex items-center gap-1.5 px-5 py-3 border-b-2 font-display transition-all whitespace-nowrap ${
            activeTab === 'supabase' ? 'border-slate-900 text-slate-900' : 'border-transparent hover:text-slate-700'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Supabase SQL Deploy</span>
        </button>
      </div>

      {/* BRANDING TAB */}
      {activeTab === 'branding' && (
        <form onSubmit={handleSaveBranding} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-6">
          <div>
            <h3 className="font-display font-bold text-slate-900 text-sm">School Branding & Academic Session</h3>
            <p className="text-[11px] text-slate-500 font-sans mt-0.5">Customize names, visual themes, session titles, and deadline limits</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 font-sans">School Corporate Name</label>
              <input
                type="text"
                value={schoolName}
                onChange={e => setSchoolName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-slate-350 rounded-lg text-slate-800 focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 font-sans">Leadership Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={e => setTagline(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-slate-350 rounded-lg text-slate-800 focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 font-sans">Academic Session Label</label>
              <input
                type="text"
                value={sessionName}
                onChange={e => setSessionName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-slate-350 rounded-lg text-slate-800 focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 font-sans">Nomination Deadline</label>
              <input
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-slate-350 rounded-lg text-slate-800 focus:ring-1 focus:ring-slate-900 bg-white"
              />
            </div>
          </div>

          {/* Color Palettes */}
          <div className="pt-2">
            <h4 className="text-xs font-bold text-slate-700 font-sans border-b border-slate-100 pb-1 mb-3">Cabinet Portal Colors</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 bg-slate-50 border p-3 rounded-xl">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={e => setPrimaryColor(e.target.value)}
                  className="w-8 h-8 rounded border-none cursor-pointer"
                />
                <div className="text-xs font-sans">
                  <div className="font-bold text-slate-700">Primary Color</div>
                  <div className="text-slate-400 mt-0.5">{primaryColor}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 border p-3 rounded-xl">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={e => setSecondaryColor(e.target.value)}
                  className="w-8 h-8 rounded border-none cursor-pointer"
                />
                <div className="text-xs font-sans">
                  <div className="font-bold text-slate-700">Secondary Accent Color</div>
                  <div className="text-slate-400 mt-0.5">{secondaryColor}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-sans text-xs font-bold transition flex items-center gap-1.5"
            >
              <CheckSquare className="w-4 h-4" />
              <span>Save Settings</span>
            </button>
          </div>
        </form>
      )}

      {/* CABINETS & POSTS TAB */}
      {activeTab === 'cabinets' && (
        <div className="space-y-6">
          {/* Cabinets List */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <div>
              <h3 className="font-display font-bold text-slate-900 text-sm">Cabinet Divisions</h3>
              <p className="text-[11px] text-slate-500 font-sans mt-0.5">Configure school wing segments and range constraints</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {cabinets.map(cab => (
                <div key={cab.id} className="border border-slate-200 rounded-xl p-4 flex justify-between items-center bg-slate-50">
                  <div>
                    <h4 className="font-display font-bold text-slate-800 text-sm">{cab.name}</h4>
                    <p className="text-xs text-slate-500 font-sans mt-0.5">Classes: {cab.classRangeStart} to {cab.classRangeEnd}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteCabinet(cab.id)}
                    className="text-rose-500 hover:text-rose-700 p-1.5 border border-rose-100 rounded-lg hover:bg-rose-50 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Cabinet Box */}
            <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 space-y-3.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Add New Cabinet Wing</span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="e.g. Middle Cabinet"
                  value={newCabinetName}
                  onChange={e => setNewCabinetName(e.target.value)}
                  className="w-full px-3.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                />
                <input
                  type="number"
                  placeholder="Class Start"
                  value={newCabStart}
                  onChange={e => setNewCabStart(parseInt(e.target.value))}
                  className="w-full px-3.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                />
                <input
                  type="number"
                  placeholder="Class End"
                  value={newCabEnd}
                  onChange={e => setNewCabEnd(parseInt(e.target.value))}
                  className="w-full px-3.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                />
                <button
                  type="button"
                  onClick={handleAddCabinet}
                  className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Cabinet
                </button>
              </div>
            </div>
          </div>

          {/* Posts List */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <div>
              <h3 className="font-display font-bold text-slate-900 text-sm">Cabinet Nominated Positions ({posts.length})</h3>
              <p className="text-[11px] text-slate-500 font-sans mt-0.5">Manage positions, gender restrictions, and class filters</p>
            </div>

            {/* List Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs max-h-[350px] overflow-y-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold font-sans">
                    <th className="px-4 py-2.5 text-left">Post Name</th>
                    <th className="px-4 py-2.5 text-left">Cabinet Wing</th>
                    <th className="px-4 py-2.5 text-left">Vacancies</th>
                    <th className="px-4 py-2.5 text-left">Gender Rule</th>
                    <th className="px-4 py-2.5 text-left">Eligible Classes</th>
                    <th className="px-4 py-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map(post => (
                    <tr key={post.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-bold text-slate-800">{post.title}</td>
                      <td className="px-4 py-2.5 text-slate-500 font-semibold">{config.cabinets.find(c=>c.id === post.cabinetId)?.name || post.cabinetId}</td>
                      <td className="px-4 py-2.5 text-slate-600 font-bold">{post.vacancies}</td>
                      <td className="px-4 py-2.5">
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full uppercase text-[9px] font-bold">
                          {post.genderRule}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 font-semibold">
                        Classes: {post.eligibleClasses.join(', ')}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeletePost(post.id)}
                          className="text-rose-500 hover:text-rose-700 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add Post Row */}
            <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 space-y-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Add New Leadership Position</span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="e.g. Literary Captain"
                  value={newPostTitle}
                  onChange={e => setNewPostTitle(e.target.value)}
                  className="w-full px-3.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                />

                <select
                  value={newPostCab}
                  onChange={e => setNewPostCab(e.target.value)}
                  className="w-full px-3.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-750"
                >
                  {cabinets.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                <input
                  type="number"
                  placeholder="Vacancies"
                  value={newPostVacancies}
                  onChange={e => setNewPostVacancies(parseInt(e.target.value) || 1)}
                  className="w-full px-3.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                />

                <select
                  value={newPostGender}
                  onChange={e => setNewPostGender(e.target.value as any)}
                  className="w-full px-3.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-750"
                >
                  <option value="any">Any Gender</option>
                  <option value="boy">Boys Only</option>
                  <option value="girl">Girls Only</option>
                </select>
              </div>

              <div className="flex gap-2.5">
                <input
                  type="text"
                  placeholder="Eligible Class List (comma separated, e.g. 9,10,11)"
                  value={newPostClasses}
                  onChange={e => setNewPostClasses(e.target.value)}
                  className="flex-1 px-3.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-800"
                />
                <button
                  type="button"
                  onClick={handleAddPost}
                  className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Save Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EVALUATION METRICS TAB */}
      {activeTab === 'criteria' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Dynamic Criteria list */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4 md:col-span-7">
            <div>
              <h3 className="font-display font-bold text-slate-900 text-sm">Dynamic Evaluation Criteria Weights</h3>
              <p className="text-[11px] text-slate-500 font-sans mt-0.5">Toggle criteria active statuses and change maximum score allocations</p>
            </div>

            <div className="divide-y divide-slate-100">
              {criteria.map(item => (
                <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="max-w-xs">
                    <h4 className="font-display font-bold text-slate-800 text-sm flex items-center gap-1.5">
                      <span>{item.name}</span>
                      {!item.enabled && <span className="bg-rose-50 text-rose-700 text-[9px] px-1.5 rounded border">Disabled</span>}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-sans mt-0.5 leading-relaxed">{item.description}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-slate-500">Max Marks:</span>
                      <input
                        type="number"
                        value={item.maxMarks}
                        onChange={e => handleUpdateCriterion(item.id, parseFloat(e.target.value) || 0, item.enabled)}
                        className="w-16 p-1 border rounded text-center font-bold text-slate-800 text-xs"
                      />
                    </div>

                    <label className="flex items-center gap-1 text-xs cursor-pointer select-none font-semibold">
                      <input
                        type="checkbox"
                        checked={item.enabled}
                        onChange={e => handleUpdateCriterion(item.id, item.maxMarks, e.target.checked)}
                        className="rounded border-slate-300 text-slate-950 focus:ring-slate-950 w-4 h-4"
                      />
                      <span>Active</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Achievement Matrix Score Cards */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4 md:col-span-5">
            <div>
              <h3 className="font-display font-bold text-slate-900 text-sm">Honor Points Matrix Editor</h3>
              <p className="text-[11px] text-slate-500 font-sans mt-0.5">Customize score weightages for certificates</p>
            </div>

            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
              {['National', 'State', 'District', 'School'].map(lvl => (
                <div key={lvl} className="border border-slate-100 rounded-xl p-3 bg-slate-50 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-sans">{lvl} Level Certificates</span>
                  <div className="grid grid-cols-3 gap-2">
                    {['Gold', 'Silver', 'Bronze'].map(rnk => {
                      const match = matrix.find(m => m.level === lvl && m.rank === rnk);
                      const currentVal = match ? match.marks : 0;
                      return (
                        <div key={rnk} className="text-center bg-white border border-slate-200 rounded-lg p-2 flex flex-col items-center">
                          <span className="text-[10px] font-semibold text-slate-500">{rnk}</span>
                          <input
                            type="number"
                            value={currentVal}
                            onChange={e => handleUpdateMatrixItem(lvl, rnk, parseFloat(e.target.value) || 0)}
                            className="w-12 text-center text-xs font-bold border-b border-slate-200 focus:outline-hidden text-slate-850 mt-1"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* EMAIL SIMULATION LOGS */}
      {activeTab === 'emails' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
          <div>
            <h3 className="font-display font-bold text-slate-900 text-sm">System Automated Notifications Log</h3>
            <p className="text-[11px] text-slate-500 font-sans mt-0.5">Observe simulated transactional emails dispatched by cabinet state updates</p>
          </div>

          {emailLogs.length === 0 ? (
            <div className="p-12 border border-slate-150 border-dashed rounded-xl text-center text-xs text-slate-400 italic">No emails dispatched yet in this preview session. Submit a student nomination or update interview schedules to trigger transactional templates.</div>
          ) : (
            <div className="space-y-3 max-h-[450px] overflow-y-auto">
              {emailLogs.map(log => (
                <div key={log.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50 hover:bg-slate-50/50 transition">
                  <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-200 pb-2 mb-2.5">
                    <div className="text-xs font-bold text-slate-700">
                      To: <span className="text-slate-500 font-mono font-medium">{log.to}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-semibold font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(log.sentAt).toLocaleTimeString()}
                    </div>
                  </div>

                  <div className="text-xs font-bold text-slate-900 mb-1">Subject: {log.subject}</div>
                  <div className="text-xs text-slate-500 font-sans whitespace-pre-line leading-relaxed">{log.body}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. STUDENT DIRECTORY & BULK UPLOAD */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          {/* Add Student Single form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <div>
              <h3 className="font-display font-bold text-slate-900 text-sm">Add Individual Student to Directory</h3>
              <p className="text-[11px] text-slate-500 font-sans mt-0.5">Pre-register eligible cabinet candidates so they can quickly retrieve their details during self-nomination</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-3.5">
              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-slate-500 font-sans uppercase">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Priyanshu Sen"
                  value={newStudentName}
                  onChange={e => setNewStudentName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-850"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 font-sans uppercase">Admission No.</label>
                <input
                  type="text"
                  placeholder="e.g. GDG-2019-1234"
                  value={newStudentAdmn}
                  onChange={e => setNewStudentAdmn(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-850"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 font-sans uppercase">Class (1-11)</label>
                <input
                  type="number"
                  min="1"
                  max="11"
                  value={newStudentClass}
                  onChange={e => setNewStudentClass(parseInt(e.target.value) || 11)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-850"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 font-sans uppercase">Section</label>
                <input
                  type="text"
                  placeholder="A"
                  value={newStudentSec}
                  onChange={e => setNewStudentSec(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-850"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 font-sans uppercase">Roll No.</label>
                <input
                  type="text"
                  placeholder="optional"
                  value={newStudentRoll}
                  onChange={e => setNewStudentRoll(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-850"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <div className="flex gap-4 text-xs font-sans">
                <label className="flex items-center gap-1 font-bold text-slate-600 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    checked={newStudentGender === 'Boy'}
                    onChange={() => setNewStudentGender('Boy')}
                    className="text-slate-950 focus:ring-0"
                  />
                  <span>Boy nominee</span>
                </label>
                <label className="flex items-center gap-1 font-bold text-slate-600 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    checked={newStudentGender === 'Girl'}
                    onChange={() => setNewStudentGender('Girl')}
                    className="text-slate-950 focus:ring-0"
                  />
                  <span>Girl nominee</span>
                </label>
              </div>

              <button
                onClick={async () => {
                  if (!newStudentName || !newStudentAdmn) {
                    return alert('Name and Admission Number are required.');
                  }
                  const studentPayload = {
                    id: `reg-${Date.now()}`,
                    name: newStudentName,
                    admissionNumber: newStudentAdmn,
                    class: newStudentClass,
                    section: newStudentSec,
                    rollNumber: newStudentRoll,
                    gender: newStudentGender
                  };
                  try {
                    const res = await fetch('/api/registered-students', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(studentPayload)
                    });
                    if (res.ok) {
                      setNewStudentName('');
                      setNewStudentAdmn('');
                      setNewStudentRoll('');
                      loadAdminExtraData();
                      alert('Student pre-registered successfully!');
                    } else {
                      throw new Error();
                    }
                  } catch (e: any) {
                    console.warn("API pre-register offline, saving directly to Firestore", e);
                    try {
                      await saveRegisteredStudent(studentPayload);
                      setNewStudentName('');
                      setNewStudentAdmn('');
                      setNewStudentRoll('');
                      loadAdminExtraData();
                      alert('Student pre-registered successfully in cloud database!');
                    } catch (fsErr: any) {
                      alert('Failed to register student: ' + fsErr.message);
                    }
                  }
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold font-sans flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Pre-register Student</span>
              </button>
            </div>
          </div>

          {/* Bulk Excel/CSV parser text area */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-display font-bold text-slate-900 text-sm">Bulk Upload Student Directory</h3>
                <p className="text-[11px] text-slate-500 font-sans mt-0.5">Copy-paste rows directly from Microsoft Excel, CSV, or input comma-separated values</p>
              </div>
              <span className="text-[9px] bg-slate-100 text-slate-500 font-bold border px-2 py-0.5 rounded uppercase font-mono">No files needed • Pure Copy-Paste</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-bold text-slate-400 font-mono block">PASTE COPIED EXCEL COLUMNS OR RAW CSV HERE</label>
                <textarea
                  rows={6}
                  placeholder={`GDG-2015-8822\tAarav Goel\t11\tA\t14\tBoy\nGDG-2016-1120\tDiya Sharma\t11\tB\t08\tGirl`}
                  value={bulkText}
                  onChange={e => setBulkText(e.target.value)}
                  className="w-full p-4 font-mono text-[11px] border border-slate-300 rounded-xl bg-slate-50 text-slate-800 focus:bg-white transition"
                />
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-150 text-xs space-y-2.5">
                <h4 className="font-bold text-slate-700 flex items-center gap-1">
                  <FileText className="w-4 h-4 text-slate-500" />
                  Format Requirements
                </h4>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  We accept simple Comma-Separated Values (CSV). Make sure your columns align to:
                </p>
                <div className="bg-slate-900 text-amber-400 p-2.5 rounded font-mono text-[9px]">
                  admission_number, name, class, section, roll_number, gender
                </div>
                <p className="text-[10px] text-slate-400">
                  ★ Hint: You can simply copy-paste columns directly from an Excel sheet. We will automatically map tabs/newlines to values!
                </p>
                <div className="flex gap-3 text-[10px] font-sans pt-1">
                  <label className="flex items-center gap-1 font-bold text-slate-600 cursor-pointer">
                    <input
                      type="radio"
                      name="bulkMode"
                      checked={bulkMode === 'append'}
                      onChange={() => setBulkMode('append')}
                    />
                    <span>Append to List</span>
                  </label>
                  <label className="flex items-center gap-1 font-bold text-slate-600 cursor-pointer">
                    <input
                      type="radio"
                      name="bulkMode"
                      checked={bulkMode === 'replace'}
                      onChange={() => setBulkMode('replace')}
                    />
                    <span className="text-red-600">Replace All</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-xs text-amber-600 font-medium font-sans">{uploadStatus}</span>
              <button
                onClick={async () => {
                  if (!bulkText.trim()) return alert('Paste some spreadsheet data first.');
                  setUploadStatus('Parsing rows...');
                  try {
                    const lines = bulkText.split('\n').map(l => l.trim()).filter(l => l);
                    let headers = ['admission_number', 'name', 'class', 'section', 'roll_number', 'gender'];
                    let startIndex = 0;

                    // check if first line is headers
                    if (lines[0].toLowerCase().includes('admission') || lines[0].toLowerCase().includes('name')) {
                      headers = lines[0].toLowerCase().split(/[,\t]/).map(h => h.trim());
                      startIndex = 1;
                    }

                    const parsedStudents = [];
                    for (let i = startIndex; i < lines.length; i++) {
                      const columns = lines[i].split(/[,\t]/).map(c => c.trim());
                      if (columns.length < 3) continue;

                      const studentObj: any = {};
                      // If headers are standard or not, let's map index-wise if headers mismatch
                      if (headers.length < 3 || !headers[0].includes('admission')) {
                        studentObj.admissionNumber = columns[0] || '';
                        studentObj.name = columns[1] || '';
                        studentObj.class = parseInt(columns[2]) || 11;
                        studentObj.section = columns[3] || 'A';
                        studentObj.rollNumber = columns[4] || '';
                        studentObj.gender = (columns[5] || 'Boy').toLowerCase().startsWith('g') ? 'Girl' : 'Boy';
                      } else {
                        headers.forEach((h, idx) => {
                          const val = columns[idx] || '';
                          if (h.includes('admission')) {
                            studentObj.admissionNumber = val;
                          } else if (h.includes('name')) {
                            studentObj.name = val;
                          } else if (h.includes('class')) {
                            studentObj.class = parseInt(val) || 11;
                          } else if (h.includes('section')) {
                            studentObj.section = val;
                          } else if (h.includes('roll')) {
                            studentObj.rollNumber = val;
                          } else if (h.includes('gender')) {
                            studentObj.gender = val.toLowerCase().startsWith('g') ? 'Girl' : 'Boy';
                          }
                        });
                      }

                      // Fallbacks
                      if (!studentObj.admissionNumber) studentObj.admissionNumber = `GDG-TEMP-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
                      if (!studentObj.name) studentObj.name = 'Anonymous Student';
                      if (!studentObj.class) studentObj.class = 11;
                      if (!studentObj.section) studentObj.section = 'A';

                      parsedStudents.push(studentObj);
                    }

                    try {
                      const bulkRes = await fetch('/api/registered-students/bulk', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ students: parsedStudents, mode: bulkMode })
                      });

                      if (bulkRes.ok) {
                        const finalData = await bulkRes.json();
                        setStudents(finalData.registeredStudents);
                        setBulkText('');
                        setUploadStatus(`Successfully processed ${parsedStudents.length} student records!`);
                        setTimeout(() => setUploadStatus(''), 5000);
                      } else {
                        throw new Error('Failed to post bulk array to API');
                      }
                    } catch (e: any) {
                      console.warn("API bulk registration offline, saving directly to Firestore", e);
                      try {
                        for (const s of parsedStudents) {
                          await saveRegisteredStudent(s);
                        }
                        const finalStudents = await fetchRegisteredStudents();
                        setStudents(finalStudents);
                        setBulkText('');
                        setUploadStatus(`Successfully registered ${parsedStudents.length} student records in cloud database!`);
                        setTimeout(() => setUploadStatus(''), 5000);
                      } catch (fsErr: any) {
                        setUploadStatus(`Error: ${fsErr.message}`);
                      }
                    }
                  } catch (outerErr: any) {
                    setUploadStatus(`Parsing error: ${outerErr.message}`);
                  }
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold font-sans flex items-center gap-1.5 shadow-xs transition"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Process & Save Bulk Students</span>
              </button>
            </div>
          </div>

          {/* Directory Student List Display */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <div>
                <h3 className="font-display font-bold text-slate-900 text-sm">Pre-registered Student Directory ({students.length} Records)</h3>
                <p className="text-[11px] text-slate-500 font-sans mt-0.5">Below students are recognized by the system and can select their details dynamically during enrolment</p>
              </div>

              <input
                type="text"
                placeholder="Search by name or admission no..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="px-3.5 py-1.5 text-xs border border-slate-350 rounded-lg text-slate-850 w-full sm:w-64"
              />
            </div>

            <div className="overflow-x-auto max-h-[350px] border border-slate-150 rounded-xl">
              <table className="w-full text-left border-collapse text-xs font-sans">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-150 font-semibold sticky top-0">
                    <th className="p-3">Admn No.</th>
                    <th className="p-3">Full Name</th>
                    <th className="p-3">Class & Sec</th>
                    <th className="p-3">Roll No.</th>
                    <th className="p-3">Gender</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {students.filter(s => {
                    const query = searchQuery.toLowerCase();
                    return s.name.toLowerCase().includes(query) || s.admissionNumber.toLowerCase().includes(query);
                  }).map(std => (
                    <tr key={std.id} className="hover:bg-slate-50/40 transition">
                      <td className="p-3 font-mono font-bold text-slate-500">{std.admissionNumber}</td>
                      <td className="p-3 font-bold text-slate-900">{std.name}</td>
                      <td className="p-3 font-semibold text-slate-600">Class {std.class}-{std.section}</td>
                      <td className="p-3 font-mono">{std.rollNumber || '—'}</td>
                      <td className="p-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          std.gender === 'Girl' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'
                        }`}>{std.gender || 'Boy'}</span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={async () => {
                            if (!confirm(`Are you sure you want to delete ${std.name}?`)) return;
                            const dRes = await fetch(`/api/registered-students/${std.id}`, { method: 'DELETE' });
                            if (dRes.ok) {
                              setStudents(students.filter(s => s.id !== std.id));
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-red-600 border border-transparent hover:border-red-100 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUPABASE SQL EXPORTER & SETUP */}
      {activeTab === 'supabase' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-5">
            <div>
              <h3 className="font-display font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Database className="w-4 h-4 text-slate-800" />
                <span>Automated Supabase Cloud Link</span>
              </h3>
              <p className="text-[11px] text-slate-500 font-sans mt-0.5 font-medium leading-relaxed">
                Connect your workspace directly to your Supabase PostgreSQL instance. We automate table setups, policies, and continuous background data synchronization.
              </p>
            </div>

            {/* Connection Status Panel */}
            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3.5 ${
              dbConfig.connected ? 'bg-emerald-50/30 border-emerald-200' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <span className={`w-2.5 h-2.5 rounded-full ${dbConfig.connected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                  <span>Supabase Status: {dbConfig.connected ? 'Connected & Active' : 'Disconnected / Not Configured'}</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
                  {dbConfig.connected 
                    ? `Successfully linked to PostgreSQL. Background synchronization active. Last Sync: ${dbConfig.lastSyncedAt ? new Date(dbConfig.lastSyncedAt).toLocaleString() : 'Just now'}`
                    : 'To integrate, copy the Connection String from your Supabase dashboard (Project Settings → Database → Connection Strings).'
                  }
                </p>
              </div>

              <div className="flex items-center gap-2 font-sans text-xs">
                <span className="font-bold text-slate-600">Background Syncing:</span>
                <button
                  type="button"
                  onClick={async () => {
                    const toggled = !dbConfig.useSupabase;
                    try {
                      const res = await fetch('/api/supabase/config', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...dbConfig, useSupabase: toggled })
                      });
                      if (res.ok) {
                        setDbConfig({ ...dbConfig, useSupabase: toggled });
                        alert(`Automated Supabase Background Sync ${toggled ? 'Enabled' : 'Disabled'}!`);
                      }
                    } catch (e: any) {
                      alert(e.message);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    dbConfig.useSupabase 
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {dbConfig.useSupabase ? 'Active' : 'Disabled'}
                </button>
              </div>
            </div>

            {/* Connection settings form */}
            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 font-mono block">SUPABASE POSTGRESQL CONNECTION STRING (URI)</label>
                <input
                  type="password"
                  placeholder="postgresql://postgres:[your-password]@db.[project-id].supabase.co:5432/postgres"
                  value={dbConfig.connectionString}
                  onChange={e => setDbConfig({ ...dbConfig, connectionString: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-lg text-slate-850 font-mono focus:ring-1 focus:ring-slate-900"
                />
                <p className="text-[9px] text-slate-400">
                  ★ Secret Key Security: This URI string is stored on the secure container backend and is never sent to or visible in the student-facing browser.
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5 pt-2">
                <button
                  onClick={async () => {
                    if (!dbConfig.connectionString) return alert('Enter a valid PostgreSQL URI string first.');
                    setTestStatus({ type: '', message: 'Establishing handshakes...' });
                    try {
                      const res = await fetch('/api/supabase/test-connection', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ connectionString: dbConfig.connectionString })
                      });
                      const data = await res.json();
                      if (res.ok && data.status === 'success') {
                        setTestStatus({ type: 'success', message: `Test succeeded! Connected to Postgres ${data.version.split(' on ')[0]}` });
                      } else {
                        throw new Error(data.error || 'Connection failed.');
                      }
                    } catch (e: any) {
                      setTestStatus({ type: 'error', message: e.message || 'Connection handshake failed.' });
                    }
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold font-sans flex items-center gap-1.5 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Test Supabase Connection</span>
                </button>

                <button
                  onClick={async () => {
                    if (!dbConfig.connectionString) return alert('Enter a valid PostgreSQL URI string first.');
                    if (!confirm('This will provision the PostgreSQL database schema, create registered_students, applications, config, and logs tables, and seed them with your current workspace data. Continue?')) return;
                    
                    setProvisionStatus({ type: '', message: 'Generating tables, triggers, and seeding rows...' });
                    try {
                      const res = await fetch('/api/supabase/setup-db', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ connectionString: dbConfig.connectionString })
                      });
                      const data = await res.json();
                      if (res.ok && data.status === 'success') {
                        setProvisionStatus({ type: 'success', message: 'Success! Tables, triggers, and sample data automatically deployed to Supabase!' });
                        loadAdminExtraData();
                      } else {
                        throw new Error(data.error || 'DDL provisioning failed.');
                      }
                    } catch (e: any) {
                      setProvisionStatus({ type: 'error', message: e.message || 'Provisioning failed.' });
                    }
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold font-sans flex items-center gap-1.5 transition shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                  <span>Auto-Provision & Seed Database</span>
                </button>
              </div>

              {/* Status messages */}
              {testStatus.message && (
                <div className={`p-3 rounded-lg text-xs leading-relaxed font-sans ${
                  testStatus.type === 'success' ? 'bg-emerald-50 text-emerald-800' :
                  testStatus.type === 'error' ? 'bg-rose-50 text-rose-800' : 'bg-slate-50 text-slate-500'
                }`}>
                  {testStatus.message}
                </div>
              )}

              {provisionStatus.message && (
                <div className={`p-3 rounded-lg text-xs leading-relaxed font-sans ${
                  provisionStatus.type === 'success' ? 'bg-emerald-50 text-emerald-800' :
                  provisionStatus.type === 'error' ? 'bg-rose-50 text-rose-800' : 'bg-slate-50 text-slate-500'
                }`}>
                  {provisionStatus.message}
                </div>
              )}
            </div>
          </div>

          {/* DDL SQL Exporter backup */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="font-display font-bold text-slate-900 text-sm">PostgreSQL Manual Script Exporter</h3>
                <p className="text-[11px] text-slate-500 font-sans mt-0.5">Use this DDL if you prefer copy-pasting tables and seeding scripts manually into the Supabase SQL editor</p>
              </div>

              <a
                href="/api/supabase-sql"
                download="supabase_cabinet_schema.sql"
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border text-slate-700 rounded-xl text-xs font-bold font-sans flex items-center gap-1.5 transition"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Download SQL Script</span>
              </a>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              {/* Code Block */}
              <div className="bg-slate-900 text-amber-400 p-4 rounded-lg overflow-x-auto text-[11px] font-mono leading-relaxed max-h-[180px] border border-slate-800">
                <pre>{`-- =========================================================================
-- GD GOENKA SCHOOL CABINET SELECTION & ELECTION MANAGEMENT SYSTEM (Supabase PostgreSQL)
-- =========================================================================

CREATE TABLE IF NOT EXISTS registered_students (
  id VARCHAR(100) PRIMARY KEY,
  admission_number VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  class INT NOT NULL,
  section VARCHAR(50) NOT NULL,
  roll_number VARCHAR(50),
  gender VARCHAR(50)
);`}</pre>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
