"use client";

import React from "react";

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
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔎</span>
      <input
        id="exercise-search"
        type="text"
        placeholder="Search exercises by name or type..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-lg border border-gray-300 bg-white pl-9 pr-10 py-2 text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-100"
        aria-label="Search exercises by name or type"
      />
      {query && (
        <button
          type="button"
          onClick={() => setQuery("")}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-2 py-1 text-gray-500 hover:text-gray-700 hover:opacity-80 active:translate-y-px transition cursor-pointer dark:text-gray-400 dark:hover:text-gray-200"
          title="Clear"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default SearchBar;
