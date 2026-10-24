import "dotenv/config";
import bcrypt from "bcryptjs";
import { pool } from "./db.js";

const email = "staff@123.local";
const newPassword = process.env.RESET_PASSWORD;

if (!newPassword || newPassword.length < 12) {
  console.error("Set RESET_PASSWORD to a password of at least 12 characters.");
  process.exit(1);
}

try {
  const hash = await bcrypt.hash(newPassword, 12);

  const result = await pool.query(
    "UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING id, email",
    [hash, email]
  );

  if (result.rowCount === 0) {
    console.error("Account not found:", email);
  } else {
    console.log("Password updated for:", result.rows[0].email);
  }
} catch (error) {
  console.error("Password reset failed:", error.message);
} finally {
  await pool.end();
}