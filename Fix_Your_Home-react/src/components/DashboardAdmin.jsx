import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext.jsx'

const DashboardAdmin = () => {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [pendingApprovals, setPendingApprovals] = useState([])
  const [approvalsLoading, setApprovalsLoading] = useState(false)
  const [showApprovalsModal, setShowApprovalsModal] = useState(false)
  const [processingWorkerId, setProcessingWorkerId] = useState(null)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  useEffect(() => {
    fetchAdminStats()
    fetchPendingApprovals()
  }, [])

  const fetchAdminStats = async () => {
    try {
      setLoading(true)
      const response = await api.getAdminStats()
      setStats(response.data)
    } catch (error) {
      console.error('Error fetching admin stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPendingApprovals = async () => {
    try {
      setApprovalsLoading(true)
      const response = await api.getPendingApprovals({ per_page: 50 })
      const approvalsData = response.data?.data?.data || (Array.isArray(response.data?.data) ? response.data.data : [])
      setPendingApprovals(approvalsData)
    } catch (error) {
      console.error('Error fetching pending approvals:', error)
    } finally {
      setApprovalsLoading(false)
    }
  }

  const handleApproveWorker = async (workerId) => {
    if (!window.confirm('Are you sure you want to approve this worker?')) {
      return
    }

    setProcessingWorkerId(workerId)
    try {
      await api.approveWorker(workerId)
      await fetchPendingApprovals()
      await fetchAdminStats()
      alert('Worker approved successfully!')
    } catch (error) {
      console.error('Error approving worker:', error)
      alert(error.response?.data?.message || 'Failed to approve worker')
    } finally {
      setProcessingWorkerId(null)
    }
  }

  const handleRejectWorker = async (workerId) => {
    if (!window.confirm('Are you sure you want to reject this worker? This action cannot be undone.')) {
      return
    }

    setProcessingWorkerId(workerId)
    try {
      await api.rejectWorker(workerId)
      await fetchPendingApprovals()
      await fetchAdminStats()
      alert('Worker rejected successfully!')
    } catch (error) {
      console.error('Error rejecting worker:', error)
      alert(error.response?.data?.message || 'Failed to reject worker')
    } finally {
      setProcessingWorkerId(null)
    }
  }

  const kpis = stats?.kpis
    ? [
        {
          label: 'Total Requests',
          value: stats.kpis.total_requests.toLocaleString(),
          delta: 'All time',
          tone: 'from-sky-400 to-sky-200',
        },
        {
          label: 'Total Orders',
          value: stats.kpis.total_orders.toLocaleString(),
          delta: 'Fulfilled',
          tone: 'from-emerald-400 to-emerald-200',
        },
        {
          label: 'Total Income',
          value: `$${stats.kpis.total_income.toLocaleString()}`,
          delta: 'Revenue',
          tone: 'from-amber-400 to-amber-200',
        },
        {
          label: 'Active Workers',
          value: stats.kpis.active_workers.toString(),
          delta: `${stats.kpis.pending_approvals} pending approval`,
          tone: 'from-indigo-400 to-indigo-200',
        },
      ]
    : [
        { label: 'Total Requests', value: '0', delta: 'Loading...', tone: 'from-sky-400 to-sky-200' },
        { label: 'Total Orders', value: '0', delta: 'Loading...', tone: 'from-emerald-400 to-emerald-200' },
        { label: 'Total Income', value: '$0', delta: 'Loading...', tone: 'from-amber-400 to-amber-200' },
        { label: 'Active Workers', value: '0', delta: 'Loading...', tone: 'from-indigo-400 to-indigo-200' },
      ]

  const recentActivities = stats?.recent_activities || []
  const tables = stats?.kpis
    ? [
        { name: 'Pending Approvals', count: stats.kpis.pending_approvals },
        { name: 'Disputes', count: 0 },
        { name: 'Refund Requests', count: 0 },
      ]
    : [
        { name: 'Pending Approvals', count: 0 },
        { name: 'Disputes', count: 0 },
        { name: 'Refund Requests', count: 0 },
      ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#eef4ff] via-white to-[#f7f2f0] text-slate-900">
      <header className="max-w-6xl mx-auto mt-8 flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white/90 px-6 py-5 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div>
          <a href="/" className="logo" aria-label="Fix Your Home" />
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">Control Center</p>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-slate-500">Monitor system health, revenue, and workforce.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-indigo-200 hover:text-indigo-600">
            Export
          </button>
          <button className="rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-indigo-600">
            Create Report
          </button>
          <button 
            onClick={handleLogout}
            className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto mt-8 space-y-8 px-4 pb-12">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((item) => (
            <div key={item.label} className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-md">
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${item.tone}`} />
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
              <p className="mt-3 text-3xl font-bold text-slate-900">{item.value}</p>
              <p className="mt-1 text-xs font-semibold text-emerald-600">{item.delta}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-md">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold">Live Activity</h2>
              <button className="text-sm font-semibold text-indigo-600 hover:underline">View log</button>
            </div>
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-8 text-slate-500">Loading activities...</div>
              ) : recentActivities.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No recent activities</div>
              ) : (
                recentActivities.map((item, index) => (
                  <div
                    key={index}
                    className="flex flex-col gap-1 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                      <p className="text-xs text-slate-500">{item.detail}</p>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">{item.time}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-md">
            <h2 className="text-lg font-semibold">Queues</h2>
            <div className="space-y-3">
              {tables.map((row) => (
                <div key={row.name} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <span className="text-sm font-semibold text-slate-800">{row.name}</span>
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                    {row.count}
                  </span>
                </div>
              ))}
            </div>
            <button 
              onClick={() => setShowApprovalsModal(true)}
              className="w-full rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-indigo-600"
            >
              Review Pending Approvals ({stats?.kpis?.pending_approvals || 0})
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-md">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Financial Snapshot</h2>
              <p className="text-xs text-slate-500">Today vs last 7 days</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:border-indigo-200 hover:text-indigo-600">
                Today
              </button>
              <button className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:border-indigo-200 hover:text-indigo-600">
                7 Days
              </button>
              <button className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:border-indigo-200 hover:text-indigo-600">
                30 Days
              </button>
            </div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-500">Payouts</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                ${loading ? '0' : stats?.financial?.payouts?.toLocaleString() || '0'}
              </p>
              <p className="text-xs font-semibold text-emerald-600">Total payouts</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-500">Platform Fees</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                ${loading ? '0' : stats?.financial?.platform_fees?.toLocaleString() || '0'}
              </p>
              <p className="text-xs font-semibold text-emerald-600">Total fees</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-500">Disputed</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                ${loading ? '0' : stats?.financial?.disputed?.toLocaleString() || '0'}
              </p>
              <p className="text-xs font-semibold text-amber-600">Disputed amount</p>
            </div>
          </div>
        </section>

        {/* Pending Approvals Modal */}
        {showApprovalsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowApprovalsModal(false)}>
            <div className="w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Pending Worker Approvals</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {pendingApprovals.length} worker(s) waiting for approval
                  </p>
                </div>
                <button
                  onClick={() => setShowApprovalsModal(false)}
                  className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                {approvalsLoading ? (
                  <div className="text-center py-8 text-slate-500">Loading pending approvals...</div>
                ) : pendingApprovals.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">No pending approvals</div>
                ) : (
                  pendingApprovals.map((worker) => (
                    <div key={worker.worker_id || worker.id} className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-lg font-semibold text-slate-900">{worker.name || 'Unknown Worker'}</h3>
                            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                              Pending Approval
                            </span>
                          </div>
                          
                          <div className="grid gap-2 sm:grid-cols-2">
                            <div>
                              <p className="text-xs font-semibold text-slate-500">Email</p>
                              <p className="text-sm text-slate-900">{worker.email || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-500">Phone</p>
                              <p className="text-sm text-slate-900">{worker.phone || 'N/A'}</p>
                            </div>
                            {worker.description && (
                              <div className="sm:col-span-2">
                                <p className="text-xs font-semibold text-slate-500">Description</p>
                                <p className="text-sm text-slate-700">{worker.description}</p>
                              </div>
                            )}
                          </div>

                          {worker.services && worker.services.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs font-semibold text-slate-500 mb-2">Services Offered</p>
                              <div className="flex flex-wrap gap-2">
                                {worker.services.map((service, idx) => (
                                  <span
                                    key={idx}
                                    className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700"
                                  >
                                    {service.name || service.service || service}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {worker.photo && (
                            <div className="mt-3">
                              <p className="text-xs font-semibold text-slate-500 mb-2">Photo</p>
                              <img
                                src={worker.photo.startsWith('http') ? worker.photo : `/storage/${worker.photo}`}
                                alt={worker.name}
                                className="h-24 w-24 rounded-lg object-cover border border-slate-200"
                                onError={(e) => {
                                  e.target.style.display = 'none'
                                }}
                              />
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 lg:w-48">
                          <button
                            onClick={() => handleApproveWorker(worker.worker_id || worker.id)}
                            disabled={processingWorkerId === (worker.worker_id || worker.id)}
                            className="w-full rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {processingWorkerId === (worker.worker_id || worker.id) ? 'Processing...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleRejectWorker(worker.worker_id || worker.id)}
                            disabled={processingWorkerId === (worker.worker_id || worker.id)}
                            className="w-full rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {processingWorkerId === (worker.worker_id || worker.id) ? 'Processing...' : 'Reject'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default DashboardAdmin
