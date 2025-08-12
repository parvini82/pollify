import { Router } from 'express';
import { PrismaClient, QuestionType } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();
const router = Router();

const formSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  isPublic: z.boolean().optional().default(true),
  maxResponses: z.number().optional(),
  allowMultipleResponses: z.boolean().optional().default(false),
  createdById: z.string().optional(), // temporary until auth
});

const questionSchema = z.object({
  title: z.string().min(1),
  type: z.enum(['TEXT', 'MULTIPLE_CHOICE', 'RATING']),
  required: z.boolean().optional().default(false),
  order: z.number(),
  minRating: z.number().optional(),
  maxRating: z.number().optional(),
  ratingLabels: z.string().optional(),
});

const conditionalLogicSchema = z.object({
  dependsOnQuestionId: z.string(),
  operator: z.enum(['EQUALS', 'NOT_EQUALS', 'CONTAINS', 'GREATER_THAN', 'LESS_THAN']),
  value: z.string(),
  skipToQuestionId: z.string().optional(),
  showQuestion: z.boolean().optional().default(true),
});

// Create form
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

// Get all forms
router.get('/forms', async (_req, res, next) => {
  try {
    const forms = await prisma.form.findMany({ 
      include: { 
        _count: { select: { responses: true } },
        createdBy: { select: { name: true, email: true } }
      } 
    });
    res.json(forms);
  } catch (e) { next(e); }
});

// Get form by ID
router.get('/forms/:formId', async (req, res, next) => {
  try {
    const form = await prisma.form.findUnique({
      where: { id: req.params.formId },
      include: { 
        questions: { 
          include: { 
            choices: { orderBy: { order: 'asc' } },
            conditionalLogic: true
          }, 
          orderBy: { order: 'asc' } 
        },
        _count: { select: { responses: true } }
      },
    });
    if (!form) return res.status(404).json({ error: 'Form not found' });
    res.json(form);
  } catch (e) { next(e); }
});

// Update form
router.patch('/forms/:formId', async (req, res, next) => {
  try {
    const data = formSchema.partial().parse(req.body);
    const form = await prisma.form.update({
      where: { id: req.params.formId },
      data,
    });
    res.json(form);
  } catch (e) { next(e); }
});

// Add question to form
router.post('/forms/:formId/questions', async (req, res, next) => {
  try {
    const data = questionSchema.parse(req.body);
    const question = await prisma.question.create({
      data: { ...data, formId: req.params.formId },
      include: { choices: true, conditionalLogic: true }
    });
    res.json(question);
  } catch (e) { next(e); }
});

// Add conditional logic to question
router.post('/questions/:questionId/conditional-logic', async (req, res, next) => {
  try {
    const data = conditionalLogicSchema.parse(req.body);
    const conditionalLogic = await prisma.conditionalLogic.create({
      data: { ...data, questionId: req.params.questionId },
    });
    res.json(conditionalLogic);
  } catch (e) { next(e); }
});

// Update conditional logic
router.patch('/conditional-logic/:logicId', async (req, res, next) => {
  try {
    const data = conditionalLogicSchema.partial().parse(req.body);
    const conditionalLogic = await prisma.conditionalLogic.update({
      where: { id: req.params.logicId },
      data,
    });
    res.json(conditionalLogic);
  } catch (e) { next(e); }
});

