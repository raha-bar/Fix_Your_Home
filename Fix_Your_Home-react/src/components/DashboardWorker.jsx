import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext.jsx'

const DashboardWorker = () => {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [worker, setWorker] = useState(null)
  const [loading, setLoading] = useState(true)
  const [availableJobs, setAvailableJobs] = useState([])
  const [myJobs, setMyJobs] = useState([])
  const [jobsLoading, setJobsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('available')
  const [selectedJob, setSelectedJob] = useState(null)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [applyForm, setApplyForm] = useState({
    message: '',
    proposed_price: '',
  })
  const [applying, setApplying] = useState(false)
  const [acceptingJobId, setAcceptingJobId] = useState(null)
  const [startingJobId, setStartingJobId] = useState(null)
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [jobToComplete, setJobToComplete] = useState(null)
  const [completeForm, setCompleteForm] = useState({
    final_price: '',
  })
  const [completing, setCompleting] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  useEffect(() => {
    fetchWorkerData()
    fetchJobs()
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            await api.updateWorkerLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            })
          } catch (error) {
            console.error('Error updating worker location:', error)
          }
        },
        (error) => {
          console.error('Worker location permission denied or unavailable:', error)
        }
      )
    }
  }, [])

  const fetchWorkerData = async () => {
    try {
      setLoading(true)
      // Fetch authenticated worker's profile
      const response = await api.getMyWorkerProfile()
      // Handle response: { success: true, data: {...} }
      setWorker(response.data?.data || response.data)
    } catch (error) {
      console.error('Error fetching worker data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchJobs = async () => {
    try {
      setJobsLoading(true)
      const [availableResponse, myJobsResponse] = await Promise.all([
        api.getAvailableJobs({ per_page: 10 }),
        api.getMyJobs({ per_page: 10 }),
      ])
      
      const availableData = availableResponse.data?.data?.data || (Array.isArray(availableResponse.data?.data) ? availableResponse.data.data : [])
      const myJobsData = myJobsResponse.data?.data?.data || (Array.isArray(myJobsResponse.data?.data) ? myJobsResponse.data.data : [])
      
      setAvailableJobs(availableData)
      setMyJobs(myJobsData)
    } catch (error) {
      console.error('Error fetching jobs:', error)
    } finally {
      setJobsLoading(false)
    }
  }

  const handleApplyForJob = (job) => {
    setSelectedJob(job)
    setShowApplyModal(true)
  }

  const handleSubmitApplication = async (e) => {
    e.preventDefault()
    if (!selectedJob) return

    setApplying(true)
    try {
      await api.applyForJob(selectedJob.id, {
        message: applyForm.message,
        proposed_price: applyForm.proposed_price ? parseFloat(applyForm.proposed_price) : null,
      })
      
      await fetchJobs()
      setShowApplyModal(false)
      setSelectedJob(null)
      setApplyForm({ message: '', proposed_price: '' })
      alert('Application submitted successfully!')
    } catch (error) {
      console.error('Error applying for job:', error)
      alert(error.response?.data?.message || 'Failed to submit application')
    } finally {
      setApplying(false)
    }
  }

  const handleAcceptJob = async (job) => {
    if (!window.confirm('Accept this job assignment?')) return

    setAcceptingJobId(job.id)
    try {
      await api.acceptJob(job.id)
      await fetchJobs()
      alert('Job accepted successfully! You can now start working on it.')
    } catch (error) {
      console.error('Error accepting job:', error)
      alert(error.response?.data?.message || 'Failed to accept job')
    } finally {
      setAcceptingJobId(null)
    }
  }

  const handleStartJob = async (job) => {
    if (!window.confirm('Start working on this job?')) return

    setStartingJobId(job.id)
    try {
      await api.startJob(job.id)
      await fetchJobs()
      alert('Job started successfully!')
    } catch (error) {
      console.error('Error starting job:', error)
      alert(error.response?.data?.message || 'Failed to start job')
    } finally {
      setStartingJobId(null)
    }
  }

  const openCompleteModal = (job) => {
    setJobToComplete(job)
    setCompleteForm({
      final_price: job.final_price ? String(job.final_price) : '',
    })
    setShowCompleteModal(true)
  }

  const handleCompleteJob = async (e) => {
    e.preventDefault()
    if (!jobToComplete) return

    setCompleting(true)
    try {
      await api.completeJob(jobToComplete.id, {
        final_price: completeForm.final_price ? parseFloat(completeForm.final_price) : null,
      })
      await fetchJobs()
      setShowCompleteModal(false)
      setJobToComplete(null)
      setCompleteForm({ final_price: '' })
      alert('Job marked as completed!')
    } catch (error) {
      console.error('Error completing job:', error)
      alert(error.response?.data?.message || 'Failed to complete job')
    } finally {
      setCompleting(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Not scheduled'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  }

  const formatPrice = (price) => {
    return price ? `$${parseFloat(price).toFixed(2)}` : 'N/A'
  }

  const stats = worker
    ? [
        {
          label: 'Services',
          value: `${worker.services?.length || 0}`,
          detail: 'Services offered',
          accent: 'text-sky-600',
        },
        {
          label: 'Email',
          value: worker.email ? worker.email.substring(0, 15) + '...' : 'N/A',
          detail: 'Contact email',
          accent: 'text-emerald-600',
        },
        {
          label: 'Phone',
          value: worker.phone || 'N/A',
          detail: 'Contact phone',
          accent: 'text-amber-500',
        },
      ]
    : [
        { label: 'Services', value: '0', detail: 'Loading...', accent: 'text-sky-600' },
        { label: 'Email', value: 'Loading...', detail: 'Loading...', accent: 'text-emerald-600' },
        { label: 'Phone', value: 'Loading...', detail: 'Loading...', accent: 'text-amber-500' },
      ]

  return (
    <div className="min-h-screen bg-[#f7f2f0] text-slate-800">
      <header className="max-w-6xl mx-auto mt-8 flex items-center justify-between gap-6 rounded-full border border-slate-100 bg-white/70 px-6 py-3 shadow-sm backdrop-blur">
        <div className="flex items-center gap-3">
          <a href="/" className="logo" aria-label="Fix Your Home" />
          <div className="ml-24">
            <p className="text-lg font-semibold tracking-tight text-slate-900">Fix Your Home</p>
            <p className="text-xs text-slate-500">Worker dashboard</p>
          </div>
        </div>

        <nav className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('available')}
            className={`rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 ${
              activeTab === 'available' 
                ? 'bg-sky-500 text-white hover:bg-sky-600' 
                : 'border border-transparent bg-sky-50 text-slate-700 hover:bg-sky-100'
            }`}
          >
            Available Jobs
          </button>
          <button
            onClick={() => setActiveTab('my-jobs')}
            className={`rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 ${
              activeTab === 'my-jobs' 
                ? 'bg-sky-500 text-white hover:bg-sky-600' 
                : 'border border-transparent bg-sky-50 text-slate-700 hover:bg-sky-100'
            }`}
          >
            My Jobs
          </button>
          <button 
            onClick={handleLogout}
            className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-red-600"
          >
            Logout
          </button>
        </nav>

        <div className="flex items-center gap-3">
          <div className="h-11 w-11 overflow-hidden rounded-full border border-slate-200 bg-gradient-to-br from-amber-100 via-orange-100 to-pink-100 shadow-inner">
            <div className="flex h-full w-full items-center justify-center text-base font-semibold text-slate-700">
              {loading ? '...' : (worker?.name?.[0] || 'W').toUpperCase()}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {loading ? 'Loading...' : worker?.name || 'Worker'}
            </p>
            <p className="text-xs text-slate-500">
              {worker?.services?.[0]?.name || 'House Help'}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto mt-10 space-y-8 px-4 pb-12">
        <section className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white px-8 py-10 shadow-lg">
          <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-sky-200 via-teal-100 to-amber-100" />

          <div className="flex flex-col items-start gap-10 lg:flex-row lg:items-center">
            <div className="relative flex-1 space-y-6">
              <div className="absolute -left-6 -top-6 h-20 w-20 rounded-full bg-sky-100/70 blur-2xl" />
              <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-[#6da7a7] sm:text-5xl">
                Hey! I am {loading ? '...' : worker?.name || 'Worker'}
              </h1>
              <p className="max-w-2xl text-lg leading-relaxed text-slate-600">
                {worker?.services && worker.services.length > 0
                  ? `I specialize in ${worker.services.map(s => s.name).join(', ')}. I'm known for being punctual, respectful, and detail-oriented.`
                  : 'I am a professional worker ready to help with your needs.'}
              </p>
            </div>

            <div className="relative flex-1">
              <div className="absolute -inset-6 rounded-3xl border-2 border-sky-200/70" />
              <div className="overflow-hidden rounded-3xl bg-sky-50 p-4 shadow-inner">
                <img
                  src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=720&q=80"
                  alt="Worker illustration"
                  className="h-full w-full rounded-2xl object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white px-6 py-5 shadow-md"
            >
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {stat.label}
              </span>
              <p className={`mt-4 text-3xl font-bold ${stat.accent}`}>{stat.value}</p>
              <p className="mt-2 text-sm text-slate-500">{stat.detail}</p>
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-sky-100 via-teal-100 to-amber-100" />
            </div>
          ))}
        </section>

        {/* Available Jobs / My Jobs Section */}
        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-md">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            {activeTab === 'available' ? 'Available Jobs' : 'My Assigned Jobs'}
          </h2>
          
          {jobsLoading ? (
            <div className="text-center py-8 text-slate-500">Loading jobs...</div>
          ) : activeTab === 'available' ? (
            availableJobs.length === 0 ? (
              <div className="text-center py-8 text-slate-500">No available jobs at the moment</div>
            ) : (
              <div className="space-y-4">
                {availableJobs.map((job) => (
                  <div key={job.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-900 mb-1">{job.title}</h3>
                        {job.description && (
                          <p className="text-sm text-slate-600 mb-2">{job.description}</p>
                        )}
                        <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                          {job.budget && <span>Budget: {formatPrice(job.budget)}</span>}
                          {job.scheduled_at && <span>Scheduled: {formatDate(job.scheduled_at)}</span>}
                        </div>
                        {job.customer && (
                          <p className="text-xs text-slate-500 mt-2">Customer: {job.customer.name}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleApplyForJob(job)}
                      className="w-full rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600"
                    >
                      Apply for This Job
                    </button>
                  </div>
                ))}
              </div>
            )
          ) : (
            myJobs.length === 0 ? (
              <div className="text-center py-8 text-slate-500">You don't have any assigned jobs yet</div>
            ) : (
              <div className="space-y-4">
                {myJobs.map((job) => (
                  <div key={job.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-slate-900">{job.title}</h3>
                          <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            job.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                            job.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' :
                            job.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                            job.status === 'completed' ? 'bg-slate-100 text-slate-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {job.status === 'in_progress' ? 'In Progress' : job.status}
                          </span>
                        </div>
                        {job.description && (
                          <p className="text-sm text-slate-600 mb-2">{job.description}</p>
                        )}
                        <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                          {job.final_price && <span>Price: {formatPrice(job.final_price)}</span>}
                          {job.scheduled_at && <span>Scheduled: {formatDate(job.scheduled_at)}</span>}
                        </div>
                        {job.customer && (
                          <div className="mt-2">
                            <p className="text-xs font-semibold text-slate-700">Customer: {job.customer.name}</p>
                            <p className="text-xs text-slate-500">Email: {job.customer.email}</p>
                            <p className="text-xs text-slate-500">Phone: {job.customer.phone}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    {(job.status === 'pending' || job.status === 'accepted' || job.status === 'in_progress') && (
                      <div className="mt-3 flex flex-wrap gap-3">
                        {job.status === 'pending' && (
                          <button
                            onClick={() => handleAcceptJob(job)}
                            disabled={acceptingJobId === job.id}
                            className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 disabled:opacity-50"
                          >
                            {acceptingJobId === job.id ? 'Accepting...' : 'Accept Job Assignment'}
                          </button>
                        )}
                        {job.status === 'accepted' && (
                          <button
                            onClick={() => handleStartJob(job)}
                            disabled={startingJobId === job.id}
                            className="rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-600 disabled:opacity-50"
                          >
                            {startingJobId === job.id ? 'Starting...' : 'Start Job'}
                          </button>
                        )}
                        {job.status === 'in_progress' && (
                          <button
                            onClick={() => openCompleteModal(job)}
                            className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600"
                          >
                            Mark as Completed / Payment
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}
        </section>

        {/* Apply for Job Modal */}
        {showApplyModal && selectedJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowApplyModal(false)}>
            <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">Apply for "{selectedJob.title}"</h2>
                <button
                  onClick={() => {
                    setShowApplyModal(false)
                    setSelectedJob(null)
                    setApplyForm({ message: '', proposed_price: '' })
                  }}
                  className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleSubmitApplication} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Message (Optional)</label>
                  <textarea
                    value={applyForm.message}
                    onChange={(e) => setApplyForm({ ...applyForm, message: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-sky-300 focus:outline-none"
                    rows="4"
                    placeholder="Tell the customer why you're a good fit for this job..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Proposed Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={applyForm.proposed_price}
                    onChange={(e) => setApplyForm({ ...applyForm, proposed_price: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-sky-300 focus:outline-none"
                    placeholder="0.00"
                  />
                  {selectedJob.budget && (
                    <p className="text-xs text-slate-500 mt-1">Customer budget: {formatPrice(selectedJob.budget)}</p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={applying}
                    className="flex-1 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 disabled:opacity-50"
                  >
                    {applying ? 'Submitting...' : 'Submit Application'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowApplyModal(false)
                      setSelectedJob(null)
                      setApplyForm({ message: '', proposed_price: '' })
                    }}
                    className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Complete Job / Payment Modal */}
        {showCompleteModal && jobToComplete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowCompleteModal(false)}>
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">Complete "{jobToComplete.title}"</h2>
                <button
                  onClick={() => {
                    setShowCompleteModal(false)
                    setJobToComplete(null)
                    setCompleteForm({ final_price: '' })
                  }}
                  className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCompleteJob} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Payment Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={completeForm.final_price}
                    onChange={(e) => setCompleteForm({ ...completeForm, final_price: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-sky-300 focus:outline-none"
                    placeholder="0.00"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    This amount will be saved as the final payment for this job and will appear in the admin dashboard totals.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={completing}
                    className="flex-1 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600 disabled:opacity-50"
                  >
                    {completing ? 'Saving...' : 'Save & Mark Completed'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCompleteModal(false)
                      setJobToComplete(null)
                      setCompleteForm({ final_price: '' })
                    }}
                    className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default DashboardWorker
