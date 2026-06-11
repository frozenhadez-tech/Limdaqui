CREATE TYPE "public"."payment_method" AS ENUM('cod', 'gcash', 'bank_transfer');--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_method" "payment_method" DEFAULT 'cod' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_address" varchar(500);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_phone" varchar(60);