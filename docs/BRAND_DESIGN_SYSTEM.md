# Imboni Brand Design System

## Typography

### Default Font
- **Font Family**: Monospace (`font-mono`) - Set globally on body element
- All text elements inherit monospace font by default
- No need to add `font-mono` to individual elements unless overriding

### Font Sizes
- Headings: Use standard Tailwind sizes (text-3xl, text-4xl, etc.)
- Body text: text-sm, text-base
- Labels: text-sm

## Buttons

### Style Rules
- **Border Radius**: `rounded-none` (square corners, no rounded edges) - **DEFAULT**
- **Font**: Inherits `font-mono` from body
- **Variants**: Use standard shadcn button variants
- **Focus States**: Standard focus-visible ring
- **Note**: `rounded-none` is the default, no need to add it explicitly

### Example
```tsx
<Button className="font-mono">
  Button Text
</Button>
```

## Input Fields

### Style Rules
- **Border Radius**: `rounded-none` (square corners) - **DEFAULT**
- **Border**: `border border-input` (standard border styling)
- **Focus States**: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`
- **Background**: `bg-background`
- **Height**: Typically `h-12` for form inputs
- **Note**: `rounded-none` is the default, no need to add it explicitly

### Example
```tsx
<Input 
  className="h-12 bg-background border border-input focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
/>
```

## Color System

### Primary Colors
- Uses theme-based color system (primary, background, foreground, etc.)
- Hover states: `hover:text-primary` for links
- Muted text: `text-muted-foreground`

### Borders
- Standard: `border border-input` or `border border-border`
- No custom opacity variations unless specified

## Layout & Spacing

### Principles
- Clean, minimal design
- Consistent padding and margins
- Grid-based layouts where appropriate

## Design Principles

1. **Square Corners**: All buttons and inputs use `rounded-none`
2. **Monospace Typography**: All text uses monospace font by default
3. **Consistent Borders**: Standard border styling throughout
4. **Minimal Styling**: Clean, simple design without excessive decoration
5. **Accessibility First**: Proper focus states and keyboard navigation

## Component Guidelines

### When Creating New Components
- Always use `rounded-none` for buttons and inputs
- Don't add `font-mono` unless overriding (it's global)
- Use standard border styling: `border border-input`
- Follow the focus state pattern: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`
- Maintain consistent spacing and padding

### When Updating Existing Components
- Replace any `rounded-md`, `rounded-lg`, etc. with `rounded-none`
- Ensure inputs use `border border-input` instead of custom borders
- Remove any `font-sans` or other font overrides (monospace is default)
- Update focus states to match the standard pattern

