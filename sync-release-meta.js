#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const INDEX_PATH = path.join(__dirname, 'index.html');

function pad(num) {
  return String(num).padStart(2, '0');
}

function getLatestCommitInfo() {
  const output = execFileSync('git', ['log', '-1', '--format=%H%n%ci'], {
    cwd: __dirname,
    encoding: 'utf8'
  }).trim().split('\n');

  const [hash, commitTime] = output;
  const match = commitTime.match(
    /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})(?::\d{2})? ([+-]\d{4})$/
  );

  if (!match) {
    throw new Error(`Unexpected commit time format: ${commitTime}`);
  }

  const [, year, month, day, hour, minute, offset] = match;
  const version = `v${year}.${month}.${day}.${hour}${minute}`;
  const publishedText = `${year}-${month}-${day} ${hour}:${minute}（中国时间）`;
  const isoText = `${year}-${month}-${day}T${hour}:${minute}:00${offset.slice(0, 3)}:${offset.slice(3)}`;

  return {
    hash,
    version,
    publishedText,
    isoText
  };
}

function syncIndexReleaseMeta() {
  const { version, publishedText, isoText } = getLatestCommitInfo();
  const source = fs.readFileSync(INDEX_PATH, 'utf8');

  const next = source
    .replace(
      /(<strong id="releaseVersion">)(.*?)(<\/strong>)/,
      `$1${version}$3`
    )
    .replace(
      /(<time id="releasePublished" datetime=")(.*?)(">)(.*?)(<\/time>)/,
      `$1${isoText}$3${publishedText}$5`
    );

  if (next === source) {
    throw new Error('Failed to update release metadata block in index.html');
  }

  fs.writeFileSync(INDEX_PATH, next);
  console.log(`Updated homepage release meta: ${version} / ${publishedText}`);
}

syncIndexReleaseMeta();
