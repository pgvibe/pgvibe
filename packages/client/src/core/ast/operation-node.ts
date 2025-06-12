// Base operation node interface - foundation for all AST nodes
// Every SQL component becomes an immutable operation node

/**
 * Base interface for all operation nodes in the AST.
 * Every SQL component (queries, clauses, expressions) extends this.
 */
export interface OperationNode {
  readonly kind: string;
}

/**
 * Interface for nodes that can be visited by the query compiler.
 * Provides a foundation for the visitor pattern used in compilation.
 */
export interface VisitableNode extends OperationNode {
  accept?<T>(visitor: NodeVisitor<T>): T;
}

/**
 * Visitor interface for traversing the AST.
 * The PostgreSQL query compiler implements this for SQL generation.
 */
export interface NodeVisitor<T> {
  visitNode(node: OperationNode): T;
}

/**
 * Union type for top-level query nodes that can be executed.
 * This will be expanded as we add more query types.
 */
export type RootOperationNode = OperationNode; // Will be refined to specific query types
