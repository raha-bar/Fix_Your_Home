<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Worker extends Model
{
    protected $primaryKey = 'worker_id';

    public $timestamps = false;

    protected $fillable = ['worker_id', 'name', 'photo', 'email', 'phone', 'description', 'latitude', 'longitude', 'approval_status'];

    protected $appends = ['id'];

    /**
     * Get the id attribute (alias for worker_id)
     */
    public function getIdAttribute()
    {
        return $this->worker_id;
    }

    public function auth()
    {
        return $this->belongsTo(AuthAccount::class, 'worker_id');
    }

    public function services()
    {
        return $this->hasMany(Service::class, 'worker_id');
    }

    public function jobRequests()
    {
        return $this->hasMany(JobRequest::class, 'worker_id');
    }

    public function applications()
    {
        return $this->hasMany(WorkerApplication::class, 'worker_id');
    }
}
