import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface SavingsReportEmailProps {
  ownerName: string
  restaurantName: string
  monthName: string
  totalAmount: string
  savings: string
  orderCount: number
}

export const SavingsReportEmail = ({
  ownerName,
  restaurantName,
  monthName,
  totalAmount,
  savings,
  orderCount,
}: SavingsReportEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your {monthName} Savings Report for {restaurantName} is here!</Preview>
      <Body style={main}>
        <Container style={container}>
          
          <Section style={header}>
            <Heading style={h1}>Your Monthly Savings Report</Heading>
          </Section>

          <Section style={section}>
            <Text style={text}>Hi {ownerName},</Text>
            <Text style={text}>
              Here is your performance summary for <strong>{monthName}</strong>. 
              By processing direct orders on your own platform, you've avoided the heavy 25% commissions charged by third-party aggregators!
            </Text>

            <Hr style={hrLight} />

            <div style={statsContainer}>
              <div style={statBox}>
                <Text style={statLabel}>Direct Orders Processed</Text>
                <Text style={statValue}>{orderCount}</Text>
              </div>
              <div style={statBox}>
                <Text style={statLabel}>Total Order Value</Text>
                <Text style={statValue}>{totalAmount}</Text>
              </div>
            </div>

            <Section style={highlightSection}>
              <Heading as="h2" style={h2}>Estimated Commission Saved</Heading>
              <Text style={heroSavings}>{savings}</Text>
              <Text style={smallText}>
                *Calculated against an industry-standard 25% aggregator commission rate.
              </Text>
            </Section>

            <Text style={text}>
              Every direct order goes straight to your bottom line. Keep promoting your direct link to your customers!
            </Text>

          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>
              Sent by your platform administrators. Keep up the great work!
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
  color: '#10b981', // green for savings
  fontSize: '18px',
  fontWeight: 'bold',
  padding: '0',
  margin: '0 0 8px',
  textAlign: 'center' as const,
}

const text = {
  color: '#4a5568',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px 0',
}

const smallText = {
  color: '#a0aec0',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '8px 0 0 0',
  textAlign: 'center' as const,
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

const statsContainer = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '24px',
}

const statBox = {
  width: '48%',
  backgroundColor: '#f8fafc',
  padding: '16px',
  borderRadius: '8px',
  border: '1px solid #f1f5f9',
  textAlign: 'center' as const,
}

const statLabel = {
  margin: '0',
  fontSize: '12px',
  color: '#64748b',
  textTransform: 'uppercase' as const,
  fontWeight: 'bold',
}

const statValue = {
  margin: '8px 0 0',
  fontSize: '20px',
  color: '#0f172a',
  fontWeight: 'bold',
}

const highlightSection = {
  backgroundColor: '#ecfdf5',
  border: '1px solid #a7f3d0',
  borderRadius: '8px',
  padding: '24px',
  marginBottom: '24px',
  textAlign: 'center' as const,
}

const heroSavings = {
  margin: '0',
  fontSize: '36px',
  fontWeight: '900',
  color: '#059669',
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

export default SavingsReportEmail
