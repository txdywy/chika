#!/usr/bin/env node
/**
 * Generate 22 static character detail pages for SEO.
 * Each page is a self-contained HTML file with all character data
 * visible in the HTML (not JS-rendered) so search engines can index it.
 */

const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://chika.hackx64.eu.org';
const CHAR_DIR = path.join(__dirname, 'characters');
const SHARE_DIR = path.join(__dirname, 'share');
const BUILD_DATE = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

// --- read data ---
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'quiz-characters.json'), 'utf-8'));
const characters = data.characters;

// --- helpers ---
function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function imgPath(code) {
  const map = {
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
  return map[code] || '';
}

const baiduScript = `
  <script>
    var _hmt = _hmt || [];
    (function() {
      var hm = document.createElement("script");
      hm.src = "https://hm.baidu.com/hm.js?e4927ea587a9254102d99bda8c375608";
      var s = document.getElementsByTagName("script")[0];
      s.parentNode.insertBefore(hm, s);
    })();
  </script>`;

const gaScript = `
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-DY71VXW75G"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-DY71VXW75G');
  </script>`;

function charPage(c, idx) {
  const d = c.detail || {};
  const img = imgPath(c.code);
  const charUrl = `${SITE_URL}/characters/${c.code}/`;
  const coverUrl = `${SITE_URL}/og-cover.png`;
  const shareImageUrl = `${SITE_URL}/social/${c.code}.jpg`;
  const typeCode = c.typeCode || c.sbtI;

  // SEO description: hand-crafted short summary, complete sentence, no truncation
  const shortDescriptions = {
    CHII: '吉伊卡哇（INFP / CRYF）：敏感胆小但善良努力，是最让人心疼的 Chiikawa 角色。查看完整性格分析、名场面和角色搭配。',
    HACH: '小八（ESFJ / HUGS）：外向热心善于表达，是 Chiikawa 世界里最会说人话的角色。查看完整性格分析、名场面和角色搭配。',
    USAG: '兔兔（ENTP / WILD）：疯狂自由不按套路出牌，是 Chiikawa 世界的混沌引擎。查看完整性格分析、名场面和角色搭配。',
    MOMO: '飞鼠（ESTP / GRAB）：自恋爱出风头但本质不坏的行动派。查看完整性格分析、名场面和角色搭配。',
    KURI: '栗子馒头（ISTP / LAZY）：佛系松弛有分寸的大人，最接近「活明白了」的角色。查看完整性格分析、名场面和角色搭配。',
    RAKK: '海獭（ENFP / HYPE）：活泼自信的社交恐怖分子，一出现就能热场的气氛担当。查看完整性格分析、名场面和角色搭配。',
    SHIS: '狮萨（ISFJ / WARM）：温柔细心默默付出，是不声不响但谁都离不开的存在。查看完整性格分析、名场面和角色搭配。',
    FURU: '古本（INFJ / DEEP）：安静深沉理想主义，内心有一个完整宇宙的神秘角色。查看完整性格分析、名场面和角色搭配。',
    LABO: '劳动铠甲人（ISTJ / PROC）：严谨务实守规矩的执行力担当，出了问题第一个被想到。查看完整性格分析、名场面和角色搭配。',
    POCH: '口袋铠甲人（ISFP / CHIL）：安静随性有品味，铠甲人世界里最有生活美学的角色。查看完整性格分析、名场面和角色搭配。',
    RAMN: '拉面铠甲人（ESTJ / BOSS）：管理型讲规则有底线，是铠甲人世界里开店的那一位。查看完整性格分析、名场面和角色搭配。',
    YATA: '摊贩铠甲人（ESFP / CASH）：接地气社交能力强，边忙边聊人情味拉满的烟火角色。查看完整性格分析、名场面和角色搭配。',
    ANOK: '那个孩子（ESFP / FAKE）：外表可爱但行为不可预测，看起来无害但实际很会整活。查看完整性格分析、名场面和角色搭配。',
    DEKA: '大强（INTJ / GIGA）：体型巨大实力强劲且有策略有想法的巨脑强者。查看完整性格分析、名场面和角色搭配。',
    ODEE: '欧德（ENFP / WACK）：大块头配怪脑回路，创意拉满逻辑随缘的搞笑角色。查看完整性格分析、名场面和角色搭配。',
    GOBL: '哥布林（ESTP / SCAM）：烦人捣蛋制造混乱，是会让血压升高的标准麻烦角色。查看完整性格分析、名场面和角色搭配。',
    BLAC: '黑星（INTP / WISH）：冷幽默荒诞大师，偏要往另一个方向实现的阴间角色。查看完整性格分析、名场面和角色搭配。',
    SHOO: '流星（ENTJ / LORD）：稀有发光体强势登场，平时看不到一出现就自带 BGM。查看完整性格分析、名场面和角色搭配。',
    MAJO: '山姥（INTJ / HEXA）：邪门冷静的偏门方案大师，你想不到的她都想到了。查看完整性格分析、名场面和角色搭配。',
    KABU: '吉伊卡菇（ISFP / FLIP）：吉伊卡哇加蘑菇的变异体，先萌后吓切面反转。查看完整性格分析、名场面和角色搭配。',
    MUCH: '营业超人（ENFJ / SHOW）：专业营业人格，表情管理和对外呈现永远满分。查看完整性格分析、名场面和角色搭配。',
    PAJA: '睡衣派对组（ENFP / PART）：团体型角色，一个人不行一群人很行的群嗨整活派。查看完整性格分析、名场面和角色搭配。'
  };
  const description = shortDescriptions[c.code] || `${c.name}：${c.sbtIFull}（${c.sbtI}）。${d.personality || ''}`;

  // Build name-to-code lookup for internal match links
  const nameToCode = {};
  for (const ch of characters) { nameToCode[ch.name] = ch.code; }
  function matchLink(name) {
    const code = nameToCode[name];
    return code
      ? `<a href="/characters/${code}/" style="color:var(--accent-dark);text-decoration:underline;text-underline-offset:2px">${esc(name)}</a>`
      : esc(name);
  }

  const achievements = (d.achievements || []).map(a => `<li>${esc(a)}</li>`).join('\n        ');
  const evidence = (c.evidence || []).map(e => `<li>${esc(e)}</li>`).join('\n        ');

  // BreadcrumbList JSON-LD
  const breadcrumbJson = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "CHTI", "item": SITE_URL },
      { "@type": "ListItem", "position": 2, "name": "角色列表", "item": `${SITE_URL}/characters/` },
      { "@type": "ListItem", "position": 3, "name": c.name, "item": charUrl }
    ]
  });

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>${esc(c.name)} MBTI 是什么 | ${esc(c.name)}性格分析 | ${esc(typeCode)} ${c.mbti} | CHTI</title>
  <meta name="description" content="${esc(description)}">
  <meta property="og:title" content="${esc(c.name)} MBTI 是什么 | ${esc(c.name)}性格分析">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:type" content="website">
  <meta property="og:image" content="${shareImageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${esc(c.name)} 角色图">
  <meta property="og:url" content="${charUrl}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(c.name)} MBTI 是什么 | ${esc(c.name)}性格分析">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${shareImageUrl}">
  <link rel="canonical" href="${charUrl}">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🐹</text></svg>">
  <link rel="stylesheet" href="/styles.css">
  <meta name="robots" content="index, follow">

  <script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": `${c.name} MBTI 是什么 | ${c.name}性格分析`,
    "description": description,
    "url": charUrl,
    "image": shareImageUrl,
    "mainEntity": {
      "@type": "Thing",
      "name": c.name,
      "description": d.personality || ''
    }
  })}</script>

  <script type="application/ld+json">${breadcrumbJson}</script>
  ${baiduScript}
  ${gaScript}
