import React from 'react';
import { Menu, ShieldAlert, Cpu, Bell, CheckCircle2 } from 'lucide-react';

export default function TopNav({ onMenuToggle, activeTab }) {
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
    <header className="h-16 bg-[#0E1528] border-b border-slate-800/80 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30">
      {/* Left side: Hamburger + Page Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 focus:outline-none"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
            <span>{getTabTitle()}</span>
            <span className="hidden sm:inline-block text-xs font-normal text-slate-400">· Kaveri Precision</span>
          </h1>
          <p className="text-xs text-slate-400 hidden md:block">
            Hosur Plant · Shift Operations · ISO 9001:2015 QMS
          </p>
        </div>
      </div>

      {/* Right side: Status Badge & User Badge */}
      <div className="flex items-center gap-3">
        {/* Operational Status Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="font-medium">RAG ACTIVE · 4 SOPS</span>
        </div>

        {/* User Pill */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center text-xs font-bold text-teal-300 border border-slate-600 shadow-sm">
            QC
          </div>
          <div className="hidden md:block text-left text-xs">
            <div className="font-semibold text-slate-200">Shift QC Supervisor</div>
            <div className="text-[10px] text-slate-400 font-mono">Shift B (Shaft Line)</div>
          </div>
        </div>
      </div>
    </header>
  );
}
