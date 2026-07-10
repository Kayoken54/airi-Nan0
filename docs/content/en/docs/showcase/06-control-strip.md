# Desktop Control Strip & Actor Stage

![Desktop Control Strip](/showcase/hero-06-control-strip.avif)

The original Control Island — a hub inside the actor stage window — has been completely deprecated and replaced by the Control Strip. This floating, draggable glassmorphic interaction bar uses `backdrop-blur-xl` and semi-transparent backgrounds in an iOS-style pattern. Mutual exclusion between Main and Gemini/Module strips keeps the desktop clean.

Everything you need is one click away: the profile switcher popover, character popover, 8-emotion picker sub-menu, animation cycle button, ScrollLock mic toggle, manual pure-mic mode, local TTS voice switch popover, and transcription feedback toasts. Interactive status dot indicators show red/green microphone state and a 5-way speech session indicator. The customizer lets you rearrange the button catalog into bottom-placement or left-sidebar layouts.

The Control Strip snaps to screen edges and auto-hides with macOS work area awareness. Popover-aware retention holds the strip expanded whenever a menu is open. Inverted interaction means single-click collapses/expands and double-click toggles the layout — complete with dynamic hover label helper text.

The Actor Stage itself is now a decoupled standalone window: premium rounded-xl borders, a bottom-right drag handle, optimal aspect ratio rendering. It works independently from the main chat/controls window. Touch-gesture dragging support makes touch-screen interaction smooth. Fade-on-hover "Eye" mode keeps the UI nearly invisible when hovering over the model.

## Key Capabilities

- Glassmorphic Control Strip replacing the deprecated Control Island
- Mutual exclusion between Main, Gemini, and Module strips
- 8-emotion picker, voice switching, animation cycling, mic controls
- Customizer with button catalog and left-sidebar layout
- Snap-to-edge auto-hide with popover-aware retention
- Inverted interaction: single-click expand, double-click toggle
- Decoupled Actor Stage with touch-gesture dragging
- Fade-on-hover "Eye" mode, cross-window sync, smart position persistence

> See the [full feature breakdown](/en/docs/chronicles/feature-report#20-desktop-control-strip--actor-stage) in the Feature Report.
