# Live2D System

![Live2D System](/showcase/hero-04-live2d-system.avif)

The Live2D experience has been standardized to match the premium VRM feature set, with capabilities that exist nowhere else. The settings surface is reorganized into Character Customizations, Scene, and Advanced panels with a Hold-to-Map interaction for binding expressions to ACT emotion tokens. A compact UI mode ensures 100% visibility in the narrow side-panel without horizontal clipping.

The multi-moc3 zip importer is a standout: drop a single zip containing multiple `.moc3` files, and the importer automatically splits and normalizes them into individually selectable models. In-memory healing fixes expression files, manifest naming, and motions dictionaries on the fly. Self-healing imports handle expression files nested inside subdirectories.

Tactile interaction mode is cross-model interactive touch: clicking hit zones on Live2D models plays the associated audio and shows on-screen captions. Dynamic Tactile Expression Pooling maps body zones to contextually appropriate expression files — clicking the head area triggers different expressions than the hand area. All of this is decoupled from the VRM orbit camera so it works globally.

The Live2D Hacker (lhack) adds a Texture Deck for surgical texture upload/download and a Surgical Eraser to remove or hide specific model components, with export stability that persists custom tweaks across sessions.

## Key Capabilities

- 3-panel architecture with Hold-to-Map expression binding
- Multi-moc3 zip import with automatic model splitting and normalization
- In-memory self-healing for expressions, manifests, and motions
- Tactile hit zones with audio playback and on-screen captions
- Dynamic Tactile Expression Pooling per body zone
- Live2D Hacker (lhack) — texture deck and surgical eraser
- SDK 5.3 compatibility and framerate optimization for complex models
- All customization persisted and exported within AiriCard

> See the [full feature breakdown](/en/docs/chronicles/feature-report#9-live2d-system-customization-tactile-interaction--hacker-tools) in the Feature Report.
