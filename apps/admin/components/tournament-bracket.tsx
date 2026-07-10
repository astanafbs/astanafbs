import { Row } from '../lib/api';

const columnWidth = 220;
const cardWidth = 178;
const cardHeight = 74;
const topOffset = 54;
const statusLabels: Record<string, string> = {
  pending: 'Ожидает',
  scheduled: 'Запланирован',
  live: 'В игре',
  completed: 'Завершен',
  cancelled: 'Отменен',
};

export const tournamentFormatLabels: Record<string, string> = {
  single_elimination: 'Олимпийская сетка',
  double_elimination: 'Double elimination',
  round_robin: 'Круговая лига',
  group_playoff: 'Группы + плей-офф',
  swiss: 'Швейцарка',
};

const formatDescriptions: Record<string, string> = {
  single_elimination: 'Победитель проходит дальше, проигравший выбывает.',
  double_elimination: 'Игрок выбывает после второго поражения.',
  round_robin: 'Колонки показывают туры лиги, без дерева переходов.',
  group_playoff: 'Сначала групповые туры, затем финальная часть.',
  swiss: 'Колонки показывают туры швейцарки, пары пересобираются по очкам.',
};

function matchY(roundIndex: number, matchIndex: number, eliminationLayout: boolean) {
  const compactStep = 92;
  if (!eliminationLayout) return topOffset + matchIndex * compactStep;

  const step = compactStep * Math.pow(2, roundIndex);
  return topOffset + matchIndex * step + (roundIndex === 0 ? 0 : step / 2 - cardHeight / 2);
}

function fallbackRoundLabel(index: number, totalRounds: number) {
  const remaining = totalRounds - index;
  if (remaining === 1) return 'Финал';
  if (remaining === 2) return '1/2';
  return `1/${2 ** (remaining - 1)}`;
}

type Lane = 'main' | 'upper' | 'lower' | 'final' | 'group' | 'playoff';
type Stage = { key: string; order: number; label: string; lane: Lane; matches: Row[] };

function resolveStage(match: Row, tournamentFormat?: string | null) {
  const round = Number(match.round_number ?? 1);
  const position = Number(match.bracket_position ?? 1);
  const rawName = String(match.round_name ?? '').trim();
  const lower = rawName.toLowerCase();

  if (tournamentFormat === 'double_elimination') {
    if (lower.includes('gf') || lower.includes('grand final') || lower === 'финал' || lower.includes('гранд')) {
      return { key: 'gf', order: 900, label: rawName || 'Grand Final', lane: 'final' as Lane };
    }
    const chainMatch = rawName.match(/^(a|b|chain a|chain b|цепь a|цепь b|ветка a|ветка b)\s*[-\s_]*r?\s*(\d+)(?:\s*[·:,-]?\s*(.*))?/i);
    if (chainMatch) {
      const chain = String(chainMatch[1]).toLowerCase().includes('b') ? 'B' : 'A';
      const n = Number(chainMatch[2] ?? 1);
      const suffix = chainMatch[3]?.trim();
      return {
        key: `${chain}${n}`,
        order: n * 10,
        label: suffix ? `Цепь ${chain} / ${suffix}` : `Цепь ${chain} / Этап ${n}`,
        lane: chain === 'A' ? 'upper' as Lane : 'lower' as Lane,
      };
    }
    const upperMatch = rawName.match(/^(w|wb|верх)\s*[-\s_]*r?\s*(\d+)/i);
    if (upperMatch) {
      const n = Number(upperMatch[2] ?? 1);
      return { key: `W${n}`, order: n * 10, label: `W${n}`, lane: 'upper' as Lane };
    }
    const lowerMatch = rawName.match(/^(l|lb|низ)\s*[-\s_]*r?\s*(\d+)/i);
    if (lowerMatch) {
      const n = Number(lowerMatch[2] ?? 1);
      return { key: `L${n}`, order: n * 10 + 5, label: `L${n}`, lane: 'lower' as Lane };
    }
  }

  if (tournamentFormat === 'group_playoff') {
    const groupMatch = rawName.match(/^g[-\s]?([a-zа-я])\s*[-\s_]*t?\s*(\d+)/i);
    if (groupMatch) {
      const group = groupMatch[1]?.toUpperCase() ?? 'A';
      const tour = Number(groupMatch[2] ?? 1);
      return { key: `G${group}-T${tour}`, order: 100 + group.charCodeAt(0) * 10 + tour, label: `Группа ${group} / Тур ${tour}`, lane: 'group' as Lane };
    }
    const playoffMatch = rawName.match(/^po\s*[-\s_]*([a-z0-9]+)/i);
    if (playoffMatch) {
      const tag = playoffMatch[1]?.toUpperCase() ?? 'R1';
      const stageOrder = tag.includes('F') && !tag.includes('SF') ? 300 : 200;
      return { key: `PO-${tag}`, order: stageOrder + position, label: tag.includes('SF') ? `Плей-офф / ${tag}` : 'Плей-офф / Финал', lane: 'playoff' as Lane };
    }
  }

  if (tournamentFormat === 'round_robin' || tournamentFormat === 'swiss') {
    return { key: `R${round}`, order: round * 10, label: rawName || `Тур ${round}`, lane: 'main' as Lane };
  }

  return {
    key: `R${round}`,
    order: round * 10,
    label: rawName || fallbackRoundLabel(round - 1, 4),
    lane: 'main' as Lane,
  };
}

