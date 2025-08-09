import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();
const router = Router();

// Schemas
const formCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  isPublic: z.boolean().optional().default(true),
});

const formUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  isPublic: z.boolean().optional(),
});

// Create form
router.post('/forms', async (req, res, next) => {
  try {
    const data = formCreateSchema.parse(req.body);

    // تا وقتی auth نداریم: دمو یوزر
    const user = await prisma.user.upsert({
      where: { email: 'demo@pollify.local' },
      update: {},
      create: { email: 'demo@pollify.local', name: 'Demo User' },
    });

    const form = await prisma.form.create({
      data: { ...data, createdById: user.id },
    });
    res.status(201).json(form);
  } catch (e) { next(e); }
});

// List forms (owner’s forms – فعلاً دمو)
router.get('/forms', async (_req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { email: 'demo@pollify.local' } });
    const forms = await prisma.form.findMany({
      where: user ? { createdById: user.id } : undefined,
      include: { _count: { select: { responses: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(forms);
  } catch (e) { next(e); }
});

// Get one (with questions/choices)
router.get('/forms/:formId', async (req, res, next) => {
  try {
    const form = await prisma.form.findUnique({
      where: { id: req.params.formId },
      include: { questions: { include: { choices: true }, orderBy: { order: 'asc' } } },
    });
    if (!form) return res.status(404).json({ error: 'Form not found' });
    res.json(form);
  } catch (e) { next(e); }
});

// Update form
router.patch('/forms/:formId', async (req, res, next) => {
  try {
    const patch = formUpdateSchema.parse(req.body);
    const updated = await prisma.form.update({
      where: { id: req.params.formId },
      data: patch,
    });
    res.json(updated);
  } catch (e) { next(e); }
});

// Delete form (cascade via Prisma relations)
router.delete('/forms/:formId', async (req, res, next) => {
  try {
    await prisma.form.delete({ where: { id: req.params.formId } });
    res.status(204).end();
  } catch (e) { next(e); }
});

export default router;
