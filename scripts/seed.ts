/* NOTE: this script should run one-time only, when first time create the app */

import { drizzle } from 'drizzle-orm/node-postgres'
import bcrypt from 'bcrypt'
import * as schema from '@/server/models/index'
import pg from 'pg'

export const client = new pg.Client(process.env.DATABASE_URL)
console.log('Connect to DB')
await client.connect()
export const db = drizzle(client, { schema })
console.log('Start seeding')

const defaultOrg = await db
  .insert(schema.organizations)
  .values({
    name: 'Default Organization',
    isDefault: true,
  })
  .returning()

console.log(`Default Organization ID: ${defaultOrg[0].id}`)

const superAdmin = await db
  .insert(schema.users)
  .values({
    email: 'admin@sidrstudio.com',
    name: 'Admin',
    password: await bcrypt.hash('admin1234', 16),
    isEmailVerified: true,
  })
  .returning()

const superAdminRole = await db
  .insert(schema.roles)
  .values({
    name: 'Super Admin',
    key: 'super-admin',
  })
  .returning()

await db.insert(schema.usersToOrganizations).values({
  organizationId: defaultOrg[0].id,
  userId: superAdmin[0].id,
})

await db.insert(schema.rolesToUsers).values({
  roleId: superAdminRole[0].id,
  userId: superAdmin[0].id,
  organizationId: defaultOrg[0].id,
})

const readUser = await db
  .insert(schema.permissions)
  .values({
    name: 'Read users',
    key: 'read:users',
  })
  .returning()
const writedUser = await db
  .insert(schema.permissions)
  .values({
    name: 'Write users',
    key: 'write:users',
  })
  .returning()
const readRoles = await db
  .insert(schema.permissions)
  .values({
    name: 'Read roles',
    key: 'read:roles',
  })
  .returning()
const writeRoles = await db
  .insert(schema.permissions)
  .values({
    name: 'Write roles',
    key: 'write:roles',
  })
  .returning()
const readPermissions = await db
  .insert(schema.permissions)
  .values({
    name: 'Read permissions',
    key: 'read:permissions',
  })
  .returning()
const writePermissions = await db
  .insert(schema.permissions)
  .values({
    name: 'Write permissions',
    key: 'write:permissions',
  })
  .returning()
const readOrgs = await db
  .insert(schema.permissions)
  .values({
    name: 'Read organizations',
    key: 'read:organizations',
  })
  .returning()
const writeOrgs = await db
  .insert(schema.permissions)
  .values({
    name: 'Write organizations',
    key: 'write:organizations',
  })
  .returning()

const permissions = {
  readUser,
  writedUser,
  readRoles,
  writeRoles,
  readPermissions,
  writePermissions,
  readOrgs,
  writeOrgs,
}

for await (const returning of Object.values(permissions)) {
  const data = returning[0]

  await db.insert(schema.permissionsToRoles).values({
    roleId: superAdminRole[0].id,
    permissionId: data.id,
  })
}

console.log('Seeding end')
await client.end()
console.log('Connection closed')
