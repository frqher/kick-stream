import { Field, ID, ObjectType } from '@nestjs/graphql'
import type { SocialLink } from '@prisma/client'

@ObjectType()
export class SocialLinkModel implements SocialLink {
	@Field(() => ID)
	public id: string

	@Field(() => String)
	public title: string

	@Field(() => String)
	public url: string

	@Field(() => Number)
	public position: number

	@Field(() => String, { nullable: true })
	public userId: string

	@Field(() => Date)
	public createdAt: Date

	@Field(() => Date)
	public updatedAt: Date
}
