import { useRef, useState } from 'react';
import { Animated, LayoutChangeEvent, PanResponder, Platform, useWindowDimensions } from 'react-native';
import Svg, { Line as SvgLine } from 'react-native-svg';
import { Text, XStack, YStack } from 'tamagui';

import { colors, radius, spacing } from '../theme';

type BracketMatch = {
  id: string;
  player_a_id?: string | null;
  player_b_id?: string | null;
  winner_id?: string | null;
  round_name?: string | null;
  round_number?: number | null;
  bracket_position?: number | null;
  player_a_name?: string | null;
  player_b_name?: string | null;
  score?: string | null;
  status?: string | null;
  next_match_id?: string | null;
  next_slot?: string | null;
};

const columnWidth = 180;
const matchWidth = 148;
const matchHeight = 68;
const matchStep = 98;
const topOffset = 48;

const statusLabels: Record<string, string> = {
  pending: 'Ожидает',
  scheduled: 'Запланирован',
  live: 'В игре',
  completed: 'Завершен',
  cancelled: 'Отменен',
};

function getMatchY(roundIndex: number, matchIndex: number, eliminationLayout: boolean) {
  if (!eliminationLayout) return topOffset + matchIndex * matchStep;

  const step = matchStep * Math.pow(2, roundIndex);
  return topOffset + matchIndex * step + (roundIndex === 0 ? 0 : step / 2 - matchHeight / 2);
}

function inferRoundStage(match: BracketMatch) {
  const name = String(match.round_name ?? '').toLowerCase();
  if (name.includes('1/32')) return 1;
  if (name.includes('1/16')) return 2;
  if (name.includes('1/8')) return 3;
  if (name.includes('1/4')) return 4;
  if (name.includes('1/2')) return 5;
  if (name.includes('полуфинал')) return 5;
  if (name === 'финал' || name.includes('3 место')) return 6;
  return Number(match.round_number ?? 1);
}

type Lane = 'main' | 'upper' | 'lower' | 'final' | 'group' | 'playoff';
type Stage = { key: string; order: number; label: string; lane: Lane; matches: BracketMatch[] };

