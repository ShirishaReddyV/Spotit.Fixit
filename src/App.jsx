/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { Camera, MapPin, Send, ShieldCheck, Fingerprint, Sparkles, User, Lock, Phone, LayoutList, PlusCircle, CheckCircle, Clock, XCircle, BarChart3, Activity, UploadCloud, ArrowRight, Building2, UserPlus, LogIn, ChevronLeft, Map, AlertOctagon, TrendingDown, AlertTriangle, ShieldAlert, Navigation, ChevronUp, ChevronDown } from 'lucide-react';
import { AI_SERVICE, CORE_SERVICE, AUTH_SERVICE } from './services/api';
import { MapContainer, TileLayer, Circle, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } };
const stagger = { show: { transition: { staggerChildren: 0.08 } } };
const PAGE_TRANSITION = { initial: { opacity: 0, scale: 0.97, y: 12 }, animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }, exit: { opacity: 0, scale: 0.97, y: -12, transition: { duration: 0.22, ease: 'easeIn' } } };

const fontStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
  .font-syne { font-family: 'Syne', sans-serif; }
  .font-dm { font-family: 'DM Sans', sans-serif; }
  .hide-scrollbar::-webkit-scrollbar { display: none; }
  .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  @keyframes gridPan { 0% { background-position: 0 0; } 100% { background-position: 40px 40px; } }
  @keyframes orbitGlow { 0%,100% { transform: scale(1); opacity: 0.3; } 50% { transform: scale(1.18); opacity: 0.55; } }
  @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
  @keyframes floatY { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
  @keyframes scanLine { 0% { top: -2px; } 100% { top: 100%; } }
  @keyframes ripple { 0% { transform: scale(0.8); opacity: 0.8; } 100% { transform: scale(2.2); opacity: 0; } }
  .anim-grid { animation: gridPan 6s linear infinite; }
  .anim-orbit { animation: orbitGlow 3s ease-in-out infinite; }
  .anim-float { animation: floatY 4s ease-in-out infinite; }
  .anim-shimmer { background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%); background-size: 200% 100%; animation: shimmer 2.2s linear infinite; }
  .issue-card-hover { transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s ease; }
  .issue-card-hover:hover { transform: translateY(-3px) scale(1.02); box-shadow: 0 8px 32px rgba(249,115,22,0.12); }
  .btn-glow-orange:hover { box-shadow: 0 0 20px rgba(249,115,22,0.35); }
  .btn-glow-emerald:hover { box-shadow: 0 0 20px rgba(16,185,129,0.35); }
  .nav-fab { box-shadow: 0 0 0 0 rgba(249,115,22,0.4); animation: ripple 1.8s ease-out infinite; }
