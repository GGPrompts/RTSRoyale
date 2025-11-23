// Input handling for RTS Arena
export interface InputState {
  // Ability keys (this frame)
  qPressed: boolean;
  wPressed: boolean;
  ePressed: boolean;

  // Mouse state
  mouseX: number;
  mouseY: number;
  mouseLeftDown: boolean;
  mouseRightDown: boolean;

  // Modifiers
  shiftDown: boolean;
  ctrlDown: boolean;
}

// Current input state
let inputState: InputState = {
  qPressed: false,
  wPressed: false,
  ePressed: false,
  mouseX: 0,
  mouseY: 0,
  mouseLeftDown: false,
  mouseRightDown: false,
  shiftDown: false,
  ctrlDown: false,
};

// Keys pressed this frame (cleared each frame)
let frameKeys = new Set<string>();

export function initInput(canvas: HTMLCanvasElement): void {
  console.log('🎮 Initializing input system...');

  // Keyboard events
  window.addEventListener('keydown', (e) => {
    // Prevent default for game keys
    if (['q', 'w', 'e', 'Q', 'W', 'E'].includes(e.key)) {
      e.preventDefault();
    }

    // Track keys pressed this frame
    frameKeys.add(e.key.toLowerCase());

    // Track modifier keys
    inputState.shiftDown = e.shiftKey;
    inputState.ctrlDown = e.ctrlKey;
  });

  window.addEventListener('keyup', (e) => {
    // Clear modifier keys
    inputState.shiftDown = e.shiftKey;
    inputState.ctrlDown = e.ctrlKey;
  });

  // Mouse events
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    inputState.mouseX = e.clientX - rect.left;
    inputState.mouseY = e.clientY - rect.top;
  });

  canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) inputState.mouseLeftDown = true;
    if (e.button === 2) inputState.mouseRightDown = true;
  });

  canvas.addEventListener('mouseup', (e) => {
    if (e.button === 0) inputState.mouseLeftDown = false;
    if (e.button === 2) inputState.mouseRightDown = false;
  });

  // Prevent context menu on right-click
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  console.log('✅ Input system initialized');
}

// Called once per frame to update input state
export function updateInput(): void {
  // Update ability key states (only true for one frame)
  inputState.qPressed = frameKeys.has('q');
  inputState.wPressed = frameKeys.has('w');
  inputState.ePressed = frameKeys.has('e');

  // Clear frame keys for next frame
  frameKeys.clear();
}

// Get current input state
export function getInput(): InputState {
  return inputState;
}

// Helper to check if an ability key was pressed this frame
export function isAbilityPressed(key: 'q' | 'w' | 'e'): boolean {
  switch (key) {
    case 'q': return inputState.qPressed;
    case 'w': return inputState.wPressed;
    case 'e': return inputState.ePressed;
    default: return false;
  }
}