// Get form responses
router.get('/forms/:formId/responses', async (req, res, next) => {
  try {
    const responses = await prisma.response.findMany({
      where: { formId: req.params.formId },
      include: {
        items: {
          include: {
            question: {
              include: { choices: true }
            }
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });
    res.json(responses);
  } catch (e) { next(e); }
});

// Check if user has already responded
router.get('/forms/:formId/responses/check', async (req, res, next) => {
  try {
    const { clientIp } = req.query;
    if (!clientIp) {
      return res.status(400).json({ error: 'Client IP required' });
    }

    const existingResponse = await prisma.response.findFirst({
      where: { 
        formId: req.params.formId,
        clientIp: clientIp as string
      }
    });

    res.json({ exists: !!existingResponse });
  } catch (e) { next(e); }
});

// Submit response
router.post('/forms/:formId/responses', async (req, res, next) => {
  try {
    const { clientIp, totalTime, items } = req.body;
    
    // Check if form exists and is public
    const form = await prisma.form.findUnique({
      where: { id: req.params.formId },
      include: { _count: { select: { responses: true } } }
    });
    
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    if (!form.isPublic) {
      return res.status(403).json({ error: 'Form is not public' });
    }
    
    // Check max responses limit
    if (form.maxResponses && form._count.responses >= form.maxResponses) {
      return res.status(429).json({ error: 'Form has reached maximum responses' });
    }
    
    // Check if user has already responded (if not allowing multiple responses)
    if (!form.allowMultipleResponses && clientIp) {
      const existingResponse = await prisma.response.findFirst({
        where: { 
          formId: req.params.formId,
          clientIp
        }
      });
      
      if (existingResponse) {
        return res.status(409).json({ error: 'You have already submitted a response' });
      }
    }

    const response = await prisma.response.create({
      data: {
        formId: req.params.formId,
        clientIp,
        totalTime,
        items: {
          create: items.map((item: any) => ({
            questionId: item.questionId,
            valueText: item.valueText,
            valueChoiceId: item.valueChoiceId,
            valueRating: item.valueRating,
            timeSpent: item.timeSpent,
            changedAnswers: item.changedAnswers
          }))
        }
      },
      include: {
        items: {
          include: {
            question: true
          }
        }
      }
    });

    res.json(response);
  } catch (e) { next(e); }
});

// Get behavioral analysis
router.get('/forms/:formId/behavioral-analysis', async (req, res, next) => {
  try {
    const responses = await prisma.response.findMany({
      where: { formId: req.params.formId },
      include: {
        items: {
          include: {
            question: true
          }
        }
      }
    });

    if (responses.length === 0) {
      return res.json({
        averageTimePerQuestion: {},
        questionChangeRates: {},
        timeDistribution: {},
        completionRates: {}
      });
    }

    const questions = await prisma.question.findMany({
      where: { formId: req.params.formId },
      orderBy: { order: 'asc' }
    });

    // Calculate average time per question
    const averageTimePerQuestion: { [key: string]: number } = {};
    questions.forEach(question => {
      const questionItems = responses.flatMap(r => 
        r.items.filter(item => item.questionId === question.id)
      );
      
      const validTimes = questionItems
        .map(item => item.timeSpent)
        .filter((time): time is number => time !== null && time !== undefined);
      
      if (validTimes.length > 0) {
        averageTimePerQuestion[question.id] = validTimes.reduce((sum, time) => sum + time, 0) / validTimes.length;
      } else {
        averageTimePerQuestion[question.id] = 0;
      }
    });

    // Calculate question change rates
    const questionChangeRates: { [key: string]: number } = {};
    questions.forEach(question => {
      const questionItems = responses.flatMap(r => 
        r.items.filter(item => item.questionId === question.id)
      );
      
      const totalChanges = questionItems.reduce((sum, item) => sum + (item.changedAnswers || 0), 0);
      questionChangeRates[question.id] = questionItems.length > 0 ? totalChanges / questionItems.length : 0;
    });

    // Calculate completion rates
    const completionRates: { [key: string]: number } = {};
    questions.forEach(question => {
      const questionItems = responses.flatMap(r => 
        r.items.filter(item => item.questionId === question.id)
      );
      
      const completedItems = questionItems.filter(item => {
        if (question.type === 'TEXT') return item.valueText && item.valueText.trim() !== '';
        if (question.type === 'MULTIPLE_CHOICE') return item.valueChoiceId;
        if (question.type === 'RATING') return item.valueRating !== null && item.valueRating !== undefined;
        return false;
      });
      
      completionRates[question.id] = responses.length > 0 ? (completedItems.length / responses.length) * 100 : 0;
    });

    // Calculate time distribution
    const timeDistribution: { [key: string]: { min: number; max: number; avg: number } } = {};
    questions.forEach(question => {
      const questionItems = responses.flatMap(r => 
        r.items.filter(item => item.questionId === question.id)
      );
      
      const validTimes = questionItems
        .map(item => item.timeSpent)
        .filter((time): time is number => time !== null && time !== undefined);
      
      if (validTimes.length > 0) {
        timeDistribution[question.id] = {
          min: Math.min(...validTimes),
          max: Math.max(...validTimes),
          avg: validTimes.reduce((sum, time) => sum + time, 0) / validTimes.length
        };
      } else {
        timeDistribution[question.id] = { min: 0, max: 0, avg: 0 };
      }
    });

    res.json({
      averageTimePerQuestion,
      questionChangeRates,
      timeDistribution,
      completionRates
    });
  } catch (e) { next(e); }
});

export default router;
