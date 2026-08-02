<?php

namespace App\Http\Controllers;

use App\Actions\Dashboard\BuildDashboardData;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private BuildDashboardData $buildDashboardData,
    ) {}

    public function index(): Response
    {
        return Inertia::render('dashboard', [
            'dashboard' => $this->buildDashboardData->handle(),
        ]);
    }
}
