import { useEffect, useMemo, useRef, useState } from "react";
import type { GraphEdge, GraphNode } from "@/contracts/graph";

interface CaseGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  citationEdgeCount: number;
  relatedCaseCount: number;
  resolvedRelatedCaseCount: number;
  unresolvedRelatedCaseCount: number;
  omittedRelatedCaseCount: number;
  resultIds: string[];
  onOpenResult: (caseId: string) => void;
}

interface SimNode {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const WORLD_W = 1200;
const WORLD_H = 700;
const MIN_ZOOM_W = 220;
const MAX_ZOOM_W = 2200;

function seedPositions(nodeIds: string[]): Map<string, SimNode> {
  const map = new Map<string, SimNode>();
  const n = Math.max(nodeIds.length, 1);
  nodeIds.forEach((id, i) => {
    const angle = (i / n) * Math.PI * 2;
    const radius = Math.min(WORLD_W, WORLD_H) * 0.34;
    map.set(id, {
      id,
      x: WORLD_W / 2 + Math.cos(angle) * radius,
      y: WORLD_H / 2 + Math.sin(angle) * radius,
      vx: 0,
      vy: 0,
    });
  });
  return map;
}

function splitNodeLabel(title: string): [string, string?] {
  const words = title.split(/\s+/).filter(Boolean);
  const lines: [string, string] = ["", ""];
  for (const word of words) {
    const lineIndex = lines[0].length < 18 ? 0 : 1;
    if (lineIndex === 1 && `${lines[1]} ${word}`.trim().length > 20) {
      lines[1] = `${lines[1].replace(/…$/, "").trim()}…`;
      break;
    }
    lines[lineIndex] = `${lines[lineIndex]} ${word}`.trim();
  }
  return lines[1] ? [lines[0], lines[1]] : [lines[0]];
}

export function CaseGraph({
  nodes,
  edges,
  citationEdgeCount,
  relatedCaseCount,
  resolvedRelatedCaseCount,
  unresolvedRelatedCaseCount,
  omittedRelatedCaseCount,
  resultIds,
  onOpenResult,
}: CaseGraphProps) {
  const resultIdSet = useMemo(() => new Set(resultIds), [resultIds]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [, setTick] = useState(0);
  const [view, setView] = useState({ x: 0, y: 0, w: WORLD_W, h: WORLD_H });

  const svgRef = useRef<SVGSVGElement | null>(null);
  const simRef = useRef<Map<string, SimNode>>(seedPositions(nodes.map((n) => n.id)));
  const alphaRef = useRef(1);
  const draggingRef = useRef<string | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const dragMovedRef = useRef(false);
  const panRef = useRef<{ startX: number; startY: number; viewX: number; viewY: number } | null>(
    null,
  );

  const visibleEdges = edges;

  const degree = useMemo(() => {
    const counts = new Map<string, number>();
    visibleEdges.forEach((edge) => {
      counts.set(edge.source, (counts.get(edge.source) ?? 0) + 1);
      counts.set(edge.target, (counts.get(edge.target) ?? 0) + 1);
    });
    return counts;
  }, [visibleEdges]);

  const neighborsOf = useMemo(() => {
    const map = new Map<string, Set<string>>();
    visibleEdges.forEach((edge) => {
      if (!map.has(edge.source)) map.set(edge.source, new Set());
      if (!map.has(edge.target)) map.set(edge.target, new Set());
      map.get(edge.source)?.add(edge.target);
      map.get(edge.target)?.add(edge.source);
    });
    return map;
  }, [visibleEdges]);

  useEffect(() => {
    simRef.current = seedPositions(nodes.map((n) => n.id));
    alphaRef.current = 1;
    setView({ x: 0, y: 0, w: WORLD_W, h: WORLD_H });
  }, [nodes]);

  useEffect(() => {
    let frame = 0;
    let cancelled = false;

    const step = () => {
      if (cancelled) return;
      const alpha = alphaRef.current;
      if (alpha > 0.01) {
        const sim = simRef.current;
        const list = Array.from(sim.values());

        for (let i = 0; i < list.length; i += 1) {
          const a = list[i];
          if (!a || a.id === draggingRef.current) continue;
          let fx = 0;
          let fy = 0;

          for (let j = 0; j < list.length; j += 1) {
            if (i === j) continue;
            const b = list[j];
            if (!b) continue;
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const distSq = Math.max(dx * dx + dy * dy, 25);
            const force = 6500 / distSq;
            fx += (dx / Math.sqrt(distSq)) * force;
            fy += (dy / Math.sqrt(distSq)) * force;
          }

          fx += (WORLD_W / 2 - a.x) * 0.0025;
          fy += (WORLD_H / 2 - a.y) * 0.0025;

          a.vx = (a.vx + fx * alpha) * 0.82;
          a.vy = (a.vy + fy * alpha) * 0.82;
        }

        visibleEdges.forEach((edge) => {
          const a = sim.get(edge.source);
          const b = sim.get(edge.target);
          if (!a || !b) return;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
          const target = edge.type === "cites" ? 225 : 270;
          const springForce = (dist - target) * (edge.type === "cites" ? 0.02 : 0.008) * alpha;
          const nx = dx / dist;
          const ny = dy / dist;
          if (a.id !== draggingRef.current) {
            a.vx += nx * springForce;
            a.vy += ny * springForce;
          }
          if (b.id !== draggingRef.current) {
            b.vx -= nx * springForce;
            b.vy -= ny * springForce;
          }
        });

        list.forEach((node) => {
          if (node.id === draggingRef.current) return;
          node.x += node.vx;
          node.y += node.vy;
        });

        alphaRef.current *= 0.985;
        setTick((t) => t + 1);
      }
      frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [visibleEdges]);

  const reheat = (amount: number) => {
    alphaRef.current = Math.max(alphaRef.current, amount);
  };

  const toSvgPoint = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const px = (clientX - rect.left) / rect.width;
    const py = (clientY - rect.top) / rect.height;
    return { x: view.x + px * view.w, y: view.y + py * view.h };
  };

  const openNode = (id: string) => {
    const node = nodeById.get(id);
    if (!node) return;
    if (resultIdSet.has(id)) {
      onOpenResult(id);
    } else if (node.availableInCorpus && node.sourceUrl) {
      window.open(node.sourceUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleNodePointerDown = (id: string) => (event: React.PointerEvent) => {
    event.stopPropagation();
    draggingRef.current = id;
    const node = simRef.current.get(id);
    dragStartRef.current = node ? { x: node.x, y: node.y } : null;
    dragMovedRef.current = false;
    reheat(0.35);
  };

  const handleSvgPointerMove = (event: React.PointerEvent) => {
    if (draggingRef.current) {
      const point = toSvgPoint(event.clientX, event.clientY);
      const node = simRef.current.get(draggingRef.current);
      if (node) {
        node.x = point.x;
        node.y = point.y;
        node.vx = 0;
        node.vy = 0;
        const start = dragStartRef.current;
        if (start) {
          const dist = Math.hypot(node.x - start.x, node.y - start.y);
          if (dist > 6) dragMovedRef.current = true;
        }
        setTick((t) => t + 1);
      }
      return;
    }
    if (panRef.current) {
      const dxClient = event.clientX - panRef.current.startX;
      const dyClient = event.clientY - panRef.current.startY;
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      const scaleX = view.w / rect.width;
      const scaleY = view.h / rect.height;
      setView((prev) => ({
        ...prev,
        x: panRef.current!.viewX - dxClient * scaleX,
        y: panRef.current!.viewY - dyClient * scaleY,
      }));
    }
  };

  const handleSvgPointerUp = () => {
    if (draggingRef.current) {
      const id = draggingRef.current;
      const wasClick = !dragMovedRef.current;
      draggingRef.current = null;
      dragStartRef.current = null;
      reheat(0.25);
      if (wasClick) openNode(id);
    }
    panRef.current = null;
  };

  const handleBackgroundPointerDown = (event: React.PointerEvent) => {
    panRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      viewX: view.x,
      viewY: view.y,
    };
  };

  const handleWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cursor = toSvgPoint(event.clientX, event.clientY);
    const zoomFactor = event.deltaY > 0 ? 1.12 : 0.89;
    const newW = Math.min(MAX_ZOOM_W, Math.max(MIN_ZOOM_W, view.w * zoomFactor));
    const newH = (newW / view.w) * view.h;
    const px = (cursor.x - view.x) / view.w;
    const py = (cursor.y - view.y) / view.h;
    setView({
      x: cursor.x - px * newW,
      y: cursor.y - py * newH,
      w: newW,
      h: newH,
    });
  };

  const nodeById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const referenceByTarget = useMemo(
    () => new Map(edges.map((edge) => [edge.target, edge])),
    [edges],
  );
  const hoveredNeighbors = hoveredId ? (neighborsOf.get(hoveredId) ?? new Set<string>()) : null;
  const hoveredNode = hoveredId ? nodeById.get(hoveredId) : null;
  const hoveredReference = hoveredId ? referenceByTarget.get(hoveredId) : null;

  if (citationEdgeCount === 0 || relatedCaseCount === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface px-6 py-16 text-center">
        <p className="font-serif text-xl font-semibold text-navy">No related cases found</p>
        <p className="mx-auto mt-2 max-w-xl text-[13px] leading-relaxed text-muted-foreground">
          The extracted judgment text for these results did not contain a named case reference that
          could be shown safely. Open an individual source judgment to verify any references that
          may appear only in scanned or unextracted pages.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="text-[12.5px] text-muted-foreground">
          <span className="font-medium text-navy">{relatedCaseCount}</span> related case
          {relatedCaseCount === 1 ? "" : "s"} found ·{" "}
          <span className="font-medium text-navy">{resolvedRelatedCaseCount}</span> available in
          corpus · <span className="font-medium text-navy">{unresolvedRelatedCaseCount}</span>{" "}
          reference-only
          {omittedRelatedCaseCount > 0
            ? ` · ${omittedRelatedCaseCount} more omitted to keep the graph readable`
            : ""}
        </div>
        <span className="text-[11px] text-muted-foreground">
          {citationEdgeCount} source-text connection{citationEdgeCount === 1 ? "" : "s"}
        </span>
      </div>

      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
          className="h-[620px] w-full touch-none select-none"
          onPointerMove={handleSvgPointerMove}
          onPointerUp={handleSvgPointerUp}
          onPointerLeave={handleSvgPointerUp}
          onWheel={handleWheel}
        >
          <defs>
            <marker
              id="case-graph-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L10,5 L0,10 z" className="fill-brand-blue" />
            </marker>
          </defs>

          <rect
            x={view.x - WORLD_W}
            y={view.y - WORLD_H}
            width={view.w + WORLD_W * 2}
            height={view.h + WORLD_H * 2}
            fill="transparent"
            onPointerDown={handleBackgroundPointerDown}
          />

          {visibleEdges.map((edge, idx) => {
            const a = simRef.current.get(edge.source);
            const b = simRef.current.get(edge.target);
            if (!a || !b) return null;
            const dimmed =
              hoveredId && hoveredId !== edge.source && hoveredId !== edge.target ? true : false;
            return (
              <line
                key={`${edge.source}-${edge.target}-${edge.type}-${idx}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                className={edge.type === "cites" ? "text-brand-blue" : "text-muted-foreground"}
                stroke="currentColor"
                strokeWidth={edge.type === "cites" ? 1.6 : 1}
                strokeDasharray={edge.type === "statute" ? "3 3" : undefined}
                opacity={dimmed ? 0.08 : edge.type === "cites" ? 0.75 : 0.35}
                markerEnd={edge.type === "cites" ? "url(#case-graph-arrow)" : undefined}
              >
                <title>{edge.evidence ? `${edge.label}\n${edge.evidence}` : edge.label}</title>
              </line>
            );
          })}

          {nodes.map((node) => {
            const pos = simRef.current.get(node.id);
            if (!pos) return null;
            const isResult = resultIdSet.has(node.id);
            const isHovered = hoveredId === node.id;
            const isDimmed = hoveredId ? !isHovered && !hoveredNeighbors?.has(node.id) : false;
            const r = Math.min(16, 7 + (degree.get(node.id) ?? 0) * 1.6);
            const labelLines = splitNodeLabel(node.title);
            return (
              <g
                key={node.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                opacity={isDimmed ? 0.25 : 1}
                onPointerDown={handleNodePointerDown(node.id)}
                onPointerEnter={() => setHoveredId(node.id)}
                onPointerLeave={() =>
                  setHoveredId((current) => (current === node.id ? null : current))
                }
                className={node.availableInCorpus ? "cursor-pointer" : "cursor-default"}
                role={node.availableInCorpus ? "button" : "img"}
                aria-label={
                  node.availableInCorpus
                    ? `${node.title}. Open case details.`
                    : `${node.title}. Related case reference not available in the local corpus.`
                }
                tabIndex={node.availableInCorpus ? 0 : undefined}
                onKeyDown={(event) => {
                  if (node.availableInCorpus && (event.key === "Enter" || event.key === " ")) {
                    event.preventDefault();
                    openNode(node.id);
                  }
                }}
              >
                <circle
                  r={r}
                  className={
                    isResult
                      ? "text-brand-blue"
                      : node.availableInCorpus
                        ? "text-muted-foreground"
                        : "text-saffron"
                  }
                  fill={isResult ? "currentColor" : "var(--surface)"}
                  stroke="currentColor"
                  strokeWidth={isResult ? 0 : 1.5}
                  strokeDasharray={!node.availableInCorpus ? "3 2" : undefined}
                />
                {isHovered && (
                  <circle
                    r={r + 4}
                    className="text-saffron"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  />
                )}
                <text
                  y={r + 12}
                  textAnchor="middle"
                  className="fill-foreground"
                  style={{ fontSize: 10, pointerEvents: "none" }}
                >
                  {labelLines.map((line, index) => (
                    <tspan key={`${node.id}-label-${index}`} x="0" dy={index === 0 ? 0 : 11}>
                      {line}
                    </tspan>
                  ))}
                </text>
              </g>
            );
          })}
        </svg>

        <div className="pointer-events-none absolute left-3 top-3 rounded-md border border-border bg-surface/95 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground shadow-2xs">
          <div className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-brand-blue" />
            Case in your results
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full border border-muted-foreground" />
            Related case available in corpus
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full border border-dashed border-saffron" />
            Named reference not in corpus
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3 bg-brand-blue" />
            Mentioned in judgment text
          </div>
        </div>

        {hoveredNode && (
          <div className="pointer-events-none absolute right-3 top-3 max-w-[340px] rounded-md border border-border bg-surface px-3 py-2.5 text-[12px] shadow-md">
            <p className="font-serif font-semibold text-navy">{hoveredNode.title}</p>
            <p className="mt-1 text-muted-foreground">
              {hoveredNode.court} · {hoveredNode.year} · {hoveredNode.citation}
            </p>
            <p className="mt-1.5 font-medium text-navy">
              {hoveredNode.availableInCorpus
                ? "Click to open this case"
                : "Reference only - case details are not in the local corpus"}
            </p>
            {hoveredReference?.evidence && (
              <p className="mt-2 border-t border-border pt-2 leading-relaxed text-muted-foreground">
                <span className="font-medium text-navy">Mention context:</span>{" "}
                {hoveredReference.evidence}
              </p>
            )}
          </div>
        )}
      </div>

      <p className="border-t border-border px-4 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
        Connections come from case names and reported citations found in the fetched judgments&apos;
        extracted text. Solid related-case nodes resolve to this corpus and can be opened; dashed
        gold nodes preserve named references whose details are unavailable locally. A mention does
        not prove that the cited case was followed or remains valid. Verify the source judgment.
        Drag nodes to rearrange, scroll to zoom, and drag the background to pan.
      </p>
    </div>
  );
}
