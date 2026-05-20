import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import hljs from 'highlight.js/lib/core'
import java from 'highlight.js/lib/languages/java'
import { getProject, setProject, clearProject, setProjectProp } from '../utils/store.js'
import { exportProject, saveProjectFile } from '../utils/export.js'
import ConfirmModal from '../components/ConfirmModal.jsx'
import InputModal from '../components/InputModal.jsx'

hljs.registerLanguage('java', java)

// Toolbox XML content (raw strings)
const TOOLBOX_EVENT_ID = 'event'
const TOOLBOX_COMMAND_ID = 'command'

export default function EditorPage() {
  const navigate = useNavigate()
  const workspaceRef = useRef(null)
  const blocklyRef = useRef(null)
  const codeRef = useRef(null)
  const currentFileRef = useRef(null)

  const [project, setLocalProject] = useState(getProject)
  const [currentFile, setCurrentFile] = useState(null)
  const [generatedCode, setGeneratedCode] = useState('')
  const [isReady, setIsReady] = useState(false)
  const [confirmModal, setConfirmModal] = useState(null)
  const [inputModal, setInputModal] = useState(null)
  const [showCodePanel, setShowCodePanel] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  // Keep currentFileRef in sync
  useEffect(() => { currentFileRef.current = currentFile }, [currentFile])

  // Initialize Blockly
  useEffect(() => {
    const Blockly = window.Blockly
    if (!Blockly) {
      console.error('Blockly not loaded. Check script tags in index.html.')
      return
    }

    // Override Blockly's built-in prompt with browser prompt
    Blockly.dialog.prompt = (message, defaultValue, callback) => {
      const result = window.prompt(message, defaultValue)
      callback(result)
    }
    Blockly.dialog.alert = (message, callback) => {
      window.alert(message)
      if (callback) callback()
    }
    Blockly.dialog.confirm = (message, callback) => {
      callback(window.confirm(message))
    }

    const workspace = Blockly.inject(workspaceRef.current, {
      grid: { spacing: 24, length: 2, colour: '#1e1e38', snap: true },
      readOnly: false,
      move: { scrollbars: true, drag: true, wheel: true },
      toolbox: getEmptyToolbox(),
      theme: buildDarkTheme(Blockly),
      zoom: {
        controls: true,
        wheel: true,
        startScale: 0.9,
        maxScale: 4,
        minScale: 0.2,
        scaleSpeed: 1.1
      },
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

        // Persist workspace state
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
    const toolbox = fileData.type === 'event'
      ? getEventToolbox()
      : getCommandToolbox()
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
      title: `New ${type === 'event' ? 'Event' : 'Command'}`,
      message: 'Enter a name (PascalCase):',
      placeholder: type === 'event' ? 'MyEvent' : 'MyCommand',
      onConfirm: (name) => {
        setInputModal(null)
        if (!name?.trim()) return
        const trimmed = name.trim().replace(/\s/g, '')
        const proj = getProject()
        if (!proj) return
        if (proj.finder.some((f) => f.name === trimmed)) {
          window.alert(`A file named "${trimmed}" already exists.`)
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
      title: 'Delete File',
      message: `Delete "${fileData.name}"? This cannot be undone.`,
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
      title: 'New Project',
      message: 'Start a new project? All unsaved changes will be lost.',
      onConfirm: () => {
        setConfirmModal(null)
        clearProject()
        navigate('/')
      },
      onCancel: () => setConfirmModal(null)
    })
  }

  const finder = project?.finder || []

  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      {/* ===== SIDEBAR ===== */}
      <aside className="w-56 flex flex-col bg-gray-900 border-r border-gray-800 flex-shrink-0">
        {/* Project header */}
        <div className="px-4 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center flex-shrink-0">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-white truncate">{project?.projectName}</span>
          </div>
          <p className="text-xs text-gray-600 pl-8">{project?.groupId}</p>
        </div>

        {/* NEW file buttons */}
        <div className="px-3 py-3 border-b border-gray-800">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 px-1">New</p>
          <div className="flex gap-2">
            <button
              onClick={() => createFile('event')}
              className="flex-1 flex items-center justify-center gap-1 text-xs bg-gray-800 hover:bg-indigo-600 text-gray-300 hover:text-white py-2 px-2 rounded-lg transition-all duration-150 border border-gray-700 hover:border-indigo-500"
            >
              <EventIcon />
              Event
            </button>
            <button
              onClick={() => createFile('command')}
              className="flex-1 flex items-center justify-center gap-1 text-xs bg-gray-800 hover:bg-indigo-600 text-gray-300 hover:text-white py-2 px-2 rounded-lg transition-all duration-150 border border-gray-700 hover:border-indigo-500"
            >
              <CommandIcon />
              CMD
            </button>
          </div>
        </div>

        {/* File finder */}
        <div className="flex-1 overflow-y-auto py-2">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider px-4 py-1">Files</p>
          {finder.length === 0 ? (
            <p className="text-xs text-gray-700 px-4 py-3 italic">No files yet. Create an Event or Command.</p>
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

        {/* Bottom actions */}
        <div className="border-t border-gray-800 px-3 py-3 space-y-1.5">
          <button
            onClick={handleExport}
            disabled={isExporting || finder.length === 0}
            className="w-full flex items-center justify-center gap-2 text-xs bg-indigo-600/80 hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed text-white py-2 px-3 rounded-lg transition-colors"
          >
            <DownloadIcon />
            {isExporting ? 'Exporting...' : 'Export ZIP'}
          </button>
          <button
            onClick={() => saveProjectFile(getProject())}
            className="w-full flex items-center justify-center gap-2 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 px-3 rounded-lg transition-colors"
          >
            <SaveIcon />
            Save .plocky
          </button>
          <button
            onClick={handleNewProject}
            className="w-full flex items-center justify-center gap-2 text-xs text-gray-600 hover:text-red-400 py-1.5 transition-colors"
          >
            New Project
          </button>
        </div>
      </aside>

      {/* ===== WORKSPACE ===== */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-950 z-10">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Loading workspace...</p>
            </div>
          </div>
        )}
        {currentFile === null && isReady && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center opacity-30">
              <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 text-sm">Double-click a file to open it</p>
            </div>
          </div>
        )}
        <div ref={workspaceRef} className="blockly-workspace flex-1" />
      </main>

      {/* ===== CODE PANEL ===== */}
      {showCodePanel && (
        <aside className="w-72 flex flex-col bg-gray-900 border-l border-gray-800 flex-shrink-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Generated Java</span>
            <button
              onClick={() => setShowCodePanel(false)}
              className="text-gray-600 hover:text-gray-400 transition-colors"
              title="Hide code panel"
            >
              <ChevronRightIcon />
            </button>
          </div>
          <div className="code-viewer flex-1 overflow-auto bg-gray-950">
            {generatedCode ? (
              <pre
                className="hljs"
                dangerouslySetInnerHTML={{
                  __html: hljs.highlight(generatedCode, { language: 'java' }).value
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-700 text-xs italic">Open a file to see generated code</p>
              </div>
            )}
          </div>
        </aside>
      )}

      {/* Show code panel toggle (when hidden) */}
      {!showCodePanel && (
        <button
          onClick={() => setShowCodePanel(true)}
          className="absolute right-0 top-1/2 -translate-y-1/2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-400 hover:text-white px-2 py-4 rounded-l-lg transition-colors z-10"
          title="Show code panel"
        >
          <ChevronLeftIcon />
        </button>
      )}

      {/* Modals */}
      {confirmModal && <ConfirmModal {...confirmModal} />}
      {inputModal && <InputModal {...inputModal} />}
    </div>
  )
}

function FileItem({ fileData, isActive, onClick, onDelete }) {
  const [showDelete, setShowDelete] = useState(false)
  const typeColor = fileData.type === 'event' ? 'text-green-400' : 'text-blue-400'
  const typeBg = fileData.type === 'event' ? 'bg-green-400/10' : 'bg-blue-400/10'

  return (
    <div
      className={`file-item flex items-center justify-between px-3 py-2 mx-2 my-0.5 rounded-lg cursor-pointer group ${isActive ? 'active' : ''}`}
      onClick={onClick}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${typeBg} ${typeColor} flex-shrink-0`}>
          {fileData.type === 'event' ? 'E' : 'C'}
        </span>
        <span className="text-sm text-gray-300 truncate font-medium">{fileData.name}</span>
      </div>
      {showDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="text-gray-600 hover:text-red-400 transition-colors flex-shrink-0 ml-2"
          title="Delete file"
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

function buildDarkTheme(Blockly) {
  if (!Blockly.Theme) return undefined
  try {
    return Blockly.Theme.defineTheme('plocky_dark', {
      base: Blockly.Themes?.Classic,
      componentStyles: {
        workspaceBackgroundColour: '#0a0a12',
        toolboxBackgroundColour: '#0f0f1a',
        toolboxForegroundColour: '#c0c0e0',
        flyoutBackgroundColour: '#14141e',
        flyoutForegroundColour: '#c0c0e0',
        flyoutOpacity: 1,
        scrollbarColour: '#3a3a5c',
        insertionMarkerColour: '#6366f1',
        insertionMarkerOpacity: 0.5,
        markerColour: '#6366f1',
        cursorColour: '#6366f1',
      },
      fontStyle: { family: "'JetBrains Mono', monospace", size: 11 }
    })
  } catch {
    return undefined
  }
}

function getEmptyToolbox() {
  return '<xml xmlns="https://developers.google.com/blockly/xml"></xml>'
}

const STANDARD_CATEGORIES = `
  <category name="Logic" colour="%{BKY_LOGIC_HUE}">
    <block type="controls_if"/><block type="logic_compare"/><block type="logic_operation"/>
    <block type="logic_negate"/><block type="logic_boolean"/><block type="logic_ternary"/>
  </category>
  <category name="Loops" colour="%{BKY_LOOPS_HUE}">
    <block type="controls_repeat_ext"><value name="TIMES"><shadow type="math_number"><field name="NUM">10</field></shadow></value></block>
    <block type="controls_whileUntil"/>
    <block type="controls_for"><value name="FROM"><shadow type="math_number"><field name="NUM">1</field></shadow></value><value name="TO"><shadow type="math_number"><field name="NUM">10</field></shadow></value><value name="BY"><shadow type="math_number"><field name="NUM">1</field></shadow></value></block>
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
  <sep/>`

const EXECUTOR_CATEGORY = `
  <category name="⚙️ Executor" colour="160">
    <block type="executor_message"><value name="TEXT"><shadow type="text"/></value></block>
    <block type="executor_action_bar"><value name="TEXT"><shadow type="text"/></value></block>
    <block type="executor_send_title"><value name="TITLE"><shadow type="text"/></value><value name="SUBTITLE"><shadow type="text"/></value><value name="FADE_IN"><shadow type="math_number"><field name="NUM">10</field></shadow></value><value name="STAY"><shadow type="math_number"><field name="NUM">70</field></shadow></value><value name="FADE_OUT"><shadow type="math_number"><field name="NUM">20</field></shadow></value></block>
    <block type="executor_broadcast"><value name="TEXT"><shadow type="text"/></value></block>
    <block type="executor_log"><value name="TEXT"><shadow type="text"/></value></block>
    <block type="executor_kill"/>
    <block type="executor_kick"><value name="DUE"><shadow type="text"/></value></block>
    <block type="executor_teleport"/>
    <block type="executor_velocity"><value name="X"><shadow type="math_number"/></value><value name="Y"><shadow type="math_number"><field name="NUM">1</field></shadow></value><value name="Z"><shadow type="math_number"/></value></block>
    <block type="executor_set_health"><value name="HEALTH"><shadow type="math_number"><field name="NUM">20</field></shadow></value></block>
    <block type="executor_set_max_health"><value name="HEALTH"><shadow type="math_number"><field name="NUM">20</field></shadow></value></block>
    <block type="executor_set_saturation"><value name="SATURATION"><shadow type="math_number"><field name="NUM">20</field></shadow></value></block>
    <block type="executor_set_exp"><value name="EXP"><shadow type="math_number"/></value></block>
    <block type="executor_give_exp"><value name="AMOUNT"><shadow type="math_number"><field name="NUM">100</field></shadow></value></block>
    <block type="executor_set_game_mode"/>
    <block type="executor_set_fly_mode"/>
    <block type="executor_set_walk_speed"><value name="SPEED"><shadow type="math_number"><field name="NUM">0.2</field></shadow></value></block>
    <block type="executor_set_fly_speed"><value name="SPEED"><shadow type="math_number"><field name="NUM">0.1</field></shadow></value></block>
    <block type="executor_set_display_name"><value name="NAME"><shadow type="text"/></value></block>
    <block type="executor_give"/>
    <block type="executor_set_item"><value name="SLOT"><shadow type="math_number"/></value></block>
    <block type="executor_clear_inventory"/>
    <block type="executor_close_gui"/>
    <block type="executor_burn"><value name="TIME"><shadow type="math_number"><field name="NUM">60</field></shadow></value></block>
    <block type="executor_play_sound"><value name="SOUND"><shadow type="text"><field name="TEXT">ENTITY_PLAYER_LEVELUP</field></shadow></value><value name="VOLUME"><shadow type="math_number"><field name="NUM">1</field></shadow></value><value name="PITCH"><shadow type="math_number"><field name="NUM">1</field></shadow></value></block>
    <block type="executor_potion"><value name="POTION"><shadow type="text"><field name="TEXT">SPEED</field></shadow></value><value name="TIER"><shadow type="math_number"/></value><value name="TIME"><shadow type="math_number"><field name="NUM">200</field></shadow></value></block>
    <block type="executor_clear_potion"/>
    <block type="executor_explosion"><value name="POWER"><shadow type="math_number"><field name="NUM">4</field></shadow></value></block>
    <block type="executor_lightning"/>
    <block type="executor_set_block"><value name="MATERIAL"><shadow type="text"><field name="TEXT">STONE</field></shadow></value></block>
    <block type="executor_clear_entity"><value name="RADIUS"><shadow type="math_number"><field name="NUM">10</field></shadow></value></block>
    <block type="executor_time"><value name="WORLD"><shadow type="text"><field name="TEXT">world</field></shadow></value><value name="TIME"><shadow type="math_number"><field name="NUM">6000</field></shadow></value></block>
    <block type="executor_weather"><value name="WORLD"><shadow type="text"><field name="TEXT">world</field></shadow></value></block>
    <block type="executor_command"><value name="COMMAND"><shadow type="text"><field name="TEXT">help</field></shadow></value></block>
    <block type="executor_op_command"><value name="COMMAND"><shadow type="text"><field name="TEXT">op Player</field></shadow></value></block>
    <block type="executor_console_command"><value name="COMMAND"><shadow type="text"><field name="TEXT">say hello</field></shadow></value></block>
    <block type="executor_money"><value name="MONEY"><shadow type="math_number"><field name="NUM">100</field></shadow></value></block>
    <block type="executor_permission"><value name="PERMISSION"><shadow type="text"><field name="TEXT">my.permission</field></shadow></value></block>
    <block type="executor_db_put"><value name="KEY"><shadow type="text"/></value></block>
    <block type="executor_db_save"/>
    <block type="executor_wait"><value name="TIME"><shadow type="math_number"><field name="NUM">20</field></shadow></value></block>
    <block type="executor_exit"/>
  </category>`

const PLAYER_CATEGORY = `
  <category name="👤 Player" colour="230">
    <block type="player_get_by_name"><value name="NAME"><shadow type="text"/></value></block>
    <block type="player_get_by_uuid"><value name="UUID"><shadow type="text"/></value></block>
    <block type="player_get_string"/>
    <block type="player_get_number"/>
    <block type="player_get_boolean"/>
    <block type="player_get_location"/>
    <block type="player_get_item"/>
    <block type="player_has_permission"><value name="PERMISSION"><shadow type="text"><field name="TEXT">my.permission</field></shadow></value></block>
    <block type="player_get_any"><value name="KEY"><shadow type="text"/></value></block>
    <block type="player_get_online_players"/>
  </category>`

const LOCATION_CATEGORY = `
  <category name="📍 Location" colour="290">
    <block type="location"><value name="WORLD"><shadow type="text"><field name="TEXT">world</field></shadow></value><value name="X"><shadow type="math_number"/></value><value name="Y"><shadow type="math_number"><field name="NUM">64</field></shadow></value><value name="Z"><shadow type="math_number"/></value></block>
    <block type="location_get_coord"/>
    <block type="location_get_world"/>
    <block type="location_get_block_type"/>
    <block type="location_add"><value name="X"><shadow type="math_number"/></value><value name="Y"><shadow type="math_number"/></value><value name="Z"><shadow type="math_number"/></value></block>
    <block type="location_distance"/>
  </category>`

const ITEM_CATEGORY = `
  <category name="📦 Item" colour="345">
    <block type="item_create"><value name="MATERIAL"><shadow type="text"><field name="TEXT">DIAMOND</field></shadow></value></block>
    <block type="item_create_with_amount"><value name="MATERIAL"><shadow type="text"><field name="TEXT">STONE</field></shadow></value><value name="AMOUNT"><shadow type="math_number"><field name="NUM">1</field></shadow></value></block>
    <block type="item_get_type"/>
    <block type="item_get_amount"/>
    <block type="item_is_air"/>
    <block type="item_set_display_name"><value name="NAME"><shadow type="text"/></value></block>
    <block type="item_set_lore"><value name="LORE"><shadow type="text"/></value></block>
  </category>`

const WORLD_CATEGORY = `
  <category name="🌍 World" colour="120">
    <block type="world_get"><value name="NAME"><shadow type="text"><field name="TEXT">world</field></shadow></value></block>
    <block type="world_get_block_at"/>
    <block type="world_spawn_entity"><value name="ENTITY_TYPE"><shadow type="text"><field name="TEXT">ZOMBIE</field></shadow></value></block>
    <block type="world_get_time"/>
    <block type="world_set_time"><value name="TIME"><shadow type="math_number"><field name="NUM">6000</field></shadow></value></block>
    <block type="world_get_weather"/>
    <block type="world_set_weather"/>
    <block type="world_get_players"/>
  </category>`

function getEventToolbox() {
  return `<xml xmlns="https://developers.google.com/blockly/xml" id="toolbox">${STANDARD_CATEGORIES}
  <category name="⚡ Event" colour="65">
    <block type="event_server_state_change"/>
    <block type="event_player_join"/>
    <block type="event_player_quit"/>
    <block type="event_player_walk"/>
    <block type="event_player_death"/>
    <block type="event_player_respawn"/>
    <block type="event_player_interact"/>
    <block type="event_chat"/>
    <block type="event_block_break"/>
    <block type="event_block_place"/>
    <block type="event_entity_damage"/>
    <block type="event_entity_damage_by_entity"/>
    <block type="event_inventory"/>
    <block type="event_get"/>
    <block type="event_cancel"/>
    <block type="event_set_message"><value name="MESSAGE"><shadow type="text"/></value></block>
    <block type="event_set_damage"><value name="DAMAGE"><shadow type="math_number"/></value></block>
  </category>${EXECUTOR_CATEGORY}${PLAYER_CATEGORY}${LOCATION_CATEGORY}${ITEM_CATEGORY}${WORLD_CATEGORY}
</xml>`
}

function getCommandToolbox() {
  return `<xml xmlns="https://developers.google.com/blockly/xml" id="toolbox">${STANDARD_CATEGORIES}
  <category name="🗨️ Command" colour="65">
    <block type="command_get"/>
    <block type="command_player"/>
    <block type="command_check_sender_is_player"/>
    <block type="command_arg"><value name="INDEX"><shadow type="math_number"/></value></block>
    <block type="command_args_length"/>
    <block type="command_has_args"/>
  </category>${EXECUTOR_CATEGORY}${PLAYER_CATEGORY}${LOCATION_CATEGORY}${ITEM_CATEGORY}${WORLD_CATEGORY}
</xml>`
}

// Icons
function EventIcon() {
  return <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
}
function CommandIcon() {
  return <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
}
function DownloadIcon() {
  return <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
}
function SaveIcon() {
  return <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
  </svg>
}
function ChevronRightIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
}
function ChevronLeftIcon() {
  return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
}
