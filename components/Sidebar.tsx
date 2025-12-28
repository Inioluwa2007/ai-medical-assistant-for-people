
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
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      <aside className={`fixed inset-y-0 left-0 w-72 bg-slate-50 border-r border-slate-200 z-40 transition-transform duration-300 lg:translate-x-0 lg:static ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6">
            <button 
              onClick={onNewChat}
              className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 font-semibold py-3 px-4 rounded-xl transition-all shadow-sm active:scale-95"
            >
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              New Consultation
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto px-4 space-y-2 custom-scrollbar">
            <div className="flex items-center justify-between px-2 mb-2">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recent Guidance</h3>
              {sessions.length > 0 && (
                <button 
                  onClick={onClearAll}
                  className="text-[10px] font-bold text-red-400 hover:text-red-600 uppercase tracking-widest transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>
            
            {sessions.length === 0 ? (
              <p className="px-2 text-xs text-slate-400 italic">No recent chats yet.</p>
            ) : (
              sessions.map((session) => (
                <div key={session.id} className="relative group">
                  <button
                    onClick={() => onSelectSession(session.id)}
                    className={`w-full text-left px-3 py-3 pr-10 rounded-xl transition-all text-sm ${
                      currentSessionId === session.id 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-100' 
                        : 'hover:bg-white text-slate-600 border border-transparent hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <svg className={`w-4 h-4 flex-shrink-0 ${currentSessionId === session.id ? 'text-blue-100' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                      <span className="truncate font-medium">{session.title || 'Ongoing Chat'}</span>
                    </div>
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity ${
                      currentSessionId === session.id 
                        ? 'text-blue-200 hover:text-white hover:bg-blue-700' 
                        : 'text-slate-300 hover:text-red-500 hover:bg-red-50'
                    }`}
                    title="Delete Chat"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
          
          <div className="p-6 border-t border-slate-200 bg-slate-100/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">M</div>
              <div>
                <p className="text-xs font-bold text-slate-700 leading-none">Student MVP</p>
                <p className="text-[10px] text-slate-500 mt-1">MediGuide v1.1</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
