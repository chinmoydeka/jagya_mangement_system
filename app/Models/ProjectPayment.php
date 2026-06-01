<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProjectPayment extends Model
{
    protected $fillable = [
        'project_id',
        'payment_type',
        'amount',
        'payment_date',
        'description',
        'payment_proofs',
        'voice_notes',
        'created_by'
    ];

    protected $casts = [
        'payment_date' => 'date',
        'payment_proofs' => 'array',
        'voice_notes' => 'array',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
