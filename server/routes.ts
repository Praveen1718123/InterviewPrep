import { Express, Response as ExpressResponse } from "express";
import { createServer, type Server } from "http";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { setupAuth } from "./auth";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes and get middleware
  const { isAdmin } = setupAuth(app);

  // Helper to handle Zod validation errors
  const handleZodError = (error: unknown, res: ExpressResponse) => {
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({
        message: validationError.message,
      });
    }
    throw error;
  };

  // Initialize storage (create tables, seed data if needed)
  await storage.initializeStorage();

  // API routes
  // Add your routes here...

  const httpServer = createServer(app);
  return httpServer;
}