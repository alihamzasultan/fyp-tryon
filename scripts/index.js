// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.sendRequestNotification = functions.firestore
  .document('requests/{requestId}')
  .onCreate(async (snap, context) => {
    const requestData = snap.data();

    // Get receiver's push token
    const receiverRef = admin.firestore().collection('users').doc(requestData.receiverUid);
    const receiverDoc = await receiverRef.get();
    const pushToken = receiverDoc.data()?.pushToken;

    if (!pushToken) {
      console.log("❌ No push token found for receiver");
      return;
    }

    // Send notification via Expo
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: pushToken,
        sound: 'default',
        title: 'New Request Received',
        body: `${requestData.senderName} sent you a request for "${requestData.adTitle}"`,
        data: { adId: requestData.adId }
      })
    });
  });
