// AST utility functions for immutable operations and traversal

/**
 * Deeply freezes an object to make it immutable.
 * Used to ensure all AST nodes are immutable after creation.
 */
export function freeze<T>(obj: T): Readonly<T> {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  // Freeze the object itself
  Object.freeze(obj);

  // Recursively freeze all properties
  Object.values(obj).forEach((value) => {
    if (value !== null && typeof value === "object") {
      freeze(value);
    }
  });

  return obj as Readonly<T>;
}

/**
 * Creates a shallow clone of an object with optional property updates.
 * Used for immutable updates to AST nodes.
 */
export function cloneWith<T extends Record<string, any>>(
  obj: T,
  updates: Partial<T>
): T {
  return freeze({
    ...obj,
    ...updates,
  }) as T;
}

/**
 * Type guard to check if a value is an OperationNode.
 */
export function isOperationNode(
  value: unknown
): value is import("./operation-node").OperationNode {
  return (
    typeof value === "object" &&
    value !== null &&
    "kind" in value &&
    typeof (value as any).kind === "string"
  );
}

/**
 * Type guard to check if an array contains only OperationNodes.
 */
export function isOperationNodeArray(
  value: unknown
): value is import("./operation-node").OperationNode[] {
  return Array.isArray(value) && value.every(isOperationNode);
}
