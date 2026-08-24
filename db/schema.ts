import { integer, index, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const graphBooks = sqliteTable('graph_books', {
  key: text('key').primaryKey(),
  title: text('title').notNull(),
  grade: integer('grade').notNull(),
  semester: text('semester').notNull(),
  pages: integer('pages').notNull(),
  entityCount: integer('entity_count').notNull(),
  tripleCount: integer('triple_count').notNull(),
  evidenceCount: integer('evidence_count').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

export const graphEntities = sqliteTable('graph_entities', {
  id: text('id').primaryKey(),
  bookKey: text('book_key').notNull().references(() => graphBooks.key),
  name: text('name').notNull(),
  type: text('type').notNull(),
  aliases: text('aliases'),
  description: text('description'),
  firstPage: integer('first_page'),
  confidence: real('confidence'),
}, (table) => ({
  bookNameIdx: index('idx_graph_entities_book_name').on(table.bookKey, table.name),
  bookTypeIdx: index('idx_graph_entities_book_type').on(table.bookKey, table.type),
}));

export const graphTriples = sqliteTable('graph_triples', {
  id: text('id').primaryKey(),
  bookKey: text('book_key').notNull().references(() => graphBooks.key),
  subject: text('subject').notNull(),
  predicate: text('predicate').notNull(),
  objectId: text('object_id'),
  literal: text('literal'),
  objectKind: text('object_kind'),
  sourcePage: integer('source_page'),
  section: text('section'),
  confidence: real('confidence'),
}, (table) => ({
  bookSubjectIdx: index('idx_graph_triples_book_subject').on(table.bookKey, table.subject),
  stableTripleIdx: uniqueIndex('uq_graph_triples_stable').on(table.bookKey, table.subject, table.predicate, table.objectId, table.literal),
}));

export const graphEvidence = sqliteTable('graph_evidence', {
  id: text('id').primaryKey(),
  tripleId: text('triple_id').notNull().references(() => graphTriples.id),
  bookKey: text('book_key').notNull().references(() => graphBooks.key),
  pdfPage: integer('pdf_page'),
  textbookPage: text('textbook_page'),
  summary: text('summary'),
  region: text('region'),
  confidence: real('confidence'),
}, (table) => ({
  evidenceTripleIdx: index('idx_graph_evidence_triple').on(table.tripleId),
}));

export const learningProfiles = sqliteTable('learning_profiles', {
  userId: text('user_id').primaryKey(),
  grade: integer('grade'),
  semester: text('semester'),
  knownEntities: text('known_entities').notNull().default('[]'),
  progress: integer('progress').notNull().default(0),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

export const learningEvents = sqliteTable('learning_events', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  bookKey: text('book_key').notNull(),
  entityId: text('entity_id'),
  eventType: text('event_type').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
}, (table) => ({
  userTimeIdx: index('idx_learning_events_user_time').on(table.userId, table.createdAt),
}));
