import { Field, InputType } from '@nestjs/graphql'
import {
	IsNotEmpty,
	IsOptional,
	IsString,
	Matches,
	MaxLength,
	MinLength
} from 'class-validator'

@InputType()
export class ChangeProfileInfoInput {
	@Field()
	@IsString()
	@IsNotEmpty()
	@Matches(/^[a-zA-Z0-9_]+(?:-[a-zA-Z0-9_]+)*$/)
	@MinLength(3)
	@MaxLength(22)
	public username: string

	@Field()
	@IsString()
	@IsNotEmpty()
	@MinLength(3)
	@MaxLength(30)
	public displayName: string

	@Field()
	@IsString()
	@IsOptional()
	@MaxLength(300)
	public bio?: string
}
