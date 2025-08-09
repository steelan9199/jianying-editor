// --- 文件: managers/properties/CanvasManager.js ---
import { BaseManager } from './BaseManager.js';

/**
 * @class CanvasManager
 * @description 用于管理和操作 canvases 对象的类
 * @extends BaseManager
 */
export class CanvasManager extends BaseManager {
  #defaultTemplate = {
    album_image: "",
    blur: 0,
    color: "",
    image: "",
    image_id: "",
    image_name: "",
    source_platform: 0,
    team_id: "",
    type: "canvas_color",
  };

  constructor(initialItems = []) {
    super(initialItems);
  }

  create(itemData = {}) {
    return this._create(itemData, this.#defaultTemplate);
  }
}