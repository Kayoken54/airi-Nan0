# AI Producer Subsystem

![AI Producer Subsystem](/showcase/hero-07-producer-subsystem.avif)

The AI Producer is a dual-track suggestions engine that gives characters two completely different modes of proactive interaction. Producer Lite is the game-changer: a fully stateless suggestion engine that operates entirely within the chatbox context using only the local conversation thread. It generates context-aware, user-mimicking interactive suggestions with zero configuration, database records, or storyline setups — it works instantly on any character session. Recently integrated into the Actor Stage, suggestions now appear alongside the character.

The Quick-Suggest magic wand triggers suggestions from your current composer input text. A Play-All button does sequential TTS playback of all alternative paths. Decoupled preview textareas let you edit suggestions before sending. The WhisperDock inside the actor stage provides floating voice control for hands-free interaction.

Producer+ handles the full orchestration side: Producer OE (Open-Ended), GD-IT (Gameshow Host / Initial Turn), and GD-NT (Next Turn) engines tie suggestion choices directly to the Intimacy Engine's variables (`intimacyChange`, `tensionChange`, `mood`), storyline guidelines, local scene settings, and custom encounter rules. Cache-aligned full-context suggestions come with editable prompt templates for custom prompting.

## Key Capabilities

- Producer Lite: stateless, zero-config, works instantly on any session
- Quick-Suggest magic wand triggered from composer input text
- Play-All button for sequential TTS playback of suggestions
- WhisperDock floating voice control in the actor stage
- Producer+: OE, GD-IT, and GD-NT engines with intimacy engine integration
- Cache-aligned full-context suggestions with editable prompt templates
- Eternal Record context injection for deeper historical pattern reference
- Token-driven multi-character synchronization

> See the [full feature breakdown](/en/docs/chronicles/feature-report#17-ai-producer-subsystem) in the Feature Report.
