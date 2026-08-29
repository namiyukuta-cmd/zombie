/* =========================================================
   HOME LOADER
   js/HOME/home-loader.js

   ・HOME背景表示
   ・DECO読み込み
   ・タップポイント生成
   ・NPC表示
   ・HOMEイベント進行
   ・イベント途中保存
========================================================= */


import {
  HOME_CONFIG,
  getHomeDeco,
  getHomeNPC,
  createHomeEvent,
  createDefaultHomeState
} from './home-data.js';



/* =========================================================
   保存
========================================================= */

const HOME_SAVE_KEY = 'zombie-home-state-v1';


function loadHomeState() {

  try {

    const raw =
      localStorage.getItem(HOME_SAVE_KEY);

    if (!raw) {
      return createDefaultHomeState();
    }


    const saved =
      JSON.parse(raw);


    const defaultState =
      createDefaultHomeState();


    return {

      ...defaultState,
      ...saved,

      flags: {
        ...defaultState.flags,
        ...(saved.flags || {})
      }

    };

  } catch (error) {

    console.error(
      'HOME save load error:',
      error
    );

    return createDefaultHomeState();

  }

}



function saveHomeState() {

  try {

    localStorage.setItem(
      HOME_SAVE_KEY,
      JSON.stringify(homeState)
    );

  } catch (error) {

    console.error(
      'HOME save error:',
      error
    );

  }

}



let homeState =
  loadHomeState();



/* =========================================================
   DOM
========================================================= */

const $ =
  (id) => document.getElementById(id);


/* HOME */

const homeBackground =
  $('home-background');

const hotspotLayer =
  $('hotspot-layer');

const npcLayer =
  $('npc-layer');

const eventImageLayer =
  $('event-image-layer');


/* HUD */

const dayElement =
  $('day');

const timeElement =
  $('time');

const locationName =
  $('location-name');


/* メッセージ */

const messageElement =
  $('message');


/* interaction */

const interactionPanel =
  $('interaction-panel');

const interactionTitle =
  $('interaction-title');

const interactionText =
  $('interaction-text');

const interactionActions =
  $('interaction-actions');


/* dialogue */

const dialoguePanel =
  $('dialogue-panel');

const dialogueCharacterImage =
  $('dialogue-character-image');

const dialogueCharacterName =
  $('dialogue-character-name');

const dialogueText =
  $('dialogue-text');

const dialogueActions =
  $('dialogue-actions');

const dialogueClose =
  $('dialogue-close');


/* HOME event */

const homeEventPanel =
  $('home-event-panel');

const homeEventImageArea =
  $('home-event-image-area');

const homeEventImage =
  $('home-event-image');

const homeEventTitle =
  $('home-event-title');

const homeEventText =
  $('home-event-text');

const homeEventActions =
  $('home-event-actions');


/* 下部メニュー */

const inventoryButton =
  $('inventory-button');

const statusButton =
  $('status-button');

const mapButton =
  $('map-button');


/* inventory */

const inventoryPanel =
  $('inventory-panel');

const inventoryClose =
  $('inventory-close');


/* status */

const statusPanel =
  $('status-panel');

const statusClose =
  $('status-close');



/* =========================================================
   現在イベント
========================================================= */

let currentEvent = null;

let currentEventStep = 0;


/*
  event001で、

  玄関
  ↓
  ドアが開く
  ↓
  HOME

  と背景が変わるため、
  イベント背景を記憶しておく。
*/

let currentEventBackground = null;


/*
  HOMEへ入った後かどうか
*/

let homeActivated = false;



/* =========================================================
   基本表示
========================================================= */

function setMessage(text = '') {

  if (!messageElement) {
    return;
  }

  messageElement.textContent =
    text || '';

}



function updateHUD() {

  /*
    時間システムは後で共通game-stateと接続する。

    今はHTML側の初期表示をそのまま利用。
  */

  if (locationName) {

    locationName.textContent =
      HOME_CONFIG.name;

  }

}



