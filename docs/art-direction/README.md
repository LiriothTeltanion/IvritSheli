# Approved reference images

Drop the approved files here with these exact names. The record, the palette
and the review notes for each live in `docs/ART_DIRECTION_REFERENCES.md`.

```
tabletop--food.bread.webp
street--greetings.hello.webp
transit--greetings.excuse_me.webp
interior--greetings.good_morning.webp
landscape--nature.stream.webp
service--health.pharmacy.webp        (pending)
```

Family first, because that is how they are consulted: to repaint a scene, look
up its `data-spatial-family` and open that reference.

These are art-direction references. They are not shipped, not precached and not
part of the bundle. Nothing here is learner-facing.

The source files in this folder remain references. A reviewed, byte-identical
copy of `interior--greetings.good_morning.webp` is promoted separately as
`frontend/public/assets/illustrations/morning-hebrew-welcome.webp` for the
light-theme welcome surfaces. Its product role and known semantic limit are
recorded in `docs/VISUAL_ASSET_MANIFEST.md`.
