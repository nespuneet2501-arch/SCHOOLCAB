import React, { useState } from 'react';
import { Post, Cabinet, StudentApplication, SystemConfig } from '../types';
import { BarChart3, Download, Printer, FileSpreadsheet, Users, Shield, Award, Layers, HelpCircle, ArrowLeftRight } from 'lucide-react';

interface ReportsPanelProps {
  config: SystemConfig;
  applications: StudentApplication[];
}

type ReportType = 'overview' | 'class' | 'post' | 'gender' | 'house';

export default function ReportsPanel({ config, applications }: ReportsPanelProps) {
  const [activeReport, setActiveReport] = useState<ReportType>('overview');
  const [selectedClassFilter, setSelectedClassFilter] = useState<number | 'all'>('all');
  const [selectedHouseFilter, setSelectedHouseFilter] = useState<string | 'all'>('all');

  const selectedApps = applications.filter(app => {
    if (selectedClassFilter !== 'all' && app.class !== selectedClassFilter) return false;
    if (selectedHouseFilter !== 'all' && app.house !== selectedHouseFilter) return false;
    return true;
  });

  // Calculate high-level stats
  const totalApplications = applications.length;
  const totalSelected = applications.filter(a => a.status === 'Selected').length;
  const totalPending = applications.filter(a => a.status === 'Pending').length;
  const totalInterviewed = applications.filter(a => a.interviewMarks !== undefined || a.status === 'Interview Scheduled' || a.status === 'Under Evaluation').length;
  const totalPosts = config.posts.filter(p => p.enabled).length;
  const totalCabinets = config.cabinets.filter(c => c.enabled).length;

  // Helper: Export to Excel-compatible CSV with UTF-8 BOM
  const downloadCSV = (headers: string[], rows: string[][], fileName: string) => {
    const csvContent = "\uFEFF" + [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${(val || '').replace(/"/g, '""')}"`).join(','))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${fileName}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper: print the active report page
  const triggerPrint = () => {
    window.print();
  };

  // 1. CLASS-WISE CALCULATIONS
  const classesList = Array.from(new Set(applications.map(a => a.class))).sort((a, b) => a - b);
  const classWiseData = classesList.map(cls => {
    const classApps = applications.filter(a => a.class === cls);
    const boys = classApps.filter(a => a.gender === 'Boy').length;
    const girls = classApps.filter(a => a.gender === 'Girl').length;
    const selected = classApps.filter(a => a.status === 'Selected').length;
    const waitlisted = classApps.filter(a => a.status === 'Waitlisted').length;
    const averageScore = classApps.reduce((acc, a) => acc + (a.finalScore || 0), 0) / (classApps.length || 1);

    return {
      classNum: cls,
      total: classApps.length,
      boys,
      girls,
      selected,
      waitlisted,
      avgScore: parseFloat(averageScore.toFixed(2))
    };
  });

  const exportClassWiseExcel = () => {
    const headers = ['Class', 'Total Applications', 'Boys', 'Girls', 'Selected Candidates', 'Waitlisted Candidates', 'Average Merit Score'];
    const rows = classWiseData.map(d => [
      `Class ${d.classNum}`,
      d.total.toString(),
      d.boys.toString(),
      d.girls.toString(),
      d.selected.toString(),
      d.waitlisted.toString(),
      d.avgScore.toString()
    ]);
    downloadCSV(headers, rows, 'Class_Wise_Report');
  };

  // 2. POST-WISE CALCULATIONS
  const postWiseData = config.posts.map(post => {
    const postApps = applications.filter(a => a.firstChoicePostId === post.id || a.secondChoicePostId === post.id);
    const firstChoiceApps = applications.filter(a => a.firstChoicePostId === post.id);
    const secondChoiceApps = applications.filter(a => a.secondChoicePostId === post.id);
    const selectedAppsForPost = applications.filter(a => a.status === 'Selected' && (a.firstChoicePostId === post.id || a.secondChoicePostId === post.id));
    const averageScore = postApps.reduce((acc, a) => acc + (a.finalScore || 0), 0) / (postApps.length || 1);

    return {
      postTitle: post.title,
      cabinetId: post.cabinetId,
      vacancies: post.vacancies,
      genderRule: post.genderRule,
      totalApplicants: postApps.length,
      firstChoice: firstChoiceApps.length,
      secondChoice: secondChoiceApps.length,
      selected: selectedAppsForPost.length,
      avgScore: parseFloat(averageScore.toFixed(2))
    };
  });

  const exportPostWiseExcel = () => {
    const headers = ['Post Title', 'Cabinet', 'Vacancies', 'Gender Rule', 'Total Applicants', 'First Choice', 'Second Choice', 'Selected', 'Avg Score'];
    const rows = postWiseData.map(d => [
      d.postTitle,
      config.cabinets.find(c => c.id === d.cabinetId)?.name || d.cabinetId,
      d.vacancies.toString(),
      d.genderRule,
      d.totalApplicants.toString(),
      d.firstChoice.toString(),
      d.secondChoice.toString(),
      d.selected.toString(),
      d.avgScore.toString()
    ]);
    downloadCSV(headers, rows, 'Post_Wise_Report');
  };

  // 3. GENDER-WISE CALCULATIONS
  const genderWiseData = ['Boy', 'Girl'].map(gender => {
    const genderApps = applications.filter(a => a.gender === gender);
    const selected = genderApps.filter(a => a.status === 'Selected').length;
    const waitlisted = genderApps.filter(a => a.status === 'Waitlisted').length;
    const averageScore = genderApps.reduce((acc, a) => acc + (a.finalScore || 0), 0) / (genderApps.length || 1);
    
    // Most popular posts
    const postCounts: { [key: string]: number } = {};
    genderApps.forEach(a => {
      postCounts[a.firstChoicePostId] = (postCounts[a.firstChoicePostId] || 0) + 1;
    });
    const popularPostId = Object.keys(postCounts).sort((a, b) => postCounts[b] - postCounts[a])[0];
    const popularPostTitle = config.posts.find(p => p.id === popularPostId)?.title || 'N/A';

    return {
      gender,
      total: genderApps.length,
      selected,
      waitlisted,
      avgScore: parseFloat(averageScore.toFixed(2)),
      popularPost: popularPostTitle
    };
  });

  const exportGenderExcel = () => {
    const headers = ['Gender', 'Total Applications', 'Selected Candidates', 'Waitlisted', 'Average Score', 'Most Applied Post'];
    const rows = genderWiseData.map(d => [
      d.gender,
      d.total.toString(),
      d.selected.toString(),
      d.waitlisted.toString(),
      d.avgScore.toString(),
      d.popularPost
    ]);
    downloadCSV(headers, rows, 'Gender_Wise_Report');
  };

  // 4. HOUSE-WISE CALCULATIONS
  const housesList = ['Radhakrishnan', 'Tagore', 'Vivekanand', 'Teresa'];
  const houseWiseData = housesList.map(houseName => {
    const houseApps = applications.filter(a => a.house === houseName);
    const selected = houseApps.filter(a => a.status === 'Selected').length;
    const waitlisted = houseApps.filter(a => a.status === 'Waitlisted').length;
    const avgScore = houseApps.reduce((acc, a) => acc + (a.finalScore || 0), 0) / (houseApps.length || 1);

    return {
      houseName,
      total: houseApps.length,
      selected,
      waitlisted,
      avgScore: parseFloat(avgScore.toFixed(2))
    };
  });

  const exportHouseExcel = () => {
    const headers = ['House Name', 'Total Applications', 'Selected Cabinet Members', 'Waitlisted Candidates', 'Average Score'];
    const rows = houseWiseData.map(d => [
      d.houseName,
      d.total.toString(),
      d.selected.toString(),
      d.waitlisted.toString(),
      d.avgScore.toString()
    ]);
    downloadCSV(headers, rows, 'House_Wise_Report');
  };

  // 5. CABINET SELECTION ROSTER EXCEL
  const exportFullSelectedCabinetExcel = () => {
    const headers = ['Candidate ID', 'Name', 'Admission Number', 'Class', 'Section', 'Gender', 'House', 'Selected Post', 'Merit Score', 'Interview Marks', 'Attendance %'];
    const selectedCandidates = applications.filter(a => a.status === 'Selected');
    const rows = selectedCandidates.map(c => {
      const selectedPost = config.posts.find(p => p.id === c.firstChoicePostId || p.id === c.secondChoicePostId)?.title || 'Selected Cabinet Officer';
      return [
        c.id,
        c.name,
        c.admissionNumber,
        `Class ${c.class}`,
        c.section,
        c.gender,
        c.house,
        selectedPost,
        (c.finalScore || 0).toString(),
        (c.interviewMarks || 0).toString(),
        `${c.attendancePercentage || 0}%`
      ];
    });
    downloadCSV(headers, rows, 'Selected_Cabinet_Roster');
  };

  return (
    <div className="space-y-6">
      {/* Print-specific header (hidden in screen, visible when printed) */}
      <div className="hidden print:block text-center border-b border-slate-300 pb-5 mb-5 font-sans">
        <h1 className="text-xl font-bold uppercase tracking-wide text-slate-950">{config.branding.name}</h1>
        <p className="text-sm font-medium text-slate-700">{config.branding.tagline}</p>
        <p className="text-xs text-slate-500 mt-1">OFFICIAL CABINET SELECTION REPORT • SESSION {config.branding.academicSession}</p>
        <div className="text-[10px] text-slate-400 mt-2 font-mono">Report Date: {new Date().toLocaleString()}</div>
      </div>

      {/* Screen Controls */}
      <div className="print:hidden flex flex-wrap justify-between items-center gap-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-slate-900 text-amber-400 rounded-xl">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-bold text-slate-900 text-base">Analytical Cabinet Reports</h2>
            <p className="text-xs text-slate-500 font-sans mt-0.5">Generate printable PDF and Excel spreadsheets of student cabinet statistics</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={triggerPrint}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold font-sans flex items-center gap-1.5 border border-slate-200 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save PDF</span>
          </button>
          <button
            onClick={exportFullSelectedCabinetExcel}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold font-sans flex items-center gap-1.5 shadow-xs transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
            <span>Export Cabinet Roster (Excel)</span>
          </button>
        </div>
      </div>

      {/* Report Type Selector Tabs */}
      <div className="print:hidden flex border-b border-slate-200 overflow-x-auto scrollbar-thin">
        <button
          onClick={() => setActiveReport('overview')}
          className={`px-5 py-3.5 font-sans text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
            activeReport === 'overview' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          Cabinet Summary
        </button>
        <button
          onClick={() => setActiveReport('class')}
          className={`px-5 py-3.5 font-sans text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
            activeReport === 'class' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          Class-wise Reports
        </button>
        <button
          onClick={() => setActiveReport('post')}
          className={`px-5 py-3.5 font-sans text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
            activeReport === 'post' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Shield className="w-4 h-4" />
          Post-wise Merit
        </button>
        <button
          onClick={() => setActiveReport('gender')}
          className={`px-5 py-3.5 font-sans text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
            activeReport === 'gender' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          Gender Analysis
        </button>
        <button
          onClick={() => setActiveReport('house')}
          className={`px-5 py-3.5 font-sans text-xs font-bold border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
            activeReport === 'house' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Award className="w-4 h-4" />
          House-wise Distribution
        </button>
      </div>

      {/* KPI Stats Block (Printed & Screen) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs">
          <div className="text-[10px] font-bold text-slate-400 font-mono tracking-wider uppercase mb-1">Total Cabinets / Posts</div>
          <div className="text-lg font-display font-extrabold text-slate-900">{totalCabinets} <span className="text-slate-300 font-sans text-xs font-medium">/</span> {totalPosts}</div>
          <div className="text-[9px] text-slate-500 font-sans mt-0.5">Enabled school council posts</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs">
          <div className="text-[10px] font-bold text-slate-400 font-mono tracking-wider uppercase mb-1">Total Nominees Applied</div>
          <div className="text-lg font-display font-extrabold text-slate-900">{totalApplications}</div>
          <div className="text-[9px] text-slate-500 font-sans mt-0.5">Students who submitted profiles</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs">
          <div className="text-[10px] font-bold text-slate-400 font-mono tracking-wider uppercase mb-1">Undergoing Evaluation</div>
          <div className="text-lg font-display font-extrabold text-slate-900">{totalInterviewed}</div>
          <div className="text-[9px] text-slate-500 font-sans mt-0.5">Interviewed or scheduled</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs border-emerald-100 bg-emerald-50/20">
          <div className="text-[10px] font-bold text-emerald-600 font-mono tracking-wider uppercase mb-1">Cabinet Elected Officers</div>
          <div className="text-lg font-display font-extrabold text-emerald-700">{totalSelected}</div>
          <div className="text-[9px] text-emerald-600 font-sans mt-0.5">Officially selected officers</div>
        </div>
      </div>

      {/* REPORT VIEWS CONTENT */}

      {/* REPORT A: SUMMARY OVERVIEW */}
      {activeReport === 'overview' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-display font-bold text-slate-900 text-sm">Elected Student Cabinet Roster</h3>
                <p className="text-[11px] text-slate-500 font-sans mt-0.5">Official leadership list for academic year {config.branding.academicSession}</p>
              </div>
              <button
                onClick={exportFullSelectedCabinetExcel}
                className="print:hidden px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold font-sans flex items-center gap-1 transition"
              >
                <Download className="w-3 h-3" />
                Excel (.csv)
              </button>
            </div>

            {applications.filter(a => a.status === 'Selected').length === 0 ? (
              <div className="p-12 border border-slate-150 border-dashed rounded-xl text-center text-xs text-slate-400 italic font-sans">No candidates have been marked as 'Selected' yet. Change a nominee status to 'Selected' in the Nominations or Evaluations list to populate the official cabinet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-sans">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 border-b border-slate-150 font-semibold">
                      <th className="p-3">Admn No.</th>
                      <th className="p-3">Candidate Name</th>
                      <th className="p-3">Class & Section</th>
                      <th className="p-3">Gender</th>
                      <th className="p-3">House</th>
                      <th className="p-3">Elected Cabinet Position</th>
                      <th className="p-3 text-right">Merit Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {applications.filter(a => a.status === 'Selected').map(candidate => {
                      const electedPost = config.posts.find(p => p.id === candidate.firstChoicePostId || p.id === candidate.secondChoicePostId)?.title || 'Cabinet Officer';
                      return (
                        <tr key={candidate.id} className="hover:bg-slate-50/50 transition">
                          <td className="p-3 font-mono font-medium text-slate-500">{candidate.admissionNumber}</td>
                          <td className="p-3 font-bold text-slate-900">{candidate.name}</td>
                          <td className="p-3 font-medium">Class {candidate.class}-{candidate.section}</td>
                          <td className="p-3">{candidate.gender}</td>
                          <td className="p-3">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              candidate.house === 'Radhakrishnan' ? 'bg-amber-100 text-amber-800' :
                              candidate.house === 'Tagore' ? 'bg-blue-100 text-blue-800' :
                              candidate.house === 'Vivekanand' ? 'bg-orange-100 text-orange-800' :
                              'bg-emerald-100 text-emerald-800'
                            }`}>{candidate.house}</span>
                          </td>
                          <td className="p-3 font-bold text-slate-900">{electedPost}</td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900">{candidate.finalScore || '0'}/50</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* REPORT B: CLASS-WISE */}
      {activeReport === 'class' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-display font-bold text-slate-900 text-sm">Class-wise Selection Report</h3>
              <p className="text-[11px] text-slate-500 font-sans mt-0.5">Breakdown of applications, gender distribution, and average merits by class</p>
            </div>
            <button
              onClick={exportClassWiseExcel}
              className="print:hidden px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold font-sans flex items-center gap-1 transition"
            >
              <Download className="w-3 h-3" />
              Excel (.csv)
            </button>
          </div>

          {classWiseData.length === 0 ? (
            <div className="p-12 border border-slate-150 border-dashed rounded-xl text-center text-xs text-slate-400 italic">No student applications submitted yet to aggregate.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-sans">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-150 font-semibold">
                    <th className="p-3">Class</th>
                    <th className="p-3 text-center">Total Nominations</th>
                    <th className="p-3 text-center">Boys Applied</th>
                    <th className="p-3 text-center">Girls Applied</th>
                    <th className="p-3 text-center">Elected Cabinet Officers</th>
                    <th className="p-3 text-center">Waitlisted Candidates</th>
                    <th className="p-3 text-right">Avg Merit Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {classWiseData.map(d => (
                    <tr key={d.classNum} className="hover:bg-slate-50/50 transition">
                      <td className="p-3 font-bold text-slate-900">Class {clsRoman(d.classNum)} ({d.classNum})</td>
                      <td className="p-3 text-center font-mono font-medium">{d.total}</td>
                      <td className="p-3 text-center text-slate-500 font-mono">{d.boys}</td>
                      <td className="p-3 text-center text-slate-500 font-mono">{d.girls}</td>
                      <td className="p-3 text-center font-mono font-bold text-emerald-600">{d.selected}</td>
                      <td className="p-3 text-center font-mono text-amber-600">{d.waitlisted}</td>
                      <td className="p-3 text-right font-mono font-bold">{d.avgScore}/50</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* REPORT C: POST-WISE */}
      {activeReport === 'post' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-display font-bold text-slate-900 text-sm">Post-wise Applications & Selection Analysis</h3>
              <p className="text-[11px] text-slate-500 font-sans mt-0.5">Analytical dashboard outlining vacancy filling status, preferences, and average candidate grades per post</p>
            </div>
            <button
              onClick={exportPostWiseExcel}
              className="print:hidden px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold font-sans flex items-center gap-1 transition"
            >
              <Download className="w-3 h-3" />
              Excel (.csv)
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-150 font-semibold">
                  <th className="p-3">Cabinet Post Title</th>
                  <th className="p-3">Cabinet</th>
                  <th className="p-3 text-center">Vacancies</th>
                  <th className="p-3 text-center">Gender Rule</th>
                  <th className="p-3 text-center font-bold">Total Applicants</th>
                  <th className="p-3 text-center text-slate-400">1st Choice</th>
                  <th className="p-3 text-center text-slate-400">2nd Choice</th>
                  <th className="p-3 text-center font-bold text-emerald-600">Selected</th>
                  <th className="p-3 text-right">Avg Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {postWiseData.map(d => (
                  <tr key={d.postTitle} className="hover:bg-slate-50/50 transition">
                    <td className="p-3 font-bold text-slate-900">{d.postTitle}</td>
                    <td className="p-3 font-medium text-slate-500">{config.cabinets.find(c => c.id === d.cabinetId)?.name || d.cabinetId}</td>
                    <td className="p-3 text-center font-mono font-bold text-slate-800">{d.vacancies}</td>
                    <td className="p-3 text-center font-medium capitalize">
                      <span className={`px-1.5 py-0.5 rounded-sm text-[10px] ${
                        d.genderRule === 'boy' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                        d.genderRule === 'girl' ? 'bg-pink-50 text-pink-700 border border-pink-100' :
                        'bg-slate-50 text-slate-600'
                      }`}>{d.genderRule}</span>
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-slate-900">{d.totalApplicants}</td>
                    <td className="p-3 text-center font-mono text-slate-500">{d.firstChoice}</td>
                    <td className="p-3 text-center font-mono text-slate-500">{d.secondChoice}</td>
                    <td className="p-3 text-center font-mono font-bold text-emerald-600">
                      <span className={`inline-block px-2 py-0.5 rounded-full ${
                        d.selected >= d.vacancies ? 'bg-emerald-100 text-emerald-800 font-black' :
                        d.selected > 0 ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-400'
                      }`}>{d.selected} / {d.vacancies}</span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold">{d.avgScore}/50</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT D: GENDER-WISE */}
      {activeReport === 'gender' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-display font-bold text-slate-900 text-sm">Gender-wise Analytical Breakdown</h3>
              <p className="text-[11px] text-slate-500 font-sans mt-0.5">Evaluate equality margins, application volumes, and average success scores by gender</p>
            </div>
            <button
              onClick={exportGenderExcel}
              className="print:hidden px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold font-sans flex items-center gap-1 transition"
            >
              <Download className="w-3 h-3" />
              Excel (.csv)
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-150 font-semibold">
                  <th className="p-3">Gender Categorization</th>
                  <th className="p-3 text-center">Total Applications</th>
                  <th className="p-3 text-center">Elected Officers</th>
                  <th className="p-3 text-center">Waitlisted Candidates</th>
                  <th className="p-3 text-center">Most Popular Cabinet Choice</th>
                  <th className="p-3 text-right">Average Final Merit Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {genderWiseData.map(d => (
                  <tr key={d.gender} className="hover:bg-slate-50/50 transition">
                    <td className="p-3 font-bold text-slate-900 flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${d.gender === 'Boy' ? 'bg-blue-400' : 'bg-pink-400'}`}></span>
                      {d.gender}s
                    </td>
                    <td className="p-3 text-center font-mono font-medium">{d.total}</td>
                    <td className="p-3 text-center font-mono font-bold text-emerald-600">{d.selected}</td>
                    <td className="p-3 text-center font-mono text-amber-500">{d.waitlisted}</td>
                    <td className="p-3 text-center font-medium text-slate-600">{d.popularPost}</td>
                    <td className="p-3 text-right font-mono font-bold">{d.avgScore}/50</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT E: HOUSE-WISE */}
      {activeReport === 'house' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-display font-bold text-slate-900 text-sm">House-wise Distribution Dashboard</h3>
              <p className="text-[11px] text-slate-500 font-sans mt-0.5">Ensure fair division and track metrics across the four major school houses</p>
            </div>
            <button
              onClick={exportHouseExcel}
              className="print:hidden px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold font-sans flex items-center gap-1 transition"
            >
              <Download className="w-3 h-3" />
              Excel (.csv)
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-sans">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-slate-150 font-semibold">
                  <th className="p-3">School House Name</th>
                  <th className="p-3 text-center">Total Applications</th>
                  <th className="p-3 text-center">Elected Cabinet Officers</th>
                  <th className="p-3 text-center">Waitlisted Candidates</th>
                  <th className="p-3 text-right">Average House Merit Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {houseWiseData.map(d => (
                  <tr key={d.houseName} className="hover:bg-slate-50/50 transition">
                    <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-md ${
                        d.houseName === 'Radhakrishnan' ? 'bg-amber-400' :
                        d.houseName === 'Tagore' ? 'bg-blue-500' :
                        d.houseName === 'Vivekanand' ? 'bg-orange-500' :
                        'bg-emerald-500'
                      }`}></span>
                      {d.houseName} House
                    </td>
                    <td className="p-3 text-center font-mono font-medium">{d.total}</td>
                    <td className="p-3 text-center font-mono font-bold text-emerald-600">{d.selected}</td>
                    <td className="p-3 text-center font-mono text-amber-500">{d.waitlisted}</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">{d.avgScore}/50</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Utility: convert integer class to roman numeral
function clsRoman(num: number): string {
  if (num === 11) return 'XI';
  if (num === 10) return 'X';
  if (num === 9) return 'IX';
  if (num === 8) return 'VIII';
  if (num === 7) return 'VII';
  if (num === 6) return 'VI';
  if (num === 5) return 'V';
  if (num === 4) return 'IV';
  if (num === 3) return 'III';
  if (num === 2) return 'II';
  if (num === 1) return 'I';
  return num.toString();
}
