# Express + React Notes Application

A full-stack notes application built with Express.js backend and React frontend, featuring user authentication and multi-tenant support.

## Features

- User authentication with JWT tokens
- Multi-tenant architecture (organization-based)
- Notes management (create, read, update, delete)
- Role-based access control (Admin/Member)
- Modern React frontend with Tailwind CSS
- TypeScript throughout

## Prerequisites

- Node.js 20 or higher
- A PostgreSQL database (or use Replit's built-in database)

## Environment Variables

The following environment variables are required:

- `JWT_SECRET` - A secure random string for JWT token signing (32+ characters recommended)
- `DATABASE_URL` - PostgreSQL connection string (automatically provided in Replit)

## Getting Started

### Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up your environment variables:
   - Copy `.env.example` to `.env` (if available)
   - Set your `JWT_SECRET` to a secure random string
   - Configure your `DATABASE_URL` if not using Replit's database

3. Initialize the database:
   ```bash
   npm run db:push
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`

### Development Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - Type check with TypeScript
- `npm run db:push` - Push database schema changes

## Deployment to Vercel

1. **Prepare your project:**
   ```bash
   npm run build
   ```

2. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

3. **Deploy to Vercel:**
   ```bash
   vercel
   ```

4. **Configure Environment Variables:**
   - In your Vercel dashboard, go to your project settings
   - Add the following environment variables:
     - `JWT_SECRET` - Your secure JWT secret
     - `DATABASE_URL` - Your PostgreSQL connection string

5. **Configure Build Settings:**
   Create a `vercel.json` file in your root directory:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "server/index.ts",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/api/(.*)",
         "dest": "/server/index.ts"
       },
       {
         "src": "/(.*)",
         "dest": "/dist/$1"
       }
     ]
   }
   ```

6. **Database Setup:**
   - Use a cloud PostgreSQL service like:
     - Neon (recommended)
     - Supabase
     - Railway
     - PlanetScale
   - Update your `DATABASE_URL` environment variable in Vercel

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom hooks
│   │   ├── lib/          # Utilities and API client
│   │   ├── pages/        # Page components
│   │   └── main.tsx      # App entry point
├── server/                # Express backend
│   ├── middleware/       # Authentication middleware
│   ├── models/          # Database models
│   ├── index.ts         # Server entry point
│   ├── routes.ts        # API routes
│   └── storage.ts       # Database operations
├── shared/               # Shared types and schemas
└── package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/seed` - Create seed data (development)

### Notes
- `GET /api/notes` - Get user's notes
- `POST /api/notes` - Create new note
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note

### Health
- `GET /api/health` - Health check endpoint

## Seeding Data (Development)

To create test users and data for development:

```bash
curl -X POST http://localhost:5000/api/auth/seed
```

This creates test accounts:
- `admin@acme.test` / `password` (Admin role)
- `user@acme.test` / `password` (Member role)
- `admin@globex.test` / `password` (Admin role)
- `user@globex.test` / `password` (Member role)

## Security Features

- Password hashing with bcrypt
- JWT-based authentication
- CORS protection
- Input validation with Zod
- Multi-tenant data isolation
- Role-based access control

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test your changes
5. Submit a pull request

## License

MIT License