/* =========================
   アイテムデータ
========================= */

export const ITEMS = {

  wood: {
    id: 'wood',
    name: '薪',
    type: 'material',

    stackable: true,
    maxStack: 20,

    description:
      '乾いた薪。暖房や焚き火、工作などに使える。'
  },


  stick: {
    id: 'stick',
    name: '木の棒',

    type: 'weapon',
    weaponType: 'melee',

    stackable: false,
    maxStack: 1,

    damage: 2,

    description:
      '拾った木の棒。近接武器として使える。'
  },


  small_stone: {
    id: 'small_stone',
    name: '小石',

    type: 'weapon',
    weaponType: 'ranged',

    stackable: true,
    maxStack: 30,

    damage: 1,

    range: 220,

    ammoItemId: 'small_stone',
    ammoCost: 1,

    description:
      '道端などで簡単に拾える小石。投げて遠くのゾンビを攻撃できる。'
  },


  canned_food: {
    id: 'canned_food',
    name: '缶詰',
    type: 'food',

    stackable: true,
    maxStack: 10,

    description:
      '保存のきく食料。'
  },


  cloth: {
    id: 'cloth',
    name: '布',
    type: 'material',

    stackable: true,
    maxStack: 20,

    description:
      '衣類や古布から取れる布。工作や補修に使える。'
  },


  knife: {
    id: 'knife',
    name: 'ナイフ',

    type: 'weapon',
    weaponType: 'melee',

    stackable: false,
    maxStack: 1,

    damage: 3,

    description:
      '小型の刃物。近接武器として使える。'
  },


  axe: {
    id: 'axe',
    name: '斧',

    type: 'weapon',
    weaponType: 'melee',

    stackable: false,
    maxStack: 1,

    damage: 5,

    description:
      '木を切るための斧。近接武器としても強力。'
  }

};


/* =========================
   IDからアイテム取得
========================= */

export function getItem(itemId) {
  return ITEMS[itemId] || null;
}


/* =========================
   アイテム名
========================= */

export function getItemName(itemId) {
  const item = getItem(itemId);

  return item
    ? item.name
    : itemId;
}


/* =========================
   アイテム種類
========================= */

export function isItemType(
  itemId,
  type
) {
  const item = getItem(itemId);

  return Boolean(
    item
    && item.type === type
  );
}


/* =========================
   武器判定
========================= */

export function isWeapon(itemId) {
  return isItemType(
    itemId,
    'weapon'
  );
}


/* =========================
   近接武器判定
========================= */

export function isMeleeWeapon(itemId) {
  const item = getItem(itemId);

  return Boolean(
    item
    && item.type === 'weapon'
    && item.weaponType === 'melee'
  );
}


/* =========================
   遠距離武器判定
========================= */

export function isRangedWeapon(itemId) {
  const item = getItem(itemId);

  return Boolean(
    item
    && item.type === 'weapon'
    && item.weaponType === 'ranged'
  );
}


/* =========================
   武器ダメージ
========================= */

export function getWeaponDamage(itemId) {
  const item = getItem(itemId);

  if (
    !item
    || item.type !== 'weapon'
  ) {
    return 0;
  }

  return item.damage || 0;
}


/* =========================
   射程
========================= */

export function getWeaponRange(itemId) {
  const item = getItem(itemId);

  if (
    !item
    || item.weaponType !== 'ranged'
  ) {
    return 0;
  }

  return item.range || 0;
}


/* =========================
   消費する弾
========================= */

export function getAmmoItemId(itemId) {
  const item = getItem(itemId);

  if (
    !item
    || item.weaponType !== 'ranged'
  ) {
    return null;
  }

  return item.ammoItemId || null;
}


/* =========================
   1回の攻撃で使う弾数
========================= */

export function getAmmoCost(itemId) {
  const item = getItem(itemId);

  if (
    !item
    || item.weaponType !== 'ranged'
  ) {
    return 0;
  }

  return item.ammoCost || 0;
}


/* =========================
   最大所持数
========================= */

export function getMaxStack(itemId) {
  const item = getItem(itemId);

  if (!item) {
    return 0;
  }

  return item.maxStack || 1;
}