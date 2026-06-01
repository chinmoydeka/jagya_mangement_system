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
        Schema::create('project_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->string('payment_type'); // client_installment, civil_payment, interior_payment, material_bill
            $table->decimal('amount', 15, 2);
            $table->date('payment_date');
            $table->string('description')->nullable();
            $table->json('payment_proofs')->nullable(); // Array of file paths
            $table->json('voice_notes')->nullable(); // Array of file paths
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_payments');
    }
};
