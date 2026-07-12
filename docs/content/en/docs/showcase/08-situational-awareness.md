# Situational Awareness & Proactivity

![Situational Awareness](/showcase/hero-08-situational-awareness.avif)

Characters in this fork don't just respond — they perceive and react to your real-world desktop environment. Real-time OS sensor injection feeds the active window title, program name, and user idle (AFK) status into the LLM context. Activity history tracks which applications you've been using and for how long, enabling grounded and reactive roleplay that references your actual behavior.

Environment telemetry covers CPU/GPU load, system volume (via native sensor, with an AppleScript fallback on macOS to prevent system diagnostics crashes), and local time — characters can coordinate their energy levels or suggestions with your PC's state. Tool-aware proactivity lets the AI fetch contextually relevant tools during proactive evaluation, so a character discussing music can query your system volume or current playback.

Deep Context Awareness means the character knows its own state — when it's blushing, wearing accessories, or what stickers are on screen. Metric-driven milestones track session-level metadata (total turns, journal entries) to trigger special conversational moments. Mid-card-switch proactivity guards and session ownership validation prevent the character from speaking into the wrong session during rapid character changes.

## Key Capabilities

- Real-time OS sensors: active window, program name, AFK status
- Activity history tracking with per-application usage duration
- Environment telemetry: CPU/GPU load, system volume, local time
- AppleScript fallback for active window tracking on macOS
- Tool-aware proactivity fetching contextually relevant tools
- Deep Context Awareness: expression, sticker, and scene awareness
- Metric-driven conversational milestones
- Mid-card-switch proactivity guards and session validation

> See the [full feature breakdown](/en/docs/chronicles/feature-report#18-situational-awareness--proactivity) in the Feature Report.
