import {
  getItem,
  getItemName,
  getWeaponDamage,
  getWeaponRange,
  isMeleeWeapon,
  isRangedWeapon
} from './items.js';

import {
  canUseAmmo,
  consumeAmmo
} from './inventory.js';

import {
  gameState,
  saveGameState,
  damagePlayer,
  markZombieDefeated
} from './game-state.js';

import {
  damageZombie,
  pushZombie,
  getZombieActionInterval,
  getZombieHpText,
  isZombieAlive
} from './zombie.js';


/* =========================
   素手
========================= */

const FISTS = {
  id: 'fists',
  name: '素手',
  damage: 1
};


/* =========================
   戦闘状態
========================= */

export function createCombatState() {
  return {
    active: false,

    zombie: null,

    playerActionCount: 0,

    zombieActionInterval: 1,

    lastMessage: ''
  };
}


/* =========================
   現在の近接武器
========================= */

export function getCurrentMeleeWeapon() {
  const itemId =
    gameState.equipment.meleeWeaponId;


  if (
    !itemId
    || !isMeleeWeapon(itemId)
  ) {
    return FISTS;
  }


  const item =
    getItem(itemId);


  if (!item) {
    return FISTS;
  }


  return item;
}


/* =========================
   現在の遠距離武器
========================= */

export function getCurrentRangedWeapon() {
  const itemId =
    gameState.equipment.rangedWeaponId;


  if (
    !itemId
    || !isRangedWeapon(itemId)
  ) {
    return null;
  }


  return getItem(itemId);
}


/* =========================
   戦闘開始
========================= */

export function startCombat({
  combatState,
  zombie,
  lightLevel,
  strongArtificialLight = false
}) {
  if (
    !combatState
    || !zombie
    || !isZombieAlive(zombie)
  ) {
    return false;
  }


  combatState.active = true;

  combatState.zombie = zombie;

  combatState.playerActionCount = 0;

  combatState.zombieActionInterval =
    getZombieActionInterval(
      lightLevel,
      strongArtificialLight
    );


  combatState.lastMessage =
    `${zombie.name}がいる。`;


  return true;
}


/* =========================
   戦闘終了
========================= */

export function endCombat(
  combatState
) {
  if (!combatState) {
    return;
  }


  combatState.active = false;

  combatState.zombie = null;

  combatState.playerActionCount = 0;

  combatState.lastMessage = '';
}


/* =========================
   戦闘中か
========================= */

export function isInCombat(
  combatState
) {
  return Boolean(
    combatState
    && combatState.active
    && combatState.zombie
    && isZombieAlive(
      combatState.zombie
    )
  );
}


/* =========================
   ゾンビ行動カウント
========================= */

function shouldZombieAct(
  combatState
) {
  combatState.playerActionCount += 1;


  if (
    combatState.playerActionCount
    >= combatState.zombieActionInterval
  ) {
    combatState.playerActionCount = 0;

    return true;
  }


  return false;
}


/* =========================
   ゾンビ攻撃
========================= */

function zombieAttack(
  combatState
) {
  const zombie =
    combatState.zombie;


  if (
    !zombie
    || !isZombieAlive(zombie)
  ) {
    return {
      attacked: false,
      damage: 0,
      message: ''
    };
  }


  const damage =
    Math.max(
      1,
      Math.floor(
        zombie.attackDamage || 1
      )
    );


  damagePlayer(
    damage
  );


  return {
    attacked: true,

    damage,

    message:
      `ゾンビの攻撃。${damage}ダメージ。`
  };
}


/* =========================
   近接攻撃

   素手
   木の棒
   ナイフ
   斧
========================= */

export function playerAttack({
  combatState,
  addGameMinutes
}) {
  if (
    !isInCombat(
      combatState
    )
  ) {
    return null;
  }


  const zombie =
    combatState.zombie;


  const weapon =
    getCurrentMeleeWeapon();


  const damage =
    weapon.id === 'fists'
      ? FISTS.damage
      : getWeaponDamage(
          weapon.id
        );


  const attackResult =
    damageZombie(
      zombie,
      damage
    );


  if (
    typeof addGameMinutes
    === 'function'
  ) {
    addGameMinutes(2);
  }


  let message =
    `${weapon.name}で攻撃。`
    + `${attackResult.damage}ダメージ。`;


  /* 倒した */

  if (
    attackResult.defeated
  ) {
    markZombieDefeated(
      zombie.id
    );


    message +=
      `${zombie.name}を倒した。`;


    endCombat(
      combatState
    );


    return {
      type: 'attack',

      defeated: true,

      zombieActed: false,

      playerDamage: 0,

      message
    };
  }


  /* ゾンビの番 */

  let zombieActed = false;

  let playerDamage = 0;


  if (
    shouldZombieAct(
      combatState
    )
  ) {
    const zombieResult =
      zombieAttack(
        combatState
      );


    zombieActed =
      zombieResult.attacked;

    playerDamage =
      zombieResult.damage;


    if (
      zombieResult.message
    ) {
      message +=
        ` ${zombieResult.message}`;
    }
  }


  message +=
    ` ${getZombieHpText(zombie)}`;


  combatState.lastMessage =
    message;


  saveGameState();


  return {
    type: 'attack',

    defeated: false,

    zombieActed,

    playerDamage,

    message
  };
}


/* =========================
   押しのける
========================= */

