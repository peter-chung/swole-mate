"use client";

import React from "react";
import { Search, X } from "lucide-react";

type SearchBarProps = {
  query: string;
  setQuery: (q: string) => void;
};

const SearchBar = ({ query, setQuery }: SearchBarProps) => {
  return (
    <div className="relative">
      <label htmlFor="exercise-search" className="sr-only">
        Search exercises
      </label>
      <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <input
        id="exercise-search"
        type="text"
        placeholder="Search exercises by name or type..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-lg border border-gray-300 bg-white pl-9 pr-10 py-2 text-sm text-gray-900 shadow-sm outline-none transition focus:border-[#3ecf8e] focus:ring-2 focus:ring-[#3ecf8e]/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-100"
        aria-label="Search exercises by name or type"
      />
      {query && (
        <button
          type="button"
          onClick={() => setQuery("")}
          aria-label="Clear search"
          className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full p-2 text-gray-500 hover:text-gray-700 hover:opacity-80 transition cursor-pointer dark:text-gray-400 dark:hover:text-gray-200"
          title="Clear"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
