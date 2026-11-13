import React, { useState, useEffect } from 'react';
import { Menu, ShieldAlert, Cpu, Bell, CheckCircle2, Award, ChevronDown } from 'lucide-react';
import ExperienceModal from './ExperienceModal';

export default function TopNav({ onMenuToggle, activeTab }) {
  const [experience, setExperience] = useState(() => {
    return localStorage.getItem('plantpilot_experience') || 'Fresher / Trainee (0 Years)';
  });
  const [isExpModalOpen, setIsExpModalOpen] = useState(false);

  useEffect(() => {
    const handleExpChange = () => {
      setExperience(localStorage.getItem('plantpilot_experience') || 'Fresher / Trainee (0 Years)');
    };
    window.addEventListener('plantpilot-exp-changed', handleExpChange);
    return () => window.removeEventListener('plantpilot-exp-changed', handleExpChange);
  }, []);

  const getTabTitle = () => {
    switch (activeTab) {
      case 'copilot': return 'AI SOP Copilot';
      case 'dashboard': return 'Plant Overview';
      case 'documents': return 'Controlled Documents Library';
      case 'history': return 'Recent Shop-Floor Inquiries';
      case 'settings': return 'System Configuration';
      default: return 'PlantPilot AI';
    }
  };

  return (
    <header className="h-14 sm:h-16 bg-[#0E1528] border-b border-slate-800/80 px-3 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 shrink-0">
      {/* Left side: Hamburger + Page Title */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 -ml-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 active:bg-slate-800 focus:outline-none min-h-[40px] min-w-[40px] flex items-center justify-center"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h1 className="text-sm sm:text-base font-semibold text-white tracking-tight flex items-center gap-1.5 sm:gap-2 truncate">
            <span className="truncate">{getTabTitle()}</span>
            <span className="hidden sm:inline-block text-xs font-normal text-slate-400 shrink-0">· Kaveri Precision</span>
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-400 hidden md:block truncate">
            Hosur Plant · Shift Operations · ISO 9001:2015 QMS
          </p>
        </div>
      </div>

      {/* Right side: Status Badge, Experience Pill & User Badge */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Experience Selector Pill (Opens Modal for Fresher 0 to High Level / Custom) */}
        <button
          onClick={() => setIsExpModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 sm:py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-teal-500/50 text-xs text-slate-200 transition-all cursor-pointer shadow-sm group"
          title="Click to change operator experience level"
        >
          <Award className="w-3.5 h-3.5 text-teal-400 group-hover:scale-110 transition-transform" />
          <div className="text-left font-mono text-[11px] leading-tight">
            <span className="hidden sm:inline text-slate-400">Exp: </span>
            <span className="text-teal-300 font-semibold truncate max-w-[90px] sm:max-w-[130px] inline-block align-bottom">
              {experience.length > 18 ? experience.slice(0, 15) + '…' : experience}
            </span>
          </div>
          <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-teal-400 ml-0.5" />
        </button>

        {/* Compact Status Indicator on Mobile */}
        <div className="sm:hidden flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-mono" title="RAG Active · 4 SOPs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>LIVE</span>
        </div>

        {/* Operational Status Pill on Tablet & Desktop */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="font-medium">RAG ACTIVE · 4 SOPS</span>
        </div>

        {/* User Pill */}
        <div className="flex items-center gap-2 sm:gap-2.5 pl-2 sm:pl-3 border-l border-slate-800">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center text-[10px] sm:text-xs font-bold text-teal-300 border border-slate-600 shadow-sm shrink-0">
            QC
          </div>
          <div className="hidden md:block text-left text-xs">
            <div className="font-semibold text-slate-200">Shift QC Supervisor</div>
            <div className="text-[10px] text-slate-400 font-mono">Shift B (Shaft Line)</div>
          </div>
        </div>
      </div>

      {/* Experience Level Selector Modal */}
      <ExperienceModal
        isOpen={isExpModalOpen}
        onClose={() => setIsExpModalOpen(false)}
        currentExperience={experience}
        onSelectExperience={setExperience}
      />
    </header>
  );
}
