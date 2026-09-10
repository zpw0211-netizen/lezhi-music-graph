export type GraphEntity = {
  id: string;
  name: string;
  type: string;
  aliases?: string[];
  description?: string;
  bookKeys?: string[];
  textbookCount?: number;
  occurrenceCount?: number;
  degree?: number;
  relationCount?: number;
  visualImportance?: number;
  visualRank?: number;
};

export type GraphRelationship = {
  id: string;
  subject: string;
  predicate: string;
  label?: string;
  objectId?: string | null;
  crossBook?: boolean;
  provenance?: boolean;
  bookKeys?: string[];
};

export type GraphPositionedNode<E extends GraphEntity = GraphEntity> = {
  entity: E;
  x: number;
  y: number;
};

export type GraphPathStep = {
  edgeId: string;
  predicate: string;
  sourceId: string;
  targetId: string;
};

export type GraphPath = {
  nodeIds: string[];
  edgeIds: string[];
  steps: GraphPathStep[];
};

export type GraphPerspective =
  | "comprehensive"
  | "textbook"
  | "music"
  | "progression";
