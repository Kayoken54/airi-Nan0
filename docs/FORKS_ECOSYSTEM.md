# AIRI Fork Ecosystem Catalog

A living document tracking active forks of [moeru-ai/airi](https://github.com/moeru-ai/airi), sorted by technical interest. Updated periodically by trawling the [forks page](https://github.com/moeru-ai/airi/forks?include=active&page=1&period=2y&sort_by=last_updated).

**Purpose:** Cherry-pick compelling work, spot convergent ideas, and avoid reinventing things that other forks have already solved.

Last surveyed: **June 8, 2026**

---

## 🌟 High Interest — Watch Closely

### [NashChennc/airi](https://github.com/NashChennc/airi)
**Also known as:** NaN in the AIRI Discord

**Background:** M.S. student at LDS@USTC (Laboratory for Data Science, University of Science and Technology of China) researching LLM interpretability and alignment. Author of [NExTGuard](https://arxiv.org/), a training-free framework for streaming LLM safety using Sparse Autoencoders (SAEs). Brings genuine academic AI expertise.

**What they're building:**
- **Alaya Memory Layer** — likely the originator or primary architect of this concept. Designed a planner-centric semantic/episodic memory system with:
  - Neuroscience-inspired time-decay mechanisms
  - Hierarchical consciousness-level memory streams
  - Dispatcher/event-trigger architecture for memory reinforcement and reconsolidation
- **Core Agent extraction** — pulling runtime logic into a `core-agent` module; connected Minecraft and Telegram integrations; working on dispatcher-centric action registries
- **Live2D bug reports** — filed the ZIP archive loading bug (#1933) that was independently fixed in dasilva333/airi ~4-5 weeks prior

**PRs to main:** Yes — multiple, including core agent architecture and Alaya memory design

**Why this matters for dasilva333/airi:**
The Alaya memory architecture is directly adjacent to the work in `PROPOSAL_Dynamic_Memory_RAG_Injection.md`. His academic background in LLM interpretability and SAE-based safety may inform a more principled approach to memory recall and context injection than the purely engineering-driven design in this fork. Worth engaging with directly — there may be complementary ideas or at minimum a shared vocabulary.

---

### [YoukiAkito/airi](https://github.com/YoukiAkito/airi)
**Also known as:** LiMomo

**What they're building:**
- **Alaya memory layer review and optimization** — active PR work on the memory subsystem, likely in collaboration with or building on NashChennc's foundational work
- CI/CD workflow improvements

**PRs to main:** Yes — memory optimization work actively in progress

**Why this matters:**
Two people working on Alaya independently is a signal the architecture has real momentum upstream. Their optimization work may be directly importable once Alaya stabilizes enough to evaluate.

---

### [lulu0119/airi](https://github.com/lulu0119/airi)

**What they're building:**
- **Scale settings UI** — added character view scale controls (PR #1554 and related)
- **AIRI Whiteboard** — proposed and potentially prototyped a whiteboard feature inside AIRI
- **svg-whiteboard-mcp** — standalone MCP server that renders SVG-based whiteboards, usable as an agent tool
- **Shion Eria (詩音エリア)** — a parallel personal project: a custom digital companion built on the [OpenClaw](https://github.com/) framework, a separate runtime for "continuously existing AI assistants"

**PRs to main:** Yes — scale settings, whiteboard concept

**Why this matters:**
The OpenClaw + Shion Eria side project is the interesting thread. They appear to be building a parallel "character workspace persistence" system with different goals than AIRI's browser-first approach. OpenClaw is also the framework where the `NO_REPLY` / `HEARTBEAT_OK` directive convention originates. Worth watching their character architecture decisions as a design reference.

**Cherry-pick candidate:** `svg-whiteboard-mcp` — if AIRI ever wants an agent-driven whiteboard/canvas tool, this is already built.

---

## 🟡 Medium Interest — Check Periodically

### [btechioi/NOVA](https://github.com/btechioi/NOVA)

**What they're building:** Unknown — this fork was renamed from "airi" to **NOVA**, which is the strongest signal of intent to build a distinctly branded independent project rather than a staging branch for upstream PRs.

**PRs to main:** No evidence

**Why this matters:**
The rename is meaningful. Most forks that stay close to upstream don't rename. NOVA suggests a custom character or product vision. The repo has almost no indexed content (very new or intentionally minimal public presence), so confidence is low. Check back in a few weeks.

**Open question:** Is this someone building their own VTuber/companion character on the AIRI stack, or just a personal branding exercise?

---

### [BeanDz/airi](https://github.com/BeanDz/airi)

**What they're building:**
- Stage rendering architecture cleanup — replaced warpdrive plugin with unplug in stage-web/stage-ui
- Electron/Tamagotchi desktop mouse coordinate fixes

**PRs to main:** Yes — merged in v0.10.2

**Why this matters:**
Clean infrastructure contributor focused on the desktop rendering path. Their Electron coordinate work overlaps with areas dasilva333/airi has also touched. Low divergence, high upstream value. Not a cherry-pick target — their work flows back to main.

---

## 📌 Low Interest — Passive Forks

### [CaoMeiYouRen/airi](https://github.com/CaoMeiYouRen/airi)
**Background:** 草梅友仁 — prominent Chinese TypeScript developer and tech blogger known for RSS automation tools (`rss-impact-server`, `push-all-in-one`). Covers AIRI in Chinese developer newsletters on Juejin.

**Assessment:** Reference/observer fork. No code contributions detected. If they ever build something, it would likely be RSS/notification integration tooling — a natural fit given their background. On the radar as a future contributor, not an active one.

---

### [TheTechOddBug/airi](https://github.com/TheTechOddBug/airi)
**Background:** José María Gutiérrez — Spanish developer whose known activity is issue reports to VS Code, Yarn, and related tooling.

**Assessment:** Personal reference fork. No AIRI-specific contributions found. Safe to deprioritize.

---

## Summary Table

| Fork | Person | Type | Divergence | PRs to Main | Focus |
|---|---|---|---|---|---|
| [dasilva333/airi](https://github.com/dasilva333/airi) | Richard | **Independent** | **High** | Selective | Full platform fork — this one |
| [NashChennc/airi](https://github.com/NashChennc/airi) | NaN (LDS@USTC) | Active contributor | Low (staging) | ✅ Yes | Core agent, Alaya memory, LLM alignment research |
| [YoukiAkito/airi](https://github.com/YoukiAkito/airi) | LiMomo | Active contributor | Low (staging) | ✅ Yes | Alaya memory optimization |
| [lulu0119/airi](https://github.com/lulu0119/airi) | lulu0119 | Active contributor | Low (staging) | ✅ Yes | Scale UI, Whiteboard MCP, OpenClaw Shion Eria |
| [btechioi/NOVA](https://github.com/btechioi/NOVA) | Unknown | **Independent?** | Unknown | ❌ None | Renamed fork — NOVA character? |
| [BeanDz/airi](https://github.com/BeanDz/airi) | BeanDz | Active contributor | Low (staging) | ✅ Yes | Stage rendering, Electron desktop |
| [CaoMeiYouRen/airi](https://github.com/CaoMeiYouRen/airi) | 草梅友仁 | Passive | None | ❌ None | Chinese dev blogger, observer |
| [TheTechOddBug/airi](https://github.com/TheTechOddBug/airi) | José María | Passive | None | ❌ None | Spanish developer, observer |

---

## Key Observations

**The Alaya convergence is notable.** Two separate contributors (NashChennc and YoukiAkito) are actively working on the Alaya memory architecture upstream. This is the same problem space addressed in `PROPOSAL_Dynamic_Memory_RAG_Injection.md`. Their work may be worth evaluating once Alaya stabilizes — either as a foundation to build the RAG injection proposal on top of, or as a design reference to learn from and differentiate against.

**Most "forks" are just PR staging branches.** The real activity to track is not the fork repos themselves but the PRs and issues those contributors open on upstream moeru-ai/airi. The fork list is a contributor map, not a divergent-projects map.

**Two genuinely independent forks:** dasilva333/airi (this one) and btechioi/NOVA (unconfirmed). The rest are upstream contributors using the standard fork-PR workflow.

**The competitive/inspiration dynamic mirrors the Shinobu situation.** NashChennc is building memory architecture from an LLM interpretability research angle; dasilva333 is building it from a product engineering angle. Neither is ahead on everything. The approaches are probably more complementary than competing.

---

## How to Update This Document

1. Visit the [forks page](https://github.com/moeru-ai/airi/forks?include=active&page=1&period=2y&sort_by=last_updated) filtered to "Recently updated"
2. Check any forks not already listed here or any listed forks with significant recent activity
3. Update the relevant entries and the "Last surveyed" date at the top
