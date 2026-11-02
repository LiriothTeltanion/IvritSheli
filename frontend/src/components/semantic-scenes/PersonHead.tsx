/*
 * The shared adult head (2026-11-02).
 *
 * Drawn in SVG by Codex from its own image_gen reference sheets, then given three touches Kevin liked in the
 * Gemini sheets: a short beard on the older man, blush on both cheeks, and stronger brows. Kevin chose this over
 * a first SVG pass by Claude. Eyes, mouth and the whole head sit in their own groups so CSS can blink, speak and
 * nod; the expression only changes which brows and mouth are drawn.
 */
import type * as React from 'react';

export type Expression = 'neutral' | 'smile' | 'talk' | 'surprised' | 'worried';
export type Shirt = 'teal' | 'coral' | 'gold' | 'blue';

// Scene coordinates, facing +x. The caller owns position, scale and mirroring.
// Hair is split around the face so the ear and jaw keep a clean silhouette.
const HAIR: Record<Shirt, { back?: string; front: string; light: string }> = {
  teal: {
    front:
      'M-6.4-23.5C-8.2-25.6-8.1-30.7-5.7-33.1C-3.8-35.4.1-35.8 3-34.7C5.7-34.4 7.2-32.1 6.6-29.3C5.5-31 4.3-31.8 2.8-32.1C1.8-29.8-.6-28.2-3.8-27.8L-4.3-23.4Z',
    light:
      'M-5.2-31.7C-3.3-34.2.3-34.8 2.4-33.5C-.5-33.6-2.9-32.9-5.2-31.7Z',
  },
  coral: {
    back:
      'M-6.1-30.9C-8.9-31.1-9.8-27.2-9.6-23.4C-9.6-19.6-8.7-16.8-7-15C-5.9-15.6-5.3-16.4-5.2-17.3C-7.2-20.7-6.4-25.4-5.1-28.7Z',
    front:
      'M-6.1-23.8C-8.4-26.7-7.7-31.5-5.1-33.7C-2.7-35.9 1.1-35.6 3.5-34.3C5.8-34 7.1-31.7 6.6-29.5C5.6-31.2 4.3-32 2.5-32.3C1.8-29.6-.9-28.1-4-27.5L-4.2-23.6Z',
    light:
      'M-5.2-31.6C-3.7-34.1-.4-34.8 2.2-33.5C-.9-33.7-3.3-32.6-5.2-31.6Z',
  },
  gold: {
    back:
      'M-6.3-30.9C-8.4-28.5-8.4-25.4-9-23.3C-10-19.9-8.4-16.8-5.7-16.4L-2.9-17.2L5.5-17.3C8-18.1 8.8-20.4 7.6-23.4L6.6-29.9Z',
    front:
      'M-6.2-23.7C-8.7-25.8-8.4-29.6-6.2-32.2C-4.6-34.7-1.2-35.7 1.4-34.9C4.6-35.3 7.1-32.7 6.7-29.5C5.7-31.2 4.8-31.9 3.1-32.1C1.4-29.8-.7-28.1-4-27.3L-4.4-23.4Z',
    light:
      'M-6.4-28.8C-3.8-29.4-1.6-31.6-.3-33C.6-33.8 1.5-34 2.6-33.7C1.2-32.5.5-30.9-1.2-29.7C-2.8-28.6-4.6-28.2-6.4-28.8Z',
  },
  blue: {
    front:
      'M-6.5-23.7C-7.7-26-7.7-29.1-6.7-31.2C-6.2-32.7-4.9-33.5-3.4-33.4C-1.8-35.4 1.2-35.6 3.3-34.1C5.9-34.4 7.3-31.9 6.6-29.4C5.5-31.1 4.3-31.8 2.8-31.7C.7-30.5-1.3-30.6-3.8-30L-4.4-23.4Z',
    light:
      'M-5-31.9C-3.8-31.2-2.1-31.5-.7-32.5C.2-33.2 1.2-33.4 2.1-33.2C.5-34.4-1.1-34-2.3-33C-3.1-32.4-4-32.1-5-31.9Z',
  },
};

const FACE: Record<Shirt, string> = {
  teal:
    'M-5.8-29.4C-4.6-33.3.2-34.2 3.5-32.4C6.1-31.2 6.5-28.7 6.6-26L7.3-24.5L8.7-23.1Q9-22.5 7-22.1L6.4-18.7Q5.9-15.5 2.9-15.6L-.6-16.1Q-4.1-17.4-4.8-21.6Z',
  coral:
    'M-5.7-29.5C-4.5-33.2.2-34.1 3.4-32.4C5.8-31.3 6.3-28.5 6.4-26L7.1-24.5L8.5-23.2Q8.9-22.5 6.8-22.1L6.2-18.8Q5.8-15.4 2.8-15.6C-.7-15.6-3.8-17.8-4.8-21.6Z',
  gold:
    'M-5.7-29.5C-4.5-33.1.3-34 3.5-32.3C5.9-31 6.2-28.7 6.3-26L7-24.5L8.6-23.2Q9-22.5 6.9-22L6.2-18.8Q5.7-15.6 2.7-15.7C-.6-15.7-3.8-17.9-4.8-21.5Z',
  blue:
    'M-5.8-29.5C-4.5-33.3.3-34.1 3.6-32.3C6-31.1 6.4-28.6 6.5-26L7.3-24.5L8.8-23.1Q9.1-22.5 7-22L6.5-18.5Q6.2-15.6 3.4-15.7L.1-15.9Q-3.8-17.2-4.9-21.5Z',
};

