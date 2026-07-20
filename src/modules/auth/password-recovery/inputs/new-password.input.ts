import { Field, InputType } from '@nestjs/graphql'
import {
	IsNotEmpty,
	IsString,
	IsUUID,
	MinLength,
	Validate
} from 'class-validator'
import { IsPasswordsMatching } from 'src/shared/decorators/is-password-matching.decorator'

@InputType()
export class NewPasswordInput {
	@Field(() => String)
	@IsString()
	@IsNotEmpty()
	@MinLength(8)
	public password: string

	@Field(() => String)
	@IsString()
	@IsNotEmpty()
	@MinLength(8)
	@Validate(IsPasswordsMatching)
	public passwordRepeat: string

	@Field(() => String)
	@IsUUID('4')
	@IsNotEmpty()
	public token: string
}
