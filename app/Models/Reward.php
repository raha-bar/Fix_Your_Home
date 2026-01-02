<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Reward extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_id',
        'percent',
        'earned_at',
        'expires_at',
        'used_at',
        'used_job_request_id',
    ];

    protected $casts = [
        'earned_at' => 'datetime',
        'expires_at' => 'datetime',
        'used_at' => 'datetime',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function usedJob()
    {
        return $this->belongsTo(JobRequest::class, 'used_job_request_id');
    }
}
