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
        Schema::table('sla_configs', function (Blueprint $table) {
            $table->renameColumn('target_resolution_days', 'target_resolution_hours');
        });

        Schema::table('issues', function (Blueprint $table) {
            $table->timestamp('due_date')->change();
        });

        Schema::table('feature_requests', function (Blueprint $table) {
            $table->timestamp('due_date')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('issues', function (Blueprint $table) {
            $table->date('due_date')->change();
        });

        Schema::table('feature_requests', function (Blueprint $table) {
            $table->date('due_date')->change();
        });

        Schema::table('sla_configs', function (Blueprint $table) {
            $table->renameColumn('target_resolution_hours', 'target_resolution_days');
        });
    }
};
