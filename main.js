import App from './App'

// 使用 CDN 引入 Vue
import Vue from 'https://unpkg.com/vue@2.6.14/dist/vue.js'
import './uni.promisify.adaptor'

Vue.config.productionTip = false
App.mpType = 'app'

new Vue({
  ...App
}).$mount('#app')