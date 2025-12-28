
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
      
      // Basic bold processing (**text**)
      processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      
      // Basic bullet processing (* text)
      if (processed.trim().startsWith('* ')) {
        return (
          <li key={i} className="ml-4 list-disc mb-1" dangerouslySetInnerHTML={{ __html: processed.substring(2) }} />
        );
      }
      
      return (
        <p key={i} className={line.trim() === '' ? 'h-3' : 'mb-2'} dangerouslySetInnerHTML={{ __html: processed }} />
      );
    });
  };

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300 group`}>
      <div className={`flex gap-3 max-w-[90%] sm:max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 text-[10px] font-bold shadow-sm ${
          isUser ? 'bg-slate-200 text-slate-600' : 'bg-blue-600 text-white'
        }`}>
          {isUser ? 'U' : 'AI'}
        </div>
        
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`p-4 rounded-2xl shadow-sm border relative ${
            isUser 
              ? 'bg-blue-600 border-blue-600 text-white rounded-tr-none' 
              : 'bg-white border-slate-100 text-slate-800 rounded-tl-none'
          }`}>
            {!isUser && (
              <button 
                onClick={handleCopy}
                className={`absolute -right-2 -top-2 p-1.5 rounded-lg border shadow-sm transition-all opacity-0 group-hover:opacity-100 bg-white ${copied ? 'text-green-500 border-green-100' : 'text-slate-400 hover:text-blue-500 border-slate-100'}`}
                title="Copy guidance"
              >
                {copied ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                )}
              </button>
            )}
            <div className={`text-sm leading-relaxed overflow-wrap-anywhere`}>
              {formatContent(message.content)}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1 px-1">
            <span className="text-[10px] text-slate-400 font-medium">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {!isUser && onFeedback && (
              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity ml-2 border-l border-slate-200 pl-2">
                <button 
                  onClick={() => onFeedback(message.id, 'positive')}
                  className={`p-1 rounded-md transition-colors ${message.feedback === 'positive' ? 'text-green-600 bg-green-50' : 'text-slate-400 hover:text-green-600 hover:bg-slate-100'}`}
                  title="Helpful"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                  </svg>
                </button>
                <button 
                  onClick={() => onFeedback(message.id, 'negative')}
                  className={`p-1 rounded-md transition-colors ${message.feedback === 'negative' ? 'text-red-600 bg-red-50' : 'text-slate-400 hover:text-red-600 hover:bg-slate-100'}`}
                  title="Not helpful"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
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
