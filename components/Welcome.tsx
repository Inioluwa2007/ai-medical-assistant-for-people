
import React from 'react';

interface WelcomeProps {
  onQuickAction: (text: string) => void;
}

export const Welcome: React.FC<WelcomeProps> = ({ onQuickAction }) => {
  const actions = [
    { 
      text: "What are common symptoms of a cold?", 
      icon: "🌡️", 
      color: "bg-amber-50 border-amber-100 hover:bg-amber-100",
      iconBg: "bg-amber-200/50"
    },
    { 
      text: "How should I treat a minor burn?", 
      icon: "💧", 
      color: "bg-blue-50 border-blue-100 hover:bg-blue-100",
      iconBg: "bg-blue-200/50"
    },
    { 
      text: "Explain what high blood pressure is.", 
      icon: "❤️", 
      color: "bg-rose-50 border-rose-100 hover:bg-rose-100",
      iconBg: "bg-rose-200/50"
    },
    { 
      text: "When should I see a doctor for a headache?", 
      icon: "🧠", 
      color: "bg-indigo-50 border-indigo-100 hover:bg-indigo-100",
      iconBg: "bg-indigo-200/50"
    }
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center animate-in fade-in zoom-in duration-700">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-20 animate-pulse rounded-full"></div>
        <div className="relative w-24 h-24 bg-gradient-to-tr from-indigo-600 to-cyan-400 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-300 rotate-3">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
      </div>
      
      <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">
        How can I help you <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-600">today?</span>
      </h2>
      <p className="text-slate-500 max-w-lg mb-12 text-lg font-medium">
        Your vibrant companion for health guidance. Simple, educational, and grounded in current research.
      </p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
        {actions.map((action, idx) => (
          <button
            key={idx}
            onClick={() => onQuickAction(action.text)}
            className={`group p-5 ${action.color} border-2 rounded-[2rem] text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl active:scale-95 flex items-start gap-4`}
          >
            <div className={`w-12 h-12 ${action.iconBg} rounded-2xl flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform`}>
              {action.icon}
            </div>
            <span className="flex-1 font-bold text-slate-800 leading-tight pt-1">
              {action.text}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