</head>
<body>
  <nav class="topbar">
    <span class="brand">CHTI</span>
    <a class="ghost-btn" href="/">首页</a>
  </nav>

  <div class="app-shell">
    <section class="screen active" style="display:grid">
      <div class="detail-shell">
        <a class="detail-back" href="/">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          返回首页
        </a>

        <div class="detail-hero" style="background:linear-gradient(145deg, ${c.color || '#FFD0A0'}, #FFF2DB)">
          <div class="detail-hero-img">
            <img src="/${img}" alt="${esc(c.name)}" loading="eager"
              style="width:100%;height:100%;object-fit:contain"
              onerror="this.outerHTML='<span style=\\'font-size:36px;font-weight:800;color:#fff\\'>${esc(c.name.slice(0,2))}</span>'">
          </div>
          <div class="detail-hero-content">
            <div class="detail-hero-badges">
              <span class="detail-hero-badge">${esc(typeCode)}</span>
              <span class="detail-hero-badge">${esc(c.mbti)}</span>
              <span class="detail-hero-badge">${esc(c.sbtI)} · ${esc(c.sbtIFull)}</span>
            </div>
            <h1 class="detail-hero-name">${esc(c.name)}</h1>
            <p class="detail-hero-title">${esc(c.title)}</p>
            <p class="detail-hero-oneliner">"${esc(c.oneLiner)}"</p>
          </div>
        </div>

        <article>
          <div class="info-card detail-sbti-card">
            <h3 class="info-title">${esc(c.sbtI)} · ${esc(c.sbtIFull)}</h3>
            <p class="info-body">${esc(c.sbtIReason || '')}</p>
          </div>

          <div class="info-card">
            <h3 class="info-title">性格</h3>
            <p class="info-body">${esc(d.personality || '')}</p>
          </div>

          <div class="info-card">
            <h3 class="info-title">名场面</h3>
            <ol class="evidence-list">${achievements || '<li>暂无</li>'}
            </ol>
          </div>

          <div class="info-card detail-funny">
            <h3 class="info-title">搞笑分析</h3>
            <p class="info-body">${esc(d.funnyAnalysis || '')}</p>
          </div>

          <div class="info-dual">
            <div class="info-card">
              <h3 class="info-title">喜欢</h3>
              <p class="info-body">${esc(d.likes || '')}</p>
            </div>
            <div class="info-card">
              <h3 class="info-title">讨厌</h3>
              <p class="info-body">${esc(d.dislikes || '')}</p>
            </div>
          </div>

          <div class="info-dual">
            <div class="info-card">
              <h3 class="info-title">压力反应</h3>
              <p class="info-body">${esc(d.stressBehavior || '')}</p>
            </div>
            <div class="info-card">
              <h3 class="info-title">电量</h3>
              <p class="info-body">${esc(d.energyLevel || '')}</p>
            </div>
          </div>

          <div class="info-card">
            <h3 class="info-title">口头禅</h3>
            <p class="info-body detail-signature">${esc(d.signature || '')}</p>
          </div>

          <div class="info-dual">
            <div class="info-card">
              <h3 class="info-title">最搭</h3>
              <p class="info-body">${matchLink(c.bestMatch || '')}</p>
            </div>
            <div class="info-card">
              <h3 class="info-title">最怕遇到</h3>
              <p class="info-body">${matchLink(c.worstMatch || '')}</p>
            </div>
          </div>

          <div class="info-card">
            <h3 class="info-title">为什么像</h3>
            <ol class="evidence-list">${evidence || '<li>暂无</li>'}
            </ol>
          </div>

          <div class="info-card">
            <h3 class="info-title">角色总结</h3>
            <p class="info-body">${esc(c.summary || '')}</p>
          </div>
        </article>

        <div style="margin-top:20px;text-align:center">
          <a class="btn-primary" href="/" style="display:block;text-decoration:none;text-align:center;max-width:400px;margin:0 auto">
            开始测试，看看你像哪个角色
          </a>
        </div>

        <nav aria-label="角色导航" style="display:flex;justify-content:space-between;margin-top:16px;padding:12px 0;font-size:14px">
          ${idx > 0
            ? `<a href="/characters/${characters[idx - 1].code}/" style="color:var(--accent-dark);text-decoration:none">&larr; ${esc(characters[idx - 1].name)}</a>`
            : '<span style="color:var(--muted)"></span>'}
          <a href="/characters/" style="color:var(--muted);text-decoration:none">角色列表</a>
          ${idx < characters.length - 1
            ? `<a href="/characters/${characters[idx + 1].code}/" style="color:var(--accent-dark);text-decoration:none">${esc(characters[idx + 1].name)} &rarr;</a>`
            : '<span style="color:var(--muted)"></span>'}
        </nav>
      </div>
    </section>

    <nav aria-label="breadcrumb" style="font-size:13px;color:var(--muted);text-align:center;padding:16px 0 0">
      <a href="/">CHTI</a> ›
      <a href="/characters/">角色列表</a> ›
      <span>${esc(c.name)}</span>
    </nav>
  </div>
