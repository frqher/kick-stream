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

interface VerifyChannelTemplateProps {
	username: string
}

export function VerifyChannelTemplate({ username }: VerifyChannelTemplateProps) {
	return (
		<Html>
			<Head />
			<Preview>Your Kick Channel Has Been Verified</Preview>
			<Tailwind>
				<Body className='max-w-2xl mx-auto p-6 bg-slate-50'>
					<Section className='text-center mb-8'>
						<Heading className='text-3xl font-bold text-black'>
							Channel Verified ✅
						</Heading>
						<Text className='text-base text-black'>
							Congratulations, <b>{username}</b>! Your Kick channel has been
							officially verified.
						</Text>
					</Section>
					<Section className='bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-center'>
						<Text className='text-sm font-semibold text-green-800'>
							🎉 You now have a verified badge next to your channel name.
						</Text>
						<Text className='text-xs text-green-700'>
							Your audience can now easily identify your channel as authentic and
							trustworthy.
						</Text>
					</Section>
					<Section className='bg-gray-100 rounded-lg p-6 mb-6'>
						<Heading className='text-xl font-semibold text-black'>
							What This Means
						</Heading>
						<ul className='list-disc list-inside mt-2'>
							<li>A verified badge appears next to your channel name.</li>
							<li>
								Your channel gains increased visibility and credibility.
							</li>
							<li>
								Viewers can trust that your channel is the official source.
							</li>
							<li>
								You may unlock additional features reserved for verified
								creators.
							</li>
						</ul>
					</Section>
					<Section className='text-center mt-8'>
						<Text className='text-sm text-gray-600'>
							Keep creating great content and growing your community!
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
