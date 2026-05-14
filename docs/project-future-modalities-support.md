# Project: Future Modalities Support (Audio & Video Attachments)

## Background
This document outlines potential solutions and implementation strategies to support audio and video files as inline message attachments in AIRI. This follows user requests and discussions regarding expanding AIRI beyond text and image modalities.

## The Challenge
Supporting audio and video attachments in a chat interface involves significant technical hurdles, as many standard LLM APIs and providers do not natively support these formats as direct file uploads in the same way they support images.

---

## 1. Audio Attachments (.mp3, .wav, etc.)

### Potential Strategies (Not Mutually Exclusive)

Instead of choosing one or the other, AIRI could offer a choice to the user via a modal when an audio file is attached: **"Do you want to send it as-is or do you want to transcribe it first?"** This modal could also serve as a way to guide users to the relevant settings in `Settings > Providers > (Audio Modality)`.

#### A. Native Multimodal Input (OpenRouter / Gemini)
Some advanced models and providers (like Gemini via Google AI Studio or certain models on OpenRouter) support raw audio input.
- **Use Case**: This is essential for non-speech audio, such as a song the user wants the character to hear. Transcribing a song will only return lyrics, losing the melody, tone, and musicality.
- **Challenges**: We need to investigate how to effectively filter OpenRouter for LLMs that specifically support the audio modality for input and text for output.
- **Pros**: Maintains emotional tone, prosody, and background context of the audio.
- **Cons**: High token cost; limited model support.

#### B. Pre-Transcription (STT Scribe)
For speech-heavy audio where the text content is what matters most, AIRI could run the audio through an STT engine first.
- **Flow**: The audio is sent to an STT model (like Whisper) -> AIRI receives the text transcription -> This text is then sent to the character (LLM) as the message content. (There is no use case for simply transcribing and giving it back to the user without sending it to the character).
- **Pros**: Compatible with all text-based models; lower token cost.
- **Cons**: Loses non-verbal cues (laughter, hesitation, tone); cannot describe music or melodies.

---

## 2. Video Attachments (.mp4, .webm, etc.)

Currently, none of the "big players" or standard chat APIs support uploading full video files directly as inline message attachments. The data is simply too large for standard context windows.

### Potential Strategies & Compromises

#### A. First-Frame Extraction
The simplest fallback is to treat the video as a static image by extracting only the first frame (or a specific thumbnail frame).
- **Pros**: Low overhead; extremely compatible.
- **Cons**: Loses all motion and temporal context.

#### B. Smart Frame Sampling (User Decided)
Instead of the whole video, AIRI could extract a specific number of frames distributed across the video duration.
- **Implementation**: Provide a small modal when attaching a video asking the user:
    - "How many frames do you want to send?" (e.g., 5, 10, 20)
    - Or "Send 1 frame per X seconds."
- **Pros**: Gives the LLM a sense of time and motion; manageable token cost.
- **Cons**: Requires video decoding capabilities in the frontend (e.g., via Canvas/WebCodecs).

#### C. Tiled Contact Sheets
Extract multiple frames and compose them into a single "tiled" image (like a film contact sheet).
- **Pros**: Sends temporal data in a single image payload; highly compatible with standard vision models (GPT-4V, Claude 3, etc.).
- **Cons**: Resolution per frame is reduced; requires complex canvas manipulation.

---

## 3. Related Roadmap Discussions

While discussing modalities, a few other UX improvements were identified for the roadmap:

### A. Inline Message Editing
The ability to edit a previous message in the chat history.
- **Desired Behavior**: Editing a message should clear anything after it in that session and resend the prompt to take the conversation in a new direction from that point.
- **Current Workaround**: Deleting the assistant reply, copying the user message, deleting it, and sending it again.

### B. Session Branching (History Splitting)
A "split" icon to take the current history and fork it into a new session.
- **Desired Behavior**: Allows users to try taking the conversation in an experimental direction without ruining the main thread.
- **Implementation**: Leverage the existing `forkSession` capabilities in `session-store.ts`.
