CREATE TABLE IF NOT EXISTS "course_answer_options" (
	"id" serial PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"question_id" serial NOT NULL,
	"is_correct" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "course_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "course_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"question" text NOT NULL,
	"course_id" serial NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"slug" varchar NOT NULL,
	"image" text,
	"category_id" serial NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "students_to_answers" (
	"id" serial NOT NULL,
	"question_id" serial NOT NULL,
	"answer_id" serial NOT NULL,
	CONSTRAINT "students_to_answers_id_question_id_answer_id_pk" PRIMARY KEY("id","question_id","answer_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "students_to_courses" (
	"student_id" serial NOT NULL,
	"course_id" serial NOT NULL,
	CONSTRAINT "students_to_courses_student_id_course_id_pk" PRIMARY KEY("student_id","course_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "teachers_to_courses" (
	"teacher_id" serial NOT NULL,
	"course_id" serial NOT NULL,
	CONSTRAINT "teachers_to_courses_teacher_id_course_id_pk" PRIMARY KEY("teacher_id","course_id")
);
--> statement-breakpoint
ALTER TABLE "permissionsToRoles" RENAME COLUMN "user_id" TO "permission_id";--> statement-breakpoint
ALTER TABLE "permissionsToRoles" DROP CONSTRAINT "permissionsToRoles_user_id_permissions_id_fk";
--> statement-breakpoint
ALTER TABLE "permissionsToRoles" DROP CONSTRAINT "permissionsToRoles_role_id_user_id_pk";--> statement-breakpoint
ALTER TABLE "permissionsToRoles" ADD CONSTRAINT "permissionsToRoles_role_id_permission_id_pk" PRIMARY KEY("role_id","permission_id");--> statement-breakpoint
ALTER TABLE "roles" ADD COLUMN "assigned_on_signup" boolean DEFAULT false;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_answer_options" ADD CONSTRAINT "course_answer_options_question_id_course_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."course_questions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_questions" ADD CONSTRAINT "course_questions_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "courses" ADD CONSTRAINT "courses_category_id_course_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."course_categories"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "students_to_answers" ADD CONSTRAINT "students_to_answers_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "students_to_answers" ADD CONSTRAINT "students_to_answers_question_id_course_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."course_questions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "students_to_answers" ADD CONSTRAINT "students_to_answers_answer_id_course_questions_id_fk" FOREIGN KEY ("answer_id") REFERENCES "public"."course_questions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "students_to_courses" ADD CONSTRAINT "students_to_courses_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "students_to_courses" ADD CONSTRAINT "students_to_courses_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "teachers_to_courses" ADD CONSTRAINT "teachers_to_courses_teacher_id_users_id_fk" FOREIGN KEY ("teacher_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "teachers_to_courses" ADD CONSTRAINT "teachers_to_courses_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "permissionsToRoles" ADD CONSTRAINT "permissionsToRoles_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
