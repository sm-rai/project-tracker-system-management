import * as React from "react"
import { format, parseISO } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  value?: string | null
  onChange?: (dateString: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  id?: string
  "aria-label"?: string
  "aria-describedby"?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pilih tanggal",
  className,
  disabled = false,
  id,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  const selectedDate = React.useMemo(() => {
    if (!value) return undefined
    try {
      return parseISO(value)
    } catch {
      return undefined
    }
  }, [value])

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      const dateString = format(date, "yyyy-MM-dd")
      onChange?.(dateString)
    } else {
      onChange?.("")
    }
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedBy}
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-11 w-full justify-start border-border text-left text-sm font-normal shadow-xs focus-visible:ring-ring/30 md:h-9 md:text-xs",
            !selectedDate && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 size-4 text-muted-foreground" />
          {selectedDate && !isNaN(selectedDate.getTime()) ? (
            format(selectedDate, "dd MMMM yyyy", { locale: idLocale })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto border-border bg-card p-0 shadow-md" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          locale={idLocale}
        />
      </PopoverContent>
    </Popover>
  )
}
