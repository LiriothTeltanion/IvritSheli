/*
 * The shared adult's body (2026-11-02): torso, sleeves, trousers, shoes, arms and hands for every pose.
 *
 * Drawn in SVG by Codex from the same brief as the head, to replace stiff tube arms and disc hands: elbows that
 * bend, a palm with a thumb, rounded sleeves, shoes, and a torso that can breathe. Hand centres and arm end
 * points are an API (scenes put cups, phones and papers there), so they are unchanged for all 13 poses.
 */
import type * as React from 'react';
import type { Shirt } from './PersonHead';
import type { SemanticPersonPose } from './SemanticScenePrimitives';

type HandAnchor = readonly [x: number, y: number, angle: number];
type Arms = Readonly<{ still?: string; gesture?: string }>;

// These are attachment coordinates, not artistic suggestions. Objects in scenes
// are placed here. In particular, walk's left hand is at -13 although its arm
// ends at -14: retain both historical coordinates rather than "correcting" them.
const HANDS: Record<SemanticPersonPose, readonly HandAnchor[]> = {
  neutral: [[-14, 18, -16], [22, 18, 16]],
  wave: [[-14, 18, -16]],
  point: [[-14, 18, -16]],
  stomach: [[0, 16, 0]],
  walk: [[-13, 18, -18], [22, 18, 18]],
  shiver: [[-2, 14, -22], [2, 14, 22]],
  listen: [[-14, 18, -16], [15, -18, 72]],
  hold: [[0, 20, 0]],
  reach: [[-18, 12, -18], [30, -2, -8]],
  ask: [[-14, 18, -16], [28, 5, -8]],
  answer: [[-14, 18, -16], [25, 8, 8]],
  request: [[0, 18, 0]],
  explain: [[-14, 18, -16], [38, -2, -6]],
};

// Curves soften the elbows without moving the original starts, joins or ends.
// Keep the original still/gesture split, including point/listen/reach being
// still: animation ownership is part of the existing scene contract too.
const REST = 'M-8 3C-12 6-13.6 11-14 18';
const ARMS: Record<SemanticPersonPose, Arms> = {
  neutral: { still: `${REST}M8 3C10.4 10.6 14.5 16 22 18` },
  wave: { still: REST, gesture: 'M8 4Q12.1-4.8 19-7Q22.1-12.9 22-22' },
  point: { still: `${REST}M8 3Q17-4 26-2Q32-1.1 38-2` },
  stomach: { still: 'M-8 5Q-7.4 12.8 0 16Q6.1 14.2 10 7M8 5Q7.2 12.3 0 16Q-6.2 14.4-9 8' },
  walk: { still: `${REST}M8 3C10.4 10.6 14.5 16 22 18` },
  shiver: { gesture: 'M-9 5Q-8.7 12.2-2 14Q4.4 11.9 7 4M9 5Q8.6 12.1 2 14Q-4.2 12.7-7 5' },
  listen: { still: `${REST}M8 3Q17.1 3 17-8Q16.8-13.4 15-18` },
  hold: { still: 'M-8 5Q-8.4 13.6-2 18Q-1.3 19.7 0 20M8 5Q8.3 13.5 2 18Q1.3 19.7 0 20' },
  reach: { still: 'M-8 3Q-14.8 4.8-18 12M8 3Q16.3-1.4 22-1.3Q26.5-1 30-2' },
  ask: { still: REST, gesture: 'M8 3Q14 11.7 21 8.7Q24.8 7.8 28 5' },
  answer: { still: REST, gesture: 'M8 3Q11.4 8.2 17 7.3Q21.1 7 25 8' },
  request: { still: 'M-8 3Q-10 13-3.5 16.1Q-1.7 17.1 0 18M8 3Q10 13 3.5 16.1Q1.7 17.1 0 18' },
  explain: { still: REST, gesture: 'M8 3Q17.4-5 25-2.9Q31-1.4 38-2' },
};

function Arm({ d, motion = false }: { d: string; motion?: boolean }): React.JSX.Element {
  // Both paint layers receive the same motion class, as in SemanticPerson.
  const motionClass = motion ? ' semantic-art__motion-part' : '';
  return (
    <>
      <path className={`semantic-art__limb-edge semantic-art__body-arm-edge${motionClass}`} d={d} />
      <path className={`semantic-art__skin-line semantic-art__body-arm-fill${motionClass}`} d={d} />
    </>
  );
}

