import { getRandomEnemyType, createEnemy, calculateDamage } from './EnemyTypes.js';

/**
 * MVP Combat System — turn-based. Now with enemy types, combos, and game feel!
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
    this.comboCount = 0;
    this.lastHitTime = 0;
    this.comboTimer = 3000; // 3s to chain
    this.feel = null;
  }

  /** Wire in the GameFeel instance (called from main.js) */
  setFeel(feel) {
    this.feel = feel;
  }

  /**
   * Initiate combat with an NPC.
   */
  startCombat(npc) {
    this.isActive = true;
    npc.isInCombat = true;
    this.comboCount = 0;
    this.lastHitTime = 0;

    // Pick enemy type based on NPC or random
    const typeDef = getRandomEnemyType();
    this.enemy = createEnemy(typeDef);
    this.enemy.hp = this.enemy.maxHp;
    this.enemy.name = npc.name; // Keep the NPC's name
    this.enemy.turnCount = 0;
    this.enemy.dodgeCount = 0;

    this.turn = 'player';
    this.log = [`⚔️ Battle with ${npc.name} begins!`];
    this.log.push(`📋 ${npc.name} is a **${typeDef.name}**-type enemy.`);

    this.engine.setPlayerLock(true);
    if (this.feel) this.feel.addTrauma(0.3);

    document.dispatchEvent(new CustomEvent('combat-start', {
      detail: { enemy: this.enemy, player: this.player }
    }));

    this._renderCombatUI();
  }

  playerAction(action) {
    if (!this.isActive || this.turn !== 'player') return;

    switch (action) {
      case 'attack': {
        // Combo logic
        const now = performance.now();
        if (now - this.lastHitTime < this.comboTimer) {
          this.comboCount++;
        } else {
          this.comboCount = 0;
        }
        this.lastHitTime = now;
        const comboMult = 1 + this.comboCount * 0.15; // +15% per chain hit

        // Scout dodge check
        if (this.enemy.attackPattern === 'fast' && this.enemy.dodgeCount >= 2) {
          this.enemy.dodgeCount = 0;
          this.log.push(`${this.enemy.name} nimbly dodges your attack!`);
          if (this.feel) this.feel.addTrauma(0.15);
          this.log.push(`You strike ${this.enemy.name} for 0 damage!`);
        } else {
          this.enemy.dodgeCount = (this.enemy.dodgeCount || 0) + 1;
          const dmg = Math.max(1, Math.round((this.player.attack - this.enemy.defense + Math.floor(Math.random() * 4)) * comboMult));
          this.enemy.hp = Math.max(0, this.enemy.hp - dmg);
          this.log.push(`You strike ${this.enemy.name} for ${dmg} damage!`);

          // Game feel
          if (this.feel) {
            this.feel.hitstop(70);
            this.feel.addTrauma(0.4);
            this.feel.punchFov(this.engine.camera, 4, this.engine.baseFov);
          }

          // Emit damage number
          document.dispatchEvent(new CustomEvent('damage-number', {
            detail: { amount: dmg, type: 'player' }
          }));
        }
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
    // Tank only attacks every 2 turns
    this.enemy.turnCount = (this.enemy.turnCount || 0) + 1;
    if (this.enemy.attackPattern === 'heavy' && this.enemy.turnCount % 2 !== 0) {
      this.log.push(`${this.enemy.name} winds up a heavy attack...`);
      // Telegraph: strong shake
      if (this.feel) this.feel.addTrauma(0.25);
      this.turn = 'player';
      this._renderCombatUI();
      return;
    }

    // Telegraph based on attack pattern
    const telegraphType = this.enemy.attackPattern === 'heavy' ? 'quake' :
                          this.enemy.attackPattern === 'fast' ? 'quick' : 'standard';
    document.dispatchEvent(new CustomEvent('combat-telegraph', {
      detail: { type: telegraphType }
    }));

    if (this.feel) this.feel.addTrauma(0.2); // warning shake
    await new Promise(r => setTimeout(r, 500));

    // Use attack pattern
    const result = calculateDamage(
      this.enemy.attack, this.player.defense,
      this.enemy.attackPattern, this.enemy.name
    );
    this.player.hp = Math.max(0, this.player.hp - result.damage);
    this.log.push(result.message);

    if (!result.dodged) {
      // Game feel on hit
      if (this.feel) {
        this.feel.hitstop(this.enemy.attackPattern === 'heavy' ? 90 : 60);
        this.feel.addTrauma(this.enemy.attackPattern === 'heavy' ? 0.5 : 0.35);
        this.feel.punchFov(this.engine.camera, this.enemy.attackPattern === 'heavy' ? 6 : 3, this.engine.baseFov);
      }

      // Squash-and-stretch on the player mesh
      if (this.engine.player && this.feel) {
        this.feel.squash(this.engine.player, this.enemy.attackPattern === 'heavy' ? 0.75 : 0.85, 0.18);
      }

      // Damage number
      document.dispatchEvent(new CustomEvent('damage-number', {
        detail: { amount: result.damage, type: 'enemy' }
      }));
    }

    if (this.player.hp <= 0) {
      this._defeat();
      return;
    }

    // Reset combo on player hit
    this.comboCount = 0;

    this.turn = 'player';
    this._renderCombatUI();
  }

  useItem(item) {
    if (item.effect === 'heal') {
      const healAmt = item.value || 30;
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + healAmt);
      this.log.push(`You used ${item.name} and recovered ${healAmt} HP!`);
      if (this.feel) { this.feel.addTrauma(0.15); }
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
    if (this.feel) { this.feel.addTrauma(0.6); this.feel.punchFov(this.engine.camera, 6, this.engine.baseFov); }
    document.dispatchEvent(new CustomEvent('combat-end', { detail: { result: 'victory' } }));
    // Defeat animation
    document.dispatchEvent(new CustomEvent('defeat-animation', { detail: { enemy: this.enemy } }));
  }

  _defeat() {
    this.log.push(`💀 You were defeated...`);
    this.isActive = false;
    const npc = this.engine.npcs.find(n => n.name === this.enemy.name);
    if (npc) {
      npc.isInCombat = false;
      npc.hasMet = false;
    }
    this.engine.setPlayerLock(false);
    this.player.hp = 30;
    if (this.feel) { this.feel.addTrauma(0.8); this.feel.punchFov(this.engine.camera, 8, this.engine.baseFov); }
    document.dispatchEvent(new CustomEvent('combat-end', { detail: { result: 'defeat' } }));
  }

  _renderCombatUI() {
    document.dispatchEvent(new CustomEvent('combat-update', {
      detail: {
        enemy: this.enemy,
        player: this.player,
        turn: this.turn,
        log: this.log,
        combo: this.comboCount,
      }
    }));
  }
}