import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'

import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './assets/main.css' // Import custom CSS AFTER Element Plus to override defaults
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import i18n from './i18n'

const app = createApp(App)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(createPinia())
app.use(router)
app.use(i18n)
app.use(ElementPlus)
app.mount('#app')
