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
    try {
      const saved = localStorage.getItem('mediguide_sessions');
      return saved ? JSON.parse(saved).map((s: any) => ({
        ...s,
        messages: s.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }))
      })) : [];
    } catch (e) {
      console.error("Failed to load sessions", e);
      return [];
    }
  });
  
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(() => {
    const saved = localStorage.getItem('mediguide_sessions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.length > 0 ? parsed[0].id : null;
      } catch { return null; }
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
      title: 'New Health Inquiry'
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
    if (confirm("Delete all consultation history?")) {
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
      if (file.size > 4 * 1024 * 1024) {
        alert("Image is too large. Please select an image under 4MB.");
        return;
      }
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
    if (!sessionId) {
      sessionId = Date.now().toString();
      const newSession: ChatSession = {
        id: sessionId,
        messages: [],
        title: text.substring(0, 30) || 'Image Analysis'
      };
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(sessionId);
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: MessageRole.USER,
      content: text.trim() || "Analyze this health-related image.",
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
      // Find session again to get updated history
      const updatedSessions = await new Promise<ChatSession[]>(resolve => {
        setSessions(prev => { resolve(prev); return prev; });
      });
      
      const targetSession = updatedSessions.find(s => s.id === sessionId);
      const history = targetSession ? targetSession.messages : [userMsg];
      
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
      console.error("Gemini invocation error:", error);
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
    <div className="flex h-screen bg-white overflow-hidden font-sans">
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
        <header className="px-6 py-5 border-b border-indigo-50 flex items-center justify-between glass z-20">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-indigo-500"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            </button>
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-100">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-slate-800">MediGuide</h1>
            </div>
          </div>
          
          <button 
            onClick={createNewSession}
            className="text-xs font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl hover:bg-indigo-100 transition-colors"
          >
            NEW CHAT
          </button>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <div className="max-w-3xl mx-auto pb-32">
            <Disclaimer />
            
            {messages.length === 0 ? (
              <Welcome onQuickAction={handleSend} />
            ) : (
              <div className="space-y-6">
                {messages.map((msg) => (
                  <ChatMessage 
                    key={msg.id} 
                    message={msg} 
                    onFeedback={msg.role === MessageRole.ASSISTANT ? handleFeedback : undefined}
                  />
                ))}
                {isLoading && (
                  <div className="flex justify-start animate-pulse">
                    <div className="bg-white border border-indigo-50 rounded-2xl p-5 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        </div>
                        <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Consulting Medical Sources...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white/95 to-transparent pt-12 pb-6 px-6 z-10">
          <div className="max-w-2xl mx-auto">
            {selectedImage && (
              <div className="mb-4 relative inline-block animate-in fade-in zoom-in duration-200">
                <img src={selectedImage} alt="Selected" className="h-20 w-20 object-cover rounded-xl border-2 border-white shadow-lg" />
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-md"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            
            <form onSubmit={onFormSubmit} className="relative flex items-center bg-white border border-slate-200 rounded-[1.5rem] p-1 shadow-xl shadow-slate-200/50 group focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-500/5 transition-all">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-slate-400 hover:text-indigo-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="How can I help with your health today?"
                className="flex-1 bg-transparent border-none py-3 px-2 focus:outline-none text-slate-700 font-medium placeholder:text-slate-400"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={(!input.trim() && !selectedImage) || isLoading}
                className={`p-3 rounded-2xl transition-all ${
                  (input.trim() || selectedImage) && !isLoading 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                    : 'bg-slate-100 text-slate-300'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageChange} 
                accept="image/*" 
                className="hidden" 
              />
            </form>
            <p className="text-center text-[9px] text-slate-400 mt-4 uppercase tracking-widest font-bold">
              MediGuide Student Project • Non-Emergency Guidance only
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;