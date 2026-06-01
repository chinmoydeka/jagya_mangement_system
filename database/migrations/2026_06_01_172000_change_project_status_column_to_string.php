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
        // First, alter column type to string (varchar) so it can store any value
        Schema::table('projects', function (Blueprint $table) {
            $table->string('status', 255)->default('all_agreement')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->string('status', 255)->default('draft')->change();
        });
    }
};
