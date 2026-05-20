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
      <div className="bg-white border border-gray-200 rounded-xl p-6 w-full max-w-xs mx-4 shadow-lg">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-500 mb-4">{message}</p>
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/\s/g, ''))}
            placeholder={placeholder}
            className="w-full border border-gray-200 text-gray-900 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-gray-400 mb-4 transition-all"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!value.trim()}
              className="flex-1 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-2 rounded-lg transition-colors text-sm"
            >
              만들기
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-2 rounded-lg transition-colors text-sm"
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
