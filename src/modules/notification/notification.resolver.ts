import { Args, Mutation, Query, Resolver } from '@nestjs/graphql'
import type { User } from '@prisma/client'
import { Authorization } from 'src/shared/decorators/auth.decorator'
import { Authorized } from 'src/shared/decorators/authorized.decorator'

import { ChangeNotificationSettingsInput } from './input/change-notifitaction-settings.input'
import { ChangeNotificationsSettingsResponse } from './models/notification-setting.model'
import { NotificationModel } from './models/notification.model'
import { NotificationService } from './notification.service'

@Resolver('Notification')
export class NotificationResolver {
	public constructor(
		private readonly notificationService: NotificationService
	) {}

	@Authorization()
	@Query(() => Number, { name: 'findUnreadNotificationsCount' })
	public async findUnreadNotificationsCount(@Authorized() user: User) {
		return this.notificationService.findUnreadCount(user)
	}

	@Authorization()
	@Query(() => [NotificationModel], { name: 'findNotificationByUser' })
	public async findByUser(@Authorized() user: User) {
		return this.notificationService.findByUser(user)
	}

	@Authorization()
	@Mutation(() => ChangeNotificationsSettingsResponse, {
		name: 'changeNotificationSettings'
	})
	public async changeSettings(
		@Authorized() user: User,
		@Args('data') input: ChangeNotificationSettingsInput
	) {
		return this.notificationService.changeSettings(user, input)
	}
}
