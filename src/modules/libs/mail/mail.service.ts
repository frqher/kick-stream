import { MailerService } from '@nestjs-modules/mailer'
import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { render } from 'react-email'
import { SessionMetadata } from 'src/shared/types/session-metadata.types'

import { DeactiveTemplate } from './templates/deactive.template'
import { PasswordRecoveryTemplate } from './templates/password-recovery.template'
import { VerificationTemplateProps } from './templates/verification.template'

@Injectable()
export class MailService {
	public constructor(
		private readonly mailerService: MailerService,
		private readonly configService: ConfigService
	) {}

	public async sendVerificationToken(email: string, token: string) {
		const domain = this.configService.getOrThrow<string>('ALLOWED_ORIGIN')
		if (!domain) {
			throw new InternalServerErrorException('Domain not found')
		}

		const html = await render(VerificationTemplateProps({ domain, token }))

		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return this.sendMail(email, 'Verify Your Email', html)
	}

	public async sendPasswordResetToken(
		email: string,
		token: string,
		metadata: SessionMetadata
	) {
		const domain = this.configService.getOrThrow<string>('ALLOWED_ORIGIN')

		const html = await render(
			PasswordRecoveryTemplate({ domain, token, metadata })
		)

		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return this.sendMail(email, 'Account Recovery', html)
	}

	public async sendDeactivationToken(
		email: string,
		token: string,
		metadata: SessionMetadata
	) {
		const html = await render(DeactiveTemplate({ token, metadata }))

		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return this.sendMail(email, 'Account Deactivation', html)
	}

	private sendMail(email: string, subject: string, html: string) {
		return this.mailerService.sendMail({
			to: email,
			subject,
			html
		})
	}
}
