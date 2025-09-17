import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel, TenantModel } from '../models/index.js';
import { AuthUser } from '../../shared/schema.js';

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required');
    }

    const decoded = jwt.verify(token, jwtSecret) as { sub: string; role: string; tenantId: string };
    
    // Load user and tenant from database
    const user = await UserModel.findById(decoded.sub).populate('tenantId');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const tenant = await TenantModel.findById(user.tenantId);
    if (!tenant) {
      return res.status(401).json({ message: 'Tenant not found' });
    }

    req.user = {
      _id: user._id.toString(),
      email: user.email,
      role: user.role as "Admin" | "Member",
      tenantId: user.tenantId.toString(),
      tenant: {
        _id: tenant._id.toString(),
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan as "free" | "pro",
      },
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  next();
}
