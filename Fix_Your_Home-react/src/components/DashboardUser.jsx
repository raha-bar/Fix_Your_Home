import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext.jsx'

const DashboardUser = () => {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [jobRequests, setJobRequests] = useState([])
  const [workers, setWorkers] = useState([])
  const [loading, setLoading] = useState(true)
  const [workersLoading, setWorkersLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedWorker, setSelectedWorker] = useState(null)
  const [showWorkerProfile, setShowWorkerProfile] = useState(false)
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [bookingForm, setBookingForm] = useState({
    title: '',
    description: '',
    budget: '',
    scheduled_at: '',
  })
  const [bookingLoading, setBookingLoading] = useState(false)
  const [selectedJobRequest, setSelectedJobRequest] = useState(null)
  const [showApplicationsModal, setShowApplicationsModal] = useState(false)
  const [skills, setSkills] = useState([])
  const [selectedSkill, setSelectedSkill] = useState('')
  const [workerDetailsLoading, setWorkerDetailsLoading] = useState(false)
  const [showUrgentModal, setShowUrgentModal] = useState(false)
  const [urgentWorkers, setUrgentWorkers] = useState([])
  const [urgentLoading, setUrgentLoading] = useState(false)
  const [userLocation, setUserLocation] = useState(null)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const handleBookWorker = () => {
    setShowBookingForm(true)
  }

  const handleBookingSubmit = async (e) => {
    e.preventDefault()

    setBookingLoading(true)
    try {
      const payload = {
        title: bookingForm.title,
        description: bookingForm.description,
        budget: bookingForm.budget ? parseFloat(bookingForm.budget) : null,
        scheduled_at: bookingForm.scheduled_at || null,
      }

      if (selectedWorker) {
        payload.worker_id = selectedWorker.worker_id || selectedWorker.id
      }

      const response = await api.createJobRequest(payload)

      // Refresh job requests
      await fetchData()
      
      // Close modals and reset form
      setShowBookingForm(false)
      setShowWorkerProfile(false)
      setSelectedWorker(null)
      setBookingForm({
        title: '',
        description: '',
        budget: '',
        scheduled_at: '',
      })

      alert('Job request created successfully!')
    } catch (error) {
      console.error('Error creating job request:', error)
      alert(error.response?.data?.message || 'Failed to create job request')
    } finally {
      setBookingLoading(false)
    }
  }

  const handleViewApplications = (jobRequest) => {
    setSelectedJobRequest(jobRequest)
    setShowApplicationsModal(true)
  }

  const handleAcceptApplication = async (applicationId) => {
    if (!selectedJobRequest) return

    try {
      await api.acceptWorkerApplication(selectedJobRequest.id, applicationId)
      await fetchData()
      setShowApplicationsModal(false)
      setSelectedJobRequest(null)
      alert('Worker application accepted successfully!')
    } catch (error) {
      console.error('Error accepting application:', error)
      alert(error.response?.data?.message || 'Failed to accept application')
    }
  }

  const handleDeleteRequest = async (jobRequestId) => {
    if (!window.confirm('Are you sure you want to delete this request?')) {
      return
    }

    try {
      await api.deleteJobRequest(jobRequestId)
      await fetchData()
      alert('Request deleted successfully')
    } catch (error) {
      console.error('Error deleting job request:', error)
      alert(error.response?.data?.message || 'Failed to delete request')
    }
  }

  const fetchWorkers = async (skill = '') => {
    setWorkersLoading(true)
    try {
      const params = { per_page: 10 }
      if (skill) {
        params.service = skill
      }

      const workersResponse = await api.getWorkers(params)
      const workersData =
        workersResponse.data?.data?.data ||
        (Array.isArray(workersResponse.data?.data) ? workersResponse.data.data : [])

      setWorkers(workersData)
    } catch (error) {
      console.error('Error fetching workers:', error)
    } finally {
      setWorkersLoading(false)
    }
  }

  const fetchTopWorkers = async () => {
    setWorkersLoading(true)
    try {
      const response = await api.getTopWorkersOfMonth({ limit: 10 })
      const workersData =
        response.data?.data ||
        (Array.isArray(response.data) ? response.data : [])

      setWorkers(workersData)
    } catch (error) {
      console.error('Error fetching top workers:', error)
    } finally {
      setWorkersLoading(false)
    }
  }

  const fetchFallbackUrgentWorkers = async () => {
    try {
      const response = await api.getWorkers({ per_page: 3 })
      const workersData =
        response.data?.data?.data ||
        (Array.isArray(response.data?.data) ? response.data.data : [])
      setUrgentWorkers(workersData)
    } catch (error) {
      console.error('Error fetching fallback workers for urgent help:', error)
    }
  }

  const handleSkillChange = async (e) => {
    const value = e.target.value
    setSelectedSkill(value)
    await fetchWorkers(value)
  }

  const openWorkerProfile = async (worker) => {
    setSelectedWorker(worker)
    setShowWorkerProfile(true)

    try {
      setWorkerDetailsLoading(true)
      const response = await api.getWorker(worker.id)
      setSelectedWorker(response.data?.data || response.data)
    } catch (error) {
      console.error('Error loading worker details:', error)
    } finally {
      setWorkerDetailsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch available skills for worker search
      try {
        const skillsResponse = await api.getAvailableServices()
        const skillsData = Array.isArray(skillsResponse.data) ? skillsResponse.data : []
        setSkills(skillsData)
      } catch (error) {
        console.error('Error fetching skills:', error)
      }

      // Fetch workers (initially top workers of the month)
      if (selectedSkill) {
        await fetchWorkers(selectedSkill)
      } else {
        await fetchTopWorkers()
      }

      // Fetch job requests - handle errors gracefully (may not exist in simplified schema)
      let jobRequestsData = []
      try {
        const requestsResponse = await api.getJobRequests({ per_page: 5 })
        // Handle paginated response: { success: true, data: { data: [...], ... } }
        jobRequestsData = requestsResponse.data?.data?.data || (Array.isArray(requestsResponse.data?.data) ? requestsResponse.data.data : [])
      } catch (error) {
        console.error('Error fetching job requests:', error)
        // Job requests may not exist in simplified schema, so this is expected
      }
      setJobRequests(jobRequestsData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUrgentHelp = async () => {
    setShowUrgentModal(true)
    setUrgentLoading(true)

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          setUserLocation({ latitude, longitude })

          try {
            // Example OpenStreetMap API usage (reverse geocoding)
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
              {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
                },
              }
            )
            const data = await response.json()
            setUserLocation((prev) => ({
              ...prev,
              address: data.display_name,
            }))
          } catch (error) {
            console.error('Error calling OpenStreetMap API:', error)
          }

          try {
            const nearestResponse = await api.getNearestWorkers({
              latitude,
              longitude,
              limit: 5,
            })
            const nearestData =
              nearestResponse.data?.data ||
              (Array.isArray(nearestResponse.data) ? nearestResponse.data : [])
            if (nearestData.length === 0) {
              await fetchFallbackUrgentWorkers()
            } else {
              setUrgentWorkers(nearestData)
            }
          } catch (error) {
            console.error('Error loading nearest workers:', error)
          } finally {
            setUrgentLoading(false)
          }
        },
        async () => {
          try {
            const nearestResponse = await api.getNearestWorkers({ limit: 5 })
            const nearestData =
              nearestResponse.data?.data ||
              (Array.isArray(nearestResponse.data) ? nearestResponse.data : [])
            if (nearestData.length === 0) {
              await fetchFallbackUrgentWorkers()
            } else {
              setUrgentWorkers(nearestData)
            }
          } catch (error) {
            console.error('Error loading nearest workers without location:', error)
          } finally {
            setUrgentLoading(false)
          }
        }
      )
    } else {
      try {
        const nearestResponse = await api.getNearestWorkers({ limit: 5 })
        const nearestData =
          nearestResponse.data?.data ||
          (Array.isArray(nearestResponse.data) ? nearestResponse.data : [])
        if (nearestData.length === 0) {
          await fetchFallbackUrgentWorkers()
        } else {
          setUrgentWorkers(nearestData)
        }
      } catch (error) {
        console.error('Error loading nearest workers without geolocation support:', error)
      } finally {
        setUrgentLoading(false)
      }
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

  const navigateToPayment = (job) => {
    navigate('/payment', {
      state: {
        jobId: job.id,
        title: job.title,
        workerName: job.worker?.name || 'Worker',
        customerName: job.customer?.name,
        amount: job.final_price ?? job.budget ?? 0,
      },
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f7f2f0] via-white to-[#f0f7f9] text-slate-800">
      <header className="max-w-6xl mx-auto mt-8 flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white/80 px-6 py-4 shadow-md backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div>
          <a href="/" className="logo" aria-label="Fix Your Home" />
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-sky-500">Welcome back</p>
          <h1 className="text-2xl font-bold text-slate-900">User Dashboard</h1>
          <p className="text-sm text-slate-500">Manage requests, browse workers, track progress.</p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          <input
            type="search"
            placeholder="Search workers or services..."
            className="w-full min-w-[240px] rounded-full border border-slate-200 px-4 py-2 text-sm shadow-inner focus:border-sky-300 focus:outline-none sm:w-64"
          />
          <button
            onClick={() => {
              setSelectedWorker(null)
              setShowBookingForm(true)
            }}
            className="rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-sky-600"
          >
            Request Work
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
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Request Work card */}
          <div className="flex h-full flex-col justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-500">Request Work</p>
              <p className="text-sm text-slate-600">Post a new task with budget &amp; timing.</p>
            </div>
            <button
              onClick={() => {
                setSelectedWorker(null)
                setShowBookingForm(true)
              }}
              className="mt-4 w-fit rounded-full bg-sky-50 px-4 py-2 text-xs font-semibold text-sky-700 transition hover:bg-sky-100"
            >
              Create Request
            </button>
          </div>

          {/* Find Worker card with skill filter */}
          <div className="flex h-full flex-col justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-500">Find Worker</p>
                <p className="text-sm text-slate-600">Search vetted workers by skill.</p>
              </div>
              {skills.length > 0 ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Select skill</label>
                  <select
                    value={selectedSkill}
                    onChange={handleSkillChange}
                    className="w-full rounded-full border border-slate-200 px-3 py-2 text-xs focus:border-sky-300 focus:outline-none"
                  >
                    <option value="">All skills</option>
                    {skills.map((skill) => (
                      <option key={skill} value={skill}>
                        {skill}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <p className="text-xs text-slate-500">Loading skills...</p>
              )}
            </div>
            <p className="mt-3 text-[11px] text-slate-500">
              Matching workers will appear in the recommended list on the right.
            </p>
          </div>

          {/* Urgent Help card */}
          <div className="flex h-full flex-col justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-500">Urgent Help</p>
              <p className="text-sm text-slate-600">Find nearby workers quickly using your location.</p>
            </div>
            <button
              onClick={handleUrgentHelp}
              className="mt-4 w-fit rounded-full bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
            >
              Find Nearest
            </button>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Recent Requests</h2>
              <button className="text-sm font-semibold text-sky-600 hover:underline">View all</button>
            </div>
            <div className="mt-4 space-y-4">
              {loading ? (
                <div className="text-center py-8 text-slate-500">Loading...</div>
              ) : jobRequests.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No job requests found</div>
              ) : (
                jobRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{req.title}</p>
                      <p className="text-xs text-slate-500">
                        {req.scheduled_at ? formatDate(req.scheduled_at) : 'Not scheduled'}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        req.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        req.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' :
                        req.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                        req.status === 'completed' ? 'bg-slate-100 text-slate-700' :
                        req.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-slate-100 text-slate-600'
                      } capitalize`}>
                        {req.status === 'in_progress' ? 'In Progress' : req.status}
                      </span>
                      {req.status === 'in_progress' && !req.final_price && (
                        <button
                          onClick={() => navigateToPayment(req)}
                          className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white shadow-sm"
                        >
                          Pay Now
                        </button>
                      )}
                      <span className="text-sm font-semibold text-slate-800">
                        {formatPrice(req.final_price || req.budget)}
                      </span>
                      {req.applications && req.applications.length > 0 && !req.worker_id && (
                        <button 
                          onClick={() => handleViewApplications(req)}
                          className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-600"
                        >
                          View Applications ({req.applications.length})
                        </button>
                      )}
                      {req.worker && (
                        <button 
                          onClick={() => {
                            setSelectedWorker(req.worker)
                            setShowWorkerProfile(true)
                          }}
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:border-sky-200 hover:text-sky-700"
                        >
                          View Worker
                        </button>
                      )}
                      {req.worker_id && req.status === 'pending' && (
                        <span className="text-xs text-amber-600 font-semibold">
                          Waiting for worker to accept
                        </span>
                      )}
                      {!req.worker_id && req.status === 'pending' && (
                        <button
                          onClick={() => handleDeleteRequest(req.id)}
                          className="rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white hover:bg-red-600"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Recommended Workers</h2>
            <p className="text-xs text-slate-500">
              Top 10 workers this month{selectedSkill ? ` for "${selectedSkill}"` : ''}.
            </p>
            <div className="mt-4 space-y-3">
              {loading || workersLoading ? (
                <div className="text-center py-4 text-slate-500 text-sm">Loading...</div>
              ) : workers.length === 0 ? (
                <div className="text-center py-4 text-slate-500 text-sm">No workers found</div>
              ) : (
                workers.map((worker) => (
                  <div
                    key={worker.id}
                    onClick={() => openWorkerProfile(worker)}
                    className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 transition hover:border-sky-300 hover:bg-sky-50"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{worker.name || 'Unknown'}</p>
                      <p className="text-xs text-slate-500">
                        {worker.services?.slice(0, 2).map(s => s.name).join(', ') || 'Worker'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">{worker.services?.length || 0} services</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            {workers.length > 0 && (
              <button 
                onClick={() => {
                  setSelectedWorker(workers[0])
                  setShowWorkerProfile(true)
                }}
                className="mt-4 w-full rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-600"
              >
                Book a worker
              </button>
            )}
          </div>
        </section>

        {/* Worker Profile Modal */}
        {showWorkerProfile && selectedWorker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowWorkerProfile(false)}>
            <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">{selectedWorker.name}</h2>
                <button
                  onClick={() => setShowWorkerProfile(false)}
                  className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-slate-500">Email</p>
                  <p className="text-slate-900">{selectedWorker.email}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-500">Phone</p>
                  <p className="text-slate-900">{selectedWorker.phone}</p>
                </div>
                {selectedWorker.services && selectedWorker.services.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-slate-500 mb-2">Services Offered</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedWorker.services.map((service) => (
                        <span
                          key={service.id}
                          className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700"
                        >
                          {service.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-slate-500 mb-2">Work History</p>
                  {workerDetailsLoading ? (
                    <p className="text-xs text-slate-500">Loading work history...</p>
                  ) : selectedWorker.job_requests && selectedWorker.job_requests.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedWorker.job_requests.map((job) => (
                        <div key={job.id} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-slate-900">{job.title}</p>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 capitalize">
                              {job.status}
                            </span>
                          </div>
                          {job.customer && (
                            <p className="mt-1 text-[11px] text-slate-500">For: {job.customer.name}</p>
                          )}
                          <p className="mt-1 text-[11px] text-slate-500">
                            {formatPrice(job.final_price || job.budget)} ·{' '}
                            {job.completed_at ? formatDate(job.completed_at) : 'Ongoing'}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">No completed work history yet.</p>
                  )}
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={handleBookWorker}
                    className="flex-1 rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-600"
                  >
                    Book This Worker
                  </button>
                  <button
                    onClick={() => {
                      setShowWorkerProfile(false)
                      setSelectedWorker(null)
                    }}
                    className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Booking Form Modal */}
        {showBookingForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowBookingForm(false)}>
            <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">
                  {selectedWorker ? `Book ${selectedWorker.name}` : 'Request Work'}
                </h2>
                <button
                  onClick={() => {
                    setShowBookingForm(false)
                    setSelectedWorker(null)
                  }}
                  className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Job Title *</label>
                  <input
                    type="text"
                    required
                    value={bookingForm.title}
                    onChange={(e) => setBookingForm({ ...bookingForm, title: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-sky-300 focus:outline-none"
                    placeholder="e.g., Plumbing repair, House cleaning"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                  <textarea
                    value={bookingForm.description}
                    onChange={(e) => setBookingForm({ ...bookingForm, description: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-sky-300 focus:outline-none"
                    rows="4"
                    placeholder="Describe the work needed..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Budget ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={bookingForm.budget}
                      onChange={(e) => setBookingForm({ ...bookingForm, budget: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-sky-300 focus:outline-none"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Scheduled Date</label>
                    <input
                      type="datetime-local"
                      value={bookingForm.scheduled_at}
                      onChange={(e) => setBookingForm({ ...bookingForm, scheduled_at: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-4 py-2 focus:border-sky-300 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={bookingLoading}
                    className="flex-1 rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-600 disabled:opacity-50"
                  >
                    {bookingLoading ? 'Creating...' : 'Create Job Request'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowBookingForm(false)
                      setSelectedWorker(null)
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

        {/* Worker Applications Modal */}
        {showApplicationsModal && selectedJobRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowApplicationsModal(false)}>
            <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Applications for "{selectedJobRequest.title}"</h2>
                  <p className="text-sm text-slate-500 mt-1">{selectedJobRequest.applications?.length || 0} worker(s) applied</p>
                </div>
                <button
                  onClick={() => {
                    setShowApplicationsModal(false)
                    setSelectedJobRequest(null)
                  }}
                  className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                {selectedJobRequest.applications && selectedJobRequest.applications.length > 0 ? (
                  selectedJobRequest.applications.map((application) => (
                    <div key={application.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-slate-900">{application.worker?.name || 'Unknown Worker'}</h3>
                            <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                              application.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' :
                              application.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-sky-100 text-sky-700'
                            }`}>
                              {application.status}
                            </span>
                          </div>
                          {application.worker?.email && (
                            <p className="text-sm text-slate-600">Email: {application.worker.email}</p>
                          )}
                          {application.worker?.phone && (
                            <p className="text-sm text-slate-600">Phone: {application.worker.phone}</p>
                          )}
                          {application.worker?.services && application.worker.services.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {application.worker.services.map((service) => (
                                <span key={service.id} className="rounded-full bg-sky-100 px-2 py-1 text-xs font-semibold text-sky-700">
                                  {service.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          {application.proposed_price && (
                            <p className="text-lg font-bold text-slate-900">${parseFloat(application.proposed_price).toFixed(2)}</p>
                          )}
                        </div>
                      </div>
                      {application.message && (
                        <p className="text-sm text-slate-700 mb-3 mt-2">{application.message}</p>
                      )}
                      {application.status === 'pending' && (
                        <button
                          onClick={() => handleAcceptApplication(application.id)}
                          className="w-full rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-600"
                        >
                          Accept This Worker
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-500">No applications yet</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Urgent Help Modal */}
        {showUrgentModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowUrgentModal(false)}
          >
            <div
              className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Urgent Help</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {userLocation?.address
                      ? `Your location: ${userLocation.address}`
                      : userLocation
                      ? `Your coordinates: ${userLocation.latitude.toFixed(3)}, ${userLocation.longitude.toFixed(3)}`
                      : 'Looking up your location and nearby workers...'}
                  </p>
                </div>
                <button
                  onClick={() => setShowUrgentModal(false)}
                  className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              {urgentLoading ? (
                <div className="text-center py-6 text-slate-500 text-sm">Finding nearby workers...</div>
              ) : (() => {
                const displayedUrgent =
                  urgentWorkers.length > 0 ? urgentWorkers : workers.slice(0, 3)

                if (!displayedUrgent || displayedUrgent.length === 0) {
                  return (
                    <div className="text-center py-6 text-slate-500 text-sm">
                      No workers available right now. Please try again later.
                    </div>
                  )
                }

                return (
                  <div className="space-y-3">
                    {displayedUrgent.slice(0, 5).map((worker) => (
                      <div
                        key={worker.id}
                        className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{worker.name || 'Unknown'}</p>
                          <p className="text-xs text-slate-500">
                            {worker.services?.slice(0, 2).map((s) => s.name).join(', ') || 'Worker'}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setShowUrgentModal(false)
                            openWorkerProfile(worker)
                          }}
                          className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-600"
                        >
                          Request This Worker
                        </button>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default DashboardUser
