import type { Request } from 'express'
import { lookup } from 'geoip-lite'
import * as countries from 'i18n-iso-countries'

import type { SessionMetadata } from '../types/session-metadata.types'

import { IS_DEV_ENV } from './is-dev.util'

// eslint-disable-next-line @typescript-eslint/no-require-imports
import DeviceDetector = require('device-detector-js')

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-require-imports
countries.registerLocale(require('i18n-iso-countries/langs/en.json'))

export function getSessionMetadata(
	req: Request,
	userAgent: string
): SessionMetadata {
	const ip = IS_DEV_ENV
		? '129.32.32.26'
		: (Array.isArray(req.headers['cf-connecting-ip'])
				? req.headers['cf-connecting-ip'][0]
				: req.headers['cf-connecting-ip']) ||
			(typeof req.headers['x-forwarded-for'] === 'string'
				? req.headers['x-forwarded-for'].split(',')[0]
				: req.ip)

	const location = lookup(ip as string)
	const device = new DeviceDetector().parse(userAgent)

	return {
		location: {
			country:
				(countries.getName(
					location?.country as string,
					'en'
				) as string) || 'unknown',
			city: (location?.city as string) || 'unknown',
			latitude: (location?.ll?.[0] as number) || 0,
			longitude: (location?.ll?.[1] as number) || 0
		},
		device: {
			browser: (device.client?.name as string) || 'unknown',
			os: (device.os?.name as string) || 'unknown',
			type: (device.device?.type as string) || 'unknown'
		},
		ip: (ip as string) || 'unknown'
	}
}
