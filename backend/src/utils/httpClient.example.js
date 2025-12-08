/**
 * Examples of using axios/httpClient in the backend
 * 
 * These are examples - uncomment and modify as needed for your use cases
 */

// import httpClient, { sendWebhook, callExternalAPI } from './httpClient.js';

/**
 * Example 1: Send SMS notification via external API
 */
/*
export async function sendSMSNotification(phoneNumber, message) {
  try {
    const response = await httpClient.post('https://api.sms-provider.com/send', {
      phone: phoneNumber,
      message: message,
      apiKey: process.env.SMS_API_KEY,
    });
    return response.data;
  } catch (error) {
    console.error('SMS sending failed:', error);
    throw error;
  }
}
*/

/**
 * Example 2: Send email via email service
 */
/*
export async function sendEmailNotification(to, subject, body) {
  try {
    const response = await httpClient.post('https://api.email-service.com/send', {
      to,
      subject,
      body,
      apiKey: process.env.EMAIL_API_KEY,
    });
    return response.data;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
}
*/

/**
 * Example 3: Call payment gateway API
 */
/*
export async function processPayment(amount, paymentMethod) {
  try {
    const response = await httpClient.post('https://api.payment-gateway.com/charge', {
      amount,
      paymentMethod,
      apiKey: process.env.PAYMENT_API_KEY,
    });
    return response.data;
  } catch (error) {
    console.error('Payment processing failed:', error);
    throw error;
  }
}
*/

/**
 * Example 4: Get weather data for location-based features
 */
/*
export async function getWeatherData(location) {
  try {
    const response = await httpClient.get('https://api.weather.com/current', {
      params: {
        location,
        apiKey: process.env.WEATHER_API_KEY,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Weather API call failed:', error);
    throw error;
  }
}
*/

/**
 * Example 5: Send push notification via FCM
 */
/*
export async function sendPushNotification(token, title, body) {
  try {
    const response = await httpClient.post('https://fcm.googleapis.com/fcm/send', {
      to: token,
      notification: {
        title,
        body,
      },
    }, {
      headers: {
        'Authorization': `key=${process.env.FCM_SERVER_KEY}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Push notification failed:', error);
    throw error;
  }
}
*/

