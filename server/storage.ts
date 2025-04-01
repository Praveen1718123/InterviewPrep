import { 
  User, InsertUser, 
  Assessment, InsertAssessment, 
  CandidateAssessment, InsertCandidateAssessment, 
  MCQResponse, FillInBlanksResponse, VideoResponse,
  mcqQuestionSchema
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Modify the interface with any CRUD methods you might need
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getCandidates(): Promise<User[]>;
  
  // Assessment operations
  createAssessment(assessment: InsertAssessment): Promise<Assessment>;
  getAssessment(id: number): Promise<Assessment | undefined>;
  getAssessments(): Promise<Assessment[]>;
  
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
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private assessments: Map<number, Assessment>;
  private candidateAssessments: Map<number, CandidateAssessment>;
  sessionStore: session.SessionStore;
  
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
    
    // Create test users
    this.createUser({
      username: "admin",
      password: "admin123", // This will be hashed in auth.ts
      email: "admin@example.com",
      fullName: "Admin User",
      role: "admin"
    });
    
    // Create a candidate user for testing
    this.createUser({
      username: "candidate",
      password: "candidate123", // This will be hashed in auth.ts
      email: "candidate@example.com",
      fullName: "Test Candidate",
      role: "candidate"
    });
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
    const user: User = { ...insertUser, id, createdAt };
    this.users.set(id, user);
    return user;
  }

  async getCandidates(): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.role === "candidate",
    );
  }

  // Assessment operations
  async createAssessment(assessment: InsertAssessment): Promise<Assessment> {
    const id = this.assessmentIdCounter++;
    const createdAt = new Date();
    const newAssessment: Assessment = { ...assessment, id, createdAt };
    this.assessments.set(id, newAssessment);
    return newAssessment;
  }

  async getAssessment(id: number): Promise<Assessment | undefined> {
    return this.assessments.get(id);
  }

  async getAssessments(): Promise<Assessment[]> {
    return Array.from(this.assessments.values());
  }

  // Candidate Assessment operations
  async assignAssessment(assignment: InsertCandidateAssessment): Promise<CandidateAssessment> {
    const id = this.candidateAssessmentIdCounter++;
    const newAssignment: CandidateAssessment = { ...assignment, id };
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

export const storage = new MemStorage();
