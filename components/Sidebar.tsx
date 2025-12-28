
import React from 'react';
import { ChatSession } from '../types';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onClearAll: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  sessions, 
  currentSessionId, 
  onNewChat, 
  onSelectSession, 
  onDeleteSession,
  onClearAll,
  isOpen,
  onToggle
}) => {
  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-indigo-900/10 backdrop-blur-sm z-30 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      <aside className={`fixed inset-y-0 left-0 w-72 bg-white/80 border-r border-indigo-50 z-40 transition-transform duration-500 ease-in-out lg:translate-x-0 lg:static glass ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6">
            <button 
              onClick={onNewChat}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-br from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold py-3.5 px-4 rounded-2xl transition-all shadow-lg shadow-indigo-200 active:scale-95 group"
            >
              <div className="p-1 bg-white/20 rounded-lg group-hover:rotate-90 transition-transform duration-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              New Consultation
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto px-4 space-y-2 custom-scrollbar">
            <div className="flex items-center justify-between px-2 mb-4">
              <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">History</h3>
              {sessions.length > 0 && (
                <button 
                  onClick={onClearAll}
                  className="text-[10px] font-bold text-rose-400 hover:text-rose-600 uppercase tracking-widest transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
            
            {sessions.length === 0 ? (
              <div className="px-4 py-8 text-center bg-indigo-50/50 rounded-2xl border border-dashed border-indigo-200">
                <p className="text-xs text-indigo-400 font-medium italic">Empty consultations</p>
              </div>
            ) : (
              sessions.map((session) => (
                <div key={session.id} className="relative group mb-1">
                  <button
                    onClick={() => onSelectSession(session.id)}
                    className={`w-full text-left px-4 py-4 pr-12 rounded-2xl transition-all text-sm relative overflow-hidden ${
                      currentSessionId === session.id 
                        ? 'bg-gradient-to-r from-indigo-50 to-white text-indigo-700 font-bold shadow-sm border border-indigo-100' 
                        : 'hover:bg-white text-slate-500 hover:text-indigo-600 border border-transparent hover:border-indigo-50'
                    }`}
                  >
                    {currentSessionId === session.id && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600" />
                    )}
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${currentSessionId === session.id ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                        </svg>
                      </div>
                      <span className="truncate">{session.title || 'Ongoing Chat'}</span>
                    </div>
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-50 hover:text-rose-500 text-slate-300"
                    title="Delete Chat"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
          
          <div className="p-6 border-t border-indigo-50 glass">
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-4 rounded-2xl border border-indigo-100/50 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white text-sm font-black shadow-lg shadow-indigo-200">
                M
              </div>
              <div>
                <p className="text-xs font-black text-indigo-900 leading-none">MediGuide Pro</p>
                <p className="text-[10px] text-indigo-500 mt-1 font-bold">Student Edition v1.2</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
