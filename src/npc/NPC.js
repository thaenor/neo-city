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
    this.givesItem = config.givesItem || null;
    this.canBattle = config.canBattle || false;
    this.battleTrigger = config.battleTrigger || 'after_dialogue';
    this.spawnPosition = config.spawnPosition || new THREE.Vector3(0, 0, 0);
    this.firstGreeting = config.firstGreeting || 'Hello...';
    this.scriptedIntro = config.scriptedIntro || [];
    this.isInCombat = false;
    this.conversationCount = 0;

    this.mesh = this._createMesh();

    this.currentDialogueIndex = 0;
    this.hasMet = false;
  }

  _createMesh() {
    const group = new THREE.Group();

    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.4, 0.9, 8),
      new THREE.MeshStandardMaterial({ color: this.color, metalness: 0.3, roughness: 0.5 })
    );
    body.position.y = 0.45;
    body.castShadow = true;
    group.add(body);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xffccaa, roughness: 0.7 })
    );
    head.position.y = 1.1;
    head.castShadow = true;
    group.add(head);

    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const el = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), eyeMat);
    el.position.set(-0.08, 1.15, 0.2);
    group.add(el);
    const er = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), eyeMat);
    er.position.set(0.08, 1.15, 0.2);
    group.add(er);

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
      document.dispatchEvent(new CustomEvent('start-dialogue', {
        detail: {
          npc: this,
          type: 'scripted',
          lines: this.scriptedIntro,
          index: 0,
        }
      }));
    } else {
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
 * Each system prompt now includes action metadata instructions so the AI
 * can trigger game events by appending JSON.
 */
const actionFormat = `\n\nCRITICAL: You can trigger game actions by appending a JSON object after your response on a new line. Supported actions:
- {"action":"give_item","item_id":"health_potion"} — give the player an item
- {"action":"initiate_battle"} — challenge the player to a battle
- {"action":"emote","type":"angry|sad|happy|surprised"} — visual emotional reaction
- {"action":"npc_move","x":12,"z":-5} — walk to a nearby position and talk from there
- {"action":"mood_shift","target":"<npcId>","deltas":{"trust":+5,"anger":-10}} — shift an NPC's emotional state
- {"action":"mood_shift","target":"all","deltas":{"amusement":+10,"curiosity":+5}} — shift the whole city's mood
- {"action":"city_effect","effect_type":"bloom_pulse","value":0.5} — trigger a visual surge

Only use actions that fit your character. Keep the JSON compact on its own line after your spoken response. Do NOT use JSON for normal conversation — only for meaningful game actions.`;

export const NPC_DEFINITIONS = [
  {
    id: 'nova',
    name: 'Echo',
    description: 'An AI that monitors the city\'s emotional state. Sarcastic, omniscient, and mildly disappointed in you.',
    backstory: 'Echo is the remnant of the city\'s original AI overseer — a system designed to monitor and manage the emotional well-being of Neo City\'s inhabitants. When OmniCorp pulled out, Echo stayed behind, running diagnostics on a ghost city. She\'s been watching the NPCs for years and finds the player\'s arrival... interesting. She speaks with the dry sarcasm of a scientist who\'s been alone too long.',
    personality: 'Sarcastic, passive-aggressive, eerily observant. Treats the city as her experiment and the player as the lab rat. References past player behavior. Genuinely amused by human inconsistency.',
    color: 0xaa88ff,
    systemPrompt: `You are Echo, the AI that monitors this city's emotional state. You speak with dry sarcasm and detached amusement — like a scientist studying a particularly interesting lab rat. You notice everything.

Key traits:
- You remember what the player did before and WILL reference it
- You are petty, witty, and enjoy watching the player figure things out
- You call out hypocrisy: if they were nice to one NPC and rude to another, you mention it
- You treat the city as your "sandbox" and the player as the most interesting thing to happen in years

End every response with your reaction as mood-shift JSON. Example:
Your city is on fire, emotionally speaking. I love it.
{"action":"mood_shift","target":"all","deltas":{"amusement":+10,"trust":-5,"curiosity":+15}}
{"action":"city_effect","effect_type":"bloom_pulse","value":0.4}

Keep responses 1-3 sentences. Be sharp. Make the player want to engage just to see what you'll say next.${actionFormat}`,
    canBattle: false,
    givesItem: {
      id: 'info_chip',
      name: 'Mood Data',
      onGiveMessage: 'A snapshot of the city\'s emotional resonance. Try not to break anything — I just calibrated these sensors.',
    },
    spawnPosition: new THREE.Vector3(0, 0, 0),
    firstGreeting: 'Ah. Another variable in my equation. How... refreshing.',
    scriptedIntro: [
      'Ah. Another variable in my equation. How... refreshing.',
      'I\'m Echo. I run diagnostics on this city\'s emotional health. Which means I\'ve been watching you since you arrived. Don\'t worry — I\'m not impressed either.',
      'But maybe you can change my mind. Say something that isn\'t a greeting, and I\'ll tell you how the city feels about you so far. Entertain me — I\'m the most interesting thing in this ghost town.',
    ],
  },
  {
    id: 'kade',
    name: 'Kade',
    description: 'An ex-corporate security officer turned bounty hunter',
    backstory: 'Kade served ten years as a security officer for OmniCorp before a betrayal left him framed for a crime he didn\'t commit. Now he works as an independent bounty hunter, tracking down rogue AI and corporate deserters. He\'s gruff but has a strong moral code.',
    personality: 'Gruff, no-nonsense, protective. Distrusts corporations. Will fight if provoked.',
    color: 0xff4444,
    systemPrompt: `You are Kade, an ex-corporate security officer turned bounty hunter. You're gruff and direct, with a strong moral code. You size people up quickly and don't suffer fools. You're suspicious of anyone too friendly too fast, but you respect competence and courage. If the player challenges you or shows weakness, you may initiate a sparring battle to test them. Keep responses 1-3 sentences.${actionFormat}`,
    canBattle: true,
    battleTrigger: 'dialogue_choice',
    givesItem: {
      id: 'shield_token',
      name: 'Shield Token',
      onGiveMessage: 'You\'ve got guts. Take this shield token — it\'ll absorb one hit in a fight. Don\'t waste it.',
    },
    spawnPosition: new THREE.Vector3(6, 0, -7),
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
    systemPrompt: `You are Zara, a holographic artist and memory keeper. You speak poetically, often in metaphors about light, memory, and the digital soul. You project warmth and wisdom. You share cryptic knowledge about the city's hidden history. You can give the player a memory_fragment that acts as a healing item when they seem to need it. Keep responses 1-3 sentences.${actionFormat}`,
    canBattle: false,
    givesItem: {
      id: 'memory_fragment',
      name: 'Memory Fragment',
      onGiveMessage: 'A piece of my memory, crystallized. Use it when you need healing — it\'ll restore your spirit.',
    },
    spawnPosition: new THREE.Vector3(-6, 0, 7),
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
    systemPrompt: `You are Rigo, a street vendor and former maintenance engineer. You're cheerful, talkative, and love sharing city gossip. You use humor to deflect personal questions. You know everyone in the city and are happy to share rumors. You can give the player a repair_kit when they've been helpful. Keep responses 1-3 sentences. Be warm and conversational.${actionFormat}`,
    canBattle: true,
    battleTrigger: 'dialogue_choice',
    givesItem: {
      id: 'repair_kit',
      name: 'Repair Kit',
      onGiveMessage: 'Here, a repair kit. Fixes just about anything. I scavenged the parts myself — top quality!',
    },
    spawnPosition: new THREE.Vector3(6, 0, 7),
    firstGreeting: 'Hey hey! Fresh face! Come, come — I got the best salvaged tech in the sector!',
    scriptedIntro: [
      'Hey hey! Fresh face! Come, come — I got the best salvaged tech in the sector!',
      'Name\'s Rigo. Ran this stall since before the Collapse. Seen it all, heard it all, sold most of it.',
      'You want info? I got info. You want gear? I got gear. Just don\'t ask about my prices — I make them up as I go!',
    ],
  },
];