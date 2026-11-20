import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

const ActivityFeed = () => {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    try {
      const response = await axios.get('/api/activity')
      setActivities(response.data)
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="text-center py-12">Loading...</div>

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Activity Feed</h1>
      <p className="text-gray-600 mb-6">Latest books added to the platform</p>

      {activities.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No recent activity.</div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            activity.book && (
              <div key={activity.id} className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-start space-x-4">
                  {activity.book.image_urls && activity.book.image_urls.length > 0 ? (
                    <img
                      src={activity.book.image_urls[0]}
                      alt={activity.book.title}
                      className="w-24 h-32 object-cover rounded"
                    />
                  ) : (
                    <div className="w-24 h-32 bg-gray-200 flex items-center justify-center text-2xl rounded">
                      📚
                    </div>
                  )}
                  <div className="flex-1">
                    <Link to={`/books/${activity.book.id}`}>
                      <h3 className="text-xl font-bold text-gray-900 hover:text-brand-primary">
                        {activity.book.title}
                      </h3>
                    </Link>
                    <p className="text-gray-600">by {activity.book.author}</p>
                    {activity.book.category && (
                      <span className="inline-block mt-2 bg-brand-light text-brand-primary px-2 py-1 rounded text-sm">
                        {activity.book.category}
                      </span>
                    )}
                    <p className="text-sm text-gray-500 mt-2">
                      Added by {activity.user_name || 'Unknown'} • {new Date(activity.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  )
}

export default ActivityFeed



