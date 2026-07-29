/**
 * WhatsApp Cloud API Integration
 * 
 * To use this, you need to configure the following environment variables:
 * WHATSAPP_API_TOKEN - Your permanent access token from Meta Developer Dashboard
 * WHATSAPP_PHONE_NUMBER_ID - The Phone Number ID from Meta Developer Dashboard
 */

export interface OrderDetails {
  orderId: string
  customerName: string
  totalAmount: number
  restaurantName: string
}

/**
 * Sends an order confirmation message to the given phone number via WhatsApp Cloud API.
 * @param phone The customer's phone number (must include country code, e.g., 919876543210)
 * @param orderDetails Order information to include in the message
 */
export async function sendOrderConfirmationWhatsApp(
  phone: string,
  orderDetails: OrderDetails
) {
  const token = process.env.WHATSAPP_API_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

  if (!token || !phoneNumberId) {
    console.warn('[WhatsApp] Missing WHATSAPP_API_TOKEN or WHATSAPP_PHONE_NUMBER_ID. Skipping message.')
    return { success: false, error: 'Missing configuration' }
  }

  // Ensure phone has country code and no +, spaces, or dashes
  let cleanPhone = phone.replace(/\D/g, '')
  
  // If it's exactly 10 digits (standard Indian mobile number without country code), prepend 91
  if (cleanPhone.length === 10) {
    cleanPhone = '91' + cleanPhone
  }

  // The message body
  const messageBody = `Hello ${orderDetails.customerName},\n\nYour order #${orderDetails.orderId.slice(0, 8).toUpperCase()} at ${orderDetails.restaurantName} has been successfully placed!\n\nTotal Amount: ₹${orderDetails.totalAmount}\n\nThank you for ordering with us!`

  console.log('[WhatsApp] Sending message to:', cleanPhone)

  const url = `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`

  const payload = {
    messaging_product: 'whatsapp',
    to: cleanPhone,
    type: 'template',
    template: {
      name: 'hello_world',
      language: {
        code: 'en_US'
      }
    }
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('[WhatsApp] API Error:', data)
      return { success: false, error: data.error?.message || 'Failed to send message' }
    }

    return { success: true, data }
  } catch (error) {
    console.error('[WhatsApp] Network/Execution Error:', error)
    return { success: false, error: 'Network error occurred' }
  }
}
