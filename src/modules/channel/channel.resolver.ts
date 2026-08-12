import { Args, Query, Resolver } from '@nestjs/graphql'

import { SubscriptionModel } from '../sponsorship/subscription/models/subscriptions.model'

import { ChannelService } from './channel.service'
import { PublicChannelModel } from './models/public-channel.model'
import { RecommendedChannelModel } from './models/recommended-channel.model'

@Resolver('Channel')
export class ChannelResolver {
	public constructor(private readonly channelService: ChannelService) {}

	@Query(() => [RecommendedChannelModel], {
		name: 'findRecommendedChannels'
	})
	public async findRecommended() {
		return this.channelService.findRecommended()
	}

	@Query(() => PublicChannelModel, { name: 'findChannelByUsername' })
	public async findByUsername(@Args('username') username: string) {
		return this.channelService.findByUsername(username)
	}

	@Query(() => Number, { name: 'followersCountByChannel' })
	public async followersCountByChannel(@Args('channelId') channelId: string) {
		return this.channelService.findFollowersCountByChannel(channelId)
	}

	@Query(() => [SubscriptionModel], { name: 'findSponsorsByChannel' })
	public async findSponsorsByChannel(@Args('channelId') channelId: string) {
		return this.channelService.findSponsorsByChannel(channelId)
	}
}
