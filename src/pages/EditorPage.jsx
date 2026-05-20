import React, { useEffect, useRef, useState, useCallback } from 'react'
import hljs from 'highlight.js/lib/core'
import java from 'highlight.js/lib/languages/java'
import { getProject, setProject, clearProject } from '../utils/store.js'
import { exportProject, saveProjectFile } from '../utils/export.js'
import ConfirmModal from '../components/ConfirmModal.jsx'
import InputModal from '../components/InputModal.jsx'

hljs.registerLanguage('java', java)

const SIDEBAR_MIN = 140
const SIDEBAR_MAX = 400
const SIDEBAR_DEFAULT = 208

export default function EditorPage({ onNewProject }) {
  const workspaceRef = useRef(null)
  const blocklyRef = useRef(null)
  const currentFileRef = useRef(null)

  const [project, setLocalProject] = useState(getProject)
  const [currentFile, setCurrentFile] = useState(null)
  const [generatedCode, setGeneratedCode] = useState('')
  const [isReady, setIsReady] = useState(false)
  const [confirmModal, setConfirmModal] = useState(null)
  const [inputModal, setInputModal] = useState(null)
  const [showCodePanel, setShowCodePanel] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_DEFAULT)
  const [codePanelWidth, setCodePanelWidth] = useState(288)

  useEffect(() => { currentFileRef.current = currentFile }, [currentFile])

  // Blockly 워크스페이스 자동 리사이즈 (사이드바/코드패널 변경 시)
  useEffect(() => {
    if (!isReady || !workspaceRef.current) return
    const ro = new ResizeObserver(() => {
      if (blocklyRef.current) window.Blockly?.svgResize(blocklyRef.current)
    })
    ro.observe(workspaceRef.current)
    return () => ro.disconnect()
  }, [isReady])

  // 코드 패널 토글 시 Blockly 리사이즈
  useEffect(() => {
    if (blocklyRef.current) window.Blockly?.svgResize(blocklyRef.current)
  }, [showCodePanel])

  // 사이드바 드래그 리사이즈
  const startSidebarResize = useCallback((e) => {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = sidebarWidth

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const onMove = (e) => {
      const newWidth = Math.max(SIDEBAR_MIN, Math.min(SIDEBAR_MAX, startWidth + e.clientX - startX))
      setSidebarWidth(newWidth)
    }
    const onUp = () => {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      if (blocklyRef.current) window.Blockly?.svgResize(blocklyRef.current)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [sidebarWidth])

  // 코드 패널 드래그 리사이즈 (왼쪽 핸들 → 오른쪽으로 드래그 시 좁아짐)
  const startCodePanelResize = useCallback((e) => {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = codePanelWidth

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const onMove = (e) => {
      const newWidth = Math.max(160, Math.min(600, startWidth - (e.clientX - startX)))
      setCodePanelWidth(newWidth)
    }
    const onUp = () => {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      if (blocklyRef.current) window.Blockly?.svgResize(blocklyRef.current)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [codePanelWidth])

  useEffect(() => {
    const Blockly = window.Blockly
    if (!Blockly) {
      console.error('Blockly not loaded.')
      return
    }

    Blockly.dialog.prompt = (message, defaultValue, callback) => {
      callback(window.prompt(message, defaultValue))
    }
    Blockly.dialog.alert = (message, callback) => {
      window.alert(message)
      if (callback) callback()
    }
    Blockly.dialog.confirm = (message, callback) => {
      callback(window.confirm(message))
    }

    const workspace = Blockly.inject(workspaceRef.current, {
      grid: { spacing: 20, length: 2, colour: '#e5e7eb', snap: true },
      readOnly: false,
      move: { scrollbars: true, drag: true, wheel: true },
      toolbox: getEventToolbox(),
      theme: buildLightTheme(Blockly),
      zoom: { controls: true, wheel: true, startScale: 0.9, maxScale: 4, minScale: 0.2, scaleSpeed: 1.1 },
      trashcan: true,
    })

    workspace.addChangeListener(Blockly.Events.disableOrphans)

    workspace.addChangeListener(() => {
      const idx = currentFileRef.current
      if (idx === null || idx === undefined) return
      const proj = getProject()
      if (!proj?.finder?.[idx]) return

      try {
        const finder = proj.finder
        const fileData = finder[idx]
        const newCode = Blockly.Java.workspaceToCode(
          workspace,
          fileData.type,
          `${proj.groupId}.${fileData.type}`,
          fileData.name
        )
          .replace(/MainPluginName/g, proj.projectName)
          .replace(/MainPluginPath/g, proj.groupId)

        setGeneratedCode(newCode)
        finder[idx].code = JSON.stringify(Blockly.serialization.workspaces.save(workspace))
        setProject({ ...proj, finder })
        setLocalProject({ ...proj, finder })
      } catch (err) {
        workspace.undo(false)
        console.warn('Code generation error:', err.message)
      }
    })

    blocklyRef.current = workspace
    setIsReady(true)

    return () => {
      workspace.dispose()
      blocklyRef.current = null
    }
  }, [])

  const openFile = useCallback((idx) => {
    const Blockly = window.Blockly
    const proj = getProject()
    if (!proj?.finder?.[idx]) return
    const fileData = proj.finder[idx]
    const ws = blocklyRef.current
    if (!ws) return

    setCurrentFile(idx)
    currentFileRef.current = idx
    ws.clear()

    const toolbox = fileData.type === 'event' ? getEventToolbox() : getCommandToolbox()
    ws.updateToolbox(toolbox)

    try {
      const raw = fileData.code || '{}'
      const state = typeof raw === 'string' ? JSON.parse(raw) : raw
      if (state && Object.keys(state).length > 0) {
        Blockly.serialization.workspaces.load(state, ws)
      }
    } catch (e) {
      console.warn('Failed to load workspace state:', e)
    }
  }, [])

  const createFile = useCallback((type) => {
    setInputModal({
      title: `새 ${type === 'event' ? '이벤트' : '커맨드'}`,
      message: '이름을 입력하세요 (PascalCase):',
      placeholder: type === 'event' ? 'MyEvent' : 'MyCommand',
      onConfirm: (name) => {
        setInputModal(null)
        if (!name?.trim()) return
        const trimmed = name.trim().replace(/\s/g, '')
        const proj = getProject()
        if (!proj) return
        if (proj.finder.some((f) => f.name === trimmed)) {
          window.alert(`"${trimmed}" 파일이 이미 존재합니다.`)
          return
        }
        const newFinder = [...proj.finder, { name: trimmed, type, code: '{}' }]
        const updated = { ...proj, finder: newFinder }
        setProject(updated)
        setLocalProject(updated)
        openFile(newFinder.length - 1)
      },
      onCancel: () => setInputModal(null)
    })
  }, [openFile])

  const deleteFile = useCallback((idx) => {
    const proj = getProject()
    const fileData = proj?.finder?.[idx]
    if (!fileData) return
    setConfirmModal({
      title: '파일 삭제',
      message: `"${fileData.name}"을 삭제하시겠습니까?`,
      onConfirm: () => {
        setConfirmModal(null)
        const newFinder = proj.finder.filter((_, i) => i !== idx)
        const updated = { ...proj, finder: newFinder }
        setProject(updated)
        setLocalProject(updated)
        if (currentFileRef.current === idx) {
          setCurrentFile(null)
          currentFileRef.current = null
          blocklyRef.current?.clear()
          setGeneratedCode('')
        } else if (currentFileRef.current > idx) {
          const newIdx = currentFileRef.current - 1
          setCurrentFile(newIdx)
          currentFileRef.current = newIdx
        }
      },
      onCancel: () => setConfirmModal(null)
    })
  }, [])

  const handleExport = async () => {
    setIsExporting(true)
    try {
      await exportProject(getProject())
    } catch (err) {
      window.alert('Export failed: ' + err.message)
    } finally {
      setIsExporting(false)
    }
  }

  const handleNewProject = () => {
    setConfirmModal({
      title: '새 프로젝트',
      message: '새 프로젝트를 시작하시겠습니까? 저장되지 않은 변경사항은 사라집니다.',
      onConfirm: () => {
        setConfirmModal(null)
        onNewProject()
      },
      onCancel: () => setConfirmModal(null)
    })
  }

  const finder = project?.finder || []

  return (
    <div className="flex h-screen bg-white text-gray-900 overflow-hidden">
      {/* SIDEBAR */}
      <aside
        className="flex flex-col border-r border-gray-200 flex-shrink-0 bg-white"
        style={{ width: sidebarWidth }}
      >
        <div className="px-4 py-3.5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-gray-900 rounded-md flex items-center justify-center flex-shrink-0">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-900 truncate">{project?.projectName}</span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5 pl-7 truncate">{project?.groupId}</p>
        </div>

        <div className="px-3 py-2.5 border-b border-gray-100">
          <div className="flex gap-1.5">
            <button
              onClick={() => createFile('event')}
              className="flex-1 flex items-center justify-center gap-1 text-xs border border-gray-200 hover:bg-gray-50 text-gray-600 py-1.5 rounded-lg transition-colors"
            >
              <svg className="w-3 h-3 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Event
            </button>
            <button
              onClick={() => createFile('command')}
              className="flex-1 flex items-center justify-center gap-1 text-xs border border-gray-200 hover:bg-gray-50 text-gray-600 py-1.5 rounded-lg transition-colors"
            >
              <svg className="w-3 h-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              CMD
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-1">
          {finder.length === 0 ? (
            <p className="text-xs text-gray-400 px-4 py-4 leading-relaxed">파일이 없습니다.<br />Event 또는 CMD를 만들어보세요.</p>
          ) : (
            finder.map((fileData, idx) => (
              <FileItem
                key={idx}
                fileData={fileData}
                isActive={currentFile === idx}
                onClick={() => openFile(idx)}
                onDelete={() => deleteFile(idx)}
              />
            ))
          )}
        </div>

        <div className="border-t border-gray-100 px-3 py-3 space-y-1.5">
          <button
            onClick={handleExport}
            disabled={isExporting || finder.length === 0}
            className="w-full flex items-center justify-center gap-1.5 text-xs bg-gray-900 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed text-white py-2 px-3 rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {isExporting ? '내보내는 중...' : 'ZIP 내보내기'}
          </button>
          <button
            onClick={() => saveProjectFile(getProject())}
            className="w-full flex items-center justify-center gap-1.5 text-xs border border-gray-200 hover:bg-gray-50 text-gray-600 py-2 px-3 rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            .plocky 저장
          </button>
          <button
            onClick={handleNewProject}
            className="w-full text-xs text-gray-400 hover:text-gray-600 py-1.5 transition-colors"
          >
            새 프로젝트
          </button>
        </div>
      </aside>

      {/* SIDEBAR DRAG HANDLE */}
      <div
        className="w-1 flex-shrink-0 hover:bg-blue-400 active:bg-blue-500 transition-colors cursor-col-resize"
        onMouseDown={startSidebarResize}
      />

      {/* WORKSPACE */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
            <div className="text-center">
              <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-gray-400 text-xs">불러오는 중...</p>
            </div>
          </div>
        )}
        {currentFile === null && isReady && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <svg className="w-10 h-10 text-gray-200 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-300 text-sm">파일을 선택하세요</p>
            </div>
          </div>
        )}
        <div
          ref={workspaceRef}
          className="blockly-workspace flex-1"
          onMouseDown={() => {
            // 플라이아웃 닫힌 후 스크롤바 복구
            requestAnimationFrame(() => {
              if (blocklyRef.current) window.Blockly?.svgResize(blocklyRef.current)
            })
          }}
        />
      </main>

      {/* CODE PANEL */}
      {showCodePanel && (
        <>
          {/* CODE PANEL DRAG HANDLE */}
          <div
            className="w-1 flex-shrink-0 hover:bg-blue-400 active:bg-blue-500 transition-colors cursor-col-resize"
            onMouseDown={startCodePanelResize}
          />
          <aside
            className="flex flex-col bg-gray-50 flex-shrink-0 overflow-hidden"
            style={{ width: codePanelWidth }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <span className="text-xs font-medium text-gray-500">Generated Java</span>
              <button
                onClick={() => setShowCodePanel(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="패널 닫기"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <div className="code-viewer flex-1 overflow-auto">
              {generatedCode ? (
                <pre
                  className="hljs"
                  dangerouslySetInnerHTML={{
                    __html: hljs.highlight(generatedCode, { language: 'java' }).value
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-400 text-xs">파일을 열면 코드가 표시됩니다</p>
                </div>
              )}
            </div>
          </aside>
        </>
      )}

      {!showCodePanel && (
        <button
          onClick={() => setShowCodePanel(true)}
          className="absolute right-0 top-1/2 -translate-y-1/2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-400 hover:text-gray-600 px-2 py-4 rounded-l-lg transition-colors z-10"
          title="코드 패널 열기"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {confirmModal && <ConfirmModal {...confirmModal} />}
      {inputModal && <InputModal {...inputModal} />}
    </div>
  )
}

function FileItem({ fileData, isActive, onClick, onDelete }) {
  const [showDelete, setShowDelete] = useState(false)

  return (
    <div
      className={`file-item flex items-center justify-between px-3 py-2 mx-1.5 my-0.5 rounded-lg cursor-pointer ${isActive ? 'active' : ''}`}
      onClick={onClick}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className={`text-xs font-semibold w-4 text-center flex-shrink-0 ${fileData.type === 'event' ? 'text-amber-500' : 'text-blue-500'}`}>
          {fileData.type === 'event' ? 'E' : 'C'}
        </span>
        <span className="text-sm text-gray-700 truncate">{fileData.name}</span>
      </div>
      {showDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 ml-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  )
}

// --- Blockly helpers ---

function buildLightTheme(Blockly) {
  if (!Blockly.Theme) return undefined
  try {
    return Blockly.Theme.defineTheme('plocky_light', {
      base: Blockly.Themes?.Classic,
      componentStyles: {
        workspaceBackgroundColour: '#ffffff',
        toolboxBackgroundColour: '#f3f4f6',
        toolboxForegroundColour: '#1f2937',
        flyoutBackgroundColour: '#f9fafb',
        flyoutForegroundColour: '#1f2937',
        flyoutOpacity: 1,
        scrollbarColour: '#d1d5db',
        insertionMarkerColour: '#3b82f6',
        insertionMarkerOpacity: 0.5,
        markerColour: '#3b82f6',
        cursorColour: '#3b82f6',
      },
      fontStyle: { family: 'Inter, system-ui, sans-serif', size: 11 }
    })
  } catch {
    return undefined
  }
}

function getEventToolbox() {
  return `<xml xmlns="https://developers.google.com/blockly/xml" id="toolbox">
  <category name="Logic" colour="%{BKY_LOGIC_HUE}">
    <block type="controls_if"/><block type="logic_compare"/><block type="logic_operation"/>
    <block type="logic_negate"/><block type="logic_boolean"/><block type="logic_ternary"/>
  </category>
  <category name="Loops" colour="%{BKY_LOOPS_HUE}">
    <block type="controls_repeat_ext"><value name="TIMES"><shadow type="math_number"><field name="NUM">10</field></shadow></value></block>
    <block type="controls_whileUntil"/><block type="controls_for"><value name="FROM"><shadow type="math_number"><field name="NUM">1</field></shadow></value><value name="TO"><shadow type="math_number"><field name="NUM">10</field></shadow></value><value name="BY"><shadow type="math_number"><field name="NUM">1</field></shadow></value></block>
    <block type="controls_forEach"/><block type="controls_flow_statements"/>
  </category>
  <category name="Math" colour="%{BKY_MATH_HUE}">
    <block type="math_number"/><block type="math_arithmetic"/><block type="math_single"/>
    <block type="math_trig"/><block type="math_constant"/><block type="math_round"/>
    <block type="math_modulo"/><block type="math_random_int"/>
  </category>
  <category name="Text" colour="%{BKY_TEXTS_HUE}">
    <block type="text"/><block type="text_join"/><block type="text_append"/>
    <block type="text_length"/><block type="text_isEmpty"/><block type="text_print"/>
  </category>
  <category name="Lists" colour="%{BKY_LISTS_HUE}">
    <block type="lists_create_with"/><block type="lists_repeat"/><block type="lists_length"/>
    <block type="lists_isEmpty"/><block type="lists_getIndex"/><block type="lists_setIndex"/>
  </category>
  <sep/>
  <category name="Variables" colour="%{BKY_VARIABLES_HUE}" custom="VARIABLE"/>
  <category name="Functions" colour="%{BKY_PROCEDURES_HUE}" custom="PROCEDURE"/>
  <sep/>
  <category name="Event" colour="65">
    <block type="event_cancel"/><block type="event_get"/>
    <block type="event_server_state_change"/><block type="event_player_interact"/>
    <block type="event_player_walk"/><block type="event_inventory"/>
  </category>
  <category name="Executor" colour="160">
    <block type="executor_action_bar"><value name="TEXT"><shadow type="text"/></value></block>
    <block type="executor_broadcast"><value name="TEXT"><shadow type="text"/></value></block>
    <block type="executor_message"><value name="TEXT"><shadow type="text"/></value></block>
    <block type="executor_command"><value name="COMMAND"><shadow type="text"><field name="TEXT">help</field></shadow></value></block>
    <block type="executor_kick"><value name="DUE"><shadow type="text"/></value></block>
    <block type="executor_kill"/><block type="executor_teleport"/>
    <block type="executor_give"/><block type="executor_set_game_mode"/>
    <block type="executor_set_health"><value name="HEALTH"><shadow type="math_number"/></value></block>
    <block type="executor_permission"><value name="PERMISSION"><shadow type="text"/></value></block>
    <block type="executor_log"><value name="TEXT"><shadow type="text"/></value></block>
    <block type="executor_wait"><value name="TIME"><shadow type="math_number"/></value></block>
  </category>
  <category name="Player" colour="230">
    <block type="player_get_by_name"><value name="NAME"><shadow type="text"/></value></block>
    <block type="player_get_string"/><block type="player_get_number"/>
    <block type="player_get_boolean"/><block type="player_get_location"/><block type="player_get_item"/>
  </category>
  <category name="Location" colour="290">
    <block type="location"><value name="WORLD"><shadow type="text"/></value><value name="X"><shadow type="math_number"/></value><value name="Y"><shadow type="math_number"/></value><value name="Z"><shadow type="math_number"/></value></block>
  </category>
</xml>`
}

function getCommandToolbox() {
  return `<xml xmlns="https://developers.google.com/blockly/xml" id="toolbox">
  <category name="Logic" colour="%{BKY_LOGIC_HUE}">
    <block type="controls_if"/><block type="logic_compare"/><block type="logic_operation"/>
    <block type="logic_negate"/><block type="logic_boolean"/><block type="logic_ternary"/>
  </category>
  <category name="Loops" colour="%{BKY_LOOPS_HUE}">
    <block type="controls_repeat_ext"><value name="TIMES"><shadow type="math_number"><field name="NUM">10</field></shadow></value></block>
    <block type="controls_whileUntil"/><block type="controls_for"><value name="FROM"><shadow type="math_number"><field name="NUM">1</field></shadow></value><value name="TO"><shadow type="math_number"><field name="NUM">10</field></shadow></value><value name="BY"><shadow type="math_number"><field name="NUM">1</field></shadow></value></block>
  </category>
  <category name="Math" colour="%{BKY_MATH_HUE}">
    <block type="math_number"/><block type="math_arithmetic"/><block type="math_round"/>
  </category>
  <category name="Text" colour="%{BKY_TEXTS_HUE}">
    <block type="text"/><block type="text_join"/><block type="text_append"/><block type="text_print"/>
  </category>
  <sep/>
  <category name="Variables" colour="%{BKY_VARIABLES_HUE}" custom="VARIABLE"/>
  <category name="Functions" colour="%{BKY_PROCEDURES_HUE}" custom="PROCEDURE"/>
  <sep/>
  <category name="Command" colour="120">
    <block type="command_get"/>
  </category>
  <category name="Executor" colour="160">
    <block type="executor_message"><value name="TEXT"><shadow type="text"/></value></block>
    <block type="executor_broadcast"><value name="TEXT"><shadow type="text"/></value></block>
    <block type="executor_command"><value name="COMMAND"><shadow type="text"><field name="TEXT">help</field></shadow></value></block>
    <block type="executor_teleport"/><block type="executor_give"/>
    <block type="executor_set_game_mode"/><block type="executor_permission"/>
    <block type="executor_log"><value name="TEXT"><shadow type="text"/></value></block>
  </category>
  <category name="Player" colour="230">
    <block type="player_get_by_name"><value name="NAME"><shadow type="text"/></value></block>
    <block type="player_get_string"/><block type="player_get_location"/>
  </category>
</xml>`
}
