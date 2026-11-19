export const isStaff = (r?: string) => r === "admin" || r === "staff" || r === "viewer";
export const canWrite = (r?: string) => r === "admin" || r === "staff";
export const isAdmin = (r?: string) => r === "admin";