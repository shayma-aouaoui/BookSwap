import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

const Books = () => {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    condition: '',
    location: ''
  })

  useEffect(() => {
    fetchBooks()
  }, [filters])

  const fetchBooks = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.search) params.append('search', filters.search)
      if (filters.category) params.append('category', filters.category)
      if (filters.condition) params.append('condition', filters.condition)
      if (filters.location) params.append('location', filters.location)

      const response = await axios.get(`/api/books?${params.toString()}`)
      setBooks(response.data)
    } catch (error) {
      console.error('Error fetching books:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Browse Books</h1>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search by title or author..."
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-brand-primary focus:border-brand-primary"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
          <input
            type="text"
            placeholder="Category"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-brand-primary focus:border-brand-primary"
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
          />
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-brand-primary focus:border-brand-primary"
            value={filters.condition}
            onChange={(e) => handleFilterChange('condition', e.target.value)}
          >
            <option value="">All Conditions</option>
            <option value="new">New</option>
            <option value="like_new">Like New</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="poor">Poor</option>
          </select>
          <input
            type="text"
            placeholder="Location"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-brand-primary focus:border-brand-primary"
            value={filters.location}
            onChange={(e) => handleFilterChange('location', e.target.value)}
          />
        </div>
      </div>

      {/* Books Grid */}
      {loading ? (
        <div className="text-center py-12">Loading books...</div>
      ) : books.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No books found. Try adjusting your filters.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {books.map((book) => (
            <Link
              key={book.id}
              to={`/books/${book.id}`}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
            >
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
              <div className="p-4">
                <h3 className="font-bold text-lg mb-1 truncate">{book.title}</h3>
                <p className="text-gray-600 text-sm mb-2">by {book.author}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="bg-brand-light text-brand-primary px-2 py-1 rounded">
                    {book.condition}
                  </span>
                  {book.location && (
                    <span className="text-gray-500">{book.location}</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default Books



