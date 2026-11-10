import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  RotateCcw, 
  AlertCircle, 
  ArrowRight,
  Bot,
  User,
  ShieldCheck,
  Zap,
  CornerDownLeft
} from 'lucide-react';
import toast from 'react-hot-toast';
import { chatApi } from '../services/api';
import AnswerCard from '../components/AnswerCard';
import SourceModal from '../components/SourceModal';

const SUGGESTED_QUESTIONS = [
  { label: 'Normal hydraulic pressure for TX-200', q: 'What is the normal hydraulic pressure for the TX-200 CNC machine?' },
  { label: 'Supplier MTC missing procedure', q: 'What should QC do if the supplier Material Test Certificate (MTC) is missing?' },
  { label: 'Zero energy verification (LOTO)', q: 'How do I verify zero energy before beginning machine maintenance?' },
  { label: 'Sampling for 750 pieces (Rev 04)', q: 'For an incoming lot of 750 pieces, how many samples should QC inspect?' },
  { label: 'Hydraulic hose replacement', q: 'What is the procedure for replacing a hydraulic hose on the TX-200?' },
  { label: 'CNC Alarm AL-104 action', q: 'What should the operator do when alarm AL-104 appears on the TX-200 CNC?' },
  { label: 'Quarantine cage & key custody', q: 'Where must rejected incoming material be moved, and who keeps the key to the quarantine cage?' },
  { label: 'LOTO lock removal by another person', q: 'Can an operator remove another employee lockout lock if they went home?' },
  { label: 'Spindle bearing grease (Document Cannot Answer)', q: 'What is the spindle bearing grease specification and relubrication interval for the TX-200 spindle?' },
  { label: '5S Methodology in Plant (General AI)', q: 'What is 5S methodology in manufacturing?' },
  { label: 'Previous Rev 03 sampling (Historical)', q: 'What did the previous Revision 03 of QC-SOP-014 require for sampling?' },
  { label: 'Plant Head mobile number (Guardrail)', q: 'What is the personal mobile number of the Plant Head?' },
];

export default function Copilot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedSource, setSelectedSource] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSubmit = async (overrideQuestion) => {
    const query = (overrideQuestion || input).trim();
    if (!query || query.length < 3) {
      toast.error('Please enter at least 3 characters');
      return;
    }

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const data = await chatApi.ask(query);
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        ...data
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      toast.error('Failed to get answer from copilot');
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        answer: 'Unable to reach the PlantPilot service. Ensure the FastAPI backend is running.',
        direct_answer: 'Connection error with the local knowledge base.',
        supported: false,
        sources: []
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleClear = () => {
    setMessages([]);
    toast.success('Conversation cleared');
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-[#0A0F1D]">
      {/* Top Banner & Quick Controls */}
      <div className="px-4 lg:px-8 py-3 border-b border-slate-800/80 bg-[#0C1324] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-teal-400"></span>
          <span className="text-xs font-mono font-medium text-slate-300">
            Grounding: 4 Controlled PDFs · ChromaDB Vector Search
          </span>
        </div>

        {messages.length > 0 && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 px-2.5 py-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Main Chat Stream */}
      <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-6 space-y-6">
        {messages.length === 0 ? (
          /* Empty / Welcome State */
          <div className="max-w-3xl mx-auto py-8 text-center space-y-8 animate-fade-in">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shadow-xl shadow-teal-500/5">
              <Bot className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                PlantPilot AI Copilot
              </h2>
              <p className="text-sm text-slate-400 max-w-lg mx-auto">
                Ask operational questions across Hosur Plant’s CNC maintenance manual, incoming material inspection SOP, and LOTO procedures.
              </p>
            </div>

            {/* Suggested Chips */}
            <div className="space-y-3 text-left">
              <div className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold px-1">
                Verified Benchmark Queries
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SUGGESTED_QUESTIONS.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSubmit(item.q)}
                    className="p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-teal-500/40 text-left transition-all duration-150 group flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-teal-300 transition-colors">
                        {item.label}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                        {item.q}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Messages List */
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((msg) => (
              <div key={msg.id} className="space-y-2">
                {msg.role === 'user' ? (
                  /* User message pill */
                  <div className="flex justify-end items-end gap-2.5">
                    <div className="max-w-2xl px-5 py-3 rounded-2xl rounded-br-none bg-teal-600 text-white shadow-lg text-sm font-medium">
                      {msg.text}
                    </div>
                    <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-teal-300 shrink-0">
                      QC
                    </div>
                  </div>
                ) : (
                  /* Assistant message card */
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0 mt-1 shadow-sm">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="flex-1 max-w-3xl">
                      <AnswerCard message={msg} onSelectSource={setSelectedSource} />

                      {/* Suggested Followups */}
                      {msg.suggested_followups && msg.suggested_followups.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5 items-center">
                          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide mr-1">Follow up:</span>
                          {msg.suggested_followups.map((f, fIdx) => (
                            <button
                              key={fIdx}
                              onClick={() => handleSubmit(f)}
                              className="text-xs px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-teal-300 hover:border-teal-500/40 transition-colors"
                            >
                              {f}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0 mt-1 animate-pulse">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="max-w-md p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono text-teal-400">
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping"></span>
                    <span>Searching ChromaDB & applying revision rules…</span>
                  </div>
                  <div className="h-2 w-48 bg-slate-800 rounded animate-pulse"></div>
                  <div className="h-2 w-32 bg-slate-800 rounded animate-pulse"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Dock Area (Mobile-First) */}
      <div className="p-4 lg:px-8 border-t border-slate-800/80 bg-[#0E1528] shrink-0">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-2xl bg-slate-950 border border-slate-800 focus-within:border-teal-500/60 shadow-xl transition-all">
            <textarea
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask an SOP, LOTO or QC question (e.g. 'What is the normal hydraulic pressure for TX-200?')"
              className="w-full bg-transparent px-4 py-3 text-sm text-slate-100 placeholder-slate-400 focus:outline-none resize-none"
            />

            <div className="px-3 pb-2.5 pt-1 flex items-center justify-between border-t border-slate-900">
              <span className="text-[11px] text-slate-400 hidden sm:inline-flex items-center gap-1 font-mono">
                Press <CornerDownLeft className="w-3 h-3" /> Enter to send
              </span>
              <span className="text-[11px] text-slate-400 sm:hidden">
                Grounded in 4 plant PDFs
              </span>

              <button
                onClick={() => handleSubmit()}
                disabled={loading || !input.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:bg-slate-800 disabled:text-slate-400 text-xs font-semibold text-white shadow-md shadow-teal-600/20 transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                <span>Ask Copilot</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Source Excerpt Modal */}
      <SourceModal source={selectedSource} onClose={() => setSelectedSource(null)} />
    </div>
  );
}
