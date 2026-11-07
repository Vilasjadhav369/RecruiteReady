import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import dashboardRouter from './routes/dashboard.js';
import adminRouter from './routes/admin.js';
import aptitudeRouter from './routes/aptitude.js';
import codingRouter from './routes/coding.js';
import companyRouter from './routes/company.js';
import resourceRouter from './routes/resource.js';
import mockTestRouter from './routes/mockTest.js';
import progressRouter from './routes/progress.js';
import reviewRouter from './routes/review.js';
import leaderboardRouter from './routes/leaderboard.js';
import profileRouter from './routes/profile.js';
import notificationRouter from './routes/notification.js';
import searchRouter from './routes/search.js';
import bookmarkRouter from './routes/bookmark.js';
import goalRouter from './routes/goal.js';
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';
import requestTracing from './middleware/requestTracing.js';
import { generalApiLimiter } from './middleware/rateLimiter.js';

const app = express();

// Configure proxy trust based on TRUST_PROXY environment variable (default: 0)
const trustProxyHops =
  process.env.TRUST_PROXY !== undefined && process.env.TRUST_PROXY !== ''
    ? parseInt(process.env.TRUST_PROXY, 10)
    : 0;
app.set('trust proxy', trustProxyHops);

// Request ID and latency tracing
app.use(requestTracing);

// 2. Configure Security Headers via Helmet
app.use(
  helmet({
    contentSecurityPolicy: false, // Prevents breaking Google Identity Services and external dev resources
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    frameguard: { action: 'deny' },
  })
);

// 3. Configure CORS (Cross-Origin Resource Sharing)
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((url) => url.trim()).filter(Boolean)
  : ['http://localhost:5173'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, or same-origin server calls in test)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('CORS policy: Not allowed by CORS'));
    },
    credentials: true,
  })
);

// 4. Configure JSON & URL-encoded parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 5. NoSQL Injection Protection: recursively sanitize object keys starting with '$' or containing '.'
const sanitizeMongoQuery = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete obj[key];
    } else if (typeof obj[key] === 'object') {
      sanitizeMongoQuery(obj[key]);
    }
  }
  return obj;
};

app.use((req, res, next) => {
  if (req.body) sanitizeMongoQuery(req.body);
  if (req.query) sanitizeMongoQuery(req.query);
  if (req.params) sanitizeMongoQuery(req.params);
  next();
});

// Rate limit unauthenticated general API requests (authenticated requests are limited in protect)
app.use('/api', (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return next();
  }
  return generalApiLimiter(req, res, next);
});

// 6. Register routes
app.use('/api', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/profile', profileRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/admin', adminRouter);
app.use('/api/aptitude', aptitudeRouter);
app.use('/api/coding', codingRouter);
app.use('/api/companies', companyRouter);
app.use('/api/resources', resourceRouter);
app.use('/api/mock-tests', mockTestRouter);
app.use('/api/progress', progressRouter);
app.use('/api/reviews', reviewRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/search', searchRouter);
app.use('/api/bookmarks', bookmarkRouter);
app.use('/api/goals', goalRouter);

// 7. Register 404 and global error handlers
app.use(notFound);
app.use(errorHandler);

export default app;