function buildStages(matches: Row[], tournamentFormat?: string | null): Stage[] {
  const keyed = matches.map((match) => ({ match, stage: resolveStage(match, tournamentFormat) }));
  const stageKeys = Array.from(new Set(keyed.map((item) => item.stage.key)));
  return stageKeys
    .map((key) => {
      const matchesInStage = keyed
        .filter((item) => item.stage.key === key)
        .sort((a, b) => Number(a.match.bracket_position ?? 1) - Number(b.match.bracket_position ?? 1));
      const first = matchesInStage[0];
      return {
        key,
        order: first?.stage.order ?? 999,
        label: first?.stage.label ?? key,
        lane: first?.stage.lane ?? 'main',
        matches: matchesInStage.map((item) => item.match),
      };
    })
    .sort((a, b) => a.order - b.order);
}

function isEliminationLayout(rounds: Array<{ lane: Lane; matches: Row[] }>) {
  if (rounds.length < 2) return false;
  return rounds.every((round, index) => {
    if (index === 0) return round.matches.length >= 2;
    const previousCount = rounds[index - 1]?.matches.length ?? 0;
    const currentCount = round.matches.length;
    return currentCount > 0 && currentCount <= Math.ceil(previousCount / 2);
  });
}

function isDoubleChainStage(stage: Stage) {
  return stage.lane === 'upper' || stage.lane === 'lower';
}

function bracketLines(
  leftBoxes: Array<{ x: number; y: number }>,
  rightBoxes: Array<{ x: number; y: number }>,
) {
  const lines: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  const leftRight = (box: { x: number; y: number }) => ({ x: box.x + cardWidth, y: box.y + cardHeight / 2 });
  const rightLeft = (box: { x: number; y: number }) => ({ x: box.x, y: box.y + cardHeight / 2 });
  const connectionMid = (columnWidth - cardWidth) / 2;

  if (leftBoxes.length === rightBoxes.length) {
    leftBoxes.forEach((left, index) => {
      const right = rightBoxes[index];
      if (!right) return;
      const start = leftRight(left);
      const end = rightLeft(right);
      lines.push({ x1: start.x, y1: start.y, x2: end.x, y2: end.y });
    });
    return lines;
  }

  if (leftBoxes.length === rightBoxes.length * 2) {
    rightBoxes.forEach((right, index) => {
      const first = leftBoxes[index * 2];
      const second = leftBoxes[index * 2 + 1];
      if (!first || !second) return;
      const firstStart = leftRight(first);
      const secondStart = leftRight(second);
      const end = rightLeft(right);
      const midX = firstStart.x + connectionMid;
      lines.push(
        { x1: firstStart.x, y1: firstStart.y, x2: midX, y2: firstStart.y },
        { x1: secondStart.x, y1: secondStart.y, x2: midX, y2: secondStart.y },
        { x1: midX, y1: firstStart.y, x2: midX, y2: secondStart.y },
        { x1: midX, y1: end.y, x2: end.x, y2: end.y },
      );
    });
    return lines;
  }

  if (rightBoxes.length === leftBoxes.length * 2) {
    leftBoxes.forEach((left, index) => {
      const first = rightBoxes[index * 2];
      const second = rightBoxes[index * 2 + 1];
      if (!first || !second) return;
      const start = leftRight(left);
      const firstEnd = rightLeft(first);
      const secondEnd = rightLeft(second);
      const midX = start.x + connectionMid;
      lines.push(
        { x1: start.x, y1: start.y, x2: midX, y2: start.y },
        { x1: midX, y1: firstEnd.y, x2: midX, y2: secondEnd.y },
        { x1: midX, y1: firstEnd.y, x2: firstEnd.x, y2: firstEnd.y },
        { x1: midX, y1: secondEnd.y, x2: secondEnd.x, y2: secondEnd.y },
      );
    });
    return lines;
  }

  return lines;
}

