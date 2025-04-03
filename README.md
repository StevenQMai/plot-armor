# Plot Armor

A Chrome extension that protects you from unwanted spoilers for your favorite shows and movies.

## Features

- 🛡️ Active spoiler protection for TV shows and movies
- 🔍 Search and filter your protected content
- 📊 Track spoiler blocking statistics
- 🎯 Easy-to-use interface with show/movie management
- 🌓 Beautiful UI with a warm, cream-colored theme

## Development

This project is built with:
- Vite
- React
- TypeScript
- Tailwind CSS

### Setup

1. Clone the repository:
```bash
git clone <your-repo-url>
cd plot-armor
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

4. Build the extension:
```bash
npm run build
```

5. Load the extension in Chrome:
- Open Chrome and navigate to `chrome://extensions/`
- Enable "Developer mode"
- Click "Load unpacked"
- Select the `dist` directory from this project

### Project Structure

- `src/` - Source code
  - `App.tsx` - Main popup component
  - `content.ts` - Content script for spoiler detection
  - `types/` - TypeScript type definitions
- `public/` - Static assets and manifest
- `dist/` - Production build output

## Contributing

Feel free to open issues or submit pull requests for any improvements or bug fixes.

