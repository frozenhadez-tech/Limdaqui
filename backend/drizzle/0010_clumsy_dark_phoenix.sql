ALTER TABLE "order_items" ADD COLUMN "variant" varchar(160);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "colors" jsonb;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sizes" jsonb;