import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();
const router = Router();

const submitSchema = z.object({
  items: z.array(z.object({
    questionId: z.string(),
    valueText: z.string().optional(),
    valueChoiceId: z.string().optional(),
  })).min(1),
});

router.get('/public/forms/:formId', async (req, res, next) => {
  try {
    const form = await prisma.form.findFirst({
      where: { id: req.params.formId, isPublic: true },
      include: { questions: { include: { choices: true }, orderBy: { order: 'asc' } } },
    });
    if (!form) return res.status(404).json({ error: 'Public form not found' });
    res.json(form);
  } catch (e) { next(e); }
});

router.post('/public/forms/:formId/responses', async (req, res, next) => {
  try {
    const data = submitSchema.parse(req.body);
    const form = await prisma.form.findUnique({ where: { id: req.params.formId } });
    if (!form || !form.isPublic) return res.status(404).json({ error: 'Form not found' });

    const response = await prisma.response.create({
      data: {
        formId: form.id,
        clientIp: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || undefined,
        userAgent: req.headers['user-agent'],
        items: {
          create: data.items.map(i => ({
            questionId: i.questionId,
            valueText: i.valueText,
            valueChoiceId: i.valueChoiceId,
          })),
        },
      },
    });
    res.json({ responseId: response.id });
  } catch (e) { next(e); }
});

export default router;
