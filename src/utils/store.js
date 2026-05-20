const KEY = 'plocky_project'

export function getProject() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setProject(data) {
  localStorage.setItem(KEY, JSON.stringify(data))
}

export function clearProject() {
  localStorage.removeItem(KEY)
}

export function updateProject(updates) {
  const project = getProject() || {}
  const updated = { ...project, ...updates }
  setProject(updated)
  return updated
}

export function getProjectProp(prop) {
  const p = getProject()
  return p ? p[prop] : undefined
}

export function setProjectProp(prop, value) {
  const p = getProject() || {}
  p[prop] = value
  setProject(p)
}
