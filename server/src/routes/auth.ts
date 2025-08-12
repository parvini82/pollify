import { Router } from 'express';
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { generateToken, authenticateToken, requireAdmin } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.enum(['USER', 'ADMIN']).optional().default('USER')
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).optional()
});

// Register new user (admin only)
router.post('/register', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: data.role
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });
    
    res.status(201).json({
      message: 'User created successfully',
      user
    });
  } catch (e) { next(e); }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email }
    });
    
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check password
    const isValidPassword = await bcrypt.compare(data.password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    });
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (e) { next(e); }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user });
  } catch (e) { next(e); }
});

// Update profile
router.patch('/profile', authenticateToken, async (req, res, next) => {
  try {
    const data = updateProfileSchema.parse(req.body);
    
    const updateData: any = {};
    
    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    
    // Handle password change
    if (data.newPassword) {
      if (!data.currentPassword) {
        return res.status(400).json({ error: 'Current password required to change password' });
      }
      
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id }
      });
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const isValidPassword = await bcrypt.compare(data.currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }
      
      updateData.password = await bcrypt.hash(data.newPassword, 12);
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    });
    
    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (e) { next(e); }
});

// Get all users (admin only)
router.get('/users', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            forms: true,
            responses: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({ users });
  } catch (e) { next(e); }
});

// Toggle user active status (admin only)
router.patch('/users/:userId/toggle-status', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Prevent admin from deactivating themselves
    if (userId === req.user!.id) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    });
    
    res.json({
      message: `User ${updatedUser.isActive ? 'activated' : 'deactivated'} successfully`,
      user: updatedUser
    });
  } catch (e) { next(e); }
});

// Change user role (admin only)
router.patch('/users/:userId/role', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    if (!Object.values(UserRole).includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Prevent admin from changing their own role
    if (userId === req.user!.id) {
      return res.status(400).json({ error: 'Cannot change your own role' });
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    });
    
    res.json({
      message: 'User role updated successfully',
      user: updatedUser
    });
  } catch (e) { next(e); }
});

export default router;
