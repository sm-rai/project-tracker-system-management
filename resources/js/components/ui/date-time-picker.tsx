import { format, isValid, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { ChevronDownIcon } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Field,
    FieldGroup,
    FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DateTimePickerProps {
    value?: string | null;
    onChange?: (dateTimeString: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    clearable?: boolean;
    id?: string;
    'aria-label'?: string;
    'aria-describedby'?: string;
    'aria-invalid'?: boolean;
    'aria-required'?: boolean;
}

function parseDateTime(value?: string | null): Date | undefined {
    if (!value) {
        return undefined;
    }

    const parsedDate = parseISO(value);

    return isValid(parsedDate) ? parsedDate : undefined;
}

function formatDateTime(date: Date, time: string): string {
    const [hour, minute] = time.split(':').map(Number);
    const dateTime = new Date(date);

    dateTime.setHours(hour, minute, 0, 0);

    return format(dateTime, "yyyy-MM-dd'T'HH:mm");
}

export function DateTimePicker({
    value,
    onChange,
    placeholder = 'Pilih tanggal',
    className,
    disabled = false,
    clearable = true,
    id,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': ariaInvalid,
    'aria-required': ariaRequired,
}: DateTimePickerProps) {
    const generatedId = React.useId();
    const fieldId = id ?? 'date-time-picker-' + generatedId.replaceAll(':', '');
    const timeId = fieldId + '-time';
    const [open, setOpen] = React.useState(false);
    const selectedDate = React.useMemo(() => parseDateTime(value), [value]);
    const timeValue = selectedDate ? format(selectedDate, 'HH:mm') : '';

    const handleDateSelect = (date: Date | undefined) => {
        if (!date) {
            onChange?.('');
            setOpen(false);

            return;
        }

        onChange?.(formatDateTime(date, timeValue || '00:00'));
        setOpen(false);
    };

    const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const nextTime = event.target.value;

        if (!selectedDate || !nextTime) {
            return;
        }

        onChange?.(formatDateTime(selectedDate, nextTime));
    };

    const handleClear = () => {
        onChange?.('');
        setOpen(false);
    };

    return (
        <FieldGroup className="flex-col gap-3 sm:flex-row">
            <Field className="min-w-0 flex-1">
                <FieldLabel htmlFor={fieldId}>Tanggal</FieldLabel>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            id={fieldId}
                            aria-label={ariaLabel}
                            aria-describedby={ariaDescribedBy}
                            aria-invalid={ariaInvalid}
                            aria-required={ariaRequired}
                            variant="outline"
                            disabled={disabled}
                            className={cn(
                                'h-11 w-full justify-between border-border bg-card text-left text-sm font-normal shadow-xs focus-visible:ring-ring/30 md:h-9 md:text-xs',
                                !selectedDate && 'text-muted-foreground',
                                className,
                            )}
                        >
                            {selectedDate ? (
                                format(selectedDate, 'dd MMMM yyyy', {
                                    locale: idLocale,
                                })
                            ) : (
                                <span>{placeholder}</span>
                            )}
                            <ChevronDownIcon className="size-4 text-muted-foreground" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent
                        className="w-auto max-w-[calc(100vw-2rem)] border-border bg-card p-0 shadow-md"
                        align="start"
                    >
                        {clearable && selectedDate && (
                            <div className="flex justify-end border-b border-border p-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                                    onClick={handleClear}
                                >
                                    Hapus
                                </Button>
                            </div>
                        )}
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            captionLayout="dropdown"
                            defaultMonth={selectedDate}
                            onSelect={handleDateSelect}
                            locale={idLocale}
                        />
                    </PopoverContent>
                </Popover>
            </Field>
            <Field className="w-full sm:w-32">
                <FieldLabel htmlFor={timeId}>Waktu</FieldLabel>
                <Input
                    type="time"
                    id={timeId}
                    step="60"
                    value={timeValue}
                    onChange={handleTimeChange}
                    disabled={disabled || !selectedDate}
                    aria-label="Waktu"
                    aria-describedby={ariaDescribedBy}
                    aria-invalid={ariaInvalid}
                    aria-required={ariaRequired}
                    className="h-11 appearance-none border-border bg-card md:h-9 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                />
            </Field>
        </FieldGroup>
    );
}
