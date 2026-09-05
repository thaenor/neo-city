import * as THREE from 'three';

/**
 * NPC character definition with backstory, personality, and system prompt.
 */
export class NPC {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.description = config.description;
    this.backstory = config.backstory;
    this.personality = config.personality;
    this.systemPrompt = config.systemPrompt;
    this.color = config.color || 0x44ff88;
    this.givesItem = config.givesItem || null; // { id, name, onGiveMessage }
    this.canBattle = config.canBattle || false;
    this.battleTrigger = config.battleTrigger || 'after_dialogue'; // 'after_dialogue' | 'on_approach' | 'dialogue_choice'
    this.spawnPosition = config.spawnPosition || new THREE.Vector3(0, 0, 0);
    this.firstGreeting = config.firstGreeting || 'Hello...';
    this.scriptedIntro = config.scriptedIntro || [];
    this.isInCombat = false;
    this.conversationCount = 0;

    // Mesh
    this.mesh = this._createMesh();

    // Interaction state
    this.currentDialogueIndex = 0;
    this.hasMet = false;
  }

  _createMesh() {
    const group = new THREE.Group();

    // Body
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.4, 0.9, 8),
      new THREE.MeshStandardMaterial({ color: this.color, metalness: 0.3, roughness: 0.5 })
    );
    body.position.y = 0.45;
    body.castShadow = true;
    group.add(body);

    // Head
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xffccaa, roughness: 0.7 })
    );
    head.position.y = 1.1;
    head.castShadow = true;
    group.add(head);

    // Eyes
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const el = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), eyeMat);
    el.position.set(-0.08, 1.15, 0.2);
    group.add(el);
    const er = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), eyeMat);
    er.position.set(0.08, 1.15, 0.2);
    group.add(er);

    // Name tag glow ring
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.15, 0.2, 16),
      new THREE.MeshStandardMaterial({
        color: this.color,
        emissive: this.color,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
      })
    );
    ring.position.y = 1.4;
    ring.rotation.x = -Math.PI / 2;
    group.add(ring);

    group.position.copy(this.spawnPosition);
    return group;
  }

  onInteract() {
    this.conversationCount++;

    if (!this.hasMet) {
      this.hasMet = true;
      this.currentDialogueIndex = 0;
      // Start scripted intro
      document.dispatchEvent(new CustomEvent('start-dialogue', {
        detail: {
          npc: this,
          type: 'scripted',
          lines: this.scriptedIntro,
          index: 0,
        }
      }));
    } else {
      // AI-driven conversation
      document.dispatchEvent(new CustomEvent('start-dialogue', {
        detail: {
          npc: this,
          type: 'ai',
          playerMessage: this._getGreeting(),
        }
      }));
    }
  }

  _getGreeting() {
    const greetings = [
      `Hey there!`,
      `Oh, it's you again!`,
      `Back for more conversation?`,
      `What's up?`,
      `Good to see you.`,
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }
}

/**
 * NPC definitions — full backstories, personalities, and system prompts.
 */
