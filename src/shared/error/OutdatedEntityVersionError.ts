export class OutdatedEntityVersionError extends Error {
  code: string;
  entity: string;
  constructor(message: string, entity: string, code: string) {
    super(message);
    this.name = OutdatedEntityVersionError.name;
    this.entity = entity;
    this.code = code;
  }
}
