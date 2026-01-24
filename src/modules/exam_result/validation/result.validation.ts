import { z } from "zod";

/**
 * Zod Schema for Generating Results
 */
export const generateResultsSchema = z.object({
  examId: z.string().uuid("Invalid exam ID"),
});

export type GenerateResultsInput = z.infer<typeof generateResultsSchema>;