export function TournamentBracket({ matches, tournamentFormat }: { matches: Row[]; tournamentFormat?: string | null }) {
  if (!matches.length) {
    return <p className="table-note">Сетка появится после генерации матчей.</p>;
  }

  const renderedRounds = buildStages(matches, tournamentFormat);
  const eliminationLayout = isEliminationLayout(renderedRounds);
  const isDoubleChain = tournamentFormat === 'double_elimination' && renderedRounds.some(isDoubleChainStage);
  const stageOrders = Array.from(new Set(renderedRounds.map((stage) => stage.order))).sort((a, b) => a - b);
  const stageColumnIndex = new Map(stageOrders.map((order, index) => [order, index]));

  const laneOrder: Lane[] = ['upper', 'lower', 'final', 'group', 'playoff', 'main'];
  const laneMaxMatches = new Map<Lane, number>();
  renderedRounds.forEach((stage) => {
    const prev = laneMaxMatches.get(stage.lane) ?? 0;
    laneMaxMatches.set(stage.lane, Math.max(prev, stage.matches.length));
  });

  const doubleChainRowStep = cardHeight + 24;
  const doubleChainMaxRows = Math.max(
    1,
    ...renderedRounds.filter(isDoubleChainStage).map((stage) => stage.matches.length),
  );
  const doubleChainHeight = doubleChainMaxRows * doubleChainRowStep - 24 + cardHeight;
  let laneOffset = topOffset;
  const laneBaseY = new Map<Lane, number>();
  if (isDoubleChain) {
    laneBaseY.set('upper', topOffset);
    laneBaseY.set('lower', topOffset + doubleChainHeight + 92);
    laneBaseY.set('final', topOffset + doubleChainHeight + 46 - cardHeight / 2);
  } else {
    laneOrder.forEach((lane) => {
      if (!laneMaxMatches.has(lane)) return;
      laneBaseY.set(lane, laneOffset);
      laneOffset += Math.max(1, laneMaxMatches.get(lane) ?? 1) * 92 + 72;
    });
  }
  const laneStageIndex = new Map<Lane, number>();

  const boxes = renderedRounds.flatMap((round, roundIndex) => {
    const roundMatches = round.matches;
    const matchCount = Math.max(1, roundMatches.length);
    const stageIndexInLane = laneStageIndex.get(round.lane) ?? 0;
    laneStageIndex.set(round.lane, stageIndexInLane + 1);
    const baseY = laneBaseY.get(round.lane) ?? topOffset;

    return Array.from({ length: matchCount }, (_, matchIndex) => {
      const match = roundMatches[matchIndex];
      const y = round.lane === 'final'
        ? laneBaseY.get('final') ?? topOffset
        : isDoubleChain && isDoubleChainStage(round)
          ? baseY + ((doubleChainMaxRows - matchCount) * doubleChainRowStep) / 2 + matchIndex * doubleChainRowStep
          : baseY + (eliminationLayout ? matchY(stageIndexInLane, matchIndex, true) - topOffset : matchIndex * 92);

      return {
        id: match?.id ?? `${round.key}-${matchIndex}`,
        key: match?.id ?? `${round.key}-${matchIndex}`,
        round: round.key,
        roundLabel: round.label,
        x: 18 + (stageColumnIndex.get(round.order) ?? roundIndex) * columnWidth,
        y,
        match: match ?? {
          id: `${round.key}-${matchIndex}`,
          round_name: round.label,
          score: null,
          status: 'pending',
          player_a_name: 'TBD',
          player_b_name: 'TBD',
          player_a_id: null,
          player_b_id: null,
          winner_id: null,
          next_match_id: null,
        } as unknown as Row,
      };
    });
  });

  const height = Math.max(240, boxes.reduce((max, box) => Math.max(max, box.y + cardHeight + 24), 0));
  const width = stageOrders.length * columnWidth + 24;

  const connectionGap = columnWidth - cardWidth;
  const connectionMid = connectionGap / 2;

  const hasExplicitLinks = boxes.some((box) => Boolean(box.match.next_match_id));
  const connectors = hasExplicitLinks ? boxes.flatMap((box) => {
    if (!box.match.next_match_id) return [];
    const target = boxes.find((candidate) => candidate.id === String(box.match.next_match_id));
    if (!target) return [];
    const startX = box.x + cardWidth;
    const startY = box.y + cardHeight / 2;
    const endX = target.x;
    const endY = target.y + cardHeight / 2;
    const midX = startX + connectionMid;
    return [
      { x1: startX, y1: startY, x2: midX, y2: startY },
      { x1: midX, y1: startY, x2: midX, y2: endY },
      { x1: midX, y1: endY, x2: endX, y2: endY },
    ];
  }) : eliminationLayout ? boxes.flatMap((box) => {
    const roundIndex = renderedRounds.findIndex((round) => round.key === box.round);
    const currentRoundBoxes = boxes.filter((item) => item.round === box.round);
    const pairIndex = currentRoundBoxes.findIndex((item) => item.key === box.key);
    if (roundIndex >= renderedRounds.length - 1 || pairIndex % 2 !== 0) return [];

    const nextBox = boxes.filter((item) => item.round === renderedRounds[roundIndex + 1].key)[Math.floor(pairIndex / 2)];
    const sibling = currentRoundBoxes[pairIndex + 1];
    if (!nextBox || !sibling) return [];

    const startX = box.x + cardWidth;
    const midX = startX + connectionMid;
    const firstY = box.y + cardHeight / 2;
    const secondY = sibling.y + cardHeight / 2;
    const endY = nextBox.y + cardHeight / 2;

    return [
      { x1: startX, y1: firstY, x2: midX, y2: firstY },
      { x1: startX, y1: secondY, x2: midX, y2: secondY },
      { x1: midX, y1: firstY, x2: midX, y2: secondY },
      { x1: midX, y1: endY, x2: nextBox.x, y2: endY },
    ];
  }) : renderedRounds.flatMap((round, index) => {
    const nextRound = renderedRounds[index + 1];
    if (!nextRound) return [];
    return bracketLines(
      boxes.filter((box) => box.round === round.key),
      boxes.filter((box) => box.round === nextRound.key),
    );
  });

  const columnLabels = stageOrders.map((order, index) => {
    const stages = renderedRounds.filter((stage) => stage.order === order);
    if (stages.length > 1 && tournamentFormat === 'double_elimination') return `Этап ${index + 1}`;
    return stages[0]?.label ?? `Этап ${index + 1}`;
  });

  return (
    <div className="admin-bracket-scroll">
      {tournamentFormat ? (
        <p className="table-note">
          {tournamentFormatLabels[tournamentFormat] ?? tournamentFormat}: {formatDescriptions[tournamentFormat] ?? 'Матчи сгруппированы по раундам.'}
        </p>
      ) : null}
      <div className="admin-bracket-canvas" style={{ width, height }}>
        <svg className="admin-bracket-lines" width={width} height={height} aria-hidden="true">
          {connectors.map((line, index) => (
            <line key={index} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} />
          ))}
        </svg>
        {columnLabels.map((label, index) => (
          <div className="admin-bracket-label" key={`${label}-${index}`} style={{ left: 18 + index * columnWidth, top: 12, width: cardWidth }}>
            {label}
          </div>
        ))}
        {boxes.map((box) => (
          <div className="admin-match-card" key={box.key} style={{ left: box.x, top: box.y, width: cardWidth, minHeight: cardHeight }}>
            <div className="admin-match-head">
              <span>{box.match.round_name ?? 'Раунд'}</span>
              <small>{box.match.score ?? statusLabels[String(box.match.status)] ?? box.match.status}</small>
            </div>
            <p className={box.match.winner_id && box.match.winner_id === box.match.player_a_id ? 'winner' : ''}>
              {box.match.player_a_name ?? 'TBD'}
            </p>
            <p className={box.match.winner_id && box.match.winner_id === box.match.player_b_id ? 'winner' : ''}>
              {box.match.player_b_name ?? 'TBD'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
