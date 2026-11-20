import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'

const BookDetail = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [book, setBook] = useState(null)
  const [summaries, setSummaries] = useState([])
  const [loading, setLoading] = useState(true)
  const [requestMessage, setRequestMessage] = useState('')
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [showSummaryForm, setShowSummaryForm] = useState(false)
  const [summaryForm, setSummaryForm] = useState({
    title: '',
    summary: '',
    personal_insight: '',
    recommendation: ''
  })

  useEffect(() => {
    fetchBook()
    fetchSummaries()
  }, [id])

  const fetchBook = async () => {
    try {
      const response = await axios.get(`/api/books/${id}`)
      setBook(response.data)
    } catch (error) {
      console.error('Error fetching book:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSummaries = async () => {
    try {
      const response = await axios.get(`/api/summaries/book/${id}`)
      setSummaries(response.data)
    } catch (error) {
      console.error('Error fetching summaries:', error)
    }
  }

  const handleRequest = async (e) => {
    e.preventDefault()
    try {
      await axios.post('/api/requests', {
        book_id: id,
        message: requestMessage
      })
      alert('Request sent successfully!')
      setShowRequestForm(false)
      setRequestMessage('')
      navigate('/requests')
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to send request')
    }
  }

  const handleSummarySubmit = async (e) => {
    e.preventDefault()
    try {
      await axios.post('/api/summaries', {
        book_id: id,
        ...summaryForm
      })
      alert('Summary added successfully!')
      setShowSummaryForm(false)
      setSummaryForm({ title: '', summary: '', personal_insight: '', recommendation: '' })
      fetchSummaries()
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to add summary')
    }
  }

  const addToReadingList = async (listType) => {
    try {
      await axios.post('/api/lists', {
        book_id: id,
        list_type: listType
      })
      alert(`Added to ${listType} list!`)
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to add to list')
    }
  }

  const handleReport = async () => {
    const reportType = prompt('Report type (e.g., "inappropriate content", "spam"):')
    if (!reportType) return

    const description = prompt('Please describe the issue:')
    if (!description) return

    try {
      await axios.post('/api/reports', {
        reported_book_id: id,
        reported_user_id: book.giver_id,
        report_type: reportType,
        description: description
      })
      alert('Report submitted. Thank you for helping keep BookSwap safe!')
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to submit report')
    }
  }

  if (loading) return <div className="text-center py-12">Loading...</div>
  if (!book) return <div className="text-center py-12">Book not found</div>

  const isOwner = user && book.giver_id === user.id

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Book Info */}
        <div>
          {book.image_urls && book.image_urls.length > 0 ? (
            <img
              src={book.image_urls[0]}
              alt={book.title}
              className="w-full rounded-lg shadow-lg mb-4"
            />
          ) : (
            <div className="w-full h-96 bg-gray-200 flex items-center justify-center text-6xl rounded-lg mb-4">
              📚
            </div>
          )}

          {user && !isOwner && book.status === 'available' && (
            <div className="space-y-2">
              <button
                onClick={() => setShowRequestForm(!showRequestForm)}
                className="w-full bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-brand-secondary"
              >
                Request This Book
              </button>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => addToReadingList('reading')}
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  Reading List
                </button>
                <button
                  onClick={() => addToReadingList('wishlist')}
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  Wishlist
                </button>
                <button
                  onClick={() => addToReadingList('completed')}
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  Completed
                </button>
              </div>
            </div>
          )}
          {user && (
            <button
              onClick={handleReport}
              className="mt-2 w-full bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200"
            >
              Report
            </button>
          )}
        </div>

        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{book.title}</h1>
          <p className="text-xl text-gray-600 mb-4">by {book.author}</p>

          <div className="space-y-4 mb-6">
            {book.category && (
              <div>
                <span className="font-semibold">Category:</span> {book.category}
              </div>
            )}
            <div>
              <span className="font-semibold">Condition:</span>{' '}
              <span className="bg-brand-light text-brand-primary px-2 py-1 rounded">
                {book.condition}
              </span>
            </div>
            <div>
              <span className="font-semibold">Status:</span>{' '}
              <span className={`px-2 py-1 rounded ${
                book.status === 'available' ? 'bg-green-100 text-green-800' :
                book.status === 'reserved' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {book.status}
              </span>
            </div>
            {book.location && (
              <div>
                <span className="font-semibold">Location:</span> {book.location}
              </div>
            )}
            <div>
              <span className="font-semibold">Giver:</span> {book.giver_name}
            </div>
            {book.description && (
              <div>
                <span className="font-semibold">Description:</span>
                <p className="mt-1 text-gray-700">{book.description}</p>
              </div>
            )}
          </div>

          {showRequestForm && (
            <form onSubmit={handleRequest} className="mb-6 p-4 bg-gray-50 rounded-lg">
              <textarea
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-2"
                placeholder="Optional message to the giver..."
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-brand-secondary"
                >
                  Send Request
                </button>
                <button
                  type="button"
                  onClick={() => setShowRequestForm(false)}
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Community Knowledge Layer - Summaries */}
      <div className="mt-12">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Community Summaries</h2>
          {user && (
            <button
              onClick={() => setShowSummaryForm(!showSummaryForm)}
              className="bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-brand-secondary"
            >
              {showSummaryForm ? 'Cancel' : 'Add Summary'}
            </button>
          )}
        </div>

        {showSummaryForm && (
          <form onSubmit={handleSummarySubmit} className="mb-6 p-6 bg-white rounded-lg shadow-md">
            <input
              type="text"
              placeholder="Summary title (optional)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
              value={summaryForm.title}
              onChange={(e) => setSummaryForm({ ...summaryForm, title: e.target.value })}
            />
            <textarea
              placeholder="Summary *"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
              value={summaryForm.summary}
              onChange={(e) => setSummaryForm({ ...summaryForm, summary: e.target.value })}
              rows={4}
              required
            />
            <textarea
              placeholder="Personal insight (optional)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
              value={summaryForm.personal_insight}
              onChange={(e) => setSummaryForm({ ...summaryForm, personal_insight: e.target.value })}
              rows={3}
            />
            <textarea
              placeholder="Recommendation (optional)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
              value={summaryForm.recommendation}
              onChange={(e) => setSummaryForm({ ...summaryForm, recommendation: e.target.value })}
              rows={2}
            />
            <button
              type="submit"
              className="bg-brand-primary text-white px-6 py-2 rounded-lg hover:bg-brand-secondary"
            >
              Submit Summary
            </button>
          </form>
        )}

        {summaries.length === 0 ? (
          <p className="text-gray-500">No summaries yet. Be the first to add one!</p>
        ) : (
          <div className="space-y-4">
            {summaries.map((summary) => (
              <div key={summary.id} className="bg-white p-6 rounded-lg shadow-md">
                {summary.title && (
                  <h3 className="text-xl font-bold mb-2">{summary.title}</h3>
                )}
                <p className="text-gray-600 mb-2">{summary.summary}</p>
                {summary.personal_insight && (
                  <div className="mb-2">
                    <span className="font-semibold">Insight:</span>
                    <p className="text-gray-700">{summary.personal_insight}</p>
                  </div>
                )}
                {summary.recommendation && (
                  <div>
                    <span className="font-semibold">Recommendation:</span>
                    <p className="text-gray-700">{summary.recommendation}</p>
                  </div>
                )}
                <p className="text-sm text-gray-500 mt-2">
                  By {summary.author_name} • {new Date(summary.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default BookDetail

