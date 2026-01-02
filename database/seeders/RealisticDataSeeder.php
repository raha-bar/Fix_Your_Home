<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;
use App\Models\AuthAccount;
use App\Models\Customer;
use App\Models\Worker;
use App\Models\Service;
use App\Models\JobRequest;
use App\Models\Payment;
use App\Models\Reward;

class RealisticDataSeeder extends Seeder
{
    public function run(): void
    {
        // Safely clear relevant tables
        Schema::disableForeignKeyConstraints();

        DB::table('payments')->truncate();
        DB::table('job_requests')->truncate();
        DB::table('worker_applications')->truncate();
        DB::table('services')->truncate();
        DB::table('workers')->truncate();
        DB::table('customers')->truncate();
        DB::table('auth')->truncate();

        Schema::enableForeignKeyConstraints();

        // Admin
        $admin = AuthAccount::create([
            'email' => 'admin@fixyourhome.test',
            'password' => Hash::make('givemeaccess'),
            'type' => 'admin',
        ]);

        // Customers / Users
        $u1 = AuthAccount::create(['email' => 'john.doe@test', 'password' => Hash::make('password'), 'type' => 'user']);
        $c1 = Customer::create(['customer_id' => $u1->id, 'name' => 'John Doe', 'email' => 'john.doe@test', 'phone' => '+8801711000001']);

        $u2 = AuthAccount::create(['email' => 'mary.smith@test', 'password' => Hash::make('password'), 'type' => 'user']);
        $c2 = Customer::create(['customer_id' => $u2->id, 'name' => 'Mary Smith', 'email' => 'mary.smith@test', 'phone' => '+8801711000002']);

        $u3 = AuthAccount::create(['email' => 'acme.corp@test', 'password' => Hash::make('password'), 'type' => 'user']);
        $c3 = Customer::create(['customer_id' => $u3->id, 'name' => 'Acme Corp', 'email' => 'acme.corp@test', 'phone' => '+8801711000003']);

        // Workers
        $w1Auth = AuthAccount::create(['email' => 'ali.plumber@test', 'password' => Hash::make('password'), 'type' => 'worker']);
        $w1 = Worker::create(['worker_id' => $w1Auth->id, 'name' => 'Ali Khan', 'email' => 'ali.plumber@test', 'phone' => '+8801712000001', 'description' => 'Experienced plumber for household repairs', 'approval_status' => 'approved']);

        $w2Auth = AuthAccount::create(['email' => 'rana.elect@test', 'password' => Hash::make('password'), 'type' => 'worker']);
        $w2 = Worker::create(['worker_id' => $w2Auth->id, 'name' => 'Rana Ahmed', 'email' => 'rana.elect@test', 'phone' => '+8801712000002', 'description' => 'Electrician specializing in wiring and fan/fixture installation', 'approval_status' => 'approved']);

        $w3Auth = AuthAccount::create(['email' => 'sadia.clean@test', 'password' => Hash::make('password'), 'type' => 'worker']);
        $w3 = Worker::create(['worker_id' => $w3Auth->id, 'name' => 'Sadia Naz', 'email' => 'sadia.clean@test', 'phone' => '+8801712000003', 'description' => 'Professional cleaner for homes and offices', 'approval_status' => 'approved']);

        $w4Auth = AuthAccount::create(['email' => 'nasir.paint@test', 'password' => Hash::make('password'), 'type' => 'worker']);
        $w4 = Worker::create(['worker_id' => $w4Auth->id, 'name' => 'Nasir Hossain', 'email' => 'nasir.paint@test', 'phone' => '+8801712000004', 'description' => 'Painter with experience in interior and exterior jobs', 'approval_status' => 'approved']);

        $w5Auth = AuthAccount::create(['email' => 'ibrahim.carp@test', 'password' => Hash::make('password'), 'type' => 'worker']);
        $w5 = Worker::create(['worker_id' => $w5Auth->id, 'name' => 'Ibrahim Khan', 'email' => 'ibrahim.carp@test', 'phone' => '+8801712000005', 'description' => 'Carpenter and furniture repair specialist', 'approval_status' => 'approved']);

        // Services
        Service::create(['worker_id' => $w1->worker_id, 'service' => 'Plumbing']);
        Service::create(['worker_id' => $w1->worker_id, 'service' => 'Leak Repair']);

        Service::create(['worker_id' => $w2->worker_id, 'service' => 'Electrical']);
        Service::create(['worker_id' => $w2->worker_id, 'service' => 'Ceiling Fan Installation']);

        Service::create(['worker_id' => $w3->worker_id, 'service' => 'House Cleaning']);
        Service::create(['worker_id' => $w3->worker_id, 'service' => 'Office Cleaning']);

        Service::create(['worker_id' => $w4->worker_id, 'service' => 'Painting']);
        Service::create(['worker_id' => $w4->worker_id, 'service' => 'Wall Repair']);

        Service::create(['worker_id' => $w5->worker_id, 'service' => 'Carpentry']);
        Service::create(['worker_id' => $w5->worker_id, 'service' => 'Furniture Fix']);

        // Job Requests (realistic variations)
        // Completed and rated
        $job1 = JobRequest::create([
            'customer_id' => $c1->customer_id,
            'worker_id' => $w1->worker_id,
            'title' => 'Kitchen sink leaking - fix and replace pipe',
            'description' => 'Persistent leak under the kitchen sink, please check and replace damaged pipe',
            'budget' => 120.00,
            'final_price' => 120.00,
            'status' => 'completed',
            'scheduled_at' => Carbon::now()->subDays(5),
            'completed_at' => Carbon::now()->subDays(3),
            'rating' => 5,
            'rating_at' => Carbon::now()->subDays(2),
        ]);

        // Payment for completed job
        Payment::create([
            'job_request_id' => $job1->id,
            'customer_id' => $c1->customer_id,
            'worker_id' => $w1->worker_id,
            'amount' => 120.00,
            'method' => 'card',
            'account_number' => '4242424242424242',
            'pin' => '0000',
            'status' => 'paid',
        ]);

        // Create completed jobs for customer1 so payments can reference real job_request ids
        $jobA = JobRequest::create([
            'customer_id' => $c1->customer_id,
            'worker_id' => $w2->worker_id,
            'title' => 'Seed job A',
            'description' => 'Placeholder job for seeding payments',
            'budget' => 450.00,
            'final_price' => 450.00,
            'status' => 'completed',
            'completed_at' => Carbon::now()->subDays(10),
        ]);

        Payment::create([
            'job_request_id' => $jobA->id,
            'customer_id' => $c1->customer_id,
            'worker_id' => $w2->worker_id,
            'amount' => 450.00,
            'method' => 'card',
            'account_number' => '4242424242424242',
            'pin' => '0000',
            'status' => 'paid',
        ]);

        $jobB = JobRequest::create([
            'customer_id' => $c1->customer_id,
            'worker_id' => $w3->worker_id,
            'title' => 'Seed job B',
            'description' => 'Placeholder job for seeding payments',
            'budget' => 430.00,
            'final_price' => 430.00,
            'status' => 'completed',
            'completed_at' => Carbon::now()->subDays(8),
        ]);

        Payment::create([
            'job_request_id' => $jobB->id,
            'customer_id' => $c1->customer_id,
            'worker_id' => $w3->worker_id,
            'amount' => 430.00,
            'method' => 'card',
            'account_number' => '4242424242424242',
            'pin' => '0000',
            'status' => 'paid',
        ]);

        // Opt-in customer1 for rewards and create a preview reward
        $c1->rewards_opt_in = true;
        $c1->save();

        Reward::create([
            'customer_id' => $c1->customer_id,
            'percent' => 20,
            'earned_at' => Carbon::now(),
            'expires_at' => Carbon::now()->addMonths(6),
        ]);

        // Add a pending job for c1 to try applying a reward
        $jobForReward = JobRequest::create([
            'customer_id' => $c1->customer_id,
            'worker_id' => null,
            'title' => 'Future plumbing maintenance (eligible for reward)',
            'description' => 'Schedule maintenance and save using earned reward',
            'budget' => 200.00,
            'status' => 'pending',
            'scheduled_at' => Carbon::now()->addDays(7),
        ]);

        // Apply the preview reward to this pending job so it's visible for demos
        $rewardToUse = Reward::where('customer_id', $c1->customer_id)->whereNull('used_at')->first();
        if ($rewardToUse) {
            $jobForReward->discount_percent = $rewardToUse->percent;
            $jobForReward->discounted_price = round(($jobForReward->budget * (100 - $rewardToUse->percent)) / 100, 2);
            $jobForReward->save();

            $rewardToUse->used_at = Carbon::now();
            $rewardToUse->used_job_request_id = $jobForReward->id;
            $rewardToUse->save();
        }

        // In progress (worker started)
        $job2 = JobRequest::create([
            'customer_id' => $c2->customer_id,
            'worker_id' => $w2->worker_id,
            'title' => 'Install ceiling fan in living room',
            'description' => 'Need a 48-inch ceiling fan installed and wiring checked',
            'budget' => 80.00,
            'status' => 'in_progress',
            'scheduled_at' => Carbon::now()->subDays(1),
        ]);

        // Pending (not assigned)
        $job3 = JobRequest::create([
            'customer_id' => $c3->customer_id,
            'worker_id' => null,
            'title' => 'Full house deep cleaning (3 rooms + kitchen)',
            'description' => 'Deep cleaning for move out',
            'budget' => 200.00,
            'status' => 'pending',
            'scheduled_at' => Carbon::now()->addDays(2),
        ]);

        // Accepted (worker assigned but not started)
        $job4 = JobRequest::create([
            'customer_id' => $c1->customer_id,
            'worker_id' => $w4->worker_id,
            'title' => 'Interior wall painting - living & dining',
            'description' => 'Paint living and dining room walls, 2 coats required',
            'budget' => 300.00,
            'final_price' => 320.00,
            'status' => 'accepted',
            'scheduled_at' => Carbon::now()->addDays(4),
        ]);

        // Cancelled request
        $job5 = JobRequest::create([
            'customer_id' => $c2->customer_id,
            'worker_id' => null,
            'title' => 'Fix wardrobe door hinge',
            'description' => 'Small job to fix wardrobe hinge',
            'budget' => 25.00,
            'status' => 'cancelled',
        ]);

        // Another completed but unrated job for testing
        $job6 = JobRequest::create([
            'customer_id' => $c3->customer_id,
            'worker_id' => $w5->worker_id,
            'title' => 'Repair broken chair leg',
            'description' => 'Carpenter to repair dining chair leg',
            'budget' => 30.00,
            'final_price' => 30.00,
            'status' => 'completed',
            'scheduled_at' => Carbon::now()->subDays(4),
            'completed_at' => Carbon::now()->subDays(2),
            // rating left null to allow manual testing
        ]);

        // A few extra realistic quick jobs
        JobRequest::create([
            'customer_id' => $c1->customer_id,
            'worker_id' => $w3->worker_id,
            'title' => 'Office after-party cleaning',
            'description' => 'Small office cleaning after event',
            'budget' => 75.00,
            'status' => 'accepted',
            'scheduled_at' => Carbon::now()->addDays(1),
        ]);

        JobRequest::create([
            'customer_id' => $c2->customer_id,
            'worker_id' => $w2->worker_id,
            'title' => 'Check electrical outlets (3 rooms)',
            'description' => 'Some outlets are loose and need tightening',
            'budget' => 60.00,
            'status' => 'pending',
        ]);

    }
}
