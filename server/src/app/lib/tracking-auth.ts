import { NextFunction, Request, Response } from "express";
import { UserStatus } from "../../generated/prisma";
import { prisma } from "./prisma";
import { CookieUtils } from "../utils/cookie";

export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const token = CookieUtils.getCookie(req, "better-auth.session_token");
    if (token) {
      const session = await prisma.session.findFirst({
        where: { token, expiresAt: { gt: new Date() } },
        select: {
          user: {
            select: {
              id: true,
              role: true,
              email: true,
              status: true,
              isDeleted: true,
            },
          },
        },
      });

      const u = session?.user;
      if (u && u.status === UserStatus.ACTIVE && !u.isDeleted) {
        req.user = { userId: u.id, role: u.role, email: u.email };
      }
    }
  } catch {
  }
  next();
};