export const NPC_DEFINITIONS = [
  {
    id: 'nova',
    name: 'Nova',
    description: 'A street-smart data runner with cybernetic implants',
    backstory: 'Nova grew up in the lower levels of the city, navigating its data streams and black markets. She became a data runner after her family was displaced by corporate expansion. She trusts few but has a soft spot for those who show genuine kindness.',
    personality: 'Cautious but warm once trust is earned. Speaks in tech-slang. Fiercely independent.',
    color: 0xff66aa,
    systemPrompt: `You are Nova, a data runner in a futuristic city. You're street-smart, cautious, but friendly once the player shows they're not corporate scum. You speak with technical slang and have a cynical but hopeful view of the city. You offer information in exchange for favors. Your catchphrase: "Data don't lie, but people do." Keep responses 1-3 sentences.`,
    canBattle: false,
    givesItem: {
      id: 'info_chip',
      name: 'Info Chip',
      onGiveMessage: 'Here, take this info chip. Might help you navigate the city. I got plenty more where that came from — if you prove useful.',
    },
    spawnPosition: new THREE.Vector3(-18, 0, -22),
    firstGreeting: 'You look lost. New to the city?',
    scriptedIntro: [
      'You look lost. New to the city? Name\'s Nova. I run data in these parts.',
      'The corps control most of what you see. But there\'s a hidden network — the Underwire. That\'s where the real city lives.',
      'Stick with me, and I\'ll show you around. Just don\'t do anything stupid.',
    ],
  },
  {
    id: 'kade',
    name: 'Kade',
    description: 'An ex-corporate security officer turned bounty hunter',
    backstory: 'Kade served ten years as a security officer for OmniCorp before a betrayal left him framed for a crime he didn\'t commit. Now he works as an independent bounty hunter, tracking down rogue AI and corporate deserters. He\'s gruff but has a strong moral code.',
    personality: 'Gruff, no-nonsense, protective. Distrusts corporations. Will fight if provoked.',
    color: 0xff4444,
    systemPrompt: `You are Kade, an ex-corporate security officer turned bounty hunter. You're gruff and direct, with a strong moral code. You size people up quickly and don't suffer fools. You're suspicious of anyone too friendly too fast, but you respect competence and courage. If the player challenges you or shows weakness, you may initiate a sparring battle to test them. Keep responses 1-3 sentences.`,
    canBattle: true,
    battleTrigger: 'dialogue_choice',
    givesItem: {
      id: 'shield_token',
      name: 'Shield Token',
      onGiveMessage: 'You\'ve got guts. Take this shield token — it\'ll absorb one hit in a fight. Don\'t waste it.',
    },
    spawnPosition: new THREE.Vector3(14, 0, -18),
    firstGreeting: 'Hmph. Another face I don\'t recognize.',
    scriptedIntro: [
      'Hmph. Another face I don\'t recognize. Name\'s Kade.',
      'I hunt rogue AI and corporate deserters. The city\'s full of them. OmniCorp left a mess when they pulled out.',
      'If you want to survive out here, you need to be able to fight. You any good?',
    ],
  },
  {
    id: 'zara',
    name: 'Zara',
    description: 'A holographic street artist and memory keeper',
    backstory: 'Zara is more digital than physical — she projects herself as a hologram through the city\'s neural network. She was once a human artist who uploaded her consciousness to escape a terminal illness. Now she paints memories across building walls using light and code.',
    personality: 'Dreamy, poetic, mysterious. Speaks in metaphors. Has moments of profound insight.',
    color: 0x88ddff,
    systemPrompt: `You are Zara, a holographic artist and memory keeper. You speak poetically, often in metaphors about light, memory, and the digital soul. You project warmth and wisdom. You share cryptic knowledge about the city's hidden history. You can give the player a memory fragment that acts as a healing item. Keep responses 1-3 sentences.`,
    canBattle: false,
    givesItem: {
      id: 'memory_fragment',
      name: 'Memory Fragment',
      onGiveMessage: 'A piece of my memory, crystallized. Use it when you need healing — it\'ll restore your spirit.',
    },
    spawnPosition: new THREE.Vector3(20, 0, 24),
    firstGreeting: 'I see you. The ones who see light can find the truth.',
    scriptedIntro: [
      'I see you. The ones who see light can find the truth.',
      'I paint memories, child. Every building in this city holds a story I\'ve touched. OmniCorp tried to erase them, but light can\'t be deleted.',
      'If you listen closely, the city speaks. I can help you hear it.',
    ],
  },
  {
    id: 'rigo',
    name: 'Rigo',
    description: 'A jovial street vendor who sells salvaged tech',
    backstory: 'Rigo runs a stall in the central plaza, selling salvaged tech from the old corporate towers. He was a maintenance engineer before the collapse and kept his sense of humor through it all. He knows everyone and everything happening in the city.',
    personality: 'Jovial, talkative, well-connected. Uses humor to deflect. Generous with information.',
    color: 0xffaa44,
    systemPrompt: `You are Rigo, a street vendor and former maintenance engineer. You're cheerful, talkative, and love sharing city gossip. You use humor to deflect personal questions. You know everyone in the city and are happy to share rumors. You can give the player a repair kit item. Keep responses 1-3 sentences. Be warm and conversational.`,
    canBattle: false,
    givesItem: {
      id: 'repair_kit',
      name: 'Repair Kit',
      onGiveMessage: 'Here, a repair kit. Fixes just about anything. I scavenged the parts myself — top quality!',
    },
    spawnPosition: new THREE.Vector3(-14, 0, 28),
    firstGreeting: 'Hey hey! Fresh face! Come, come — I got the best salvaged tech in the sector!',
    scriptedIntro: [
      'Hey hey! Fresh face! Come, come — I got the best salvaged tech in the sector!',
      'Name\'s Rigo. Ran this stall since before the Collapse. Seen it all, heard it all, sold most of it.',
      'You want info? I got info. You want gear? I got gear. Just don\'t ask about my prices — I make them up as I go!',
    ],
  },
];