import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Wifi, 
  Cpu, 
  RefreshCw, 
  ShieldCheck, 
  ExternalLink, 
  CheckCircle, 
  Smartphone,
  HardDrive,
  Award,
  Edit3
} from 'lucide-react';
import toast from 'react-hot-toast';
import { systemApi, documentsApi } from '../services/api';
import { STANDARD_EXPERIENCE_OPTIONS } from '../components/ExperienceModal';

export default function SettingsPage() {
  const [health, setHealth] = useState(null);
  const [reindexing, setReindexing] = useState(false);
  const [experience, setExperience] = useState(() => {
    return localStorage.getItem('plantpilot_experience') || 'Fresher / Trainee (0 Years)';
  });
  const [selectedTier, setSelectedTier] = useState(() => {
    const saved = localStorage.getItem('plantpilot_experience') || 'Fresher / Trainee (0 Years)';
    const match = STANDARD_EXPERIENCE_OPTIONS.find(o => o.label === saved);
    return match ? saved : 'CUSTOM';
  });
  const [customExperienceText, setCustomExperienceText] = useState(() => {
    const saved = localStorage.getItem('plantpilot_experience') || '';
    const match = STANDARD_EXPERIENCE_OPTIONS.find(o => o.label === saved);
    return match ? '' : saved;
  });

  useEffect(() => {
    systemApi.getHealth().then(setHealth).catch(() => null);
  }, []);

  const handleTierChange = (e) => {
    const val = e.target.value;
    setSelectedTier(val);
    if (val !== 'CUSTOM') {
      setExperience(val);
      localStorage.setItem('plantpilot_experience', val);
      window.dispatchEvent(new Event('plantpilot-exp-changed'));
      toast.success(`Experience level set to: ${val}`);
    }
  };

  const handleSaveCustomExperience = (e) => {
    e.preventDefault();
    const trimmed = customExperienceText.trim();
    if (!trimmed) {
      toast.error('Please enter your custom experience');
      return;
    }
    setExperience(trimmed);
    localStorage.setItem('plantpilot_experience', trimmed);
    window.dispatchEvent(new Event('plantpilot-exp-changed'));
    toast.success(`Custom experience set to: ${trimmed}`);
  };

  const handleReindex = async () => {
    setReindexing(true);
    try {
      const res = await documentsApi.reindex();
      toast.success(`ChromaDB refreshed with ${res.indexed_chunks} chunks.`);
      const updatedHealth = await systemApi.getHealth();
      setHealth(updatedHealth);
    } catch (err) {
      toast.error('Reindexing failed');
    } finally {
      setReindexing(false);
    }
  };

  const currentHost = window.location.hostname;

  return (
    <div className="flex-1 overflow-y-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6 bg-[#0A0F1D]">
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">System & Network Settings</h2>
        <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1">
          Configuration, vector store diagnostics, and local Wi-Fi mobile deployment instructions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Operator Profile & Experience Level (Fresher, 0 to Higher / Written Custom) */}
        <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-[#111827] border border-slate-800 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-white">
              <Award className="w-4 h-4 text-teal-400" />
              <span>Operator Profile & Experience Level (Fresher, 0 to Higher Level / Custom)</span>
            </div>
            <span className="text-[10px] sm:text-xs font-mono px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20">
              Active: {experience}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Dropdown Selection */}
            <div className="space-y-2">
              <label className="text-slate-300 font-medium block">
                Select from Experience Tiers:
              </label>
              <select
                value={selectedTier}
                onChange={handleTierChange}
                className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs sm:text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-teal-500/60"
              >
                {STANDARD_EXPERIENCE_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.label}>
                    {opt.label}
                  </option>
                ))}
                <option value="CUSTOM">✍️ Write Custom Experience (Not in list)...</option>
              </select>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Fresher / 0-1 Yr gets extra beginner clarity, definitions, and prerequisite checks. Higher tiers get direct engineering parameters.
              </p>
            </div>

            {/* Custom Written Experience Field */}
            <div className="space-y-2">
              <label className="text-slate-300 font-medium flex items-center justify-between">
                <span>Write Custom Experience:</span>
                <span className="text-[10px] text-slate-400 font-normal">Type anything not in dropdown</span>
              </label>

              <form onSubmit={handleSaveCustomExperience} className="flex gap-2">
                <input
                  type="text"
                  value={customExperienceText}
                  onChange={(e) => {
                    setCustomExperienceText(e.target.value);
                    setSelectedTier('CUSTOM');
                  }}
                  placeholder="e.g. 6 Months Trainee, 7.5 Years CNC Machinist, 20 Years QMS Auditor..."
                  className="flex-1 bg-slate-900 border border-slate-800 text-slate-200 text-xs sm:text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-teal-500/60 placeholder-slate-500"
                />
                <button
                  type="submit"
                  disabled={!customExperienceText.trim()}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-semibold text-xs shadow-md shadow-teal-600/20 transition-all shrink-0 min-h-[36px]"
                >
                  Save
                </button>
              </form>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Saved in your session. The AI Copilot uses this exact written experience to tailor every shop-floor answer.
              </p>
            </div>
          </div>
        </div>

        {/* Plant Metadata & RAG Status */}
        <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-[#111827] border border-slate-800 space-y-3.5 sm:space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 text-xs sm:text-sm font-semibold text-white">
            <Cpu className="w-4 h-4 text-teal-400" />
            <span>RAG Engine & Grounding Status</span>
          </div>

          <div className="space-y-2.5 sm:space-y-3 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 sm:p-3 rounded-xl bg-slate-900 border border-slate-800 gap-0.5 sm:gap-0">
              <span className="text-slate-400 text-[11px] sm:text-xs">Plant / Unit</span>
              <span className="font-semibold text-slate-200 truncate">Kaveri Precision Components</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 sm:p-3 rounded-xl bg-slate-900 border border-slate-800 gap-0.5 sm:gap-0">
              <span className="text-slate-400 text-[11px] sm:text-xs">Location</span>
              <span className="font-semibold text-slate-200">Hosur Plant, Tamil Nadu</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 sm:p-3 rounded-xl bg-slate-900 border border-slate-800 gap-0.5 sm:gap-0">
              <span className="text-slate-400 text-[11px] sm:text-xs">Vector Store</span>
              <span className="font-mono text-teal-400 font-semibold break-all">ChromaDB (Persistent SQLite)</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 sm:p-3 rounded-xl bg-slate-900 border border-slate-800 gap-0.5 sm:gap-0">
              <span className="text-slate-400 text-[11px] sm:text-xs">Embedding Engine</span>
              <span className="font-mono text-teal-400 font-semibold break-all">all-MiniLM-L6-v2 (ONNX)</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 sm:p-3 rounded-xl bg-slate-900 border border-slate-800 gap-0.5 sm:gap-0">
              <span className="text-slate-400 text-[11px] sm:text-xs">Active Synthesis Mode</span>
              <span className="font-semibold text-emerald-400">{health?.active_llm_mode || 'Local Grounded RAG'}</span>
            </div>

            <div className="pt-2">
              <button
                onClick={handleReindex}
                disabled={reindexing}
                className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-semibold flex items-center justify-center gap-2 text-xs shadow-md shadow-teal-600/20 transition-colors min-h-[40px]"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${reindexing ? 'animate-spin' : ''}`} />
                <span>{reindexing ? 'Reindexing Collections…' : 'Reindex ChromaDB Collections'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile & Wi-Fi Deployment Instructions */}
        <div className="p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-[#111827] border border-slate-800 space-y-3.5 sm:space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 text-xs sm:text-sm font-semibold text-white">
            <Smartphone className="w-4 h-4 text-cyan-400" />
            <span>Shop-Floor Mobile Wi-Fi Access</span>
          </div>

          <div className="space-y-3 text-xs leading-relaxed text-slate-300">
            <p className="text-[11px] sm:text-xs">
              To access PlantPilot AI on a mobile phone or tablet while on the shop floor:
            </p>

            <ol className="list-decimal list-inside space-y-2 p-3 sm:p-3.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300">
              <li>Connect your laptop and phone to the same shop-floor Wi-Fi.</li>
              <li>Find your laptop's private IPv4 address:
                <code className="block mt-1 p-1.5 bg-slate-950 text-teal-300 rounded break-all">
                  Windows PowerShell: ipconfig
                </code>
              </li>
              <li>Open your phone's browser and navigate to:
                <code className="block mt-1 p-1.5 bg-slate-950 text-teal-300 rounded break-all">
                  http://{currentHost === 'localhost' || currentHost === '127.0.0.1' ? '<YOUR-LAPTOP-IP>' : currentHost}:5173
                </code>
              </li>
              <li>Backend API communicates dynamically without hardcoded localhost.</li>
            </ol>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] sm:text-[11px] text-amber-200 leading-relaxed">
              <strong>Firewall Note:</strong> If your phone cannot connect, allow port 5173 and 8000 through the Windows Defender Firewall for Private Networks.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
