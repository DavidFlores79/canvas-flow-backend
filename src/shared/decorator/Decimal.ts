import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function Decimal(
  maxIntegers: number,
  maxDecimals: number,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'Decimal',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [maxIntegers, maxDecimals],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string' && typeof value !== 'number')
            return false;

          const [maxInt, maxDec] = args.constraints as [number, number];

          const regex = new RegExp(`^\\d{1,${maxInt}}(\\.\\d{1,${maxDec}})?$`);

          return regex.test(String(value));
        },
        defaultMessage(args: ValidationArguments) {
          const [maxInt, maxDec] = args.constraints as [number, number];
          return `${args.property} must be a number with up to ${maxInt} digits before the decimal and up to ${maxDec} digits after`;
        },
      },
    });
  };
}
