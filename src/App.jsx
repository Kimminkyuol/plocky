import React, { useState } from 'react'
import { getProject, setProject, clearProject } from './utils/store.js'
import EditorPage from './pages/EditorPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'

export default function App() {
  const [project, setLocalProject] = useState(getProject)

  const handleProjectCreated = (proj) => {
    setProject(proj)
    setLocalProject(proj)
  }

  const handleNewProject = () => {
    clearProject()
    setLocalProject(null)
  }

  if (project) {
    return <EditorPage onNewProject={handleNewProject} />
  }
  return <SettingsPage onProjectCreated={handleProjectCreated} />
}
