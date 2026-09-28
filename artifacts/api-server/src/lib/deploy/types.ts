export type DeploymentLog = {
  message: string;
  timestamp: string;
};

export type DeploymentResult = {
  provider: "Netlify";
  url: string;
  siteId: string;
  deploymentId: string;
  healthStatus: "Healthy";
  httpStatus: number;
  buildTimeSeconds: number;
  logs: DeploymentLog[];
};

export type DeploymentErrorCode =
  | "MISSING_NETLIFY_TOKEN"
  | "INVALID_REQUEST"
  | "INVALID_ZIP"
  | "NETLIFY_RATE_LIMIT"
  | "NETLIFY_AUTH_FAILED"
  | "SITE_CREATION_FAILED"
  | "UPLOAD_FAILED"
  | "DEPLOYMENT_FAILED"
  | "DEPLOYMENT_TIMEOUT"
  | "HEALTH_CHECK_FAILED"
  | "HEALTH_CHECK_TIMEOUT";

export class DeploymentError extends Error {
  readonly code: DeploymentErrorCode;
  readonly status: number;

  constructor(code: DeploymentErrorCode, message: string, status: number) {
    super(message);
    this.name = "DeploymentError";
    this.code = code;
    this.status = status;
  }
}