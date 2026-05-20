import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { setProject } from '../utils/store.js'
import { importProjectFile } from '../utils/export.js'

export default function SettingsPage() {
  const navigate = useNavigate()
  const [view, setView] = useState('home')
  const [form, setForm] = useState({
    groupId: 'com.example',
    artifactId: 'myplugin',
    projectName: 'MyPlugin',
    version: '1.0.0',
    minecraftVersion: '1.20.4'
  })
  const [error, setError] = useState('')

  const handleChange = (field) => (e) => {
    let val = e.target.value.replace(/\s/g, '')
    if (field === 'projectName') val = val.charAt(0).toUpperCase() + val.slice(1)
    setForm((prev) => ({ ...prev, [field]: val }))
    setError('')
  }

  const handleCreate = (e) => {
    e.preventDefault()
    if (!form.groupId || !form.artifactId || !form.projectName) {
      setError('All fields are required.')
      return
    }
    setProject({ ...form, finder: [] })
    navigate('/editor')
  }

  const handleOpen = async () => {
    try {
      const data = await importProjectFile()
      setProject(data)
      navigate('/editor')
    } catch (err) {
      if (err.message !== 'AbortError') {
        setError('Failed to open project: ' + err.message)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-purple-600/8 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md px-6 animate-slide-up">
        {/* Logo / branding */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl mb-6 shadow-2xl shadow-indigo-500/30">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold text-white tracking-tight">Plocky</h1>
          <p className="mt-3 text-gray-500 text-sm">
            Minecraft Plugin Creator &mdash; Block-based Coding
          </p>
        </div>

        {view === 'home' && (
          <div className="space-y-3 animate-fade-in">
            <button
              onClick={() => setView('create')}
              className="w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-200 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0"
            >
              <PlusIcon />
              New Project
            </button>
            <button
              onClick={handleOpen}
              className="w-full flex items-center justify-center gap-3 bg-gray-800/80 hover:bg-gray-700 text-gray-200 font-semibold py-4 px-6 rounded-2xl transition-all duration-200 border border-gray-700/50 hover:border-gray-600 hover:-translate-y-0.5 active:translate-y-0"
            >
              <FolderIcon />
              Open Project
            </button>
            {error && (
              <p className="text-red-400 text-sm text-center py-2 animate-fade-in">{error}</p>
            )}
          </div>
        )}

        {view === 'create' && (
          <div className="animate-slide-up bg-gray-900/80 backdrop-blur-xl rounded-2xl p-8 border border-gray-700/50 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-semibold text-white">New Project</h2>
              <button
                type="button"
                onClick={() => { setView('home'); setError('') }}
                className="text-gray-500 hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-gray-800"
              >
                <CloseIcon />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-5">
              <FormField
                label="Group ID"
                hint="e.g. com.example"
                value={form.groupId}
                onChange={handleChange('groupId')}
              />
              <FormField
                label="Artifact ID"
                hint="e.g. myplugin"
                value={form.artifactId}
                onChange={handleChange('artifactId')}
              />
              <FormField
                label="Plugin Name"
                hint="PascalCase"
                value={form.projectName}
                onChange={handleChange('projectName')}
              />
              <FormField
                label="Version"
                value={form.version}
                onChange={handleChange('version')}
              />
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">
                  Minecraft Version
                </label>
                <select
                  value={form.minecraftVersion}
                  onChange={(e) => setForm((prev) => ({ ...prev, minecraftVersion: e.target.value }))}
                  className="w-full bg-gray-800/80 border border-gray-700/50 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                >
                  {['1.21.1', '1.20.6', '1.20.4', '1.20.1', '1.19.4', '1.18.2', '1.17.1', '1.16.5'].map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              {error && (
                <p className="text-red-400 text-sm animate-fade-in">{error}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl transition-all duration-200 hover:-translate-y-0.5"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => { setView('home'); setError('') }}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold py-2.5 rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <p className="text-center text-gray-700 text-xs mt-8">
          © 2025 Plocky &mdash; MIT License
        </p>
      </div>
    </div>
  )
}

function FormField({ label, hint, value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-400 mb-1.5">
        {label}
        {hint && <span className="text-gray-600 ml-2 font-normal text-xs">{hint}</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={onChange}
        required
        className="w-full bg-gray-800/80 border border-gray-700/50 text-white rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder-gray-600"
      />
    </div>
  )
}

function PlusIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  )
}

function FolderIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}
