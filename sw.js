const CACHE_NAME =
  'quoriya-v1';


const FILES_TO_CACHE = [

  './',

  './index.html',

  './topic.html',

  './offline.html',

  './css/style.css',

  './js/script.js',

  './js/topic.js',

  './data/topics.json',

  './data/paths.json',

  './manifest.json'

];


self.addEventListener(
  'install',
  event => {

    event.waitUntil(

      caches
        .open(CACHE_NAME)
        .then(
          cache =>
            cache.addAll(
              FILES_TO_CACHE
            )
        )

    );

    self.skipWaiting();

  }
);


self.addEventListener(
  'activate',
  event => {

    event.waitUntil(

      caches
        .keys()
        .then(keys =>

          Promise.all(

            keys
              .filter(
                key =>
                  key !== CACHE_NAME
              )
              .map(
                key =>
                  caches.delete(key)
              )

          )

        )

    );

    self.clients.claim();

  }
);


self.addEventListener(
  'fetch',
  event => {

    const request =
      event.request;


    if (
      request.method !== 'GET'
    ) {
      return;
    }


    event.respondWith(

      fetch(request)

        .then(response => {

          const copy =
            response.clone();


          caches
            .open(CACHE_NAME)
            .then(
              cache =>
                cache.put(
                  request,
                  copy
                )
            );


          return response;

        })

        .catch(
          () =>
            caches
              .match(request)
              .then(
                cached =>
                  cached ||
                  caches.match(
                    './offline.html'
                  )
              )
        )

    );

  }
);