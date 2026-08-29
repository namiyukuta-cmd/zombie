import {
  getItem,
  getItemName,
  getMaxStack
} from './items.js';

import {
  gameState,
  saveGameState
} from './game-state.js';


/* =========================
   所持数取得
========================= */

export function getItemCount(
  itemId
) {
  return (
    gameState.inventory[itemId]
    || 0
  );
}


/* =========================
   収納数取得
========================= */

export function getStorageCount(
  itemId
) {
  return (
    gameState.storage[itemId]
    || 0
  );
}


/* =========================
   持っているか
========================= */

export function hasItem(
  itemId,
  amount = 1
) {
  return (
    getItemCount(itemId)
    >= amount
  );
}


/* =========================
   収納にあるか
========================= */

export function hasStorageItem(
  itemId,
  amount = 1
) {
  return (
    getStorageCount(itemId)
    >= amount
  );
}


/* =========================
   所持品へ追加
========================= */

export function addItem(
  itemId,
  amount = 1
) {
  const item =
    getItem(itemId);

  if (!item) {
    return {
      success: false,
      added: 0,
      reason: 'unknown-item'
    };
  }


  const addAmount =
    Math.max(
      0,
      Math.floor(amount)
    );


  if (
    addAmount <= 0
  ) {
    return {
      success: false,
      added: 0,
      reason: 'invalid-amount'
    };
  }


  const current =
    getItemCount(itemId);


  const maxStack =
    getMaxStack(itemId);


  const available =
    Math.max(
      0,
      maxStack - current
    );


  const actualAdded =
    Math.min(
      addAmount,
      available
    );


  if (
    actualAdded <= 0
  ) {
    return {
      success: false,
      added: 0,
      reason: 'full'
    };
  }


  gameState.inventory[itemId] =
    current + actualAdded;


  saveGameState();


  return {
    success: true,
    added: actualAdded,
    total:
      gameState.inventory[itemId]
  };
}


/* =========================
   所持品を減らす
========================= */

export function removeItem(
  itemId,
  amount = 1
) {
  const removeAmount =
    Math.max(
      0,
      Math.floor(amount)
    );


  if (
    removeAmount <= 0
  ) {
    return {
      success: false,
      removed: 0
    };
  }


  const current =
    getItemCount(itemId);


  if (
    current < removeAmount
  ) {
    return {
      success: false,
      removed: 0
    };
  }


  const next =
    current - removeAmount;


  if (
    next <= 0
  ) {
    delete gameState.inventory[
      itemId
    ];
  }

  else {
    gameState.inventory[itemId] =
      next;
  }


  saveGameState();


  return {
    success: true,
    removed: removeAmount,
    total: next
  };
}


/* =========================
   アイテム消費
========================= */

export function consumeItem(
  itemId,
  amount = 1
) {
  return removeItem(
    itemId,
    amount
  );
}


/* =========================
   所持品 → 収納
========================= */

export function moveItemToStorage(
  itemId,
  amount = 1
) {
  const moveAmount =
    Math.max(
      0,
      Math.floor(amount)
    );


  if (
    moveAmount <= 0
  ) {
    return false;
  }


  if (
    !hasItem(
      itemId,
      moveAmount
    )
  ) {
    return false;
  }


  const currentStorage =
    getStorageCount(itemId);


  gameState.storage[itemId] =
    currentStorage
    + moveAmount;


  removeItem(
    itemId,
    moveAmount
  );


  saveGameState();


  return true;
}


/* =========================
   収納 → 所持品
========================= */

export function moveItemFromStorage(
  itemId,
  amount = 1
) {
  const moveAmount =
    Math.max(
      0,
      Math.floor(amount)
    );


  if (
    moveAmount <= 0
  ) {
    return false;
  }


  if (
    !hasStorageItem(
      itemId,
      moveAmount
    )
  ) {
    return false;
  }


  const result =
    addItem(
      itemId,
      moveAmount
    );


  if (
    !result.success
  ) {
    return false;
  }


  const currentStorage =
    getStorageCount(itemId);


  const next =
    currentStorage
    - result.added;


  if (
    next <= 0
  ) {
    delete gameState.storage[
      itemId
    ];
  }

  else {
    gameState.storage[itemId] =
      next;
  }


  saveGameState();


  return true;
}


/* =========================
   全部収納
========================= */

export function moveAllToStorage() {
  const entries =
    Object.entries(
      gameState.inventory
    );


  for (
    const [itemId, count]
    of entries
  ) {
    if (
      count <= 0
    ) {
      continue;
    }


    const currentStorage =
      getStorageCount(
        itemId
      );


    gameState.storage[itemId] =
      currentStorage
      + count;
  }


  gameState.inventory = {};


  saveGameState();
}


/* =========================
   所持品一覧
========================= */

export function getInventoryEntries() {
  return (
    Object.entries(
      gameState.inventory
    )
      .filter(
        ([, count]) =>
          count > 0
      )
      .map(
        ([itemId, count]) => ({
          itemId,
          item:
            getItem(itemId),

          name:
            getItemName(itemId),

          count
        })
      )
  );
}


/* =========================
   収納一覧
========================= */

export function getStorageEntries() {
  return (
    Object.entries(
      gameState.storage
    )
      .filter(
        ([, count]) =>
          count > 0
      )
      .map(
        ([itemId, count]) => ({
          itemId,
          item:
            getItem(itemId),

          name:
            getItemName(itemId),

          count
        })
      )
  );
}


/* =========================
   所持品表示用文字
========================= */

export function getInventoryText() {
  const entries =
    getInventoryEntries();


  if (
    entries.length === 0
  ) {
    return '持ち物はありません。';
  }


  return (
    '持ち物：'
    + entries
      .map(
        (entry) =>
          `${entry.name}×${entry.count}`
      )
      .join('、')
  );
}


/* =========================
   収納表示用文字
========================= */

export function getStorageText() {
  const entries =
    getStorageEntries();


  if (
    entries.length === 0
  ) {
    return '収納は空です。';
  }


  return (
    '収納：'
    + entries
      .map(
        (entry) =>
          `${entry.name}×${entry.count}`
      )
      .join('、')
  );
}


/* =========================
   遠距離攻撃用

   弾が使えるか確認
========================= */

export function canUseAmmo(
  weaponId
) {
  const weapon =
    getItem(weaponId);


  if (
    !weapon
    || weapon.weaponType
      !== 'ranged'
  ) {
    return false;
  }


  const ammoItemId =
    weapon.ammoItemId;


  const ammoCost =
    weapon.ammoCost || 1;


  if (
    !ammoItemId
  ) {
    return false;
  }


  return hasItem(
    ammoItemId,
    ammoCost
  );
}


/* =========================
   遠距離攻撃用

   弾を消費
========================= */

export function consumeAmmo(
  weaponId
) {
  const weapon =
    getItem(weaponId);


  if (
    !weapon
    || weapon.weaponType
      !== 'ranged'
  ) {
    return false;
  }


  const ammoItemId =
    weapon.ammoItemId;


  const ammoCost =
    weapon.ammoCost || 1;


  if (
    !hasItem(
      ammoItemId,
      ammoCost
    )
  ) {
    return false;
  }


  return removeItem(
    ammoItemId,
    ammoCost
  ).success;
}