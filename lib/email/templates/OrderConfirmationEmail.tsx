import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
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

interface OrderConfirmationEmailProps {
  restaurantName: string
  restaurantLogo?: string | null
  orderId: string
  items: OrderItem[]
  totalAmount: number
  deliveryType: 'delivery' | 'pickup'
  deliveryAddress?: string | null
}

const formatPrice = (price: number) => `₹${Number.isInteger(price) ? price : price.toFixed(2)}`
const shortOrderId = (id: string) => id.replace(/-/g, '').slice(0, 8).toUpperCase()

export const OrderConfirmationEmail = ({
  restaurantName,
  restaurantLogo,
  orderId,
  items,
  totalAmount,
  deliveryType,
  deliveryAddress,
}: OrderConfirmationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your order from {restaurantName} is confirmed!</Preview>
      <Body style={main}>
        <Container style={container}>
          
          {/* Header */}
          <Section style={header}>
            {restaurantLogo && (
              <Img
                src={restaurantLogo}
                width="64"
                height="64"
                alt={`${restaurantName} logo`}
                style={logo}
              />
            )}
            <Heading style={h1}>Your order is confirmed!</Heading>
            <Text style={text}>
              Thank you for ordering from <strong>{restaurantName}</strong>.
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Order Details */}
          <Section style={section}>
            <Heading as="h2" style={h2}>
              Order #{shortOrderId(orderId)}
            </Heading>
            
            {items.map((item, index) => (
              <Text key={index} style={itemText}>
                {item.quantity}x {item.name} 
                <span style={itemPrice}>{formatPrice(item.price * item.quantity)}</span>
              </Text>
            ))}
            
            <Hr style={hrLight} />
            <Text style={totalText}>
              Total <span style={totalPrice}>{formatPrice(totalAmount)}</span>
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Fulfillment Details */}
          <Section style={section}>
            <Heading as="h2" style={h2}>
              {deliveryType === 'delivery' ? 'Delivery Details' : 'Pickup Details'}
            </Heading>
            
            {deliveryType === 'delivery' ? (
              <>
                <Text style={text}>
                  <strong>Delivering to:</strong>
                  <br />
                  {deliveryAddress}
                </Text>
                <Text style={text}>
                  Your food will be arriving in approx. 35–50 minutes.
                </Text>
              </>
            ) : (
              <Text style={text}>
                Your food will be ready for pickup in approx. 20–30 minutes at the restaurant.
              </Text>
            )}
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              If you have any questions about your order, please contact {restaurantName} directly.
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
}

const logo = {
  borderRadius: '50%',
  marginBottom: '16px',
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  padding: '0',
  margin: '0 0 16px',
}

const h2 = {
  color: '#333',
  fontSize: '18px',
  fontWeight: 'bold',
  padding: '0',
  margin: '0 0 16px',
}

const text = {
  color: '#525f7f',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0',
}

const section = {
  padding: '24px 48px',
}

const itemText = {
  color: '#525f7f',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '0 0 8px 0',
  display: 'flex',
  justifyContent: 'space-between',
}

const itemPrice = {
  color: '#333',
  fontWeight: 'bold',
  float: 'right' as const,
}

const hr = {
  borderColor: '#e6ebf1',
  margin: '0',
}

const hrLight = {
  borderColor: '#f4f4f4',
  margin: '16px 0',
}

const totalText = {
  color: '#333',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0',
}

const totalPrice = {
  float: 'right' as const,
}

const footer = {
  padding: '24px 48px',
  backgroundColor: '#f6f9fc',
  borderTop: '1px solid #e6ebf1',
}

const footerText = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '0',
}

export default OrderConfirmationEmail
