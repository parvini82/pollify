import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

export const createApp = () => {
  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(morgan('dev'));

  // health
  app.get('/health', (_req, res) => res.json({ ok: true }));

  // routes
  app.use('/api', require('./routes/forms').default);
  app.use('/api', require('./routes/responses').default);
  app.use('/api', require('./routes/questions').default);
  app.use('/api', require('./routes/choices').default);


  // error handler
  app.use((err: any, _req: any, res: any, _next: any) => {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
  });

  return app;
};
