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
import { TenantModel, UserModel, NoteModel } from './models/index.js';

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

export class MongoStorage implements IStorage {
  // Tenant operations
  async getTenant(id: string): Promise<Tenant | null> {
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
  }

  async getTenantBySlug(slug: string): Promise<Tenant | null> {
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
  }

  async createTenant(tenantData: InsertTenant): Promise<Tenant> {
    const tenant = new TenantModel(tenantData);
    const saved = await tenant.save();
    
    return {
      _id: saved._id.toString(),
      name: saved.name,
      slug: saved.slug,
      plan: saved.plan as 'free' | 'pro',
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };
  }

  async updateTenantPlan(id: string, plan: 'free' | 'pro'): Promise<Tenant | null> {
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
  }

  // User operations
  async getUser(id: string): Promise<User | null> {
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
  }

  async getUserByEmail(email: string): Promise<User | null> {
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
  }

  async createUser(userData: Omit<InsertUser, 'password'> & { passwordHash: string }): Promise<User> {
    const user = new UserModel({
      email: userData.email,
      passwordHash: userData.passwordHash,
      role: userData.role,
      tenantId: userData.tenantId,
    });
    const saved = await user.save();
    
    return {
      _id: saved._id.toString(),
      email: saved.email,
      passwordHash: saved.passwordHash,
      role: saved.role as 'Admin' | 'Member',
      tenantId: saved.tenantId.toString(),
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };
  }

  // Note operations
  async getNotesByTenant(tenantId: string): Promise<Note[]> {
    const notes = await NoteModel.find({ tenantId }).populate('authorId', 'email');
    
    return notes.map(note => ({
      _id: note._id.toString(),
      title: note.title,
      body: note.body,
      tenantId: note.tenantId.toString(),
      authorId: note.authorId.toString(),
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    }));
  }

  async getNote(id: string, tenantId: string): Promise<Note | null> {
    const note = await NoteModel.findOne({ _id: id, tenantId });
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
  }

  async createNote(noteData: InsertNote & { tenantId: string; authorId: string }): Promise<Note> {
    const note = new NoteModel(noteData);
    const saved = await note.save();
    
    return {
      _id: saved._id.toString(),
      title: saved.title,
      body: saved.body,
      tenantId: saved.tenantId.toString(),
      authorId: saved.authorId.toString(),
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };
  }

  async updateNote(id: string, tenantId: string, updates: UpdateNote): Promise<Note | null> {
    const note = await NoteModel.findOneAndUpdate(
      { _id: id, tenantId },
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
  }

  async deleteNote(id: string, tenantId: string): Promise<boolean> {
    const result = await NoteModel.deleteOne({ _id: id, tenantId });
    return result.deletedCount > 0;
  }

  async countNotesByTenant(tenantId: string): Promise<number> {
    return await NoteModel.countDocuments({ tenantId });
  }
}

export const storage = new MongoStorage();
