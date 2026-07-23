import { Inject, Injectable } from '@nestjs/common'
import {
	IngressClient,
	RoomServiceClient,
	WebhookReceiver
} from 'livekit-server-sdk'

import * as livekitTypes from './types/livekit.types'

@Injectable()
export class LivekitService extends IngressClient {
	private roomService: RoomServiceClient
	private IngressClient: IngressClient
	private webhookReceiver: WebhookReceiver

	public constructor(
		@Inject(livekitTypes.LiveKitOptionsSymbol)
		private readonly options: livekitTypes.TypeLiveKitOptions
	) {
		super('localhost')
		this.roomService = new RoomServiceClient(
			this.options.apiUrl,
			this.options.apiKey,
			this.options.apiSecret
		)

		this.IngressClient = new IngressClient(this.options.apiUrl)
		this.webhookReceiver = new WebhookReceiver(
			this.options.apiKey,
			this.options.apiSecret
		)
	}

	public get ingress(): IngressClient {
		return this.createProxy(this.IngressClient)
	}

	public get room(): RoomServiceClient {
		return this.createProxy(this.roomService)
	}

	public get receiver(): WebhookReceiver {
		return this.createProxy(this.webhookReceiver)
	}

	private createProxy<T extends object>(target: T) {
		return new Proxy(target, {
			get: (object, prop) => {
				const value = object[prop as keyof T]

				if (typeof value === 'function') {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-return
					return value.bind(object)
				}

				return value
			}
		})
	}
}
