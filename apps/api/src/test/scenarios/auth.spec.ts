import { describe, test, expect, afterAll, vi } from "vitest";
import { UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { createHash } from "crypto";
import request from "supertest";
import { getApp, closeApp } from "../helpers/setup";
import { getPrisma } from "../helpers/prisma";
import { Scenario } from "../helpers/scenario";
import {
  loginAs,
  loginExpecting,
  refreshTokens,
  refreshExpecting,
} from "../steps/auth.steps";
import { AuthService } from "../../auth/auth.service";
import { AuthController } from "../../auth/auth.controller";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { GoogleAuthGuard } from "../../auth/guards/google-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { GoogleStrategy } from "../../auth/strategies/google.strategy";
import { JwtStrategy } from "../../auth/strategies/jwt.strategy";
import { JwtRefreshStrategy } from "../../auth/strategies/jwt-refresh.strategy";
import { ApiException } from "../../common/errors/api-error";
import { PrismaService } from "../../prisma/prisma.service";

afterAll(async () => {
  await closeApp();
});

function cookieFor(cookies: string[], name: string): string {
  const cookie = cookies.find((value) => value.startsWith(`${name}=`));
  if (!cookie) throw new Error(`Missing ${name} cookie`);
  return cookie;
}

function cookieValue(cookie: string): string {
  return cookie.split(";", 1)[0].split("=", 2)[1];
}

function decodeJwtPayload(token: string): Record<string, any> {
  return JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
}

function expectAuthCookie(cookie: string, maxAge: number) {
  expect(cookie).toContain("HttpOnly");
  expect(cookie).toContain("SameSite=Lax");
  expect(cookie).toContain("Path=/");
  expect(cookie).toContain(`Max-Age=${maxAge}`);
}

describe("Auth", () => {
  test("Login with valid credentials returns tokens and cookies", async () => {
    const app = await getApp();
    const s = new Scenario("Login: valid credentials");

    const tokens = await s.step(
      "Login as sales@hassad.com with correct password",
      () => loginAs(app, "sales@hassad.com", "password123"),
    );
    expect(tokens.accessToken).toBeTruthy();
    expect(typeof tokens.accessToken).toBe("string");
    expect(tokens.accessToken.split(".")).toHaveLength(3); // JWT has 3 parts

    s.finish();
  });

  test("Login with wrong password returns 401", async () => {
    const app = await getApp();
    const s = new Scenario("Login: wrong password");

    const result = await s.step("Login with invalid password", () =>
      loginExpecting(app, "sales@hassad.com", "wrong-password"),
    );
    expect(result.status).toBe(401);
    expect(result.body.error.code).toBe("AUTH_INVALID_CREDENTIALS");

    s.finish();
  });

  test("Locked account returns a stable lockout code", async () => {
    const app = await getApp();
    const prisma = getPrisma();
    const lockedUntil = new Date(Date.now() + 5 * 60 * 1000);
    const user = await prisma.user.update({
      where: { email: "sales@hassad.com" },
      data: { failedLoginAttempts: 5, lockedUntil },
    });

    try {
      const result = await loginExpecting(
        app,
        "sales@hassad.com",
        "password123",
      );
      expect(result.status).toBe(429);
      expect(result.body.error.code).toBe("AUTH_ACCOUNT_LOCKED");
    } finally {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
    }
  });

  test("Duplicate registration returns a stable conflict code", async () => {
    const app = await getApp();
    const result = await request(app.getHttpServer())
      .post("/v1/auth/register")
      .send({
        name: "Existing User",
        email: "sales@hassad.com",
        password: "password123",
        phone: "+15555550123",
        businessType: "OTHER",
      });

    expect(result.status).toBe(409);
    expect(result.body.error.code).toBe("AUTH_EMAIL_ALREADY_EXISTS");
  });

  test("Refresh without a cookie returns a stable missing-token code", async () => {
    const app = await getApp();
    const result = await request(app.getHttpServer()).post("/v1/auth/refresh");

    expect(result.status).toBe(401);
    expect(result.body.error.code).toBe("AUTH_REFRESH_TOKEN_MISSING");
  });

  test("Invalid reset token returns a stable code", async () => {
    const app = await getApp();
    const result = await request(app.getHttpServer())
      .post("/v1/auth/reset-password")
      .send({ token: "invalid-reset-token", password: "new-password" });

    expect(result.status).toBe(401);
    expect(result.body.error.code).toBe("AUTH_INVALID_RESET_TOKEN");
  });

  test("Successful password reset revokes all active sessions", async () => {
    const app = await getApp();
    const authService = app.get(AuthService);
    const prisma = getPrisma();
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: "sales@hassad.com" },
    });
    const original = {
      passwordHash: user.passwordHash,
      resetToken: user.resetToken,
      resetTokenExpiresAt: user.resetTokenExpiresAt,
    };
    const firstTokens = await loginAs(app, "sales@hassad.com", "password123");
    const secondTokens = await loginAs(app, "sales@hassad.com", "password123");
    const resetToken = await authService.generateResetToken(user.id);
    const storedResetUser = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
    });

    try {
      const activeBeforeReset = await prisma.session.count({
        where: {
          userId: user.id,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
      });
      expect(activeBeforeReset).toBeGreaterThanOrEqual(2);

      const response = await request(app.getHttpServer())
        .post("/v1/auth/reset-password")
        .send({ token: resetToken, password: "reset-password" });
      const updatedUser = await prisma.user.findUniqueOrThrow({
        where: { id: user.id },
      });
      const activeAfterReset = await prisma.session.count({
        where: {
          userId: user.id,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
      });

      expect(response.status).toBe(200);
      expect(response.body.data.message).toBe(
        "Password has been reset successfully.",
      );
      expect(updatedUser.passwordHash).not.toBe(original.passwordHash);
      expect(updatedUser.resetToken).toBeNull();
      expect(updatedUser.resetTokenExpiresAt).toBeNull();
      expect(storedResetUser.resetToken).toBe(
        createHash("sha256").update(resetToken).digest("hex"),
      );
      expect(storedResetUser.resetToken).not.toBe(resetToken);
      expect(activeAfterReset).toBe(0);

      const firstSessionResponse = await request(app.getHttpServer())
        .get("/v1/projects")
        .auth(firstTokens.accessToken, { type: "bearer" });
      const secondSessionResponse = await request(app.getHttpServer())
        .get("/v1/projects")
        .auth(secondTokens.accessToken, { type: "bearer" });
      expect(firstSessionResponse.status).toBe(401);
      expect(secondSessionResponse.status).toBe(401);
      expect(firstSessionResponse.body.error.code).toBe("AUTH_UNAUTHORIZED");
      expect(secondSessionResponse.body.error.code).toBe("AUTH_UNAUTHORIZED");
    } finally {
      await prisma.user.update({ where: { id: user.id }, data: original });
    }
  });

  test("Reset tokens are one-time under concurrent reset attempts", async () => {
    const app = await getApp();
    const authService = app.get(AuthService);
    const prisma = getPrisma();
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: "sales@hassad.com" },
    });
    const original = {
      passwordHash: user.passwordHash,
      resetToken: user.resetToken,
      resetTokenExpiresAt: user.resetTokenExpiresAt,
    };
    const resetToken = await authService.generateResetToken(user.id);

    try {
      const attempts = await Promise.allSettled([
        authService.resetPassword(resetToken, "concurrent-one"),
        authService.resetPassword(resetToken, "concurrent-two"),
      ]);
      const successes = attempts.filter(
        (attempt) => attempt.status === "fulfilled",
      );
      const failures = attempts.filter(
        (attempt): attempt is PromiseRejectedResult =>
          attempt.status === "rejected",
      );

      expect(successes).toHaveLength(1);
      expect(failures).toHaveLength(1);
      expect(failures[0].reason.getResponse()).toMatchObject({
        code: "AUTH_INVALID_RESET_TOKEN",
      });
      await expect(
        authService.resetPassword(resetToken, "second-use"),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          code: "AUTH_INVALID_RESET_TOKEN",
        }),
      });
    } finally {
      await prisma.user.update({ where: { id: user.id }, data: original });
    }
  });

  test("Unauthenticated access returns a stable auth code", async () => {
    const app = await getApp();
    const result = await request(app.getHttpServer()).get("/v1/projects");

    expect(result.status).toBe(401);
    expect(result.body.error.code).toBe("AUTH_UNAUTHORIZED");
  });

  test("Missing refresh secret raises a stable server error without signing a refresh token", async () => {
    const passwordHash = await bcrypt.hash("password123", 4);
    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue({
          id: "user-id",
          name: "Test User",
          email: "test@example.com",
          passwordHash,
          isActive: true,
          lockedUntil: null,
          suspendedAt: null,
          suspendedUntil: null,
          failedLoginAttempts: 0,
          role: { name: "SALES", permissions: [] },
          permissions: [],
          departments: [],
        }),
        update: vi.fn().mockResolvedValue({}),
      },
      securityEvent: { create: vi.fn().mockResolvedValue({}) },
      client: { findFirst: vi.fn() },
      $transaction: vi.fn().mockResolvedValue([]),
    };
    const jwtService = { sign: vi.fn().mockReturnValue("access-token") };
    const configService = { get: vi.fn().mockReturnValue(undefined) };
    const service = new AuthService(
      prisma as any,
      jwtService as any,
      configService as any,
      {} as any,
    );

    await expect(
      service.login({
        email: "test@example.com",
        password: "password123",
      } as any),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        code: "AUTH_REFRESH_SECRET_MISSING",
      }),
      status: 500,
    });
    expect(jwtService.sign).not.toHaveBeenCalled();
  });

  test("JWT strategies fail closed when required secrets are missing", () => {
    const missingConfig = { get: vi.fn().mockReturnValue(undefined) };

    expect(() => new JwtStrategy(missingConfig as any, {} as any)).toThrow(
      ApiException,
    );
    expect(() => new JwtRefreshStrategy(missingConfig as any)).toThrow(
      ApiException,
    );
  });

  test("Logout propagates missing refresh configuration as a safe API error", async () => {
    const app = await getApp();
    const authService = app.get(AuthService);
    const configService = app.get(ConfigService);
    const originalGet = configService.get.bind(configService);
    const getSecret = vi
      .spyOn(configService, "get")
      .mockImplementation(((key: string) =>
        key === "JWT_REFRESH_SECRET" ? undefined : originalGet(key)) as any);

    try {
      await expect(
        authService.revokeSessionFromRefreshToken("refresh-token"),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          code: "AUTH_REFRESH_SECRET_MISSING",
        }),
        status: 500,
      });
    } finally {
      getSecret.mockRestore();
    }
  });

  test("Login creates a hashed session and aligned seven-day auth cookies", async () => {
    const app = await getApp();
    const prisma = getPrisma();
    const response = await request(app.getHttpServer())
      .post("/v1/auth/login")
      .send({ email: "sales@hassad.com", password: "password123" });
    const cookies = response.headers["set-cookie"] as unknown as string[];
    const refreshCookie = cookieFor(cookies, "refreshToken");
    const tokenCookie = cookieFor(cookies, "token");
    const refreshToken = cookieValue(refreshCookie);
    const accessPayload = decodeJwtPayload(response.body.data.accessToken);
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: "sales@hassad.com" },
    });
    const session = await prisma.session.findFirstOrThrow({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    const refreshPayload = decodeJwtPayload(refreshToken);

    expect(response.status).toBe(201);
    expectAuthCookie(refreshCookie, 604800);
    expectAuthCookie(tokenCookie, 60 * 60);
    expect(accessPayload.exp - accessPayload.iat).toBe(15 * 60);
    expect(refreshPayload.sessionId).toBe(session.id);
    expect(await bcrypt.compare(refreshToken, session.refreshTokenHash)).toBe(
      true,
    );
    expect(refreshPayload.exp - refreshPayload.iat).toBe(7 * 24 * 60 * 60);
    expect(
      Math.abs(
        session.expiresAt.getTime() -
          session.createdAt.getTime() -
          7 * 24 * 60 * 60 * 1000,
      ),
    ).toBeLessThan(1000);
  });

  test("Remembered login aligns refresh JWT, session, and cookie to thirty days", async () => {
    const app = await getApp();
    const prisma = getPrisma();
    const response = await request(app.getHttpServer())
      .post("/v1/auth/login")
      .send({
        email: "sales@hassad.com",
        password: "password123",
        rememberMe: true,
      });
    const cookies = response.headers["set-cookie"] as unknown as string[];
    const refreshCookie = cookieFor(cookies, "refreshToken");
    const refreshToken = cookieValue(refreshCookie);
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: "sales@hassad.com" },
    });
    const session = await prisma.session.findFirstOrThrow({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    const refreshPayload = decodeJwtPayload(refreshToken);

    expect(response.status).toBe(201);
    expectAuthCookie(refreshCookie, 30 * 24 * 60 * 60);
    expect(refreshPayload.exp - refreshPayload.iat).toBe(30 * 24 * 60 * 60);
    expect(
      Math.abs(
        session.expiresAt.getTime() -
          session.createdAt.getTime() -
          30 * 24 * 60 * 60 * 1000,
      ),
    ).toBeLessThan(1000);
  });

  test("Truthful non-boolean rememberMe input uses the normal lifetime", async () => {
    const app = await getApp();
    const response = await request(app.getHttpServer())
      .post("/v1/auth/login")
      .send({
        email: "sales@hassad.com",
        password: "password123",
        rememberMe: "yes",
      });
    const cookies = response.headers["set-cookie"] as unknown as string[];
    const accessPayload = decodeJwtPayload(response.body.data.accessToken);

    expect(response.status).toBe(201);
    expect(accessPayload.rememberMe).toBe(false);
    expectAuthCookie(cookieFor(cookies, "token"), 60 * 60);
    expectAuthCookie(cookieFor(cookies, "refreshToken"), 7 * 24 * 60 * 60);
  });

  test("AuthService normalizes truthy non-boolean rememberMe across JWT and session lifetimes", async () => {
    const app = await getApp();
    const prisma = getPrisma();
    const authService = app.get(AuthService);
    const result = await authService.login({
      email: "sales@hassad.com",
      password: "password123",
      rememberMe: "yes",
    } as any);
    const refreshPayload = decodeJwtPayload(result.refreshToken);
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: "sales@hassad.com" },
    });
    const session = await prisma.session.findFirstOrThrow({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    expect(refreshPayload.rememberMe).toBe(false);
    expect(refreshPayload.exp - refreshPayload.iat).toBe(7 * 24 * 60 * 60);
    expect(
      Math.abs(
        session.expiresAt.getTime() -
          session.createdAt.getTime() -
          7 * 24 * 60 * 60 * 1000,
      ),
    ).toBeLessThan(1000);
  });

  test("AuthService honors configured normal JWT lifetimes", async () => {
    const passwordHash = await bcrypt.hash("password123", 4);
    const sessionCreate = vi.fn().mockResolvedValue({});
    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue({
          id: "user-id",
          name: "Test User",
          email: "test@example.com",
          passwordHash,
          isActive: true,
          lockedUntil: null,
          suspendedAt: null,
          suspendedUntil: null,
          failedLoginAttempts: 0,
          role: { name: "SALES", permissions: [] },
          permissions: [],
          departments: [],
        }),
        update: vi.fn().mockResolvedValue({}),
      },
      securityEvent: { create: vi.fn().mockResolvedValue({}) },
      session: { create: sessionCreate },
      client: { findFirst: vi.fn() },
      $transaction: vi.fn().mockResolvedValue([]),
    };
    const jwtService = { sign: vi.fn().mockReturnValue("token") };
    const configService = {
      get: vi.fn((key: string) => {
        if (key === "JWT_REFRESH_SECRET") return "refresh-secret";
        if (key === "JWT_EXPIRES_IN") return "2h";
        if (key === "JWT_REFRESH_EXPIRES_IN") return "12d";
        return undefined;
      }),
    };
    const service = new AuthService(
      prisma as any,
      jwtService as any,
      configService as any,
      {} as any,
    );

    await service.login({
      email: "test@example.com",
      password: "password123",
    } as any);

    expect(jwtService.sign.mock.calls[0][1]).toMatchObject({
      expiresIn: 2 * 60 * 60,
    });
    expect(jwtService.sign.mock.calls[1][1]).toMatchObject({
      expiresIn: 12 * 24 * 60 * 60,
    });
    expect(
      Math.abs(
        sessionCreate.mock.calls[0][0].data.expiresAt.getTime() -
          Date.now() -
          12 * 24 * 60 * 60 * 1000,
      ),
    ).toBeLessThan(1000);
  });

  test("AuthController honors configured normal cookie max ages", async () => {
    const response = { cookie: vi.fn() } as any;
    const controller = new AuthController(
      {
        login: vi.fn().mockResolvedValue({
          user: { id: "user-id" },
          accessToken: "access-token",
          refreshToken: "refresh-token",
        }),
      } as any,
      {
        get: vi.fn((key: string) =>
          key === "COOKIE_TOKEN_MAX_AGE"
            ? 123456
            : key === "COOKIE_REFRESH_TOKEN_MAX_AGE"
              ? 654321
              : undefined,
        ),
      } as any,
      {} as any,
    );

    await controller.login(
      {
        email: "test@example.com",
        password: "password123",
        rememberMe: false,
      } as any,
      response,
      { headers: {}, ip: undefined } as any,
    );

    expect(response.cookie).toHaveBeenCalledWith(
      "refreshToken",
      "refresh-token",
      expect.objectContaining({ maxAge: 654321 }),
    );
    expect(response.cookie).toHaveBeenCalledWith(
      "token",
      "access-token",
      expect.objectContaining({ maxAge: 123456 }),
    );
  });

  test("Remembered access-token lifetime and refresh preserve the seven-day marker", async () => {
    const app = await getApp();
    const response = await request(app.getHttpServer())
      .post("/v1/auth/login")
      .send({
        email: "sales@hassad.com",
        password: "password123",
        rememberMe: true,
      });
    const cookies = response.headers["set-cookie"] as unknown as string[];
    const refreshToken = cookieValue(cookieFor(cookies, "refreshToken"));
    const accessPayload = decodeJwtPayload(response.body.data.accessToken);
    const refreshedResponse = await refreshExpecting(app, refreshToken);
    const refreshedCookies = refreshedResponse.cookies;
    const refreshedAccessPayload = decodeJwtPayload(
      refreshedResponse.body.data.accessToken,
    );

    expect(accessPayload.rememberMe).toBe(true);
    expect(accessPayload.exp - accessPayload.iat).toBe(7 * 24 * 60 * 60);
    expectAuthCookie(cookieFor(cookies, "token"), 7 * 24 * 60 * 60);
    expect(refreshedResponse.status).toBe(201);
    expect(refreshedAccessPayload.rememberMe).toBe(true);
    expect(refreshedAccessPayload.exp - refreshedAccessPayload.iat).toBe(
      7 * 24 * 60 * 60,
    );
    expectAuthCookie(cookieFor(refreshedCookies, "token"), 7 * 24 * 60 * 60);
  });

  test("Logout revokes the session and rejects old access and refresh tokens", async () => {
    const app = await getApp();
    const prisma = getPrisma();
    const loginResponse = await request(app.getHttpServer())
      .post("/v1/auth/login")
      .send({ email: "sales@hassad.com", password: "password123" });
    const loginCookies = loginResponse.headers[
      "set-cookie"
    ] as unknown as string[];
    const refreshToken = cookieValue(cookieFor(loginCookies, "refreshToken"));
    const accessToken = loginResponse.body.data.accessToken;
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: "sales@hassad.com" },
    });

    const logoutResponse = await request(app.getHttpServer())
      .post("/v1/auth/logout")
      .auth(accessToken, { type: "bearer" });
    const logoutCookies = logoutResponse.headers[
      "set-cookie"
    ] as unknown as string[];
    const session = await prisma.session.findFirstOrThrow({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    const oldAccessResponse = await request(app.getHttpServer())
      .get("/v1/projects")
      .auth(accessToken, { type: "bearer" });
    const oldRefreshResponse = await refreshExpecting(app, refreshToken);

    expect(logoutResponse.status).toBe(200);
    expectAuthCookie(cookieFor(logoutCookies, "token"), 0);
    expectAuthCookie(cookieFor(logoutCookies, "refreshToken"), 0);
    expect(session.revokedAt).not.toBeNull();
    expect(oldAccessResponse.status).toBe(401);
    expect(oldAccessResponse.body.error.code).toBe("AUTH_UNAUTHORIZED");
    expect(oldRefreshResponse.status).toBe(401);
    expect(oldRefreshResponse.body.error.code).toBe("AUTH_UNAUTHORIZED");
  });

  test("Logout clears cookies when no authenticated session is present", async () => {
    const app = await getApp();
    const response = await request(app.getHttpServer()).post("/v1/auth/logout");
    const cookies = response.headers["set-cookie"] as unknown as string[];

    expect(response.status).toBe(200);
    expectAuthCookie(cookieFor(cookies, "token"), 0);
    expectAuthCookie(cookieFor(cookies, "refreshToken"), 0);
  });

  test("Logout with only a valid refresh cookie revokes that session", async () => {
    const app = await getApp();
    const prisma = getPrisma();
    const loginResponse = await request(app.getHttpServer())
      .post("/v1/auth/login")
      .send({ email: "sales@hassad.com", password: "password123" });
    const loginCookies = loginResponse.headers[
      "set-cookie"
    ] as unknown as string[];
    const refreshToken = cookieValue(cookieFor(loginCookies, "refreshToken"));
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: "sales@hassad.com" },
    });

    const logoutResponse = await request(app.getHttpServer())
      .post("/v1/auth/logout")
      .set("Cookie", `refreshToken=${refreshToken}`);
    const session = await prisma.session.findFirstOrThrow({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    const refreshResponse = await refreshExpecting(app, refreshToken);

    expect(logoutResponse.status).toBe(200);
    expectAuthCookie(
      cookieFor(
        logoutResponse.headers["set-cookie"] as unknown as string[],
        "token",
      ),
      0,
    );
    expectAuthCookie(
      cookieFor(
        logoutResponse.headers["set-cookie"] as unknown as string[],
        "refreshToken",
      ),
      0,
    );
    expect(session.revokedAt).not.toBeNull();
    expect(refreshResponse.status).toBe(401);
    expect(refreshResponse.body.error.code).toBe("AUTH_UNAUTHORIZED");
  });

  test("Logout exposes a safe server error when refresh-session persistence fails", async () => {
    const app = await getApp();
    const prisma = app.get(PrismaService);
    const tokens = await loginAs(app, "sales@hassad.com", "password123");
    const findSession = vi
      .spyOn(prisma.session, "findUnique")
      .mockRejectedValueOnce(new Error("database unavailable"));

    try {
      const response = await request(app.getHttpServer())
        .post("/v1/auth/logout")
        .set("Cookie", `refreshToken=${tokens.refreshToken}`);

      expect(response.status).toBe(500);
      expect(response.body.error.code).toBe("INTERNAL_ERROR");
      expect(response.body.error.message).toBe("Internal server error");
      expect(JSON.stringify(response.body)).not.toContain(
        "database unavailable",
      );
    } finally {
      findSession.mockRestore();
    }
  });

  test("Protected access tokens reject deactivated and suspended users", async () => {
    const app = await getApp();
    const prisma = getPrisma();
    const tokens = await loginAs(app, "sales@hassad.com", "password123");
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: "sales@hassad.com" },
    });
    const original = {
      isActive: user.isActive,
      suspendedAt: user.suspendedAt,
      suspendedUntil: user.suspendedUntil,
      suspendReason: user.suspendReason,
      suspendedById: user.suspendedById,
    };

    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { isActive: false },
      });
      const inactiveResponse = await request(app.getHttpServer())
        .get("/v1/projects")
        .auth(tokens.accessToken, { type: "bearer" });
      expect(inactiveResponse.status).toBe(401);
      expect(inactiveResponse.body.error.code).toBe("AUTH_ACCOUNT_INACTIVE");

      await prisma.user.update({
        where: { id: user.id },
        data: {
          isActive: true,
          suspendedAt: new Date(),
          suspendedUntil: new Date(Date.now() + 60_000),
        },
      });
      const suspendedResponse = await request(app.getHttpServer())
        .get("/v1/projects")
        .auth(tokens.accessToken, { type: "bearer" });
      expect(suspendedResponse.status).toBe(401);
      expect(suspendedResponse.body.error.code).toBe("AUTH_ACCOUNT_SUSPENDED");
    } finally {
      await prisma.user.update({ where: { id: user.id }, data: original });
    }
  });

  test("Protected token validation uses current role and permissions", async () => {
    const app = await getApp();
    const prisma = getPrisma();
    const tokens = await loginAs(app, "sales@hassad.com", "password123");
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: "sales@hassad.com" },
    });
    const adminRole = await prisma.role.findUniqueOrThrow({
      where: { name: "ADMIN" },
      include: { permissions: { include: { permission: true } } },
    });
    const strategy = app.get(JwtStrategy);

    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { roleId: adminRole.id },
      });
      const validated = await strategy.validate(
        decodeJwtPayload(tokens.accessToken) as any,
      );

      expect(validated.role).toBe("ADMIN");
      expect(validated.permissions).toContain(
        adminRole.permissions[0].permission.name,
      );
    } finally {
      await prisma.user.update({
        where: { id: user.id },
        data: { roleId: user.roleId },
      });
    }
  });

  test("Refresh reloads the user and rejects inactive and suspended accounts", async () => {
    const app = await getApp();
    const prisma = getPrisma();
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: "sales@hassad.com" },
    });
    const original = {
      isActive: user.isActive,
      suspendedAt: user.suspendedAt,
      suspendedUntil: user.suspendedUntil,
      suspendReason: user.suspendReason,
      suspendedById: user.suspendedById,
    };

    try {
      const inactiveTokens = await loginAs(
        app,
        "sales@hassad.com",
        "password123",
      );
      await prisma.user.update({
        where: { id: user.id },
        data: { isActive: false },
      });
      const inactiveResponse = await refreshExpecting(
        app,
        inactiveTokens.refreshToken,
      );
      expect(inactiveResponse.status).toBe(401);
      expect(inactiveResponse.body.error.code).toBe("AUTH_ACCOUNT_INACTIVE");

      await prisma.user.update({
        where: { id: user.id },
        data: {
          isActive: true,
          suspendedAt: new Date(),
          suspendedUntil: new Date(Date.now() + 60_000),
        },
      });
      const suspendedResponse = await refreshExpecting(
        app,
        inactiveTokens.refreshToken,
      );
      expect(suspendedResponse.status).toBe(401);
      expect(suspendedResponse.body.error.code).toBe("AUTH_ACCOUNT_SUSPENDED");
    } finally {
      await prisma.user.update({ where: { id: user.id }, data: original });
    }
  });

  test("Refresh uses current role claims instead of stale refresh claims", async () => {
    const app = await getApp();
    const prisma = getPrisma();
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: "sales@hassad.com" },
    });
    const adminRole = await prisma.role.findUniqueOrThrow({
      where: { name: "ADMIN" },
    });

    try {
      const tokens = await loginAs(app, "sales@hassad.com", "password123");
      await prisma.user.update({
        where: { id: user.id },
        data: { roleId: adminRole.id },
      });
      const response = await refreshExpecting(app, tokens.refreshToken);

      expect(response.status).toBe(201);
      expect(decodeJwtPayload(response.body.data.accessToken).role).toBe(
        "ADMIN",
      );
    } finally {
      await prisma.user.update({
        where: { id: user.id },
        data: { roleId: user.roleId },
      });
    }
  });

  test("OAuth validation rejects inactive and suspended existing users", async () => {
    const app = await getApp();
    const prisma = getPrisma();
    const authService = app.get(AuthService);
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: "sales@hassad.com" },
    });
    const original = {
      isActive: user.isActive,
      suspendedAt: user.suspendedAt,
      suspendedUntil: user.suspendedUntil,
      suspendReason: user.suspendReason,
      suspendedById: user.suspendedById,
    };
    const oauthData = {
      email: user.email,
      name: user.name,
      provider: "google",
      providerId: `google-test-${Date.now()}`,
    };

    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { isActive: false },
      });
      await expect(
        authService.validateOAuthUser(oauthData),
      ).rejects.toMatchObject({
        response: expect.objectContaining({ code: "AUTH_ACCOUNT_INACTIVE" }),
      });

      await prisma.user.update({
        where: { id: user.id },
        data: {
          isActive: true,
          suspendedAt: new Date(),
          suspendedUntil: new Date(Date.now() + 60_000),
        },
      });
      await expect(
        authService.validateOAuthUser(oauthData),
      ).rejects.toMatchObject({
        response: expect.objectContaining({ code: "AUTH_ACCOUNT_SUSPENDED" }),
      });
    } finally {
      await prisma.user.update({ where: { id: user.id }, data: original });
    }
  });

  test("Google profile without an email returns a stable auth error", async () => {
    const configService = {
      get: vi.fn((key: string) =>
        key === "GOOGLE_CALLBACK_URL"
          ? "http://localhost:3001/v1/auth/google/callback"
          : key === "GOOGLE_CLIENT_ID"
            ? "google-client-id"
            : key === "GOOGLE_CLIENT_SECRET"
              ? "google-client-secret"
              : "",
      ),
    };
    const strategy = new GoogleStrategy(configService as any, {} as any);
    const done = vi.fn();

    await strategy.validate(
      "access-token",
      "refresh-token",
      { id: "google-id", emails: [], name: {} },
      done,
    );

    const error = done.mock.calls[0][0] as ApiException;
    expect(error).toBeInstanceOf(ApiException);
    expect(error.getResponse()).toMatchObject({ code: "AUTH_UNAUTHORIZED" });
    expect(done).toHaveBeenCalledWith(error, false);
  });

  test("Google strategy can initialize when OAuth configuration is absent", () => {
    expect(
      () =>
        new GoogleStrategy(
          { get: vi.fn().mockReturnValue(undefined) } as any,
          {} as any,
        ),
    ).not.toThrow();
  });

  test("Google provider failure before validate returns a stable auth error", () => {
    const guard = new GoogleAuthGuard({ get: vi.fn() } as any);
    const providerMessage = "provider access token details";

    expect(() => guard.handleRequest(new Error(providerMessage), null)).toThrow(
      ApiException,
    );

    try {
      guard.handleRequest(new Error(providerMessage), null);
    } catch (error) {
      const response = (error as ApiException).getResponse();
      expect(response).toMatchObject({
        code: "AUTH_UNAUTHORIZED",
        message: "Google authentication failed",
      });
      expect(JSON.stringify(response)).not.toContain(providerMessage);
    }
  });

  test.each([
    "AUTH_ACCOUNT_LOCKED",
    "AUTH_ACCOUNT_SUSPENDED",
    "AUTH_ACCOUNT_INACTIVE",
  ])("Google guard preserves %s from account validation", (code) => {
    const guard = new GoogleAuthGuard({ get: vi.fn() } as any);
    const accountError = new ApiException(code, "Account state failure", 401);

    expect(() => guard.handleRequest(accountError, null)).toThrow(accountError);
  });

  test("Unavailable Google configuration returns a stable auth error", () => {
    const guard = new GoogleAuthGuard({
      get: vi.fn().mockReturnValue(undefined),
    } as any);
    const context = {} as any;

    expect(() => guard.canActivate(context)).toThrow(ApiException);
    try {
      guard.canActivate(context);
    } catch (error) {
      expect((error as ApiException).getResponse()).toMatchObject({
        code: "AUTH_UNAUTHORIZED",
      });
    }
  });

  test("Google callback never sets an empty refresh cookie when the secret is missing", async () => {
    const originalClientId = process.env.GOOGLE_CLIENT_ID;
    process.env.GOOGLE_CLIENT_ID = "configured-client";
    const response = { cookie: vi.fn(), redirect: vi.fn() } as any;
    const configService = {
      get: vi.fn((key: string) =>
        key === "FRONTEND_URL"
          ? "http://localhost:3000"
          : key === "GOOGLE_CLIENT_ID"
            ? "configured-client"
            : undefined,
      ),
    };
    const controller = new AuthController(
      {
        issueOAuthTokens: vi
          .fn()
          .mockRejectedValue(
            new ApiException(
              "AUTH_REFRESH_SECRET_MISSING",
              "Refresh token service is not configured",
              500,
            ),
          ),
      } as any,
      configService as any,
      {} as any,
    );

    try {
      await expect(
        controller.googleAuthRedirect(
          {
            user: {
              id: "user-id",
              name: "Test User",
              email: "test@example.com",
              role: "CLIENT",
            },
            headers: {},
            ip: undefined,
          } as any,
          response,
        ),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          code: "AUTH_REFRESH_SECRET_MISSING",
        }),
        status: 500,
      });
      expect(response.cookie).not.toHaveBeenCalledWith(
        "refreshToken",
        expect.any(String),
        expect.anything(),
      );
    } finally {
      if (originalClientId === undefined) delete process.env.GOOGLE_CLIENT_ID;
      else process.env.GOOGLE_CLIENT_ID = originalClientId;
    }
  });

  test("OAuth callback uses the documented seven-day refresh lifetime", async () => {
    const response = { cookie: vi.fn(), redirect: vi.fn() } as any;
    const configService = {
      get: vi.fn((key: string) =>
        key === "FRONTEND_URL"
          ? "http://localhost:3000"
          : key === "GOOGLE_CLIENT_ID"
            ? "configured-client"
            : undefined,
      ),
    };
    const controller = new AuthController(
      {
        issueOAuthTokens: vi.fn().mockResolvedValue({
          accessToken: "access-token",
          refreshToken: "refresh-token",
        }),
      } as any,
      configService as any,
      {} as any,
    );

    await controller.googleAuthRedirect(
      {
        user: {
          id: "user-id",
          name: "Test User",
          email: "test@example.com",
          role: "CLIENT",
        },
        headers: {},
        ip: undefined,
      } as any,
      response,
    );

    const refreshCookie = response.cookie.mock.calls.find(
      (call: any[]) => call[0] === "refreshToken",
    );
    expect(refreshCookie[2].maxAge).toBe(7 * 24 * 60 * 60 * 1000);
  });

  test("JWT guard normalizes Passport failures to AUTH_UNAUTHORIZED", () => {
    const guard = new JwtAuthGuard(new Reflector());

    expect(() =>
      guard.handleRequest(new UnauthorizedException(), null),
    ).toThrow(ApiException);
    try {
      guard.handleRequest(new UnauthorizedException(), null);
    } catch (error) {
      expect((error as ApiException).getResponse()).toMatchObject({
        code: "AUTH_UNAUTHORIZED",
      });
    }
  });

  test("Roles guard returns stable missing and forbidden role codes", () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue(["ADMIN"]),
    };
    const guard = new RolesGuard(reflector as any);
    const context = {
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({ getRequest: () => ({ user: undefined }) }),
    } as any;

    expect(() => guard.canActivate(context)).toThrow(ApiException);
    try {
      guard.canActivate(context);
    } catch (error) {
      expect((error as ApiException).getResponse()).toMatchObject({
        code: "AUTH_ROLE_MISSING",
      });
    }

    const forbiddenContext = {
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: "CLIENT" } }),
      }),
    } as any;
    expect(() => guard.canActivate(forbiddenContext)).toThrow(ApiException);
    try {
      guard.canActivate(forbiddenContext);
    } catch (error) {
      expect((error as ApiException).getResponse()).toMatchObject({
        code: "AUTH_ROLE_FORBIDDEN",
      });
    }
  });

  test("Token refresh returns new access token", async () => {
    const app = await getApp();
    const s = new Scenario("Token refresh");

    const tokens = await s.step("Login to obtain tokens", () =>
      loginAs(app, "sales@hassad.com", "password123"),
    );

    const newTokens = await s.step("Refresh access token", () =>
      refreshTokens(app, tokens.refreshToken),
    );

    expect(newTokens.accessToken).toBeTruthy();
    expect(newTokens.accessToken.split(".")).toHaveLength(3);

    s.finish();
  });
});
