import { describe, expect, it } from 'vitest'

import { collapseBoundsToTopRight, restoreBoundsFromCollapsedPill, STAGE_COLLAPSED_WINDOW_BOUNDS } from './stage-window-collapse'

describe('stage window collapse bounds', () => {
  it('collapses actor bounds to a top-right pill and restores from the moved pill position', () => {
    const original = { x: 100, y: 80, width: 450, height: 600 }

    expect(collapseBoundsToTopRight(original)).toEqual({
      x: 100 + 450 - STAGE_COLLAPSED_WINDOW_BOUNDS.width,
      y: 80,
      width: STAGE_COLLAPSED_WINDOW_BOUNDS.width,
      height: STAGE_COLLAPSED_WINDOW_BOUNDS.height,
    })

    expect(restoreBoundsFromCollapsedPill({
      collapsedBounds: { x: 700, y: 120, width: STAGE_COLLAPSED_WINDOW_BOUNDS.width, height: STAGE_COLLAPSED_WINDOW_BOUNDS.height },
      restoreBounds: original,
    })).toEqual({
      x: 700 + STAGE_COLLAPSED_WINDOW_BOUNDS.width - 450,
      y: 120,
      width: 450,
      height: 600,
    })
  })
})
