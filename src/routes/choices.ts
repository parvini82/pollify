import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();
const router = Router();

const createChoiceSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
  order: z.number().int().nonnegative(),
});

const updateChoiceSchema = z.object({
  label: z.string().min(1).optional(),
  value: z.string().min(1).optional(),
  order: z.number().int().nonnegative().optional(),
});

// Create choice (only for MCQ questions – enforce UI-side)
router.post('/questions/:questionId/choices', async (req, res, next) => {
  try {
    const data = createChoiceSchema.parse(req.body);
    const c = await prisma.choice.create({
      data: { ...data, questionId: req.params.questionId },
    });
    res.status(201).json(c);
  } catch (e) { next(e); }
});

// Update choice
router.patch('/choices/:choiceId', async (req, res, next) => {
  try {
    const patch = updateChoiceSchema.parse(req.body);
    const c = await prisma.choice.update({
      where: { id: req.params.choiceId },
      data: patch,
    });
    res.json(c);
  } catch (e) { next(e); }
});

// Delete choice
router.delete('/choices/:choiceId', async (req, res, next) => {
  try {
    await prisma.choice.delete({ where: { id: req.params.choiceId } });
    res.status(204).end();
  } catch (e) { next(e); }
});

export default router;
