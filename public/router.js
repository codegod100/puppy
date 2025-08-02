class Router {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.init();
    }
    
    init() {
        window.addEventListener('popstate', () => this.handleRoute());
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-route]')) {
                e.preventDefault();
                this.navigate(e.target.getAttribute('data-route'));
            }
        });
        
        // Don't call handleRoute here - let the app handle initial routing
    }
    
    addRoute(path, handler) {
        this.routes.set(path, handler);
    }
    
    navigate(path) {
        const fullPath = window.APP_CONFIG && window.APP_CONFIG.basePath ? 
            window.APP_CONFIG.basePath + path : path;
        
        // Save current state before navigation
        const currentState = window.counterApp ? window.counterApp.getCurrentState() : null;
        history.pushState(currentState, '', fullPath);
        this.handleRoute();
    }
    
    handleRoute() {
        let path = window.location.pathname;
        
        // Remove base path if present
        if (window.APP_CONFIG && window.APP_CONFIG.basePath) {
            path = path.replace(window.APP_CONFIG.basePath, '') || '/';
        }
        
        this.currentRoute = path;
        
        console.log('Handling route:', path);
        
        let handler = this.routes.get(path);
        
        // Default to counter route if no specific handler found
        if (!handler) {
            if (path === '/' || path === '/counter' || path === '') {
                handler = this.routes.get('/');
            } else {
                handler = this.routes.get('*');
            }
        }
        
        if (handler) {
            console.log('Calling handler for:', path);
            handler(path);
        } else {
            console.log('No handler found for:', path);
        }
        
        this.updateNavigation();
    }
    
    updateNavigation() {
        document.querySelectorAll('[data-route]').forEach(link => {
            const route = link.getAttribute('data-route');
            if (route === this.currentRoute) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }
}

class CounterApp {
    constructor() {
        this.router = new Router();
        this.counterWidget = null;
        this.currentView = null;
        this.wasmModule = null; // Shared WASM instance
        this.counterState = {
            value: 0,
            totalOperations: 0
        };
        this.setupRoutes();
        
        // Initialize WASM once
        this.initWasm().then(() => {
            // Restore state from history after WASM is ready
            const historyState = this.getStateFromHistory();
            if (historyState) {
                console.log('Restoring state from history:', historyState);
                this.counterState = historyState;
                this.restoreWasmState();
            }
            
            // Handle initial route after WASM is ready
            this.router.handleRoute();
        });
    }
    
    async initWasm() {
        if (this.wasmModule) return this.wasmModule;
        
        try {
            const imports = {
                env: {
                    memory: new WebAssembly.Memory({ initial: 1 }),
                    abort: () => {
                        throw new Error("AssemblyScript abort");
                    }
                }
            };
            
            const basePath = window.APP_CONFIG ? window.APP_CONFIG.basePath : '';
            const wasmPath = basePath ? basePath + '/counter.wasm' : './counter.wasm';
            
            const wasmModule = await WebAssembly.instantiateStreaming(
                fetch(wasmPath),
                imports
            );
            
            this.wasmModule = wasmModule.instance.exports;
            
            return this.wasmModule;
        } catch (error) {
            console.error('Failed to load WASM module:', error);
            throw error;
        }
    }
    
    getStateFromHistory() {
        return history.state;
    }
    
    getCurrentState() {
        if (this.wasmModule) {
            return {
                value: this.wasmModule.getCounter(),
                totalOperations: this.wasmModule.getTotalOperations()
            };
        }
        return this.counterState;
    }
    
    restoreWasmState() {
        if (!this.wasmModule) return;
        
        // Reset to 0 first
        this.wasmModule.reset();
        
        // Restore the counter value
        if (this.counterState.value !== 0) {
            this.wasmModule.add(this.counterState.value);
        }
        
        // Restore total operations by performing dummy operations
        const currentOps = this.wasmModule.getTotalOperations();
        const targetOps = this.counterState.totalOperations;
        
        for (let i = currentOps; i < targetOps - 1; i++) {
            this.wasmModule.add(0); // No-op that increments operation count
        }
    }
    
    setupRoutes() {
        this.router.addRoute('/', () => this.showCounter());
        this.router.addRoute('/counter', () => this.showCounter());
        this.router.addRoute('/test', () => this.showTest());
        this.router.addRoute('*', () => this.show404());
    }
    
    async showCounter() {
        console.log('Showing counter widget');
        
        // Don't re-render if we're already showing the counter
        if (this.currentView === 'counter') {
            console.log('Already showing counter, skipping re-render');
            return;
        }
        
        // Update state from history if available
        const historyState = this.getStateFromHistory();
        if (historyState) {
            this.counterState = historyState;
            if (this.wasmModule) {
                this.restoreWasmState();
            }
        }
        
        // Destroy any existing widgets
        if (this.counterWidget) {
            this.counterWidget.destroy();
        }
        
        this.currentView = 'counter';
        
        // Determine the correct color based on saved state
        const isPositive = this.counterState.value > 0;
        const isZero = this.counterState.value === 0;
        const displayColor = isPositive ? '#4CAF50' : isZero ? '#333' : '#f44336';
        const fontSize = Math.abs(this.counterState.value) > 999 ? '3rem' : '4rem';
        
        document.getElementById('app-content').innerHTML = `
            <div class="counter-widget">
                <h1>AssemblyScript Counter</h1>
                <div id="counter-display" class="counter-display" style="color: ${displayColor}; font-size: ${fontSize};">${this.counterState.value}</div>
                
                <div class="button-group">
                    <button id="btn-decrement" class="btn-decrement">-</button>
                    <button id="btn-reset" class="btn-reset">Reset</button>
                    <button id="btn-increment" class="btn-increment">+</button>
                </div>
                
                <div class="stats">
                    <div>Total Operations: <span id="total-ops">${this.counterState.totalOperations}</span></div>
                    <div>Performance: <span id="perf-info">Ready</span></div>
                </div>
            </div>
        `;
        
        // Wait for DOM to be ready
        setTimeout(() => {
            this.counterWidget = new CounterWidget(this.wasmModule, this.counterState);
        }, 0);
    }
    
    async showTest() {
        console.log('Showing test widget');
        
        // Don't re-render if we're already showing the test
        if (this.currentView === 'test') {
            console.log('Already showing test, skipping re-render');
            return;
        }
        
        // Save current counter state to history
        if (this.wasmModule) {
            this.counterState = this.getCurrentState();
            history.replaceState(this.counterState, '', window.location.href);
        }
        
        // Destroy counter widget
        if (this.counterWidget) {
            this.counterWidget.destroy();
            this.counterWidget = null;
        }
        
        this.currentView = 'test';
        
        document.getElementById('app-content').innerHTML = `
            <div class="test-widget">
                <h1>WASM Test Route</h1>
                <div class="test-content">
                    <h2>AssemblyScript Function Tests</h2>
                    <div id="test-results"></div>
                    <button id="run-tests" class="btn-test">Run All Tests</button>
                </div>
                
                <div class="benchmark-section">
                    <h2>Performance Benchmarks</h2>
                    <div id="benchmark-results"></div>
                    <button id="run-benchmarks" class="btn-test">Run Benchmarks</button>
                </div>
            </div>
        `;
        
        const testWidget = new TestWidget(this.wasmModule);
    }
    
    show404() {
        this.currentView = '404';
        
        document.getElementById('app-content').innerHTML = `
            <div class="error-widget">
                <h1>404 - Route Not Found</h1>
                <p>The route "${this.router.currentRoute}" was not found.</p>
                <button data-route="/" class="btn-home">Go Home</button>
            </div>
        `;
    }
}

class TestWidget {
    constructor(wasmModule) {
        this.wasmModule = wasmModule;
        this.init();
    }
    
    async init() {
        if (this.wasmModule) {
            this.setupEventListeners();
        } else {
            document.getElementById('test-results').innerHTML = 
                '<div class="error">WASM module not available</div>';
        }
    }
    
    setupEventListeners() {
        document.getElementById('run-tests').addEventListener('click', () => {
            this.runTests();
        });
        
        document.getElementById('run-benchmarks').addEventListener('click', () => {
            this.runBenchmarks();
        });
    }
    
    runTests() {
        if (!this.wasmModule) return;
        
        const tests = [
            {
                name: 'Basic Counter Operations',
                test: () => {
                    this.wasmModule.reset();
                    const initial = this.wasmModule.getCounter();
                    this.wasmModule.increment();
                    const after = this.wasmModule.getCounter();
                    return initial === 0 && after === 1;
                }
            },
            {
                name: 'Math Functions',
                test: () => {
                    this.wasmModule.reset();
                    this.wasmModule.add(5);
                    const square = this.wasmModule.getSquare();
                    return square === 25;
                }
            },
            {
                name: 'Boolean Functions',
                test: () => {
                    this.wasmModule.reset();
                    this.wasmModule.add(4);
                    return this.wasmModule.isEven() && this.wasmModule.isPositive();
                }
            },
            {
                name: 'Fibonacci Calculation',
                test: () => {
                    this.wasmModule.reset();
                    this.wasmModule.add(7);
                    const fib = this.wasmModule.fibonacci();
                    return fib === 13; // 7th fibonacci number
                }
            }
        ];
        
        let results = '<div class="test-results">';
        let passed = 0;
        
        tests.forEach(test => {
            try {
                const result = test.test();
                if (result) {
                    results += `<div class="test-pass">✓ ${test.name}</div>`;
                    passed++;
                } else {
                    results += `<div class="test-fail">✗ ${test.name}</div>`;
                }
            } catch (error) {
                results += `<div class="test-error">⚠ ${test.name}: ${error.message}</div>`;
            }
        });
        
        results += `<div class="test-summary">${passed}/${tests.length} tests passed</div>`;
        results += '</div>';
        
        document.getElementById('test-results').innerHTML = results;
    }
    
    runBenchmarks() {
        if (!this.wasmModule) return;
        
        const benchmarks = [
            {
                name: 'Counter Increment (1000x)',
                benchmark: () => {
                    this.wasmModule.reset();
                    const start = performance.now();
                    for (let i = 0; i < 1000; i++) {
                        this.wasmModule.increment();
                    }
                    return performance.now() - start;
                }
            },
            {
                name: 'Fibonacci Calculation (n=20)',
                benchmark: () => {
                    this.wasmModule.reset();
                    this.wasmModule.add(20);
                    const start = performance.now();
                    this.wasmModule.fibonacci();
                    return performance.now() - start;
                }
            },
            {
                name: 'Math Operations (100x)',
                benchmark: () => {
                    this.wasmModule.reset();
                    const start = performance.now();
                    for (let i = 0; i < 100; i++) {
                        this.wasmModule.add(i);
                        this.wasmModule.getSquare();
                        this.wasmModule.isEven();
                    }
                    return performance.now() - start;
                }
            }
        ];
        
        let results = '<div class="benchmark-results">';
        
        benchmarks.forEach(benchmark => {
            try {
                const time = benchmark.benchmark();
                results += `<div class="benchmark-result">
                    <span class="benchmark-name">${benchmark.name}</span>
                    <span class="benchmark-time">${time.toFixed(3)}ms</span>
                </div>`;
            } catch (error) {
                results += `<div class="benchmark-error">⚠ ${benchmark.name}: ${error.message}</div>`;
            }
        });
        
        results += '</div>';
        
        document.getElementById('benchmark-results').innerHTML = results;
    }
}