</body>
</html>`;
}

function sharePage(c) {
  const shareUrl = `${SITE_URL}/share/${c.code}/`;
  const shareImageUrl = `${SITE_URL}/social/${c.code}.jpg`;
  const description = `我测出来最像 ${c.name}。${c.oneLiner} 来测测你像哪个 Chiikawa 角色。`;

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>我测出来是 ${esc(c.name)} | CHTI</title>
  <meta name="description" content="${esc(description)}">
  <meta property="og:title" content="我测出来是 ${esc(c.name)} | CHTI">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:type" content="website">
  <meta property="og:image" content="${shareImageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${esc(c.name)} 分享图">
  <meta property="og:url" content="${shareUrl}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="我测出来是 ${esc(c.name)} | CHTI">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${shareImageUrl}">
  <link rel="canonical" href="${shareUrl}">
  <meta name="robots" content="noindex, nofollow">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🐹</text></svg>">
  <link rel="stylesheet" href="/styles.css">

  <script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": `我测出来是 ${c.name} | CHTI`,
    "description": description,
    "url": shareUrl,
    "image": shareImageUrl
  })}</script>
  ${baiduScript}
  ${gaScript}
</head>
<body>
  <div class="app-shell">
    <section class="screen active" style="display:grid">
      <div class="detail-shell" style="max-width:720px">
        <div class="detail-hero" style="background:linear-gradient(145deg, ${c.color || '#FFD0A0'}, #FFF2DB)">
          <div class="detail-hero-img">
            <img src="/${imgPath(c.code)}" alt="${esc(c.name)}" loading="eager" style="width:100%;height:100%;object-fit:contain">
          </div>
          <div class="detail-hero-content">
            <div class="detail-hero-badges">
              <span class="detail-hero-badge">${esc(c.typeCode || c.sbtI)}</span>
              <span class="detail-hero-badge">${esc(c.mbti)}</span>
            </div>
            <h1 class="detail-hero-name">我测出来是 ${esc(c.name)}</h1>
            <p class="detail-hero-title">${esc(c.title)}</p>
            <p class="detail-hero-oneliner">"${esc(c.oneLiner)}"</p>
          </div>
        </div>

        <div class="info-card" style="margin-top:16px">
          <h3 class="info-title">结果总结</h3>
          <p class="info-body">${esc(c.summary || '')}</p>
        </div>

        <div style="margin-top:20px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
          <a class="btn-primary" href="/" style="display:inline-block;text-decoration:none;text-align:center;min-width:220px">
            我也测测
          </a>
          <a class="btn-secondary" href="/characters/${c.code}/" style="display:inline-block;text-decoration:none;text-align:center;min-width:220px">
            查看角色详情
          </a>
        </div>
      </div>
    </section>
  </div>
</body>
</html>`;
}

