<?php

$path = OW::getPluginManager()->getPlugin('cocreation')->getRootDir() . 'langs.zip';
BOL_LanguageService::getInstance()->importPrefixFromZip($path, 'cocreation');

$sql = 'CREATE TABLE IF NOT EXISTS `' . OW_DB_PREFIX . 'cocreation_room` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` varchar(255),
  `ownerId` int(11) NOT NULL,
  `albumId` int(11),
  `name` varchar(255),
  `subject` varchar(255),
  `description` varchar(255),
  `from` date,
  `to` date,
  `goal` varchar(255),
  `invitationText` varchar(255),
  `isOpen` tinyint(1),
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8 ;

CREATE TABLE IF NOT EXISTS `' . OW_DB_PREFIX . 'cocreation_room_doc` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `roomId` int(11) NOT NULL,
  `url` varchar(255),
  `description` varchar(255),
  `templateId` int(11),
  PRIMARY KEY (`id`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8 ;

CREATE TABLE IF NOT EXISTS `' . OW_DB_PREFIX . 'cocreation_room_dataset` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `roomId` int(11) NOT NULL,
  `url` varchar(255),
  `name` varchar(255),
  `description` varchar(255),
  `fields` text,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8 ;

CREATE TABLE IF NOT EXISTS `' . OW_DB_PREFIX . 'cocreation_room_member` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `roomId` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `email` varchar(255),
  `isJoined` tinyint(1),
  PRIMARY KEY (`id`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8 ;

CREATE TABLE IF NOT EXISTS `' . OW_DB_PREFIX . 'cocreation_room_datalet` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `roomId` int(11) NOT NULL,
  `dataletId` int(11),
  PRIMARY KEY (`id`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8 ;

CREATE TABLE IF NOT EXISTS `' . OW_DB_PREFIX . 'cocreation_room_postit` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `roomId` int(11) NOT NULL,
  `dataletId` int(11),
  `title` varchar(255),
  `content` varchar(255),
  PRIMARY KEY (`id`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8 ;

CREATE TABLE IF NOT EXISTS `' . OW_DB_PREFIX . 'cocreation_room_sheet` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `roomId` int(11) NOT NULL,
  `url` varchar(255),
  `description` varchar(255),
  PRIMARY KEY (`id`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8 ;

CREATE TABLE IF NOT EXISTS `' . OW_DB_PREFIX . 'cocreation_room_metadata` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `roomId` int(11) NOT NULL,
  `common_core_required` mediumtext,
  `common_core_if_applicable` mediumtext,
  `expanded` mediumtext,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8 ;

CREATE TABLE IF NOT EXISTS `' . OW_DB_PREFIX . 'cocreation_dataset` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `owners` text,
  `roomId` int(11) NOT NULL,
  `datasetId` varchar(255) NOT NULL,
  `version` int(11) NOT NULL,
  `data` mediumtext,
  `notes` mediumtext,
  `common_core_required_metadata` mediumtext,
  `common_core_if_applicable_metadata` mediumtext,
  `expanded_metadata` mediumtext,
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8 ;


CREATE TABLE IF NOT EXISTS `' . OW_DB_PREFIX . 'cocreation_template` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` varchar(255),
  `url` varchar(255),
  PRIMARY KEY (`id`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8 ;
';

OW::getDbo()->query($sql);

$authorization = OW::getAuthorization();
$groupName = 'cocreation';
$authorization->addGroup($groupName);
$authorization->addAction($groupName, 'view', true);
$authorization->addAction($groupName, 'add_comment');