
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => {
  return (
    <div className={`flex flex-col gap-1 w-full ${className}`}>
      <label className="text-sm font-semibold text-slate-700">{label}</label>
      <input 
        className={`px-4 py-2 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
          error ? 'border-red-500 bg-red-50' : 'border-slate-300 hover:border-indigo-400'
        }`}
        {...props}
      />
      {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
    </div>
  );
};