/* =========================================================
   HOME描画
========================================================= */

function renderHome() {

  const deco =
    getHomeDeco(
      homeState.currentDecoId
    );


  if (!deco) {

    console.error(
      'HOME deco not found:',
      homeState.currentDecoId
    );

    return;

  }


  /* -----------------------------------------
     背景
  ----------------------------------------- */

  if (homeBackground) {

    homeBackground.src =
      deco.background ||
      HOME_CONFIG.baseBackground;

  }


  /* -----------------------------------------
     タップポイント
  ----------------------------------------- */

  renderHotspots(deco);


  /* -----------------------------------------
     NPC
  ----------------------------------------- */

  renderNPCs(deco);


  /* -----------------------------------------
     DECO追加画像
  ----------------------------------------- */

  renderOverlays(deco);


  setMessage(
    deco.description || ''
  );

}



/* =========================================================
   DECO追加物
========================================================= */

function renderOverlays(deco) {

  if (!eventImageLayer) {
    return;
  }


  eventImageLayer.innerHTML = '';


  const overlays =
    deco.overlays || [];


  for (const overlay of overlays) {

    if (
      overlay.requiresFlag &&
      !homeState.flags[
        overlay.requiresFlag
      ]
    ) {
      continue;
    }


    const img =
      document.createElement('img');


    img.src =
      overlay.image;


    img.alt =
      overlay.label || '';


    img.className =
      'home-deco-overlay';


    img.style.position =
      'absolute';

    img.style.left =
      `${overlay.x || 0}%`;

    img.style.top =
      `${overlay.y || 0}%`;

    img.style.width =
      `${overlay.width || 100}%`;

    img.style.height =
      `${overlay.height || 100}%`;

    img.style.objectFit =
      'contain';


    eventImageLayer.appendChild(
      img
    );

  }

}



/* =========================================================
   タップポイント
========================================================= */

function renderHotspots(deco) {

  if (!hotspotLayer) {
    return;
  }


  hotspotLayer.innerHTML = '';


  const hotspots =
    deco.hotspots || [];


  for (const spot of hotspots) {

    const button =
      document.createElement('button');


    button.type =
      'button';


    button.className =
      'home-hotspot';


    button.dataset.hotspotId =
      spot.id;


    button.setAttribute(
      'aria-label',
      spot.label || spot.id
    );


    button.style.left =
      `${spot.x}%`;

    button.style.top =
      `${spot.y}%`;

    button.style.width =
      `${spot.width}%`;

    button.style.height =
      `${spot.height}%`;


    button.addEventListener(
      'click',
      () => {
        activateHotspot(spot);
      }
    );


    hotspotLayer.appendChild(
      button
    );

  }

}



/* =========================================================
   hotspot実行
========================================================= */

