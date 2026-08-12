import { Field, InputType } from '@nestjs/graphql'
import {
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsPositive,
	IsString,
	Max,
	MaxLength
} from 'class-validator'

@InputType()
export class CreatePlanInput {
	@Field(() => String)
	@IsString()
	@IsNotEmpty()
	@MaxLength(100)
	public title: string

	@Field(() => String, { nullable: true })
	@IsString()
	@IsOptional()
	@MaxLength(500)
	public description?: string

	@Field(() => Number)
	@IsNumber()
	@IsNotEmpty()
	@IsPositive()
	@Max(10000)
	public price: number
}
