<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('report_snapshots', function (Blueprint $table): void {
            $table->decimal('okr1_project_achievement_percentage', 5, 2)
                ->nullable()
                ->after('okr1_avg_percentage');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('report_snapshots', function (Blueprint $table): void {
            $table->dropColumn('okr1_project_achievement_percentage');
        });
    }
};
