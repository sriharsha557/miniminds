# MiniMinds Frontend - Project Setup

## Overview

This is the frontend application for MiniMinds, a web-based platform for browsing and downloading preschool worksheet bundles.

## Technology Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **Styling**: CSS Modules with design tokens
- **Testing**: Vitest + React Testing Library + fast-check (property-based testing)

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/          # Page-level components
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
├── styles/         # Global styles and design tokens
│   └── tokens.css  # Design system tokens (colors, spacing, typography)
├── test/           # Test setup and utilities
│   └── setup.ts    # Vitest configuration
├── App.tsx         # Main application component with routing
└── main.tsx        # Application entry point
```

## Design Tokens

The application uses CSS custom properties (variables) for consistent styling:

- **Colors**: Calm, educational palette with soft blues and warm accents
- **Spacing**: 8px-based scale (xs, sm, md, lg, xl, 2xl)
- **Typography**: Inter font family with responsive sizes
- **Breakpoints**: Mobile-first responsive design (640px, 768px, 1024px, 1280px)

See `src/styles/tokens.css` for the complete design system.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests in watch mode
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Run ESLint

## Testing

The project uses a dual testing approach:

1. **Unit Tests**: Specific examples and edge cases using Vitest + React Testing Library
2. **Property-Based Tests**: Universal correctness properties using fast-check

All tests are located alongside their source files with `.test.ts` or `.test.tsx` extensions.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Run tests:
   ```bash
   npm test
   ```

## Next Steps

The project is now ready for feature development. See `.kiro/specs/miniminds-frontend/tasks.md` for the implementation plan.
