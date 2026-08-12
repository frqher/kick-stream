import { Field, InputType } from '@nestjs/graphql'
import {
	IsNotEmpty,
	IsString,
	Length,
	MaxLength,
	MinLength
} from 'class-validator'

@InputType()
export class DisableTotpInput {
	@Field(() => String)
	@IsString()
	@IsNotEmpty()
	@MinLength(8)
	@MaxLength(32)
	public password: string

	@Field(() => String)
	@IsString()
	@IsNotEmpty()
	@Length(6, 6)
	public pin: string
}
