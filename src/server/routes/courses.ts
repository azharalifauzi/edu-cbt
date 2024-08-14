import { Hono } from 'hono'
import { authMiddleware } from '../middlewares/auth'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
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
import slugify from 'slugify'
import { generateJsonResponse } from '../lib/response'
import {
  getCourseById,
  getCourses,
  getCoursesByStudentId,
  getCoursesByTeacherId,
  getQuestionsByCourseId,
  getStudentAnswer,
  getStudentRapport,
  isCourseStarted,
  isJoinedCourse,
} from '../services/courses'
import { ServerError } from '../lib/error'
import { and, count, eq, getTableColumns } from 'drizzle-orm'
import { jsonAggBuildObjectOrEmptyArray } from '../utils/drizzle'
import dayjs from 'dayjs'

const app = new Hono()
  .get(
    '/categories',
    authMiddleware(),
    zValidator(
      'param',
      z.object({
        page: z.number({ coerce: true }).optional(),
        size: z.number({ coerce: true }).optional(),
      })
    ),
    async (c) => {
      const { page = 1, size = 10 } = c.req.valid('param')
      const skip = (page - 1) * size

      const [{ categories, totalCount }] = await db
        .select({
          totalCount: count(),
          categories: jsonAggBuildObjectOrEmptyArray(
            courseCategories,
            getTableColumns(courseCategories)
          ),
        })
        .from(courseCategories)
        .limit(size)
        .offset(skip)

      const pageCount = Math.ceil(totalCount / size)

      return generateJsonResponse(c, {
        pageCount,
        totalCount,
        data: categories,
      })
    }
  )
  .get(
    '/',
    authMiddleware(),
    zValidator(
      'param',
      z.object({
        page: z.number({ coerce: true }).optional(),
        size: z.number({ coerce: true }).optional(),
        search: z.string().optional(),
      })
    ),
    async (c) => {
      const courses = await getCourses(c.req.valid('param'))

      return generateJsonResponse(c, courses)
    }
  )
  .post(
    '/',
    authMiddleware({
      permission: ['write:courses'],
    }),
    zValidator(
      'json',
      z.object({
        name: z.string(),
        image: z.string().optional(),
        categoryId: z.number(),
        testDuration: z.number(),
        publishedAt: z.date().optional(),
      })
    ),
    async (c) => {
      const body = c.req.valid('json')

      const course = await db
        .insert(courses)
        .values({
          ...body,
          publishedAt: body.publishedAt
            ? dayjs(body.publishedAt).toISOString()
            : undefined,
          slug: slugify(body.name),
        })
        .returning()

      await db.insert(teachersToCourses).values({
        courseId: course[0].id,
        teacherId: c.get('userId'),
      })

      return generateJsonResponse(c, course[0], 201)
    }
  )
  .post(
    '/:id/questions',
    authMiddleware({
      permission: ['write:courses'],
    }),
    zValidator(
      'json',
      z.object({
        question: z.string(),
      })
    ),
    async (c) => {
      const courseId = Number(c.req.param('id'))
      const body = c.req.valid('json')
      const course = await getCourseById(courseId)

      if (!course?.teachers.some((teacher) => teacher.id === c.get('userId'))) {
        throw new ServerError(
          null,
          401,
          'You are not the teacher of this course'
        )
      }

      const question = await db
        .insert(courseQuestions)
        .values({
          ...body,
          courseId,
        })
        .returning()

      return generateJsonResponse(c, question[0], 201)
    }
  )
  .put(
    '/:id/questions',
    authMiddleware({
      permission: ['write:courses'],
    }),
    zValidator(
      'json',
      z.object({
        question: z.string(),
        questionId: z.number(),
      })
    ),
    async (c) => {
      const courseId = Number(c.req.param('id'))
      const body = c.req.valid('json')
      const course = await getCourseById(courseId)

      if (!course?.teachers.some((teacher) => teacher.id === c.get('userId'))) {
        throw new ServerError(
          null,
          401,
          'You are not the teacher of this course'
        )
      }

      await db
        .update(courseQuestions)
        .set(body)
        .where(eq(courseQuestions.id, body.questionId))

      return generateJsonResponse(c)
    }
  )
  .delete(
    '/:id/questions',
    authMiddleware({
      permission: ['write:courses'],
    }),
    zValidator(
      'json',
      z.object({
        questionId: z.number(),
      })
    ),
    async (c) => {
      const courseId = Number(c.req.param('id'))
      const course = await getCourseById(courseId)

      if (!course?.teachers.some((teacher) => teacher.id === c.get('userId'))) {
        throw new ServerError(
          null,
          401,
          'You are not the teacher of this course'
        )
      }

      await db
        .delete(courseQuestions)
        .where(eq(courseQuestions.id, c.req.valid('json').questionId))

      return generateJsonResponse(c)
    }
  )
  .post(
    '/:id/answer-options',
    authMiddleware({
      permission: ['write:courses'],
    }),
    zValidator(
      'json',
      z.object({
        questionId: z.number(),
        value: z.string(),
        isCorrect: z.boolean().optional(),
      })
    ),
    async (c) => {
      const courseId = Number(c.req.param('id'))
      const body = c.req.valid('json')
      const course = await getCourseById(courseId)

      if (!course?.teachers.some((teacher) => teacher.id === c.get('userId'))) {
        throw new ServerError(
          null,
          401,
          'You are not the teacher of this course'
        )
      }

      const question = await db
        .insert(courseAnswerOptions)
        .values(body)
        .returning()

      return generateJsonResponse(c, question[0], 201)
    }
  )
  .put(
    '/:id/answer-options',
    authMiddleware({
      permission: ['write:courses'],
    }),
    zValidator(
      'json',
      z.object({
        answerOptionsId: z.number(),
        value: z.string(),
        isCorrect: z.boolean().optional(),
      })
    ),
    async (c) => {
      const courseId = Number(c.req.param('id'))
      const body = c.req.valid('json')
      const course = await getCourseById(courseId)

      if (!course?.teachers.some((teacher) => teacher.id === c.get('userId'))) {
        throw new ServerError(
          null,
          401,
          'You are not the teacher of this course'
        )
      }

      const question = await db
        .update(courseAnswerOptions)
        .set({
          isCorrect: body.isCorrect,
          value: body.value,
        })
        .where(eq(courseAnswerOptions.id, body.answerOptionsId))
        .returning()

      return generateJsonResponse(c, question[0], 201)
    }
  )
  .delete(
    '/:id/answer-options',
    authMiddleware({
      permission: ['write:courses'],
    }),
    zValidator(
      'json',
      z.object({
        answerOptionsId: z.number(),
      })
    ),
    async (c) => {
      const courseId = Number(c.req.param('id'))
      const body = c.req.valid('json')
      const course = await getCourseById(courseId)

      if (!course?.teachers.some((teacher) => teacher.id === c.get('userId'))) {
        throw new ServerError(
          null,
          401,
          'You are not the teacher of this course'
        )
      }

      const question = await db
        .delete(courseAnswerOptions)
        .where(eq(courseAnswerOptions.id, body.answerOptionsId))

      return generateJsonResponse(c, question[0], 201)
    }
  )
  .post('/:id/join', authMiddleware(), async (c) => {
    const courseId = Number(c.req.param('id'))
    await db.insert(studentsToCourses).values({
      courseId,
      studentId: c.get('userId'),
    })

    return generateJsonResponse(c)
  })
  .post('/:id/start', authMiddleware(), async (c) => {
    const courseId = Number(c.req.param('id'))
    const isJoined = await isJoinedCourse(courseId, c.get('userId'))

    if (!isJoined) {
      throw new ServerError(null, 401, "You aren't joined to this course")
    }

    const isStarted = await isCourseStarted(courseId, c.get('userId'))

    if (isStarted) {
      throw new ServerError(null, 400, 'You already started the course')
    }

    await db.update(studentsToCourses).set({
      startedAt: dayjs().toISOString(),
    })

    return generateJsonResponse(c)
  })
  .post('/:id/finish', authMiddleware(), async (c) => {
    const courseId = Number(c.req.param('id'))
    const isJoined = await isJoinedCourse(courseId, c.get('userId'))

    if (!isJoined) {
      throw new ServerError(null, 401, "You aren't joined to this course")
    }

    const rapport = await getStudentRapport(courseId, c.get('userId'))

    await db
      .update(studentsToCourses)
      .set({
        finishedAt: dayjs().toISOString(),
        isPassed: rapport.every((r) => r.isCorrect),
        score: rapport.filter((r) => r.isCorrect).length,
      })
      .where(
        and(
          eq(studentsToCourses.studentId, c.get('userId')),
          eq(studentsToCourses.courseId, courseId)
        )
      )

    return generateJsonResponse(c)
  })
  .post(
    '/:id/answer',
    authMiddleware(),
    zValidator(
      'json',
      z.object({
        questionId: z.number(),
        answerId: z.number(),
      })
    ),
    async (c) => {
      const courseId = Number(c.req.param('id'))

      const isJoined = isJoinedCourse(courseId, c.get('userId'))

      if (!isJoined) {
        throw new ServerError(null, 401, "You aren't joined to this course")
      }

      const body = c.req.valid('json')

      const hasAnswered =
        (
          await db
            .select()
            .from(studentsToAnswers)
            .where(
              and(
                eq(studentsToAnswers.questionId, body.questionId),
                eq(studentsToAnswers.studentId, c.get('userId'))
              )
            )
        ).length > 0

      if (hasAnswered) {
        await db
          .update(studentsToAnswers)
          .set({
            answerId: body.answerId,
            updatedAt: dayjs().toISOString(),
          })
          .where(
            and(
              eq(studentsToAnswers.questionId, body.questionId),
              eq(studentsToAnswers.studentId, c.get('userId'))
            )
          )

        return generateJsonResponse(c)
      }

      await db.insert(studentsToAnswers).values({
        ...body,
        studentId: c.get('userId'),
      })

      return generateJsonResponse(c)
    }
  )
  .get(
    '/my-courses',
    authMiddleware(),
    zValidator(
      'param',
      z.object({
        page: z.number({ coerce: true }).optional(),
        size: z.number({ coerce: true }).optional(),
        search: z.string().optional(),
      })
    ),
    async (c) => {
      const courses = await getCoursesByStudentId(
        c.get('userId'),
        c.req.valid('param')
      )

      return generateJsonResponse(c, courses)
    }
  )
  .get('/my-courses/:courseId', authMiddleware(), async (c) => {
    const courseId = Number(c.req.param('courseId'))
    const courses = await getCoursesByStudentId(c.get('userId'), {
      courseId,
    })

    return generateJsonResponse(c, courses.data[0])
  })
  .get(
    '/teacher/my-courses',
    authMiddleware({ permission: ['write:courses'] }),
    zValidator(
      'param',
      z.object({
        page: z.number({ coerce: true }).optional(),
        size: z.number({ coerce: true }).optional(),
        search: z.string().optional(),
      })
    ),
    async (c) => {
      const courses = await getCoursesByTeacherId(
        c.get('userId'),
        c.req.valid('param')
      )

      return generateJsonResponse(c, courses)
    }
  )
  .get('/:id', authMiddleware(), async (c) => {
    const id = Number(c.req.param('id'))
    const course = await getCourseById(id)

    return generateJsonResponse(c, course)
  })
  .get(
    '/:id/students',
    authMiddleware({ permission: ['write:courses'] }),
    zValidator(
      'param',
      z.object({
        withRapport: z.boolean(),
      })
    ),
    async (c) => {
      const id = Number(c.req.param('id'))
      const { withRapport } = c.req.valid('param')
      const course = await getCourseById(id)

      if (!course?.teachers.some((teacher) => teacher.id === c.get('userId'))) {
        throw new ServerError(
          null,
          401,
          'You are not the teacher of this course'
        )
      }

      const students = await db
        .select({
          id: users.id,
          name: users.name,
          image: users.image,
        })
        .from(users)
        .leftJoin(studentsToCourses, eq(studentsToCourses.studentId, users.id))
        .where(eq(studentsToCourses.courseId, id))
        .groupBy(users.id)

      if (withRapport) {
        const questions = await db
          .select({
            ...getTableColumns(courseQuestions),
            answer: jsonAggBuildObjectOrEmptyArray(
              courseAnswerOptions,
              getTableColumns(courseAnswerOptions)
            ),
          })
          .from(courseQuestions)
          .leftJoin(
            courseAnswerOptions,
            and(
              eq(courseAnswerOptions.questionId, courseQuestions.id),
              eq(courseAnswerOptions.isCorrect, true)
            )
          )
          .groupBy(courseQuestions.id)
          .where(eq(courseQuestions.courseId, id))

        const studentAnswers = await db
          .select({
            studentId: users.id,
            answers: jsonAggBuildObjectOrEmptyArray(
              studentsToAnswers,
              getTableColumns(studentsToAnswers)
            ),
          })
          .from(users)
          .leftJoin(
            studentsToAnswers,
            eq(users.id, studentsToAnswers.studentId)
          )
          .leftJoin(
            courseQuestions,
            eq(studentsToAnswers.questionId, courseQuestions.id)
          )
          .where(eq(courseQuestions.courseId, id))
          .groupBy(users.id)

        const passedTests: Record<number, boolean> = {}

        students.forEach((student) => {
          const studentAnswer = studentAnswers.find(
            (sa) => sa.studentId === student.id
          )

          if (studentAnswer) {
            const isPassed = studentAnswer.answers.every((answer) => {
              const correctAnswer = questions
                .find((q) => q.id === answer.questionId)
                ?.answer.find((a) => a.isCorrect)

              if (!correctAnswer) {
                return false
              }

              return correctAnswer.id === answer.answerId
            })

            passedTests[student.id] = isPassed ? true : false
          }
        })

        return generateJsonResponse(
          c,
          students.map((s) => ({
            ...s,
            isPassed: passedTests[s.id],
          }))
        )
      }

      return generateJsonResponse(c, students)
    }
  )
  .get('/:id/questions', authMiddleware(), async (c) => {
    const id = Number(c.req.param('id'))
    const questions = await getQuestionsByCourseId(id)

    return generateJsonResponse(c, questions)
  })
  .get('/:id/answers', authMiddleware(), async (c) => {
    const id = Number(c.req.param('id'))
    const answers = await getStudentAnswer(c.get('userId'), id)

    return generateJsonResponse(c, answers)
  })
  .get('/:id/rapport', authMiddleware(), async (c) => {
    const id = Number(c.req.param('id'))

    const isJoined =
      (
        await db
          .select()
          .from(studentsToCourses)
          .where(eq(studentsToCourses.courseId, id))
      ).length > 0

    if (!isJoined) {
      throw new ServerError(null, 401, 'You are not a student of this course')
    }

    const rapport = await getStudentRapport(id, c.get('userId'))

    return generateJsonResponse(c, rapport)
  })
  .post(
    '/categories',
    authMiddleware({
      permission: ['write:categories'],
    }),
    zValidator('json', z.object({ name: z.string() })),
    async (c) => {
      const body = c.req.valid('json')
      const category = await db.insert(courseCategories).values({
        ...body,
        slug: slugify(body.name),
      })

      return generateJsonResponse(c, category, 201)
    }
  )
  .put(
    '/categories/:id',
    authMiddleware({
      permission: ['write:categories'],
    }),
    zValidator(
      'json',
      z.object({ name: z.string().optional(), slug: z.string().optional() })
    ),
    async (c) => {
      const id = Number(c.req.param('id'))
      const body = c.req.valid('json')
      await db
        .update(courseCategories)
        .set(body)
        .where(eq(courseCategories.id, id))

      return generateJsonResponse(c)
    }
  )
  .delete(
    '/categories/:id',
    authMiddleware({
      permission: ['write:categories'],
    }),
    async (c) => {
      const id = Number(c.req.param('id'))
      await db.delete(courseCategories).where(eq(courseCategories.id, id))

      return generateJsonResponse(c)
    }
  )

export default app
