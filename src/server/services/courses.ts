import {
  and,
  count,
  desc,
  eq,
  getTableColumns,
  gte,
  ilike,
  type GetColumnData,
  lte,
  max,
  min,
  SQL,
  sql,
} from 'drizzle-orm'
import { db } from '../lib/db'
import {
  courseAnswerOptions,
  courseCategories,
  courseQuestions,
  courses,
  studentsToAnswers,
  studentsToCourses,
  teachersToCourses,
  users,
} from '../models'
import { jsonAggBuildObjectOrEmptyArray } from '../utils/drizzle'
import dayjs from 'dayjs'
import type { PgColumn } from 'drizzle-orm/pg-core'

export const getCourseById = async (id: number) => {
  const course = await db
    .select({
      ...getTableColumns(courses),
      teachers: jsonAggBuildObjectOrEmptyArray(users, {
        id: users.id,
        name: users.name,
        image: users.image,
      }),
    })
    .from(courses)
    .leftJoin(teachersToCourses, eq(courses.id, teachersToCourses.courseId))
    .leftJoin(users, eq(teachersToCourses.teacherId, users.id))
    .where(eq(courses.id, id))
    .groupBy(courses.id)

  if (course.length < 1) {
    return null
  }

  const studentsCount = await db
    .select({
      count: count(),
    })
    .from(studentsToCourses)
    .where(eq(studentsToCourses.courseId, id))

  return {
    ...course[0],
    totalStudents: studentsCount[0].count,
  }
}

interface GetCourseParams {
  page?: number
  size?: number
  search?: string
}

export const getCourses = async (
  userId: number,
  {
    page = 1,
    search,
    size = 10,
    isPublished,
  }: GetCourseParams & { isPublished?: boolean } = {}
) => {
  const skip = (page - 1) * size

  const totalCount = await db
    .select({
      count: count(),
    })
    .from(courses)

  const { joinedAt, finishedAt, startedAt } = getTableColumns(studentsToCourses)

  const getStudentDataColumn = <T extends PgColumn>(
    column: T
  ) => sql<GetColumnData<T> | null>`
    (SELECT ${column} FROM ${studentsToCourses}
		WHERE ${studentsToCourses.courseId} = ${courses.id} AND ${studentsToCourses.studentId} = ${userId}
		LIMIT 1)`

  const data = await db
    .select({
      ...getTableColumns(courses),
      teachers: jsonAggBuildObjectOrEmptyArray(users, {
        id: users.id,
        name: users.name,
        image: users.image,
      }),
      joinedAt: getStudentDataColumn(joinedAt),
      finishedAt: getStudentDataColumn(finishedAt),
      startedAt: getStudentDataColumn(startedAt),
    })
    .from(courses)
    .leftJoin(teachersToCourses, eq(teachersToCourses.courseId, courses.id))
    .leftJoin(users, eq(teachersToCourses.teacherId, users.id))
    .groupBy(courses.id)
    .offset(skip)
    .limit(size)
    .where(
      and(
        search ? ilike(courses.name, `%${search}%`) : undefined,
        isPublished
          ? lte(courses.publishedAt, dayjs().toISOString())
          : isPublished === false
          ? gte(courses.publishedAt, dayjs().toISOString())
          : undefined
      )
    )
  const pageCount = Math.ceil(totalCount[0].count / size)

  return {
    pageCount,
    data,
    totalCount: totalCount[0].count,
  }
}

