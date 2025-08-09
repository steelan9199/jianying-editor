// --- 文件: managers/materials/VideoManager.js ---
import { BaseManager } from "../properties/BaseManager.js";

/**
 * @class VideoManager
 * @description 用于管理和操作 video 对象的类
 * @extends BaseManager
 */
export class VideoManager extends BaseManager {
  #defaultTemplate = {
    aigc_type: "none",
    audio_fade: null,
    cartoon_path: "",
    category_id: "",
    category_name: "local",
    check_flag: 63487,
    crop: {
      lower_left_x: 0,
      lower_left_y: 1,
      lower_right_x: 1,
      lower_right_y: 1,
      upper_left_x: 0,
      upper_left_y: 0,
      upper_right_x: 1,
      upper_right_y: 0,
    },
    crop_ratio: "free",
    crop_scale: 1,
    duration: 6433333,
    extra_type_option: 0,
    formula_id: "",
    freeze: null,
    has_audio: true,
    height: 1080,
    id: "07992542-CF79-4f85-AE73-818A1CE95D6D",
    intensifies_audio_path: "",
    intensifies_path: "",
    is_ai_generate_content: false,
    is_copyright: false,
    is_text_edit_overdub: false,
    is_unified_beauty_mode: false,
    local_id: "",
    local_material_id: "ed6748ff-0ed4-4457-9c00-239e4bd6c283",
    material_id: "",
    material_name: "汽车尾气6秒.mp4",
    material_url: "",
    matting: {
      flag: 0,
      has_use_quick_brush: false,
      has_use_quick_eraser: false,
      interactiveTime: [],
      path: "",
      strokes: [],
    },
    media_path: "",
    object_locked: null,
    origin_material_id: "",
    path: "F:/scripts/work-sop/19剪映yashu/09JianYingEditor/素材/汽车尾气6秒.mp4",
    picture_from: "none",
    picture_set_category_id: "",
    picture_set_category_name: "",
    request_id: "",
    reverse_intensifies_path: "",
    reverse_path: "",
    smart_motion: null,
    source: 0,
    source_platform: 0,
    stable: {
      matrix_path: "",
      stable_level: 0,
      time_range: {
        duration: 0,
        start: 0,
      },
    },
    team_id: "",
    type: "video",
    video_algorithm: {
      algorithms: [],
      complement_frame_config: null,
      deflicker: null,
      gameplay_configs: [],
      motion_blur_config: null,
      noise_reduction: null,
      path: "",
      quality_enhance: null,
      time_range: null,
    },
    width: 1920,
  };

  constructor(initialItems = []) {
    super(initialItems);
  }

  create(itemData = {}) {
    return this._create(itemData, this.#defaultTemplate);
  }
}