function resolveStage(match: BracketMatch, tournamentFormat?: string | null) {
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

function buildStages(matches: BracketMatch[], tournamentFormat?: string | null): Stage[] {
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

function bracketLines(
  leftBoxes: Array<{ x: number; y: number }>,
  rightBoxes: Array<{ x: number; y: number }>,
) {
  const lines: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
  const leftRight = (box: { x: number; y: number }) => ({ x: box.x + matchWidth, y: box.y + matchHeight / 2 });
  const rightLeft = (box: { x: number; y: number }) => ({ x: box.x, y: box.y + matchHeight / 2 });
  const connectionMid = (columnWidth - matchWidth) / 2;

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

function isEliminationLayout(rounds: Array<{ matches: BracketMatch[] }>) {
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

const formatDescriptions: Record<string, string> = {
  single_elimination: 'Олимпийская сетка: победитель проходит дальше, проигравший выбывает.',
  double_elimination: 'Double elimination: игрок выбывает после второго поражения.',
  round_robin: 'Круговая лига: колонки показывают туры, каждый тур содержит пары одного игрового дня.',
  group_playoff: 'Группы + плей-офф: сначала групповые туры, затем финальная часть.',
  swiss: 'Швейцарка: колонки показывают туры, пары пересобираются по текущим очкам.',
};

type SkiaModule = {
  Canvas: React.ComponentType<{ style?: unknown; children?: React.ReactNode }>;
  Line: React.ComponentType<{
    p1: { x: number; y: number };
    p2: { x: number; y: number };
    color: string;
    strokeWidth: number;
  }>;
  vec: (x: number, y: number) => { x: number; y: number };
};

let skiaModule: SkiaModule | null = null;
try {
  skiaModule = require('@shopify/react-native-skia') as SkiaModule;
} catch {
  skiaModule = null;
}

export function TournamentBracketCanvas({
  matches = [],
  tournamentFormat,
}: {
  matches?: BracketMatch[];
  tournamentFormat?: string | null;
}) {
  const { width, height } = useWindowDimensions();
  const formatDescription = tournamentFormat ? formatDescriptions[tournamentFormat] : null;
  const useMobileCanvas = width < 700;
  const canvasScale = useMobileCanvas ? 0.48 : 1;

  const initialViewportHeight = useMobileCanvas ? Math.min(Math.max(460, height * 0.74), Math.max(460, width * 1.9)) : 520;
  const [viewportSize, setViewportSize] = useState({ width: width - 32, height: initialViewportHeight });

  const onLayout = (event: LayoutChangeEvent) => {
    const { width: w, height: h } = event.nativeEvent.layout;
    setViewportSize({ width: w, height: h });
  };

  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const boundsRef = useRef({ scaledCanvasWidth: 0, scaledCanvasHeight: 0, viewportWidth: 0, viewportHeight: 0 });

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3;
      },
      onPanResponderGrant: () => {
        pan.extractOffset();
      },
      onPanResponderMove: (_, gestureState) => {
        const nextX = (pan.x as any)._offset + gestureState.dx;
        const nextY = (pan.y as any)._offset + gestureState.dy;

        const { scaledCanvasWidth, scaledCanvasHeight, viewportWidth, viewportHeight } = boundsRef.current;
        const minX = Math.min(0, viewportWidth - scaledCanvasWidth);
        const maxX = 0;
        const minY = Math.min(0, viewportHeight - scaledCanvasHeight);
        const maxY = 0;

        let boundedX = Math.max(minX, Math.min(maxX, nextX));
        let boundedY = Math.max(minY, Math.min(maxY, nextY));

        pan.setValue({
          x: boundedX - (pan.x as any)._offset,
          y: boundedY - (pan.y as any)._offset,
        });
      },
      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
    })
  ).current;

  if (!matches.length) {
    return (
      <YStack
        minHeight={160}
        borderRadius={radius.sm}
        backgroundColor={colors.cardElevated}
        padding={spacing.lg}
        justifyContent="center"
        alignItems="center"
      >
        <Text color={colors.textSecondary} fontSize={14} lineHeight={20} textAlign="center">
          Сетка появится после генерации матчей в админке.
        </Text>
      </YStack>
    );
  }

  const renderedRounds = buildStages(matches, tournamentFormat);
  const eliminationLayout = isEliminationLayout(renderedRounds);
  const isDoubleChain = tournamentFormat === 'double_elimination' && renderedRounds.some(isDoubleChainStage);
  const stageOrders = Array.from(new Set(renderedRounds.map((stage) => stage.order))).sort((a, b) => a - b);
  const stageColumnIndex = new Map(stageOrders.map((order, index) => [order, index]));
  const canvasWidth = stageOrders.length * columnWidth + 28;
  const laneOrder: Lane[] = ['upper', 'lower', 'final', 'group', 'playoff', 'main'];
  const laneMaxMatches = new Map<Lane, number>();
  renderedRounds.forEach((stage) => {
    const prev = laneMaxMatches.get(stage.lane) ?? 0;
    laneMaxMatches.set(stage.lane, Math.max(prev, stage.matches.length));
  });
  const doubleChainRowStep = matchHeight + 30;
  const doubleChainMaxRows = Math.max(
    1,
    ...renderedRounds.filter(isDoubleChainStage).map((stage) => stage.matches.length),
  );
  const doubleChainHeight = doubleChainMaxRows * doubleChainRowStep - 30 + matchHeight;
  let laneOffset = topOffset;
  const laneBaseY = new Map<Lane, number>();
  if (isDoubleChain) {
    laneBaseY.set('upper', topOffset);
    laneBaseY.set('lower', topOffset + doubleChainHeight + 108);
    laneBaseY.set('final', topOffset + doubleChainHeight + 54 - matchHeight / 2);
  } else {
    laneOrder.forEach((lane) => {
      if (!laneMaxMatches.has(lane)) return;
      laneBaseY.set(lane, laneOffset);
      laneOffset += Math.max(1, laneMaxMatches.get(lane) ?? 1) * 108 + 72;
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
          : baseY + (eliminationLayout ? getMatchY(stageIndexInLane, matchIndex, true) - topOffset : matchIndex * matchStep);
      return {
        id: match?.id ?? `${round.key}-${matchIndex}`,
        key: match?.id ?? `${round.key}-${matchIndex}`,
        round: round.key,
        roundLabel: round.label,
        x: 16 + (stageColumnIndex.get(round.order) ?? roundIndex) * columnWidth,
        y,
        title: match?.round_name ?? (roundIndex === renderedRounds.length - 1 ? 'Финал' : `Матч ${matchIndex + 1}`),
        playerA: match?.player_a_name ?? 'TBD',
        playerB: match?.player_b_name ?? 'TBD',
        playerAId: match?.player_a_id ?? null,
        playerBId: match?.player_b_id ?? null,
        winnerId: match?.winner_id ?? null,
        score: match?.score ?? null,
        status: match?.status ?? 'pending',
        nextMatchId: match?.next_match_id ?? null,
      };
    });
  });
  const canvasHeight = Math.max(220, boxes.reduce((max, box) => Math.max(max, box.y + matchHeight + 30), 0));

  const connectionGap = columnWidth - matchWidth;
  const connectionMid = connectionGap / 2;

  const hasExplicitLinks = boxes.some((box) => Boolean(box.nextMatchId));
  const connectors = hasExplicitLinks ? boxes.flatMap((box) => {
    if (!box.nextMatchId) return [];
    const target = boxes.find((candidate) => candidate.id === box.nextMatchId);
    if (!target) return [];
    const startX = box.x + matchWidth;
    const startY = box.y + matchHeight / 2;
    const endX = target.x;
    const endY = target.y + matchHeight / 2;
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

    const startX = box.x + matchWidth;
    const midX = startX + connectionMid;
    const firstY = box.y + matchHeight / 2;
    const secondY = sibling.y + matchHeight / 2;
    const endY = nextBox.y + matchHeight / 2;

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
  const scaledCanvasWidth = canvasWidth * canvasScale;
  const scaledCanvasHeight = canvasHeight * canvasScale;
  const scaledBoxes = boxes.map((box) => ({
    ...box,
    x: box.x * canvasScale,
    y: box.y * canvasScale,
  }));
  const scaledConnectors = connectors.map((line) => ({
    x1: line.x1 * canvasScale,
    y1: line.y1 * canvasScale,
    x2: line.x2 * canvasScale,
    y2: line.y2 * canvasScale,
  }));

  boundsRef.current = {
    scaledCanvasWidth,
    scaledCanvasHeight,
    viewportWidth: viewportSize.width,
    viewportHeight: viewportSize.height,
  };

  const canUseSkia = Platform.OS !== 'web' && Boolean(skiaModule);
  const SkiaCanvas = skiaModule?.Canvas;
  const SkiaLine = skiaModule?.Line;
  const skiaVec = skiaModule?.vec;
  const columnLabels = stageOrders.map((order, index) => {
    const stages = renderedRounds.filter((stage) => stage.order === order);
    if (stages.length > 1 && tournamentFormat === 'double_elimination') return `Этап ${index + 1}`;
    return stages[0]?.label ?? `Этап ${index + 1}`;
  });

  return (
    <YStack gap={spacing.sm}>
      {formatDescription ? (
        <Text color={colors.textSecondary} fontSize={12} lineHeight={18}>
          {formatDescription}
        </Text>
      ) : null}
      <YStack
        onLayout={onLayout}
        height={viewportSize.height}
        width="100%"
        backgroundColor={colors.cardElevated}
        borderRadius={radius.sm}
        borderWidth={1}
        borderColor={colors.borderSoft}
        overflow="hidden"
        position="relative"
        style={Platform.OS === 'web' ? { cursor: 'grab' } : undefined}
      >
        <Animated.View
          style={{
            width: scaledCanvasWidth,
            height: scaledCanvasHeight,
            transform: [{ translateX: pan.x }, { translateY: pan.y }],
          }}
          {...panResponder.panHandlers}
        >
          {!canUseSkia || !SkiaCanvas || !SkiaLine || !skiaVec ? (
            <Svg
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: scaledCanvasWidth,
                height: scaledCanvasHeight,
              }}
              pointerEvents="none"
            >
              {scaledConnectors.map((line, index) => (
                <SvgLine
                  key={`line-${index}`}
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke={colors.brass500}
                  strokeWidth={Math.max(1, 2 * canvasScale)}
                  opacity={0.82}
                />
              ))}
            </Svg>
          ) : (
            <SkiaCanvas style={{ position: 'absolute', left: 0, top: 0, width: scaledCanvasWidth, height: scaledCanvasHeight }}>
              {scaledConnectors.map((line, index) => (
                <SkiaLine
                  key={`line-${index}`}
                  p1={skiaVec(line.x1, line.y1)}
                  p2={skiaVec(line.x2, line.y2)}
                  color={colors.brass500}
                  strokeWidth={Math.max(1, 2 * canvasScale)}
                />
              ))}
            </SkiaCanvas>
          )}

          {columnLabels.map((label, index) => (
            <Text
              key={`${label}-${index}`}
              position="absolute"
              left={(16 + index * columnWidth) * canvasScale}
              top={14 * canvasScale}
              width={matchWidth * canvasScale}
              color={colors.brass400}
              fontSize={Math.max(8, 13 * canvasScale)}
              fontWeight="800"
              textAlign="center"
              numberOfLines={1}
            >
              {label}
            </Text>
          ))}

          {scaledBoxes.map((box) => (
            <BracketBox key={box.key} box={box} absolute scale={canvasScale} compact={useMobileCanvas} />
          ))}
        </Animated.View>
      </YStack>
    </YStack>
  );
}

