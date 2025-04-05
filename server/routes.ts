import type { Express, Request, Response as ExpressResponse } from "express";
import { createServer, type Server } from "http";
import { setupAuth, hashPassword, comparePasswords } from "./auth";
import { storage, hashPasswordLocal } from "./storage";
import { 
  insertAssessmentSchema, 
  insertCandidateAssessmentSchema, 
  mcqResponseSchema,
  fillInBlanksResponseSchema,
  videoResponseSchema,
  insertUserSchema
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { pool } from "./db";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize storage (create tables and seed data if needed)
  await storage.initializeStorage();
  
  // Add test route to verify server is responding
  app.get('/api/test', (req, res) => {
    res.json({ status: 'ok', message: 'API is working' });
  });
  
  // Debug endpoint to check session and database
  app.get('/api/debug/session', async (req: Request, res) => {
    try {
      // Get session data from database
      const result = await pool.query(
        'SELECT sid, sess, expire FROM session WHERE sid = $1',
        [req.sessionID]
      );
      
      const sessionData = result.rows.length > 0 ? result.rows[0] : null;
      const sessionDbData = sessionData ? JSON.parse(sessionData.sess) : null;
      
      // Get all active sessions for debugging
      const allSessionsResult = await pool.query(
        'SELECT sid, sess, expire FROM session LIMIT 10'
      );
      
      const allSessions = allSessionsResult.rows.map(row => ({
        sid: row.sid,
        expire: row.expire,
        data: JSON.parse(row.sess)
      }));
      
      res.json({
        sessionID: req.sessionID,
        isAuthenticated: req.isAuthenticated(),
        user: req.user || null,
        cookies: req.headers.cookie,
        sessionInDb: sessionData !== null,
        sessionDbData,
        allSessions
      });
    } catch (error) {
      console.error('Error retrieving session debug info:', error);
      res.status(500).json({ error: 'Failed to retrieve debug information' });
    }
  });
  
  // Simple ping endpoint to test session persistence
  app.get('/api/ping', (req, res) => {
    // Increment a counter in the session to prove it's persisting
    const sessionData = req.session as any; // Use any to bypass TypeScript for session data
    if (!sessionData.pingCount) {
      sessionData.pingCount = 0;
    }
    sessionData.pingCount++;
    
    // Save the session explicitly
    req.session.save((err) => {
      if (err) {
        console.error('Error saving ping count:', err);
        return res.status(500).json({ error: 'Failed to save session' });
      }
      
      res.json({
        pong: true,
        pingCount: sessionData.pingCount,
        sessionID: req.sessionID,
        isAuthenticated: req.isAuthenticated(),
        user: req.user || null
      });
    });
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
  
  // Get candidate by ID
  app.get("/api/admin/candidates/:id", isAdmin, async (req, res) => {
    try {
      const candidateId = parseInt(req.params.id);
      if (isNaN(candidateId)) {
        return res.status(400).json({ message: "Invalid candidate ID" });
      }
      
      const candidate = await storage.getUser(candidateId);
      if (!candidate) {
        return res.status(404).json({ message: "Candidate not found" });
      }
      
      const { password, ...candidateWithoutPassword } = candidate;
      res.json(candidateWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Error fetching candidate" });
    }
  });
  
  // Update candidate
  app.patch("/api/admin/candidates/:id", isAdmin, async (req, res) => {
    try {
      const candidateId = parseInt(req.params.id);
      if (isNaN(candidateId)) {
        return res.status(400).json({ message: "Invalid candidate ID" });
      }
      
      // Get existing candidate
      const existingCandidate = await storage.getUser(candidateId);
      if (!existingCandidate) {
        return res.status(404).json({ message: "Candidate not found" });
      }
      
      // If this is not a candidate account, prevent modification
      if (existingCandidate.role !== "candidate") {
        return res.status(403).json({ message: "Can only modify candidate accounts" });
      }
      
      const { username, email, password, ...updateData } = req.body;
      
      // Check for username uniqueness if it's being changed
      if (username && username !== existingCandidate.username) {
        const existingUserWithUsername = await storage.getUserByUsername(username);
        if (existingUserWithUsername && existingUserWithUsername.id !== candidateId) {
          return res.status(400).json({ message: "Username already exists" });
        }
      }
      
      // Check for email uniqueness if it's being changed
      if (email && email !== existingCandidate.email) {
        const existingUserWithEmail = await storage.getUserByEmail(email);
        if (existingUserWithEmail && existingUserWithEmail.id !== candidateId) {
          return res.status(400).json({ message: "Email already exists" });
        }
      }
      
      // If password is being updated, hash it
      let hashedPassword;
      if (password) {
        hashedPassword = await hashPasswordLocal(password);
      }
      
      // Update user
      const updatedUser = await storage.updateUser(candidateId, {
        username: username || existingCandidate.username,
        email: email || existingCandidate.email,
        password: hashedPassword || existingCandidate.password,
        ...updateData,
      });
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = updatedUser;
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating candidate:", error);
      res.status(500).json({ message: "Error updating candidate" });
    }
  });
  
  // Delete candidate
  app.delete("/api/admin/candidates/:id", isAdmin, async (req, res) => {
    try {
      const candidateId = parseInt(req.params.id);
      if (isNaN(candidateId)) {
        return res.status(400).json({ message: "Invalid candidate ID" });
      }
      
      // Get existing candidate
      const existingCandidate = await storage.getUser(candidateId);
      if (!existingCandidate) {
        return res.status(404).json({ message: "Candidate not found" });
      }
      
      // If this is not a candidate account, prevent deletion
      if (existingCandidate.role !== "candidate") {
        return res.status(403).json({ message: "Can only delete candidate accounts" });
      }
      
      // Delete the candidate
      await storage.deleteUser(candidateId);
      
      res.status(200).json({ message: "Candidate deleted successfully" });
    } catch (error) {
      console.error("Error deleting candidate:", error);
      res.status(500).json({ message: "Error deleting candidate" });
    }
  });
  
  // Get candidate assessments
  app.get("/api/admin/candidates/:id/assessments", isAdmin, async (req, res) => {
    try {
      const candidateId = parseInt(req.params.id);
      if (isNaN(candidateId)) {
        return res.status(400).json({ message: "Invalid candidate ID" });
      }
      
      const candidate = await storage.getUser(candidateId);
      if (!candidate) {
        return res.status(404).json({ message: "Candidate not found" });
      }
      
      const assessments = await storage.getCandidateAssessments(candidateId);
      res.json(assessments);
    } catch (error) {
      res.status(500).json({ message: "Error fetching candidate assessments" });
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
        createdBy: req.user!.id,
        questions: [] // Initialize questions as an empty array
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
      
      // Add default questions array if not present
      if (!assessment.questions) {
        assessment.questions = [];
      }
      
      console.log("Returning assessment:", assessment);
      res.json(assessment);
    } catch (error) {
      console.error("Error fetching assessment:", error);
      res.status(500).json({ message: "Error fetching assessment" });
    }
  });

  // Add question to assessment
  app.post("/api/admin/assessments/:id/questions", isAdmin, async (req, res) => {
    try {
      const assessmentId = parseInt(req.params.id);
      const assessment = await storage.getAssessment(assessmentId);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }

      // Ensure questions is initialized as an array
      const currentQuestions = Array.isArray(assessment.questions) ? assessment.questions : [];
      
      const questions = [...currentQuestions, { ...req.body, id: crypto.randomUUID() }];
      const updated = await storage.updateAssessment(assessmentId, { questions });
      res.json(updated);
    } catch (error) {
      console.error("Error adding question:", error);
      res.status(500).json({ message: "Error adding question" });
    }
  });

  // Update question
  app.put("/api/admin/assessments/:id/questions/:questionId", isAdmin, async (req, res) => {
    try {
      const assessmentId = parseInt(req.params.id);
      const questionId = req.params.questionId;
      
      const assessment = await storage.getAssessment(assessmentId);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }
      
      // Ensure questions is initialized as an array
      const currentQuestions = Array.isArray(assessment.questions) ? assessment.questions : [];
      
      const questions = currentQuestions.map((q: any) => 
        q.id === questionId ? { ...req.body, id: questionId } : q
      );
      
      const updated = await storage.updateAssessment(assessmentId, { questions });
      res.json(updated);
    } catch (error) {
      console.error("Error updating question:", error);
      res.status(500).json({ message: "Error updating question" });
    }
  });

  // Delete question
  app.delete("/api/admin/assessments/:id/questions/:questionId", isAdmin, async (req, res) => {
    try {
      const assessmentId = parseInt(req.params.id);
      const questionId = req.params.questionId;
      
      const assessment = await storage.getAssessment(assessmentId);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }
      
      // Ensure questions is initialized as an array
      const currentQuestions = Array.isArray(assessment.questions) ? assessment.questions : [];
      
      const questions = currentQuestions.filter((q: any) => q.id !== questionId);
      const updated = await storage.updateAssessment(assessmentId, { questions });
      res.json(updated);
    } catch (error) {
      console.error("Error deleting question:", error);
      res.status(500).json({ message: "Error deleting question" });
    }
  });

  // Reorder questions
  app.put("/api/admin/assessments/:id/questions/reorder", isAdmin, async (req, res) => {
    try {
      const assessmentId = parseInt(req.params.id);
      const { questions } = req.body;
      
      if (!Array.isArray(questions)) {
        return res.status(400).json({ message: "Questions must be an array" });
      }
      
      const assessment = await storage.getAssessment(assessmentId);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }

      const updated = await storage.updateAssessment(assessmentId, { questions });
      res.json(updated);
    } catch (error) {
      console.error("Error reordering questions:", error);
      res.status(500).json({ message: "Error reordering questions" });
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
  
  // Bulk assessment assignment endpoint
  app.post("/api/admin/bulk-assign-assessment", isAdmin, async (req, res) => {
    try {
      const { candidateIds, assessmentId, scheduledFor } = req.body;
      
      if (!Array.isArray(candidateIds) || candidateIds.length === 0) {
        return res.status(400).json({ message: "candidateIds must be a non-empty array" });
      }
      
      if (!assessmentId) {
        return res.status(400).json({ message: "assessmentId is required" });
      }
      
      const results = [];
      const errors = [];
      
      // Process each candidate assignment
      for (const candidateId of candidateIds) {
        try {
          const assignmentData = insertCandidateAssessmentSchema.parse({
            candidateId,
            assessmentId,
            scheduledFor: scheduledFor || null,
            status: "pending"
          });
          
          const assignment = await storage.assignAssessment(assignmentData);
          results.push(assignment);
        } catch (error) {
          errors.push({ candidateId, error: error instanceof Error ? error.message : String(error) });
        }
      }
      
      res.status(201).json({ 
        success: results.length > 0,
        assigned: results.length,
        failed: errors.length, 
        results,
        errors 
      });
    } catch (error) {
      res.status(500).json({ message: "Error processing bulk assessment assignment" });
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
  
  // Create candidate endpoint
  app.post("/api/admin/candidates", isAdmin, async (req, res) => {
    try {
      // Validate request data
      const userData = insertUserSchema.parse({
        ...req.body,
        role: "candidate" // Force role to be candidate
      });
      
      // Check if username or email already exists
      const existingUserWithUsername = await storage.getUserByUsername(userData.username);
      if (existingUserWithUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const existingUserWithEmail = await storage.getUserByEmail(userData.email);
      if (existingUserWithEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      // Hash the password before creating user
      const hashedPassword = await hashPassword(userData.password);
      
      // Create the user with hashed password
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword
      });
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      handleZodError(error, res);
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

  // Batch management endpoints
  app.get("/api/admin/batches", isAdmin, async (req, res) => {
    try {
      const batches = await storage.getBatches();
      res.json(batches);
    } catch (error) {
      res.status(500).json({ message: "Error fetching batches" });
    }
  });

  app.post("/api/admin/batches", isAdmin, async (req, res) => {
    try {
      const { name } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ message: "Batch name is required" });
      }
      await storage.createBatch(name.trim());
      res.status(201).json({ message: "Batch created successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error creating batch" });
    }
  });

  const httpServer = createServer(app);

  // Batch operations endpoints
  app.post("/api/admin/candidates/batch", isAdmin, async (req, res) => {
    try {
      const { candidateIds, batchName } = req.body;
      
      if (!Array.isArray(candidateIds) || candidateIds.length === 0) {
        return res.status(400).json({ message: "candidateIds must be a non-empty array" });
      }
      
      if (!batchName || !batchName.trim()) {
        return res.status(400).json({ message: "Batch name is required" });
      }
      
      const results = [];
      const errors = [];
      
      // Process each candidate assignment
      for (const candidateId of candidateIds) {
        try {
          // Check if candidate exists
          const candidate = await storage.getUser(candidateId);
          if (!candidate || candidate.role !== "candidate") {
            errors.push({ candidateId, error: "Invalid candidate" });
            continue;
          }
          
          // Update candidate batch
          const updatedCandidate = await storage.updateUser(candidateId, {
            batch: batchName.trim()
          });
          
          results.push(updatedCandidate);
        } catch (error) {
          errors.push({ candidateId, error: error instanceof Error ? error.message : String(error) });
        }
      }
      
      res.status(200).json({ 
        success: results.length > 0,
        updated: results.length,
        failed: errors.length, 
        results,
        errors 
      });
    } catch (error) {
      res.status(500).json({ message: "Error assigning batch to candidates" });
    }
  });
  
  app.post("/api/admin/candidates/batch", isAdmin, async (req, res) => {
    try {
      const { candidateIds, status } = req.body;
      
      if (!Array.isArray(candidateIds) || candidateIds.length === 0) {
        return res.status(400).json({ message: "candidateIds must be a non-empty array" });
      }
      
      if (!status || !status.trim()) {
        return res.status(400).json({ message: "Batch name is required" });
      }
      
      const results = [];
      const errors = [];
      
      // Process each candidate batch update
      for (const candidateId of candidateIds) {
        try {
          // Check if candidate exists
          const candidate = await storage.getUser(candidateId);
          if (!candidate || candidate.role !== "candidate") {
            errors.push({ candidateId, error: "Invalid candidate" });
            continue;
          }
          
          // Update candidate batch
          const updatedCandidate = await storage.updateUser(candidateId, {
            batch: status.trim()
          });
          
          results.push(updatedCandidate);
        } catch (error) {
          errors.push({ candidateId, error: error instanceof Error ? error.message : String(error) });
        }
      }
      
      res.status(200).json({ 
        success: results.length > 0,
        updated: results.length,
        failed: errors.length, 
        results,
        errors 
      });
    } catch (error) {
      res.status(500).json({ message: "Error updating candidate batch" });
    }
  });
  
  app.post("/api/admin/candidates/bulk-delete", isAdmin, async (req, res) => {
    try {
      const { candidateIds } = req.body;
      
      if (!Array.isArray(candidateIds) || candidateIds.length === 0) {
        return res.status(400).json({ message: "candidateIds must be a non-empty array" });
      }
      
      const results = [];
      const errors = [];
      
      // Process each candidate deletion
      for (const candidateId of candidateIds) {
        try {
          // Check if candidate exists
          const candidate = await storage.getUser(candidateId);
          if (!candidate || candidate.role !== "candidate") {
            errors.push({ candidateId, error: "Invalid candidate" });
            continue;
          }
          
          // Delete the candidate
          await storage.deleteUser(candidateId);
          
          results.push({ id: candidateId, deleted: true });
        } catch (error) {
          errors.push({ candidateId, error: error instanceof Error ? error.message : String(error) });
        }
      }
      
      res.status(200).json({ 
        success: results.length > 0,
        deleted: results.length,
        failed: errors.length, 
        results,
        errors 
      });
    } catch (error) {
      res.status(500).json({ message: "Error deleting candidates" });
    }
  });
  
  // Add admin credentials endpoint
  app.post("/api/admin/send-credentials", isAdmin, async (req, res) => {
    try {
      const { email, username, password } = req.body;
      
      // Here you would integrate with your email service
      // For now, we'll just simulate email sending
      console.log("Sending credentials email to:", email, {
        username,
        password,
      });

      res.status(200).json({ message: "Credentials sent successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to send credentials" });
    }
  });

  // Admin profile update endpoint
  app.put("/api/admin/profile", isAdmin, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { username, email, currentPassword, newPassword } = req.body;
      
      // Get existing user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check for username uniqueness if it's being changed
      if (username && username !== user.username) {
        const existingUserWithUsername = await storage.getUserByUsername(username);
        if (existingUserWithUsername && existingUserWithUsername.id !== userId) {
          return res.status(400).json({ message: "Username already exists" });
        }
      }
      
      // Check for email uniqueness if it's being changed
      if (email && email !== user.email) {
        const existingUserWithEmail = await storage.getUserByEmail(email);
        if (existingUserWithEmail && existingUserWithEmail.id !== userId) {
          return res.status(400).json({ message: "Email already exists" });
        }
      }
      
      // If password is being updated, verify current password and hash new password
      let hashedPassword;
      if (newPassword && currentPassword) {
        const passwordMatches = await comparePasswords(currentPassword, user.password);
        
        if (!passwordMatches) {
          return res.status(400).json({ message: "Current password is incorrect" });
        }
        
        hashedPassword = await hashPassword(newPassword);
      }
      
      // Update user
      const updatedUser = await storage.updateUser(userId, {
        username: username || user.username,
        email: email || user.email,
        password: hashedPassword || user.password,
      });
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = updatedUser;
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Error updating profile" });
    }
  });

  return httpServer;
}
