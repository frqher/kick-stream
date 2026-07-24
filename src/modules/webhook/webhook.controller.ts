import {
	Body,
	Controller,
	Headers,
	HttpCode,
	HttpStatus,
	Post,
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
		console.log('Webhook is called')
		if (!authorization) {
			throw new UnauthorizedException('Authorization header is required')
		}

		console.log('Webhook return')

		return await this.webhookService.receiveWebhookLiveKit(
			body,
			authorization
		)
	}
}
