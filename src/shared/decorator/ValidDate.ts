import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { DateTime } from 'luxon';

export function IsIsoValidDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isIsoValidDate',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          if (typeof value !== 'string') return false;

          if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

          const dt: DateTime = DateTime.fromISO(value, { zone: 'utc' });

          return dt.isValid;
        },

        defaultMessage(args: ValidationArguments): string {
          return `${args.property} must be a valid date in YYYY-MM-DD format`;
        },
      },
    });
  };
}
