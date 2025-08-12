import { Router } from 'express';
import { PrismaClient, QuestionType } from '@prisma/client';
import { z } from 'zod';
import { authenticateToken, requireUser, optionalAuth } from '../middleware/auth';

const prisma = new PrismaClient();
const router = Router();

const formSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  isPublic: z.boolean().optional().default(true),
  maxResponses: z.number().optional(),
  allowMultipleResponses: z.boolean().optional().default(false),
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

// Create form (authenticated users only)
router.post('/forms', authenticateToken, requireUser, async (req, res, next) => {
  try {
    const data = formSchema.parse(req.body);
    const form = await prisma.form.create({
      data: { ...data, createdById: req.user!.id },
    });
    res.json(form);
  } catch (e) { next(e); }
});

// Get all forms (user sees their own + public forms)
router.get('/forms', optionalAuth, async (req, res, next) => {
  try {
    let forms;
    
    if (req.user) {
      // Authenticated user: get their forms + public forms
      forms = await prisma.form.findMany({
        where: {
          OR: [
            { createdById: req.user.id },
            { isPublic: true }
          ]
        },
        include: { 
          _count: { select: { responses: true } },
          createdBy: { select: { name: true, email: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      // Anonymous user: only public forms
      forms = await prisma.form.findMany({
        where: { isPublic: true },
        include: { 
          _count: { select: { responses: true } },
          createdBy: { select: { name: true, email: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
    }
    
    res.json(forms);
  } catch (e) { next(e); }
});

// Get form by ID (with access control)
router.get('/forms/:formId', optionalAuth, async (req, res, next) => {
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
        _count: { select: { responses: true } },
        createdBy: { select: { name: true, email: true } }
      },
    });
    
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    // Check access permissions
    if (!form.isPublic && (!req.user || form.createdById !== req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(form);
  } catch (e) { next(e); }
});

// Update form (owner only)
router.patch('/forms/:formId', authenticateToken, requireUser, async (req, res, next) => {
  try {
    const data = formSchema.partial().parse(req.body);
    
    // Check if user owns the form
    const existingForm = await prisma.form.findUnique({
      where: { id: req.params.formId }
    });
    
    if (!existingForm) {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    if (existingForm.createdById !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const form = await prisma.form.update({
      where: { id: req.params.formId },
      data,
    });
    res.json(form);
  } catch (e) { next(e); }
});

// Delete form (owner only)
router.delete('/forms/:formId', authenticateToken, requireUser, async (req, res, next) => {
  try {
    // Check if user owns the form
    const existingForm = await prisma.form.findUnique({
      where: { id: req.params.formId }
    });
    
    if (!existingForm) {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    if (existingForm.createdById !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await prisma.form.delete({
      where: { id: req.params.formId }
    });
    
    res.json({ message: 'Form deleted successfully' });
  } catch (e) { next(e); }
});

// Add question to form (owner only)
router.post('/forms/:formId/questions', authenticateToken, requireUser, async (req, res, next) => {
  try {
    const data = questionSchema.parse(req.body);
    
    // Check if user owns the form
    const existingForm = await prisma.form.findUnique({
      where: { id: req.params.formId }
    });
    
    if (!existingForm) {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    if (existingForm.createdById !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const question = await prisma.question.create({
      data: { ...data, formId: req.params.formId },
      include: { choices: true, conditionalLogic: true }
    });
    res.json(question);
  } catch (e) { next(e); }
});

// Add conditional logic to question (owner only)
router.post('/questions/:questionId/conditional-logic', authenticateToken, requireUser, async (req, res, next) => {
  try {
    const data = conditionalLogicSchema.parse(req.body);
    
    // Check if user owns the question's form
    const question = await prisma.question.findUnique({
      where: { id: req.params.questionId },
      include: { form: true }
    });
    
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }
    
    if (question.form.createdById !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const conditionalLogic = await prisma.conditionalLogic.create({
      data: { ...data, questionId: req.params.questionId },
    });
    res.json(conditionalLogic);
  } catch (e) { next(e); }
});

// Update conditional logic (owner only)
router.patch('/conditional-logic/:logicId', authenticateToken, requireUser, async (req, res, next) => {
  try {
    const data = conditionalLogicSchema.partial().parse(req.body);
    
    // Check if user owns the conditional logic's question's form
    const conditionalLogic = await prisma.conditionalLogic.findUnique({
      where: { id: req.params.logicId },
      include: { question: { include: { form: true } } }
    });
    
    if (!conditionalLogic) {
      return res.status(404).json({ error: 'Conditional logic not found' });
    }
    
    if (conditionalLogic.question.form.createdById !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const updatedLogic = await prisma.conditionalLogic.update({
      where: { id: req.params.logicId },
      data,
    });
    res.json(updatedLogic);
  } catch (e) { next(e); }
});

// Get form responses (owner only)
router.get('/forms/:formId/responses', authenticateToken, requireUser, async (req, res, next) => {
  try {
    // Check if user owns the form
    const existingForm = await prisma.form.findUnique({
      where: { id: req.params.formId }
    });
    
    if (!existingForm) {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    if (existingForm.createdById !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const responses = await prisma.response.findMany({
      where: { formId: req.params.formId },
      include: {
        items: {
          include: {
            question: {
              include: { choices: true }
            }
          }
        },
        submittedBy: {
          select: { name: true, email: true }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });
    res.json(responses);
  } catch (e) { next(e); }
});

// Check if user has already responded
router.get('/forms/:formId/responses/check', optionalAuth, async (req, res, next) => {
  try {
    const { clientIp } = req.query;
    if (!clientIp) {
      return res.status(400).json({ error: 'Client IP required' });
    }

    let existingResponse = null;

    // Check by IP address
    existingResponse = await prisma.response.findFirst({
      where: { 
        formId: req.params.formId,
        clientIp: clientIp as string
      }
    });

    // If user is authenticated, also check by user ID
    if (req.user && !existingResponse) {
      existingResponse = await prisma.response.findFirst({
        where: { 
          formId: req.params.formId,
          submittedById: req.user.id
        }
      });
    }

    res.json({ exists: !!existingResponse });
  } catch (e) { next(e); }
});

// Submit response (with user authentication if available)
router.post('/forms/:formId/responses', optionalAuth, async (req, res, next) => {
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
    
    if (!form.isPublic && (!req.user || form.createdById !== req.user.id)) {
      return res.status(403).json({ error: 'Form is not public' });
    }
    
    // Check max responses limit
    if (form.maxResponses && form._count.responses >= form.maxResponses) {
      return res.status(429).json({ error: 'Form has reached maximum responses' });
    }
    
    // Check if user has already responded
    if (!form.allowMultipleResponses) {
      let existingResponse = null;
      
      // Check by IP address
      if (clientIp) {
        existingResponse = await prisma.response.findFirst({
          where: { 
            formId: req.params.formId,
            clientIp
          }
        });
      }
      
      // If user is authenticated, also check by user ID
      if (req.user && !existingResponse) {
        existingResponse = await prisma.response.findFirst({
          where: { 
            formId: req.params.formId,
            submittedById: req.user.id
          }
        });
      }
      
      if (existingResponse) {
        return res.status(409).json({ error: 'You have already submitted a response' });
      }
    }

    const response = await prisma.response.create({
      data: {
        formId: req.params.formId,
        submittedById: req.user?.id,
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

// Get behavioral analysis (owner only)
router.get('/forms/:formId/behavioral-analysis', authenticateToken, requireUser, async (req, res, next) => {
  try {
    // Check if user owns the form
    const existingForm = await prisma.form.findUnique({
      where: { id: req.params.formId }
    });
    
    if (!existingForm) {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    if (existingForm.createdById !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
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
