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

interface AccountDeletionTemplateProps {
	username: string
}

export function AccountDeletionTemplate({
	username
}: AccountDeletionTemplateProps) {
	return (
		<Html>
			<Head />
			<Preview>Your Kick Account Has Been Deleted</Preview>
			<Tailwind>
				<Body className='max-w-2xl mx-auto p-6 bg-slate-50'>
					<Section className='text-center mb-8'>
						<Heading className='text-3xl font-bold text-black'>
							Account Deleted
						</Heading>
						<Text className='text-base text-black'>
							Hi {username}, your Kick account has been
							permanently deleted following the 7-day
							deactivation period.
						</Text>
					</Section>
					<Section className='bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-center'>
						<Text className='text-sm font-semibold text-red-800'>
							⚠️ This action is irreversible.
						</Text>
						<Text className='text-xs text-red-700'>
							All your data, including your profile,
							streams, and settings, has been permanently
							removed from our servers.
						</Text>
					</Section>
					<Section className='bg-gray-100 rounded-lg p-6 mb-6'>
						<Heading className='text-xl font-semibold text-black'>
							What This Means
						</Heading>
						<ul className='list-disc list-inside mt-2'>
							<li>
								Your username is no longer reserved and
								may become available to others.
							</li>
							<li>
								You will no longer receive emails from
								Kick.
							</li>
							<li>
								Any active subscriptions have been
								cancelled.
							</li>
							<li>
								This email address can be used to create
								a new account.
							</li>
						</ul>
					</Section>
					<Section className='text-center mt-8'>
						<Text className='text-sm text-gray-600'>
							We are sorry to see you go. If you ever want
							to come back, you are always welcome to
							create a new account.
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