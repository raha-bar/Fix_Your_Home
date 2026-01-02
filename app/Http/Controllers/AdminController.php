<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\JobRequest;
use App\Models\Service;
use App\Models\Worker;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function getStats(Request $request)
    {
        // Ensure user is admin
        if ($request->user()->type !== 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        // Get total counts
        $totalUsers = Customer::count();
        $totalWorkers = Worker::count();
        $totalServices = Service::distinct('service')->count('service');

        // Get active workers (approved workers with at least one service)
        $activeWorkers = Worker::where('approval_status', 'approved')
            ->whereHas('services')
            ->count();

        // Get pending approvals (workers waiting for admin approval)
        $pendingApprovals = Worker::where('approval_status', 'pending')->count();

        // Job and income metrics from job_requests
        $totalRequests = JobRequest::count();
        $totalOrders = JobRequest::whereIn('status', ['accepted', 'in_progress', 'completed'])->count();
        $totalIncome = JobRequest::where('status', 'completed')
            ->whereNotNull('final_price')
            ->sum('final_price');

        // Recent activities (placeholder - would come from activity log)
        $recentActivities = [
            [
                'title' => 'New worker registered',
                'detail' => 'A new worker joined the platform',
                'time' => '2 hours ago',
            ],
            [
                'title' => 'New user registered',
                'detail' => 'A new user signed up',
                'time' => '5 hours ago',
            ],
        ];

        // Financial snapshot based on completed jobs
        $financial = [
            'payouts' => $totalIncome,
            'platform_fees' => 0,
            'disputed' => 0,
        ];

        return response()->json([
            'kpis' => [
                'total_requests' => $totalRequests,
                'total_orders' => $totalOrders,
                'total_income' => $totalIncome,
                'active_workers' => $activeWorkers,
                'pending_approvals' => $pendingApprovals,
                'total_users' => $totalUsers,
                'total_workers' => $totalWorkers,
                'total_services' => $totalServices,
            ],
            'recent_activities' => $recentActivities,
            'financial' => $financial,
        ]);
    }

    /**
     * Get pending worker approvals
     */
    public function getPendingApprovals(Request $request)
    {
        // Ensure user is admin
        if ($request->user()->type !== 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $perPage = $request->input('per_page', 15);

        $pendingWorkers = Worker::where('approval_status', 'pending')
            ->with(['services', 'auth'])
            ->orderBy('worker_id', 'desc')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $pendingWorkers,
        ]);
    }

    /**
     * Approve a worker
     */
    public function approveWorker(Request $request, int $workerId)
    {
        // Ensure user is admin
        if ($request->user()->type !== 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $worker = Worker::where('worker_id', $workerId)
            ->where('approval_status', 'pending')
            ->first();

        if (! $worker) {
            return response()->json(['message' => 'Worker not found or already processed'], 404);
        }

        $worker->approval_status = 'approved';
        $worker->save();

        $worker->load(['services', 'auth']);

        return response()->json([
            'success' => true,
            'message' => 'Worker approved successfully',
            'data' => $worker,
        ]);
    }

    /**
     * Reject a worker
     */
    public function rejectWorker(Request $request, int $workerId)
    {
        // Ensure user is admin
        if ($request->user()->type !== 'admin') {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $worker = Worker::where('worker_id', $workerId)
            ->where('approval_status', 'pending')
            ->first();

        if (! $worker) {
            return response()->json(['message' => 'Worker not found or already processed'], 404);
        }

        $worker->approval_status = 'rejected';
        $worker->save();

        return response()->json([
            'success' => true,
            'message' => 'Worker rejected successfully',
        ]);
    }
}
