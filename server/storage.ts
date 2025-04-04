import { 
  User, InsertUser, 
  Assessment, InsertAssessment, 
  CandidateAssessment, InsertCandidateAssessment, 
  MCQResponse, FillInBlanksResponse, VideoResponse,
  users, assessments, candidateAssessments
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const { Pool } = pg;
import connectPg from "connect-pg-simple";
import { eq, and } from "drizzle-orm";

// Define password hashing functions locally to avoid circular dependencies
const scryptAsync = promisify(scrypt);

// Export this function for use in routes.ts
export async function hashPasswordLocal(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// For comparing passwords - export to avoid using the one from auth.ts
export async function comparePasswordsLocal(supplied: string, stored: string) {
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

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

// Modify the interface with any CRUD methods you might need
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User>;
  deleteUser(id: number): Promise<void>;
  getCandidates(): Promise<User[]>;
  getBatches(): Promise<string[]>; // Added getBatches function
  createBatch(name: string): Promise<{ name: string }>; // Added createBatch function

  // Assessment operations
  createAssessment(assessment: InsertAssessment): Promise<Assessment>;
  getAssessment(id: number): Promise<Assessment | undefined>;
  getAssessments(): Promise<Assessment[]>;
  updateAssessment(id: number, assessmentData: Partial<Assessment>): Promise<Assessment>;

  // Candidate Assessment operations
  assignAssessment(assignment: InsertCandidateAssessment): Promise<CandidateAssessment>;
  getCandidateAssignments(candidateId: number): Promise<CandidateAssessment[]>;
  getCandidateAssessments(candidateId: number): Promise<any[]>; // With assessment details
  getCandidateAssignment(candidateId: number, assessmentId: number): Promise<any | undefined>;
  startAssessment(candidateAssessmentId: number, candidateId: number): Promise<CandidateAssessment>;
  submitMCQResponses(candidateAssessmentId: number, candidateId: number, responses: MCQResponse[]): Promise<CandidateAssessment>;
  submitFillInBlanksResponses(candidateAssessmentId: number, candidateId: number, responses: FillInBlanksResponse[]): Promise<CandidateAssessment>;
  submitVideoResponses(candidateAssessmentId: number, candidateId: number, responses: VideoResponse[]): Promise<CandidateAssessment>;
  provideFeedback(candidateAssessmentId: number, feedback: string, score?: number): Promise<CandidateAssessment>;

  // Initialize database (create tables, seed data)
  initializeStorage(): Promise<void>;

  // Session store
  sessionStore: any; // Changed from session.SessionStore for compatibility
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private assessments: Map<number, Assessment>;
  private candidateAssessments: Map<number, CandidateAssessment>;
  sessionStore: any; // Using any type for compatibility

  private userIdCounter: number;
  private assessmentIdCounter: number;
  private candidateAssessmentIdCounter: number;

  constructor() {
    this.users = new Map();
    this.assessments = new Map();
    this.candidateAssessments = new Map();
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });

    this.userIdCounter = 1;
    this.assessmentIdCounter = 1;
    this.candidateAssessmentIdCounter = 1;

    // Initialize will handle creating test users
    this.initializeStorage();
  }

  // Added for interface compatibility
  async initializeStorage(): Promise<void> {
    try {
      // Create admin user for testing if they don't exist yet
      const existingAdmin = await this.getUserByUsername("admin");
      if (!existingAdmin) {
        await this.createUser({
          username: "admin",
          password: await hashPasswordLocal("admin123"),
          email: "admin@example.com",
          fullName: "Admin User",
          role: "admin",
          batch: null
        });
      }

      // Create a candidate user for testing if they don't exist yet
      const existingCandidate = await this.getUserByUsername("candidate");
      if (!existingCandidate) {
        await this.createUser({
          username: "candidate",
          password: await hashPasswordLocal("candidate123"),
          email: "candidate@example.com",
          fullName: "Test Candidate",
          role: "candidate",
          batch: null
        });
      }
    } catch (error) {
      console.error("Error initializing in-memory storage:", error);
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const createdAt = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt,
      role: insertUser.role || "candidate" 
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const existingUser = await this.getUser(id);
    if (!existingUser) {
      throw new Error("User not found");
    }

    const updatedUser = {
      ...existingUser,
      ...userData,
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<void> {
    const existingUser = await this.getUser(id);
    if (!existingUser) {
      throw new Error("User not found");
    }

    // Delete user
    this.users.delete(id);

    // Also delete all associated candidate assessments
    const candidateAssessments = Array.from(this.candidateAssessments.values());
    for (const assessment of candidateAssessments) {
      if (assessment.candidateId === id) {
        this.candidateAssessments.delete(assessment.id);
      }
    }
  }

  async getCandidates(): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.role === "candidate",
    );
  }

  async getBatches(): Promise<string[]> { // Added getBatches implementation
    const batches = new Set<string>();
    for (const user of this.users.values()) {
      if (user.batch) {
        batches.add(user.batch);
      }
    }
    return Array.from(batches);
  }

  async createBatch(name: string): Promise<{ name: string }> { // Added createBatch implementation
    return { name };
  }

  // Assessment operations
  async createAssessment(assessment: InsertAssessment): Promise<Assessment> {
    const id = this.assessmentIdCounter++;
    const createdAt = new Date();
    const newAssessment: Assessment = { 
      ...assessment, 
      id, 
      createdAt,
      description: assessment.description || null,
      timeLimit: assessment.timeLimit || null,
      questions: assessment.questions || []
    };
    this.assessments.set(id, newAssessment);
    return newAssessment;
  }

  async getAssessment(id: number): Promise<Assessment | undefined> {
    return this.assessments.get(id);
  }

  async getAssessments(): Promise<Assessment[]> {
    return Array.from(this.assessments.values());
  }
  
  async updateAssessment(id: number, assessmentData: Partial<Assessment>): Promise<Assessment> {
    const existingAssessment = await this.getAssessment(id);
    if (!existingAssessment) {
      throw new Error("Assessment not found");
    }

    const updatedAssessment = {
      ...existingAssessment,
      ...assessmentData,
    };
    this.assessments.set(id, updatedAssessment);
    return updatedAssessment;
  }

  // Candidate Assessment operations
  async assignAssessment(assignment: InsertCandidateAssessment): Promise<CandidateAssessment> {
    const id = this.candidateAssessmentIdCounter++;
    const newAssignment: CandidateAssessment = { 
      ...assignment, 
      id,
      status: assignment.status || "pending",
      startedAt: assignment.startedAt || null,
      completedAt: assignment.completedAt || null,
      responses: assignment.responses || null,
      score: assignment.score || null,
      feedback: assignment.feedback || null,
      scheduledFor: assignment.scheduledFor || null
    };
    this.candidateAssessments.set(id, newAssignment);
    return newAssignment;
  }

  async getCandidateAssignments(candidateId: number): Promise<CandidateAssessment[]> {
    return Array.from(this.candidateAssessments.values()).filter(
      (assignment) => assignment.candidateId === candidateId,
    );
  }

  async getCandidateAssessments(candidateId: number): Promise<any[]> {
    const assignments = await this.getCandidateAssignments(candidateId);
    const result = [];

    for (const assignment of assignments) {
      const assessment = await this.getAssessment(assignment.assessmentId);
      if (assessment) {
        result.push({
          ...assignment,
          assessment: {
            id: assessment.id,
            title: assessment.title,
            description: assessment.description,
            type: assessment.type,
          }
        });
      }
    }

    return result;
  }

  async getCandidateAssignment(candidateId: number, assessmentId: number): Promise<any | undefined> {
    const assignments = await this.getCandidateAssignments(candidateId);
    const assignment = assignments.find(a => a.assessmentId === assessmentId);

    if (!assignment) return undefined;

    const assessment = await this.getAssessment(assessmentId);
    if (!assessment) return undefined;

    return {
      ...assignment,
      assessment
    };
  }

  async startAssessment(candidateAssessmentId: number, candidateId: number): Promise<CandidateAssessment> {
    const assignment = this.candidateAssessments.get(candidateAssessmentId);
    if (!assignment || assignment.candidateId !== candidateId) {
      throw new Error("Assessment not found or not assigned to this candidate");
    }

    const updatedAssignment: CandidateAssessment = {
      ...assignment,
      status: "in-progress",
      startedAt: new Date(),
    };

    this.candidateAssessments.set(candidateAssessmentId, updatedAssignment);
    return updatedAssignment;
  }

  async submitMCQResponses(candidateAssessmentId: number, candidateId: number, responses: MCQResponse[]): Promise<CandidateAssessment> {
    const assignment = this.candidateAssessments.get(candidateAssessmentId);
    if (!assignment || assignment.candidateId !== candidateId) {
      throw new Error("Assessment not found or not assigned to this candidate");
    }

    const assessment = await this.getAssessment(assignment.assessmentId);
    if (!assessment || assessment.type !== "mcq") {
      throw new Error("Invalid assessment type");
    }

    // Calculate score for MCQ
    let score = 0;
    const questions = assessment.questions as any[];

    for (const response of responses) {
      const question = questions.find(q => q.id === response.questionId);
      if (question && question.correctOptionId === response.selectedOptionId) {
        score++;
      }
    }

    // Convert to percentage
    const percentageScore = Math.round((score / questions.length) * 100);

    const updatedAssignment: CandidateAssessment = {
      ...assignment,
      responses,
      status: "completed",
      completedAt: new Date(),
      score: percentageScore,
    };

    this.candidateAssessments.set(candidateAssessmentId, updatedAssignment);
    return updatedAssignment;
  }

  async submitFillInBlanksResponses(candidateAssessmentId: number, candidateId: number, responses: FillInBlanksResponse[]): Promise<CandidateAssessment> {
    const assignment = this.candidateAssessments.get(candidateAssessmentId);
    if (!assignment || assignment.candidateId !== candidateId) {
      throw new Error("Assessment not found or not assigned to this candidate");
    }

    const assessment = await this.getAssessment(assignment.assessmentId);
    if (!assessment || assessment.type !== "fill-in-blanks") {
      throw new Error("Invalid assessment type");
    }

    // Calculate score for fill-in-blanks
    let totalBlanks = 0;
    let correctBlanks = 0;
    const questions = assessment.questions as any[];

    for (const response of responses) {
      const question = questions.find(q => q.id === response.questionId);
      if (question) {
        question.blanks.forEach((blank: any) => {
          totalBlanks++;
          const userAnswer = response.answers[blank.id];
          if (userAnswer && userAnswer.toLowerCase() === blank.correctAnswer.toLowerCase()) {
            correctBlanks++;
          }
        });
      }
    }

    // Convert to percentage
    const percentageScore = totalBlanks > 0 ? Math.round((correctBlanks / totalBlanks) * 100) : 0;

    const updatedAssignment: CandidateAssessment = {
      ...assignment,
      responses,
      status: "completed",
      completedAt: new Date(),
      score: percentageScore,
    };

    this.candidateAssessments.set(candidateAssessmentId, updatedAssignment);
    return updatedAssignment;
  }

  async submitVideoResponses(candidateAssessmentId: number, candidateId: number, responses: VideoResponse[]): Promise<CandidateAssessment> {
    const assignment = this.candidateAssessments.get(candidateAssessmentId);
    if (!assignment || assignment.candidateId !== candidateId) {
      throw new Error("Assessment not found or not assigned to this candidate");
    }

    const assessment = await this.getAssessment(assignment.assessmentId);
    if (!assessment || assessment.type !== "video") {
      throw new Error("Invalid assessment type");
    }

    const updatedAssignment: CandidateAssessment = {
      ...assignment,
      responses,
      status: "completed",
      completedAt: new Date(),
    };

    this.candidateAssessments.set(candidateAssessmentId, updatedAssignment);
    return updatedAssignment;
  }

  async provideFeedback(candidateAssessmentId: number, feedback: string, score?: number): Promise<CandidateAssessment> {
    const assignment = this.candidateAssessments.get(candidateAssessmentId);
    if (!assignment) {
      throw new Error("Assignment not found");
    }

    const updatedAssignment: CandidateAssessment = {
      ...assignment,
      feedback,
      status: "reviewed",
    };

    if (score !== undefined) {
      updatedAssignment.score = score;
    }

    this.candidateAssessments.set(candidateAssessmentId, updatedAssignment);
    return updatedAssignment;
  }


}

// PostgreSQL Storage Implementation
export class PostgresStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;
  sessionStore: any;

  constructor() {
    // Initialize PostgreSQL connection
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    this.db = drizzle(pool);

    // Initialize session store
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async initializeStorage(): Promise<void> {
    try {
      console.log("Initializing PostgreSQL storage and creating admin user...");

      // Create admin user for testing
      const existingAdmin = await this.getUserByUsername("admin");
      if (!existingAdmin) {
        await this.createUser({
          username: "admin",
          password: await hashPasswordLocal("admin123"), // Manually hash password
          email: "admin@example.com",
          fullName: "Admin User",
          role: "admin",
          batch: null
        });
        console.log("Admin user created");
      }

      // Create candidate user for testing
      const existingCandidate = await this.getUserByUsername("candidate");
      if (!existingCandidate) {
        await this.createUser({
          username: "candidate", 
          password: await hashPasswordLocal("candidate123"), // Manually hash password
          email: "candidate@example.com",
          fullName: "Test Candidate",
          role: "candidate",
          batch: null
        });
        console.log("Candidate user created");
      }
    } catch (error) {
      console.error("Error initializing storage:", error);
      throw error;
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values({
      ...user,
      role: user.role || "candidate",
      createdAt: new Date()
    }).returning();
    return result[0];
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const existingUser = await this.getUser(id);
    if (!existingUser) {
      throw new Error("User not found");
    }

    const result = await this.db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();

    return result[0];
  }

  async deleteUser(id: number): Promise<void> {
    const existingUser = await this.getUser(id);
    if (!existingUser) {
      throw new Error("User not found");
    }

    // First delete all related candidate assessments
    await this.db.delete(candidateAssessments)
      .where(eq(candidateAssessments.candidateId, id));

    // Then delete the user
    await this.db.delete(users)
      .where(eq(users.id, id));
  }

  async getCandidates(): Promise<User[]> {
    return await this.db.select().from(users).where(eq(users.role, "candidate"));
  }

  async getBatches(): Promise<string[]> { // Added getBatches implementation for Postgres
    const result = await this.db.query.raw`SELECT DISTINCT batch FROM users WHERE batch IS NOT NULL ORDER BY batch`;
    return result.rows.map(row => row.batch as string);
  }

  async createBatch(name: string): Promise<{ name: string }> { // Added createBatch implementation for Postgres
    return { name };
  }

  // Assessment operations
  async createAssessment(assessment: InsertAssessment): Promise<Assessment> {
    const result = await this.db.insert(assessments).values({
      ...assessment,
      description: assessment.description || null,
      timeLimit: assessment.timeLimit || null,
      questions: assessment.questions || [],
      createdAt: new Date()
    }).returning();
    return result[0];
  }

  async getAssessment(id: number): Promise<Assessment | undefined> {
    const result = await this.db.select().from(assessments).where(eq(assessments.id, id));
    return result[0];
  }

  async getAssessments(): Promise<Assessment[]> {
    return await this.db.select().from(assessments);
  }
  
  async updateAssessment(id: number, assessmentData: Partial<Assessment>): Promise<Assessment> {
    const existingAssessment = await this.getAssessment(id);
    if (!existingAssessment) {
      throw new Error("Assessment not found");
    }

    const result = await this.db.update(assessments)
      .set(assessmentData)
      .where(eq(assessments.id, id))
      .returning();

    return result[0];
  }

  // Candidate Assessment operations
  async assignAssessment(assignment: InsertCandidateAssessment): Promise<CandidateAssessment> {
    const result = await this.db.insert(candidateAssessments).values({
      candidateId: assignment.candidateId,
      assessmentId: assignment.assessmentId,
      status: assignment.status || "pending",
      startedAt: assignment.startedAt || null,
      completedAt: assignment.completedAt || null,
      responses: assignment.responses || null,
      score: assignment.score || null,
      feedback: assignment.feedback || null,
      scheduledFor: assignment.scheduledFor || null
    }).returning();

    return result[0];
  }

  async getCandidateAssignments(candidateId: number): Promise<CandidateAssessment[]> {
    return await this.db.select().from(candidateAssessments)
      .where(eq(candidateAssessments.candidateId, candidateId));
  }

  async getCandidateAssessments(candidateId: number): Promise<any[]> {
    const assignments = await this.getCandidateAssignments(candidateId);
    const result = [];

    for (const assignment of assignments) {
      const assessment = await this.getAssessment(assignment.assessmentId);
      if (assessment) {
        result.push({
          ...assignment,
          assessment: {
            id: assessment.id,
            title: assessment.title,
            description: assessment.description,
            type: assessment.type,
          }
        });
      }
    }

    return result;
  }

  async getCandidateAssignment(candidateId: number, assessmentId: number): Promise<any | undefined> {
    const result = await this.db.select().from(candidateAssessments)
      .where(and(
        eq(candidateAssessments.candidateId, candidateId),
        eq(candidateAssessments.assessmentId, assessmentId)
      ));

    if (result.length === 0) return undefined;

    const assignment = result[0];
    const assessment = await this.getAssessment(assessmentId);
    if (!assessment) return undefined;

    return {
      ...assignment,
      assessment
    };
  }

  async startAssessment(candidateAssessmentId: number, candidateId: number): Promise<CandidateAssessment> {
    const assignments = await this.db.select().from(candidateAssessments)
      .where(and(
        eq(candidateAssessments.id, candidateAssessmentId),
        eq(candidateAssessments.candidateId, candidateId)
      ));

    if (assignments.length === 0) {
      throw new Error("Assessment not found or not assigned to this candidate");
    }

    const result = await this.db.update(candidateAssessments)
      .set({
        status: "in-progress",
        startedAt: new Date()
      })
      .where(eq(candidateAssessments.id, candidateAssessmentId))
      .returning();

    return result[0];
  }

  async submitMCQResponses(candidateAssessmentId: number, candidateId: number, responses: MCQResponse[]): Promise<CandidateAssessment> {
    const assignments = await this.db.select().from(candidateAssessments)
      .where(and(
        eq(candidateAssessments.id, candidateAssessmentId),
        eq(candidateAssessments.candidateId, candidateId)
      ));

    if (assignments.length === 0) {
      throw new Error("Assessment not found or not assigned to this candidate");
    }

    const assignment = assignments[0];
    const assessment = await this.getAssessment(assignment.assessmentId);

    if (!assessment || assessment.type !== "mcq") {
      throw new Error("Invalid assessment type");
    }

    // Calculate score for MCQ
    let score = 0;
    const questions = assessment.questions as any[];

    for (const response of responses) {
      const question = questions.find((q: any) => q.id === response.questionId);
      if (question && question.correctOptionId === response.selectedOptionId) {
        score++;
      }
    }

    // Convert to percentage
    const percentageScore = Math.round((score / questions.length) * 100);

    const result = await this.db.update(candidateAssessments)
      .set({
        responses: responses,
        status: "completed",
        completedAt: new Date(),
        score: percentageScore
      })
      .where(eq(candidateAssessments.id, candidateAssessmentId))
      .returning();

    return result[0];
  }

  async submitFillInBlanksResponses(candidateAssessmentId: number, candidateId: number, responses: FillInBlanksResponse[]): Promise<CandidateAssessment> {
    const assignments = await this.db.select().from(candidateAssessments)
      .where(and(
        eq(candidateAssessments.id, candidateAssessmentId),
        eq(candidateAssessments.candidateId, candidateId)
      ));

    if (assignments.length === 0) {
      throw new Error("Assessment not found or not assigned to this candidate");
    }

    const assignment = assignments[0];
    const assessment = await this.getAssessment(assignment.assessmentId);

    if (!assessment || assessment.type !== "fill-in-blanks") {
      throw new Error("Invalid assessment type");
    }

    // Calculate score for fill-in-blanks
    let totalBlanks = 0;
    let correctBlanks = 0;
    const questions = assessment.questions as any[];

    for (const response of responses) {
      const question = questions.find((q: any) => q.id === response.questionId);
      if (question) {
        question.blanks.forEach((blank: any) => {
          totalBlanks++;
          const userAnswer = response.answers[blank.id];
          if (userAnswer && userAnswer.toLowerCase() === blank.correctAnswer.toLowerCase()) {
            correctBlanks++;
          }
        });
      }
    }

    // Convert to percentage
    const percentageScore = totalBlanks > 0 ? Math.round((correctBlanks / totalBlanks) * 100) : 0;

    const result = await this.db.update(candidateAssessments)
      .set({
        responses: responses,
        status: "completed",
        completedAt: new Date(),
        score: percentageScore
      })
      .where(eq(candidateAssessments.id, candidateAssessmentId))
      .returning();

    return result[0];
  }

  async submitVideoResponses(candidateAssessmentId: number, candidateId: number, responses: VideoResponse[]): Promise<CandidateAssessment> {
    const assignments = await this.db.select().from(candidateAssessments)
      .where(and(
        eq(candidateAssessments.id, candidateAssessmentId),
        eq(candidateAssessments.candidateId, candidateId)
      ));

    if (assignments.length === 0) {
      throw new Error("Assessment not found or not assigned to this candidate");
    }

    const assignment = assignments[0];
    const assessment = await this.getAssessment(assignment.assessmentId);

    if (!assessment || assessment.type !== "video") {
      throw new Error("Invalid assessment type");
    }

    const result = await this.db.update(candidateAssessments)
      .set({
        responses: responses,
        status: "completed",
        completedAt: new Date()
      })
      .where(eq(candidateAssessments.id, candidateAssessmentId))
      .returning();

    return result[0];
  }

  async provideFeedback(candidateAssessmentId: number, feedback: string, score?: number): Promise<CandidateAssessment> {
    const assignments = await this.db.select().from(candidateAssessments)
      .where(eq(candidateAssessments.id, candidateAssessmentId));

    if (assignments.length === 0) {
      throw new Error("Assignment not found");
    }

    const updateData: any = {
      feedback: feedback,
      status: "reviewed"
    };

    if (score !== undefined) {
      updateData.score = score;
    }

    const result = await this.db.update(candidateAssessments)
      .set(updateData)
      .where(eq(candidateAssessments.id, candidateAssessmentId))
      .returning();

    return result[0];
  }
}

// Choose which storage implementation to use
export const storage = process.env.DATABASE_URL
  ? new PostgresStorage()
  : new MemStorage();