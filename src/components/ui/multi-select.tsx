import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
  value: any;
  label: string;
}

interface MultiSelectProps {
  options: Option[];
  selected: any[];
  onChange: (selected: any[]) => void;
  className?: string;
  placeholder?: string;
}

export const MultiSelect = ({
  options,
  selected,
  onChange,
  className,
  placeholder = "Select options..."
}: MultiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && event.target && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter options based on search term
  const filteredOptions = options?.filter((option: Option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleOption = (value: any) => {
    const updatedSelection = selected?.includes(value)
      ? selected.filter((item: any) => item !== value)
      : [...(selected || []), value];
    onChange(updatedSelection);
  };

  const removeOption = (e: React.MouseEvent, value: any) => {
    e.stopPropagation();
    onChange(selected.filter((item: any) => item !== value));
  };

  const getSelectedLabels = (): string[] => {
    return selected?.map((value: any) => 
      options?.find((option: Option) => option.value === value)?.label
    ).filter(Boolean) as string[] || [];
  };

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <div
        className="flex min-h-[38px] w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-1">
          {getSelectedLabels().map((label: string, i: number) => (
            <span
              key={i}
              className="bg-blue-100 text-blue-800 rounded-md px-2 py-1 text-sm flex items-center"
            >
              {label}
              <X
                className="ml-1 h-4 w-4 hover:text-blue-500 cursor-pointer"
                onClick={(e) => removeOption(e, options.find((opt: Option) => opt.label === label)?.value)}
              />
            </span>
          ))}
          {selected?.length === 0 && (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </div>
        <ChevronsUpDown className="h-4 w-4 opacity-50" />
      </div>
      {isOpen && (
        <div className="absolute mt-1 w-full rounded-md border border-input bg-popover text-popover-foreground shadow-md z-10">
          <input
            type="text"
            className="w-full border-b px-3 py-2 text-sm focus:outline-none"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
          <div className="max-h-[200px] overflow-auto">
            {filteredOptions?.map((option: Option) => (
              <div
                key={option.value}
                className={cn(
                  "flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-accent",
                  selected?.includes(option.value) && "bg-accent"
                )}
                onClick={() => toggleOption(option.value)}
              >
                <span>{option.label}</span>
                {selected?.includes(option.value) && (
                  <Check className="h-4 w-4" />
                )}
              </div>
            ))}
            {filteredOptions?.length === 0 && (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                No options found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelect;