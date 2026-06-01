<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProjectEvent extends Model
{
    protected $fillable = [
        'project_id',
        'title',
        'description',
        'event_date',
        'created_by'
    ];

    protected $casts = [
        'event_date' => 'datetime',
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
