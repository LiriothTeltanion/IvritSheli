// Module: housing
// Purpose: Render the twelve A2 housing words — renting and living in a flat
// in Israel, which is where most of this vocabulary is actually used.
//
// Four of these words are buildings, and left alone they would be four
// variations of the same block:
//
// - `apartment` is ONE block seen close, with the things that make an Israeli
//   block an Israeli block: trisim shutters, solar water heaters on the roof,
//   stone cladding, washing on the balcony line.
// - `neighborhood` pulls back to the street: several low buildings of unequal
//   height, trees, a bench, nobody in a hurry.
// - `floor` is not a building at all but the button you press, close enough to
//   read the number.
// - `elevator` is the car with its doors standing open.
//
// The other pair to keep apart is `fault` and `repair`, and the cleanest way is
// to draw the same water heater twice: leaking, dark and flagged in `fault`;
// under a wrench with the drip stopped in `repair`. A learner who sees both
// gets the difference between the problem and the fixing of it.
//
// `rent` and `landlord` both carry a key, because both reviewed descriptions
// name one. `rent` has no people and a month on the calendar; `landlord` is the
// moment the key changes hands.
//
// Every setting is the one named in that word's reviewed `visual_alt`.

import type { A0VisualKey } from '../../visuals/a0VisualRecipes';
import type { SemanticHintStage } from '../SemanticWordIllustration';
import { SceneLayer, SemanticPerson } from './SemanticScenePrimitives';

interface HousingSceneProps {
  visualKey: A0VisualKey;
  hintStage: SemanticHintStage;
}

/**
 * A solar water heater: tank and panel, on the roof.
 *
 * Practically every Israeli roof carries one, and no other country's housing
 * art would. It is the cheapest way to make these buildings read as local
 * rather than as generic blocks.
 */
function SolarHeater({ x, y, s = 1 }: { x: number; y: number; s?: number }): React.JSX.Element {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path className="semantic-art__blue-deep semantic-art__outlined" d="M0 6h30l-4 12H-4Z" />
      <path className="semantic-art__blue-lit" d="M2 8h9l-3 8H-1Z" />
      <path className="semantic-art__metal-line" d="M8 6 4 18m10-12-4 12m10-12-4 12" />
      <rect className="semantic-art__metal semantic-art__outlined" x="-16" y="-8" width="16" height="26" rx="7" />
      <path className="semantic-art__metal-deep" d="M-6-8h6v26h-6Z" />
      <path className="semantic-art__gloss" d="M-13-4v18" />
    </g>
  );
}

/** A balcony rail: uprights between two bars, which is what reads at card size. */
function Railing({ x, y, w }: { x: number; y: number; w: number }): React.JSX.Element {
  const bars: number[] = [];
  for (let i = 8; i < w - 4; i += 12) bars.push(i);
  return (
    <g>
      <path className="semantic-art__metal semantic-art__outlined" d={`M${x} ${y}h${w}v4H${x}Z`} />
      <path className="semantic-art__metal-line" d={bars.map((b) => `M${x + b} ${y + 4}v14`).join('')} />
      <path className="semantic-art__metal semantic-art__outlined" d={`M${x} ${y + 18}h${w}v4H${x}Z`} />
    </g>
  );
}

/** Slatted shutters — trisim. Half-lowered ones give a facade its rhythm. */
function Trisim({ x, y, w, h, open = false }: {
  x: number; y: number; w: number; h: number; open?: boolean;
}): React.JSX.Element {
  const slats: number[] = [];
  const drop = open ? Math.round(h * 0.36) : h;
  for (let i = 4; i < drop; i += 5) slats.push(i);
  return (
    <g>
      <path className="semantic-art__window semantic-art__outlined" d={`M${x} ${y}h${w}v${h}H${x}Z`} />
      {open && <path className="semantic-art__window-lit" d={`M${x + 2} ${y + drop}h${w - 4}v${h - drop - 2}h${-(w - 4)}Z`} />}
      <path className="semantic-art__metal semantic-art__outlined" d={`M${x} ${y}h${w}v${drop}H${x}Z`} />
      <path className="semantic-art__detail semantic-art__detail--thin" d={slats.map((sy) => `M${x + 2} ${y + sy}h${w - 4}`).join('')} />
    </g>
  );
}

