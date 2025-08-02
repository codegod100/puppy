class CounterWidget {
    constructor(wasmModule = null, initialState = null) {
        this.wasmModule = wasmModule;
        this.keyboardListenerAdded = false;
        this.elements = {};
        this.initialState = initialState;
        this.init();
    }
    
    updateElements() {
        this.elements = {
            display: document.getElementById('counter-display'),
            incrementBtn: document.getElementById('btn-increment'),
            decrementBtn: document.getElementById('btn-decrement'),
            resetBtn: document.getElementById('btn-reset'),
            totalOps: document.getElementById('total-ops'),
            perfInfo: document.getElementById('perf-info')
        };
    }
    
    async init() {
        this.updateElements();
        
        if (this.wasmModule) {
            // WASM already loaded, just set up the widget
            this.setupEventListeners();
            this.updateDisplay();
            
            if (this.elements.perfInfo) {
                this.elements.perfInfo.textContent = 'Running on WebAssembly';
            }
        } else {
            // No WASM provided - this shouldn't happen with the new architecture
            console.error('CounterWidget: No WASM module provided');
            if (this.elements.perfInfo) {
                this.elements.perfInfo.textContent = 'WASM module not provided';
            }
        }
    }
    
    setupEventListeners() {
        if (this.elements.incrementBtn) {
            this.elements.incrementBtn.addEventListener('click', () => {
                this.performOperation(() => this.wasmModule.increment());
            });
        }
        
        if (this.elements.decrementBtn) {
            this.elements.decrementBtn.addEventListener('click', () => {
                this.performOperation(() => this.wasmModule.decrement());
            });
        }
        
        if (this.elements.resetBtn) {
            this.elements.resetBtn.addEventListener('click', () => {
                this.performOperation(() => this.wasmModule.reset());
                
                // Clear history state on reset
                if (window.counterApp) {
                    const resetState = { value: 0, totalOperations: 1 }; // 1 operation for the reset
                    history.replaceState(resetState, '', window.location.href);
                    console.log('Reset history state:', resetState);
                }
            });
        }
        
        if (!this.keyboardListenerAdded) {
            this.keyboardHandler = (e) => {
                if (!this.wasmModule) return;
                
                switch(e.key) {
                    case 'ArrowUp':
                    case '+':
                        e.preventDefault();
                        this.performOperation(() => this.wasmModule.increment());
                        break;
                    case 'ArrowDown':
                    case '-':
                        e.preventDefault();
                        this.performOperation(() => this.wasmModule.decrement());
                        break;
                    case 'r':
                    case 'R':
                        if (e.ctrlKey || e.metaKey) return;
                        e.preventDefault();
                        this.performOperation(() => this.wasmModule.reset());
                        
                        // Clear history state on reset
                        if (window.counterApp) {
                            const resetState = { value: 0, totalOperations: this.wasmModule.getTotalOperations() };
                            history.replaceState(resetState, '', window.location.href);
                            console.log('Reset history state via keyboard:', resetState);
                        }
                        break;
                }
            };
            
            document.addEventListener('keydown', this.keyboardHandler);
            this.keyboardListenerAdded = true;
        }
    }
    
    restoreState() {
        if (!this.wasmModule || !this.initialState) return;
        
        // Reset to 0 first
        this.wasmModule.reset();
        
        // Restore the counter value
        if (this.initialState.value !== 0) {
            this.wasmModule.add(this.initialState.value);
        }
        
        // Restore total operations by performing dummy operations
        const currentOps = this.wasmModule.getTotalOperations();
        const targetOps = this.initialState.totalOperations;
        
        // Add dummy operations to match the total (subtract 1 for the reset operation)
        for (let i = currentOps; i < targetOps - 1; i++) {
            this.wasmModule.add(0); // No-op that increments operation count
        }
    }
    
    destroy() {
        if (this.keyboardHandler) {
            document.removeEventListener('keydown', this.keyboardHandler);
            this.keyboardListenerAdded = false;
        }
    }
    
    performOperation(operation) {
        if (!this.wasmModule) return;
        
        this.updateElements();
        
        const startTime = performance.now();
        
        if (this.elements.display) {
            this.elements.display.classList.add('updating');
        }
        
        const result = operation();
        
        const endTime = performance.now();
        const duration = (endTime - startTime).toFixed(3);
        
        this.updateDisplay();
        
        // Update history state after each operation
        if (window.counterApp) {
            const newState = window.counterApp.getCurrentState();
            history.replaceState(newState, '', window.location.href);
        }
        
        if (this.elements.perfInfo) {
            this.elements.perfInfo.textContent = `Last op: ${duration}ms`;
        }
        
        setTimeout(() => {
            if (this.elements.display) {
                this.elements.display.classList.remove('updating');
            }
        }, 200);
        
        setTimeout(() => {
            if (this.elements.perfInfo) {
                this.elements.perfInfo.textContent = 'Running on WebAssembly';
            }
        }, 2000);
    }
    
    updateDisplay() {
        if (!this.wasmModule) return;
        
        this.updateElements();
        
        if (!this.elements.display) return;
        
        const currentValue = this.wasmModule.getCounter();
        const totalOps = this.wasmModule.getTotalOperations();
        
        this.elements.display.textContent = currentValue;
        if (this.elements.totalOps) {
            this.elements.totalOps.textContent = totalOps;
        }
        
        const isEven = this.wasmModule.isEven();
        const isPositive = this.wasmModule.isPositive();
        
        this.elements.display.style.color = isPositive ? '#4CAF50' : 
                                           currentValue === 0 ? '#333' : '#f44336';
        
        if (Math.abs(currentValue) > 999) {
            this.elements.display.style.fontSize = '3rem';
        } else {
            this.elements.display.style.fontSize = '4rem';
        }
        
        document.title = `Counter: ${currentValue} | AssemblyScript Widget`;
    }
    
    getAdvancedStats() {
        if (!this.wasmModule) return {};
        
        return {
            current: this.wasmModule.getCounter(),
            totalOperations: this.wasmModule.getTotalOperations(),
            isEven: this.wasmModule.isEven(),
            isPositive: this.wasmModule.isPositive(),
            square: this.wasmModule.getSquare(),
            fibonacci: this.wasmModule.fibonacci()
        };
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const widget = new CounterWidget();
    
    window.counterWidget = widget;
    
    console.log('AssemblyScript Counter Widget loaded!');
    console.log('Use arrow keys, +/- keys, or R to control the counter');
    console.log('Access widget.getAdvancedStats() for detailed information');
});