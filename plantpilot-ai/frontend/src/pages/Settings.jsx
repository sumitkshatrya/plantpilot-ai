import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Wifi, 
  Cpu, 
  RefreshCw, 
  ShieldCheck, 
  ExternalLink, 
  CheckCircle, 
  Smartphone,
  HardDrive
} from 'lucide-react';
import toast from 'react-hot-toast';
import { systemApi, documentsApi } from '../services/api';

export default function SettingsPage() {
  const [health, setHealth] = useState(null);
  const [reindexing, setReindexing] = useState(false);

  useEffect(() => {
    systemApi.getHealth().then(setHealth).catch(() => null);
  }, []);

  const handleReindex = async () => {
    setReindexing(true);
    try {
      const res = await documentsApi.reindex();
      toast.success(`ChromaDB refreshed with ${res.indexed_chunks} chunks.`);
      const updatedHealth = await systemApi.getHealth();
      setHealth(updatedHealth);
    } catch (err) {
      toast.error('Reindexing failed');
    } finally {
      setReindexing(false);
    }
  };

  const currentHost = window.location.hostname;

  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-6 space-y-6 bg-[#0A0F1D]">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">System & Network Settings</h2>
        <p className="text-xs text-slate-400 mt-1">
          Configuration, vector store diagnostics, and local Wi-Fi mobile deployment instructions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plant Metadata & RAG Status */}
        <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 text-sm font-semibold text-white">
            <Cpu className="w-4 h-4 text-teal-400" />
            <span>RAG Engine & Grounding Status</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400">Plant / Unit</span>
              <span className="font-semibold text-slate-200">Kaveri Precision Components</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400">Location</span>
              <span className="font-semibold text-slate-200">Hosur Plant, Tamil Nadu</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400">Vector Store</span>
              <span className="font-mono text-teal-400 font-semibold">ChromaDB (Persistent SQLite)</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400">Embedding Engine</span>
              <span className="font-mono text-teal-400 font-semibold">all-MiniLM-L6-v2 (ONNX)</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-400">Active Synthesis Mode</span>
              <span className="font-semibold text-emerald-400">{health?.active_llm_mode || 'Local Grounded RAG'}</span>
            </div>

            <div className="pt-2">
              <button
                onClick={handleReindex}
                disabled={reindexing}
                className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-semibold flex items-center justify-center gap-2 text-xs shadow-md shadow-teal-600/20 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${reindexing ? 'animate-spin' : ''}`} />
                <span>{reindexing ? 'Reindexing Collections…' : 'Reindex ChromaDB Collections'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile & Wi-Fi Deployment Instructions */}
        <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 text-sm font-semibold text-white">
            <Smartphone className="w-4 h-4 text-cyan-400" />
            <span>Shop-Floor Mobile Wi-Fi Access</span>
          </div>

          <div className="space-y-3 text-xs leading-relaxed text-slate-300">
            <p>
              To access PlantPilot AI on a mobile phone or tablet while on the shop floor:
            </p>

            <ol className="list-decimal list-inside space-y-2 p-3.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300">
              <li>Connect your laptop and phone to the same shop-floor Wi-Fi.</li>
              <li>Find your laptop's private IPv4 address:
                <code className="block mt-1 p-1 bg-slate-950 text-teal-300 rounded">
                  Windows PowerShell: ipconfig
                </code>
              </li>
              <li>Open your phone's browser and navigate to:
                <code className="block mt-1 p-1 bg-slate-950 text-teal-300 rounded">
                  http://{currentHost === 'localhost' || currentHost === '127.0.0.1' ? '<YOUR-LAPTOP-IP>' : currentHost}:5173
                </code>
              </li>
              <li>Backend API communicates dynamically without hardcoded localhost.</li>
            </ol>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200">
              <strong>Firewall Note:</strong> If your phone cannot connect, allow port 5173 and 8000 through the Windows Defender Firewall for Private Networks.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
