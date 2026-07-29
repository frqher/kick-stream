import * as React from 'react'
import {
	Body,
	Head,
	Heading,
	Html,
	Link,
	Preview,
	Section,
	Tailwind,
	Text
} from 'react-email'

interface EnableTwoFactorTemplateProps {
	domain: string
}

export function EnableTwoFactorTemplate({ domain }: EnableTwoFactorTemplateProps) {
	return (
		<Html>
			<Head />
			<Preview>Secure Your Kick Account with Two-Factor Authentication</Preview>
			<Tailwind>
				<Body className='max-w-2xl mx-auto p-6 bg-slate-50'>
					<Section className='text-center mb-8'>
						<Heading className='text-3xl font-bold text-black'>
							Secure Your Account 🔒
						</Heading>
						<Text className='text-base text-black'>
							Enable Two-Factor Authentication to add an extra layer of
							protection to your Kick account.
						</Text>
					</Section>
					<Section className='bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-center'>
						<Text className='text-sm font-semibold text-yellow-800'>
							⚠️ Your account is currently not protected by 2FA.
						</Text>
						<Text className='text-xs text-yellow-700'>
							Without 2FA, your account is more vulnerable to unauthorized
							access even if your password is compromised.
						</Text>
					</Section>
					<Section className='bg-gray-100 rounded-lg p-6 mb-6'>
						<Heading className='text-xl font-semibold text-black'>
							Why Enable 2FA?
						</Heading>
						<ul className='list-disc list-inside mt-2'>
							<li>Protects your account even if your password is stolen.</li>
							<li>
								Prevents unauthorized logins from unknown devices.
							</li>
							<li>Keeps your content, followers, and data safe.</li>
							<li>Takes less than a minute to set up.</li>
						</ul>
					</Section>
					<Section className='text-center mb-6'>
						<Link
							href={`${domain}/dashboard/settings`}
							className='bg-black text-white text-sm font-semibold px-6 py-3 rounded-lg inline-block'
						>
							Enable Two-Factor Authentication →
						</Link>
					</Section>
					<Section className='text-center mt-8'>
						<Text className='text-sm text-gray-600'>
							If you did not request this email, you can safely ignore it.
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
