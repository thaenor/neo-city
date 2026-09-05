/**
 * MVP Combat System — turn-based.
 */
export class CombatSystem {
  constructor(engine) {
    this.engine = engine;
    this.isActive = false;
    this.player = {
      name: 'Player',
      maxHp: 100,
      hp: 100,
      attack: 12,
      defense: 5,
    };
    this.enemy = null;
    this.turn = 'player';
    this.log = [];
  }

  /**
   * Initiate combat with an NPC.
   */
  startCombat(npc) {
    this.isActive = true;
    npc.isInCombat = true;

    this.enemy = {
      name: npc.name,
      maxHp: 60 + Math.floor(Math.random() * 40),
      hp: 0,
      attack: 8 + Math.floor(Math.random() * 6),
      defense: 3 + Math.floor(Math.random() * 4),
    };
    this.enemy.hp = this.enemy.maxHp;

    this.turn = 'player';
    this.log = [`⚔️ Battle with ${npc.name} begins!`];

    this.engine.setPlayerLock(true);

    document.dispatchEvent(new CustomEvent('combat-start', {
      detail: { enemy: this.enemy, player: this.player }
    }));

    this._renderCombatUI();
  }

  /**
   * Player performs an action.
   */
  playerAction(action) {
    if (!this.isActive || this.turn !== 'player') return;

    switch (action) {
      case 'attack': {
        const dmg = Math.max(1, this.player.attack - this.enemy.defense + Math.floor(Math.random() * 4));
        this.enemy.hp = Math.max(0, this.enemy.hp - dmg);
        this.log.push(`You strike ${this.enemy.name} for ${dmg} damage!`);
        break;
      }
      case 'defend': {
        this.log.push(`You brace for the next attack.`);
        this.player.defense += 8;
        this._enemyTurn().then(() => {
          this.player.defense -= 8;
        });
        this.turn = 'enemy';
        this._renderCombatUI();
        return;
      }
      case 'item': {
        // Use item from inventory
        document.dispatchEvent(new CustomEvent('combat-use-item', {
          detail: { combat: this }
        }));
        return;
      }
    }

    if (this.enemy.hp <= 0) {
      this._victory();
      return;
    }

    this.turn = 'enemy';
    this._renderCombatUI();
    this._enemyTurn();
  }

  async _enemyTurn() {
    // Brief pause for drama
    await new Promise(r => setTimeout(r, 800));

    const dmg = Math.max(1, this.enemy.attack - this.player.defense + Math.floor(Math.random() * 4));
    this.player.hp = Math.max(0, this.player.hp - dmg);
    this.log.push(`${this.enemy.name} strikes you for ${dmg} damage!`);

    if (this.player.hp <= 0) {
      this._defeat();
      return;
    }

    this.turn = 'player';
    this._renderCombatUI();
  }

  useItem(item) {
    if (item.effect === 'heal') {
      const healAmt = item.value || 30;
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + healAmt);
      this.log.push(`You used ${item.name} and recovered ${healAmt} HP!`);
    } else if (item.effect === 'shield') {
      this.player.defense += 15;
      this.log.push(`You used ${item.name}! +15 defense this battle!`);
    }

    document.dispatchEvent(new CustomEvent('item-consumed', { detail: { item } }));
    this.turn = 'enemy';
    this._renderCombatUI();
    this._enemyTurn();
  }

  _victory() {
    this.log.push(`🎉 You defeated ${this.enemy.name}!`);
    this.isActive = false;
    const npc = this.engine.npcs.find(n => n.name === this.enemy.name);
    if (npc) npc.isInCombat = false;
    this.engine.setPlayerLock(false);
    document.dispatchEvent(new CustomEvent('combat-end', { detail: { result: 'victory' } }));
  }

  _defeat() {
    this.log.push(`💀 You were defeated...`);
    this.isActive = false;
    const npc = this.engine.npcs.find(n => n.name === this.enemy.name);
    if (npc) {
      npc.isInCombat = false;
      npc.hasMet = false; // reset so player can try again
    }
    this.engine.setPlayerLock(false);
    // Heal player a bit on defeat
    this.player.hp = 30;
    document.dispatchEvent(new CustomEvent('combat-end', { detail: { result: 'defeat' } }));
  }

  _renderCombatUI() {
    document.dispatchEvent(new CustomEvent('combat-update', {
      detail: {
        enemy: this.enemy,
        player: this.player,
        turn: this.turn,
        log: this.log,
      }
    }));
  }
}