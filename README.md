# Express + React Notes Application - Separate Deployments

A full-stack notes application with **separate frontend and backend deployments** for Vercel. The backend is built with Express.js and MongoDB, while the frontend is built with React and Vite.

## Architecture

- **Backend**: Express.js API server with MongoDB database
- **Frontend**: React SPA with Vite build system
- **Deployment**: Separate Vercel deployments for better scalability
- **Authentication**: JWT-based with role-based access control

## Features

- 🔐 User authentication with JWT tokens
- 🏢 Multi-tenant architecture (organization-based)
- 📝 Notes management (create, read, update, delete)
- 👥 Role-based access control (Admin/Member)
- 🎨 Modern React frontend with Tailwind CSS
- 📱 Responsive design
- ⚡ TypeScript throughout

## Quick Start (Development)

### Prerequisites
- Node.js 18+ 
- MongoDB Atlas account (or local MongoDB)
- Git

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd <your-project-name>
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file in backend directory:
```env
# Database
MONGODB_CONNECTION_STRING=mongodb+srv://username:password@cluster.mongodb.net/dbname

# JWT Secret (generate a secure random string)
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random

# Node Environment
NODE_ENV=development
```

Start backend:
```bash
npm run dev
# Backend runs on http://localhost:5000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create `.env` file in frontend directory:
```env
# Development - points to local backend
VITE_API_URL=http://localhost:5000/api

# Production - points to deployed backend
# VITE_API_URL=https://your-backend.vercel.app/api
```

Start frontend:
```bash
npm run dev
# Frontend runs on http://localhost:3000
```

### 4. Seed Demo Data

Visit `http://localhost:5000/api/auth/seed` or use the seed button in the app to create demo accounts:

**Demo Accounts:**
- Email: `admin@acme.test` | Password: `password` (Admin)
- Email: `user@acme.test` | Password: `password` (Member)
- Email: `admin@globex.test` | Password: `password` (Admin)
- Email: `user@globex.test` | Password: `password` (Member)

## Deployment to Vercel (Separate Apps)

### Step 1: Deploy Backend

1. **Create a new Vercel project** for the backend:
   ```bash
   cd backend
   vercel
   ```

2. **Configure environment variables** in Vercel dashboard:
   - `MONGODB_CONNECTION_STRING` - Your MongoDB connection string
   - `JWT_SECRET` - Your JWT secret key
   - `NODE_ENV` - Set to "production"

3. **Backend deployment** will be available at: `https://your-backend.vercel.app`

### Step 2: Deploy Frontend  

1. **Update frontend environment variables**:
   
   In your frontend `.env` file or Vercel environment variables:
   ```env
   VITE_API_URL=https://your-backend.vercel.app/api
   ```

2. **Create a new Vercel project** for the frontend:
   ```bash
   cd frontend
   vercel
   ```

3. **Frontend deployment** will be available at: `https://your-frontend.vercel.app`

### Step 3: Configure CORS (Important!)

Update your backend CORS configuration in `backend/src/routes.ts`:

```javascript
app.use(cors({
  origin: [
    'https://your-frontend.vercel.app',
    'http://localhost:3000', // for development
  ],
  credentials: true,
}));
```

## MongoDB Atlas Setup

1. **Create MongoDB Atlas account**: https://cloud.mongodb.com
2. **Create a new cluster** (free tier works fine)
3. **Configure Network Access**:
   - Go to Network Access → IP Access List
   - Click "Add IP Address"
   - Select "Allow Access from Anywhere" (0.0.0.0/0)
   - Or add specific Vercel IP ranges for better security
4. **Create Database User**:
   - Go to Database Access → Add New Database User
   - Create username and password
   - Grant "Read and write to any database" permissions
5. **Get Connection String**:
   - Go to Clusters → Connect → Connect your application
   - Copy the connection string
   - Replace `<password>` with your actual password

## Project Structure

```
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── middleware/     # Authentication middleware
│   │   ├── models/        # MongoDB models
│   │   ├── index.ts       # Server entry point
│   │   ├── routes.ts      # API routes
│   │   └── storage.ts     # Database operations
│   ├── shared/           # Shared types and schemas
│   ├── package.json      # Backend dependencies
│   └── vercel.json       # Backend deployment config
│
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── hooks/       # Custom hooks
│   │   ├── lib/         # API client and utilities
│   │   ├── pages/       # Page components
│   │   └── main.tsx     # App entry point
│   ├── shared/          # Shared types (copied from backend)
│   ├── package.json     # Frontend dependencies
│   └── vercel.json      # Frontend deployment config
│
└── README.md            # This file
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration  
- `POST /api/auth/seed` - Create demo data

### Notes (Protected)
- `GET /api/notes` - Get user's notes
- `POST /api/notes` - Create new note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note

### Tenants (Protected)
- `POST /api/tenants/:slug/upgrade` - Upgrade to Pro plan

## Development Scripts

### Backend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run check        # Type check
```

### Frontend
```bash
npm run dev          # Start development server  
npm run build        # Build for production
npm run preview      # Preview production build
npm run check        # Type check
```

## Environment Variables

### Backend (.env)
```env
MONGODB_CONNECTION_STRING=mongodb+srv://...
JWT_SECRET=your-super-secret-key
NODE_ENV=development
```

### Frontend (.env)
```env
# Development
VITE_API_URL=http://localhost:5000/api

# Production  
VITE_API_URL=https://your-backend.vercel.app/api
```

## Troubleshooting

### Common Issues

**1. MongoDB Connection Errors**
- Ensure IP whitelist includes 0.0.0.0/0 or specific Vercel IPs
- Check connection string format
- Verify database credentials

**2. CORS Errors**
- Update backend CORS origins to include frontend URL
- Ensure credentials: true is set

**3. Authentication Errors**
- Check JWT_SECRET is set in both development and production
- Verify token is being sent in Authorization header

**4. Build Errors**
- Check all environment variables are set correctly
- Verify import paths after directory restructuring

### Getting Help

1. Check the browser console for frontend errors
2. Check Vercel function logs for backend errors  
3. Ensure all environment variables are correctly set
4. Verify MongoDB connection and permissions

## Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT-based authentication with secure secrets
- ✅ CORS protection with specific origins
- ✅ Input validation with Zod schemas
- ✅ Multi-tenant data isolation
- ✅ Role-based access control
- ✅ Environment variable management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test both frontend and backend
5. Submit a pull request

## License

MIT License