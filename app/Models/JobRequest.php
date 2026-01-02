<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JobRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_id',
        'worker_id',
        'title',
        'description',
        'budget',
        'final_price',
        'discount_percent',
        'discounted_price',
        'status',
        'scheduled_at',
        'completed_at',
        'rating',
        'rating_at',
    ];

    protected $casts = [
        'discounted_price' => 'decimal:2',
    ];

    protected function casts(): array
    {
        return [
            'budget' => 'decimal:2',
            'final_price' => 'decimal:2',
            'scheduled_at' => 'datetime',
            'completed_at' => 'datetime',
            'rating' => 'integer',
            'rating_at' => 'datetime',
        ];
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id');
    }

    public function worker()
    {
        return $this->belongsTo(Worker::class, 'worker_id');
    }

    public function applications()
    {
        return $this->hasMany(WorkerApplication::class, 'job_request_id');
    }
}
