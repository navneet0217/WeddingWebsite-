import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import data from './data/wedding.json'
import { validateWeddingData } from './utils/validateWeddingData.js'
import './styles/index.css'

const root = createRoot(document.getElementById('root'))
try {
  validateWeddingData(data)
  root.render(<StrictMode><App data={data} /></StrictMode>)
} catch (error) {
  console.error('Unable to open the invitation.', error)
  root.render(
    <main className="configuration-error" role="alert">
      <h1>The invitation configuration needs attention.</h1>
      <p>Correct the wedding JSON and reload the page.</p>
      <pre>{error.message}</pre>
    </main>,
  )
}
