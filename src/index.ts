/* eslint-disable camelcase */
/* eslint-disable no-unused-vars */
/* eslint-disable max-len */
/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */
import * as OCA from 'aes70';

const SETTINGS = 7;
const CONFIG = 9;
const STATUS = 11;
const CH_STATUS = 13;
const ERROR = 15;
const CH_ERR = 17;
const SYSTEM_CALIBRATION = 23;
const EN_WEG = 25;
const LOG = 27;
const CH_LOG = 29;
const INPUT = 33;
const INPUT_MONITORING = 35;
const PRESETS = 37;
const GPIO = 39;
const ARRAY_PROCESSING = 41;

const Settings_OutputMode = 12;
const Config_PotiLevel = 6;

const D80_PORT = 30013;

/**
 * String conversions of numerical output modes.
 * DC = Dual Channel
 * TS = Mix Top/Sub
 * TW = Two-way Active
 */
export const OUTPUT_STR = {
  0: 'DCDC',
  1: 'TSDC',
  2: 'TWDC',
  3: 'DCTS',
  4: 'DCTW',
  5: 'TSTS',
  6: 'TWTS',
  7: 'TSTW',
  8: 'TWTW',
};

/**
 * Numerical conversions of string output modes.
 * DC = Dual Channel
 * TS = Mix Top/Sub
 * TW = Two-way Active
 */
const OUTPUT = {
  DCDC: 0,
  TSDC: 1,
  TWDC: 2,
  DCTS: 3,
  DCTW: 4,
  TSTS: 5,
  TWTS: 6,
  TSTW: 7,
  TWTW: 8,
};

function sleep(ms: number) {
  return new Promise((resolve: any) => {
    setTimeout(resolve, ms);
  });
}

const promiseTimeout = (ms: number, promise: any, errMsg: string) => {
  const timeout = new Promise((_resolve: any, reject: any) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(errMsg);
    }, ms);
  });

  return Promise.race([
    promise,
    timeout,
  ]);
};

/**
 * Get the OCA tree of an amp. Required for all other functions.
 * @param ip IP address of a D80 amplifier
 * @returns OCA property tree
 */
export const getOcaTree = (ip: string): any => {
  const connection = OCA.controller.TCP.connect({
    host: ip,
    port: D80_PORT,
  }).then((c: any) => {
    const device = new OCA.RemoteDevice(c);
    device.set_keepalive_interval(10);
    return device.get_device_tree();
  }).catch((e: any) => e);

  return promiseTimeout(5000, connection, 'OCA timeout');
};

/**
 * Get the power amp output mode.
 * 0 - Dual Channel   / Dual Channel
 * 1 - Mix Top/Sub    / Dual Channel
 * 2 - Two-Way Active / Dual Channel
 * 3 - Dual Channel   / Mix Top/Sub
 * 4 - Dual Channel   / Two-Way Active
 * 5 - Mix Top/Sub    / Mix Top/Sub
 * 6 - Two-Way Active / Mix Top/Sub
 * 7 - Mix Top/Sub    / Two-Way Active
 * 8 - Two-Way Active / Two-Way Active
 * @param tree Amp OCA tree
 * @returns Output mode in number form
 */
export const getOutputMode = (tree: Array<Array<any>>): Promise<number> => tree[SETTINGS][Settings_OutputMode].GetPosition().values[0];

/**
 * Set the power amp output mode.
 * 0 - Dual Channel   / Dual Channel
 * 1 - Mix Top/Sub    / Dual Channel
 * 2 - Two-Way Active / Dual Channel
 * 3 - Dual Channel   / Mix Top/Sub
 * 4 - Dual Channel   / Two-Way Active
 * 5 - Mix Top/Sub    / Mix Top/Sub
 * 6 - Two-Way Active / Mix Top/Sub
 * 7 - Mix Top/Sub    / Two-Way Active
 * 8 - Two-Way Active / Two-Way Active
 * @param tree Amp OCA tree
 * @param mode Output mode in numberical form to configure amp as
 * @returns Promise which resolves on the output mode set
 */
