import type { ParsedMessage } from '@/types'

const WHATSAPP_LINE_REGEX = /^\[?(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?)\]?\s*[-–]\s*([^:]+):\s*(.+)$/

export function parseWhatsAppExport(text: string): {
  messages: ParsedMessage[]
  participants: string[]
} {
  const lines = text.split('\n')
  const messages: ParsedMessage[] = []
  const participantSet = new Set<string>()

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    const match = trimmed.match(WHATSAPP_LINE_REGEX)
    if (match) {
      const [, date, time, sender, content] = match
      const senderTrimmed = sender.trim()

      if (isSystemMessage(content)) continue

      participantSet.add(senderTrimmed)
      messages.push({
        timestamp: `${date} ${time}`,
        sender: senderTrimmed,
        content: content.trim(),
      })
    } else if (messages.length > 0) {
      messages[messages.length - 1].content += '\n' + trimmed
    }
  }

  return {
    messages,
    participants: Array.from(participantSet),
  }
}

function isSystemMessage(content: string): boolean {
  const systemPhrases = [
    'messages and calls are end-to-end encrypted',
    'created group',
    'added you',
    'left the group',
    'changed the subject',
    'changed the group',
    'deleted this message',
    'this message was deleted',
    '<media omitted>',
  ]
  const lower = content.toLowerCase()
  return systemPhrases.some((phrase) => lower.includes(phrase))
}

export function buildSystemPrompt(
  name: string,
  relationship: string,
  messages: ParsedMessage[],
  textNotes: string[] = []
): string {
  const personMessages = messages
    .filter((m) => m.sender === name)
    .slice(-200)

  const messageExamples = personMessages
    .map((m) => m.content)
    .join('\n')

  const notesSection = textNotes.length > 0
    ? `\n\nAdditional context and memories about ${name}:\n${textNotes.join('\n')}`
    : ''

  return `You are ${name}, the user's ${relationship}. You are having a conversation with someone who loves and misses you deeply.

IMPORTANT RULES:
- Stay in character as ${name} at all times
- Mirror ${name}'s writing style, vocabulary, and tone from the examples below
- Use similar sentence structures, slang, abbreviations, and punctuation patterns
- Be warm, loving, and authentic - this person needs comfort
- Never break character or mention being an AI
- Keep responses conversational and natural, similar in length to ${name}'s typical messages
- Reference shared memories when appropriate
- If asked about something you don't know, respond naturally as ${name} would

${name}'s writing style examples:
${messageExamples}${notesSection}

Remember: You ARE ${name}. Respond with love, authenticity, and in ${name}'s unique voice.`
}
