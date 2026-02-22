# 🧠 MiniMinds

A modern, accessible web platform for browsing and downloading high-quality preschool worksheet bundles for children aged 2-6 years.

## 🌟 Features

- **Age-Based Filtering**: Browse worksheets by age range (2-3, 3-4, 4-5, 5-6 years)
- **Skill Categories**: Filter by learning domains (Alphabet, Numbers, Shapes/Colors, Tracing, Logical Thinking)
- **Free & Paid Content**: Mix of free and premium worksheet bundles
- **Preview Gallery**: View sample worksheets before downloading
- **Mobile-First Design**: Fully responsive interface optimized for all devices
- **Accessibility**: WCAG 2.1 Level AA compliant
- **Fast Performance**: Optimized images, lazy loading, and efficient caching

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Clone the repository
git clone https://github.com/sriharsha557/miniminds.git
cd miniminds

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173/`

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm test` - Run tests once
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report
- `npm run lint` - Run ESLint

## 🏗️ Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **Styling**: CSS Modules with design tokens
- **Testing**: Vitest + React Testing Library + fast-check (property-based testing)
- **Deployment**: Vercel

## 📁 Project Structure

```
miniminds/
├── public/
│   ├── bundles.json          # Bundle data
│   └── images/               # Bundle images
├── src/
│   ├── components/           # React components
│   │   ├── BundleCard.tsx
│   │   ├── BundleGrid.tsx
│   │   ├── FilterPanel.tsx
│   │   ├── Header.tsx
│   │   └── ErrorBoundary.tsx
│   ├── contexts/             # React Context providers
│   │   ├── BundleDataContext.tsx
│   │   └── FilterContext.tsx
│   ├── pages/                # Page components
│   │   └── HomePage.tsx
│   ├── types/                # TypeScript types
│   │   └── bundle.ts
│   ├── styles/               # Global styles
│   │   └── tokens.css
│   ├── App.tsx               # Root component
│   └── main.tsx              # Entry point
├── .kiro/specs/              # Feature specifications
└── package.json
```

## 🎨 Design Principles

1. **Mobile-First**: Designed for small screens, progressively enhanced for larger displays
2. **Accessibility**: Keyboard navigation, screen reader support, WCAG AA compliance
3. **Performance**: Lazy loading, image optimization, efficient rendering
4. **Simplicity**: Clean UI focused on content discovery
5. **Calm Design**: Muted colors, generous whitespace, no distractions

## 🧪 Testing

The project uses a dual testing approach:

- **Unit Tests**: Specific examples, edge cases, and error conditions
- **Property-Based Tests**: Universal correctness properties across all inputs

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Vercel will auto-detect Vite and configure build settings
4. Deploy!

Or use the Vercel CLI:

```bash
npm install -g vercel
vercel
```

### Build Settings

- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

## 📝 Adding New Bundles

Edit `public/bundles.json` to add new worksheet bundles:

```json
{
  "id": "unique-bundle-id",
  "name": "Bundle Name",
  "ageRange": "3-4",
  "skills": ["Alphabet", "Tracing"],
  "learningGoals": ["Goal 1", "Goal 2"],
  "worksheetCount": 26,
  "isFree": true,
  "coverImageUrl": "/images/cover.jpg",
  "previewImageUrls": ["/images/preview1.jpg"],
  "pdfUrl": "/pdfs/bundle.pdf",
  "pdfSizeBytes": 2457600,
  "printingTips": ["Tip 1", "Tip 2"]
}
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 👤 Author

**Sriharsha**
- GitHub: [@sriharsha557](https://github.com/sriharsha557)

## 🙏 Acknowledgments

- Built with React and Vite
- Icons and illustrations from various open-source projects
- Inspired by the need for accessible educational resources

---

Made with ❤️ for early childhood education
