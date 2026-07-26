import { Field, InputType } from '@nestjs/graphql'
import { IsNotEmpty, IsString, MaxLength } from 'class-validator'

@InputType()
export class SendMessageInput {
	@Field(() => String)
	@IsString()
	@IsNotEmpty()
	@MaxLength(300)
	public text: string

	@Field(() => String)
	@IsString()
	@IsNotEmpty()
	public streamId: string
}
