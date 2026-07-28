import {
	ConflictException,
	Injectable,
	NotFoundException
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { type User } from '@prisma/client'
import { PrismaService } from 'src/core/prisma/prisma.service'
import { StripeService } from 'src/modules/libs/stripe/stripe.service'

@Injectable()
export class TransactionService {
	public constructor(
		private readonly prismaService: PrismaService,
		private readonly configService: ConfigService,
		private readonly stripeService: StripeService
	) {}

	public async findMyTransactions(user: User) {
		const transaction = await this.prismaService.transaction.findMany({
			where: {
				userId: user.id
			}
		})

		return transaction
	}

	public async makePayment(user: User, planId: string) {
		const plan = await this.prismaService.sponsorshipPlan.findUnique({
			where: {
				id: planId
			},
			include: {
				channel: true
			}
		})

		if (!plan || !plan.channel) {
			throw new NotFoundException('Plan not found')
		}

		if (user.id === plan.channel.id) {
			throw new ConflictException("Can't subscribe to your own plan")
		}

		const subscriptionExists =
			await this.prismaService.sponsorshipSubscription.findFirst({
				where: {
					userId: user.id,
					channelId: plan.channel.id
				}
			})

		if (subscriptionExists) {
			throw new ConflictException('Already subscribed to this plan')
		}

		const customer = await this.stripeService.customers.create({
			name: user.username,
			email: user.email
		})
		const success_url = `${this.configService.getOrThrow<string>('ALLOWED_ORIGIN')}/success?price=${plan.price}&username=${encodeURIComponent(plan.channel.username)}`
		const cancel_url =
			this.configService.getOrThrow<string>('ALLOWED_ORIGIN')

		const session = await this.stripeService.checkout.sessions.create({
			payment_method_types: ['card'],
			line_items: [
				{
					price_data: {
						currency: 'usd',
						product_data: {
							name: plan.title,
							description: plan.description ?? ''
						},
						unit_amount: Math.round(plan.price * 100),
						recurring: {
							interval: 'month'
						}
					},
					quantity: 1
				}
			],
			mode: 'subscription',
			success_url,
			cancel_url,
			customer: customer.id,
			metadata: {
				planId: plan.id,
				userId: user.id,
				channelId: plan.channel.id
			}
		})

		await this.prismaService.transaction.create({
			data: {
				amount: plan.price,
				currency: session.currency || 'usd',
				stripeSubscriptionId: session.id,
				user: {
					connect: {
						id: user.id
					}
				}
			}
		})

		return { url: session.url }
	}
}
