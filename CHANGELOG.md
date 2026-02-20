# Changelog

## [1.0.0] - 2026-02-20

### Initial Open Source Release

This is the first public release of OpenClaw Live2D, forked and enhanced from [Open-LLM-VTuber](https://github.com/t41372/Open-LLM-VTuber).

### Features

- **EverMemOS Integration**: Long-term memory storage and retrieval via WebSocket, with real-time toast notifications when memories are stored
- **Affinity System (HeartAffinity)**: Dynamic relationship tracking with 5 levels (Stranger -> Acquaintance -> Friend -> Close -> Soulmate), heartbeat animations synced to affinity value, and milestone celebrations
- **Relationship Card**: Shareable summary card showing memories count, affinity level, top topics, and days together - exportable as PNG screenshot
- **Welcome Experience**: First-visit modal with conversation starters and personalized greeting for returning users
- **User Context Awareness**: Automatic detection of new vs returning visitors, visit count tracking, and personalized AI context injection
- **Full i18n Support**: Complete Chinese and English translations for all UI elements
- **Billing System**: Stripe-powered subscription plans and credit packs (backend-driven, no keys in frontend)
- **Web + Electron**: Runs as both a web app and native desktop application
- **Docker Support**: Production-ready Dockerfile and docker-compose configuration

### Technical Highlights

- React 18 + TypeScript + Chakra UI v3
- Live2D Cubism SDK integration with audio-driven lip sync
- WebSocket-based real-time communication with backend AI
- Voice Activity Detection (VAD) for hands-free interaction
- Zustand for state management
- Framer Motion for animations
