import React from 'react'

export default function ConfirmModal({ title, message, onConfirm, onCancel }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="bg-white border border-gray-200 rounded-xl p-6 w-full max-w-xs mx-4 shadow-lg">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-500 mb-5">{message}</p>
        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2 rounded-lg transition-colors text-sm"
          >
            확인
          </button>
          <button
            onClick={onCancel}
            className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-2 rounded-lg transition-colors text-sm"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  )
}
