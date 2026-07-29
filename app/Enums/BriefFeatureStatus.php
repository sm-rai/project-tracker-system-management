<?php

namespace App\Enums;

enum BriefFeatureStatus: string
{
    case Todo = 'todo';
    case InProgress = 'in_progress';
    case Done = 'done';
}
