import { useState, useEffect, useCallback, useRef } from 'react'

type TimerState = 'idle' | 'running' | 'paused' | 'finished'

function App() {
  const [title, setTitle] = useState('HACKATHON 2026')
  const [totalSeconds, setTotalSeconds] = useState(24 * 3600) // default 24h
  const [remainingSeconds, setRemainingSeconds] = useState(24 * 3600)
  const [timerState, setTimerState] = useState<TimerState>('idle')
  const [editingTime, setEditingTime] = useState(false)
  const [inputHours, setInputHours] = useState('24')
  const [inputMinutes, setInputMinutes] = useState('00')
  const [inputSeconds, setInputSeconds] = useState('00')
  const prevTimeRef = useRef({ h: 0, m: 0, s: 0 })
  const [changedUnit, setChangedUnit] = useState<'h' | 'm' | 's' | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

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

  // Timer countdown
  useEffect(() => {
    if (timerState !== 'running') return
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
  }, [timerState])

  const progressPercent = totalSeconds > 0
    ? ((totalSeconds - remainingSeconds) / totalSeconds) * 100
    : 0

  const urgencyLevel = totalSeconds > 0 ? remainingSeconds / totalSeconds : 1
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

  const handleStart = useCallback(() => {
    if (timerState === 'idle' || timerState === 'finished') {
      setRemainingSeconds(totalSeconds)
    }
    setTimerState('running')
  }, [timerState, totalSeconds])

  const handlePause = useCallback(() => {
    setTimerState('paused')
  }, [])

  const handleReset = useCallback(() => {
    setTimerState('idle')
    setRemainingSeconds(totalSeconds)
  }, [totalSeconds])

  const handleTimeEdit = useCallback(() => {
    if (timerState === 'running') return
    setEditingTime(true)
    const displaySeconds = timerState === 'idle' ? totalSeconds : remainingSeconds
    setInputHours(String(Math.floor(displaySeconds / 3600)))
    setInputMinutes(String(Math.floor((displaySeconds % 3600) / 60)).padStart(2, '0'))
    setInputSeconds(String(displaySeconds % 60).padStart(2, '0'))
  }, [timerState, totalSeconds, remainingSeconds])

  const handleTimeSave = useCallback(() => {
    const h = Math.min(100, Math.max(0, parseInt(inputHours) || 0))
    const m = Math.min(59, Math.max(0, parseInt(inputMinutes) || 0))
    const s = Math.min(59, Math.max(0, parseInt(inputSeconds) || 0))
    const total = h * 3600 + m * 60 + s
    if (total > 0 && total <= 100 * 3600) {
      setTotalSeconds(total)
      setRemainingSeconds(total)
      setTimerState('idle')
    }
    setEditingTime(false)
  }, [inputHours, inputMinutes, inputSeconds])

  const handleTimeKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleTimeSave()
    if (e.key === 'Escape') setEditingTime(false)
  }, [handleTimeSave])

  const pad = (n: number) => String(n).padStart(2, '0')

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

      {/* Title */}
      <div className="relative z-10 mb-8">
        <div className="text-cyan-500/60 text-xs font-orbitron tracking-[0.5em] uppercase mb-2">
          // countdown active
        </div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="editable-field text-4xl md:text-6xl lg:text-7xl font-orbitron font-black text-cyan-300 glow-text text-center w-full px-4 py-2"
          maxLength={40}
          spellCheck={false}
        />
        <div className="h-[2px] mt-2 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-60" />
      </div>

      {/* Timer Display */}
      <div className="relative z-10 mb-8">
        {editingTime ? (
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
            onClick={handleTimeEdit}
            className={`cursor-pointer group transition-all duration-300 ${timerState === 'running' ? 'cursor-default' : ''}`}
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
            {timerState !== 'running' && (
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
              width: `${progressPercent}%`,
              background: `linear-gradient(90deg, ${getProgressColor()}88, ${getProgressColor()})`,
            }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs font-orbitron">
          <span className="text-cyan-500/50">{progressPercent.toFixed(1)}% ELAPSED</span>
          <span className="text-cyan-500/50">
            {timerState === 'finished' ? 'TIME\'S UP!' : `${(100 - progressPercent).toFixed(1)}% REMAINING`}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="relative z-10 flex gap-4 mb-8">
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
      {/* Subtle reflection */}
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