export const getCoursesByStudentId = async (
  userId: number,
  {
    page = 1,
    size = 10,
    search,
    courseId,
  }: GetCourseParams & { courseId?: number } = {}
) => {
  const skip = (page - 1) * size

  const totalCount = await db
    .select({
      count: count(),
    })
    .from(studentsToCourses)
    .where(eq(studentsToCourses.studentId, userId))

  const pageCount = Math.ceil(totalCount[0].count / size)

  const data = await db
    .select({
      ...getTableColumns(courses),
      students: jsonAggBuildObjectOrEmptyArray(
        studentsToCourses,
        getTableColumns(studentsToCourses)
      ),
      categories: jsonAggBuildObjectOrEmptyArray(
        courseCategories,
        getTableColumns(courseCategories)
      ),
    })
    .from(courses)
    .leftJoin(studentsToCourses, eq(courses.id, studentsToCourses.courseId))
    .leftJoin(courseCategories, eq(courseCategories.id, courses.categoryId))
    .limit(size)
    .offset(skip)
    .groupBy(courses.id)
    .where(
      and(
        eq(studentsToCourses.studentId, userId),
        search ? ilike(courses.name, `%${search}%`) : undefined,
        courseId ? eq(studentsToCourses.courseId, courseId) : undefined
      )
    )

  return {
    pageCount,
    data: data.map(({ students, categories, ...other }) => ({
      ...other,
      studentData: students[0],
      category: categories[0],
    })),
    totalCount: totalCount[0].count,
  }
}

export const getCoursesByTeacherId = async (
  userId: number,
  { page = 1, size = 10, search }: GetCourseParams = {}
) => {
  const skip = (page - 1) * size

  const totalCount = await db
    .select({
      count: count(),
    })
    .from(teachersToCourses)
    .where(eq(teachersToCourses.teacherId, userId))

  const pageCount = Math.ceil(totalCount[0].count / size)

  const data = await db
    .select()
    .from(courses)
    .leftJoin(teachersToCourses, eq(teachersToCourses.courseId, courses.id))
    .leftJoin(users, eq(teachersToCourses.teacherId, users.id))
    .groupBy(courses.id)
    .limit(size)
    .offset(skip)
    .orderBy(desc(courses.createdAt))
    .where(
      and(
        eq(users.id, userId),
        search ? ilike(courses.name, `%${search}%`) : undefined
      )
    )

  return {
    pageCount,
    data,
    totalCount: totalCount[0].count,
  }
}

export const getStudentsByCourseId = async (id: number) => {
  const students = await db
    .select({
      name: users.name,
      image: users.image,
      id: users.id,
    })
    .from(users)
    .leftJoin(studentsToCourses, eq(studentsToCourses.studentId, users.id))
    .where(eq(studentsToCourses.courseId, id))

  return students
}

export const getStudentAnswer = async (userId: number, courseId: number) => {
  const answers = await db
    .select({
      ...getTableColumns(courseQuestions),
      optionData: jsonAggBuildObjectOrEmptyArray(courseAnswerOptions, {
        id: courseAnswerOptions.id,
        value: courseAnswerOptions.value,
      }),
      studentAnswer: jsonAggBuildObjectOrEmptyArray(
        studentsToAnswers,
        getTableColumns(studentsToAnswers)
      ),
    })
    .from(courseQuestions)
    .leftJoin(
      studentsToAnswers,
      eq(courseQuestions.id, studentsToAnswers.questionId)
    )
    .leftJoin(
      courseAnswerOptions,
      eq(studentsToAnswers.answerId, courseAnswerOptions.id)
    )
    .where(
      and(
        eq(studentsToAnswers.studentId, userId),
        eq(courseQuestions.courseId, courseId),
        eq(courseAnswerOptions.id, studentsToAnswers.answerId)
      )
    )
    .groupBy(courseQuestions.id)

  return answers
}

interface GetQuestionsByCourseIdParam {
  correctFlag?: 'include' | 'hidden'
}

export const getQuestionsByCourseId = async (
  courseId: number,
  { correctFlag }: GetQuestionsByCourseIdParam = {}
) => {
  const questions = await db
    .select({
      ...getTableColumns(courseQuestions),
      answerOptions: jsonAggBuildObjectOrEmptyArray(courseAnswerOptions, {
        id: courseAnswerOptions.id,
        value: courseAnswerOptions.value,
        ...(correctFlag === 'include'
          ? { isCorrect: courseAnswerOptions.isCorrect }
          : {}),
      }),
    })
    .from(courseQuestions)
    .leftJoin(
      courseAnswerOptions,
      eq(courseQuestions.id, courseAnswerOptions.questionId)
    )
    .groupBy(courseQuestions.id)
    .where(eq(courseQuestions.courseId, courseId))

  return questions
}

