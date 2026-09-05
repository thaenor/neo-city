/**
 * MVP Item / Inventory System.
 */

export const ITEM_DEFINITIONS = {
  health_potion: {
    id: 'health_potion',
    name: 'Health Potion',
    description: 'Restores 30 HP.',
    effect: 'heal',
    value: 30,
    icon: '🧪',
  },
  shield_token: {
    id: 'shield_token',
    name: 'Shield Token',
    description: 'Temporary +15 defense in battle.',
    effect: 'shield',
    value: 15,
    icon: '🛡️',
  },
  info_chip: {
    id: 'info_chip',
    name: 'Info Chip',
    description: 'Contains city intel. (Plot item)',
    effect: 'plot',
    value: 0,
    icon: '💾',
  },
  memory_fragment: {
    id: 'memory_fragment',
    name: 'Memory Fragment',
    description: 'Restores 50 HP. Radiates warmth.',
    effect: 'heal',
    value: 50,
    icon: '💎',
  },
  repair_kit: {
    id: 'repair_kit',
    name: 'Repair Kit',
    description: 'Restores 25 HP.',
    effect: 'heal',
    value: 25,
    icon: '🔧',
  },
};

export class Inventory {
  constructor() {
    this.items = []; // Array of { id, name, description, effect, value, icon, quantity }
  }

  add(itemId) {
    const def = ITEM_DEFINITIONS[itemId];
    if (!def) return false;

    const existing = this.items.find(i => i.id === itemId);
    if (existing) {
      existing.quantity++;
    } else {
      this.items.push({ ...def, quantity: 1 });
    }
    return true;
  }

  remove(itemId) {
    const idx = this.items.findIndex(i => i.id === itemId);
    if (idx === -1) return false;
    if (this.items[idx].quantity > 1) {
      this.items[idx].quantity--;
    } else {
      this.items.splice(idx, 1);
    }
    return true;
  }

  get(itemId) {
    return this.items.find(i => i.id === itemId) || null;
  }

  has(itemId) {
    return this.items.some(i => i.id === itemId);
  }

  getAll() {
    return [...this.items];
  }

  count() {
    return this.items.reduce((sum, i) => sum + i.quantity, 0);
  }

  /** Get usable items (heal/shield types) */
  getUsable() {
    return this.items.filter(i => i.effect === 'heal' || i.effect === 'shield');
  }
}