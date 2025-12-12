<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// database/migrations/2025_01_01_000020_create_workers_table.php
return new class extends Migration {
    public function up(): void
    {
        Schema::create('workers', function (Blueprint $table) {
            $table->unsignedBigInteger('worker_id')->primary();
            $table->string('name');
            $table->string('photo')->nullable();
            $table->string('email');
            $table->string('phone');
            $table->text('description')->nullable();
            $table->foreign('worker_id')->references('id')->on('auth')->onDelete('cascade');
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('workers');
    }
};
