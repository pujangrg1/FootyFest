# Web App Setup Guide

This guide explains how to run and deploy the web version of the Footy Fest app.

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- Expo CLI (comes with expo package)

## Running the Web App Locally

1. Install dependencies (if not already done):
```bash
npm install --legacy-peer-deps
```

2. Start the web development server:
```bash
npm run web
```

The app will open in your browser at `http://localhost:8081` (or the next available port).

## Building for Production

1. Build the web app:
```bash
npm run build:web
```

This creates a `web-build` directory with the production-ready files.

2. Test the production build locally:
```bash
npm run serve:web
```

## Deployment

### Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

The `vercel.json` file is already configured.

### Netlify

1. Install Netlify CLI:
```bash
npm i -g netlify-cli
```

2. Deploy:
```bash
netlify deploy --prod
```

The `netlify.toml` file is already configured.

### GitHub Pages

1. Push your code to GitHub
2. The GitHub Actions workflow (`.github/workflows/deploy-web.yml`) will automatically deploy on push to `main` branch
3. Enable GitHub Pages in your repository settings and point it to the `gh-pages` branch

## Web-Specific Features

### Platform Detection
- The app automatically detects if it's running on web vs mobile
- Use `Platform.OS === 'web'` or the utilities in `src/utils/platform.js`

### Responsive Design
- Mobile: < 768px (single column, bottom tabs)
- Tablet: 768px - 1024px (2 columns, horizontal tabs)
- Desktop: > 1024px (multi-column, sidebar navigation)

### Web Components
- **WebDatePicker**: HTML5 date/time inputs for web
- **WebImagePicker**: File input with drag-and-drop support
- **EnhancedTable**: Sortable, filterable tables with pagination and CSV export

### Keyboard Shortcuts
- `Ctrl/Cmd + K`: Search (to be implemented)
- `Ctrl/Cmd + N`: New tournament (organizer)
- `Ctrl/Cmd + T`: New team (team role)
- `Esc`: Close modals
- Arrow keys: Navigate lists

## Firebase Configuration

The Firebase config in `firebase/config.js` automatically uses:
- Browser localStorage for web
- AsyncStorage for mobile

No additional configuration needed.

## Troubleshooting

### Build Errors
- Make sure all dependencies are installed: `npm install --legacy-peer-deps`
- Clear cache: `npx expo start --web --clear`

### Date Picker Not Working
- The web version uses HTML5 date inputs
- Make sure your browser supports HTML5 date inputs (all modern browsers do)

### Image Upload Not Working
- On web, use the drag-and-drop area or click to select files
- Supported formats: JPEG, PNG, GIF, WebP
- Max file size: 5MB

### Styling Issues
- The app uses React Native Web which converts React Native styles to CSS
- Some platform-specific styles may need adjustment
- Check browser console for any style warnings

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

All modern browsers with ES6+ support.

