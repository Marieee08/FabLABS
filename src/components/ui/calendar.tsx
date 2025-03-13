"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <>
      {/* Add custom style */}
      <style jsx global>{`
        .rdp-head_row,
        .rdp-row {
          display: grid !important;
          grid-template-columns: repeat(7, 1fr) !important;
          width: 100% !important;
          gap: 0 !important; /* Remove horizontal gap */
        }
        
        .rdp-head_cell,
        .rdp-cell {
          text-align: center !important;
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
        }
        
        .rdp-table {
          border-spacing: 0 !important;
        }
        
        .rdp-row {
          margin-top: 0.5rem !important;
          margin-bottom: 0.5rem !important;
        }
        
        .rdp-day {
          width: 100% !important;
          max-width: 3rem !important;
          height: 2.75rem !important;
          margin: 0 auto !important;
        }
      `}</style>
      
      <DayPicker
        showOutsideDays={showOutsideDays}
        className={`p-4 md:p-6 ${className}`}
        classNames={{
          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          month: "w-full",
          caption: "flex justify-center pb-4 relative items-center text-lg md:text-xl font-semibold",
          caption_label: "text-lg md:text-xl font-semibold",
          nav: "space-x-2 flex items-center",
          nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border rounded-md",
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          table: "w-full border-collapse",
          head_row: "w-full",
          head_cell: "text-muted-foreground text-sm md:text-base font-medium py-2",
          row: "w-full",
          cell: "text-center relative p-0",
          day: "h-12 w-12 md:h-14 md:w-14 p-0 font-normal text-base hover:bg-gray-100 rounded-full flex items-center justify-center",
          day_selected: "bg-blue-500 text-white font-semibold rounded-full hover:bg-blue-600",
          day_today: "bg-accent text-accent-foreground",
          day_outside: "text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
          day_disabled: "text-muted-foreground opacity-50",
          day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
          day_hidden: "invisible",
          ...classNames,
        }}
        components={{
          IconLeft: () => <ChevronLeft className="h-4 w-4" />,
          IconRight: () => <ChevronRight className="h-4 w-4" />,
        }}
        {...props}
      />
    </>
  )
}

Calendar.displayName = "Calendar"

export { Calendar }