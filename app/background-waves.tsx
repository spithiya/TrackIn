export function BackgroundWaves() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        pointerEvents: 'none',
        overflow: 'hidden',
        background: 'white',
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        style={{ width: '100%', height: '100%' }}
      >
        <defs>
          {/*
            Outer glow — heavily blurred so colour fades to white well
            beyond the ribbon edges, matching the soft radiance in the reference.
          */}
          <filter id="bw-glow" x="-15%" y="-25%" width="130%" height="150%">
            <feGaussianBlur stdDeviation="42" />
          </filter>
          {/*
            Core — lightly blurred to keep the ribbon crisp while still
            avoiding a hard edge.
          */}
          <filter id="bw-core" x="-5%" y="-10%" width="110%" height="120%">
            <feGaussianBlur stdDeviation="9" />
          </filter>
        </defs>

        {/*
          ── RIBBON 1 ─────────────────────────────────────────────────────────
          Direction : left-middle → bottom-right
          Taper     : THICK (200 px) on the left → THIN (60 px) on the right

          The ribbon is defined by two independent cubic bezier edges.
          Top edge  : y=450 → y=840   (P1 pulls upward to create the gentle arc)
          Bottom edge: y=650 → y=900   (same arc shape, shifted down by 200→60 taper)

          Because the top/bottom control points are NOT vertically equidistant,
          the gap between the two edges shrinks from left to right — this is
          the actual taper. There is exactly ONE inflection (the upward bow at
          the start) and the curve is otherwise monotonically descending.

          ONE CROSSING: the two ribbons share the same [y_top, y_bottom] range
          only at x≈720 (the midpoint). Before and after that x position they
          occupy separate, non-overlapping y bands, producing a single crossing.
        */}

        {/* R1 outer glow — wide band, heavy blur */}
        <path
          d="M0 450 C500 350 950 850 1440 840
             L1440 900
             C950 940 500 503 0 650 Z"
          fill="#C4952A"
          opacity={0.35}
          filter="url(#bw-glow)"
        />
        {/* R1 core — narrow band, light blur */}
        <path
          d="M0 510 C500 397 950 873 1440 858
             L1440 882
             C950 910 500 457 0 590 Z"
          fill="#C4952A"
          opacity={0.58}
          filter="url(#bw-core)"
        />

        {/*
          ── RIBBON 2 ─────────────────────────────────────────────────────────
          Direction : bottom-left → right-middle
          Taper     : THIN (60 px) on the left → THICK (200 px) on the right

          Exact horizontal mirror of Ribbon 1.
          Top edge  : y=840 → y=450
          Bottom edge: y=900 → y=650

          The mirroring is achieved by reversing the control-point order of
          each edge, so the arc shape is identical but flows the opposite way.
        */}

        {/* R2 outer glow */}
        <path
          d="M0 840 C500 850 950 350 1440 450
             L1440 650
             C950 503 500 940 0 900 Z"
          fill="#C4952A"
          opacity={0.35}
          filter="url(#bw-glow)"
        />
        {/* R2 core */}
        <path
          d="M0 858 C500 873 950 397 1440 510
             L1440 590
             C950 457 500 910 0 882 Z"
          fill="#C4952A"
          opacity={0.58}
          filter="url(#bw-core)"
        />
      </svg>
    </div>
  )
}
