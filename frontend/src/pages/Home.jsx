import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Home = () => {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-lighter via-brand-light to-orange-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            Welcome to <span className="text-brand-primary">BookSwap</span>
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto mb-8">
            Share Knowledge, Exchange Stories. Join our community of book lovers in Tunisia
            to exchange, donate, or borrow books sustainably.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!user ? (
              <>
                <Link
                  to="/register"
                  className="bg-brand-primary text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-brand-secondary transition shadow-lg"
                >
                  Get Started
                </Link>
                <Link
                  to="/books"
                  className="bg-white text-brand-primary px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-50 transition shadow-lg border-2 border-brand-primary"
                >
                  Browse Books
                </Link>
              </>
            ) : (
              <Link
                to="/books"
                className="bg-brand-primary text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-brand-secondary transition shadow-lg"
              >
                Browse Books
              </Link>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="text-4xl mb-4">📖</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Exchange Books</h3>
            <p className="text-gray-600">
              List your books and connect with others who want to read them. Simple, sustainable, and free.
            </p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Discover New Reads</h3>
            <p className="text-gray-600">
              Search by title, author, category, or location. Find books near you from trusted community members.
            </p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Community Knowledge</h3>
            <p className="text-gray-600">
              Share book summaries and insights. Build a knowledge layer around every book.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home



