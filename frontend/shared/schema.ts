import { z } from "zod";

// Tenant Schema
export const tenantSchema = z.object({
  _id: z.string().optional(),
  name: z.string().min(1, "Tenant name is required"),
  slug: z.string().min(1, "Tenant slug is required"),
  plan: z.enum(["free", "pro"]),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const insertTenantSchema = tenantSchema.omit({ _id: true, createdAt: true, updatedAt: true });

// User Schema
export const userSchema = z.object({
  _id: z.string().optional(),
  email: z.string().email("Invalid email address"),
  passwordHash: z.string().min(1, "Password hash is required"),
  role: z.enum(["Admin", "Member"]),
  tenantId: z.string().min(1, "Tenant ID is required"),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const insertUserSchema = userSchema.omit({ _id: true, passwordHash: true, createdAt: true, updatedAt: true })
  .extend({
    password: z.string().min(6, "Password must be at least 6 characters"),
  });

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  organizationName: z.string().min(1, "Organization name is required"),
});

// Note Schema
export const noteSchema = z.object({
  _id: z.string().optional(),
  title: z.string().min(1, "Note title is required"),
  body: z.string().min(1, "Note body is required"),
  tenantId: z.string().min(1, "Tenant ID is required"),
  authorId: z.string().min(1, "Author ID is required"),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const insertNoteSchema = noteSchema.omit({ 
  _id: true, 
  tenantId: true, 
  authorId: true, 
  createdAt: true, 
  updatedAt: true 
});

export const updateNoteSchema = insertNoteSchema.partial();

// Types
export type Tenant = z.infer<typeof tenantSchema>;
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type SignupRequest = z.infer<typeof signupSchema>;
export type Note = z.infer<typeof noteSchema>;
export type InsertNote = z.infer<typeof insertNoteSchema>;
export type UpdateNote = z.infer<typeof updateNoteSchema>;

// Auth response types
export interface AuthResponse {
  token: string;
  user: {
    _id: string;
    email: string;
    role: "Admin" | "Member";
    tenant: {
      _id: string;
      name: string;
      slug: string;
      plan: "free" | "pro";
    };
  };
}

export interface AuthUser {
  _id: string;
  email: string;
  role: "Admin" | "Member";
  tenantId: string;
  tenant: {
    _id: string;
    name: string;
    slug: string;
    plan: "free" | "pro";
  };
}
