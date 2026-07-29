import { MailerService } from '@nestjs-modules/mailer'
import { Injectable, InternalServerErrorException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { render } from 'react-email'
import { SessionMetadata } from 'src/shared/types/session-metadata.types'

import { AccountDeletionTemplate } from './templates/account-deletion.template'
import { DeactiveTemplate } from './templates/deactive.template'
import { EnableTwoFactorTemplate } from './templates/enable-two-factor.template'
import { PasswordRecoveryTemplate } from './templates/password-recovery.template'
import { VerificationTemplateProps } from './templates/verification.template'
import { VerifyChannelTemplate } from './templates/verify-channel.template'

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

	public async sendAccountDeletion(email: string, username: string) {
		const html = await render(AccountDeletionTemplate({ username }))

		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return this.sendMail(
			email,
			'Your Kick Account Has Been Permanently Deleted',
			html
		)
	}

	public async sendEnableTwoFactor(email: string) {
		const domain = this.configService.getOrThrow<string>('ALLOWED_ORIGIN')

		const html = await render(EnableTwoFactorTemplate({ domain }))

		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return this.sendMail(email, 'Enable Two-Factor Authentication', html)
	}

	public async sendVerifyChannel(email: string, username: string) {
		const html = await render(VerifyChannelTemplate({ username }))

		// eslint-disable-next-line @typescript-eslint/no-unsafe-return
		return this.sendMail(email, 'Your Channel Has Been Verified!', html)
	}

	private sendMail(email: string, subject: string, html: string) {
		return this.mailerService.sendMail({
			to: email,
			subject,
			html
		})
	}
}
