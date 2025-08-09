import { Router } from 'express';
import { PrismaClient, QuestionType } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();
const router = Router();

const createQuestionSchema = z.object({
  title: z.string().min(1),
  type: z.nativeEnum(QuestionType),
  required: z.boolean().optional().default(false),
  order: z.number().int().nonnegative(),
});

const updateQuestionSchema = z.object({
  title: z.string().min(1).optional(),
  required: z.boolean().optional(),
  order: z.number().int().nonnegative().optional(),
});

// Create question in a form
router.post('/forms/:formId/questions', async (req, res, next) => {
  try {
    const data = createQuestionSchema.parse(req.body);
    const q = await prisma.question.create({
      data: { ...data, formId: req.params.formId },
    });
    res.status(201).json(q);
  } catch (e) { next(e); }
});

// Update question
router.patch('/questions/:questionId', async (req, res, next) => {
  try {
    const patch = updateQuestionSchema.parse(req.body);
    const q = await prisma.question.update({
      where: { id: req.params.questionId },
      data: patch,
    });
    res.json(q);
  } catch (e) { next(e); }
});

// Delete question (cascade removes choices + responseItems)
router.delete('/questions/:questionId', async (req, res, next) => {
  try {
    await prisma.question.delete({ where: { id: req.params.questionId } });
    res.status(204).end();
  } catch (e) { next(e); }
});

export default router;
