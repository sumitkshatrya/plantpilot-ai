import React, { useEffect, useState } from 'react';
import { 
  FileText, 
  Layers, 
  ShieldCheck, 
  Wrench, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Clock, 
  Cpu, 
  Bot 
} from 'lucide-react';
import { documentsApi, systemApi, chatApi } from '../services/api';

export default function Dashboard({ onNavigateToCopilot }) {
  const [stats, setStats] = useState({
    indexedDocs: 4,
    totalPages: 7,
    latestRevision: 'Rev 04 / Rev 05',
    activeMode: 'Local Grounded RAG'
  });
  const [documents, setDocuments] = useState([]);
  const [recentQueries, setRecentQueries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [docsData, healthData, historyData] = await Promise.all([
          documentsApi.getAll().catch(() => []),
          systemApi.getHealth().catch(() => null),
          chatApi.getHistory().catch(() => [])
        ]);

        if (docsData && docsData.length > 0) {
          setDocuments(docsData);
          const totalP = docsData.reduce((acc, d) => acc + (d.total_pages || 0), 0);
          setStats((prev) => ({
            ...prev,
            indexedDocs: docsData.length,
            totalPages: totalP
          }));
        }

        if (healthData) {
          setStats((prev) => ({
            ...prev,
            activeMode: healthData.active_llm_mode
          }));
        }

        if (historyData) {
          setRecentQueries(historyData.slice(0, 5));
        }
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const quickPillars = [
    {
      title: 'Lockout / Tagout (LOTO)',
      docNo: 'SAF-SOP-003',
      rev: 'Rev 05',
      category: 'Safety',
      color: 'rose',
      desc: 'Mandatory zero-energy verification sequence, personal red locks, and SF-12 emergency removal rules.',
      sampleQ: 'How do I verify zero energy before machine maintenance?'
    },
    {
      title: 'Incoming Material Inspection',
      docNo: 'QC-SOP-014',
      rev: 'Rev 04',
      badge: 'Controlled Active',
      category: 'Quality',
      color: 'cyan',
      desc: 'Sampling tables (750 pcs = 32 samples), mandatory supplier MTC, QF-07A QMS app form, and locked Cage Q1.',
      sampleQ: 'What should QC do if the supplier MTC is missing?'
    },
    {
      title: 'TX-200 CNC Turning Maintenance',
      docNo: 'MNT-MAN-CNC-02',
      rev: 'Rev 02',
      category: 'Maintenance',
      color: 'teal',
      desc: 'Normal hydraulic pressure (3.5–4.0 MPa), chuck clamp (2.0–2.5 MPa), 110 Nm torque, and AL alarm actions.',
      sampleQ: 'What is the normal hydraulic pressure for the TX-200?'
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-6 space-y-8 bg-[#0A0F1D]">
      {/* Hero Welcome Banner */}
      <div className="p-6 lg:p-8 rounded-2xl bg-gradient-to-r from-[#0F172A] via-[#111F38] to-[#0A2540] border border-slate-800/80 shadow-2xl relative overflow-hidden">
        <div className="max-w-2xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-mono font-medium">
            <span className="w-2 h-2 rounded-full bg-teal-400"></span>
            <span>Shop-Floor Copilot Active</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Kaveri Precision Components
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            AI-powered manufacturing documentation copilot. Instant, document-grounded answers across maintenance, inspection, and safety standards without revision confusion.
          </p>

          <div className="pt-2">
            <button
              onClick={() => onNavigateToCopilot && onNavigateToCopilot()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs shadow-lg shadow-teal-600/25 transition-all"
            >
              <Bot className="w-4 h-4" />
              <span>Launch AI Copilot</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>

        {/* Ambient background badge */}
        <div className="absolute right-6 -bottom-6 text-slate-800/20 font-black text-9xl select-none hidden lg:block">
          SOP
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#111827] border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>Indexed Documents</span>
            <FileText className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2 font-mono">
            {stats.indexedDocs} SOPs
          </div>
          <div className="text-[11px] text-slate-400 mt-1">4 Controlled PDFs Loaded</div>
        </div>

        <div className="p-4 rounded-xl bg-[#111827] border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>Total Pages</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2 font-mono">
            {stats.totalPages} Pages
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Page-level citations preserved</div>
        </div>

        <div className="p-4 rounded-xl bg-[#111827] border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>Active Control</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2 font-mono">
            Rev 04 / 05
          </div>
          <div className="text-[11px] text-emerald-400 mt-1">Rev 04 supersedes Rev 03</div>
        </div>

        <div className="p-4 rounded-xl bg-[#111827] border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>Grounding Pipeline</span>
            <Cpu className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-base font-bold text-slate-200 mt-3 truncate font-mono">
            ChromaDB + RAG
          </div>
          <div className="text-[11px] text-slate-400 mt-1 truncate">Strict Guardrail Active</div>
        </div>
      </div>

      {/* Pillars Section: Safety, Quality, Maintenance */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-mono">
            Manufacturing Knowledge Pillars
          </h3>
          <span className="text-xs text-slate-400">Hosur Plant Standards</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickPillars.map((p, idx) => (
            <div 
              key={idx}
              className="p-5 rounded-2xl bg-[#111827] border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold ${
                    p.category === 'Safety' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20' :
                    p.category === 'Quality' ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20' :
                    'bg-teal-500/15 text-teal-400 border border-teal-500/20'
                  }`}>
                    {p.category}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
                    <span className="font-bold text-slate-200">{p.docNo}</span>
                    <span>· {p.rev}</span>
                  </div>
                </div>

                <h4 className="text-base font-bold text-white group-hover:text-teal-300 transition-colors">
                  {p.title}
                </h4>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  {p.desc}
                </p>
              </div>

              <button
                onClick={() => onNavigateToCopilot && onNavigateToCopilot(p.sampleQ)}
                className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white flex items-center justify-between transition-colors"
              >
                <span className="truncate text-left text-[11px]">Ask: "{p.sampleQ}"</span>
                <ArrowRight className="w-3.5 h-3.5 text-teal-400 shrink-0 ml-2" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Queries / Document Activity Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Queries */}
        <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-400" />
              <span>Recent Shop-Floor Inquiries</span>
            </h3>
            <span className="text-[11px] text-slate-400">Session History</span>
          </div>

          {recentQueries.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 space-y-2">
              <p>No recent questions asked in this session yet.</p>
              <button
                onClick={() => onNavigateToCopilot && onNavigateToCopilot()}
                className="text-teal-400 hover:underline"
              >
                Ask a test question now →
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentQueries.map((q) => (
                <div 
                  key={q.id}
                  onClick={() => onNavigateToCopilot && onNavigateToCopilot(q.question)}
                  className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-200 truncate max-w-[260px] sm:max-w-md">{q.question}</span>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-2">{q.timestamp}</span>
                  </div>
                  {q.primary_source && (
                    <div className="text-[10px] font-mono text-teal-400 mt-1">
                      Cited: {q.primary_source} (Rev {q.revision})
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Controlled Document Status */}
        <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Controlled Revision Status</span>
            </h3>
            <span className="text-[11px] text-emerald-400 font-mono">QMS Validated</span>
          </div>

          <div className="space-y-2.5">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <div className="font-semibold text-slate-200">MNT-MAN-CNC-02 (Rev 02)</div>
                <div className="text-[11px] text-slate-400">Effective: 20-Jan-2026 · Shaft Machining Line</div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ACTIVE
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <div className="font-semibold text-slate-200">QC-SOP-014 (Rev 04)</div>
                <div className="text-[11px] text-slate-400">Effective: 01-Jul-2026 · Sampling Table & MTC</div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                CONTROLLED
              </span>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-between text-xs">
              <div>
                <div className="font-semibold text-amber-200">QC-SOP-014 (Rev 03)</div>
                <div className="text-[11px] text-amber-400/80">Effective: 15-Mar-2023 · Superseded on 01-Jul-2026</div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                SUPERSEDED
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <div className="font-semibold text-slate-200">SAF-SOP-003 (Rev 05)</div>
                <div className="text-[11px] text-slate-400">Effective: 12-Feb-2026 · Plant-wide LOTO Procedure</div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ACTIVE
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
