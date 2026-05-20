import React, { useState, useEffect, useRef } from 'react'

export default function InputModal({ title, message, placeholder, onConfirm, onCancel }) {
  const [value, setValue] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    onConfirm(value)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl animate-slide-up">
        <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-400 mb-4">{message}</p>
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/\s/g, ''))}
            placeholder={placeholder}
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mb-4 transition-all"
          />
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!value.trim()}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2 rounded-xl transition-colors text-sm"
            >
              Create
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-200 font-semibold py-2 rounded-xl transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
