<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('report_snapshots', function (Blueprint $table): void {
            $table->unsignedTinyInteger('format_version')->default(1);
            $table->decimal('okr1_avg_percentage', 5, 2)->nullable()->default(null)->change();
            $table->decimal('okr1_project_achievement_percentage', 5, 2)->nullable()->default(null)->change();
            $table->decimal('okr2_issue_percentage', 5, 2)->nullable()->default(null)->change();
            $table->decimal('okr2_feature_request_percentage', 5, 2)->nullable()->default(null)->change();
        });
    }

    public function down(): void
    {
        if (DB::table('report_snapshots')->where('format_version', '>=', 2)->exists()) {
            throw new RuntimeException('Cannot roll back while activity report snapshots exist. Preserve them and use a forward migration.');
        }

        Schema::table('report_snapshots', function (Blueprint $table): void {
            $table->decimal('okr1_avg_percentage', 5, 2)->nullable(false)->default(0)->change();
            $table->decimal('okr1_project_achievement_percentage', 5, 2)->nullable()->default(null)->change();
            $table->decimal('okr2_issue_percentage', 5, 2)->nullable(false)->default(100)->change();
            $table->decimal('okr2_feature_request_percentage', 5, 2)->nullable(false)->default(100)->change();
            $table->dropColumn('format_version');
        });
    }
};
