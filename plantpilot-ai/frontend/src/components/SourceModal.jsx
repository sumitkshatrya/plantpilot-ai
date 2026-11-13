import React from 'react';
import { X, FileText, ExternalLink, Calendar, Layers, AlertTriangle, ShieldCheck } from 'lucide-react';
import { documentsApi } from '../services/api';

export default function SourceModal({ source, onClose }) {
  if (!source) return null;

  const getPdfUrl = () => {
    let url = '';
    if (source.filename) {
      url = documentsApi.getRawPdfUrl(source.filename);
    } else if (source.document_number) {
      const revParam = source.revision ? `?rev=${source.revision}` : '';
      url = `${documentsApi.getRawPdfUrl(source.document_number + '.pdf')}${revParam}`;
    } else {
      url = documentsApi.getRawPdfUrl('QC-SOP-014_Rev04_Incoming_Material_Inspection.pdf');
    }
    if (source.page_number) {
      url += `#page=${source.page_number}`;
    }
    return url;
  };

  const pdfUrl = getPdfUrl();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#111827] border border-slate-700 w-full max-w-2xl rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-3.5 sm:p-5 border-b border-slate-800 flex items-start justify-between bg-slate-900/60 gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${
              source.category === 'Safety' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
              source.category === 'Quality' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
              'bg-teal-500/10 text-teal-400 border border-teal-500/20'
            }`}>
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="font-mono text-xs sm:text-sm font-bold text-white">{source.document_number}</span>
                <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700">
                  Rev {source.revision}
                </span>
                <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded font-mono font-medium bg-teal-500/10 text-teal-400 border border-teal-500/20">
                  Page {source.page_number}
                </span>
              </div>
              <h3 className="text-xs sm:text-sm font-semibold text-slate-200 mt-1 truncate">
                {source.document_name}
              </h3>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center -mr-1"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 sm:space-y-4 text-xs sm:text-sm">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Effective Date</span>
              <span className="text-slate-200 font-medium">{source.effective_date}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Section</span>
              <span className="text-slate-200 font-medium truncate block">{source.section || 'General Procedure'}</span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-slate-400 block text-[10px] uppercase">Relevance Score</span>
              <span className="text-teal-400 font-semibold">{Math.round(source.score * 100)}% match</span>
            </div>
          </div>

          {/* Supersession Warning if applicable */}
          {source.is_superseded && (
            <div className="p-3 sm:p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-amber-200 text-xs leading-relaxed">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-amber-300 font-semibold mb-0.5">Superseded Revision Warning</strong>
                This revision ({source.revision}) is historical. For active operational tasks, verify {source.superseded_by || 'the current controlled revision in the QMS'}.
              </div>
            </div>
          )}

          {/* Retrieved Excerpt */}
          <div>
            <div className="text-[11px] sm:text-xs uppercase font-mono tracking-wider text-slate-400 mb-2 font-semibold">
              Retrieved Page Excerpt
            </div>
            <div className="p-3.5 sm:p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 font-mono text-[11px] sm:text-xs text-slate-300 leading-relaxed whitespace-pre-wrap max-h-48 sm:max-h-64 overflow-y-auto">
              {source.excerpt}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-800 bg-slate-900/60 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-0 safe-pb">
          <span className="text-[11px] text-slate-400 text-center sm:text-left">Controlled QMS Document · Kaveri Precision</span>
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors min-h-[38px]"
            >
              Close
            </button>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-xs font-semibold text-white shadow-lg shadow-teal-600/20 transition-colors min-h-[38px]"
            >
              <span>Open PDF</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
