$(document).ready(function() {

    /* window.addEventListener('cocreation-paper-card-controllet_delete', function (e) {
     var c = confirm(OW.getLanguageText('cocreation', 'confirm_delete_datalet'));
     if (c == true) {
     $.post(ODE.ajax_coocreation_room_delete_datalet,
     {
     roomId          : e.detail.roomId
     },
     function (data, status) {
     data = JSON.parse(data);
     if (data.status == "ok") {
     } else {
     OW.info(OW.getLanguageText('cocreation', 'room_delete_fail'));
     }
     }
     );
     }
     });*/
    window.addEventListener('metadata-list-controllet_update-metadata', function(e){
        var metadata = JSON.parse(e.detail.metadata);
        $.post(ODE.ajax_coocreation_room_update_metadata,
            {
                roomId                             : COCREATION.roomId,
                core_common_required_metadata      : JSON.stringify(metadata.CC_RF),
                common_core_if_applicable_metadata : JSON.stringify(metadata.CC_RAF),
                expanded_metadata                  : JSON.stringify(metadata.EF)
            },
            function (data, status) {
                COCREATION.metadata = metadata;
                /*var response = JSON.parse(data);
                 if(response.status == "ok"){
                 room.$.syncMessage.innerHTML = OW.getLanguageText('cocreation', 'metadata_successfully_saved');
                 room.$.syncToast.show();
                 }else{
                 room.$.syncMessage.innerHTML = OW.getLanguageText('cocreation', 'error_metadata_updates');
                 room.$.syncToast.show();
                 }*/
            }
        );
    });

    window.addEventListener('message', function (e) {
        switch (e.data) {
            case 'ethersheet_sheet_updated':
                $.post(ODE.ajax_coocreation_room_get_datalets,
                    {
                        roomId: COCREATION.roomId
                    },
                    function (data, status) {
                        data = JSON.parse(data);
                        COCREATION.datalets = data.datalets;
                        room.$.datalets_slider.setDatalets([]);
                        setTimeout(function(){room.$.datalets_slider.setDatalets(COCREATION.datalets);},100);
                    }
                );
                break;
            case 'open-select-merker-map_event':
                //if(previewFloatBox != 'undefined') previewFloatBox.close();
                ODE.pluginPreview = "cocreation";
                previewFloatBox = OW.ajaxFloatBox('COCREATION_CMP_AddMarker', {}, {
                    width: '90%',
                    height: '90vh',
                    iconClass: 'ow_ic_lens',
                    title: ''
                });
                break;
            case 'open-select-photo_event':
                ODE.pluginPreview = "cocreation";
                previewFloatBox = OW.ajaxFloatBox('COCREATION_CMP_AddPhoto', {albumId: COCREATION.album} , {width:'100%', height:'60vh', iconClass:'ow_ic_lens', title:''});


                break;   }

    });

    window.addEventListener('datalet-slider-controllet_attached', function(e){
        room.$.datalets_slider.setDatalets(COCREATION.datalets);
    });

    window.addEventListener('info-list-controllet_attached', function(e){
        room.$.info_list_controllet.setInfo(COCREATION.info);
    });

    window.addEventListener('metadata-list-controllet_attached', function(e){
        room.$.metadata_component.setMetadata(COCREATION.metadata);
    });



});

room.splitScreenActive          = false;
room.current_selected_container = null;

room.handleSelectUIMode = function(mode){
    if(!room.splitScreenActive) room.$.spreadsheet.style.visibility = "hidden";
    switch(mode){
        case 'dataset':
            room.$.spreadsheet.style.visibility = "visible";
            room.$.metadata.style.visibility    = 'hidden';
            room.$.notes.style.visibility       = 'hidden';
            room.$.discussion.style.visibility  = 'hidden';
            room.$.datalets.style.display       = 'none';
            room.$.info.style.visibility        = 'hidden';
            break;
        case 'metadata':
            room.current_selected_container = room.$.metadata;
            room.$.metadata.style.visibility    = 'visible';
            room.$.notes.style.visibility       = 'hidden';
            room.$.discussion.style.visibility  = 'hidden';
            room.$.datalets.style.display       = 'none';
            room.$.info.style.visibility        = 'hidden';
            break;
        case 'notes':
            room.current_selected_container = room.$.notes;
            room.$.metadata.style.visibility    = 'hidden';
            room.$.notes.style.visibility       = 'visible';
            room.$.discussion.style.visibility  = 'hidden';
            room.$.datalets.style.display       = 'none';
            room.$.info.style.visibility        = 'hidden';
            break;
        case 'discussion':
            room.current_selected_container = room.$.discussion;
            room.$.metadata.style.visibility    = 'hidden';
            room.$.notes.style.visibility       = 'hidden';
            room.$.discussion.style.visibility  = 'visible';
            room.$.datalets.style.display       = 'none';
            room.$.info.style.visibility        = 'hidden';
            break;
        case 'datalets':
            room.current_selected_container = room.$.datalets;
            room.$.metadata.style.visibility    = 'hidden';
            room.$.notes.style.visibility       = 'hidden';
            room.$.discussion.style.visibility  = 'hidden';
            room.$.datalets.style.display       = 'block';
            room.$.info.style.visibility        = 'hidden';
            room.$.datalets_slider._refresh();
            break;
        case 'info':
            room.current_selected_container  = room.$.info;
            room.$.metadata.style.visibility    = 'hidden';
            room.$.notes.style.visibility       = 'hidden';
            room.$.discussion.style.visibility  = 'hidden';
            room.$.datalets.style.display       = 'none';
            room.$.info.style.visibility        = 'visible';
            break;
        case 'split':
            room.$.split_checkbox.checked = !room.$.split_checkbox.checked;
            room.handleSplitScreen(room.$.split_checkbox);
            break;
        case 'Photo':

            window.location='/cocreation/album/'+ COCREATION.ownerId +'/' + COCREATION.album;
    }

};

