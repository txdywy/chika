/**
 * CHTI — Chiikawa MBTI Quiz App
 * Mobile-first, WeChat-friendly
 */

/* ===== image map ===== */
const IMAGE_MAP = {
  CHII: "images/01-Chiikawas/吉伊卡哇_chii.png",
  HACH: "images/01-Chiikawas/小八_hachi.png",
  USAG: "images/01-Chiikawas/兔兔_usagi.png",
  MOMO: "images/01-Chiikawas/飞鼠_momo.png",
  KURI: "images/01-Chiikawas/栗子馒头_kuri.png",
  RAKK: "images/01-Chiikawas/海獭_rakko.png",
  SHIS: "images/01-Chiikawas/狮萨_shisa.png",
  FURU: "images/01-Chiikawas/古本_furu.png",
  LABO: "images/02-Yoroi铠甲人/劳动铠甲人_labo.png",
  POCH: "images/02-Yoroi铠甲人/口袋铠甲人_poch.png",
  RAMN: "images/02-Yoroi铠甲人/拉面铠甲人_ramn.png",
  YATA: "images/02-Yoroi铠甲人/摊贩铠甲人_yata.png",
  ANOK: "images/03-Chimera/那个孩子_anok.png",
  DEKA: "images/03-Chimera/大强_deka.webp",
  ODEE: "images/04-Miscellaneous/欧德_odee.jpg",
  GOBL: "images/04-Miscellaneous/哥布林_gobl.png",
  BLAC: "images/04-Miscellaneous/黑星_blac.jpg",
  SHOO: "images/04-Miscellaneous/流星_shoo.jpg",
  MAJO: "images/04-Miscellaneous/山姥_majo.webp",
  KABU: "images/04-Miscellaneous/吉伊卡菇_kabu.jpeg",
  MUCH: "images/04-Miscellaneous/营业超人_much.png",
  PAJA: "images/04-Miscellaneous/睡衣派对组_paja.png"
};

const AXES = ["ei", "sn", "tf", "jp"];
const STYLES = ["warmth", "weirdness", "showmanship", "discipline", "edge", "softness"];
const SCORE_KEYS = [...AXES, ...STYLES];

const STORAGE_KEY = "chti-state-v2";
let totalQuestions = 0;
let axisMax = {};
let styleMax = {};

const PROGRESS_TIPS = [
  "前 6 题，先按直觉答。",
  "做到一半了，四维偏好开始成形。",
  "快到最后了，风格差异会拉开。",
  "最后几题，别回头修人设。"
];

/* ===== state ===== */
let questions = [];
let characters = [];
let latestResult = null;
const HOME_PATH = "/";

const state = {
  currentQuestion: 0,
  answers: [],
  scores: emptyScores()
};

/* ===== DOM ===== */
const $ = (sel) => document.querySelector(sel);
const screenHome  = $("#screenHome");
const screenQuiz  = $("#screenQuiz");
const screenDetail = $("#screenDetail");
const screenResult = $("#screenResult");
const screenError  = $("#screenError");
const errorRetry   = $("#errorRetry");
const rosterGrid  = $("#rosterGrid");
const detailBack  = $("#detailBack");
const detailStartQuiz = $("#detailStartQuiz");
const restartTop  = $("#restartTop");
const startButton = $("#startButton");
const heroResume  = $("#heroResume");
const resumeCount = $("#resumeCount");
const resumeContinueBtn = $("#resumeContinue");
const resumeRestartBtn  = $("#resumeRestart");
const progressCount  = $("#progressCount");
const progressTip    = $("#progressTip");
const progressFill   = $("#progressFill");
const questionIndex  = $("#questionIndex");
const questionTitle  = $("#questionTitle");
const answersEl      = $("#answers");
const backBtn        = $("#backBtn");
const resultCard     = $("#resultCard");
const posterEl       = $("#poster");
const evidenceList   = $("#evidenceList");
const sbtIHeading    = $("#sbtIHeading");
const sbtIReasonEl   = $("#sbtIReason");
const groupRole      = $("#groupRole");
const todayRemark    = $("#todayRemark");
const bestMatch      = $("#bestMatch");
const worstMatch     = $("#worstMatch");
const bestMatchReason = $("#bestMatchReason");
const worstMatchReason = $("#worstMatchReason");
const traitSignature  = $("#traitSignature");
const traitEnergy     = $("#traitEnergy");
const traitStress     = $("#traitStress");
const deputyCard     = $("#deputyCard");
const shareCopy      = $("#shareCopy");
const copyButton     = $("#copyButton");
const downloadButton = $("#downloadButton");
const restartButton  = $("#restartButton");
const copyFeedback   = $("#copyFeedback");
const wechatTip      = $("#wechatTip");

