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
  insertUserSchema,
  insertBatchSchema
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
    console.log("=== DEBUG SESSION ENDPOINT CALLED ===");
    console.log("Request headers:", req.headers);
    
    try {
      // First check database connection directly
      console.log("Testing direct database connection...");
      try {
        const dbCheckResult = await pool.query('SELECT NOW() as time');
        console.log("Direct DB connection successful:", dbCheckResult.rows[0].time);
      } catch (dbError) {
        console.error("Direct DB connection failed:", dbError);
      }
      
      // Get session data from database
      console.log("Fetching session data for ID:", req.sessionID);
      const result = await pool.query(
        'SELECT sid, sess, expire FROM session WHERE sid = $1',
        [req.sessionID]
      );
      
      const sessionData = result.rows.length > 0 ? result.rows[0] : null;
      console.log("Session found in DB:", sessionData !== null);
      
      const sessionDbData = sessionData ? JSON.parse(sessionData.sess) : null;
      
      // Get all active sessions for debugging
      console.log("Fetching all active sessions...");
      const allSessionsResult = await pool.query(
        'SELECT sid, sess, expire FROM session ORDER BY expire DESC LIMIT 10'
      );
      
      const allSessions = allSessionsResult.rows.map(row => ({
        sid: row.sid,
        expire: row.expire,
        data: JSON.parse(row.sess)
      }));
      
      console.log(`Found ${allSessions.length} active sessions`);
      
      // Debug request object
      console.log("Session middleware data:", {
        sessionID: req.sessionID,
        isAuthenticated: req.isAuthenticated(),
        hasUser: !!req.user
      });
      
      res.json({
        requestId: Math.random().toString(36).substr(2, 9), // Random ID to identify this specific request
        time: new Date().toISOString(),
        sessionID: req.sessionID,
        isAuthenticated: req.isAuthenticated(),
        user: req.user || null,
        cookies: req.headers.cookie,
        sessionInDb: sessionData !== null,
        sessionDbData,
        allSessions,
        nodeEnv: process.env.NODE_ENV || 'development'
      });
    } catch (error) {
      console.error('Error retrieving session debug info:', error);
      res.status(500).json({ error: 'Failed to retrieve debug information', details: String(error) });
    }
  });
  
  // Create special test user
  app.post('/api/debug/create-test-user', async (req, res) => {
    try {
      const { username, password, role } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.json({ 
          message: 'User already exists',
          user: {
            id: existingUser.id,
            username: existingUser.username,
            role: existingUser.role
          }
        });
      }
      
      // Create the user
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        email: `${username}@test.com`,
        fullName: `Test ${username.charAt(0).toUpperCase() + username.slice(1)}`,
        role: role || 'candidate',
        batchId: null
      });
      
      res.json({
        message: 'Test user created successfully',
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Error creating test user:', error);
      res.status(500).json({ error: 'Failed to create test user', details: String(error) });
    }
  });
  
  // Enhanced ping endpoint to test session persistence
  app.get('/api/ping', (req, res) => {
    console.log('Ping - Cookies:', req.headers.cookie);
    console.log('Ping - Session ID:', req.sessionID);
    console.log('Ping - Authenticated:', req.isAuthenticated());
    console.log('Ping - Session before modification:', JSON.stringify(req.session));
    
    // Increment a counter in the session to prove it's persisting
    const sessionData = req.session as any; // Use any to bypass TypeScript for session data
    if (!sessionData.pingCount) {
      sessionData.pingCount = 0;
    }
    sessionData.pingCount++;
    
    // Set request time to track session persistence
    sessionData.lastPingTime = new Date().toISOString();
    
    // Always set a non-passport value to check if general session data persists
    sessionData.testKey = 'test-value-' + Math.floor(Math.random() * 1000);
    
    console.log('Ping - Modified session data:', JSON.stringify(sessionData));
    
    // Save the session explicitly
    req.session.save((err) => {
      if (err) {
        console.error('Error saving ping session:', err);
        return res.status(500).json({ error: 'Failed to save session' });
      }
      
      console.log('Ping - Session saved successfully');
      
      // Set the cookie explicitly to ensure it's sent
      res.cookie('switchbee.sid', req.sessionID, {
        httpOnly: true,
        secure: false,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: 'lax',
        path: '/'
      });
      
      res.json({
        pong: true,
        pingCount: sessionData.pingCount,
        lastPingTime: sessionData.lastPingTime,
        testKey: sessionData.testKey,
        sessionID: req.sessionID,
        isAuthenticated: req.isAuthenticated(),
        user: req.user ? {
          id: req.user.id,
          username: req.user.username,
          role: req.user.role
        } : null
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
  
  // Update an existing candidate's details
  app.patch("/api/admin/candidates/:id", isAdmin, async (req, res) => {
    try {
      const candidateId = parseInt(req.params.id);
      if (isNaN(candidateId)) {
        return res.status(400).json({ message: "Invalid candidate ID" });
      }

      // Fetch the candidate to update
      const existingCandidate = await storage.getUser(candidateId);
      if (!existingCandidate) {
        return res.status(404).json({ message: "Candidate not found" });
      }
      if (existingCandidate.role !== "candidate") {
        return res.status(403).json({ message: "Can only update candidate accounts" });
      }

      // Prepare updated fields, keeping current values for any unspecified fields
      const { username, email, fullName, password: newPassword, batchId } = req.body;
      // Enforce required fields are not empty
      if (username && !username.trim()) {
        return res.status(400).json({ message: "Username cannot be empty" });
      }
      if (email && !email.trim()) {
        return res.status(400).json({ message: "Email cannot be empty" });
      }
      if (fullName && !fullName.trim()) {
        return res.status(400).json({ message: "Full name cannot be empty" });
      }

      // Check for uniqueness if username or email are being changed
      if (username && username !== existingCandidate.username) {
        const conflictUser = await storage.getUserByUsername(username);
        if (conflictUser && conflictUser.id !== candidateId) {
          return res.status(400).json({ message: "Username already exists" });
        }
      }
      if (email && email !== existingCandidate.email) {
        const conflictEmailUser = await storage.getUserByEmail(email);
        if (conflictEmailUser && conflictEmailUser.id !== candidateId) {
          return res.status(400).json({ message: "Email already exists" });
        }
      }

      // Hash the password if a new one is provided
      let hashedPassword: string | undefined;
      if (newPassword && newPassword.trim()) {
        hashedPassword = await hashPasswordLocal(newPassword);
      }

      // Validate batchId if provided
      if (batchId !== undefined && batchId !== null) {
        // Check if batch exists
        const batch = await storage.getBatch(batchId);
        if (!batch) {
          return res.status(400).json({ message: "Specified batch does not exist" });
        }
      }

      // Build the update object, keeping existing values for fields not provided
      const updatedData = {
        username: username?.trim() ?? existingCandidate.username,
        email: email?.trim() ?? existingCandidate.email,
        fullName: fullName?.trim() ?? existingCandidate.fullName,
        password: hashedPassword ?? existingCandidate.password,
        batchId: batchId !== undefined ? batchId : existingCandidate.batchId,
        role: existingCandidate.role  // ensure role remains unchanged
      };

      const updatedUser = await storage.updateUser(candidateId, updatedData);
      // Exclude password before sending back response
      const { password, ...userWithoutPassword } = updatedUser;
      return res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating candidate:", error);
      return res.status(500).json({ message: "Error updating candidate" });
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
      console.log(`===== Adding question to assessment ${assessmentId} =====`);
      console.log("Request body:", JSON.stringify(req.body, null, 2));
      
      // Check if the request body has the necessary properties
      if (!req.body || !req.body.text) {
        console.error("Invalid question data. Missing required fields");
        return res.status(400).json({ message: "Invalid question data. Question text is required." });
      }
      
      // Get the assessment
      const assessment = await storage.getAssessment(assessmentId);
      if (!assessment) {
        console.error(`Assessment ${assessmentId} not found`);
        return res.status(404).json({ message: "Assessment not found" });
      }

      // Ensure questions is initialized as an array
      const currentQuestions = Array.isArray(assessment.questions) ? assessment.questions : [];
      console.log(`Assessment has ${currentQuestions.length} questions before adding new one`);
      
      // Generate a UUID for the question if it doesn't have one
      const newQuestionId = req.body.id || crypto.randomUUID();
      console.log(`Using question ID: ${newQuestionId}`);
      
      // Create the new question array with the added question
      const questionToAdd = { ...req.body, id: newQuestionId };
      console.log("Question to add:", JSON.stringify(questionToAdd, null, 2).substring(0, 300) + '...');
      
      const questions = [...currentQuestions, questionToAdd];
      console.log(`New questions array has ${questions.length} questions`);
      
      // Update the assessment
      console.log("Updating assessment with new question");
      
      try {
        const updated = await storage.updateAssessment(assessmentId, { questions });
        console.log("Assessment updated successfully with ID:", assessmentId);
        
        // Verify the update by fetching the assessment again
        const verifiedAssessment = await storage.getAssessment(assessmentId);
        if (verifiedAssessment && Array.isArray(verifiedAssessment.questions)) {
          console.log(`Verified: Assessment now has ${verifiedAssessment.questions.length} questions`);
          
          // Check if our new question is in the array
          const addedQuestion = verifiedAssessment.questions.find((q: any) => q.id === newQuestionId);
          if (addedQuestion) {
            console.log("Question was successfully added to the database");
          } else {
            console.warn("Question may not have been added correctly");
          }
        }
        
        res.json(updated);
      } catch (updateError) {
        console.error("Error updating assessment:", updateError);
        res.status(500).json({ 
          message: "Error updating assessment", 
          error: String(updateError),
          details: "Failed to save the question to the database"
        });
      }
    } catch (error) {
      console.error("Error adding question:", error);
      res.status(500).json({ message: "Error adding question", error: String(error) });
    }
  });

  // Get assignments by assessment ID
  app.get("/api/admin/assessment/:id/assignments", isAdmin, async (req, res) => {
    try {
      const assessmentId = parseInt(req.params.id);
      if (isNaN(assessmentId)) {
        return res.status(400).json({ message: "Invalid assessment ID" });
      }
      
      // Get all assignments for this assessment
      const assignments = await storage.getAssignmentsByAssessmentId(assessmentId);
      
      // Enhance assignments with candidate data
      const enhancedAssignments = [];
      for (const assignment of assignments) {
        const candidate = await storage.getUser(assignment.candidateId);
        if (candidate) {
          // Remove password from candidate data
          const { password, ...candidateWithoutPassword } = candidate;
          
          enhancedAssignments.push({
            ...assignment,
            candidate: candidateWithoutPassword
          });
        }
      }
      
      res.json(enhancedAssignments);
    } catch (error) {
      console.error("Error fetching assessment assignments:", error);
      res.status(500).json({ message: "Error fetching assessment assignments" });
    }
  });
  
  // Update question
  app.put("/api/admin/assessments/:id/questions/:questionId", isAdmin, async (req, res) => {
    try {
      const assessmentId = parseInt(req.params.id);
      const questionId = req.params.questionId;
      
      console.log(`Updating question ${questionId} in assessment ${assessmentId}`);
      console.log("Request body:", req.body);
      
      const assessment = await storage.getAssessment(assessmentId);
      if (!assessment) {
        console.error(`Assessment ${assessmentId} not found`);
        return res.status(404).json({ message: "Assessment not found" });
      }
      
      // Ensure questions is initialized as an array
      const currentQuestions = Array.isArray(assessment.questions) ? assessment.questions : [];
      console.log("Current questions count:", currentQuestions.length);
      
      // Find the question index
      const questionIndex = currentQuestions.findIndex((q: any) => q.id === questionId);
      if (questionIndex === -1) {
        console.error(`Question ${questionId} not found in assessment ${assessmentId}`);
        return res.status(404).json({ message: "Question not found in this assessment" });
      }
      
      // Create updated questions array
      const questions = [...currentQuestions]; // Clone the array
      questions[questionIndex] = { ...req.body, id: questionId }; // Update the specific question
      
      console.log("Updating assessment with modified questions array");
      const updated = await storage.updateAssessment(assessmentId, { questions });
      console.log("Assessment updated successfully");
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating question:", error);
      res.status(500).json({ message: "Error updating question", error: String(error) });
    }
  });

  // Delete question
  app.delete("/api/admin/assessments/:id/questions/:questionId", isAdmin, async (req, res) => {
    try {
      const assessmentId = parseInt(req.params.id);
      const questionId = req.params.questionId;
      
      console.log(`Deleting question ${questionId} from assessment ${assessmentId}`);
      
      const assessment = await storage.getAssessment(assessmentId);
      if (!assessment) {
        console.error(`Assessment ${assessmentId} not found for question deletion`);
        return res.status(404).json({ message: "Assessment not found" });
      }
      
      // Ensure questions is initialized as an array
      const currentQuestions = Array.isArray(assessment.questions) ? assessment.questions : [];
      console.log(`Assessment has ${currentQuestions.length} questions before deletion`);
      
      // Check if the question exists
      const questionExists = currentQuestions.some((q: any) => q.id === questionId);
      if (!questionExists) {
        console.error(`Question ${questionId} not found in assessment ${assessmentId}`);
        return res.status(404).json({ message: "Question not found in this assessment" });
      }
      
      const questions = currentQuestions.filter((q: any) => q.id !== questionId);
      console.log(`Filtered to ${questions.length} questions after removing question ${questionId}`);
      
      console.log("Updating assessment after question deletion");
      const updated = await storage.updateAssessment(assessmentId, { questions });
      console.log("Assessment updated successfully after question deletion");
      
      res.json(updated);
    } catch (error) {
      console.error("Error deleting question:", error);
      res.status(500).json({ message: "Error deleting question", error: String(error) });
    }
  });

  // Reorder questions
  app.put("/api/admin/assessments/:id/questions/reorder", isAdmin, async (req, res) => {
    try {
      const assessmentId = parseInt(req.params.id);
      console.log(`Reordering questions for assessment ${assessmentId}`);
      
      const { questions } = req.body;
      console.log(`Received ${questions ? questions.length : 0} questions for reordering`);
      
      if (!Array.isArray(questions)) {
        console.error("Questions must be an array");
        return res.status(400).json({ message: "Questions must be an array" });
      }
      
      const assessment = await storage.getAssessment(assessmentId);
      if (!assessment) {
        console.error(`Assessment ${assessmentId} not found for reordering`);
        return res.status(404).json({ message: "Assessment not found" });
      }

      console.log("Original questions count:", 
        Array.isArray(assessment.questions) ? assessment.questions.length : 0);
      console.log("New questions order count:", questions.length);

      // Verify all question IDs are present in the new order
      const originalIds = new Set(
        Array.isArray(assessment.questions) 
          ? assessment.questions.map((q: any) => q.id) 
          : []
      );
      
      const newIds = new Set(questions.map((q: any) => q.id));
      
      if (originalIds.size !== newIds.size) {
        console.error("Question count mismatch in reordering");
        console.error("Original IDs count:", originalIds.size);
        console.error("New IDs count:", newIds.size);
      }
      
      console.log("Updating assessment with reordered questions");
      const updated = await storage.updateAssessment(assessmentId, { questions });
      console.log("Assessment updated successfully after reordering");
      
      res.json(updated);
    } catch (error) {
      console.error("Error reordering questions:", error);
      res.status(500).json({ message: "Error reordering questions", error: String(error) });
    }
  });

  // Duplicate an assessment
  app.post("/api/admin/assessments/:id/duplicate", isAdmin, async (req, res) => {
    try {
      const assessmentId = parseInt(req.params.id);
      console.log(`Duplicating assessment ${assessmentId}`);
      
      // Get the original assessment
      const originalAssessment = await storage.getAssessment(assessmentId);
      if (!originalAssessment) {
        console.error(`Assessment ${assessmentId} not found for duplication`);
        return res.status(404).json({ message: "Assessment not found" });
      }
      
      // Create a new assessment with the same properties but a different title
      const newAssessment = {
        title: `${originalAssessment.title} (Copy)`,
        description: originalAssessment.description,
        type: originalAssessment.type,
        questions: originalAssessment.questions || [], // Ensure questions is an array
        createdBy: req.user!.id
      };
      
      console.log("Creating duplicate assessment");
      const duplicate = await storage.createAssessment(newAssessment);
      console.log(`Duplicate assessment created with ID ${duplicate.id}`);
      
      res.status(201).json(duplicate);
    } catch (error) {
      console.error("Error duplicating assessment:", error);
      res.status(500).json({ message: "Error duplicating assessment", error: String(error) });
    }
  });
  
  // Export assessment questions
  app.get("/api/admin/assessments/:id/export", isAdmin, async (req, res) => {
    try {
      const assessmentId = parseInt(req.params.id);
      console.log(`Exporting questions for assessment ${assessmentId}`);
      
      // Get the assessment
      const assessment = await storage.getAssessment(assessmentId);
      if (!assessment) {
        console.error(`Assessment ${assessmentId} not found for export`);
        return res.status(404).json({ message: "Assessment not found" });
      }
      
      // Format the export data
      const exportData = {
        assessment: {
          title: assessment.title,
          description: assessment.description,
          type: assessment.type
        },
        questions: assessment.questions || []
      };
      
      // Set the appropriate headers for a downloadable JSON file
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="assessment-${assessmentId}-questions.json"`);
      
      console.log(`Exporting ${Array.isArray(exportData.questions) ? exportData.questions.length : 0} questions`);
      res.json(exportData);
    } catch (error) {
      console.error("Error exporting questions:", error);
      res.status(500).json({ message: "Error exporting questions", error: String(error) });
    }
  });
  
  // Import questions to an assessment
  app.post("/api/admin/assessments/:id/import", isAdmin, async (req, res) => {
    try {
      const assessmentId = parseInt(req.params.id);
      console.log(`Importing questions for assessment ${assessmentId}`);
      
      const { questions } = req.body;
      
      if (!Array.isArray(questions)) {
        console.error("Questions must be an array");
        return res.status(400).json({ message: "Questions must be an array" });
      }
      
      // Get the assessment
      const assessment = await storage.getAssessment(assessmentId);
      if (!assessment) {
        console.error(`Assessment ${assessmentId} not found for import`);
        return res.status(404).json({ message: "Assessment not found" });
      }
      
      // Ensure the assessment has a questions array
      const currentQuestions = Array.isArray(assessment.questions) ? assessment.questions : [];
      
      // Add the imported questions to the existing ones
      const updatedQuestions = [...currentQuestions, ...questions];
      
      console.log(`Importing ${questions.length} questions to existing ${currentQuestions.length} questions`);
      const updated = await storage.updateAssessment(assessmentId, { questions: updatedQuestions });
      console.log(`Successfully imported questions. Assessment now has ${updatedQuestions.length} questions`);
      
      res.json(updated);
    } catch (error) {
      console.error("Error importing questions:", error);
      res.status(500).json({ message: "Error importing questions", error: String(error) });
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
      console.log("Fetching all batches");
      const batches = await storage.getBatches();
      console.log("Batches fetched:", batches);
      res.json(batches);
    } catch (error) {
      console.error("Error fetching batches:", error);
      res.status(500).json({ message: "Error fetching batches" });
    }
  });

  app.post("/api/admin/batches", isAdmin, async (req, res) => {
    try {
      console.log("Creating new batch with data:", req.body);
      // Create batch directly with name
      if (typeof req.body.name === 'string') {
        const batch = await storage.createBatch(req.body.name);
        console.log("Batch created:", batch);
        res.status(201).json(batch);
      } else {
        res.status(400).json({ message: "Batch name is required" });
      }
    } catch (error) {
      console.error("Error creating batch:", error);
      res.status(500).json({ message: "Error creating batch" });
    }
  });
  
  app.get("/api/admin/batches/:id", isAdmin, async (req, res) => {
    try {
      const batchId = parseInt(req.params.id);
      if (isNaN(batchId)) {
        return res.status(400).json({ message: "Invalid batch ID" });
      }
      
      const batch = await storage.getBatch(batchId);
      if (!batch) {
        return res.status(404).json({ message: "Batch not found" });
      }
      
      res.json(batch);
    } catch (error) {
      res.status(500).json({ message: "Error fetching batch" });
    }
  });
  
  app.put("/api/admin/batches/:id", isAdmin, async (req, res) => {
    try {
      const batchId = parseInt(req.params.id);
      if (isNaN(batchId)) {
        return res.status(400).json({ message: "Invalid batch ID" });
      }
      
      const { name } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ message: "Batch name is required" });
      }
      
      const batch = await storage.updateBatch(batchId, { name: name.trim() });
      if (!batch) {
        return res.status(404).json({ message: "Batch not found" });
      }
      
      res.json(batch);
    } catch (error) {
      res.status(500).json({ message: "Error updating batch" });
    }
  });
  
  app.delete("/api/admin/batches/:id", isAdmin, async (req, res) => {
    try {
      const batchId = parseInt(req.params.id);
      if (isNaN(batchId)) {
        return res.status(400).json({ message: "Invalid batch ID" });
      }
      
      await storage.deleteBatch(batchId);
      res.status(200).json({ message: "Batch deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting batch" });
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
          
          // Get the batch id from name
          const existingBatches = await storage.getBatches();
          const batch = existingBatches.find(b => b.name === batchName.trim());
          
          let batchId = null;
          if (batch) {
            batchId = batch.id;
          } else {
            // Create the batch if it doesn't exist
            const newBatch = await storage.createBatch(batchName.trim());
            batchId = newBatch.id;
          }
          
          // Update candidate batch
          const updatedCandidate = await storage.updateUser(candidateId, {
            batchId: batchId
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
  
  app.post("/api/admin/candidates/batch-status", isAdmin, async (req, res) => {
    try {
      const { candidateIds, batchId } = req.body;
      
      if (!Array.isArray(candidateIds) || candidateIds.length === 0) {
        return res.status(400).json({ message: "candidateIds must be a non-empty array" });
      }
      
      if (batchId === undefined) {
        return res.status(400).json({ message: "Batch ID is required" });
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
            batchId: batchId
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

  // Duplicate assessment endpoint
  app.post("/api/admin/assessments/:id/duplicate", isAdmin, async (req, res) => {
    try {
      const assessmentId = parseInt(req.params.id);
      console.log(`Duplicating assessment ${assessmentId}`);
      
      // Get the original assessment
      const originalAssessment = await storage.getAssessment(assessmentId);
      if (!originalAssessment) {
        console.error(`Assessment ${assessmentId} not found for duplication`);
        return res.status(404).json({ message: "Assessment not found" });
      }
      
      // Create a copy of the assessment with "(Copy)" added to the title
      const newAssessment = await storage.createAssessment({
        title: `${originalAssessment.title} (Copy)`,
        description: originalAssessment.description,
        type: originalAssessment.type,
        timeLimit: originalAssessment.timeLimit,
        questions: originalAssessment.questions as any, // Cast to any to avoid type issues
        createdBy: req.user!.id
      });
      
      console.log(`Successfully duplicated assessment ${assessmentId} to new assessment ${newAssessment.id}`);
      res.status(201).json({ 
        success: true, 
        message: "Assessment duplicated successfully", 
        assessment: newAssessment 
      });
    } catch (error) {
      console.error("Error duplicating assessment:", error);
      res.status(500).json({ message: "Error duplicating assessment", error: String(error) });
    }
  });
  
  // Export assessment questions endpoint
  app.get("/api/admin/assessments/:id/export", isAdmin, async (req, res) => {
    try {
      const assessmentId = parseInt(req.params.id);
      console.log(`Exporting questions for assessment ${assessmentId}`);
      
      // Get the assessment
      const assessment = await storage.getAssessment(assessmentId);
      if (!assessment) {
        console.error(`Assessment ${assessmentId} not found for export`);
        return res.status(404).json({ message: "Assessment not found" });
      }
      
      // Create the export file with questions
      const exportData = {
        assessmentTitle: assessment.title,
        assessmentType: assessment.type,
        questions: assessment.questions || []
      };
      
      // Set headers for file download
      res.setHeader('Content-Disposition', `attachment; filename="assessment-${assessmentId}-questions.json"`);
      res.setHeader('Content-Type', 'application/json');
      
      // Send the file
      res.status(200).json(exportData);
    } catch (error) {
      console.error("Error exporting assessment questions:", error);
      res.status(500).json({ message: "Error exporting questions", error: String(error) });
    }
  });
  
  // The Add question endpoint is already defined above (line ~393)
  
  // Update a question in an assessment endpoint
  app.put("/api/admin/assessments/:id/questions/:questionId", isAdmin, async (req, res) => {
    try {
      const assessmentId = parseInt(req.params.id);
      const questionId = req.params.questionId;
      const questionData = req.body;
      
      console.log(`Updating question ${questionId} in assessment ${assessmentId}`);
      
      if (!questionData || !questionData.id || !questionData.text) {
        return res.status(400).json({ message: "Invalid question data provided." });
      }
      
      // Get the assessment
      const assessment = await storage.getAssessment(assessmentId);
      if (!assessment) {
        console.error(`Assessment ${assessmentId} not found for updating question`);
        return res.status(404).json({ message: "Assessment not found" });
      }
      
      // Find and replace the question
      const existingQuestions = (assessment.questions || []) as any[];
      const questionIndex = existingQuestions.findIndex((q: any) => q.id === questionId);
      
      if (questionIndex === -1) {
        console.error(`Question ${questionId} not found in assessment ${assessmentId}`);
        return res.status(404).json({ message: "Question not found in assessment" });
      }
      
      // Replace the question at the found index
      const updatedQuestions = [...existingQuestions];
      updatedQuestions[questionIndex] = questionData;
      
      // Update the assessment with the updated questions
      const updatedAssessment = await storage.updateAssessment(assessmentId, {
        questions: updatedQuestions
      });
      
      console.log(`Successfully updated question ${questionId} in assessment ${assessmentId}`);
      res.status(200).json({ 
        success: true, 
        message: "Question updated successfully",
        assessment: updatedAssessment
      });
    } catch (error) {
      console.error("Error updating question:", error);
      res.status(500).json({ message: "Error updating question", error: String(error) });
    }
  });
  
  // Delete a question from an assessment endpoint
  app.delete("/api/admin/assessments/:id/questions/:questionId", isAdmin, async (req, res) => {
    try {
      const assessmentId = parseInt(req.params.id);
      const questionId = req.params.questionId;
      
      console.log(`Deleting question ${questionId} from assessment ${assessmentId}`);
      
      // Get the assessment
      const assessment = await storage.getAssessment(assessmentId);
      if (!assessment) {
        console.error(`Assessment ${assessmentId} not found for deleting question`);
        return res.status(404).json({ message: "Assessment not found" });
      }
      
      // Filter out the question to be deleted
      const existingQuestions = (assessment.questions || []) as any[];
      const updatedQuestions = existingQuestions.filter((q: any) => q.id !== questionId);
      
      if (existingQuestions.length === updatedQuestions.length) {
        console.error(`Question ${questionId} not found in assessment ${assessmentId}`);
        return res.status(404).json({ message: "Question not found in assessment" });
      }
      
      // Update the assessment with the filtered questions
      const updatedAssessment = await storage.updateAssessment(assessmentId, {
        questions: updatedQuestions
      });
      
      console.log(`Successfully deleted question ${questionId} from assessment ${assessmentId}`);
      res.status(200).json({ 
        success: true, 
        message: "Question deleted successfully",
        assessment: updatedAssessment
      });
    } catch (error) {
      console.error("Error deleting question:", error);
      res.status(500).json({ message: "Error deleting question", error: String(error) });
    }
  });
  
  // Reorder questions in an assessment endpoint
  app.put("/api/admin/assessments/:id/questions/reorder", isAdmin, async (req, res) => {
    try {
      const assessmentId = parseInt(req.params.id);
      const { questions } = req.body;
      
      console.log(`Reordering questions for assessment ${assessmentId}`);
      
      if (!Array.isArray(questions)) {
        return res.status(400).json({ message: "Invalid request format. Expected array of questions." });
      }
      
      // Get the assessment
      const assessment = await storage.getAssessment(assessmentId);
      if (!assessment) {
        console.error(`Assessment ${assessmentId} not found for reordering`);
        return res.status(404).json({ message: "Assessment not found" });
      }
      
      // Update the assessment with the reordered questions
      const updatedAssessment = await storage.updateAssessment(assessmentId, {
        questions
      });
      
      console.log(`Successfully reordered questions for assessment ${assessmentId}`);
      res.status(200).json({ 
        success: true, 
        message: "Questions reordered successfully",
        assessment: updatedAssessment
      });
    } catch (error) {
      console.error("Error reordering questions:", error);
      res.status(500).json({ message: "Error reordering questions", error: String(error) });
    }
  });
  
  // Import questions to assessment endpoint
  app.post("/api/admin/assessments/:id/import", isAdmin, async (req, res) => {
    try {
      const assessmentId = parseInt(req.params.id);
      const { questions } = req.body;
      
      console.log(`Importing questions for assessment ${assessmentId}`);
      
      if (!Array.isArray(questions)) {
        return res.status(400).json({ message: "Invalid request format. Expected array of questions." });
      }
      
      // Get the assessment
      const assessment = await storage.getAssessment(assessmentId);
      if (!assessment) {
        console.error(`Assessment ${assessmentId} not found for import`);
        return res.status(404).json({ message: "Assessment not found" });
      }
      
      // Add the imported questions to the existing questions
      const existingQuestions = (assessment.questions || []) as any[];
      const updatedQuestions = [...existingQuestions, ...questions];
      
      // Update the assessment with the new questions
      const updatedAssessment = await storage.updateAssessment(assessmentId, {
        questions: updatedQuestions
      });
      
      console.log(`Successfully imported ${questions.length} questions to assessment ${assessmentId}`);
      res.status(200).json({ 
        success: true, 
        message: `Successfully imported ${questions.length} questions`,
        assessment: updatedAssessment
      });
    } catch (error) {
      console.error("Error importing questions:", error);
      res.status(500).json({ message: "Error importing questions", error: String(error) });
    }
  });
  
  // Delete assessment endpoint
  app.delete("/api/admin/assessments/:id", isAdmin, async (req, res) => {
    try {
      const assessmentId = parseInt(req.params.id);
      console.log(`Deleting assessment ${assessmentId}`);
      
      // Get the assessment
      const assessment = await storage.getAssessment(assessmentId);
      if (!assessment) {
        console.error(`Assessment ${assessmentId} not found for deletion`);
        return res.status(404).json({ message: "Assessment not found" });
      }
      
      // Check if the assessment has any assigned candidates
      const assignments = await storage.getAssignmentsByAssessmentId(assessmentId);
      if (assignments && assignments.length > 0) {
        console.error(`Assessment ${assessmentId} has ${assignments.length} candidate assignments and cannot be deleted`);
        return res.status(409).json({ 
          message: "Cannot delete assessment with candidate assignments",
          assignmentsCount: assignments.length 
        });
      }
      
      // Delete the assessment from the database
      try {
        await storage.deleteAssessment(assessmentId);
        res.status(200).json({ success: true, message: "Assessment deleted successfully" });
      } catch (deleteError) {
        console.error("Error during assessment deletion:", deleteError);
        res.status(500).json({ message: "Error deleting assessment", error: String(deleteError) });
      }
    } catch (error) {
      console.error("Error deleting assessment:", error);
      res.status(500).json({ message: "Error deleting assessment", error: String(error) });
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
