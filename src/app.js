import { places, startPoints } from "../data/places.js";

const state = {
  adventures: [],
  selected: 0,
  quick: {
    duration: 60,
    mood: "curious",
    transport: "walk",
  },
};

const controls = {
  start: document.querySelector("#start"),
  budget: document.querySelector("#budget"),
  generate: document.querySelector("#generate"),
  regenerate: document.querySelector("#regenerate"),
  copy: document.querySelector("#copy-plan"),
  print: document.querySelector("#print-plan"),
  durationButtons: [...document.querySelectorAll("[data-duration]")],
  moodButtons: [...document.querySelectorAll("[data-mood]")],
  transportButtons: [...document.querySelectorAll("[data-transport]")],
};

const views = {
  cards: document.querySelector("#cards"),
  map: document.querySelector("#route-map"),
  summaryTitle: document.querySelector("#summary-title"),
  summaryKicker: document.querySelector("#summary-kicker"),
  routeSummary: document.querySelector("#route-summary"),
  routeTitle: document.querySelector("#route-title"),
  routeTimeline: document.querySelector("#route-timeline"),
  routeLegend: document.querySelector("#route-legend"),
  missionStatus: document.querySelector("#mission-status"),
  questMasterLine: document.querySelector("#quest-master-line"),
  missionTitle: document.querySelector("#mission-title"),
  missionList: document.querySelector("#mission-list"),
  missionMeta: document.querySelector("#mission-meta"),
  nudgeBadge: document.querySelector("#nudge-badge"),
  nudgeCard: document.querySelector("#nudge-card"),
  nudgeTitle: document.querySelector("#nudge-title"),
  nudgeDetail: document.querySelector("#nudge-detail"),
  nudgeAction: document.querySelector("#nudge-action"),
  partnerTitle: document.querySelector("#partner-title"),
  partnerCopy: document.querySelector("#partner-copy"),
  partnerWhy: document.querySelector("#partner-why"),
  partnerAction: document.querySelector("#partner-action"),
  partnerFeedback: document.querySelector("#partner-feedback"),
};

function getInputs() {
  return {
    start: controls.start.value,
    duration: state.quick.duration,
    transport: state.quick.transport,
    budget: controls.budget.value,
    mood: state.quick.mood,
    mode: document.querySelector("input[name='mode']:checked").value,
    priorities: [...document.querySelectorAll(".chips input:checked")].map(
      (item) => item.value,
    ),
  };
}