export function playerPush({
  combatState,
  playerX,
  addGameMinutes
}) {
  if (
    !isInCombat(
      combatState
    )
  ) {
    return null;
  }


  const zombie =
    combatState.zombie;


  pushZombie(
    zombie,
    playerX,
    90
  );


  if (
    typeof addGameMinutes
    === 'function'
  ) {
    addGameMinutes(1);
  }


  let message =
    `${zombie.name}を押しのけた。`;


  let zombieActed = false;

  let playerDamage = 0;


  if (
    shouldZombieAct(
      combatState
    )
  ) {
    const zombieResult =
      zombieAttack(
        combatState
      );


    zombieActed =
      zombieResult.attacked;

    playerDamage =
      zombieResult.damage;


    if (
      zombieResult.message
    ) {
      message +=
        ` ${zombieResult.message}`;
    }
  }


  endCombat(
    combatState
  );


  saveGameState();


  return {
    type: 'push',

    escaped: true,

    zombieActed,

    playerDamage,

    message
  };
}


/* =========================
   逃げる
========================= */

export function playerEscape({
  combatState,
  addGameMinutes
}) {
  if (
    !isInCombat(
      combatState
    )
  ) {
    return null;
  }


  if (
    typeof addGameMinutes
    === 'function'
  ) {
    addGameMinutes(1);
  }


  let message =
    'ゾンビから逃げた。';


  let zombieActed = false;

  let playerDamage = 0;


  if (
    shouldZombieAct(
      combatState
    )
  ) {
    const zombieResult =
      zombieAttack(
        combatState
      );


    zombieActed =
      zombieResult.attacked;

    playerDamage =
      zombieResult.damage;


    if (
      zombieResult.message
    ) {
      message +=
        ` ${zombieResult.message}`;
    }
  }


  endCombat(
    combatState
  );


  saveGameState();


  return {
    type: 'escape',

    escaped: true,

    zombieActed,

    playerDamage,

    message
  };
}


/* =========================
   遠距離攻撃対象を探す

   プレイヤーから射程内で
   一番近いゾンビ
========================= */

export function findRangedTarget({
  zombies,
  playerX,
  range
}) {
  let nearest = null;

  let nearestDistance =
    Infinity;


  for (
    const zombie of zombies
  ) {
    if (
      !isZombieAlive(zombie)
    ) {
      continue;
    }


    const distance =
      Math.abs(
        zombie.x - playerX
      );


    if (
      distance <= range
      && distance < nearestDistance
    ) {
      nearest = zombie;

      nearestDistance =
        distance;
    }
  }


  return nearest;
}


/* =========================
   遠距離攻撃

   小石
   ↓
   ダメージ1
   小石1個消費

   後で
   弓
   拳銃
   なども同じ処理
========================= */

export function playerRangedAttack({
  zombies,
  playerX,
  addGameMinutes
}) {
  const weapon =
    getCurrentRangedWeapon();


  if (!weapon) {
    return {
      success: false,

      reason: 'no-ranged-weapon',

      message:
        '遠距離攻撃できる物を装備していません。'
    };
  }


  const range =
    getWeaponRange(
      weapon.id
    );


  const target =
    findRangedTarget({
      zombies,

      playerX,

      range
    });


  if (!target) {
    return {
      success: false,

      reason: 'no-target',

      message:
        '射程内にゾンビはいません。'
    };
  }


  if (
    !canUseAmmo(
      weapon.id
    )
  ) {
    return {
      success: false,

      reason: 'no-ammo',

      message:
        `${getItemName(weapon.id)}がありません。`
    };
  }


  const consumed =
    consumeAmmo(
      weapon.id
    );


  if (!consumed) {
    return {
      success: false,

      reason: 'no-ammo',

      message:
        '攻撃に使う物がありません。'
    };
  }


  const damage =
    getWeaponDamage(
      weapon.id
    );


  const result =
    damageZombie(
      target,
      damage
    );


  if (
    typeof addGameMinutes
    === 'function'
  ) {
    addGameMinutes(2);
  }


  let message =
    `${weapon.name}で遠距離攻撃。`
    + `${result.damage}ダメージ。`;


  if (
    result.defeated
  ) {
    markZombieDefeated(
      target.id
    );


    message +=
      `${target.name}を倒した。`;
  }

  else {
    message +=
      ` ${getZombieHpText(target)}`;
  }


  saveGameState();


  return {
    success: true,

    target,

    damage:
      result.damage,

    defeated:
      result.defeated,

    message
  };
}


/* =========================
   戦闘表示
========================= */

export function getCombatStatusText(
  combatState
) {
  if (
    !isInCombat(
      combatState
    )
  ) {
    return '';
  }


  const zombie =
    combatState.zombie;


  const weapon =
    getCurrentMeleeWeapon();


  return (
    `${getZombieHpText(zombie)}`
    + ` / 自分 HP `
    + `${gameState.player.hp}`
    + `/`
    + `${gameState.player.maxHp}`
    + ` / 武器：`
    + `${weapon.name}`
  );
}


/* =========================
   遠距離武器表示
========================= */

export function getRangedWeaponText() {
  const weapon =
    getCurrentRangedWeapon();


  if (!weapon) {
    return '遠距離：なし';
  }


  const ammoItemId =
    weapon.ammoItemId;


  const count =
    gameState.inventory[
      ammoItemId
    ]
    || 0;


  return (
    `遠距離：${weapon.name}`
    + ` ×${count}`
  );
}