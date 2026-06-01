<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProjectNotice extends Model
{
    protected $fillable = [
        'project_id',
        'type',
        'title',
        'content',
        'methods',
        'sent_count',
        'sent_at',
        'attachments',
        'created_by'
    ];

    protected $casts = [
        'sent_at' => 'datetime',
        'attachments' => 'array',
        'methods' => 'array',
        'sent_count' => 'integer',
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
