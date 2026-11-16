export const notFound = (req, res) =>
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });

export const errorHandler = (err, req, res, _next) => {
  console.error(err);
  const duplicate = err.code === 11000;
  const status =
    err.name === "ValidationError" || err.name === "CastError"
      ? 400
      : duplicate
      ? 409
      : err.status || 500;
  res.status(status).json({
    message: duplicate ? "That value already exists" : err.message || "Server error",
  });
};