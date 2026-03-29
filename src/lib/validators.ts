import { z } from "zod";

export const storyFormSchema = z.object({
  childName: z
    .string()
    .min(1, "Please enter the child's name")
    .max(50, "Name must be 50 characters or less"),
  age: z
    .number()
    .int("Age must be a whole number")
    .min(2, "Age must be at least 2")
    .max(12, "Age must be 12 or less"),
  theme: z
    .string()
    .min(1, "Please enter a story theme or moral")
    .max(200, "Theme must be 200 characters or less"),
  character: z.string().max(100, "Character must be 100 characters or less").optional(),
  setting: z.string().max(100, "Setting must be 100 characters or less").optional(),
  length: z.enum(["short", "medium"]),
});

export type StoryFormData = z.infer<typeof storyFormSchema>;
