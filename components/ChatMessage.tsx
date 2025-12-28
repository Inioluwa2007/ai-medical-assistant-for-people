
import React, { useState } from 'react';
import { Message, MessageRole } from '../types';

interface ChatMessageProps {
  message: Message;
  onFeedback?: (id: string, feedback: 'positive' | 'negative') => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onFeedback }) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === MessageRole.USER;

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      let processed = line;
      processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong class="text-indigo-900">$1</strong>');
      
      if (processed.trim().startsWith('* ')) {
        return (
          <li key={i} className="ml-4 list-disc mb-1.5 opacity-90" dangerouslySetInnerHTML={{ __html: processed.substring(2) }} />
        );
      }
      
      return (
        <p key={i} className={line.trim() === '' ? 'h-3' : 'mb-2 opacity-95'} dangerouslySetInnerHTML={{ __html: processed }} />
      );
    });
  };

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500 group`}>
      <div className={`flex gap-4 max-w-[90%] sm:max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center mt-1 text-[10px] font-black shadow-lg ${
          isUser 
            ? 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-indigo-100' 
            : 'bg-white text-indigo-600 border border-indigo-50 shadow-sm'
        }`}>
          {isUser ? 'ME' : 'AI'}
        </div>
        
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          {message.image && (
            <div className="mb-3 rounded-3xl overflow-hidden border-4 border-white shadow-2xl max-w-sm rotate-1">
              <img src={message.image} alt="User upload" className="w-full h-auto object-cover max-h-72" />
            </div>
          )}
          
          <div className={`p-5 rounded-[2rem] shadow-xl relative transition-all duration-300 ${
            isUser 
              ? 'bg-gradient-to-br from-indigo-600 to-blue-700 text-white rounded-tr-none shadow-indigo-200 hover:shadow-indigo-300' 
              : 'bg-white border-b-4 border-indigo-100 text-slate-800 rounded-tl-none hover:border-indigo-200'
          }`}>
            {!isUser && (
              <button 
                onClick={handleCopy}
                className={`absolute -right-3 -top-3 p-2 rounded-2xl border-2 shadow-xl transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 bg-white ${copied ? 'text-emerald-500 border-emerald-50' : 'text-slate-400 hover:text-indigo-600 border-indigo-50 hover:bg-indigo-50'}`}
                title="Copy guidance"
              >
                {copied ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                )}
              </button>
            )}
            <div className="text-sm leading-relaxed overflow-wrap-anywhere font-medium">
              {formatContent(message.content)}
            </div>

            {!isUser && message.sources && message.sources.length > 0 && (
              <div className="mt-5 pt-4 border-t border-indigo-50">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-3">Grounding Sources</p>
                <div className="flex flex-wrap gap-2">
                  {message.sources.map((source, idx) => (
                    <a 
                      key={idx} 
                      href={source.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-50/50 hover:bg-indigo-100 transition-all border border-indigo-100/50 text-[11px] font-bold text-indigo-600 max-w-[200px]"
                    >
                      <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      <span className="truncate">{source.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3 mt-2 px-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {!isUser && onFeedback && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button 
                  onClick={() => onFeedback(message.id, 'positive')}
                  className={`p-1.5 rounded-xl transition-all hover:scale-110 ${message.feedback === 'positive' ? 'text-emerald-600 bg-emerald-50 shadow-inner' : 'text-slate-300 hover:text-emerald-500 hover:bg-emerald-50'}`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                  </svg>
                </button>
                <button 
                  onClick={() => onFeedback(message.id, 'negative')}
                  className={`p-1.5 rounded-xl transition-all hover:scale-110 ${message.feedback === 'negative' ? 'text-rose-600 bg-rose-50 shadow-inner' : 'text-slate-300 hover:text-rose-500 hover:bg-rose-50'}`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.106-1.79l-.05-.025A4 4 0 0011.057 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
