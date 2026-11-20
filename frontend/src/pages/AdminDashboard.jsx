import { useState, useEffect } from 'react'
import axios from 'axios'

const AdminDashboard = () => {
  const [reports, setReports] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('analytics')

  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAnalytics()
    } else {
      fetchReports()
    }
  }, [activeTab])

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get('/api/admin/analytics')
      setAnalytics(response.data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching analytics:', error)
      setLoading(false)
    }
  }

  const fetchReports = async () => {
    try {
      const response = await axios.get('/api/admin/reports')
      setReports(response.data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching reports:', error)
      setLoading(false)
    }
  }

  const handleReportUpdate = async (reportId, status, adminNotes) => {
    try {
      await axios.put(`/api/admin/reports/${reportId}`, {
        status,
        admin_notes: adminNotes
      })
      fetchReports()
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update report')
    }
  }

  if (loading) return <div className="text-center py-12">Loading...</div>

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

      <div className="flex space-x-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 font-semibold ${
            activeTab === 'analytics'
              ? 'border-b-2 border-brand-primary text-brand-primary'
              : 'text-gray-600'
          }`}
        >
          Analytics
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 font-semibold ${
            activeTab === 'reports'
              ? 'border-b-2 border-brand-primary text-brand-primary'
              : 'text-gray-600'
          }`}
        >
          Reports ({reports.length})
        </button>
      </div>

      {activeTab === 'analytics' && analytics && (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-gray-600 text-sm mb-2">Total Users</h3>
            <p className="text-3xl font-bold text-brand-primary">{analytics.total_users}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-gray-600 text-sm mb-2">Total Books</h3>
            <p className="text-3xl font-bold text-brand-primary">{analytics.total_books}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-gray-600 text-sm mb-2">Total Requests</h3>
            <p className="text-3xl font-bold text-brand-primary">{analytics.total_requests}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-gray-600 text-sm mb-2">Completed Exchanges</h3>
            <p className="text-3xl font-bold text-brand-primary">{analytics.total_exchanges}</p>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No reports yet.</div>
          ) : (
            reports.map((report) => (
              <div key={report.id} className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-semibold">Type: {report.report_type}</p>
                    <p className="mt-2">{report.description}</p>
                    {report.reporter_name && (
                      <p className="mt-2 text-sm text-gray-600">Reported by: {report.reporter_name}</p>
                    )}
                    {report.reported_user_name && (
                      <p className="text-sm text-gray-600">Reported user: {report.reported_user_name}</p>
                    )}
                    {report.reported_book_title && (
                      <p className="text-sm text-gray-600">Reported book: {report.reported_book_title}</p>
                    )}
                    <p className="mt-2">
                      Status:{' '}
                      <span className={`px-2 py-1 rounded ${
                        report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                        report.status === 'dismissed' ? 'bg-gray-100 text-gray-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {report.status}
                      </span>
                    </p>
                    {report.admin_notes && (
                      <p className="mt-2 text-sm text-gray-700">Admin notes: {report.admin_notes}</p>
                    )}
                  </div>
                  {report.status === 'pending' && (
                    <div className="flex flex-col space-y-2 ml-4">
                      <button
                        onClick={() => {
                          const notes = prompt('Admin notes (optional):')
                          handleReportUpdate(report.id, 'resolved', notes)
                        }}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
                      >
                        Resolve
                      </button>
                      <button
                        onClick={() => {
                          const notes = prompt('Admin notes (optional):')
                          handleReportUpdate(report.id, 'dismissed', notes)
                        }}
                        className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 text-sm"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default AdminDashboard



