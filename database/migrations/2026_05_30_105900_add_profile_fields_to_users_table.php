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
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone')->nullable()->after('email');
            $table->string('photo_path')->nullable()->after('phone');
            $table->string('designation')->nullable()->after('role');
            $table->decimal('salary', 12, 2)->nullable()->after('designation');
            $table->date('joining_date')->nullable()->after('salary');
            $table->string('department')->nullable()->after('joining_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['phone', 'photo_path', 'designation', 'salary', 'joining_date', 'department']);
        });
    }
};
