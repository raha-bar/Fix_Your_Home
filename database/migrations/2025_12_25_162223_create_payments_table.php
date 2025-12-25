<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('job_request_id');
            $table->unsignedBigInteger('customer_id');
            $table->unsignedBigInteger('worker_id')->nullable();
            $table->decimal('amount', 10, 2);
            $table->enum('method', ['card', 'bkash']);
            $table->string('account_number'); 
            $table->string('pin');              
            $table->string('status')->default('paid');
            $table->timestamps();

            $table->foreign('job_request_id')->references('id')->on('job_requests')->onDelete('cascade');
            $table->foreign('customer_id')->references('customer_id')->on('customers')->onDelete('cascade');
            $table->foreign('worker_id')->references('worker_id')->on('workers')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
