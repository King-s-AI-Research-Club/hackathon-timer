import { useState, useEffect, useCallback, useRef } from 'react'

type TimerState = 'idle' | 'running' | 'paused' | 'finished'
type TimerMode = 'countdown' | 'target'

function toLocalDatetimeString(date: Date) {
  const y = date.getFullYear()
  const mo = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')
  return `${y}-${mo}-${d}T${h}:${mi}`
}

function App() {
  const [title, setTitle] = useState('HACKATHON 2026')
  const [mode, setMode] = useState<TimerMode>('countdown')
  const [totalSeconds, setTotalSeconds] = useState(24 * 3600)
  const [remainingSeconds, setRemainingSeconds] = useState(24 * 3600)
  const [timerState, setTimerState] = useState<TimerState>('idle')
  const [editingTime, setEditingTime] = useState(false)
  const [inputHours, setInputHours] = useState('24')
  const [inputMinutes, setInputMinutes] = useState('00')
  const [inputSeconds, setInputSeconds] = useState('00')
  const prevTimeRef = useRef({ h: 0, m: 0, s: 0 })
  const [changedUnit, setChangedUnit] = useState<'h' | 'm' | 's' | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Target mode state
  const defaultTarget = new Date(Date.now() + 24 * 3600 * 1000)
  const [targetDatetime, setTargetDatetime] = useState(toLocalDatetimeString(defaultTarget))
  const [targetStartTotal, setTargetStartTotal] = useState(0)

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }, [])

  const hours = Math.floor(remainingSeconds / 3600)
  const minutes = Math.floor((remainingSeconds % 3600) / 60)
  const seconds = remainingSeconds % 60

  // Detect which digit changed for animation
  useEffect(() => {
    const prev = prevTimeRef.current
    if (prev.s !== seconds) setChangedUnit('s')
    else if (prev.m !== minutes) setChangedUnit('m')
    else if (prev.h !== hours) setChangedUnit('h')
    prevTimeRef.current = { h: hours, m: minutes, s: seconds }
    const timer = setTimeout(() => setChangedUnit(null), 300)
    return () => clearTimeout(timer)
  }, [hours, minutes, seconds])

  // Countdown mode timer
  useEffect(() => {
    if (mode !== 'countdown' || timerState !== 'running') return
    const interval = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          setTimerState('finished')
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [timerState, mode])

  // Target mode timer — computes remaining from real clock every second
  useEffect(() => {
    if (mode !== 'target' || timerState !== 'running') return
    const tick = () => {
      const now = Date.now()
      const target = new Date(targetDatetime).getTime()
      const diff = Math.max(0, Math.round((target - now) / 1000))
      setRemainingSeconds(diff)
      if (diff <= 0) setTimerState('finished')
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [timerState, mode, targetDatetime])

  const effectiveTotal = mode === 'target' ? targetStartTotal : totalSeconds
  const progressPercent = effectiveTotal > 0
    ? ((effectiveTotal - remainingSeconds) / effectiveTotal) * 100
    : 0

  const urgencyLevel = effectiveTotal > 0 ? remainingSeconds / effectiveTotal : 1
  const getTimerColor = () => {
    if (timerState === 'finished') return 'text-red-500'
    if (urgencyLevel < 0.1) return 'text-red-400'
    if (urgencyLevel < 0.25) return 'text-orange-400'
    return 'text-cyan-400'
  }

  const getGlowClass = () => {
    if (timerState === 'finished') return 'danger-glow urgency-pulse'
    if (urgencyLevel < 0.1) return 'danger-glow urgency-pulse'
    if (urgencyLevel < 0.25) return 'danger-glow'
    return 'glow-text'
  }

  const getProgressColor = () => {
    if (urgencyLevel < 0.1) return '#ef4444'
    if (urgencyLevel < 0.25) return '#f97316'
    return '#00ffff'
  }

  // --- Countdown mode handlers ---
  const handleStart = useCallback(() => {
    if (mode === 'countdown') {
      if (timerState === 'idle' || timerState === 'finished') {
        setRemainingSeconds(totalSeconds)
      }
    }
    setTimerState('running')
  }, [timerState, totalSeconds, mode])

  const handlePause = useCallback(() => {
    setTimerState('paused')
  }, [])

  const handleReset = useCallback(() => {
    setTimerState('idle')
    if (mode === 'countdown') {
      setRemainingSeconds(totalSeconds)
    } else {
      const diff = Math.max(0, Math.round((new Date(targetDatetime).getTime() - Date.now()) / 1000))
      setRemainingSeconds(diff)
      setTargetStartTotal(diff)
    }
  }, [totalSeconds, mode, targetDatetime])

  const handleTimeEdit = useCallback(() => {
    if (timerState === 'running') return
    setEditingTime(true)
    if (mode === 'countdown') {
      const displaySeconds = timerState === 'idle' ? totalSeconds : remainingSeconds
      setInputHours(String(Math.floor(displaySeconds / 3600)))
      setInputMinutes(String(Math.floor((displaySeconds % 3600) / 60)).padStart(2, '0'))
      setInputSeconds(String(displaySeconds % 60).padStart(2, '0'))
    }
  }, [timerState, totalSeconds, remainingSeconds, mode])

  const handleTimeSave = useCallback(() => {
    if (mode === 'countdown') {
      const h = Math.min(100, Math.max(0, parseInt(inputHours) || 0))
      const m = Math.min(59, Math.max(0, parseInt(inputMinutes) || 0))
      const s = Math.min(59, Math.max(0, parseInt(inputSeconds) || 0))
      const total = h * 3600 + m * 60 + s
      if (total > 0 && total <= 100 * 3600) {
        setTotalSeconds(total)
        setRemainingSeconds(total)
        setTimerState('idle')
      }
    }
    setEditingTime(false)
  }, [inputHours, inputMinutes, inputSeconds, mode])

  const handleTimeKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleTimeSave()
    if (e.key === 'Escape') setEditingTime(false)
  }, [handleTimeSave])

  // --- Target mode handlers ---
  const handleTargetStart = useCallback(() => {
    const target = new Date(targetDatetime).getTime()
    const now = Date.now()
    const diff = Math.max(0, Math.round((target - now) / 1000))
    if (diff <= 0) return
    setTargetStartTotal(diff)
    setRemainingSeconds(diff)
    setTimerState('running')
  }, [targetDatetime])

  // --- Mode switch ---
  const handleModeSwitch = useCallback((newMode: TimerMode) => {
    setTimerState('idle')
    setEditingTime(false)
    setMode(newMode)
    if (newMode === 'countdown') {
      setRemainingSeconds(totalSeconds)
    } else {
      const diff = Math.max(0, Math.round((new Date(targetDatetime).getTime() - Date.now()) / 1000))
      setRemainingSeconds(diff)
      setTargetStartTotal(diff)
    }
  }, [totalSeconds, targetDatetime])

  const pad = (n: number) => String(n).padStart(2, '0')

  const formatTargetDisplay = () => {
    const d = new Date(targetDatetime)
    return d.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="animated-gradient scanlines relative min-h-screen flex flex-col items-center justify-center px-4 py-8 font-rajdhani">
      {/* Floating particles */}
      <Particles />

      {/* Grid floor effect */}
      <div className="absolute bottom-0 left-0 right-0 h-64 opacity-20 overflow-hidden pointer-events-none">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: 'linear-gradient(rgba(0,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.15) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
            transform: 'perspective(500px) rotateX(60deg)',
            transformOrigin: 'bottom',
          }}
        />
      </div>

      {/* Corner decorations */}
      <div className="absolute top-4 left-4 w-16 h-16 border-t-2 border-l-2 border-cyan-500/40" />
      <div className="absolute top-4 right-4 w-16 h-16 border-t-2 border-r-2 border-cyan-500/40" />
      <div className="absolute bottom-4 left-4 w-16 h-16 border-b-2 border-l-2 border-cyan-500/40" />
      <div className="absolute bottom-4 right-4 w-16 h-16 border-b-2 border-r-2 border-cyan-500/40" />

      {/* Fullscreen button */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-6 right-6 z-20 p-2.5 border border-cyan-500/30 rounded-lg bg-gray-900/60 backdrop-blur-sm text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/60 hover:shadow-[0_0_15px_rgba(0,255,255,0.2)] transition-all duration-300 active:scale-90"
        title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
      >
        {isFullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
      </button>

      {/* Mode Toggle */}
      <div className="relative z-10 mb-6">
        <div className="flex items-center gap-1 p-1 border border-cyan-500/20 rounded-xl bg-gray-900/60 backdrop-blur-sm">
          <button
            onClick={() => handleModeSwitch('countdown')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg font-orbitron text-xs tracking-wider transition-all duration-300 ${
              mode === 'countdown'
                ? 'bg-cyan-500/15 text-cyan-300 shadow-[0_0_15px_rgba(0,255,255,0.15)]'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <TimerIcon />
            TIMER
          </button>
          <button
            onClick={() => handleModeSwitch('target')}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg font-orbitron text-xs tracking-wider transition-all duration-300 ${
              mode === 'target'
                ? 'bg-fuchsia-500/15 text-fuchsia-300 shadow-[0_0_15px_rgba(255,0,200,0.15)]'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <CalendarIcon />
            DEADLINE
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="relative z-10 mb-8">
        <div className={`text-xs font-orbitron tracking-[0.5em] uppercase mb-2 ${
          mode === 'target' ? 'text-fuchsia-500/60' : 'text-cyan-500/60'
        }`}>
          {mode === 'countdown' ? '// countdown active' : '// deadline mode'}
        </div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={`editable-field text-4xl md:text-6xl lg:text-7xl font-orbitron font-black text-center w-full px-4 py-2 ${
            mode === 'target'
              ? 'text-fuchsia-300 glow-text-pink'
              : 'text-cyan-300 glow-text'
          }`}
          maxLength={40}
          spellCheck={false}
        />
        <div className={`h-[2px] mt-2 bg-gradient-to-r from-transparent to-transparent opacity-60 ${
          mode === 'target' ? 'via-fuchsia-500' : 'via-cyan-500'
        }`} />
      </div>

      {/* Target date picker (target mode, when not running) */}
      {mode === 'target' && timerState !== 'running' && (
        <div className="relative z-10 mb-4 flex flex-col items-center gap-3">
          <label className="text-fuchsia-400/60 text-xs font-orbitron tracking-widest uppercase">
            Set Deadline
          </label>
          <input
            type="datetime-local"
            value={targetDatetime}
            onChange={(e) => {
              setTargetDatetime(e.target.value)
              const diff = Math.max(0, Math.round((new Date(e.target.value).getTime() - Date.now()) / 1000))
              setRemainingSeconds(diff)
              setTargetStartTotal(diff)
            }}
            min={toLocalDatetimeString(new Date())}
            className="font-orbitron text-sm md:text-base text-fuchsia-300 bg-fuchsia-500/5 border-2 border-fuchsia-500/30 rounded-xl px-4 py-3 focus:outline-none focus:border-fuchsia-400 focus:bg-fuchsia-500/10 focus:shadow-[0_0_30px_rgba(255,0,200,0.15)] transition-all [color-scheme:dark]"
          />
        </div>
      )}

      {/* Target info line when running */}
      {mode === 'target' && timerState === 'running' && (
        <div className="relative z-10 mb-4 text-fuchsia-400/50 text-xs font-orbitron tracking-widest">
          DEADLINE: {formatTargetDisplay()}
        </div>
      )}

      {/* Timer Display */}
      <div className="relative z-10 mb-8">
        {editingTime && mode === 'countdown' ? (
          <div className="flex items-center gap-2 md:gap-4">
            <TimeInput
              value={inputHours}
              onChange={setInputHours}
              onKeyDown={handleTimeKeyDown}
              max={100}
              label="HRS"
              autoFocus
            />
            <span className="text-5xl md:text-7xl font-orbitron font-bold text-cyan-500/50">:</span>
            <TimeInput
              value={inputMinutes}
              onChange={setInputMinutes}
              onKeyDown={handleTimeKeyDown}
              max={59}
              label="MIN"
            />
            <span className="text-5xl md:text-7xl font-orbitron font-bold text-cyan-500/50">:</span>
            <TimeInput
              value={inputSeconds}
              onChange={setInputSeconds}
              onKeyDown={handleTimeKeyDown}
              max={59}
              label="SEC"
            />
          </div>
        ) : (
          <div
            onClick={mode === 'countdown' ? handleTimeEdit : undefined}
            className={`group transition-all duration-300 ${
              mode === 'countdown' && timerState !== 'running' ? 'cursor-pointer' : 'cursor-default'
            }`}
          >
            <div className={`flex items-baseline gap-1 md:gap-3 font-orbitron font-black ${getTimerColor()} ${getGlowClass()}`}>
              <DigitBlock value={pad(hours)} changed={changedUnit === 'h'} />
              <span className="text-5xl md:text-8xl lg:text-9xl opacity-50 pulse-ring">:</span>
              <DigitBlock value={pad(minutes)} changed={changedUnit === 'm'} />
              <span className="text-5xl md:text-8xl lg:text-9xl opacity-50 pulse-ring">:</span>
              <DigitBlock value={pad(seconds)} changed={changedUnit === 's'} />
            </div>
            <div className="flex justify-around px-4 mt-2">
              <span className="text-cyan-500/40 text-sm font-orbitron tracking-widest">HOURS</span>
              <span className="text-cyan-500/40 text-sm font-orbitron tracking-widest">MINUTES</span>
              <span className="text-cyan-500/40 text-sm font-orbitron tracking-widest">SECONDS</span>
            </div>
            {mode === 'countdown' && timerState !== 'running' && (
              <div className="text-cyan-500/30 text-xs font-orbitron mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                [ CLICK TO EDIT ]
              </div>
            )}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="relative z-10 w-full max-w-2xl mb-8">
        <div className="neon-border rounded-full h-3 bg-gray-900/80 border border-cyan-500/20 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-linear progress-glow"
            style={{
              width: `${Math.min(100, progressPercent)}%`,
              background: `linear-gradient(90deg, ${getProgressColor()}88, ${getProgressColor()})`,
            }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs font-orbitron">
          <span className="text-cyan-500/50">{Math.min(100, progressPercent).toFixed(1)}% ELAPSED</span>
          <span className="text-cyan-500/50">
            {timerState === 'finished' ? 'TIME\'S UP!' : `${Math.max(0, 100 - progressPercent).toFixed(1)}% REMAINING`}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="relative z-10 flex flex-wrap justify-center gap-4 mb-8">
        {mode === 'countdown' ? (
          <>
            {timerState === 'running' ? (
              <Button onClick={handlePause} color="amber">
                <PauseIcon /> PAUSE
              </Button>
            ) : (
              <Button onClick={handleStart} color="cyan">
                <PlayIcon /> {timerState === 'paused' ? 'RESUME' : 'START'}
              </Button>
            )}
            <Button onClick={handleReset} color="red">
              <ResetIcon /> RESET
            </Button>
            {!editingTime && timerState !== 'running' && (
              <Button onClick={handleTimeEdit} color="purple">
                <EditIcon /> EDIT
              </Button>
            )}
            {editingTime && (
              <Button onClick={handleTimeSave} color="green">
                <CheckIcon /> SAVE
              </Button>
            )}
          </>
        ) : (
          <>
            {timerState === 'running' ? (
              <Button onClick={() => setTimerState('idle')} color="amber">
                <PauseIcon /> STOP
              </Button>
            ) : (
              <Button onClick={handleTargetStart} color="cyan">
                <PlayIcon /> {timerState === 'finished' ? 'RESTART' : 'START'}
              </Button>
            )}
            <Button onClick={handleReset} color="red">
              <ResetIcon /> RESET
            </Button>
          </>
        )}
      </div>

      {/* Status indicator */}
      <div className="relative z-10 flex items-center gap-3 text-sm font-orbitron">
        <div className={`w-2 h-2 rounded-full ${
          timerState === 'running' ? 'bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.7)]' :
          timerState === 'paused' ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.7)]' :
          timerState === 'finished' ? 'bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.7)]' :
          'bg-cyan-400/50'
        }`} />
        <span className="text-gray-500 tracking-widest uppercase">
          Status: {timerState === 'idle' ? 'Ready' : timerState}
          {mode === 'target' && timerState === 'idle' ? ' — Deadline mode' : ''}
        </span>
      </div>

      {/* Finished overlay */}
      {timerState === 'finished' && <FinishedOverlay onReset={handleReset} />}
    </div>
  )
}

function DigitBlock({ value, changed }: { value: string; changed: boolean }) {
  return (
    <div className="relative">
      <span className={`text-6xl md:text-8xl lg:text-9xl tabular-nums ${changed ? 'digit-flip' : ''}`}>
        {value}
      </span>
      <div className="absolute -bottom-4 left-0 right-0 text-6xl md:text-8xl lg:text-9xl opacity-[0.07] scale-y-[-1] blur-[2px] tabular-nums pointer-events-none select-none" aria-hidden>
        {value}
      </div>
    </div>
  )
}

function TimeInput({
  value,
  onChange,
  onKeyDown,
  max,
  label,
  autoFocus,
}: {
  value: string
  onChange: (v: string) => void
  onKeyDown: (e: React.KeyboardEvent) => void
  max: number
  label: string
  autoFocus?: boolean
}) {
  return (
    <div className="flex flex-col items-center">
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const v = Math.min(max, Math.max(0, parseInt(e.target.value) || 0))
          onChange(String(v))
        }}
        onKeyDown={onKeyDown}
        min={0}
        max={max}
        autoFocus={autoFocus}
        className="w-24 md:w-36 text-5xl md:text-7xl font-orbitron font-black text-cyan-300 bg-cyan-500/5 border-2 border-cyan-500/30 rounded-xl text-center focus:outline-none focus:border-cyan-400 focus:bg-cyan-500/10 focus:shadow-[0_0_30px_rgba(0,255,255,0.2)] transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <span className="text-cyan-500/40 text-xs font-orbitron mt-1 tracking-widest">{label}</span>
    </div>
  )
}

function Button({
  onClick,
  color,
  children,
}: {
  onClick: () => void
  color: 'cyan' | 'red' | 'amber' | 'purple' | 'green'
  children: React.ReactNode
}) {
  const colors = {
    cyan: 'border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 hover:shadow-[0_0_20px_rgba(0,255,255,0.2)]',
    red: 'border-red-500/50 text-red-400 hover:bg-red-500/10 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]',
    amber: 'border-amber-500/50 text-amber-400 hover:bg-amber-500/10 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]',
    purple: 'border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]',
    green: 'border-green-500/50 text-green-400 hover:bg-green-500/10 hover:shadow-[0_0_20px_rgba(34,197,94,0.2)]',
  }

  return (
    <button
      onClick={onClick}
      className={`btn-futuristic flex items-center gap-2 px-6 py-3 border-2 rounded-xl font-orbitron font-bold text-sm tracking-wider bg-gray-900/50 backdrop-blur-sm transition-all duration-300 active:scale-95 ${colors[color]}`}
    >
      {children}
    </button>
  )
}

function FinishedOverlay({ onReset }: { onReset: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="text-6xl md:text-9xl font-orbitron font-black text-red-500 danger-glow urgency-pulse mb-8">
        TIME'S UP!
      </div>
      <div className="text-gray-400 font-rajdhani text-xl mb-8">The countdown has reached zero.</div>
      <button
        onClick={onReset}
        className="btn-futuristic px-8 py-4 border-2 border-cyan-500/50 text-cyan-400 rounded-xl font-orbitron font-bold tracking-wider bg-gray-900/50 hover:bg-cyan-500/10 hover:shadow-[0_0_30px_rgba(0,255,255,0.3)] transition-all duration-300 active:scale-95"
      >
        RESTART TIMER
      </button>
    </div>
  )
}

function Particles() {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 20,
    duration: 10 + Math.random() * 20,
    size: 1 + Math.random() * 3,
  }))

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-cyan-400/30"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            animation: `float-up ${p.duration}s linear ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

// SVG Icons
function PlayIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  )
}

function ResetIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 000-1.41l-2.34-2.34a.996.996 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
    </svg>
  )
}

function TimerIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42A8.962 8.962 0 0012 4c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-2.12-.74-4.07-1.97-5.61zM12 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z" />
    </svg>
  )
}

function FullscreenIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />
    </svg>
  )
}

function ExitFullscreenIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3" />
    </svg>
  )
}

export default App
