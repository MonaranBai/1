export const initialBuddies = [
  {
    id: 1,
    title: '晚饭饭搭子（清真窗口）',
    activityType: '饭搭子',
    location: '第一食堂',
    latitude: 31.2308,
    longitude: 121.4741,
    radiusMeter: 500,
    distanceMeter: 180,
    eventTime: '2026-03-17 18:20',
    maxMembers: 2,
    currentMembers: 1,
    tags: ['美食', '聊天'],
    status: 'open',
    creatorId: 1,
    creatorName: '骑行社小李',
    members: [{ userId: 1, nickname: '骑行社小李' }],
    createdAt: '2026-03-17 17:05'
  },
  {
    id: 2,
    title: '操场5公里慢跑',
    activityType: '运动搭子',
    location: '东操场看台',
    latitude: 31.2311,
    longitude: 121.475,
    radiusMeter: 500,
    distanceMeter: 420,
    eventTime: '2026-03-17 20:10',
    maxMembers: 3,
    currentMembers: 2,
    tags: ['跑步', '夜跑'],
    status: 'open',
    creatorId: 2,
    creatorName: '法学院-小陈',
    members: [
      { userId: 2, nickname: '法学院-小陈' },
      { userId: 8, nickname: '新闻系-阿宁' }
    ],
    createdAt: '2026-03-17 16:18'
  },
  {
    id: 3,
    title: '图书馆线代复习2小时',
    activityType: '学习搭子',
    location: '图书馆三楼A区',
    latitude: 31.2303,
    longitude: 121.4732,
    radiusMeter: 800,
    distanceMeter: 760,
    eventTime: '2026-03-18 14:00',
    maxMembers: 4,
    currentMembers: 4,
    tags: ['学习', '线代'],
    status: 'full',
    creatorId: 3,
    creatorName: '计算机社-阿泽',
    members: [
      { userId: 3, nickname: '计算机社-阿泽' },
      { userId: 4, nickname: '创新营队长' },
      { userId: 7, nickname: '外语系-小唐' },
      { userId: 9, nickname: '经管-小祝' }
    ],
    createdAt: '2026-03-17 13:30'
  }
]
