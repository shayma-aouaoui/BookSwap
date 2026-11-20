# BookSwap - Community Book Exchange Platform

BookSwap is a community-driven web application designed for students and book lovers in Tunisia to exchange, donate, or borrow books. The platform emphasizes sustainability, accessibility, and trust by avoiding advertisement-driven monetization and focusing on meaningful peer-to-peer interactions.

## Features

- **User Authentication**: Secure registration and login with JWT
- **Book Management**: List, search, and manage books with images
- **Request System**: Request books, accept/reject requests, and track exchange status
- **In-App Messaging**: Communicate with other users about book exchanges
- **Community Knowledge Layer**: Users can add book summaries and insights
- **Ratings & Reviews**: Rate users after exchanges
- **Reading Lists**: Organize books into reading lists, wishlists, and completed lists
- **Activity Feed**: See newly added books in real-time
- **Admin Dashboard**: Content moderation and analytics

## Technology Stack

- **Frontend**: React 18 + Tailwind CSS + Vite
- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/shayma-aouaoui/BookSwap.git
cd BookSwap
```

### 2. Database Setup

1. Create a PostgreSQL database:

```sql
CREATE DATABASE bookswap;
```

2. Update database credentials in `backend/.env` (see step 3)

3. Initialize the database schema:

```bash
cd backend
npm install
npm run init-db
```

### 3. Backend Setup

1. Navigate to the backend directory:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the `backend` directory:

```env
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bookswap
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d

# File Upload
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
```

4. Create the uploads directory:

```bash
mkdir uploads
```

5. Start the backend server:

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The backend API will be running on `http://localhost:5000`

### 4. Frontend Setup

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

The frontend will be running on `http://localhost:3000` and will proxy API requests to the backend.

### 5. Build for Production

**Backend:**

No build step needed - just run `npm start`

**Frontend:**

```bash
cd frontend
npm run build
```

The built files will be in the `frontend/dist` directory.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Books
- `GET /api/books` - Get all books (with filters)
- `GET /api/books/:id` - Get book by ID
- `POST /api/books` - Create a book (authenticated)
- `PUT /api/books/:id` - Update a book (authenticated, owner/admin)
- `DELETE /api/books/:id` - Delete a book (authenticated, owner/admin)
- `GET /api/books/user/:userId` - Get books by user

### Requests
- `POST /api/requests` - Create a book request (authenticated)
- `GET /api/requests/my-books` - Get requests for user's books (authenticated)
- `GET /api/requests/my-requests` - Get user's requests (authenticated)
- `PUT /api/requests/:id/status` - Update request status (authenticated)
- `PUT /api/requests/:id/complete` - Mark request as completed (authenticated)

### Messages
- `GET /api/messages/request/:requestId` - Get messages for a request (authenticated)
- `POST /api/messages` - Send a message (authenticated)
- `PUT /api/messages/request/:requestId/read` - Mark messages as read (authenticated)

### Summaries (Community Knowledge Layer)
- `GET /api/summaries/book/:bookId` - Get summaries for a book
- `POST /api/summaries` - Create/update summary (authenticated)
- `DELETE /api/summaries/:id` - Delete summary (authenticated, owner/admin)

### Ratings
- `GET /api/ratings/user/:userId` - Get ratings for a user
- `POST /api/ratings` - Create/update rating (authenticated)

### Reading Lists
- `GET /api/lists/me` - Get user's reading lists (authenticated)
- `POST /api/lists` - Add book to list (authenticated)
- `DELETE /api/lists/:bookId` - Remove book from list (authenticated)

### Reports
- `POST /api/reports` - Create a report (authenticated)

### Admin
- `GET /api/admin/reports` - Get all reports (authenticated, admin)
- `PUT /api/admin/reports/:id` - Update report status (authenticated, admin)
- `GET /api/admin/analytics` - Get analytics (authenticated, admin)

### Activity
- `GET /api/activity` - Get activity feed

## Project Structure

```
bookswap-dev/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── books.js
│   │   ├── requests.js
│   │   ├── messages.js
│   │   ├── summaries.js
│   │   ├── ratings.js
│   │   ├── lists.js
│   │   ├── reports.js
│   │   ├── admin.js
│   │   └── activity.js
│   ├── scripts/
│   │   └── init-db.js
│   ├── schema.sql
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Default Admin User

To create an admin user, you can either:

1. Manually set `is_admin = TRUE` in the database for a user
2. Add a script to create an admin user during setup

Example SQL:

```sql
UPDATE users SET is_admin = TRUE WHERE email = 'admin@bookswap.com';
```

## Environment Variables

### Backend (.env)

- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `DB_HOST` - PostgreSQL host
- `DB_PORT` - PostgreSQL port
- `DB_NAME` - Database name
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRES_IN` - Token expiration (default: 7d)
- `UPLOAD_DIR` - Directory for uploaded images
- `MAX_FILE_SIZE` - Max file size in bytes (default: 5MB)

## Security Notes

- Change `JWT_SECRET` in production
- Use environment variables for sensitive data
- Implement rate limiting in production
- Use HTTPS in production
- Regularly update dependencies

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

ISC

## Penalty System

BookSwap includes a penalty system for overdue book returns. See [PENALTY_SYSTEM.md](PENALTY_SYSTEM.md) for detailed documentation and [PENALTY_SYSTEM_SETUP.md](PENALTY_SYSTEM_SETUP.md) for setup instructions.

### Key Features:
- Automatic due date tracking (default: 14 days)
- Penalty calculation for overdue books
- Penalty payment system
- Overdue warnings and notifications
- Admin waiver functionality

## Support

For issues and questions, please open an issue on the repository.


