import type { Express } from "express";
import { createServer, type Server } from "http";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import { storage } from "./storage.js";
import { authenticateToken, requireAdmin, AuthRequest } from './middleware/auth.js';
import { 
  loginSchema, 
  insertNoteSchema, 
  updateNoteSchema,
  AuthResponse 
} from '@shared/schema.js';

export async function registerRoutes(app: Express): Promise<Server> {

  // Enable CORS
  app.use(cors({
    origin: ['http://localhost:5000', 'http://localhost:3000', '*'],
    credentials: true,
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
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Get tenant information
      const tenant = await storage.getTenant(user.tenantId);
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

  // Seed endpoint (for development/testing)
  app.post('/api/auth/seed', async (req, res) => {
    try {
      // Check if data already exists
      const existingTenant = await storage.getTenantBySlug('acme');
      if (existingTenant) {
        return res.json({ message: 'Seed data already exists' });
      }

      // Create tenants
      const acmeTenant = await storage.createTenant({
        name: 'Acme Corporation',
        slug: 'acme',
        plan: 'free',
      });

      const globexTenant = await storage.createTenant({
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
        await storage.createUser(userData);
      }

      res.status(201).json({ message: 'Seed data created successfully' });
    } catch (error) {
      console.error('Seed error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Protected routes (require authentication)
  app.use('/api/notes*', authenticateToken);
  app.use('/api/tenants*', authenticateToken);

  // Get all notes for current tenant
  app.get('/api/notes', async (req: AuthRequest, res) => {
    try {
      const notes = await storage.getNotesByTenant(req.user!.tenantId);
      res.json(notes);
    } catch (error) {
      console.error('Get notes error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get single note
  app.get('/api/notes/:id', async (req: AuthRequest, res) => {
    try {
      const note = await storage.getNote(req.params.id, req.user!.tenantId);
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

      // Check subscription limit for free plan
      if (user.tenant.plan === 'free') {
        const noteCount = await storage.countNotesByTenant(user.tenantId);
        if (noteCount >= 3) {
          return res.status(403).json({ 
            message: 'Note limit reached. Free plan allows maximum 3 notes. Upgrade to Pro for unlimited notes.' 
          });
        }
      }

      const note = await storage.createNote({
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
      const note = await storage.updateNote(req.params.id, req.user!.tenantId, updates);
      
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
      const deleted = await storage.deleteNote(req.params.id, req.user!.tenantId);
      
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

      const updatedTenant = await storage.updateTenantPlan(user.tenantId, 'pro');
      
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
