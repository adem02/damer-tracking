import {
  IsDateString,
  IsNotEmpty,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

function IsAfter(property: string, validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isAfter',
      target: object.constructor,
      propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints as [string];
          const relatedValue = (args.object as Record<string, unknown>)[
            relatedPropertyName
          ];
          if (typeof value !== 'string' || typeof relatedValue !== 'string') {
            return false;
          }
          return new Date(value).getTime() > new Date(relatedValue).getTime();
        },
        defaultMessage(args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints as [string];
          return `${args.property} must be after ${relatedPropertyName}`;
        },
      },
    });
  };
}

export class GetMachineTraceDto {
  @ApiProperty({
    description: 'Début de la période (ISO 8601)',
    example: '2026-01-15T09:00:00Z',
  })
  @IsNotEmpty()
  @IsDateString()
  from!: string;

  @ApiProperty({
    description: 'Fin de la période (ISO 8601), postérieure à `from`',
    example: '2026-01-15T09:22:00Z',
  })
  @IsNotEmpty()
  @IsDateString()
  @IsAfter('from')
  to!: string;
}
