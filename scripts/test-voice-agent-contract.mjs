import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'

const repoRoot = path.resolve(import.meta.dirname, '..')

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

function exists(relativePath) {
  return fs.existsSync(path.join(repoRoot, relativePath))
}

test('voice is an input channel for the existing ZO_Agent flow', () => {
  assert.ok(exists('src/components/ai/VoiceAgentButton.tsx'), 'VoiceAgentButton component must exist')
  assert.ok(exists('src/app/api/voice/transcribe/route.ts'), 'Voice transcription route must exist')

  const panel = read('src/components/ai/AiAssistPanel.tsx')
  const voice = read('src/components/ai/VoiceAgentButton.tsx')
  const action = read('src/lib/actions/ai-assist.ts')
  const route = read('src/app/api/voice/transcribe/route.ts')
  const controlRoom = read('src/app/(internal)/internal/control-room/page.tsx')

  assert.match(panel, /VoiceAgentButton/, 'Existing agent panel must include the voice button')
  assert.match(panel, /inputMode:\s*'voice'/, 'Voice transcripts must call the existing agent action with inputMode voice')
  assert.match(panel, /Voice transcript/, 'Agent UI must show the voice transcript')
  assert.match(panel, /Agent response/, 'Agent UI must show the agent response')
  assert.match(panel, /Confirm &amp; Create Record/, 'Confirmable actions must still require explicit confirmation')

  for (const state of ['Listening', 'Transcribing', 'Thinking', 'Speaking', 'Microphone unavailable']) {
    assert.ok(voice.includes(state), `Voice UI missing ${state} state`)
  }

  assert.match(voice, /navigator\.mediaDevices\.getUserMedia/, 'Voice button must request microphone access')
  assert.match(voice, /new MediaRecorder/, 'Voice button must use browser audio recording')
  assert.match(voice, /\/api\/voice\/transcribe/, 'Voice button must send audio to the transcription endpoint')
  assert.match(voice, /speechSynthesis/, 'Voice button must provide optional browser TTS when available')

  assert.match(route, /export async function POST/, 'Transcription route must expose POST')
  assert.match(route, /createClient/, 'Transcription route must use existing Supabase auth')
  assert.match(route, /OPENAI_API_KEY/, 'Transcription route must use a configured provider key, not fake transcripts')
  assert.match(route, /return NextResponse\.json\(\{ transcript/, 'Transcription route must return { transcript }')

  assert.match(action, /inputMode\?:\s*AiAssistInputMode/, 'Agent action must accept inputMode')
  assert.match(action, /input_mode:\s*input\.inputMode/, 'Voice input mode must be logged in ai_output_json')
  assert.doesNotMatch(action, /from\('voice_/, 'Voice must not create a separate voice table')
  assert.match(controlRoom, /AiAssistPanel embedded/, 'Home briefing must keep the existing embedded agent panel')
})
