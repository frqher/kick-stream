import * as React from 'react';

import {Body, Head, Heading, Html, Link, Preview, Section, Tailwind, Text} from 'react-email'

interface VerificationTemplateProps {
    domain: string
    token: string
}

export function VerificationTemplate({domain, token}:VerificationTemplateProps) {
    
    const verificationLink = `${domain}/account/verify?token=${token}`

    return (
        <Html>
            <Head/>
            <Preview>Account Verification</Preview>
            <Tailwind>
                <Body className='max-w-2xl mx-auto p-6 bg-slate-50'>
                    <Section className='text-center mb-8'>
                        <Heading className='text-3xl font-bold text-black'>
                            Welcome to Kick!
                        </Heading>
                        <Text className='text-base text-black'>
                            Thank you for joining Kick. Please verify your email address to complete your registration.
                        </Text>
                        <Link href={verificationLink} className='inline-flex justify-center items-center rounded-md text-sm font-medium text-white bg-[#18B9AE] px-5 py-2'>
                            Verify Email
                        </Link>
                    </Section>
                    <Section className='text-center mt-8'>
                        <Text className='text-sm text-gray-600'>
                            If you did not create this account, please ignore this email.
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