CREATE TABLE `graph_books` (
	`key` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`grade` integer NOT NULL,
	`semester` text NOT NULL,
	`pages` integer NOT NULL,
	`entity_count` integer NOT NULL,
	`triple_count` integer NOT NULL,
	`evidence_count` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `graph_entities` (
	`id` text PRIMARY KEY NOT NULL,
	`book_key` text NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`aliases` text,
	`description` text,
	`first_page` integer,
	`confidence` real,
	FOREIGN KEY (`book_key`) REFERENCES `graph_books`(`key`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_graph_entities_book_name` ON `graph_entities` (`book_key`,`name`);--> statement-breakpoint
CREATE INDEX `idx_graph_entities_book_type` ON `graph_entities` (`book_key`,`type`);--> statement-breakpoint
CREATE TABLE `graph_evidence` (
	`id` text PRIMARY KEY NOT NULL,
	`triple_id` text NOT NULL,
	`book_key` text NOT NULL,
	`pdf_page` integer,
	`textbook_page` text,
	`summary` text,
	`region` text,
	`confidence` real,
	FOREIGN KEY (`triple_id`) REFERENCES `graph_triples`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`book_key`) REFERENCES `graph_books`(`key`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_graph_evidence_triple` ON `graph_evidence` (`triple_id`);--> statement-breakpoint
CREATE TABLE `graph_triples` (
	`id` text PRIMARY KEY NOT NULL,
	`book_key` text NOT NULL,
	`subject` text NOT NULL,
	`predicate` text NOT NULL,
	`object_id` text,
	`literal` text,
	`object_kind` text,
	`source_page` integer,
	`section` text,
	`confidence` real,
	FOREIGN KEY (`book_key`) REFERENCES `graph_books`(`key`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_graph_triples_book_subject` ON `graph_triples` (`book_key`,`subject`);--> statement-breakpoint
CREATE UNIQUE INDEX `uq_graph_triples_stable` ON `graph_triples` (`book_key`,`subject`,`predicate`,`object_id`,`literal`);--> statement-breakpoint
CREATE TABLE `learning_events` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`book_key` text NOT NULL,
	`entity_id` text,
	`event_type` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_learning_events_user_time` ON `learning_events` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `learning_profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`grade` integer,
	`semester` text,
	`known_entities` text DEFAULT '[]' NOT NULL,
	`progress` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL
);
