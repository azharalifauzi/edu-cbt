ALTER TABLE "courses" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "published_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "students_to_answers" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "students_to_answers" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "students_to_courses" ADD COLUMN "joined_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "students_to_courses" ADD COLUMN "finished_at" timestamp;