function activateHotspot(spot) {

  /*
    フラグによるロック
  */

  if (
    spot.requiresFlag &&
    !homeState.flags[
      spot.requiresFlag
    ]
  ) {

    setMessage(
      spot.lockedMessage ||
      '今はここを使えない。'
    );

    return;

  }


  const action =
    spot.action;


  if (!action) {

    setMessage(
      spot.label || ''
    );

    return;

  }


  switch (action.type) {


    /* -----------------------------------------
       メッセージ
    ----------------------------------------- */

    case 'message':

      setMessage(
        action.text || ''
      );

      break;



    /* -----------------------------------------
       別HTMLへ移動
    ----------------------------------------- */

    case 'navigate':

      if (action.target) {

        window.location.href =
          action.target;

      }

      break;



    /* -----------------------------------------
       部屋
    ----------------------------------------- */

    case 'room':

      showSimpleInteraction(
        spot.label,
        'ここを調べる。',
        [
          {
            label: '見る',
            action: () => {

              setMessage(
                `${spot.label}を見た。`
              );

              closeInteraction();

            }
          }
        ]
      );

      break;



    /* -----------------------------------------
       睡眠
    ----------------------------------------- */

    case 'sleep':

      showSimpleInteraction(
        spot.label,
        'ここで休むことができる。',
        [
          {
            label: '休む',
            action: () => {

              setMessage(
                '少し身体を休めた。'
              );

              closeInteraction();

            }
          }
        ]
      );

      break;



    /* -----------------------------------------
       ラジオ
    ----------------------------------------- */

    case 'radio':

      setMessage(
        'ラジオだ。今は何も聞こえない。'
      );

      break;



    /* -----------------------------------------
       本
    ----------------------------------------- */

    case 'books':

      setMessage(
        '本が並んでいる。'
      );

      break;



    /* -----------------------------------------
       階段
    ----------------------------------------- */

    case 'stairs':

      setMessage(
        spot.label
          ? `${spot.label}だ。`
          : '階段だ。'
      );

      break;



    /* -----------------------------------------
       収納
    ----------------------------------------- */

    case 'storage':

    case 'food-storage':

      setMessage(
        `${spot.label}を開いた。`
      );

      break;



    /* -----------------------------------------
       クラフト
    ----------------------------------------- */

    case 'craft':

      setMessage(
        'ここで道具を作れそうだ。'
      );

      break;



    /* -----------------------------------------
       料理
    ----------------------------------------- */

    case 'cooking':

      setMessage(
        'ここで料理ができる。'
      );

      break;



    /* -----------------------------------------
       食事
    ----------------------------------------- */

    case 'dining':

      setMessage(
        '食事をする場所だ。'
      );

      break;



    default:

      console.warn(
        'Unknown HOME action:',
        action.type
      );

      setMessage(
        spot.label || ''
      );

      break;

  }

}



/* =========================================================
   interaction
========================================================= */

function showSimpleInteraction(
  title,
  text,
  actions = []
) {

  if (!interactionPanel) {
    return;
  }


  interactionPanel.hidden =
    false;


  if (interactionTitle) {

    interactionTitle.textContent =
      title || '';

  }


  if (interactionText) {

    interactionText.textContent =
      text || '';

  }


  if (interactionActions) {

    interactionActions.innerHTML = '';


    for (const item of actions) {

      const button =
        document.createElement(
          'button'
        );


      button.type =
        'button';


      button.textContent =
        item.label;


      button.addEventListener(
        'click',
        item.action
      );


      interactionActions.appendChild(
        button
      );

    }


    const closeButton =
      document.createElement(
        'button'
      );


    closeButton.type =
      'button';


    closeButton.textContent =
      '戻る';


    closeButton.addEventListener(
      'click',
      closeInteraction
    );


    interactionActions.appendChild(
      closeButton
    );

  }

}



function closeInteraction() {

  if (interactionPanel) {

    interactionPanel.hidden =
      true;

  }

}



/* =========================================================
   NPC表示
========================================================= */

function renderNPCs(deco) {

  if (!npcLayer) {
    return;
  }


  npcLayer.innerHTML = '';


  const npcPositions =
    deco.npcs || [];


  for (
    const position of npcPositions
  ) {


    if (
      position.visibleAfterFlag &&
      !homeState.flags[
        position.visibleAfterFlag
      ]
    ) {
      continue;
    }


    const npc =
      getHomeNPC(
        position.id
      );


    if (!npc) {
      continue;
    }


    /*
      npc.js の image がまだ未設定なら
      NPC画像は表示しない。

      ファイル名設定後は自動表示。
    */

    if (!npc.image) {
      continue;
    }


    const button =
      document.createElement(
        'button'
      );


    button.type =
      'button';


    button.className =
      'home-npc';


    button.style.left =
      `${position.x}%`;

    button.style.top =
      `${position.y}%`;

    button.style.width =
      `${position.width}%`;

    button.style.height =
      `${position.height}%`;


    const img =
      document.createElement('img');


    img.src =
      npc.image;


    img.alt =
      npc.name;


    img.style.width =
      '100%';

    img.style.height =
      '100%';

    img.style.objectFit =
      'contain';


    button.appendChild(
      img
    );


    button.addEventListener(
      'click',
      () => {

        openNPCDialogue(npc);

      }
    );


    npcLayer.appendChild(
      button
    );

  }

}



