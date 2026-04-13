/**
 * Chiikawa MBTI quiz 评分逻辑
 * 基于 quiz-questions.json 和 quiz-characters.json 进行匹配计算
 */

const path = require('path');
const fs = require('fs');

const questions = require('./quiz-questions.json').questions;
const characters = require('./quiz-characters.json').characters;

/**
 * 计算角色得分
 * @param {Object} character - 角色数据
 * @param {Object} traitScores - 用户累积的trait分数
 * @returns {number} 匹配分数
 */
function computeScore(character, traitScores) {
  const raw = Object.entries(character.traits).reduce(
    (sum, [trait, weight]) => sum + (traitScores[trait] || 0) * weight,
    0
  );
  const traitWeightSum = Object.values(character.traits).reduce((s, v) => s + v, 0);
  const normalized = raw / traitWeightSum;

  const topTraits = Object.entries(traitScores)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([t]) => t);

  const focusHits = (character.focusTraits || []).filter(t => topTraits.includes(t)).length;
  let focusBonus = 0;
  if (focusHits === 2) focusBonus += 2.4;
  if (focusHits === 1) focusBonus += 0.8;

  return raw + normalized * 3 + focusBonus;
}

/**
 * 根据trait分数对所有角色排序
 * @param {Object} traitScores
 * @returns {Array} 排序后的结果数组
 */
function rankCharacters(traitScores) {
  return characters
    .map(c => ({
      character: c,
      score: computeScore(c, traitScores)
    }))
    .sort((a, b) => b.score - a.score);
}

/**
 * 验证：为每个角色寻找一条能命中它的答题路径
 */
function verifyAllReachable() {
  const hitCount = {};
  characters.forEach(c => hitCount[c.code] = 0);

  const seed = 42;
  let rng = seed;
  function rand() {
    rng = (rng * 1103515245 + 12345) & 0x7fffffff;
    return rng / 0x7fffffff;
  }

  // 随机测试 100000 次答题
  for (let iter = 0; iter < 100000; iter++) {
    const traits = {};
    for (const q of questions) {
      const opt = Math.floor(rand() * 4);
      for (const [t, v] of Object.entries(q.answers[opt].traits)) {
        traits[t] = (traits[t] || 0) + v;
      }
    }
    const ranked = rankCharacters(traits);
    hitCount[ranked[0].character.code]++;
  }

  const hit = Object.entries(hitCount).filter(([, v]) => v > 0);
  const miss = Object.entries(hitCount).filter(([, v]) => v === 0);

  console.log(`题目数: ${questions.length}`);
  console.log(`角色数: ${characters.length}`);
  console.log(`可达角色: ${hit.length}/${characters.length}`);
  console.log('');

  hit.sort((a, b) => b[1] - a[1]).forEach(([code, count]) => {
    const c = characters.find(x => x.code === code);
    console.log(`  ${c.name} (${c.mbti}): ${count} 次`);
  });

  if (miss.length > 0) {
    console.log(`\n不可达角色 (${miss.length}):`);
    miss.forEach(([code]) => {
      const c = characters.find(x => x.code === code);
      console.log(`  ${c.name} (${c.mbti})`);
    });
  } else {
    console.log('\n所有角色均可达！');
  }

  return miss.length === 0;
}

// 运行验证
if (require.main === module) {
  console.log('=== Chiikawa Quiz 评分验证 ===\n');
  const passed = verifyAllReachable();
  process.exit(passed ? 0 : 1);
}

module.exports = { computeScore, rankCharacters, verifyAllReachable };
