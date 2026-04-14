/**
 * Chiikawa MBTI quiz 评分逻辑
 * 基于 MBTI 四维主轴和角色风格副维度进行匹配
 */

const questions = require('./quiz-questions.json').questions;
const characters = require('./quiz-characters.json').characters;

const AXES = ['ei', 'sn', 'tf', 'jp'];
const STYLES = ['warmth', 'weirdness', 'showmanship', 'discipline', 'edge', 'softness'];
const PRIMARY_WEIGHT = 0.76;
const STYLE_WEIGHT = 0.24;

function emptyVector() {
  return Object.fromEntries([...AXES, ...STYLES].map((key) => [key, 0]));
}

function getQuestionMaxima() {
  const axisMax = Object.fromEntries(AXES.map((key) => [key, 0]));
  const styleMax = Object.fromEntries(STYLES.map((key) => [key, 0]));

  for (const question of questions) {
    for (const axis of AXES) {
      const localMax = question.answers.reduce(
        (best, answer) => Math.max(best, Math.abs(answer.scores?.[axis] || 0)),
        0
      );
      axisMax[axis] += localMax;
    }

    for (const style of STYLES) {
      const localMax = question.answers.reduce(
        (best, answer) => Math.max(best, answer.scores?.[style] || 0),
        0
      );
      styleMax[style] += localMax;
    }
  }

  return { axisMax, styleMax };
}

const { axisMax, styleMax } = getQuestionMaxima();

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function normalizeAxisScore(axis, vector) {
  const max = axisMax[axis] || 1;
  return Math.max(-1, Math.min(1, (vector[axis] || 0) / max));
}

function normalizeStyleScore(style, vector) {
  const max = styleMax[style] || 1;
  return clamp01((vector[style] || 0) / max);
}

function axisPole(axis, mbti) {
  const index = AXES.indexOf(axis);
  const letter = mbti[index];
  return ['E', 'N', 'T', 'J'].includes(letter) ? 1 : -1;
}

function axisSimilarity(character, vector) {
  const similarities = AXES.map((axis) => {
    const userValue = normalizeAxisScore(axis, vector);
    const targetPole = axisPole(axis, character.mbti);
    const directionalMatch = userValue === 0
      ? 0.5
      : (Math.sign(userValue) === targetPole ? 1 : 0);
    const profileValue = character.profile?.[axis] ?? targetPole;
    const distanceCloseness = 1 - Math.abs(userValue - profileValue) / 2;
    return directionalMatch * 0.7 + distanceCloseness * 0.3;
  });

  return similarities.reduce((sum, value) => sum + value, 0) / similarities.length;
}

function styleSimilarity(character, vector) {
  const closeness = STYLES.map((style) => {
    const userValue = normalizeStyleScore(style, vector);
    const characterValue = character.styleProfile?.[style] || 0;
    return 1 - Math.abs(userValue - characterValue);
  });

  const userTopStyles = STYLES
    .map((style) => [style, normalizeStyleScore(style, vector)])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2);

  const totalWeight = userTopStyles.reduce((sum, [, value]) => sum + value, 0);
  const alignment = totalWeight > 0
    ? userTopStyles.reduce(
        (sum, [style, value]) => sum + value * (character.styleProfile?.[style] || 0),
        0
      ) / totalWeight
    : 0.5;

  const closenessMean = closeness.reduce((sum, value) => sum + value, 0) / closeness.length;
  return closenessMean * 0.55 + alignment * 0.45;
}

function deriveMbti(vector) {
  return [
    (vector.ei || 0) >= 0 ? 'E' : 'I',
    (vector.sn || 0) >= 0 ? 'N' : 'S',
    (vector.tf || 0) >= 0 ? 'T' : 'F',
    (vector.jp || 0) >= 0 ? 'J' : 'P'
  ].join('');
}

function styleSnapshot(vector) {
  return STYLES
    .map((style) => [style, normalizeStyleScore(style, vector)])
    .sort((a, b) => b[1] - a[1]);
}

/**
 * 计算角色得分
 * @param {Object} character
 * @param {Object} vector
 * @returns {number}
 */
function computeScore(character, vector) {
  const primary = axisSimilarity(character, vector);
  const style = styleSimilarity(character, vector);
  return primary * PRIMARY_WEIGHT + style * STYLE_WEIGHT;
}

