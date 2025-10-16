const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

async function sendNotificationToTopic(topic, title, body) {
  const message = {
    notification: {
      title,
      body
    },
    topic: topic
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Notificación enviada:', response);
    return response;
  } catch (error) {
    console.error('Error enviando notificación:', error);
    throw error;
  }
}

module.exports = { sendNotificationToTopic };   