export const setOutputMode = (tree: Array<Array<any>>, mode: number): Promise<any> => tree[SETTINGS][Settings_OutputMode].SetPosition(mode);

/**
 * Reconfigures a specified channel to the correctly targeted channel for certain functions.
 * e.g When performing load checks for channel B, the oscillator must be configured and enabled
 * on channel A.
 * @param tree Amp OCA tree
 * @param ch Targeted channel
 * @returns Updated channel target
 */
async function twFix(tree: Array<Array<any>>, ch: number) {
  let sc = ch;
  if (sc === 1 || sc === 3) {
    // Channels B and D when in 2-way active require freq generator (sc) and gain set on A and C
    const op = await getOutputMode(tree);
    if ((sc === 1 && (op === OUTPUT.TWDC || op === OUTPUT.TWTS || op === OUTPUT.TWTW))
      || (sc === 3 && (op === OUTPUT.DCTW || op === OUTPUT.TSTW || op === OUTPUT.TWTW))) {
      sc -= 1;
    }
  }
  return sc;
}

/**
 * Plays the oscillator at the specified frequency and returns the load at that frequency.
 * @param tree Amp OCA tree
 * @param ch Chanel to get load of
 * @param freq Frequency to configure oscillator to
 * @param lvl Level of oscillator
 * @returns Load at the specified frequency
 */
export async function getLoad(tree: Array<Array<any>>, ch: number, freq: number, lvl: number) {
  const sc = await twFix(tree, ch);
  const gc = ch;

  const i = [10, 46, 82, 118]; // Config_FreqGenFreq
  const j = [11, 47, 83, 119]; // Config_FreqGenLevel
  const l = [13, 49, 85, 121]; // Config_FreqGenMode
  await tree[CONFIG][i[sc]].SetSetting(freq); // Frequency gen freq
  await tree[CONFIG][j[sc]].SetGain(lvl); // Frequency gen level
  await tree[CONFIG][l[sc]].SetPosition(1); // Frequency gen mode (sine)

  const k = [6, 42, 78, 114]; // ChStatus_SpeakerImpedance
  let imp = 99.9;

  // Take three readings and return the lowest
  // Proves more consistent
  for (let m = 0; m < 3; m += 1) {
    await sleep(600); // Can be lowered but may not be as consistent on low end hardware

    const reading = await tree[CH_STATUS][k[gc]].GetReading();
    const value = reading.values[0];

    if (value < imp) imp = value;
  }

  await tree[CONFIG][l[sc]].SetPosition(0); // Frequency gen mode (off)
  return imp;
}

/**
 * Get the output level of a power amp channel.
 * @param tree Amp OCA tree
 * @param ch Channel to get output level of (0 - 3)
 * @returns Level of channel
 */
export const getOutputLevel = async (tree: Array<Array<any>>, ch: number): Promise<number> => {
  const k = [6, 42, 78, 114]; // Config_PotiLevel
  const rtn = await tree[CONFIG][k[ch]].GetGain();
  return rtn.values[0];
};

/**
 *
 * @param tree Amp OCA tree
 * @param ch Channel to set output level of (0 - 3)
 * @param level Level to configure
 * @returns True if level set correctly, false if not
 */
export const setOutputLevel = async (tree: Array<Array<any>>, ch: number, level: number): Promise<boolean> => {
  const sc = await twFix(tree, ch);
  const k = [6, 42, 78, 114]; // Config_PotiLevel
  await tree[CONFIG][k[sc]].SetGain(level);

  await sleep(50); // Wait for level to be set
  if ((await getOutputLevel(tree, ch) - level) === 0.0) return true;
  return false;
};

/**
 * Gets the mute status of a power amp channel.
 * @param tree Amp OCA tree
 * @param ch Power amp channel to get mute status of
 * @returns True if channel is muted, false if unmuted
 */
