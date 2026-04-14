#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = __dirname;
const OUT_DIR = path.join(ROOT, 'social');
const characters = require('./quiz-characters.json').characters;

const IMAGE_MAP = {
  CHII: 'images/01-Chiikawas/吉伊卡哇_chii.png',
  HACH: 'images/01-Chiikawas/小八_hachi.png',
  USAG: 'images/01-Chiikawas/兔兔_usagi.png',
  MOMO: 'images/01-Chiikawas/飞鼠_momo.png',
  KURI: 'images/01-Chiikawas/栗子馒头_kuri.png',
  RAKK: 'images/01-Chiikawas/海獭_rakko.png',
  SHIS: 'images/01-Chiikawas/狮萨_shisa.png',
  FURU: 'images/01-Chiikawas/古本_furu.png',
  LABO: 'images/02-Yoroi铠甲人/劳动铠甲人_labo.png',
  POCH: 'images/02-Yoroi铠甲人/口袋铠甲人_poch.png',
  RAMN: 'images/02-Yoroi铠甲人/拉面铠甲人_ramn.png',
  YATA: 'images/02-Yoroi铠甲人/摊贩铠甲人_yata.png',
  ANOK: 'images/03-Chimera/那个孩子_anok.png',
  DEKA: 'images/03-Chimera/大强_deka.webp',
  ODEE: 'images/04-Miscellaneous/欧德_odee.jpg',
  GOBL: 'images/04-Miscellaneous/哥布林_gobl.png',
  BLAC: 'images/04-Miscellaneous/黑星_blac.jpg',
  SHOO: 'images/04-Miscellaneous/流星_shoo.jpg',
  MAJO: 'images/04-Miscellaneous/山姥_majo.webp',
  KABU: 'images/04-Miscellaneous/吉伊卡菇_kabu.jpeg',
  MUCH: 'images/04-Miscellaneous/营业超人_much.png',
  PAJA: 'images/04-Miscellaneous/睡衣派对组_paja.png'
};

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
  ], { stdio: 'ignore' });
}

function buildHomeCard() {
  const output = path.join(OUT_DIR, 'home.jpg');
  const input = path.join(ROOT, 'og-cover.png');

  execFileSync('ffmpeg', [
    '-y',
    '-i', input,
    '-vf', 'scale=1200:630:force_original_aspect_ratio=increase,crop=1200:630',
    '-frames:v', '1',
    '-q:v', '2',
    output
  ], { stdio: 'ignore' });
}

function main() {
  ensureDir(OUT_DIR);
  buildHomeCard();
  characters.forEach(buildCharacterCard);
  console.log(`Generated ${characters.length + 1} social images in ${OUT_DIR}`);
}

main();