function Hand({ anchor }: { anchor: HandAnchor }): React.JSX.Element {
  const [x, y, angle] = anchor;
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle})`} data-hand-center={`${x},${y}`}>
      {/* The palm surrounds local (0, 0); the thumb grows out of its upper
          edge. One crease suggests fingers without a tangle at thumbnail size. */}
      <path
        className="semantic-art__hand"
        d="M-3.6 1.7Q-4.5.4-3.8-1.3L-2.4-2Q-2.6-3.8-1.4-4Q-.4-4.1-.3-2.5L.2-2.2L2.6-2.5Q4.1-2.5 4.4-1Q4.9.7 3.5 1.9Q1.1 3.3-1.4 2.8Q-3 2.7-3.6 1.7Z"
      />
      <path className="semantic-art__body-hand-detail" d="M1.4-.8Q2.6-.5 3.5-.9M-.5-1.9Q-.6-.6-1.4-.2" />
    </g>
  );
}

/** Read the shoulder and initial tangent of each existing M…C / M…Q arm.
 * These paths are deliberately left untouched: scene props depend on them.
 */
function Sleeves({ arms }: { arms: Arms }): React.JSX.Element {
  const number = '(-?\\d*\\.?\\d+)';
  const starts = new RegExp(`M${number}[ ,]*${number}[CQ]${number}[ ,]*${number}`, 'g');
  const shoulders = [...`${arms.still ?? ''}${arms.gesture ?? ''}`.matchAll(starts)];

  return (
    <>
      {shoulders.map((match) => {
        const [x = 0, y = 0, cx = 0, cy = 0] = match.slice(1).map(Number);
        const side = x < 0 ? -1 : 1;
        const length = Math.hypot(cx - x, cy - y);
        const ux = (cx - x) / length;
        const uy = (cy - y) / length;
        const nx = side * uy;
        const ny = -side * ux;
        const hemX = x + ux * 6.6;
        const hemY = y + uy * 6.6;
        const outerX = hemX + nx * 4.6;
        const outerY = hemY + ny * 4.6;
        let innerX = hemX - nx * 4.6;
        let innerY = hemY - ny * 4.6;

        // Stop the hem where it meets the shirt side. A hem drawn all the
        // way across the hidden half of the arm makes the old C-shaped seam.
        const bodyX = side * 11.25;
        const hiddenHem = side * innerX < 11.25;
        if (hiddenHem) {
          const fraction = (bodyX - outerX) / (innerX - outerX);
          innerY = outerY + (innerY - outerY) * fraction;
          innerX = bodyX;
        }
        const joinY = hiddenHem ? innerY : Math.max(7.5, innerY + 2);
        // A raised arm needs a short shoulder join, not a cap control point
        // swung back into the chest. Downward sleeves round over the shoulder.
        const capX = side * (8.1 + Math.max(0, uy) * 5.7);
        const capY = -5.8 + Math.max(0, uy) * 1.8;
        const outline = `M${side * 8.1} -5.8C${capX} ${capY} ${outerX - ux * 3} ${outerY - uy * 3} ${outerX - ux * 1.5} ${outerY - uy * 1.5}`
          + `C${outerX + ux * 1.2} ${outerY + uy * 1.2} ${innerX + ux * 1.2} ${innerY + uy * 1.2} ${innerX} ${innerY}`
          + (hiddenHem ? '' : `Q${innerX - side} ${joinY - 1} ${bodyX} ${joinY}`);
        const fabric = `${outline}L${bodyX} ${joinY}L${side * 3} 9L${side * 3} -4Z`;

        return (
          <g key={x}>
            {/* Paint after the two arm strokes, covering their shoulder caps.
                Only the exposed silhouette and soft hem receive an outline;
                the unstroked root overlaps the shirt without a closed seam. */}
            <path className="semantic-art__sleeve" d={fabric} />
            <path className="semantic-art__body-sleeve-outline" d={outline} />
          </g>
        );
      })}
    </>
  );
}

/** Everything below the face in the adult scene's original local coordinates. */
export function PersonBody({
  shirt,
  pose,
  head,
}: {
  shirt: Shirt;
  pose: SemanticPersonPose;
  /** Drawn after the torso and before the arms, so a raised or listening hand stays in front of the face. */
  head?: React.ReactNode;
}): React.JSX.Element {
  const walking = pose === 'walk';
  const arms = ARMS[pose];

  return (
    <g data-person-body={pose}>
      {/* The waist shifts subtly right while both standing ankle intervals
          remain exactly [-9.4, -1.8] and [1.7, 9.3] at y=55. */}
      <path
        className="semantic-art__trousers"
        d={walking
          ? 'M-10 27Q0 25.8 10 27L5 38Q10.3 44.8 18 51L13 55Q4.8 49.7 0 43Q-4.3 50.2-9 55L-15 51Q-10.3 42.4-6 36Z'
          : 'M-10.5 25.5Q.5 24.6 10.5 25.5Q10.9 36.8 9.3 55H1.7L.6 33.4Q-.9 44.1-1.8 55H-9.4Q-9.8 40.3-10.5 25.5Z'}
      />
      <path className="semantic-art__trouser-seam" d={walking ? 'M0 30 5 38M-5 36-9 51' : 'M-5.6 35Q-5.1 43.5-5.6 53M5.4 35Q6.1 44 5.4 53'} />

      <path className="semantic-art__skin" d="M-3-15H3V-9Q3.8-7.7 4.3-7Q.4-3.5-4.3-7L-3-9Z" />
      <path className="semantic-art__skin-shade" d="M-3-15H3V-11.5Q.3-10.7-3-12Z" />

      {/* Breathing is opt-in CSS. Sleeves, wrists, trousers and head are outside
          this group, so their scene attachment coordinates stay stable. */}
      <g className="semantic-art__body-breath">
        <path className="semantic-art__shirt" d="M-11.2 27Q-12.7 21-11.2 12L-11.8 2.8Q-13.1-2.9-8.1-5.8Q-5.9-7.2-3.7-7.7Q.1-5.2 3.8-7.7Q8.1-6.9 10.8-3.4Q13.1.5 11.3 7.5L10.9 14.5Q10.8 20.2 12 26.8Q1 29.3-11.2 27Z" />
        <path className="semantic-art__shirt-lit" d="M-11.2 27Q-12.7 21-11.2 12L-11.8 2.8Q-13.1-2.9-8.1-5.8L-4.5-7.4Q-9.1-.9-7.3 10.5Q-8.6 20.3-7.3 27.6Z" />
        <path className="semantic-art__shirt-deep" d="M6.2-6.8Q9-5.8 10.8-3.4Q13.1.5 11.3 7.5L10.9 14.5Q10.8 20.2 12 26.8L7.3 27.7Q6.2 22.8 7.1 16Q8.1 8.6 6.2-6.8Z" />
        <path className="semantic-art__garment-line" d="M-3.8-7.6Q.1-3.5 3.9-7.6M-9.6 24.3Q.7 26 10.4 24.8M6.6 17.8l-1.9 3.1" />
        {shirt === 'gold' && <path className="semantic-art__garment-line" d="M0-4.8Q1 9.2.4 22M-1.1 2h2.5M-1 9h2.5M-.9 16h2.5" />}
        {shirt === 'blue' && <path className="semantic-art__garment-line" d="M-7.7 7.5Q-5.3 8.1-3.2 7.5M4.7 7.5l3.1.2" />}
      </g>

      {head}

      {arms.still && <Arm d={arms.still} />}
      {arms.gesture && <Arm d={arms.gesture} motion />}

      <Sleeves arms={arms} />

      {HANDS[pose].map((anchor) => <Hand key={`${anchor[0]},${anchor[1]}`} anchor={anchor} />)}
      {pose === 'wave' && (
        <g className="semantic-art__motion-part" data-wave-wrist="22,-22">
          {/* Preserve the original waving palm centre and wrist. Individual
              narrow finger strokes prevent the old arm-width starburst. */}
          <path className="semantic-art__finger" d="M19.2-25.8L17-31M21.8-26.3 22-33M24.6-25.7 28-31" />
          <path className="semantic-art__hand" d="M19-20.9Q17.5-22.4 18-24.8Q18.2-26.8 20.2-26.8L23.6-27Q25.8-26.9 26-24.6Q27.7-26 28.4-24.9Q28.8-24 26.2-21.8Q25-19.4 22.4-19.2Q20.4-19.2 19-20.9Z" />
          <path className="semantic-art__body-hand-detail" d="M24.8-23.8Q23.1-23.1 23.3-21.4" />
        </g>
      )}
      {pose === 'point' && (
        // The pointing endpoint remains (38, -2); a slim hand silhouette wraps
        // it, with the fingertip at that endpoint and the palm back along x.
        <g data-point-tip="38,-2">
          <path className="semantic-art__hand" d="M29.1-3.6Q30-5 32.1-4.7L36.9-3.3Q38-3.1 38-2Q37.8-1.2 36.7-1.4L33.6-2Q35 .1 33.5 1Q31.5 2.3 29.4.9Q28.2-.5 29.1-3.6Z" />
          <path className="semantic-art__body-hand-detail" d="M30.8-1.4 33.3-.2" />
        </g>
      )}

      {/* Floor contact and the original shoe outline extents are retained.
          A single upper seam gives a toe and sole without extra colour. */}
      <path className="semantic-art__shoe" d={walking
        ? 'M-9 51h-8q-3 0-3 4h12Zm22 0 6 2q3 1 2 4h-9Z'
        : 'M-9.6 52.5h7.3q2.6.4 3 3.5H-9.6ZM1.7 52.5h7.6q3.4.4 3.7 3.5H1.7Z'} />
      <path className="semantic-art__body-shoe-detail" d={walking
        ? 'M-17.7 53.5h7.5M14.1 54.6l4.3 1.1'
        : 'M-8.1 54.7h6.4M3.1 54.7h7.7'} />
    </g>
  );
}
