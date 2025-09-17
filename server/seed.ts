import { connectDB } from './models/index.js';
import { storage } from './storage.js';
import bcrypt from 'bcryptjs';

async function seed() {
  try {
    await connectDB();
    console.log('Connected to MongoDB for seeding...');

    // Check if data already exists
    const existingTenant = await storage.getTenantBySlug('acme');
    if (existingTenant) {
      console.log('Seed data already exists');
      process.exit(0);
    }

    console.log('Creating seed data...');

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

    console.log('Created tenants:', acmeTenant.name, globexTenant.name);

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
      const user = await storage.createUser(userData);
      console.log('Created user:', user.email);
    }

    console.log('Seed data created successfully!');
    console.log('\nTest accounts (password: "password"):');
    console.log('- admin@acme.test (Admin, Acme Corporation)');
    console.log('- user@acme.test (Member, Acme Corporation)');
    console.log('- admin@globex.test (Admin, Globex Corporation)');
    console.log('- user@globex.test (Member, Globex Corporation)');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
