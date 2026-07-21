import * as React from 'react'
import {
	Body,
	Head,
	Heading,
	Html,
	Preview,
	Section,
	Tailwind,
	Text
} from 'react-email'
import type { SessionMetadata } from 'src/shared/types/session-metadata.types'

interface DeactiveTemplateProps {
	token: string
	metadata: SessionMetadata
}

export function DeactiveTemplate({
	token,
	metadata
}: DeactiveTemplateProps) {
	return (
		<Html>
			<Head />
			<Preview>Account Deactivation Request</Preview>
			<Tailwind>
				<Body className='max-w-2xl mx-auto p-6 bg-slate-50'>
					<Section className='text-center mb-8'>
						<Heading className='text-3xl font-bold text-black'>
							Deactivate Your Account
						</Heading>
						<Text className='text-base text-black'>
							We received a request to deactivate your Kick
							account. Use the verification code below to
							confirm.
						</Text>
						<Section className='bg-gray-100 rounded-lg py-4 px-6 inline-block'>
							<Text className='text-4xl font-bold tracking-widest text-black text-center'>
								{token}
							</Text>
						</Section>
					</Section>
					<Section className='bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-center'>
						<Text className='text-sm font-semibold text-yellow-800'>
							⏳ This code will expire in 5 minutes.
						</Text>
						<Text className='text-xs text-yellow-700'>
							If the code expires, you will need to submit
							a new deactivation request.
						</Text>
					</Section>
					<Section className='bg-gray-100 rounded-lg p-6 mb-6'>
						<Heading className='text-xl font-semibold text-red-500'>
							Security Details
						</Heading>
						<ul className='list-disc list-inside mt-2'>
							<li>
								🌎 Country:{' '}
								{metadata.location.country}
							</li>
							<li>
								💻 Device: {metadata.device.os}
							</li>
							<li>
								🔗 Browser:{' '}
								{metadata.device.browser}
							</li>
							<li>📍 Ip Address: {metadata.ip}</li>
						</ul>
					</Section>
					<Section className='text-center mt-8'>
						<Text className='text-sm text-gray-600'>
							If you did not request this, please ignore
							this email. Your account will remain active.
						</Text>
						<Text className='text-sm text-gray-600'>
							Thanks, <br />
							The Kick Team
						</Text>
					</Section>
				</Body>
			</Tailwind>
		</Html>
	)
}