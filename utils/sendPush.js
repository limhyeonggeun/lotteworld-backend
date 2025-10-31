const getAccessToken = require('./getAccessToken');
const fetch = require('node-fetch');

async function trySendPush(notification, fcmToken) {
  let accessToken;

  try {
    accessToken = await getAccessToken();
  } catch (err) {
    console.error('getAccessToken 호출 실패:', err);
    return false;
  }

  if (!fcmToken) {
    console.warn('fcmToken 없음 — 푸시 전송 불가');
    return false;
  }

  const message = {
    message: {
      token: fcmToken,
      notification: {
        title: notification.title,
        body: notification.content,
      },
      data: {
        type: notification.type || '',
        id: String(notification.id),
      },
    },
  };

  try {
    const response = await fetch(
      'https://fcm.googleapis.com/v1/projects/lotteworld-728fe/messages:send',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      }
    );

    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      console.error('푸시 전송 실패:', result.error || result);
      return false;
    }

    return true;
  } catch (error) {
    console.error('푸시 전송 중 예외 발생:', error);
    return false;
  }
}

module.exports = trySendPush;