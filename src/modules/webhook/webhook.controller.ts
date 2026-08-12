import {
	Body,
	Controller,
	Headers,
	HttpCode,
	HttpStatus,
	Post,
	RawBody,
	UnauthorizedException
} from '@nestjs/common'

import { WebhookService } from './webhook.service'

@Controller('webhook')
export class WebhookController {
	public constructor(private readonly webhookService: WebhookService) {}

	@Post('livekit')
	@HttpCode(HttpStatus.OK)
	public async receiveWebhookLiveKit(
		@Body() body: string,
		@Headers('Authorization') authorization: string
	) {
		if (!authorization) {
			throw new UnauthorizedException('Authorization header is required')
		}

		return await this.webhookService.receiveWebhookLiveKit(
			body,
			authorization
		)
	}

	@Post('stripe')
	@HttpCode(HttpStatus.OK)
	public async receiveWebhookStripe(
		@RawBody() rawBody: string,
		@Headers('stripe-signature') signature: string
	) {
		if (!signature) {
			throw new UnauthorizedException('Signature header is required')
		}

		const event = this.webhookService.constructStripeEvent(
			rawBody,
			signature
		)

		await this.webhookService.receiveWebhookStripe(event)

		return true
	}
}
