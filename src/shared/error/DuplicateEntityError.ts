export class DuplicateEntityError extends Error {
  code: string;
  entity: string;
  constructor(message: string, entity: string, code: string) {
    super(message);
    this.name = DuplicateEntityError.name;
    this.entity = entity;
    this.code = code;
  }
}