function indexPage() {
  const gridItems = characters.map(c => `
    <a class="roster-item" href="/characters/${c.code}/" style="text-decoration:none;color:inherit">
      <div class="roster-avatar">
        <img src="/${imgPath(c.code)}" alt="${esc(c.name)}" loading="lazy"
          style="width:100%;height:100%;object-fit:contain"
          onerror="this.outerHTML='<span style=\\'font-size:14px;font-weight:800;color:#8B6D4E\\'>${esc(c.name.slice(0,2))}</span>'">
      </div>
      <span class="roster-name">${esc(c.name)}</span>
      <span style="font-size:10px;color:var(--muted)">${esc(c.mbti)}</span>
    </a>`).join('\n');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>Chiikawa 角色大全 | 22个角色分析与MBTI | CHTI</title>
  <meta name="description" content="CHTI 收录 22 个 Chiikawa（吉伊卡哇）角色：${characters.map(c => c.name).join('、')}。查看每个角色的性格分析、MBTI、名场面和搭配建议。">
  <meta property="og:title" content="Chiikawa 角色大全 | 22个角色分析">
  <meta property="og:description" content="收录吉伊卡哇全部 22 个角色的性格分析和 MBTI 匹配。">
  <meta property="og:type" content="website">
  <meta property="og:image" content="${SITE_URL}/og-cover.png">
  <meta property="og:url" content="${SITE_URL}/characters/">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Chiikawa 角色大全 | 22个角色分析">
  <meta name="twitter:description" content="收录吉伊卡哇全部 22 个角色的性格分析和 MBTI 匹配。">
  <meta name="twitter:image" content="${SITE_URL}/og-cover.png">
  <link rel="canonical" href="${SITE_URL}/characters/">
  <meta name="robots" content="index, follow">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🐹</text></svg>">
  <link rel="stylesheet" href="/styles.css">
  ${baiduScript}

  <script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Chiikawa 角色大全",
    "description": "22个Chiikawa角色的性格分析和MBTI匹配",
    "url": `${SITE_URL}/characters/`,
    "numberOfItems": characters.length,
    "itemListElement": characters.map((c, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": c.name,
      "url": `${SITE_URL}/characters/${c.code}/`
    }))
  })}</script>
