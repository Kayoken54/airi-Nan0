export interface StageWindowBounds {
  height: number
  width: number
  x: number
  y: number
}

export const STAGE_COLLAPSED_WINDOW_BOUNDS = {
  height: 34,
  width: 64,
} as const

export function collapseBoundsToTopRight(bounds: StageWindowBounds): StageWindowBounds {
  return {
    x: Math.round(bounds.x + bounds.width - STAGE_COLLAPSED_WINDOW_BOUNDS.width),
    y: Math.round(bounds.y),
    width: STAGE_COLLAPSED_WINDOW_BOUNDS.width,
    height: STAGE_COLLAPSED_WINDOW_BOUNDS.height,
  }
}

export function restoreBoundsFromCollapsedPill(params: {
  collapsedBounds: StageWindowBounds
  restoreBounds: StageWindowBounds
}): StageWindowBounds {
  return {
    x: Math.round(params.collapsedBounds.x + params.collapsedBounds.width - params.restoreBounds.width),
    y: Math.round(params.collapsedBounds.y),
    width: Math.round(params.restoreBounds.width),
    height: Math.round(params.restoreBounds.height),
  }
}