/* =========================================================
   通常NPC会話
========================================================= */

function openNPCDialogue(npc) {

  if (!dialoguePanel) {
    return;
  }


  dialoguePanel.hidden =
    false;


  if (
    dialogueCharacterImage
  ) {

    if (npc.image) {

      dialogueCharacterImage.src =
        npc.image;

      dialogueCharacterImage.hidden =
        false;

    } else {

      dialogueCharacterImage.hidden =
        true;

    }

  }


  if (
    dialogueCharacterName
  ) {

    dialogueCharacterName.textContent =
      npc.name || '';

  }


  if (dialogueText) {

    if (npc.id === 'father_001') {

      dialogueText.textContent =
        'メイソンはまだこちらを警戒している。';

    } else if (
      npc.id === 'mia_001'
    ) {

      dialogueText.textContent =
        'ミアはこちらをじっと見ている。';

    } else {

      dialogueText.textContent =
        '';

    }

  }


  if (dialogueActions) {

    dialogueActions.innerHTML = '';

  }

}



/* =========================================================
   イベント開始
========================================================= */

function startHomeEvent(eventId) {

  const playerName =
    getPlayerName();


  currentEvent =
    createHomeEvent(
      eventId,
      {
        playerName
      }
    );


  if (!currentEvent) {
    return;
  }


  currentEventStep =
    homeState.eventStep || 0;


  /*
    保存地点がHOME以降なら
    HOME背景も復元する。
  */

  homeActivated =
    false;


  for (
    let i = 0;
    i < currentEventStep;
    i++
  ) {

    if (
      currentEvent.steps[i]?.type ===
      'home'
    ) {

      homeActivated =
        true;

    }


    if (
      currentEvent.steps[i]?.type ===
      'scene' &&
      currentEvent.steps[i]?.background
    ) {

      currentEventBackground =
        currentEvent.steps[i]
          .background;

    }

  }


  if (homeActivated) {

    renderHome();

  }


  renderCurrentEventStep();

}



/* =========================================================
   主人公名
========================================================= */

function getPlayerName() {

  /*
    既存saveに名前がある場合だけ取得。
    無ければイベント側の◯◯を使う。
  */

  try {

    const raw =
      localStorage.getItem(
        'zombie-save-v1'
      );


    if (!raw) {
      return '◯◯';
    }


    const state =
      JSON.parse(raw);


    return (
      state.characterName ||
      state.player?.name ||
      '◯◯'
    );

  } catch {

    return '◯◯';

  }

}



/* =========================================================
   現在イベントStep
========================================================= */

function renderCurrentEventStep() {

  if (!currentEvent) {
    return;
  }


  const step =
    currentEvent.steps[
      currentEventStep
    ];


  if (!step) {

    finishHomeEvent();

    return;

  }


  /*
    eventStep保存
  */

  homeState.eventStep =
    currentEventStep;

  saveHomeState();


  switch (step.type) {


    /* -----------------------------------------
       背景変更
    ----------------------------------------- */

    case 'scene':

      if (step.background) {

        currentEventBackground =
          step.background;

      }


      showEventStep(
        step
      );

      break;



    /* -----------------------------------------
       ナレーション
    ----------------------------------------- */

    case 'narration':

      if (homeActivated) {

        showEventDialogue(
          '',
          null,
          step.text
        );

      } else {

        showEventStep(
          step
        );

      }

      break;



    /* -----------------------------------------
       会話
    ----------------------------------------- */

    case 'dialogue':

      if (homeActivated) {

        showEventDialogue(
          step.speaker,
          step.characterImage,
          step.text
        );

      } else {

        showEventStep(
          step
        );

      }

      break;



    /* -----------------------------------------
       HOMEへ切り替え
    ----------------------------------------- */

    case 'home':

      homeActivated =
        true;


      if (step.homeId) {

        homeState.currentDecoId =
          step.homeId;

      }


      saveHomeState();


      renderHome();


      hideEventPanel();


      nextEventStep();

      break;



    /* -----------------------------------------
       終了
    ----------------------------------------- */

    case 'end':

      applyEventFlags(
        step.flags
      );


      finishHomeEvent();

      break;



    default:

      console.warn(
        'Unknown event step:',
        step.type
      );


      nextEventStep();

      break;

  }

}



