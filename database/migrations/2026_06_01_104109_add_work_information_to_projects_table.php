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
        Schema::table('projects', function (Blueprint $table) {
            $table->string('work_type')->nullable()->after('budget');
            $table->string('rcc_foundation')->nullable()->after('work_type');
            $table->string('rcc_finishing')->nullable()->after('rcc_foundation');
            $table->string('rcc_class')->nullable()->after('rcc_finishing');
            $table->json('assam_type_details')->nullable()->after('rcc_class');
            $table->string('plinth_area')->nullable()->after('assam_type_details');
            $table->string('slab_area')->nullable()->after('plinth_area');
            $table->boolean('head_room')->default(false)->after('slab_area');
            $table->text('remarks')->nullable()->after('head_room');
            $table->text('other_info')->nullable()->after('remarks');
            $table->string('road_size')->nullable()->after('other_info');
            $table->string('road_direction')->nullable()->after('road_size');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn([
                'work_type',
                'rcc_foundation',
                'rcc_finishing',
                'rcc_class',
                'assam_type_details',
                'plinth_area',
                'slab_area',
                'head_room',
                'remarks',
                'other_info',
                'road_size',
                'road_direction'
            ]);
        });
    }
};
