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
        Schema::table('project_notices', function (Blueprint $table) {
            $table->json('methods')->nullable()->after('content'); // ['email', 'whatsapp']
            $table->integer('sent_count')->default(0)->after('methods');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('project_notices', function (Blueprint $table) {
            $table->dropColumn(['methods', 'sent_count']);
        });
    }
};