/* =========================================================
   HOMEへ入る前のイベント表示
========================================================= */

function showEventStep(step) {

  if (!homeEventPanel) {
    return;
  }


  hideDialogue();


  homeEventPanel.hidden =
    false;


  /* -----------------------------------------
     背景
  ----------------------------------------- */

  if (homeEventImage) {

    if (currentEventBackground) {

      homeEventImage.src =
        currentEventBackground;

      homeEventImage.hidden =
        false;

    } else {

      homeEventImage.hidden =
        true;

    }

  }


  /* -----------------------------------------
     既存キャラ画像削除
  ----------------------------------------- */

  const oldPortrait =
    document.getElementById(
      'home-event-character'
    );


  if (oldPortrait) {

    oldPortrait.remove();

  }


  /*
    characterImageがある場合は
    背景の上へ立ち絵を重ねる。
  */

  if (
    step.characterImage &&
    homeEventImageArea
  ) {

    const portrait =
      document.createElement(
        'img'
      );


    portrait.id =
      'home-event-character';


    portrait.src =
      step.characterImage;


    portrait.alt =
      step.speaker || '';


    portrait.style.position =
      'absolute';

    portrait.style.right =
      '2%';

    portrait.style.bottom =
      '0';

    portrait.style.width =
      '34%';

    portrait.style.height =
      '82%';

    portrait.style.objectFit =
      'contain';

    portrait.style.objectPosition =
      'bottom right';

    portrait.style.pointerEvents =
      'none';


    homeEventImageArea.style.position =
      'relative';


    homeEventImageArea.appendChild(
      portrait
    );

  }


  /* -----------------------------------------
     名前
  ----------------------------------------- */

  if (homeEventTitle) {

    homeEventTitle.textContent =
      step.speaker || '';

  }


  /* -----------------------------------------
     本文
  ----------------------------------------- */

  if (homeEventText) {

    homeEventText.textContent =
      step.text || '';

  }


  /* -----------------------------------------
     次へ
  ----------------------------------------- */

  if (homeEventActions) {

    homeEventActions.innerHTML = '';


    const next =
      document.createElement(
        'button'
      );


    next.type =
      'button';


    next.textContent =
      '次へ';


    next.addEventListener(
      'click',
      nextEventStep
    );


    homeEventActions.appendChild(
      next
    );

  }

}



/* =========================================================
   HOME背景上でイベント会話
========================================================= */

function showEventDialogue(
  speaker,
  characterImage,
  text
) {

  if (!dialoguePanel) {
    return;
  }


  hideEventPanel();


  dialoguePanel.hidden =
    false;


  /* 名前 */

  if (dialogueCharacterName) {

    dialogueCharacterName.textContent =
      speaker || '';

  }


  /* 画像 */

  if (
    dialogueCharacterImage
  ) {

    if (characterImage) {

      dialogueCharacterImage.src =
        characterImage;

      dialogueCharacterImage.hidden =
        false;

    } else {

      dialogueCharacterImage.hidden =
        true;

    }

  }


  /* 本文 */

  if (dialogueText) {

    dialogueText.textContent =
      text || '';

  }


  /* 次へ */

  if (dialogueActions) {

    dialogueActions.innerHTML = '';


    const next =
      document.createElement(
        'button'
      );


    next.type =
      'button';


    next.textContent =
      '次へ';


    next.addEventListener(
      'click',
      nextEventStep
    );


    dialogueActions.appendChild(
      next
    );

  }

}



