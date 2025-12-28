
import React from 'react';

interface WelcomeProps {
  onQuickAction: (text: string) => void;
}

export const Welcome: React.FC<WelcomeProps> = ({ onQuickAction }) => {
  const quickActions = [
    "What are common symptoms of a cold?",
    "How should I treat a minor burn?",
    "Explain what high blood pressure is.",
    "When should I see a doctor for a headache?"
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center">
      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Hello, I'm MediGuide AI</h2>
      <p className="text-slate-500 max-w-md mb-8">
        Your educational health companion. Ask me questions about symptoms, health topics, or general guidance.
      </p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
        {quickActions.map((action, idx) => (
          <button
            key={idx}
            onClick={() => onQuickAction(action)}
            className="p-4 bg-white border border-slate-200 rounded-xl text-left text-sm text-slate-700 hover:border-blue-400 hover:shadow-md transition-all duration-200"
          >
            {action}
          </button>
        ))}
      </div>
    </div>
  );
};
