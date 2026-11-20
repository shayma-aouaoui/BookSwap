import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex items-center space-x-2 px-3 py-2 text-xl font-bold text-brand-primary">
              <span>📚</span>
              <span>BookSwap</span>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link to="/books" className="inline-flex items-center px-1 pt-1 text-gray-700 hover:text-brand-primary">
                Browse Books
              </Link>
              <Link to="/activity" className="inline-flex items-center px-1 pt-1 text-gray-700 hover:text-brand-primary">
                Activity
              </Link>
              {user && (
                <>
                  <Link to="/my-books" className="inline-flex items-center px-1 pt-1 text-gray-700 hover:text-brand-primary">
                    My Books
                  </Link>
                  <Link to="/requests" className="inline-flex items-center px-1 pt-1 text-gray-700 hover:text-brand-primary">
                    Requests
                  </Link>
                  <Link to="/penalties" className="inline-flex items-center px-1 pt-1 text-gray-700 hover:text-brand-primary">
                    Penalties
                  </Link>
                  {user.is_admin && (
                    <Link to="/admin" className="inline-flex items-center px-1 pt-1 text-gray-700 hover:text-brand-primary">
                      Admin
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link to="/profile" className="text-gray-700 hover:text-brand-primary">
                  {user.full_name}
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-brand-secondary transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:text-brand-primary">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-brand-secondary transition"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar


