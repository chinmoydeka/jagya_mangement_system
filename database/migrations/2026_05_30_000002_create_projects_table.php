<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('project_id')->unique(); // e.g. P-2149
            $table->string('title');
            $table->enum('type', ['client', 'internal'])->default('client');
            $table->text('description')->nullable();
            $table->foreignId('client_id')->nullable()->constrained('clients')->nullOnDelete();
            $table->enum('status', ['draft', 'planning', 'active', 'on-hold', 'completed', 'cancelled'])->default('draft');
            $table->date('start_date')->nullable();
            $table->date('deadline')->nullable();
            $table->string('location')->nullable();
            $table->decimal('budget', 15, 2)->nullable();
            $table->integer('completion_percentage')->default(0);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });

        // Project Team Members pivot
        Schema::create('project_team', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('role')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_team');
        Schema::dropIfExists('projects');
    }
};
