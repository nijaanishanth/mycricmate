import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";

interface Suggestion {
  display_name: string;
  lat: string;
  lon: string;
}

interface LocationAutocompleteProps {
  value?: string;
  onChange: (value: string, lat?: string, lng?: string) => void;
  placeholder?: string;
  className?: string;
}

const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  value = "",
  onChange,
  placeholder = "Enter your city",
  className = "",
}) => {
  const [query, setQuery] = useState<string>(value || "");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [show, setShow] = useState<boolean>(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setShow(false);
      return;
    }

    const id = setTimeout(() => {
      fetchSuggestions(query);
    }, 300);

    return () => clearTimeout(id);
  }, [query]);

  const fetchSuggestions = async (q: string) => {
    if (controllerRef.current) controllerRef.current.abort();
    controllerRef.current = new AbortController();
    setLoading(true);

    try {
      const params = new URLSearchParams({
        format: "json",
        addressdetails: "1",
        limit: "6",
        countrycodes: "us",
        q,
      });

      const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
        signal: controllerRef.current.signal,
        headers: { "Accept-Language": "en" },
      });

      if (!res.ok) {
        setSuggestions([]);
        setShow(false);
        return;
      }

      const data = (await res.json()) as Suggestion[];
      setSuggestions(data || []);
      setShow((data || []).length > 0);
      setActiveIndex(-1);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setSuggestions([]);
      setShow(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (s: Suggestion) => {
    setQuery(s.display_name);
    setShow(false);
    onChange(s.display_name, s.lat, s.lon);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!show) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && suggestions[activeIndex]) handleSelect(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setShow(false);
    }
  };

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setShow(false);
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`pl-10 h-12 ${className}`}
        aria-autocomplete="list"
        aria-expanded={show}
      />

      {show && (
        <ul className="absolute z-50 left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg max-h-60 overflow-auto">
          {loading && <li className="p-3 text-sm text-muted-foreground">Searching...</li>}
          {!loading && suggestions.length === 0 && <li className="p-3 text-sm text-muted-foreground">No results</li>}
          {!loading && suggestions.map((s, idx) => (
            <li
              key={`${s.lat}-${s.lon}-${idx}`}
              className={`p-3 cursor-pointer hover:bg-accent/50 transition-colors text-sm ${idx === activeIndex ? 'bg-accent/50' : ''}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(s)}
            >
              {s.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LocationAutocomplete;
