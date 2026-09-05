/**
 * Enemy type definitions for the combat system.
 * Three distinct types with different stats, patterns, and visual cues.
 */

export const ENEMY_TYPES = {
  grunt: {
    id: 'grunt',
    name: 'Grunt',
    description: 'Standard combat droid. Balanced stats.',
    maxHp: 60,
    attack: 10,
    defense: 4,
    speed: 1, // attacks per turn cycle
    attackPattern: 'standard',
    color: 0xff4444,
    scale: 1.0,
  },
  tank: {
    id: 'tank',
    name: 'Tank',
    description: 'Heavy assault unit. Slow but hits hard. Attacks every 2 turns.',
    maxHp: 100,
    attack: 16,
    defense: 8,
    speed: 2, // attacks every 2 turns
    attackPattern: 'heavy',
    color: 0xff8844,
    scale: 1.4,
  },
  scout: {
    id: 'scout',
    name: 'Scout',
    description: 'Fast skirmisher. Low HP, dodges every 3rd attack.',
    maxHp: 35,
    attack: 8,
    defense: 2,
    speed: 1,
    attackPattern: 'fast',
    color: 0x44ddff,
    scale: 0.8,
  },
};

/**
 * Get a random enemy type, weighted toward grunt.
 */
export function getRandomEnemyType() {
  const roll = Math.random();
  if (roll < 0.5) return { ...ENEMY_TYPES.grunt };
  if (roll < 0.75) return { ...ENEMY_TYPES.scout };
  return { ...ENEMY_TYPES.tank };
}

/**
 * Create an enemy instance from a type definition, with randomized variance.
 */
export function createEnemy(typeDef) {
  const variance = 0.15; // +/- 15% stat variance
  const v = (val) => Math.round(val * (1 + (Math.random() - 0.5) * 2 * variance));

  return {
    name: typeDef.name,
    maxHp: v(typeDef.maxHp),
    hp: 0,
    attack: v(typeDef.attack),
    defense: v(typeDef.defense),
    speed: typeDef.speed,
    attackPattern: typeDef.attackPattern,
    color: typeDef.color,
    scale: typeDef.scale,
    turnCount: 0, // tracks turns for tank's every-2-turn pattern
    dodgeCount: 0, // tracks attacks for scout's dodge
  };
}

/**
 * Calculate damage for a given attack pattern.
 * Returns { damage, message, dodged, telegraph }
 */
export function calculateDamage(attack, defense, pattern, attackerName, dodgeChance = 0) {
  // Check dodge
  if (Math.random() < dodgeChance) {
    return { damage: 0, message: `${attackerName} dodged the attack!`, dodged: true, telegraph: 'whoosh' };
  }

  let baseDmg;
  switch (pattern) {
    case 'heavy':
      // High damage, wider variance
      baseDmg = attack + Math.floor(Math.random() * 8);
      return {
        damage: Math.max(1, baseDmg - defense),
        message: `${attackerName} CRUSHES you for ${Math.max(1, baseDmg - defense)} damage!`,
        dodged: false,
        telegraph: 'quake',
      };
    case 'fast':
      // Low damage, hits twice
      baseDmg = Math.max(1, attack - defense + Math.floor(Math.random() * 3));
      return {
        damage: baseDmg,
        message: `${attackerName} strikes quickly for ${baseDmg} damage!`,
        dodged: false,
        telegraph: 'quick',
      };
    case 'standard':
    default:
      baseDmg = Math.max(1, attack - defense + Math.floor(Math.random() * 4));
      return {
        damage: baseDmg,
        message: `${attackerName} attacks for ${baseDmg} damage!`,
        dodged: false,
        telegraph: 'standard',
      };
  }
}