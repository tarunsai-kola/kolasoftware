import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface WelcomeOwnerEmailProps {
  ownerName: string
  restaurantName: string
  loginUrl: string
  temporaryPassword: string
}

export const WelcomeOwnerEmail = ({
  ownerName,
  restaurantName,
  loginUrl,
  temporaryPassword,
}: WelcomeOwnerEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Welcome to the platform! Here are your login credentials.</Preview>
      <Body style={main}>
        <Container style={container}>
          
          <Section style={header}>
            <Heading style={h1}>Welcome to the platform!</Heading>
          </Section>

          <Section style={section}>
            <Text style={text}>Hi {ownerName},</Text>
            <Text style={text}>
              Your restaurant, <strong>{restaurantName}</strong>, has been successfully onboarded to the platform. 
              You can now log in to your dashboard to manage your menu, view orders, and customize your settings.
            </Text>

            <Hr style={hrLight} />

            <Heading as="h2" style={h2}>Your Temporary Credentials</Heading>
            <Text style={text}>
              <strong>Login URL:</strong> <Link href={loginUrl} style={link}>{loginUrl}</Link><br />
              <strong>Password:</strong> <span style={codeBlock}>{temporaryPassword}</span>
            </Text>
            
            <Text style={text}>
              <em>Please log in and change your password immediately from the Settings page.</em>
            </Text>

          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>
              If you have any issues accessing your account, please reply to this email for support.
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}

// ── Styles ──────────────────────────────────────────────────────────────────

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  borderRadius: '8px',
  overflow: 'hidden',
  border: '1px solid #e6ebf1',
}

const header = {
  padding: '20px 48px',
  backgroundColor: '#f0f4f8',
}

const h1 = {
  color: '#1a202c',
  fontSize: '24px',
  fontWeight: 'bold',
  padding: '0',
  margin: '0 0 8px',
}

const h2 = {
  color: '#333',
  fontSize: '18px',
  fontWeight: 'bold',
  padding: '0',
  margin: '0 0 12px',
}

const text = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px 0',
}

const link = {
  color: '#3182ce',
  textDecoration: 'underline',
}

const codeBlock = {
  padding: '4px 8px',
  backgroundColor: '#f1f5f9',
  borderRadius: '4px',
  fontFamily: 'monospace',
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#0f172a',
}

const section = {
  padding: '24px 48px',
}

const hr = {
  borderColor: '#e2e8f0',
  margin: '0',
}

const hrLight = {
  borderColor: '#edf2f7',
  margin: '16px 0',
}

const footer = {
  padding: '24px 48px',
  backgroundColor: '#f8fafc',
}

const footerText = {
  color: '#a0aec0',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '0',
  textAlign: 'center' as const,
}

export default WelcomeOwnerEmail
