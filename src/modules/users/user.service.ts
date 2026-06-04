import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { getMysqlPool } from "@/lib/db/mysql";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import type { GoogleProfile } from "@/lib/auth/google";

export type UserRole = "user" | "admin";

export type User = {
  id: number;
  email: string;
  name: string | null;
  passwordHash: string | null;
  avatarUrl: string | null;
  googleId: string | null;
  role: UserRole;
};

type UserRow = RowDataPacket & {
  id: number;
  email: string;
  name: string | null;
  password_hash: string | null;
  avatar_url: string | null;
  google_id: string | null;
  role: UserRole;
};

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    passwordHash: row.password_hash,
    avatarUrl: row.avatar_url,
    googleId: row.google_id,
    role: row.role,
  };
}

export const userService = {
  async findById(id: number): Promise<User | null> {
    const [rows] = await getMysqlPool().query<UserRow[]>(
      "SELECT * FROM users WHERE id = ? LIMIT 1",
      [id],
    );
    return rows[0] ? mapUser(rows[0]) : null;
  },

  async findByEmail(email: string): Promise<User | null> {
    const [rows] = await getMysqlPool().query<UserRow[]>(
      "SELECT * FROM users WHERE email = ? LIMIT 1",
      [email.toLowerCase()],
    );
    return rows[0] ? mapUser(rows[0]) : null;
  },

  async registerWithEmail(input: {
    email: string;
    name: string;
    password: string;
  }): Promise<User> {
    const normalizedEmail = input.email.trim().toLowerCase();
    const existing = await this.findByEmail(normalizedEmail);

    if (existing) {
      throw new Error("EMAIL_ALREADY_REGISTERED");
    }

    const passwordHash = await hashPassword(input.password);
    const [result] = await getMysqlPool().execute<ResultSetHeader>(
      "INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)",
      [normalizedEmail, input.name.trim(), passwordHash],
    );

    const user = await this.findById(result.insertId);
    if (!user) {
      throw new Error("USER_CREATE_FAILED");
    }

    return user;
  },

  async authenticateWithEmail(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmail(email);

    if (!user?.passwordHash) {
      return null;
    }

    const validPassword = await verifyPassword(password, user.passwordHash);
    return validPassword ? user : null;
  },

  async upsertGoogleUser(profile: GoogleProfile): Promise<User> {
    const normalizedEmail = profile.email.trim().toLowerCase();
    const existing = await this.findByEmail(normalizedEmail);

    if (existing) {
      await getMysqlPool().execute(
        "UPDATE users SET google_id = COALESCE(google_id, ?), avatar_url = COALESCE(?, avatar_url), email_verified_at = COALESCE(email_verified_at, NOW()) WHERE id = ?",
        [profile.sub, profile.picture ?? null, existing.id],
      );

      const updatedUser = await this.findById(existing.id);
      if (!updatedUser) {
        throw new Error("USER_UPDATE_FAILED");
      }

      return updatedUser;
    }

    const [result] = await getMysqlPool().execute<ResultSetHeader>(
      "INSERT INTO users (email, name, google_id, avatar_url, email_verified_at) VALUES (?, ?, ?, ?, NOW())",
      [normalizedEmail, profile.name ?? normalizedEmail, profile.sub, profile.picture ?? null],
    );

    const user = await this.findById(result.insertId);
    if (!user) {
      throw new Error("USER_CREATE_FAILED");
    }

    return user;
  },
};
