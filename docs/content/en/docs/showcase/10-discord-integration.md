# Discord Integration Revamp

![Discord Integration](/showcase/hero-10-discord-integration.avif)

The Discord bot integration has been rebuilt from the ground up — upstream doesn't have one in functional form. The Classic TTS Voice Pipeline chains Discord Audio → Deepgram STT → Custom LLM → Custom TTS → Discord Audio, with browser-side 24kHz PCM resampling and raw streaming into the active connection's voice player. Self-speaker muting prevents echo-back, and STT ingestion auto-injects voice channel transcripts into chat sessions.

The Bidirectional Gemini Live Audio Bridge is a pure JS audio pipeline connecting Discord voice channels directly to Gemini Live sessions. Audio-to-audio — zero text involved. The auto-session lifecycle starts and stops Gemini Live based on channel activity, with `/summon` and `/leave` voice commands for manual control.

Ten slash commands (`/status`, `/imagine`, `/character`, `/new`, `/history`, `/director`, `/vision`, `/selfie`, `/timelines`, `/journalmoment`) expose full control. The image pipeline lets companions "see" Discord image attachments (via VLM routing) and send visual manifestations back. Per-channel isolation maps each channel to its own character and session. Interaction modes (Queue vs. Steer) let you choose ordered processing or proactive/reactive flow, and the NO_REPLY hook lets the AI intelligently decide to stay silent.

## Key Capabilities

- Classic TTS pipeline: Discord → STT → LLM → TTS → Discord (raw PCM streaming)
- Bidirectional Gemini Live Audio Bridge: audio-to-audio with zero text
- Auto-session lifecycle with `/summon` and `/leave` voice commands
- 10 slash commands: `/status`, `/vision`, `/selfie`, `/timelines`, `/journalmoment`, and more
- Image pipeline: VLM routing for attachments + visual manifestations out
- Per-channel isolation with `channelId → character → session` mapping
- DM access control with sync isolation
- Queue vs. Steer interaction modes with NO_REPLY intelligent silence

> See the [full feature breakdown](/en/docs/chronicles/feature-report#24-discord-integration-revamp) in the Feature Report.
>
> See the [Discord Commands manual](/en/docs/manual/config/discord-commands) for full configuration details.
