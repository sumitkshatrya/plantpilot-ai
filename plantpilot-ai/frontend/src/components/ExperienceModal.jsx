import React, { useState } from 'react';
import { X, Award, Check, Sparkles, UserCheck, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';

export const STANDARD_EXPERIENCE_OPTIONS = [
  { id: 'fresher-0', label: 'Fresher / Trainee (0 Years)', tag: 'Fresher (0 Yrs)', desc: 'Detailed step-by-step guidance, acronym definitions, and emphasized safety fundamentals.' },
  { id: 'exp-1', label: '1 Year (Junior Operator)', tag: '1 Year', desc: 'Guided checklist sequence, standard safety reminders, and basic operational parameters.' },
  { id: 'exp-2', label: '2 Years (Operator)', tag: '2 Years', desc: 'Core operational parameters, standard tool numbers, and machine alarm troubleshooting.' },
  { id: 'exp-3', label: '3 Years (Technician)', tag: '3 Years', desc: 'Direct parameter values, hydraulic pressures, chuck clamp ranges, and revision compliance.' },
  { id: 'exp-4', label: '4 Years (Senior Technician)', tag: '4 Years', desc: 'Precision machine diagnostics, emergency LOTO rules, and quarantine procedures.' },
  { id: 'exp-5', label: '5 Years (Specialist)', tag: '5 Years', desc: 'High-precision engineering tolerances, ISO 9001 clauses, and spindle runout limits.' },
  { id: 'exp-6-9', label: '6 - 9 Years (Shift In-Charge)', tag: '6-9 Years', desc: 'Supervisory oversight, shift handovers, MTC verification, and corrective action workflows.' },
  { id: 'exp-10-plus', label: '10+ Years (Senior Lead / Manager)', tag: '10+ Years', desc: 'Executive QMS compliance, cross-departmental escalations, and audit readiness.' },
  { id: 'exp-15-plus', label: '15+ Years (Principal Engineer / Plant Head)', tag: '15+ Years', desc: 'Strategic plant operations, machine safety governance, and root-cause CAPA analysis.' }
];

export default function ExperienceModal({ isOpen, onClose, currentExperience, onSelectExperience }) {
  const [customInput, setCustomInput] = useState('');
  const [isTypingCustom, setIsTypingCustom] = useState(false);

  if (!isOpen) return null;

  const handleSelect = (expLabel) => {
    onSelectExperience(expLabel);
    localStorage.setItem('plantpilot_experience', expLabel);
    window.dispatchEvent(new Event('plantpilot-exp-changed'));
    toast.success(`Experience level set to: ${expLabel}`);
    onClose();
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    const trimmed = customInput.trim();
    if (!trimmed) {
      toast.error('Please enter your custom experience');
      return;
    }
    handleSelect(trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#111827] border border-slate-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[88vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-start justify-between bg-slate-900/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Select Experience Level</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-teal-500/10 text-teal-300 border border-teal-500/20">
                  AI Tailored
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Starts from Fresher (0 Years) to Senior Level, or type your custom experience.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center -mr-1"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* Active selection banner */}
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Current Active Experience:</span>
            <span className="font-semibold text-teal-300 font-mono bg-teal-950/60 px-2.5 py-1 rounded-md border border-teal-500/30">
              {currentExperience || 'Fresher / Trainee (0 Years)'}
            </span>
          </div>

          {/* Quick Select Options */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold px-1 block">
              Standard Experience Tiers (0 to Higher Level)
            </label>
            <div className="space-y-2 max-h-56 sm:max-h-64 overflow-y-auto pr-1">
              {STANDARD_EXPERIENCE_OPTIONS.map((opt) => {
                const isSelected = currentExperience === opt.label || currentExperience === opt.tag;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelect(opt.label)}
                    className={`w-full p-3 rounded-xl text-left border transition-all flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-teal-950/30 border-teal-500/60 shadow-md shadow-teal-500/5'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold text-xs sm:text-sm ${isSelected ? 'text-teal-300' : 'text-slate-200'}`}>
                          {opt.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                        {opt.desc}
                      </p>
                    </div>

                    <div className="shrink-0 mt-0.5">
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-teal-500 text-white flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-slate-700"></div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Experience Written Field */}
          <div className="pt-3 border-t border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Write Custom Experience (Not in list)</span>
              </label>
              <span className="text-[10px] text-slate-400">Type any role or duration</span>
            </div>

            <form onSubmit={handleCustomSubmit} className="space-y-2.5">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="e.g. 6 Months Diploma Trainee, 7.5 Years CNC Machinist, 20 Years QMS Auditor..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/70 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none transition-colors"
              />

              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-400 font-mono">
                  Custom experience is stored and sent to AI Copilot
                </span>
                <button
                  type="submit"
                  disabled={!customInput.trim()}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-xs font-semibold text-white shadow-md shadow-cyan-600/20 transition-all shrink-0 min-h-[36px]"
                >
                  Apply Custom Experience
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between safe-pb">
          <span className="text-[11px] text-slate-400">Saved in browser session & local storage</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
