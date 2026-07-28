import { ConfigService } from '@nestjs/config'
import { TypeStripeOptions } from 'src/modules/libs/stripe/types/stripe.type'

export function getStripeConfig(
	configService: ConfigService
): TypeStripeOptions {
	return {
		apiKey: configService.getOrThrow<string>('STRIPE_SECRET_KEY'),
		config: {
			apiVersion: '2026-06-24.dahlia'
		}
	}
}
