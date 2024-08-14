ALTER TABLE "students_to_answers" DROP CONSTRAINT "students_to_answers_answer_id_course_questions_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "students_to_answers" ADD CONSTRAINT "students_to_answers_answer_id_course_answer_options_id_fk" FOREIGN KEY ("answer_id") REFERENCES "public"."course_answer_options"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
