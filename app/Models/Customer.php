<?php

// app/Models/Customer.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    protected $table = 'customers';
    protected $primaryKey = 'customer_id';
    public $timestamps = false;

    protected $fillable = ['customer_id', 'name', 'email', 'phone', 'rewards_opt_in'];

    public function auth()
    {
        return $this->belongsTo(AuthAccount::class, 'customer_id');
    }

    public function rewards()
    {
        return $this->hasMany(Reward::class, 'customer_id');
    }

    public function jobRequests()
    {
        return $this->hasMany(JobRequest::class, 'customer_id');
    }
}
