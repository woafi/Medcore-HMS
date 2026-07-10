"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

type SearchResult = {
  href: string;
  id: string;
  image: string | null;
  title: string;
  code: string;
  subtitle: string;
  contact: string;
};

type TypeaheadSearchProps = {
  entity: string;
  placeholder?: string;
  searchContext?: Record<string, unknown>;
};

const DEBOUNCE_MS = 500;
const EMPTY_SEARCH_CONTEXT: Readonly<Record<string, never>> = Object.freeze({});

function serializeSearchContext(
  context: Record<string, unknown> | undefined | null
): string {
  try {
    return JSON.stringify(context ?? EMPTY_SEARCH_CONTEXT);
  } catch {
    return "{}";
  }
}

export default function TypeaheadSearch({
  entity,
  placeholder = "Search by name, ID, phone, or email...",
  searchContext = EMPTY_SEARCH_CONTEXT,
}: TypeaheadSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [error, setError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();
  const listId = useId();
  const searchIdRef = useRef(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const searchContextKey = serializeSearchContext(searchContext);

  useEffect(() => {
    const term = query.trim();
    const searchId = searchIdRef.current + 1;
    searchIdRef.current = searchId;

    if (!term) {
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const currentSearchContext = JSON.parse(searchContextKey);

    const timer = setTimeout(() => {
      async function runSearch() {
        try {
          const res = await fetch(
            `/api/directorysearch?entity=${encodeURIComponent(entity)}&term=${encodeURIComponent(term)}`
          );

          if (searchIdRef.current !== searchId) return;

          if (!res.ok) {
            throw new Error("Search request failed");
          }

          const data = await res.json();
          const matches: SearchResult[] | undefined = data.results;

          if (searchIdRef.current !== searchId) return;

          setResults(Array.isArray(matches) ? matches : []);
          setError("");
          setIsOpen(true);
          setActiveIndex(matches?.length ? 0 : -1);
        } catch (searchError) {
          if (searchIdRef.current !== searchId) return;

          console.error(searchError);
          setResults([]);
          setError("Search is unavailable right now.");
          setIsOpen(true);
          setActiveIndex(-1);
        } finally {
          if (searchIdRef.current === searchId) {
            setIsSearching(false);
          }
        }
      }

      runSearch();
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [entity, query, searchContextKey]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node | null)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const showDropdown = isOpen && query.trim();
  const hasResults = results.length > 0;

  function handleQueryChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextQuery = event.target.value;

    setQuery(nextQuery);

    if (!nextQuery.trim()) {
      setResults([]);
      setError("");
      setIsOpen(false);
      setActiveIndex(-1);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!showDropdown) return;

    if (event.key === "Escape") {
      setIsOpen(false);
      return;
    }

    if (!hasResults) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % results.length);
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? results.length - 1 : index - 1));
    }

    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      router.push(results[activeIndex].href);
    }
  }

  return (
    <div ref={rootRef} className="relative group">
      <svg
        className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>

      <input
        type="search"
        value={query}
        onChange={handleQueryChange}
        onFocus={() => {
          if (query.trim()) setIsOpen(true);
        }}
        onKeyDown={handleKeyDown}
        className="w-full pl-10 pr-11 py-2.5 bg-foregd border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:outline-none focus:ring-blue-600 transition-all text-sm"
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-controls={listId}
        aria-expanded={Boolean(showDropdown)}
        aria-autocomplete="list"
      />

      <div className="absolute right-3 top-1/2 -translate-y-1/2">
        {isSearching ? (
          <span className="block h-4 w-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
        ) : query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setResults([]);
              setError("");
              setIsOpen(false);
              setActiveIndex(-1);
            }}
            className="cursor-pointer text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            aria-label="Clear search"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        ) : null}
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-gray-200 bg-foreground shadow-lg dark:border-gray-700">
          {error ? (
            <div className="px-4 py-3 text-sm text-red-500">{error}</div>
          ) : hasResults ? (
            <ul id={listId} role="listbox" className="max-h-80 overflow-y-auto py-1">
              {results.map((result, index) => (
                <li
                  key={`${result.href}-${result.id}`}
                  role="option"
                  aria-selected={activeIndex === index}
                >
                  <Link
                    href={result.href}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                      activeIndex === index
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : "hover:bg-gray-50 dark:hover:bg-gray-700/30"
                    }`}
                  >
                    <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-blue-100">
                      {result.image ? (
                        <div
                          className="h-full w-full bg-cover bg-center"
                          style={{ backgroundImage: `url("${result.image}")` }}
                          aria-hidden="true"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-blue-600 text-sm font-bold text-white">
                          {result.title?.charAt(0)?.toUpperCase() || "S"}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-bold text-gray-900 dark:text-white">
                          {result.title}
                        </p>
                        <span className="flex-shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                          {result.code}
                        </span>
                      </div>
                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                        {[result.subtitle, result.contact].filter(Boolean).join(" - ")}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
              No matches found for &quot;{query.trim()}&quot;.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
