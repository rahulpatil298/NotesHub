import type { Express } from "express";
import { createServer, type Server } from "http";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import { getStorage } from "./storage.js";
import { authenticateToken, requireAdmin, AuthRequest } from './middleware/auth.js';
import { 
  loginSchema, 
  signupSchema,
  insertNoteSchema, 
  updateNoteSchema,
  AuthResponse 
} from '../shared/schema.js';

export async function registerRoutes(app: Express): Promise<Server> {

  // Enable CORS
  app.use(cors({
    origin: [
      'http://localhost:5000', 
      'http://localhost:3000',
      /^https:\/\/.*\.vercel\.app$/,
      process.env.FRONTEND_URL
    ].filter(Boolean),
    credentials: false, // Not needed with Bearer tokens
  }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Login endpoint
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      // Find user by email
      const mongoStorage = await getStorage();
      const user = await mongoStorage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Get tenant information
      const tenant = await mongoStorage.getTenant(user.tenantId);
      if (!tenant) {
        return res.status(401).json({ message: 'Tenant not found' });
      }

      // Generate JWT
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET environment variable is required');
      }

      const token = jwt.sign(
        {
          sub: user._id,
          role: user.role,
          tenantId: user.tenantId,
        },
        jwtSecret,
        { expiresIn: '24h' }
      );

      const response: AuthResponse = {
        token,
        user: {
          _id: user._id!,
          email: user.email,
          role: user.role,
          tenant: {
            _id: tenant._id!,
            name: tenant.name,
            slug: tenant.slug,
            plan: tenant.plan,
          },
        },
      };

      res.json(response);
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Signup endpoint
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const { email, password, organizationName } = signupSchema.parse(req.body);
      
      // Check if user already exists
      const mongoStorage = await getStorage();
      const existingUser = await mongoStorage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      // Create tenant slug from organization name
      const slug = organizationName.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50);
      
      // Check if tenant slug already exists
      const existingTenant = await mongoStorage.getTenantBySlug(slug);
      if (existingTenant) {
        return res.status(400).json({ message: 'Organization name already taken' });
      }

      // Create tenant
      const tenant = await mongoStorage.createTenant({
        name: organizationName,
        slug,
        plan: 'free',
      });

      // Hash password and create user
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await mongoStorage.createUser({
        email,
        passwordHash,
        role: 'Admin', // First user is always admin
        tenantId: tenant._id!,
      });

      // Generate JWT
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET environment variable is required');
      }

      const token = jwt.sign(
        {
          sub: user._id,
          role: user.role,
          tenantId: user.tenantId,
        },
        jwtSecret,
        { expiresIn: '24h' }
      );

      const response: AuthResponse = {
        token,
        user: {
          _id: user._id!,
          email: user.email,
          role: user.role,
          tenant: {
            _id: tenant._id!,
            name: tenant.name,
            slug: tenant.slug,
            plan: tenant.plan,
          },
        },
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Seed endpoint (for development/testing)
  app.post('/api/auth/seed', async (req, res) => {
    try {
      // Check if data already exists
      const mongoStorage = await getStorage();
      const existingTenant = await mongoStorage.getTenantBySlug('acme');
      if (existingTenant) {
        return res.json({ message: 'Seed data already exists' });
      }

      // Create tenants
      const acmeTenant = await mongoStorage.createTenant({
        name: 'Acme Corporation',
        slug: 'acme',
        plan: 'free',
      });

      const globexTenant = await mongoStorage.createTenant({
        name: 'Globex Corporation',
        slug: 'globex',
        plan: 'free',
      });

      // Create users
      const passwordHash = await bcrypt.hash('password', 10);

      const users = [
        {
          email: 'admin@acme.test',
          passwordHash,
          role: 'Admin' as const,
          tenantId: acmeTenant._id!,
        },
        {
          email: 'user@acme.test',
          passwordHash,
          role: 'Member' as const,
          tenantId: acmeTenant._id!,
        },
        {
          email: 'admin@globex.test',
          passwordHash,
          role: 'Admin' as const,
          tenantId: globexTenant._id!,
        },
        {
          email: 'user@globex.test',
          passwordHash,
          role: 'Member' as const,
          tenantId: globexTenant._id!,
        },
      ];

      for (const userData of users) {
        await mongoStorage.createUser(userData);
      }

      res.status(201).json({ message: 'Seed data created successfully' });
    } catch (error) {
      console.error('Seed error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Protected routes (require authentication)
  app.use('/api/notes', authenticateToken);
  app.use('/api/notes/*', authenticateToken);
  app.use('/api/tenants', authenticateToken);
  app.use('/api/tenants/*', authenticateToken);

  // Get all notes for current tenant
  app.get('/api/notes', async (req: AuthRequest, res) => {
    try {
      const mongoStorage = await getStorage();
      const notes = await mongoStorage.getNotesByTenant(req.user!.tenantId);
      res.json(notes);
    } catch (error) {
      console.error('Get notes error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get single note
  app.get('/api/notes/:id', async (req: AuthRequest, res) => {
    try {
      const mongoStorage = await getStorage();
      const note = await mongoStorage.getNote(req.params.id, req.user!.tenantId);
      if (!note) {
        return res.status(404).json({ message: 'Note not found' });
      }
      res.json(note);
    } catch (error) {
      console.error('Get note error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Create new note
  app.post('/api/notes', async (req: AuthRequest, res) => {
    try {
      const noteData = insertNoteSchema.parse(req.body);
      const user = req.user!;

      const mongoStorage = await getStorage();

      // Check subscription limit for free plan
      if (user.tenant.plan === 'free') {
        const noteCount = await mongoStorage.countNotesByTenant(user.tenantId);
        if (noteCount >= 3) {
          return res.status(403).json({ 
            message: 'Note limit reached. Free plan allows maximum 3 notes. Upgrade to Pro for unlimited notes.' 
          });
        }
      }

      const note = await mongoStorage.createNote({
        ...noteData,
        tenantId: user.tenantId,
        authorId: user._id,
      });

      res.status(201).json(note);
    } catch (error) {
      console.error('Create note error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Update note
  app.put('/api/notes/:id', async (req: AuthRequest, res) => {
    try {
      const updates = updateNoteSchema.parse(req.body);
      const mongoStorage = await getStorage();
      const note = await mongoStorage.updateNote(req.params.id, req.user!.tenantId, updates);
      
      if (!note) {
        return res.status(404).json({ message: 'Note not found' });
      }

      res.json(note);
    } catch (error) {
      console.error('Update note error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Delete note
  app.delete('/api/notes/:id', async (req: AuthRequest, res) => {
    try {
      const mongoStorage = await getStorage();
      const deleted = await mongoStorage.deleteNote(req.params.id, req.user!.tenantId);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Note not found' });
      }

      res.json({ message: 'Note deleted successfully' });
    } catch (error) {
      console.error('Delete note error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Upgrade tenant plan (Admin only)
  app.post('/api/tenants/:slug/upgrade', requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { slug } = req.params;
      const user = req.user!;

      // Verify the slug matches the user's tenant
      if (user.tenant.slug !== slug) {
        return res.status(403).json({ message: 'Cannot upgrade other tenants' });
      }

      const mongoStorage = await getStorage();
      const updatedTenant = await mongoStorage.updateTenantPlan(user.tenantId, 'pro');
      
      if (!updatedTenant) {
        return res.status(404).json({ message: 'Tenant not found' });
      }

      res.json({ 
        message: 'Tenant upgraded to Pro plan successfully',
        tenant: updatedTenant 
      });
    } catch (error) {
      console.error('Upgrade tenant error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
