import { supabaseAdmin } from "../lib/supabaseClient.js";
import { logger } from "../lib/logger.js";

const ADMIN_EMAIL = process.env.DEFAULT_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD;
const ADMIN_NAME = process.env.DEFAULT_ADMIN_NAME ?? "Admin";

export const bootstrapAdmin = async () => {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    logger.warn("Default admin credentials not configured; skipping bootstrap.");
  } else {
    try {
      const existing = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
      const alreadyPresent = existing.data?.users?.some((user) => user.email === ADMIN_EMAIL);
      if (!alreadyPresent) {
        const { error } = await supabaseAdmin.auth.admin.createUser({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          email_confirm: true,
          user_metadata: {
            full_name: ADMIN_NAME,
            role: "admin"
          }
        });

        if (error) throw error;
        logger.info("Default admin user created", { email: ADMIN_EMAIL });
      } else {
        logger.info("Default admin already present", { email: ADMIN_EMAIL });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error("Failed to bootstrap default admin", { message });
    }
  }

  // Optional responsabile bootstrap
  const RESPONSABILE_EMAIL = process.env.DEFAULT_RESPONSABILE_EMAIL;
  const RESPONSABILE_PASSWORD = process.env.DEFAULT_RESPONSABILE_PASSWORD;
  const RESPONSABILE_NAME = process.env.DEFAULT_RESPONSABILE_NAME ?? "Responsabile";

  if (RESPONSABILE_EMAIL && RESPONSABILE_PASSWORD) {
    try {
      const existing = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
      const alreadyPresent = existing.data?.users?.some((user) => user.email === RESPONSABILE_EMAIL);
      if (!alreadyPresent) {
        const { error } = await supabaseAdmin.auth.admin.createUser({
          email: RESPONSABILE_EMAIL,
          password: RESPONSABILE_PASSWORD,
          email_confirm: true,
          user_metadata: {
            full_name: RESPONSABILE_NAME,
            role: "responsabile"
          }
        });

        if (error) throw error;
        logger.info("Default responsabile user created", { email: RESPONSABILE_EMAIL });
      } else {
        logger.info("Default responsabile already present", { email: RESPONSABILE_EMAIL });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error("Failed to bootstrap default responsabile", { message });
    }
  }
};
