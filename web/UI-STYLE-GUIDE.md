# Asteria UI Style Guide

## Design Philosophy

Asteria follows a modern, minimalist design approach inspired by shadcn/ui components. The interface prioritizes clarity, functionality, and visual hierarchy while maintaining a professional aesthetic.

## Color System

### Light Mode
- **Background**: Pure white (`#ffffff`) for main areas, clean black (`#000000`) for backgrounds
- **Text**: Dark gray (`text-gray-900`) for primary content
- **Borders**: Black (`border-black`) for node borders
- **Accents**: Muted grays for subtle elements

### Dark Mode  
- **Background**: Pure black (`#000000`) for main areas
- **Nodes**: Dark charcoal (`#191919`) for node backgrounds
- **Text**: Pure white (`text-white`) for high contrast
- **Borders**: Medium gray (`border-gray-600`) for subtle separation

### Theme Implementation
- Uses CSS classes with `dark:` prefixes for dark mode variants
- Theme toggle persists preference to localStorage
- Reactive theme switching via MutationObserver for real-time updates

## Typography

### Hierarchy
- **Navbar Logo**: 6-height image assets (asteria-light.png / asteria-dark.png)
- **Node Titles**: Small font (`text-[12px]`) with medium weight (`font-medium`)
- **Node Labels**: Extra small caps (`text-[10px]`) with semibold weight (`font-semibold`)
- **Node Body**: Tiny font (`text-[11px]`) with reduced opacity (`opacity-70`)

### Font Sizing Strategy
- Prioritizes information density over large text
- Uses precise pixel values for consistent rendering
- Maintains readability through proper contrast and spacing

## Layout & Spacing

### Navbar
- **Height**: Compact 12 units (`h-12`) for more screen real estate
- **Padding**: Horizontal padding of 6 units (`px-6`)
- **Alignment**: Logo left, navigation center, controls right
- **Background**: Theme-aware (white/black) without borders

### Graph Canvas
- **Background**: Clean theme-aware surfaces (white/black)
- **No decorative elements**: Removed dot patterns and borders
- **Full viewport**: Utilizes entire available space
- **Node positioning**: Auto-layout with disabled dragging

### AI Assistant
- **Overlay positioning**: Centered top overlay (`top-16`)
- **Width**: Responsive with max constraints (`w-[min(1000px,92vw)]`)
- **Background**: Semi-transparent with backdrop blur
- **Toggle**: Star icon (⭐) for intuitive access

## Component Patterns

### Nodes
- **Shape**: Rounded corners (`rounded-lg`) for modern feel
- **Size**: Fixed minimum width (`min-w-48`) with max constraints
- **Padding**: Compact (`p-3`) for information density
- **Shadows**: Subtle (`shadow-sm`) with hover effects
- **Score display**: Bottom-right badge showing total/25

### Interactive Elements
- **Buttons**: Consistent padding (`px-3 py-1`) with hover states
- **Transitions**: Smooth color transitions (`transition-colors`)
- **States**: Clear visual feedback for hover/active/disabled
- **Icons**: Emoji-based for universal recognition

### Modal/Overlay Components
- **Backdrop**: Semi-transparent with blur effects
- **Positioning**: Centered with responsive sizing
- **Borders**: Subtle with rounded corners
- **Animation**: Smooth entry/exit transitions

## Interaction Design

### Navigation
- **Theme Toggle**: Sun icon (☀️) for universal recognition
- **AI Toggle**: Star icon (⭐) indicating special/premium feature
- **Logout**: Text-based for clarity
- **Menu Items**: shadcn/ui NavigationMenu patterns

### Graph Interactions
- **Selection**: Visual feedback with ring indicators
- **Editing**: Double-click opens central modal (not sidebar)
- **Movement**: Disabled for cleaner, organized layouts
- **Connections**: Visual relationship indicators

## Accessibility

### Color Contrast
- High contrast ratios in both light and dark modes
- Pure white/black combinations for maximum readability
- Consistent color application across themes

### Interactive Feedback
- Hover states for all clickable elements
- Focus indicators for keyboard navigation
- Clear visual hierarchy for screen readers
- Semantic HTML structure

### Typography
- Sufficient font sizes despite compact design
- Clear visual hierarchy through weight and spacing
- Proper contrast ratios for all text elements

## Development Guidelines

### CSS Classes
- Prefer Tailwind utility classes over custom CSS
- Use `dark:` prefixes for theme-aware styling
- Consistent spacing scale (multiples of 4px)
- Semantic color naming over hardcoded values

### Component Structure
- Follow shadcn/ui component patterns
- Maintain consistent prop interfaces
- Implement proper TypeScript typing
- Use React hooks for state management

### Theme Management
- Centralized theme logic in toggle component
- Persistent theme preference storage
- Real-time theme switching capability
- Consistent theme application across components

## Settings & Configuration

### Settings Pages
- **Layout**: Use SidebarProvider with SidebarInset for main content
- **Navigation**: Left sidebar with menu items using SidebarMenu components
- **Content**: Right-side content area with proper spacing and form layouts
- **Sections**: Clearly separated sections with SidebarSeparator components

### Form Inputs
- **API Keys**: Password-type inputs with toggle visibility buttons
- **Labels**: Clear, descriptive labels using proper hierarchy
- **Validation**: Real-time feedback with appropriate error states
- **Save Actions**: Prominent save buttons with loading states

### Sidebar Components
- **Structure**: SidebarProvider wraps the entire layout
- **Content**: SidebarContent contains all menu items and groups
- **Groups**: SidebarGroup with SidebarGroupLabel for section organization
- **Items**: SidebarMenuItem with SidebarMenuButton for navigation
- **States**: Active states clearly indicated with data-active attribute

This style guide ensures consistency across the Asteria application while maintaining the modern, professional aesthetic established by shadcn/ui components.