import {
  gameState,
  saveGameState,
  addGameMinutes,
  setLocation
} from './game-state.js';

import {
  addItem,
  removeItem,
  getInventoryEntries,
  getItemCount
} from './inventory.js';

import {
  getItemName
} from './items.js';

const dateEl = document.getElementById('date');
const timeEl = document.getElementById('time');
const locationEl = document.getElementById('location');
const moneyEl = document.getElementById('money');
const sceneArtEl = document.getElementById('scene-art');
const sceneWeatherEl = document.getElementById('scene-weather');
const sceneTitleEl = document.getElementById('scene-title');
const sceneDetailEl = document.getElementById('scene-detail');
const scenePeopleEl = document.getElementById('scene-people');
const messageEl = document.getElementById('message');
const actionsEl = document.getElementById('actions');
const routesEl = document.getElementById('routes');

const newsButton = document.getElementById('news-button');
const peopleButton = document.getElementById('people-button');
const inventoryButton = document.getElementById('inventory-button');
const mapButton = document.getElementById('map-button');

const LOCATIONS = {
  residential: {
    name: '住宅通り',
    detail: '低い木造家屋が並ぶ、港から少し離れた静かな通り。',
    people: ['solveig', 'anders'],
    actions: ['alley_search'],
    routes: ['market', 'station']
  },
  station: {
    name: '駅前',
    detail: 'Rauma線の終着駅。人と荷物が絶えず行き交っている。',
    people: ['olav', 'hakon'],
    actions: ['notice_board', 'cargo_search'],
    routes: ['residential', 'market', 'harbor']
  },
  harbor: {
    name: '港',
    detail: '桟橋、倉庫、荷役場。フィヨルドから冷たい風が吹き込む。',
    people: ['ingrid', 'nils'],
    actions: ['harbor_work', 'shore_search'],
    routes: ['station', 'newspaper']
  },
  market: {
    name: '商店通り',
    detail: '食料品店、小さなパン屋、雑貨を扱う店が並ぶ。',
    people: ['marta', 'johan'],
    actions: ['shop'],
    routes: ['residential', 'station', 'clinic', 'newspaper']
  },
  newspaper: {
    name: '新聞社前',
    detail: '町の小さな新聞社。入口には最新号と号外が貼られている。',
    people: ['ragnhild'],
    actions: ['read_news', 'hear_rumor'],
    routes: ['harbor', 'station', 'market']
  },
  clinic: {
    name: '診療所',
    detail: '小さな診療所。戦況が悪くなるにつれて出入りする人が増えている。',
    people: ['liv', 'doctor'],
    actions: ['clinic_help'],
    routes: ['market', 'residential']
  }
};

const NPCS = {
  solveig: { name: 'ソルヴェイ', role: '隣人' },
  anders: { name: 'アンデシュ', role: '老大工' },
  olav: { name: 'オーラヴ', role: '駅員' },
  hakon: { name: 'ホーコン', role: '荷役係' },
  ingrid: { name: 'イングリッド', role: '港湾労働者' },
  nils: { name: 'ニルス', role: '漁師' },
  marta: { name: 'マルタ', role: '食料品店主' },
  johan: { name: 'ヨハン', role: 'パン職人' },
  ragnhild: { name: 'ラグンヒル', role: '新聞記者' },
  liv: { name: 'リヴ', role: '看護師' },
  doctor: { name: 'オーセン医師', role: '医師' }
};

const SHOP = {
  canned_food: { price: 3 },
  cloth: { price: 2 },
  wood: { price: 1 },
  knife: { price: 12 }
};

const NEWS = [
  { day: 1, title: '南部の戦況、情報錯綜', text: 'ドイツ軍の侵攻後、鉄道と港の動きが急に増えている。町では英国軍が来るという噂も広がっている。' },
  { day: 2, title: '英国軍、Åndalsnesへ', text: '英国軍部隊がÅndalsnesへ上陸。港と駅は兵士と物資で混雑している。' },
  { day: 5, title: '駅周辺への空襲', text: '駅周辺が爆撃を受けた。重要な鉄道貨物は町の外へ移され、住民にも警戒が呼びかけられている。' },
  { day: 8, title: '町中心部に大きな被害', text: '空襲が激化。中心部では火災と建物被害が相次ぎ、一部の商店や住宅が使えなくなった。' },
  { day: 12, title: '撤退の噂', text: '前線の悪化を受け、英国軍がこの地域から退くのではないかという噂が広がっている。' }
];

