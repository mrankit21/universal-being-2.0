/** Password hashing helpers (Architecture §11 — "secure authentication
 * architecture"). bcrypt with a 12-round cost factor; never store or log a
 * plaintext password anywhere else in the codebase. */
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
