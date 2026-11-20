import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'

const Profile = () => {
  const { user: authUser, fetchUser } = useAuth()
  const [user, setUser] = useState(null)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    location: '',
    interests: '',
    bio: ''
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await axios.get('/api/users/me')
      setUser(response.data)
      setFormData({
        full_name: response.data.full_name || '',
        location: response.data.location || '',
        interests: Array.isArray(response.data.interests) ? response.data.interests.join(', ') : '',
        bio: response.data.bio || ''
      })
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const interestsArray = formData.interests
        ? formData.interests.split(',').map(i => i.trim()).filter(i => i)
        : []
      
      await axios.put('/api/users/me', {
        ...formData,
        interests: interestsArray
      })
      await fetchUser()
      await fetchProfile()
      setEditing(false)
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update profile')
    }
  }

  if (!user) return <div className="text-center py-12">Loading...</div>

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <button
            onClick={() => setEditing(!editing)}
            className="bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-brand-secondary"
          >
            {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {editing ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-brand-primary focus:border-brand-primary"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-brand-primary focus:border-brand-primary"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interests (comma-separated)
              </label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-brand-primary focus:border-brand-primary"
                value={formData.interests}
                onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                placeholder="Fiction, Science, History"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              <textarea
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-brand-primary focus:border-brand-primary"
                rows={4}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              />
            </div>

            <button
              type="submit"
              className="bg-brand-primary text-white px-6 py-2 rounded-lg hover:bg-brand-secondary"
            >
              Save Changes
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <span className="text-gray-600">Email:</span>
              <p className="text-lg font-semibold">{user.email}</p>
            </div>
            <div>
              <span className="text-gray-600">Name:</span>
              <p className="text-lg font-semibold">{user.full_name}</p>
            </div>
            <div>
              <span className="text-gray-600">User Type:</span>
              <p className="text-lg font-semibold capitalize">{user.user_type}</p>
            </div>
            {user.location && (
              <div>
                <span className="text-gray-600">Location:</span>
                <p className="text-lg">{user.location}</p>
              </div>
            )}
            {user.interests && user.interests.length > 0 && (
              <div>
                <span className="text-gray-600">Interests:</span>
                <p className="text-lg">{Array.isArray(user.interests) ? user.interests.join(', ') : user.interests}</p>
              </div>
            )}
            {user.bio && (
              <div>
                <span className="text-gray-600">Bio:</span>
                <p className="text-lg">{user.bio}</p>
              </div>
            )}
            {user.avg_rating && (
              <div>
                <span className="text-gray-600">Rating:</span>
                <p className="text-lg">
                  {parseFloat(user.avg_rating).toFixed(1)} / 5.0 ({user.rating_count} ratings)
                </p>
              </div>
            )}
            {(user.total_penalty_amount !== undefined && parseFloat(user.total_penalty_amount) > 0) && (
              <div>
                <span className="text-gray-600">Total Penalties:</span>
                <p className="text-lg text-red-600 font-semibold">
                  ${parseFloat(user.total_penalty_amount).toFixed(2)}
                </p>
                <Link to="/penalties" className="text-brand-primary hover:underline text-sm">
                  View penalties
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Profile


