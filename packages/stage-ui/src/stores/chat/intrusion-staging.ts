// Module-level staging for cross-window intrusion injection.
// When the secondary window creates a journal moment, it broadcasts the staging data
// via BroadcastChannel. The main window stores it here so performSend can read it.
//
// This file is intentionally separated from chat.ts and memory-text-journal.ts
// to avoid circular imports between those two modules.

export const pendingIntrusionStaging: {
  journal?: { entryText: string, timestamp: number }
  artistry?: { prompt: string, timestamp: number }
} = {}

/** Stage a pending journal entry for injection into the next user turn. */
export function stageJournalIntrusion(data: { entryText: string, timestamp: number }) {
  pendingIntrusionStaging.journal = data
  console.warn('[Intrusion Staging] Journal intrusion staged locally:', data.entryText.substring(0, 50))
}

/** Stage a pending artistry reflection for injection into the next user turn. */
export function stageArtistryIntrusion(data: { prompt: string, timestamp: number }) {
  pendingIntrusionStaging.artistry = data
  console.warn('[Intrusion Staging] Artistry intrusion staged locally:', data.prompt.substring(0, 50))
}

/** Clear the journal staging after it has been consumed by performSend. */
export function clearJournalStaging() {
  delete pendingIntrusionStaging.journal
  console.warn('[Intrusion Staging] Cleared journal staging after injection')
}

/** Clear the artistry staging after it has been consumed by performSend. */
export function clearArtistryStaging() {
  delete pendingIntrusionStaging.artistry
  console.warn('[Intrusion Staging] Cleared artistry staging after injection')
}
