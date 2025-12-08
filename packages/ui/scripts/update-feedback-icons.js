const fs = require('fs');
const path = require('path');

// Read SVG files
const thumbsUpPath = path.join(__dirname, '../src/icons/thumbs-up.svg');
const thumbsDownPath = path.join(__dirname, '../src/icons/thumbs-down.svg');
const iconsTsPath = path.join(__dirname, '../src/components/conversation-feedback/icons.ts');

const thumbsUp = fs.readFileSync(thumbsUpPath, 'utf8').trim();
const thumbsDown = fs.readFileSync(thumbsDownPath, 'utf8').trim();

// Escape backticks and dollar signs for template literal
function escapeForTemplate(str) {
  return str.replace(/`/g, '\\`').replace(/\$/g, '\\$');
}

// Adjust SVG size from 24 to 20 if needed
function adjustSize(str) {
  return str.replace(/width="24" height="24"/, 'width="20" height="20"');
}

const iconsContent = `// SVG icons for feedback thumbs up/down
// Auto-generated from SVG files - update the SVG files to change icons

export const feedbackIcons = {
  positive: \`${escapeForTemplate(adjustSize(thumbsUp))}\`,
  
  negative: \`${escapeForTemplate(adjustSize(thumbsDown))}\`
};
`;

fs.writeFileSync(iconsTsPath, iconsContent);
console.log('✓ Updated icons.ts with SVG content from files');


