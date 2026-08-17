import {
  ExecutionContext,
  HttpStatus,
  NotFoundException,
} from "@nestjs/common";
import { firstValueFrom, defer, of } from "rxjs";
import { describe, expect, it, vi } from "vitest";
import { HttpExceptionFilter } from "../common/filters/http-exception.filter";
import { RequestLocaleInterceptor } from "../common/interceptors/request-locale.interceptor";
import { getCurrentBackendLocale } from "../common/localization/request-locale";

function createHttpContext(headers: Record<string, string | undefined>) {
  const response = { setHeader: vi.fn() };
  const request = {
    headers,
    originalUrl: "/v1/tasks",
    url: "/v1/tasks",
    method: "GET",
    body: undefined,
    query: {},
    ip: "127.0.0.1",
    get: vi.fn().mockReturnValue(undefined),
  };
  const context = {
    getType: () => "http",
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as unknown as ExecutionContext;

  return { context, request, response };
}

describe("locale transport contract", () => {
  it("sets Content-Language and preserves the success payload", async () => {
    const { context, response } = createHttpContext({
      "x-locale": "ar-EG",
      "accept-language": "en-US",
    });
    const interceptor = new RequestLocaleInterceptor();

    const result = await firstValueFrom(
      interceptor.intercept(context, {
        handle: () =>
          of({ success: true, data: { id: "task-1" }, error: null }),
      }),
    );

    expect(response.setHeader).toHaveBeenCalledWith("Content-Language", "ar");
    expect(result).toEqual({
      success: true,
      data: { id: "task-1" },
      error: null,
    });
  });

  it("keeps the locale available after awaited handler work", async () => {
    const { context } = createHttpContext({ "accept-language": "ar-SA" });
    const interceptor = new RequestLocaleInterceptor();
    let observedLocale: string | undefined;

    await firstValueFrom(
      interceptor.intercept(context, {
        handle: () =>
          defer(async () => {
            await Promise.resolve();
            observedLocale = getCurrentBackendLocale();
            return "ok";
          }),
      }),
    );

    expect(observedLocale).toBe("ar");
  });

  it("sets Content-Language on the existing error envelope", () => {
    const json = vi.fn();
    const response = {
      setHeader: vi.fn(),
      status: vi.fn().mockReturnValue({ json }),
    };
    const request = createHttpContext({ "x-locale": "ar" }).request;
    const filter = new HttpExceptionFilter({ logError: vi.fn() } as never);

    filter.catch(new NotFoundException("Task is invalid"), {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => request,
      }),
    } as never);

    expect(response.setHeader).toHaveBeenCalledWith("Content-Language", "ar");
    expect(response.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(json).toHaveBeenCalledWith({
      success: false,
      data: null,
      error: {
        code: "RESOURCE_NOT_FOUND",
        message: "Task is invalid",
        details: null,
      },
    });
  });
});
