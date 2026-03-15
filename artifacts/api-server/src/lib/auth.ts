import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dating-app-secret-key-2024";

export interface AuthPayload {
  userId: number;
  email: string;
  isAdmin: boolean;
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string): AuthPayload {
  return jwt.verify(token, JWT_SECRET) as AuthPayload;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const token = auth.slice(7);
    const payload = verifyToken(token);
    (req as any).user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

export function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user as AuthPayload;
  if (!user?.isAdmin) {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}
