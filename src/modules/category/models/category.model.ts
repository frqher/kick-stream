import { Field, ID, ObjectType } from '@nestjs/graphql'
import type { Category } from '@prisma/client'

@ObjectType()
export class CategoryModel implements Category {
	@Field(() => ID)
	public id: string

	@Field(() => String)
	public title: string

	@Field(() => String)
	public slug: string

	@Field(() => String, { nullable: true })
	public description: string

	@Field(() => String)
	public thumbnailUrl: string

	@Field(() => Date)
	public createdAt: Date

	@Field(() => Date)
	public updatedAt: Date
}
