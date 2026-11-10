import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';
import Dashboard from './pages/Dashboard';
import Copilot from './pages/Copilot';
import Documents from './pages/Documents';
import History from './pages/History';
import Settings from './pages/Settings';

export default function App() {
  const [activeTab, setActiveTab] = useState('copilot');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState(null);

  const handleNavigateToCopilot = (question) => {
    setActiveTab('copilot');
    if (question) {
      setPendingQuestion(question);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0A0F1D] text-slate-100 font-sans">
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: '#111827',
            color: '#F8FAFC',
            border: '1px solid #374151',
            borderRadius: '0.75rem',
            fontSize: '0.8rem',
            fontFamily: 'Inter, sans-serif'
          }
        }}
      />

      {/* Main Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        mobileOpen={mobileOpen} 
        setMobileOpen={setMobileOpen} 
      />

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <TopNav 
          onMenuToggle={() => setMobileOpen(!mobileOpen)} 
          activeTab={activeTab} 
        />

        <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {activeTab === 'copilot' && <Copilot initialQuestion={pendingQuestion} />}
          {activeTab === 'dashboard' && <Dashboard onNavigateToCopilot={handleNavigateToCopilot} />}
          {activeTab === 'documents' && <Documents onAskAboutDoc={handleNavigateToCopilot} />}
          {activeTab === 'history' && <History onSelectQuestion={handleNavigateToCopilot} />}
          {activeTab === 'settings' && <Settings />}
        </main>
      </div>
    </div>
  );
}
