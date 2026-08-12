import { Field, ID, ObjectType } from '@nestjs/graphql'

@ObjectType()
export class PublicUserModel {
	@Field(() => ID)
	public id: string

	@Field(() => String)
	public username: string

	@Field(() => String)
	public displayName: string

	@Field(() => String, { nullable: true })
	public avatar: string | null

	@Field(() => String, { nullable: true })
	public bio: string | null

	@Field(() => Boolean)
	public isVerified: boolean
}