`;

// Haversine distance in km between two GPS coords
const haversineKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Helper to generate consistent mock votes based on Issue ID
const getBaseVotes = (id) => {
  if (!id) return 12;
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash % 150) + 5;
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('landing');
  const [selectedRole, setSelectedRole] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // GLOBAL STATE FOR VOTES — persisted to localStorage so votes survive refresh
  const [userVotes, setUserVotes] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sf_votes') || '{}'); } catch { return {}; }
  });
  useEffect(() => {
    localStorage.setItem('sf_votes', JSON.stringify(userVotes));
  }, [userVotes]);

  const navigateToAuth = (role) => { setSelectedRole(role); setCurrentScreen('auth'); };
  const handleLoginSuccess = (userData) => { setCurrentUser(userData); setCurrentScreen(selectedRole === 'admin' ? 'admin' : 'citizen'); };
  const handleLogout = () => { setCurrentScreen('landing'); setSelectedRole(null); setCurrentUser(null); };

  const handleVote = async (issueId, value) => {
    setUserVotes(prev => ({
      ...prev,
      [issueId]: prev[issueId] === value ? 0 : value
    }));
    if (value === 1) {
      await CORE_SERVICE.upvoteIssue(issueId, currentUser?.username);
    }
  };

  return (
    <div className="min-h-screen bg-[#050B14] text-slate-200 font-dm overflow-hidden relative flex justify-center items-center selection:bg-orange-500/30 px-0 sm:px-4">
      <style>{fontStyles}</style>
      {/* Ambient background orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-orange-500/5 blur-3xl anim-orbit" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-emerald-500/5 blur-3xl anim-orbit" style={{ animationDelay: '1.5s' }} />
      </div>
      <div className="w-full max-w-[480px] sm:max-w-md lg:max-w-5xl relative z-10 flex flex-col h-[100dvh] sm:h-[90vh] sm:my-8 sm:rounded-[2rem] sm:border border-slate-800/80 bg-[#0a0c10] shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden">
        <AnimatePresence mode="wait">
          {currentScreen === 'landing' && <LandingScreen key="landing" onSelectRole={navigateToAuth} />}
          {currentScreen === 'auth' && <AuthScreen key="auth" role={selectedRole} onBack={() => setCurrentScreen('landing')} onLogin={handleLoginSuccess} />}
          {currentScreen === 'citizen' && <CitizenApp key="citizen" currentUser={currentUser} onLogout={handleLogout} userVotes={userVotes} handleVote={handleVote} />}
          {currentScreen === 'admin' && <AdminApp key="admin" currentUser={currentUser} onLogout={handleLogout} userVotes={userVotes} handleVote={handleVote} />}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ==========================================
// 1. AUTHENTICATION & LANDING
// ==========================================
function LandingScreen({ onSelectRole }) {
  return (
    <motion.div {...PAGE_TRANSITION} className="flex-1 flex flex-col justify-center p-8 bg-[#0f1117] relative overflow-hidden">
      {/* Animated dot-grid background */}
      <div className="absolute inset-0 anim-grid opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
      {/* Scan line */}
      <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent pointer-events-none" style={{ animation: 'scanLine 6s linear infinite', top: 0 }} />

      <motion.div variants={stagger} initial="hidden" animate="show" className="text-center mb-12">
        <motion.div variants={fadeUp} className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-[#0a0c10] border border-orange-500/25 mb-6 shadow-[0_0_30px_rgba(249,115,22,0.15)] relative">
          <ShieldCheck className="text-orange-500" size={36} />
          <div className="absolute inset-0 rounded-3xl border border-orange-500/10 anim-orbit" />
        </motion.div>
        <motion.h1 variants={fadeUp} className="text-4xl font-syne font-extrabold text-white leading-tight">
          Spot it. Report it.<br /><span className="text-orange-500">Fix it.</span>
        </motion.h1>
        <motion.p variants={fadeUp} className="text-slate-500 text-sm mt-4 tracking-wide">Bengaluru Civic Management Platform</motion.p>
      </motion.div>

      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
        <motion.button variants={fadeUp} onClick={() => onSelectRole('citizen')}
          whileHover={{ scale: 1.015, borderColor: 'rgba(249,115,22,0.5)' }}
          whileTap={{ scale: 0.98 }}
          className="w-full group rounded-2xl border border-slate-800 bg-gradient-to-r from-[#0d0f14] to-[#0a0c10] p-6 text-left transition-all flex items-center btn-glow-orange">
          <div className="bg-orange-500/15 w-13 h-12 w-12 rounded-xl flex items-center justify-center mr-4 group-hover:bg-orange-500/25 transition-colors">
            <User className="text-orange-400" size={22} />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-syne font-bold text-white">Citizen Access</h2>
            <p className="text-xs text-slate-400 mt-0.5">Report issues and track resolutions</p>
          </div>
          <ArrowRight size={16} className="text-slate-600 group-hover:text-orange-400 group-hover:translate-x-1 transition-all" />
        </motion.button>

        <motion.button variants={fadeUp} onClick={() => onSelectRole('admin')}
          whileHover={{ scale: 1.015, borderColor: 'rgba(16,185,129,0.5)' }}
          whileTap={{ scale: 0.98 }}
          className="w-full group rounded-2xl border border-slate-800 bg-gradient-to-r from-[#0d0f14] to-[#0a0c10] p-6 text-left transition-all flex items-center btn-glow-emerald">
          <div className="bg-emerald-500/15 w-12 h-12 rounded-xl flex items-center justify-center mr-4 group-hover:bg-emerald-500/25 transition-colors">
            <Building2 className="text-emerald-400" size={22} />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-syne font-bold text-white">HQ Command</h2>
            <p className="text-xs text-slate-400 mt-0.5">Municipal dashboard and auditing</p>
          </div>
          <ArrowRight size={16} className="text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
        </motion.button>

        <motion.p variants={fadeUp} className="text-center text-[10px] text-slate-700 pt-4 uppercase tracking-widest font-bold">
          Secured · AI-Powered · Privacy-First
        </motion.p>
      </motion.div>
    </motion.div>
  );
}

function AuthScreen({ role, onBack, onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ username: '', email: '', password: '', aadhaar: '', department: '' });
  const [isChecking, setIsChecking] = useState(false);
  const isAdmin = role === 'admin';
  const themeColor = isAdmin ? 'emerald' : 'orange';

  const submit = async () => {
    if (formData.username.length < 4 || formData.password.length < 6) return alert(`Valid ID & 6-char password required.`);
    if (isRegister && !formData.email.includes('@')) return alert(`Valid email required for confirmation notifications.`);
    if (isRegister && !isAdmin && formData.aadhaar.length < 12) return alert(`12-digit Aadhaar required for Citizens.`);
    if (isRegister && isAdmin && !formData.department) return alert(`Select Department clearance.`);

    setIsChecking(true);
    const currentRole = isAdmin ? 'admin' : 'citizen';

    if (isRegister) {
      const payload = { ...formData, role: currentRole, departmentAccess: isAdmin ? formData.department : "NONE" };
      const result = await AUTH_SERVICE.register(payload);
      if (result.success) onLogin(result.data); else alert(`ERROR: ${result.error}`);
    } else {
      const result = await AUTH_SERVICE.login(formData.username, formData.password, currentRole);
      if (result.success) onLogin(result.data);
      else { result.error.includes("not found") ? setIsRegister(true) : alert(`DENIED: ${result.error}`); }
    }
    setIsChecking(false);
  };

  const accent = isAdmin ? { border: 'rgba(16,185,129,0.4)', glow: 'rgba(16,185,129,0.15)', text: 'text-emerald-400', bg: 'bg-emerald-500', bgHover: 'hover:bg-emerald-600' }
    : { border: 'rgba(249,115,22,0.4)', glow: 'rgba(249,115,22,0.15)', text: 'text-orange-400', bg: 'bg-orange-500', bgHover: 'hover:bg-orange-600' };

  return (
    <motion.div {...PAGE_TRANSITION} className="flex-1 flex flex-col p-8 bg-[#0f1117] overflow-y-auto hide-scrollbar">
      <motion.button onClick={onBack} whileHover={{ x: -3 }} className={`flex items-center text-xs font-bold uppercase tracking-widest mb-8 ${accent.text}`}>
        <ChevronLeft size={16} className="mr-1" /> Back
      </motion.button>

      <motion.div variants={stagger} initial="hidden" animate="show">
        <motion.h1 variants={fadeUp} className="text-3xl font-syne font-extrabold text-white mb-2">{isAdmin ? 'HQ Portal' : 'Citizen Portal'}</motion.h1>
        <motion.p variants={fadeUp} className="text-xs text-slate-500 mb-6 tracking-wide">{isAdmin ? 'Municipal authority access' : 'Secure civic identity'}</motion.p>

        <motion.div variants={fadeUp} className="flex p-1 rounded-xl mb-6 border border-slate-800 bg-[#0a0c10] relative">
          <motion.div
            layoutId="auth-tab"
            className="absolute top-1 bottom-1 rounded-lg bg-slate-800"
            style={{ width: 'calc(50% - 4px)', left: isRegister ? 'calc(50%)' : '4px' }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          />
          <button onClick={() => setIsRegister(false)} className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase relative z-10 transition-colors ${!isRegister ? 'text-white' : 'text-slate-500'}`}>Login</button>
          <button onClick={() => setIsRegister(true)} className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase relative z-10 transition-colors ${isRegister ? 'text-white' : 'text-slate-500'}`}>Register</button>
        </motion.div>

        <motion.div variants={fadeUp} className="space-y-3">
          {['username', 'email', 'aadhaar', 'department', 'password'].map((field) => {
            if (field === 'aadhaar' && !(isRegister && !isAdmin)) return null;
            if (field === 'email' && !isRegister) return null;
            if (field === 'department' && !(isRegister && isAdmin)) return null;
            if (field === 'department') return (
              <motion.div key={field} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <select onChange={e => setFormData({ ...formData, department: e.target.value })} className="w-full bg-[#0a0c10] border border-slate-800 rounded-xl p-4 text-sm text-slate-400 focus:outline-none appearance-none transition-colors hover:border-slate-700">
                  <option value="">Select Department...</option>
                  <option value="ALL">HQ Command (Super Admin)</option>
                  <option value="Public Works Dept">Public Works Dept</option>
                  <option value="Electricity Board">Electricity Board</option>
                  <option value="Water Supply Board">Water Supply Board</option>
                  <option value="Sanitation Dept">Sanitation Dept</option>
                </select>
              </motion.div>
            );
            return (
              <motion.input key={field}
                type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
                placeholder={field === 'username' ? (isAdmin ? 'Govt ID' : 'Username') : field === 'aadhaar' ? 'Aadhaar Number (12 Digits)' : field === 'email' ? 'Email Address' : 'Password'}
                onChange={e => setFormData({ ...formData, [field]: e.target.value })}
                className="w-full bg-[#0a0c10] border border-slate-800 rounded-xl p-4 text-sm text-white focus:outline-none transition-all"
                style={{ '--tw-ring-color': accent.border }}
                onFocus={e => { e.target.style.borderColor = accent.border; e.target.style.boxShadow = `0 0 0 3px ${accent.glow}`; }}
                onBlur={e => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
              />
            );
          })}

          <motion.button
            disabled={isChecking} onClick={submit}
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
            className={`w-full py-4 text-white rounded-xl font-bold mt-2 ${accent.bg} ${accent.bgHover} transition-all relative overflow-hidden`}>
            {isChecking
              ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Verifying...</span>
              : 'Continue'}
            {isChecking && <div className="absolute inset-0 anim-shimmer pointer-events-none" />}
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// ==========================================
// 2. CITIZEN APPLICATION
// ==========================================
function CitizenApp({ currentUser, onLogout, userVotes, handleVote }) {
  const [activeTab, setActiveTab] = useState('feed');
  const [selectedIssue, setSelectedIssue] = useState(null);

  return (
    <div className="flex flex-col h-full bg-[#0f1117] relative">
      <header className="flex justify-between items-center p-4 border-b border-slate-800 bg-[#0a0c10]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#0f1117] rounded-lg flex items-center justify-center"><ShieldCheck size={16} className="text-orange-500" /></div>
          <span className="font-syne font-extrabold text-sm text-white">spotit<span className="text-orange-500">.</span>fixit</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={onLogout} className="text-xs text-slate-500 hover:text-white uppercase font-bold">Logout</button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">{currentUser?.username.charAt(0).toUpperCase()}</div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto hide-scrollbar pb-20">
        {activeTab === 'feed' && <CitizenFeed onIssueClick={setSelectedIssue} userVotes={userVotes} handleVote={handleVote} />}
        {activeTab === 'map' && <UniversalCityMap />}
        {activeTab === 'dash' && <CitizenDash currentUser={currentUser} onIssueClick={setSelectedIssue} userVotes={userVotes} handleVote={handleVote} />}
        {activeTab === 'report' && <ReportWizard currentUser={currentUser} onSuccess={() => setActiveTab('dash')} onCancel={() => setActiveTab('feed')} />}
      </div>

      {activeTab !== 'report' && (
        <motion.div initial={{ y: 80 }} animate={{ y: 0 }} transition={{ type: 'spring', stiffness: 340, damping: 30 }} className="absolute bottom-0 w-full p-4 bg-gradient-to-t from-[#080a0e] via-[#0a0c10]/90 to-transparent">
          <div className="flex justify-around bg-[#0a0c10]/95 backdrop-blur-md border border-slate-800/80 p-2 rounded-2xl shadow-[0_-4px_30px_rgba(0,0,0,0.4)]">
            <NavBtn icon={LayoutList} label="Feed" active={activeTab === 'feed'} onClick={() => setActiveTab('feed')} />
            <NavBtn icon={Map} label="Map" active={activeTab === 'map'} onClick={() => setActiveTab('map')} />
            <motion.button onClick={() => setActiveTab('report')}
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              className="flex items-center justify-center w-12 h-12 bg-orange-500 rounded-full text-white -mt-6 nav-fab">
              <PlusCircle size={24} />
            </motion.button>
            <NavBtn icon={User} label="Profile" active={activeTab === 'dash'} onClick={() => setActiveTab('dash')} />
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {selectedIssue && <IssueDetailOverlay issue={selectedIssue} onClose={() => setSelectedIssue(null)} currentUser={currentUser} userVotes={userVotes} handleVote={handleVote} />}
      </AnimatePresence>
    </div>
  );
}

const NavBtn = ({ icon: Icon, label, active, onClick }) => (
  <motion.button onClick={onClick} whileTap={{ scale: 0.88 }}
    className={`flex flex-col items-center p-2 transition-colors relative ${active ? 'text-orange-500' : 'text-slate-500'}`}>
    <motion.div animate={active ? { scale: [1, 1.22, 1] } : { scale: 1 }} transition={{ duration: 0.3 }}>
      <Icon size={20} className="mb-1" />
    </motion.div>
    <span className="text-[9px] font-bold uppercase tracking-wide">{label}</span>
    {active && <motion.div layoutId="nav-indicator" className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-orange-500" transition={{ type: 'spring', stiffness: 400, damping: 28 }} />}
  </motion.button>
);

// ==========================================
// 3. CITIZEN VIEWS
// ==========================================
function CitizenFeed({ onIssueClick, userVotes, handleVote }) {
  const [issues, setIssues] = useState([]);
  const [filter, setFilter] = useState('All');

  useEffect(() => { CORE_SERVICE.getAllReports().then(data => setIssues(data.reverse())); }, []);

  const filters = ['All', 'Road Damage', 'Streetlight Outage', 'Sanitation Dept', 'Water Supply Board'];
  const filtered = filter === 'All' ? issues : issues.filter(i => i.aiCategory === filter || i.routedDepartment === filter);

  return (
    <motion.div {...PAGE_TRANSITION}>
      <div className="bg-[#0a0c10] p-6 pt-8 pb-10 rounded-b-[2rem] border-b border-slate-800 relative overflow-hidden">
        <div className="absolute inset-0 anim-grid opacity-[0.06]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />
        <div className="relative z-10">
          <span className="px-3 py-1 text-[9px] font-bold uppercase tracking-widest border border-orange-500/20 rounded-full text-orange-400/80 mb-4 inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />Live City Grid
          </span>
          <h2 className="text-2xl font-syne font-extrabold text-white">Active <span className="text-orange-500">Reports</span></h2>
        </div>
      </div>
      <div className="p-4">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-4 pb-2">
          {filters.map(f => (
            <motion.button key={f} onClick={() => setFilter(f)}
              whileTap={{ scale: 0.94 }}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all border relative overflow-hidden ${filter === f ? 'bg-orange-500 border-orange-500 text-white shadow-[0_0_12px_rgba(249,115,22,0.3)]' : 'bg-[#0a0c10] border-slate-800 text-slate-400 hover:border-slate-600'
                }`}>
              {f.replace(' Dept', '').replace(' Board', '')}
            </motion.button>
          ))}
        </div>
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(issue => (
            <motion.div key={issue.id} variants={fadeUp}>
              <IssueCard issue={issue} onClick={() => onIssueClick(issue)} userVotes={userVotes} handleVote={handleVote} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}

function CitizenDash({ currentUser, onIssueClick, userVotes, handleVote }) {
  const [issues, setIssues] = useState([]);
  useEffect(() => { CORE_SERVICE.getUserReports(currentUser.username).then(data => setIssues(data.reverse())); }, [currentUser]);

  const resolved = issues.filter(i => i.status === 'RESOLVED').length;

  return (
    <div>
      <div className="bg-[#0a0c10] p-6 border-b border-slate-800 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-syne font-bold text-xl">{currentUser.username.charAt(0).toUpperCase()}</div>
        <div>
          <h2 className="font-syne font-bold text-lg text-white">{currentUser.username}</h2>
          <p className="text-xs text-slate-400 font-mono mt-1">{currentUser.userMask}</p>
        </div>
        <div className="ml-auto px-3 py-1.5 bg-orange-500/10 border border-orange-500/30 rounded-full text-[10px] font-bold text-orange-500">Civic Champion</div>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-[#0a0c10] border border-slate-800 p-4 rounded-2xl"><div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Filed</div><div className="font-syne text-2xl text-white font-bold">{issues.length}</div></div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl"><div className="text-[10px] text-emerald-500 uppercase font-bold mb-1">Resolved</div><div className="font-syne text-2xl text-emerald-400 font-bold">{resolved}</div></div>
        </div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-syne font-bold text-sm">My Reports</h3>
        </div>
        <div className="space-y-2">
          {issues.map(issue => {
            const base = getBaseVotes(issue.id);
            const userV = userVotes[issue.id] || 0;
            const total = base + userV;

            return (
              <div key={issue.id} onClick={() => onIssueClick(issue)} className="flex items-center gap-3 p-3 bg-[#0a0c10] border border-slate-800 rounded-xl cursor-pointer hover:border-slate-600 transition-colors">
                <div className={`w-2 h-2 rounded-full ${issue.status === 'RESOLVED' ? 'bg-emerald-500' : issue.status.includes('PENDING') ? 'bg-orange-500' : 'bg-blue-500'}`}></div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white truncate">{issue.aiCategory}</div>
                  <div className="text-[10px] text-slate-500 truncate">{issue.description}</div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">{issue.status.replace(/_/g, ' ')}</span>
                  <span className="text-[10px] text-slate-500 flex items-center"><ChevronUp size={10} className="mr-0.5" />{total}</span>
                </div>
              </div>
            );
          })}
          {issues.length === 0 && <div className="text-center p-8 text-slate-500 text-xs">No reports filed yet.</div>}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// UNIVERSAL SHARED CITY MAP 
// ==========================================
function UniversalCityMap() {
  const [issues, setIssues] = useState([]);
  const [showMobilePanel, setShowMobilePanel] = useState(false);

  useEffect(() => { CORE_SERVICE.getAllReports().then(data => setIssues(data)); }, []);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-800">
        <h3 className="font-syne font-bold text-sm mb-3 text-white">Live Map Stats</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-red-500/10 border border-red-500/20 p-2 rounded-lg text-center"><div className="font-syne text-lg font-bold text-red-500">{issues.filter(i => i.priorityLevel === 'Critical').length}</div><div className="text-[9px] text-red-400 font-bold uppercase mt-1">Critical</div></div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg text-center"><div className="font-syne text-lg font-bold text-emerald-500">{issues.length}</div><div className="text-[9px] text-emerald-400 font-bold uppercase mt-1">Total</div></div>
        </div>
      </div>

      <div className="p-3 space-y-2 overflow-y-auto hide-scrollbar max-h-48 border-b border-slate-800">
        {issues.map((i, idx) => (
          <div key={idx} className="p-2 bg-[#0f1117] border border-slate-800 rounded-lg text-xs flex gap-2 items-center">
            <div className={`w-2 h-2 rounded-full ${i.priorityLevel === 'Critical' ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
            <span className="truncate flex-1 text-slate-300">{i.aiCategory}</span>
          </div>
        ))}
        {issues.length === 0 && <div className="text-xs text-slate-500 text-center py-2">No active pins</div>}
      </div>

      <div className="p-4 flex-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-3 flex items-center"><TrendingDown size={14} className="mr-1 text-emerald-500" /> Contractor Penalties</p>
        <div className="space-y-3">
          <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex justify-between items-center">
            <div>
              <p className="text-[10px] font-bold text-red-100 uppercase">Sector 4 (North)</p>
              <p className="text-[9px] text-slate-400 mt-1">Penalty: ₹45,000</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-syne font-bold text-red-500">32%</p>
              <p className="text-[8px] uppercase tracking-widest text-red-400 font-bold">Trust Score</p>
            </div>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl flex justify-between items-center">
            <div>
              <p className="text-[10px] font-bold text-emerald-100 uppercase">Sector 2 (Central)</p>
              <p className="text-[9px] text-slate-400 mt-1">Penalty: ₹0</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-syne font-bold text-emerald-500">94%</p>
              <p className="text-[8px] uppercase tracking-widest text-emerald-400 font-bold">Trust Score</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col relative lg:flex-row">
      <div className="hidden lg:flex w-72 bg-[#0a0c10] border-r border-slate-800 z-10 flex-col">
        <SidebarContent />
      </div>

      <div onClick={() => setShowMobilePanel(true)} className="lg:hidden absolute top-4 left-4 right-4 z-[1000] bg-[#0a0c10]/90 backdrop-blur-md border border-slate-800 p-3 rounded-xl flex justify-between items-center shadow-xl cursor-pointer">
        <div><p className="text-[10px] text-slate-400 font-bold uppercase flex items-center">Tap for map stats</p><p className="font-syne text-lg font-bold text-white">{issues.length} Issues</p></div>
        <div className="text-right"><p className="text-[10px] text-red-400 font-bold uppercase">Critical</p><p className="font-syne text-lg font-bold text-red-500">{issues.filter(i => i.priorityLevel === 'Critical').length}</p></div>
      </div>

      <AnimatePresence>
        {showMobilePanel && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', bounce: 0, duration: 0.4 }} className="lg:hidden absolute inset-x-0 bottom-0 z-[1001] bg-[#0a0c10] border-t border-slate-800 rounded-t-[2rem] max-h-[75vh] overflow-hidden flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-syne font-bold text-white">Map Overview</h3>
              <button onClick={() => setShowMobilePanel(false)} className="text-slate-400 bg-slate-800 rounded-full p-1 hover:text-white"><XCircle size={18} /></button>
            </div>
            <div className="overflow-y-auto flex-1 pb-6">
              <SidebarContent />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 bg-[#0a0c10] z-0">
        <MapContainer center={[12.9716, 77.5946]} zoom={12} style={{ height: '100%', width: '100%', background: '#050B14' }} zoomControl={false} attributionControl={false}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          {issues.map((i, idx) => i.latitude ? (
            <Circle key={idx} center={[i.latitude, i.longitude]} pathOptions={{ color: i.priorityLevel === 'Critical' ? '#ef4444' : '#10b981', fillColor: i.priorityLevel === 'Critical' ? '#ef4444' : '#10b981', fillOpacity: 0.5 }} radius={300} />
          ) : null)}
        </MapContainer>
      </div>
    </div>
  );
}

// ==========================================
// 4. REPORTING WIZARD (MULTI-STEP)
// ==========================================
const SUBMIT_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes between submissions

function ReportWizard({ currentUser, onSuccess, onCancel }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({ category: '', description: '', lat: null, lng: null, image: null, photoLat: null, photoLng: null, geoMismatch: false, mismatchKm: 0, geoUnverified: false });
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [geoCheckStatus, setGeoCheckStatus] = useState('idle'); // 'idle'|'checking'|'ok'|'mismatch'|'unverified'
  const [nearbyDuplicate, setNearbyDuplicate] = useState(null);
  const [duplicateModal, setDuplicateModal] = useState(null); // { match, confidence } or null
  const [isDupChecking, setIsDupChecking] = useState(false);
  const [cooldownLeft, setCooldownLeft] = useState(0);

  // Check submission cooldown on mount
  useEffect(() => {
    const key = `sf_lastsubmit_${currentUser?.username}`;
    const last = parseInt(localStorage.getItem(key) || '0');
    const remaining = SUBMIT_COOLDOWN_MS - (Date.now() - last);
    if (remaining > 0) {
      setCooldownLeft(Math.ceil(remaining / 60000));
      const t = setInterval(() => {
        const rem = SUBMIT_COOLDOWN_MS - (Date.now() - last);
        if (rem <= 0) { setCooldownLeft(0); clearInterval(t); }
        else setCooldownLeft(Math.ceil(rem / 60000));
      }, 30000);
      return () => clearInterval(t);
    }
  }, [currentUser]);

  const handleCapture = (e) => {
    const file = e.target.files[0]; if (!file) return;
    setGeoCheckStatus('checking');
    const readImage = (photoLat, photoLng) => {
      const r = new FileReader();
      r.onloadend = () => {
        if (data.lat && photoLat !== null) {
          const dist = haversineKm(data.lat, data.lng, photoLat, photoLng);
          const mismatch = dist > 0.5;
          setData(prev => ({ ...prev, image: r.result, photoLat, photoLng, geoMismatch: mismatch, mismatchKm: dist, geoUnverified: false }));
          setGeoCheckStatus(mismatch ? 'mismatch' : 'ok');
        } else {
          // GPS denied during photo — mark as unverified, NOT ok
          setData(prev => ({ ...prev, image: r.result, photoLat: null, photoLng: null, geoMismatch: false, mismatchKm: 0, geoUnverified: true }));
          setGeoCheckStatus('unverified');
        }
      };
      r.readAsDataURL(file);
    };
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        p => readImage(p.coords.latitude, p.coords.longitude),
        () => readImage(null, null)
      );
    } else { readImage(null, null); }
  };

  const getLocation = () => {
    if ("geolocation" in navigator) navigator.geolocation.getCurrentPosition(async p => {
      const lat = p.coords.latitude, lng = p.coords.longitude;
      setData(prev => ({ ...prev, lat, lng, image: null, photoLat: null, photoLng: null, geoMismatch: false, mismatchKm: 0, geoUnverified: false }));
      setGeoCheckStatus('idle');
      setNearbyDuplicate(null);

      // Run AI duplicate check against the backend
      const cat = (data.category && data.category !== 'custom') ? data.category
        : aiResult ? aiResult.category : null;
      setIsDupChecking(true);
      try {
        const result = await AI_SERVICE.checkDuplicate(lat, lng, cat);
        if (result.duplicate_found) {
          setDuplicateModal({ match: result.match, confidence: result.confidence });
        } else {
          setNearbyDuplicate(null);
        }
      } catch { /* silent fail */ }
      setIsDupChecking(false);
    });
  };

  const submit = async () => {
    // Enforce submission cooldown
    const cooldownKey = `sf_lastsubmit_${currentUser?.username}`;
    const lastSubmit = parseInt(localStorage.getItem(cooldownKey) || '0');
    const elapsed = Date.now() - lastSubmit;
    if (elapsed < SUBMIT_COOLDOWN_MS) {
      const mins = Math.ceil((SUBMIT_COOLDOWN_MS - elapsed) / 60000);
      alert(`You must wait ${mins} more minute(s) before submitting another report. This prevents spam.`);
      return;
    }

    let routedDept = "Public Works Dept";
    let finalCat = data.category;
    let finalPri = "Medium";

    if (data.category === "Streetlight Outage") routedDept = "Electricity Board";
    if (data.category === "Water Leak") routedDept = "Water Supply Board";
    if (data.category === "Garbage Accumulation") routedDept = "Sanitation Dept";

    if (data.category === 'custom' && aiResult) {
      finalCat = aiResult.category; finalPri = aiResult.priority || "Medium";
      const aiD = (aiResult.department || "").toLowerCase();
      if (aiD.includes("water") || aiD.includes("pipe")) routedDept = "Water Supply Board";
      else if (aiD.includes("electric") || aiD.includes("light")) routedDept = "Electricity Board";
      else if (aiD.includes("sanitat") || aiD.includes("trash")) routedDept = "Sanitation Dept";
    }

    const payload = {
      description: data.category === 'custom' ? data.description : `User reported: ${data.category}`,
      aiCategory: finalCat, routedDepartment: routedDept, priorityLevel: finalPri, status: "PENDING_GOVT_REVIEW",
      submittedBy: currentUser.username, userMask: currentUser.userMask,
      latitude: data.lat, longitude: data.lng, issueImage: data.image,
      geoMismatch: data.geoMismatch, mismatchKm: data.mismatchKm,
      photoLat: data.photoLat, photoLng: data.photoLng,
      geoUnverified: data.geoUnverified
    };

    const saved = await CORE_SERVICE.submitReport(payload);
    if (saved) {
      localStorage.setItem(cooldownKey, Date.now().toString());
      setStep(4);
    } else alert("Error saving report.");
  };

  const steps = [
    {
      title: "What's the issue?",
      content: (
        <div className="space-y-4">
          <p className="text-xs text-slate-400">Select what you've spotted in your neighbourhood.</p>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { id: 'Road Damage', label: 'Roads', icon: '⬡' },
              { id: 'Streetlight Outage', label: 'Lighting', icon: '◎' },
              { id: 'Garbage Accumulation', label: 'Sanitation', icon: '◉' },
              { id: 'Water Leak', label: 'Water', icon: '◈' },
              { id: 'custom', label: 'Other', icon: '⬟' }
            ].map(c => (
              <button key={c.id} onClick={() => { setData({ ...data, category: c.id }); setAiResult(null); }} className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition-colors ${data.category === c.id ? 'border-orange-500 bg-orange-500/10' : 'border-slate-800 bg-[#0a0c10]'}`}>
                <span className="text-xl text-slate-500">{c.icon}</span>
                <span className={`text-[10px] font-bold ${data.category === c.id ? 'text-orange-500' : 'text-slate-400'}`}>{c.label}</span>
              </button>
            ))}
          </div>
          {data.category === 'custom' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
              <textarea placeholder="Describe the issue in detail for AI..." onChange={async (e) => {
                const text = e.target.value; setData({ ...data, description: text });
                if (text.length > 10) {
                  setIsAiProcessing(true); const res = await AI_SERVICE.categorizeIssue(text);
                  if (res) setAiResult(res); setIsAiProcessing(false);
                } else setAiResult(null);
              }} className="w-full bg-[#0a0c10] border border-slate-800 rounded-xl p-4 text-sm text-white focus:outline-none h-24 resize-none" />
              {aiResult && !isAiProcessing && (
                <div className="mt-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-center">
                  <Sparkles size={12} className="mr-2" /> AI: {aiResult.category} ➔ {aiResult.department}
                </div>
              )}
            </motion.div>
          )}
        </div>
      ),
      isValid: data.category !== 'custom' ? data.category !== '' : (data.category === 'custom' && aiResult !== null)
    },
    {
      title: "Where is it?",
      content: (
        <div className="space-y-4">
          <p className="text-xs text-slate-400">Pin the exact location. Changing GPS resets your photo to prevent location fraud.</p>
          <button onClick={getLocation} className={`w-full py-10 rounded-2xl border bg-[#0a0c10] flex flex-col items-center justify-center hover:border-orange-500/50 transition-all text-slate-400 hover:text-orange-500 ${
            data.lat ? 'border-emerald-500/40' : 'border-slate-800'
          }`}>
            {isDupChecking
              ? <><span className="w-6 h-6 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mb-2" /><span className="font-bold text-sm text-orange-400">Scanning for duplicates...</span></>
              : data.lat
              ? <><CheckCircle size={28} className="text-emerald-500 mb-2" /><span className="text-emerald-500 font-bold text-sm">GPS Locked</span><span className="text-[10px] mt-1 text-slate-500">{data.lat.toFixed(5)}, {data.lng.toFixed(5)}</span><span className="text-[9px] mt-1 text-slate-600 uppercase tracking-widest">Tap to re-lock & reset photo</span></>
              : <><Navigation size={28} className="mb-2" /><span className="font-bold text-sm">Tap to fetch GPS</span></>}
          </button>
          {nearbyDuplicate && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1 flex items-center gap-1"><AlertTriangle size={11} /> Similar Report Nearby</p>
              <p className="text-[11px] text-amber-200/80">A <span className="font-bold">{nearbyDuplicate.aiCategory}</span> report already exists within 500m (<span className="font-mono text-amber-300">TKT-{(nearbyDuplicate.id||'').substring(0,6).toUpperCase()}</span>). Consider upvoting it instead.</p>
            </motion.div>
          )}
          {cooldownLeft > 0 && (
            <div className="p-3 bg-slate-800/60 border border-slate-700 rounded-xl text-center">
              <p className="text-[11px] text-slate-400">⏱ Next submission available in <span className="font-bold text-white">{cooldownLeft} min</span></p>
            </div>
          )}
        </div>
      ),
      isValid: data.lat !== null
    },
    {
      title: "Add a Photo",
      content: (
        <div className="space-y-4">
          <p className="text-xs text-slate-400">Photo is captured with a live GPS cross-check to prevent location fraud.</p>
          <input type="file" accept="image/*" capture="environment" onChange={handleCapture} className="hidden" id="cam-input" />
          <label htmlFor="cam-input" className={`w-full py-10 rounded-2xl border bg-[#0a0c10] flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative ${geoCheckStatus === 'mismatch' ? 'border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.15)]' :
              geoCheckStatus === 'ok' ? 'border-emerald-500/50' : 'border-slate-800 hover:border-orange-500/50'
            }`}>
            {data.image ? <img src={data.image} className="absolute inset-0 w-full h-full object-cover opacity-50" /> : <><Camera size={32} className="text-slate-400 mb-2" /> <span className="text-slate-400 font-bold text-sm">Open Camera</span></>}
            {geoCheckStatus === 'checking' && <div className="relative z-10 flex items-center bg-black/70 px-3 py-1.5 rounded-full"><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> <span className="text-xs text-white font-bold">Verifying Location...</span></div>}
            {geoCheckStatus === 'ok' && <div className="relative z-10 flex items-center bg-emerald-900/80 px-3 py-1.5 rounded-full border border-emerald-500/40"><CheckCircle size={14} className="text-emerald-400 mr-2" /><span className="text-xs text-emerald-300 font-bold">GPS Match Confirmed</span></div>}
            {geoCheckStatus === 'mismatch' && <div className="relative z-10 flex items-center bg-red-900/80 px-3 py-1.5 rounded-full border border-red-500/40"><AlertTriangle size={14} className="text-red-400 mr-2" /><span className="text-xs text-red-300 font-bold">Location Mismatch!</span></div>}
          </label>

          {geoCheckStatus === 'mismatch' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl">
              <p className="text-xs font-black text-red-400 uppercase tracking-widest mb-1 flex items-center gap-2"><AlertOctagon size={14} /> ⚠ Geo-Fraud Detected</p>
              <p className="text-[11px] text-red-200/80 mb-2">Your photo GPS is <span className="font-bold text-red-300">{data.mismatchKm.toFixed(2)} km</span> away from the reported location. This is flagged and linked to your Aadhaar identity.</p>
              <p className="text-[10px] text-slate-400">Fraudulent reports are an offence under IT Act Section 66D. Please re-photograph at the actual incident site.</p>
            </motion.div>
          )}
          {geoCheckStatus === 'unverified' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-0.5 flex items-center gap-1"><AlertTriangle size={11} /> GPS Permission Denied</p>
              <p className="text-[11px] text-amber-200/70">Photo location could not be verified. This report will be flagged as <span className="font-bold">Geo-Unverified</span> for admin review.</p>
            </motion.div>
          )}
        </div>
      ),
      isValid: data.image !== null && geoCheckStatus !== 'mismatch'
    },
    {
      title: "Review & Submit",
      content: (
        <div className="bg-[#0a0c10] border border-slate-800 rounded-2xl p-4 space-y-3 text-sm">
          <div className="flex justify-between border-b border-slate-800 pb-2"><span className="text-slate-500">Category</span><span className="font-bold text-white">{data.category === 'custom' ? aiResult?.category : data.category}</span></div>
          <div className="flex justify-between border-b border-slate-800 pb-2"><span className="text-slate-500">Reported GPS</span><span className="font-bold text-emerald-400">Verified ✓</span></div>
          <div className="flex justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-500">Geo-Verification</span>
            {geoCheckStatus === 'ok'
              ? <span className="font-bold text-emerald-400 flex items-center gap-1"><CheckCircle size={12} /> Photo GPS Match</span>
              : <span className="font-bold text-slate-400">No cross-check</span>}
          </div>
          <div className="flex justify-between"><span className="text-slate-500">Evidence</span><span className="font-bold text-emerald-400">Photo Attached</span></div>
          <div className="mt-3 p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
            <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Identity Binding</p>
            <p className="text-[11px] text-slate-300 mt-1">This report is cryptographically linked to your Aadhaar via <span className="font-mono text-cyan-400">{currentUser?.userMask}</span>. False reports are legally actionable.</p>
          </div>
        </div>
      ),
      isValid: true
    }
  ];

  if (step === 4) {
    return (
      <motion.div {...PAGE_TRANSITION} className="p-6 bg-[#0f1117] h-full flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
          className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/60 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(16,185,129,0.25)]">
          <CheckCircle size={36} className="text-emerald-400" />
        </motion.div>
        <motion.div variants={stagger} initial="hidden" animate="show">
          <motion.h2 variants={fadeUp} className="text-2xl font-syne font-bold text-white mb-2">Report Submitted!</motion.h2>
          <motion.p variants={fadeUp} className="text-sm text-slate-400 mb-8">Your ticket has been securely routed to the appropriate department.</motion.p>
          <motion.button variants={fadeUp} onClick={onSuccess}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="w-full py-4 rounded-xl bg-[#0a0c10] border border-slate-800 text-white text-sm font-bold hover:border-emerald-500/40 transition-all">
            Return to Dashboard
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="p-6 bg-[#0f1117] h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <button onClick={onCancel} className="text-slate-500 hover:text-white"><XCircle size={24} /></button>
        <div className="flex gap-2">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
              {i < step ? '✓' : i + 1}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1">
        <h2 className="text-2xl font-syne font-bold text-white mb-4">{steps[step].title}</h2>
        {steps[step].content}
      </div>

      <div className="flex gap-3 mt-auto pt-4">
        {step > 0 && <button onClick={() => setStep(s => s - 1)} className="px-6 py-4 rounded-xl border border-slate-800 bg-[#0a0c10] text-sm font-bold text-white">Back</button>}
        <button disabled={!steps[step].isValid} onClick={() => step === 3 ? submit() : setStep(s => s + 1)} className="flex-1 py-4 rounded-xl bg-orange-500 text-white text-sm font-bold disabled:opacity-50 disabled:bg-slate-800 transition-colors">
          {step === 3 ? 'Submit Report' : 'Continue'}
        </button>
      </div>

      {/* DUPLICATE DETECTION MODAL */}
      <AnimatePresence>
        {duplicateModal && (
          <DuplicateModal
            match={duplicateModal.match}
            confidence={duplicateModal.confidence}
            onUpvote={async () => {
              await CORE_SERVICE.upvoteIssue(duplicateModal.match.id, currentUser?.username);
              setDuplicateModal(null);
              onSuccess(); // go back to dashboard — job done!
            }}
            onDismiss={() => setDuplicateModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ==========================================
// DUPLICATE DETECTION MODAL
// ==========================================
function DuplicateModal({ match, confidence, onUpvote, onDismiss }) {
  const [upvoting, setUpvoting] = useState(false);
  const confidenceColor = confidence === 'Very High' || confidence === 'High'
    ? { border: 'border-orange-500/40', bg: 'bg-orange-500/10', text: 'text-orange-400', badge: 'bg-orange-500' }
    : { border: 'border-amber-500/40', bg: 'bg-amber-500/10', text: 'text-amber-400', badge: 'bg-amber-500' };

  const handleUpvote = async () => {
    setUpvoting(true);
    await onUpvote();
    setUpvoting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end"
    >
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 340, damping: 34 }}
        className="w-full bg-[#0a0c10] border-t border-slate-800 rounded-t-[2rem] p-6 shadow-[0_-20px_60px_rgba(0,0,0,0.8)]"
      >
        {/* Handle bar */}
        <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-5" />

        {/* Header */}
        <div className={`flex items-center gap-3 p-3 rounded-2xl border mb-5 ${confidenceColor.border} ${confidenceColor.bg}`}>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${confidenceColor.badge} text-white`}>
            <AlertTriangle size={18} />
          </div>
          <div>
            <p className={`text-[10px] font-black uppercase tracking-widest ${confidenceColor.text}`}>Duplicate Detected</p>
            <p className="text-white text-sm font-bold mt-0.5">This issue was already reported!</p>
          </div>
          <span className={`ml-auto text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${confidenceColor.badge} text-white`}>{confidence}</span>
        </div>

        {/* Matched issue card */}
        <div className="bg-[#0f1117] border border-slate-800 rounded-2xl p-4 mb-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-[9px] font-mono text-slate-500 mb-1">TKT-{(match.id || '').substring(0, 6).toUpperCase()}</p>
              <h3 className="font-syne font-bold text-white text-base">{match.aiCategory}</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">{match.routedDepartment}</p>
            </div>
            <div className="flex items-center gap-1 bg-orange-500/10 border border-orange-500/20 px-2 py-1 rounded-full">
              <ChevronUp size={12} className="text-orange-400" />
              <span className="text-[11px] font-bold text-orange-400">{(match.upvoteCount || 0) + 12}</span>
            </div>
          </div>
          {match.issueImage && (
            <img src={match.issueImage} className="w-full h-24 object-cover rounded-xl opacity-70 border border-slate-800" />
          )}
          <div className="flex gap-2 mt-3">
            <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 bg-slate-800 rounded-full text-slate-300">📍 Nearby</span>
            <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${
              match.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'
            }`}>{match.status?.replace(/_/g, ' ')}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-2">
          <motion.button
            onClick={handleUpvote}
            disabled={upvoting}
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
            className="w-full py-4 rounded-xl bg-orange-500 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {upvoting
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Adding your voice...</>
              : <><ChevronUp size={18} /> Add My Voice to This Report</>}
          </motion.button>
          <motion.button
            onClick={onDismiss}
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
            className="w-full py-3 rounded-xl border border-slate-700 bg-[#0f1117] text-slate-300 text-sm font-bold"
          >
            Mine Is Different — Continue Anyway
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ==========================================
// 5. SHARED COMPONENTS (WITH VOTING)
// ==========================================
function IssueCard({ issue, onClick, userVotes, handleVote }) {
  const baseVotes = (issue.upvoteCount || 0) + 12; // combine DB votes + seed
  const userV = userVotes[issue.id] || 0;
  const totalVotes = baseVotes + userV;

  const iconMap = { 'Road Damage': '⬡', 'Streetlight Outage': '◎', 'Garbage Accumulation': '◉', 'Water Leak': '◈' };
  const statusColor = issue.status === 'RESOLVED' ? 'bg-emerald-500' : issue.status.includes('PENDING') ? 'bg-orange-500' : 'bg-blue-500';

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(249,115,22,0.10)' }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 360, damping: 28 }}
      className="bg-[#0a0c10] border border-slate-800 rounded-2xl overflow-hidden cursor-pointer flex flex-col relative hover:border-slate-700 transition-colors">
      <div className="h-20 bg-gradient-to-br from-slate-900 to-[#0a0c10] flex items-center justify-center relative overflow-hidden">
        <span className="text-5xl opacity-10 anim-float" style={{ animationDelay: `${Math.random() * 2}s` }}>
          {iconMap[issue.aiCategory] || '⬟'}
        </span>
        <div className={`absolute top-2 left-2 w-2 h-2 rounded-full ${statusColor} shadow-[0_0_6px_currentColor]`} />
        {issue.priorityLevel === 'Critical' && (
          <span className="absolute top-2 right-2 text-[8px] font-black uppercase tracking-widest text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded-md">!</span>
        )}
      </div>
      <div className="p-3 flex-1 flex flex-col justify-between">
        <div>
          <h4 className="font-syne font-bold text-white text-sm leading-tight mb-1">{issue.aiCategory}</h4>
          <p className="text-[9px] text-slate-600 font-bold uppercase truncate">{issue.routedDepartment}</p>
        </div>
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-800/60">
          <motion.button
            onClick={(e) => { e.stopPropagation(); handleVote(issue.id, 1); }}
            whileTap={{ scale: 0.85 }}
            className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md border transition-all ${userV === 1 ? 'bg-orange-500/20 text-orange-500 border-orange-500/30 shadow-[0_0_8px_rgba(249,115,22,0.2)]' : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500'
              }`}>
            <ChevronUp size={12} /> {totalVotes}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

function IssueDetailOverlay({ issue, onClose, currentUser, onRefresh, userVotes, handleVote }) {
  const isCitizen = currentUser?.role === 'citizen';
  const baseVotes = getBaseVotes(issue.id);
  const userV = userVotes[issue.id] || 0;
  const totalVotes = baseVotes + userV;

  const handleVerify = async (action) => {
    const status = action === 'confirm' ? 'RESOLVED' : 'REOPENED_BY_CITIZEN';
    await CORE_SERVICE.updateIssueStatus(issue.id, status);
    onClose(); if (onRefresh) onRefresh();
  };

  return (
    <motion.div
      initial={{ y: '100%', opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: '100%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 340, damping: 34 }}
      className="absolute inset-x-0 bottom-0 z-50 bg-[#0a0c10]/98 backdrop-blur-xl border-t border-slate-800/80 rounded-t-[2rem] p-6 max-h-[85vh] overflow-y-auto hide-scrollbar shadow-[0_-20px_60px_rgba(0,0,0,0.7)]">
      <div className="w-12 h-1.5 bg-slate-800 rounded-full mx-auto mb-6"></div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <span className="text-[10px] font-mono text-slate-500">{issue.id ? `TKT-${issue.id.substring(0, 6).toUpperCase()}` : 'TKT-NEW'}</span>
          <h2 className="text-xl font-syne font-bold text-white mt-1">{issue.aiCategory}</h2>
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#0f1117] flex items-center justify-center text-slate-400 hover:text-white"><XCircle size={16} /></button>
      </div>

      {issue.issueImage && <img src={issue.issueImage} className="w-full h-40 object-cover rounded-2xl mb-6 opacity-80 border border-slate-800" />}

      <div className="grid grid-cols-3 gap-2 mb-6">
        <div className="bg-[#0f1117] p-3 rounded-xl col-span-1"><div className="text-[9px] text-slate-500 uppercase font-bold mb-1">Status</div><div className={`text-xs font-bold ${issue.status === 'RESOLVED' ? 'text-emerald-400' : 'text-orange-400'}`}>{issue.status.replace(/_/g, ' ')}</div></div>
        <div className="bg-[#0f1117] p-3 rounded-xl col-span-1"><div className="text-[9px] text-slate-500 uppercase font-bold mb-1">Priority</div><div className="text-xs font-bold text-red-400">{issue.priorityLevel}</div></div>

        {/* DETAILED UPVOTE/DOWNVOTE CONTROL */}
        <div className="bg-[#0f1117] p-3 rounded-xl col-span-1 flex flex-col items-center justify-center border border-slate-800">
          <div className="text-[9px] text-slate-500 uppercase font-bold mb-1">Community</div>
          <div className="flex items-center gap-2">
            <button onClick={() => handleVote(issue.id, 1)} className={`p-1 rounded ${userV === 1 ? 'text-orange-500 bg-orange-500/20' : 'text-slate-500 hover:text-white'}`}><ChevronUp size={16} /></button>
            <span className="font-syne font-bold text-sm text-white">{totalVotes}</span>
            <button onClick={() => handleVote(issue.id, -1)} className={`p-1 rounded ${userV === -1 ? 'text-blue-500 bg-blue-500/20' : 'text-slate-500 hover:text-white'}`}><ChevronDown size={16} /></button>
          </div>
        </div>

        <div className="bg-[#0f1117] p-3 rounded-xl col-span-3"><div className="text-[9px] text-slate-500 uppercase font-bold mb-1">Routed To</div><div className="text-xs font-bold text-white">{issue.routedDepartment}</div></div>
      </div>

      {isCitizen && issue.status === 'PENDING_CITIZEN_REVIEW' && issue.resolutionImage && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl mb-6">
          <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-3">Govt Uploaded Proof of Repair</p>
          <img src={issue.resolutionImage} className="w-full h-32 object-cover rounded-xl mb-4" />
          <div className="flex gap-2">
            <button onClick={() => handleVerify('deny')} className="flex-1 py-3 bg-red-500/10 text-red-400 text-xs font-bold rounded-xl border border-red-500/20">Deny & Reopen</button>
            <button onClick={() => handleVerify('confirm')} className="flex-1 py-3 bg-emerald-500 text-white text-xs font-bold rounded-xl">Confirm Fix</button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ==========================================
// 6. ADMIN APPLICATION & VIEWS
// ==========================================
// Returns how many days old a report is (from its ID timestamp or a fallback)
const daysAgo = (issue) => {
  try {
    const ts = issue.createdAt || issue.submittedAt || issue.id?.substring(0, 8);
    if (!ts) return 0;
    return Math.floor((Date.now() - new Date(ts).getTime()) / 86400000);
  } catch { return 0; }
};

function AdminApp({ currentUser, onLogout, userVotes, handleVote }) {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [adminTab, setAdminTab] = useState('grid');
  const [adminSearch, setAdminSearch] = useState('');
  const [adminStatusFilter, setAdminStatusFilter] = useState('All');
  const [resolveModal, setResolveModal] = useState({ isOpen: false, id: null, image: null });
  const [fraudModal, setFraudModal] = useState({ isOpen: false, id: null, reason: '' });

  const loadData = async () => {
    setLoading(true);
    const all = await CORE_SERVICE.getAllReports();
    const filtered = currentUser?.departmentAccess === 'ALL' ? all : all.filter(i => i.routedDepartment === currentUser?.departmentAccess);
    setIssues(filtered.reverse());
    setLoading(false);
  };
  useEffect(() => { loadData(); }, [currentUser]);

  const handleAction = async (action, id) => {
    if (action === 'fraud') {
      await CORE_SERVICE.markAsFraud(id, fraudModal.reason); setFraudModal({ isOpen: false }); loadData();
    } else if (action === 'resolve') {
      await CORE_SERVICE.resolveIssueWithProof(id, resolveModal.image); 
      await CORE_SERVICE.dispatchConfirmations(id);
      setResolveModal({ isOpen: false }); loadData();
    }
  };

  const handleAdminCapture = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const r = new FileReader(); r.onloadend = () => setResolveModal({ ...resolveModal, image: r.result }); r.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col h-full bg-[#050B14] relative">
      <header className="flex justify-between items-center p-4 lg:p-6 border-b border-slate-800 bg-[#0a0c10]">
        <div>
          <h2 className="font-syne font-extrabold text-lg text-emerald-400">HQ Command</h2>
          <div className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded inline-flex items-center gap-1 mt-1 text-[10px] text-emerald-500 font-bold">
            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></div> System Operational
          </div>
        </div>

        {/* ADMIN TOGGLE: Grid vs Map */}
        <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
          <button onClick={() => setAdminTab('grid')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${adminTab === 'grid' ? 'bg-[#0a0c10] text-emerald-400 border border-slate-700 shadow-sm' : 'text-slate-500'}`}>Grid</button>
          <button onClick={() => setAdminTab('map')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${adminTab === 'map' ? 'bg-[#0a0c10] text-emerald-400 border border-slate-700 shadow-sm' : 'text-slate-500'}`}>Map</button>
        </div>

        <button onClick={onLogout} className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"><XCircle size={16} /></button>
      </header>

      <div className="flex-1 overflow-y-auto hide-scrollbar relative">
        {adminTab === 'map' ? (
          <UniversalCityMap />
        ) : (
          <div className="p-4 lg:p-6">
            {/* Derived filtered list used throughout the grid view */}
            {(() => {
              const filtered = issues.filter(i => {
                const matchSearch = !adminSearch || [
                  i.id, i.aiCategory, i.userMask, i.description, i.routedDepartment
                ].some(v => (v || '').toLowerCase().includes(adminSearch.toLowerCase()));
                const matchStatus = adminStatusFilter === 'All' || i.status === adminStatusFilter;
                return matchSearch && matchStatus;
              });
              return (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    <div className="bg-[#0a0c10] border border-slate-800 p-4 rounded-2xl"><div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Queue</div><div className="font-syne text-xl text-white font-bold">{issues.length}</div></div>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl"><div className="text-[10px] text-emerald-500 uppercase font-bold mb-1">Resolved</div><div className="font-syne text-xl text-emerald-400 font-bold">{issues.filter(i => i.status === 'RESOLVED').length}</div></div>
                    <div className="bg-[#0a0c10] border border-slate-800 p-4 rounded-2xl"><div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Avg Res</div><div className="font-syne text-xl text-white font-bold">3.4d</div></div>
                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl"><div className="text-[10px] text-red-400 uppercase font-bold mb-1 flex items-center gap-1"><AlertTriangle size={9}/>Geo-Flags</div><div className="font-syne text-xl text-red-400 font-bold">{issues.filter(i => i.geoMismatch || i.geoUnverified).length}</div></div>
                  </div>

            {currentUser?.departmentAccess === 'ALL' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <div className="bg-[#0a0c10] border border-slate-800 p-4 rounded-2xl">
                  <h4 className="font-syne text-sm font-bold mb-3 text-white">Monthly Trend</h4>
                  <div className="flex items-end gap-1 h-14">
                    {[60, 80, 100, 120, 100, 140].map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col justify-end gap-[1px]">
                        <div className="w-full bg-emerald-500/70 rounded-t" style={{ height: `${(h * 0.7)}%` }}></div>
                        <div className="w-full bg-red-500/50 rounded-t" style={{ height: `${(h * 0.3)}%` }}></div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-[#0a0c10] border border-slate-800 p-4 rounded-2xl">
                  <h4 className="font-syne text-sm font-bold mb-3 text-white">Resolution Rates</h4>
                  <div className="space-y-2">
                    <div><div className="flex justify-between text-[10px] font-bold mb-1 text-slate-300"><span>Roads</span><span>78%</span></div><div className="h-1 bg-slate-800 rounded-full"><div className="h-full bg-orange-500 rounded-full" style={{ width: '78%' }}></div></div></div>
                    <div><div className="flex justify-between text-[10px] font-bold mb-1 text-slate-300"><span>Sanitation</span><span>92%</span></div><div className="h-1 bg-slate-800 rounded-full"><div className="h-full bg-emerald-500 rounded-full" style={{ width: '92%' }}></div></div></div>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 relative overflow-hidden flex items-start gap-3">
              <AlertOctagon size={24} className="text-red-500 flex-shrink-0" />
              <div>
                <p className="text-xs font-black text-red-400 uppercase tracking-widest mb-1">AI Fraud Alert</p>
                <p className="text-[10px] text-red-200/80 font-mono">System detected 3 municipal uploads sharing identical metadata. Payment frozen.</p>
              </div>
            </div>

                  <div className="bg-[#0a0c10] border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-slate-800">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-syne font-bold text-sm text-white">Live Grid Feed</span>
                        <span className="text-[10px] text-slate-500">{filtered.length} of {issues.length}</span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          value={adminSearch}
                          onChange={e => setAdminSearch(e.target.value)}
                          placeholder="Search ticket, mask, category..."
                          className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-[11px] text-white placeholder-slate-600 focus:outline-none focus:border-slate-600 transition-colors"
                        />
                        <select
                          value={adminStatusFilter}
                          onChange={e => setAdminStatusFilter(e.target.value)}
                          className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-[10px] text-slate-400 focus:outline-none">
                          <option value="All">All Status</option>
                          <option value="PENDING_GOVT_REVIEW">Pending Review</option>
                          <option value="IN_PROGRESS">In Progress</option>
                          <option value="PENDING_CITIZEN_REVIEW">Citizen Review</option>
                          <option value="RESOLVED">Resolved</option>
                          <option value="REJECTED_FRAUD">Fraud</option>
                        </select>
                      </div>
                    </div>

                    <div className="divide-y divide-slate-800">
                      {loading ? <div className="p-8 text-center text-emerald-500 text-xs animate-pulse font-bold tracking-widest uppercase">Syncing with Grid...</div> :
                        filtered.length === 0 ? <div className="p-8 text-center text-slate-500 text-xs">No matching reports found.</div> :
                          filtered.map(issue => {
                            const baseV = getBaseVotes(issue.id);
                            const currV = userVotes[issue.id] || 0;
                            const totalV = baseV + currV;
                            const age = daysAgo(issue);
                            const isOverdue = age >= 3 && !['RESOLVED','REJECTED_FRAUD'].includes(issue.status);

                            return (
                              <div key={issue.id} className={`p-5 hover:bg-[#0f1117] transition-colors ${isOverdue ? 'border-l-2 border-amber-500/60' : ''}`}>
                                <div className="flex justify-between items-start mb-3">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                      <span className="text-[10px] font-mono text-slate-500">{issue.id ? `TKT-${issue.id.substring(0, 6).toUpperCase()}` : 'TKT-PENDING'}</span>
                                      <span className={`text-[10px] font-bold flex items-center ${issue.priorityLevel === 'Critical' ? 'text-red-500' : 'text-orange-500'}`}>
                                        <AlertOctagon size={10} className="mr-1" /> {issue.priorityLevel}
                                      </span>
                                      {isOverdue && <span className="text-[9px] font-black uppercase tracking-wider text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md flex items-center gap-1"><Clock size={9}/> {age}d OVERDUE</span>}
                                      {issue.geoMismatch && <span className="text-[9px] font-black uppercase tracking-wider text-red-300 bg-red-500/15 border border-red-500/40 px-2 py-0.5 rounded-md flex items-center gap-1 animate-pulse"><AlertTriangle size={9} /> GPS Mismatch</span>}
                                      {issue.geoUnverified && <span className="text-[9px] font-black uppercase tracking-wider text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md flex items-center gap-1"><AlertTriangle size={9}/> Unverified GPS</span>}
                                    </div>
                                    <h3 className="text-lg font-syne font-bold text-white">{issue.aiCategory}</h3>
                                    <p className="text-[10px] text-slate-400 mt-1 flex items-center"><User size={10} className="mr-1 text-cyan-500" /> Mask: <span className="font-mono text-cyan-400 ml-1">{issue.userMask || 'CTZ-ANON'}</span></p>
                                  </div>
                                  <div className="flex flex-col items-end">
                                    <span className={`text-[9px] uppercase font-black px-2 py-1.5 rounded-lg border tracking-widest mb-2 ${issue.status === 'RESOLVED' ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10' : issue.status === 'REJECTED_FRAUD' ? 'border-red-500/50 text-red-400 bg-red-500/10' : issue.status === 'IN_PROGRESS' ? 'border-amber-500/50 text-amber-400 bg-amber-500/10' : 'border-blue-500/50 text-blue-400 bg-blue-500/10'}`}>{issue.status.replace(/_/g, ' ')}</span>
                                    <div className="flex items-center text-slate-400 bg-slate-900 border border-slate-800 rounded-md px-2 py-1">
                                      <ChevronUp size={12} className="mr-1" /> <span className="text-[10px] font-bold">{totalV} Votes</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="mb-4">
                                  <p className="text-xs text-slate-300 italic mb-3 bg-[#0a0c10] p-3 rounded-xl border border-slate-800 shadow-inner">"{issue.description}"</p>

                                  {(issue.geoMismatch || issue.geoUnverified) && (
                                    <div className="mb-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                                      <p className="text-[10px] text-red-400 font-black uppercase tracking-widest mb-1 flex items-center gap-1">
                                        <AlertOctagon size={11} /> {issue.geoMismatch ? 'GPS Location Mismatch' : 'GPS Unverified'}
                                      </p>
                                      {issue.geoMismatch && <p className="text-[11px] text-red-200/90 mb-2">Photo taken <span className="font-bold text-red-300">{Number(issue.mismatchKm || 0).toFixed(2)} km</span> from reported location. Possible fraudulent evidence.</p>}
                                      {issue.geoUnverified && <p className="text-[11px] text-amber-200/80 mb-2">Citizen denied location access during photo capture. GPS cross-check was not possible.</p>}
                                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-red-500/20">
                                        <div>
                                          <p className="text-[9px] text-slate-500 uppercase font-bold">Aadhaar-Linked Identity</p>
                                          <p className="font-mono text-cyan-400 text-xs mt-0.5">{issue.userMask || 'CTZ-ANON'}</p>
                                        </div>
                                        {issue.geoMismatch && <button onClick={() => alert(`Legal Notice filed against: ${issue.userMask}\nIT Act §66D — Ref: TKT-${(issue.id||'').substring(0,6).toUpperCase()}`)} className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase rounded-lg transition-colors"><ShieldAlert size={12}/> File Legal Notice</button>}
                                      </div>
                                    </div>
                                  )}
                                  {issue.fraudReason && (
                                    <div className="mb-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                                      <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest mb-1">Fraud Reason Recorded:</p>
                                      <p className="text-xs text-red-200">{issue.fraudReason}</p>
                                    </div>
                                  )}
                                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Routed: <span className="text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded border border-cyan-500/20 ml-2">{issue.routedDepartment}</span></p>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-800">
                                  <button onClick={() => setSelectedIssue(issue)} className="flex items-center justify-center p-2 rounded-lg text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"><Camera size={14} className="mr-1" /> Review Image</button>
                                  {issue.status !== 'REJECTED_FRAUD' && issue.status !== 'RESOLVED' && issue.status !== 'PENDING_CITIZEN_REVIEW' && (
                                    <>
                                      <button onClick={() => setResolveModal({ isOpen: true, id: issue.id, image: null })} className="flex items-center justify-center p-2 rounded-lg text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"><CheckCircle size={14} className="mr-1" /> Mark Fixed</button>
                                      <button onClick={() => setFraudModal({ isOpen: true, id: issue.id, reason: '' })} className="flex items-center justify-center p-2 rounded-lg text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 transition-colors"><AlertTriangle size={14} className="mr-1" /> Flag Fraud</button>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedIssue && <IssueDetailOverlay issue={selectedIssue} onClose={() => setSelectedIssue(null)} currentUser={currentUser} onRefresh={loadData} userVotes={userVotes} handleVote={handleVote} />}

        {resolveModal.isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0a0c10] border border-emerald-500/50 p-6 rounded-3xl w-full max-w-sm shadow-2xl">
              <h3 className="font-syne font-bold text-lg text-emerald-400 mb-2">Upload Proof of Work</h3>
              <p className="text-xs text-slate-400 mb-4">This photo will be sent to the citizen for final verification.</p>
              <input type="file" accept="image/*" capture="environment" onChange={handleAdminCapture} className="hidden" id="admin-cam" />
              <label htmlFor="admin-cam" className="block w-full py-10 border border-slate-800 bg-[#0f1117] rounded-2xl flex flex-col items-center justify-center cursor-pointer mb-4 overflow-hidden relative hover:border-emerald-500/50 transition-colors">
                {resolveModal.image ? <img src={resolveModal.image} className="absolute inset-0 w-full h-full object-cover" /> : <><Camera size={32} className="text-emerald-500 mb-2" /><span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Tap to Camera</span></>}
              </label>
              <div className="flex gap-2">
                <button onClick={() => setResolveModal({ isOpen: false })} className="flex-1 py-3 bg-slate-800 text-xs font-bold text-white rounded-xl hover:bg-slate-700">Cancel</button>
                <button onClick={() => handleAction('resolve', resolveModal.id)} disabled={!resolveModal.image} className="flex-1 py-3 bg-emerald-600 text-xs font-bold text-white rounded-xl disabled:opacity-50 hover:bg-emerald-500">Submit to Citizen</button>
              </div>
            </div>
          </motion.div>
        )}

        {fraudModal.isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0a0c10] border border-red-500/50 p-6 rounded-3xl w-full max-w-sm shadow-2xl">
              <h3 className="font-syne font-bold text-lg text-red-400 flex items-center mb-2"><AlertTriangle size={18} className="mr-2" /> Flag as Fraud</h3>
              <p className="text-xs text-slate-400 mb-4">This ticket will be frozen. Please detail the discrepancy.</p>
              <textarea placeholder="e.g. Metadata suggests image was taken in 2021..." onChange={e => setFraudModal({ ...fraudModal, reason: e.target.value })} className="w-full bg-[#0f1117] border border-slate-800 rounded-xl p-4 text-sm text-white focus:border-red-500 focus:outline-none mb-4 h-28 resize-none" />
              <div className="flex gap-2">
                <button onClick={() => setFraudModal({ isOpen: false })} className="flex-1 py-3 bg-slate-800 text-xs font-bold text-white rounded-xl hover:bg-slate-700">Cancel</button>
                <button onClick={() => handleAction('fraud', fraudModal.id)} disabled={fraudModal.reason.length < 10} className="flex-1 py-3 bg-red-600 text-xs font-bold text-white rounded-xl disabled:opacity-50 hover:bg-red-500">Submit Audit</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}