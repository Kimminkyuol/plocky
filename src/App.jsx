import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import SettingsPage from './pages/SettingsPage.jsx'
import EditorPage from './pages/EditorPage.jsx'
import { getProject } from './utils/store.js'

export default function App() {
  const project = getProject()
  return (
    <Routes>
      <Route
        path="/"
        element={project ? <Navigate to="/editor" replace /> : <SettingsPage />}
      />
      <Route path="/settings" element={<SettingsPage />} />
      <Route
        path="/editor"
        element={project ? <EditorPage /> : <Navigate to="/" replace />}
      />
    </Routes>
  )
}
