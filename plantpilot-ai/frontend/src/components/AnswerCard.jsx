import React from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  CheckCircle, 
  AlertTriangle, 
  ShieldAlert, 
  FileText, 
  ExternalLink, 
  Calendar, 
  HelpCircle,
  Copy,
  Check,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AnswerCard({ message, onSelectSource }) {
  const [copied, setCopied] = React.useState(false);

  const copyAnswer = () => {
    navigator.clipboard.writeText(message.answer || message.direct_answer || '');
    setCopied(true);
    toast.success('Answer copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const isUnsupported = !message.supported;

  return (
    <div className={`
      rounded-2xl border transition-all duration-200 overflow-hidden
      ${isUnsupported 
        ? 'bg-rose-950/20 border-rose-900/50' 
        : 'bg-[#111827] border-slate-800 shadow-xl shadow-black/30'}
    `}>
      {/* Card Header */}
      <div className="px-5 py-3.5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/50">
        <div className="flex items-center gap-2">
          {message.is_general_knowledge ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              GENERAL AI COPILOT
            </span>
          ) : isUnsupported ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              <ShieldAlert className="w-3.5 h-3.5" />
              NOT IN DOCUMENTS
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              EVIDENCE GROUNDED
            </span>
          )}

          {message.sources && message.sources.length > 0 && (
            <span className="text-xs text-slate-400 font-mono hidden sm:inline-block">
              · {message.sources.length} {message.sources.length === 1 ? 'Citation' : 'Citations'}
            </span>
          )}
        </div>

        <button
          onClick={copyAnswer}
          className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800/80 transition-colors flex items-center gap-1 text-xs"
          title="Copy response"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        {/* Revision Notice Banner */}
        {message.revision_notice && (
          <div className="p-3.5 rounded-xl bg-teal-950/40 border border-teal-500/30 text-teal-200 text-xs flex items-start gap-2.5 leading-relaxed">
            <span className="text-base">🛡️</span>
            <div>
              <strong className="block text-teal-300 font-semibold mb-0.5">Document Revision Intelligence</strong>
              {message.revision_notice}
            </div>
          </div>
        )}

        {/* 1. Direct Answer */}
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-teal-400 font-semibold mb-1.5 flex items-center gap-1.5">
            <span>Direct Operational Response</span>
          </div>
          <div className="text-slate-100 text-base leading-relaxed font-medium">
            {message.direct_answer || message.answer}
          </div>
        </div>

        {/* 2. Important Steps or Conditions */}
        {message.important_steps && message.important_steps.length > 0 && (
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-2">
            <div className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
              <span>Mandatory Sequence & Conditions</span>
            </div>
            <ul className="space-y-2 mt-2">
              {message.important_steps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-300">
                  <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-mono text-teal-300 shrink-0 mt-0.5 font-bold">
                    {idx + 1}
                  </span>
                  <span className="leading-snug">{step}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 3. Safety Warning Banner */}
        {message.safety_warning && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-200 text-xs sm:text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold text-amber-300 uppercase tracking-wide text-xs">
                Safety Prerequisite (SAF-SOP-003 Alignment)
              </strong>
              <p className="mt-1 leading-relaxed text-amber-200/95">{message.safety_warning}</p>
            </div>
          </div>
        )}

        {/* 4. Supporting Document Citations */}
        {message.sources && message.sources.length > 0 && (
          <div className="pt-2 border-t border-slate-800/60">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-2.5 flex items-center justify-between">
              <span>Controlled Sources & Citations</span>
              <span className="text-[10px] text-slate-400 lowercase">Click to inspect excerpt or PDF</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {message.sources.map((src, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectSource && onSelectSource(src)}
                  className={`
                    p-3 rounded-xl border text-left transition-all duration-150 group
                    ${src.is_superseded 
                      ? 'bg-amber-950/20 border-amber-800/40 hover:border-amber-600' 
                      : 'bg-slate-900/60 border-slate-800 hover:border-teal-500/50 hover:bg-slate-900'}
                  `}
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-teal-300 group-hover:text-teal-200 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      {src.document_number}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                      src.is_superseded 
                        ? 'bg-amber-500/20 text-amber-300' 
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      Rev {src.revision}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 font-medium mt-1 truncate">
                    {src.document_name}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-2 pt-1.5 border-t border-slate-800/60">
                    <span>Page {src.page_number}</span>
                    <span className="flex items-center gap-1 text-teal-400 group-hover:translate-x-0.5 transition-transform text-[10px]">
                      View Page →
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Card Footer Controlled Copy Reminder */}
      <div className="px-5 py-2.5 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <span>Kaveri Precision Components · QMS Reference</span>
        <span>Uncontrolled when printed</span>
      </div>
    </div>
  );
}
