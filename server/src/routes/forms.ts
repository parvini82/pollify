import { Router } from 'express';
import { PrismaClient, QuestionType } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();
const router = Router();

const formSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  isPublic: z.boolean().optional().default(true),
  createdById: z.string().optional(), // temporary until auth
});

router.post('/forms', async (req, res, next) => {
  try {
    const data = formSchema.parse(req.body);
    // fallback demo user
    const user = await prisma.user.upsert({
      where: { email: 'demo@pollify.local' },
      update: {},
      create: { email: 'demo@pollify.local', name: 'Demo User' },
    });
    const form = await prisma.form.create({
      data: { ...data, createdById: user.id },
    });
    res.json(form);
  } catch (e) { next(e); }
});

router.get('/forms', async (_req, res, next) => {
  try {
    const forms = await prisma.form.findMany({ include: { _count: { select: { responses: true } } } });
    res.json(forms);
  } catch (e) { next(e); }
});

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

export default router;
