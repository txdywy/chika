#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const QUESTIONS_PATH = path.join(ROOT, 'quiz-questions.json');
const CHARACTERS_PATH = path.join(ROOT, 'quiz-characters.json');

const AXES = ['ei', 'sn', 'tf', 'jp'];
const STYLES = ['warmth', 'weirdness', 'showmanship', 'discipline', 'edge', 'softness'];

const questions = [
  {
    id: 1,
    axis: 'ei',
    title: '第一次参加一个谁都不熟的小型活动，你通常会怎么进入状态？',
    answers: [
      { text: '我会主动找人聊天，边聊边认识场子。', scores: { ei: 2, showmanship: 1 } },
      { text: '先听一会儿，找到顺眼的人再加入。', scores: { ei: 1, warmth: 1 } },
      { text: '等别人来找我，自己先熟悉一下环境。', scores: { ei: -1, softness: 1 } },
      { text: '我更想先待在一边，等彻底适应后再说。', scores: { ei: -2 } }
    ]
  },
  {
    id: 2,
    axis: 'ei',
    title: '忙完一整天之后，你恢复精力最需要什么？',
    answers: [
      { text: '找朋友见一面，聊一聊当天发生的事。', scores: { ei: 2, warmth: 1 } },
      { text: '和熟人随便待着，有人气就行。', scores: { ei: 1, showmanship: 1 } },
      { text: '回到自己的节奏里，安静做点喜欢的小事。', scores: { ei: -1, softness: 1 } },
      { text: '完全独处，不想被任何人继续打扰。', scores: { ei: -2 } }
    ]
  },
  {
    id: 3,
    axis: 'ei',
    title: '小组讨论突然冷场时，你更自然的反应是？',
    answers: [
      { text: '我会先抛一个话题，把气氛拉回来。', scores: { ei: 2, showmanship: 1 } },
      { text: '我会顺着前面的人补一句，让讨论继续。', scores: { ei: 1, warmth: 1 } },
      { text: '如果没人点我，我会先继续听。', scores: { ei: -1, discipline: 1 } },
      { text: '我宁愿在心里想清楚，也不想为了填空而说。', scores: { ei: -2, softness: 1 } }
    ]
  },
  {
    id: 4,
    axis: 'ei',
    title: '在朋友的聚会照片里，你通常更像哪一种？',
    answers: [
      { text: '经常在中间，顺手还会组织大家拍照。', scores: { ei: 2, showmanship: 1 } },
      { text: '会参与，也愿意配合大家热闹一下。', scores: { ei: 1, showmanship: 1 } },
      { text: '人在现场，但更像安静陪伴的背景板。', scores: { ei: -1, softness: 1 } },
      { text: '可能根本没出现在照片里。', scores: { ei: -2 } }
    ]
  },
  {
    id: 5,
    axis: 'ei',
    title: '开会前还有十分钟，你一般会怎么用？',
    answers: [
      { text: '先和在场的人聊起来，顺便摸清大家状态。', scores: { ei: 2, warmth: 1 } },
      { text: '看有没有人需要我配合，简单交流一下。', scores: { ei: 1, showmanship: 1 } },
      { text: '自己过一遍要说的内容，不太想被打断。', scores: { ei: -1 } },
      { text: '安静坐着整理思路，最好谁都别来找我。', scores: { ei: -2 } }
    ]
  },
  {
    id: 6,
    axis: 'ei',
    title: '别人评价你“存在感很强/很弱”时，你更可能是哪一边？',
    answers: [
      { text: '大多时候存在感是我主动带出来的。', scores: { ei: 2, showmanship: 1 } },
      { text: '熟了以后我会明显活起来。', scores: { ei: 1, warmth: 1 } },
      { text: '我不介意存在感低一点，省得被过度关注。', scores: { ei: -1, softness: 1 } },
      { text: '我本来就不太需要被看见。', scores: { ei: -2 } }
    ]
  },
  {
    id: 7,
    axis: 'sn',
    title: '接到一个全新任务时，你通常先抓什么？',
    answers: [
      { text: '先看它背后的方向和可能性。', scores: { sn: 2, weirdness: 1 } },
      { text: '先看它和别的事情怎么连起来。', scores: { sn: 1, weirdness: 1 } },
      { text: '先确认现有资料、规则和已知信息。', scores: { sn: -1, discipline: 1 } },
      { text: '先把具体步骤和边界条件摸清楚。', scores: { sn: -2, discipline: 1 } }
    ]
  },
  {
    id: 8,
    axis: 'sn',
    title: '朋友讲一件经历时，你更容易被什么吸引？',
    answers: [
      { text: '这件事背后代表了什么、更深层的意味。', scores: { sn: 2, weirdness: 1 } },
      { text: '它暴露出的模式和隐藏线索。', scores: { sn: 1, edge: 1 } },
      { text: '具体发生了什么、顺序是怎样的。', scores: { sn: -1, discipline: 1 } },
      { text: '现场细节够不够真实、信息有没有落地。', scores: { sn: -2 } }
    ]
  },
  {
    id: 9,
    axis: 'sn',
    title: '逛一家有点特别的小店时，你通常最先注意什么？',
    answers: [
      { text: '它整体的概念、氛围和风格设定。', scores: { sn: 2, weirdness: 1 } },
      { text: '它和常见做法不一样的地方。', scores: { sn: 1, showmanship: 1 } },
      { text: '价格、材质、使用感这些实际信息。', scores: { sn: -1, discipline: 1 } },
      { text: '动线顺不顺、摆放是否合理。', scores: { sn: -2, discipline: 1 } }
    ]
  },
  {
    id: 10,
    axis: 'sn',
    title: '学一个新技能时，你更喜欢哪种开始方式？',
    answers: [
      { text: '先理解原理和整体框架，再慢慢试。', scores: { sn: 2, weirdness: 1 } },
      { text: '先知道这个技能以后还能玩出什么花样。', scores: { sn: 1, showmanship: 1 } },
      { text: '先照着成熟步骤做一遍，建立手感。', scores: { sn: -1, discipline: 1 } },
      { text: '先掌握基本动作和标准操作。', scores: { sn: -2 } }
    ]
  },
  {
    id: 11,
    axis: 'sn',
    title: '做旅行计划时，你更容易先想什么？',
    answers: [
      { text: '这趟旅行想获得什么感觉和记忆。', scores: { sn: 2, softness: 1 } },
      { text: '有没有一些意外路线值得试试看。', scores: { sn: 1, weirdness: 1 } },
      { text: '交通、时间、预算、住宿怎么排。', scores: { sn: -1, discipline: 1 } },
      { text: '每个地点具体能做什么、风险在哪里。', scores: { sn: -2, edge: 1 } }
    ]
  },
  {
    id: 12,
    axis: 'sn',
    title: '看到一个看起来怪怪的想法，你第一反应更像？',
    answers: [
      { text: '它也许能通向一个更大的东西。', scores: { sn: 2, weirdness: 1 } },
      { text: '先留着，说不定以后能用上。', scores: { sn: 1, weirdness: 1 } },
      { text: '先问它具体怎么落地。', scores: { sn: -1, discipline: 1 } },
      { text: '没有可执行细节之前，我不会太买账。', scores: { sn: -2, edge: 1 } }
    ]
  },
  {
    id: 13,
    axis: 'tf',
    title: '朋友来找你倾诉时，你更自然的起手式是？',
    answers: [
      { text: '先接住情绪，让对方知道自己没被丢下。', scores: { tf: -2, warmth: 1 } },
      { text: '先确认对方最难受的是哪一部分。', scores: { tf: -1, softness: 1 } },
      { text: '先帮对方把问题拆开，看卡点在哪。', scores: { tf: 1, discipline: 1 } },
      { text: '先判断什么做法最有效，不绕弯子。', scores: { tf: 2, edge: 1 } }
    ]
  },
  {
    id: 14,
    axis: 'tf',
    title: '团队里出现分歧时，你更看重什么？',
    answers: [
      { text: '别让关系先坏掉，事情才能继续做。', scores: { tf: -2, warmth: 1 } },
      { text: '让每个人都觉得被听到了。', scores: { tf: -1, softness: 1 } },
      { text: '把标准说清楚，按标准判断。', scores: { tf: 1, discipline: 1 } },
      { text: '谁的方案更站得住脚就用谁的。', scores: { tf: 2, edge: 1 } }
    ]
  },
  {
    id: 15,
    axis: 'tf',
    title: '别人做错事时，你更可能怎么回应？',
    answers: [
      { text: '先顾对方感受，再找机会慢慢说。', scores: { tf: -2, warmth: 1 } },
      { text: '会提醒，但会尽量留给对方面子。', scores: { tf: -1, warmth: 1 } },
      { text: '直接说明问题和后果，避免下次再犯。', scores: { tf: 1, discipline: 1 } },
      { text: '我会优先把影响控制住，话会比较直。', scores: { tf: 2, edge: 1 } }
    ]
  },
  {
    id: 16,
    axis: 'tf',
    title: '评价一个方案时，你默认先看哪一项？',
    answers: [
      { text: '它会不会让相关的人更舒服、更安心。', scores: { tf: -2, warmth: 1 } },
      { text: '它是不是符合我认同的价值和氛围。', scores: { tf: -1, softness: 1 } },
      { text: '它的逻辑和执行链条是否成立。', scores: { tf: 1, discipline: 1 } },
      { text: '它能不能稳定地产生结果。', scores: { tf: 2, edge: 1 } }
    ]
  },
  {
    id: 17,
    axis: 'tf',
    title: '吵架之后，你最难放下的通常是什么？',
    answers: [
      { text: '对方那句真正伤人的话。', scores: { tf: -2, softness: 1 } },
      { text: '这段关系是不是因此被改变了。', scores: { tf: -1, warmth: 1 } },
      { text: '有些关键问题始终没说清楚。', scores: { tf: 1, discipline: 1 } },
      { text: '明明有更有效的处理方式却没人用。', scores: { tf: 2, edge: 1 } }
    ]
  },
  {
    id: 18,
    axis: 'tf',
    title: '如果你需要拒绝别人帮忙的请求，你更像哪一种？',
    answers: [
      { text: '会很在意对方会不会因此难受。', scores: { tf: -2, warmth: 1 } },
      { text: '会解释自己的处境，尽量让对方理解。', scores: { tf: -1, softness: 1 } },
      { text: '我会说明边界和原因，保持清楚。', scores: { tf: 1 } },
      { text: '不能做就是不能做，模糊反而更麻烦。', scores: { tf: 2, edge: 1 } }
    ]
  },
  {
    id: 19,
    axis: 'jp',
    title: '面对一个一周后的截止时间，你更安心的状态是？',
    answers: [
      { text: '先把结构和节奏定下来，再慢慢推进。', scores: { jp: 2, discipline: 1 } },
      { text: '提前动手，给自己留修正空间。', scores: { jp: 1, discipline: 1 } },
      { text: '先放在心里，等信息更多再集中处理。', scores: { jp: -1, softness: 1 } },
      { text: '到后面灵感和效率会更高，我习惯那样做。', scores: { jp: -2, weirdness: 1 } }
    ]
  },
  {
    id: 20,
    axis: 'jp',
    title: '行程临时被打乱时，你更容易怎么反应？',
    answers: [
      { text: '先把新的安排快速重排出来。', scores: { jp: 2, discipline: 1 } },
      { text: '我会先确认边界，再决定怎么调整。', scores: { jp: 1, edge: 1 } },
      { text: '看情况顺着改，也许新版本会更有趣。', scores: { jp: -1, weirdness: 1 } },
      { text: '既然变了，就先别急着控制它。', scores: { jp: -2, softness: 1 } }
    ]
  },
  {
    id: 21,
    axis: 'jp',
    title: '买东西之前，你通常更接近哪一种？',
    answers: [
      { text: '会先列标准，按标准筛掉不合适的。', scores: { jp: 2, discipline: 1 } },
      { text: '大致比较一下，心里有一个范围。', scores: { jp: 1, edge: 1 } },
      { text: '看当时状态和现场感觉，留一点弹性。', scores: { jp: -1, showmanship: 1 } },
      { text: '常常会被临场出现的新选项带走。', scores: { jp: -2, weirdness: 1 } }
    ]
  },
  {
    id: 22,
    axis: 'jp',
    title: '你自己的工作区/书桌更像哪一种？',
    answers: [
      { text: '物品有明确位置，找东西很快。', scores: { jp: 2, discipline: 1 } },
      { text: '整体算整齐，但会保留一点个人习惯。', scores: { jp: 1, warmth: 1 } },
      { text: '看起来乱一点，但我自己知道怎么找。', scores: { jp: -1, weirdness: 1 } },
      { text: '状态会变，桌面也跟着变。', scores: { jp: -2, softness: 1 } }
    ]
  },
  {
    id: 23,
    axis: 'jp',
    title: '别人突然说“现在就决定吧”，你更可能？',
    answers: [
      { text: '如果该定了，我会直接拍板。', scores: { jp: 2, edge: 1 } },
      { text: '会先收束信息，然后尽快给出结论。', scores: { jp: 1, discipline: 1 } },
      { text: '还想再看看，过早定下来容易错过别的可能。', scores: { jp: -1, weirdness: 1 } },
      { text: '会本能地抗拒这种立刻定案的压力。', scores: { jp: -2, softness: 1 } }
    ]
  },
  {
    id: 24,
    axis: 'jp',
    title: '如果一天里突然多出两个空闲小时，你最可能怎么用？',
    answers: [
      { text: '补掉待办，顺便把后面几件事也排一排。', scores: { jp: 2, discipline: 1 } },
      { text: '先处理最重要的一件，剩下的再看。', scores: { jp: 1, edge: 1 } },
      { text: '看当下最想做什么，把时间留给状态。', scores: { jp: -1, softness: 1 } },
      { text: '临时起意去试一个原本没计划的东西。', scores: { jp: -2, weirdness: 1 } }
    ]
  },
  {
    id: 25,
    axis: 'sn',
    title: '看完一段别人分享的旅行 vlog，你最容易记住哪一类内容？',
    answers: [
      { text: '它整体传达出的气氛和故事感。', scores: { sn: 2, showmanship: 1 } },
      { text: '它让我联想到的另一种生活方式。', scores: { sn: 1, weirdness: 1 } },
      { text: '路线、预算、交通这些是否讲清楚了。', scores: { sn: -1, edge: 1 } },
      { text: '镜头里那些很具体的小细节和现场感。', scores: { sn: -2, softness: 1 } }
    ]
  },
  {
    id: 26,
    axis: 'sn',
    title: '别人丢给你一个还很粗糙的新点子时，你第一步更像？',
    answers: [
      { text: '先顺着它往外想，看看它还能长成什么样。', scores: { sn: 2, weirdness: 1 } },
      { text: '先想它如果做出来，呈现会不会很抓人。', scores: { sn: 1, showmanship: 1 } },
      { text: '先问现在手上有没有足够的信息支撑它。', scores: { sn: -1, edge: 1 } },
      { text: '先确认对方最在意的是哪部分，避免一下子把热情压没。', scores: { sn: -2, softness: 1 } }
    ]
  },
  {
    id: 27,
    axis: 'tf',
    title: '朋友做了一个公开分享，效果不理想，你更自然会怎么反馈？',
    answers: [
      { text: '先接住情绪，别让对方在众人面前更难堪。', scores: { tf: -2, softness: 1 } },
      { text: '先夸住亮点，再慢慢补建议。', scores: { tf: -1, showmanship: 1 } },
      { text: '会直接指出最影响效果的那一环。', scores: { tf: 1, edge: 1 } },
      { text: '先把结构拆开，告诉对方下次怎么更稳。', scores: { tf: 2, weirdness: 1 } }
    ]
  },
  {
    id: 28,
    axis: 'tf',
    title: '团队里有人提出一个风险很高但也很吸睛的方案，你更在意什么？',
    answers: [
      { text: '先看这会不会让参与的人背太大压力。', scores: { tf: -2, softness: 1 } },
      { text: '如果它能让大家更有感觉，我愿意先保住那个火花。', scores: { tf: -1, showmanship: 1 } },
      { text: '我会先看失败成本，别被表面效果带跑。', scores: { tf: 1, edge: 1 } },
      { text: '只要逻辑成立、执行路径清楚，冒险也可以。', scores: { tf: 2, weirdness: 1 } }
    ]
  }
];

