// sounds.js
// BGM・SE管理フック（空実装）
// bg/ フォルダに音声ファイルを差し込むだけで有効化できる設計
//
// 使用方法:
//   SoundManager.playBGM('calm');      // BGM再生
//   SoundManager.stopBGM();           // BGM停止
//   SoundManager.playSE('type');      // SE再生
//
// BGMファイル配置例: bg/bgm_calm.mp3, bg/bgm_upbeat.mp3, ...
// SEファイル配置例:  bg/se_type.mp3, bg/se_miss.mp3, ...

const SoundManager = (() => {
  // -------------------------------------------------------
  // 設定
  // -------------------------------------------------------
  const BGM_PATH = 'bg/';
  const SE_PATH  = 'bg/';

  const BGM_FILES = {
    calm:     'bgm_calm.mp3',     // Lv1〜2
    upbeat:   'bgm_upbeat.mp3',   // Lv3〜4
    hype:     'bgm_hype.mp3',     // 200コンボ〜
    eurobeat: 'bgm_eurobeat.mp3', // 400コンボ〜 🚗💨
    final:    'bgm_final.mp3',    // 1000コンボ〜
  };

  const SE_FILES = {
    type:     'se_type.mp3',      // 正解タイプ時
    miss:     'se_miss.mp3',      // ミスタイプ時
    levelup:  'se_levelup.mp3',   // レベルアップ時
    gameover: 'se_gameover.mp3',  // ゲームオーバー時
  };

  // -------------------------------------------------------
  // 内部状態
  // -------------------------------------------------------
  let currentBGM = null;       // 再生中の BGM Audio オブジェクト
  let currentBGMName = null;   // 再生中の BGM 名
  let bgmVolume = 0.7;
  let seVolume  = 0.8;
  let enabled   = true;        // false にするとすべてのフックが無効化

  // -------------------------------------------------------
  // ユーティリティ
  // -------------------------------------------------------

  /**
   * 音声ファイルが実際に存在するか確認してから Audio を生成する。
   * ファイルが差し込まれていない場合は静かに null を返す。
   */
  function _createAudio(path) {
    // 空実装フェーズ: ファイルを差し込むまでは何もしない
    // ファイルを配置すれば自動的に有効になる
    try {
      const audio = new Audio(path);
      return audio;
    } catch (e) {
      // ブラウザが Audio を生成できない環境では無視
      return null;
    }
  }

  // -------------------------------------------------------
  // BGM API
  // -------------------------------------------------------

  /**
   * BGMを再生する。
   * 同じBGMが既に再生中の場合は何もしない。
   * @param {string} name - BGM名 ('calm' | 'upbeat' | 'hype' | 'eurobeat' | 'final')
   */
  function playBGM(name) {
    if (!enabled) return;
    if (!BGM_FILES[name]) return;
    if (currentBGMName === name) return; // 同一BGMは再スタートしない

    stopBGM();

    const path = BGM_PATH + BGM_FILES[name];
    const audio = _createAudio(path);
    if (!audio) return;

    audio.loop   = true;
    audio.volume = bgmVolume;

    audio.play().catch(() => {
      // ブラウザの自動再生ポリシーでブロックされた場合は無視
    });

    currentBGM     = audio;
    currentBGMName = name;
  }

  /**
   * 再生中のBGMを停止・破棄する。
   */
  function stopBGM() {
    if (!currentBGM) return;
    currentBGM.pause();
    currentBGM.currentTime = 0;
    currentBGM     = null;
    currentBGMName = null;
  }

  /**
   * BGMのボリュームを変更する（0.0〜1.0）。
   * @param {number} vol
   */
  function setBGMVolume(vol) {
    bgmVolume = Math.min(1, Math.max(0, vol));
    if (currentBGM) currentBGM.volume = bgmVolume;
  }

  // -------------------------------------------------------
  // SE API
  // -------------------------------------------------------

  /**
   * SEを再生する。
   * 短音なので毎回新規Audioを生成して即再生（多重再生対応）。
   * @param {string} name - SE名 ('type' | 'miss' | 'levelup' | 'gameover')
   */
  function playSE(name) {
    if (!enabled) return;
    if (!SE_FILES[name]) return;

    const path = SE_PATH + SE_FILES[name];
    const audio = _createAudio(path);
    if (!audio) return;

    audio.volume = seVolume;
    audio.play().catch(() => {});
  }

  /**
   * SEのボリュームを変更する（0.0〜1.0）。
   * @param {number} vol
   */
  function setSEVolume(vol) {
    seVolume = Math.min(1, Math.max(0, vol));
  }

  // -------------------------------------------------------
  // 有効・無効切り替え
  // -------------------------------------------------------

  /**
   * サウンド全体を有効化する。
   */
  function enable() {
    enabled = true;
  }

  /**
   * サウンド全体を無効化し、BGMも停止する。
   */
  function disable() {
    enabled = false;
    stopBGM();
  }

  // -------------------------------------------------------
  // コンボ連動ヘルパー
  // -------------------------------------------------------

  /**
   * コンボ数に応じて適切なBGMに切り替える。
   * index.html 側から combo が変化するたびに呼ぶだけでよい。
   * @param {number} combo - 現在のコンボ数
   * @param {number} level - 現在のレベル（1〜5）
   */
  function updateBGMByCombo(combo, level) {
    if (level >= 5) {
      // FINALステージ
      if (combo >= 1000) {
        playBGM('final');
      } else if (combo >= 400) {
        playBGM('eurobeat');
      } else if (combo >= 200) {
        playBGM('hype');
      } else {
        playBGM('upbeat');
      }
      return;
    }

    if (combo >= 1000) {
      playBGM('final');
    } else if (combo >= 400) {
      playBGM('eurobeat');
    } else if (combo >= 200) {
      playBGM('hype');
    } else if (level >= 3) {
      playBGM('upbeat');
    } else {
      playBGM('calm');
    }
  }

  // -------------------------------------------------------
  // 公開API
  // -------------------------------------------------------
  return {
    // BGM
    playBGM,
    stopBGM,
    setBGMVolume,

    // SE
    playSE,
    setSEVolume,

    // ユーティリティ
    enable,
    disable,
    updateBGMByCombo,
  };
})();
