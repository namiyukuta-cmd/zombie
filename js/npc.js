/* =========================================================
   NPC DATA
   js/npc.js
========================================================= */

export const NPCS = {
  /* =======================================================
     コール・リード
  ======================================================= */
  father_001: {
    id: 'father_001',
    name: 'コール・リード',
    englishName: 'Cole Reed',
    age: 38,
    gender: 'male',
    role: 'ミアの父',

    image: 'assets/Cole/cole01.png',
    portraits: [
      'assets/Cole/cole01.png',
      'assets/Cole/cole02.png',
      'assets/Cole/cole03.png',
      'assets/Cole/cole04.png',
      'assets/Cole/cole05.png'
    ],

    personality: [
      '慎重',
      '警戒心が強い',
      '責任感が強い',
      '家族への情が深い',
      '信用した相手には誠実'
    ],

    likes: [
      '家族',
      '実用的な作業',
      '家の維持'
    ],

    history: {
      pandemic: [
        'ショッピングセンターで買い物中にパンデミックが発生した。',
        '妻がゾンビ化した。',
        'ミアを守るため、妻を残してその場から逃げることになった。',
        '逃走中、自身も腰を噛まれた。'
      ],
      wife: {
        status: 'dead',
        relationship: 'wife',
        notes: [
          '妻を真剣に愛していた。',
          '妻を残して逃げたことへの罪悪感を抱えている。',
          '妻について話す時は口数が減る。'
        ]
      }
    },

    condition: {
      health: 'injured',
      injuries: [
        {
          id: 'bite_waist',
          type: 'bite',
          location: 'waist',
          description: '腰の咬傷',
          infected: true
        }
      ],
      notes: [
        '傷の痛みが強い。',
        '感染が進行する恐れがある。',
        '立っているだけでも辛い時がある。'
      ]
    },

    goals: [
      'ミアを守る',
      '自分がどうなってもミアが生きていける状態を作る',
      '信用できる人間かどうか主人公を見極める'
    ],

    relationship: {
      initialAttitude: 'hostile_cautious',
      trustEnabled: true,
      affectionEnabled: true,
      defaultTrust: 0,
      defaultAffection: 0,
      romance: {
        enabled: true,
        unlockedByDefault: false,
        requiresSpecialCondition: true,
        ageRating: 'all-ages',
        notes: [
          '妻への愛情と喪失を軽く扱わない。',
          '高い信頼を築くまで恋愛イベントは発生しない。',
          '恋愛表現は全年齢・TPOを守る。',
          '上限突破後の詳細は後で設定する。'
        ]
      }
    },

    behavior: {
      speech: [
        '「ありがとう」より「助かった」と言うことが多い。',
        '妻の話になると口数が減る。',
        '自分の傷について聞かれることを嫌がる。'
      ],
      family: [
        'ミアには甘い。',
        '危険時には自分よりミアを優先する。'
      ],
      stranger: [
        '知らない人間を強く警戒する。',
        '所持品や行動を厳しく確認する。'
      ]
    },

    importantItems: ['猟銃'],

    eventHooks: [
      'infection_progress',
      'infection_treatment',
      'trust_player',
      'talk_about_wife',
      'entrust_mia',
      'romance_unlock'
    ],

    firstAppearance: {
      eventId: 'home_event_001',
      description: '玄関で猟銃を持ち、主人公を厳しく警戒している。'
    }
  },


  /* =======================================================
     ミア・リード
  ======================================================= */
  mia_001: {
    id: 'mia_001',
    name: 'ミア・リード',
    englishName: 'Mia Reed',
    age: 4,
    gender: 'female',
    role: 'コールの娘',

    image: 'assets/mia/mia01.PNG',
    portraits: [
      'assets/mia/mia01.PNG',
      'assets/mia/mia02.PNG',
      'assets/mia/mia03.PNG',
      'assets/mia/mia04.PNG',
      'assets/mia/mia05.PNG'
    ],

    personality: [
      '素直',
      'おとなしい',
      '人見知り',
      '知らない相手を観察してから近づく'
    ],

    likes: [
      '絵本',
      'お絵かき',
      'おままごと',
      'クマのぬいぐるみ'
    ],

    history: {
      pandemic: [
        'ショッピングセンターから逃げる混乱の中で母を失った。',
        '大切なクマのぬいぐるみも失くした。'
      ],
      mother: {
        status: 'dead',
        miaBelief: 'お母さんは遠くへ行っていて、いつか迎えに来てくれる。'
      }
    },

    condition: {
      health: 'healthy',
      notes: [
        '身体はおおむね健康。',
        '母の死をまだ理解していない。',
        'クマのぬいぐるみを失くして気落ちしている。'
      ]
    },

    goals: [
      '父親と一緒にいる',
      '母親が帰ってくるのを待つ'
    ],

    relationship: {
      initialAttitude: 'cautious_curiosity',
      trustEnabled: true,
      affectionEnabled: true,
      defaultTrust: 0,
      defaultAffection: 0,
      romance: {
        enabled: false
      }
    },

    behavior: {
      play: [
        '絵本を読む',
        'お絵かきをする',
        'おままごとをする'
      ],
      stranger: [
        '最初は主人公をじっと観察する。',
        '少しずつ信用すると自分から近づくようになる。'
      ],
      teddyBear: [
        '「くまちゃん、ひとりで怖くないかな」と心配することがある。'
      ]
    },

    importantItems: [
      {
        id: 'mia_teddy_bear',
        name: 'ミアのクマのぬいぐるみ',
        status: 'missing',
        description: 'パンデミック発生時、ショッピングセンターから逃げる混乱の中で失くした。'
      }
    ],

    eventHooks: [
      'read_picture_book',
      'draw_together',
      'play_house',
      'talk_about_mother',
      'search_teddy_bear',
      'return_teddy_bear',
      'trust_player'
    ],

    firstAppearance: {
      eventId: 'home_event_001',
      line: 'パーパー。…だーれー？',
      description: '階上から降りてきて、主人公を不思議そうに見る。'
    }
  }
};


export function getNPC(id) {
  return NPCS[id] ?? null;
}

export function hasNPC(id) {
  return Boolean(NPCS[id]);
}

export function getAllNPCs() {
  return Object.values(NPCS);
}

export function getNPCName(id) {
  return getNPC(id)?.name ?? '';
}

export function getNPCImage(id) {
  return getNPC(id)?.image ?? null;
}

export function getNPCPortrait(id, index = 0) {
  const npc = getNPC(id);
  if (!npc) return null;

  const portraits = npc.portraits || [];
  return portraits[index] ?? npc.image ?? null;
}
