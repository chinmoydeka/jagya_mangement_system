<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeleteRequest extends Model
{
    protected $fillable = [
        'requested_by', 'item_type', 'item_id', 'item_name', 'reason', 'backup_data', 'status',
    ];

    protected $casts = [
        'backup_data' => 'array',
    ];

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }
}
