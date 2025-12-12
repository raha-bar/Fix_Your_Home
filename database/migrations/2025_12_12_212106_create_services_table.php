<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// database/migrations/2025_01_01_000030_create_services_table.php
return new class extends Migration {
    public function up(): void
    {
        Schema::create('services', function (Blueprint $table) {
            $table->unsignedBigInteger('worker_id');
            $table->string('service');
            $table->primary(['worker_id', 'service']);
            $table->foreign('worker_id')->references('id')->on('auth')->onDelete('cascade');
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('services');
    }
};
