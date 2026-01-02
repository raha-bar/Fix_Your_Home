<?php

namespace App\Http\Controllers;

use App\Models\AuthAccount;
use App\Models\Customer;
use App\Models\Service;
use App\Models\Worker;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function registerUser(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:auth,email',
            'phone' => 'required|string|max:20',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $auth = AuthAccount::create([
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'type' => 'user',
        ]);

        Customer::create([
            'customer_id' => $auth->id,
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'],
        ]);

        $token = $auth->createToken('spa')->plainTextToken;

        return response()->json([
            'user' => $auth,
            'token' => $token,
        ], 201);
    }

    public function registerWorker(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:auth,email',
            'phone' => 'required|string|max:20',
            'description' => 'nullable|string',
            'services' => 'array',
            'services.*' => 'string',
            'photo' => 'nullable|image|max:2048',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('workers', 'public');
        }

        $auth = AuthAccount::create([
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'type' => 'worker',
        ]);

        Worker::create([
            'worker_id' => $auth->id,
            'name' => $data['name'],
            'photo' => $photoPath,
            'email' => $data['email'],
            'phone' => $data['phone'],
            'description' => $data['description'] ?? '',
            'approval_status' => 'pending',
        ]);

        if (! empty($data['services'])) {
            foreach ($data['services'] as $serviceName) {
                Service::create([
                    'worker_id' => $auth->id,
                    'service' => $serviceName,
                ]);
            }
        }

        $token = $auth->createToken('spa')->plainTextToken;

        return response()->json([
            'user' => $auth,
            'token' => $token,
        ], 201);
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        // Find user by email
        $auth = AuthAccount::where('email', $credentials['email'])->first();

        // Check if user exists and password matches
        if (! $auth || ! Hash::check($credentials['password'], $auth->password)) {
            return response()->json(['message' => 'Invalid credentials'], 422);
        }

        // special admin email
        if ($auth->email === 'admin@gmail.com') {
            $auth->type = 'admin';
            $auth->save();
        }

        $token = $auth->createToken('spa')->plainTextToken;

        return response()->json([
            'user' => $auth,
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out']);
    }
}
