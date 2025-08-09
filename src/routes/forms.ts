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

const listQuerySchema = z.object({
  page: z.string().optional().transform(v => (v ? parseInt(v, 10) : 1)).pipe(z.number().int().positive()),
  pageSize: z.string().optional().transform(v => (v ? parseInt(v, 10) : 20)).pipe(z.number().int().min(1).max(200)),
  order: z.enum(['asc', 'desc']).optional().default('desc'), // بر اساس submittedAt
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

// Summary analytics
router.get('/forms/:formId/analytics/summary', async (req, res, next) => {
  try {
    const formId = req.params.formId;

    // پیدا کردن فرم و سوال‌هاش
    const form = await prisma.form.findUnique({
      where: { id: formId },
      include: {
        questions: {
          include: { choices: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!form) return res.status(404).json({ error: 'Form not found' });

    // گرفتن همه پاسخ‌ها و آیتم‌هاشون
    const responses = await prisma.response.findMany({
      where: { formId },
      include: { items: true },
    });

    const summary = {
      formId,
      title: form.title,
      totalResponses: responses.length,
      questions: [] as any[],
    };

    // پردازش هر سوال
    for (const q of form.questions) {
      if (q.type === 'MULTIPLE_CHOICE') {
        const counts: Record<string, number> = {};
        for (const c of q.choices) {
          counts[c.id] = 0;
        }
        for (const r of responses) {
          for (const i of r.items) {
            if (i.questionId === q.id && i.valueChoiceId) {
              counts[i.valueChoiceId] = (counts[i.valueChoiceId] || 0) + 1;
            }
          }
        }
        summary.questions.push({
          questionId: q.id,
          title: q.title,
          type: q.type,
          results: q.choices.map(c => ({
            choiceId: c.id,
            label: c.label,
            count: counts[c.id] || 0,
          })),
        });
      } else {
        // برای سوال متنی فقط تعداد پاسخ‌ها رو می‌دیم
        let count = 0;
        for (const r of responses) {
          for (const i of r.items) {
            if (i.questionId === q.id && i.valueText?.trim()) {
              count++;
            }
          }
        }
        summary.questions.push({
          questionId: q.id,
          title: q.title,
          type: q.type,
          textResponsesCount: count,
        });
      }
    }

    res.json(summary);
  } catch (e) {
    next(e);
  }
});

// --- Export CSV of responses for a form ---
router.get('/forms/:formId/export.csv', async (req, res, next) => {
  try {
    const formId = req.params.formId;

    // فرم + سوال‌ها + گزینه‌ها (برای تبدیل choiceId به label)
    const form = await prisma.form.findUnique({
      where: { id: formId },
      include: {
        questions: {
          include: { choices: true },
          orderBy: { order: 'asc' },
        },
      },
    });
    if (!form) return res.status(404).json({ error: 'Form not found' });

    // همه پاسخ‌ها + آیتم‌ها
    const responses = await prisma.response.findMany({
      where: { formId },
      include: { items: true },
      orderBy: { submittedAt: 'asc' },
    });

    // نقشه‌ی questionId -> question و choiceId -> label
    const questionMap = new Map(form.questions.map(q => [q.id, q]));
    const choiceLabel = new Map<string, string>();
    for (const q of form.questions) {
      for (const c of q.choices) {
        choiceLabel.set(c.id, c.label);
      }
    }

    // هدر CSV: ResponseId, SubmittedAt, سپس هر سوال یک ستون (با عنوان سوال)
    const headers = ['ResponseId', 'SubmittedAt', ...form.questions.map(q => q.title)];

    // escape ساده برای CSV
    const esc = (val: any) => {
      if (val === null || val === undefined) return '';
      const s = String(val);
      if (s.includes('"') || s.includes(',') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    // ساخت ردیف‌ها
    const rows: string[] = [];
    rows.push(headers.map(esc).join(','));

    for (const r of responses) {
      // برای هر سوال، مقدار مربوط را پیدا کن
      const cols: string[] = [];
      cols.push(r.id);
      cols.push(r.submittedAt.toISOString());

      for (const q of form.questions) {
        // آیتم مربوط به این سوال را پیدا کن
        const item = r.items.find(i => i.questionId === q.id);
        let cell = '';
        if (item) {
          if (q.type === 'MULTIPLE_CHOICE') {
            cell = item.valueChoiceId ? (choiceLabel.get(item.valueChoiceId) || '') : '';
          } else {
            cell = item.valueText || '';
          }
        }
        cols.push(cell);
      }

      rows.push(cols.map(esc).join(','));
    }

    const csv = rows.join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${form.title.replace(/[^a-z0-9-_]+/gi,'_')}.csv"`);
    res.send(csv);
  } catch (e) {
    next(e);
  }
});

router.get('/forms/:formId/responses', async (req, res, next) => {
  try {
    const formId = req.params.formId;
    const { page, pageSize, order } = listQuerySchema.parse(req.query);

    // وجود فرم را چک کن (اختیاری ولی بهتر)
    const exists = await prisma.form.findUnique({ where: { id: formId }, select: { id: true } });
    if (!exists) return res.status(404).json({ error: 'Form not found' });

    const skip = (page - 1) * pageSize;

    const [total, data] = await Promise.all([
      prisma.response.count({ where: { formId } }),
      prisma.response.findMany({
        where: { formId },
        include: {
          items: {
            include: {
              question: { select: { id: true, title: true, type: true } },
            },
          },
        },
        orderBy: { submittedAt: order },
        skip,
        take: pageSize,
      }),
    ]);

    res.json({
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      data: data.map(r => ({
        id: r.id,
        submittedAt: r.submittedAt,
        clientIp: r.clientIp,
        userAgent: r.userAgent,
        items: r.items.map(i => ({
          id: i.id,
          questionId: i.questionId,
          questionTitle: i.question.title,
          questionType: i.question.type,
          valueText: i.valueText,
          valueChoiceId: i.valueChoiceId,
        })),
      })),
    });
  } catch (e) { next(e); }
});

export default router;
