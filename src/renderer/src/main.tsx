import { createRoot } from 'react-dom/client'
import App from './App'
import { store } from './store'
import { Provider } from 'react-redux'
import 'antd/dist/reset.css'

const rootElement = document.getElementById('root')
if (rootElement) {
  createRoot(rootElement).render(
    <Provider store={store}>
      <App />
    </Provider>
  )
} else {
  console.error('Failed to find root element')
}
