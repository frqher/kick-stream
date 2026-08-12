import { BadRequestException, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { TransactionStatus } from '@prisma/client'
import { PrismaService } from 'src/core/prisma/prisma.service'
import Stripe from 'stripe'

import { LivekitService } from '../libs/livekit/livekit.service'
import { StripeService } from '../libs/stripe/stripe.service'
import { TelegramService } from '../libs/telegram/telegram.service'
import { NotificationService } from '../notification/notification.service'

@Injectable()
export class WebhookService {
	public constructor(
		private readonly prismaService: PrismaService,
		private readonly livekitService: LivekitService,
		private readonly notificationService: NotificationService,
		private readonly telegramService: TelegramService,
		private readonly configService: ConfigService,
		private readonly stripeService: StripeService
	) {}

	public async receiveWebhookLiveKit(body: string, authorization: string) {
		const event = this.livekitService.receiver.receive(
			body,
			authorization,
			true
		)

		if (event.event === 'ingress_started') {
			const ingressId = event.ingressInfo?.ingressId
			if (!ingressId) {
				throw new BadRequestException('Ingress id is missing')
			}

			const activated = await this.prismaService.stream.updateMany({
				where: {
					ingressId,
					isLive: false
				},
				data: {
					isLive: true
				}
			})

			if (activated.count === 0) return

			const stream = await this.prismaService.stream.findUniqueOrThrow({
				where: { ingressId },
				include: {
					user: true
				}
			})

			const followers = await this.prismaService.follow.findMany({
				where: {
					followingId: stream.user.id,
					follower: {
						isDeactivated: false
					}
				},
				include: {
					follower: {
						include: {
							notificationSettings: true
						}
					}
				}
			})

			for (const follow of followers) {
				const follower = follow.follower

				if (follower.notificationSettings?.siteNotifications) {
					await this.notificationService.createStreamStart(
						follower.id,
						stream.user
					)
				}

				if (
					follower.notificationSettings?.telegramNotifications &&
					follower.telegramId
				) {
					await this.telegramService.sendStreamStart(
						follower.telegramId,
						stream.user
					)
				}
			}
		}

		if (event.event === 'ingress_ended') {
			const stream = await this.prismaService.stream.update({
				where: {
					ingressId: event.ingressInfo?.ingressId
				},
				data: {
					isLive: false
				}
			})

			await this.prismaService.chatMessage.deleteMany({
				where: {
					streamId: stream.id
				}
			})
		}
	}

	public async receiveWebhookStripe(event: Stripe.Event) {
		const session = event.data.object as Stripe.Checkout.Session

		if (event.type === 'checkout.session.completed') {
			const planId = session.metadata?.planId
			const userId = session.metadata?.userId
			const channelId = session.metadata?.channelId

			if (!planId || !userId || !channelId) {
				throw new BadRequestException('Checkout metadata is incomplete')
			}

			const expiresAt = new Date()
			expiresAt.setDate(expiresAt.getDate() + 30)

			const sponsorshipSubscription =
				await this.prismaService.$transaction(async transaction => {
					const updated = await transaction.transaction.updateMany({
						where: {
							stripeSubscriptionId: session.id,
							status: TransactionStatus.PENDING
						},
						data: { status: TransactionStatus.SUCCESS }
					})

					if (updated.count === 0) return null

					return transaction.sponsorshipSubscription.create({
						data: {
							expiresAt,
							planId,
							userId,
							channelId
						},
						include: {
							plan: true,
							user: true,
							channel: {
								include: {
									notificationSettings: true
								}
							}
						}
					})
				})

			if (!sponsorshipSubscription) return

			if (
				sponsorshipSubscription.channel?.notificationSettings
					?.siteNotifications &&
				sponsorshipSubscription.plan &&
				sponsorshipSubscription.user
			) {
				await this.notificationService.createNewSponsorship(
					sponsorshipSubscription.channel.id,
					sponsorshipSubscription.plan,
					sponsorshipSubscription.user
				)
			}

			if (
				sponsorshipSubscription.channel?.notificationSettings
					?.telegramNotifications &&
				sponsorshipSubscription.channel.telegramId &&
				sponsorshipSubscription.plan &&
				sponsorshipSubscription.user
			) {
				await this.telegramService.sendNewSponsorship(
					sponsorshipSubscription.channel.telegramId,
					sponsorshipSubscription.plan,
					sponsorshipSubscription.user
				)
			}
		}

		if (event.type === 'checkout.session.expired') {
			await this.prismaService.transaction.updateMany({
				where: {
					stripeSubscriptionId: session.id,
					status: TransactionStatus.PENDING
				},
				data: {
					status: TransactionStatus.EXPIRED
				}
			})
		}

		if (event.type === 'checkout.session.async_payment_failed') {
			await this.prismaService.transaction.updateMany({
				where: {
					stripeSubscriptionId: session.id,
					status: TransactionStatus.PENDING
				},
				data: {
					status: TransactionStatus.FAILED
				}
			})
		}
	}

	public constructStripeEvent(payload: string | Buffer, signature: string) {
		return this.stripeService.webhooks.constructEvent(
			payload,
			signature,
			this.configService.getOrThrow<string>('STRIPE_WEBHOOK_SECRET')
		)
	}
}
