import { registerServiceWorker } from 'https://lsong.org/scripts/service-worker.js';
import { request as requestNotification } from 'https://lsong.org/scripts/notification.js';


const init = async () => {
  const registration = await navigator.serviceWorker.ready;
  await requestNotification();
  registration.showNotification("Service Worker Ready", {});
  const subscription = await registration.pushManager.getSubscription();
  console.log('subscription', subscription);

  const options = { tag: 'user_alerts' };
  const notifications = await registration.getNotifications(options)
  console.log('notifications', notifications);
};

init();
registerServiceWorker("/sw.js");
console.log("hello world");