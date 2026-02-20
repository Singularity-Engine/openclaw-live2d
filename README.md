# OpenClaw Live2D

**Give your AI a face it deserves — Live2D companion with memory and affinity.**

[Live Demo](https://sngxai.com) | [Documentation](docs/) | [Contributing](CONTRIBUTING.md) | [Changelog](CHANGELOG.md)

---

## What is this?

OpenClaw Live2D is a frontend framework that brings AI companions to life with Live2D avatars, long-term memory, and an emotional affinity system. Built on top of [Open-LLM-VTuber](https://github.com/t41372/Open-LLM-VTuber), it adds the features that make AI feel less like a tool and more like someone who remembers you.

### Key Differences from Open-LLM-VTuber

| Feature | Open-LLM-VTuber | OpenClaw Live2D |
|---------|----------------|-----------------|
| Memory | Per-session | Persistent via [EverMemOS](https://github.com/Singularity-Engine/evermemos) |
| Relationship | None | 5-level affinity system with heartbeat UI |
| Sharing | None | Exportable relationship cards |
| First Visit | Generic | Guided welcome experience |
| User Context | None | New/returning user detection |
| i18n | Partial | Full CN/EN coverage |
| Billing | None | Stripe integration (optional) |

## Features

### EverMemOS Memory Integration

Your AI remembers conversations across sessions. Memories are stored via WebSocket and retrieved automatically, with real-time toast notifications when something important is remembered.

### Affinity System

A heartbeat-driven relationship tracker with 5 levels:

```
Stranger → Acquaintance → Friend → Close → Soulmate
   0          20            40       60       80
```

- Heart rate syncs with affinity value (50-120 BPM)
- Visual animations for affinity changes (rise/fall effects)
- Milestone celebrations when leveling up

### Relationship Card

A shareable card that summarizes your relationship with the AI:
- Memories count, affinity level, top conversation topics, days together
- AI-generated summary text
- Export as PNG screenshot

### Welcome Experience

First-time visitors get a guided introduction with conversation starters. Returning users are greeted with personalized context.

## Quick Start

### Web Mode (Recommended)

```bash
# Clone
git clone https://github.com/Singularity-Engine/openclaw-live2d.git
cd openclaw-live2d

# Install
npm install

# Configure backend connection
cp .env.example .env.local
# Edit .env.local with your backend URL

# Start
npm run dev:web
```

Open http://localhost:3000

### Electron Mode

```bash
npm run dev
```

### Docker

```bash
docker build \
  --build-arg VITE_API_URL=http://your-backend:12393 \
  --build-arg VITE_WS_URL=ws://your-backend:12393 \
  -t openclaw-live2d .

docker run -p 3001:3001 openclaw-live2d
```

### Prerequisites

- Node.js 20+
- A running [Open-LLM-VTuber](https://github.com/t41372/Open-LLM-VTuber) backend server
- (Optional) [EverMemOS](https://github.com/Singularity-Engine/evermemos) for persistent memory

## Architecture

```
┌──────────────────────────────────────────────────┐
│  OpenClaw Live2D Frontend                        │
│                                                  │
│  ┌──────────┐  ┌───────────┐  ┌──────────────┐  │
│  │ Live2D   │  │ Affinity  │  │ Relationship │  │
│  │ Canvas   │  │ System    │  │ Card         │  │
│  └────┬─────┘  └─────┬─────┘  └──────┬───────┘  │
│       │              │               │           │
│  ┌────┴──────────────┴───────────────┴────────┐  │
│  │         WebSocket Handler                  │  │
│  │  (audio, control, affinity, memory, chat)  │  │
│  └────────────────────┬───────────────────────┘  │
│                       │                          │
└───────────────────────┼──────────────────────────┘
                        │ WebSocket
┌───────────────────────┼──────────────────────────┐
│  Open-LLM-VTuber      │  Backend                 │
│  ┌────────────────────┴───────────────────────┐  │
│  │  LLM + TTS + ASR + Live2D Model Server    │  │
│  └────────────────────┬───────────────────────┘  │
│                       │                          │
│  ┌────────────────────┴───────────────────────┐  │
│  │  EverMemOS (Long-term Memory)              │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

## Project Structure

```
src/
├── main/                          # Electron main process
│   ├── index.ts                   # IPC handlers, window setup
│   ├── window-manager.ts          # Window/Pet mode management
│   └── menu-manager.ts            # System tray & context menu
├── preload/                       # Electron preload scripts
└── renderer/
    ├── src/
    │   ├── components/
    │   │   ├── affinity/
    │   │   │   ├── HeartAffinity.tsx    # Affinity system core
    │   │   │   └── HeartAffinity.css    # Heartbeat animations
    │   │   ├── share/
    │   │   │   └── RelationshipCard.tsx # Shareable relationship card
    │   │   ├── modals/
    │   │   │   └── welcome-modal.tsx    # First-visit experience
    │   │   └── billing/                 # Stripe billing (optional)
    │   ├── context/                     # React Context providers
    │   ├── hooks/                       # Custom React hooks
    │   ├── services/
    │   │   ├── websocket-handler.tsx    # Central WebSocket hub
    │   │   └── websocket-service.tsx    # WebSocket connection manager
    │   └── locales/
    │       ├── en/translation.json      # English
    │       └── zh/translation.json      # Chinese
    └── WebSDK/                          # Live2D Cubism SDK
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_TARGET` | `http://localhost:12393` | Backend API server URL |
| `VITE_WS_TARGET` | `ws://localhost:12393` | Backend WebSocket URL |
| `VITE_API_URL` | - | Public API URL (for Docker builds) |
| `VITE_WS_URL` | - | Public WebSocket URL (for Docker builds) |

### Development Commands

```bash
npm run dev          # Electron dev mode
npm run dev:web      # Web-only dev mode
npm run build:web    # Build web version
npm run build:win    # Build for Windows
npm run build:mac    # Build for macOS
npm run build:linux  # Build for Linux
npm run lint         # Run ESLint
npm run typecheck    # TypeScript type checking
```

## Tech Stack

- **React 18** + TypeScript
- **Chakra UI v3** for components
- **Live2D Cubism SDK** for character rendering
- **Electron** for desktop builds
- **Vite** for bundling
- **i18next** for internationalization
- **Zustand** for state management
- **Framer Motion** for animations
- **VAD (Voice Activity Detection)** for hands-free voice interaction

## Acknowledgments

This project stands on the shoulders of:

- [Open-LLM-VTuber](https://github.com/t41372/Open-LLM-VTuber) — The foundation that makes local AI VTubers possible
- [Live2D Cubism SDK](https://www.live2d.com/en/sdk/about/) — Character animation framework
- [EverMemOS](https://github.com/Singularity-Engine/evermemos) — Long-term memory system for AI

## License

[MIT](LICENSE)

---

<p align="center">
  Built with care by <a href="https://github.com/Singularity-Engine">sngxai</a>
</p>
