# Architecture Refactoring Plan

Based on the Moondream demo architecture pattern, here's how we can refactor Imboni to follow better separation of concerns.

## Current Structure

- `app/(blind)/live.tsx` - Monolithic orchestration (200+ lines)
- `components/blind/CameraView.tsx` - Camera + auto-capture logic
- `lib/bentoml-api.ts` - API client
- Hooks: `use-tts`, `use-help-request`, `use-camera-stream`

## Proposed Refactored Structure

### 1. Domain-Specific Hooks

#### `hooks/use-video-session.ts`
**Purpose**: Manage video element, permissions, frame capture, camera state

```typescript
export function useVideoSession() {
  // - Camera permissions
  // - Camera facing (front/back)
  // - Fullscreen state
  // - Frame capture (debounced)
  // - Media stream handling
  // - Auto-mirroring for front camera
  // - Inactivity timeouts
}
```

**Current location**: Logic split between `CameraView` and `use-camera-stream`

#### `hooks/use-analysis-session.ts`
**Purpose**: Bridge video session with frame analysis, manage rolling history

```typescript
export function useAnalysisSession(videoSession: VideoSession) {
  // - Connect video frames to analysis
  // - Rolling history of results (last N analyses)
  // - Analysis state management
  // - Confidence tracking
  // - Trigger help requests based on confidence
}
```

**Current location**: Logic in `live.tsx` (handleAnalysis, handleSnap)

#### `hooks/use-frame-analysis.ts`
**Purpose**: Frame analysis pipeline with debouncing, retries, structured results

```typescript
export function useFrameAnalysis() {
  // - Debounce frame grabs
  // - Call Moondream API
  // - Retry on throttling/errors
  // - Emit structured results/notifications
  // - Handle different prompt types (summary, triggers)
}
```

**Current location**: Logic in `live.tsx` and `bentoml-api.ts`

#### `hooks/use-trigger-manager.ts` (Future Enhancement)
**Purpose**: Manage predefined + custom triggers, persist to storage

```typescript
export function useTriggerManager() {
  // - Predefined triggers (obstacles, signs, people)
  // - Custom user-defined triggers
  // - Persist to AsyncStorage
  // - Active Moondream queries
  // - Notification copy generation
}
```

**Current location**: Not implemented (could enhance low-confidence handling)

### 2. Presentation Layer

#### `components/blind/LiveScreen.tsx` (Refactored)
**Purpose**: Orchestrate hooks, minimal logic

```typescript
export default function LiveScreen() {
  const videoSession = useVideoSession();
  const analysisSession = useAnalysisSession(videoSession);
  const frameAnalysis = useFrameAnalysis();
  const triggerManager = useTriggerManager();
  
  // Minimal orchestration
  // Render overlays
}
```

#### `components/blind/CameraSurface.tsx`
**Purpose**: Pure video canvas rendering

```typescript
// Just renders the camera view
// No business logic
```

#### `components/blind/AnalysisOverlay.tsx`
**Purpose**: Display analysis results, notifications

```typescript
// Scrolling stack of results
// Confidence indicators
// Help request prompts
```

#### `components/blind/PromptControlsOverlay.tsx` (Future)
**Purpose**: Custom prompt input, trigger picker

```typescript
// Free-form prompt input
// Trigger selection
// Analysis mode toggle
```

### 3. Benefits of This Architecture

1. **Separation of Concerns**: Each hook has a single responsibility
2. **Testability**: Hooks can be tested independently
3. **Reusability**: Hooks can be used in other screens
4. **Maintainability**: Easier to find and fix bugs
5. **Extensibility**: Easy to add features (triggers, custom prompts)
6. **Performance**: Better optimization opportunities (memoization, debouncing)

### 4. Migration Path

**Phase 1: Extract Video Session**
- Move camera logic from `CameraView` to `use-video-session.ts`
- Keep `CameraView` as pure presentation

**Phase 2: Extract Analysis Session**
- Move analysis orchestration from `live.tsx` to `use-analysis-session.ts`
- Connect to video session

**Phase 3: Extract Frame Analysis**
- Move API calls and retry logic to `use-frame-analysis.ts`
- Add debouncing and structured results

**Phase 4: Refactor Presentation**
- Split `live.tsx` into smaller components
- Create overlays for different UI states

**Phase 5: Add Advanced Features** (Optional)
- Implement trigger manager
- Add custom prompt support
- Add analysis history view

### 5. Key Patterns to Apply

#### Debouncing Frame Captures
```typescript
// In use-frame-analysis.ts
const debouncedAnalyze = useMemo(
  () => debounce((frame: string) => {
    // Analysis logic
  }, 500),
  []
);
```

#### Rolling History
```typescript
// In use-analysis-session.ts
const [history, setHistory] = useState<AnalysisResult[]>([]);
const MAX_HISTORY = 10;

const addToHistory = (result: AnalysisResult) => {
  setHistory(prev => [result, ...prev].slice(0, MAX_HISTORY));
};
```

#### Retry Logic
```typescript
// In use-frame-analysis.ts
const analyzeWithRetry = async (frame: string, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await analyzeImage(frame);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
```

### 6. Current vs Refactored Comparison

| Aspect | Current | Refactored |
|--------|---------|------------|
| **Main Screen** | 200+ lines, mixed concerns | ~50 lines, orchestration only |
| **Camera Logic** | Split between component and hook | Single `use-video-session` hook |
| **Analysis Logic** | In main screen | `use-analysis-session` + `use-frame-analysis` |
| **State Management** | Multiple useState in one file | Distributed across hooks |
| **Testability** | Hard to test | Each hook testable independently |
| **Reusability** | Tightly coupled | Hooks reusable across screens |

## Implementation Priority

1. **High Priority**: Extract `use-frame-analysis` (improves error handling, retries)
2. **Medium Priority**: Extract `use-analysis-session` (improves state management)
3. **Medium Priority**: Extract `use-video-session` (improves camera handling)
4. **Low Priority**: Refactor presentation layer (cosmetic improvements)
5. **Future**: Add trigger manager (new feature)

