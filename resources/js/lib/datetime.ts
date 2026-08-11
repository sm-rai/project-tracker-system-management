export const BUSINESS_TIMEZONE = 'Asia/Jakarta';

type DateValue = Date | string;

function toDate(value: DateValue): Date {
    const date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) {
        throw new Error(`Invalid date value: ${String(value)}`);
    }

    return date;
}

function formatParts(value: DateValue): Record<string, string> {
    return Object.fromEntries(
        new Intl.DateTimeFormat('en-CA', {
            timeZone: BUSINESS_TIMEZONE,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hourCycle: 'h23',
        })
            .formatToParts(toDate(value))
            .filter(({ type }) => type !== 'literal')
            .map(({ type, value: partValue }) => [type, partValue]),
    );
}

export function formatAppDateTime(value: DateValue): string {
    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
        timeZone: BUSINESS_TIMEZONE,
    }).format(toDate(value));
}

export function formatAppLongDateTime(value: DateValue): string {
    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'long',
        timeStyle: 'short',
        timeZone: BUSINESS_TIMEZONE,
    }).format(toDate(value));
}

export function formatAppDateOnly(value: DateValue): string {
    const dateOnlyValue =
        typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
            ? new Date(`${value}T00:00:00Z`)
            : toDate(value);

    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone:
            typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
                ? 'UTC'
                : BUSINESS_TIMEZONE,
    }).format(dateOnlyValue);
}

export function formatAppDateTimeInput(value: DateValue = new Date()): string {
    const parts = formatParts(value);

    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function parseAppDateTimeInput(value: string): Date {
    const seconds = value.length === 16 ? ':00' : '';

    return new Date(`${value}${seconds}+07:00`);
}
