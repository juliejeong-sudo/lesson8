/* =========================================================
   Lesson 8. What time do you get up?
   ========================================================= */

// en: 카드에 보이는 표현 / you: 질문(What time do you ~?)에 쓰는 형태
const BASIC = [
  { en: "get up",       ko: "일어나다",     emoji: "⏰" },
  { en: "go to school", ko: "학교에 가다",  emoji: "🏫" },
  { en: "have lunch",   ko: "점심을 먹다",  emoji: "🍱" },
  { en: "go home",      ko: "집에 가다",    emoji: "🏠" },
  { en: "do homework",  ko: "숙제하다",     emoji: "📝" },
  { en: "go to bed",    ko: "잠자리에 들다", emoji: "🛏️" },
];

const EXTRA = [
  { en: "brush my teeth",       you: "brush your teeth",       ko: "이를 닦다",      emoji: "🪥" },
  { en: "wash my face",         you: "wash your face",         ko: "세수하다",       emoji: "🧼" },
  { en: "get dressed",          ko: "옷을 입다",               emoji: "👕" },
  { en: "have breakfast",       ko: "아침을 먹다",             emoji: "🍳" },
  { en: "take a shower",        ko: "샤워하다",                emoji: "🚿" },
  { en: "play with my friends", you: "play with your friends", ko: "친구들과 놀다",  emoji: "⚽" },
  { en: "go to an academy",     ko: "학원에 가다",             emoji: "🎒" },
  { en: "have dinner",          ko: "저녁을 먹다",             emoji: "🍽️" },
  { en: "watch TV",             ko: "TV를 보다",               emoji: "📺" },
  { en: "read a book",          ko: "책을 읽다",               emoji: "📖" },
];

BASIC.forEach((e) => (e.level = "basic"));
EXTRA.forEach((e) => (e.level = "extra"));
const ALL = [...BASIC, ...EXTRA];

const NUM_WORDS = ["", "one", "two", "three", "four", "five", "six",
  "seven", "eight", "nine", "ten", "eleven", "twelve"];

/* =========================================================
   Speech (Web Speech API, 미국 영어 음성만 사용)
   ========================================================= */