</head>
<body>
  <nav class="topbar">
    <span class="brand">CHTI</span>
    <a class="ghost-btn" href="/">首页</a>
  </nav>

  <div class="app-shell">
    <div class="hero" style="margin-bottom:16px">
      <h1 class="section-title" style="font-size:22px">Chiikawa 角色大全</h1>
      <p class="hero-desc">收录 ${characters.length} 个 Chiikawa（吉伊卡哇）角色，点击角色查看完整的性格分析、MBTI 类型、名场面和搭配建议。</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
        <a class="btn-primary" href="/" style="display:inline-block;text-decoration:none;text-align:center;padding:12px 24px;min-height:auto;width:auto;font-size:15px">
          开始性格测试
        </a>
      </div>
    </div>

    <div class="roster" style="margin-bottom:16px">
      <h2 class="section-title">全部角色 (${characters.length})</h2>
      <div class="roster-grid" style="grid-template-columns:repeat(4,1fr);gap:10px">
        ${gridItems}
      </div>
    </div>

    <div class="info-card">
      <h3 class="info-title">Chiikawa 角色简介</h3>
      <p class="info-body" style="font-size:14px;line-height:1.7;color:var(--muted)">
        Chiikawa（ちいかわ，吉伊卡哇）是日本漫画家ナガノ创作的漫画作品及其衍生动画的角色系列。CHTI 收录了包括主角团吉伊卡哇、小八、兔兔、飞鼠等在内的 ${characters.length} 个主要角色，每个角色都有独特的性格特征和 MBTI 类型。通过 CHTI 的 28 道题测试，你可以看到自己在 MBTI 四维偏好和角色风格上最接近哪个角色。
      </p>
    </div>
  </div>
</body>
</html>`;
}

// --- generate ---
if (fs.existsSync(CHAR_DIR)) {
  fs.rmSync(CHAR_DIR, { recursive: true });
}
fs.mkdirSync(CHAR_DIR, { recursive: true });

if (fs.existsSync(SHARE_DIR)) {
  fs.rmSync(SHARE_DIR, { recursive: true });
}
fs.mkdirSync(SHARE_DIR, { recursive: true });

for (const c of characters) {
  const dir = path.join(CHAR_DIR, c.code);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), charPage(c, characters.indexOf(c)), 'utf-8');
  console.log(`  ✓ ${c.code} — ${c.name}`);

  const shareDir = path.join(SHARE_DIR, c.code);
  fs.mkdirSync(shareDir, { recursive: true });
  fs.writeFileSync(path.join(shareDir, 'index.html'), sharePage(c), 'utf-8');
  console.log(`  ✓ share/${c.code} — ${c.name}`);
}

fs.writeFileSync(path.join(CHAR_DIR, 'index.html'), indexPage(), 'utf-8');
console.log('  ✓ index — 角色列表页');

// update sitemap with dynamic lastmod
const sitemapChars = characters.map(c =>
  `  <url>\n    <loc>${SITE_URL}/characters/${c.code}/</loc>\n    <lastmod>${BUILD_DATE}</lastmod>\n    <priority>0.8</priority>\n  </url>`
).join('\n');

const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${BUILD_DATE}</lastmod>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${SITE_URL}/characters/</loc>
    <lastmod>${BUILD_DATE}</lastmod>
    <priority>0.9</priority>
  </url>
${sitemapChars}
</urlset>
`;

fs.writeFileSync(path.join(__dirname, 'sitemap.xml'), sitemapContent, 'utf-8');
console.log('  ✓ sitemap.xml 已更新（构建日期: ' + BUILD_DATE + '）');

console.log(`\n✅ 已生成 22 个角色页 + 1 个列表页 + 22 个分享页，共 45 个文件`);
console.log(`   输出目录: ${CHAR_DIR}, ${SHARE_DIR}`);
