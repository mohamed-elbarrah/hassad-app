import { afterAll, describe, expect, test } from "vitest";
import request from "supertest";
import { closeApp, getApp } from "../helpers/setup";
import { Scenario } from "../helpers/scenario";
import { loginAs } from "../steps/auth.steps";

afterAll(async () => {
  await closeApp();
});

describe("Admin workspaces", () => {
  test("Admin can access all main workspace endpoints", async () => {
    const app = await getApp();
    const s = new Scenario("Admin workspaces: endpoint availability");

    const adminToken = await s.step("Login as admin", () =>
      loginAs(app, "admin@hassad.com", "password123"),
    );

    const checks = [
      {
        path: "/v1/admin/overview",
        query: { granularity: "day" },
        assert: (body: any) => {
          expect(body.data.kpis).toBeInstanceOf(Array);
          expect(body.data.kpis.length).toBeGreaterThan(0);
        },
      },
      {
        path: "/v1/admin/users/workspace",
        query: { page: "1", limit: "10" },
        assert: (body: any) => {
          expect(body.data.items).toBeInstanceOf(Array);
          expect(body.data.total).toBeTypeOf("number");
        },
      },
      {
        path: "/v1/admin/clients/workspace",
        query: { filter: "all", sort: "highest-spend" },
        assert: (body: any) => {
          expect(body.data.items).toBeInstanceOf(Array);
        },
      },
      {
        path: "/v1/admin/crm/workspace",
        query: {
          statusFilter: "all",
          dateFilter: "last-30-days",
          valueFilter: "all-values",
        },
        assert: (body: any) => {
          expect(body.data.items).toBeInstanceOf(Array);
        },
      },
      {
        path: "/v1/admin/delivery/workspace",
        query: {
          statusFilter: "all",
          modelFilter: "all-models",
          timelineFilter: "all-timelines",
          sort: "highest-value",
        },
        assert: (body: any) => {
          expect(body.data.items).toBeInstanceOf(Array);
        },
      },
    ];

    for (const check of checks) {
      const res = await s.step(`GET ${check.path}`, () =>
        request(app.getHttpServer())
          .get(check.path)
          .query(check.query)
          .auth(adminToken.accessToken, { type: "bearer" }),
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      check.assert(res.body);
    }

    s.finish();
  });

  test("Non-admin employee is denied admin workspaces", async () => {
    const app = await getApp();
    const s = new Scenario("Admin workspaces: employee forbidden");

    const employeeToken = await s.step("Login as employee", () =>
      loginAs(app, "employee@hassad.com", "password123"),
    );

    const res = await s.step("GET /v1/admin/users/workspace", () =>
      request(app.getHttpServer())
        .get("/v1/admin/users/workspace")
        .auth(employeeToken.accessToken, { type: "bearer" }),
    );

    expect(res.status).toBe(403);

    s.finish();
  });
});
