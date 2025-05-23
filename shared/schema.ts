import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Batches model
export const batches = pgTable("batches", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});

export const insertBatchSchema = createInsertSchema(batches).omit({
  id: true,
  createdAt: true,
});

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: text("role", { enum: ["admin", "candidate"] }).notNull().default("candidate"),
  batchId: integer("batchId").references(() => batches.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// Assessment model
export const assessments = pgTable("assessments", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type", { enum: ["mcq", "fill-in-blanks", "video", "brief-answers"] }).notNull(),
  createdBy: integer("created_by").notNull(), // Admin user ID
  questions: json("questions").notNull(), // Array of questions
  timeLimit: integer("time_limit"), // Total time limit in minutes for the whole assessment
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAssessmentSchema = createInsertSchema(assessments).omit({
  id: true,
  createdAt: true,
});

// CandidateAssessment model - links candidates to assessments
export const candidateAssessments = pgTable("candidate_assessments", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id").notNull(), // User ID
  assessmentId: integer("assessment_id").notNull(), // Assessment ID
  status: text("status", { enum: ["pending", "in-progress", "completed", "reviewed"] }).notNull().default("pending"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  responses: json("responses"), // Candidate's responses
  score: integer("score"), // For automatically scored assessments (MCQ)
  feedback: text("feedback"), // Admin's feedback
  scheduledFor: timestamp("scheduled_for"),
});

export const insertCandidateAssessmentSchema = createInsertSchema(candidateAssessments).omit({
  id: true,
});

// Assessment question types
export const mcqQuestionSchema = z.object({
  id: z.string(),
  text: z.string(),
  options: z.array(z.object({
    id: z.string(),
    text: z.string(),
  })),
  correctOptionId: z.string(),
  timeLimit: z.number().int().optional(), // Time limit in seconds
});

export const fillInBlanksQuestionSchema = z.object({
  id: z.string(),
  text: z.string(),
  blanks: z.array(z.object({
    id: z.string(),
    correctAnswer: z.string(),
  })),
  timeLimit: z.number().int().optional(), // Time limit in seconds
});

export const videoQuestionSchema = z.object({
  id: z.string(),
  text: z.string(),
  timeLimit: z.number().int(), // In seconds
});

export const briefAnswerQuestionSchema = z.object({
  id: z.string(),
  text: z.string(),
  expectedAnswerLength: z.number().int().optional(), // Guideline for answer length in characters
  timeLimit: z.number().int().optional(), // Time limit in seconds
});

// Response types
export const mcqResponseSchema = z.object({
  questionId: z.string(),
  selectedOptionId: z.string(),
});

export const fillInBlanksResponseSchema = z.object({
  questionId: z.string(),
  answers: z.record(z.string()),
});

export const videoResponseSchema = z.object({
  questionId: z.string(),
  videoUrl: z.string(),
});

export const briefAnswerResponseSchema = z.object({
  questionId: z.string(),
  answer: z.string(),
});

// Types
export type InsertBatch = z.infer<typeof insertBatchSchema>;
export type Batch = typeof batches.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertAssessment = z.infer<typeof insertAssessmentSchema>;
export type Assessment = typeof assessments.$inferSelect;

export type InsertCandidateAssessment = z.infer<typeof insertCandidateAssessmentSchema>;
export type CandidateAssessment = typeof candidateAssessments.$inferSelect;

export type MCQQuestion = z.infer<typeof mcqQuestionSchema>;
export type FillInBlanksQuestion = z.infer<typeof fillInBlanksQuestionSchema>;
export type VideoQuestion = z.infer<typeof videoQuestionSchema>;
export type BriefAnswerQuestion = z.infer<typeof briefAnswerQuestionSchema>;

export type MCQResponse = z.infer<typeof mcqResponseSchema>;
export type FillInBlanksResponse = z.infer<typeof fillInBlanksResponseSchema>;
export type VideoResponse = z.infer<typeof videoResponseSchema>;
export type BriefAnswerResponse = z.infer<typeof briefAnswerResponseSchema>;

// Define relations
import { relations } from "drizzle-orm";

export const batchesRelations = relations(batches, ({ many }) => ({
  users: many(users),
}));

export const usersRelations = relations(users, ({ one }) => ({
  batch: one(batches, {
    fields: [users.batchId],
    references: [batches.id],
  }),
}));

export const assessmentsRelations = relations(assessments, ({ many }) => ({
  candidateAssessments: many(candidateAssessments),
}));

export const candidateAssessmentsRelations = relations(candidateAssessments, ({ one }) => ({
  assessment: one(assessments, {
    fields: [candidateAssessments.assessmentId],
    references: [assessments.id],
  }),
  candidate: one(users, {
    fields: [candidateAssessments.candidateId],
    references: [users.id],
  }),
}));
