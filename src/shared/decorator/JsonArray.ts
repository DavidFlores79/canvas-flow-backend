// src/common/validators/is-json-object-or-array.decorator.ts
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsJsonObjectOrArrayConstraint
  implements ValidatorConstraintInterface
{
  validate(value: any) {
    if (value === undefined || value === null) return true; // allow optional
    // must be plain object or array
    return typeof value === 'object' && value !== null;
  }

  defaultMessage(_args: ValidationArguments) {
    return `metadata must be an object or an array ${_args.value}`;
  }
}

export function IsJsonObjectOrArray(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsJsonObjectOrArrayConstraint,
    });
  };
}
