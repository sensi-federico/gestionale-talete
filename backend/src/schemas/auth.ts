import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email non valida"),
  password: z.string().min(6, "Password deve avere almeno 6 caratteri")
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10, "Token non valido")
});

export const createUserSchema = z.object({
  email: z.string().email("Email non valida"),
  password: z.string().min(8, "Password deve avere almeno 8 caratteri"),
  fullName: z.string().min(2, "Nome deve avere almeno 2 caratteri"),
  role: z.enum(["operaio", "admin", "impresa"], { errorMap: () => ({ message: "Ruolo non valido" }) }),
  impresaId: z.string().uuid("ID impresa non valido").optional().or(z.literal("")).transform((val) => (val && val.trim() !== "" ? val : undefined))
}).refine(
  (data) => {
    // Se ruolo è impresa, impresaId deve essere presente
    if (data.role === "impresa" && !data.impresaId) {
      return false;
    }
    return true;
  },
  { message: "Impresa richiesta per utenti con ruolo impresa" }
);

export const updateProfileSchema = z.object({
  fullName: z.string().min(2, "Nome deve avere almeno 2 caratteri").optional(),
  currentPassword: z.string().min(6, "Password corrente non valida").optional(),
  newPassword: z.string().min(8, "Nuova password deve avere almeno 8 caratteri").optional()
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