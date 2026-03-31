export const initialPosts = [
  {
    id: 1,
    category: '二手',
    title: '九成新自行车转让',
    description: '购入半年，平时仅在校内骑行，支持当面验车。',
    price: 200,
    campus: '主校区',
    images: [
      'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg',
      'https://fastly.jsdelivr.net/npm/@vant/assets/apple-1.jpeg'
    ],
    publisher: '骑行社小李',
    contactType: '微信',
    contactInfo: 'bike2026',
    createdAt: '2026-03-11 14:20'
  },
  {
    id: 2,
    category: '拼车',
    title: '周五晚拼车去高铁站',
    description: '18:30 东门出发，还差2人，可带一个行李箱。',
    start: '东门',
    destination: '高铁站',
    departTime: '2026-03-13 18:30',
    seats: 4,
    fee: 15,
    publisher: '计科22-王同学',
    contactType: '手机',
    contactInfo: '13800138000',
    createdAt: '2026-03-12 09:05'
  },
  {
    id: 3,
    category: '租房',
    title: '南门精装两室一厅找室友',
    description: '步行到教学楼15分钟，家电齐全，可短租。',
    location: '南门地铁口旁',
    houseType: '两室一厅',
    rentTerm: '6个月起',
    price: 800,
    images: [
      'https://fastly.jsdelivr.net/npm/@vant/assets/apple-2.jpeg',
      'https://fastly.jsdelivr.net/npm/@vant/assets/apple-3.jpeg'
    ],
    publisher: '法学院-小陈',
    contactType: 'QQ',
    contactInfo: '1234567',
    createdAt: '2026-03-10 20:10'
  },
  {
    id: 4,
    category: '组队',
    title: '大创项目招前端同学',
    description: '方向是校园效率工具，已完成需求和后端原型。',
    activityType: '创新创业',
    activityTime: '2026-03-15 19:00',
    activityLocation: '图书馆A402',
    members: 1,
    publisher: '创新营队长',
    contactType: '微信',
    contactInfo: 'xcx_team',
    createdAt: '2026-03-12 11:30'
  }
]