const styleProfiles = {
  CHII: { warmth: 0.78, weirdness: 0.12, showmanship: 0.08, discipline: 0.42, edge: 0.08, softness: 0.98 },
  HACH: { warmth: 0.96, weirdness: 0.18, showmanship: 0.52, discipline: 0.62, edge: 0.10, softness: 0.58 },
  USAG: { warmth: 0.16, weirdness: 1.00, showmanship: 0.92, discipline: 0.08, edge: 0.28, softness: 0.04 },
  MOMO: { warmth: 0.28, weirdness: 0.42, showmanship: 0.98, discipline: 0.22, edge: 0.54, softness: 0.18 },
  KURI: { warmth: 0.34, weirdness: 0.22, showmanship: 0.06, discipline: 0.48, edge: 0.28, softness: 0.16 },
  RAKK: { warmth: 0.90, weirdness: 0.20, showmanship: 0.94, discipline: 0.24, edge: 0.18, softness: 0.18 },
  SHIS: { warmth: 0.98, weirdness: 0.10, showmanship: 0.10, discipline: 0.72, edge: 0.08, softness: 0.62 },
  FURU: { warmth: 0.58, weirdness: 0.58, showmanship: 0.04, discipline: 0.54, edge: 0.14, softness: 0.82 },
  LABO: { warmth: 0.26, weirdness: 0.06, showmanship: 0.06, discipline: 0.98, edge: 0.42, softness: 0.10 },
  POCH: { warmth: 0.56, weirdness: 0.30, showmanship: 0.10, discipline: 0.62, edge: 0.12, softness: 0.42 },
  RAMN: { warmth: 0.52, weirdness: 0.08, showmanship: 0.28, discipline: 0.94, edge: 0.56, softness: 0.10 },
  YATA: { warmth: 0.82, weirdness: 0.10, showmanship: 0.62, discipline: 0.48, edge: 0.12, softness: 0.26 },
  ANOK: { warmth: 0.08, weirdness: 0.94, showmanship: 0.86, discipline: 0.06, edge: 0.82, softness: 0.04 },
  DEKA: { warmth: 0.18, weirdness: 0.44, showmanship: 0.16, discipline: 0.74, edge: 0.70, softness: 0.08 },
  ODEE: { warmth: 0.28, weirdness: 0.74, showmanship: 0.44, discipline: 0.18, edge: 0.46, softness: 0.18 },
  GOBL: { warmth: 0.02, weirdness: 0.34, showmanship: 0.58, discipline: 0.04, edge: 0.98, softness: 0.02 },
  BLAC: { warmth: 0.04, weirdness: 0.88, showmanship: 0.02, discipline: 0.10, edge: 1.00, softness: 0.02 },
  SHOO: { warmth: 0.18, weirdness: 0.12, showmanship: 0.62, discipline: 0.86, edge: 0.64, softness: 0.06 },
  MAJO: { warmth: 0.08, weirdness: 0.92, showmanship: 0.08, discipline: 0.82, edge: 0.82, softness: 0.06 },
  KABU: { warmth: 0.24, weirdness: 0.76, showmanship: 0.24, discipline: 0.16, edge: 0.24, softness: 0.72 },
  MUCH: { warmth: 0.62, weirdness: 0.16, showmanship: 0.96, discipline: 0.74, edge: 0.24, softness: 0.18 },
  PAJA: { warmth: 0.58, weirdness: 0.58, showmanship: 0.64, discipline: 0.24, edge: 0.08, softness: 0.34 }
};

