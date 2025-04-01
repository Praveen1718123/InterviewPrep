import type { Express, Response as ExpressResponse } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { 
  insertAssessmentSchema, 
  insertCandidateAssessmentSchema, 
  mcqResponseSchema,
  fillInBlanksResponseSchema,
  videoResponseSchema 
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize storage (create tables and seed data if needed)
  await storage.initializeStorage();
  
  // Add test route to verify server is responding
  app.get('/api/test', (req, res) => {
    res.json({ status: 'ok', message: 'API is working' });
  });
  
  // Sets up /api/register, /api/login, /api/logout, /api/user
  const { isAdmin } = setupAuth(app);

  // Error handler for zod validation
  const handleZodError = (error: unknown, res: ExpressResponse) => {
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({ message: validationError.message });
    }
    return res.status(500).json({ message: "Internal server error" });
  };

  // Admin routes
  app.get("/api/admin/candidates", isAdmin, async (req, res) => {
    try {
      const candidates = await storage.getCandidates();
      res.json(candidates);
    } catch (error) {
      res.status(500).json({ message: "Error fetching candidates" });
    }
  });

  app.get("/api/admin/assessments", isAdmin, async (req, res) => {
    try {
      const assessments = await storage.getAssessments();
      res.json(assessments);
    } catch (error) {
      res.status(500).json({ message: "Error fetching assessments" });
    }
  });

  app.post("/api/admin/assessments", isAdmin, async (req, res) => {
    try {
      // If we're here, isAdmin middleware has already confirmed req.user exists
      const assessmentData = insertAssessmentSchema.parse({
        ...req.body,
        createdBy: req.user!.id
      });
      const assessment = await storage.createAssessment(assessmentData);
      res.status(201).json(assessment);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.get("/api/admin/assessments/:id", isAdmin, async (req, res) => {
    try {
      const assessmentId = parseInt(req.params.id);
      const assessment = await storage.getAssessment(assessmentId);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }
      res.json(assessment);
    } catch (error) {
      res.status(500).json({ message: "Error fetching assessment" });
    }
  });

  app.post("/api/admin/assign-assessment", isAdmin, async (req, res) => {
    try {
      const assignmentData = insertCandidateAssessmentSchema.parse(req.body);
      const assignment = await storage.assignAssessment(assignmentData);
      res.status(201).json(assignment);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.post("/api/admin/provide-feedback", isAdmin, async (req, res) => {
    try {
      const { candidateAssessmentId, feedback, score } = req.body;
      const updated = await storage.provideFeedback(candidateAssessmentId, feedback, score);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Error providing feedback" });
    }
  });

  // Candidate routes
  app.get("/api/candidate/assessments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const candidateId = req.user!.id;
      const assessments = await storage.getCandidateAssessments(candidateId);
      res.json(assessments);
    } catch (error) {
      res.status(500).json({ message: "Error fetching assessments" });
    }
  });

  app.get("/api/candidate/assessment/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const assessmentId = parseInt(req.params.id);
      const candidateId = req.user!.id;
      const assignment = await storage.getCandidateAssignment(candidateId, assessmentId);
      if (!assignment) {
        return res.status(404).json({ message: "Assessment not found or not assigned" });
      }
      res.json(assignment);
    } catch (error) {
      res.status(500).json({ message: "Error fetching assessment" });
    }
  });

  app.post("/api/candidate/start-assessment", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { candidateAssessmentId } = req.body;
      const candidateId = req.user!.id;
      const updated = await storage.startAssessment(candidateAssessmentId, candidateId);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Error starting assessment" });
    }
  });

  app.post("/api/candidate/submit-mcq", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { candidateAssessmentId, responses } = req.body;
      const candidateId = req.user!.id;
      
      // Validate responses
      for (const response of responses) {
        mcqResponseSchema.parse(response);
      }
      
      const updated = await storage.submitMCQResponses(candidateAssessmentId, candidateId, responses);
      res.json(updated);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.post("/api/candidate/submit-fill-in-blanks", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { candidateAssessmentId, responses } = req.body;
      const candidateId = req.user!.id;
      
      // Validate responses
      for (const response of responses) {
        fillInBlanksResponseSchema.parse(response);
      }
      
      const updated = await storage.submitFillInBlanksResponses(candidateAssessmentId, candidateId, responses);
      res.json(updated);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.post("/api/candidate/submit-video", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { candidateAssessmentId, responses } = req.body;
      const candidateId = req.user!.id;
      
      // Validate responses
      for (const response of responses) {
        videoResponseSchema.parse(response);
      }
      
      const updated = await storage.submitVideoResponses(candidateAssessmentId, candidateId, responses);
      res.json(updated);
    } catch (error) {
      handleZodError(error, res);
    }
  });
  
  // Get completed assessments for skill analysis
  app.get("/api/candidate/assessments/completed", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const candidateId = req.user!.id;
      const assessments = await storage.getCandidateAssessments(candidateId);
      
      // Filter to include only completed or reviewed assessments
      const completedAssessments = assessments.filter(
        (assessment) => assessment.status === "completed" || assessment.status === "reviewed"
      );
      
      res.json(completedAssessments);
    } catch (error) {
      res.status(500).json({ message: "Error fetching completed assessments" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
