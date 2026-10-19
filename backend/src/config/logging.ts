/** Shared by the HTTP logger and its request-scoped application loggers. */
export const httpLogRedaction = {
  paths: [
    "req.headers.cookie",
    "req.headers.authorization",
    'req.headers["x-callback-token"]',
    "req.body.password",
    "req.body.confirmPassword",
    "req.body.currentPassword",
    "req.body.newPassword",
  ],
  remove: true,
};
