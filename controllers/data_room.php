<?php

class COCREATION_CTRL_DataRoom extends OW_ActionController
{
    public function index(array $params)
    {


        if ( !OW::getUser()->isAuthenticated() )
        {
            throw new AuthenticateException();
        }



        OW::getDocument()->addScript(OW::getPluginManager()->getPlugin('spodtchat')->getStaticJsUrl() . 'vendor/livequery-1.1.1/jquery.livequery.js');

        OW::getDocument()->addScript(OW::getPluginManager()->getPlugin('cocreation')->getStaticJsUrl() . 'perfect-scrollbar/js/min/perfect-scrollbar.jquery.min.js');
        OW::getDocument()->addScript(OW::getPluginManager()->getPlugin('cocreation')->getStaticJsUrl() . 'cocreation.js');
        OW::getDocument()->addScript(OW::getPluginManager()->getPlugin('cocreation')->getStaticJsUrl() . 'cocreation-room.js');
        OW::getDocument()->addScript(OW::getPluginManager()->getPlugin('cocreation')->getStaticJsUrl() . 'cocreation-data.js');

        OW::getDocument()->addStyleSheet(OW::getPluginManager()->getPlugin('cocreation')->getStaticJsUrl() . 'perfect-scrollbar/css/perfect-scrollbar.css');
        OW::getDocument()->getMasterPage()->setTemplate(OW::getPluginManager()->getPlugin('cocreation')->getRootDir() . 'master_pages/general.html');


        OW::getDocument()->addScript(OW::getPluginManager()->getPlugin('cocreation')->getStaticJsUrl() . 'browse_photo.js');
       // OW::getDocument()->addOnloadScript(';window.browsePhoto.init();');


       // OW::getDocument()->addScript(OW::getPluginManager()->getPlugin('photo')->getStaticJsUrl() . 'utils.js');
       // QW::getDocument()->addScript(OW::getPluginManager()->getPlugin('cocreation')->getStaticJsUrl()  . 'browse_photo.js');
        $this->assign('components_url', SPODPR_COMPONENTS_URL);

        if(COCREATION_BOL_Service::getInstance()->isMemberJoinedToRoom(OW::getUser()->getId(), intval($params['roomId'])))
            $this->assign('isMember',true);
        else
            $this->assign('isMember',false);

        //Set info for current co-creation room
        $room = COCREATION_BOL_Service::getInstance()->getRoomById($params['roomId']);
        $this->assign('owner', BOL_AvatarService::getInstance()->getDataForUserAvatars(array($room->ownerId))[$room->ownerId]);

        if(intval($room->ownerId) == OW::getUser()->getId()) {
            $this->assign('ownerUserActive', true);
            $this->assign('isMember', true);
        }else
            $this->assign('ownerUserActive', false);

        $this->assign('room', $room);

        $datalets = COCREATION_BOL_Service::getInstance()->getDataletsByRoomId($params['roomId']);
        $room_datalets = array();
        foreach($datalets as $d){
            $datalet         =  ODE_BOL_Service::getInstance()->getDataletById($d->dataletId);
            $datalet->params = json_decode($datalet->params);
            $datalet->data   = str_replace("'","&#39;", $datalet->data);
            $datalet->fields = str_replace("'","&#39;", $datalet->fields);

            $datalet_string = "<" . $datalet->component . " datalet-id='". $datalet->id ."' fields='[" . rtrim(ltrim($datalet->fields, "}"), "{") . "]'";
            foreach($datalet->params as $key => $value)
                $datalet_string .= " " . $key . "='" . $value . "'";
            $datalet_string .= "></" . $datalet->component . ">";

            array_push($room_datalets, $datalet_string);
        }

        //Get room members
        $room_members = COCREATION_BOL_Service::getInstance()->getRoomMembers($params['roomId']);
        $members    = array();
        $membersIds = array($room->ownerId);

        foreach($room_members as $member) {
            $user   = BOL_UserService::getInstance()->findByEmail($member->email);
            $avatar = BOL_AvatarService::getInstance()->getDataForUserAvatars(array($user->id))[$user->id];
            $avatar['isJoined'] = $member->isJoined;
            array_push($members, $avatar);
            array_push($membersIds, $user->id);
        }
        $this->assign('members', $members);

        $info                 = new stdClass();
        $info->name           = $room->name;
        $info->subject        = $room->subject;
        $info->description    = $room->description;
        $info->from           = $room->from;
        $info->to             = $room->to;
        $info->goal           = $room->goal;
        $info->invitationText = $room->invitationText;
        $info->owner = BOL_AvatarService::getInstance()->getDataForUserAvatars(array($room->ownerId))[$room->ownerId];
        $info->members = $members;

        $this->assign('currentUser' , BOL_AvatarService::getInstance()->getDataForUserAvatars(array(OW::getUser()->getId()))[OW::getUser()->getId()]);

        $sheetUrl = COCREATION_BOL_Service::getInstance()->getSheetByRoomId($params['roomId'])[0]->url;
        $sheetName = explode('/', $sheetUrl)[4];
        $noteUrl = COCREATION_BOL_Service::getInstance()->getDocumentsByRoomId($params['roomId'])[0]->url;
        $this->assign('spreadsheet', $sheetUrl);
        $this->assign('notes', $noteUrl);

        $data = COCREATION_BOL_Service::getInstance()->getSheetData($sheetName);
        $headers = array();
        foreach($data as $serie) array_push($headers, $serie->name);
        $this->assign('headers', $headers);
        $this->assign('data', json_encode($data));

        $metadata = COCREATION_BOL_Service::getInstance()->getMetadataByRoomId($params['roomId']);

        $metadataObj = new stdClass();
        $metadataObj->CC_RF = json_decode($metadata[0]->common_core_required);
        $metadataObj->CC_RAF = json_decode($metadata[0]->common_core_if_applicable);
        $metadataObj->EF = json_decode($metadata[0]->expanded);

        //DISCUSSION
        //$this->addComponent("comments", new COCREATION_CMP_DiscussionWrapper($params['roomId']));
        $commentsParams = new SPODTCHAT_CLASS_CommentsParams('cocreation', COCREATION_BOL_Service::ROOM_ENTITY_TYPE);
        $commentsParams->setEntityId($params['roomId']);
        $commentsParams->setDisplayType(BASE_CommentsParams::DISPLAY_TYPE_WITH_LOAD_LIST);
        //$commentsParams->setCommentCountOnPage(5);
        $commentsParams->setOwnerId((OW::getUser()->getId()));
        $commentsParams->setAddComment(true);
        $commentsParams->setWrapInBox(false);
        $commentsParams->setShowEmptyList(false);
        $commentsParams->setCommentPreviewMaxCharCount(5000);
        $commentsParams->setCommentEntityType(COCREATION_BOL_Service::COMMENT_ENTITY_TYPE);
        $commentsParams->setNumberOfNestedLevel(2);

        $commentsParams->level  = 0;
        $commentsParams->nodeId = 0;

        /* ODE */
        /* if (OW::getPluginManager()->isPluginActive('spodpr'))
             $this->addComponent('private_room', new SPODPR_CMP_PrivateRoomCard('ow_attachment_btn', array('datalet', 'link')));*/
        /* ODE */

        $commentCmp = new SPODTCHAT_CMP_Comments($commentsParams);
        $this->addComponent('comments', $commentCmp);

        $js = UTIL_JsGenerator::composeJsString('
                ODE.ajax_coocreation_room_get_datalets        = {$ajax_coocreation_room_get_datalets}
                ODE.ajax_coocreation_room_get_array_sheetdata = {$ajax_coocreation_room_get_array_sheetdata}
                ODE.ajax_coocreation_room_update_metadata     = {$ajax_coocreation_room_update_metadata}
                ODE.ajax_coocreation_room_add_datalet         = {$ajax_coocreation_room_add_datalet}
                ODE.ajax_coocreation_room_delete_datalet      = {$ajax_coocreation_room_delete_datalet}
                ODE.ajax_coocreation_room_publish_dataset     = {$ajax_coocreation_room_publish_dataset}
                ODE.ajax_coocreation_room_get_html_note       = {$ajax_coocreation_room_get_html_note}
                ODE.ajax_coocreation_room_delete_user         = {$ajax_coocreation_room_delete_user}
                ODE.ajax_coocreation_room_get_photo           = {$ajax_coocreation_room_get_photo}
                COCREATION.sheetName                          = {$sheetName}
                COCREATION.roomId                             = {$roomId}
                COCREATION.ownerId                            = {$ownerId}
                COCREATION.room_type                          = "data"
                COCREATION.entity_type                        = {$entity_type}
                COCREATION.room_members                       = {$room_members}
                COCREATION.datalets                           = {$roomDatalets}
                COCREATION.metadata                           = {$room_metadata}
                COCREATION.user_id                            = {$userId}
                COCREATION.info                               = {$roomInfo}
                COCREATION.album                              = {$album}
            ', array(
               'ajax_coocreation_room_get_datalets'        => OW::getRouter()->urlFor('COCREATION_CTRL_Ajax', 'getRoomDatalets'),
               'ajax_coocreation_room_get_array_sheetdata' => OW::getRouter()->urlFor('COCREATION_CTRL_Ajax', 'getArrayOfObjectSheetData') . "?sheetName=" . $sheetName,
               'ajax_coocreation_room_update_metadata'      => OW::getRouter()->urlFor('COCREATION_CTRL_Ajax', 'updateMetadata'),
               'ajax_coocreation_room_add_datalet'         => OW::getRouter()->urlFor('COCREATION_CTRL_Ajax', 'addDataletToRoom')          . "?roomId="  . $params['roomId'],
               'ajax_coocreation_room_delete_datalet'      => OW::getRouter()->urlFor('COCREATION_CTRL_Ajax', 'deleteDataletFromRoom'),
               'ajax_coocreation_room_publish_dataset'     => OW::getRouter()->urlFor('COCREATION_CTRL_Ajax', 'publishDataset'),
               'ajax_coocreation_room_get_html_note'       => OW::getRouter()->urlFor('COCREATION_CTRL_Ajax', 'getNoteHTMLByPadIDApiUrl')  . "?noteUrl="  . $noteUrl,
               'ajax_coocreation_room_delete_user'         => OW::getRouter()->urlFor('COCREATION_CTRL_Ajax', 'deleteMemberFromRoom'),
               'ajax_coocreation_room_get_photo'          => OW::getRouter()->urlFor('COCREATION_CTRL_Ajax', 'getPhoto'),
               'sheetName'                                 => $sheetName,
               'roomId'                                    => $params['roomId'],
               'ownerId'                                   => $room->ownerId,
               'entity_type'                               => COCREATION_BOL_Service::ROOM_ENTITY_TYPE,
               'room_members'                              => json_encode($membersIds),
               'roomDatalets'                              => $room_datalets,
               'room_metadata'                             => json_encode($metadataObj),
               'userId'                                    => OW::getUser()->getId(),
               'roomInfo'                                  => json_encode($info),
               'album'                                     => $room->albumId,
        ));

        OW::getDocument()->addOnloadScript($js);
        $url=$_GET["url"];
       if(isset($url)){
        OW::getDocument()->addOnloadScript(" alert('$url'); ODE.pluginPreview = \"cocreation\";
                previewFloatBox = OW.ajaxFloatBox('COCREATION_CMP_AddPhoto', {url: '$url'} , {width:'100%', height:'60vh', iconClass:'ow_ic_lens', title:''});
");}

        OW::getDocument()->addOnloadScript("data_room.init();");

        OW::getLanguage()->addKeyForJs('cocreation', 'confirm_delete_datalet');
        OW::getLanguage()->addKeyForJs('cocreation', 'room_delete_fail');
        OW::getLanguage()->addKeyForJs('cocreation', 'dataset_successfully_published');
        OW::getLanguage()->addKeyForJs('cocreation', 'metadata_successfully_saved');
        OW::getLanguage()->addKeyForJs('cocreation', 'error_metadata_updates');





    }

}