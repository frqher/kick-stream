import { Field, ObjectType } from '@nestjs/graphql'
import { PublicUserModel } from 'src/modules/auth/account/models/public-user.model'
import { SocialLinkModel } from 'src/modules/auth/profile/models/social-link.model'
import { StreamModel } from 'src/modules/stream/models/stream.model'

@ObjectType()
export class PublicChannelModel extends PublicUserModel {
	@Field(() => [SocialLinkModel])
	public socialLinks: SocialLinkModel[]

	@Field(() => StreamModel, { nullable: true })
	public stream: StreamModel | null
}
