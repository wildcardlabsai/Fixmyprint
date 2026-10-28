# Visual symptom library

Symptom pictures, comparison pictures in questions and reference pictures in guide steps all come from one manifest: `src/content/visual-assets.ts`. Every entry records what it depicts (`subject`), the file, and where it came from.

## Priority

Each symptom lists its images in order of preference, for example `["photo-stringing", "ill-stringing"]`. The interface shows the first one that is **available**:

1. A properly licensed photograph of the real defect.
2. An original, technically accurate illustration.
3. A labelled "No image yet" placeholder. A missing or broken file never leaves a gap and is never replaced by an unrelated picture.

## Current status

- **Illustrations:** 47 original SVG illustrations, one for each of the 35 visual symptoms and 12 for comparison options in follow-up questions. They were drawn for FixMyPrint by `scripts/illustrations/generate.py` (run `python3 scripts/illustrations/generate.py` to regenerate them). Licence: original work, © FixMyPrint.
- **Photographs:** none yet. Every photo slot is listed in the manifest with `status: "missing"`. The licensed image libraries (Wikimedia Commons, Openverse, Flickr) could not be reached from the build environment, so no photographs were obtained, and no photograph is presented as available.

## Adding a licensed photograph

1. Use a photograph you have the right to publish: your own, one taken with permission, or one under a licence that allows reuse (for example CC BY or CC BY-SA). It must clearly show the defect it is filed under.
2. Save it under `public/symptoms/photos/<symptom-slug>.jpg` (about 1200 px on the long side, 4:3 if possible).
3. In `src/content/visual-assets.ts`, change the symptom's `missingPhoto(...)` entry to `status: "available"` and fill in `file`, `width`, `height`, `creator`, `licence`, `sourceUrl` and `attribution` (the exact text the licence asks for). The schema refuses an available photograph without a creator, licence and source.
4. Run `npm test`. The tests check that every available file exists and that no image is used for two different symptoms.

Do not hotlink images, use search-engine results, or add a photograph whose licence you cannot confirm.

Once any licensed photograph is available, the homepage benefit text changes on its own from "clear technical illustrations" to "relevant photographs and diagrams".
