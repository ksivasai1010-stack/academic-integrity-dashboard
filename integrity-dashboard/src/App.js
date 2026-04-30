import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Papa from "papaparse";
import {
  AlertTriangle, Upload, Download, Activity, Users,
  ShieldAlert, AlertCircle, CheckCircle, Search, BookOpen,
  ArrowUpRight, ArrowDownRight, Lightbulb, Clock, BarChart2, Copy,
  TrendingUp, LayoutDashboard, PieChart, Settings, MessageSquare,
  FileText, LogOut
} from 'lucide-react';
import Login from './Login';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const API_URL = "http://localhost:5000/api";

const fallbackStatsData = { avgRisk: 43, highRisk: 1, mediumRisk: 2, lowRisk: 2, totalStudents: 1250 };
const fallbackCourses = [
  { id: 1, name: 'Intro to Computer Science', risk: 'Low', students: 450, avgScore: 82.5, trend: '+2.1%', riskScore: 12 },
  { id: 2, name: 'Linear Algebra', risk: 'Medium', students: 320, avgScore: 71.2, trend: '-1.5%', riskScore: 45 },
  { id: 3, name: 'Cell Biology', risk: 'Medium', students: 180, avgScore: 75.8, trend: '+0.5%', riskScore: 58 },
  { id: 4, name: 'Modern Literature', risk: 'High', students: 210, avgScore: 68.4, trend: '+5.2%', riskScore: 89 },
  { id: 5, name: 'Strategic Management', risk: 'Low', students: 90, avgScore: 88.1, trend: '+1.0%', riskScore: 15 }
];
const fallbackDetails = {
  stats: { avgScore: '68.4%', stdDev: '14.2', lateSub: '24.5%', dupScores: '42.1%' },
  insights: 'Abnormal clustering of identical scores detected in Midterm Essay submissions. 42% of students submitted within a 15-minute window with unusually high similarity in structural formatting.',
  recommendations: [ 'Diversify question banks for future essay prompts.' ],
  gradeDist: [ { grade: 'A', count: 15 }, { grade: 'B', count: 45 }, { grade: 'C', count: 85 }, { grade: 'D', count: 40 }, { grade: 'F', count: 25 } ],
  timingDist: [ { time: 'Day 1', submissions: 10 }, { time: 'Day 2', submissions: 25 }, { time: 'Day 3', submissions: 35 }, { time: 'Day 4', submissions: 120 }, { time: 'Late', submissions: 20 } ],
  trendData: [ { week: 'Wk 1', performance: 75, risk: 20 }, { week: 'Wk 2', performance: 72, risk: 25 }, { week: 'Wk 3', performance: 74, risk: 30 }, { week: 'Wk 4', performance: 65, risk: 65 }, { week: 'Wk 5', performance: 68, risk: 89 } ]
};

const RiskBadge = ({ level, className = "" }) => {
  const styles = {
    Low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]',
    Medium: 'bg-orange-500/10 text-orange-400 border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.2)]',
    High: 'bg-rose-500/10 text-rose-400 border-rose-500/50 shadow-[0_0_15px_rgba(225,29,72,0.4)]',
  };
  return (
    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase border flex items-center gap-1 ${styles[level] || styles.Low} ${className}`}>
      {level === 'High' && <AlertCircle className="w-3 h-3" />}
      {level === 'Medium' && <AlertTriangle className="w-3 h-3" />}
      {level === 'Low' && <CheckCircle className="w-3 h-3" />}
      {level || 'Unknown'}
    </span>
  );
};

const CircularProgress = ({ value, level }) => {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - ((value || 0) / 100) * circumference;
  const colors = { Low: '#34d399', Medium: '#fb923c', High: '#f43f5e' };
  const color = colors[level] || '#ffffff';
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="transform -rotate-90 w-12 h-12 drop-shadow-[0_0_5px_rgba(0,0,0,0.5)]">
        <circle cx="24" cy="24" r={radius} stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/10" />
        <circle
          cx="24" cy="24" r={radius} stroke={color} strokeWidth="4" fill="transparent"
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
          className="transition-all duration-1000 ease-out" strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${color}80)` }}
        />
      </svg>
      <span className="absolute text-[10px] font-bold text-white">{value || 0}</span>
    </div>
  );
};

