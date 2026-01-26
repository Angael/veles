# Infinite Scroll Improvements for Media Page

This document proposes solutions for three problems with the current infinite query implementation in `/media`.

## Current State

The media page uses `useInfiniteQuery` from TanStack Query with a "Load More" button. This works but has limitations:

1. No virtualization - rendering thousands of items will degrade performance
2. No scroll restoration - navigating back loses scroll position
3. Manual trigger - requires clicking a button instead of auto-loading

---

## Problem 1: Virtualization

### The Problem
After loading many pages (e.g., 10 pages × 48 items = 480 DOM nodes), the browser struggles with:
- Layout calculations for hundreds of grid items
- Memory consumption from mounted React components
- Repaint/reflow costs when scrolling

### Proposed Solution: TanStack Virtual

Use `@tanstack/react-virtual` - fits naturally with the existing TanStack ecosystem.

**Why TanStack Virtual over alternatives:**
- Same maintainer as TanStack Query/Router (consistent APIs)
- Lightweight (~2KB gzipped)
- Works with CSS Grid (important for the current layout)
- Supports variable-size items and dynamic measurements

**Alternative considered:** `react-virtuoso` - more batteries-included but heavier (~15KB) and less control over grid layouts.

**Implementation approach:**
```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

// Virtualize rows (not individual items) for grid layout
const rowVirtualizer = useVirtualizer({
  count: Math.ceil(mediaItems.length / COLUMNS),
  getScrollElement: () => parentRef.current,
  estimateSize: () => ITEM_HEIGHT, // e.g., 200px per row
  overscan: 2, // render 2 extra rows above/below viewport
});
```

**Key considerations:**
- Grid virtualization requires virtualizing rows, not individual cells
- Need a scroll container with fixed height (or use window as scroll element)
- The current aspect-square items make height estimation straightforward

---

## Problem 2: Scroll Restoration / Go Back Mechanism

### The Problem
When user clicks an item on page 6, navigates to `/media/123`, then presses back:
- The infinite query resets to initial data (page 1 only)
- Scroll position is lost
- User has to scroll/load again to find where they were

### Proposed Solution: Multi-layered approach

**Layer 1: TanStack Router scroll restoration**

TanStack Router has built-in scroll restoration. Ensure it's enabled:
```tsx
// In router config
scrollRestoration: true,
```

This handles restoring the scroll position but NOT the loaded data.

**Layer 2: Persist query data across navigation**

Option A: **Increase staleTime/gcTime** (simplest)
```tsx
useInfiniteQuery({
  queryKey: ['media'],
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000,   // 10 minutes (formerly cacheTime)
  // ...
});
```
This keeps the query data in cache longer, so navigating back reuses cached pages.

Option B: **Store scroll index in URL search params**
```
/media?page=6&scrollIndex=127
```
On mount, restore to that position. More complex but survives full page refreshes.

Option C: **Use sessionStorage for scroll position**
Store the scroll offset before navigation, restore on return. Works well with virtualization.

**Recommended:** Start with Option A (longer cache times) + Router scroll restoration. If insufficient, add Option C.

**With virtualization:** The virtualizer needs to know the scroll offset to render the correct rows. This works automatically if the scroll container's scrollTop is restored before the virtualizer initializes.

---

## Problem 3: Infinite Scroll Trigger

### The Problem
Currently requires clicking "Load More" button. Users expect automatic loading when scrolling near the bottom.

### Proposed Solution: Intersection Observer

Use the native Intersection Observer API (or `react-intersection-observer` wrapper) to detect when a sentinel element near the bottom becomes visible.

**Option A: Native Intersection Observer**
```tsx
const loadMoreRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    { rootMargin: '200px' } // trigger 200px before visible
  );

  if (loadMoreRef.current) observer.observe(loadMoreRef.current);
  return () => observer.disconnect();
}, [hasNextPage, isFetchingNextPage, fetchNextPage]);

// In JSX, place sentinel at end of grid
<div ref={loadMoreRef} className="h-1" />
```

**Option B: react-intersection-observer library**
```tsx
import { useInView } from 'react-intersection-observer';

const { ref, inView } = useInView({ rootMargin: '200px' });

useEffect(() => {
  if (inView && hasNextPage && !isFetchingNextPage) {
    fetchNextPage();
  }
}, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);
```

**Recommended:** Native Intersection Observer - no additional dependency, simple enough for this use case.

**With virtualization:** The sentinel element should be placed OUTSIDE the virtualized container, after all virtual rows, so it remains in the DOM and can trigger loading.

---

## Implementation Order

The three features have dependencies:

1. **Infinite scroll trigger** - Can be added independently, quick win
2. **Virtualization** - Independent but affects scroll restoration approach
3. **Scroll restoration** - Should be implemented after virtualization to account for virtual scroll positions

---

## TODO List for Implementation

### Phase 1: Infinite Scroll Trigger
- [ ] Add Intersection Observer to detect when user scrolls near bottom
- [ ] Place sentinel element after the media grid
- [ ] Configure rootMargin for early triggering (e.g., 200-400px)
- [ ] Add loading indicator at bottom while fetching
- [ ] Keep "Load More" button as fallback (hidden when JS/observer works)

### Phase 2: Virtualization
- [ ] Install `@tanstack/react-virtual`
- [ ] Create scroll container with ref for virtualizer
- [ ] Calculate grid dimensions (columns based on breakpoint, row height)
- [ ] Implement row-based virtualization for grid layout
- [ ] Ensure sentinel element remains outside virtualized area
- [ ] Test with 500+ items to verify performance improvement

### Phase 3: Scroll Restoration
- [ ] Verify TanStack Router scroll restoration is enabled
- [ ] Increase staleTime/gcTime on the infinite query
- [ ] Test back navigation preserves position
- [ ] If needed: store virtualizer scroll offset in sessionStorage before navigation
- [ ] If needed: restore scroll offset on component mount

---

## Dependencies to Add

```bash
pnpm add @tanstack/react-virtual
```

`react-intersection-observer` is optional - native API is sufficient.

---

## Files to Modify

- `src/routes/media/index.tsx` - Main implementation
- `src/routes/__root.tsx` - Verify scroll restoration config (if not already enabled)

---

## Context for Future Sessions

**Current file:** `src/routes/media/index.tsx`

**Current implementation:**
- Uses `useInfiniteQuery` with cursor-based pagination
- Grid layout with responsive columns (2-6 based on breakpoint)
- Items are square aspect ratio with hover overlay
- Loader provides initial data for SSR

**Grid structure:**
- Tailwind classes: `grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4`
- Each item: `aspect-square` with `rounded-lg`

**Key functions:**
- `getMediaItems` - server function returning `{ items, nextCursor, hasMore }`
- `getThumbnail(thumbnails, 'MD')` - selects appropriate thumbnail size
- `s3PathToUrl(path)` - converts S3 path to CDN URL

**When implementing virtualization:**
- Row height = item width (square) + gap
- Need to calculate columns dynamically based on container width
- Consider using `useWindowVirtualizer` for window-based scrolling vs container-based
