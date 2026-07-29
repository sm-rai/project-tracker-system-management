<?php

namespace App\Enums;

enum RootCauseCategory: string
{
    case SystemError = 'system_error';
    case NonSystem = 'non_system';
    case Other = 'other';
}
