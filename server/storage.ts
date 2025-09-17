import bcrypt from 'bcryptjs';
import { 
  Tenant, 
  User, 
  Note, 
  InsertTenant, 
  InsertUser, 
  InsertNote, 
  UpdateNote 
} from '@shared/schema.js';
import { nanoid } from 'nanoid';

export interface IStorage {
  // Tenant operations
  getTenant(id: string): Promise<Tenant | null>;
  getTenantBySlug(slug: string): Promise<Tenant | null>;
  createTenant(tenant: InsertTenant): Promise<Tenant>;
  updateTenantPlan(id: string, plan: 'free' | 'pro'): Promise<Tenant | null>;

  // User operations
  getUser(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  createUser(user: Omit<InsertUser, 'password'> & { passwordHash: string }): Promise<User>;

  // Note operations
  getNotesByTenant(tenantId: string): Promise<Note[]>;
  getNote(id: string, tenantId: string): Promise<Note | null>;
  createNote(note: InsertNote & { tenantId: string; authorId: string }): Promise<Note>;
  updateNote(id: string, tenantId: string, updates: UpdateNote): Promise<Note | null>;
  deleteNote(id: string, tenantId: string): Promise<boolean>;
  countNotesByTenant(tenantId: string): Promise<number>;
}

export class MemStorage implements IStorage {
  private tenants = new Map<string, Tenant>();
  private users = new Map<string, User>();
  private notes = new Map<string, Note>();

  // Tenant operations
  async getTenant(id: string): Promise<Tenant | null> {
    return this.tenants.get(id) || null;
  }

  async getTenantBySlug(slug: string): Promise<Tenant | null> {
    const tenantsArray = Array.from(this.tenants.values());
    for (const tenant of tenantsArray) {
      if (tenant.slug === slug) {
        return tenant;
      }
    }
    return null;
  }

  async createTenant(tenantData: InsertTenant): Promise<Tenant> {
    const now = new Date();
    const tenant: Tenant = {
      _id: nanoid(),
      name: tenantData.name,
      slug: tenantData.slug,
      plan: tenantData.plan || 'free',
      createdAt: now,
      updatedAt: now,
    };
    
    this.tenants.set(tenant._id!, tenant);
    return tenant;
  }

  async updateTenantPlan(id: string, plan: 'free' | 'pro'): Promise<Tenant | null> {
    const tenant = this.tenants.get(id);
    if (!tenant) return null;
    
    const updatedTenant = {
      ...tenant,
      plan,
      updatedAt: new Date(),
    };
    
    this.tenants.set(id, updatedTenant);
    return updatedTenant;
  }

  // User operations
  async getUser(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const usersArray = Array.from(this.users.values());
    for (const user of usersArray) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async createUser(userData: Omit<InsertUser, 'password'> & { passwordHash: string }): Promise<User> {
    const now = new Date();
    const user: User = {
      _id: nanoid(),
      email: userData.email,
      passwordHash: userData.passwordHash,
      role: userData.role,
      tenantId: userData.tenantId,
      createdAt: now,
      updatedAt: now,
    };
    
    this.users.set(user._id!, user);
    return user;
  }

  // Note operations
  async getNotesByTenant(tenantId: string): Promise<Note[]> {
    const notes: Note[] = [];
    const notesArray = Array.from(this.notes.values());
    for (const note of notesArray) {
      if (note.tenantId === tenantId) {
        notes.push(note);
      }
    }
    return notes;
  }

  async getNote(id: string, tenantId: string): Promise<Note | null> {
    const note = this.notes.get(id);
    if (!note || note.tenantId !== tenantId) {
      return null;
    }
    return note;
  }

  async createNote(noteData: InsertNote & { tenantId: string; authorId: string }): Promise<Note> {
    const now = new Date();
    const note: Note = {
      _id: nanoid(),
      title: noteData.title,
      body: noteData.body,
      tenantId: noteData.tenantId,
      authorId: noteData.authorId,
      createdAt: now,
      updatedAt: now,
    };
    
    this.notes.set(note._id!, note);
    return note;
  }

  async updateNote(id: string, tenantId: string, updates: UpdateNote): Promise<Note | null> {
    const note = this.notes.get(id);
    if (!note || note.tenantId !== tenantId) {
      return null;
    }
    
    const updatedNote = {
      ...note,
      ...updates,
      updatedAt: new Date(),
    };
    
    this.notes.set(id, updatedNote);
    return updatedNote;
  }

  async deleteNote(id: string, tenantId: string): Promise<boolean> {
    const note = this.notes.get(id);
    if (!note || note.tenantId !== tenantId) {
      return false;
    }
    
    return this.notes.delete(id);
  }

  async countNotesByTenant(tenantId: string): Promise<number> {
    let count = 0;
    const notesArray = Array.from(this.notes.values());
    for (const note of notesArray) {
      if (note.tenantId === tenantId) {
        count++;
      }
    }
    return count;
  }
}

export const storage = new MemStorage();
