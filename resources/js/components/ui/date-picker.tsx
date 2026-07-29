import * as React from "react"
import { format, parseISO } from "date-fns"
import { id } from "date-fns/locale"
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
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pilih tanggal",
  className,
  disabled = false,
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
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-9 w-full justify-start text-left font-normal border-[#E7DFD5] text-xs shadow-xs focus-visible:ring-[#AF4424]/30",
            !selectedDate && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 size-4 text-muted-foreground" />
          {selectedDate && !isNaN(selectedDate.getTime()) ? (
            format(selectedDate, "dd MMMM yyyy", { locale: id })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border-[#E7DFD5] bg-card shadow-md" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          initialFocus
          locale={id}
        />
      </PopoverContent>
    </Popover>
  )
}
