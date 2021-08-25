/**
 * String conversions of numerical output modes.
 * DC = Dual Channel
 * TS = Mix Top/Sub
 * TW = Two-way Active
 */
export declare const OUTPUT_STR: {
    0: string;
    1: string;
    2: string;
    3: string;
    4: string;
    5: string;
    6: string;
    7: string;
    8: string;
};
/**
 * Get the OCA tree of an amp. Required for all other functions.
 * @param ip IP address of a D80 amplifier
 * @returns OCA property tree
 */
export declare const getOcaTree: (ip: string) => any;
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
export declare const getOutputMode: (tree: Array<Array<any>>) => Promise<number>;
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
export declare const setOutputMode: (tree: Array<Array<any>>, mode: number) => Promise<any>;
/**
 * Plays the oscillator at the specified frequency and returns the load at that frequency.
 * @param tree Amp OCA tree
 * @param ch Chanel to get load of
 * @param freq Frequency to configure oscillator to
 * @param lvl Level of oscillator
 * @returns Load at the specified frequency
 */
export declare function getLoad(tree: Array<Array<any>>, ch: number, freq: number, lvl: number): Promise<number>;
/**
 * Get the output level of a power amp channel.
 * @param tree Amp OCA tree
 * @param ch Channel to get output level of (0 - 3)
 * @returns Level of channel
 */
export declare const getOutputLevel: (tree: Array<Array<any>>, ch: number) => Promise<number>;
/**
 *
 * @param tree Amp OCA tree
 * @param ch Channel to set output level of (0 - 3)
 * @param level Level to configure
 * @returns True if level set correctly, false if not
 */
export declare const setOutputLevel: (tree: Array<Array<any>>, ch: number, level: number) => Promise<boolean>;
/**
 * Gets the mute status of a power amp channel.
 * @param tree Amp OCA tree
 * @param ch Power amp channel to get mute status of
 * @returns True if channel is muted, false if unmuted
 */
export declare const getMuteStatus: (tree: Array<Array<any>>, ch: number) => Promise<boolean>;
/**
 * Set mute status of a power amp channel.
 * @param tree Amp OCA tree
 * @param ch Channel to set mute status of
 * @param pos True for mute, false for unmuted
 * @returns True if change is successful, false if not
 */
export declare const setMuteStatus: (tree: Array<Array<any>>, ch: number, pos: boolean) => Promise<boolean>;
/**
 * Get current cabinet preset configuration of a power amp channel.
 * @param tree Amp OCA tree
 * @param ch Channel to get preset of
 * @returns Preset in numerical form
 */
export declare const getPreset: (tree: Array<Array<any>>, ch: number) => Promise<number>;
/**
 * Set power amp channel preset
 * @param tree Amp OCA tree
 * @param ch Power amp channel to configure preset of
 * @param presetId Preset to set
 * @returns True if preset correctly set, false if not
 */
export declare const setPreset: (tree: Array<Array<any>>, ch: number, presetId: number) => Promise<boolean>;
/**
 * Set the status of an analog or digital input to a power amp channel.
 * @param tree Amp OCA tree
 * @param ch Power amp channel to configure input for
 * @param inputCh Input channel to set state of
 * @param state True for enabled, false for disabled
 */
export declare function setInput(tree: Array<Array<any>>, ch: number, inputCh: number, state: boolean): Promise<void>;
