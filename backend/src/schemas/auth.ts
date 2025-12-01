import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10)
});

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  role: z.enum(["operaio", "admin"])
});

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  currentPassword: z.string().min(6).optional(),
  newPassword: z.string().min(8).optional()
}).refine(
  (data) => {
    // Se newPassword è presente, currentPassword deve esserlo anche
    if (data.newPassword && !data.currentPassword) {
      return false;
    }
    return true;
  },
  { message: "Password corrente richiesta per cambiare password" }
);