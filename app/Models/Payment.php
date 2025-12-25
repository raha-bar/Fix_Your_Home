<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;


class Payment extends Model
{
    protected $fillable = [
        'job_request_id',
        'customer_id',
        'worker_id',
        'amount',
        'method',
        'account_number',
        'pin',
        'status',
    ];

    public function jobRequest()
    {
        return $this->belongsTo(JobRequest::class, 'job_request_id');
    }
}
