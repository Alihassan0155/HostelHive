import { db } from '../config/firebase.js';
import { COLLECTIONS, TRACKING_PREFIX } from '../config/constants.js';

export async function generateTrackingNumber() {
  const year = new Date().getFullYear();
  const prefix = `${TRACKING_PREFIX}-${year}-`;
  const issuesRef = db.collection(COLLECTIONS.ISSUES);
  const snapshot = await issuesRef
    .where('trackingNumber', '>=', prefix)
    .where('trackingNumber', '<', prefix + '999')
    .orderBy('trackingNumber', 'desc')
    .limit(1)
    .get();
  let nextNumber = 1;
  if (!snapshot.empty) {
    const lastTrackingNumber = snapshot.docs[0].data().trackingNumber;
    const lastNumber = parseInt(lastTrackingNumber.split('-')[2], 10);
    nextNumber = lastNumber + 1;
  }
  const formattedNumber = String(nextNumber).padStart(3, '0');
  return `${prefix}${formattedNumber}`;
}

export function successResponse(data, message = 'Success', statusCode = 200) {
  return {
    response: {
      success: true,
      message,
      data,
    },
    statusCode,
  };
}

export function errorResponse(message, statusCode = 400, errors = null) {
  const response = {
    success: false,
    message,
  };
  if (errors) {
    response.errors = errors;
  }
  return { response, statusCode };
}

