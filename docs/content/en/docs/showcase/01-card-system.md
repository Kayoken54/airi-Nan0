# AIRI Card Character System

![AIRI Card Character System](/showcase/hero-01-card-system.avif)

The AIRI Card system turns characters from thin metadata placeholders into a full-fidelity management experience. Cards are importable, editable, and exportable with all fork-specific extensions preserved — native JSON (`airi-card` v1) and SillyTavern `chara_card_v2` PNG formats are both supported. Backgrounds, outfits, acting metadata, and wardrobes bundle on export, making characters fully portable across machines.

The card editor itself is a multi-tab configuration surface, not a thin form. The **Acting** tab has three prompt layers so you can align the model's face, TTS delivery, and character writing style simultaneously. The **Modules** tab lets a card carry its own chat model, speech provider, avatar, and preferred background — switching characters switches the entire presentation, not just the text persona. **Artistry**, **Generation**, and **Proactivity** tabs turn image generation, LLM tuning, and autonomous behavior into first-class per-character capabilities.

A page-wide dragover backdrop lets you drop SillyTavern `.json` or `.png` cards anywhere on the window for instant import. Duplicates auto-rename. Per-character tool gating lets you disable tool calls for models that don't support them (e.g. RWKV), and blank field preservation means empty system prompt fields stay empty.

## Key Capabilities

- Native JSON export (`airi-card` v1) and SillyTavern `chara_card_v2` PNG import/export
- Multi-tab editor: Acting, Modules, Artistry, Generation, Proactivity
- Background and wardrobe bundling on export — full portability
- Drag-and-drop instant card import with auto-rename on duplicates
- Per-character LLM provider/model/temperature override
- Per-character tool gating and blank field preservation
- Dynamic card export snapshots with active outfit/expression capture
- Responsive card layout: 2-column portrait / 4-column landscape grid

> See the [full feature breakdown](/en/docs/chronicles/feature-report#1-airi-card-character-system) in the Feature Report.
