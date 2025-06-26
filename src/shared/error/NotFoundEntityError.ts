export class NotFoundEntityError extends Error {
  code: string;
  entity: string;
  constructor(message: string, entity: string, code: string) {
    super(message);
    this.name = NotFoundEntityError.name;
    this.entity = entity;
    this.code = code;
  }
}