function seededRandom(seed) {
  let value = seed % 2147483647;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function scorePlace(place, input, random) {
  let score = 0;
  const reasons = [];
  const distance = place.distance[input.start] ?? 30;
  const travelMinutes = travelTime(distance, input.transport);
  const total = place.duration + travelMinutes * 2;
  const fitsTime = total <= input.duration;

  if (place.modes.includes(input.transport)) {
    score += 18;
    reasons.push(`works with ${transportLabel(input.transport)}`);
  }
  if (place.moods.includes(input.mood)) {
    score += 14;
    reasons.push(`fits a ${moodLabel(input.mood)} mood`);
  }
  if (fitsTime) {
    score += 34;
    reasons.push("fits the time available");
  } else {
    score -= 55;
    reasons.push(`${total - input.duration} min over the selected time`);
  }
  if (input.budget === place.budget) {
    score += 10;
    reasons.push(`${moneyLabel(place.budget)} budget`);
  }
  if (input.budget === "premium" && place.budget !== "free") {
    score += 4;
    reasons.push("works well in premium mode");
  }

  const matchedPriorities = input.priorities.filter((tag) =>
    place.tags.includes(tag),
  );
  score += matchedPriorities.length * 8;
  if (matchedPriorities.length) {
    reasons.push(
      `matches: ${matchedPriorities.map(priorityLabel).join(", ")}`,
    );
  }

  if (input.mode === "chaos") {
    score += random() * 35;
    reasons.push("Chaos roll");
  }
  if (input.mode === "round" && place.tags.includes("nature")) {
    score += 7;
    reasons.push("well suited to a round trip");
  }
  if (input.mode === "destination" && place.budget !== "free") {
    score += 6;
    reasons.push("strong destination");
  }
  if (input.mode === "star" && distance < 30) {
    score += 8;
    reasons.push("close by");
  }

  if (place.local && input.duration > 60) {
    score -= 45;
  }

  score -= Math.max(0, total - input.duration) * 0.75;
  score -= Math.max(0, distance - 80) * 0.1;

  return {
    score: score + random() * 9,
    reasons: reasons.slice(0, 3),
  };
}

function travelTime(distance, transport) {
  const speeds = {
    walk: 4.5,
    bike: 15,
    transit: 22,
    car: 55,
    ev: 55,
  };
  return Math.max(5, Math.ceil((distance / speeds[transport]) * 60));
}

function moneyLabel(budget) {
  return {
    free: "minimal",
    medium: "comfortable",
    premium: "premium",
  }[budget];
}

function moodLabel(mood) {
  return {
    calm: "reset",
    curious: "curious",
    spark: "adventurous",
  }[mood];
}

function priorityLabel(priority) {
  return {
    food: "food",
    nature: "scenery",
    hidden: "hidden gem",
    social: "social",
    culture: "culture",
  }[priority];
}

function transportLabel(transport) {
  return {
    walk: "walking",
    bike: "cycling",
    car: "car",
    ev: "EV",
    transit: "public transit",
  }[transport];
}

function generateAdventures() {
  const input = getInputs();
  const seed = Date.now() % 99991;
  const random = seededRandom(seed);
  const ranked = places
    .map((place) => {
      const result = scorePlace(place, input, random);
      return {
        place,
        reasons: result.reasons,
        score: result.score,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  state.adventures = ranked.slice(0, 3).map(({ place, reasons, score }, index) =>
    buildAdventure(place, input, index, reasons, score),
  );
  state.selected = 0;
  render();
}

function buildAdventure(place, input, index, reasons, score) {
  const distance = place.distance[input.start] ?? 30;
  const oneWay = travelTime(distance, input.transport);
  const total = place.duration + oneWay * 2;
  const fitsTime = total <= input.duration;
  const overBy = Math.max(0, total - input.duration);
  const questType = chooseQuestType(place, input);
  const mission = buildMission(place, input, oneWay, questType, fitsTime, overBy);
  const nudge = buildNudge(place, input);
  const partnerTip = buildPartnerTip(place, input);
  const destination = mapPoint(place, input.start);
  const origin = startPoints[input.start];
  const returnTurn = input.mode === "round"
    ? {
        name: "Different way back",
        x: Math.max(5, Math.min(95, (origin.x + destination.x) / 2 + 8)),
        y: Math.max(8, Math.min(57, (origin.y + destination.y) / 2 + 7)),
      }
    : null;

  return {
    id: `${place.id}-${index}`,
    title: place.name,
    place,
    questType,
    reasons,
    score: Math.round(score),
    distance,
    total,
    fitsTime,
    overBy,
    oneWay,
    cost: moneyLabel(place.budget),
    mission,
    nudge,
    partnerTip,
    route: [
      origin,
      destination,
      returnTurn,
      origin,
    ].filter(Boolean),
  };
}

function mapPoint(place, start) {
  if (!place.local) return place;

  const origin = startPoints[start];
  return {
    ...place,
    x: Math.max(5, Math.min(95, origin.x + place.localOffset.x)),
    y: Math.max(8, Math.min(57, origin.y + place.localOffset.y)),
  };
}

function buildNudge(place, input) {
  let challenge = "Bring back one detail you would normally miss.";

  if (place.id === "friend-picks-the-turn") {
    challenge = "Send one photo back to the friend who chose your turn.";
  } else if (place.tags.includes("social")) {
    challenge = "Ask one person for a tiny local recommendation.";
  } else if (place.tags.includes("nature")) {
    challenge = "Stay phone-free for ten minutes and notice one sound.";
  } else if (place.tags.includes("culture")) {
    challenge = "Find one object or detail that hints at another era.";
  } else if (input.mood === "spark") {
    challenge = "Say yes to one harmless detour you would normally skip.";
  }

  return {
    title: "One optional extra twist",
    challenge,
    accepted: false,
  };
}

function buildPartnerTip(place, input) {
  if (input.transport === "ev") {
    return {
      title: "Turn charging time into part of the outing.",
      copy: `A live version could compare a suitable charger near ${place.name} with something worth doing while the car charges.`,
      why: "Shown because EV mode is active and the stop fits the route.",
      cta: "See route-fit charging options",
      opened: false,
    };
  }

  if (place.tags.includes("food")) {
    return {
      title: "A table or tasting that fits the mission.",
      copy: `If availability matters, a live version could surface a bookable option near ${place.name} at the right moment.`,
      why: "Shown because food is part of this adventure, not because a partner paid to rank it first.",
      cta: "See nearby bookable options",
      opened: false,
    };
  }

  if (place.distance[input.start] > 40 || input.duration >= 180) {
    return {
      title: "Useful only if the detour becomes a longer escape.",
      copy: `A live version could offer a relevant stay or activity near ${place.name}, after the adventure has already been chosen.`,
      why: "Shown because this is a longer outing and an overnight option may be useful.",
      cta: "See nearby stay options",
      opened: false,
    };
  }

  return {
    title: "One useful add-on, after the adventure is chosen.",
    copy: `A live version could suggest a vetted local stop near ${place.name} only when it saves time or adds something real.`,
    why: "Shown because it is close to the selected route; the mission does not depend on it.",
    cta: "See route-fit options",
    opened: false,
  };
}

function buildMission(place, input, oneWay, questType, fitsTime, overBy) {
  const dayPart = getDayPart();
  const travelStep = {
    walk: `Walk to a place within ${oneWay} minutes that you have never really explored.`,
    bike: `Cycle to a place within ${oneWay} minutes that you have only passed through before.`,
    car: `Drive to a place within ${oneWay} minutes where you would not normally stop.`,
    transit: `Change routes and deliberately look around at least one stop along the way.`,
    ev: `Take a charging-friendly detour within ${oneWay} minutes.`,
  }[input.transport];
  const firstStep = place.local
    ? `Start from ${startPoints[input.start].name} and take one unfamiliar turn within ${oneWay} minutes.`
    : travelStep;

  const modeLine = {
    star: "Quick roll. Do not overthink it.",
    round: "Round trip. Take a different route back.",
    destination: "Destination mode. The place matters more than the route.",
    chaos: "Chaos mode. Accept the first meaningful coincidence.",
  }[input.mode];

  return {
    status: fitsTime
      ? questType === "Chaos"
        ? "Chaos roll ready"
        : "Ready to go"
      : `Longer option · ${overBy} min extra`,
    masterLine: buildQuestMasterLine(place, input, oneWay, questType, dayPart),
    command: place.local ? `Start: ${place.name}.` : `Go to ${place.name}.`,
    steps: [firstStep, place.action],
    modeLine,
  };
}

function getDayPart() {
  const hour = new Date().getHours();
  if (hour < 11) return "morning";
  if (hour < 17) return "day";
  if (hour < 21) return "evening";
  return "night";
}

function buildQuestMasterLine(place, input, oneWay, questType, dayPart) {
  const timeTone = {
    morning: "Morning launch",
    day: "Daytime escape",
    evening: "Evening side quest",
    night: "Late-night micro-adventure",
  }[dayPart];

  const moodTone = {
    calm: "no big spectacle, just one well-chosen detour",
    curious: "today is about noticing something new",
    spark: "today needs a little risk and a story worth telling",
  }[input.mood];

  const transportTone = {
    walk: "On foot, the adventure stays close",
    bike: "A bike gives you room to roam",
    car: "A car opens up a proper escape",
    transit: "On public transit, the stops become part of the game",
    ev: "In EV mode, charging becomes part of the experience",
  }[input.transport];

  return `${timeTone}: ${moodTone}. ${transportTone}. You will reach ${place.name} in around ${oneWay} minutes. ${questType} quest.`;
}

function chooseQuestType(place, input) {
  if (input.mode === "chaos" || place.category === "Chaos") return "Chaos";
  if (place.tags.includes("social")) return "Social";
  if (place.tags.includes("nature")) return "Outer";
  if (input.mood === "calm") return "Inner";
  return "Outer";
}

function render() {
  renderCards();
  renderSelected();
  renderMap();
}

function renderCards() {
  views.cards.innerHTML = "";

  state.adventures.forEach((adventure, index) => {
    const card = document.createElement("article");
    card.className = `adventure-card ${index === state.selected ? "active" : ""}`;
    card.innerHTML = `
      <div class="card-top">
        <span class="tag">${adventure.questType} Quest</span>
        <span class="nudge-mini">${adventure.nudge.accepted ? "Twist added" : "Optional twist"}</span>
      </div>
      <h3>${adventure.title}</h3>
      <p>${adventure.mission.steps[0]}</p>
      <p class="card-nudge"><strong>Extra spark:</strong> ${adventure.nudge.challenge}</p>
      <div class="metrics">
        <div class="metric ${adventure.fitsTime ? "" : "time-warning"}"><strong>${adventure.total} min</strong><span>${adventure.fitsTime ? "time" : `+${adventure.overBy} min`}</span></div>
        <div class="metric"><strong>${adventure.distance} km</strong><span>distance</span></div>
        <div class="metric"><strong>${adventure.cost}</strong><span>cost</span></div>
      </div>
      <button class="select-card" type="button">Choose this</button>
    `;
    card.querySelector("button").addEventListener("click", () => {
      state.selected = index;
      render();
    });
    views.cards.appendChild(card);
  });
}

function renderSelected() {
  const selected = state.adventures[state.selected];
  if (!selected) return;

  views.summaryKicker.textContent = `${selected.questType} quest · ${selected.nudge.accepted ? "extra twist added" : "optional extra twist"}`;
  views.summaryTitle.textContent = selected.mission.command;
  views.missionStatus.textContent = selected.mission.status;
  views.questMasterLine.textContent = selected.mission.masterLine;
  views.missionTitle.textContent = selected.mission.command;
  views.nudgeBadge.textContent = selected.nudge.accepted ? "Extra twist added" : "Optional extra twist";
  views.missionList.innerHTML = selected.mission.steps
    .map((item) => `<li>${item}</li>`)
    .join("");
  views.missionMeta.innerHTML = `
    <span>${selected.total} min</span>
    ${selected.fitsTime ? "" : `<span class="time-warning">Needs ${selected.overBy} extra min</span>`}
    <span>${transportLabel(state.quick.transport)}</span>
    <span>${selected.questType} quest</span>
    <span>${selected.mission.modeLine}</span>
  `;

  views.nudgeTitle.textContent = selected.nudge.title;
  views.nudgeDetail.textContent = selected.nudge.challenge;
  views.nudgeAction.textContent = selected.nudge.accepted ? "Added ✓" : "I’m in";
  views.nudgeAction.setAttribute("aria-pressed", String(selected.nudge.accepted));
  views.nudgeCard.classList.toggle("accepted", selected.nudge.accepted);

  renderPartnerTip(selected);
}

function renderPartnerTip(selected) {
  views.partnerTitle.textContent = selected.partnerTip.title;
  views.partnerCopy.textContent = selected.partnerTip.copy;
  views.partnerWhy.textContent = selected.partnerTip.why;
  views.partnerAction.textContent = selected.partnerTip.opened
    ? "Demo placement ✓"
    : selected.partnerTip.cta;
  views.partnerFeedback.textContent = selected.partnerTip.opened
    ? "In the live product, a clearly labelled affiliate option would open here."
    : "The adventure works perfectly without it.";
}

function renderMap() {
  const selected = state.adventures[state.selected];
  if (!selected) return;

  const points = selected.route;
  const path = points.map((point) => `${point.x},${point.y}`).join(" ");
  const roadPathA = "5,48 21,36 38,39 50,30 65,34 81,21 96,30";
  const roadPathB = "10,20 25,24 42,18 58,22 74,16 91,18";
  const hills = "M0 45 C15 38 27 47 42 43 C59 38 70 41 100 32 L100 62 L0 62 Z";

  views.map.innerHTML = `
    <rect class="map-bg" x="0" y="0" width="100" height="62"></rect>
    <path class="water" d="M0 0 H100 V12 C82 17 68 10 53 15 C35 20 19 14 0 18 Z"></path>
    <path class="park" d="${hills}"></path>
    <polyline class="route-road secondary-road" points="${roadPathB}"></polyline>
    <polyline class="route-road" points="${roadPathA}"></polyline>
    <polyline class="route-line" points="${path}"></polyline>
    ${points
      .map(
        (point, index) => `
          <g class="pin ${index === 1 ? "active" : ""}" transform="translate(${point.x} ${point.y})">
            <circle class="pin-outer" r="4.2"></circle>
            <circle class="pin-inner" r="2.2"></circle>
            <text class="pin-number" y="1.15">${index + 1}</text>
          </g>
        `,
      )
      .join("")}
  `;

  views.routeLegend.innerHTML = points
    .map(
      (point, index) => `
        <div class="legend-item">
          <span>${index + 1}</span>
          <strong>${index === 0 ? "Start" : index === points.length - 1 ? "Return" : point.name}</strong>
        </div>
      `,
    )
    .join("");

  const startName = startPoints[controls.start.value].name;
  views.routeTitle.textContent = `${startName} → ${selected.title} → back`;
  views.routeSummary.textContent = `${selected.total} min · ${transportLabel(state.quick.transport)}`;

  const timeline = [
    { step: "Start", title: startName, meta: "Leave when ready" },
    {
      step: "Go",
      title: `${selected.oneWay} min by ${transportLabel(state.quick.transport)}`,
      meta: `${selected.distance} km · illustrative estimate`,
    },
    {
      step: "Explore",
      title: selected.title,
      meta: `${selected.place.duration} min for the mission`,
    },
    {
      step: "Return",
      title: `${selected.oneWay} min back`,
      meta: getInputs().mode === "round" ? "Take a different way home" : "Same starting point",
    },
  ];

  views.routeTimeline.innerHTML = timeline
    .map(
      (item, index) => `
        <li>
          <span>${index + 1}</span>
          <div>
            <small>${item.step}</small>
            <strong>${item.title}</strong>
            <p>${item.meta}</p>
          </div>
        </li>
      `,
    )
    .join("");
}

function currentPlanText() {
  const selected = state.adventures[state.selected];
  if (!selected) return "";

  return [
    selected.mission.status,
    `Quest Master: ${selected.mission.masterLine}`,
    selected.mission.command,
    "",
    ...selected.mission.steps.map((item, index) => `${index + 1}. ${item}`),
    "",
    selected.nudge.accepted ? `Extra spark: ${selected.nudge.challenge}` : "",
    "Random Adventure demo mission",
  ].filter(Boolean).join("\n");
}

async function copyPlan() {
  const text = currentPlanText();
  try {
    await navigator.clipboard.writeText(text);
    controls.copy.textContent = "Copied";
    window.setTimeout(() => {
      controls.copy.textContent = "Copy itinerary";
    }, 1400);
  } catch {
    window.prompt("Copy mission", text);
  }
}

function setQuickValue(key, value) {
  state.quick[key] = key === "duration" ? Number(value) : value;
  syncButtons();
  generateAdventures();
}

function syncButtons() {
  controls.durationButtons.forEach((button) => {
    const active = Number(button.dataset.duration) === state.quick.duration;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  controls.moodButtons.forEach((button) => {
    const active = button.dataset.mood === state.quick.mood;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  controls.transportButtons.forEach((button) => {
    const active = button.dataset.transport === state.quick.transport;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

controls.durationButtons.forEach((button) => {
  button.addEventListener("click", () =>
    setQuickValue("duration", button.dataset.duration),
  );
});

controls.moodButtons.forEach((button) => {
  button.addEventListener("click", () => setQuickValue("mood", button.dataset.mood));
});

controls.transportButtons.forEach((button) => {
  button.addEventListener("click", () =>
    setQuickValue("transport", button.dataset.transport),
  );
});

controls.generate.addEventListener("click", generateAdventures);
controls.regenerate.addEventListener("click", generateAdventures);
controls.copy.addEventListener("click", copyPlan);
controls.print.addEventListener("click", () => window.print());
views.nudgeAction.addEventListener("click", () => {
  const selected = state.adventures[state.selected];
  selected.nudge.accepted = !selected.nudge.accepted;
  renderCards();
  renderSelected();
});
views.partnerAction.addEventListener("click", () => {
  const selected = state.adventures[state.selected];
  selected.partnerTip.opened = true;
  renderPartnerTip(selected);
});
document.querySelectorAll("select, input").forEach((item) => {
  item.addEventListener("change", generateAdventures);
});

syncButtons();
generateAdventures();

