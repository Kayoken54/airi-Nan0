# Release Notes: AIRI v0.9.8-stable.20260611

Welcome to **AIRI v0.9.8-stable.20260611**! This stable release introduces selective sync filtering for BYOS cloud backups, custom touch dragging controls for Electron windows, local S3 cloud sync engine support, a new token usage stats dashboard, dynamic user-managed CORS bypass settings, and significant enhancements to Sparkle AI and Live2D model importing.

---

## 🚀 Key Highlights

### ☁️ BYOS Selective Sync & S3 Cloud Support
* **Selective Sync Filtering**: Added a new **Selective Sync Modal** that allows users to group assets (like background images) by character ID bundle and choose exactly which directories and character files are backed up to the cloud.
* **S3 Engine Integration**: Implemented a full S3-compatible cloud storage sync engine alongside a provider selector dropdown in the cloud-sync settings interface.
* **Sync Health Upgrades**: Added safeguards to prevent OOM, EBUSY, and provider configurations being wiped on startup sync.

### 🖥️ Desktop & Touch Control Stabilization
* **Electron Touch Dragging**: Added custom touch-gesture dragging support for the **Control Strip** and **Actor Stage** windows in Electron, making touch-screen interaction extremely smooth.
* **Dynamic CORS Bypass settings**: Relocated and redesigned the connection settings interface to allow users to dynamically manage their own CORS bypass URLs (with new support for `opencode.ai` and `pioneer.ai`).

### 🎮 Sparkle AI & Dating Sim Enhancements
* **Sparkle AI Templates**: Added Multi-Role system prompt templates and Studio concept context injection while preserving existing system prompt core details.
* **Dating Sim Upgrades**: Default turns increased to 18, S3 sync bootstrapping fixed, and added a dynamic mode selection modal.
* **Database & Usage Dashboard**: Implemented a comprehensive **Token Usage Stats** dashboard and full database exporter in `stage-ui`.

### 🎨 Live2D & UI Improvements
* **Self-Healing Imports**: The Live2D importer now automatically heals expression files nested inside subdirectories when importing new cards.
* **Chat Composer Revamp**: Modularized the composer code, simplified chat labels, and added support for displaying 4x model formats in the header.
* **Producer Guidance Modal**: Added a boundary message preview popover.
