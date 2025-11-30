import jwt from "jsonwebtoken";
import { UserRole } from "../shared/types.js";

interface TokenPayload {
  sub: string;
  email: string;
  role: UserRole;
}

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error("Configurare JWT_SECRET");
}

const accessExpirationMinutes = Number(process.env.TOKEN_EXPIRATION_MINUTES ?? 60);
const refreshExpirationDays = Number(process.env.REFRESH_TOKEN_EXPIRATION_DAYS ?? 30);

export const signAccessToken = (payload: TokenPayload) =>
  jwt.sign(payload, jwtSecret, { expiresIn: `${accessExpirationMinutes}m` });

export const signRefreshToken = (payload: TokenPayload) =>
  jwt.sign(payload, jwtSecret, { expiresIn: `${refreshExpirationDays}d` });

export const verifyToken = (token: string) =>
  jwt.verify(token, jwtSecret) as TokenPayload;