const isWeChat = /MicroMessenger/i.test(navigator.userAgent);

/* ===== init ===== */
async function init() {
  await loadData();

  renderRoster();
  if (isWeChat) wechatTip.hidden = false;
  restoreState();
  handleHash();

  detailBack.addEventListener("click", () => showScreen(screenHome));
  detailStartQuiz.addEventListener("click", () => {
    if (state.answers.length >= totalQuestions) {
      computeAndShow();
      showScreen(screenResult);
    } else {
      onStart();
    }
  });
  resumeContinueBtn.addEventListener("click", onStart);
  resumeRestartBtn.addEventListener("click", resetAll);
  backBtn.addEventListener("click", goBack);
  startButton.addEventListener("click", onStart);
  restartTop.addEventListener("click", resetAll);
  restartButton.addEventListener("click", resetAll);
  copyButton.addEventListener("click", copyResult);
  downloadButton.addEventListener("click", exportPoster);
  errorRetry.addEventListener("click", () => location.reload());
}

async function loadData() {
  try {
    const [qRes, cRes] = await Promise.all([
      fetch("quiz-questions.json"),
      fetch("quiz-characters.json")
    ]);
    if (!qRes.ok || !cRes.ok) throw new Error(`HTTP ${qRes.status}/${cRes.status}`);
    const qData = await qRes.json();
    const cData = await cRes.json();
    questions = qData.questions;
    totalQuestions = questions.length;
    ({ axisMax, styleMax } = getQuestionMaxima(questions));
    characters = cData.characters.map(c => ({
      ...c,
      typeCode: c.typeCode || c.sbtI,
      image: IMAGE_MAP[c.code] ? '/' + IMAGE_MAP[c.code] : ''
    }));
  } catch (e) {
    console.error("Failed to load quiz data", e);
    [screenHome, screenQuiz, screenDetail, screenResult].forEach(s =>
      s.classList.remove("active")
    );
    screenError.classList.add("active");
    throw e;
  }
}

/* ===== roster ===== */
function renderRoster() {
  rosterGrid.innerHTML = characters.map(c => `
    <a class="roster-item" href="/characters/${c.code}/" data-code="${c.code}" aria-label="查看${esc(c.name)}详情">
      <div class="roster-avatar">
        ${imgEl(c, 52)}
      </div>
      <span class="roster-name">${esc(c.name)}</span>
    </a>
  `).join("");

  // SPA navigation: intercept clicks, use JS detail view for SPA feel
  rosterGrid.querySelectorAll(".roster-item").forEach(el => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      const code = el.dataset.code;
      const char = characters.find(c => c.code === code);
      if (char) renderDetail(char);
    });
  });
}

/* ===== screens ===== */
function showScreen(target) {
  [screenHome, screenQuiz, screenDetail, screenResult, screenError].forEach(s =>
    s.classList.toggle("active", s === target)
  );
  window.scrollTo({ top: 0, behavior: "auto" });
}

/* ===== start ===== */
function onStart() {
  if (state.answers.length >= totalQuestions) {
    computeAndShow();
    showScreen(screenResult);
    return;
  }
  state.currentQuestion = Math.min(state.currentQuestion, totalQuestions - 1);
  saveState();
  renderQuestion();
  showScreen(screenQuiz);
}

/* ===== render question ===== */
function renderQuestion() {
  const q = questions[state.currentQuestion];
  const idx = state.currentQuestion;
  const pct = ((idx + 1) / totalQuestions) * 100;

  progressCount.textContent = `第 ${idx + 1} / ${totalQuestions} 题`;
  progressFill.style.width = `${pct}%`;
  const tipIdx = Math.min(PROGRESS_TIPS.length - 1, Math.floor(idx / 6));
  progressTip.textContent = PROGRESS_TIPS[tipIdx];
  questionIndex.textContent = `问题 ${idx + 1}`;
  questionTitle.textContent = q.title;

  backBtn.hidden = state.answers.length === 0;

  answersEl.innerHTML = q.answers.map((a, i) =>
    `<button class="answer-btn" data-i="${i}">${a.text}</button>`
  ).join("");

  answersEl.querySelectorAll(".answer-btn").forEach(btn => {
    btn.addEventListener("click", () => pickAnswer(+btn.dataset.i));
  });
}

