/**
 * Typed errors thrown by the API service layer. Mirrors the shape a real
 * Fastify error response would carry (status code + error code + detail),
 * so UI handling stays the same when the backend lands.
 */

export type ApiErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION"
  | "INTEGRITY";

export class ApiError extends Error {
  status: number;
  code: ApiErrorCode;
  detail?: string;

  constructor(opts: { status: number; code: ApiErrorCode; message: string; detail?: string }) {
    super(opts.message);
    this.name = "ApiError";
    this.status = opts.status;
    this.code = opts.code;
    this.detail = opts.detail;
  }
}

export const errors = {
  unauthenticated: (detail?: string) =>
    new ApiError({ status: 401, code: "UNAUTHENTICATED", message: "Not signed in.", detail }),
  forbidden: (perm: string, detail?: string) =>
    new ApiError({ status: 403, code: "FORBIDDEN", message: `Permission denied: ${perm}`, detail }),
  notFound: (entity: string, id: string) =>
    new ApiError({ status: 404, code: "NOT_FOUND", message: `${entity} ${id} not found.` }),
  conflict: (message: string) =>
    new ApiError({ status: 409, code: "CONFLICT", message }),
  validation: (message: string, detail?: string) =>
    new ApiError({ status: 422, code: "VALIDATION", message, detail }),
  integrity: (message: string) =>
    new ApiError({ status: 500, code: "INTEGRITY", message }),
};
