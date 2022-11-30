import Vue from 'vue'
import {BootstrapVue, IconsPlugin} from 'bootstrap-vue'
import App from './router/RouterMain.vue'

import "bootstrap-vue/dist/bootstrap-vue.css"
import '@/theme.scss'
// import 'bootstrap/scss/bootstrap.scss'
import router from './router'
import './Mixins/EventHub'
import store from './Store'
// import only after app is created
import './registerServiceWorker'


const shortkey = require('vue-shortkey');
const ctxMenu = require('vue-context-menu');

Vue.config.productionTip = false
Vue.use(BootstrapVue)
Vue.use(IconsPlugin)
Vue.use(shortkey, { prevent: ['input', 'textarea'] })
// Vue.use(ctxMenu)

export const app = new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')

