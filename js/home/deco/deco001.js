/* =========================================================
   HOME DECO 001
   js/home/deco/deco001.js

   ドールハウス本体は assets/home.JPEG で固定。
   後の変化は overlays / 次のdecoデータで重ねる。
========================================================= */

export const homeDeco001 = {
  id: 'home_deco_001',
  name: 'HOME',
  background: 'assets/home.JPEG',
  description: 'コールとミアが暮らしている山間部の家。',

  overlays: [],

  // 通常HOMEでは画像そのものではなく、CSSで C / M の位置表示にする。
  npcs: [
    {
      id: 'father_001',
      x: 43,
      y: 55,
      width: 10,
      height: 16,
      visibleAfterFlag: 'home_event_001_complete'
    },
    {
      id: 'mia_001',
      x: 36,
      y: 28,
      width: 8,
      height: 13,
      visibleAfterFlag: 'home_event_001_complete'
    }
  ],

  hotspots: [
    // 屋根裏
    {
      id: 'attic', label: '屋根裏', floor: 'attic',
      x: 10, y: 3, width: 76, height: 17,
      requiresFlag: 'home_upper_floor_allowed',
      lockedMessage: '今は勝手に上の階へ行くことを許されていない。',
      action: { type: 'room', roomId: 'attic' }
    },
    {
      id: 'attic_ladder', label: '屋根裏への収納階段', floor: 'attic',
      x: 61, y: 6, width: 10, height: 14,
      requiresFlag: 'home_upper_floor_allowed',
      lockedMessage: '今は屋根裏へ上がれない。',
      action: {
        type: 'message',
        text: '天井から引き下ろす、屋根裏へ続く収納式の階段だ。'
      }
    },

    // 2階
    {
      id: 'parents_bedroom', label: '寝室', floor: 'second',
      x: 4, y: 23, width: 24, height: 20,
      requiresFlag: 'home_upper_floor_allowed',
      lockedMessage: 'コールから、この階へ行くことを禁止されている。',
      action: { type: 'room', roomId: 'parents_bedroom' }
    },
    {
      id: 'parents_bed', label: 'ベッド', floor: 'second',
      x: 6, y: 31, width: 18, height: 12,
      requiresFlag: 'home_upper_floor_allowed',
      lockedMessage: '今は2階へ行けない。',
      action: {
        type: 'message',
        text: 'コールとミアが使っているベッドだ。'
      }
    },
    {
      id: 'mia_room', label: 'ミアの部屋', floor: 'second',
      x: 29, y: 23, width: 18, height: 20,
      requiresFlag: 'home_upper_floor_allowed',
      lockedMessage: 'コールから、この階へ行くことを禁止されている。',
      action: { type: 'room', roomId: 'mia_room' }
    },
    {
      id: 'mia_toybox', label: 'おもちゃ箱', floor: 'second',
      x: 35, y: 34, width: 12, height: 9,
      requiresFlag: 'home_upper_floor_allowed',
      lockedMessage: '今はミアの部屋へ行けない。',
      action: { type: 'storage', storageId: 'mia_toybox' }
    },
    {
      id: 'second_storage', label: '2階物置', floor: 'second',
      x: 48, y: 23, width: 14, height: 20,
      requiresFlag: 'home_upper_floor_allowed',
      lockedMessage: '今は2階へ行けない。',
      action: { type: 'room', roomId: 'second_storage' }
    },
    {
      id: 'second_hall', label: '2階廊下', floor: 'second',
      x: 62, y: 23, width: 16, height: 20,
      requiresFlag: 'home_upper_floor_allowed',
      lockedMessage: '今は2階へ行けない。',
      action: { type: 'room', roomId: 'second_hall' }
    },
    {
      id: 'balcony', label: 'ベランダ', floor: 'second',
      x: 79, y: 23, width: 17, height: 20,
      requiresFlag: 'home_upper_floor_allowed',
      lockedMessage: '今は2階へ行けない。',
      action: { type: 'room', roomId: 'balcony' }
    },

    // 1階
    {
      id: 'front_door', label: '玄関', floor: 'first',
      x: 3, y: 50, width: 15, height: 20,
      action: { type: 'navigate', target: 'map-select.html' }
    },
    {
      id: 'stairs', label: '階段', floor: 'first',
      x: 18, y: 49, width: 18, height: 22,
      action: { type: 'stairs' }
    },
    {
      id: 'living_room', label: '居間', floor: 'first',
      x: 35, y: 49, width: 29, height: 22,
      action: { type: 'room', roomId: 'living_room' }
    },
    {
      id: 'living_sofa', label: 'ソファ', floor: 'first',
      x: 40, y: 58, width: 14, height: 9,
      action: { type: 'sleep', sleepId: 'player_sofa' }
    },
    {
      id: 'living_radio', label: 'ラジオ', floor: 'first',
      x: 34, y: 57, width: 7, height: 8,
      action: { type: 'radio' }
    },
    {
      id: 'living_books', label: '本棚', floor: 'first',
      x: 55, y: 52, width: 9, height: 17,
      action: { type: 'books' }
    },
    {
      id: 'kitchen', label: 'キッチン', floor: 'first',
      x: 65, y: 49, width: 31, height: 22,
      action: { type: 'room', roomId: 'kitchen' }
    },
    {
      id: 'dining_table', label: 'ダイニングテーブル', floor: 'first',
      x: 65, y: 59, width: 16, height: 11,
      action: { type: 'dining' }
    },
    {
      id: 'refrigerator', label: '冷蔵庫', floor: 'first',
      x: 76, y: 54, width: 8, height: 14,
      action: { type: 'food-storage', storageId: 'refrigerator' }
    },
    {
      id: 'stove', label: 'コンロ', floor: 'first',
      x: 89, y: 56, width: 8, height: 12,
      action: { type: 'cooking', cookingId: 'kitchen_stove' }
    },

    // 地下
    {
      id: 'basement_stairs', label: '地下階段', floor: 'basement',
      x: 3, y: 76, width: 17, height: 20,
      requiresFlag: 'home_basement_allowed',
      lockedMessage: '今は地下へ行くことを許されていない。',
      action: { type: 'stairs', destination: 'basement' }
    },
    {
      id: 'basement_storage', label: '地下物置', floor: 'basement',
      x: 20, y: 76, width: 29, height: 20,
      requiresFlag: 'home_basement_allowed',
      lockedMessage: '今は地下へ行くことを許されていない。',
      action: { type: 'room', roomId: 'basement_storage' }
    },
    {
      id: 'workbench', label: '作業台', floor: 'basement',
      x: 50, y: 76, width: 25, height: 20,
      requiresFlag: 'home_basement_allowed',
      lockedMessage: '今は地下へ行くことを許されていない。',
      action: { type: 'craft', craftId: 'home_workbench' }
    },
    {
      id: 'utility_room', label: '管理室', floor: 'basement',
      x: 76, y: 76, width: 20, height: 20,
      requiresFlag: 'home_basement_allowed',
      lockedMessage: '今は地下へ行くことを許されていない。',
      action: { type: 'room', roomId: 'utility_room' }
    }
  ]
};

export const HOME_DECO_001_ID = 'home_deco_001';

export function getHomeDeco001() {
  return homeDeco001;
}
