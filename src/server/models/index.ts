import { relations } from 'drizzle-orm'
import {
  boolean,
  integer,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 256 }).notNull(),
  email: text('email').unique().notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  password: text('password'),
  image: text('image'),
  isEmailVerified: boolean('is_email_verified').default(false),
})

export const organizations = pgTable('organizations', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 256 }).notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
  isDefault: boolean('is_default').default(false),
})

export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 256 }).notNull(),
  key: varchar('key', { length: 256 }).unique().notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
})

export const permissions = pgTable('permissions', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 256 }).notNull(),
  key: varchar('key', { length: 256 }).unique().notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { mode: 'string' }).notNull().defaultNow(),
})

export const usersToOrganizations = pgTable(
  'usersToOrganizations',
  {
    userId: serial('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    organizationId: serial('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.organizationId] }),
  })
)

export const rolesToUsers = pgTable(
  'rolesToUsers',
  {
    roleId: serial('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    userId: serial('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    organizationId: serial('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.roleId, t.organizationId] }),
  })
)

export const permissionsToRoles = pgTable(
  'permissionsToRoles',
  {
    roleId: serial('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    permissionId: serial('user_id')
      .notNull()
      .references(() => permissions.id, { onDelete: 'cascade' }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.roleId, t.permissionId] }),
  })
)

export const blogs = pgTable('blogs', {
  id: serial('id').primaryKey(),
  jsonUrl: text('json_url').notNull(),
  title: varchar('title').notNull(),
  description: varchar('description').notNull(),
  wordCount: integer('wordCount').notNull().default(0),
  thumbnailUrl: text('thumbnail_url'),
  slug: varchar('slug').unique().notNull(),
  createdAt: timestamp('created_at', { mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'string' }).defaultNow().notNull(),
  publishedAt: timestamp('published_at', { mode: 'string' })
    .defaultNow()
    .notNull(),
  isPublished: boolean('is_published').notNull().default(false),
})

export const authorsToBlogs = pgTable(
  'authorsToBlogs',
  {
    authorId: serial('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    blogId: serial('blog_id')
      .notNull()
      .references(() => blogs.id, { onDelete: 'cascade' }),
  },
  (t) => ({ pk: primaryKey({ columns: [t.authorId, t.blogId] }) })
)

export const usersRelations = relations(users, ({ many }) => ({
  usersToOrganizations: many(usersToOrganizations),
  rolesToUsers: many(rolesToUsers),
}))

export const organizationRelations = relations(organizations, ({ many }) => ({
  usersToOrganizations: many(usersToOrganizations),
}))

export const rolesRelations = relations(roles, ({ many }) => ({
  rolesToUsers: many(rolesToUsers),
  permisionsToRoles: many(permissionsToRoles),
}))
export const permissionsRelations = relations(roles, ({ many }) => ({
  permisionsToRoles: many(permissionsToRoles),
}))

export const usersToOrganizationsRelations = relations(
  usersToOrganizations,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [usersToOrganizations.organizationId],
      references: [organizations.id],
    }),
    user: one(users, {
      fields: [usersToOrganizations.userId],
      references: [users.id],
    }),
  })
)

export const rolesToUsersRelations = relations(rolesToUsers, ({ one }) => ({
  role: one(roles, {
    fields: [rolesToUsers.roleId],
    references: [roles.id],
  }),
  user: one(users, {
    fields: [rolesToUsers.userId],
    references: [users.id],
  }),
}))

export const permissionsToRolesRelations = relations(
  permissionsToRoles,
  ({ one }) => ({
    role: one(roles, {
      fields: [permissionsToRoles.roleId],
      references: [roles.id],
    }),
    permission: one(permissions, {
      fields: [permissionsToRoles.permissionId],
      references: [permissions.id],
    }),
  })
)

export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  sessionToken: text('session_token').unique(),
  userId: serial('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  expiresAt: timestamp('expires_at', { mode: 'string' }).notNull(),
})
