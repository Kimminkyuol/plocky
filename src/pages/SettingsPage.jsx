import React, { useState } from 'react'
import { importProjectFile } from '../utils/export.js'

export default function SettingsPage({ onProjectCreated }) {
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
      setError('모든 필드를 입력해주세요.')
      return
    }
    onProjectCreated({ ...form, finder: [] })
  }

  const handleOpen = async () => {
    try {
      const data = await importProjectFile()
      onProjectCreated(data)
    } catch (err) {
      if (err.message !== 'AbortError') {
        setError('프로젝트를 열 수 없습니다: ' + err.message)
      }
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-full max-w-xs px-6">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl mb-5">
            <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Plocky</h1>
          <p className="mt-1.5 text-gray-400 text-sm">Minecraft Plugin Creator</p>
        </div>

        {view === 'home' && (
          <div className="space-y-2">
            <button
              onClick={() => setView('create')}
              className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              새 프로젝트
            </button>
            <button
              onClick={handleOpen}
              className="w-full flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              프로젝트 열기
            </button>
            {error && <p className="text-red-500 text-xs text-center pt-1">{error}</p>}
          </div>
        )}

        {view === 'create' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-gray-900">새 프로젝트</h2>
              <button
                type="button"
                onClick={() => { setView('home'); setError('') }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <FormField label="Group ID" hint="com.example" value={form.groupId} onChange={handleChange('groupId')} />
              <FormField label="Artifact ID" hint="myplugin" value={form.artifactId} onChange={handleChange('artifactId')} />
              <FormField label="Plugin Name" hint="PascalCase" value={form.projectName} onChange={handleChange('projectName')} />
              <FormField label="Version" value={form.version} onChange={handleChange('version')} />
              <div>
                <label className="block text-xs text-gray-500 mb-1">Minecraft Version</label>
                <select
                  value={form.minecraftVersion}
                  onChange={(e) => setForm((prev) => ({ ...prev, minecraftVersion: e.target.value }))}
                  className="w-full border border-gray-200 text-gray-900 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 bg-white"
                >
                  {['1.21.1', '1.20.6', '1.20.4', '1.20.1', '1.19.4', '1.18.2', '1.17.1', '1.16.5'].map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              {error && <p className="text-red-500 text-xs">{error}</p>}

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 bg-gray-900 hover:bg-gray-800 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
                >
                  만들기
                </button>
                <button
                  type="button"
                  onClick={() => { setView('home'); setError('') }}
                  className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-2.5 rounded-lg transition-colors text-sm"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

function FormField({ label, hint, value, onChange }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">
        {label}
        {hint && <span className="text-gray-400 ml-1.5">{hint}</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={onChange}
        required
        className="w-full border border-gray-200 text-gray-900 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-gray-400 transition-all"
      />
    </div>
  )
}
