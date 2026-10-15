declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    AUTH_JWT_SECRET?: string;
    AUTH_PASSWORD_PEPPER?: string;
    BUCKET?: R2Bucket;
  }
}
