import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    user_type: 'giver',
    location: '',
    interests: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const interestsArray = formData.interests
        ? formData.interests.split(',').map(i => i.trim()).filter(i => i)
        : []
      
      await register({
        ...formData,
        interests: interestsArray
      })
      navigate('/books')
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-lighter via-brand-light to-orange-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your BookSwap account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                value={formData.full_name}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password (min. 6 characters)
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                I am a:
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:border-brand-primary"
                  style={{ borderColor: formData.user_type === 'giver' ? '#b45309' : '#e5e7eb' }}>
                  <input
                    type="radio"
                    name="user_type"
                    value="giver"
                    checked={formData.user_type === 'giver'}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span>Book Giver</span>
                </label>
                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:border-brand-primary"
                  style={{ borderColor: formData.user_type === 'receiver' ? '#b45309' : '#e5e7eb' }}>
                  <input
                    type="radio"
                    name="user_type"
                    value="receiver"
                    checked={formData.user_type === 'receiver'}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span>Book Receiver</span>
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                Location (optional)
              </label>
              <input
                id="location"
                name="location"
                type="text"
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                placeholder="City, Tunisia"
                value={formData.location}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="interests" className="block text-sm font-medium text-gray-700">
                Interests (comma-separated, optional)
              </label>
              <input
                id="interests"
                name="interests"
                type="text"
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm"
                placeholder="Fiction, Science, History"
                value={formData.interests}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </button>
          </div>

          <div className="text-center">
            <Link to="/login" className="text-brand-primary hover:text-brand-secondary">
              Already have an account? Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Register



