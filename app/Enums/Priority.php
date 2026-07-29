<?php

namespace App\Enums;

enum Priority: string
{
    case Urgent = 'urgent';
    case Normal = 'normal';
    case Low = 'low';
}
