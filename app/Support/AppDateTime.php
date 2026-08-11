<?php

namespace App\Support;

use Carbon\CarbonImmutable;
use DateTimeInterface;
use InvalidArgumentException;

final class AppDateTime
{
    public static function businessTimezone(): string
    {
        return (string) config('app.business_timezone', 'Asia/Jakarta');
    }

    public static function fromUserInput(string $value): CarbonImmutable
    {
        return CarbonImmutable::parse($value, self::businessTimezone())->utc();
    }

    public static function startOfBusinessDate(string $value): CarbonImmutable
    {
        return self::parseBusinessDate($value)->startOfDay()->utc();
    }

    public static function endOfBusinessDate(string $value): CarbonImmutable
    {
        return self::parseBusinessDate($value)->endOfDay()->utc();
    }

    public static function nowInBusinessTimezone(): CarbonImmutable
    {
        return CarbonImmutable::now(self::businessTimezone());
    }

    public static function inBusinessTimezone(DateTimeInterface|string $value): CarbonImmutable
    {
        $date = $value instanceof DateTimeInterface
            ? CarbonImmutable::instance($value)
            : CarbonImmutable::parse($value, 'UTC');

        return $date->setTimezone(self::businessTimezone());
    }

    private static function parseBusinessDate(string $value): CarbonImmutable
    {
        $date = CarbonImmutable::createFromFormat('!Y-m-d', $value, self::businessTimezone());

        if ($date === false) {
            throw new InvalidArgumentException("Invalid business date: {$value}");
        }

        return $date;
    }
}
