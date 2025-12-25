import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const job = location.state;

  const [method, setMethod] = useState('card');
  const [accountNumber, setAccountNumber] = useState('');
  const [pin, setPin] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="text-center text-gray-700">
          <p className="mb-4">No job selected for payment.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 rounded-full bg-emerald-500 text-white font-semibold"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await axios.post(`/api/user/jobs/${job.jobId || job.id}/pay`, {
        method,
        account_number: accountNumber,
        pin,
      });

      navigate('/user', {
        state: { message: 'Payment successful and job completed.' },
      });
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || 'Payment failed. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f4ff] flex flex-col">
      {/* Top bar like your app */}
      <header className="flex items-center justify-between px-6 py-3 bg-[#e7fff5] shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-emerald-500" />
          <span className="font-bold text-[#1b2559] text-lg">Fix Your Home</span>
        </div>

        <nav className="flex items-center gap-4">
          <button className="px-5 py-1 rounded-full bg-[#c6f3ff] text-[#1b2559] font-semibold shadow-sm">
            Home
          </button>
          <button className="px-5 py-1 rounded-full bg-white text-[#1b2559] font-semibold shadow-sm">
            History
          </button>
        </nav>

        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-[#ffd28f]" />
          <span className="font-semibold text-[#1b2559]">User</span>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex justify-center items-center px-6 py-10">
        <div className="max-w-5xl w-full flex gap-10">
          {/* Left text */}
          <div className="flex-1 flex items-center">
            <div className="text-left">
              <p className="text-4xl font-extrabold leading-tight text-[#1b2559]">
                Choose Your
                <br />
                Payment
                <br />
                Method
              </p>
            </div>
          </div>

          {/* Right card */}
          <div className="flex-[1.4] bg-white rounded-3xl shadow-lg overflow-hidden">
            {/* Green header */}
            <div className="bg-[#22c55e] px-8 py-5 rounded-b-3xl">
              <h2 className="text-2xl font-bold text-white">
                Proceed to Payment
              </h2>
            </div>

            {/* Form area */}
            <form
              onSubmit={handleSubmit}
              className="px-8 py-6 space-y-5 text-[#1f2933]"
            >
              {/* Pay with */}
              <div>
                <p className="font-semibold mb-2">Pay with:</p>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="method"
                      value="card"
                      checked={method === 'card'}
                      onChange={() => setMethod('card')}
                      className="w-4 h-4"
                    />
                    <span>Card</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="method"
                      value="bkash"
                      checked={method === 'bkash'}
                      onChange={() => setMethod('bkash')}
                      className="w-4 h-4"
                    />
                    <span>Bkash</span>
                  </label>
                </div>
              </div>

              {/* Name (auto) */}
              <div>
                <label className="block text-sm font-semibold mb-1">Name</label>
                <input
                  type="text"
                  value={job.customerName || job.userName}
                  readOnly
                  className="w-full rounded-xl bg-[#f3f4f6] px-4 py-3 text-gray-600 cursor-not-allowed border border-transparent focus:outline-none"
                />
              </div>

              {/* Amount (auto) */}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Amount
                </label>
                <input
                  type="text"
                  value={job.amount?.toFixed
                    ? job.amount.toFixed(2)
                    : job.amount}
                  readOnly
                  className="w-full rounded-xl bg-[#f3f4f6] px-4 py-3 text-gray-600 cursor-not-allowed border border-transparent focus:outline-none"
                />
              </div>

              {/* Card or Bkash number */}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  {method === 'card' ? 'Card Number' : 'Bkash Number'}
                </label>
                <input
                  type="text"
                  required
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder={
                    method === 'card' ? 'Enter card number' : 'Enter Bkash number'
                  }
                  className="w-full rounded-xl bg-[#f9fafb] px-4 py-3 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              {/* PIN */}
              <div>
                <label className="block text-sm font-semibold mb-1">
                  PIN Number
                </label>
                <input
                  type="password"
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Enter PIN"
                  className="w-full rounded-xl bg-[#f9fafb] px-4 py-3 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              {error && (
                <p className="text-sm text-red-500">
                  {error}
                </p>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-3 rounded-full bg-[#16a34a] text-white font-semibold text-lg shadow-md hover:bg-[#15803d] transition disabled:opacity-60"
                >
                  {submitting ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PaymentPage;
