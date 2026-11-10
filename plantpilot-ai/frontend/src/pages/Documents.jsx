import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  ExternalLink, 
  Calendar, 
  Layers, 
  RefreshCw, 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  ShieldCheck,
  HardDrive
} from 'lucide-react';
import toast from 'react-hot-toast';
import { documentsApi } from '../services/api';
import SourceModal from '../components/SourceModal';

export default function Documents({ onAskAboutDoc }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reindexing, setReindexing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [previewDoc, setPreviewDoc] = useState(null);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const data = await documentsApi.getAll();
      setDocuments(data);
    } catch (err) {
      toast.error('Failed to load documents list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleReindex = async () => {
    setReindexing(true);
    try {
      const res = await documentsApi.reindex();
      toast.success(`Successfully reindexed ${res.indexed_chunks} chunks into ChromaDB`);
      await fetchDocs();
    } catch (err) {
      toast.error('Reindexing failed');
    } finally {
      setReindexing(false);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = 
      doc.document_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.document_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = 
      filterCategory === 'ALL' || doc.category.toUpperCase() === filterCategory.toUpperCase();

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-6 space-y-6 bg-[#0A0F1D]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Controlled Documents Library</h2>
          <p className="text-xs text-slate-400 mt-1">
            Source of truth for plant procedures, equipment parameters, and safety requirements.
          </p>
        </div>

        <button
          onClick={handleReindex}
          disabled={reindexing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${reindexing ? 'animate-spin text-teal-400' : ''}`} />
          <span>{reindexing ? 'Reindexing Vectors…' : 'Reindex Documents'}</span>
        </button>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[#111827] border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter by document number (e.g. QC-SOP-014), name, or keyword…"
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-teal-500/60"
          />
        </div>

        <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'MAINTENANCE', 'QUALITY', 'SAFETY'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                filterCategory === cat
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Document Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading plant documents…</div>
      ) : filteredDocs.length === 0 ? (
        <div className="py-16 text-center text-xs text-slate-400">No matching documents found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDocs.map((doc, idx) => {
            const pdfUrl = documentsApi.getRawPdfUrl(doc.filename);
            return (
              <div
                key={idx}
                className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between space-y-4 ${
                  doc.is_superseded
                    ? 'bg-amber-950/10 border-amber-900/40'
                    : 'bg-[#111827] border-slate-800 hover:border-slate-700 shadow-lg'
                }`}
              >
                <div>
                  {/* Category & Status Bar */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-semibold ${
                      doc.category === 'Safety' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20' :
                      doc.category === 'Quality' ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20' :
                      'bg-teal-500/15 text-teal-400 border border-teal-500/20'
                    }`}>
                      {doc.category}
                    </span>

                    {doc.is_superseded ? (
                      <span className="flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        <AlertTriangle className="w-3 h-3" />
                        SUPERSEDED
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                        <CheckCircle className="w-3 h-3" />
                        CONTROLLED COPY
                      </span>
                    )}
                  </div>

                  {/* Title & Document Number */}
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-base font-bold text-white tracking-tight">
                      {doc.document_number}
                    </span>
                    <span className="text-xs font-mono font-semibold text-slate-400">
                      · Rev {doc.revision}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-200 mt-1 leading-snug">
                    {doc.document_name}
                  </h3>

                  <p className="text-xs text-slate-400 mt-2.5 leading-relaxed line-clamp-2">
                    {doc.description}
                  </p>

                  {/* Superseded Explanation */}
                  {doc.is_superseded && (
                    <div className="mt-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200/90 leading-relaxed">
                      <strong>Historical note:</strong> Superseded by {doc.superseded_by}. Retained for revision history queries only.
                    </div>
                  )}
                </div>

                {/* Footer Metadata & Actions */}
                <div className="pt-3 border-t border-slate-800/80 space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-[11px] font-mono text-slate-400">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">Effective</span>
                      <span className="text-slate-300">{doc.effective_date}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">Pages</span>
                      <span className="text-slate-300">{doc.total_pages} Pages</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">Size</span>
                      <span className="text-slate-300">{doc.file_size_kb} KB</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href={pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5 text-teal-400" />
                      <span>Open PDF</span>
                      <ExternalLink className="w-3 h-3 text-slate-400 ml-0.5" />
                    </a>

                    {onAskAboutDoc && (
                      <button
                        onClick={() => onAskAboutDoc(`What are the key instructions in ${doc.document_number} Rev ${doc.revision}?`)}
                        className="py-2 px-3 rounded-xl bg-teal-600/20 hover:bg-teal-600/30 border border-teal-500/30 text-xs font-semibold text-teal-300 transition-colors"
                      >
                        Ask Copilot
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
