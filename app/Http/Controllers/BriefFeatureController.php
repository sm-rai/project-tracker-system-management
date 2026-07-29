<?php

namespace App\Http\Controllers;

use App\Enums\BriefFeatureStatus;
use App\Http\Requests\StoreBriefFeatureRequest;
use App\Http\Requests\UpdateBriefFeatureRequest;
use App\Models\BriefFeature;
use App\Models\Project;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class BriefFeatureController extends Controller
{
    /**
     * Store a newly created brief feature for a project.
     */
    public function store(StoreBriefFeatureRequest $request, Project $project): RedirectResponse
    {
        $validated = $request->validated();

        $project->briefFeatures()->create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'status' => $validated['status'] ?? BriefFeatureStatus::Todo->value,
        ]);

        return redirect()->back()->with('success', 'Brief feature berhasil ditambahkan.');
    }

    /**
     * Update the specified brief feature.
     */
    public function update(UpdateBriefFeatureRequest $request, BriefFeature $briefFeature): RedirectResponse
    {
        $validated = $request->validated();
        $briefFeature->update($validated);

        return redirect()->back()->with('success', 'Brief feature berhasil diperbarui.');
    }

    /**
     * Quick status toggle/update for brief feature.
     */
    public function updateStatus(Request $request, BriefFeature $briefFeature): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::enum(BriefFeatureStatus::class)],
        ]);

        $briefFeature->update([
            'status' => $validated['status'],
        ]);

        return redirect()->back()->with('success', 'Status brief feature diperbarui.');
    }

    /**
     * Remove the specified brief feature from storage.
     */
    public function destroy(BriefFeature $briefFeature): RedirectResponse
    {
        $briefFeature->delete();

        return redirect()->back()->with('success', 'Brief feature berhasil dihapus.');
    }
}