/** The water heater that `fault` breaks and `repair` mends. */
function Boiler({ dark = false }: { dark?: boolean }): React.JSX.Element {
  return (
    <g>
      <rect
        className={`semantic-art__${dark ? 'surface-deep' : 'metal'} semantic-art__outlined`}
        x="72" y="34" width="84" height="74" rx="10"
      />
      <path className={`semantic-art__${dark ? 'shade' : 'metal-deep'}`} d="M134 34h12a10 10 0 0 1 10 10v54a10 10 0 0 1-10 10h-12Z" />
      <path className="semantic-art__gloss" d="M82 44v54" />
      <path className="semantic-art__metal-line" d="M72 60h84M72 84h84" />
      {/* Pipes in at the top, out at the bottom. */}
      <path className="semantic-art__metal semantic-art__outlined" d="M96 20h12v14H96Zm28 0h12v14h-12Z" />
      <path className="semantic-art__metal semantic-art__outlined" d="M104 108h12v26h-12Z" />
      <circle className={`semantic-art__${dark ? 'surface-deep' : 'gold'} semantic-art__outlined`} cx="110" cy="48" r="9" />
    </g>
  );
}

export function HousingScene({ visualKey, hintStage }: HousingSceneProps): React.JSX.Element | null {
  switch (visualKey) {
    /* Apartment: one block, close enough to see who lives in it. */
    case 'housing.apartment':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M12 12h216v154H12Z" />
            <circle className="semantic-art__sun-halo" cx="206" cy="34" r="26" />
            {/* Neighbouring blocks, cut off by the frame: this one stands in a row. */}
            <path className="semantic-art__surface-deep semantic-art__outlined" d="M12 62h30v104H12Zm186 12h30v92h-30Z" />
            <path className="semantic-art__facade-shade" d="M12 62h30v104H12Z" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            {/* Stone cladding, in courses. Israeli blocks are faced, not rendered. */}
            <path className="semantic-art__stone-lit semantic-art__outlined" d="M46 34h148v132H46Z" />
            <path className="semantic-art__stone" d="M46 34h148v6H46Zm0 40h148v5H46Zm0 40h148v5H46Z" />
            <path className="semantic-art__grain" d="M46 54h148M46 94h148M46 134h148M84 40v14m38-14v14M84 79v15m38-15v15M84 119v15m38-15v15" />
            <path className="semantic-art__facade-shade" d="M172 34h22v132h-22Z" />
            {/* Three floors of balconies. */}
            <Trisim x={58} y={46} w={26} h={26} />
            <Trisim x={156} y={46} w={26} h={26} open />
            <Trisim x={58} y={86} w={26} h={26} open />
            <Trisim x={156} y={86} w={26} h={26} />
            <Trisim x={58} y={126} w={26} h={26} />
            <Trisim x={156} y={126} w={26} h={26} open />
            <path className="semantic-art__stone-deep semantic-art__outlined" d="M92 44h56v28H92Zm0 40h56v28H92Zm0 40h56v28H92Z" />
            <Railing x={90} y={54} w={60} />
            <Railing x={90} y={94} w={60} />
            <Railing x={90} y={134} w={60} />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <SolarHeater x={78} y={20} s={0.8} />
            <SolarHeater x={148} y={20} s={0.8} />
            {/* Washing out on the middle line, and a plant on the rail. */}
            <path className="semantic-art__detail semantic-art__detail--thin" d="M96 92h48" />
            <path className="semantic-art__coral semantic-art__outlined" d="M100 92h12v14h-12Z" />
            <path className="semantic-art__teal semantic-art__outlined" d="M116 92h10v16h-10Z" />
            <path className="semantic-art__gold semantic-art__outlined" d="M130 92h11v12h-11Z" />
            <path className="semantic-art__clay semantic-art__outlined" d="M96 44h13l-2 10h-9Z" />
            <path className="semantic-art__green semantic-art__outlined" d="M102 44c-10 0-13-8-7-12 7-4 12 5 7 12Z" />
          </SceneLayer>
        </>
      );

    /* Neighborhood: the street the block stands on. */
    case 'housing.neighborhood':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M12 12h216v154H12Z" />
            <circle className="semantic-art__sun-halo" cx="44" cy="36" r="30" />
            <circle className="semantic-art__sun-core semantic-art__outlined" cx="44" cy="36" r="13" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            {/*
              Unequal heights and three different facings. A row of identical
              blocks reads as an institution; a neighbourhood is uneven.
            */}
            <path className="semantic-art__stone-lit semantic-art__outlined" d="M18 74h50v58H18Z" />
            <path className="semantic-art__clay-soft semantic-art__outlined" d="M72 52h54v80H72Z" />
            <path className="semantic-art__stone semantic-art__outlined" d="M130 86h44v46h-44Z" />
            <path className="semantic-art__gold-soft semantic-art__outlined" d="M178 62h44v70h-44Z" />
            <path className="semantic-art__facade-shade" d="M56 74h12v58H56Zm58-22h12v80h-12Zm50 34h10v46h-10Zm48-24h12v70h-12Z" />
            <path className="semantic-art__window semantic-art__outlined" d="M26 84h14v14H26Zm18 0h14v14H44Zm-18 22h14v14H26Zm18 0h14v14H44Zm36-44h14v16H80Zm20 0h14v16h-14Zm-20 24h14v16H80Zm20 0h14v16h-14Zm-20 24h14v16H80Zm20 0h14v16h-14Zm38-34h13v14h-13Zm18 0h13v14h-13Zm-18 22h13v14h-13Zm18 0h13v14h-13Zm48-38h14v16h-14Zm18 0h14v16h-14Zm-18 24h14v16h-14Zm18 0h14v16h-14Z" />
            <path className="semantic-art__window-lit" d="M80 86h14v16H80Zm58 22h13v14h-13Zm48-24h14v16h-14Z" />
            <SolarHeater x={30} y={58} s={0.7} />
            <SolarHeater x={188} y={46} s={0.7} />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__floor" d="M12 132h216v34H12Z" />
            <path className="semantic-art__surface-deep" d="M12 132h216v5H12Z" />
            {/* Trees and a bench: what makes a street somewhere to live. */}
            <path className="semantic-art__wood semantic-art__outlined" d="M64 118h8v22h-8Zm104 0h8v22h-8Z" />
            <path className="semantic-art__green semantic-art__outlined" d="M68 122c-20 0-26-14-16-22 4-12 24-14 30-2 12 2 12 22-14 24Z" />
            <path className="semantic-art__green-lit" d="M58 106c2-8 12-11 20-8-9 1-15 5-16 12Z" />
            <path className="semantic-art__green semantic-art__outlined" d="M172 122c-20 0-26-14-16-22 4-12 24-14 30-2 12 2 12 22-14 24Z" />
            <path className="semantic-art__green-lit" d="M162 106c2-8 12-11 20-8-9 1-15 5-16 12Z" />
            <ellipse className="semantic-art__prop-shadow" cx="120" cy="156" rx="34" ry="5" />
            <path className="semantic-art__wood semantic-art__outlined" d="M96 140h48v7H96Z" />
            <path className="semantic-art__wood-deep" d="M96 147h48v4H96Z" />
            <path className="semantic-art__wood semantic-art__outlined" d="M100 151h6v10h-6Zm34 0h6v10h-6Z" />
            <path className="semantic-art__wood semantic-art__outlined" d="M96 126h48v6H96Z" />
          </SceneLayer>
        </>
      );

    /* Floor: which storey, seen from outside the building. */
    case 'housing.floor':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M12 12h216v148H12Z" />
            {/* A strip for the storey numbers to sit on, rather than floating on
                the sky. The sun that used to be here sat directly behind the
                badge for the fourth floor. */}
            <path className="semantic-art__surface-deep semantic-art__outlined" d="M178 20h38v140h-38Z" />
            <path className="semantic-art__floor" d="M12 160h216v6H12Z" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            {/*
              The block in section, four storeys of it. This scene used to be a
              lift button panel — which is exactly what `numbers.four` already
              was, down to the fourth button lit in gold. Both reviewed lines
              name that button; only one of them can have it, and the counting
              word needs it more than the housing word does. קומה is a storey,
              and a storey is easier to see from outside the building.
            */}
            <path className="semantic-art__stone-lit semantic-art__outlined" d="M34 20h140v140H34Z" />
            <path className="semantic-art__stone" d="M34 55h140v5H34Zm0 35h140v5H34Zm0 35h140v5H34Z" />
            <path className="semantic-art__facade-shade" d="M156 20h18v140h-18Z" />
            <path className="semantic-art__window semantic-art__outlined" d="M46 28h30v22H46Zm44 0h30v22H90Zm-44 35h30v22H46Zm44 0h30v22H90Zm-44 35h30v22H46Zm44 0h30v22H90Zm-44 35h30v22H46Zm44 0h30v22H90Z" />
            <path className="semantic-art__window-lit" d="M46 28h30v22H46Zm44 0h30v22H90Z" />
            <path className="semantic-art__grain" d="M46 63h30m14 0h30M46 98h30m14 0h30M46 133h30m14 0h30" />
            {/* The lift shaft, with the car standing at the top floor. */}
            <path className="semantic-art__metal semantic-art__outlined" d="M132 20h34v140h-34Z" />
            <path className="semantic-art__metal-deep" d="M156 20h10v140h-10Z" />
            <path className="semantic-art__metal-line" d="M149 20v140" />
            <path className="semantic-art__surface-deep semantic-art__outlined" d="M136 26h26v26h-26Z" />
            <path className="semantic-art__gold" d="M136 26h26v4h-26Z" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/*
              The storeys counted up the side, with the fourth ringed. The
              others carry their numbers too, so four is a choice among floors
              and not simply the only number on the wall.
            */}
            <circle className="semantic-art__gold semantic-art__outlined" cx="196" cy="38" r="18" />
            <text className="semantic-art__numeral semantic-art__numeral--small" x="196" y="44">4</text>
            <text className="semantic-art__numeral semantic-art__numeral--small" x="196" y="79">3</text>
            <text className="semantic-art__numeral semantic-art__numeral--small" x="196" y="114">2</text>
            <text className="semantic-art__numeral semantic-art__numeral--small" x="196" y="149">1</text>
            <path className="semantic-art__detail semantic-art__detail--thin" d="M180 57h32m-32 35h32m-32 35h32" />
            <path className="semantic-art__arrow" d="M196 62V50m0 0-5 6m5-6 5 6" />
          </SceneLayer>
        </>
      );

    case 'housing.elevator':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M12 12h216v154H12Z" />
            <path className="semantic-art__tiles" d="M12 140h216M52 140v26m48-26v26m48-26v26m48-26v26" />
            <path className="semantic-art__floor" d="M12 140h216v26H12Z" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__stone semantic-art__outlined" d="M38 18h164v122H38Z" />
            <path className="semantic-art__stone-lit" d="M38 18h164v8H38Z" />
            {/* The car: darker than the lobby, which is what gives it depth. */}
            <path className="semantic-art__surface-deep semantic-art__outlined" d="M74 34h92v106H74Z" />
            <path className="semantic-art__shade" d="M74 34h92v20H74Z" />
            <path className="semantic-art__glass semantic-art__outlined" d="M84 52h32v56H84Z" />
            <path className="semantic-art__gloss" d="m88 100 24-40" />
            <path className="semantic-art__metal-line" d="M80 108h80" />
            {/* Doors retracted into the walls, not gone. */}
            <path className="semantic-art__metal semantic-art__outlined" d="M46 34h30v106H46Zm118 0h30v106h-30Z" />
            <path className="semantic-art__metal-deep" d="M66 34h10v106H66Zm98 0h10v106h-10Z" />
            <path className="semantic-art__gloss" d="M52 44v88m118-88v88" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <rect className="semantic-art__ink" x="92" y="24" width="56" height="20" rx="3" />
            <path className="semantic-art__gold" d="m106 39 9-11 9 11Z" />
            <text className="semantic-art__numeral semantic-art__numeral--onDark" x="134" y="41">4</text>
            <path className="semantic-art__metal semantic-art__outlined" d="M206 62h14v34h-14Z" />
            <circle className="semantic-art__gold semantic-art__outlined" cx="213" cy="72" r="4" />
            <circle className="semantic-art__surface semantic-art__outlined" cx="213" cy="86" r="4" />
          </SceneLayer>
        </>
      );

    /* Contract: the page, at the moment it stops being a draft. */
    case 'housing.contract':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wood semantic-art__outlined" d="M12 12h216v154H12Z" />
            <path className="semantic-art__grain" d="M12 46h216M12 96h216M12 146h216" />
            <ellipse className="semantic-art__prop-shadow" cx="118" cy="156" rx="76" ry="8" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__surface semantic-art__outlined" d="M44 20h140v134H44Z" />
            <path className="semantic-art__surface-lit" d="M44 20h20v134H44Z" />
            {/* Dense clauses at the top, ending in white space: a page that has
                been read to the bottom is a page about to be signed. */}
            <path className="semantic-art__detail" d="M58 40h84" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M58 54h112m-112 9h104m-104 9h110m-110 9h96m-96 13h112m-112 9h100m-100 9h108m-108 9h72" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__detail semantic-art__detail--thin" d="M58 132h50m24 0h38" />
            {/* The signature: one continuous stroke, which is what a name written
                by hand looks like next to ruled machine text. */}
            <path className="semantic-art__detail" d="M62 128c8-14 12 6 18-6s6 12 14 2 8 6 12-2" />
            <path className="semantic-art__coral semantic-art__outlined" d="M138 106h44v22h-44Z" transform="rotate(-12 160 117)" />
            <path className="semantic-art__coral-deep" d="M170 106h12v22h-12Z" transform="rotate(-12 160 117)" />
            {/* The pen, laid across the page it just signed. */}
            <path className="semantic-art__blue semantic-art__outlined" d="M96 148h72v12H96Z" transform="rotate(-8 132 154)" />
            <path className="semantic-art__blue-deep" d="M140 148h28v12h-28Z" transform="rotate(-8 132 154)" />
            <path className="semantic-art__ink" d="M96 148 82 154l14 6Z" transform="rotate(-8 132 154)" />
          </SceneLayer>
        </>
      );

    /* Landlord: the second the key stops being theirs. */
    case 'housing.landlord':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M12 12h216v122H12Z" />
            <path className="semantic-art__floor" d="M12 134h216v32H12Z" />
            <path className="semantic-art__surface-deep" d="M12 128h216v6H12Z" />
            {/* The door they are standing at. */}
            <path className="semantic-art__wood semantic-art__outlined" d="M92 26h56v102H92Z" />
            <path className="semantic-art__wood-deep" d="M134 26h14v102h-14Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M102 40h32v34h-32Zm0 44h32v34h-32Z" />
            <circle className="semantic-art__gold semantic-art__outlined" cx="127" cy="80" r="4" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <SemanticPerson x={54} y={100} facing="right" shirt="blue" pose="reach" scale={1.05} />
            <SemanticPerson x={190} y={100} facing="left" shirt="coral" pose="reach" scale={1.05} />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/*
              The key is between the two hands and belongs to neither: that gap
              is what makes this a handover rather than someone holding a key.
            */}
            <circle className="semantic-art__gold semantic-art__outlined" cx="112" cy="98" r="11" />
            <circle className="semantic-art__wall" cx="112" cy="98" r="4" />
            <path className="semantic-art__gold semantic-art__outlined" d="M122 94h32v9h-8v7h-6v-7h-6v9h-6v-9h-6Z" />
            <path className="semantic-art__gold-line" d="M104 90a11 11 0 0 1 8-3" />
            <path className="semantic-art__spark" d="M112 78v-8m18 12 6-5m-48 5-6-5" />
          </SceneLayer>
        </>
      );

    /* Rent: what leaves the account every month, and what it buys. */
    case 'housing.rent':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wood semantic-art__outlined" d="M12 12h216v154H12Z" />
            <path className="semantic-art__grain" d="M12 52h216M12 110h216" />
            <ellipse className="semantic-art__prop-shadow" cx="118" cy="152" rx="82" ry="8" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            {/* A month, with the same day ringed over and over: rent is not one
                payment, it is the one that comes back. */}
            <path className="semantic-art__surface semantic-art__outlined" d="M28 26h108v112H28Z" />
            <path className="semantic-art__coral semantic-art__outlined" d="M28 26h108v24H28Z" />
            <path className="semantic-art__calendar-ring" d="M52 18v10m60-10v10" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M40 62h14m10 0h14m10 0h14m10 0h14M40 84h14m10 0h14m10 0h14m10 0h14M40 106h14m10 0h14m10 0h14m10 0h14" />
            <circle className="semantic-art__gold semantic-art__outlined" cx="97" cy="80" r="14" />
            <text className="semantic-art__numeral semantic-art__numeral--small" x="97" y="86">1</text>
            <path className="semantic-art__arrow" d="M97 100v14m0 0-5-6m5 6 5-6" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            <path className="semantic-art__green-soft semantic-art__outlined" d="M148 66h68v38h-68Z" />
            <path className="semantic-art__green-soft semantic-art__outlined" d="M154 58h68v38h-68Z" />
            <circle className="semantic-art__green" cx="188" cy="77" r="11" />
            <text className="semantic-art__currency semantic-art__currency--small" x="188" y="82">₪</text>
            <path className="semantic-art__detail semantic-art__detail--thin" d="M160 64h8m46 0h-8m-46 26h8m46 0h-8" />
            {/* And the key it pays for. */}
            <circle className="semantic-art__gold semantic-art__outlined" cx="164" cy="128" r="12" />
            <circle className="semantic-art__wood" cx="164" cy="128" r="5" />
            <path className="semantic-art__gold semantic-art__outlined" d="M175 124h38v9h-9v8h-6v-8h-7v10h-6v-10h-10Z" />
          </SceneLayer>
        </>
      );

    /* Arnona: the municipal bill for the flat. */
    case 'housing.arnona':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M12 12h216v154H12Z" />
            <ellipse className="semantic-art__prop-shadow" cx="120" cy="158" rx="74" ry="7" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <path className="semantic-art__surface semantic-art__outlined" d="M46 16h148v138H46Z" />
            {/* A civic header, not a company one: this bill comes from the city,
                which is what separates arnona from every other invoice. */}
            <path className="semantic-art__blue semantic-art__outlined" d="M46 16h148v42H46Z" />
            <path className="semantic-art__blue-deep" d="M164 16h30v42h-30Z" />
            <path className="semantic-art__surface" d="M62 48V32l12-9 12 9v16Z" />
            <path className="semantic-art__surface" d="M68 40h5v8h-5Zm10 0h5v8h-5Zm-5-12h5v6h-5Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M100 30h72m-72 12h52" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M60 70h58m-58 11h72m-72 11h48" />
            <path className="semantic-art__detail" d="M46 104h148" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* The tear-off stub with the amount on it. */}
            <path className="semantic-art__gold-soft semantic-art__outlined" d="M46 112h148v42H46Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M50 108h6m8 0h6m8 0h6m8 0h6m8 0h6m8 0h6m8 0h6m8 0h6m8 0h6m8 0h6m8 0h6m8 0h6m8 0h6" />
            <text className="semantic-art__currency" x="152" y="140" fontSize="24">₪</text>
            <path className="semantic-art__detail" d="M60 132h56" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M60 144h38" />
          </SceneLayer>
        </>
      );

    /* Committee: the neighbours, in the lobby, deciding something. */
    case 'housing.committee':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M12 12h216v122H12Z" />
            <path className="semantic-art__floor" d="M12 134h216v32H12Z" />
            <path className="semantic-art__tiles" d="M12 134h216M60 134v32m54-32v32m54-32v32" />
            {/*
              The wall of letter boxes is what names the room. A committee at a
              table is a work meeting; a committee in front of the post boxes is
              the building's.
            */}
            <path className="semantic-art__metal semantic-art__outlined" d="M18 26h64v78H18Z" />
            <path className="semantic-art__metal-deep" d="M24 32h16v16H24Zm20 0h16v16H44Zm20 0h12v16H64ZM24 52h16v16H24Zm20 0h16v16H44Zm20 0h12v16H64ZM24 72h16v16H24Zm20 0h16v16H44Zm20 0h12v16H64Z" />
            <path className="semantic-art__metal-line" d="M28 44h8m12 0h8m12 0h6M28 64h8m12 0h8m12 0h6M28 84h8m12 0h8m12 0h6" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <SemanticPerson x={106} y={104} facing="right" shirt="teal" scale={0.98} />
            <SemanticPerson x={152} y={98} facing="left" shirt="gold" scale={0.98} />
            <SemanticPerson x={196} y={104} facing="left" shirt="coral" scale={0.98} />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/* The notice they are standing around. */}
            <path className="semantic-art__wood semantic-art__outlined" d="M96 20h122v54H96Z" />
            <path className="semantic-art__surface semantic-art__outlined" d="M106 26h48v42h-48Z" />
            <path className="semantic-art__surface semantic-art__outlined" d="M162 26h48v42h-48Z" transform="rotate(3 186 47)" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M113 38h32m-32 9h26m-26 9h30m30-18h32m-32 9h26m-26 9h30" />
            <circle className="semantic-art__coral semantic-art__outlined" cx="130" cy="30" r="4" />
            <circle className="semantic-art__coral semantic-art__outlined" cx="186" cy="30" r="4" />
          </SceneLayer>
        </>
      );

    /* Fault: the same heater as `repair`, but nothing is being done about it. */
    case 'housing.fault':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M12 12h216v122H12Z" />
            <path className="semantic-art__tiles" d="M12 46h216M12 90h216M76 12v122m88-122v122" />
            <path className="semantic-art__floor" d="M12 134h216v32H12Z" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <Boiler dark />
            {/* Sparks at the joint, and the drip they cause reaching the floor. */}
            <path className="semantic-art__spark" d="M64 52 48 44m16 20-18 4m22-40-12-12" />
            <path className="semantic-art__water-stream" d="M110 134v10" />
            <circle className="semantic-art__water-drop" cx="110" cy="150" r="4" />
            <ellipse className="semantic-art__water" cx="110" cy="160" rx="30" ry="6" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/*
              The warning triangle is the whole word. `repair` shows the same
              appliance with a wrench on it and no triangle at all.
            */}
            <path className="semantic-art__gold semantic-art__outlined" d="M178 34 218 104h-80Z" />
            <path className="semantic-art__gold-lit" d="M178 34 158 69l14 6Z" />
            <path className="semantic-art__ink" d="M174 58h8l-2 26h-4Zm0 32h8v8h-8Z" />
          </SceneLayer>
        </>
      );

    /* Repair: the same heater, with someone's hands on it. */
    case 'housing.repair':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__wall semantic-art__outlined" d="M12 12h216v122H12Z" />
            <path className="semantic-art__tiles" d="M12 46h216M12 90h216M76 12v122m88-122v122" />
            <path className="semantic-art__floor" d="M12 134h216v32H12Z" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            <Boiler />
            {/* No triangle, no sparks, no puddle: the drip has stopped. */}
            <path className="semantic-art__gloss" d="M88 116h44" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/*
              A wrench closed on the joint that was leaking. It grips the pipe
              rather than lying beside it — a tool on the floor is a toolbox,
              a tool on the fault is a repair.
            */}
            <path className="semantic-art__metal semantic-art__outlined" d="M150 100h56v14h-56Z" transform="rotate(-32 178 107)" />
            <path className="semantic-art__metal-deep" d="M182 100h24v14h-24Z" transform="rotate(-32 178 107)" />
            <path className="semantic-art__metal semantic-art__outlined" d="M150 92h14v10h-8v14h8v10h-14Z" transform="rotate(-32 178 107)" />
            <path className="semantic-art__gloss" d="M162 104h28" transform="rotate(-32 178 107)" />
            <path className="semantic-art__spark" d="m146 118 4 9 9 4-9 4-4 9-4-9-9-4 9-4Z" />
            {/* The open toolbox it came out of. */}
            <path className="semantic-art__coral semantic-art__outlined" d="M24 116h50v30H24Z" />
            <path className="semantic-art__coral-deep" d="M60 116h14v30H60Z" />
            <path className="semantic-art__detail" d="M36 116v-8a13 8 0 0 1 26 0v8" />
            <path className="semantic-art__metal-line" d="M32 126h34" />
          </SceneLayer>
        </>
      );

    /* Address: the exact spot, on the map. */
    case 'housing.address':
      return (
        <>
          <SceneLayer name="context" minimumStage={0} hintStage={hintStage}>
            <path className="semantic-art__green-soft semantic-art__outlined" d="M12 12h216v154H12Z" />
            <path className="semantic-art__water" d="M12 12h216v22H12Z" />
          </SceneLayer>
          <SceneLayer name="meaning" minimumStage={1} hintStage={hintStage}>
            {/* A street grid with blocks between the roads, so it is a map of a
                place to live and not an abstract set of lines. */}
            <path className="semantic-art__surface-deep" d="M12 60h216v16H12Zm0 62h216v16H12ZM56 12h16v154H56Zm104 0h16v154h-16Z" />
            <path className="semantic-art__detail semantic-art__detail--thin" d="M12 68h216M12 130h216M64 12v154m104-154v154" />
            <path className="semantic-art__stone-lit semantic-art__outlined" d="M20 84h28v30H20Zm60 0h30v30H80Zm104 0h30v30h-30Zm-104 62h30v14H80Zm104 0h30v14h-30ZM20 146h28v14H20Z" />
            <path className="semantic-art__stone-lit semantic-art__outlined" d="M20 40h28v14H20Zm60 0h30v14H80Zm104 0h30v14h-30Z" />
            <path className="semantic-art__facade-shade" d="M40 84h8v30h-8Zm60 0h10v30h-10Zm104 0h10v30h-10Z" />
          </SceneLayer>
          <SceneLayer name="anchor" minimumStage={2} hintStage={hintStage}>
            {/*
              One building picked out of all of them, and its number written
              where the pin lands: an address is a place plus the number.
            */}
            <path className="semantic-art__coral semantic-art__outlined" d="M124 84h30v30h-30Z" />
            <ellipse className="semantic-art__prop-shadow" cx="139" cy="118" rx="16" ry="4" />
            <path className="semantic-art__coral semantic-art__outlined" d="M139 46c-14 0-24 10-24 23 0 17 24 39 24 39s24-22 24-39c0-13-10-23-24-23Z" />
            <path className="semantic-art__coral-lit" d="M139 46c-10 0-18 6-22 15 5-6 12-9 22-9Z" />
            <circle className="semantic-art__surface semantic-art__outlined" cx="139" cy="68" r="11" />
            <text className="semantic-art__numeral semantic-art__numeral--small" x="139" y="74">7</text>
          </SceneLayer>
        </>
      );

    default:
      return null;
  }
}
