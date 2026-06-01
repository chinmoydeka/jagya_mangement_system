<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectTask extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'project_id', 'title', 'description', 'priority', 'status',
        'assignee_id', 'collaborator_ids', 'attachments', 'voice_notes', 'comments', 'created_by',
    ];

    protected $casts = [
        'collaborator_ids' => 'array',
        'attachments'      => 'array',
        'voice_notes'      => 'array',
        'comments'         => 'array',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
