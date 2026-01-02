<?php

namespace App\Http\Controllers;

use App\Models\JobRequest;
use App\Models\Service;
use App\Models\Worker;
use App\Models\WorkerApplication;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkerController extends Controller
{
    /**
     * Get list of workers with pagination
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = $request->input('per_page', 15);

        $query = Worker::where('approval_status', 'approved')->with('services');

        // Optional filter by service / skill name
        $service = $request->input('service');
        if ($service) {
            $services = is_array($service) ? $service : [$service];
            $query->whereHas('services', function ($q) use ($services) {
                $q->whereIn('service', $services);
            });
        }

        $workers = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $workers,
        ]);
    }

    /**
     * Get top workers for the current month based on number of jobs completed or in progress.
     */
    public function getTopWorkersForMonth(Request $request): JsonResponse
    {
        $limit = (int) $request->input('limit', 10);

        $workers = Worker::where('approval_status', 'approved')
            ->with('services')
            ->withCount([
                'jobRequests as monthly_jobs_count' => function ($query) {
                    $query->whereBetween('created_at', [
                        now()->startOfMonth(),
                        now()->endOfMonth(),
                    ]);
                },
            ])
            ->orderByDesc('monthly_jobs_count')
            ->limit($limit)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $workers,
        ]);
    }

    /**
     * Update the authenticated worker's current location.
     */
    public function updateLocation(Request $request): JsonResponse
    {
        $auth = $request->user();

        if ($auth->type !== 'worker') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $data = $request->validate([
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
        ]);

        $worker = Worker::where('worker_id', $auth->id)->first();

        if (! $worker) {
            return response()->json(['message' => 'Worker profile not found'], 404);
        }

        $worker->latitude = $data['latitude'];
        $worker->longitude = $data['longitude'];
        $worker->save();

        return response()->json([
            'success' => true,
            'message' => 'Location updated successfully',
            'data' => $worker,
        ]);
    }

    /**
     * Get the nearest workers to a given latitude/longitude.
     */
    public function getNearestWorkers(Request $request): JsonResponse
    {
        $data = $request->validate([
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'limit' => 'sometimes|integer|min:1|max:50',
        ]);

        $latitude = (float) $data['latitude'];
        $longitude = (float) $data['longitude'];
        $limit = isset($data['limit']) ? (int) $data['limit'] : 5;

        // Haversine formula to approximate distance in kilometers
        $haversine = '(6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude))))';

        $workers = Worker::query()
            ->where('approval_status', 'approved')
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->select('*')
            ->selectRaw("$haversine AS distance", [$latitude, $longitude, $latitude])
            ->orderBy('distance')
            ->limit($limit)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $workers,
        ]);
    }

    /**
     * Get a single worker by ID
     */
    public function show($id): JsonResponse
    {
        $worker = Worker::where('approval_status', 'approved')
            ->with([
                'services',
                'jobRequests' => function ($query) {
                    $query->whereIn('status', ['accepted', 'in_progress', 'completed'])
                        ->with('customer')
                        ->orderBy('created_at', 'desc')
                        ->limit(10);
                },
            ])
            ->find($id);

        if (! $worker) {
            return response()->json([
                'success' => false,
                'message' => 'Worker not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $worker,
        ]);
    }

    /**
     * Get authenticated worker's profile
     */
    public function getProfile(Request $request): JsonResponse
    {
        $auth = $request->user();

        if ($auth->type !== 'worker') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $worker = Worker::with('services')->where('worker_id', $auth->id)->first();

        if (! $worker) {
            return response()->json([
                'success' => false,
                'message' => 'Worker profile not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $worker,
        ]);
    }

    /**
     * Get available job requests for workers to apply
     */
    public function getAvailableJobs(Request $request): JsonResponse
    {
        $auth = $request->user();

        if ($auth->type !== 'worker') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $worker = Worker::where('worker_id', $auth->id)->first();

        if (! $worker) {
            return response()->json(['message' => 'Worker profile not found'], 404);
        }

        // Check if worker is approved
        if ($worker->approval_status !== 'approved') {
            return response()->json([
                'success' => false,
                'message' => 'Your account is pending approval. Please wait for admin approval.',
                'approval_status' => $worker->approval_status,
            ], 403);
        }

        $perPage = $request->input('per_page', 15);

        // Get job requests that:
        // 1. Don't have a worker assigned yet (worker_id is NULL)
        // 2. Status is pending
        // 3. Worker hasn't already applied
        // Note: Jobs with worker_id set are direct bookings and not available for application
        $appliedJobIds = WorkerApplication::where('worker_id', $worker->worker_id)
            ->pluck('job_request_id')
            ->toArray();

        $availableJobs = JobRequest::whereNull('worker_id')
            ->where('status', 'pending')
            ->whereNotIn('id', $appliedJobIds)
            ->with(['customer', 'applications'])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $availableJobs,
        ]);
    }

    /**
     * Get job requests assigned to this worker
     * Includes jobs with status: pending (assigned but not yet accepted), accepted, in_progress, completed
     */
    public function getMyJobs(Request $request): JsonResponse
    {
        $auth = $request->user();

        if ($auth->type !== 'worker') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $worker = Worker::where('worker_id', $auth->id)->first();

        if (! $worker) {
            return response()->json(['message' => 'Worker profile not found'], 404);
        }

        $perPage = $request->input('per_page', 15);

        // Get all jobs assigned to this worker (including pending ones that need acceptance)
        $myJobs = JobRequest::where('worker_id', $worker->worker_id)
            ->whereIn('status', ['pending', 'accepted', 'in_progress', 'completed'])
            ->with(['customer', 'applications'])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $myJobs,
        ]);
    }

    /**
     * Apply for a job request
     */
    public function applyForJob(Request $request, int $jobRequestId): JsonResponse
    {
        $auth = $request->user();

        if ($auth->type !== 'worker') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $worker = Worker::where('worker_id', $auth->id)->first();

        if (! $worker) {
            return response()->json(['message' => 'Worker profile not found'], 404);
        }

        // Check if worker is approved
        if ($worker->approval_status !== 'approved') {
            return response()->json([
                'message' => 'Your account is pending approval. You cannot apply for jobs until approved by admin.',
                'approval_status' => $worker->approval_status,
            ], 403);
        }

        $data = $request->validate([
            'message' => 'nullable|string',
            'proposed_price' => 'nullable|numeric|min:0',
        ]);

        $jobRequest = JobRequest::where('id', $jobRequestId)
            ->whereNull('worker_id')
            ->where('status', 'pending')
            ->first();

        if (! $jobRequest) {
            return response()->json(['message' => 'Job request not found or not available'], 404);
        }

        // Check if worker already applied
        $existingApplication = WorkerApplication::where('job_request_id', $jobRequestId)
            ->where('worker_id', $worker->worker_id)
            ->first();

        if ($existingApplication) {
            return response()->json(['message' => 'You have already applied for this job'], 422);
        }

        $application = WorkerApplication::create([
            'job_request_id' => $jobRequestId,
            'worker_id' => $worker->worker_id,
            'message' => $data['message'] ?? null,
            'proposed_price' => $data['proposed_price'] ?? null,
            'status' => 'pending',
        ]);

        $application->load(['worker', 'worker.services', 'jobRequest', 'jobRequest.customer']);

        return response()->json([
            'success' => true,
            'message' => 'Application submitted successfully',
            'data' => $application,
        ], 201);
    }

    /**
     * Worker accepts a job that has been assigned to them.
     * This moves the job from "pending" to "accepted" state.
     * Worker can then start the job (which moves it to "in_progress").
     */
    public function acceptJob(Request $request, int $jobRequestId): JsonResponse
    {
        $auth = $request->user();

        if ($auth->type !== 'worker') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $worker = Worker::where('worker_id', $auth->id)->first();

        if (! $worker) {
            return response()->json(['message' => 'Worker profile not found'], 404);
        }

        // Accept jobs that are pending and assigned to this worker
        $jobRequest = JobRequest::where('id', $jobRequestId)
            ->where('worker_id', $worker->worker_id)
            ->where('status', 'pending')
            ->first();

        if (! $jobRequest) {
            return response()->json(['message' => 'Job not found or cannot be accepted'], 404);
        }

        // Change status from 'pending' to 'accepted'
        $jobRequest->status = 'accepted';
        $jobRequest->save();

        $jobRequest->load(['customer', 'applications']);

        return response()->json([
            'success' => true,
            'message' => 'Job accepted successfully',
            'data' => $jobRequest,
        ]);
    }

    /**
     * Worker starts working on an accepted job.
     * This moves the job from "accepted" to "in_progress" state.
     */
    public function startJob(Request $request, int $jobRequestId): JsonResponse
    {
        $auth = $request->user();

        if ($auth->type !== 'worker') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $worker = Worker::where('worker_id', $auth->id)->first();

        if (! $worker) {
            return response()->json(['message' => 'Worker profile not found'], 404);
        }

        $jobRequest = JobRequest::where('id', $jobRequestId)
            ->where('worker_id', $worker->worker_id)
            ->where('status', 'accepted')
            ->first();

        if (! $jobRequest) {
            return response()->json(['message' => 'Job not found or cannot be started'], 404);
        }

        $jobRequest->status = 'in_progress';
        $jobRequest->save();

        $jobRequest->load(['customer', 'applications']);

        return response()->json([
            'success' => true,
            'message' => 'Job started successfully',
            'data' => $jobRequest,
        ]);
    }

    /**
     * Worker marks a job as completed and records the final payment amount.
     */
    public function completeJob(Request $request, int $jobRequestId): JsonResponse
    {
        $auth = $request->user();

        if ($auth->type !== 'worker') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $worker = Worker::where('worker_id', $auth->id)->first();

        if (! $worker) {
            return response()->json(['message' => 'Worker profile not found'], 404);
        }

        $data = $request->validate([
            'final_price' => 'nullable|numeric|min:0',
        ]);

        $jobRequest = JobRequest::where('id', $jobRequestId)
            ->where('worker_id', $worker->worker_id)
            ->whereIn('status', ['accepted', 'in_progress'])
            ->first();

        if (! $jobRequest) {
            return response()->json(['message' => 'Job not found or cannot be completed'], 404);
        }

        if (array_key_exists('final_price', $data) && $data['final_price'] !== null) {
            $jobRequest->final_price = $data['final_price'];
        }

        $jobRequest->status = 'completed';
        $jobRequest->completed_at = now();
        $jobRequest->save();

        $jobRequest->load(['customer', 'applications']);

        return response()->json([
            'success' => true,
            'message' => 'Job marked as completed',
            'data' => $jobRequest,
        ]);
    }
}
