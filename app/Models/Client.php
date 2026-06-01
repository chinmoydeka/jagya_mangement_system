<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Client extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'client_id', 'name', 'mobile', 'alternate_mobile', 'email',
        'address', 'city', 'state', 'pincode',
        'pan_number', 'gst_number', 'aadhaar_number',
        'notes', 'status', 'created_by', 'photo_path', 'map_location', 'latitude', 'longitude',
    ];

    public function projects(): HasMany
    {
        return $this->hasMany(Project::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // Auto-generate client_id
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (Client $client) {
            if (empty($client->client_id)) {
                $last = static::withTrashed()->orderByDesc('id')->first();
                $num  = $last ? ((int) ltrim(str_replace('CLI-', '', $last->client_id), '0') + 1) : 1;
                $client->client_id = 'CLI-' . str_pad($num, 4, '0', STR_PAD_LEFT);
            }
        });
    }
}
