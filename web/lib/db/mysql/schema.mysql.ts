import { ChatMessage, Project } from "../../../types/chat";
import { UserPreferences } from "../../../types/user";
import { sql } from "drizzle-orm";
import {
  mysqlTable,
  text,
  timestamp,
  json,
  varchar,
  boolean,
  unique,
  index,
} from "drizzle-orm/mysql-core";

export const UserSchema = mysqlTable("user", {
  id: varchar("id", { length: 36 }).primaryKey().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  password: varchar("password", { length: 255 }),
  image: varchar("image", { length: 500 }),
  preferences: json("preferences").default({}).$type<UserPreferences>(),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const SessionSchema = mysqlTable("session", {
  id: varchar("id", { length: 36 }).primaryKey().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: varchar("user_agent", { length: 500 }),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => UserSchema.id, { onDelete: "cascade" }),
});

export const AccountSchema = mysqlTable("account", {
  id: varchar("id", { length: 36 }).primaryKey().notNull(),
  accountId: varchar("account_id", { length: 255 }).notNull(),
  providerId: varchar("provider_id", { length: 100 }).notNull(),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => UserSchema.id, { onDelete: "cascade" }),
  accessToken: varchar("access_token", { length: 1000 }),
  refreshToken: varchar("refresh_token", { length: 1000 }),
  idToken: varchar("id_token", { length: 1000 }),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: varchar("scope", { length: 500 }),
  password: varchar("password", { length: 255 }),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const VerificationSchema = mysqlTable("verification", {
  id: varchar("id", { length: 36 }).primaryKey().notNull(),
  identifier: varchar("identifier", { length: 255 }).notNull(),
  value: varchar("value", { length: 255 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(
    () => new Date(),
  ),
  updatedAt: timestamp("updated_at").$defaultFn(
    () => new Date(),
  ),
});

export const ChatThreadSchema = mysqlTable("chat_thread", {
  id: varchar("id", { length: 36 }).primaryKey().notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => UserSchema.id),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  projectId: varchar("project_id", { length: 36 }),
});

export const ChatMessageSchema = mysqlTable("chat_message", {
  id: varchar("id", { length: 255 }).primaryKey().notNull(),
  threadId: varchar("thread_id", { length: 36 })
    .notNull()
    .references(() => ChatThreadSchema.id),
  role: varchar("role", { length: 50 }).notNull().$type<ChatMessage["role"]>(),
  parts: json("parts").notNull(),
  attachments: json("attachments"),
  annotations: json("annotations"),
  model: varchar("model", { length: 100 }),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const ProjectSchema = mysqlTable("project", {
  id: varchar("id", { length: 36 }).primaryKey().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 36 })
    .notNull()
    .references(() => UserSchema.id),
  instructions: json("instructions").$type<Project["instructions"]>(),
  createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type ChatThreadEntity = typeof ChatThreadSchema.$inferSelect;
export type ChatMessageEntity = typeof ChatMessageSchema.$inferSelect;
export type ProjectEntity = typeof ProjectSchema.$inferSelect;
export type UserEntity = typeof UserSchema.$inferSelect;