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
            $table->string('gender')->nullable()->after('photo_path');
            $table->string('qualification')->nullable()->after('gender');
            $table->string('experience_years')->nullable()->after('qualification');
            $table->text('address')->nullable()->after('experience_years');
            $table->string('emergency_contact_name')->nullable()->after('address');
            $table->string('emergency_contact_phone')->nullable()->after('emergency_contact_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'gender',
                'qualification',
                'experience_years',
                'address',
                'emergency_contact_name',
                'emergency_contact_phone'
            ]);
        });
    }
};
