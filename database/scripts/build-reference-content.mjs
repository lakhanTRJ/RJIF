import fs from 'node:fs';
import path from 'node:path';

const input = process.argv[2] || 'rjif-reference-package/elementor-extracted/content/page';
const output = process.argv[3] || 'client/src/data/reference.generated.json';
const page = id => JSON.parse(fs.readFileSync(path.join(input, `${id}.json`), 'utf8'));
const asset = url => url ? `/reference/${decodeURIComponent(url.split('/wp-content/uploads/')[1] || '')}` : '';

function nodes(root) {
  const result = [];
  (function visit(node) {
    if (!node || typeof node !== 'object') return;
    result.push(node);
    (node.elements || []).forEach(visit);
  })({ elements: root.content });
  return result;
}

function speakerCards(root) {
  const result = [];
  for (const node of nodes(root)) {
    if (node.elType !== 'container' || !Array.isArray(node.elements)) continue;
    const imageNode = node.elements.find(child => child.widgetType === 'image' && child.settings?.image?.url);
    const copyNode = node.elements.find(child => child.elType === 'container');
    const headings = (copyNode?.elements || []).filter(child => child.widgetType === 'heading').map(child => child.settings?.title?.trim()).filter(Boolean);
    if (!imageNode || headings.length < 2) continue;
    const candidate = { name: headings[0].replace(/<[^>]+>/g, ''), role: headings[1].replace(/<[^>]+>/g, ''), image: asset(imageNode.settings.image.url) };
    if (!result.some(item => item.name === candidate.name && item.image === candidate.image)) result.push(candidate);
  }
  return result;
}

function widgetSettings(root, type) { return nodes(root).filter(node => node.widgetType === type).map(node => node.settings || {}); }
function gallery(root) { return widgetSettings(root, 'image-carousel').flatMap(settings => settings.carousel || []).map(item => ({ image: asset(item.url), alt: item.alt || '' })); }
function testimonials(root) { return widgetSettings(root, 'testimonial-carousel').flatMap(settings => settings.slides || []).map(item => ({ quote: item.content, name: item.name, role: item.title, image: asset(item.image?.url) })); }
function videos(root) {
  return nodes(root).filter(node => ['video', 'elementskit-video'].includes(node.widgetType)).map(node => ({
    url: node.settings?.youtube_url || node.settings?.ekit_video_popup_url || '',
    image: asset(node.settings?.image_overlay?.url),
    title: node.settings?.ekit_video_popup_button_title || ''
  })).filter(item => item.image || item.url);
}

const data = {
  generatedFrom: 'Authorized Elementor export dated 2026-10-01',
  home: { speakers: speakerCards(page(9)), gallery: gallery(page(9)), videos: videos(page(9)) },
  speakers: speakerCards(page(460)),
  southSpeakers: speakerCards(page(3126)),
  exhibition: { testimonials: testimonials(page(11)), gallery: gallery(page(11)) },
  southExhibition: { testimonials: testimonials(page(3045)), gallery: gallery(page(3045)) },
  awards: { gallery: gallery(page(12)) },
  highlights: { videos: videos(page(1235)) },
  southConference: { speakers: speakerCards(page(3009)), gallery: gallery(page(3009)), videos: videos(page(3009)) }
};
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(data, null, 2)}\n`);
console.log(`Generated ${output}: ${data.home.speakers.length} home speakers, ${data.speakers.length} India speakers, ${data.southSpeakers.length} South speakers.`);