/* ===== pick answer ===== */
let isAnswering = false;
function pickAnswer(i) {
  if (isAnswering) return;
  isAnswering = true;

  const q = questions[state.currentQuestion];
  const chosen = q.answers[i];
  const btns = answersEl.querySelectorAll(".answer-btn");

  /* visual feedback: highlight tapped answer */
  btns.forEach((btn, idx) => {
    if (idx === i) {
      btn.style.background = "var(--accent)";
      btn.style.color = "#fff";
      btn.style.borderColor = "var(--accent)";
      btn.style.fontWeight = "700";
    } else {
      btn.style.opacity = "0.4";
    }
    btn.style.pointerEvents = "none";
  });

  state.answers.push(i);
  for (const [key, val] of Object.entries(chosen.scores || {})) {
    state.scores[key] = (state.scores[key] || 0) + val;
  }
  state.currentQuestion++;
  saveState();

  if (state.currentQuestion >= totalQuestions) {
    setTimeout(() => {
      computeAndShow();
      showScreen(screenResult);
      isAnswering = false;
    }, 250);
    return;
  }

  /* subtle animation after feedback */
  setTimeout(() => {
    answersEl.style.opacity = "0";
    answersEl.style.transform = "translateY(8px)";
    setTimeout(() => {
      renderQuestion();
      answersEl.style.transition = "opacity 0.2s ease, transform 0.2s ease";
      answersEl.style.opacity = "1";
      answersEl.style.transform = "translateY(0)";
      setTimeout(() => { answersEl.style.transition = ""; isAnswering = false; }, 250);
    }, 100);
  }, 250);
}

/* ===== go back ===== */
function goBack() {
  if (isAnswering || state.answers.length === 0) return;

  const lastAnswerIdx = state.answers.length - 1;
  const lastQIdx = lastAnswerIdx;
  const lastAnswer = state.answers[lastAnswerIdx];
  const q = questions[lastQIdx];
  const chosen = q.answers[lastAnswer];

  state.answers.pop();
  state.currentQuestion = lastQIdx;
  for (const [key, val] of Object.entries(chosen.scores || {})) {
    state.scores[key] = (state.scores[key] || 0) - val;
  }
  saveState();

  /* fade transition */
  answersEl.style.opacity = "0";
  answersEl.style.transform = "translateY(-8px)";
  setTimeout(() => {
    renderQuestion();
    answersEl.style.transition = "opacity 0.2s ease, transform 0.2s ease";
    answersEl.style.opacity = "1";
    answersEl.style.transform = "translateY(0)";
    setTimeout(() => { answersEl.style.transition = ""; }, 250);
  }, 120);
}

