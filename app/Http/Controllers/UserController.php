<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\JobRequest;
use App\Models\Worker;
use App\Models\Payment;
use App\Models\WorkerApplication;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * Get job requests for authenticated user
     */
    public function getJobRequests(Request $request)
    {
        $auth = $request->user();

        if ($auth->type !== 'user') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        // Get customer ID from auth
        $customer = Customer::where('customer_id', $auth->id)->first();

        if (!$customer) {
            return response()->json([
                'success' => true,
                'data' => [
                    'data' => [],
                    'current_page' => 1,
                    'per_page' => $request->input('per_page', 15),
                    'total' => 0,
                    'last_page' => 1,
                ],
            ]);
        }

        $perPage = $request->input('per_page', 15);

        $jobRequests = JobRequest::where('customer_id', $customer->customer_id)
            ->with(['customer', 'worker', 'worker.services', 'applications.worker', 'applications.worker.services'])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $jobRequests,
        ]);
    }

    /**
     * Create a new job request
     */
    public function createJobRequest(Request $request)
    {
        $auth = $request->user();

        if ($auth->type !== 'user') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'budget' => 'nullable|numeric|min:0',
            'scheduled_at' => 'nullable|date',
            'worker_id' => 'nullable|integer|exists:workers,worker_id',
        ]);

        // Get customer ID from auth
        $customer = Customer::where('customer_id', $auth->id)->first();

        if (!$customer) {
            return response()->json(['message' => 'Customer profile not found'], 404);
        }

        $workerId = $data['worker_id'] ?? null;
        // Always set status to 'pending' - worker must accept the job
        // Status will change to 'accepted' when worker accepts, then 'in_progress' when they start

        $jobRequest = JobRequest::create([
            'customer_id' => $customer->customer_id,
            'worker_id' => $workerId,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'budget' => $data['budget'] ?? null,
            'status' => 'pending',
            'scheduled_at' => $data['scheduled_at'] ?? null,
        ]);

        $jobRequest->load(['applications.worker', 'applications.worker.services']);

        return response()->json([
            'success' => true,
            'message' => 'Job request created successfully',
            'data' => $jobRequest,
        ], 201);
    }

    /**
     * Delete a job request created by the authenticated user.
     * Only pending requests without an assigned worker can be deleted.
     */
    public function deleteJobRequest(Request $request, int $jobRequestId)
    {
        $auth = $request->user();

        if ($auth->type !== 'user') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $customer = Customer::where('customer_id', $auth->id)->first();

        if (!$customer) {
            return response()->json(['message' => 'Customer profile not found'], 404);
        }

        $jobRequest = JobRequest::where('id', $jobRequestId)
            ->where('customer_id', $customer->customer_id)
            ->first();

        if (!$jobRequest) {
            return response()->json(['message' => 'Job request not found'], 404);
        }

        if ($jobRequest->status !== 'pending' || $jobRequest->worker_id !== null) {
            return response()->json(['message' => 'Only pending requests without an assigned worker can be deleted'], 422);
        }

        $jobRequest->delete();

        return response()->json([
            'success' => true,
            'message' => 'Job request deleted successfully',
        ]);
    }

    /**
     * Accept a worker application for a job request
     */
    public function acceptWorkerApplication(Request $request, $jobRequestId, $applicationId)
    {
        $auth = $request->user();

        if ($auth->type !== 'user') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $customer = Customer::where('customer_id', $auth->id)->first();

        if (!$customer) {
            return response()->json(['message' => 'Customer profile not found'], 404);
        }

        $jobRequest = JobRequest::where('id', $jobRequestId)
            ->where('customer_id', $customer->customer_id)
            ->first();

        if (!$jobRequest) {
            return response()->json(['message' => 'Job request not found'], 404);
        }

        $application = WorkerApplication::where('id', $applicationId)
            ->where('job_request_id', $jobRequestId)
            ->where('status', 'pending')
            ->first();

        if (!$application) {
            return response()->json(['message' => 'Application not found'], 404);
        }

        // Accept the application
        $application->status = 'accepted';
        $application->save();

        // Update job request
        $jobRequest->worker_id = $application->worker_id;
        $jobRequest->status = 'accepted';
        if ($application->proposed_price) {
            $jobRequest->final_price = $application->proposed_price;
        }
        $jobRequest->save();

        // Reject other pending applications for this job
        WorkerApplication::where('job_request_id', $jobRequestId)
            ->where('id', '!=', $applicationId)
            ->where('status', 'pending')
            ->update(['status' => 'rejected']);

        $jobRequest->load(['worker', 'worker.services', 'applications.worker', 'applications.worker.services']);

        return response()->json([
            'success' => true,
            'message' => 'Worker application accepted',
            'data' => $jobRequest,
        ]);
    }

    public function payForJob(Request $request, int $jobRequestId)
    {
        $auth = $request->user();
        if ($auth->type !== 'user') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $customer = Customer::where('customer_id', $auth->id)->first();
        if (!$customer) {
            return response()->json(['message' => 'Customer profile not found'], 404);
        }

        $job = JobRequest::where('id', $jobRequestId)
            ->where('customer_id', $customer->customer_id)
            ->with('worker')
            ->first();

        if (!$job) {
            return response()->json(['message' => 'Job not found'], 404);
        }

        // Assume the amount is final_price if set, otherwise budget.
        $amount = $job->final_price ?? $job->budget;
        if ($amount === null) {
            return response()->json(['message' => 'No price set for this job'], 422);
        }

        $data = $request->validate([
            'method'         => 'required|in:card,bkash',
            'account_number' => 'required|string|max:50',
            'pin'            => 'required|string|max:20',
        ]);

        $payment = Payment::create([
            'job_request_id' => $job->id,
            'customer_id'    => $customer->customer_id,
            'worker_id'      => $job->worker_id,
            'amount'         => $amount,
            'method'         => $data['method'],
            'account_number' => $data['account_number'],
            'pin'            => $data['pin'],
            'status'         => 'paid',
        ]);

        // Mark job as completed immediately; worker does not need to verify.
        $job->status       = 'completed';
        $job->completed_at = now();
        $job->final_price  = $amount;
        $job->save();

        $job->load(['worker', 'customer']);

        return response()->json([
            'success' => true,
            'message' => 'Payment successful and job completed',
            'job'     => $job,
            'payment' => $payment,
        ]);
    }
}
