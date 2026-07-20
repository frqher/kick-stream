import * as React from 'react';
import {Body, Head, Heading, Html, Link, Preview, Section, Tailwind, Text} from 'react-email'
import type { SessionMetadata } from 'src/shared/types/session-metadata.types';


interface PasswordRecoveryTemplateProps {
    domain: string
    token: string
    metadata: SessionMetadata
}

export function PasswordRecoveryTemplate({domain, token, metadata}:PasswordRecoveryTemplateProps) {
    
    const resetLink = `${domain}/account/recovery?token=${token}`

    return (
        <Html>
            <Head/>
            <Preview>Account Recovery</Preview>
            <Tailwind>
                <Body className='max-w-2xl mx-auto p-6 bg-slate-50'>
                    <Section className='text-center mb-8'>
                        <Heading className='text-3xl font-bold text-black'>
                            Reset your password
                        </Heading>
                        <Text className='text-base text-black'>
                            Received a request to reset the password for Kick. Click the button below to reset your password.
                        </Text>
                        <Link href={resetLink} className='inline-flex justify-center items-center rounded-md text-sm font-medium text-white bg-green-600 px-5 py-2'>
                            Reset Password
                        </Link>
                    </Section>
                    <Section className='bg-gray-100 rounded-lg p-6 mb-6'>
                        <Heading className='text-xl font-semibold text-green-500'>
                            Security Details
                        </Heading>
                        <ul className='list-disc list-inside mt-2'>
                            <li>🌎 Country: {metadata.location.country}</li>
                            <li>💻 Device: {metadata.device.os}</li>
                            <li>🔗 Browser: {metadata.device.browser}</li>
                            <li>📍 Ip Address: {metadata.ip}</li>
                        </ul>
                    </Section>
                    <Section className='text-center mt-8'>
                        <Text className='text-sm text-gray-600'>
                            If you did not request this, please ignore this email.
                        </Text>
                        <Text className='text-sm text-gray-600'>
                            Thanks, <br/>
                            The Kick Team
                        </Text>
                    </Section>
                </Body>
            </Tailwind>
        </Html>
    )
    

}