const MOUTH: Record<'neutral' | 'smile' | 'worried', string> = {
  neutral: 'M1.6-19.1Q3.4-18.6 5-19.2',
  smile: 'M1.2-19.6Q3.1-17.5 5.5-19.6',
  worried: 'M1.7-18.5Q3.4-19.7 5.1-18.6',
};

export function PersonHead(props: {
  shirt: Shirt;
  expression: Expression;
}): React.JSX.Element {
  const { shirt, expression } = props;
  const hair = HAIR[shirt];
  const surprised = expression === 'surprised';
  const older = shirt === 'gold' || shirt === 'blue';

  return (
    <g
      className={`semantic-art__face-head semantic-art__face--${shirt}`}
      data-expression={expression}
    >
      {/* Rear hair precedes the skin; no hair crosses the animated features. */}
      {hair.back && <path className="semantic-art__hair" d={hair.back} />}
      {shirt === 'gold' && (
        <path
          className="semantic-art__hair-deep"
          d="M-6.8-25C-8.1-22.9-8.3-19-5.7-17.1L-3.5-17.6L-4-24.8Z"
        />
      )}
      <path className="semantic-art__skin" d={FACE[shirt]} />
      <path
        className="semantic-art__skin-shade"
        d="M-4.7-25.3C-4.9-21.5-2.6-17.8 2.6-16.4L2.9-15.7C-.8-15.7-4.1-17.6-4.9-21.6Z"
      />
      <ellipse
        className="semantic-art__skin-lit"
        cx="3.3" cy="-26.4" rx="2.2" ry="3.1"
      />

      {shirt === 'blue' && (
        // Gemini's sheet gave the older man a short beard; it also makes the masculine figure read at a glance.
        <path
          className="semantic-art__face-beard"
          d="M-3.9-21.4Q-3.2-17.6.3-16.2Q3.2-15.4 5.4-16.9Q6.4-17.8 6.6-19.6L5.6-20.5Q3.6-21.3 1.6-20.6Q-1.2-19.8-3.9-21.4Z"
        />
      )}
      <path className="semantic-art__hair" d={hair.front} />
      <path
        className="semantic-art__hair-lit semantic-art__face-hair-highlight"
        d={hair.light}
      />
      {shirt === 'blue' && (
        <path
          className="semantic-art__hair-lit semantic-art__face-temple"
          d="M-6.5-28.8Q-5.4-28.4-3.9-29.5L-4.4-24.1L-5.8-24.3Z"
        />
      )}

      {/* A single visible ear and a projecting nose establish the 3/4 view. */}
      <ellipse className="semantic-art__ear" cx="-4.8" cy="-23.8" rx="1.7" ry="2.1" />
      <path
        className="semantic-art__nose semantic-art__face-line"
        d="M-5.6-24.2Q-4.8-25-4.1-23.3M6-25.6L7.1-23.7Q7.7-23.1 6-22.9"
      />
      <ellipse className="semantic-art__cheek" cx="-.5" cy="-21.9" rx="1.25" ry="1.1" />
      <ellipse className="semantic-art__cheek" cx="5.6" cy="-22.1" rx=".75" ry=".8" />

      <path
        className="semantic-art__brow semantic-art__face-line"
        d={surprised
          ? 'M-.9-28Q.2-29.4 1.8-29.1M4.2-29.1Q5.3-29.7 6.1-28.8'
          : expression === 'worried'
            ? 'M-1-28.4Q.4-28.6 1.8-27.7M4.3-27.9Q5.3-28.7 6.1-28.6'
            : 'M-1-27.7Q.3-28.6 1.8-28.4M4.3-28.4Q5.3-28.8 6.1-28.2'}
      />
      <g className="semantic-art__face-eyes">
        <ellipse className="semantic-art__eye" cx=".9" cy="-25.4" rx=".66" ry={surprised ? '1.04' : '.88'} />
        <ellipse className="semantic-art__eye" cx="5.2" cy="-25.7" rx=".55" ry={surprised ? '.96' : '.8'} />
        <ellipse className="semantic-art__eye-light" cx="1.08" cy="-25.72" rx=".2" ry=".26" />
        <ellipse className="semantic-art__eye-light" cx="5.35" cy="-26" rx=".17" ry=".23" />
      </g>

      {older && (
        <path
          className="semantic-art__nose semantic-art__face-age-line"
          d="M-1.4-24.1l-.8.3M.1-20.4Q-.6-19.5-.3-18.5"
        />
      )}

      {/* Closed contours make speaking readable without scaling the whole jaw. */}
      <g className="semantic-art__face-mouth">
        {expression === 'talk' ? (
          <>
            <path
              className="semantic-art__mouth semantic-art__face-mouth-open"
              d="M1-20Q3.3-19 5.7-20.2C5.4-17.9 4.3-17 3-17.4Q1.5-17.9 1-20Z"
            />
            <path
              className="semantic-art__face-teeth"
              d="M1.5-19.8Q3.4-19.1 5.2-20L4.9-19.35Q3.2-18.8 1.8-19.3Z"
            />
            <path
              className="semantic-art__face-tongue"
              d="M2.4-17.8Q3.4-18.7 4.5-18.1Q3.5-16.9 2.4-17.8Z"
            />
          </>
        ) : surprised ? (
          <ellipse
            className="semantic-art__mouth semantic-art__face-mouth-open"
            cx="3.7" cy="-19.1" rx=".72" ry="1.04"
          />
        ) : (
          <path
            className="semantic-art__mouth semantic-art__face-line"
            d={MOUTH[expression]}
          />
        )}
      </g>
    </g>
  );
}
