# AIRI Release Notes — May 6, 2026 (v0.9.1-stable.20260506)

This release focuses on **Character Integrity**, ensuring that temporary visual manifestations never corrupt your permanent character settings, alongside significant improvements to Artistry stability and system performance.

## 🚀 **Key Highlights**

### 🛡️ **Character Integrity & Data Protection**
We’ve implemented a new "State Decoupling" architecture that protects your character’s permanent identity from temporary overrides.
*   **Identity Protection**: Temporary visual changes (like outfits, concepts, or active expressions) are now kept entirely separate from your character’s base configuration.
*   **Manifestation Priority**: The interface now prioritizes active "costumes" or visual states without baking those temporary values into the character's permanent settings.
*   **Corrupt-Proof Saving**: Fixed a critical issue where saving a character while a special concept was active could permanently overwrite the character's base model assignment.

### 🎨 **Artistry & Visual Stabilization**
Significant improvements to the generation workflow and image handling for a more reliable creative experience.
*   **Enhanced Generation Reliability**: The visual generation engine is now more robust, with improved error handling and configuration validation to prevent failed generations.
*   **Optimized Asset Handling**: Refactored the internal image processing pipeline for faster performance and lower memory usage when viewing your generation journal.
*   **Smarter Synchronization**: Improved how visual states are synchronized across character swaps, ensuring your companions always appear exactly as intended.

## 🛠️ **Stability & Fixes**
*   **Truly Green Build**: Achieved a 100% clean, warning-free build state across the entire monorepo, ensuring maximum stability for cross-platform releases.
*   **Telemetry-Free**: Completely removed all legacy tracking and analytics scripts, ensuring a privacy-first, zero-footprint developer environment.
*   **System Hygiene**: Sanitized file encodings and cleared hidden "junk" data from core runtime files that previously caused build-time crashes.
*   **UI Performance**: Introduced smarter synchronization for configuration edits to ensure a smooth, lag-free experience when customizing your companions.
