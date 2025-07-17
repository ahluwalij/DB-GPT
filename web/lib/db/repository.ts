import { pgDb } from "./pg/db.pg";
import { UserSchema } from "./pg/schema.pg";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export const userRepository = {
  async existsByEmail(email: string): Promise<boolean> {
    const user = await pgDb.select().from(UserSchema).where(eq(UserSchema.email, email)).limit(1);
    return user.length > 0;
  },

  async findByEmail(email: string) {
    const user = await pgDb.select().from(UserSchema).where(eq(UserSchema.email, email)).limit(1);
    return user[0] || null;
  },

  async findById(id: string) {
    const user = await pgDb.select().from(UserSchema).where(eq(UserSchema.id, id)).limit(1);
    return user[0] || null;
  },

  async create(userData: {
    name: string;
    email: string;
    password?: string;
    image?: string;
  }) {
    const id = nanoid();
    const result = await pgDb.insert(UserSchema).values({
      id,
      ...userData,
    });
    return { id, ...userData };
  },

  async update(id: string, userData: Partial<{
    name: string;
    email: string;
    password: string;
    image: string;
    emailVerified: boolean;
  }>) {
    await pgDb.update(UserSchema).set(userData).where(eq(UserSchema.id, id));
    return await this.findById(id);
  },

  async delete(id: string) {
    await pgDb.delete(UserSchema).where(eq(UserSchema.id, id));
  },
};