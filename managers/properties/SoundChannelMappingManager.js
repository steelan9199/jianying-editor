// --- 文件: managers/properties/SoundChannelMappingManager.js ---
import { BaseManager } from './BaseManager.js';

/**
 * @class SoundChannelMappingManager
 * @description 用于管理和操作 sound_channel_mappings 对象的类
 * @extends BaseManager
 */
export class SoundChannelMappingManager extends BaseManager {
  #defaultTemplate = {
    audio_channel_mapping: 0,
    is_config_open: false,
    type: "",
  };

  constructor(initialItems = []) {
    super(initialItems);
  }

  create(itemData = {}) {
    return this._create(itemData, this.#defaultTemplate);
  }
}