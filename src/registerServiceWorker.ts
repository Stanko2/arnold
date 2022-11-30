/* eslint-disable no-console */

import {register} from 'register-service-worker'
import {app} from "@/main";

let storedRegistration: ServiceWorkerRegistration | null = null;

export function registerSW() {
  if (localStorage.getItem('update') === 'reload') {
    app.$bvToast.toast('Aplikácia bola aktualizovaná!', {
      title: 'Status',
      variant: 'success',
      solid: true
    })
    localStorage.removeItem('update')
  }

  if (process.env.NODE_ENV === 'production') {
    register(`${process.env.BASE_URL}service-worker.js`, {
      ready() {
        console.log(
            'App is being served from cache by a service worker.\n' +
            'For more details, visit https://goo.gl/AFskqB'
        )
      },
      registered() {
        console.log('Service worker has been registered.')
      },
      cached() {
        console.log('Content has been cached for offline use.')
        localStorage.removeItem('update')

        app.$bvToast.toast('Pripravené na používanie bez internetu', {
          title: 'Status',
          variant: 'success',
          solid: true
        })
      },
      updatefound() {
        console.log('New content is downloading.')
      },
      updated(registration) {
        console.log('New content is available; please refresh.')

        app.$bvModal.msgBoxConfirm('Je dostupná nová verzia aplikácie. Chcete ju teraz nainštalovať?', {
          title: 'Aktualizácia',
          variant: 'success',
          solid: true,
        }).then((res) => {
          storedRegistration = registration;
          if (res === true) {
            updateApp();
          } else {
            localStorage.setItem('update', 'waiting')
            app.$bvToast.toast('Novú verziu aplikácie si môžete nainštalovať neskôr v nastaveniach.', {
              title: 'Aktualizácia',
              variant: 'warning',
              solid: true
            })
          }
        })
      },
      offline() {
        console.log('No internet connection found. App is running in offline mode.')
      },
      error(error) {
        console.error('Error during service worker registration:', error)

        app.$bvToast.toast('Nepodarilo sa zaregistrovať Service Worker. Ak sa toto opakuje, napíšte nám.', {
          title: 'Status',
          variant: 'danger',
          solid: true
        })
      }
    })
  }
}

export function updateApp() {
  localStorage.setItem('update', 'reload')
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });

  if (!storedRegistration || !storedRegistration.waiting) return;
  storedRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
}
