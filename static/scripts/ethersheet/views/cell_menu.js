if (typeof define !== 'function') { var define = require('amdefine')(module) }
define( function(require,exports,module){

    /*

     #MenuView

     A list of available actions, given the current context.

     ## References
     * Sheet
     * SelectionCollection

     */

    var $ = require('jquery');
    var t = require('../templates');
    var RefBinder = require('ref-binder');
    var View = require('backbone').View;
    var _ = require('underscore');

    var CellMenuView = module.exports = View.extend({

        events: {
            'click .es-menu-button': 'onButtonClick'
        },

        initialize: function(o){
            this.models = new RefBinder(this);
            this.data = o.data;
            this.cell_id = o.cell_id;
            this.setSheets(o.data.sheets || null);
            this.setUser(o.data.users.getCurrentUser());
            var current_sheet_id = this.getUser().getCurrentSheetId();
            this.setSheet(o.data.sheets.get(current_sheet_id) || null);
        },

        getSheet: function(){
            return this.models.get('sheet');
        },

        setSheet: function(sheet){
            this.models.set('sheet',sheet);
        },

        getSheets: function(){
            return this.models.get('sheets');
        },

        setSheets: function(sheets){
            this.models.set('sheets', sheets);
        },

        getUser: function(){
            return this.models.get('user');
        },

        setUser: function(user){
            this.models.set('user', user, {
                'change_current_sheet_id': 'onChangeCurrentSheetID',
            });
        },

        render: function(){
            this.$el.empty();
            this.$el.html(t.cell_menu());
        },

        onChangeCurrentSheetID: function(){
            var sheet = this.getSheets().get(this.getUser().getCurrentSheetId());
            this.setSheet(sheet);
        },

        onButtonClick: function(e){
            console.log("CLICKLICKLCIK")
            var action = $(e.currentTarget).data('action');
            switch(action){
                case 'add_geo_point':
                    this.addGeoPoint();
                    break;
                case 'add_new_photo':
                    this.addNewPhoto();
                    break;
            };

        },

        sortRows:function(){
            this.getSheet().sortRows(this.col_id);
        },

        addGeoPoint:function(){
            top.postMessage("open-select-merker-map_event", 'http://' + window.location.hostname);
        },

        addNewPhoto:function () {
            top.postMessage("open-select-photo_event", 'http://' + window.location.hostname);

        }
    });

});
