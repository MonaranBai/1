SET NAMES utf8mb4;
SET time_zone = '+08:00';

CREATE DATABASE IF NOT EXISTS xiaoyitong
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE xiaoyitong;

-- Drop tables in reverse dependency order.
DROP TABLE IF EXISTS admin_operation_logs;
DROP TABLE IF EXISTS user_behaviors;
DROP TABLE IF EXISTS moderation_logs;
DROP TABLE IF EXISTS buddy_reports;
DROP TABLE IF EXISTS buddy_evaluations;
DROP TABLE IF EXISTS buddy_members;
DROP TABLE IF EXISTS buddy_posts;
DROP TABLE IF EXISTS task_evaluations;
DROP TABLE IF EXISTS task_posts;
DROP TABLE IF EXISTS post_reports;
DROP TABLE IF EXISTS info_posts;
DROP TABLE IF EXISTS credit_logs;
DROP TABLE IF EXISTS verification_requests;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  phone VARCHAR(32) NOT NULL,
  nickname VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) DEFAULT NULL,
  student_id VARCHAR(64) DEFAULT NULL,
  campus VARCHAR(64) DEFAULT '主校区',
  qq VARCHAR(64) DEFAULT NULL,
  wechat VARCHAR(64) DEFAULT NULL,
  avatar_url VARCHAR(500) DEFAULT NULL,
  student_card_image_url VARCHAR(500) DEFAULT NULL,
  verification_status VARCHAR(20) NOT NULL DEFAULT 'unverified',
  is_verified TINYINT(1) NOT NULL DEFAULT 0,
  credit_score INT NOT NULL DEFAULT 100,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_phone (phone),
  UNIQUE KEY uk_users_student_id (student_id),
  KEY idx_users_status (status),
  KEY idx_users_verification_status (verification_status),
  CONSTRAINT chk_users_credit_score CHECK (credit_score >= 0 AND credit_score <= 100),
  CONSTRAINT chk_users_verification_status CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
  CONSTRAINT chk_users_status CHECK (status IN ('active', 'disabled', 'deleted'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE verification_requests (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  student_card_image_url VARCHAR(500) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  admin_id BIGINT UNSIGNED DEFAULT NULL,
  admin_note VARCHAR(500) DEFAULT '',
  submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_verification_requests_user_id (user_id),
  KEY idx_verification_requests_status (status),
  KEY idx_verification_requests_admin_id (admin_id),
  CONSTRAINT fk_verification_requests_user_id FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_verification_requests_admin_id FOREIGN KEY (admin_id) REFERENCES users(id),
  CONSTRAINT chk_verification_requests_status CHECK (status IN ('pending', 'approved', 'rejected'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE credit_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  change_value INT NOT NULL,
  reason VARCHAR(255) NOT NULL,
  operator_admin_id BIGINT UNSIGNED DEFAULT NULL,
  source_type VARCHAR(30) NOT NULL DEFAULT 'manual',
  source_id BIGINT UNSIGNED DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_credit_logs_user_id (user_id),
  KEY idx_credit_logs_created_at (created_at),
  KEY idx_credit_logs_operator_admin_id (operator_admin_id),
  CONSTRAINT fk_credit_logs_user_id FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_credit_logs_operator_admin_id FOREIGN KEY (operator_admin_id) REFERENCES users(id),
  CONSTRAINT chk_credit_logs_source_type CHECK (source_type IN ('manual', 'task_evaluation', 'buddy_evaluation', 'system_rule'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE info_posts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  publisher_name VARCHAR(50) NOT NULL,
  title VARCHAR(120) NOT NULL,
  category VARCHAR(32) DEFAULT 'general',
  content TEXT NOT NULL,
  location_text VARCHAR(255) DEFAULT '',
  images_json JSON DEFAULT NULL,
  tags_json JSON DEFAULT NULL,
  extra_json JSON DEFAULT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'visible',
  view_count INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_info_posts_user_id (user_id),
  KEY idx_info_posts_status_created_at (status, created_at),
  FULLTEXT KEY ft_info_posts_title_content (title, content),
  CONSTRAINT fk_info_posts_user_id FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT chk_info_posts_status CHECK (status IN ('visible', 'hidden', 'deleted'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE post_reports (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  post_id BIGINT UNSIGNED NOT NULL,
  reporter_id BIGINT UNSIGNED DEFAULT NULL,
  reporter_name VARCHAR(50) DEFAULT '游客',
  reason VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  admin_id BIGINT UNSIGNED DEFAULT NULL,
  admin_note VARCHAR(500) DEFAULT '',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_post_reports_post_id (post_id),
  KEY idx_post_reports_status_created_at (status, created_at),
  KEY idx_post_reports_admin_id (admin_id),
  CONSTRAINT fk_post_reports_post_id FOREIGN KEY (post_id) REFERENCES info_posts(id),
  CONSTRAINT fk_post_reports_reporter_id FOREIGN KEY (reporter_id) REFERENCES users(id),
  CONSTRAINT fk_post_reports_admin_id FOREIGN KEY (admin_id) REFERENCES users(id),
  CONSTRAINT chk_post_reports_status CHECK (status IN ('pending', 'approved', 'rejected'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE task_posts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  owner_id BIGINT UNSIGNED NOT NULL,
  owner_name VARCHAR(50) NOT NULL,
  title VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  reward_amount DECIMAL(10,2) DEFAULT 0,
  location_text VARCHAR(255) DEFAULT '',
  due_time DATETIME DEFAULT NULL,
  tags_json JSON DEFAULT NULL,
  images_json JSON DEFAULT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  helper_id BIGINT UNSIGNED DEFAULT NULL,
  helper_name VARCHAR(50) DEFAULT '',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_task_posts_owner_id (owner_id),
  KEY idx_task_posts_helper_id (helper_id),
  KEY idx_task_posts_status_created_at (status, created_at),
  CONSTRAINT fk_task_posts_owner_id FOREIGN KEY (owner_id) REFERENCES users(id),
  CONSTRAINT fk_task_posts_helper_id FOREIGN KEY (helper_id) REFERENCES users(id),
  CONSTRAINT chk_task_posts_status CHECK (status IN ('pending', 'ongoing', 'pending_confirm', 'completed', 'cancelled'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE task_evaluations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  task_id BIGINT UNSIGNED NOT NULL,
  from_user_id BIGINT UNSIGNED NOT NULL,
  to_user_id BIGINT UNSIGNED NOT NULL,
  rating VARCHAR(10) NOT NULL,
  comment VARCHAR(500) DEFAULT '',
  credit_change INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_task_evaluations_task_from_to (task_id, from_user_id, to_user_id),
  KEY idx_task_evaluations_to_user_id (to_user_id),
  CONSTRAINT fk_task_evaluations_task_id FOREIGN KEY (task_id) REFERENCES task_posts(id),
  CONSTRAINT fk_task_evaluations_from_user_id FOREIGN KEY (from_user_id) REFERENCES users(id),
  CONSTRAINT fk_task_evaluations_to_user_id FOREIGN KEY (to_user_id) REFERENCES users(id),
  CONSTRAINT chk_task_evaluations_rating CHECK (rating IN ('good', 'neutral', 'bad'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE buddy_posts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  creator_id BIGINT UNSIGNED NOT NULL,
  creator_name VARCHAR(50) NOT NULL,
  title VARCHAR(120) NOT NULL,
  activity_type VARCHAR(50) NOT NULL,
  location_text VARCHAR(255) NOT NULL,
  latitude DECIMAL(10,7) NOT NULL DEFAULT 0,
  longitude DECIMAL(10,7) NOT NULL DEFAULT 0,
  radius_meter INT NOT NULL DEFAULT 500,
  distance_meter INT NOT NULL DEFAULT 0,
  event_time DATETIME NOT NULL,
  max_members INT NOT NULL DEFAULT 2,
  current_members INT NOT NULL DEFAULT 1,
  tags_json JSON DEFAULT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_buddy_posts_creator_id (creator_id),
  KEY idx_buddy_posts_status_event_time (status, event_time),
  KEY idx_buddy_posts_location (latitude, longitude),
  CONSTRAINT fk_buddy_posts_creator_id FOREIGN KEY (creator_id) REFERENCES users(id),
  CONSTRAINT chk_buddy_posts_status CHECK (status IN ('open', 'full', 'completed', 'cancelled', 'disabled')),
  CONSTRAINT chk_buddy_posts_members CHECK (current_members >= 0 AND max_members >= 1 AND current_members <= max_members)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE buddy_members (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  buddy_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  nickname_snapshot VARCHAR(50) NOT NULL,
  role_type VARCHAR(20) NOT NULL DEFAULT 'member',
  join_status VARCHAR(20) NOT NULL DEFAULT 'joined',
  joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_buddy_members_buddy_user (buddy_id, user_id),
  KEY idx_buddy_members_user_id (user_id),
  CONSTRAINT fk_buddy_members_buddy_id FOREIGN KEY (buddy_id) REFERENCES buddy_posts(id),
  CONSTRAINT fk_buddy_members_user_id FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT chk_buddy_members_role_type CHECK (role_type IN ('creator', 'member')),
  CONSTRAINT chk_buddy_members_join_status CHECK (join_status IN ('joined', 'left', 'kicked'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE buddy_evaluations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  buddy_id BIGINT UNSIGNED NOT NULL,
  from_user_id BIGINT UNSIGNED NOT NULL,
  to_user_id BIGINT UNSIGNED NOT NULL,
  rating VARCHAR(10) NOT NULL,
  comment VARCHAR(500) DEFAULT '',
  credit_change INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_buddy_evaluations_buddy_from_to (buddy_id, from_user_id, to_user_id),
  KEY idx_buddy_evaluations_to_user_id (to_user_id),
  CONSTRAINT fk_buddy_evaluations_buddy_id FOREIGN KEY (buddy_id) REFERENCES buddy_posts(id),
  CONSTRAINT fk_buddy_evaluations_from_user_id FOREIGN KEY (from_user_id) REFERENCES users(id),
  CONSTRAINT fk_buddy_evaluations_to_user_id FOREIGN KEY (to_user_id) REFERENCES users(id),
  CONSTRAINT chk_buddy_evaluations_rating CHECK (rating IN ('good', 'neutral', 'bad'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE buddy_reports (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  buddy_id BIGINT UNSIGNED NOT NULL,
  reporter_id BIGINT UNSIGNED DEFAULT NULL,
  reporter_name VARCHAR(50) DEFAULT '游客',
  reason VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  admin_id BIGINT UNSIGNED DEFAULT NULL,
  admin_note VARCHAR(500) DEFAULT '',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_buddy_reports_buddy_id (buddy_id),
  KEY idx_buddy_reports_status_created_at (status, created_at),
  KEY idx_buddy_reports_admin_id (admin_id),
  CONSTRAINT fk_buddy_reports_buddy_id FOREIGN KEY (buddy_id) REFERENCES buddy_posts(id),
  CONSTRAINT fk_buddy_reports_reporter_id FOREIGN KEY (reporter_id) REFERENCES users(id),
  CONSTRAINT fk_buddy_reports_admin_id FOREIGN KEY (admin_id) REFERENCES users(id),
  CONSTRAINT chk_buddy_reports_status CHECK (status IN ('pending', 'approved', 'rejected'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE moderation_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  target_type VARCHAR(30) NOT NULL,
  target_id BIGINT UNSIGNED NOT NULL,
  action VARCHAR(30) NOT NULL,
  operator_admin_id BIGINT UNSIGNED NOT NULL,
  reason VARCHAR(255) DEFAULT '',
  note VARCHAR(500) DEFAULT '',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_moderation_logs_target (target_type, target_id),
  KEY idx_moderation_logs_operator_admin_id (operator_admin_id),
  KEY idx_moderation_logs_created_at (created_at),
  CONSTRAINT fk_moderation_logs_operator_admin_id FOREIGN KEY (operator_admin_id) REFERENCES users(id),
  CONSTRAINT chk_moderation_logs_target_type CHECK (target_type IN ('post', 'task', 'buddy', 'user', 'report'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_behaviors (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  target_type VARCHAR(30) NOT NULL,
  target_id BIGINT UNSIGNED NOT NULL,
  action VARCHAR(50) NOT NULL,
  tags_json JSON DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_user_behaviors_user_id_created_at (user_id, created_at),
  KEY idx_user_behaviors_target (target_type, target_id),
  CONSTRAINT fk_user_behaviors_user_id FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT chk_user_behaviors_target_type CHECK (target_type IN ('task', 'buddy', 'post'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE admin_operation_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  admin_id BIGINT UNSIGNED NOT NULL,
  operation_type VARCHAR(50) NOT NULL,
  target_type VARCHAR(30) NOT NULL,
  target_id BIGINT UNSIGNED DEFAULT NULL,
  detail_json JSON DEFAULT NULL,
  ip_address VARCHAR(64) DEFAULT '',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_admin_operation_logs_admin_id_created_at (admin_id, created_at),
  KEY idx_admin_operation_logs_target (target_type, target_id),
  CONSTRAINT fk_admin_operation_logs_admin_id FOREIGN KEY (admin_id) REFERENCES users(id),
  CONSTRAINT chk_admin_operation_logs_target_type CHECK (target_type IN ('user', 'post', 'task', 'buddy', 'report', 'system'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
