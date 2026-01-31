"use client";

import { useRef, useEffect, useState } from "react";
import { SPORT_OPTIONS } from "@/lib/types/database";

interface SportDropdownProps {
  value: string;
  onChange: (sportName: string) => void;
  id?: string;
  labelId?: string;
  className?: string;
}

export function SportDropdown({ value, onChange, id = "sport", labelId = "sport-label", className = "" }: SportDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={labelId}
        onClick={() => setOpen((o) => !o)}
        className="w-full px-4 py-2 border-2 border-fta-black bg-fta-paper text-fta-black font-bold text-left flex items-center justify-between rounded-none"
      >
        <span>{value || "—"}</span>
        <span className="text-fta-orange" aria-hidden>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <ul
          role="listbox"
          aria-labelledby={labelId}
          className="absolute z-10 w-full mt-0 border-2 border-t-0 border-fta-black bg-fta-paper shadow-none rounded-none"
        >
          {SPORT_OPTIONS.map((s) => (
            <li
              key={s.name}
              role="option"
              aria-selected={value === s.name}
              onClick={() => {
                onChange(s.name);
                setOpen(false);
              }}
              className={`px-4 py-2 border-b-2 border-fta-black last:border-b-0 font-bold cursor-pointer hover:bg-fta-orange hover:text-fta-black rounded-none ${value === s.name ? "bg-fta-orange text-fta-black" : "bg-fta-paper text-fta-black"}`}
            >
              {s.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
