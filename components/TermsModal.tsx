
import React from 'react';

interface TermsModalProps {
  onAccept: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ onAccept }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-8">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Before we begin...</h2>
          
          <div className="space-y-4 text-slate-600 text-sm leading-relaxed mb-8">
            <p>
              MediGuide AI is a <strong>student-built MVP</strong> designed for educational purposes and non-emergency health information.
            </p>
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
              <p className="text-amber-800 font-medium">Important Notice:</p>
              <ul className="list-disc ml-4 mt-2 space-y-1">
                <li>This is NOT a replacement for a doctor.</li>
                <li>The AI cannot provide a medical diagnosis.</li>
                <li>In case of emergency, immediately call <strong>911</strong> or your local emergency services.</li>
              </ul>
            </div>
            <p>
              By clicking "I Understand & Accept", you acknowledge that this information is for guidance only and you will seek professional medical help for serious concerns.
            </p>
          </div>
          
          <button
            onClick={onAccept}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg shadow-blue-200 active:scale-[0.98]"
          >
            I Understand & Accept
          </button>
        </div>
      </div>
    </div>
  );
};
