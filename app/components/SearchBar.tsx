'use client';

import React, { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export default function SearchBar({ onSearch, placeholder = 'Search enquiries...' }: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearch(e.target.value);
  };

  return (
    <div className={`w-full mb-6 transition-all duration-300 ${isFocused ? 'scale-[1.01]' : 'scale-[1]'}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 text-gray-400" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
        </div>
        <input
          type="text"
          className={`w-full pl-12 pr-4 py-4 rounded-xl bg-white dark:bg-[#111f1c] 
            text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 
            shadow-sm focus:outline-none focus:ring-2 focus:ring-[#c69c6d] focus:border-transparent 
            transition-all duration-300 ${isFocused ? 'shadow-md' : ''}`}
          placeholder={placeholder}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      </div>
      
      {/* Quick Filters - Optional */}
      <div className="flex gap-2 mt-2 px-1">
        <button 
          className="text-xs px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700 
            text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 
            transition-colors"
          onClick={() => onSearch("today")}
        >
          Today
        </button>
        <button 
          className="text-xs px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700 
            text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 
            transition-colors"
          onClick={() => onSearch("new")}
        >
          New
        </button>
        <button 
          className="text-xs px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700 
            text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 
            transition-colors"
          onClick={() => onSearch("due")}
        >
          Due
        </button>
      </div>
    </div>
  );
} 