const profileOverrides = {
  CHII: { ei: -0.92, sn: 0.18, tf: -0.88, jp: -0.12 },
  HACH: { ei: 0.86, sn: -0.22, tf: -0.92, jp: 0.58 },
  USAG: { ei: 0.92, sn: 0.96, tf: 0.22, jp: -0.96 },
  MOMO: { ei: 0.92, sn: -0.66, tf: 0.48, jp: -0.52 },
  KURI: { ei: -0.82, sn: -0.62, tf: 0.48, jp: -0.58 },
  RAKK: { ei: 0.94, sn: 0.72, tf: -0.62, jp: -0.56 },
  SHIS: { ei: -0.72, sn: -0.62, tf: -0.92, jp: 0.64 },
  FURU: { ei: -0.92, sn: 0.86, tf: -0.72, jp: 0.52 },
  LABO: { ei: -0.38, sn: -0.78, tf: 0.72, jp: 0.96 },
  POCH: { ei: -0.72, sn: -0.48, tf: -0.46, jp: -0.34 },
  RAMN: { ei: 0.64, sn: -0.72, tf: 0.88, jp: 0.92 },
  YATA: { ei: 0.88, sn: -0.52, tf: -0.26, jp: -0.32 },
  ANOK: { ei: 0.76, sn: -0.18, tf: -0.18, jp: -0.84 },
  DEKA: { ei: -0.54, sn: 0.62, tf: 0.92, jp: 0.82 },
  ODEE: { ei: 0.66, sn: 0.88, tf: 0.10, jp: -0.88 },
  GOBL: { ei: 0.72, sn: 0.62, tf: 0.42, jp: -0.84 },
  BLAC: { ei: -0.92, sn: 0.92, tf: 0.24, jp: -0.24 },
  SHOO: { ei: 0.82, sn: 0.58, tf: 0.88, jp: 0.84 },
  MAJO: { ei: -0.76, sn: 0.96, tf: 0.74, jp: 0.66 },
  KABU: { ei: -0.62, sn: 0.36, tf: 0.12, jp: -0.46 },
  MUCH: { ei: 0.92, sn: 0.44, tf: -0.54, jp: 0.72 },
  PAJA: { ei: 0.88, sn: 0.62, tf: -0.42, jp: -0.82 }
};

