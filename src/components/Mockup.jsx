import { mockSVG } from '../lib/mockup.js';

/** Vista previa SVG del producto. El SVG se genera con texto escapado. */
export default function Mockup({ item, side = 'front', guides = false, sample = false, className = '' }) {
  return <div className={`mockup ${className}`} dangerouslySetInnerHTML={{ __html: mockSVG(item, side, { guides, sample }) }} />;
}
