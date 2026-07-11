import React from 'react';
import { StudentApplication, Post, EvaluationCriterion } from '../types';
import { Users, BarChart3, PieChart, TrendingUp, Trophy, Award, CheckCircle2, AlertCircle } from 'lucide-react';

interface AnalyticsDashboardProps {
  applications: StudentApplication[];
  posts: Post[];
  criteria: EvaluationCriterion[];
}

export default function AnalyticsDashboard({
  applications,
  posts,
  criteria
}: AnalyticsDashboardProps) {
  const total = applications.length;
  const selected = applications.filter(a => a.status === 'Selected').length;
  const waitlisted = applications.filter(a => a.status === 'Waitlisted').length;
  const pending = applications.filter(a => a.status === 'Pending').length;
  const evaluating = applications.filter(a => a.status === 'Under Evaluation' || a.status === 'Interview Scheduled').length;

  // Final Score Stats (for evaluated ones)
  const evaluatedApps = applications.filter(a => a.finalScore !== undefined && a.finalScore > 0);
  const highestScore = evaluatedApps.length > 0 ? Math.max(...evaluatedApps.map(a => a.finalScore || 0)) : 0;
  const lowestScore = evaluatedApps.length > 0 ? Math.min(...evaluatedApps.map(a => a.finalScore || 0)) : 0;
  const averageScore = evaluatedApps.length > 0 ? evaluatedApps.reduce((sum, a) => sum + (a.finalScore || 0), 0) / evaluatedApps.length : 0;

  // House Representation Count
  const houseCounts = {
    Radhakrishnan: applications.filter(a => a.house === 'Radhakrishnan').length,
    Tagore: applications.filter(a => a.house === 'Tagore').length,
    Vivekanand: applications.filter(a => a.house === 'Vivekanand').length,
    Teresa: applications.filter(a => a.house === 'Teresa').length
  };

  // Gender counts
  const boys = applications.filter(a => a.gender === 'Boy').length;
  const girls = applications.filter(a => a.gender === 'Girl').length;
  const boysPct = total > 0 ? Math.round((boys / total) * 100) : 0;
  const girlsPct = total > 0 ? Math.round((girls / total) * 100) : 0;

  // Class distribution counts
  const classCounts: Record<number, number> = {};
  applications.forEach(a => {
    classCounts[a.class] = (classCounts[a.class] || 0) + 1;
  });

  // Post popularity (First Choice count)
  const postPopularity: Record<string, number> = {};
  posts.forEach(p => {
    postPopularity[p.id] = 0;
  });
  applications.forEach(a => {
    if (a.firstChoicePostId) {
      postPopularity[a.firstChoicePostId] = (postPopularity[a.firstChoicePostId] || 0) + 1;
    }
  });

  const sortedPopularPosts = Object.entries(postPopularity)
    .map(([id, count]) => ({
      title: posts.find(p => p.id === id)?.title || id,
      count
    }))
    .sort((a, b) => b.count - a.count);

  const mostPopularPost = sortedPopularPosts[0] || { title: 'None', count: 0 };
  const leastPopularPost = sortedPopularPosts.filter(p => p.count > 0).sort((a,b)=>a.count-b.count)[0] || { title: 'None', count: 0 };

  // Criteria impact score average
  const criteriaAverages = criteria.map(c => {
    let sum = 0;
    let count = 0;
    applications.forEach(a => {
      let val = 0;
      if (c.id === 'achievement') val = a.achievementScore || 0;
      else if (c.id === 'interview') val = a.interviewMarks || 0;
      else if (c.id === 'attendance') val = a.attendanceMarks || 0;
      else if (c.id === 'academics') val = a.academicMarks || 0;
      else if (c.id === 'years') val = a.yearsScore || 0;
      
      sum += val;
      count++;
    });
    return {
      name: c.name,
      avg: count > 0 ? parseFloat((sum / count).toFixed(2)) : 0,
      max: c.maxMarks
    };
  });

  return (
    <div className="space-y-6" id="analytics-dashboard">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold text-slate-900">Cabinet Performance Analytics</h2>
          <p className="text-xs text-slate-500 font-sans mt-0.5">Real-time merit and campaign participation metrics</p>
        </div>
        <div className="text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-sans">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          <span>Calculations Auto-Synced</span>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Apps */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-sans text-slate-400 uppercase tracking-wider">Total Applied</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-3xl font-display font-bold text-slate-900">{total}</div>
            <div className="text-[11px] text-slate-500 mt-0.5 font-sans">Student Nominations</div>
          </div>
        </div>

        {/* Selected */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-sans text-slate-400 uppercase tracking-wider">Selected</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-3xl font-display font-bold text-slate-900">{selected}</div>
            <div className="text-[11px] text-slate-500 mt-0.5 font-sans">Investiture Cabinet</div>
          </div>
        </div>

        {/* Waitlisted */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-sans text-slate-400 uppercase tracking-wider">Waitlisted</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-3xl font-display font-bold text-slate-900">{waitlisted}</div>
            <div className="text-[11px] text-slate-500 mt-0.5 font-sans">Cabinet Reserve List</div>
          </div>
        </div>

        {/* Evaluating */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-sans text-slate-400 uppercase tracking-wider">Evaluating</span>
            <div className="p-1.5 rounded-lg bg-sky-50 text-sky-600">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-3xl font-display font-bold text-slate-900">{evaluating + pending}</div>
            <div className="text-[11px] text-slate-500 mt-0.5 font-sans">{pending} pending verification</div>
          </div>
        </div>

        {/* Average Score */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between text-white col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold font-sans text-slate-400 uppercase tracking-wider">Avg Merit Score</span>
            <div className="p-1.5 rounded-lg bg-slate-800 text-amber-400">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-3xl font-display font-bold text-amber-400">{averageScore.toFixed(1)} <span className="text-sm font-sans text-slate-400 font-normal">/50</span></div>
            <div className="text-[11px] text-slate-400 mt-0.5 font-sans">High: {highestScore} | Low: {lowestScore}</div>
          </div>
        </div>
      </div>

      {/* Main Charts Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* 1. House-wise Representation (Bar Chart) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <BarChart3 className="w-4 h-4 text-indigo-500" />
            <h3 className="font-display font-bold text-slate-800 text-sm">House Representation</h3>
          </div>
          <div className="space-y-4">
            {Object.entries(houseCounts).map(([house, count]) => {
              const maxVal = Math.max(...Object.values(houseCounts), 1);
              const percent = Math.round((count / maxVal) * 100);
              const houseColorClass = 
                house === 'Radhakrishnan' ? 'bg-rose-500' :
                house === 'Tagore' ? 'bg-amber-400' :
                house === 'Vivekanand' ? 'bg-blue-600' : 'bg-emerald-500';
              return (
                <div key={house} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-700">{house} House</span>
                    <span className="font-bold text-slate-900">{count} candidates</span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${percent}%` }}
                      className={`h-full ${houseColorClass} rounded-full transition-all duration-500`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Gender and Popularity (Ratio Layouts) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
              <PieChart className="w-4 h-4 text-emerald-500" />
              <h3 className="font-display font-bold text-slate-800 text-sm">Gender Representation</h3>
            </div>

            <div className="space-y-5">
              {/* Ratio graphic line */}
              <div className="space-y-2">
                <div className="h-5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                  <div style={{ width: `${boysPct}%` }} className="h-full bg-indigo-600 flex items-center justify-center text-[10px] text-white font-bold">{boysPct > 15 ? `${boysPct}%` : ''}</div>
                  <div style={{ width: `${girlsPct}%` }} className="h-full bg-pink-500 flex items-center justify-center text-[10px] text-white font-bold">{girlsPct > 15 ? `${girlsPct}%` : ''}</div>
                </div>
                <div className="flex justify-between text-xs font-sans">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                    <span className="text-slate-600">Boys ({boys})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-pink-50"></span>
                    <span className="text-slate-600">Girls ({girls})</span>
                  </div>
                </div>
              </div>

              {/* Competition extremes */}
              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
                <div className="bg-slate-50 border border-slate-150 rounded-xl p-3">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Most Contested</div>
                  <div className="text-xs font-bold text-slate-800 truncate mt-1">{mostPopularPost.title}</div>
                  <div className="text-xs text-indigo-600 font-bold mt-0.5">{mostPopularPost.count} applicants</div>
                </div>
                <div className="bg-slate-50 border border-slate-150 rounded-xl p-3">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Least Contested</div>
                  <div className="text-xs font-bold text-slate-800 truncate mt-1">{leastPopularPost.title}</div>
                  <div className="text-xs text-amber-600 font-bold mt-0.5">{leastPopularPost.count} applicants</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Dynamic Evaluation Criteria Impact */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h3 className="font-display font-bold text-slate-800 text-sm">Criteria Impact Averages</h3>
          </div>
          <div className="space-y-3.5">
            {criteriaAverages.map(item => {
              const fraction = item.max > 0 ? item.avg / item.max : 0;
              const percent = Math.round(fraction * 100);
              return (
                <div key={item.name} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-slate-600">{item.name}</span>
                    <span className="font-bold text-slate-900">{item.avg} <span className="text-slate-400 text-[10px]">/ {item.max}</span></span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${percent}%` }}
                      className="h-full bg-slate-800 rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grade Level Pool List */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <h3 className="font-display font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 mb-4">Class-wise Leadership Talent Pool</h3>
        <div className="flex flex-wrap gap-4 items-center justify-around">
          {Object.entries(classCounts).map(([cls, count]) => {
            const classNumber = parseInt(cls);
            const roman = 
              classNumber === 11 ? 'XI' :
              classNumber === 10 ? 'X' :
              classNumber === 9 ? 'IX' :
              classNumber === 8 ? 'VIII' :
              classNumber === 7 ? 'VII' :
              classNumber === 6 ? 'VI' :
              classNumber === 5 ? 'V' :
              classNumber === 4 ? 'IV' :
              classNumber === 3 ? 'III' :
              classNumber === 2 ? 'II' : 'I';
            return (
              <div key={cls} className="flex flex-col items-center bg-slate-50 border border-slate-200 px-5 py-3 rounded-xl min-w-[80px]">
                <div className="text-xs text-slate-400 font-bold tracking-widest uppercase">Class</div>
                <div className="text-xl font-display font-bold text-slate-800 mt-0.5">{roman}</div>
                <div className="text-xs bg-indigo-50 border border-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold mt-1.5">{count} {count === 1 ? 'App' : 'Apps'}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
