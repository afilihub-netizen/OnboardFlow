import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import bcrypt from "bcryptjs";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import type { User } from "@shared/schema";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  return session({
    secret: process.env.SESSION_SECRET || 'replit-session-secret-' + Math.random().toString(36).substring(2, 15),
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Local Strategy (Email/Password)
  passport.use(new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password'
    },
    async (email: string, password: string, done) => {
      try {
        const user = await storage.getUserByEmail(email);
        
        if (!user) {
          return done(null, false, { message: 'Email não encontrado' });
        }

        if (!user.passwordHash) {
          return done(null, false, { message: 'Esta conta foi criada com Google. Use o login do Google.' });
        }

        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        
        if (!isValidPassword) {
          return done(null, false, { message: 'Senha incorreta' });
        }

        if (!user.emailVerified) {
          return done(null, false, { message: 'Por favor, verifique seu email antes de fazer login' });
        }

        // Update last login
        await storage.updateUserLastLogin(user.id);
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  ));

  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/api/auth/google/callback"
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user exists with this Google ID
          let user = await storage.getUserByGoogleId(profile.id);
          
          if (user) {
            // Update last login
            await storage.updateUserLastLogin(user.id);
            return done(null, user);
          }

          // Check if user exists with this email
          const email = profile.emails?.[0]?.value;
          if (email) {
            user = await storage.getUserByEmail(email);
            
            if (user) {
              // Link Google account to existing user
              await storage.linkGoogleAccount(user.id, profile.id);
              await storage.updateUserLastLogin(user.id);
              return done(null, user);
            }
          }

          // Create new user
          const newUser = await storage.createUserWithGoogle({
            googleId: profile.id,
            email: email || '',
            firstName: profile.name?.givenName || '',
            lastName: profile.name?.familyName || '',
            profileImageUrl: profile.photos?.[0]?.value || '',
            emailVerified: true,
            authProvider: 'google'
          });

          return done(null, newUser);
        } catch (error) {
          return done(error);
        }
      }
    ));
  }

  // Serialize/Deserialize user
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Auth routes
  
  // Register with email/password
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName, accountType } = req.body;

      if (!email || !password || !firstName) {
        return res.status(400).json({ 
          message: "Email, senha e nome são obrigatórios" 
        });
      }

      // Validate account type
      const validAccountTypes = ['individual', 'family', 'business'];
      if (accountType && !validAccountTypes.includes(accountType)) {
        return res.status(400).json({ 
          message: "Tipo de conta inválido" 
        });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ 
          message: "Este email já está cadastrado" 
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create user
      const user = await storage.createUser({
        email,
        passwordHash,
        firstName,
        lastName,
        authProvider: 'email',
        emailVerified: false,
        accountType: accountType || 'individual'
      });

      // TODO: Send verification email
      
      res.status(201).json({ 
        message: "Conta criada com sucesso! Verifique seu email para ativar a conta.",
        userId: user.id 
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Login with email/password
  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate('local', (err: any, user: User | false, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Erro interno do servidor" });
      }
      
      if (!user) {
        return res.status(401).json({ message: info?.message || "Credenciais inválidas" });
      }

      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Erro ao fazer login" });
        }
        
        return res.json({ 
          message: "Login realizado com sucesso",
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            profileImageUrl: user.profileImageUrl,
            accountType: user.accountType
          }
        });
      });
    })(req, res, next);
  });

  // Google OAuth login
  app.get("/api/auth/google", 
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  app.get("/api/auth/google/callback",
    passport.authenticate('google', { failureRedirect: '/login?error=google_auth_failed' }),
    (req, res) => {
      // Successful authentication
      res.redirect('/');
    }
  );

  // Get current user
  app.get("/api/auth/user", (req, res) => {
    if (req.isAuthenticated() && req.user) {
      res.json(req.user);
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Erro ao fazer logout" });
      }
      res.json({ message: "Logout realizado com sucesso" });
    });
  });

  // Forgot password
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email é obrigatório" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists
        return res.json({ message: "Se o email existir, você receberá instruções para redefinir a senha" });
      }

      if (user.authProvider !== 'email') {
        return res.status(400).json({ 
          message: "Esta conta foi criada com Google. Use o login do Google." 
        });
      }

      // Generate reset token (implement token generation and email sending)
      // TODO: Implement password reset token and email sending
      
      res.json({ message: "Se o email existir, você receberá instruções para redefinir a senha" });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};