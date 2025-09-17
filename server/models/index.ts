import mongoose from 'mongoose';

// Tenant Model
const tenantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  plan: { type: String, enum: ['free', 'pro'], default: 'free' },
}, {
  timestamps: true,
});

export const TenantModel = mongoose.model('Tenant', tenantSchema);

// User Model
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['Admin', 'Member'], required: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
}, {
  timestamps: true,
});

export const UserModel = mongoose.model('User', userSchema);

// Note Model
const noteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, {
  timestamps: true,
});

export const NoteModel = mongoose.model('Note', noteSchema);

// MongoDB connection
export async function connectDB() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is required');
    }
    
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}
