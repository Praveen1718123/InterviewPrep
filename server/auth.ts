import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import express, { Express } from "express";
import type { Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
// Import storage without hashPassword to avoid circular dependency 
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

// Extend session data to include our custom properties
declare module 'express-session' {
  interface SessionData {
    passport?: { user: number };
    user?: SelectUser;
  }
}

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

// Keep hash function for auth related operations
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  if (!stored || !stored.includes('.')) {
    console.error('Invalid stored password format');
    return false;
  }
  
  const [hashed, salt] = stored.split(".");
  
  if (!hashed || !salt) {
    console.error('Missing hash or salt');
    return false;
  }
  
  try {
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "interview-prep-platform-secret",
    resave: false, // Changed to false to prevent unnecessary session saves
    saveUninitialized: false, // Changed to false to prevent storing empty sessions
    store: storage.sessionStore,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Only use secure in production
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax', // Helps with cross-site request issues
      path: '/', // Ensure cookie is available for all paths
    },
    name: 'switchbee.sid' // Custom name to avoid default "connect.sid"
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          console.log(`Login attempt failed: User ${username} not found`);
          return done(null, false);
        }
        
        if (!user.password) {
          console.error(`User ${username} has no password set`);
          return done(null, false);
        }
        
        const isValid = await comparePasswords(password, user.password);
        
        if (!isValid) {
          console.log(`Login attempt failed: Invalid password for user ${username}`);
          return done(null, false);
        }
        
        return done(null, user);
      } catch (error) {
        console.error('Authentication error:', error);
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  app.post("/api/register", async (req, res, next) => {
    const existingUser = await storage.getUserByUsername(req.body.username);
    if (existingUser) {
      return res.status(400).send("Username already exists");
    }

    const existingEmail = await storage.getUserByEmail(req.body.email);
    if (existingEmail) {
      return res.status(400).send("Email already exists");
    }

    const user = await storage.createUser({
      ...req.body,
      password: await hashPassword(req.body.password),
    });

    req.login(user, (err) => {
      if (err) return next(err);
      res.status(201).json(user);
    });
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    // Add session details to response for debugging
    console.log('Login successful for user:', req.user?.username);
    console.log('Session ID:', req.sessionID);
    console.log('Session data:', req.session);
    
    // Passport already sets up the session correctly, so we can just return the user
    // No need for additional session regeneration which was causing issues
    res.status(200).json({
      user: req.user,
      sessionID: req.sessionID,
      message: 'Login successful'
    });
  });

  app.post("/api/logout", (req, res, next) => {
    // First logout the user (remove from req.user)
    req.logout((err) => {
      if (err) return next(err);
      
      // Then destroy the session completely
      req.session.destroy((err) => {
        if (err) {
          console.error('Error destroying session:', err);
          return res.status(500).json({ message: 'Logout failed' });
        }
        
        // Clear the session cookie
        res.clearCookie('switchbee.sid');
        
        res.status(200).json({ message: 'Logout successful' });
      });
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send();
    res.json(req.user);
  });
  
  // Added for session management help
  app.post("/api/refresh-session", (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: 'Not authenticated' });
    // Touch the session to extend its life
    req.session.touch();
    res.json({ 
      message: 'Session refreshed', 
      user: req.user,
      sessionID: req.sessionID 
    });
  });

  // Middleware to check if user is admin
  const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) return res.status(401).send();
    if (req.user!.role !== "admin") return res.status(403).send();
    next();
  };

  return { isAdmin };
}
