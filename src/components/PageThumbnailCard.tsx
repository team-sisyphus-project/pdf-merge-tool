import { useEffect, useRef, useState } from 'react'
import type { SourceColor } from '../core/source-color'
import type { ThumbnailRenderer } from '../core/thumbnail'

/**
 * One page rendered as a thumbnail card (design spec §4: 페이지 그리드).
 *
 * Two design-spec behaviours live here:
 *
 * - **Lazy render (§6, 대용량 파일 UI 멈춤 방지).** The heavy pdf.js rasterise is
 *   deferred until the card actually approaches the viewport, observed via
 *   `IntersectionObserver`. A workspace with hundreds of pages therefore only
 *   rasterises what the user can (nearly) see, keeping scroll responsive.
 * - **Source colour tag (§4/§5, 출처 파일별 색 태그).** Each card carries the
 *   categorical colour assigned to its origin file so the user can tell at a
 *   glance which PDF a page came from. The colour is a design-token reference
 *   ({@link SourceColor.cssVar}) — no raw hex reaches this component.
 *
 * Presentational + orchestration only: the actual raster is produced by the
 * grain-1 {@link ThumbnailRenderer}, injected so the parent can share one
 * document cache across every card.
 */
export interface PageThumbnailCardProps {
  /** Origin file id — the renderer's document-cache key. */
  sourceId: string
  /** Original PDF bytes of the origin file (handed to the renderer). */
  bytes: ArrayBuffer
  /** Zero-based page index within the origin document. */
  pageIndex: number
  /** Human-facing name of the origin file, shown under the thumbnail. */
  sourceName: string
  /** 1-based page number within the origin file, shown as a badge. */
  pageLabel: number
  /** Categorical colour assigned to the origin file (token reference). */
  color: SourceColor
  /** Desired thumbnail width in device pixels. */
  targetWidth: number
  /** Shared pdf.js-backed rasteriser (grain-1). */
  renderer: ThumbnailRenderer
}

/** Lazy render lifecycle of a single card. */
type RenderState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; dataUrl: string }
  | { status: 'error' }

/**
 * How far outside the viewport a card starts rendering, so a thumbnail is ready
 * by the time it scrolls into view. Implementation setting, not a design token.
 */
const PRELOAD_MARGIN = '300px'

export default function PageThumbnailCard({
  sourceId,
  bytes,
  pageIndex,
  sourceName,
  pageLabel,
  color,
  targetWidth,
  renderer,
}: PageThumbnailCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [state, setState] = useState<RenderState>({ status: 'idle' })

  // Observe viewport entry; flip `visible` once (then stop observing) so the
  // render fires a single time. Where IntersectionObserver is unavailable
  // (SSR / older engines) fall back to rendering eagerly rather than never.
  useEffect(() => {
    const el = cardRef.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true)
            observer.disconnect()
            break
          }
        }
      },
      { rootMargin: PRELOAD_MARGIN },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Rasterise once visible. `cancelled` guards against a state update after the
  // card unmounts or its inputs change mid-render.
  useEffect(() => {
    if (!visible) return
    let cancelled = false
    setState({ status: 'loading' })

    renderer
      .render({ sourceId, bytes, pageIndex, targetWidth })
      .then((thumbnail) => {
        if (!cancelled) setState({ status: 'ready', dataUrl: thumbnail.dataUrl })
      })
      .catch(() => {
        // A single page failing to render must not corrupt the workspace
        // (§6): surface it on the card and leave every other page intact.
        if (!cancelled) setState({ status: 'error' })
      })

    return () => {
      cancelled = true
    }
  }, [visible, renderer, sourceId, bytes, pageIndex, targetWidth])

  return (
    <div className="page-card" ref={cardRef}>
      <div className="page-card__thumb">
        {state.status === 'ready' ? (
          <img
            className="page-card__image"
            src={state.dataUrl}
            alt={`${sourceName} ${pageLabel}페이지 미리보기`}
            loading="lazy"
          />
        ) : state.status === 'error' ? (
          <span className="page-card__status page-card__status--error" role="img" aria-label="미리보기를 불러오지 못했습니다">
            !
          </span>
        ) : (
          <span
            className="page-card__status"
            aria-label="미리보기 준비 중"
            role="status"
          >
            <span className="page-card__spinner" aria-hidden="true" />
          </span>
        )}
        <span className="page-card__badge" aria-hidden="true">
          {pageLabel}
        </span>
      </div>

      <div className="page-card__meta">
        <span
          className="page-card__tag"
          style={{ backgroundColor: color.cssVar }}
          aria-hidden="true"
        />
        <span className="page-card__source" title={sourceName}>
          {sourceName}
        </span>
      </div>
    </div>
  )
}
