<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PasswordController;
use App\Http\Controllers\ServiceController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\WorkerController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| These routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Make something great!
|
*/

/**
 * Public auth routes
 * - user register
 * - worker register
 * - login
 * - password reset flow
 */
Route::post('/register/user', [AuthController::class, 'registerUser']);
Route::post('/register/worker', [AuthController::class, 'registerWorker']);
Route::post('/login', [AuthController::class, 'login']);

// password reset (Laravel password broker)
Route::post('/forgot-password', [PasswordController::class, 'sendResetLinkEmail'])
    ->name('password.email');
Route::post('/reset-password', [PasswordController::class, 'reset'])
    ->name('password.update');

/**
 * Public data for forms
 * - list of available services for worker signup
 */
Route::get('/available-services', [ServiceController::class, 'listAvailable']);

/**
 * Protected routes (need token via Sanctum)
 * - current user
 * - logout
 * - dashboard endpoints
 */
Route::middleware('auth:sanctum')->group(function () {
    // return current authenticated auth account
    Route::get('/me', function (Request $request) {
        return $request->user();
    });

    // logout (delete current access token)
    Route::post('/logout', [AuthController::class, 'logout']);

    // Admin routes
    Route::prefix('admin')->group(function () {
        Route::get('/stats', [AdminController::class, 'getStats']);
        Route::get('/pending-approvals', [AdminController::class, 'getPendingApprovals']);
        Route::post('/workers/{workerId}/approve', [AdminController::class, 'approveWorker']);
        Route::post('/workers/{workerId}/reject', [AdminController::class, 'rejectWorker']);
    });

    // Worker routes
    Route::prefix('worker')->group(function () {
        Route::get('/profile', [WorkerController::class, 'getProfile']);
        Route::get('/available-jobs', [WorkerController::class, 'getAvailableJobs']);
        Route::get('/my-jobs', [WorkerController::class, 'getMyJobs']);
        Route::post('/jobs/{jobRequestId}/apply', [WorkerController::class, 'applyForJob']);
        Route::post('/jobs/{jobRequestId}/accept', [WorkerController::class, 'acceptJob']);
        Route::post('/jobs/{jobRequestId}/start', [WorkerController::class, 'startJob']);
        Route::post('/jobs/{jobRequestId}/complete', [WorkerController::class, 'completeJob']);
        Route::post('/location', [WorkerController::class, 'updateLocation']);

    });

    // User routes
    Route::prefix('user')->group(function () {
        Route::get('/job-requests', [UserController::class, 'getJobRequests']);
        Route::post('/job-requests', [UserController::class, 'createJobRequest']);
        Route::post('/job-requests/{jobRequestId}/applications/{applicationId}/accept', [UserController::class, 'acceptWorkerApplication']);
        Route::delete('/job-requests/{jobRequestId}', [UserController::class, 'deleteJobRequest']);
        Route::post('/job-requests/{jobRequestId}/rating', [UserController::class, 'rateJobRequest']);

// Rewards
Route::get('/rewards/available', [UserController::class, 'getAvailableRewards']);
Route::post('/rewards/opt-in', [UserController::class, 'setRewardsOptIn']);

    });

    // Nearest workers (for authenticated users)
    Route::get('/workers/nearest', [WorkerController::class, 'getNearestWorkers']);
    Route::post('/user/jobs/{jobRequestId}/pay', [UserController::class, 'payForJob']);
    Route::get('/workers/multi-service', [UserController::class, 'getMultiServiceWorkers']);
});

/**
 * Public worker routes (for browsing workers)
 */
Route::get('/workers', [WorkerController::class, 'index']);
Route::get('/workers/top-month', [WorkerController::class, 'getTopWorkersForMonth']);
Route::get('/workers/{id}', [WorkerController::class, 'show']);
