/**
 * MoodSystem
 * ───────────
 * Per-NPC emotional state + interaction memory + city aggregate.
 * Every NPC has a 4-axis mood vector:
 *   trust    (0-100) — how much they trust the player
 *   anger    (0-100) — how pissed off they are
 *   curiosity(0-100) — how interested they are
 *   amusement(0-100) — how entertained they are
 *
 * The system remembers the last N interactions per NPC and can
 * feed that context into Gen AI prompts so NPCs reference history.
 */

const DEFAULT_MOODS = {
  /** Echo (Nova) — mood mirror, starts curious */
  nova:     { trust: 40,  anger: 20,  curiosity: 60, amusement: 30 },
  /** Kade — hostile bounty hunter, starts angry */
  kade:     { trust: 10,  anger: 70,  curiosity: 20, amusement: 10 },
  /** Zara — holographic artist, starts friendly */
  zara:     { trust: 70,  anger: 5,   curiosity: 40, amusement: 50 },
  /** Rigo — the test case, starts neutral */
  rigo:     { trust: 50,  anger: 15,  curiosity: 35, amusement: 20 },
};

const MAX_MEMORY = 5;

export class MoodSystem {
  constructor(moodOverrides = {}) {
    this.moods = {};
    this.memories = {};

    // Initialise every NPC from defaults (allows overrides per NPC)
    const allDefaults = { ...DEFAULT_MOODS, ...moodOverrides };
    for (const [id, vec] of Object.entries(allDefaults)) {
      this.moods[id] = { ...vec };
      this.memories[id] = [];
    }
  }

  /**
   * Get the full mood vector for an NPC.
   * Returns a copy so callers can't mutate internal state.
   */
  getMood(npcId) {
    const m = this.moods[npcId];
    if (!m) return { trust: 50, anger: 10, curiosity: 30, amusement: 10 };
    return { ...m };
  }

  /**
   * Apply deltas to an NPC's mood. Deltas are clamped to [0, 100].
   * Returns the new mood vector (for chaining / feedback).
   */
  applyDelta(npcId, deltas = {}) {
    const m = this.moods[npcId];
    if (!m) return null;
    for (const axis of ['trust', 'anger', 'curiosity', 'amusement']) {
      if (deltas[axis] !== undefined) {
        m[axis] = Math.max(0, Math.min(100, m[axis] + deltas[axis]));
      }
    }
    return { ...m };
  }

  /**
   * Apply a delta to ALL NPCs (city-wide mood shift).
   */
  applyDeltaAll(deltas = {}) {
    const results = {};
    for (const id of Object.keys(this.moods)) {
      results[id] = this.applyDelta(id, deltas);
    }
    return results;
  }

  /**
   * Human-readable mood label for an NPC.
   * Based on the dominant axis exceeding a threshold.
   */
  getMoodLabel(npcId) {
    const m = this.moods[npcId];
    if (!m) return 'neutral';
    if (m.anger >= 60) return 'hostile';
    if (m.trust >= 60) return 'friendly';
    if (m.amusement >= 50) return 'playful';
    if (m.curiosity >= 60) return 'curious';
    return 'neutral';
  }

  /**
   * Aggregate city mood — average of all NPC mood vectors.
   * Returns a single 4-axis mood that represents the city's emotional state.
   */
  getCityMood() {
    const ids = Object.keys(this.moods);
    if (ids.length === 0) return { trust: 50, anger: 10, curiosity: 30, amusement: 10 };

    const sum = { trust: 0, anger: 0, curiosity: 0, amusement: 0 };
    for (const id of ids) {
      const m = this.moods[id];
      sum.trust += m.trust;
      sum.anger += m.anger;
      sum.curiosity += m.curiosity;
      sum.amusement += m.amusement;
    }
    const n = ids.length;
    return {
      trust: Math.round(sum.trust / n),
      anger: Math.round(sum.anger / n),
      curiosity: Math.round(sum.curiosity / n),
      amusement: Math.round(sum.amusement / n),
    };
  }

  /**
   * City mood as a single dominant label (for quick checks).
   */
  getCityLabel() {
    const m = this.getCityMood();
    if (m.anger >= 40) return 'angry';
    if (m.amusement >= 35) return 'playful';
    if (m.trust >= 50) return 'friendly';
    if (m.curiosity >= 50) return 'curious';
    return 'neutral';
  }

  // ─── Interaction memory ──────────────────────────────────────────────

  recordInteraction(npcId, playerText, npcResponse) {
    if (!this.memories[npcId]) this.memories[npcId] = [];
    const entry = { playerText, npcResponse, timestamp: Date.now() };
    this.memories[npcId].push(entry);
    if (this.memories[npcId].length > MAX_MEMORY) {
      this.memories[npcId].shift();
    }
  }

  getMemory(npcId) {
    return this.memories[npcId] || [];
  }

  /**
   * Build a memory context string for Gen AI prompts.
   * Returns empty string if no history.
   */
  getMemoryContext(npcId) {
    const mems = this.getMemory(npcId);
    if (mems.length === 0) return '';
    const lines = mems.map((m, i) =>
      `[${i + 1}] Player: "${m.playerText}" → You: "${m.npcResponse}"`
    );
    return `Previous interactions:\n${lines.join('\n')}`;
  }
}