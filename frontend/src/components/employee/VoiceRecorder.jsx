import { useState, useRef } from 'react'
import { Mic, Square, Upload } from 'lucide-react'

/**
 * Records real audio (MediaRecorder) for playback AND transcribes live
 * (SpeechRecognition) at the same time — same approach as before, just
 * pulled into its own component and given a polished UI.
 *
 * Gracefully degrades: if SpeechRecognition isn't available, recording +
 * playback + manual transcript editing still works. If getUserMedia isn't
 * available at all, falls back to a file upload input.
 */
export default function VoiceRecorder({ transcript, onTranscriptChange }) {
  const [listening, setListening] = useState(false)
  const [audioUrl, setAudioUrl] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const [micUnavailable, setMicUnavailable] = useState(false)

  const recognitionRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)

  const supportsSpeechRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
  const supportsMediaRecorder = typeof window !== 'undefined' && 'MediaRecorder' in window

  const startVoice = async () => {
    setAudioUrl(null)
    setElapsed(0)
    chunksRef.current = []

    if (supportsMediaRecorder) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mediaRecorder = new MediaRecorder(stream)
        mediaRecorder.ondataavailable = (e) => chunksRef.current.push(e.data)
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
          setAudioUrl(URL.createObjectURL(blob))
          stream.getTracks().forEach((track) => track.stop())
        }
        mediaRecorder.start()
        mediaRecorderRef.current = mediaRecorder
      } catch (err) {
        console.error('Microphone access denied or unavailable:', err)
        setMicUnavailable(true)
        return
      }
    } else {
      setMicUnavailable(true)
      return
    }

    if (supportsSpeechRecognition) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'

      recognition.onresult = (event) => {
        const text = event.results[0][0].transcript
        onTranscriptChange((prev) => (prev ? prev + ' ' + text : text))
      }
      recognition.onend = () => setListening(false)
      recognition.onerror = () => setListening(false)

      recognitionRef.current = recognition
      recognition.start()
    }

    setListening(true)
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000)
  }

  const stopVoice = () => {
    recognitionRef.current?.stop()
    mediaRecorderRef.current?.stop()
    clearInterval(timerRef.current)
    setListening(false)
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAudioUrl(URL.createObjectURL(file))
  }

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className="voice-recorder">
      <div className="voice-recorder-heading">
        <span className="voice-icon">🎙️</span>
        <div>
          <p className="voice-title">Prefer speaking?</p>
          <p className="voice-subtitle">Record a voice note</p>
        </div>
      </div>

      {!supportsSpeechRecognition && !micUnavailable && (
        <p className="stt-notice">
          Live transcription isn&apos;t supported in this browser — recording and
          playback still work, and you can type or edit the transcript manually.
        </p>
      )}

      {micUnavailable ? (
        <label className="upload-audio-btn">
          <Upload size={16} /> Upload audio
          <input type="file" accept="audio/*" hidden onChange={handleFileUpload} />
        </label>
      ) : (
        <div className="voice-controls">
          {!listening ? (
            <button type="button" className="record-btn" onClick={startVoice}>
              <Mic size={16} /> Record
            </button>
          ) : (
            <button type="button" className="record-btn recording" onClick={stopVoice}>
              <Square size={14} /> Stop &nbsp;·&nbsp; {formatTime(elapsed)}
            </button>
          )}
          <label className="upload-audio-btn secondary">
            <Upload size={16} /> Upload audio
            <input type="file" accept="audio/*" hidden onChange={handleFileUpload} />
          </label>
        </div>
      )}

      {listening && (
        <div className="recording-indicator">
          <span className="pulse-dot" /> Recording… {formatTime(elapsed)}
        </div>
      )}

      {audioUrl && (
        <div className="voice-playback">
          <audio controls src={audioUrl} />
        </div>
      )}

      {(audioUrl || transcript) && (
        <div className="transcript-block">
          <label>Transcript (edit if needed)</label>
          <textarea
            value={transcript}
            onChange={(e) => onTranscriptChange(e.target.value)}
            rows={3}
            placeholder="Your transcribed feedback will appear here — feel free to correct it."
          />
        </div>
      )}
    </div>
  )
}
