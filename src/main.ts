import Vue from 'vue'
import {BootstrapVue, BvToastOptions, IconsPlugin} from 'bootstrap-vue'
import App from './router/RouterMain.vue'

import "bootstrap-vue/dist/bootstrap-vue.css"
import '@/theme.scss'
// import 'bootstrap/scss/bootstrap.scss'
import router from './router'
import './registerServiceWorker'
import './Mixins/EventHub'
import store from './Store'

let loaded = false
let toast: { message: string, options: BvToastOptions }[] = []
let modal: { type: string, title: string, message: string, options: BvToastOptions, callback: () => void }[] = []

export const showToast = (message: string, options: BvToastOptions) => {
    if (loaded) {
        app.$bvToast.toast(message, options)
    } else {
        toast.push({message, options})
    }
}

export const showModal = (type: string, title: string, message: string, options: BvToastOptions, callback: () => void) => {
    if (loaded) {
        // @ts-ignore
        app.$bvModal["msgBox" + type]?.(message, options).then(callback)
    } else {
        modal.push({type, title, message, options, callback})
    }
}

const shortkey = require('vue-shortkey');
const ctxMenu = require('vue-context-menu');

Vue.config.productionTip = false
Vue.use(BootstrapVue)
Vue.use(IconsPlugin)
Vue.use(shortkey, { prevent: ['input', 'textarea'] })
// Vue.use(ctxMenu)

const app = new Vue({
  router,
  store,
    mounted() {
        loaded = true
        toast.forEach(t => app.$bvToast.toast(t.message, t.options))
        modal.forEach(m => {
            // @ts-ignore
            app.$bvModal["msgBox" + m.type]?.(m.message, m.options).then(m.callback)
        })
    },
  render: h => h(App)
}).$mount('#app')
