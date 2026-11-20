import { useState, useEffect } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Penalties = () => {
  const { user } = useAuth()
  const [penalties, setPenalties] = useState([])
  const [summary, setSummary] = useState(null)
  const [overdueBooks, setOverdueBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('penalties')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [penaltiesRes, summaryRes, overdueRes] = await Promise.all([
        axios.get('/api/penalties/me'),
        axios.get('/api/penalties/summary'),
        axios.get('/api/penalties/check-overdue')
      ])
      setPenalties(penaltiesRes.data)
      setSummary(summaryRes.data)
      setOverdueBooks(overdueRes.data)
    } catch (error) {
      console.error('Error fetching penalties:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCalculatePenalty = async (requestId) => {
    try {
      await axios.post(`/api/penalties/calculate/${requestId}`)
      alert('Penalty calculated successfully!')
      fetchData()
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to calculate penalty')
    }
  }

  const handlePayPenalty = async (penaltyId) => {
    if (!window.confirm('Are you sure you want to pay this penalty?')) return

    try {
      await axios.put(`/api/penalties/${penaltyId}/pay`)
      alert('Penalty paid successfully!')
      fetchData()
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to pay penalty')
    }
  }

  if (loading) return <div className="text-center py-12">Loading...</div>

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Penalties & Overdue Books</h1>

      {/* Summary Card */}
      {summary && (
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-gray-600 text-sm mb-2">Total Penalties</h3>
            <p className="text-3xl font-bold text-red-600">${summary.total_penalty_amount.toFixed(2)}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-gray-600 text-sm mb-2">Pending Penalties</h3>
            <p className="text-3xl font-bold text-orange-600">${summary.pending_penalty_amount.toFixed(2)}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-gray-600 text-sm mb-2">Total Paid</h3>
            <p className="text-3xl font-bold text-green-600">${summary.total_penalties_paid.toFixed(2)}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('penalties')}
          className={`px-4 py-2 font-semibold ${
            activeTab === 'penalties'
              ? 'border-b-2 border-brand-primary text-brand-primary'
              : 'text-gray-600'
          }`}
        >
          My Penalties ({penalties.length})
        </button>
        <button
          onClick={() => setActiveTab('overdue')}
          className={`px-4 py-2 font-semibold ${
            activeTab === 'overdue'
              ? 'border-b-2 border-brand-primary text-brand-primary'
              : 'text-gray-600'
          }`}
        >
          Overdue Books ({overdueBooks.length})
        </button>
      </div>

      {/* Penalties Tab */}
      {activeTab === 'penalties' && (
        <div className="space-y-4">
          {penalties.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No penalties yet.</div>
          ) : (
            penalties.map((penalty) => (
              <div key={penalty.id} className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <Link to={`/books/${penalty.book_id}`}>
                      <h3 className="text-xl font-bold text-gray-900 hover:text-brand-primary">
                        {penalty.book_title}
                      </h3>
                    </Link>
                    <p className="text-gray-600">by {penalty.book_author}</p>
                    <div className="mt-2 space-y-1">
                      <p>
                        <span className="font-semibold">Amount:</span>{' '}
                        <span className="text-red-600 font-bold">${parseFloat(penalty.penalty_amount).toFixed(2)}</span>
                      </p>
                      <p>
                        <span className="font-semibold">Type:</span> {penalty.penalty_type}
                      </p>
                      {penalty.days_overdue && (
                        <p>
                          <span className="font-semibold">Days Overdue:</span> {penalty.days_overdue}
                        </p>
                      )}
                      <p>
                        <span className="font-semibold">Status:</span>{' '}
                        <span className={`px-2 py-1 rounded text-sm ${
                          penalty.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          penalty.status === 'paid' ? 'bg-green-100 text-green-800' :
                          penalty.status === 'waived' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {penalty.status}
                        </span>
                      </p>
                      {penalty.description && (
                        <p className="text-gray-600">{penalty.description}</p>
                      )}
                      <p className="text-sm text-gray-500">
                        Created: {new Date(penalty.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {penalty.status === 'pending' && (
                    <button
                      onClick={() => handlePayPenalty(penalty.id)}
                      className="ml-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                    >
                      Pay Penalty
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Overdue Books Tab */}
      {activeTab === 'overdue' && (
        <div className="space-y-4">
          {overdueBooks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No overdue books. Great job!</div>
          ) : (
            overdueBooks.map((book) => (
              <div key={book.id} className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <Link to={`/books/${book.book_id}`}>
                      <h3 className="text-xl font-bold text-gray-900 hover:text-brand-primary">
                        {book.title}
                      </h3>
                    </Link>
                    <p className="text-gray-600">by {book.author}</p>
                    <div className="mt-2 space-y-1">
                      <p>
                        <span className="font-semibold">Due Date:</span>{' '}
                        <span className="text-red-600">
                          {new Date(book.due_date).toLocaleDateString()}
                        </span>
                      </p>
                      {book.penaltyInfo && (
                        <>
                          <p>
                            <span className="font-semibold">Days Overdue:</span>{' '}
                            <span className="text-red-600 font-bold">
                              {book.penaltyInfo.daysOverdue} days
                            </span>
                          </p>
                          <p>
                            <span className="font-semibold">Estimated Penalty:</span>{' '}
                            <span className="text-red-600 font-bold">
                              ${book.penaltyInfo.penaltyAmount.toFixed(2)}
                            </span>
                          </p>
                        </>
                      )}
                      <p className="text-sm text-gray-500">
                        Giver: {book.giver_name}
                      </p>
                    </div>
                  </div>
                  {book.penaltyInfo && !book.penaltyInfo.calculated && (
                    <button
                      onClick={() => handleCalculatePenalty(book.id)}
                      className="ml-4 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
                    >
                      Calculate Penalty
                    </button>
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

export default Penalties


