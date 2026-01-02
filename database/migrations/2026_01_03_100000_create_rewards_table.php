<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateRewardsTable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('rewards', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('customer_id');
            $table->unsignedTinyInteger('percent')->default(20);
            $table->timestamp('earned_at');
            $table->timestamp('expires_at');
            $table->timestamp('used_at')->nullable();
            $table->unsignedBigInteger('used_job_request_id')->nullable();
            $table->timestamps();

            // customers table uses primary key "customer_id" instead of "id"
            $table->foreign('customer_id')->references('customer_id')->on('customers')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rewards');
    }
}