/* ===== scoring ===== */
function getQuestionMaxima(questionList) {
  const nextAxisMax = Object.fromEntries(AXES.map(key => [key, 0]));
  const nextStyleMax = Object.fromEntries(STYLES.map(key => [key, 0]));

  questionList.forEach(question => {
    AXES.forEach(axis => {
      const localMax = question.answers.reduce(
        (best, answer) => Math.max(best, Math.abs(answer.scores?.[axis] || 0)),
        0
      );
      nextAxisMax[axis] += localMax;
    });

    STYLES.forEach(style => {
      const localMax = question.answers.reduce(
        (best, answer) => Math.max(best, answer.scores?.[style] || 0),
        0
      );
      nextStyleMax[style] += localMax;
    });
  });

  return { axisMax: nextAxisMax, styleMax: nextStyleMax };
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function normalizeAxisScore(axis, scores) {
  const max = axisMax[axis] || 1;
  return Math.max(-1, Math.min(1, (scores[axis] || 0) / max));
}

function normalizeStyleScore(style, scores) {
  const max = styleMax[style] || 1;
  return clamp01((scores[style] || 0) / max);
}

function axisPole(axis, mbti) {
  const index = AXES.indexOf(axis);
  const letter = mbti[index];
  return ["E", "N", "T", "J"].includes(letter) ? 1 : -1;
}

function axisSimilarity(character, scores) {
  const similarities = AXES.map(axis => {
    const userValue = normalizeAxisScore(axis, scores);
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

function styleSimilarity(character, scores) {
  const closeness = STYLES.map(style => {
    const userValue = normalizeStyleScore(style, scores);
    const targetValue = character.styleProfile?.[style] || 0;
    return 1 - Math.abs(userValue - targetValue);
  });

  const userTopStyles = STYLES
    .map(style => [style, normalizeStyleScore(style, scores)])
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

function computeScore(character, scores) {
  const primary = axisSimilarity(character, scores);
  const style = styleSimilarity(character, scores);
  return {
    score: primary * 0.70 + style * 0.30,
    primary,
    style
  };
}

function deriveMbti(scores) {
  return [
    (scores.ei || 0) >= 0 ? "E" : "I",
    (scores.sn || 0) >= 0 ? "N" : "S",
    (scores.tf || 0) >= 0 ? "T" : "F",
    (scores.jp || 0) >= 0 ? "J" : "P"
  ].join("");
}

function topStyleLabels(scores, count = 2) {
  const labels = {
    warmth: "接住别人",
    weirdness: "脑洞感",
    showmanship: "存在感",
    discipline: "收束力",
    edge: "锋利度",
    softness: "敏感度"
  };

  return STYLES
    .map(style => [style, normalizeStyleScore(style, scores)])
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([style]) => labels[style]);
}

function rank(scores) {
  return characters
    .map(c => ({
      character: c,
      ...computeScore(c, scores)
    }))
    .sort((a, b) => b.score - a.score);
}

/* ===== show result ===== */
function computeAndShow() {
  try {
    const ranked = rank(state.scores);
    if (ranked.length < 2) {
      console.warn("Not enough characters to compute result, falling back.");
      fallbackResult();
      return;
    }
    const primary = ranked[0].character;
    const secondary = ranked[1].character;
    const matchRate = Math.max(68, Math.min(97, Math.round(ranked[0].score * 100)));
    const mbtiGuess = deriveMbti(state.scores);
    const styleTags = topStyleLabels(state.scores);
    const shareUrl = `${location.origin}/share/${primary.code}/`;

    latestResult = { primary, secondary, matchRate, mbtiGuess, styleTags, shareUrl };
    document.title = `我是 ${primary.name} | CHTI`;
    updateMetaTags(primary, shareUrl);
    history.replaceState({}, "", `#share/${primary.code}`);

    /* result card */
    const cardBg = `linear-gradient(160deg, ${primary.color || "#FFD0A0"}, #FFF6E5 70%, #FFF)`;
    resultCard.style.background = cardBg;
    resultCard.innerHTML = `
      <div class="result-badges">
        <span class="badge">${primary.typeCode}</span>
        <span class="badge">${mbtiGuess}</span>
        <span class="badge">${matchRate}% 匹配</span>
      </div>
      <p class="result-eyebrow">角色卡抽出来了</p>
      <h2 class="result-name">你是 ${primary.name}</h2>
      <p class="result-title">${primary.title}</p>
      <p class="result-oneliner">${primary.oneLiner}</p>
      <div class="result-match">
        <span>${primary.groupRole || ""}</span>
        <span>副卡：${secondary.name}</span>
      </div>
      <div class="result-image-wrap">
        <div class="result-image">${imgEl(primary, 140)}</div>
      </div>
    `;

    /* poster */
    posterEl.style.background =
      `radial-gradient(circle at top left, rgba(255,255,255,0.82), transparent 36%), ` +
      `linear-gradient(160deg, ${primary.color || "#FFE6A0"}, #FFF2DB)`;
    posterEl.innerHTML = `
      <div class="poster-head">
        <div class="poster-img">${imgEl(primary, 80)}</div>
        <div>
          <div class="poster-badges">
            <span class="poster-badge">${primary.typeCode}</span>
            <span class="poster-badge">${mbtiGuess}</span>
          </div>
          <p class="poster-title">${primary.name} · ${primary.title}</p>
        </div>
      </div>
      <p class="poster-copy">"${primary.oneLiner}"</p>
    `;

    /* evidence */
    evidenceList.innerHTML = primary.evidence.map(e => `<li>${e}</li>`).join("");

    /* sbti reason */
    sbtIHeading.textContent = `${primary.sbtI} · ${primary.sbtIFull}`;
    sbtIReasonEl.textContent =
      `你的四维偏好更接近 ${mbtiGuess}，再叠加 ${styleTags.join(" / ")} 这组风格信号，因此最像 ${primary.name}。${primary.sbtIReason || ""}`;

    /* group + today */
    groupRole.textContent = primary.groupRole;
    todayRemark.textContent = primary.todayRemark;

    /* best / worst match */
    bestMatch.textContent = primary.bestMatch;
    worstMatch.textContent = primary.worstMatch;
    bestMatchReason.textContent = primary.bestMatchReason || "";
    worstMatchReason.textContent = primary.worstMatchReason || "";

    /* character traits */
    const d = primary.detail || {};
    traitSignature.textContent = d.signature || "";
    traitEnergy.textContent = d.energyLevel || "";
    traitStress.textContent = d.stressBehavior || "";

    /* deputy */
    renderDeputy(secondary);

    /* share copy */
    shareCopy.value =
      `测出来了，我这次抽到的是 ${primary.name}。\n` +
      `${primary.typeCode} / ${mbtiGuess}\n` +
      `${primary.oneLiner}\n` +
      `我这次的风格标签：${styleTags.join("、")}。\n` +
      `副卡是 ${secondary.name}。\n` +
      `CHTI 说我：${primary.summary}\n` +
      `你也去测测，看你会抽到谁：${shareUrl}`;

    restartTop.hidden = false;
    saveState();
  } catch (e) {
    console.error("render error", e);
    fallbackResult();
  }
}

/* ===== dynamic meta tags ===== */
function updateMetaTags(primary, shareUrl) {
  const origin = location.origin;
  const shareImage = `${origin}/social/${primary.code}.jpg`;
  setOrCreateMeta('property', 'og:title', `我是 ${primary.name} | CHTI`);
  setOrCreateMeta('property', 'og:description', `测出来了，我这次抽到的是 ${primary.name}。${primary.sbtIFull}。`);
  setOrCreateMeta('property', 'og:image', shareImage);
  setOrCreateMeta('property', 'og:url', shareUrl);
  setOrCreateMeta('name', 'twitter:title', `我是 ${primary.name} | CHTI`);
  setOrCreateMeta('name', 'twitter:description', `测出来了，我这次抽到的是 ${primary.name}。`);
  setOrCreateMeta('name', 'twitter:image', shareImage);
}

function setOrCreateMeta(attrName, attrValue, content) {
  let el = document.querySelector(`meta[${attrName}="${attrValue}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/* ===== image helper (HTML-escaped) ===== */
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
}

function imgEl(c, size) {
  if (!c.image) return `<span style="font-size:${size * 0.3}px;font-weight:800;color:#8B6D4E">${esc(c.name.slice(0, 2))}</span>`;
  const fallbackName = esc(c.name.slice(0, 2));
  return `<img src="${esc(c.image)}" alt="${esc(c.name)}" loading="lazy" referrerpolicy="no-referrer"
    style="width:100%;height:100%;object-fit:contain"
    onerror="this.outerHTML='<span style=&quot;font-size:${size * 0.3}px;font-weight:800;color:#8B6D4E&quot;>${fallbackName}</span>'">`;
}

function fallbackResult() {
  const c = characters[0];
  latestResult = { primary: c, secondary: characters[1], matchRate: 66 };
  resultCard.innerHTML = `<p>结果渲染出了点小问题，至少不会卡死。点"再测一次"试试。</p>`;
  restartTop.hidden = false;
}

/* ===== deputy ===== */
function renderDeputy(c) {
  deputyCard.className = "info-card deputy-card";
  deputyCard.innerHTML = `
    <span class="deputy-label">副结果卡</span>
    <div class="deputy-avatar">${imgEl(c, 64)}</div>
    <div>
      <div class="deputy-name"><b>${c.typeCode}</b> · <b>${c.mbti}</b> — ${c.name}</div>
      <div class="deputy-sub">${c.title}</div>
      <div class="deputy-one">${c.oneLiner}</div>
    </div>
  `;
}

/* ===== detail page button ===== */
function updateDetailCTA() {
  const done = state.answers.length >= totalQuestions;
  detailStartQuiz.textContent = done ? "查看我的结果" : "开始测试";
}

/* ===== detail page ===== */
function renderDetail(c) {
  const d = c.detail || {};
  const color = c.color || "#FFD0A0";

  $("#detailHero").style.background =
    `linear-gradient(145deg, ${color}, #FFF2DB)`;
  $("#detailHero").innerHTML = `
    <div class="detail-hero-img">${imgEl(c, 100)}</div>
    <div class="detail-hero-content">
      <div class="detail-hero-badges">
        <span class="detail-hero-badge">${c.typeCode}</span>
        <span class="detail-hero-badge">${c.mbti}</span>
        <span class="detail-hero-badge">${c.sbtI} · ${c.sbtIFull}</span>
      </div>
      <h2 class="detail-hero-name">${c.name}</h2>
      <p class="detail-hero-title">${c.title}</p>
      <p class="detail-hero-oneliner">"${c.oneLiner}"</p>
    </div>
  `;

  $("#detailSbtITitle").textContent = `${c.sbtI} · ${c.sbtIFull}`;
  $("#detailSbtIReason").textContent = c.sbtIReason || "";
  $("#detailPersonality").textContent = d.personality || "";

  $("#detailAchievements").innerHTML = (d.achievements || [])
    .map(a => `<li>${a}</li>`).join("");

  $("#detailFunny").textContent = d.funnyAnalysis || "";
  $("#detailLikes").textContent = d.likes || "";
  $("#detailDislikes").textContent = d.dislikes || "";
  $("#detailStress").textContent = d.stressBehavior || "";
  $("#detailEnergy").textContent = d.energyLevel || "";
  $("#detailSignature").textContent = d.signature || "";
  $("#detailBest").textContent = c.bestMatch || "";
  $("#detailWorst").textContent = c.worstMatch || "";

  updateDetailCTA();
  showScreen(screenDetail);
}

/* ===== copy ===== */
async function copyResult() {
  try {
    await navigator.clipboard.writeText(shareCopy.value);
    copyFeedback.textContent = "文案已复制，微信里直接粘贴就行。";
  } catch {
    shareCopy.select();
    copyFeedback.textContent = "长按上面的文字手动复制。";
  }
}

/* ===== poster export ===== */
async function exportPoster() {
  if (!latestResult) {
    copyFeedback.textContent = "先测完结果再导出。";
    return;
  }
  downloadButton.disabled = true;
  copyFeedback.textContent = "正在生成海报…";

  try {
    const blob = await makePosterCanvas(latestResult);
    const name = `chti-${latestResult.primary.code.toLowerCase()}.png`;

    if (!isWeChat && navigator.share && navigator.canShare) {
      const file = new File([blob], name, { type: "image/png" });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "CHTI", text: `我测出来是 ${latestResult.primary.name}` });
        copyFeedback.textContent = "海报已调起分享。";
        return;
      }
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    copyFeedback.textContent = isWeChat
      ? "海报已导出。微信里长按图片保存。"
      : "海报已导出。";
  } catch {
    copyFeedback.textContent = "海报导出失败了，截图最稳。";
  } finally {
    downloadButton.disabled = false;
  }
}

/* ===== canvas poster ===== */
async function makePosterCanvas({ primary, secondary, matchRate, mbtiGuess }) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1740;
  const ctx = canvas.getContext("2d");

  /* bg */
  ctx.fillStyle = primary.color || "#FFD0A0";
  ctx.fillRect(0, 0, 1080, 1740);
  const grad = ctx.createLinearGradient(0, 0, 1080, 1740);
  grad.addColorStop(0, "rgba(255,255,255,0.88)");
  grad.addColorStop(1, "rgba(255,244,226,0.55)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1080, 1740);

  /* inner card */
  ctx.fillStyle = "rgba(255,255,255,0.82)";
  roundRect(ctx, 54, 54, 972, 1632, 46);
  ctx.fill();

  /* image box */
  ctx.fillStyle = "rgba(255,255,255,0.94)";
  roundRect(ctx, 108, 172, 864, 420, 54);
  ctx.fill();

  /* character image with fallback: draw initials when image fails or is missing */
  ctx.fillStyle = "rgba(255,255,255,0.78)";
  roundRect(ctx, 208, 224, 300, 300, 64);
  ctx.fill();

  if (primary.image) {
    try {
      const img = await loadImage(primary.image);
      ctx.drawImage(img, 232, 248, 252, 252);
    } catch {
      drawInitialsFallback(ctx, primary.name, 232, 248, 252);
    }
  } else {
    drawInitialsFallback(ctx, primary.name, 232, 248, 252);
  }

  /* pills */
  drawPill(ctx, 548, 232, primary.typeCode, "#FFF4CE", "#4A3113");
  drawPill(ctx, 548, 316, mbtiGuess || primary.mbti, "#fff", "#4A3113");
  drawPill(ctx, 548, 400, `${matchRate}% 匹配`, "#FFE2D4", "#4A3113");

  /* brand */
  ctx.fillStyle = "#3F280F";
  ctx.font = "700 36px -apple-system, 'PingFang SC', sans-serif";
  ctx.fillText("CHTI", 112, 116);

  /* name */
  ctx.fillStyle = "#4A3113";
  ctx.font = "800 66px -apple-system, 'PingFang SC', sans-serif";
  wrapText(ctx, `你是 ${primary.name}`, 112, 712, 856, 82);
  ctx.font = "700 48px -apple-system, 'PingFang SC', sans-serif";
  wrapText(ctx, primary.title, 112, 806, 856, 60);

  /* oneliner */
  ctx.fillStyle = "#6D5536";
  ctx.font = "500 36px -apple-system, 'PingFang SC', sans-serif";
  wrapText(ctx, primary.oneLiner, 112, 926, 856, 52);

  /* evidence */
  ctx.fillStyle = "#FFF7ED";
  roundRect(ctx, 108, 1012, 864, 294, 42);
  ctx.fill();
  ctx.fillStyle = "#4A3113";
  ctx.font = "700 34px -apple-system, 'PingFang SC', sans-serif";
  ctx.fillText("为什么像", 148, 1076);
  ctx.font = "500 30px -apple-system, 'PingFang SC', sans-serif";
  wrapText(ctx, `1. ${primary.evidence[0] || ""}`, 148, 1140, 780, 42);
  wrapText(ctx, `2. ${primary.evidence[1] || ""}`, 148, 1218, 780, 42);
  wrapText(ctx, `3. ${primary.evidence[2] || ""}`, 148, 1296, 780, 42);

  /* dual info */
  ctx.fillStyle = "#FFF7ED";
  roundRect(ctx, 108, 1348, 414, 192, 36);
  roundRect(ctx, 558, 1348, 414, 192, 36);
  ctx.fill();
  ctx.fillStyle = "#7E6143";
  ctx.font = "600 24px -apple-system, 'PingFang SC', sans-serif";
  ctx.fillText("群聊职位", 144, 1406);
  ctx.fillText("副结果卡", 594, 1406);
  ctx.fillStyle = "#40280F";
  ctx.font = "700 32px -apple-system, 'PingFang SC', sans-serif";
  wrapText(ctx, primary.groupRole, 144, 1460, 342, 40);
  wrapText(ctx, `${secondary.name} · ${secondary.typeCode}`, 594, 1460, 342, 40);

  /* share text */
  ctx.fillStyle = "#7E6143";
  ctx.font = "500 28px -apple-system, 'PingFang SC', sans-serif";
  wrapText(ctx, `测出来了，我这次抽到的是 ${primary.name}。`, 112, 1616, 856, 40);

  return new Promise((resolve, reject) => {
    canvas.toBlob(b => b ? resolve(b) : reject(new Error("canvas toBlob failed")), "image/png");
  });
}

/* ===== canvas helpers ===== */
function loadImage(src) {
  if (!src) return Promise.reject(new Error("empty image src"));
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawInitialsFallback(ctx, name, x, y, size) {
  const initials = name.slice(0, 2);
  ctx.fillStyle = "#8B6D4E";
  ctx.font = `700 ${size * 0.36}px -apple-system, 'PingFang SC', sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(initials, x + size / 2, y + size / 2);
  ctx.textAlign = "start";
  ctx.textBaseline = "alphabetic";
}

function drawPill(ctx, x, y, text, bg, color) {
  ctx.font = "700 28px -apple-system, 'PingFang SC', sans-serif";
  const w = ctx.measureText(text).width + 42;
  ctx.fillStyle = bg;
  roundRect(ctx, x, y, w, 54, 27);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.fillText(text, x + 21, y + 35);
}

function wrapText(ctx, text, x, y, maxW, lineH) {
  const chars = Array.from(text);
  let line = "";
  let ly = y;
  chars.forEach(ch => {
    const test = line + ch;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, ly);
      line = ch;
      ly += lineH;
    } else {
      line = test;
    }
  });
  if (line) ctx.fillText(line, x, ly);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* ===== state persistence ===== */
function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: 2,
      currentQuestion: state.currentQuestion,
      answers: state.answers,
      scores: state.scores
    }));
  } catch {}
}

function restoreState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.removeItem("chti-state-v1");
      showScreen(screenHome);
      return;
    }
    const saved = JSON.parse(raw);
    if (saved.version !== 2) throw new Error("stale schema");
    state.currentQuestion = saved.currentQuestion ?? 0;
    state.answers = saved.answers ?? [];
    state.scores = { ...emptyScores(), ...(saved.scores || {}) };

    if (state.answers.length >= totalQuestions) {
      computeAndShow();
      showScreen(screenResult);
      return;
    }
    if (state.answers.length > 0) {
      heroResume.hidden = false;
      resumeCount.textContent = state.answers.length;
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
  showScreen(screenHome);
}

function resetAll() {
  state.currentQuestion = 0;
  state.answers = [];
  state.scores = emptyScores();
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem("chti-state-v1");
  latestResult = null;
  copyFeedback.textContent = "";
  document.title = "CHTI · 测你像哪个 Chiikawa 角色";
  history.replaceState({}, "", HOME_PATH);
  restartTop.hidden = true;
  updateDetailCTA();
  showScreen(screenHome);
}

function handleHash() {
  const hash = location.hash;
  if (!hash || !hash.startsWith("#share/")) return;

  const code = hash.replace("#share/", "").replace(/\/+$/, "");
  const primary = characters.find(c => c.code === code);
  if (!primary) return;

  /* User hasn't taken the quiz yet — show a share preview without scoring */
  if (state.answers.length < totalQuestions) {
    showSharePreview(primary);
    return;
  }

  computeAndShow();
  showScreen(screenResult);
}

function showSharePreview(primary) {
  /* Build a minimal result card from the shared character without full scoring.
     All content comes from quiz-characters.json (trusted build-time data)
     and is HTML-escaped via esc() before injection. */
  const mbtiGuess = primary.mbti || "????";
  const styleTags = [];
  const shareUrl = `${location.origin}/share/${primary.code}/`;

  latestResult = { primary, secondary: characters[1] || primary, matchRate: 0, mbtiGuess, styleTags, shareUrl };
  document.title = `我是 ${primary.name} | CHTI`;
  updateMetaTags(primary, shareUrl);
  history.replaceState({}, "", `#share/${primary.code}`);

  const cardBg = `linear-gradient(160deg, ${primary.color || "#FFD0A0"}, #FFF6E5 70%, #FFF)`;
  resultCard.style.background = cardBg;
  resultCard.innerHTML = `
    <div class="result-badges">
      <span class="badge">${esc(primary.typeCode)}</span>
      <span class="badge">${esc(mbtiGuess)}</span>
    </div>
    <p class="result-eyebrow">好友分享的结果卡</p>
    <h2 class="result-name">${esc(primary.name)}</h2>
    <p class="result-title">${esc(primary.title)}</p>
    <p class="result-oneliner">${esc(primary.oneLiner)}</p>
    <div class="result-match">
      <span>${esc(primary.groupRole || "")}</span>
    </div>
    <div class="result-image-wrap">
      <div class="result-image">${imgEl(primary, 140)}</div>
    </div>
  `;

  posterEl.style.background =
    `radial-gradient(circle at top left, rgba(255,255,255,0.82), transparent 36%), ` +
    `linear-gradient(160deg, ${primary.color || "#FFE6A0"}, #FFF2DB)`;
  posterEl.innerHTML = `
    <div class="poster-head">
      <div class="poster-img">${imgEl(primary, 80)}</div>
      <div>
        <div class="poster-badges">
          <span class="poster-badge">${esc(primary.typeCode)}</span>
          <span class="poster-badge">${esc(mbtiGuess)}</span>
        </div>
        <p class="poster-title">${esc(primary.name)} · ${esc(primary.title)}</p>
      </div>
    </div>
    <p class="poster-copy">"${esc(primary.oneLiner)}"</p>
  `;

  evidenceList.innerHTML = (primary.evidence || []).map(e => `<li>${e}</li>`).join("");
  sbtIHeading.textContent = `${primary.sbtI} · ${primary.sbtIFull}`;
  sbtIReasonEl.textContent = primary.sbtIReason || "";
  groupRole.textContent = primary.groupRole || "";
  todayRemark.textContent = primary.todayRemark || "";
  bestMatch.textContent = primary.bestMatch || "";
  worstMatch.textContent = primary.worstMatch || "";
  bestMatchReason.textContent = "";
  worstMatchReason.textContent = "";
  const d = primary.detail || {};
  traitSignature.textContent = d.signature || "";
  traitEnergy.textContent = d.energyLevel || "";
  traitStress.textContent = d.stressBehavior || "";
  renderDeputy(characters[1] || primary);

  shareCopy.value =
    `好友分享来了一个 ${primary.name} 的结果卡。\n` +
    `你也去测测，看你会抽到谁：${shareUrl}`;

  restartTop.hidden = false;
  showScreen(screenResult);
}

function emptyScores() {
  return SCORE_KEYS.reduce((scores, key) => {
    scores[key] = 0;
    return scores;
  }, {});
}

/* ===== go ===== */
init();
