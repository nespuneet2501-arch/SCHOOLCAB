import React, { useState } from 'react';
import { Post, Cabinet, StudentApplication, Achievement } from '../types';
import { FileText, Plus, Trash2, CheckSquare, Search, Award, Printer, Clock, FileUp, Camera, AlertCircle } from 'lucide-react';
import { User } from 'firebase/auth';

interface StudentPortalProps {
  posts: Post[];
  cabinets: Cabinet[];
  applications: StudentApplication[];
  onSubmitApplication: (app: Omit<StudentApplication, 'id' | 'status' | 'submittedAt'>) => void;
  onUpdateApplication: (id: string, app: Partial<StudentApplication>) => void;
  deadline: string;
  user?: User | null;
}

export default function StudentPortal({
  posts,
  cabinets,
  applications,
  onSubmitApplication,
  onUpdateApplication,
  deadline,
  user
}: StudentPortalProps) {
  // Navigation tabs within Student Portal
  const [activeTab, setActiveTab] = useState<'apply' | 'track'>('track');
  
  // Pre-registered student lookup states
  const [registeredList, setRegisteredList] = useState<any[]>([]);
  const [lookupQuery, setLookupQuery] = useState('');
  const [showLookupDropdown, setShowLookupDropdown] = useState(false);

  React.useEffect(() => {
    fetch('/api/registered-students')
      .then(r => r.json())
      .then(data => setRegisteredList(data || []))
      .catch(err => console.error(err));
  }, []);

  // Auto-fill and lock details if user is logged in
  React.useEffect(() => {
    if (user) {
      setName(user.displayName || '');
      setEmail(user.email || '');
    }
  }, [user]);
  
  // Status tracker state
  const [searchAdmNum, setSearchAdmNum] = useState('');
  const [trackedApp, setTrackedApp] = useState<StudentApplication | null>(null);
  const [trackError, setTrackError] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [studentClass, setStudentClass] = useState<number>(11);
  const [section, setSection] = useState('A');
  const [rollNumber, setRollNumber] = useState('');
  const [gender, setGender] = useState<'Boy' | 'Girl'>('Boy');
  const [dob, setDob] = useState('2010-01-01');
  const [admissionDate, setAdmissionDate] = useState('2015-04-10');
  const [house, setHouse] = useState<'Radhakrishnan' | 'Tagore' | 'Vivekanand' | 'Teresa'>('Radhakrishnan');
  const [mobile, setMobile] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentMobile, setParentMobile] = useState('');
  const [email, setEmail] = useState('');
  const [photo, setPhoto] = useState<string>(''); // base64
  const [leadershipExperience, setLeadershipExperience] = useState('');
  const [sop, setSop] = useState('');
  const [firstChoicePostId, setFirstChoicePostId] = useState('');
  const [secondChoicePostId, setSecondChoicePostId] = useState('');
  const [declaration, setDeclaration] = useState(false);
  
  // Dynamic achievements list
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [newAchLevel, setNewAchLevel] = useState<'School' | 'District' | 'State' | 'National'>('School');
  const [newAchRank, setNewAchRank] = useState<'Gold' | 'Silver' | 'Bronze'>('Gold');
  const [newAchTitle, setNewAchTitle] = useState('');
  const [newAchYear, setNewAchYear] = useState('2025');
  const [newAchCertData, setNewAchCertData] = useState('');
  const [newAchCertName, setNewAchCertName] = useState('');

  // Editing mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editingAppId, setEditingAppId] = useState('');

  // Form error states
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Filter posts based on selected class and gender
  const eligiblePosts = posts.filter(post => {
    if (!post.enabled) return false;
    
    // Check gender rule
    if (post.genderRule === 'boy' && gender !== 'Boy') return false;
    if (post.genderRule === 'girl' && gender !== 'Girl') return false;
    
    // Check eligible classes
    if (post.eligibleClasses.length > 0 && !post.eligibleClasses.includes(studentClass)) return false;
    
    return true;
  });

  // Track Application Search
  const handleTrackSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setTrackError('');
    setTrackedApp(null);

    const term = searchAdmNum.trim().toLowerCase();
    if (!term) {
      setTrackError('Please enter a valid Name or Tracking ID.');
      return;
    }

    const found = applications.find(
      app => app.admissionNumber.toLowerCase() === term || app.name.toLowerCase().includes(term)
    );

    if (found) {
      setTrackedApp(found);
    } else {
      setTrackError('No application found with this Name or Tracking ID. Please verify or submit a new application.');
    }
  };

  // Convert files to base64 strings
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCertificateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewAchCertName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewAchCertData(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Add achievement row to local array
  const handleAddAchievement = () => {
    if (!newAchTitle.trim()) {
      alert('Please provide a title for the achievement certificates.');
      return;
    }

    const newAch: Achievement = {
      level: newAchLevel,
      rank: newAchRank,
      title: newAchTitle.trim(),
      year: newAchYear,
      certFileName: newAchCertName || undefined,
      certData: newAchCertData || undefined
    };

    setAchievements([...achievements, newAch]);
    setNewAchTitle('');
    setNewAchCertName('');
    setNewAchCertData('');
  };

  // Delete achievement row
  const handleDeleteAchievement = (idx: number) => {
    setAchievements(achievements.filter((_, i) => i !== idx));
  };

  // Handle Submit Form
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    // Check application deadline
    const deadlineDate = new Date(deadline);
    if (new Date() > deadlineDate && !isEditing) {
      setFormError('The submission deadline for the Student Cabinet has passed.');
      return;
    }

    // Custom validations
    if (!name.trim()) return setFormError('Student Name is required.');
    if (!section.trim()) return setFormError('Section is required.');
    if (!dob) return setFormError('Date of Birth is required.');
    if (!firstChoicePostId) return setFormError('Please select your first choice post.');
    if (!secondChoicePostId) return setFormError('Please select your second choice post.');
    if (firstChoicePostId === secondChoicePostId) {
      return setFormError('First choice post and Second choice post must not be the same.');
    }

    const calculatedAdmNum = admissionNumber ? admissionNumber.trim() : 'GDG-2026-' + Math.floor(1000 + Math.random() * 9000);
    const calculatedAdmDate = (2026 - Math.max(1, studentClass)) + "-04-10";

    const payload = {
      name: name.trim(),
      admissionNumber: calculatedAdmNum,
      class: studentClass,
      section: section.trim().toUpperCase(),
      rollNumber: rollNumber || '1',
      gender,
      dob,
      admissionDate: isEditing ? admissionDate : calculatedAdmDate,
      house,
      mobile: mobile || '9999999999',
      parentName: parentName || `Parent of ${name}`,
      parentMobile: parentMobile || '9999999999',
      email: email || `${name.toLowerCase().replace(/\s+/g, '')}@goenkastudent.com`,
      photo: photo || '',
      leadershipExperience: leadershipExperience || 'Leadership history filed.',
      achievements: achievements || [],
      firstChoicePostId,
      secondChoicePostId,
      sop: sop || 'Vision statement filed for Cabinet.',
      declaration: true
    };

    if (isEditing) {
      onUpdateApplication(editingAppId, payload);
      setFormSuccess('Your application has been updated successfully.');
      setIsEditing(false);
      setEditingAppId('');
      // Refresh tracked app
      const updatedApp = applications.find(a => a.id === editingAppId);
      if (updatedApp) setTrackedApp({ ...updatedApp, ...payload });
      setActiveTab('track');
    } else {
      onSubmitApplication(payload);
      setFormSuccess(`Your application was submitted successfully! Please write down your Tracking ID to check status: ${calculatedAdmNum}`);
      
      // Reset form fields
      setName('');
      setSection('A');
      setFirstChoicePostId('');
      setSecondChoicePostId('');
    }
  };

  // Populate application fields for editing
  const handleEditInit = (app: StudentApplication) => {
    setIsEditing(true);
    setEditingAppId(app.id);
    setName(app.name);
    setAdmissionNumber(app.admissionNumber);
    setStudentClass(app.class);
    setSection(app.section);
    setRollNumber(app.rollNumber || '1');
    setGender(app.gender);
    setDob(app.dob);
    setAdmissionDate(app.admissionDate || '2015-04-10');
    setHouse(app.house);
    setMobile(app.mobile || '9999999999');
    setParentName(app.parentName || `Parent of ${app.name}`);
    setParentMobile(app.parentMobile || '9999999999');
    setEmail(app.email || `${app.name.toLowerCase().replace(/\s+/g, '')}@goenkastudent.com`);
    setPhoto(app.photo || '');
    setLeadershipExperience(app.leadershipExperience || 'Cabinet Candidate Portfolio');
    setSop(app.sop || 'Vision statement filed for Cabinet.');
    setFirstChoicePostId(app.firstChoicePostId);
    setSecondChoicePostId(app.secondChoicePostId);
    setDeclaration(app.declaration);
    setAchievements(app.achievements || []);
    
    setFormError('');
    setFormSuccess('');
    setActiveTab('apply');
  };

  // Trigger browser print receipt
  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="space-y-6" id="student-portal">
      {/* Tab Selectors */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => {
            setActiveTab('track');
            setFormSuccess('');
            setFormError('');
          }}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-display text-sm font-semibold transition-all ${
            activeTab === 'track'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Track Nomination & Status</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('apply');
            setIsEditing(false);
            setFormSuccess('');
            setFormError('');
          }}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-display text-sm font-semibold transition-all ${
            activeTab === 'apply'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>{isEditing ? 'Edit Application Form' : 'New Application Form'}</span>
        </button>
      </div>

      {/* TRACK NOMINATION TAB */}
      {activeTab === 'track' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs max-w-2xl mx-auto">
            <h3 className="font-display font-bold text-slate-800 text-lg mb-1.5 text-center">Student Application Tracking</h3>
            <p className="text-xs text-slate-400 text-center font-sans mb-6">Enter your admission number to track scheduling, status, and download receipts</p>

            <form onSubmit={handleTrackSearch} className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. GDG-2015-8822"
                value={searchAdmNum}
                onChange={e => setSearchAdmNum(e.target.value)}
                className="flex-1 px-4 py-2.5 border border-slate-350 rounded-xl focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 text-sm font-sans"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium font-sans text-sm flex items-center gap-1.5 shadow-sm active:bg-slate-950 transition"
              >
                <Search className="w-4 h-4" />
                <span>Track</span>
              </button>
            </form>

            {trackError && (
              <p className="mt-3 text-xs text-rose-600 bg-rose-50 border border-rose-100 p-2.5 rounded-lg font-medium font-sans flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5" />
                {trackError}
              </p>
            )}
          </div>

          {/* Tracked Results Display (Official Receipt printable style) */}
          {trackedApp && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm max-w-4xl mx-auto space-y-6 print:border-none print:shadow-none" id="receipt-print-area">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Cabinet Receipt</span>
                  <h4 className="font-display font-bold text-slate-950 text-xl mt-0.5">GD Goenka Selection Desk</h4>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">ID: {trackedApp.id} • Registered: {new Date(trackedApp.submittedAt).toLocaleString()}</p>
                </div>

                <div className="flex gap-2 print:hidden">
                  <button
                    onClick={() => handleEditInit(trackedApp)}
                    className="px-3.5 py-1.5 border border-slate-250 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-semibold font-sans flex items-center gap-1 transition"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Edit Application</span>
                  </button>
                  <button
                    onClick={handlePrintReceipt}
                    className="px-3.5 py-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-xs font-semibold font-sans flex items-center gap-1 shadow-sm transition"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Receipt</span>
                  </button>
                </div>
              </div>

              {/* Status Banner */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400 font-sans">Current Status</span>
                  <div className="mt-2.5 flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${
                      trackedApp.status === 'Selected' ? 'bg-emerald-500 animate-pulse' :
                      trackedApp.status === 'Waitlisted' ? 'bg-amber-400' :
                      trackedApp.status === 'Rejected' ? 'bg-rose-500' : 'bg-sky-400'
                    }`} />
                    <span className="text-base font-display font-bold text-slate-900">{trackedApp.status}</span>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400 font-sans">Interview Schedule</span>
                  <div className="mt-2.5 font-display font-bold text-slate-800 text-sm">
                    {trackedApp.interviewDate ? (
                      <span className="text-slate-900">{trackedApp.interviewDate} at {trackedApp.interviewTime}</span>
                    ) : (
                      <span className="text-slate-400 flex items-center gap-1 font-normal text-xs"><Clock className="w-3.5 h-3.5"/> Verification Pending</span>
                    )}
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400 font-sans">Calculated Score / Rank</span>
                  <div className="mt-2.5 flex justify-between items-center">
                    <span className="font-display font-bold text-slate-900">{trackedApp.finalScore || 0} <span className="text-slate-400 text-xs font-normal">marks</span></span>
                    {trackedApp.rankOverall && (
                      <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-bold border border-slate-200">Overall Rank: #{trackedApp.rankOverall}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Application Details Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-2">
                <div className="md:col-span-1 flex flex-col items-center">
                  <div className="w-32 h-32 rounded-xl bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center text-slate-400 shadow-2xs relative">
                    {trackedApp.photo ? (
                      <img src={trackedApp.photo} alt="Candidate Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-10 h-10 stroke-1.5" />
                    )}
                  </div>
                  <div className="mt-3 text-center">
                    <div className="font-display font-bold text-slate-900">{trackedApp.name}</div>
                    <div className="text-xs font-medium text-slate-500 mt-0.5">Adm Num: {trackedApp.admissionNumber}</div>
                  </div>
                </div>

                <div className="md:col-span-3 grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">Class & Section:</span>
                    <span className="font-semibold text-slate-800">Class {trackedApp.class}-{trackedApp.section} (Roll: {trackedApp.rollNumber})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Gender:</span>
                    <span className="font-semibold text-slate-800">{trackedApp.gender}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Date of Birth:</span>
                    <span className="font-semibold text-slate-800">{trackedApp.dob}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Admission Date:</span>
                    <span className="font-semibold text-slate-800">{trackedApp.admissionDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">School House:</span>
                    <span className="font-semibold text-slate-800">{trackedApp.house} House</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Contact Email:</span>
                    <span className="font-semibold text-slate-800">{trackedApp.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Primary Post Choice:</span>
                    <span className="font-bold text-indigo-700">{posts.find(p => p.id === trackedApp.firstChoicePostId)?.title || trackedApp.firstChoicePostId}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Secondary Post Choice:</span>
                    <span className="font-bold text-slate-700">{posts.find(p => p.id === trackedApp.secondChoicePostId)?.title || trackedApp.secondChoicePostId}</span>
                  </div>
                </div>
              </div>

              {/* SOP & Experience */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-4">
                  <h5 className="font-display font-bold text-slate-800 text-xs mb-2">Leadership Experience Statement</h5>
                  <p className="text-xs text-slate-600 leading-relaxed font-sans whitespace-pre-line">{trackedApp.leadershipExperience}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-4">
                  <h5 className="font-display font-bold text-slate-800 text-xs mb-2">Statement of Purpose (SOP)</h5>
                  <p className="text-xs text-slate-600 leading-relaxed font-sans whitespace-pre-line">{trackedApp.sop}</p>
                </div>
              </div>

              {/* Achievements Listed */}
              <div className="border-t border-slate-100 pt-4">
                <h5 className="font-display font-bold text-slate-800 text-xs mb-3">Certified Achievements & Honors</h5>
                {(trackedApp.achievements || []).length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No special achievements registered</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {trackedApp.achievements.map((ach, idx) => (
                      <div key={idx} className="flex gap-2.5 bg-white border border-slate-200 rounded-xl p-3 items-center">
                        <div className="p-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-200/50 flex-shrink-0">
                          <Award className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-800 truncate">{ach.title}</div>
                          <div className="text-[10px] text-slate-400 font-semibold mt-0.5 uppercase tracking-wider">{ach.level} • {ach.rank} ({ach.year})</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* NEW APPLICATION TAB */}
      {activeTab === 'apply' && (
        <form onSubmit={handleFormSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-8 max-w-4xl mx-auto">
          <div>
            <h3 className="font-display font-bold text-slate-900 text-lg">{isEditing ? 'Modify Cabinet Nomination' : 'Student Cabinet Nomination Form'}</h3>
            <p className="text-xs text-slate-500 font-sans mt-0.5">Please provide your student details to register your cabinet candidacy.</p>
          </div>

          {formError && (
            <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl font-medium font-sans flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              {formError}
            </div>
          )}

          {formSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-xl font-medium font-sans flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-emerald-600" />
              {formSuccess}
            </div>
          )}

          {/* Pre-Registered Student Lookup Box */}
          {!isEditing && (
            <div className="bg-amber-50/40 border border-amber-200/60 p-4.5 rounded-2xl space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-400 text-slate-950 rounded-xl font-bold flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                  <Search className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="font-display font-bold text-slate-900 text-xs">Pre-registered Student Lookup</h4>
                  <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
                    Search and select your pre-registered profile below to automatically populate your Name, Admission Number, Class, Section, and Gender!
                  </p>
                </div>
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Type your name or Admission Number to search..."
                  value={lookupQuery}
                  onChange={e => {
                    setLookupQuery(e.target.value);
                    setShowLookupDropdown(true);
                  }}
                  onFocus={() => setShowLookupDropdown(true)}
                  className="w-full px-3.5 py-2 text-xs border border-amber-350 rounded-xl text-slate-800 bg-white placeholder-amber-900/40 focus:ring-1 focus:ring-amber-500 font-sans font-medium"
                />
                
                {showLookupDropdown && lookupQuery.trim().length > 1 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto divide-y divide-slate-100">
                    {registeredList.filter(s => {
                      const q = lookupQuery.toLowerCase();
                      return s.name.toLowerCase().includes(q) || s.admissionNumber.toLowerCase().includes(q);
                    }).slice(0, 8).map(student => (
                      <button
                        key={student.id}
                        type="button"
                        onClick={() => {
                          setName(student.name);
                          setAdmissionNumber(student.admissionNumber);
                          setStudentClass(student.class);
                          setSection(student.section || 'A');
                          setRollNumber(student.rollNumber || '1');
                          if (student.gender) {
                            setGender(student.gender);
                          }
                          setLookupQuery('');
                          setShowLookupDropdown(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-slate-50 text-xs flex justify-between items-center transition"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{student.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono font-medium mt-0.5">Admn: {student.admissionNumber}</div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                            Class {student.class}-{student.section}
                          </span>
                        </div>
                      </button>
                    ))}
                    {registeredList.filter(s => {
                      const q = lookupQuery.toLowerCase();
                      return s.name.toLowerCase().includes(q) || s.admissionNumber.toLowerCase().includes(q);
                    }).length === 0 && (
                      <div className="p-3 text-center text-xs text-slate-400 italic">No matches. You can still fill standard form fields below as a new entry.</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Candidacy Registration Form */}
          <div className="space-y-6">
            <h4 className="font-display font-bold text-slate-800 text-sm border-b border-slate-100 pb-1.5 uppercase tracking-wider">Candidacy Registration Details</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-600 font-sans">Student Full Name</label>
                  {user && (
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Google Verified
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="e.g. Aarav Goel"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  disabled={!!user}
                  className={`w-full px-3.5 py-2 text-xs border border-slate-350 rounded-lg text-slate-800 focus:ring-1 focus:ring-slate-900 focus:border-slate-900 ${
                    user ? 'bg-slate-100 cursor-not-allowed text-slate-500' : ''
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 font-sans">Date of Birth</label>
                <input
                  type="date"
                  value={dob}
                  onChange={e => setDob(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-350 rounded-lg text-slate-800 focus:ring-1 focus:ring-slate-900 focus:border-slate-900 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 font-sans">Class Level</label>
                <select
                  value={studentClass}
                  onChange={e => setStudentClass(parseInt(e.target.value))}
                  className="w-full px-3.5 py-2 text-xs border border-slate-350 rounded-lg text-slate-800 focus:ring-1 focus:ring-slate-900 focus:border-slate-900 bg-white"
                >
                  {[1,2,3,4,5,6,7,8,9,10,11].map(n => (
                    <option key={n} value={n}>Class {n === 11 ? 'XI' : n === 10 ? 'X' : n === 9 ? 'IX' : n}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 font-sans">Section</label>
                <input
                  type="text"
                  placeholder="e.g. A"
                  value={section}
                  onChange={e => setSection(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2 text-xs border border-slate-350 rounded-lg text-slate-800 focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 font-sans">Gender</label>
                <select
                  value={gender}
                  onChange={e => setGender(e.target.value as 'Boy' | 'Girl')}
                  className="w-full px-3.5 py-2 text-xs border border-slate-350 rounded-lg text-slate-800 focus:ring-1 focus:ring-slate-900 focus:border-slate-900 bg-white"
                >
                  <option value="Boy">Boy</option>
                  <option value="Girl">Girl</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 font-sans">School House</label>
                <select
                  value={house}
                  onChange={e => setHouse(e.target.value as any)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-350 rounded-lg text-slate-800 focus:ring-1 focus:ring-slate-900 focus:border-slate-900 bg-white"
                >
                  <option value="Radhakrishnan">Radhakrishnan (Red)</option>
                  <option value="Tagore">Tagore (Yellow)</option>
                  <option value="Vivekanand">Vivekanand (Blue)</option>
                  <option value="Teresa">Teresa (Green)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 font-sans">Primary Choice Post (Choice 1)</label>
                <select
                  value={firstChoicePostId}
                  onChange={e => setFirstChoicePostId(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-350 rounded-lg text-slate-800 focus:ring-1 focus:ring-slate-900 focus:border-slate-900 bg-white font-semibold text-indigo-900"
                >
                  <option value="">-- Select Choice 1 Post --</option>
                  {eligiblePosts.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 font-sans">Secondary Choice Post (Choice 2)</label>
                <select
                  value={secondChoicePostId}
                  onChange={e => setSecondChoicePostId(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-350 rounded-lg text-slate-800 focus:ring-1 focus:ring-slate-900 focus:border-slate-900 bg-white font-semibold text-slate-800"
                >
                  <option value="">-- Select Choice 2 Post --</option>
                  {eligiblePosts.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* DECLARATION */}
          <div className="border-t border-slate-100 pt-5">
            <span className="text-[11px] text-slate-400 font-medium leading-relaxed font-sans">
              * By submitting this application, you authorize the GD Goenka School Election Board to evaluate your leadership credentials. Marks for Academics, Attendance, Years in School, Achievements, Interview, and Discipline will be assigned by authorized panel interviewers during the assessment phase.
            </span>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="flex justify-end gap-3 pt-2">
            {isEditing && (
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditingAppId('');
                  setActiveTab('track');
                }}
                className="px-5 py-2.5 rounded-xl border border-slate-250 text-slate-600 hover:bg-slate-50 font-sans text-xs font-semibold transition"
              >
                Cancel Changes
              </button>
            )}
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-sans text-xs font-bold shadow-sm transition flex items-center gap-1.5"
            >
              <CheckSquare className="w-4 h-4" />
              <span>{isEditing ? 'Save Changes' : 'Submit Cabinet Application'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
