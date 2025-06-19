import { z } from "zod";

export const studentSchema = z
  .object({
    _id: z.string().optional(),
    name: z
      .string()
      .min(1, { message: "Name is required" })
      .max(100, { message: "Name is too long" }),

    email: z.string().email({ message: "Invalid email format" }),
    mobileNumber: z
      .string()
      .regex(/^\d{10}$/, { message: "Phone number must be 10 digits" }),

    cf_handle: z.string().min(1, { message: "Codeforces handle is required" }),
    currentRating: z.number(),
    maxRating: z.number(),
  })
  .superRefine(async (data, ctx) => {
    const res = await fetch(
      `https://codeforces.com/api/user.info?handles=${data.cf_handle}`
    );
    const json = await res.json();

    if (json.status !== "OK") {
      ctx.addIssue({
        path: ["handle"],
        code: z.ZodIssueCode.custom,
        message: "Codeforces handle does not exist",
      });
    }
  });

export interface Contest {
  contestId: number;
  contestName: string;
  handle: Student;
  rank: number;
  ratingUpdateTimeSeconds: number;
  oldRating: number;
  newRating: number;
}

export interface Problem {
  id: number;
  contestId: number;
  creationTimeSeconds: number;
  problem: {
    contestId: number;
    index: string;
    name: string;
    type: string;
    points: number;
    rating: number;
    tags: string[];
  };
  author: {
    members: Student[];
  };
  verdict: string;
}

export type Student = z.infer<typeof studentSchema> & {
  _id: string;
  contests?: Contest[];
  problems?: Problem[];
  reminderEmailCount: number;
  isReminderEnabled: boolean;
  updatedAt: Date;
};
