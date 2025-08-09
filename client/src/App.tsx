import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout'
import FormsPage from './features/forms/FormsPage'
import FormEditorPage from './features/forms/FormEditorPage'
import PublicFillPage from './features/public/PublicFillPage'
import ResultsPage from './features/results/ResultsPage'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<FormsPage />} />
        <Route path="/forms/:id" element={<FormEditorPage />} />
        <Route path="/public" element={<PublicFillPage />} />
        <Route path="/results" element={<ResultsPage />} />
      </Routes>
    </Layout>
  )
}
