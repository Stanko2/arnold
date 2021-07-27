import Vue from 'vue'
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'
import App from './router/RouterMain.vue'

import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import router from './router'
import './registerServiceWorker'

const shortkey = require('vue-shortkey');
const ctxMenu = require('vue-context-menu');

Vue.config.productionTip = false
Vue.use(BootstrapVue)
Vue.use(IconsPlugin)
Vue.use(shortkey, { prevent: ['input', 'textarea'] })
// Vue.use(ctxMenu)

new Vue({
  router,
  render: h => h(App),
}).$mount('#app')