/* =========================================================
   次のイベントStep
========================================================= */

function nextEventStep() {

  currentEventStep += 1;


  homeState.eventStep =
    currentEventStep;


  saveHomeState();


  renderCurrentEventStep();

}



/* =========================================================
   イベントフラグ反映
========================================================= */

function applyEventFlags(
  flags = {}
) {

  for (
    const [key, value]
    of Object.entries(flags)
  ) {

    homeState.flags[key] =
      value;

  }


  saveHomeState();

}



/* =========================================================
   イベント終了
========================================================= */

function finishHomeEvent() {

  hideEventPanel();

  hideDialogue();


  homeState.currentEventId =
    null;


  homeState.eventStep =
    0;


  saveHomeState();


  currentEvent =
    null;


  renderHome();


  setMessage(
    '家の中を調べられる。'
  );

}



/* =========================================================
   イベント表示を閉じる
========================================================= */

function hideEventPanel() {

  if (homeEventPanel) {

    homeEventPanel.hidden =
      true;

  }

}



function hideDialogue() {

  if (dialoguePanel) {

    dialoguePanel.hidden =
      true;

  }

}



/* =========================================================
   下部メニュー
========================================================= */

function setupMenu() {


  /* MAP */

  if (mapButton) {

    mapButton.addEventListener(
      'click',
      () => {

        window.location.href =
          'map-select.html';

      }
    );

  }


  /* 持ち物 */

  if (inventoryButton) {

    inventoryButton.addEventListener(
      'click',
      () => {

        if (inventoryPanel) {

          inventoryPanel.hidden =
            false;

        }

      }
    );

  }


  if (inventoryClose) {

    inventoryClose.addEventListener(
      'click',
      () => {

        if (inventoryPanel) {

          inventoryPanel.hidden =
            true;

        }

      }
    );

  }


  /* 状態 */

  if (statusButton) {

    statusButton.addEventListener(
      'click',
      () => {

        if (statusPanel) {

          statusPanel.hidden =
            false;

        }

      }
    );

  }


  if (statusClose) {

    statusClose.addEventListener(
      'click',
      () => {

        if (statusPanel) {

          statusPanel.hidden =
            true;

        }

      }
    );

  }


  /* 通常会話閉じる */

  if (dialogueClose) {

    dialogueClose.addEventListener(
      'click',
      () => {

        /*
          イベント中は閉じさせない。
        */

        if (currentEvent) {
          return;
        }


        hideDialogue();

      }
    );

  }

}



/* =========================================================
   初期化
========================================================= */

function initHome() {

  updateHUD();

  setupMenu();


  /*
    現在のDECOは先に描画しておく。

    event001開始時は上からイベント画面が重なる。
  */

  renderHome();


  /*
    未完了のHOMEイベントがある場合
  */

  if (
    homeState.currentEventId
  ) {

    startHomeEvent(
      homeState.currentEventId
    );

    return;

  }


  /*
    event001がまだ終了していない場合
  */

  if (
    !homeState.flags
      .home_event_001_complete
  ) {

    homeState.currentEventId =
      HOME_CONFIG.initialEventId;


    homeState.eventStep =
      0;


    saveHomeState();


    startHomeEvent(
      HOME_CONFIG.initialEventId
    );

    return;

  }


  /*
    通常HOME
  */

  setMessage(
    '家の中を調べられる。'
  );

}



/* =========================================================
   START
========================================================= */

document.addEventListener(
  'DOMContentLoaded',
  initHome
);