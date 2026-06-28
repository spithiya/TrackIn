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
          {/* Heavy blur for the outer soft glow — fades colour to white at ribbon edges */}
          <filter id="bw-glow" x="-30%" y="-60%" width="160%" height="220%">
            <feGaussianBlur stdDeviation="42" />
          </filter>
          {/* Light blur for the ribbon core — keeps shape while staying soft */}
          <filter id="bw-core" x="-10%" y="-25%" width="120%" height="150%">
            <feGaussianBlur stdDeviation="9" />
          </filter>
        </defs>

        {/*
          Ribbon 1 — enters left side at the vertical middle (top edge at y≈450),
          tapers from wide (≈200 px) on the left to thin (≈55 px) on the right,
          follows a sinusoidal S-curve down to the bottom-right.
        */}

        {/* Outer glow — wide path, heavy blur */}
        <path
          d="M0 440 C280 330 480 730 720 618 C910 520 1130 870 1440 838
             L1440 900 C1130 930 910 618 720 738 C480 870 280 548 0 658 Z"
          fill="#C4952A"
          opacity={0.42}
          filter="url(#bw-glow)"
        />
        {/* Core — narrow path, light blur, more opaque */}
        <path
          d="M0 508 C280 408 480 788 720 648 C910 548 1130 882 1440 858
             L1440 878 C1130 898 910 568 720 668 C480 808 280 428 0 528 Z"
          fill="#C4952A"
          opacity={0.68}
          filter="url(#bw-core)"
        />

        {/*
          Ribbon 2 — enters bottom-left thin (≈55 px), tapers wider (≈200 px)
          on the right, follows a mirrored sinusoidal S-curve up to the right middle.
          Crosses Ribbon 1 around x≈720, y≈660.
        */}

        {/* Outer glow */}
        <path
          d="M0 838 C280 870 480 520 720 618 C910 730 1130 330 1440 440
             L1440 658 C1130 548 910 870 720 738 C480 618 280 930 0 900 Z"
          fill="#C4952A"
          opacity={0.42}
          filter="url(#bw-glow)"
        />
        {/* Core */}
        <path
          d="M0 858 C280 878 480 548 720 648 C910 788 1130 408 1440 508
             L1440 528 C1130 428 910 808 720 668 C480 568 280 898 0 878 Z"
          fill="#C4952A"
          opacity={0.68}
          filter="url(#bw-core)"
        />
      </svg>
    </div>
  )
}
