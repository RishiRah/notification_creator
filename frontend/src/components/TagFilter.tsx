import { useState } from "react";

interface TagFilterProps {
  tags: string[];
  selected: string[];
  onToggle: (tags: string[]) => void;
}

export function TagFilter({ tags, selected, onToggle }: TagFilterProps) {
  const [search, setSearch] = useState("");

  const toggle = (tag: string) => {
    if (selected.includes(tag)) {
      onToggle(selected.filter((t) => t !== tag));
    } else {
      onToggle([...selected, tag]);
    }
  };

  if (tags.length === 0) return null;

  const filtered = search
    ? tags.filter((t) => t.toLowerCase().includes(search.toLowerCase()))
    : tags;

  return (
    <div className="flex flex-wrap items-center gap-2 px-6 py-3 bg-gray-50 border-b border-gray-200">
      <span className="text-sm text-gray-500 mr-1">Filter:</span>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search tags…"
        className="px-3 py-1 text-sm border border-gray-300 rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 w-40"
      />
      {filtered.map((tag) => (
        <button
          key={tag}
          onClick={() => toggle(tag)}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors cursor-pointer ${
            selected.includes(tag)
              ? "bg-indigo-600 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          {tag}
        </button>
      ))}
      {selected.length > 0 && (
        <button
          onClick={() => onToggle([])}
          className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
        >
          Clear
        </button>
      )}
    </div>
  );
}
