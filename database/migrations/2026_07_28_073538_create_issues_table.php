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
        Schema::create('issues', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title');
            $table->text('description');
            $table->string('priority')->index();
            $table->string('root_cause_category');
            $table->timestamp('reported_at');
            $table->timestamp('due_date');
            $table->timestamp('resolved_at')->nullable();
            $table->string('status')->default('open')->index();
            $table->text('resolution_note')->nullable();
            $table->boolean('is_on_time')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('issues');
    }
};
