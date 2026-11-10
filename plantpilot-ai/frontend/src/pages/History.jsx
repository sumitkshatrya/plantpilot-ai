import React, { useState, useEffect } from 'react';
import { History, Trash2, ArrowRight, ShieldAlert, CheckCircle, Clock, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { chatApi } from '../services/api';

export default function HistoryPage({ onSelectQuestion }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await chatApi.getHistory();
      setHistory(data);
    } catch (err) {
      toast.error('Failed to load inquiry history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleClear = async () => {
    try {
      await chatApi.clearHistory();
      setHistory([]);
      toast.success('Inquiry history cleared');
    } catch (err) {
      toast.error('Failed to clear history');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-6 space-y-6 bg-[#0A0F1D]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Recent Inquiries</h2>
          <p className="text-xs text-slate-400 mt-1">
            Log of manufacturing and safety questions asked during this active shift.
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={handleClear}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-xs font-medium text-slate-300 hover:text-rose-400 border border-slate-700 hover:border-rose-800 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Log</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading history…</div>
      ) : history.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#111827] border border-slate-800 space-y-3">
          <History className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-300">No questions logged yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Questions asked in the AI Copilot during this shift will appear here with cited document references.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectQuestion && onSelectQuestion(item.question)}
              className="p-4 rounded-xl bg-[#111827] border border-slate-800 hover:border-slate-700 cursor-pointer transition-all flex items-start justify-between gap-4 group"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  {item.supported ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle className="w-3 h-3" />
                      Grounded
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/20">
                      <ShieldAlert className="w-3 h-3" />
                      Not in SOPs
                    </span>
                  )}

                  <span className="text-[11px] font-mono text-slate-400">{item.timestamp}</span>

                  {item.primary_source && (
                    <span className="text-[11px] font-mono text-teal-400 hidden sm:inline-flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {item.primary_source} (Rev {item.revision})
                    </span>
                  )}
                </div>

                <div className="text-sm font-semibold text-white group-hover:text-teal-300 transition-colors">
                  {item.question}
                </div>

                {item.direct_answer && (
                  <p className="text-xs text-slate-400 line-clamp-1">
                    {item.direct_answer}
                  </p>
                )}
              </div>

              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-400 group-hover:translate-x-1 transition-all shrink-0 mt-2" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