function deriveProfile(mbti, code) {
  const base = {
    ei: mbti[0] === 'E' ? 0.8 : -0.8,
    sn: mbti[1] === 'N' ? 0.8 : -0.8,
    tf: mbti[2] === 'T' ? 0.8 : -0.8,
    jp: mbti[3] === 'J' ? 0.8 : -0.8
  };
  return { ...base, ...(profileOverrides[code] || {}) };
}

function roundObject(obj) {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key, Number(value.toFixed(2))])
  );
}

function rebuildQuestions() {
  const payload = {
    meta: {
      version: '3.0',
      total_questions: questions.length,
      description: 'Chiikawa MBTI 娱乐向测试题目，使用 4 条 MBTI 主维度和 6 个角色风格副维度。',
      axes_legend: {
        ei: '外向(E) <-> 内向(I)',
        sn: '直觉(N) <-> 实感(S)',
        tf: '思考(T) <-> 情感(F)',
        jp: '判断(J) <-> 知觉(P)'
      },
      styles_legend: {
        warmth: '照顾与接住他人的倾向',
        weirdness: '跳脱、脑洞和反常规风格',
        showmanship: '被看见、带气氛和舞台感',
        discipline: '秩序、收束和执行感',
        edge: '锋利、直给和攻击性',
        softness: '脆弱、敏感和低刺激偏好'
      }
    },
    questions
  };

  fs.writeFileSync(QUESTIONS_PATH, JSON.stringify(payload, null, 2) + '\n');
}

