export const notFound = (req, res) =>
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });

export const errorHandler = (err, req, res, _next) => {
  console.error(err);
  const status =
    err.name === "ValidationError" || err.name === "CastError" ? 400 : err.status || 500;
  res.status(status).json({ message: err.message || "Server error" });
};