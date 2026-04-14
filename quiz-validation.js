#!/usr/bin/env node

const {
  AXES,
  STYLES,
  characters,
  emptyVector,
  questions,
  rankCharacters,
  summarizeDistribution
} = (() => {
  const scoring = require('./quiz-scoring');
  return {
    AXES: scoring.AXES,
    STYLES: scoring.STYLES,
    characters: require('./quiz-characters.json').characters,
    emptyVector: scoring.emptyVector,
    questions: require('./quiz-questions.json').questions,
    rankCharacters: scoring.rankCharacters,
    summarizeDistribution: scoring.summarizeDistribution
  };
})();

function makeRng(seed) {
  let rng = seed;
  return function rand() {
    rng = (rng * 1103515245 + 12345) & 0x7fffffff;
    return rng / 0x7fffffff;
  };
}

function randomLatentProfile(rand) {
  const profile = {};
  AXES.forEach((axis) => {
    profile[axis] = rand() * 2 - 1;
  });
  STYLES.forEach((style) => {
    profile[style] = rand();
  });
  return profile;
}

function pearson(xs, ys) {
  if (xs.length !== ys.length || xs.length === 0) return 0;
  const meanX = xs.reduce((a, b) => a + b, 0) / xs.length;
  const meanY = ys.reduce((a, b) => a + b, 0) / ys.length;
  let num = 0;
  let denX = 0;
  let denY = 0;
  for (let i = 0; i < xs.length; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const den = Math.sqrt(denX * denY);
  return den === 0 ? 0 : num / den;
}

function answerQuestionSet(questionSet, rand) {
  const vector = emptyVector();
  for (const question of questionSet) {
    const answer = question.answers[Math.floor(rand() * question.answers.length)];
    for (const [key, value] of Object.entries(answer.scores || {})) {
      vector[key] = (vector[key] || 0) + value;
    }
  }
  return vector;
}

function simulateResponse(questionSet, rand) {
  return questionSet.map((question) => {
    const answerIndex = Math.floor(rand() * question.answers.length);
    return {
      question,
      answer: question.answers[answerIndex]
    };
  });
}

function samplePersonaResponse(questionSet, rand, latent) {
  return questionSet.map((question) => {
    const weights = question.answers.map((answer) => {
      let score = 0;
      AXES.forEach((axis) => {
        const answerValue = answer.scores?.[axis] || 0;
        if (answerValue !== 0) score += latent[axis] * answerValue;
      });
      STYLES.forEach((style) => {
        const answerValue = answer.scores?.[style] || 0;
        if (answerValue !== 0) score += latent[style] * answerValue * 0.7;
      });
      return Math.exp(score);
    });
    const total = weights.reduce((sum, value) => sum + value, 0);
    let needle = rand() * total;
    let answerIndex = 0;
    for (let i = 0; i < weights.length; i++) {
      needle -= weights[i];
      if (needle <= 0) {
        answerIndex = i;
        break;
      }
    }
    return {
      question,
      answer: question.answers[answerIndex]
    };
  });
}

function vectorFromResponseItems(items) {
  const vector = emptyVector();
  items.forEach(({ answer }) => {
    for (const [key, value] of Object.entries(answer.scores || {})) {
      vector[key] = (vector[key] || 0) + value;
    }
  });
  return vector;
}

function addScores(target, source) {
  for (const [key, value] of Object.entries(source || {})) {
    target[key] = (target[key] || 0) + value;
  }
}

function distributionForQuestions(questionSet, iterations = 50000, seed = 42) {
  const rand = makeRng(seed);
  const counts = Object.fromEntries(characters.map((character) => [character.code, 0]));

  for (let i = 0; i < iterations; i++) {
    const vector = answerQuestionSet(questionSet, rand);
    const ranked = rankCharacters(vector);
    counts[ranked[0].character.code]++;
  }

  return counts;
}

function splitHalfReliability(samples = 20000, seed = 20260414) {
  const rand = makeRng(seed);
  const buckets = Object.fromEntries(AXES.map((axis) => [axis, { odd: [], even: [] }]));

  for (let i = 0; i < samples; i++) {
    const latent = randomLatentProfile(rand);
    const response = samplePersonaResponse(questions, rand, latent);
    const oddVector = vectorFromResponseItems(response.filter((_, index) => index % 2 === 0));
    const evenVector = vectorFromResponseItems(response.filter((_, index) => index % 2 === 1));
    AXES.forEach((axis) => {
      buckets[axis].odd.push(oddVector[axis] || 0);
      buckets[axis].even.push(evenVector[axis] || 0);
    });
  }

  const result = {};
  AXES.forEach((axis) => {
    const r = pearson(buckets[axis].odd, buckets[axis].even);
    const denom = 1 + r;
    result[axis] = {
      rawCorrelation: Number(r.toFixed(3)),
      spearmanBrown: Number((denom !== 0 ? 2 * r / denom : r).toFixed(3))
    };
  });
  return result;
}

function leaveOneQuestionOut(iterations = 30000) {
  const baselineCounts = distributionForQuestions(questions, iterations, 77);
  const baselineStats = summarizeDistribution(baselineCounts);
  const baselineTop = Object.entries(baselineCounts).sort((a, b) => b[1] - a[1])[0][0];

  return questions.map((question) => {
    const subset = questions.filter((entry) => entry.id !== question.id);
    const counts = distributionForQuestions(subset, iterations, 77 + question.id);
    const stats = summarizeDistribution(counts);
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    return {
      questionId: question.id,
      axis: question.axis,
      topChanged: top !== baselineTop,
      top1DeltaPp: Number(((stats.top1 - baselineStats.top1) * 100).toFixed(2)),
      top3DeltaPp: Number(((stats.top3 - baselineStats.top3) * 100).toFixed(2)),
      entropyDelta: Number((stats.entropy - baselineStats.entropy).toFixed(3))
    };
  });
}

function repeatedMbtiDiversion(iterations = 50000, seed = 99) {
  const rand = makeRng(seed);
  const groups = {};
  characters.forEach((character) => {
    groups[character.mbti] ||= [];
    groups[character.mbti].push(character.code);
  });

  const repeated = Object.fromEntries(
    Object.entries(groups).filter(([, codes]) => codes.length > 1)
  );
  const counts = Object.fromEntries(
    Object.values(repeated).flat().map((code) => [code, 0])
  );

  for (let i = 0; i < iterations; i++) {
    const vector = answerQuestionSet(questions, rand);
    const ranked = rankCharacters(vector);
    const winner = ranked[0].character;
    if (counts[winner.code] !== undefined) counts[winner.code]++;
  }

  const summary = {};
  Object.entries(repeated).forEach(([mbti, codes]) => {
    const total = codes.reduce((sum, code) => sum + counts[code], 0) || 1;
    const shares = codes.map((code) => ({
      code,
      name: characters.find((character) => character.code === code).name,
      share: Number(((counts[code] / total) * 100).toFixed(2))
    }));
    summary[mbti] = shares;
  });

  return summary;
}

function main() {
  console.log('=== Quiz Validation ===\n');

  console.log('Split-half reliability');
  console.log(JSON.stringify(splitHalfReliability(), null, 2));
  console.log('');

  const loo = leaveOneQuestionOut();
  const unstable = loo
    .filter((row) => Math.abs(row.top1DeltaPp) > 0.8 || Math.abs(row.top3DeltaPp) > 1.2 || row.topChanged)
    .sort((a, b) => Math.abs(b.top1DeltaPp) - Math.abs(a.top1DeltaPp));
  console.log('Leave-one-question-out: top sensitive items');
  console.log(JSON.stringify(unstable.slice(0, 8), null, 2));
  console.log('');

  console.log('Repeated MBTI diversion');
  console.log(JSON.stringify(repeatedMbtiDiversion(), null, 2));
}

if (require.main === module) {
  main();
}

module.exports = {
  splitHalfReliability,
  leaveOneQuestionOut,
  repeatedMbtiDiversion
};
