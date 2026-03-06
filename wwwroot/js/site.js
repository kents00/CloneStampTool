$(document).ready(function () {
    // Canvas & Context
    const canvas = document.getElementById('primaryCanvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    // UI Elements
    const imageUpload = document.getElementById('imageUpload');
    const downloadBtn = document.getElementById('downloadBtn');
    const canvasWrapper = document.getElementById('canvasWrapper');
    const noImagePrompt = document.getElementById('noImagePrompt');
    const brushSizeInput = document.getElementById('brushSize');
    const brushSizeVal = document.getElementById('brushSizeVal');
    const brushHardnessInput = document.getElementById('brushHardness');
    const brushHardnessVal = document.getElementById('brushHardnessVal');
    const cloneStampToolBtn = document.getElementById('cloneStampToolBtn');
    const toolHint = document.getElementById('toolHint');
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    const clearBtn = document.getElementById('clearBtn');
    const statusIndicator = document.querySelector('.status-indicator');
    const brushCursor = document.getElementById('brushCursor');
    const toastNotification = document.getElementById('toastNotification');
    const toastMessage = document.getElementById('toastMessage');

    // State Variables
    let originalImage = null;
    let isDrawing = false;
    let sourcePoint = null; // {x, y}
    let currentPoint = null;
    let brushSize = parseInt(brushSizeInput.value);
    let brushHardness = parseInt(brushHardnessInput.value); // 0-100
    let toastTimeout;
    
    // History for Undo/Redo
    let history = [];
    let historyStep = -1;

    // --- Initialization & UI Binding --- //
    
    function updateBrushCursor() {
        brushCursor.style.width = `${brushSize * 2}px`;
        brushCursor.style.height = `${brushSize * 2}px`;
    }
    updateBrushCursor();

    brushSizeInput.addEventListener('input', (e) => {
        brushSize = parseInt(e.target.value);
        brushSizeVal.textContent = brushSize;
        updateBrushCursor();
    });

    brushHardnessInput.addEventListener('input', (e) => {
        brushHardness = parseInt(e.target.value);
        brushHardnessVal.textContent = brushHardness;
    });

    function showToast(message) {
        toastMessage.textContent = message;
        toastNotification.classList.add('show');
        
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toastNotification.classList.remove('show');
        }, 3000);
    }

    // --- Image Handling --- //

    imageUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                // Resize canvas to match image dimensions
                canvas.width = img.width;
                canvas.height = img.height;
                
                // Draw initial image
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                
                // Show canvas, hide prompt
                canvas.style.display = 'block';
                noImagePrompt.style.display = 'none';
                
                // Enable tools
                downloadBtn.disabled = false;
                clearBtn.disabled = false;
                
                originalImage = img;
                
                // Reset history
                saveState();
                
                statusIndicator.textContent = `Image loaded (${img.width}x${img.height})`;
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });

    downloadBtn.addEventListener('click', () => {
        if (!originalImage) return;
        const link = document.createElement('a');
        link.download = 'cloned-image.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });

    clearBtn.addEventListener('click', () => {
        if (originalImage) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(originalImage, 0, 0);
            saveState();
            statusIndicator.textContent = "Canvas reset";
        }
    });

    // --- History Management --- //

    function saveState() {
        historyStep++;
        if (historyStep < history.length) {
            history.length = historyStep; // truncate forward history
        }
        history.push(canvas.toDataURL());
        updateHistoryButtons();
    }

    function undo() {
        if (historyStep > 0) {
            historyStep--;
            restoreState();
        }
    }

    function redo() {
        if (historyStep < history.length - 1) {
            historyStep++;
            restoreState();
        }
    }

    function restoreState() {
        const img = new Image();
        img.onload = function() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        };
        img.src = history[historyStep];
        updateHistoryButtons();
    }

    function updateHistoryButtons() {
        undoBtn.disabled = historyStep <= 0;
        redoBtn.disabled = historyStep >= history.length - 1;
    }

    undoBtn.addEventListener('click', undo);
    redoBtn.addEventListener('click', redo);

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'z') {
                e.preventDefault();
                undo();
            } else if (e.key === 'y' || (e.shiftKey && e.key === 'Z')) {
                e.preventDefault();
                redo();
            }
        }
    });

    // --- Clone Stamp Logic --- //

    function getMousePos(evt) {
        const rect = canvas.getBoundingClientRect();
        // Calculate scaling factor in case CSS max-width scales the canvas down visually
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        return {
            x: (evt.clientX - rect.left) * scaleX,
            y: (evt.clientY - rect.top) * scaleY
        };
    }

    // Function to calculate distance between two points
    function distance(p1, p2) {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    }

    canvas.addEventListener('mousedown', (e) => {
        if (!originalImage) return;
        
        const pos = getMousePos(e);
        
        // Shift+Click sets the source point
        if (e.shiftKey) {
            sourcePoint = { x: pos.x, y: pos.y };
            toolHint.textContent = 'Source set. Click and drag to clone.';
            toolHint.style.color = 'var(--accent-color)';
            statusIndicator.textContent = `Source set at (${Math.round(pos.x)}, ${Math.round(pos.y)})`;
            return;
        }

        if (!sourcePoint) {
            showToast("Please hold Shift and click to set a source point first.");
            return;
        }

        isDrawing = true;
        currentPoint = { ...pos };
        
        // Calculate offset between initial click and source point
        const offsetX = sourcePoint.x - pos.x;
        const offsetY = sourcePoint.y - pos.y;
        
        // Save offset for this stroke
        canvas.dataset.offsetX = offsetX;
        canvas.dataset.offsetY = offsetY;

        // Perform initial stamp
        cloneStamp(pos.x, pos.y, offsetX, offsetY);
    });

    canvas.addEventListener('mousemove', (e) => {
        if (!isDrawing || !originalImage || !sourcePoint) return;
        
        const pos = getMousePos(e);
        const offsetX = parseFloat(canvas.dataset.offsetX);
        const offsetY = parseFloat(canvas.dataset.offsetY);
        
        // Distance check to avoid too many stamps overlapping in same pixel
        if (distance(currentPoint, pos) > brushSize * 0.1) {
             // For smoother lines, we could interpolate between previous and current point, 
             // but for a stamp tool, discrete steps based on distance are usually fine.
             // A better approach for continuous drawing is drawing lines, but cloning requires copying pixel blocks.
             // We'll interpolate for smoothness.
             const dist = distance(currentPoint, pos);
             const steps = Math.max(1, Math.floor(dist / (brushSize * 0.2)));
             
             for (let i = 1; i <= steps; i++) {
                 const interpX = currentPoint.x + (pos.x - currentPoint.x) * (i / steps);
                 const interpY = currentPoint.y + (pos.y - currentPoint.y) * (i / steps);
                 cloneStamp(interpX, interpY, offsetX, offsetY);
             }
             
             currentPoint = { ...pos };
        }
    });

    const stopDrawing = () => {
        if (isDrawing) {
            isDrawing = false;
            saveState(); // Save state at the end of the stroke
        }
    };

    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    // --- Cursor Tracking --- //
    canvasWrapper.addEventListener('mousemove', (e) => {
        if (!originalImage) return;
        
        brushCursor.style.display = 'block';

        const rect = canvasWrapper.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        brushCursor.style.left = `${x}px`;
        brushCursor.style.top = `${y}px`;
    });

    canvasWrapper.addEventListener('mouseenter', () => {
        if (originalImage) brushCursor.style.display = 'block';
    });

    canvasWrapper.addEventListener('mouseleave', () => {
        brushCursor.style.display = 'none';
    });

    // The core cloning function
    function cloneStamp(targetX, targetY, offsetX, offsetY) {
        const srcX = targetX + offsetX;
        const srcY = targetY + offsetY;
        
        // Create an off-screen canvas to act as a circular mask for the brush
        const brushCanvas = document.createElement('canvas');
        brushCanvas.width = brushSize * 2;
        brushCanvas.height = brushSize * 2;
        const bCtx = brushCanvas.getContext('2d');
        
        // Calculate source rectangle
        const sX = Math.max(0, srcX - brushSize);
        const sY = Math.max(0, srcY - brushSize);
        const sWidth = brushSize * 2;
        const sHeight = brushSize * 2;
        
        // Calculate drawing rectangle (handle edges)
        const dX = 0;
        const dY = 0;
        
        try {
            // Draw source area onto brush canvas
            bCtx.drawImage(
                canvas, 
                sX, sY, sWidth, sHeight, 
                dX, dY, sWidth, sHeight
            );
            
            // Apply radial gradient for hardness
            bCtx.globalCompositeOperation = 'destination-in';
            const gradient = bCtx.createRadialGradient(
                brushSize, brushSize, 0, 
                brushSize, brushSize, brushSize
            );
            
            // Hardness calculation: 
            // 100% hardness -> sharp edge (gradient stops at 1.0)
            // 0% hardness -> soft edge from center (gradient stops at 0.0 to 1.0)
            const hardStop = brushHardness / 100;
            gradient.addColorStop(0, 'rgba(0,0,0,1)');
            if (hardStop < 1.0) {
                 gradient.addColorStop(hardStop, 'rgba(0,0,0,1)');
            }
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            
            bCtx.fillStyle = gradient;
            bCtx.fillRect(0, 0, brushSize*2, brushSize*2);
            
            // Draw the brush canvas onto the main canvas
            ctx.drawImage(
                brushCanvas,
                targetX - brushSize,
                targetY - brushSize
            );
            
        } catch (e) {
            // Ignored, usually happens when dragging out of bounds
            console.log("Out of bounds clone attempt", e);
        }
    }
});
