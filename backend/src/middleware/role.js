/**
 * authorizeRoles — Middleware to restrict access based on user role(s).
 *
 * @param  {...string} roles - Permitted roles e.g. 'admin'
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to perform this action.',
      });
    }
    next();
  };
};

/**
 * requireAdmin — Dedicated middleware shorthand for admin-only routes.
 */
export const requireAdmin = authorizeRoles('admin');

export default authorizeRoles;
