import React from 'react';
import { 
  LayoutDashboard, 
  Bot, 
  FileText, 
  History, 
  Settings, 
  ShieldCheck, 
  Cpu, 
  X,
  ExternalLink
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, mobileOpen, setMobileOpen }) {
  const navItems = [
    { id: 'copilot', label: 'Ask Copilot', icon: Bot, badge: 'Live RAG' },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'documents', label: 'Documents Library', icon: FileText, count: '4 SOPs' },
    { id: 'history', label: 'Recent Questions', icon: History },
    { id: 'settings', label: 'Settings & Network', icon: Settings },
  ];

  const handleNavClick = (id) => {
    setActiveTab(id);
    if (setMobileOpen) setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed lg:static top-0 bottom-0 left-0 z-50
        w-72 bg-[#0C1222] border-r border-slate-800/80
        flex flex-col justify-between
        transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Top Header & Brand */}
        <div>
          <div className="p-5 flex items-center justify-between border-b border-slate-800/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-teal-500/20 text-white font-bold tracking-wider">
                <Cpu className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white text-lg tracking-tight">PlantPilot</span>
                  <span className="text-xs px-1.5 py-0.5 rounded font-mono font-semibold bg-teal-500/20 text-teal-400 border border-teal-500/30">AI</span>
                </div>
                <p className="text-[11px] text-slate-400 tracking-wide">SOP & Safety Copilot</p>
              </div>
            </div>

            {/* Mobile close button */}
            <button 
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Plant Unit Badge */}
          <div className="mx-4 my-3 px-3 py-2 rounded-lg bg-slate-900/80 border border-slate-800/80 text-xs">
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Unit Verification</div>
            <div className="font-semibold text-slate-200 mt-0.5 truncate">Kaveri Precision Components</div>
            <div className="flex items-center gap-1.5 text-[11px] text-teal-400 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
              <span>Hosur Plant · Active QMS</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Navigation
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`
                    w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium
                    transition-all duration-150 text-left
                    ${isActive 
                      ? 'bg-gradient-to-r from-teal-500/20 to-teal-500/5 text-teal-300 border-l-2 border-teal-400 font-semibold' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-teal-400/20 text-teal-300 border border-teal-400/30">
                      {item.badge}
                    </span>
                  )}
                  {item.count && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer / Safety Reminder */}
        <div className="p-4 border-t border-slate-800/60 bg-slate-900/40">
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed text-amber-200/90">
              <strong className="font-semibold block text-amber-300">Controlled QMS Notice</strong>
              Printed documents are uncontrolled. Always verify active revision in QMS before servicing.
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
