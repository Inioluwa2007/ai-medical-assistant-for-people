
import React, { useState, useRef, useEffect } from 'react';
import { Message, MessageRole, ChatSession } from './types';
import { sendMessageToGemini } from './services/geminiService';
import { Disclaimer } from './components/Disclaimer';
import { ChatMessage } from './components/ChatMessage';
import { Welcome } from './components/Welcome';
import { TermsModal } from './components/TermsModal';
import { Sidebar } from './components/Sidebar';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('mediguide_sessions');
    return saved ? JSON.parse(saved).map((s: any) => ({
      ...s,
      messages: s.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }))
    })) : [];
  });
  
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(() => {
    const saved = localStorage.getItem('mediguide_sessions');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.length > 0 ? parsed[0].id : null;
    }
    return null;
  });
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(() => {
    return localStorage.getItem('mediguide_accepted') === 'true';
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  useEffect(() => {
    localStorage.setItem('mediguide_sessions', JSON.stringify(sessions));
  }, [sessions]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleAcceptTerms = () => {
    setHasAcceptedTerms(true);
    localStorage.setItem('mediguide_accepted', 'true');
  };

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      messages: [],
      title: 'New Consultation'
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setIsSidebarOpen(false);
  };

  const handleDeleteSession = (id: string) => {
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== id);
      if (currentSessionId === id) {
        setCurrentSessionId(filtered.length > 0 ? filtered[0].id : null);
      }
      return filtered;
    });
  };

  const handleClearAll = () => {
    if (confirm("Are you sure you want to delete all consultation history? This cannot be undone.")) {
      setSessions([]);
      setCurrentSessionId(null);
    }
  };

  const handleSelectSession = (id: string) => {
    setCurrentSessionId(id);
    setIsSidebarOpen(false);
  };

  const handleFeedback = (messageId: string, feedback: 'positive' | 'negative') => {
    setSessions(prev => prev.map(s => {
      if (s.id === currentSessionId) {
        return {
          ...s,
          messages: s.messages.map(m => m.id === messageId ? { ...m, feedback } : m)
        };
      }
      return s;
    }));
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    let sessionId = currentSessionId;
    if (!sessionId) {
      const newSession: ChatSession = {
        id: Date.now().toString(),
        messages: [],
        title: text.length > 30 ? text.substring(0, 30) + '...' : text
      };
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      sessionId = newSession.id;
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: MessageRole.USER,
      content: text,
      timestamp: new Date(),
    };

    setSessions(prev => prev.map(s => 
      s.id === sessionId 
        ? { ...s, messages: [...s.messages, userMsg], title: s.messages.length === 0 ? text.substring(0, 30) : s.title } 
        : s
    ));
    
    setInput('');
    setIsLoading(true);

    try {
      const currentHistory = sessions.find(s => s.id === sessionId)?.messages || [];
      const aiResponse = await sendMessageToGemini([...currentHistory, userMsg], text);
      
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: MessageRole.ASSISTANT,
        content: aiResponse,
        timestamp: new Date(),
      };
      
      setSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, messages: [...s.messages, assistantMsg] } : s
      ));
    } catch (error) {
      console.error("Failed to fetch response", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  if (!hasAcceptedTerms) {
    return <TermsModal onAccept={handleAcceptTerms} />;
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      <Sidebar 
        sessions={sessions}
        currentSessionId={currentSessionId}
        onNewChat={createNewSession}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        onClearAll={handleClearAll}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <main className="flex-1 flex flex-col min-w-0 bg-white relative">
        {/* Header */}
        <header className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md z-20">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-slate-800 transition-colors"
              aria-label="Open Sidebar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
            <div className="hidden sm:flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-100">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">MediGuide AI</h1>
            </div>
            {currentSession && (
              <span className="hidden sm:block text-slate-300 mx-2">|</span>
            )}
            <h2 className="text-sm font-medium text-slate-500 truncate max-w-[200px]">
              {currentSession?.title || 'New Consultation'}
            </h2>
          </div>
          
          <button 
            onClick={createNewSession}
            className="text-xs font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-full hover:bg-blue-100 transition-all active:scale-95"
          >
            Start Fresh
          </button>
        </header>

        {/* Scrollable Chat Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <div className="max-w-3xl mx-auto pb-24">
            <Disclaimer />
            
            {messages.length === 0 ? (
              <Welcome onQuickAction={handleSend} />
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {messages.map((msg) => (
                  <ChatMessage 
                    key={msg.id} 
                    message={msg} 
                    onFeedback={msg.role === MessageRole.ASSISTANT ? handleFeedback : undefined}
                  />
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-none p-4 shadow-sm">
                      <div className="flex space-x-1">
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Floating Input Area */}
        <div className="bg-gradient-to-t from-white via-white to-transparent pt-10 pb-6 px-6 sticky bottom-0 z-10">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={onFormSubmit} className="relative group">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about symptoms, conditions, or medications..."
                className="w-full bg-white border-2 border-slate-100 rounded-2xl py-4 pl-6 pr-14 focus:outline-none focus:border-blue-500 shadow-xl shadow-slate-200/50 transition-all text-sm lg:text-base placeholder:text-slate-400"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className={`absolute right-2 top-2 p-3 rounded-xl transition-all ${
                  input.trim() && !isLoading 
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200' 
                    : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </form>
            <p className="text-center text-[10px] text-slate-400 mt-3 font-medium uppercase tracking-wider">
              Student Project • Not for Medical Diagnosis • Non-Emergency Use Only
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
