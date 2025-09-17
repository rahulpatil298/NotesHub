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
import { TenantModel, UserModel, NoteModel, connectDB } from './models/index.js';
import mongoose from 'mongoose';

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

class MongoStorage implements IStorage {
  // Tenant operations
  async getTenant(id: string): Promise<Tenant | null> {
    try {
      const tenant = await TenantModel.findById(id);
      if (!tenant) return null;
      return {
        _id: tenant._id.toString(),
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan as 'free' | 'pro',
        createdAt: tenant.createdAt,
        updatedAt: tenant.updatedAt,
      };
    } catch (error) {
      console.error('Error getting tenant:', error);
      return null;
    }
  }

  async getTenantBySlug(slug: string): Promise<Tenant | null> {
    try {
      const tenant = await TenantModel.findOne({ slug });
      if (!tenant) return null;
      return {
        _id: tenant._id.toString(),
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan as 'free' | 'pro',
        createdAt: tenant.createdAt,
        updatedAt: tenant.updatedAt,
      };
    } catch (error) {
      console.error('Error getting tenant by slug:', error);
      return null;
    }
  }

  async createTenant(tenantData: InsertTenant): Promise<Tenant> {
    try {
      const tenant = new TenantModel(tenantData);
      const savedTenant = await tenant.save();
      return {
        _id: savedTenant._id.toString(),
        name: savedTenant.name,
        slug: savedTenant.slug,
        plan: savedTenant.plan as 'free' | 'pro',
        createdAt: savedTenant.createdAt,
        updatedAt: savedTenant.updatedAt,
      };
    } catch (error) {
      console.error('Error creating tenant:', error);
      throw error;
    }
  }

  async updateTenantPlan(id: string, plan: 'free' | 'pro'): Promise<Tenant | null> {
    try {
      const tenant = await TenantModel.findByIdAndUpdate(
        id,
        { plan },
        { new: true }
      );
      if (!tenant) return null;
      return {
        _id: tenant._id.toString(),
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan as 'free' | 'pro',
        createdAt: tenant.createdAt,
        updatedAt: tenant.updatedAt,
      };
    } catch (error) {
      console.error('Error updating tenant plan:', error);
      return null;
    }
  }

  // User operations
  async getUser(id: string): Promise<User | null> {
    try {
      const user = await UserModel.findById(id);
      if (!user) return null;
      return {
        _id: user._id.toString(),
        email: user.email,
        passwordHash: user.passwordHash,
        role: user.role as 'Admin' | 'Member',
        tenantId: user.tenantId.toString(),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const user = await UserModel.findOne({ email });
      if (!user) return null;
      return {
        _id: user._id.toString(),
        email: user.email,
        passwordHash: user.passwordHash,
        role: user.role as 'Admin' | 'Member',
        tenantId: user.tenantId.toString(),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  }

  async createUser(userData: Omit<InsertUser, 'password'> & { passwordHash: string }): Promise<User> {
    try {
      const user = new UserModel({
        email: userData.email,
        passwordHash: userData.passwordHash,
        role: userData.role,
        tenantId: new mongoose.Types.ObjectId(userData.tenantId),
      });
      const savedUser = await user.save();
      return {
        _id: savedUser._id.toString(),
        email: savedUser.email,
        passwordHash: savedUser.passwordHash,
        role: savedUser.role as 'Admin' | 'Member',
        tenantId: savedUser.tenantId.toString(),
        createdAt: savedUser.createdAt,
        updatedAt: savedUser.updatedAt,
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Note operations
  async getNotesByTenant(tenantId: string): Promise<Note[]> {
    try {
      const notes = await NoteModel.find({ tenantId: new mongoose.Types.ObjectId(tenantId) });
      return notes.map(note => ({
        _id: note._id.toString(),
        title: note.title,
        body: note.body,
        tenantId: note.tenantId.toString(),
        authorId: note.authorId.toString(),
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      }));
    } catch (error) {
      console.error('Error getting notes by tenant:', error);
      return [];
    }
  }

  async getNote(id: string, tenantId: string): Promise<Note | null> {
    try {
      const note = await NoteModel.findOne({ 
        _id: new mongoose.Types.ObjectId(id),
        tenantId: new mongoose.Types.ObjectId(tenantId)
      });
      if (!note) return null;
      return {
        _id: note._id.toString(),
        title: note.title,
        body: note.body,
        tenantId: note.tenantId.toString(),
        authorId: note.authorId.toString(),
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      };
    } catch (error) {
      console.error('Error getting note:', error);
      return null;
    }
  }

  async createNote(noteData: InsertNote & { tenantId: string; authorId: string }): Promise<Note> {
    try {
      const note = new NoteModel({
        title: noteData.title,
        body: noteData.body,
        tenantId: new mongoose.Types.ObjectId(noteData.tenantId),
        authorId: new mongoose.Types.ObjectId(noteData.authorId),
      });
      const savedNote = await note.save();
      return {
        _id: savedNote._id.toString(),
        title: savedNote.title,
        body: savedNote.body,
        tenantId: savedNote.tenantId.toString(),
        authorId: savedNote.authorId.toString(),
        createdAt: savedNote.createdAt,
        updatedAt: savedNote.updatedAt,
      };
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  }

  async updateNote(id: string, tenantId: string, updates: UpdateNote): Promise<Note | null> {
    try {
      const note = await NoteModel.findOneAndUpdate(
        { 
          _id: new mongoose.Types.ObjectId(id),
          tenantId: new mongoose.Types.ObjectId(tenantId)
        },
        updates,
        { new: true }
      );
      if (!note) return null;
      return {
        _id: note._id.toString(),
        title: note.title,
        body: note.body,
        tenantId: note.tenantId.toString(),
        authorId: note.authorId.toString(),
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      };
    } catch (error) {
      console.error('Error updating note:', error);
      return null;
    }
  }

  async deleteNote(id: string, tenantId: string): Promise<boolean> {
    try {
      const result = await NoteModel.deleteOne({
        _id: new mongoose.Types.ObjectId(id),
        tenantId: new mongoose.Types.ObjectId(tenantId)
      });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error deleting note:', error);
      return false;
    }
  }

  async countNotesByTenant(tenantId: string): Promise<number> {
    try {
      return await NoteModel.countDocuments({ tenantId: new mongoose.Types.ObjectId(tenantId) });
    } catch (error) {
      console.error('Error counting notes by tenant:', error);
      return 0;
    }
  }
}

// Initialize MongoDB connection and export storage with fallback
let mongoStorage: MongoStorage | null = null;
let memoryStorageFallback: MemStorage | null = null;

async function initializeStorage(): Promise<IStorage> {
  try {
    if (!mongoStorage) {
      await connectDB();
      mongoStorage = new MongoStorage();
      console.log('✅ Successfully connected to MongoDB');
    }
    return mongoStorage;
  } catch (error) {
    console.error('❌ MongoDB connection failed, falling back to memory storage:', error instanceof Error ? error.message : String(error));
    console.log('ℹ️  To fix this: Add 0.0.0.0/0 to your MongoDB Atlas IP whitelist or configure proper IP restrictions.');
    
    if (!memoryStorageFallback) {
      memoryStorageFallback = new MemStorage();
    }
    return memoryStorageFallback;
  }
}

// For compatibility, we'll export a function that returns the storage instance
export const getStorage = async (): Promise<IStorage> => {
  return await initializeStorage();
};

// Legacy export for immediate usage (will need to be updated in routes)
export const storage = new MemStorage();
