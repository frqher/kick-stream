import { Field, InputType } from '@nestjs/graphql'
import {
	IsEmail,
	IsNotEmpty,
	IsOptional,
	IsString,
	Length,
	MaxLength,
	MinLength
} from 'class-validator'

@InputType()
export class DeactiveAccountInput {
	@Field()
	@IsString()
	@IsNotEmpty()
	@IsEmail()
	public email: string

	@Field()
	@IsString()
	@IsNotEmpty()
	@MinLength(8)
	@MaxLength(32)
	public password: string

	@Field(() => String, { nullable: true })
	@IsString()
	@IsOptional()
	@Length(6, 6)
	public pin?: string
}
