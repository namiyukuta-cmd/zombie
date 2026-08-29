/* =========================================================
   HOME EVENT 001
   js/HOME/event/event001.js

   初回イベント
   ・隣家の玄関前
   ・メイソンと遭遇
   ・家へ入る
   ・HOMEへ切り替え
   ・ミア登場
========================================================= */

import { getNPC } from '../../npc.js';


const mason = getNPC('father_001');
const mia = getNPC('mia_001');


/* =========================================================
   使用画像

   実際にGitHubへ置いたファイル名に合わせて変更する
========================================================= */

const IMAGES = {

  /* 玄関・扉が閉じている */
  entranceClosed:
    'assets/events/home/event001/entrance_closed.jpeg',

  /* 扉が開き、メイソンがこちらを見ている */
  entranceOpen:
    'assets/events/home/event001/entrance_open.jpeg',

  /* HOME固定背景 */
  home:
    'assets/home/home.jpeg',

  /* NPC */
  mason:
    'assets/npc/mason.png',

  mia:
    'assets/npc/mia.png'
};


/* =========================================================
   Event 001
========================================================= */

export function createHomeEvent001(playerName = '◯◯') {

  return {

    id: 'home_event_001',

    startStep: 0,

    steps: [

      /* =====================================================
         玄関前
      ===================================================== */

      {
        type: 'scene',

        background: IMAGES.entranceClosed,

        speaker: '主人公',

        text:
          '「開けて！ 入れてください！」'
      },


      {
        type: 'dialogue',

        speaker: mason?.name ?? '男',

        text:
          '「誰だ！」'
      },


      {
        type: 'narration',

        text:
          '男の声。緊迫している。無理もない。'
      },


      {
        type: 'narration',

        text:
          '私は必死で叫んだ。'
      },


      {
        type: 'dialogue',

        speaker: '主人公',

        text:
          `「人間です！ ${playerName}と言います！ お願いです！ 助けてください！」`
      },


      {
        type: 'narration',

        text:
          'しばしの時間が流れた。'
      },


      {
        type: 'narration',

        text:
          '数秒？ 数分？'
      },


      {
        type: 'narration',

        text:
          'とても長く感じられた。'
      },


      {
        type: 'narration',

        text:
          'そうして待っていると、重い物を動かす音がした。'
      },


      {
        type: 'narration',

        text:
          '続いて、鎖を外すような金属音が聞こえる。'
      },


      {
        type: 'narration',

        text:
          'カチリ、と鍵の開く音がした。'
      },


      /* =====================================================
         ドアが開く
      ===================================================== */

      {
        type: 'scene',

        background: IMAGES.entranceOpen,

        text: ''
      },


      {
        type: 'dialogue',

        speaker: mason?.name ?? '男',

        characterImage: IMAGES.mason,

        text:
          '「……手を上げろ。下ろすな。声を出すな。そのまま静かに中に入って、ドアを閉めろ」'
      },


      {
        type: 'narration',

        text:
          '男は猟銃を手にしていた。'
      },


      {
        type: 'narration',

        text:
          '私は怯えながら、言われた通りに家の中へ入った。'
      },


      {
        type: 'dialogue',

        speaker: mason?.name ?? '男',

        characterImage: IMAGES.mason,

        text:
          '「ドアに手をつけろ」'
      },


      {
        type: 'narration',

        text:
          '命じられるままドアを閉め、その内側に両手をつく。'
      },


      {
        type: 'narration',

        text:
          '男は私の服や荷物を注意深く確認した。'
      },


      {
        type: 'narration',

        text:
          '武器を隠していないか。噛まれた跡はないか。何度も確かめた後、ようやく少しだけ猟銃を下げた。'
      },


      {
        type: 'dialogue',

        speaker: mason?.name ?? '男',

        characterImage: IMAGES.mason,

        text:
          '「……危険物は持っていないようだな」'
      },


      {
        type: 'dialogue',

        speaker: mason?.name ?? '男',

        characterImage: IMAGES.mason,

        text:
          '「いいだろう。中に入れ。ただし、この階以外に行くことは許さない。分かったな」'
      },


      /* =====================================================
         HOMEへ切り替え
      ===================================================== */

      {
        type: 'home',

        homeId: 'home_deco_001',

        background: IMAGES.home
      },


      {
        type: 'narration',

        text:
          '男はドアに鍵をかけ、鎖を巻いた。'
      },


      {
        type: 'narration',

        text:
          'それだけでは足りないのか、玄関脇に寄せてあった家具まで動かし、頑丈にバリケードを組み直した。'
      },


      {
        type: 'narration',

        text:
          '作業を終えると、男は辛そうに息を吐いた。'
      },


      {
        type: 'narration',

        text:
          '猟銃を杖のようについて身体を支えながら居間まで歩き、ゆっくりと腰を下ろす。'
      },


      {
        type: 'dialogue',

        speaker: mason?.name ?? '男',

        characterImage: IMAGES.mason,

        text:
          '「こっちに来い」'
      },


      {
        type: 'narration',

        text:
          '男に呼ばれ、私は彼のそばへ向かった。'
      },


      {
        type: 'dialogue',

        speaker: mason?.name ?? '男',

        characterImage: IMAGES.mason,

        text:
          '「事情を聞く。名前は？」'
      },


      {
        type: 'dialogue',

        speaker: mason?.name ?? '男',

        characterImage: IMAGES.mason,

        text:
          '「お前一人か？ どこから来た？」'
      },


      {
        type: 'dialogue',

        speaker: mason?.name ?? '男',

        characterImage: IMAGES.mason,

        text:
          '「それから……何を持っている？」'
      },


      {
        type: 'narration',

        text:
          'まるで尋問のような、細かな質問が続いた。'
      },


      /* =====================================================
         ミア登場
      ===================================================== */

      {
        type: 'narration',

        text:
          'その時、階上から小さな足音が聞こえた。'
      },


      {
        type: 'narration',

        text:
          'とん、とん、と階段を降りてくる。'
      },


      {
        type: 'dialogue',

        speaker: mia?.name ?? '女の子',

        characterImage: IMAGES.mia,

        text:
          '「パーパー。……だーれー？」'
      },


      /* =====================================================
         終了
      ===================================================== */

      {
        type: 'end',

        flags: {
          home_event_001_complete: true,
          mason_met: true,
          mia_met: true,
          home_unlocked: true
        }
      }

    ]

  };
}


/* =========================================================
   IDだけ取得したい時用
========================================================= */

export const HOME_EVENT_001_ID = 'home_event_001';