export const getMuteStatus = async (tree: Array<Array<any>>, ch: number): Promise<boolean> => {
  const sc = ch;
  const j = [5, 41, 77, 113];

  const muteObj = tree[CONFIG][j[sc]]; // Channel mute state prop
  const muteState = await muteObj.GetState(); // Get OcaMuteState obj to pass back

  // Prop returns 1 if muted, 2 if unmuted
  return muteState.value < 2;
};

/**
 * Set mute status of a power amp channel.
 * @param tree Amp OCA tree
 * @param ch Channel to set mute status of
 * @param pos True for mute, false for unmuted
 * @returns True if change is successful, false if not
 */
export const setMuteStatus = async (tree: Array<Array<any>>, ch: number, pos: boolean): Promise<boolean> => {
  const sc = ch;
  const j = [5, 41, 77, 113];

  const muteObj = tree[CONFIG][j[sc]]; // Channel mute state prop
  const muteState = await muteObj.GetState(); // Get OcaMuteState obj to pass back
  // 1 is mute, 2 is unmuted
  muteState.value = pos ? 1 : 2;
  await muteObj.SetState(muteState);

  await sleep(50); // Wait for mute to be possibly rejected
  if (await getMuteStatus(tree, ch) !== pos) return true;
  return false;
};

/**
 * Get current cabinet preset configuration of a power amp channel.
 * @param tree Amp OCA tree
 * @param ch Channel to get preset of
 * @returns Preset in numerical form
 */
export const getPreset = async (tree: Array<Array<any>>, ch: number): Promise<number> => {
  const k = [14, 50, 86, 122];
  const rtn = await tree[CONFIG][k[ch]].GetPosition();
  return rtn.values[0];
};

/**
 * Set power amp channel preset
 * @param tree Amp OCA tree
 * @param ch Power amp channel to configure preset of
 * @param presetId Preset to set
 * @returns True if preset correctly set, false if not
 */
export const setPreset = async (tree: Array<Array<any>>, ch: number, presetId: number): Promise<boolean> => {
  const k = [14, 50, 86, 122];
  await tree[CONFIG][k[ch]].SetPosition(presetId);

  await sleep(50); // Wait for preset to be rejected
  if ((await getPreset(tree, ch) - presetId) === 0) return true;
  return false;
};

/**
 * Set the status of an analog or digital input to a power amp channel.
 * @param tree Amp OCA tree
 * @param ch Power amp channel to configure input for
 * @param inputCh Input channel to set state of
 * @param state True for enabled, false for disabled
 */
export async function setInput(tree: Array<Array<any>>, ch: number, inputCh: number, state: boolean) {
  const iCh = inputCh - 1;
  const k = [16 + iCh, 52 + iCh, 88 + iCh, 124 + iCh];
  await tree[CONFIG][k[ch]].SetPosition(state ? 1 : 0);
}

async function printProp(prop: any) {
  console.log('Properties:');
  const properties = prop.GetPropertySync();

  // fetch the values of all properties from the device.
  await properties.sync();

  properties.forEach((value: any, name: string) => {
    if (value !== undefined && name !== 'ClassID' && name !== 'Lockable' && name !== 'Enabled' && name !== 'Ports') {
      if (name === 'Label' || name === 'Position' || name === 'Setting' || name === 'Value') console.log('  %s: %o', name, value);
    }
  });

  // unsubscribe all event handlers
  properties.Dispose();
}

/**
 * Prints the OCA properties of an provided tree.
 * @param tree Amp OCA tree
 */
async function printDevProperties(tree: Array<Array<any>>) {
  const rec = async (a: Array<any>, str: string) => {
    for (let i = 0; i < a.length; i += 1) {
      const obj = a[i];

      if (Array.isArray(obj)) {
        // children
        await rec(obj, `${str + i.toString()}, `);
      } else {
        console.log('\n');
        console.log(str + i.toString());
        console.log('Type: %s', obj.constructor.ClassName);
        await printProp(obj);
      }
    }
  };

  await rec(tree, 'INDEX: ');
}
