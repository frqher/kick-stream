import { Field, InputType } from '@nestjs/graphql'
import {
	IsInt,
	IsNotEmpty,
	IsString,
	IsUrl,
	Max,
	MaxLength,
	Min
} from 'class-validator'

@InputType()
export class SocialLinkInput {
	@Field(() => String)
	@IsString()
	@IsNotEmpty()
	@MaxLength(50)
	public title: string

	@Field(() => String)
	@IsString()
	@IsNotEmpty()
	@IsUrl({ protocols: ['http', 'https'], require_protocol: true })
	@MaxLength(2048)
	public url: string
}

@InputType()
export class SocialLinkOrderInput {
	@Field(() => String)
	@IsString()
	@IsNotEmpty()
	public id: string

	@Field(() => Number)
	@IsInt()
	@IsNotEmpty()
	@Min(1)
	@Max(100)
	public position: number
}