const Speech = (() => {
  const synth = window.speechSynthesis;
  let voice = null;
  let activeBtn = null;
  const statusEl = document.getElementById("voiceStatus");

  // 자연스러운 미국 영어 음성일수록 높은 점수
  const PREFERRED = [
    [/natural/i, 60],
    [/google us english/i, 55],
    [/\b(aria|jenny|ava|emma|michelle|guy|andrew|brian|christopher|eric|steffan)\b/i, 40],
    [/\b(samantha|allison|susan|alex|nicky|evan|joelle|noelle|zoe)\b/i, 35],
    [/online/i, 20],
    [/enhanced|premium|neural/i, 20],
    [/\b(zira|david|mark)\b/i, 10],
  ];

  const normLang = (l) => (l || "").replace("_", "-").toLowerCase();

  function score(v) {
    let s = 0;
    for (const [re, pts] of PREFERRED) if (re.test(v.name)) s += pts;
    return s;
  }

  function pickVoice() {
    if (!synth) return;
    const voices = synth.getVoices();
    if (!voices.length) return;
    let candidates = voices.filter((v) => normLang(v.lang) === "en-us");
    if (!candidates.length) {
      // en-US가 없으면 다른 영어 음성(en-*)이라도 사용 — 한국어 음성은 절대 사용하지 않음
      candidates = voices.filter((v) => normLang(v.lang).startsWith("en"));
    }
    candidates.sort((a, b) => score(b) - score(a));
    voice = candidates[0] || null;
    updateStatus();
  }

  function updateStatus() {
    if (!synth) {
      statusEl.textContent = "⚠️ 이 브라우저는 음성 기능을 지원하지 않아요 (Chrome/Edge 권장)";
      return;
    }
    if (voice) {
      const us = normLang(voice.lang) === "en-us";
      statusEl.textContent = `🔊 ${us ? "미국 영어" : "영어"} 음성: ${voice.name.replace(/^Microsoft\s+/i, "").replace(/\s*-\s*English.*$/i, "")}`;
    } else if (gaveUp) {
      statusEl.textContent = synth.getVoices().length
        ? "⚠️ 영어 음성이 설치되어 있지 않아요. Windows 설정 > 시간 및 언어 > 음성에서 '영어(미국)'을 추가해 주세요."
        : "⚠️ 음성 목록을 불러오지 못했어요. Chrome 또는 Edge 브라우저에서 열어 주세요.";
    } else {
      statusEl.textContent = "🔈 영어 음성 준비 중…";
    }
  }
  let gaveUp = false;

  function init() {
    if (!synth) return updateStatus();
    pickVoice();
    // 음성 목록이 늦게 로드되는 브라우저 대응
    if ("onvoiceschanged" in synth) synth.addEventListener("voiceschanged", pickVoice);
    let tries = 0;
    const timer = setInterval(() => {
      tries++;
      if (voice || tries > 20) {
        clearInterval(timer);
        if (!voice) { gaveUp = true; updateStatus(); }
        return;
      }
      pickVoice();
    }, 250);
    updateStatus();
  }

  function clearBtn() {
    if (activeBtn) activeBtn.classList.remove("playing");
    activeBtn = null;
  }

  // texts: 영어 문장 배열 (순서대로 읽음). 한국어는 절대 전달하지 않음.
  function speak(texts, btn, quiet) {
    if (!synth) {
      if (quiet) return;
      alert("이 브라우저는 음성 기능을 지원하지 않아요. Chrome 또는 Edge에서 열어 주세요.");
      return;
    }
    if (!voice) pickVoice();
    // 음성 목록은 있는데 영어 음성이 없으면 한국어 음성으로 읽힐 수 있으므로 읽지 않음
    if (!voice && synth.getVoices().length) {
      if (quiet) return;
      alert("이 기기에 영어 음성이 없어요.\nWindows 설정 > 시간 및 언어 > 음성에서 '영어(미국)' 음성을 추가하거나 Chrome/Edge에서 열어 주세요.");
      return;
    }
    synth.cancel();
    clearBtn();
    const list = Array.isArray(texts) ? texts : [texts];
    if (btn) { activeBtn = btn; btn.classList.add("playing"); }
    list.forEach((text, i) => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US";
      if (voice) u.voice = voice;
      u.rate = 0.85;
      u.pitch = 1;
      if (i === list.length - 1) {
        u.onend = clearBtn;
        u.onerror = clearBtn;
      }
      synth.speak(u);
    });
    // 일부 브라우저에서 onend가 오지 않는 경우 대비
    setTimeout(() => { if (activeBtn === btn && !synth.speaking) clearBtn(); }, 8000);
  }

  return { init, speak };
})();

function speakButton(getText, label) {
  const b = document.createElement("button");
  b.className = "speak-btn";
  b.type = "button";
  b.textContent = "🔊";
  b.setAttribute("aria-label", label || "영어 발음 듣기");
  b.addEventListener("click", (ev) => {
    ev.stopPropagation();
    Speech.speak(getText(), b);
  });
  return b;
}

/* =========================================================
   Tabs
   ========================================================= */
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t === tab));
    document.querySelectorAll(".panel").forEach((p) =>
      p.classList.toggle("active", p.id === "panel-" + tab.dataset.tab));
    window.speechSynthesis && window.speechSynthesis.cancel();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});

/* =========================================================
   1·2. Cards
   ========================================================= */
