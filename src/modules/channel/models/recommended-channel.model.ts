import { Field, ID, ObjectType } from '@nestjs/graphql'

@ObjectType()
export class RecommendedChannelCategoryModel {
	@Field(() => String)
	public title: string

	@Field(() => String)
	public slug: string
}

@ObjectType()
export class RecommendedChannelStreamModel {
	@Field(() => String)
	public title: string

	@Field(() => Boolean)
	public isLive: boolean

	@Field(() => RecommendedChannelCategoryModel, { nullable: true })
	public category: RecommendedChannelCategoryModel | null
}

@ObjectType()
export class RecommendedChannelModel {
	@Field(() => ID)
	public id: string

	@Field(() => String)
	public username: string

	@Field(() => String)
	public displayName: string

	@Field(() => String, { nullable: true })
	public avatar: string | null

	@Field(() => Boolean)
	public isVerified: boolean

	@Field(() => RecommendedChannelStreamModel)
	public stream: RecommendedChannelStreamModel
}
