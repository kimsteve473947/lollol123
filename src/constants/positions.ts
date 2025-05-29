export const POSITIONS = {
  TOP: {
    id: 'TOP',
    name: '탑',
    color: '#FF6B35',
    icon: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-top.png'
  },
  JUNGLE: {
    id: 'JUNGLE',
    name: '정글',
    color: '#4CAF50',
    icon: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-jungle.png'
  },
  MID: {
    id: 'MID',
    name: '미드',
    color: '#2196F3',
    icon: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-middle.png'
  },
  ADC: {
    id: 'ADC',
    name: '원딜',
    color: '#FF9800',
    icon: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-bottom.png'
  },
  SUPPORT: {
    id: 'SUPPORT',
    name: '서폿',
    color: '#9C27B0',
    icon: 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-clash/global/default/assets/images/position-selector/positions/icon-position-utility.png'
  }
} as const;

export type PositionType = keyof typeof POSITIONS; 