room.handleSplitScreen = function(e){
    room.splitScreenActive  = e.checked;

    room.$.spreadsheet.style.visibility = "visible";
    room.$.metadata.style.visibility    = 'hidden';
    room.$.notes.style.visibility       = 'hidden';
    room.$.discussion.style.visibility  = 'hidden';
    room.$.datalets.style.display       = 'none';
    room.$.info.style.visibility        = 'hidden';

    if(room.splitScreenActive){//active split screen
        room.$.dataset_menu_item.disabled = true;

        room.$.datalets_slider._refresh();

        if(room.current_selected_container == null){
            room.current_selected_container  = room.$.metadata;
            room.$.section_menu.selected     = 1;
        }

        if(room.current_selected_container == room.$.datalets)
            room.current_selected_container.style.display = "block";
        else
            room.current_selected_container.style.visibility = "visible";

        $(room.$.spreadsheet).addClass("split_size_card_left");
        $(room.$.metadata).addClass("split_size_card_right");
        $(room.$.notes).addClass("split_size_card_right");
        $(room.$.discussion).addClass("split_size_card_right");
        $(room.$.datalets).addClass("split_size_card_right");
        $(room.$.info).addClass("split_size_card_right");
    }else{
        room.$.dataset_menu_item.disabled = false;
        room.$.section_menu.selected      = 0;
        room.current_selected_container   = null;

        $(room.$.spreadsheet).removeClass("split_size_card_left");
        $(room.$.metadata).removeClass("split_size_card_right");
        $(room.$.notes).removeClass("split_size_card_right");
        $(room.$.discussion).removeClass("split_size_card_right");
        $(room.$.datalets).removeClass("split_size_card_right");
        $(room.$.info).removeClass("split_size_card_right");
    }
};

room.current_dataset = "";

room._publishDataset = function(){
    $.post(ODE.ajax_coocreation_room_get_array_sheetdata,
        {
            sheetName: COCREATION.sheetName
        },
        function (data, status) {
            room.current_dataset = data;
            ODE.pluginPreview = "cocreation";
            previewFloatBox = OW.ajaxFloatBox('COCREATION_CMP_PublishDataset', {data: data} , {width:'90%', height:'80vh', iconClass:'ow_ic_lens', title:''});
        }
    );
};

room.confirmDatasetPublication = function(){
    if(confirm("Il dataset creato non contiene informazioni personali e sensibili, in accordo alla vigente legge sulla protezione della privacy (Decreto legislativo 30 giugno 2003, n. 196)."))
        $.get(ODE.ajax_coocreation_room_get_html_note,
            function (data, status) {
                if(JSON.parse(data).status == "ok")
                {
                    var metadata = room.$.metadata_component.metadata;
                    $.post(ODE.ajax_coocreation_room_publish_dataset,
                        {
                            roomId                              : COCREATION.roomId,
                            datasetId                           : COCREATION.sheetName,
                            owners                              : COCREATION.room_members,
                            data                                : room.current_dataset,
                            notes                               : data,
                            common_core_required_metadata       : metadata.CC_RF,
                            common_core_if_applicable_metadat   : metadata.CC_RAF,
                            expanded_metadata                   : metadata.EF
                        },
                        function (data, status) {
                            previewFloatBox.close();
                            OW.info(OW.getLanguageText('cocreation', 'dataset_successfully_published'));
                        }
                    );
                }
            }
        );
};

room.loadDiscussion = function(){
    $.post(OW.ajaxComponentLoaderRsp + "?cmpClass=COCREATION_CMP_DiscussionWrapper",
        {params: "[\"" + COCREATION.roomId + "\"]"},
        function (data, status) {
            data = JSON.parse(data);

            $('#discussion_container').html(data.content);
            //onloadScript
            var onload = document.createElement('script');
            onload.setAttribute("type","text/javascript");
            onload.innerHTML = data.onloadScript;
        });




};