function ensureTownState() {
  if (!gameState.town || typeof gameState.town !== 'object') {
    gameState.town = {};
  }

  const town = gameState.town;

  if (!LOCATIONS[town.current]) town.current = 'residential';
  if (!Number.isFinite(town.money)) town.money = 18;
  if (!town.flags || typeof town.flags !== 'object') town.flags = {};
  if (!town.metNpcs || typeof town.metNpcs !== 'object') town.metNpcs = {};
  if (!town.relationships || typeof town.relationships !== 'object') town.relationships = {};
  if (!town.daily || typeof town.daily !== 'object') town.daily = {};
  if (!town.shopStock || typeof town.shopStock !== 'object') town.shopStock = {};
  if (!Number.isFinite(town.shopStockDay)) town.shopStockDay = 0;

  refreshShopStock();
  saveGameState();
}

function refreshShopStock() {
  const town = gameState.town;
  if (town.shopStockDay === gameState.day) return;

  town.shopStockDay = gameState.day;
  town.shopStock = {
    canned_food: gameState.day >= 8 ? 1 : Math.max(2, 5 - Math.floor(gameState.day / 3)),
    cloth: gameState.day >= 8 ? 1 : 3,
    wood: 5,
    knife: gameState.day >= 4 && gameState.day < 8 ? 1 : 0
  };
}