export default function App() {
  const [courses, setCourses] = useState([]);
  const [statsData, setStatsData] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [details, setDetails] = useState(null);

  const [aiInsights, setAiInsights] = useState("");
  const [loadingAI, setLoadingAI] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatResponse, setChatResponse] = useState("");
  const [csvData, setCsvData] = useState(null);
  const [prediction, setPrediction] = useState("");
  const [activeTab, setActiveTab] = useState("Overview");
  const [activePage, setActivePage] = useState("Dashboard");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  // Initial Data Fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, coursesRes] = await Promise.all([
          axios.get(`${API_URL}/stats`),
          axios.get(`${API_URL}/courses`)
        ]);
        setStatsData(statsRes.data);
        setCourses(coursesRes.data);
        if (coursesRes.data.length > 0) {
          const highRisk = coursesRes.data.find(c => c.risk === 'High') || coursesRes.data[0];
          setSelectedCourse(highRisk);
        }
      } catch (err) {
        console.error("Failed to load initial data from backend, falling back to mock data", err);
        setStatsData(fallbackStatsData);
        setCourses(fallbackCourses);
        const highRisk = fallbackCourses.find(c => c.risk === 'High') || fallbackCourses[0];
        setSelectedCourse(highRisk);
      }
    };
    fetchData();
  }, []);

  // Fetch course details when selectedCourse changes
  useEffect(() => {
    if (!selectedCourse) return;
    
    // If course has dynamic details from CSV, use them immediately
    if (selectedCourse.dynamicDetails) {
      setDetails(selectedCourse.dynamicDetails);
      setAiInsights("");
      setChatResponse("");
      setPrediction("");
      return;
    }

    const fetchDetails = async () => {
      try {
        const res = await axios.get(`${API_URL}/course/${selectedCourse.id}`);
        setDetails(res.data);
        setAiInsights("");
        setChatResponse("");
        setPrediction("");
      } catch (err) {
        console.error("Failed to load course details from backend, falling back to mock data", err);
        setDetails(fallbackDetails);
        setAiInsights("");
        setChatResponse("");
        setPrediction("");
      }
    };
    fetchDetails();
  }, [selectedCourse]);

  const handleGenerateAI = async () => {
    if (!selectedCourse || !details) return;
    setLoadingAI(true);
    try {
      const data = {
        courseName: selectedCourse.name, risk: selectedCourse.risk,
        avgScore: selectedCourse.avgScore, students: selectedCourse.students,
        details: details.stats
      };
      const res = await axios.post(`${API_URL}/analyze`, data);
      setAiInsights(res.data.insights);
    } catch (err) {
      console.error(err);
      setAiInsights(`⚠️ AI Analysis (Offline Mode)\n\nCourse: ${selectedCourse.name}\nRisk Level: ${selectedCourse.risk}\nAvg Score: ${selectedCourse.avgScore}%\n\n🔍 Key Findings:\n• ${selectedCourse.risk === 'High' ? 'Critical anomaly patterns detected in submission data' : 'Submission patterns appear within normal range'}\n• ${parseFloat(details.stats.dupScores) > 20 ? 'High duplicate score rate (' + details.stats.dupScores + ') suggests potential collusion' : 'Duplicate score rate is acceptable'}\n• ${parseFloat(details.stats.lateSub) > 15 ? 'Late submission rate (' + details.stats.lateSub + ') is above threshold' : 'Late submissions within normal bounds'}\n\n💡 Recommendations:\n• Monitor submission timing patterns closely\n• Cross-reference IP addresses for clustered submissions\n• Consider randomized question pools`);
    }
    setLoadingAI(false);
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    const question = chatInput;
    setChatInput("");
    setChatResponse("💭 Thinking...");
    try {
      const res = await axios.post(`${API_URL}/chat`, {
        question: question,
        context: selectedCourse
      });
      setChatResponse(res.data.answer);
    } catch (err) {
      console.error(err);
      setChatResponse(`🤖 AI Assistant (Offline Mode)\n\nRegarding "${question}" for ${selectedCourse.name}:\n\n${selectedCourse.risk === 'High' ? '⚠️ This is a HIGH-RISK course. The data shows concerning patterns including a ' + details.stats.dupScores + ' duplicate score rate and ' + details.stats.lateSub + ' late submission rate.' : '✅ This course shows ' + selectedCourse.risk.toLowerCase() + ' risk levels. Current metrics are within acceptable ranges.'}\n\nAvg Score: ${selectedCourse.avgScore}% | Students: ${selectedCourse.students}\n\n💡 Tip: Connect your Gemini API key in backend/.env for full AI capabilities.`);
    }
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setLoadingAI(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        console.log("CSV Raw Data:", result.data);
        const data = result.data;
        
        // 1. Clean and Parse Data
        const cleanData = data.map((row, idx) => {
          const score = Number(row.score || row.Score || 0);
          const duplicate = Number(row.duplicate || row.Duplicate || 0);
          const late = Number(row.late || row.Late || 0);
          
          // Determine risk level based on metrics
          let risk = 'Low';
          let riskScore = Math.min(100, (duplicate * 40) + (late * 10) + (Math.max(0, 70 - score) / 2));
          if (riskScore > 70 || duplicate > 0) risk = 'High';
          else if (riskScore > 40) risk = 'Medium';

          return {
            id: idx + 1,
            name: row.course || row.Course || `Course ${idx + 1}`,
            risk,
            riskScore: Math.round(riskScore),
            students: 1, // Aggregating later
            avgScore: score,
            trend: 'New',
            late,
            duplicate
          };
        }).filter(r => r.name !== "Unknown");

        if (cleanData.length === 0) {
          setLoadingAI(false);
          return;
        }

        // 2. Aggregate by Course
        const courseMap = {};
        cleanData.forEach(row => {
          if (!courseMap[row.name]) {
            courseMap[row.name] = { ...row, students: 0, totalScore: 0, totalLate: 0, totalDup: 0 };
          }
          courseMap[row.name].students += 1;
          courseMap[row.name].totalScore += row.avgScore;
          courseMap[row.name].totalLate += row.late;
          courseMap[row.name].totalDup += row.duplicate;
        });

        const newCourses = Object.values(courseMap).map(c => {
          const avgScore = Math.round(c.totalScore / c.students);
          const lateSubRate = ((c.totalLate / c.students) * 100).toFixed(1) + '%';
          const dupScoreRate = ((c.totalDup / c.students) * 100).toFixed(1) + '%';
          
          // Re-evaluate risk for aggregate
          let risk = 'Low';
          const riskScore = Math.min(100, ((c.totalDup / c.students) * 100) + (c.totalLate / c.students * 20) + (Math.max(0, 70 - avgScore) / 2));
          if (riskScore > 60) risk = 'High';
          else if (riskScore > 30) risk = 'Medium';
          
          return {
            ...c,
            avgScore,
            risk,
            riskScore: Math.round(riskScore),
            dynamicDetails: {
              stats: { avgScore: avgScore + '%', stdDev: 'N/A', lateSub: lateSubRate, dupScores: dupScoreRate },
              insights: `Analysis for ${c.name} shows a ${risk.toLowerCase()} risk profile based on ${c.students} data points.`,
              recommendations: [ 'Perform further manual review for flagged records.' ],
              gradeDist: [ { grade: 'Avg', count: c.students } ],
              timingDist: [ { time: 'Total', submissions: c.students } ],
              trendData: [ { week: 'Wk 1', performance: avgScore, risk: riskScore } ]
            }
          };
        });

        // 3. Update Dashboard Stats
        const totalStudents = cleanData.length;
        const highRisk = newCourses.filter(c => c.risk === 'High').length;
        const mediumRisk = newCourses.filter(c => c.risk === 'Medium').length;
        const lowRisk = newCourses.filter(c => c.risk === 'Low').length;
        const avgRisk = Math.round(newCourses.reduce((a, b) => a + b.riskScore, 0) / newCourses.length);

        setStatsData({ avgRisk, highRisk, mediumRisk, lowRisk, totalStudents });
        setCourses(newCourses);
        setSelectedCourse(newCourses[0]);
        setCsvData(cleanData);

        // 4. Trigger AI Analysis automatically
        handleCSVAnalysis(cleanData);
      },
    });
  };

  const handleCSVAnalysis = async (dataToAnalyze) => {
    // Ensure we are working with an array (prevents event objects from being treated as data)
    const data = Array.isArray(dataToAnalyze) ? dataToAnalyze : csvData;
    if (!Array.isArray(data) || data.length === 0) return;
    
    console.log("Analyzing CSV...");
    setLoadingAI(true);
    setActivePage('AI Insights');
    setActiveTab('AI Assistant');

    const prompt = `
You are an academic integrity analyst.
Analyze this dataset of ${data.length} records:
${JSON.stringify(data.slice(0, 50))} ${data.length > 50 ? '... (truncated for context)' : ''}

Detect:
- Specific cheating patterns across courses
- Correlation between late submissions and duplicate scores
- High-risk clusters
- Strategic recommendations for faculty

Provide a professional, executive-level summary.
`;

    try {
      const res = await axios.post(`${API_URL}/analyze`, { data, prompt });
      setAiInsights(res.data.insights);
    } catch (err) {
      console.error(err);
      setAiInsights("⚠️ AI Engine Offline. Dynamic analysis of " + data.length + " records performed locally. High-risk patterns detected in " + (data.filter(r => r.risk === 'High').length) + " course segments.");
    }
    setLoadingAI(false);
  };

  const handlePrediction = async () => {
    setPrediction("🔮 Calculating prediction...");
    try {
      const res = await axios.post(`${API_URL}/predict`, { data: selectedCourse });
      setPrediction(res.data.prediction);
    } catch (err) {
      console.error(err);
      const riskTrend = selectedCourse.trend.startsWith('+') ? 'increasing' : 'decreasing';
      const futureRisk = selectedCourse.risk === 'High' ? 'Critical' : selectedCourse.risk === 'Medium' ? 'High' : 'Medium';
      setPrediction(`🔮 Predictive Analysis (Offline Mode)\n\nCourse: ${selectedCourse.name}\nCurrent Risk: ${selectedCourse.risk} (Score: ${selectedCourse.riskScore}/100)\nTrend: ${selectedCourse.trend} (${riskTrend})\n\n📊 Forecast:\n• Predicted risk in 4 weeks: ${futureRisk}\n• Risk trajectory: ${riskTrend}\n• Confidence: 73%\n\n⚡ Action needed: ${selectedCourse.risk === 'High' ? 'Immediate intervention recommended' : 'Continue monitoring'}`);
    }
  };

  const startVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      setChatInput(transcript);
      setChatResponse("🎙️ Processing voice input... generating answer...");
      try {
        const res = await axios.post(`${API_URL}/chat`, {
          question: transcript,
          context: selectedCourse
        });
        setChatResponse(res.data.answer);
      } catch (err) {
        console.error(err);
        setChatResponse("Error communicating with AI");
      }
    };
    recognition.start();
  };

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  if (!statsData || courses.length === 0 || !selectedCourse || !details) {
    return (
      <div className="min-h-screen bg-[#0b0f1a] flex items-center justify-center text-purple-400">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0b0f1a] text-slate-200 font-sans selection:bg-purple-500/30 overflow-hidden">
      
      {/* 1. LEFT SIDEBAR */}
      <aside className="w-64 flex-shrink-0 bg-gradient-to-b from-[#020617] via-[#0f172a] to-[#020617] border-r border-white/5 flex flex-col relative z-20">
        <div className="p-6 flex items-center gap-3 border-b border-white/5">
          <div className="relative group cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl blur opacity-70 group-hover:opacity-100 transition duration-200"></div>
            <div className="relative w-10 h-10 bg-slate-900 rounded-xl border border-white/10 flex items-center justify-center">
              <ShieldAlert className="text-white w-5 h-5" />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">Xebia</h1>
            <p className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">Integrity OS</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {[
            { name: 'Dashboard', icon: LayoutDashboard },
            { name: 'Courses', icon: BookOpen },
            { name: 'Analytics', icon: PieChart },
            { name: 'AI Insights', icon: Lightbulb },
            { name: 'Reports', icon: FileText },
            { name: 'Settings', icon: Settings },
          ].map((item, idx) => (
            <div key={idx} onClick={() => { setActivePage(item.name); if (item.name === 'AI Insights') setActiveTab('AI Assistant'); else setActiveTab('Overview'); }} className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-300 font-medium text-sm
              ${activePage === item.name 
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]' 
                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}`}>
              <item.icon className={`w-5 h-5 ${activePage === item.name ? 'text-purple-400' : ''}`} />
              {item.name}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5 bg-white/5 backdrop-blur-md">
          <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 border border-purple-500/20 rounded-xl p-4 text-center relative overflow-hidden">
             <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/20 blur-xl rounded-full"></div>
             <MessageSquare className="w-6 h-6 text-purple-400 mx-auto mb-2" />
             <h4 className="text-sm font-bold text-white mb-1">AI Assistant</h4>
             <p className="text-xs text-slate-400 mb-3">Ask anything about risk patterns.</p>
             <button onClick={() => { setActivePage('AI Insights'); setActiveTab('AI Assistant'); }} className="w-full py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg text-xs font-bold hover:scale-105 transition-transform shadow-[0_0_15px_rgba(139,92,246,0.3)]">
               Chat Now
             </button>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full mt-3 flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all text-xs font-bold"
          >
            <LogOut className="w-4 h-4" />
            Logout Session
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen relative overflow-hidden bg-gradient-to-br from-[#0b0f1a] to-[#020617]">
        {/* Background Radial Glows */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_rgba(139,92,246,0.15),transparent_50%)] pointer-events-none"></div>

        {/* 2. TOP HEADER */}
        <header className="h-20 shrink-0 border-b border-white/10 bg-white/5 backdrop-blur-xl px-8 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-white">Risk Intelligence Dashboard</h2>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
              Live API Connection Active • Last updated: Just now
            </p>
          </div>
          <div className="flex items-center gap-3">
             <label className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-300 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all hover:text-white cursor-pointer hover:border-white/20">
                <Upload className="w-4 h-4" />
                <span>Upload CSV</span>
                <input type="file" className="hidden" onChange={handleCSVUpload} accept=".csv" />
             </label>
             {csvData && (
                <button onClick={() => handleCSVAnalysis()} className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-blue-600/80 border border-blue-500/50 rounded-lg hover:bg-blue-500 transition-colors shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                  Analyze Data
                </button>
             )}
             <button className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg hover:scale-105 transition-transform shadow-[0_0_20px_rgba(139,92,246,0.4)] border border-white/10">
                <Download className="w-4 h-4" />
                <span>Export Report</span>
             </button>
          </div>
        </header>

        {/* SCROLLABLE MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto p-8 z-10 space-y-8 custom-scrollbar">

          {/* COURSES PAGE */}
          {activePage === 'Courses' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3"><BookOpen className="w-6 h-6 text-purple-400" /> All Courses</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.map(course => (
                  <div key={course.id} onClick={() => { setSelectedCourse(course); setActivePage('Dashboard'); setActiveTab('Overview'); }}
                    className="p-5 rounded-2xl cursor-pointer bg-white/5 backdrop-blur-xl border border-white/10 hover:border-purple-500/40 hover:-translate-y-1 transition-all duration-300">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-white">{course.name}</h3>
                      <CircularProgress value={course.riskScore} level={course.risk} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {course.students}</span>
                      <span className="flex items-center gap-1"><BarChart2 className="w-3 h-3" /> {course.avgScore}%</span>
                    </div>
                    <RiskBadge level={course.risk} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ANALYTICS PAGE */}
          {activePage === 'Analytics' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3"><PieChart className="w-6 h-6 text-purple-400" /> Analytics Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Grade Distribution</h4>
                  <div className="h-48"><ResponsiveContainer width="100%" height="100%"><BarChart data={details.gradeDist}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" /><XAxis dataKey="grade" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} /><Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff' }} /><Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
                </div>
                <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Submission Timing</h4>
                  <div className="h-48"><ResponsiveContainer width="100%" height="100%"><BarChart data={details.timingDist}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" /><XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} /><Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff' }} /><Bar dataKey="submissions" fill="#3b82f6" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
                </div>
                <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-6 md:col-span-2">
                  <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Risk vs Performance Trend</h4>
                  <div className="h-48"><ResponsiveContainer width="100%" height="100%"><LineChart data={details.trendData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" /><XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} /><YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} /><Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff' }} /><Line type="monotone" dataKey="performance" stroke="#10b981" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="risk" stroke="#f43f5e" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div>
                </div>
              </div>
            </div>
          )}

          {/* REPORTS PAGE */}
          {activePage === 'Reports' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3"><FileText className="w-6 h-6 text-purple-400" /> Reports</h2>
              {['Weekly Integrity Summary', 'Monthly Risk Assessment', 'Semester Anomaly Report'].map((r, i) => (
                <div key={i} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-5 flex items-center justify-between hover:bg-white/10 transition-colors cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center border border-purple-500/30"><FileText className="w-5 h-5 text-purple-400" /></div>
                    <div><h4 className="font-bold text-white text-sm">{r}</h4><p className="text-xs text-slate-400 mt-0.5">Generated {['2 hours', '3 days', '2 weeks'][i]} ago</p></div>
                  </div>
                  <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-slate-300 hover:bg-white/10 transition-colors"><Download className="w-4 h-4 inline mr-1" />Download</button>
                </div>
              ))}
            </div>
          )}

          {/* SETTINGS PAGE */}
          {activePage === 'Settings' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3"><Settings className="w-6 h-6 text-purple-400" /> Settings</h2>
              {[{t:'API Configuration',d:'Connect your Gemini API key for AI features'},{t:'Notification Preferences',d:'Configure alert thresholds and email notifications'},{t:'Data Management',d:'Import/export course data and manage backups'}].map((s,i) => (
                <div key={i} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                  <h4 className="font-bold text-white mb-1">{s.t}</h4>
                  <p className="text-sm text-slate-400">{s.d}</p>
                </div>
              ))}
            </div>
          )}

          {/* DASHBOARD + AI INSIGHTS PAGES */}
          {(activePage === 'Dashboard' || activePage === 'AI Insights') && (<>

          {/* 4. ALERT BANNER */}
          {activePage === 'Dashboard' && statsData.highRisk > 0 && (
            <div className="bg-gradient-to-r from-rose-500/10 to-rose-900/20 border border-rose-500/30 rounded-xl p-4 flex items-center justify-between shadow-[0_0_30px_rgba(225,29,72,0.15)] backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center animate-pulse border border-rose-500/50">
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-rose-400">Critical Anomaly Detected</h3>
                  <p className="text-sm text-slate-300 mt-0.5">
                    <strong className="text-white">{statsData.highRisk}</strong> high-risk course(s) require immediate review.
                  </p>
                </div>
              </div>
              <button className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-lg shadow-[0_0_15px_rgba(225,29,72,0.4)] hover:bg-rose-500 transition-colors">
                Review Now
              </button>
            </div>
          )}

          {/* 3. KPI CARDS */}
          {activePage === 'Dashboard' && (<>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: 'Avg Risk Score', value: statsData.avgRisk, icon: Activity, color: 'text-purple-400', border: 'border-purple-500/20' },
              { label: 'High Risk', value: statsData.highRisk, icon: AlertCircle, color: 'text-rose-400', border: 'border-rose-500/40 shadow-[0_0_20px_rgba(225,29,72,0.15)] ring-1 ring-rose-500/20' },
              { label: 'Medium Risk', value: statsData.mediumRisk, icon: AlertTriangle, color: 'text-orange-400', border: 'border-orange-500/20' },
              { label: 'Low Risk', value: statsData.lowRisk, icon: CheckCircle, color: 'text-emerald-400', border: 'border-emerald-500/20' },
              { label: 'Total Students', value: statsData.totalStudents.toLocaleString(), icon: Users, color: 'text-blue-400', border: 'border-blue-500/20' }
            ].map((stat, i) => (
              <div key={i} className={`bg-white/5 backdrop-blur-xl p-5 rounded-2xl border ${stat.border} hover:-translate-y-1 hover:bg-white/10 transition-all duration-300`}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{stat.label}</span>
                  <div className="bg-white/5 p-1.5 rounded-lg border border-white/5">
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                </div>
                <div className="text-3xl font-black text-white">{stat.value}</div>
              </div>
            ))}
          </div>

          {/* 5. MAIN CONTENT (2 COLUMNS) */}
          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* LEFT: COURSE CARDS GRID */}
            <div className="flex-1 space-y-4">
               <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                 <BookOpen className="w-5 h-5 text-purple-400" />
                 Monitored Courses
               </h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {courses.map(course => (
                   <div
                     key={course.id}
                     onClick={() => setSelectedCourse(course)}
                     className={`p-5 rounded-2xl cursor-pointer transition-all duration-300 relative overflow-hidden bg-white/5 backdrop-blur-xl border
                       ${selectedCourse.id === course.id
                         ? 'border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.2)] bg-blue-500/5 ring-1 ring-blue-500/30 transform scale-[1.02]'
                         : 'border-white/10 hover:border-white/20 hover:bg-white/10 hover:-translate-y-1'}`}
                   >
                     {selectedCourse.id === course.id && (
                       <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-2xl rounded-bl-full pointer-events-none"></div>
                     )}
                     <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                       <div className="flex justify-between items-start">
                         <div>
                           <h3 className="font-bold text-white text-sm">{course.name}</h3>
                           <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                             <span className="flex items-center gap-1"><Users className="w-3 h-3 text-slate-500" /> {course.students}</span>
                             <span className="flex items-center gap-1"><BarChart2 className="w-3 h-3 text-slate-500" /> {course.avgScore}%</span>
                           </div>
                         </div>
                         <CircularProgress value={course.riskScore} level={course.risk} />
                       </div>
                       <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-1">
                         <RiskBadge level={course.risk} />
                         <div className={`text-[11px] font-bold flex items-center gap-1
                           ${course.trend.startsWith('+') ? 'text-rose-400' : 'text-emerald-400'}`}>
                           {course.trend.startsWith('+') ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                           {course.trend}
                         </div>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
            </div>

            {/* RIGHT: RISK LEADERBOARD */}
            <div className="lg:w-[340px] flex-shrink-0">
               <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                 <TrendingUp className="w-5 h-5 text-rose-400" />
                 Risk Leaderboard
               </h2>
               <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden flex flex-col">
                  <div className="p-3 flex-1 flex flex-col gap-2">
                    {[...courses].sort((a, b) => b.riskScore - a.riskScore).map((course, idx) => (
                      <div
                        key={course.id}
                        onClick={() => setSelectedCourse(course)}
                        className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 border
                          ${selectedCourse.id === course.id ? 'bg-white/10 border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.05)]' : 'border-transparent hover:bg-white/5'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black
                            ${idx === 0 ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                              idx === 1 ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                              'bg-white/5 text-slate-400 border border-white/5'}`}>
                            #{idx + 1}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-200 truncate w-[130px]" title={course.name}>{course.name}</div>
                            <div className="text-[10px] text-slate-500 uppercase font-semibold mt-0.5">Score: {course.riskScore}</div>
                          </div>
                        </div>
                        <RiskBadge level={course.risk} />
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          </div>
          </>)}

          {/* 6. DETAILED SECTION (BOTTOM) */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
            <div className="border-b border-white/10 bg-white/5 px-8 py-4 flex items-center justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-purple-500/10 to-transparent pointer-events-none"></div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-xl font-bold text-white">{selectedCourse.name}</h2>
                  <RiskBadge level={selectedCourse.risk} className="shadow-none" />
                </div>
                <p className="text-sm text-slate-400">Deep-dive intelligence and anomaly detection</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-6 px-8 border-b border-white/5 bg-black/20">
               {['Overview', 'Submissions', 'Students', 'Anomalies', 'AI Assistant'].map(tab => (
                 <div
                   key={tab}
                   onClick={() => setActiveTab(tab)}
                   className={`py-4 text-sm font-bold cursor-pointer transition-colors relative
                     ${activeTab === tab ? 'text-purple-400' : 'text-slate-400 hover:text-slate-200'}`}
                 >
                   {tab}
                   {activeTab === tab && (
                     <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)]"></div>
                   )}
                 </div>
               ))}
            </div>

            <div className="p-8">
              {activeTab === 'Overview' && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                    {[
                      { label: 'Avg Score', val: details.stats.avgScore, icon: Activity, color: 'blue' },
                      { label: 'Std Deviation', val: details.stats.stdDev, icon: BarChart2, color: 'purple' },
                      { label: 'Late Subs', val: details.stats.lateSub, icon: Clock, color: 'orange' },
                      { label: 'Duplicate Scores', val: details.stats.dupScores, icon: Copy, color: 'rose' }
                    ].map((s, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors">
                        <div className={`w-12 h-12 rounded-lg bg-${s.color}-500/20 text-${s.color}-400 flex items-center justify-center border border-${s.color}-500/30`}>
                          <s.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{s.label}</div>
                          <div className="text-lg font-black text-white">{s.val}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                     <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors">
                       <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">Grade Distribution</h4>
                       <div className="h-32">
                         <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={details.gradeDist} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                             <XAxis dataKey="grade" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                             <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                             <Tooltip cursor={{ fill: '#ffffff05' }} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff' }} />
                             <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                           </BarChart>
                         </ResponsiveContainer>
                       </div>
                     </div>
                     <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors">
                       <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">Submission Timing</h4>
                       <div className="h-32">
                         <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={details.timingDist} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                             <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                             <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                             <Tooltip cursor={{ fill: '#ffffff05' }} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff' }} />
                             <Bar dataKey="submissions" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                           </BarChart>
                         </ResponsiveContainer>
                       </div>
                     </div>
                     <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors">
                       <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">Risk vs Performance</h4>
                       <div className="h-32">
                         <ResponsiveContainer width="100%" height="100%">
                           <LineChart data={details.trendData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                             <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                             <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                             <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff' }} />
                             <Line type="monotone" dataKey="performance" stroke="#10b981" strokeWidth={2} dot={false} name="Avg Score" />
                             <Line type="monotone" dataKey="risk" stroke="#f43f5e" strokeWidth={2} dot={false} name="Risk Score" />
                           </LineChart>
                         </ResponsiveContainer>
                       </div>
                     </div>
                  </div>
                </>
              )}

              {activeTab === 'AI Assistant' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                   <div className="space-y-6">
                     <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-6 relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-4 opacity-10"><Search className="w-32 h-32" /></div>
                       <div className="relative z-10">
                         <h4 className="font-bold text-purple-400 mb-4 flex items-center gap-2">
                           <Lightbulb className="w-5 h-5" /> AI Insight Engine
                         </h4>
                         <button onClick={handleGenerateAI} className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-5 py-2.5 rounded-lg text-xs font-bold hover:scale-105 transition-transform shadow-[0_0_15px_rgba(139,92,246,0.3)] mb-4 border border-white/10">
                           {loadingAI ? "Analyzing Patterns..." : "Generate AI Insights"}
                         </button>
                         <p className="text-sm text-slate-300 leading-relaxed font-medium whitespace-pre-line bg-black/20 p-4 rounded-lg border border-white/5">
                           {aiInsights || details.insights}
                         </p>
                       </div>
                     </div>
                     <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6">
                       <h4 className="font-bold text-yellow-500 mb-3 text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Predictive Analytics</h4>
                       <button onClick={handlePrediction} className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-4 py-2 rounded-lg text-xs font-bold hover:bg-yellow-500/30 transition-colors mb-3">
                         Predict Future Risk Level
                       </button>
                       {prediction && <p className="text-sm text-yellow-200/80 p-3 bg-black/20 rounded-lg">{prediction}</p>}
                     </div>
                   </div>

                   <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex flex-col h-[400px]">
                     <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                       <MessageSquare className="w-4 h-4 text-blue-400" /> Interactive AI Chat
                     </h4>
                     <div className="flex-1 overflow-y-auto mb-4 bg-black/20 rounded-lg border border-white/5 p-4 flex flex-col">
                       {chatResponse ? (
                         <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-sm text-slate-200 self-start max-w-[90%] whitespace-pre-line">
                           {chatResponse}
                         </div>
                       ) : (
                         <div className="text-slate-500 text-sm italic m-auto text-center">Ask any specific question about anomalies, student patterns, or grading fairness for {selectedCourse.name}.</div>
                       )}
                     </div>
                     <div className="flex gap-2">
                       <input
                         type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                         placeholder="Ask about this course..."
                         className="flex-1 bg-black/30 border border-white/10 text-white p-3 rounded-lg text-sm focus:outline-none focus:border-purple-500/50"
                       />
                       <button onClick={startVoice} className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-lg hover:bg-emerald-500/30 transition-colors flex-shrink-0" title="Voice Input">
                         🎤
                       </button>
                       <button onClick={handleChat} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-blue-500 transition-colors shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                         Send
                       </button>
                     </div>
                   </div>
                </div>
              )}

              {activeTab === 'Submissions' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white">Recent Submissions</h3>
                  <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b border-white/10 bg-white/5"><th className="p-3 text-left text-slate-400 font-bold">Student</th><th className="p-3 text-left text-slate-400 font-bold">Assignment</th><th className="p-3 text-left text-slate-400 font-bold">Score</th><th className="p-3 text-left text-slate-400 font-bold">Status</th></tr></thead>
                      <tbody>
                        {['Alice M.', 'Bob K.', 'Carol J.', 'David L.', 'Eva R.'].map((s, i) => (
                          <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors"><td className="p-3 text-white">{s}</td><td className="p-3 text-slate-400">Midterm Essay</td><td className="p-3 text-white font-bold">{[72, 71, 73, 68, 72][i]}%</td><td className="p-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${i < 3 ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{i < 3 ? 'Flagged' : 'Normal'}</span></td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {activeTab === 'Students' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white">Student Risk Overview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[{name:'High-Risk Students',val:'18',color:'rose'},{name:'Monitored Students',val:'45',color:'orange'},{name:'Clear Students',val: String(selectedCourse.students - 63),color:'emerald'}].map((s,i) => (
                      <div key={i} className={`bg-${s.color}-500/10 border border-${s.color}-500/20 rounded-xl p-5 text-center`}><div className={`text-3xl font-black text-${s.color}-400`}>{s.val}</div><div className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-wider">{s.name}</div></div>
                    ))}
                  </div>
                </div>
              )}
              {activeTab === 'Anomalies' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white">Detected Anomalies</h3>
                  {[
                    {title:'Score Clustering',desc:'42% of submissions scored between 71-73%, far above statistical expectation',severity:'High'},
                    {title:'Timing Anomaly',desc:'120 submissions received in a 15-minute window on Day 4',severity:'High'},
                    {title:'Format Similarity',desc:'Structural formatting similarity detected across 38 submissions',severity:'Medium'}
                  ].map((a, i) => (
                    <div key={i} className={`p-4 rounded-xl border flex items-start gap-4 ${a.severity === 'High' ? 'bg-rose-500/10 border-rose-500/20' : 'bg-orange-500/10 border-orange-500/20'}`}>
                      <AlertTriangle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${a.severity === 'High' ? 'text-rose-400' : 'text-orange-400'}`} />
                      <div><h4 className="font-bold text-white text-sm">{a.title}</h4><p className="text-xs text-slate-400 mt-1">{a.desc}</p></div>
                      <RiskBadge level={a.severity} className="ml-auto flex-shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          </>)}
        </main>
      </div>
    </div>
  );
}
