import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'

const MyBooks = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    category: '',
    condition: 'good',
    description: '',
    location: '',
    images: null
  })

  useEffect(() => {
    fetchMyBooks()
  }, [])

  const fetchMyBooks = async () => {
    try {
      const response = await axios.get(`/api/books/user/${user.id}`)
      setBooks(response.data)
    } catch (error) {
      console.error('Error fetching books:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const formDataToSend = new FormData()
    Object.keys(formData).forEach(key => {
      if (key === 'images' && formData[key]) {
        Array.from(formData[key]).forEach(file => {
          formDataToSend.append('images', file)
        })
      } else if (key !== 'images') {
        formDataToSend.append(key, formData[key])
      }
    })

    try {
      await axios.post('/api/books', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setShowAddForm(false)
      setFormData({
        title: '',
        author: '',
        category: '',
        condition: 'good',
        description: '',
        location: '',
        images: null
      })
      fetchMyBooks()
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to add book')
    }
  }

  const handleDelete = async (bookId) => {
    if (!window.confirm('Are you sure you want to delete this book?')) return

    try {
      await axios.delete(`/api/books/${bookId}`)
      fetchMyBooks()
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete book')
    }
  }

  if (loading) return <div className="text-center py-12">Loading...</div>

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Books</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-brand-secondary"
        >
          {showAddForm ? 'Cancel' : 'Add Book'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Author *</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Condition *</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                required
              >
                <option value="new">New</option>
                <option value="like_new">Like New</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Images</label>
              <input
                type="file"
                multiple
                accept="image/*"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                onChange={(e) => setFormData({ ...formData, images: e.target.files })}
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <button
            type="submit"
            className="mt-4 bg-brand-primary text-white px-6 py-2 rounded-lg hover:bg-brand-secondary"
          >
            Add Book
          </button>
        </form>
      )}

      {books.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          You haven't added any books yet. Click "Add Book" to get started!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {books.map((book) => (
            <div key={book.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <Link to={`/books/${book.id}`}>
                {book.image_urls && book.image_urls.length > 0 ? (
                  <img
                    src={book.image_urls[0]}
                    alt={book.title}
                    className="w-full h-64 object-cover"
                  />
                ) : (
                  <div className="w-full h-64 bg-gray-200 flex items-center justify-center text-4xl">
                    📚
                  </div>
                )}
              </Link>
              <div className="p-4">
                <Link to={`/books/${book.id}`}>
                  <h3 className="font-bold text-lg mb-1">{book.title}</h3>
                  <p className="text-gray-600 text-sm mb-2">by {book.author}</p>
                </Link>
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-1 rounded text-sm ${
                    book.status === 'available' ? 'bg-green-100 text-green-800' :
                    book.status === 'reserved' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {book.status}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(book.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MyBooks



