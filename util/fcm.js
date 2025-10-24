/**
 
This file configures and manages Firebase Cloud Messaging service to send push notifications to user mobile devices

FCM service initializes Firebase Admin SDK and provides functions to send push notifications via topics to mobile devices
*
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// initialize Firebase Admin SDK with service account credentials for FCM
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

/**
 
This function allows sending push notifications to specific user groups via Firebase topics/channels

sendNotificationToTopic creates notification message structure and sends it via Firebase messaging service to specified topic
*
 */

async function sendNotificationToTopic(topic, title, body) {
  
  // create notification message with title and body for specific topic
  const message = {
    notification: {
      title,
      body
    },
    topic: topic
  };

  try {
    
    // Send message via Firebase Admin messaging service
    const response = await admin.messaging().send(message);
    console.log('Notificación enviada:', response);
    return response;
  } catch (error) {
    console.error('Error enviando notificación:', error);
    throw error;
  }
}

module.exports = { sendNotificationToTopic };   