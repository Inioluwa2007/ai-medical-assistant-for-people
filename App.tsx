
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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(() => {
    return localStorage.getItem('mediguide_accepted') === 'true';
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async (text: string) => {
    if ((!text.trim() && !selectedImage) || isLoading) return;

    let sessionId = currentSessionId;
    const isNewSession = !sessionId;

    if (isNewSession) {
      sessionId = Date.now().toString();
      const newSession: ChatSession = {
        id: sessionId,
        messages: [],
        title: text.substring(0, 30) || (selectedImage ? 'Label Review' : 'Health Inquiry')
      };
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(sessionId);
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: MessageRole.USER,
      content: text.trim() || "Analyze this image.",
      timestamp: new Date(),
      image: selectedImage || undefined
    };

    setSessions(prev => prev.map(s => 
      s.id === sessionId 
        ? { 
            ...s, 
            messages: [...s.messages, userMsg],
            title: s.messages.length === 0 ? (text.substring(0, 30) || 'Health Question') : s.title 
          } 
        : s
    ));
    
    setInput('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const targetSession = sessions.find(s => s.id === sessionId);
      const history = targetSession ? [...targetSession.messages, userMsg] : [userMsg];
      
      const { text: aiResponse, sources } = await sendMessageToGemini(history);
      
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: MessageRole.ASSISTANT,
        content: aiResponse,
        timestamp: new Date(),
        sources: sources
      };

      setSessions(sPrev => sPrev.map(s => 
        s.id === sessionId ? { ...s, messages: [...s.messages, assistantMsg] } : s
      ));
    } catch (error) {
      console.error("Gemini failed:", error);
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

      <main className="flex-1 flex flex-col min-w-0 bg-transparent relative">
        {/* Header */}
        <header className="px-6 py-5 border-b border-indigo-50 flex items-center justify-between glass z-20">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2.5 -ml-2 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-2xl transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
            <div className="hidden sm:flex items-center gap-4">
              <div className="bg-gradient-to-tr from-indigo-600 to-cyan-400 p-2.5 rounded-2xl shadow-xl shadow-indigo-100 rotate-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">MediGuide</h1>
            </div>
            {currentSession && (
              <span className="hidden sm:block text-slate-200 text-2xl font-thin mx-1">/</span>
            )}
            <h2 className="text-sm font-bold text-slate-500 truncate max-w-[180px] bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100">
              {currentSession?.title || 'Brand New Session'}
            </h2>
          </div>
          
          <button 
            onClick={createNewSession}
            className="group flex items-center gap-2 text-xs font-black text-indigo-600 bg-white border-2 border-indigo-50 px-5 py-2.5 rounded-2xl hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all active:scale-95 shadow-sm"
          >
            <svg className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
            </svg>
            START FRESH
          </button>
        </header>

        {/* Scrollable Chat Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <div className="max-w-4xl mx-auto pb-32">
            <Disclaimer />
            
            {messages.length === 0 ? (
              <Welcome onQuickAction={handleSend} />
            ) : (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                {messages.map((msg) => (
                  <ChatMessage 
                    key={msg.id} 
                    message={msg} 
                    onFeedback={msg.role === MessageRole.ASSISTANT ? handleFeedback : undefined}
                  />
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border-b-4 border-indigo-50 rounded-[2rem] rounded-tl-none p-6 shadow-xl">
                      <div className="flex flex-col gap-4">
                        <div className="flex space-x-2">
                          <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                          <div className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                          <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce"></div>
                        </div>
                        <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.3em] animate-pulse">Researching health insights...</p>
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
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white/95 to-transparent pt-16 pb-8 px-6 z-10">
          <div className="max-w-3xl mx-auto">
            {selectedImage && (
              <div className="mb-6 relative inline-block animate-in fade-in zoom-in duration-300">
                <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20"></div>
                <img src={selectedImage} alt="Selected" className="relative h-24 w-24 object-cover rounded-[1.5rem] border-4 border-white shadow-2xl rotate-2" />
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="absolute -top-3 -right-3 bg-rose-500 text-white rounded-full p-2 shadow-xl hover:bg-rose-600 transition-all hover:scale-110 active:scale-90"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            
            <form onSubmit={onFormSubmit} className="relative flex gap-3 group">
              <div className="flex-1 relative">
                <div className="absolute inset-0 bg-indigo-600/5 blur-2xl group-focus-within:bg-indigo-600/10 transition-colors"></div>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Tell me about your health concern..."
                  className="relative w-full bg-white/90 border-2 border-indigo-50 rounded-[2.5rem] py-5 pl-8 pr-28 focus:outline-none focus:border-indigo-400 focus:ring-8 focus:ring-indigo-500/5 transition-all text-base text-slate-900 font-bold placeholder:text-slate-400 shadow-2xl shadow-indigo-100/50 glass"
                  disabled={isLoading}
                />
                <div className="absolute right-3 top-2 bottom-2 flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-[1.5rem] transition-all active:scale-90"
                    title="Scan label or document"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                  <button
                    type="submit"
                    disabled={(!input.trim() && !selectedImage) || isLoading}
                    className={`p-4 rounded-[1.5rem] transition-all active:scale-95 shadow-xl ${
                      (input.trim() || selectedImage) && !isLoading 
                        ? 'bg-gradient-to-br from-indigo-600 to-blue-600 text-white hover:from-indigo-700 hover:to-blue-700 shadow-indigo-200' 
                        : 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none'
                    }`}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageChange} 
                accept="image/*" 
                className="hidden" 
              />
            </form>
            <p className="text-center text-[10px] text-indigo-400 mt-5 font-black uppercase tracking-[0.4em] opacity-60">
              Student Project • Powered by Gemini Flash • No Emergency Use
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
