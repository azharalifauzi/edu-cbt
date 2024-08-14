/* NOTE: this script should run one-time only, when first time create the app */

import { drizzle } from 'drizzle-orm/node-postgres'
import bcrypt from 'bcrypt'
import * as schema from '@/server/models/index'
import pg from 'pg'
import { eq } from 'drizzle-orm'
import slugify from 'slugify'
import { Glob, file } from 'bun'

function shuffleArray<T>(array: T[]): T[] {
  const n = array.length
  if (n <= 1) return array // No need to shuffle if array length is 1 or less

  for (let i = 0; i < n - 1; i++) {
    // Pick a random index from i to n-1
    const j = Math.floor(Math.random() * (n - i)) + i

    // Swap elements array[i] and array[j]
    ;[array[i], array[j]] = [array[j], array[i]]
  }

  // To ensure no element remains in its original position, perform a final shuffle
  // that guarantees a derangement
  const last = array[n - 1]
  array[n - 1] = array[Math.floor(Math.random() * (n - 1))]
  array[array.indexOf(array[n - 1])] = last

  return array
}

export const client = new pg.Client(process.env.DATABASE_URL)
console.log('Connect to DB')
await client.connect()
export const db = drizzle(client, { schema })
console.log('Start seeding')

let isDbSeeded = true

let defaultOrg = await db
  .select()
  .from(schema.organizations)
  .where(eq(schema.organizations.isDefault, true))

if (defaultOrg.length === 0) {
  isDbSeeded = false
  defaultOrg = await db
    .insert(schema.organizations)
    .values({
      name: 'Default Organization',
      isDefault: true,
    })
    .returning()
}

console.log(`Default Organization ID: ${defaultOrg[0].id}`)

let superAdmin = await db
  .insert(schema.users)
  .values({
    email: 'admin@sidrstudio.com',
    name: 'Admin',
    password: await bcrypt.hash('admin1234', 16),
    isEmailVerified: true,
  })
  .onConflictDoNothing()
  .returning()

if (isDbSeeded) {
  superAdmin = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, 'admin@sidrstudio.com'))
}
let superAdminRole = await db
  .insert(schema.roles)
  .values({
    name: 'Super Admin',
    key: 'super-admin',
  })
  .onConflictDoNothing()
  .returning()

if (isDbSeeded) {
  superAdminRole = await db
    .select()
    .from(schema.roles)
    .where(eq(schema.roles.key, 'super-admin'))
}

await db
  .insert(schema.usersToOrganizations)
  .values({
    organizationId: defaultOrg[0].id,
    userId: superAdmin[0].id,
  })
  .onConflictDoNothing()

await db
  .insert(schema.rolesToUsers)
  .values({
    roleId: superAdminRole[0].id,
    userId: superAdmin[0].id,
    organizationId: defaultOrg[0].id,
  })
  .onConflictDoNothing()

const readUser = await db
  .insert(schema.permissions)
  .values({
    name: 'Read users',
    key: 'read:users',
  })
  .onConflictDoNothing()
  .returning()
const writedUser = await db
  .insert(schema.permissions)
  .values({
    name: 'Write users',
    key: 'write:users',
  })
  .onConflictDoNothing()
  .returning()
const readRoles = await db
  .insert(schema.permissions)
  .values({
    name: 'Read roles',
    key: 'read:roles',
  })
  .onConflictDoNothing()
  .returning()
const writeRoles = await db
  .insert(schema.permissions)
  .values({
    name: 'Write roles',
    key: 'write:roles',
  })
  .onConflictDoNothing()
  .returning()
const readPermissions = await db
  .insert(schema.permissions)
  .values({
    name: 'Read permissions',
    key: 'read:permissions',
  })
  .onConflictDoNothing()
  .returning()
const writePermissions = await db
  .insert(schema.permissions)
  .values({
    name: 'Write permissions',
    key: 'write:permissions',
  })
  .onConflictDoNothing()
  .returning()
const readOrgs = await db
  .insert(schema.permissions)
  .values({
    name: 'Read organizations',
    key: 'read:organizations',
  })
  .onConflictDoNothing()
  .returning()
