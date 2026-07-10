# Feature Showcase

A visual walkthrough of everything this fork adds to Project AIRI. Click any feature to explore screenshots, key capabilities, and links to detailed documentation.

---

## Character System

<div class="grid-container">

<a href="/en/docs/showcase/01-card-system" class="showcase-card">
  <div class="showcase-card-img">
    <img src="/showcase/hero-01-card-system.avif" alt="AIRI Card Character System" loading="lazy" />
  </div>
  <span class="showcase-card-label">Import, export, and deeply configure characters with a multi-tab editor — native JSON plus SillyTavern PNG compatibility.</span>
</a>

<a href="/en/docs/showcase/02-animadex-wizard" class="showcase-card">
  <div class="showcase-card-img">
    <img src="/showcase/hero-02-animadex-wizard.avif" alt="AnimaDex Guided Card Creator" loading="lazy" />
  </div>
  <span class="showcase-card-label">Multi-step wizard for creating cards from scratch with AI story suggestions, WD14 auto-tagging, and voice auto-assignment.</span>
</a>

</div>

---

## Stage & Models

<div class="grid-container">

<a href="/en/docs/showcase/03-model-selector" class="showcase-card">
  <div class="showcase-card-img">
    <img src="/showcase/hero-03-model-selector.avif" alt="Model Selector" loading="lazy" />
  </div>
  <span class="showcase-card-label">Search, filter, tag, and browse your model collection in dense 4-column or classic 2-column layouts.</span>
</a>

<a href="/en/docs/showcase/04-live2d-system" class="showcase-card">
  <div class="showcase-card-img">
    <img src="/showcase/hero-04-live2d-system.avif" alt="Live2D System" loading="lazy" />
  </div>
  <span class="showcase-card-label">Hold-to-map expressions, multi-moc3 zip normalization, tactile hit zones with audio, and lhack texture editor.</span>
</a>

</div>

---

## Chat & Desktop

<div class="grid-container">

<a href="/en/docs/showcase/05-chatbox-redesign" class="showcase-card">
  <div class="showcase-card-img">
    <img src="/showcase/hero-05-chatbox-redesign.avif" alt="Chatbox Redesign" loading="lazy" />
  </div>
  <span class="showcase-card-label">Three-column workspace with navigation sidebar, context panel, spoken highlights, mood-tagged bubbles, and timeline management.</span>
</a>

<a href="/en/docs/showcase/06-control-strip" class="showcase-card">
  <div class="showcase-card-img">
    <img src="/showcase/hero-06-control-strip.avif" alt="Desktop Control Strip" loading="lazy" />
  </div>
  <span class="showcase-card-label">Floating glassmorphic interaction bar with emotion picker, voice switching, snap-to-edge, and decoupled actor stage.</span>
</a>

</div>

---

## AI & Cognition

<div class="grid-container">

<a href="/en/docs/showcase/07-producer-subsystem" class="showcase-card">
  <div class="showcase-card-img">
    <img src="/showcase/hero-07-producer-subsystem.avif" alt="AI Producer Subsystem" loading="lazy" />
  </div>
  <span class="showcase-card-label">Stateless suggestion engine (Producer Lite) plus campaign orchestration (Producer+) with intimacy engine integration.</span>
</a>

<a href="/en/docs/showcase/08-situational-awareness" class="showcase-card">
  <div class="showcase-card-img">
    <img src="/showcase/hero-08-situational-awareness.avif" alt="Situational Awareness" loading="lazy" />
  </div>
  <span class="showcase-card-label">Characters perceive your desktop — active window, CPU/GPU load, AFK status — and react contextually with believable timing.</span>
</a>

</div>

---

## Creative & Platforms

<div class="grid-container">

<a href="/en/docs/showcase/09-artistry" class="showcase-card">
  <div class="showcase-card-img">
    <img src="/showcase/hero-09-artistry.avif" alt="Artistry & Creative Generation" loading="lazy" />
  </div>
  <span class="showcase-card-label">ComfyUI, Replicate, NanoBanana with BYO workflows, "Imagine" mode, and automated image journal handoff.</span>
</a>

<a href="/en/docs/showcase/10-discord-integration" class="showcase-card">
  <div class="showcase-card-img">
    <img src="/showcase/hero-10-discord-integration.avif" alt="Discord Integration Revamp" loading="lazy" />
  </div>
  <span class="showcase-card-label">Classic TTS pipeline, Gemini Live audio bridge (zero text), slash commands, per-channel isolation, and DM controls.</span>
</a>

</div>

<style>
.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
  margin-bottom: 1rem;
}

.showcase-card {
  display: flex;
  flex-direction: column;
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius, 0.75rem);
  overflow: hidden;
  text-decoration: none !important;
  transition: border-color 0.2s, box-shadow 0.2s;
  background: hsl(var(--card, 0 0% 100%));
}

.showcase-card:hover {
  border-color: hsl(var(--primary));
  box-shadow: 0 2px 16px hsl(var(--primary) / 0.12);
}

.showcase-card-img {
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: hsl(var(--muted, 207 5% 12%));
}

.showcase-card-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.showcase-card-label {
  padding: 0.75rem 1rem;
  font-size: 0.85rem;
  color: hsl(var(--foreground) / 0.8);
  line-height: 1.4;
}
</style>
