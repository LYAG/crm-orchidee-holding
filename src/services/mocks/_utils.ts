export function delay(ms?: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms ?? Math.random() * 300 + 200));
}

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function notFound(entity: string, id: string): never {
  throw new Error(`${entity} introuvable : ${id}`);
}
