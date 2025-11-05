// shared/decorator/Match.ts
import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

type PlainRecord = Record<string, unknown>;

/**
 * Constructor explícito (evita usar `Function`).
 * Los parámetros del constructor se declaran como any[] porque
 * no nos importan sus tipos aquí: sólo necesitamos el tipo "constructible".
 */
type Constructor<T = unknown> = new (...args: any[]) => T;

interface HasConstructor {
  constructor: Constructor;
}

/**
 * Decorador Match: compara el valor de la propiedad con otra propiedad del DTO.
 */
export function Match(property: string, validationOptions?: ValidationOptions) {
  // Firma correcta del property decorator: target: Object, propertyName: string | symbol
  return (target: object, propertyName: string | symbol) => {
    // Cuando el decorador se aplica sobre una propiedad de instancia,
    // `target` será el prototype; cuando es estática, `target` será el constructor.
    const targetClass: Constructor =
      typeof target === 'function'
        ? // Caso raro: si el decorador fue aplicado a la clase directamente
          // (no lo es normalmente para property decorators), convertimos.
          (target as unknown as Constructor)
        : // Caso normal: target es el prototype, así que usamos target.constructor
          (target as HasConstructor).constructor;

    registerDecorator({
      name: 'Match',
      // target acepta un valor constructible; usamos targetClass
      target: targetClass,
      propertyName: propertyName as string,
      options: validationOptions,
      constraints: [property],
      validator: MatchConstraint,
    });
  };
}

@ValidatorConstraint({ name: 'Match' })
export class MatchConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    // constraints viene como [string]
    const [relatedPropertyName] = args.constraints as [string];
    const obj = args.object as PlainRecord;
    const relatedValue = obj[relatedPropertyName];

    // Comparación estricta; cámbiala si necesitas tolerancia a tipos/espacios
    return value === relatedValue;
  }

  defaultMessage(args: ValidationArguments): string {
    const [relatedPropertyName] = args.constraints as [string];
    return `${args.property} must match ${relatedPropertyName}`;
  }
}