function BracketBox({
  box,
  absolute = false,
  scale,
  compact = false,
}: {
  box: {
    key: string;
    x: number;
    y: number;
    title: string;
    playerA: string;
    playerB: string;
    playerAId: string | null;
    playerBId: string | null;
    winnerId: string | null;
    score: string | null;
    status: string;
  };
  absolute?: boolean;
  scale?: number;
  compact?: boolean;
}) {
  const s = scale ?? 1;
  const boxHeight = matchHeight * s;
  const boxPaddingX = compact ? 4 : Math.max(6, spacing.sm * s);
  const boxPaddingY = compact ? 2.5 : Math.max(6, spacing.sm * s);
  const rowGap = compact ? 1 : Math.max(3, spacing.xs * s);
  const titleFontSize = compact ? 5.8 : Math.max(7, 10 * s);
  const playerFontSize = compact ? 6.0 : Math.max(7, 10 * s);
  const metaFontSize = compact ? 5.4 : Math.max(6.5, 9 * s);
  const compactLineHeight = 7.2;
  return (
    <YStack
      position={absolute ? 'absolute' : 'relative'}
      left={absolute ? box.x : undefined}
      top={absolute ? box.y : undefined}
      width={absolute ? matchWidth * s : '100%'}
      height={absolute ? boxHeight : undefined}
      minHeight={absolute ? undefined : boxHeight}
      borderRadius={radius.sm * s}
      borderWidth={1}
      borderColor={colors.borderSoft}
      backgroundColor={colors.cardElevated}
      paddingHorizontal={boxPaddingX}
      paddingVertical={boxPaddingY}
      justifyContent="space-between"
      gap={rowGap}
      overflow="hidden"
    >
      <XStack justifyContent="space-between" gap={compact ? 2 : spacing.xs} alignItems="center" minHeight={compact ? compactLineHeight : undefined}>
        <Text
          color={colors.textPrimary}
          fontSize={titleFontSize}
          lineHeight={compact ? compactLineHeight : undefined}
          fontWeight="400"
          numberOfLines={1}
          flex={1}
        >
          {box.title}
        </Text>
        <Text
          color={colors.textMuted}
          fontSize={metaFontSize}
          lineHeight={compact ? compactLineHeight : undefined}
          fontWeight="400"
          numberOfLines={1}
        >
          {box.score ?? statusLabels[box.status] ?? box.status}
        </Text>
      </XStack>
      <Text
        color={box.winnerId && box.winnerId === box.playerAId ? colors.brass400 : colors.textSecondary}
        fontSize={playerFontSize}
        lineHeight={compact ? compactLineHeight : undefined}
        fontWeight="400"
        numberOfLines={1}
      >
        {box.playerA}
      </Text>
      <Text
        color={box.winnerId && box.winnerId === box.playerBId ? colors.brass400 : colors.textSecondary}
        fontSize={playerFontSize}
        lineHeight={compact ? compactLineHeight : undefined}
        fontWeight="400"
        numberOfLines={1}
      >
        {box.playerB}
      </Text>
    </YStack>
  );
}

function fallbackRoundLabel(index: number, totalRounds: number) {
  const remaining = totalRounds - index;
  if (remaining === 1) return 'Финал';
  if (remaining === 2) return '1/2';
  return `1/${2 ** (remaining - 1)}`;
}

function ConnectorLine({ line, scale = 1 }: { line: { x1: number; y1: number; x2: number; y2: number }; scale?: number }) {
  const horizontal = line.y1 === line.y2;
  return (
    <YStack
      position="absolute"
      left={Math.min(line.x1, line.x2)}
      top={Math.min(line.y1, line.y2)}
      width={horizontal ? Math.abs(line.x2 - line.x1) : Math.max(1, 2 * scale)}
      height={horizontal ? Math.max(1, 2 * scale) : Math.abs(line.y2 - line.y1)}
      backgroundColor={colors.brass500}
      opacity={0.82}
    />
  );
}
