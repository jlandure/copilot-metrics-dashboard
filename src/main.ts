import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'

import App from './App.vue'
import router from './router'

// PrimeVue components
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import ProgressBar from 'primevue/progressbar'
import Skeleton from 'primevue/skeleton'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: '.dark-mode',
      cssLayer: false
    }
  }
})

// Register PrimeVue components globally
app.component('DataTable', DataTable)
app.component('Column', Column)
app.component('Card', Card)
app.component('Button', Button)
app.component('InputText', InputText)
app.component('Tag', Tag)
app.component('ProgressBar', ProgressBar)
app.component('Skeleton', Skeleton)
app.component('TabView', TabView)
app.component('TabPanel', TabPanel)
app.component('IconField', IconField)
app.component('InputIcon', InputIcon)

app.mount('#app')
