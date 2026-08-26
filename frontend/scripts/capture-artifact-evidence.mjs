import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

/**
 * Read immutable evidence from PNG bytes after Playwright has written them.
 * Width and height come from the mandatory IHDR chunk, so they describe the
 * physical PNG rather than the configured CSS viewport.
 */
export function inspectPngBytes(input) {
  const bytes = Buffer.isBuffer(input) ? input : Buffer.from(input);
  if (bytes.length < 24 || !bytes.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error('capture output is not a PNG');
  }
  if (bytes.toString('ascii', 12, 16) !== 'IHDR') {
    throw new Error('capture PNG has no leading IHDR chunk');
  }
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  if (width === 0 || height === 0) throw new Error('capture PNG has invalid dimensions');
  return {
    dimensions: { width, height },
    sha256: createHash('sha256').update(bytes).digest('hex').toUpperCase(),
  };
}

export async function inspectPngFile(path) {
  return inspectPngBytes(await readFile(path));
}
