/**
 * notFound — Middleware for handling 404 Not Found routes.
 */
export const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API route not found: ${req.method} ${req.originalUrl}`,
  });
};

export default notFound;
