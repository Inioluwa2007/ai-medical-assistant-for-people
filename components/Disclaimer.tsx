
import React from 'react';

export const Disclaimer: React.FC = () => {
  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded-r shadow-sm">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-red-700 font-semibold">Medical Disclaimer</p>
          <p className="text-xs text-red-600 mt-1">
            This AI is a student MVP for educational purposes only. It is not a licensed medical professional. 
            If you are experiencing a medical emergency, call 911 or your local emergency services immediately.
          </p>
        </div>
      </div>
    </div>
  );
};
