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
        Schema::create('report_snapshots', function (Blueprint $table) {
            $table->id();
            $table->date('period_start_date');
            $table->date('period_end_date');
            $table->string('period_type');
            $table->decimal('okr1_avg_percentage', 5, 2)->default(0);
            $table->decimal('okr2_issue_percentage', 5, 2)->default(100);
            $table->decimal('okr2_feature_request_percentage', 5, 2)->default(100);
            $table->json('project_breakdown_json');
            $table->json('issue_breakdown_json');
            $table->json('feature_request_breakdown_json');
            $table->string('pdf_file_path')->nullable();
            $table->json('png_file_paths')->nullable();
            $table->timestamp('generated_at');
            $table->timestamps();

            $table->index(['period_start_date', 'period_end_date']);
            $table->index('period_type');
            $table->index('generated_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('report_snapshots');
    }
};
