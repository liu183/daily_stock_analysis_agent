'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search, Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import type { StockSearchResult } from '@/types/stock';

interface StockSearchProps {
  onAnalyze: (code: string, name: string) => void;
  disabled?: boolean;
}

export function StockSearch({ onAnalyze, disabled }: StockSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StockSearchResult[]>([]);
  const [selectedStock, setSelectedStock] = useState<StockSearchResult | null>(null);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const searchStocks = useCallback(async (q: string) => {
    if (q.trim().length < 1) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/stocks/search?q=${encodeURIComponent(q.trim())}`);
      if (res.ok) {
        const data = await res.json();
        // Handle various API response formats
        const items: StockSearchResult[] = Array.isArray(data)
          ? data
          : data.body || data.results || data.quotes || [];
        setResults(items.slice(0, 10));
      } else {
        setResults([]);
      }
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 1) {
      setResults([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      searchStocks(query);
      setOpen(true);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, searchStocks]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = (stock: StockSearchResult) => {
    setSelectedStock(stock);
    setQuery(`${stock.symbol} - ${stock.name}`);
    setOpen(false);
  };

  const handleClear = () => {
    setSelectedStock(null);
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStock) {
      onAnalyze(selectedStock.symbol, selectedStock.name);
    } else if (query.trim()) {
      // Try to use the raw input if no selection was made
      const parts = query.trim().split(/\s*[-–—]\s*/);
      const code = parts[0].trim().toUpperCase();
      const name = parts[1]?.trim() || code;
      onAnalyze(code, name);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (selectedStock) setSelectedStock(null);
              }}
              placeholder="Search stock by name or ticker (e.g. Apple, AAPL)..."
              className="pl-10 pr-8"
              disabled={disabled}
              onFocus={() => {
                if (results.length > 0 && query.trim().length > 0) setOpen(true);
              }}
            />
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Dropdown suggestions */}
          {open && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-md border bg-popover shadow-lg">
              <Command shouldFilter={false}>
                <CommandList>
                  {searching && (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="size-4 animate-spin text-muted-foreground" />
                      <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
                    </div>
                  )}
                  {!searching && results.length === 0 && (
                    <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                      No stocks found. Type a ticker to analyze directly.
                    </CommandEmpty>
                  )}
                  {!searching && results.length > 0 && (
                    <CommandGroup heading="Search Results">
                      {results.map((stock) => (
                        <CommandItem
                          key={`${stock.symbol}-${stock.name}`}
                          onSelect={() => handleSelect(stock)}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex flex-col">
                              <span className="font-medium">{stock.symbol}</span>
                              <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {stock.name}
                              </span>
                            </div>
                            {stock.exchange && (
                              <span className="text-xs text-muted-foreground ml-2 shrink-0">
                                {stock.exchange}
                              </span>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </div>
          )}
        </div>
        <Button type="submit" disabled={disabled || !query.trim()}>
          {disabled ? (
            <>
              <Loader2 className="size-4 animate-spin mr-2" />
              Analyzing...
            </>
          ) : (
            'Analyze'
          )}
        </Button>
      </form>
    </div>
  );
}
