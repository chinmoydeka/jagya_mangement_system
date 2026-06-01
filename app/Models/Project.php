<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Project extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'project_id', 'title', 'type', 'description', 'client_id',
        'status', 'start_date', 'deadline', 'location',
        'budget', 'completion_percentage', 'created_by', 'payment_milestones',
        'map_location', 'latitude', 'longitude',
        'work_type', 'rcc_foundation', 'rcc_finishing', 'rcc_class',
        'assam_type_details', 'plinth_area', 'slab_area', 'head_room',
        'remarks', 'other_info', 'road_size', 'road_direction',
    ];

    protected $casts = [
        'start_date' => 'date',
        'deadline'   => 'date',
        'budget'     => 'decimal:2',
        'payment_milestones' => 'array',
        'assam_type_details' => 'array',
        'head_room'  => 'boolean',
    ];

    public function client(): BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function team(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'project_team')
                    ->withPivot('role')
                    ->withTimestamps();
    }

    public function documents(): HasMany
    {
        return $this->hasMany(ProjectDocument::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(ProjectTask::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(ProjectPayment::class);
    }

    public function updates(): HasMany
    {
        return $this->hasMany(ProjectUpdate::class);
    }

    public function notices(): HasMany
    {
        return $this->hasMany(ProjectNotice::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(ProjectEvent::class);
    }

    public function activities(): HasMany
    {
        return $this->hasMany(ProjectActivity::class)->latest();
    }

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (Project $project) {
            if (empty($project->project_id)) {
                $last = static::withTrashed()->orderByDesc('id')->first();
                $num  = $last ? ((int) ltrim(str_replace('P-', '', $last->project_id), '0') + 1) : 2001;
                $project->project_id = 'P-' . $num;
            }
        });

        static::created(function (Project $project) {
            $project->activities()->create([
                'user_id' => auth()->id() ?? $project->created_by,
                'action' => 'created',
                'description' => 'Project was created',
                'changes' => $project->getAttributes()
            ]);
        });

        static::updated(function (Project $project) {
            $changes = $project->getDirty();
            // Don't log if only completion_percentage changed rapidly or something trivial
            if (!empty($changes)) {
                $project->activities()->create([
                    'user_id' => auth()->id(),
                    'action' => 'updated',
                    'description' => 'Project details were updated',
                    'changes' => [
                        'old' => \Illuminate\Support\Arr::only($project->getOriginal(), array_keys($changes)),
                        'new' => $changes
                    ]
                ]);
            }
        });
    }
}
