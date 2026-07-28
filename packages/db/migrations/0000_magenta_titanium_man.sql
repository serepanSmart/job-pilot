CREATE TYPE "public"."ats_provider" AS ENUM('greenhouse', 'lever', 'ashby');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('new', 'shortlisted', 'tailored', 'applied', 'screening', 'interview', 'offer', 'rejected', 'archived');--> statement-breakpoint
CREATE TYPE "public"."timezone_fit" AS ENUM('good', 'ok', 'bad');--> statement-breakpoint
CREATE TABLE "companies" (
	"slug" text PRIMARY KEY NOT NULL,
	"ats" "ats_provider" NOT NULL,
	"added_from" text DEFAULT 'seed' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company" text NOT NULL,
	"role" text NOT NULL,
	"url" text NOT NULL,
	"source" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"score" integer,
	"verdict" text,
	"matched_keywords" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"missing_keywords" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"red_flags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"timezone_fit" timezone_fit,
	"salary_info" text,
	"location_policy" text,
	"status" "job_status" DEFAULT 'new' NOT NULL,
	"date_found" timestamp with time zone DEFAULT now() NOT NULL,
	"date_applied" timestamp with time zone,
	"follow_up_due" timestamp with time zone,
	"notes" text DEFAULT '' NOT NULL,
	"content_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seen_hashes" (
	"hash" text PRIMARY KEY NOT NULL,
	"first_seen" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "jobs_url_unique" ON "jobs" USING btree ("url");--> statement-breakpoint
CREATE UNIQUE INDEX "jobs_content_hash_unique" ON "jobs" USING btree ("content_hash");--> statement-breakpoint
CREATE INDEX "jobs_status_score_idx" ON "jobs" USING btree ("status","score");