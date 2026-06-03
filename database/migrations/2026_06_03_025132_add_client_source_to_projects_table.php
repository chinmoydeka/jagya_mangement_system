<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->string('client_source')->default('Office')->after('client_id');
            $table->string('client_source_member_name')->nullable()->after('client_source');
            $table->foreignId('client_source_member_id')->nullable()->after('client_source_member_name')->constrained('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropConstrainedForeignId('client_source_member_id');
            $table->dropColumn(['client_source', 'client_source_member_name']);
        });
    }
};
