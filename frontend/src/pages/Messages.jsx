import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'

const Messages = () => {
  const { requestId } = useParams()
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 3000) // Poll every 3 seconds
    return () => clearInterval(interval)
  }, [requestId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`/api/messages/request/${requestId}`)
      setMessages(response.data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching messages:', error)
      setLoading(false)
    }
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    try {
      await axios.post('/api/messages', {
        request_id: requestId,
        content: newMessage
      })
      setNewMessage('')
      fetchMessages()
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to send message')
    }
  }

  if (loading) return <div className="text-center py-12">Loading...</div>

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-md h-[600px] flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.sender_id === user.id
                      ? 'bg-brand-primary text-white'
                      : 'bg-gray-200 text-gray-900'
                  }`}
                >
                  <p className="text-sm font-semibold mb-1">{message.sender_name}</p>
                  <p>{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.sender_id === user.id ? 'text-brand-light' : 'text-gray-500'
                  }`}>
                    {new Date(message.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="p-4 border-t">
          <div className="flex space-x-2">
            <input
              type="text"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-brand-primary focus:border-brand-primary"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <button
              type="submit"
              className="bg-brand-primary text-white px-6 py-2 rounded-lg hover:bg-brand-secondary"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Messages



