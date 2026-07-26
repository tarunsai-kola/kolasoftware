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

export interface OrderItem {
  name: string
  quantity: number
  price: number
}

interface KitchenOrderAlertEmailProps {
  orderId: string
  orderTime: string
  items: OrderItem[]
  customerName: string
  customerPhone: string
  deliveryType: 'delivery' | 'pickup'
  deliveryAddress?: string | null
  totalAmount: number
}

const formatPrice = (price: number) => `₹${Number.isInteger(price) ? price : price.toFixed(2)}`
const shortOrderId = (id: string) => id.replace(/-/g, '').slice(0, 6).toUpperCase()

export const KitchenOrderAlertEmail = ({
  orderId,
  orderTime,
  items,
  customerName,
  customerPhone,
  deliveryType,
  deliveryAddress,
  totalAmount,
}: KitchenOrderAlertEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>New Order #{shortOrderId(orderId)} - {customerName}</Preview>
      <Body style={main}>
        <Container style={container}>
          
          {/* Header */}
          <Section style={header}>
            <Heading style={h1}>🚨 New order received</Heading>
            <Text style={subtitle}>
              Order <strong>#{shortOrderId(orderId)}</strong> placed at {orderTime}
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Customer Info */}
          <Section style={section}>
            <Heading as="h2" style={h2}>Customer Details</Heading>
            <Text style={text}>
              <strong>{customerName}</strong>
              <br />
              <Link href={`tel:${customerPhone}`} style={link}>
                {customerPhone}
              </Link>
            </Text>

            <Text style={badge(deliveryType)}>
              {deliveryType === 'delivery' ? 'DELIVERY' : 'PICKUP'}
            </Text>

            {deliveryType === 'delivery' && deliveryAddress && (
              <Text style={text}>
                <strong>Address:</strong><br />
                {deliveryAddress}
              </Text>
            )}
          </Section>

          <Hr style={hr} />

          {/* Order Details */}
          <Section style={section}>
            <Heading as="h2" style={h2}>Order Items</Heading>
            
            {items.map((item, index) => (
              <Text key={index} style={itemText}>
                <strong>{item.quantity}x</strong> {item.name}
              </Text>
            ))}
            
            <Hr style={hrLight} />
            <Text style={totalText}>
              Total <span style={totalPrice}>{formatPrice(totalAmount)}</span>
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              This email is a backup notification. Please mark the order as &quot;Preparing&quot; 
              in your kitchen dashboard to stop the dashboard alarm.
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
  backgroundColor: '#fff5f5',
}

const h1 = {
  color: '#e53e3e',
  fontSize: '24px',
  fontWeight: 'bold',
  padding: '0',
  margin: '0 0 8px',
}

const subtitle = {
  color: '#718096',
  fontSize: '14px',
  margin: '0',
}

const h2 = {
  color: '#333',
  fontSize: '16px',
  fontWeight: 'bold',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  padding: '0',
  margin: '0 0 16px',
}

const text = {
  color: '#4a5568',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '0 0 12px 0',
}

const link = {
  color: '#3182ce',
  textDecoration: 'underline',
}

const badge = (type: 'delivery' | 'pickup') => ({
  display: 'inline-block',
  padding: '4px 8px',
  backgroundColor: type === 'delivery' ? '#ebf8ff' : '#f0fff4',
  color: type === 'delivery' ? '#2b6cb0' : '#2f855a',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: 'bold',
  margin: '0 0 12px 0',
})

const section = {
  padding: '24px 48px',
}

const itemText = {
  color: '#2d3748',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 12px 0',
  padding: '12px',
  backgroundColor: '#f7fafc',
  borderRadius: '6px',
  border: '1px solid #edf2f7',
}

const hr = {
  borderColor: '#e2e8f0',
  margin: '0',
}

const hrLight = {
  borderColor: '#edf2f7',
  margin: '16px 0',
}

const totalText = {
  color: '#1a202c',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0',
}

const totalPrice = {
  float: 'right' as const,
}

const footer = {
  padding: '24px 48px',
  backgroundColor: '#f7fafc',
}

const footerText = {
  color: '#a0aec0',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '0',
  textAlign: 'center' as const,
}

export default KitchenOrderAlertEmail
