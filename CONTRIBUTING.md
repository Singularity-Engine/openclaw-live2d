# Contributing to OpenClaw Live2D

Thank you for your interest in contributing! This guide will help you get started.

## Getting Started

### Prerequisites

- Node.js 20+
- npm 9+
- A running [Open-LLM-VTuber](https://github.com/t41372/Open-LLM-VTuber) backend (for full functionality)

### Development Setup

```bash
# Clone the repo
git clone https://github.com/Singularity-Engine/openclaw-live2d.git
cd openclaw-live2d

# Install dependencies
npm install

# Start development server (web mode)
npm run dev:web

# Or start Electron app
npm run dev
```

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
VITE_API_TARGET=http://localhost:12393
VITE_WS_TARGET=ws://localhost:12393
```

## How to Contribute

### Reporting Bugs

- Use [GitHub Issues](https://github.com/Singularity-Engine/openclaw-live2d/issues) to report bugs
- Include steps to reproduce, expected vs actual behavior
- Include browser/OS information and screenshots if applicable

### Suggesting Features

- Open an issue with the `enhancement` label
- Describe the use case and proposed solution

### Submitting Code

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run linting: `npm run lint`
5. Run type checking: `npm run typecheck`
6. Commit with a descriptive message
7. Push and open a Pull Request

### Code Style

- TypeScript with React (functional components + hooks)
- Chakra UI v3 for UI components
- i18next for internationalization (always add both `en` and `zh` translations)
- Follow existing patterns in the codebase

### Commit Messages

Use conventional commit format:

```
feat: add new affinity animation
fix: resolve WebSocket reconnection issue
docs: update README with setup instructions
refactor: simplify heartbeat calculation
```

## Project Structure

```
src/
├── main/                    # Electron main process
├── preload/                 # Electron preload scripts
└── renderer/
    ├── src/
    │   ├── components/      # React components
    │   │   ├── affinity/    # Affinity system UI
    │   │   ├── share/       # Shareable cards
    │   │   └── modals/      # Modal dialogs
    │   ├── context/         # React Context providers
    │   ├── hooks/           # Custom React hooks
    │   ├── services/        # WebSocket & auth services
    │   └── locales/         # i18n translations (en/zh)
    └── WebSDK/              # Live2D Cubism SDK
```

## Key Areas for Contribution

- **New Live2D expressions/animations**
- **Additional language support** (i18n)
- **Affinity system enhancements**
- **Accessibility improvements**
- **Performance optimization**
- **Documentation and examples**

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
