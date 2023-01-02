import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';
import { RegExpRoute, registerRoute, Route } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';

self.__WB_DISABLE_DEV_LOGS = true;

const imageRoute = new Route(
  ({ request, sameOrigin }) => {
    const isRemote = !sameOrigin;
    const isImage = request.destination === 'image';
    const isAvatar = request.url.includes('/avatars/');
    const isEmoji = request.url.includes('/emoji/');
    return isRemote && isImage && (isAvatar || isEmoji);
  },
  new CacheFirst({
    cacheName: 'remote-images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        purgeOnQuotaError: true,
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  }),
);
registerRoute(imageRoute);

// Cache /instance because masto.js has to keep calling it while initializing
const apiExtendedRoute = new RegExpRoute(
  /^https?:\/\/[^\/]+\/api\/v\d+\/(instance|custom_emojis)/,
  new StaleWhileRevalidate({
    cacheName: 'api-extended',
    plugins: [
      new ExpirationPlugin({
        maxAgeSeconds: 24 * 60 * 60, // 1 day
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  }),
);
registerRoute(apiExtendedRoute);

const apiRoute = new RegExpRoute(
  // Matches:
  // - statuses/:id/context - some contexts are really huge
  /^https?:\/\/[^\/]+\/api\/v\d+\/(statuses\/\d+\/context)/,
  new StaleWhileRevalidate({
    cacheName: 'api',
    plugins: [
      new ExpirationPlugin({
        maxAgeSeconds: 5 * 60, // 5 minutes
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  }),
);
registerRoute(apiRoute);
