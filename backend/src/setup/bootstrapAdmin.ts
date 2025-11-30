import { supabaseAdmin } from "../lib/supabaseClient";
import { logger } from "../lib/logger";

const ADMIN_EMAIL = process.env.DEFAULT_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD;
const ADMIN_NAME = process.env.DEFAULT_ADMIN_NAME ?? "Admin";

export const bootstrapAdmin = async () => {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    logger.warn("Default admin credentials not configured; skipping bootstrap.");
    return;
  }

  try {
    const existing = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const alreadyPresent = existing.data?.users?.some((user) => user.email === ADMIN_EMAIL);
    if (alreadyPresent) {
      logger.info("Default admin already present", { email: ADMIN_EMAIL });
      return;
    }

    const { error } = await supabaseAdmin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: ADMIN_NAME,
        role: "admin"
      }
    });

    if (error) {
      throw error;
    }

    logger.info("Default admin user created", { email: ADMIN_EMAIL });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("Failed to bootstrap default admin", { message });
  }
};
