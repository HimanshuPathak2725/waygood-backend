const HttpError = require("../utils/httpError");

/**
 * Restricts a route to specific roles.
 * Usage: router.get("/admin", requireAuth, requireRole("counselor"), handler);
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      throw new HttpError(
        403,
        "Access denied. You do not have permission to perform this action."
      );
    }
    next();
  };
}

module.exports = requireRole;
