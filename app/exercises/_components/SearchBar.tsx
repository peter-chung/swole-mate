"use client";

import React from "react";

type SearchBarProps = {
  query: string;
  setQuery: (q: string) => void;
};

const SearchBar = ({ query, setQuery }: SearchBarProps) => {
  return (
    <div className="mb-4 relative">
      <input
        type="text"
        placeholder="Search exercises..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-md border border-gray-300 px-3 py-2 pr-9 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        aria-label="Search foods by name or brand"
      />
      {query && (
        <button
          type="button"
          onClick={() => setQuery("")}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-2 py-1 text-gray-500 hover:text-gray-700"
          title="Clear"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default SearchBar;
