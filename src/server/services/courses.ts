import {
  and,
  count,
  countDistinct,
  desc,
  eq,
  getTableColumns,
  ilike,
  sql,
} from 'drizzle-orm'
import { db } from '../lib/db'
import {
  courseAnswerOptions,
  courseQuestions,
  courses,
  studentsToAnswers,
  studentsToCourses,
  teachersToCourses,
  users,
} from '../models'
import {
  jsonAggBuildObjectOrEmptyArray,
  jsonBuildObject,
} from '../utils/drizzle'

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

export const getCoursesByStudentId = async (
  userId: number,
  { page = 1, size = 10, search }: GetCourseParams = {}
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
      joinedAt: studentsToCourses.joinedAt,
      finishedAt: studentsToCourses.finishedAt,
    })
    .from(courses)
    .leftJoin(studentsToCourses, eq(studentsToCourses.courseId, courses.id))
    .leftJoin(users, eq(studentsToCourses.studentId, users.id))
    .groupBy(courses.id)
    .limit(size)
    .offset(skip)
    .orderBy(desc(studentsToCourses.joinedAt))
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
      answerId: studentsToAnswers.answerId,
      questionId: studentsToAnswers.questionId,
      answer: jsonBuildObject({
        value: courseAnswerOptions.value,
      }),
      question: jsonBuildObject({
        value: courseQuestions.question,
      }),
    })
    .from(studentsToAnswers)
    .leftJoin(
      courseQuestions,
      eq(studentsToAnswers.questionId, courseQuestions.id)
    )
    .leftJoin(
      courseAnswerOptions,
      eq(courseQuestions.id, courseAnswerOptions.id)
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
    .where(eq(courseQuestions.id, courseId))

  return questions
}

export const isJoinedCourse = async (courseId: number, userId: number) => {
  return (
    (
      await db
        .select()
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

export const getStudentRapport = async (courseId: number, userId: number) => {
  const questions = await getQuestionsByCourseId(courseId, {
    correctFlag: 'include',
  })
  const answers = await getStudentAnswer(userId, courseId)

  const rapport = questions.map((q) => {
    const answer = answers.find((a) => a.questionId === q.id)
    const correctAnswer = q.answerOptions.find((o) => o.isCorrect)
    const isCorrect = answer?.answerId == correctAnswer?.id

    return {
      isCorrect,
      questionId: q.id,
      question: q.question,
      answer: answer?.answer.value,
      answerId: answer?.answerId,
    }
  })

  return rapport
}
