import express from "express";
import cors from "cors";
import { createServer } from "http";
import Stripe from "stripe";
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "../shared/schema.js";
import session from "express-session";
import ConnectPgSimple from "connect-pg-simple";
import bcryptjs from "bcryptjs";
import multer from "multer";
import { DocumentProcessorServiceClient } from '@google-cloud/documentai';

// Initialize app
const app = express();

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

// Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-07-30.basil",
});

// Session configuration
const PgSession = ConnectPgSimple(session);
app.use(session({
  store: new PgSession({
    pool: pool,
    tableName: 'session',
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
  }
}));

// File upload configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// Auth middleware
function isAuthenticated(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).json({ message: 'Unauthorized' });
}

function getUserId(req) {
  return req.session?.userId;
}

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// Import all routes dynamically
(async () => {
  try {
    // Import routes from the server directory
    const { registerRoutes } = await import("../server/routes.js");
    await registerRoutes(app);
    
    console.log('✅ Routes registered successfully for serverless deployment');
  } catch (error) {
    console.error('❌ Error registering routes:', error);
  }
})();

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

// Export for Vercel serverless
export default app;