<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProjectUpdate extends Model
{
    protected $fillable = [
        'project_id',
        'type',
        'content',
        'latitude',
        'longitude',
        'photos',
        'voice_notes',
        'created_by'
    ];

    protected $casts = [
        'photos' => 'array',
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
