#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = __dirname;
const OUT_DIR = path.join(ROOT, 'social');
const characters = require('./quiz-characters.json').characters;
const IMAGE_MAP = require('./image-map.json');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function hexToFfmpegColor(hex) {
  return String(hex || '#FFF2DB').replace('#', '0x');
}

function buildCharacterCard(character) {
  const input = path.join(ROOT, IMAGE_MAP[character.code]);
  const output = path.join(OUT_DIR, `${character.code}.jpg`);
  const bg = hexToFfmpegColor(character.color || '#FFF2DB');

  if (!fs.existsSync(input)) {
    console.error(`  skip ${character.code}: image not found at ${input}`);
    return;
  }

  try {
    execFileSync('ffmpeg', [
      '-y',
      '-f', 'lavfi',
      '-i', `color=${bg}:s=1200x630`,
      '-i', input,
      '-filter_complex',
      [
        '[1:v]scale=420:420:force_original_aspect_ratio=decrease',
        '[char]',
        ';',
        '[0:v][char]overlay=(W-w)/2:(H-h)/2-12:format=auto'
      ].join(''),
      '-frames:v', '1',
      '-q:v', '2',
      output
    ], { stdio: 'inherit' });
  } catch (err) {
    console.error(`  failed ${character.code}: ${err.message}`);
  }
}

function buildHomeCard() {
  const output = path.join(OUT_DIR, 'home.jpg');
  const input = path.join(ROOT, 'og-cover.png');

  if (!fs.existsSync(input)) {
    console.error(`  skip home: image not found at ${input}`);
    return;
  }

  try {
    execFileSync('ffmpeg', [
      '-y',
      '-i', input,
      '-vf', 'scale=1200:630:force_original_aspect_ratio=increase,crop=1200:630',
      '-frames:v', '1',
      '-q:v', '2',
      output
    ], { stdio: 'inherit' });
  } catch (err) {
    console.error(`  failed home: ${err.message}`);
  }
}

function main() {
  ensureDir(OUT_DIR);
  buildHomeCard();
  characters.forEach(buildCharacterCard);
  console.log(`Done generating social images in ${OUT_DIR}`);
}

main();
