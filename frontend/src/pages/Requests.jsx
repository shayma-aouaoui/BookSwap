import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'

const formatDate = (dateString) => {
  if (!dateString) return null
  return new Date(dateString).toLocaleDateString()
}

const isOverdue = (dueDate) => {
  if (!dueDate) return false
  const due = new Date(dueDate)
  const now = new Date()
  return now > due
}

const daysUntilDue = (dueDate) => {
  if (!dueDate) return null
  const due = new Date(dueDate)
  const now = new Date()
  const diffTime = due - now
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

const Requests = () => {
  const { user } = useAuth()
  const [requestsForMyBooks, setRequestsForMyBooks] = useState([])
  const [myRequests, setMyRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('received')

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      const [forMyBooks, myReqs] = await Promise.all([
        axios.get('/api/requests/my-books'),
        axios.get('/api/requests/my-requests')
      ])
      setRequestsForMyBooks(forMyBooks.data)
      setMyRequests(myReqs.data)
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (requestId, status) => {
    try {
      await axios.put(`/api/requests/${requestId}/status`, { status })
      fetchRequests()
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update request')
    }
  }

  const handleComplete = async (requestId) => {
    try {
      await axios.put(`/api/requests/${requestId}/complete`)
      fetchRequests()
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to complete request')
    }
  }

  const handleReturn = async (requestId) => {
    try {
      await axios.put(`/api/requests/${requestId}/return`)
      alert('Book marked as returned!')
      fetchRequests()
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to mark book as returned')
    }
  }

  if (loading) return <div className="text-center py-12">Loading...</div>

  const requestsToShow = activeTab === 'received' ? requestsForMyBooks : myRequests

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Book Requests</h1>

      <div className="flex space-x-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('received')}
          className={`px-4 py-2 font-semibold ${
            activeTab === 'received'
              ? 'border-b-2 border-brand-primary text-brand-primary'
              : 'text-gray-600'
          }`}
        >
          Requests for My Books ({requestsForMyBooks.length})
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`px-4 py-2 font-semibold ${
            activeTab === 'sent'
              ? 'border-b-2 border-brand-primary text-brand-primary'
              : 'text-gray-600'
          }`}
        >
          My Requests ({myRequests.length})
        </button>
      </div>

      {requestsToShow.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No {activeTab === 'received' ? 'received' : 'sent'} requests yet.
        </div>
      ) : (
        <div className="space-y-4">
          {requestsToShow.map((request) => (
            <div key={request.id} className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <Link to={`/books/${request.book_id}`}>
                    <h3 className="text-xl font-bold text-gray-900 hover:text-brand-primary">
                      {request.title}
                    </h3>
                  </Link>
                  <p className="text-gray-600">by {request.author}</p>
                  {activeTab === 'received' && (
                    <p className="mt-2">
                      <span className="font-semibold">Requested by:</span>{' '}
                      {request.receiver_name}
                      {request.receiver_location && ` (${request.receiver_location})`}
                    </p>
                  )}
                  {activeTab === 'sent' && (
                    <p className="mt-2">
                      <span className="font-semibold">Giver:</span> {request.giver_name}
                      {request.giver_location && ` (${request.giver_location})`}
                    </p>
                  )}
                  {request.message && (
                    <p className="mt-2 text-gray-700">"{request.message}"</p>
                  )}
                  {request.borrowed_at && (
                    <p className="mt-2">
                      <span className="font-semibold">Borrowed:</span>{' '}
                      {formatDate(request.borrowed_at)}
                    </p>
                  )}
                  {request.due_date && (
                    <p className="mt-1">
                      <span className="font-semibold">Due Date:</span>{' '}
                      <span className={isOverdue(request.due_date) ? 'text-red-600 font-bold' : 'text-gray-700'}>
                        {formatDate(request.due_date)}
                        {isOverdue(request.due_date) && !request.returned_at && ' (OVERDUE!)'}
                        {!isOverdue(request.due_date) && !request.returned_at && ` (${daysUntilDue(request.due_date)} days left)`}
                      </span>
                    </p>
                  )}
                  {request.returned_at && (
                    <p className="mt-1">
                      <span className="font-semibold">Returned:</span>{' '}
                      <span className="text-green-600">{formatDate(request.returned_at)}</span>
                    </p>
                  )}
                  <p className="mt-2">
                    Status:{' '}
                    <span className={`px-2 py-1 rounded ${
                      request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      request.status === 'accepted' ? 'bg-green-100 text-green-800' :
                      request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      request.status === 'returned' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {request.status}
                    </span>
                  </p>
                </div>
                {activeTab === 'received' && request.status === 'pending' && (
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleStatusUpdate(request.id, 'accepted')}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(request.id, 'rejected')}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </div>
                )}
                {activeTab === 'received' && request.status === 'accepted' && (
                  <>
                    <button
                      onClick={() => handleReturn(request.id)}
                      className="ml-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      Mark as Returned
                    </button>
                    <button
                      onClick={() => handleComplete(request.id)}
                      className="ml-2 bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-brand-secondary"
                    >
                      Mark as Completed
                    </button>
                  </>
                )}
                {activeTab === 'sent' && request.status === 'accepted' && request.due_date && isOverdue(request.due_date) && !request.returned_at && (
                  <div className="ml-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg">
                    ⚠️ Book is overdue! Please return it.
                  </div>
                )}
                {(request.status === 'accepted' || request.status === 'completed' || request.status === 'returned') && (
                  <Link
                    to={`/messages/${request.id}`}
                    className="ml-4 bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-brand-secondary"
                  >
                    Messages
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Requests


