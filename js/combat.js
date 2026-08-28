import {
  damageZombie,
  pushZombie,
  getZombieActionInterval,
  getZombieHpText,
  isZombieAlive
} from './zombie.js';


/* =========================
   武器
========================= */

export const WEAPONS = {
  fists: {
    id: 'fists',
    name: '素手',
    damage: 1
  },

  stick: {
    id: 'stick',
    name: '木の棒',
    damage: 2
  },

  knife: {
    id: 'knife',
    name: 'ナイフ',
    damage: 3
  },

  axe: {
    id: 'axe',
    name: '斧',
    damage: 5
  }
};


/* =========================
   戦闘状態を作る
========================= */

export function createCombatState() {
  return {
    active: false,

    zombie: null,

    playerActionCount: 0,

    zombieActionInterval: 1,

    weaponId: 'fists',

    lastMessage: ''
  };
}


/* =========================
   武器取得
========================= */

export function getWeapon(
  combatState
) {
  const weapon =
    WEAPONS[
      combatState.weaponId
    ];

  return (
    weapon
    || WEAPONS.fists
  );
}


/* =========================
   武器変更
========================= */

export function setWeapon(
  combatState,
  weaponId
) {
  if (
    !WEAPONS[weaponId]
  ) {
    return false;
  }

  combatState.weaponId =
    weaponId;

  return true;
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

  combatState.active =
    true;

  combatState.zombie =
    zombie;

  combatState.playerActionCount =
    0;

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
  combatState.active =
    false;

  combatState.zombie =
    null;

  combatState.playerActionCount =
    0;

  combatState.lastMessage =
    '';
}


/* =========================
   ゾンビが行動するか
========================= */

function shouldZombieAct(
  combatState
) {
  if (
    !combatState.active
    || !combatState.zombie
  ) {
    return false;
  }

  combatState.playerActionCount +=
    1;

  return (
    combatState.playerActionCount
    >= combatState.zombieActionInterval
  );
}


/* =========================
   ゾンビ行動後リセット
========================= */

function resetZombieCounter(
  combatState
) {
  combatState.playerActionCount =
    0;
}


/* =========================
   ゾンビ攻撃
========================= */

function zombieAttack({
  combatState,
  playerState
}) {
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
      0,
      zombie.attackDamage || 1
    );

  if (
    typeof playerState.hp
    !== 'number'
  ) {
    playerState.hp =
      10;
  }

  playerState.hp -=
    damage;

  if (
    playerState.hp < 0
  ) {
    playerState.hp =
      0;
  }

  return {
    attacked: true,

    damage,

    message:
      `ゾンビの攻撃。${damage}ダメージ。`
  };
}


/* =========================
   プレイヤー攻撃
========================= */

export function playerAttack({
  combatState,
  playerState,
  addGameMinutes
}) {
  if (
    !combatState.active
    || !combatState.zombie
  ) {
    return null;
  }

  const zombie =
    combatState.zombie;

  const weapon =
    getWeapon(
      combatState
    );

  const result =
    damageZombie(
      zombie,
      weapon.damage
    );

  if (
    typeof addGameMinutes
    === 'function'
  ) {
    addGameMinutes(2);
  }

  let message =
    `${weapon.name}で攻撃。`
    + `${result.damage}ダメージ。`;


  if (
    result.defeated
  ) {
    message +=
      `${zombie.name}を倒した。`;

    endCombat(
      combatState
    );

    return {
      type: 'attack',

      success: true,

      defeated: true,

      escaped: false,

      zombieActed: false,

      playerDamage: 0,

      message
    };
  }


  let zombieActed =
    false;

  let playerDamage =
    0;


  if (
    shouldZombieAct(
      combatState
    )
  ) {
    resetZombieCounter(
      combatState
    );

    const zombieResult =
      zombieAttack({
        combatState,
        playerState
      });

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


  return {
    type: 'attack',

    success: true,

    defeated: false,

    escaped: false,

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
  playerState,
  playerX,
  addGameMinutes
}) {
  if (
    !combatState.active
    || !combatState.zombie
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


  let zombieActed =
    false;

  let playerDamage =
    0;


  if (
    shouldZombieAct(
      combatState
    )
  ) {
    resetZombieCounter(
      combatState
    );

    const zombieResult =
      zombieAttack({
        combatState,
        playerState
      });

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


  return {
    type: 'push',

    success: true,

    defeated: false,

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
  playerState,
  addGameMinutes
}) {
  if (
    !combatState.active
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


  let zombieActed =
    false;

  let playerDamage =
    0;


  if (
    shouldZombieAct(
      combatState
    )
  ) {
    resetZombieCounter(
      combatState
    );

    const zombieResult =
      zombieAttack({
        combatState,
        playerState
      });

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


  return {
    type: 'escape',

    success: true,

    defeated: false,

    escaped: true,

    zombieActed,

    playerDamage,

    message
  };
}


/* =========================
   戦闘表示用テキスト
========================= */

export function getCombatStatusText(
  combatState,
  playerState
) {
  if (
    !combatState.active
    || !combatState.zombie
  ) {
    return '';
  }

  const zombie =
    combatState.zombie;

  const playerHp =
    typeof playerState.hp
    === 'number'
      ? playerState.hp
      : 10;

  const weapon =
    getWeapon(
      combatState
    );

  return (
    `${getZombieHpText(zombie)}`
    + ` / 自分 HP ${playerHp}`
    + ` / 武器：${weapon.name}`
  );
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