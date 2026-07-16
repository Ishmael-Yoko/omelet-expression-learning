const DEFAULT_TRAINING_MODE = 'improvisation';

const TRAINING_MODE_PRESETS = {
  improvisation: {
    label: '即兴表达',
    description: '强调快速组织观点、先给结论、减少思考性口癖。',
    realtimeFocus: '优先提醒结论先行、观点收束、临场例子和节奏控制。',
    reportFocus: '重点分析即兴组织能力、观点推进速度和临场说服力。',
  },
  interview: {
    label: '面试回答',
    description: '强调结构化回答、岗位价值、例子与结果导向。',
    realtimeFocus: '优先提醒回答结构、岗位相关性、量化结果和 STAR 叙述。',
    reportFocus: '重点分析回答结构、证据充分度、岗位匹配度和专业表达。',
  },
  presentation: {
    label: '汇报表达',
    description: '强调信息层级、逻辑推进、关键数据和受众理解。',
    realtimeFocus: '优先提醒信息排序、数据支撑、过渡衔接和结论明确度。',
    reportFocus: '重点分析汇报结构、受众友好度、数据表达和结尾行动项。',
  },
  sales: {
    label: '销售沟通',
    description: '强调客户视角、价值表达、异议回应和成交推进。',
    realtimeFocus: '优先提醒客户收益、需求映射、异议处理和行动推动。',
    reportFocus: '重点分析价值表达、客户视角、推进动作和成交张力。',
  },
  retrospective: {
    label: '复盘总结',
    description: '强调问题归因、经验抽取、改进动作和复用价值。',
    realtimeFocus: '优先提醒原因拆解、经验总结、行动复盘和复用结论。',
    reportFocus: '重点分析归因质量、经验提炼、复用价值和改进行动。',
  },
};

function getTrainingModePreset(mode = DEFAULT_TRAINING_MODE) {
  return TRAINING_MODE_PRESETS[mode] || TRAINING_MODE_PRESETS[DEFAULT_TRAINING_MODE];
}

module.exports = {
  DEFAULT_TRAINING_MODE,
  TRAINING_MODE_PRESETS,
  getTrainingModePreset,
};
