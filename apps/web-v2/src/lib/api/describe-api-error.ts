import type { SerializedError } from "@reduxjs/toolkit";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";

type ApiErrorDescriptor = {
  title: string;
  description: string;
};

function isFetchBaseQueryError(error: unknown): error is FetchBaseQueryError {
  return error != null && typeof error === "object" && "status" in error;
}

function readMessage(data: unknown): string | null {
  if (
    data &&
    typeof data === "object" &&
    "message" in data &&
    typeof data.message === "string"
  ) {
    return data.message;
  }

  return null;
}

export function describeApiError(
  error: FetchBaseQueryError | SerializedError | undefined,
): ApiErrorDescriptor {
  if (!error) {
    return {
      title: "Workspace failed to load",
      description: "The request did not complete successfully.",
    };
  }

  if (isFetchBaseQueryError(error)) {
    const message = readMessage(error.data);

    if (error.status === 401) {
      return {
        title: "Session required",
        description:
          message ?? "Your admin session is missing or expired. Sign in again to continue.",
      };
    }

    if (error.status === 403) {
      return {
        title: "Access denied",
        description:
          message ?? "Your account does not have permission to open this workspace.",
      };
    }

    if (error.status === 404) {
      return {
        title: "Workspace not found",
        description:
          message ??
          "The backend could not find a matching record for this workspace request.",
      };
    }

    if (typeof error.status === "number") {
      return {
        title: `Server error ${error.status}`,
        description:
          message ?? "The backend returned an unexpected response for this workspace request.",
      };
    }

    if (error.status === "FETCH_ERROR") {
      return {
        title: "API unreachable",
        description:
          "The frontend could not connect to the API. Verify that the Nest server is running on port 3001.",
      };
    }

    if (error.status === "PARSING_ERROR") {
      return {
        title: "Invalid API response",
        description:
          message ?? "The backend returned a response the frontend could not parse.",
      };
    }

    return {
      title: "Request failed",
      description: message ?? "The workspace request failed before data could be rendered.",
    };
  }

  const serialized = error as SerializedError;

  return {
    title: "Unexpected client error",
    description:
      serialized.message ??
      "The frontend hit an unexpected error while preparing this workspace.",
  };
}
