/* eslint-disable no-console */

import {register} from 'register-service-worker'
import {app} from "@/main";

if (process.env.NODE_ENV === 'production') {
  register(`${process.env.BASE_URL}service-worker.js`, {
    ready () {
      console.log(
        'App is being served from cache by a service worker.\n' +
        'For more details, visit https://goo.gl/AFskqB'
      )
    },
    registered () {
      console.log('Service worker has been registered.')
    },
    cached () {
      console.log('Content has been cached for offline use.')

      app.$bvToast.toast('Pripravené na používanie bez internetu', {
        title: 'Status',
        variant: 'success',
        solid: true
      })
    },
    updatefound () {
      console.log('New content is downloading.')
    },
    updated (registration) {
      console.log('New content is available; please refresh.')

      app.$bvModal.msgBoxConfirm('Je dostupná nová verzia aplikácie. Chcete ju teraz nainštalovať?', {
        title: 'Aktualizácia',
        variant: 'success',
        solid: true,
      }).then(() => {
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload();
        });

        if (!registration || !registration.waiting) return;
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      })
    },
    offline () {
      console.log('No internet connection found. App is running in offline mode.')
    },
    error (error) {
      console.error('Error during service worker registration:', error)

      app.$bvToast.toast('Nepodarilo sa zaregistrovať Service Worker. Ak sa toto opakuje, napíšte nám.', {
        title: 'Status',
        variant: 'danger',
        solid: true
      })
    }
  })
}
