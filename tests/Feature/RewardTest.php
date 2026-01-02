<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\JobRequest;
use App\Models\Payment;
use App\Models\Reward;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RewardTest extends TestCase
{
    use RefreshDatabase;

    public function test_rewards_are_issued_after_threshold_and_apply_to_next_request()
    {
        // Create and login user
        $user = User::factory()->create(['type' => 'user']);
        $customer = Customer::factory()->create(['customer_id' => $user->id, 'rewards_opt_in' => true]);

        $this->actingAs($user, 'sanctum');

        // Create two paid payments totalling $1000
        Payment::create([
            'job_request_id' => 0,
            'customer_id' => $customer->customer_id,
            'worker_id' => null,
            'amount' => 500,
            'method' => 'card',
            'account_number' => 'xxx',
            'pin' => '0000',
            'status' => 'paid',
        ]);

        Payment::create([
            'job_request_id' => 0,
            'customer_id' => $customer->customer_id,
            'worker_id' => null,
            'amount' => 500,
            'method' => 'card',
            'account_number' => 'xxx',
            'pin' => '0000',
            'status' => 'paid',
        ]);

        // Trigger the awarding logic by calling the pay endpoint (simulate a payment)
        // The award logic is invoked in payForJob but we can call awardRewardsIfEligible indirectly by hitting getAvailableRewards after creating a fake payment via controller
        $this->postJson('/api/user/rewards/available')
            ->assertStatus(403); // not allowed via POST (sanity check)

        // Directly call controller helper by simulating payForJob: using the existing payment records we call the award method indirectly via creating a payment through payForJob flow

        // Create a dummy job request to pay for
        $jobResp = $this->postJson('/api/user/job-requests', [
            'title' => 'Test job',
            'description' => 'X',
            'budget' => 100,
        ]);

        $jobId = $jobResp->json('data.id');

        // Now pay using the pay endpoint to trigger award logic
        $resp = $this->postJson("/api/user/jobs/{$jobId}/pay", [
            'method' => 'card',
            'account_number' => '123',
            'pin' => '0000',
        ]);

        $resp->assertStatus(200);

        // Now the rewards table should have one reward
        $this->assertEquals(1, Reward::where('customer_id', $customer->id)->count());

        // Fetch available rewards endpoint
        $avail = $this->getJson('/api/user/rewards/available')->assertStatus(200)->json('data');
        $this->assertEquals(1, $avail['count']);

        // Create another job and apply the reward
        $job2 = $this->postJson('/api/user/job-requests', [
            'title' => 'Test job 2',
            'budget' => 200,
            'use_reward' => true,
        ])->assertStatus(201);

        $jobData = $job2->json('data');
        $this->assertEquals(20, $jobData['discount_percent']);
        $this->assertEquals(160.00, (float) $jobData['discounted_price']);

        // Reward should be marked used
        $this->assertEquals(1, Reward::where('customer_id', $customer->id)->whereNotNull('used_at')->count());
    }
}
