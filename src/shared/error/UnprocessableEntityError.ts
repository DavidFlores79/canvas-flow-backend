export class UnprocessaleEntityError extends Error {
  code: string;
  entity: string;
  constructor(message: string, entity: string, code: string) {
    super(message);
    this.name = UnprocessaleEntityError.name;
    this.entity = entity;
    this.code = code;
  }
}