/**
 * 根据用户向量对所有角色排序
 * @param {Object} vector
 * @returns {Array}
 */
function rankCharacters(vector) {
  return characters
    .map((character) => {
      const primary = axisSimilarity(character, vector);
      const style = styleSimilarity(character, vector);
      return {
        character,
        score: primary * PRIMARY_WEIGHT + style * STYLE_WEIGHT,
        breakdown: { primary, style }
      };
    })
    .sort((a, b) => b.score - a.score);
}

function summarizeDistribution(samples) {
  const total = Object.values(samples).reduce((sum, value) => sum + value, 0);
  const probs = Object.values(samples)
    .filter((value) => value > 0)
    .map((value) => value / total);
  const sorted = Object.entries(samples).sort((a, b) => b[1] - a[1]);
  const top1 = sorted[0]?.[1] / total || 0;
  const top2 = sorted[1]?.[1] / total || 0;
  const top3 = sorted.slice(0, 3).reduce((sum, [, value]) => sum + value, 0) / total || 0;
  const hhi = probs.reduce((sum, p) => sum + p * p, 0);
  const entropy = probs.reduce((sum, p) => sum - p * Math.log2(p), 0);

  return {
    top1,
    top3,
    margin: top1 - top2,
    hhi,
    entropy,
    effectiveRoles: Math.pow(2, entropy)
  };
}

/**
 * 验证：随机抽样，观察角色分布是否过度集中
 */
function verifyDistribution(iterations = 100000, seed = 42) {
  const hitCount = {};
  characters.forEach((character) => { hitCount[character.code] = 0; });

  let rng = seed;
  function rand() {
    rng = (rng * 1103515245 + 12345) & 0x7fffffff;
    return rng / 0x7fffffff;
  }

  for (let iter = 0; iter < iterations; iter++) {
    const vector = emptyVector();
    for (const question of questions) {
      const pick = Math.floor(rand() * question.answers.length);
      const answer = question.answers[pick];
      for (const [key, value] of Object.entries(answer.scores || {})) {
        vector[key] = (vector[key] || 0) + value;
      }
    }

    const ranked = rankCharacters(vector);
    hitCount[ranked[0].character.code]++;
  }

  const stats = summarizeDistribution(hitCount);
  const fail = {
    top1: stats.top1 > 0.18,
    top3: stats.top3 > 0.5,
    hhi: stats.hhi > 0.1,
    entropy: stats.entropy < 3.85,
    effectiveRoles: stats.effectiveRoles < 11,
    margin: stats.margin > 0.06
  };

  console.log(`题目数: ${questions.length}`);
  console.log(`角色数: ${characters.length}`);
  console.log(`Top1 占比: ${(stats.top1 * 100).toFixed(2)}%`);
  console.log(`Top3 占比: ${(stats.top3 * 100).toFixed(2)}%`);
  console.log(`HHI: ${stats.hhi.toFixed(4)}`);
  console.log(`Entropy: ${stats.entropy.toFixed(3)} bits`);
  console.log(`Effective roles: ${stats.effectiveRoles.toFixed(2)}`);
  console.log(`Top1-Top2 margin: ${(stats.margin * 100).toFixed(2)}pp`);
  console.log('');

  Object.entries(hitCount)
    .sort((a, b) => b[1] - a[1])
    .forEach(([code, count]) => {
      const character = characters.find((entry) => entry.code === code);
      console.log(`  ${character.name} (${character.mbti}): ${count}`);
    });

  const failedChecks = Object.entries(fail).filter(([, value]) => value).map(([key]) => key);
  if (failedChecks.length > 0) {
    console.log(`\n分布告警: ${failedChecks.join(', ')}`);
  } else {
    console.log('\n分布通过阈值校验。');
  }

  return failedChecks.length === 0;
}

if (require.main === module) {
  console.log('=== Chiikawa Quiz 分布验证 ===\n');
  const passed = verifyDistribution();
  process.exit(passed ? 0 : 1);
}

module.exports = {
  AXES,
  STYLES,
  axisMax,
  styleMax,
  emptyVector,
  computeScore,
  deriveMbti,
  normalizeAxisScore,
  normalizeStyleScore,
  rankCharacters,
  styleSnapshot,
  summarizeDistribution,
  verifyDistribution
};
