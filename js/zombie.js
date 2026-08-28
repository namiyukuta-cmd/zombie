/* =========================
   ゾンビ基本データ
========================= */

export const ZOMBIE_TYPES = {
  normal: {
    id: 'normal',
    name: 'ゾンビ',

    maxHp: 6,

    attackDamage: 1,

    encounterDistance: 42,

    color: '#596457'
  }
};


/* =========================
   ゾンビ生成
========================= */

export function createZombie({
  id,
  type = 'normal',
  x
}) {
  const zombieType =
    ZOMBIE_TYPES[type];

  if (!zombieType) {
    throw new Error(
      `Unknown zombie type: ${type}`
    );
  }

  return {
    id,

    type,

    name:
      zombieType.name,

    x,

    hp:
      zombieType.maxHp,

    maxHp:
      zombieType.maxHp,

    attackDamage:
      zombieType.attackDamage,

    encounterDistance:
      zombieType.encounterDistance,

    color:
      zombieType.color,

    alive: true,

    pushed: false
  };
}


/* =========================
   最初に配置するゾンビ
========================= */

export function createDefaultZombies() {
  return [
    createZombie({
      id: 'zombie_01',
      type: 'normal',
      x: 900
    }),

    createZombie({
      id: 'zombie_02',
      type: 'normal',
      x: 1320
    }),

    createZombie({
      id: 'zombie_03',
      type: 'normal',
      x: 1800
    })
  ];
}


/* =========================
   生存確認
========================= */

export function isZombieAlive(
  zombie
) {
  return Boolean(
    zombie
    && zombie.alive
    && zombie.hp > 0
  );
}


/* =========================
   プレイヤーとの距離
========================= */

export function getZombieDistance(
  zombie,
  playerX
) {
  if (!zombie) {
    return Infinity;
  }

  return Math.abs(
    zombie.x - playerX
  );
}


/* =========================
   近くのゾンビを探す
========================= */

export function findNearbyZombie(
  zombies,
  playerX
) {
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
      getZombieDistance(
        zombie,
        playerX
      );

    if (
      distance
      <= zombie.encounterDistance
      && distance
      < nearestDistance
    ) {
      nearest =
        zombie;

      nearestDistance =
        distance;
    }
  }

  return nearest;
}


/* =========================
   光によるゾンビ行動頻度

   戻り値は、

   プレイヤーが何回行動すると
   ゾンビが1回行動するか

   4 = 非常に鈍い
   2 = 鈍い
   1 = 通常
========================= */

export function getZombieActionInterval(
  lightLevel,
  strongArtificialLight = false
) {
  /*
    直射日光・非常に明るい
  */

  if (
    lightLevel >= 0.8
  ) {
    return 4;
  }


  /*
    曇り・日陰・夕方など
  */

  if (
    lightLevel >= 0.3
  ) {
    return 2;
  }


  /*
    夜でもランタンなどの
    強い光がある
  */

  if (
    strongArtificialLight
  ) {
    return 2;
  }


  /*
    夜・暗所
  */

  return 1;
}


/* =========================
   ゾンビにダメージ
========================= */

export function damageZombie(
  zombie,
  damage
) {
  if (
    !isZombieAlive(zombie)
  ) {
    return {
      damage: 0,
      defeated: true
    };
  }

  const actualDamage =
    Math.max(
      0,
      Math.floor(damage)
    );

  zombie.hp -=
    actualDamage;

  if (
    zombie.hp <= 0
  ) {
    zombie.hp = 0;

    zombie.alive =
      false;

    return {
      damage:
        actualDamage,

      defeated:
        true
    };
  }

  return {
    damage:
      actualDamage,

    defeated:
      false
  };
}


/* =========================
   押しのける
========================= */

export function pushZombie(
  zombie,
  playerX,
  distance = 90
) {
  if (
    !isZombieAlive(zombie)
  ) {
    return;
  }

  const direction =
    zombie.x >= playerX
      ? 1
      : -1;

  zombie.x +=
    direction * distance;

  zombie.pushed =
    true;
}


/* =========================
   HP表示
========================= */

export function getZombieHpText(
  zombie
) {
  if (!zombie) {
    return '';
  }

  return (
    `${zombie.name} `
    + `HP ${zombie.hp}/${zombie.maxHp}`
  );
}


/* =========================
   描画
========================= */

export function drawZombie({
  ctx,
  zombie,
  cameraX,
  groundY
}) {
  if (
    !ctx
    || !isZombieAlive(zombie)
  ) {
    return;
  }

  const x =
    Math.round(
      zombie.x - cameraX
    );

  /*
    画面外なら描かない
  */

  if (
    x < -60
    || x > ctx.canvas.clientWidth + 60
  ) {
    return;
  }


  /*
    仮のゾンビ表示

    後でPNG画像に差し替える
  */

  ctx.save();


  /* 脚 */

  ctx.fillStyle =
    '#414841';

  ctx.fillRect(
    x - 11,
    groundY - 31,
    8,
    31
  );

  ctx.fillRect(
    x + 3,
    groundY - 31,
    8,
    31
  );


  /* 体 */

  ctx.fillStyle =
    zombie.color;

  ctx.fillRect(
    x - 15,
    groundY - 70,
    30,
    42
  );


  /* 腕 */

  ctx.fillRect(
    x - 26,
    groundY - 61,
    14,
    7
  );

  ctx.fillRect(
    x + 12,
    groundY - 61,
    18,
    7
  );


  /* 頭 */

  ctx.fillStyle =
    '#87907f';

  ctx.beginPath();

  ctx.arc(
    x,
    groundY - 84,
    15,
    0,
    Math.PI * 2
  );

  ctx.fill();


  /* 目 */

  ctx.fillStyle =
    '#353a34';

  ctx.fillRect(
    x - 8,
    groundY - 88,
    4,
    4
  );

  ctx.fillRect(
    x + 4,
    groundY - 88,
    4,
    4
  );


  ctx.restore();
}


/* =========================
   全ゾンビ描画
========================= */

export function drawZombies({
  ctx,
  zombies,
  cameraX,
  groundY
}) {
  for (
    const zombie of zombies
  ) {
    drawZombie({
      ctx,
      zombie,
      cameraX,
      groundY
    });
  }
}