export const isJoinedCourse = async (courseId: number, userId: number) => {
  return (
    (
      await db
        .select({ courseId: studentsToCourses.courseId })
        .from(studentsToCourses)
        .where(
          and(
            eq(studentsToCourses.courseId, courseId),
            eq(studentsToCourses.studentId, userId)
          )
        )
    ).length > 0
  )
}

export const isCourseStarted = async (courseId: number, userId: number) => {
  const course = await db
    .select({
      courseId: studentsToCourses.courseId,
      isStarted: studentsToCourses.isStarted,
    })
    .from(studentsToCourses)
    .where(
      and(
        eq(studentsToCourses.courseId, courseId),
        eq(studentsToCourses.studentId, userId)
      )
    )

  return !!course[0].isStarted
}

interface GetStudentReportParams {
  userId: number
  courseId?: number
  page?: number
  size?: number
}

export const getStudentReport = async ({
  userId,
  courseId,
  page = 1,
  size = 10,
}: GetStudentReportParams) => {
  const skip = (page - 1) * size

  const { studentId, joinedAt, finishedAt, startedAt } =
    getTableColumns(studentsToCourses)

  const report = await db
    .select({
      ...getTableColumns(courses),
      studentId,
      joinedAt: min(joinedAt),
      finishedAt: min(finishedAt),
      startedAt: min(startedAt),
      categoryName: max(courseCategories.name) as SQL<string>,
      totalCount: sql<number>`(
    SELECT COUNT(*) FROM ${studentsToCourses}
    WHERE ${studentsToCourses.studentId} = ${userId}
  )`.as('totalCount'),
      questionCounts: sql<number>`(SELECT COUNT(id) FROM ${courseQuestions}
    WHERE ${courseQuestions.courseId} = ${courses.id})`.as('questionCounts'),
      correctAnswers: sql<number>`(SELECT COUNT(*) FROM ${studentsToAnswers}
    JOIN ${courseQuestions} ON ${courseQuestions.id} = ${studentsToAnswers.questionId}
    JOIN ${courseAnswerOptions} ON ${courseAnswerOptions.id} = ${studentsToAnswers.answerId}
    WHERE 
      ${courseQuestions.courseId} = ${courses.id} AND
      ${studentsToAnswers.studentId} = ${userId} AND
      ${courseAnswerOptions.isCorrect} = true)`.as('correctAnswers'),
      questions: sql<
        {
          id: number
          question: string
          isCorrect: boolean
        }[]
      >`json_agg(
    json_build_object(
      'id', ${courseQuestions.id},
      'question', ${courseQuestions.question},
      'isCorrect', 
      (
        SELECT ${courseAnswerOptions.isCorrect}
        FROM ${studentsToAnswers}
        JOIN ${courseAnswerOptions} 
          ON ${courseAnswerOptions.id} = ${studentsToAnswers.answerId}
        WHERE ${studentsToAnswers.questionId} = ${courseQuestions.id} 
          AND ${studentsToAnswers.studentId} = ${studentsToCourses.studentId}
        LIMIT 1 -- ensure you only get one result
      )
    )
  )`.as('questions'),
    })
    .from(studentsToCourses)
    .innerJoin(courses, eq(courses.id, studentsToCourses.courseId))
    .innerJoin(courseCategories, eq(courseCategories.id, courses.categoryId))
    .innerJoin(
      courseQuestions,
      eq(courseQuestions.courseId, studentsToCourses.courseId)
    )
    .where(
      and(
        eq(studentsToCourses.studentId, userId),
        courseId ? eq(courses.id, courseId) : undefined
      )
    )
    .groupBy(courses.id, studentsToCourses.studentId)
    .limit(size)
    .offset(skip)

  if (report.length === 0) {
    return null
  }

  const totalCount = report[0].totalCount
  const pageCount = Math.ceil(totalCount / size)

  return {
    totalCount,
    data: report.map(({ totalCount, ...r }) => r),
    pageCount,
  }
}
