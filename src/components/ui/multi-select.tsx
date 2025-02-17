import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

export const MultiSelect = ({
  options,
  selected,
  onChange,
  className,
  placeholder = "Select options..."
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter options based on search term
  const filteredOptions = options?.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleOption = (value) => {
    const updatedSelection = selected?.includes(value)
      ? selected.filter(item => item !== value)
      : [...(selected || []), value];
    onChange(updatedSelection);
  };

  const removeOption = (e, value) => {
    e.stopPropagation();
    onChange(selected.filter(item => item !== value));
  };

  const getSelectedLabels = () => {
    return selected?.map(value => 
      options?.find(option => option.value === value)?.label
    ).filter(Boolean) || [];
  };

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <div
        className="flex min-h-[38px] w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-1">
          {getSelectedLabels().map((label, i) => (
            <span
              key={i}
              className="bg-blue-100 text-blue-800 rounded-md px-2 py-1 text-sm flex items-center"
            >
              {label}
              <X
                className="ml-1 h-4 w-4 hover:text-blue-500 cursor-pointer"
                onClick={(e) => removeOption(e, options.find(opt => opt.label === label).value)}
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
            {filteredOptions?.map((option) => (
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