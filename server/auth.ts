import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import express, { Express } from "express";
import type { Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
// Import storage without hashPassword to avoid circular dependency 
import { storage } from "./storage";
import { User, User as SelectUser } from "@shared/schema";

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
  const inProduction = process.env.NODE_ENV === 'production';
  const isReplit = !!process.env.REPL_ID;
  
  // Determine cookie settings based on environment - using cross-origin friendly settings
  const cookieSettings = {
    httpOnly: true,
    secure: true, // Must be true when sameSite is 'none', even in development
    // Extensive expiration for debugging
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days for login sessions
    sameSite: 'none' as 'lax' | 'strict' | 'none', // For cross-origin requests
    path: '/'
  };
  
  // Session configuration optimized for cross-domain support
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "interview-prep-platform-secret",
    resave: true,
    saveUninitialized: false, // Only save if we have data
    rolling: true, // Reset expiration time with each request
    store: storage.sessionStore,
    name: 'switchbee.sid', // Custom cookie name
    proxy: true, // Trust the reverse proxy when setting secure cookies
    cookie: cookieSettings
  };
  
  console.log("Session store initialized:", !!storage.sessionStore);

  app.set("trust proxy", 1);
  
  // Debug middleware to log cookies
  app.use((req, res, next) => {
    console.log('Request cookies:', req.headers.cookie);
    next();
  });
  
  app.use(session(sessionSettings));
  
  // Debug middleware to log session after session middleware
  app.use((req: any, res, next) => {
    console.log('Session ID after session middleware:', req.sessionID);
    console.log('Session data:', req.session);
    next();
  });
  
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Debug middleware to log user after passport middleware
  app.use((req: any, res, next) => {
    console.log('User after passport middleware:', req.user ? `ID: ${req.user.id}, Username: ${req.user.username}` : 'Not authenticated');
    next();
  });

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log(`Login attempt for user: ${username}`);
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
        
        console.log(`Login successful for user: ${username}, ID: ${user.id}, Role: ${user.role}`);
        return done(null, user);
      } catch (error) {
        console.error('Authentication error:', error);
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    console.log(`Serializing user ID: ${user.id}`);
    done(null, user.id);
  });
  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log(`Deserializing user ID: ${id}`);
      const user = await storage.getUser(id);
      if (!user) {
        console.error(`User with ID ${id} not found during deserialization`);
        return done(null, false);
      }
      console.log(`User deserialized successfully: ${user.username}, Role: ${user.role}`);
      done(null, user);
    } catch (error) {
      console.error('Error deserializing user:', error);
      done(error, null);
    }
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

  app.post("/api/login", (req, res, next) => {
    console.log("Login attempt with body:", { username: req.body.username, passwordLength: req.body.password?.length });
    
    passport.authenticate("local", (err: any, user: User | undefined, info: any) => {
      if (err) {
        console.error("Authentication error:", err);
        return next(err);
      }
      
      if (!user) {
        console.log("Login failed: Invalid credentials");
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Log in the user manually
      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error("Login error:", loginErr);
          return next(loginErr);
        }
        
        console.log(`POST /api/login - Login successful, Session ID: ${req.sessionID}`);
        console.log(`POST /api/login - User in request: ${user.username}, ID: ${user.id}, Role: ${user.role}`);
        
        // Add timestamp for debugging
        const loginTime = new Date().toISOString();
        (req.session as any).loginTime = loginTime;
        
        // Save the session explicitly to ensure it's properly stored
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Error saving session:", saveErr);
            return res.status(500).json({ message: "Failed to create session" });
          }
          
          console.log("Session saved successfully with ID:", req.sessionID);
          
          // Enhanced logging
          console.log("Session data:", req.session);
          
          // Check if the session store is working by fetching the session directly
          try {
            const store = storage.sessionStore as any;
            if (store && typeof store.get === 'function') {
              store.get(req.sessionID, (err: any, session: any) => {
                if (err) {
                  console.error("Error retrieving session from store:", err);
                } else if (!session) {
                  console.error("Session not found in store immediately after save!");
                } else {
                  console.log("Session verified in store:", session);
                }
              });
            }
          } catch (storeErr) {
            console.error("Error checking session store:", storeErr);
          }
          
          // Return user data with session ID for debugging
          res.status(200).json({
            id: user.id,
            username: user.username,
            role: user.role,
            email: user.email,
            fullName: user.fullName,
            // Debug information
            _debug: {
              sessionId: req.sessionID,
              loginTime
            }
          });
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.status(200).send();
    });
  });

  app.get("/api/user", (req, res) => {
    console.log("GET /api/user - Session ID:", req.sessionID);
    console.log("GET /api/user - Is authenticated:", req.isAuthenticated());
    console.log("GET /api/user - Session data:", req.session);
    console.log("GET /api/user - Cookies:", req.headers.cookie);
    
    // For debugging - try to look up the session manually
    try {
      const store = storage.sessionStore as any;
      if (store && typeof store.get === 'function') {
        store.get(req.sessionID, (err: any, session: any) => {
          if (err) {
            console.error("Error retrieving session from store during /api/user:", err);
          } else if (!session) {
            console.error("Session not found in store during /api/user call!");
          } else {
            console.log("Session retrieved from store during /api/user:", session);
          }
        });
      }
    } catch (storeErr) {
      console.error("Error checking session store during /api/user:", storeErr);
    }
    
    if (!req.isAuthenticated()) {
      console.log("GET /api/user - Authentication failed");
      return res.status(401).json({ 
        error: "Not authenticated",
        _debug: {
          sessionId: req.sessionID,
          hasSession: !!req.session,
          time: new Date().toISOString()
        }
      });
    }
    
    console.log(`GET /api/user - User: ${req.user!.username}, ID: ${req.user!.id}, Role: ${req.user!.role}`);
    
    // Return the user data with some debug info
    res.json({
      ...req.user,
      _debug: {
        sessionId: req.sessionID,
        time: new Date().toISOString()
      }
    });
  });

  // Middleware to check if user is admin
  const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    console.log(`isAdmin check - Auth status: ${req.isAuthenticated()}`);
    if (!req.isAuthenticated()) {
      console.log('isAdmin middleware: User not authenticated');
      return res.status(401).send();
    }
    console.log(`isAdmin check - User role: ${req.user!.role}`);
    if (req.user!.role !== "admin") {
      console.log(`isAdmin middleware: User ${req.user!.username} is not an admin`);
      return res.status(403).send();
    }
    console.log(`Admin access granted to: ${req.user!.username}`);
    next();
  };

  return { isAdmin };
}