const writeOrgs = await db
  .insert(schema.permissions)
  .values({
    name: 'Write organizations',
    key: 'write:organizations',
  })
  .onConflictDoNothing()
  .returning()

// App specific role and permissions
const teacherRole = await db
  .insert(schema.roles)
  .values({
    name: 'Teacher',
    key: 'teacher',
  })
  .onConflictDoNothing()
  .returning()

const writeCourses = await db
  .insert(schema.permissions)
  .values({
    name: 'Write courses',
    key: 'write:courses',
  })
  .onConflictDoNothing()
  .returning()
const writeCategories = await db
  .insert(schema.permissions)
  .values({
    name: 'Write categories',
    key: 'write:categories',
  })
  .onConflictDoNothing()
  .returning()

const teacherPermissions = {
  writeCategories,
  writeCourses,
}

const permissions = {
  ...teacherPermissions,
  readUser,
  writedUser,
  readRoles,
  writeRoles,
  readPermissions,
  writePermissions,
  readOrgs,
  writeOrgs,
}

const promises = Object.values(permissions).map(async (p) => {
  const data = p[0]

  if (!data) {
    return
  }

  await db
    .insert(schema.permissionsToRoles)
    .values({
      roleId: superAdminRole[0].id,
      permissionId: data.id,
    })
    .onConflictDoNothing()
})

await Promise.all(promises)

const teacherPromises = Object.values(teacherPermissions).map(async (p) => {
  const data = p[0]

  if (!data) {
    return
  }

  await db
    .insert(schema.permissionsToRoles)
    .values({
      roleId: teacherRole[0].id,
      permissionId: data.id,
    })
    .onConflictDoNothing()
})

await Promise.all(teacherPromises)

// App edu CBT data
await db
  .insert(schema.courseCategories)
  .values([
    {
      name: 'Chemistry',
      slug: 'chemistry',
    },
    {
      name: 'History',
      slug: 'history',
    },
    {
      name: 'Physics',
      slug: 'physics',
    },
    {
      name: 'Mathematics',
      slug: 'mathematics',
    },
    {
      name: 'Biology',
      slug: 'biology',
    },
    {
      name: 'Geography',
      slug: 'geography',
    },
    {
      name: 'Economony',
      slug: 'economy',
    },
    {
      name: 'Computer Science',
      slug: 'computer-science',
    },
  ])
  .onConflictDoNothing()

interface CourseJSON {
  topic: string
  id: number
  category: string
  image: string
  questions: {
    question: string
    options: { value: string; isCorrect: boolean }[]
  }[]
}

const glob = new Glob('**/*.json')
const courses: CourseJSON[] = []
for await (const path of glob.scanSync('scripts/courses')) {
  const course = (await file(
    new URL(`./courses/${path}`, import.meta.url)
  ).json()) as CourseJSON
  courses.push(course)
}

const coursePromises = courses.map(async (course) => {
  const category = await db
    .select()
    .from(schema.courseCategories)
    .where(eq(schema.courseCategories.slug, course.category))

  if (category.length === 0) {
    return
  }

  const newCourse = (
    await db
      .insert(schema.courses)
      .values({
        name: course.topic,
        slug: slugify(course.topic),
        image: course.image,
        testDuration: 30,
        id: course.id,
        categoryId: category[0].id,
      })
      .onConflictDoNothing()

      .returning()
  )[0]

  if (!newCourse) {
    return
  }

  await db.insert(schema.teachersToCourses).values({
    courseId: course.id,
    teacherId: superAdmin[0].id,
  })

  const questions = await db
    .insert(schema.courseQuestions)
    .values(
      course.questions.map((q) => ({
        question: q.question,
        courseId: newCourse.id,
      }))
    )
    .returning()

  const options = questions.flatMap((q) => {
    const realQ = course.questions.find((cq) => cq.question === q.question)!

    return realQ.options.map((o) => ({
      ...o,
      questionId: q.id,
    }))
  })

  await db.insert(schema.courseAnswerOptions).values(shuffleArray(options))
})

await Promise.all(coursePromises)

console.log('Seeding end')
await client.end()
console.log('Connection closed')
