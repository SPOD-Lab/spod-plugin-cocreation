<?php
OW::getRouter()->addRoute(new OW_Route('cocreation.index', 'cocreation', "COCREATION_CTRL_Main", 'index'));
OW::getRouter()->addRoute(new OW_Route('cocreation.knowledge.room', 'cocreation/knowledge-room/:roomId', "COCREATION_CTRL_KnowledgeRoom", 'index'));
OW::getRouter()->addRoute(new OW_Route('cocreation.data.room', 'cocreation/data-room/:roomId', "COCREATION_CTRL_DataRoom", 'index'));
OW::getRouter()->addRoute(new OW_Route('cocreation.room.discussion', 'cocreation/data-room/discussion/:roomId', "COCREATION_CTRL_DiscussionWrapper", 'index'));

OW::getRouter()->addRoute(new OW_Route('cocreation.data.room.list', 'cocreation/data-room-list', "COCREATION_CTRL_DataRoomList", 'index'));
OW::getRouter()->addRoute(new OW_Route('cocreation.photo','cocreation/photo/:user/:albumId',"COCREATION_CTRL_Photo",'explore'));
OW::getRouter()->addRoute(new OW_Route('cocreation.album', 'cocreation/album/:user/:albumId', "COCREATION_CTRL_Photo", 'userAlbum'));
OW::getRouter()->addRoute(new OW_Route('cocreation.submit', 'cocreation/submit', "COCREATION_CTRL_AjaxUpload", 'ajaxSubmitPhotos'));
OW::getRouter()->addRoute(new OW_Route('cocreation.getPhoto', 'cocreation/getPhoto', "COCREATION_CTRL_Ajax", 'getPhotoUrl'));
OW::getRouter()->addRoute(new OW_Route('cocreation.getRoom', 'cocreation/getRoom', "COCREATION_CTRL_Ajax", 'getRoomId'));



//Admin area
OW::getRouter()->addRoute(new OW_Route('cocreation-settings', '/cocreation/settings', 'COCREATION_CTRL_Admin', 'settings'));
OW::getRouter()->addRoute(new OW_Route('cocreation-analysis', '/cocreation/analysis', 'COCREATION_CTRL_Admin', 'analysis'));

COCREATION_CLASS_EventHandler::getInstance()->init();