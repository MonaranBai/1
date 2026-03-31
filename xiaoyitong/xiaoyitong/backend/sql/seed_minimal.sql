SET NAMES utf8mb4;
SET time_zone = '+08:00';

USE xiaoyitong;

-- Minimal seed data for local integration.
INSERT INTO users (
  id, phone, nickname, password_hash, student_id, campus, qq, wechat, avatar_url,
  verification_status, is_verified, credit_score, status
) VALUES
  (1, '13800000000', '平台管理员', NULL, 'A0000001', '主校区', '10000', 'admin_wechat', '', 'verified', 1, 100, 'active'),
  (2, '13800000001', '骑行社小李', NULL, '20221001', '主校区', '10001', 'biker_li', '', 'verified', 1, 96, 'active'),
  (3, '13800000002', '法学院小陈', NULL, '20218021', '南校区', '20002', 'chen_law', '', 'unverified', 0, 88, 'active')
ON DUPLICATE KEY UPDATE nickname = VALUES(nickname);

INSERT INTO credit_logs (user_id, change_value, reason, operator_admin_id, source_type)
VALUES
  (2, 2, '完成代取快递，获得好评', 1, 'task_evaluation'),
  (2, -1, '任务响应超时', 1, 'system_rule'),
  (3, -2, '租房信息不完整被差评', 1, 'buddy_evaluation');

INSERT INTO info_posts (id, user_id, publisher_name, title, category, content, location_text, tags_json, status)
VALUES
  (1, 2, '骑行社小李', '主校区拼车回南门', 'travel', '周五晚主校区到南门，顺路带人。', '主校区北门', JSON_ARRAY('拼车', '出行'), 'visible')
ON DUPLICATE KEY UPDATE title = VALUES(title);

INSERT INTO post_reports (post_id, reporter_id, reporter_name, reason, status)
VALUES
  (1, 3, '法学院小陈', '描述信息不完整', 'pending');

INSERT INTO task_posts (
  id, owner_id, owner_name, title, description, reward_amount, location_text,
  due_time, tags_json, status, helper_id, helper_name
) VALUES
  (
    1, 2, '骑行社小李', '代取快递', '帮忙从快递站取一个中等包裹。', 8.00, '主校区菜鸟驿站',
    DATE_ADD(NOW(), INTERVAL 1 DAY), JSON_ARRAY('快递', '跑腿'), 'ongoing', 3, '法学院小陈'
  )
ON DUPLICATE KEY UPDATE title = VALUES(title);

INSERT INTO task_evaluations (task_id, from_user_id, to_user_id, rating, comment, credit_change)
VALUES
  (1, 2, 3, 'good', '准时且沟通顺畅', 2);

INSERT INTO buddy_posts (
  id, creator_id, creator_name, title, activity_type, location_text,
  latitude, longitude, radius_meter, distance_meter, event_time,
  max_members, current_members, tags_json, status
) VALUES
  (
    1, 2, '骑行社小李', '周末羽毛球搭子', '运动', '南校区体育馆',
    31.2304000, 121.4737000, 1000, 300, DATE_ADD(NOW(), INTERVAL 2 DAY),
    4, 2, JSON_ARRAY('羽毛球', '周末'), 'open'
  )
ON DUPLICATE KEY UPDATE title = VALUES(title);

INSERT INTO buddy_members (buddy_id, user_id, nickname_snapshot, role_type, join_status)
VALUES
  (1, 2, '骑行社小李', 'creator', 'joined'),
  (1, 3, '法学院小陈', 'member', 'joined')
ON DUPLICATE KEY UPDATE nickname_snapshot = VALUES(nickname_snapshot);

INSERT INTO buddy_evaluations (buddy_id, from_user_id, to_user_id, rating, comment, credit_change)
VALUES
  (1, 3, 2, 'good', '活动组织很到位', 2);

INSERT INTO buddy_reports (buddy_id, reporter_id, reporter_name, reason, status)
VALUES
  (1, 3, '法学院小陈', '集合地点描述不清', 'pending');

INSERT INTO moderation_logs (target_type, target_id, action, operator_admin_id, reason, note)
VALUES
  ('post', 1, 'review', 1, '常规巡检', '通过'),
  ('buddy', 1, 'review', 1, '用户举报处理中', '待补充证据');

INSERT INTO user_behaviors (user_id, target_type, target_id, action, tags_json)
VALUES
  (2, 'task', 1, 'publish', JSON_ARRAY('快递', '跑腿')),
  (3, 'buddy', 1, 'join', JSON_ARRAY('羽毛球', '周末'));

INSERT INTO admin_operation_logs (admin_id, operation_type, target_type, target_id, detail_json, ip_address)
VALUES
  (
    1,
    'credit_adjust',
    'user',
    3,
    JSON_OBJECT('change', -2, 'reason', '租房信息不完整被差评'),
    '127.0.0.1'
  );
