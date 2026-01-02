<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddRewardsAndDiscountColumns extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            // Add rewards opt-in flag
            $table->boolean('rewards_opt_in')->default(false);
        });

        Schema::table('job_requests', function (Blueprint $table) {
            $table->unsignedTinyInteger('discount_percent')->nullable()->after('final_price');
            $table->decimal('discounted_price', 10, 2)->nullable()->after('discount_percent');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('job_requests', function (Blueprint $table) {
            $table->dropColumn(['discount_percent', 'discounted_price']);
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn('rewards_opt_in');
        });
    }
}
