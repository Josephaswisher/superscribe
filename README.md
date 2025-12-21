# SuperScribe

<div align="center">
  <img src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" alt="SuperScribe Banner" width="600" />
  
  **AI-Powered Medical Documentation Assistant**
  
  [![CI](https://github.com/josephaswisher/superscribe/actions/workflows/ci.yml/badge.svg)](https://github.com/josephaswisher/superscribe/actions/workflows/ci.yml)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
  [![React](https://img.shields.io/badge/React-19-61dafb)](https://react.dev/)
  [![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
</div>

## Overview

SuperScribe is an AI-powered medical documentation assistant designed for hospitalists and clinical staff. It leverages LLMs to help create, edit, and manage clinical documentation including:

- **Admission H&P** - Comprehensive History & Physical for new admissions
- **Progress Notes** - Daily progress notes in concise format
- **Discharge Summaries** - Hospital course summaries for discharge
- **Sign-outs** - Handoff documents for night coverage

## Features

- **AI-Assisted Writing** - Intelligent document generation with clinical context awareness
- **Template System** - Customizable templates with style guides and attestation blocks
- **Intent Classification** - Automatic routing of commands (labs, plan, progress notes)
- **Multiple Views** - Patient cards, continuous document, dashboard, labs, meds, plan views
- **Diff Viewer** - Side-by-side comparison of document changes
- **Autosave** - Automatic draft saving to prevent data loss
- **Search** - Full document search with navigation
- **Dark/Light Mode** - Comfortable viewing in any environment

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenRouter API key (for AI features)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/josephaswisher/superscribe.git
   cd superscribe
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment:
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local` and add your API key:
   ```env
   VITE_OPENROUTER_API_KEY=your_openrouter_api_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |
| `npm run test:coverage` | Run tests with coverage |
| `npm run lint` | Lint code with ESLint |
| `npm run lint:fix` | Fix linting issues |
| `npm run format` | Format code with Prettier |
| `npm run typecheck` | Type check with TypeScript |
| `npm run validate` | Run all checks (typecheck, lint, test) |

## Project Structure

```
superscribe/
├── components/          # React components
│   ├── Chat/           # Chat interface components
│   ├── Document/       # Document view components
│   ├── Layout/         # Layout components
│   └── modals/         # Modal dialogs
├── contexts/           # React contexts
│   ├── DocumentContext.tsx
│   ├── MacroContext.tsx
│   ├── ThemeContext.tsx
│   └── UISettingsContext.tsx
├── hooks/              # Custom React hooks
├── services/           # API services
│   ├── aiService.ts    # AI/LLM integration
│   └── errors.ts       # Error handling utilities
├── utils/              # Utility functions
├── src/test/           # Test setup and utilities
└── types.ts            # TypeScript type definitions
```

## AI Integration

SuperScribe uses DeepSeek/OpenRouter for AI features:

- **Intent Router** - Classifies user requests (poc, progress, labs, plan, census)
- **Document Generation** - Creates structured medical documentation
- **Proofreading** - Grammar, spelling, and style corrections
- **Handoff Generation** - Synthesizes patient notes into sign-out documents

## Configuration

### Templates

Templates are defined in `constants.ts` and include:
- Structure template with placeholders
- Style guide for writing conventions
- Optional attestation block

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_OPENROUTER_API_KEY` | OpenRouter API key | Yes |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [React 19](https://react.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons by [Lucide](https://lucide.dev/)
- AI powered by [DeepSeek](https://deepseek.com/) via [OpenRouter](https://openrouter.ai/)