function rebuildCharacters() {
  const source = JSON.parse(fs.readFileSync(CHARACTERS_PATH, 'utf8'));
  const rebuilt = source.characters.map((character) => {
    const { traits, focusTraits, ...rest } = character;
    return {
    ...rest,
    typeCode: character.sbtI,
    profile: roundObject(deriveProfile(character.mbti, character.code)),
    styleProfile: roundObject(styleProfiles[character.code]),
    resultNotes: {
      mbtiArchetype:
        `${character.mbti} 原型会定义你的四维主轮廓，角色风格只负责微调同类型角色之间的差异。`,
      styleBias:
        `${character.name} 的角色风格重点在 ${Object.entries(styleProfiles[character.code]).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([key]) => key).join(' / ')}。`
    }
    };
  });

  const payload = {
    sbt_legend: source.sbt_legend,
    meta: {
      version: '4.0',
      description: '22 个 Chiikawa 角色画像：保留原有角色文案，并新增 MBTI 四维原型与 6 个风格副维度。',
      scoring_model: {
        primary_axes_weight: 0.70,
        style_weight: 0.30,
        tie_breaker: '风格距离更近者优先'
      }
    },
    axes_legend: {
      ei: '外向(E) <-> 内向(I)',
      sn: '直觉(N) <-> 实感(S)',
      tf: '思考(T) <-> 情感(F)',
      jp: '判断(J) <-> 知觉(P)'
    },
    styles_legend: {
      warmth: '照顾与接住他人的倾向',
      weirdness: '跳脱、脑洞和反常规风格',
      showmanship: '被看见、带气氛和舞台感',
      discipline: '秩序、收束和执行感',
      edge: '锋利、直给和攻击性',
      softness: '脆弱、敏感和低刺激偏好'
    },
    characters: rebuilt
  };

  fs.writeFileSync(CHARACTERS_PATH, JSON.stringify(payload, null, 2) + '\n');
}

rebuildQuestions();
rebuildCharacters();