function renderCards(list, gridId) {
  const grid = document.getElementById(gridId);
  list.forEach((item, i) => {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <div class="card-top">
        <span class="card-emoji" aria-hidden="true">${item.emoji}</span>
        <span class="card-num">${String(i + 1).padStart(2, "0")}</span>
      </div>
      <div class="card-en-row"><span class="card-en" lang="en">${item.en}</span></div>
      <div class="card-ko"><span>${item.ko}</span></div>`;
    card.querySelector(".card-en-row").appendChild(
      speakButton(() => item.en, `${item.en} 발음 듣기`));
    const ko = card.querySelector(".card-ko");
    ko.addEventListener("click", () => ko.classList.toggle("revealed"));
    grid.appendChild(card);
  });
}
renderCards(BASIC, "basicGrid");
renderCards(EXTRA, "extraGrid");

document.getElementById("hideMeaning").addEventListener("change", (e) => {
  document.body.classList.toggle("hide-ko", e.target.checked);
  document.querySelectorAll(".card-ko.revealed").forEach((el) => el.classList.remove("revealed"));
});

/* =========================================================
   4. 나의 하루 말하기
   ========================================================= */
const day = { item: BASIC[0], hour: 7, min: 0 };

function timeWords(h, m) {
  return m === 0 ? `${NUM_WORDS[h]} o'clock` : `${NUM_WORDS[h]} thirty`;
}
function timeKo(h, m) {
  return m === 0 ? `${h}시` : `${h}시 30분`;
}
const youForm = (item) => item.you || item.en;
const questionOf = (item) => `What time do you ${youForm(item)}?`;
const answerOf = (item, h, m) => `I ${item.en} at ${timeWords(h, m)}.`;

function renderChips(list, rowId) {
  const row = document.getElementById(rowId);
  list.forEach((item) => {
    const c = document.createElement("button");
    c.type = "button";
    c.className = `chip ${item.level}`;
    c.textContent = `${item.emoji} ${item.en}`;
    c.lang = "en";
    c.addEventListener("click", () => { day.item = item; updateDay(); });
    item.chip = c;
    row.appendChild(c);
  });
}
renderChips(BASIC, "chipBasic");
renderChips(EXTRA, "chipExtra");

const hourGrid = document.getElementById("hourGrid");
for (let h = 1; h <= 12; h++) {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "hour-btn";
  b.textContent = h;
  b.dataset.hour = h;
  b.addEventListener("click", () => { day.hour = h; updateDay(); });
  hourGrid.appendChild(b);
}
const minuteRow = document.getElementById("minuteRow");
[[0, ":00", "o'clock (정각)"], [30, ":30", "thirty (30분)"]].forEach(([m, label, sub]) => {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "min-btn";
  b.dataset.min = m;
  b.innerHTML = `${label}<small>${sub}</small>`;
  b.addEventListener("click", () => { day.min = m; updateDay(); });
  minuteRow.appendChild(b);
});

const qEl = document.getElementById("questionText");
const aEl = document.getElementById("answerText");

function updateDay() {
  const { item, hour, min } = day;
  ALL.forEach((it) => it.chip.classList.toggle("selected", it === item));
  hourGrid.querySelectorAll(".hour-btn").forEach((b) =>
    b.classList.toggle("selected", +b.dataset.hour === hour));
  minuteRow.querySelectorAll(".min-btn").forEach((b) =>
    b.classList.toggle("selected", +b.dataset.min === min));
  document.getElementById("clockDisplay").textContent = `${hour}:${min === 0 ? "00" : "30"}`;

  qEl.innerHTML = `What time do you <span class="hl">${youForm(item)}</span>?`;
  aEl.innerHTML = `I <span class="hl">${item.en}</span> at <span class="hl">${timeWords(hour, min)}</span>.`;
  document.getElementById("koreanHint").textContent =
    `💡 ${item.en} = ${item.ko} · ${timeKo(hour, min)} = ${timeWords(hour, min)}`;
}

document.getElementById("speakQ").addEventListener("click", (e) =>
  Speech.speak(questionOf(day.item), e.currentTarget));
document.getElementById("speakA").addEventListener("click", (e) =>
  Speech.speak(answerOf(day.item, day.hour, day.min), e.currentTarget));
document.getElementById("speakBoth").addEventListener("click", (e) =>
  Speech.speak([questionOf(day.item), answerOf(day.item, day.hour, day.min)], e.currentTarget));
document.getElementById("randomDay").addEventListener("click", () => {
  day.item = ALL[Math.floor(Math.random() * ALL.length)];
  day.hour = 1 + Math.floor(Math.random() * 12);
  day.min = Math.random() < 0.5 ? 0 : 30;
  updateDay();
});
updateDay();

/* =========================================================
   5. Quiz
   ========================================================= */
const quizBox = document.getElementById("quizBox");
const QUIZ_LEN = 5;
let quiz = null;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuiz() {
  // 기본 표현과 확장 표현을 반드시 섞음 (2+3 또는 3+2)
  const nBasic = Math.random() < 0.5 ? 2 : 3;
  const picked = shuffle([
    ...shuffle(BASIC).slice(0, nBasic),
    ...shuffle(EXTRA).slice(0, QUIZ_LEN - nBasic),
  ]);
  // 문제 유형: en2ko(영어 → 뜻) / ko2en(뜻 → 영어), 골고루 섞기
  const types = shuffle(["en2ko", "en2ko", "ko2en", "ko2en", Math.random() < 0.5 ? "en2ko" : "ko2en"]);
  return {
    index: 0,
    score: 0,
    results: [],
    questions: picked.map((answer, i) => ({
      answer,
      type: types[i],
      options: shuffle([answer, ...shuffle(ALL.filter((x) => x !== answer)).slice(0, 3)]),
    })),
  };
}

function dotsHtml() {
  return quiz.questions.map((_, i) => {
    let cls = "dot";
    if (i < quiz.results.length) cls += quiz.results[i] ? " ok" : " no";
    else if (i === quiz.index) cls += " current";
    return `<span class="${cls}"></span>`;
  }).join("");
}

function renderQuestion() {
  const q = quiz.questions[quiz.index];
  const en2ko = q.type === "en2ko";
  quizBox.innerHTML = `
    <div class="quiz-progress">
      <span class="quiz-count">문제 ${quiz.index + 1} / ${QUIZ_LEN}</span>
      <div class="dots">${dotsHtml()}</div>
    </div>
    <span class="quiz-type ${q.answer.level}">${q.answer.level === "basic" ? "기본 표현" : "확장 표현"}</span>
    <p class="quiz-prompt">${en2ko ? "다음 영어 표현의 뜻은 무엇일까요?" : "다음 뜻에 맞는 영어 표현을 고르세요."}</p>
    <div class="quiz-q">
      <p class="quiz-word ${en2ko ? "" : "ko"}" ${en2ko ? 'lang="en"' : ""}>${en2ko ? q.answer.en : q.answer.ko}</p>
    </div>
    <div class="options"></div>
    <div class="feedback" role="status"></div>
    <div class="quiz-next"></div>`;

  if (en2ko) {
    quizBox.querySelector(".quiz-q").appendChild(
      speakButton(() => q.answer.en, "문제 영어 듣기"));
  }

  const optWrap = quizBox.querySelector(".options");
  q.options.forEach((opt, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "option" + (en2ko ? " ko" : "");
    b.innerHTML = `<span class="opt-key">${"ABCD"[i]}</span><span>${en2ko ? opt.ko : opt.en}</span>`;
    if (!en2ko) b.lang = "en";
    b.addEventListener("click", () => choose(opt, b));
    opt._btn = b;
    optWrap.appendChild(b);
  });
}

function choose(opt, btn) {
  const q = quiz.questions[quiz.index];
  const correct = opt === q.answer;
  quiz.results.push(correct);
  if (correct) quiz.score++;

  quizBox.querySelectorAll(".option").forEach((b) => (b.disabled = true));
  q.options.forEach((o) => {
    if (o === q.answer) o._btn.classList.add("correct");
    else if (o === opt) o._btn.classList.add("wrong");
    else o._btn.classList.add("dim");
  });

  const fb = quizBox.querySelector(".feedback");
  fb.classList.add("show", correct ? "ok" : "no");
  fb.innerHTML = correct
    ? `⭕ 정답이에요! <span class="en">${q.answer.en}</span> = ${q.answer.ko}`
    : `❌ 아쉬워요. 정답은 <span class="en">${q.answer.en}</span> (${q.answer.ko}) 이에요.`;

  quizBox.querySelector(".dots").innerHTML = dotsHtml();

  const last = quiz.index === QUIZ_LEN - 1;
  const next = document.createElement("button");
  next.type = "button";
  next.className = "btn btn-primary";
  next.textContent = last ? "결과 보기 🏁" : "다음 문제 →";
  next.addEventListener("click", () => {
    if (last) renderResult();
    else { quiz.index++; renderQuestion(); }
  });
  quizBox.querySelector(".quiz-next").appendChild(next);
  next.focus({ preventScroll: true });
}

function renderResult() {
  const s = quiz.score;
  const [emoji, msg] =
    s === 5 ? ["🏆", "Excellent!"] :
    s === 4 ? ["🌟", "Great job!"] :
    s === 3 ? ["👍", "Good job!"] :
              ["💪", "Let's practice again!"];

  quizBox.innerHTML = `
    <div class="result">
      <div class="result-emoji">${emoji}</div>
      <p class="result-score">${s}<small> / ${QUIZ_LEN}</small></p>
      <p class="result-msg" lang="en">${msg}</p>
      <ul class="review">
        ${quiz.questions.map((q, i) => `
          <li><span class="mark">${quiz.results[i] ? "⭕" : "❌"}</span>
              <span class="en">${q.answer.en}</span>
              <span class="ko">${q.answer.ko}</span></li>`).join("")}
      </ul>
      <button type="button" class="btn btn-primary" id="retryQuiz">🔄 다시 풀기</button>
    </div>`;
  document.getElementById("retryQuiz").addEventListener("click", startQuiz);
  Speech.speak(msg, null, true);
}

function startQuiz() {
  quiz = buildQuiz();
  renderQuestion();
}
startQuiz();

Speech.init();