function formatTime(totalMinutes) {
  const t = ((Math.floor(totalMinutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}

function actualDateText() {
  const date = new Date(Date.UTC(1940, 3, 15 + gameState.day));
  return `1940/4/${date.getUTCDate()}　${gameState.day}日目`;
}

function currentNews() {
  let result = NEWS[0];
  for (const news of NEWS) {
    if (gameState.day >= news.day) result = news;
  }
  return result;
}

function makeButton(text, handler, className = '') {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = text;
  if (className) button.className = className;
  button.addEventListener('click', handler);
  return button;
}

function advance(minutes) {
  addGameMinutes(minutes);
  refreshShopStock();
}

function updateHud() {
  dateEl.textContent = actualDateText();
  timeEl.textContent = formatTime(gameState.time);
  locationEl.textContent = LOCATIONS[gameState.town.current].name;
  moneyEl.textContent = `${gameState.town.money} kr`;
}

function getAtmosphere() {
  const hour = Math.floor(gameState.time / 60) % 24;
  if (gameState.day >= 8) return '空襲後・煙の匂い';
  if (hour < 7 || hour >= 20) return '暗い・人通り少なめ';
  if (gameState.day >= 2) return '戦時下・人の出入りが多い';
  return '曇天・冷たい風';
}

function sceneDetail(location) {
  if (gameState.day < 8) return location.detail;

  if (gameState.town.current === 'market') return '割れた窓と瓦礫。開いている店は少なく、通りを急ぐ人ばかりだ。';
  if (gameState.town.current === 'station') return '駅舎の一部が傷み、貨物は急いで別の場所へ移されている。';
  if (gameState.town.current === 'harbor') return '桟橋には破損した荷物と軍需品が残り、空を気にする人が多い。';
  return `${location.detail}　窓に板を打ち付けた建物が増えている。`;
}

function renderScene() {
  const id = gameState.town.current;
  const location = LOCATIONS[id];

  sceneArtEl.dataset.scene = id;
  sceneArtEl.classList.toggle('damaged', gameState.day >= 8);
  sceneWeatherEl.textContent = getAtmosphere();
  sceneTitleEl.textContent = location.name;
  sceneDetailEl.textContent = sceneDetail(location);
  scenePeopleEl.textContent = `いる人：${location.people.map(id => NPCS[id].name).join('・')}`;
}

function addTitle(text) {
  const div = document.createElement('div');
  div.className = 'panel-title';
  div.textContent = text;
  actionsEl.appendChild(div);
}

function addLine(text) {
  const div = document.createElement('div');
  div.className = 'panel-line';
  div.textContent = text;
  actionsEl.appendChild(div);
}

function relationship(id, amount = 0) {
  const rel = gameState.town.relationships;
  rel[id] = (rel[id] || 0) + amount;
  return rel[id];
}

function talkNpc(id) {
  const npc = NPCS[id];
  const town = gameState.town;
  town.metNpcs[id] = true;
  relationship(id, 0);
  advance(5);

  let text = '';

  if (id === 'solveig') {
    if (gameState.day >= 3 && town.flags.einar_found && !town.flags.solveig_resolved) {
      town.flags.solveig_resolved = true;
      relationship('solveig', 2);
      const gift = addItem('canned_food', 1);
      text = gift.success
        ? '「見つけてくれたのね……ありがとう。これ、少しだけど持っていって」ソルヴェイから缶詰を1個もらった。'
        : '「見つけてくれたのね……ありがとう。本当に助かったわ」';
    } else if (gameState.day >= 3 && !town.flags.solveig_worry) {
      town.flags.solveig_worry = true;
      text = '「弟のエイナルが昨夜から戻ってこないの。駅の荷役を手伝っていたはずなんだけど……」';
    } else if (town.flags.einar_seen && !town.flags.einar_found) {
      text = '「港へ行ったの？　お願い、何かわかったら教えて」';
    } else if (town.flags.solveig_resolved) {
      text = '「エイナルはまだ足を引きずってるけど、家にいるわ。あなたのおかげよ」';
    } else {
      text = '「朝から汽笛が多いわね。こんなに町が騒がしいのは久しぶり」';
    }
  } else if (id === 'hakon') {
    if (town.flags.solveig_worry && !town.flags.einar_seen) {
      town.flags.einar_seen = true;
      text = '「エイナル？　昨日の夕方、港へ貨物を運ぶ手伝いに行った。戻ったところは見てないな」';
    } else {
      text = gameState.day >= 5
        ? '「貨物をここに置いておけない。空から丸見えだ。夜のうちに動かしてる」'
        : '「人手が足りない。列車が着くたび、荷物が山になる」';
    }
  } else if (id === 'ingrid') {
    if (town.flags.einar_seen && !town.flags.einar_found) {
      town.flags.einar_found = true;
      relationship('ingrid', 1);
      text = '「若い駅員なら倉庫裏にいる。荷箱が崩れて脚を痛めたの。診療所へ連れていくところよ」';
    } else {
      text = gameState.day >= 2
        ? '「兵士も荷物も次々来る。港が町じゃなくて軍の場所みたいになってきた」'
        : '「海は静かだけど、今日は船の出入りが変に多いね」';
    }
  } else if (id === 'olav') {
    text = gameState.day >= 5
      ? '「時刻表なんてもう意味がない。列車は軍と避難民と荷物で動いてる」'
      : '「南から来る列車は遅れている。駅から先の話は誰もはっきり言わない」';
  } else if (id === 'marta') {
    text = gameState.day >= 8
      ? '「今日はこれだけ。次の荷が来る保証なんてないよ。必要な分だけにして」'
      : '「缶詰と布はまだある。でも買い占めはなし。みんな必要なんだから」';
  } else if (id === 'johan') {
    text = gameState.day >= 6
      ? '「小麦粉が減ってる。明日もパンを焼けるかは分からない」'
      : '「戦争だろうが朝は来る。朝が来ればパンを焼く。それだけさ」';
  } else if (id === 'ragnhild') {
    text = gameState.day >= 8
      ? '「記事を書く前に窓を塞ぐ仕事が増えた。でも町で起きたことは残しておかないと」'
      : '「公式発表より、駅と港を歩いた方が早い。噂の半分は嘘だけどね」';
  } else if (id === 'liv') {
    if (gameState.day >= 4 && !town.flags.clinic_need) {
      town.flags.clinic_need = true;
      text = '「包帯に使える布が足りないの。きれいな布があったら持ってきてもらえる？」';
    } else if (town.flags.clinic_helped) {
      text = '「この前の布、もう使わせてもらったわ。助かった」';
    } else {
      text = '「怪我人が増えてる。眠れてない人も多いわ」';
    }
  } else if (id === 'doctor') {
    text = gameState.day >= 6
      ? '「妙な発熱と錯乱を起こす患者がいる。戦傷とは違う。まだ原因が分からない」'
      : '「今は軽い怪我でも放っておかない方がいい。薬も人手も限られている」';
  } else if (id === 'anders') {
    text = gameState.day >= 8
      ? '「壊れた窓も扉も直せる。木さえあればな。町は修理する場所だらけだ」'
      : '「若い頃はこの辺も今より家が少なかった。駅ができて、町が一気に変わったよ」';
  } else if (id === 'nils') {
    text = gameState.day >= 6
      ? '「昨夜、岸で人影を見た。呼んでも返事がない。酔っぱらいにしちゃ歩き方が変だった」'
      : '「魚はいるさ。問題は獲った後に誰が買えるかだ」';
  }

  messageEl.textContent = `${npc.name}：${text}`;
  saveGameState();
  renderAll(false);
}

function dailyAvailable(key) {
  return gameState.town.daily[key] !== gameState.day;
}

function markDaily(key) {
  gameState.town.daily[key] = gameState.day;
}

function performAction(action) {
  const town = gameState.town;

  if (action === 'read_news' || action === 'notice_board') {
    advance(5);
    const news = currentNews();
    messageEl.textContent = `【${news.title}】${news.text}`;
  }

  if (action === 'hear_rumor') {
    advance(5);
    const rumors = gameState.day >= 6
      ? ['夜の港で、呼びかけても返事をしない人影を見たという話。', '診療所に妙な高熱の患者が運ばれたらしい。', '軍が何かを隠している、と酒場で話していた人がいる。']
      : ['港にさらに船が来るらしい。', '駅には夜中まで貨物列車が入っている。', '食料品店では入荷が遅れ始めている。'];
    messageEl.textContent = `噂：${rumors[(gameState.day + gameState.time) % rumors.length | 0]}`;
  }

  if (action === 'harbor_work') {
    if (!dailyAvailable('harbor_work')) {
      messageEl.textContent = '今日はもう十分手伝いました。';
    } else {
      markDaily('harbor_work');
      advance(25);
      town.money += 3;
      relationship('ingrid', 1);
      messageEl.textContent = '荷下ろしを手伝った。3 kr受け取った。';
    }
  }

  if (action === 'shore_search') {
    if (!dailyAvailable('shore_search')) {
      messageEl.textContent = '今日はもうこの辺を探しました。';
    } else {
      markDaily('shore_search');
      advance(10);
      const result = addItem('small_stone', 2);
      messageEl.textContent = result.success ? `岸辺で小石を${result.added || 2}個拾った。` : '持ち物がいっぱいで拾えませんでした。';
    }
  }

  if (action === 'alley_search') {
    if (!dailyAvailable('alley_search')) {
      messageEl.textContent = '今日はもう路地を探しました。';
    } else {
      markDaily('alley_search');
      advance(12);
      const itemId = gameState.day % 2 === 0 ? 'cloth' : 'small_stone';
      const result = addItem(itemId, 1);
      messageEl.textContent = result.success ? `${getItemName(itemId)}を1個見つけた。` : '使えそうな物はあったが、これ以上持てません。';
    }
  }

  if (action === 'cargo_search') {
    advance(7);
    messageEl.textContent = gameState.day >= 5
      ? '貨物置場はほとんど空だ。木箱には急いで移動させた跡が残っている。'
      : '木箱、郵袋、軍用らしい荷物。宛先を塗りつぶした箱も混じっている。';
  }

  if (action === 'clinic_help') {
    if (!town.flags.clinic_need) {
      messageEl.textContent = '今は頼まれている物はありません。';
    } else if (town.flags.clinic_helped) {
      messageEl.textContent = '渡した布はすでに診療所で使われています。';
    } else if (getItemCount('cloth') < 1) {
      messageEl.textContent = '渡せる布を持っていません。';
    } else {
      const removed = removeItem('cloth', 1);
      if (removed.success) {
        town.flags.clinic_helped = true;
        relationship('liv', 2);
        advance(5);
        messageEl.textContent = '布を1枚、診療所へ渡した。リヴが何度も礼を言った。';
      }
    }
  }

  saveGameState();
  renderAll(false);
}

function buyItem(itemId) {
  const town = gameState.town;
  const info = SHOP[itemId];
  const stock = town.shopStock[itemId] || 0;

  if (stock <= 0) {
    messageEl.textContent = '今日は売り切れです。';
    return;
  }

  if (town.money < info.price) {
    messageEl.textContent = 'お金が足りません。';
    return;
  }

  const result = addItem(itemId, 1);
  if (!result.success) {
    messageEl.textContent = 'これ以上持てません。';
    return;
  }

  town.money -= info.price;
  town.shopStock[itemId] -= 1;
  advance(3);
  messageEl.textContent = `${getItemName(itemId)}を1個買った。`;
  saveGameState();
  renderAll(false);
}

function renderShop() {
  actionsEl.replaceChildren();
  addTitle('マルタの店');

  for (const [itemId, info] of Object.entries(SHOP)) {
    const stock = gameState.town.shopStock[itemId] || 0;
    actionsEl.appendChild(
      makeButton(`${getItemName(itemId)}　${info.price} kr　残${stock}`, () => buyItem(itemId), stock > 0 ? 'primary' : '')
    );
  }

  actionsEl.appendChild(makeButton('店を出る', () => renderAll(false)));
}

function actionLabel(action) {
  return {
    alley_search: '路地を探す',
    notice_board: '掲示板を読む',
    cargo_search: '貨物置場を見る',
    harbor_work: '荷下ろしを手伝う',
    shore_search: '岸辺を探す',
    shop: '店で買う',
    read_news: '最新号を読む',
    hear_rumor: '噂を聞く',
    clinic_help: '診療所を手伝う'
  }[action];
}

function renderActions() {
  actionsEl.replaceChildren();
  const location = LOCATIONS[gameState.town.current];

  addTitle('この場所ですること');

  for (const id of location.people) {
    const npc = NPCS[id];
    actionsEl.appendChild(makeButton(`${npc.name}に話す\n${npc.role}`, () => talkNpc(id), 'primary'));
  }

  for (const action of location.actions) {
    if (action === 'shop') {
      actionsEl.appendChild(makeButton(actionLabel(action), renderShop));
    } else {
      actionsEl.appendChild(makeButton(actionLabel(action), () => performAction(action)));
    }
  }
}

function moveTo(id) {
  if (!LOCATIONS[id] || id === gameState.town.current) return;

  advance(10);
  gameState.town.current = id;
  setLocation(LOCATIONS[id].name);

  if (gameState.day >= 8 && gameState.town.daily.air_raid !== gameState.day) {
    gameState.town.daily.air_raid = gameState.day;
    advance(15);
    messageEl.textContent = '警報。低い爆音が町の上を通り、しばらく建物の陰で待った。';
  } else {
    messageEl.textContent = `${LOCATIONS[id].name}へ移動した。`;
  }

  saveGameState();
  renderAll(false);
}

function goHome() {
  advance(10);
  setLocation('自宅');
  saveGameState();
  window.location.href = 'zombie_home.html';
}

function renderRoutes() {
  routesEl.replaceChildren();
  const location = LOCATIONS[gameState.town.current];

  for (const id of location.routes) {
    routesEl.appendChild(makeButton(`→ ${LOCATIONS[id].name}`, () => moveTo(id)));
  }

  routesEl.appendChild(makeButton('自宅へ戻る', goHome, 'home'));
}

function showNewsPanel() {
  actionsEl.replaceChildren();
  const news = currentNews();
  addTitle('今日のニュース');
  addLine(`【${news.title}】\n${news.text}`);
  addLine('ニュースは町の状況やNPCの会話に反映されます。');
}

function npcStatus(id) {
  const flags = gameState.town.flags;
  if (id === 'solveig' && flags.solveig_resolved) return '弟が戻り、少し落ち着いている';
  if (id === 'solveig' && flags.solveig_worry) return '弟エイナルを心配している';
  if (id === 'liv' && flags.clinic_helped) return '診療所で負傷者の対応中';
  if (id === 'liv' && flags.clinic_need) return '布を必要としている';
  if (gameState.day >= 8) return '空襲後の対応に追われている';
  return '町で普段の仕事を続けている';
}

function showPeoplePanel() {
  actionsEl.replaceChildren();
  addTitle('知っている人');

  const met = Object.keys(gameState.town.metNpcs).filter(id => gameState.town.metNpcs[id]);
  if (!met.length) {
    addLine('まだ名前を知っている人はいません。町で話しかけてみてください。');
    return;
  }

  for (const id of met) {
    const npc = NPCS[id];
    addLine(`${npc.name}（${npc.role}）　親しさ ${relationship(id, 0)}\n${npcStatus(id)}`);
  }
}

function showInventoryPanel() {
  actionsEl.replaceChildren();
  addTitle(`持ち物　所持金 ${gameState.town.money} kr`);
  const entries = getInventoryEntries();
  if (!entries.length) {
    addLine('持ち物なし');
    return;
  }
  for (const entry of entries) addLine(`${entry.name} ×${entry.count}`);
}

function showMapPanel() {
  actionsEl.replaceChildren();
  addTitle('町の地点');
  for (const [id, location] of Object.entries(LOCATIONS)) {
    actionsEl.appendChild(makeButton(location.name, () => moveTo(id), id === gameState.town.current ? 'primary' : ''));
  }
  actionsEl.appendChild(makeButton('自宅へ戻る', goHome, 'primary'));
}

function renderAll(setMessage = true) {
  updateHud();
  renderScene();
  renderActions();
  renderRoutes();
  if (setMessage) messageEl.textContent = '町へ出ました。人に話す、店を見る、情報を集める、物資を探すことができます。';
}

newsButton.addEventListener('click', showNewsPanel);
peopleButton.addEventListener('click', showPeoplePanel);
inventoryButton.addEventListener('click', showInventoryPanel);
mapButton.addEventListener('click', showMapPanel);

ensureTownState();
setLocation(LOCATIONS[gameState.town.current].name);
saveGameState();
renderAll(true);
