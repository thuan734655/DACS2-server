-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 29, 2024 at 03:36 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `dacs2`
--

-- --------------------------------------------------------

--
-- Table structure for table `account`
--

CREATE TABLE `account` (
  `idUser` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `otp` varchar(255) DEFAULT NULL,
  `infoDevice` text DEFAULT NULL,
  `last_active` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_update_last_active` tinyint(1) DEFAULT 1,
  `isActive` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `account`
--

INSERT INTO `account` (`idUser`, `email`, `password`, `otp`, `infoDevice`, `last_active`, `is_update_last_active`, `isActive`) VALUES
(177, 'nanco432@gmail.com', '$2b$10$e7qB1GnhHVMDPGD4EseG.e6Trbo5Djnjva/PPNCNf5m/hD3i3T6CC', 'NULL', NULL, '2024-10-19 09:46:16', 1, 1),
(178, 'nanco4312@gmail.com', '$2a$10$tmb/UdJXjuLaZZIzeyTvDuXgc6VXpPsrJXjt8LHpJE/ywPAsPkPVe', '838040', NULL, '2024-10-19 09:46:51', 1, 0),
(179, 'nanc11o432@gmail.com', '$2a$10$Wuh9qgJHc1Y6uIv7fso.eugC1t/1w17bucXL7wxs45QUNV75xc386', '422584', '3099f4563115a538dd82b277cf21abcd', '2024-10-19 09:52:34', 1, 0),
(180, 'vanthkkuan678310@gmail.com', '$2a$10$uSUnoVpQbE8MvXKfiZM8vuqEtWdWQlwsDX9C7eGNuaeIYZAE84PNy', '716107', NULL, '2024-10-19 10:01:34', 1, 1),
(181, 'nanco43uu2@gmail.com', '$2a$10$pxO3tbBzlfn0h4Bga2WPj.UvB6BeR0pH0VUHA9dh9DpwsYRHSqdoa', '457830', '3099f4563115a538dd82b277cf21abcd', '2024-10-19 10:06:03', 1, 0),
(182, 'jjthuanvn.23itb@vku.udn.vn', '$2a$10$03gSomFO7fXmVHcILFAKMeBW/aeWlSL0mfDETnw9jtRg878fFCtEq', '918961', NULL, '2024-10-19 10:07:25', 1, 1),
(183, 'nanco4jj32@gmail.com', '$2a$10$s.gubdHNA9jPnIJvO3PjX.NldU/0R5rg7wWbCKYLFRhslRiqzGhSm', '789191', '3099f4563115a538dd82b277cf21abcd', '2024-10-19 10:26:33', 1, 1),
(184, 'vanthuan67jk8310@gmail.com', '$2a$10$071yqgrfgBxOX151giwdBOC6H5lNvVs2iCNnhToCM6f0WoJMsuAAu', 'NULL', 'e0410d51363e595ee75434e947157451', '2024-11-07 14:32:10', 1, 1),
(185, 'nanco43gdsgsd2@gmail.com', '$2a$10$IBeFipzpof4Uzeh9UgfVpOQ4YMUCdvtJLGo7SM6LbfJRM7GwV.O6y', '549310', NULL, '2024-11-11 15:49:33', 1, 0),
(186, 'vanthuan67gsdgds8310@gmail.com', '$2a$10$/YDOdlSAGk70l4pqD5QGKuhi/nham8mFy63DN9Lq4k.nCeBo7Y8dG', '832897', NULL, '2024-11-11 15:49:58', 1, 0),
(187, 'nanco431242@gmail.com', '$2a$10$L5MjSDP4q7Hwrc6dTtl9LOwgldVHXa35FJ4LsNSAV8TWurIKOtOZq', '208263', NULL, '2024-11-28 07:41:32', 1, 0),
(188, 'nanco432111@gmail.com', '$2a$10$SlFYC3MKSU2K1.6HIwHNxOXrQZQJuUwUiDrkjdLTFaVstmL4eB0Mu', 'NULL', 'e0410d51363e595ee75434e947157451', '2024-11-28 07:41:59', 1, 1),
(189, 'nanco43adfs2@gmail.com', '$2a$10$6iCacwj3Z4nWgzVJogF5auztUlyI8eTa1T86YXsuWPZnoKo8UoWEa', 'NULL', 'e0410d51363e595ee75434e947157451', '2024-11-28 07:44:41', 1, 1),
(190, 'vanthuan672111r2f8310@gmail.com', '$2a$10$qT6aR1SQFthmOSoGdE9Cj.vsRAetuB6XSMzxZueoRyExSq9UYPEe6', 'NULL', 'e0410d51363e595ee75434e947157451', '2024-11-28 07:59:09', 1, 1),
(191, 'nanco432afwwf@gmail.com', '$2a$10$99f.dj8T8x2UhouaMVI/RuVA8.Frp9FYB/8JnVwlMTuJdyZGBUPe6', 'NULL', 'e0410d51363e595ee75434e947157451', '2024-11-28 08:11:04', 1, 1),
(192, 'nanco43ff2@gmail.com', '$2a$10$UwVyKpi9JJdVk9.FYeL.T.neVrHAOZ4lFkW.SgfYRMObh0mBQbXfG', 'NULL', 'e0410d51363e595ee75434e947157451', '2024-11-28 08:15:21', 1, 1),
(193, 'naasvsav@gmail.com', '$2a$10$CD.AIkatOwGkp7DuGAhsLOlp4OgwEuEDuJDeX.KU0E8669f03qrBq', '814552', 'd14bbd2adbd8acc1a2a9ef2d6c899e16', '2024-11-28 08:21:21', 1, 0),
(194, 'nanco43sss2@gmail.com', '$2a$10$PtYUQotq655pxvMiRf2w/u5P/2nYHALz25adJbEyIyr3h/2RqVk4i', 'NULL', 'e0410d51363e595ee75434e947157451', '2024-11-28 15:15:38', 1, 1),
(195, 'nanco4ass32@gmail.com', '$2a$10$OYD7xyXdV9YZmMpI3ycdNO2XbKtvqfcCIwQ7ocXhBODA1PQM1Uu5i', 'NULL', 'd14bbd2adbd8acc1a2a9ef2d6c899e16', '2024-11-28 16:45:05', 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `attachments`
--

CREATE TABLE `attachments` (
  `id` int(11) NOT NULL,
  `message_id` int(11) DEFAULT NULL,
  `file_url` varchar(255) NOT NULL,
  `file_type` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `comments`
--

CREATE TABLE `comments` (
  `idPost` int(11) NOT NULL,
  `quanlityLike` int(11) NOT NULL,
  `date` date NOT NULL,
  `idUser` int(11) NOT NULL,
  `idComment` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `contentpost`
--

CREATE TABLE `contentpost` (
  `idContentPost` int(11) NOT NULL,
  `idPost` int(11) NOT NULL,
  `type` enum('video','image','','') NOT NULL,
  `url` text NOT NULL,
  `order` int(11) NOT NULL,
  `width` int(11) NOT NULL,
  `height` int(11) NOT NULL,
  `runtime` int(11) NOT NULL,
  `create_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `content_comment`
--

CREATE TABLE `content_comment` (
  `idContentComment` int(11) NOT NULL,
  `idComment` int(11) NOT NULL,
  `type` enum('video','image','','') NOT NULL,
  `url` text NOT NULL,
  `create_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `conversations`
--

CREATE TABLE `conversations` (
  `id_conversations` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `is_group` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `conversation_participants`
--

CREATE TABLE `conversation_participants` (
  `id_conversations` int(11) NOT NULL,
  `idUser` int(11) NOT NULL,
  `joined_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `friends`
--

CREATE TABLE `friends` (
  `idUser` int(11) NOT NULL,
  `idFriend` int(11) NOT NULL,
  `relationship` varchar(255) NOT NULL,
  `isBlock` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `friend_requests`
--

CREATE TABLE `friend_requests` (
  `id` int(11) NOT NULL,
  `requester_id` int(11) DEFAULT NULL,
  `receiver_id` int(11) DEFAULT NULL,
  `status` enum('pending','accepted','declined','blocked') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `groupmember`
--

CREATE TABLE `groupmember` (
  `idGroup` int(11) NOT NULL,
  `idUser` int(11) NOT NULL,
  `role` enum('admin','member','','') NOT NULL,
  `join_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `isAccept` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `groups`
--

CREATE TABLE `groups` (
  `idGroup` int(11) NOT NULL,
  `groupName` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `privacy` enum('private','public','','') NOT NULL,
  `create_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `update_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `group_comment`
--

CREATE TABLE `group_comment` (
  `idComment` int(11) NOT NULL,
  `idGroupPost` int(11) NOT NULL,
  `idUser` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `group_post`
--

CREATE TABLE `group_post` (
  `id_groupPost` int(11) NOT NULL,
  `idGroup` int(11) NOT NULL,
  `idUser` int(11) NOT NULL,
  `idContentPost` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `id` int(11) NOT NULL,
  `id_conversations` int(11) DEFAULT NULL,
  `sender_id` int(11) DEFAULT NULL,
  `content` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `message_status`
--

CREATE TABLE `message_status` (
  `message_id` int(11) NOT NULL,
  `idUser` int(11) NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `read_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `idNotification` int(11) NOT NULL,
  `idUser` int(11) NOT NULL,
  `id_type` int(11) NOT NULL,
  `id_reference` int(11) DEFAULT NULL,
  `type_reference` enum('user','post','comment','group','event') NOT NULL,
  `message` text NOT NULL,
  `create_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `read_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notification_types`
--

CREATE TABLE `notification_types` (
  `id_type` int(11) NOT NULL,
  `name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `posts`
--

CREATE TABLE `posts` (
  `idPost` int(11) NOT NULL,
  `IdUser` int(11) NOT NULL,
  `idPostRoot` int(11) DEFAULT NULL,
  `created` timestamp NOT NULL DEFAULT current_timestamp(),
  `CommentCount` int(11) NOT NULL,
  `likeCount` int(11) NOT NULL,
  `shareCount` int(11) NOT NULL,
  `idContent` int(11) NOT NULL,
  `update` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `reply`
--

CREATE TABLE `reply` (
  `idReply` int(11) NOT NULL,
  `idParent` int(11) NOT NULL,
  `contentText` int(11) NOT NULL,
  `contentImage` int(11) NOT NULL,
  `date` int(11) NOT NULL,
  `quantity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `idUser` int(11) NOT NULL,
  `fullName` varchar(255) NOT NULL,
  `nickname` varchar(255) NOT NULL,
  `birthday` date NOT NULL,
  `avatar` text NOT NULL DEFAULT 'https://www.pinterest.com/pin/964685182669913994/',
  `background` text NOT NULL,
  `residence` varchar(255) NOT NULL,
  `education` text NOT NULL,
  `follow` int(11) NOT NULL,
  `create_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `gender` enum('Male','Female','','') NOT NULL DEFAULT 'Male'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`idUser`, `fullName`, `nickname`, `birthday`, `avatar`, `background`, `residence`, `education`, `follow`, `create_at`, `gender`) VALUES
(177, 'vsd gjas', '', '1980-01-01', 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/b2eaa0d4918d54021f9c7aa3fc3d3cf3.jpg', '', '', '', 0, '2024-10-19 09:46:16', 'Male'),
(178, 'fasf gjas', '', '1980-01-01', 'https://tintuc.dienthoaigiakho.vn/wp-content/uploads/2024/01/096b2357ef2465830bee221e082b07e3.jpg', '', '', '', 0, '2024-10-19 09:46:51', 'Male'),
(179, 'fasf gjas', '', '1980-01-01', '', '', '', '', 0, '2024-10-19 09:52:34', 'Male'),
(180, 'vsd gjas', '', '1980-01-01', '', '', '', '', 0, '2024-10-19 10:01:34', 'Male'),
(181, 'fasf f', '', '1980-01-01', '', '', '', '', 0, '2024-10-19 10:06:03', 'Male'),
(182, 'fasf gjas', '', '1980-01-01', '', '', '', '', 0, '2024-10-19 10:07:25', 'Male'),
(183, 'vsd gjas', '', '1980-01-01', '', '', '', '', 0, '2024-10-19 10:26:33', 'Male'),
(184, 'vsd gjas', '', '1980-01-01', '', '', '', '', 0, '2024-11-07 14:32:10', 'Male'),
(185, 'vsd gjas', '', '1980-01-01', '', '', '', '', 0, '2024-11-11 15:49:33', 'Male'),
(186, 'gs f', '', '1980-01-01', '', '', '', '', 0, '2024-11-11 15:49:58', 'Male'),
(187, 'gsdd gsdg', '', '1980-01-01', '', '', '', '', 0, '2024-11-28 07:41:32', 'Male'),
(188, 'vsd vsvd', '', '1980-01-01', '', '', '', '', 0, '2024-11-28 07:41:59', 'Male'),
(189, 'hehe vsdvs', '', '1980-01-01', '', '', '', '', 0, '2024-11-28 07:44:41', 'Male'),
(190, 's vsdvd', '', '1980-01-01', '', '', '', '', 0, '2024-11-28 07:59:09', 'Male'),
(191, 'dvsd vsd', '', '1980-01-01', '', '', '', '', 0, '2024-11-28 08:11:04', 'Male'),
(192, 'bdf bdf', '', '1980-01-01', '', '', '', '', 0, '2024-11-28 08:15:21', 'Male'),
(193, 'vsd wvds', '', '1980-01-01', 'https://www.pinterest.com/pin/964685182669913994/', '', '', '', 0, '2024-11-28 08:21:21', 'Male'),
(194, 'vsd gsd', '', '1980-01-01', 'https://www.pinterest.com/pin/964685182669913994/', '', '', '', 0, '2024-11-28 15:15:38', 'Male'),
(195, 'sd vsdv', '', '1980-01-01', 'https://www.pinterest.com/pin/964685182669913994/', '', '', '', 0, '2024-11-28 16:45:05', 'Male');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `account`
--
ALTER TABLE `account`
  ADD PRIMARY KEY (`idUser`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `attachments`
--
ALTER TABLE `attachments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `message_id` (`message_id`);

--
-- Indexes for table `comments`
--
ALTER TABLE `comments`
  ADD PRIMARY KEY (`idComment`),
  ADD KEY `idPost` (`idPost`,`idUser`),
  ADD KEY `idUser` (`idUser`);

--
-- Indexes for table `contentpost`
--
ALTER TABLE `contentpost`
  ADD PRIMARY KEY (`idContentPost`),
  ADD KEY `idPost` (`idPost`);

--
-- Indexes for table `content_comment`
--
ALTER TABLE `content_comment`
  ADD PRIMARY KEY (`idContentComment`),
  ADD KEY `idComment` (`idComment`);

--
-- Indexes for table `conversations`
--
ALTER TABLE `conversations`
  ADD PRIMARY KEY (`id_conversations`);

--
-- Indexes for table `conversation_participants`
--
ALTER TABLE `conversation_participants`
  ADD PRIMARY KEY (`id_conversations`,`idUser`),
  ADD KEY `idUser` (`idUser`);

--
-- Indexes for table `friends`
--
ALTER TABLE `friends`
  ADD PRIMARY KEY (`idUser`,`idFriend`),
  ADD KEY `idFriend` (`idFriend`);

--
-- Indexes for table `friend_requests`
--
ALTER TABLE `friend_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `requester_id` (`requester_id`),
  ADD KEY `receiver_id` (`receiver_id`);

--
-- Indexes for table `groupmember`
--
ALTER TABLE `groupmember`
  ADD PRIMARY KEY (`idGroup`),
  ADD KEY `idUser` (`idUser`);

--
-- Indexes for table `groups`
--
ALTER TABLE `groups`
  ADD PRIMARY KEY (`idGroup`);

--
-- Indexes for table `group_comment`
--
ALTER TABLE `group_comment`
  ADD PRIMARY KEY (`idComment`),
  ADD KEY `idGroupPost` (`idGroupPost`,`idUser`),
  ADD KEY `idUser` (`idUser`);

--
-- Indexes for table `group_post`
--
ALTER TABLE `group_post`
  ADD PRIMARY KEY (`id_groupPost`),
  ADD KEY `idGroup` (`idGroup`,`idUser`,`idContentPost`),
  ADD KEY `idUser` (`idUser`),
  ADD KEY `idContentPost` (`idContentPost`);

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_conversations` (`id_conversations`),
  ADD KEY `sender_id` (`sender_id`);

--
-- Indexes for table `message_status`
--
ALTER TABLE `message_status`
  ADD PRIMARY KEY (`message_id`,`idUser`),
  ADD KEY `idUser` (`idUser`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`idNotification`),
  ADD KEY `idUser` (`idUser`,`id_type`,`id_reference`),
  ADD KEY `id_type` (`id_type`);

--
-- Indexes for table `notification_types`
--
ALTER TABLE `notification_types`
  ADD PRIMARY KEY (`id_type`);

--
-- Indexes for table `posts`
--
ALTER TABLE `posts`
  ADD PRIMARY KEY (`idPost`),
  ADD KEY `IdUser` (`IdUser`),
  ADD KEY `idPostRoot` (`idPostRoot`,`idContent`),
  ADD KEY `idPostRoot_2` (`idPostRoot`,`idContent`);

--
-- Indexes for table `reply`
--
ALTER TABLE `reply`
  ADD PRIMARY KEY (`idReply`),
  ADD KEY `idParent` (`idParent`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`idUser`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `account`
--
ALTER TABLE `account`
  MODIFY `idUser` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=196;

--
-- AUTO_INCREMENT for table `attachments`
--
ALTER TABLE `attachments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `comments`
--
ALTER TABLE `comments`
  MODIFY `idComment` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `contentpost`
--
ALTER TABLE `contentpost`
  MODIFY `idContentPost` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `content_comment`
--
ALTER TABLE `content_comment`
  MODIFY `idContentComment` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `conversations`
--
ALTER TABLE `conversations`
  MODIFY `id_conversations` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `friend_requests`
--
ALTER TABLE `friend_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `groupmember`
--
ALTER TABLE `groupmember`
  MODIFY `idGroup` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `groups`
--
ALTER TABLE `groups`
  MODIFY `idGroup` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `group_comment`
--
ALTER TABLE `group_comment`
  MODIFY `idComment` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `group_post`
--
ALTER TABLE `group_post`
  MODIFY `id_groupPost` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `idNotification` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notification_types`
--
ALTER TABLE `notification_types`
  MODIFY `id_type` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `posts`
--
ALTER TABLE `posts`
  MODIFY `idPost` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `reply`
--
ALTER TABLE `reply`
  MODIFY `idReply` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `idUser` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=196;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `attachments`
--
ALTER TABLE `attachments`
  ADD CONSTRAINT `attachments_ibfk_1` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `comments`
--
ALTER TABLE `comments`
  ADD CONSTRAINT `comments_ibfk_1` FOREIGN KEY (`idUser`) REFERENCES `user` (`idUser`),
  ADD CONSTRAINT `comments_ibfk_2` FOREIGN KEY (`idPost`) REFERENCES `posts` (`idPost`),
  ADD CONSTRAINT `comments_ibfk_3` FOREIGN KEY (`idComment`) REFERENCES `group_comment` (`idComment`);

--
-- Constraints for table `contentpost`
--
ALTER TABLE `contentpost`
  ADD CONSTRAINT `contentpost_ibfk_1` FOREIGN KEY (`idPost`) REFERENCES `posts` (`idPost`);

--
-- Constraints for table `content_comment`
--
ALTER TABLE `content_comment`
  ADD CONSTRAINT `content_comment_ibfk_1` FOREIGN KEY (`idComment`) REFERENCES `comments` (`idComment`);

--
-- Constraints for table `conversation_participants`
--
ALTER TABLE `conversation_participants`
  ADD CONSTRAINT `conversation_participants_ibfk_1` FOREIGN KEY (`id_conversations`) REFERENCES `conversations` (`id_conversations`) ON DELETE CASCADE,
  ADD CONSTRAINT `conversation_participants_ibfk_2` FOREIGN KEY (`idUser`) REFERENCES `user` (`idUser`) ON DELETE CASCADE;

--
-- Constraints for table `friends`
--
ALTER TABLE `friends`
  ADD CONSTRAINT `friends_ibfk_1` FOREIGN KEY (`idUser`) REFERENCES `user` (`idUser`),
  ADD CONSTRAINT `friends_ibfk_2` FOREIGN KEY (`idFriend`) REFERENCES `user` (`idUser`);

--
-- Constraints for table `friend_requests`
--
ALTER TABLE `friend_requests`
  ADD CONSTRAINT `friend_requests_ibfk_1` FOREIGN KEY (`requester_id`) REFERENCES `user` (`idUser`) ON DELETE CASCADE,
  ADD CONSTRAINT `friend_requests_ibfk_2` FOREIGN KEY (`receiver_id`) REFERENCES `user` (`idUser`) ON DELETE CASCADE;

--
-- Constraints for table `groupmember`
--
ALTER TABLE `groupmember`
  ADD CONSTRAINT `groupmember_ibfk_1` FOREIGN KEY (`idUser`) REFERENCES `user` (`idUser`),
  ADD CONSTRAINT `groupmember_ibfk_2` FOREIGN KEY (`idGroup`) REFERENCES `groups` (`idGroup`);

--
-- Constraints for table `group_comment`
--
ALTER TABLE `group_comment`
  ADD CONSTRAINT `group_comment_ibfk_1` FOREIGN KEY (`idUser`) REFERENCES `user` (`idUser`),
  ADD CONSTRAINT `group_comment_ibfk_2` FOREIGN KEY (`idGroupPost`) REFERENCES `group_post` (`id_groupPost`);

--
-- Constraints for table `group_post`
--
ALTER TABLE `group_post`
  ADD CONSTRAINT `group_post_ibfk_1` FOREIGN KEY (`idUser`) REFERENCES `user` (`idUser`),
  ADD CONSTRAINT `group_post_ibfk_2` FOREIGN KEY (`idGroup`) REFERENCES `groups` (`idGroup`),
  ADD CONSTRAINT `group_post_ibfk_3` FOREIGN KEY (`idContentPost`) REFERENCES `contentpost` (`idContentPost`);

--
-- Constraints for table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`id_conversations`) REFERENCES `conversations` (`id_conversations`) ON DELETE CASCADE,
  ADD CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `user` (`idUser`) ON DELETE CASCADE;

--
-- Constraints for table `message_status`
--
ALTER TABLE `message_status`
  ADD CONSTRAINT `message_status_ibfk_1` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `message_status_ibfk_2` FOREIGN KEY (`idUser`) REFERENCES `user` (`idUser`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`id_type`) REFERENCES `notification_types` (`id_type`),
  ADD CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`idUser`) REFERENCES `user` (`idUser`);

--
-- Constraints for table `posts`
--
ALTER TABLE `posts`
  ADD CONSTRAINT `posts_ibfk_1` FOREIGN KEY (`IdUser`) REFERENCES `user` (`idUser`);

--
-- Constraints for table `reply`
--
ALTER TABLE `reply`
  ADD CONSTRAINT `reply_ibfk_1` FOREIGN KEY (`idParent`) REFERENCES `comments` (`idComment`);

--
-- Constraints for table `user`
--
ALTER TABLE `user`
  ADD CONSTRAINT `user_ibfk_1` FOREIGN KEY (`idUser`) REFERENCES `account` (`idUser`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
