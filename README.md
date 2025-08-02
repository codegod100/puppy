# AssemblyScript Counter Widget

A reactive counter widget built with AssemblyScript and WebAssembly, demonstrating high-performance web applications.

## Features

- **Reactive UI**: Real-time updates with smooth animations
- **WebAssembly Performance**: Core logic runs in WASM for optimal speed
- **Keyboard Controls**: Use arrow keys, +/-, or R for reset
- **Performance Monitoring**: Shows operation timing and statistics
- **Advanced Math Functions**: Includes fibonacci, square, and validation functions

## Quick Start

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Build the WASM Module**:
   ```bash
   npm run build
   ```

3. **Serve the Application**:
   ```bash
   npm run serve
   ```

4. **Open in Browser**:
   Navigate to `http://localhost:8000/public`

## Project Structure

```
├── src/
│   └── counter.ts          # AssemblyScript counter logic
├── public/
│   ├── index.html          # Main HTML file
│   └── counter.js          # JavaScript glue code
├── build/
│   └── counter.wasm        # Compiled WebAssembly module
├── package.json            # Project configuration
└── asconfig.json          # AssemblyScript configuration
```

## API Reference

### AssemblyScript Functions

- `getCounter()`: Returns current counter value
- `increment()`: Increments counter by 1
- `decrement()`: Decrements counter by 1
- `reset()`: Resets counter to 0
- `add(value)`: Adds specified value to counter
- `multiply(value)`: Multiplies counter by specified value
- `getTotalOperations()`: Returns total number of operations
- `isEven()`: Returns true if counter is even
- `isPositive()`: Returns true if counter is positive
- `getSquare()`: Returns square of current value
- `fibonacci()`: Returns fibonacci number at current counter position

### JavaScript API

Access the widget instance via `window.counterWidget`:

```javascript
// Get advanced statistics
const stats = counterWidget.getAdvancedStats();
console.log(stats);
```

## Controls

- **Click Buttons**: Use +, -, and Reset buttons
- **Keyboard Shortcuts**:
  - `↑` or `+`: Increment
  - `↓` or `-`: Decrement  
  - `R`: Reset counter

## Performance

The core counter logic runs in WebAssembly, providing:
- Near-native performance for mathematical operations
- Minimal JavaScript overhead
- Real-time performance monitoring
- Efficient memory usage

## Development

To modify the counter logic:

1. Edit `src/counter.ts`
2. Run `npm run build` to recompile
3. Refresh the browser to see changes

The build process compiles AssemblyScript to WebAssembly with optimizations enabled for production use.

## GitHub Pages Deployment

This project is configured for automatic deployment to GitHub Pages:

1. **Push to main branch** - Triggers automatic build and deployment
2. **GitHub Actions** - Builds AssemblyScript and deploys to Pages
3. **SPA Routing** - Uses 404.html redirect for client-side routing support

### Manual Deployment

To deploy manually:

```bash
# Build the project
npm run build

# Push the public/ directory contents to gh-pages branch
# Or use GitHub Actions by pushing to main branch
```

### Routing on GitHub Pages

The project uses a client-side routing solution that works with GitHub Pages:
- `404.html` redirects all routes to `index.html` with query parameters
- Router handles the redirected URLs and shows the correct content
- Direct links like `yoursite.github.io/repo/test` will work correctly