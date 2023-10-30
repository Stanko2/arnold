import Vue from 'vue'
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'
import App from './router/RouterMain.vue'

import "bootstrap-vue/dist/bootstrap-vue.css"
import '@/theme.scss'
// import 'bootstrap/scss/bootstrap.scss'
import router from './router'
import './Mixins/EventHub'
import store from './Store'
import { registerSW } from './registerServiceWorker'


import shortkey from 'vue-shortkey'
import ctxMenu from 'vue-context-menu'

Vue.config.productionTip = false
Vue.use(BootstrapVue)
Vue.use(IconsPlugin)
Vue.use(shortkey, { prevent: ['input', 'textarea'] })
// Vue.use(ctxMenu)

export const app = new Vue({
  store,
  router: router(),
  render: h => h(App),
}).$mount('#app')

registerSW()

