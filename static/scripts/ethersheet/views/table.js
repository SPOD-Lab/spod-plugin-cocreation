if (typeof define !== 'function') { var define = require('amdefine')(module) }
define( function(require,exports,module){

  /*

   #TableView

   An interactive table interface for a single sheet.

   ## References
   * Sheet
   * SelectionCollection
   */

  var $ = require('jquery');
  var t = require('../templates');
  var RefBinder = require('ref-binder');
  var View = require('backbone').View;
  var ColMenuView = require('./col_menu');
  var RowMenuView = require('./row_menu');
  /*Isislab*/
  var CellMenuView = require('./cell_menu');
  /*and Isislab*/
  var _ = require('underscore');
  var h = require('es_client/helpers');

  var MIN_CELL_WIDTH = 22;
  var MIN_CELL_HEIGHT = 22;

  var Table = module.exports = View.extend({


// ## DOM BINDING

    events: {
      'mousedown .es-table-cell': 'cellMouseDown',
      'mousemove .es-table-cell': 'cellMouseMove',
      'mouseup .es-table-cell': 'cellMouseUp',
      'dblclick .es-table-cell': 'cellClicked',
      'click .es-row-header': 'showRowMenu',
      'click .es-column-header': 'showColMenu',
      /*isislab*/
      'mousedown .es-table-cell': 'showCellMenu',
      /*and isislab*/
      'contextmenu .es-column-header': 'showColMenu',
      'contextmenu .es-row-header': 'showRowMenu',
      'change .es-table-cell-input': 'changeCell',
      'keydown': 'inputKeypress',
      //CELLS SELECTION FEATURE
      'mousedown .es-table-cell': 'cellsSelectionMousedown',
      'mouseover .es-table-cell': 'cellsSelectionMouseover',
      'mouseup .es-table-cell'  : 'cellsSelectionMouseup'
    },

//CELLS SELECRION FEATURE

    selectTo: function(cell) {

      //var row = cell.parent();
      var cellIndex = cell.index();
      cellIndex = (cellIndex < 0) ? this.startCellIndex : cellIndex;
      var rowIndex = cell.parent().index();
      rowIndex = (rowIndex < 0) ? this.startRowIndex : rowIndex;


      //var rowStart, rowEnd, cellStart, cellEnd;

      if (rowIndex < this.startRowIndex) {
        this.rowStart = rowIndex;
        this.rowEnd = this.startRowIndex;
      } else {
        this.rowStart = this.startRowIndex;
        this.rowEnd = rowIndex;
      }

      if (cellIndex < this.startCellIndex) {
        this.cellStart = cellIndex;
        this.cellEnd = this.startCellIndex;
      } else {
        this.cellStart = this.startCellIndex;
        this.cellEnd = cellIndex;
      }

      for (var i = this.rowStart; i <= this.rowEnd; i++) {
        var rowCells = $('#es-grid-'+this.getId()).find("tr").eq(i).find("td");
        for (var j = this.cellStart; j <= this.cellEnd; j++) {
          rowCells.eq(j).addClass("cpselected");
        }
      }
      //console.log("rowStart: " + rowStart + " rowEnd: " + rowEnd + " cellStart: " + cellStart + " cellEnd: " + cellEnd );
    },

    cellsSelectionMousedown: function(e){
      this.setCellDragTarget(e);
      if (this.isDraggingCell()){
        return false;
      }

      if(e.which == 3){
        $('#es-grid-'+this.getId()).find(".cpselected").removeClass("cpselected"); // deselect everything
        this.showCellMenu(e);
        return false;
      }

      this.clearOverlays();
      this.isMouseDown = true;
      this.editingCell = false;
      this.current_cell = $(e.currentTarget);

      $('#es-grid-'+this.getId()).find(".cpselected").removeClass("cpselected"); // deselect everything

      if (e.shiftKey) {
        this.selectTo(cell);
      } else {
        this.current_cell.addClass("cpselected");
        this.cellIndex = this.startCellIndex = this.current_cell.index();
        this.rowIndex  = this.startRowIndex  = this.current_cell.parent().index();
        this.rowEnd = this.startRowIndex;
        this.cellEnd = this.startCellIndex;
      }
      return true; // prevent text selection
    },

    cellsSelectionMouseover: function(e){
      if (!this.isMouseDown) return;
      $('#es-grid-'+this.getId()).find(".cpselected").removeClass("cpselected");
      //this.selectTo($(this));
      this.selectTo($(e.currentTarget));
    },

    cellsSelectionMouseup: function(e){
      if(this.isDraggingCell()) this.cellMouseUp(e);
      this.isMouseDown = false;
    },

    //Keypress when cell in not active. Just for copy & paste feature.
    cellsSelectionKeydown: function(e){
      if(_this.editingCell == true){
        $('textarea')._onKeyDown(e);
        return false;
      }

      var code = (e.keyCode ? e.keyCode : e.which);
      var cells = _this.getLocalSelection().getCells();
      _.each(cells, function(cell){
        _this.getSheet().commitCell(cell.row_id.toString(), cell.col_id.toString());
      }, _this);

      var cell = null;
      var sheet_table =  $('#es-grid-'+_this.getId());
      sheet_table.find(".cpselected").removeClass("cpselected");
      switch(code){
        case 37://LEFT ARROW
          cell = sheet_table.find("tr").eq(_this.rowIndex).find("td").eq((_this.cellIndex < 0) ? 0 : --_this.cellIndex);
          break;
        case 38://UP ARROW
          cell = sheet_table.find("tr").eq((_this.rowIndex < 0) ? 0 :  --_this.rowIndex).find("td").eq(_this.cellIndex);
          break;
        case 39://RIGHT ARROW
          cell = sheet_table.find("tr").eq(_this.rowIndex).find("td").eq(++_this.cellIndex);
          break;
        case 40://DOWN ARROW
          cell = sheet_table.find("tr").eq(++_this.rowIndex).find("td").eq(_this.cellIndex);
          break;
        case 13://enter
          if (_this.isDraggingCell()) return;
          cell = sheet_table.find("tr").eq(_this.rowIndex).find("td").eq(_this.cellIndex);
          _this.clearOverlays();
          _this.getLocalSelection().addCell(_this.getSheet().id,$(cell).data().row_id.toString(),$(cell).data().col_id.toString());
          _this.current_cell = cell;
          _this.editingCell = true;
          break;
      }

      if (e.shiftKey) {
        _this.selectTo(cell);
      } else {
        _this.current_cell = cell;
        _this.current_cell.addClass("cpselected");
        _this.startCellIndex = _this.cellIndex;
        _this.startRowIndex  = _this.rowIndex;
        _this.rowEnd = _this.startRowIndex;
        _this.cellEnd = _this.startCellIndex;
      }

      return false;
    },

    onPaste: function(e){
      var cell = null;
      try {
        var clipRows = e.clipboardData.getData('text/plain').split(String.fromCharCode(13));
        for (var i = 0, ii = this.startRowIndex; (i < clipRows.length && ii < this.getSheet().rowCount()); i++, ii++) {
          clipRows[i] = clipRows[i].split(String.fromCharCode(9));
          for (var j = 0, jj = this.startCellIndex; (j < clipRows[i].length && jj < this.getSheet().colCount()); j++, jj++) {
            cell = $('#es-grid-' + this.getId()).find("tr").eq(ii).find("td").eq(jj);
            this.getSheet().updateCell($(cell).attr('data-row_id'), $(cell).attr('data-col_id'), clipRows[i][j]);
          }
        }
      }catch(e){
        console.log("onPaste error : " + e);
      }
      //console.log("PASTE " + this.rowIndex + " - " + this.cellIndex);
    },

    onCopy: function(e){
      try {
        var cbData = "";
        for (var i = this.startRowIndex; i <= this.rowEnd; i++) {
          var rowCells = $('#es-grid-' + this.getId()).find("tr").eq(i).find("td");
          for (var j = this.startCellIndex; j <= this.cellEnd; j++)
            cbData += $(rowCells.eq(j)).html() + ((j != this.cellEnd) ? String.fromCharCode(9) : "");
          cbData += String.fromCharCode(13) /*"\n"*/;
        }
        e.clipboardData.setData('text/plain', cbData);
        e.preventDefault();
      }catch(e){
        console.log("onCopy error : " + e);
      }
      //console.log("COPY " + this.rowIndex + " - " + this.cellIndex);

    },

// ## LIFECYCLE

    initialize: function(o){
      this.is_rendered = false;
      this.models = new RefBinder(this);
      this.draggedCell = null;
      this.draggingRow = false;
      this.draggingCol = false;
      this.data = o.data;
      this.setCurrentUser(o.data.users.getCurrentUser() || null);
      var current_sheet_id = this.getCurrentUser().getCurrentSheetId();
      this.setSheet(o.data.sheets.get(current_sheet_id) || null);
      this.setSheets(o.data.sheets || null);
      this.setSelections(o.data.selections || null);
      this.setLocalSelection(o.data.selections.getLocal() || null);
      _.defer(function(caller){
        caller.onRefreshCells();
      }, this);
      this.$grid = null;
      $(window).resize(this.resize.bind(this));

      /*isislab*/
      //CELLS SELECTION FEATURE
      this.isMouseDown    = false;
      this.editingCell    = false;

      this.startRowIndex  = null;
      this.startCellIndex = null;
      this.cellIndex      = null;
      this.rowIndex       = null;
      this.rowStart       = null;
      this.rowEnd         = null;
      this.cellStart      = null;
      this.cellEnd        = null;

      this.current_cell           = null;
      this.cell_menu_current_cell = null;
      _this = this;

      ['copy','paste'].forEach(function(event) {
        document.addEventListener(event, function(e) {
          switch(event) {
            case 'copy':
              _this.onCopy(e);
              break;
            case 'paste':
              _this.onPaste(e);
              break;
          }
        });
      });

      document.oncontextmenu = function() {
        return false;
      };

      window.addEventListener('message', function(e) {
        var $cell = $("#"+ _this.cell_menu_current_cell.data('cell_id'));
        $cell.val(e.data);
        _this.getSheet().updateCell(_this.cell_menu_current_cell.data('row_id'), _this.cell_menu_current_cell.data('col_id'), e.data);
        _this.updateCellInput($cell);

      });
      /*end isislab*/
    },

    destroy: function(){
      this.remove();
      this.models.unsetAll();
      this.models = null;
    },


// ## MODEL SETTERS

    setSheet: function(sheet){
      this.models.set('sheet',sheet,{
        'update_cell': 'onUpdateCell',
        'commit_cell': 'onCommitCell',
        'resize_cell': 'resizeCell',
        'insert_col': 'render',
        'delete_col': 'render',
        'insert_row': 'render',
        'delete_row': 'render',
        'sort_rows':  'render',
        'refresh_cells': 'onRefreshCells',
        'add_format_to_cell': 'updateCellClass'
      });
    },

    setSheets: function(sheets){
      this.models.set('sheets',sheets,{});
    },

    updateCellClass: function(row_id,col_id, cls){
      var $cell = $('#'+row_id+'-'+col_id, this.el);
      $cell.addClass(cls);
    },

    onRefreshCells: function(){
      var sheet = this.getSheet();
      $('.es-usd').each(function(idx, el){
        $el = $(el);
        var cell = sheet.getCell($el.data('row_id'), $el.data('col_id'));
        var cell_display = parseFloat(sheet.getCellDisplay(cell));
        if(_.isNaN(cell_display)){ return; }
        $el.text('$' + cell_display.toFixed(2));
      });
    },

    setSelections: function(selections){
      this.models.set('selections',selections,{
        'add_cell': 'onRemoteAddCell',
        'select_row': 'onRemoteAddCells',
        'select_col': 'onRemoteAddCells',
        'clear': 'onClear'
      });
    },

    setCurrentUser: function(current_user){
      this.models.set('current_user', current_user, {
        'change_current_sheet_id': 'onChangeCurrentSheetId'
      });
    },

    setLocalSelection: function(local_selection){
      this.models.set('local_selection',local_selection,{
        'add_cell': 'onLocalAddCell',
        'select_row': 'onLocalAddCells',
        'select_col': 'onLocalAddCells',
        'clear': 'onClear'
      });
    },


// ## MODEL GETTERS

    getSheet: function(){
      return this.models.get('sheet');
    },

    getSheets: function(){
      return this.models.get('sheets');
    },

    getCurrentUser: function(){
      return this.models.get('current_user');
    },

    unpaintCell: function(cell){
      var $cell = $('#'+cell.row_id+'-'+cell.col_id, this.el);
      $cell.css('background-color', '');
    },

    onRemoteAddCell: function(cell){
      this.paintCell(cell);
    },

    getSelections: function(){
      return this.models.get('selections');
    },

    getLocalSelection: function(){
      return this.models.get('local_selection');
    },

    getId: function(){
      //userd to get cid
      return this.getCurrentUser().getCurrentSheetId();
    },


// ## SELECTION EVENTS
    onLocalAddCells: function(cells){
      var self = this;
      var first_cell = cells.shift();
      self.onLocalAddCell(first_cell);
      _.each(cells, function(cell){
        self.paintCell(cell);
      });
      cells.unshift(first_cell);
    },

    onLocalAddCell: function(cell){
      var $cell = $('#'+cell.row_id+'-'+cell.col_id, this.el);
      var e = {currentTarget: $cell};

      this.paintCell($cell);
      this.createCellInput(e);
    },

    onRemoteAddCells: function(cells){
      var self = this;
      _.each(cells, function(cell){
        self.paintCell(cell);
      });
    },

    onRemoteAddCell: function(cell){
      this.paintCell(cell);
    },

    onClear: function(cells){
      var table = this;
      //this.removeCellInputs();
      _.each(cells, function(cell){
        table.unpaintCell(cell);
      });
    },


// ## SHEET EVENTS

    onUpdateCell: function(cell){
      var $el = $('#'+cell.row_id+'-'+cell.col_id);
      $el.text(cell.cell_display);
      var input =$('#' + $el.attr('id') + '-input');
      if(input.length > 0){
        input.val(cell.cell_display);
      }
      this.resizeRowHeader(cell.row_id);
      this.updateCellInputs();
    },

    onCommitCell: function(cell){
      this.onUpdateCell(cell);
    },


// ## RENDERING

    paintCell: function(cell){
      var $cell = $('#'+cell.row_id+'-'+cell.col_id, this.el);
      $cell.css('background-color', cell.color);
    },

    render: function(e){
      this.$el.empty();
      this.$el.append($(t.sheet_table({id:this.getId()})));

      $('#es-data-table-'+this.getId(),this.$el)
          .html(t.table({sheet:this.getSheet()}));


      this.initializeElements();
      this.initializeScrolling();
      this.initializeSelections();

      this.drawRowHeaders();
      this.drawColHeaders();

      setTimeout(this.drawRowHeaders.bind(this),100);
      setTimeout(this.drawRowHeaders.bind(this),300);
      setTimeout(this.drawColHeaders.bind(this),100);
      setTimeout(this.drawColHeaders.bind(this),300);
      this.$grid = $(".es-grid-container",this.$el);
      this.is_rendered = true;
      this.resize();

      /*isislab code*/
      if(e != undefined && e.row_id != undefined && this.getSheet().send_enabled){
        $("#es-grid-container-" + e.sheet_id).scrollTop($("[data-row_id='" + e.row_id + "']").offset().top - 100);
      }
      /*end isislab code*/
      return this;
    },

    resize: function(){
      if(!this.is_rendered) return;
      //var grid_height = this.$el.innerHeight() - 18;
      var grid_height = this.$el.innerHeight() + 4;
      var grid_width = this.$el.innerWidth() - 45;
      this.$grid.height(grid_height);
      this.$grid.width(grid_width);
    },

    initializeSelections: function(){
      this
          .getSelections()
          .each(function(selection){
            selection.redraw();
          });
    },

    initializeElements: function(){
      this.$table = $('#es-grid-'+this.getId(),this.$el);
      this.$grid = $('#es-grid-container-'+this.getId(),this.$el);
      this.$table_col_headers = $('#es-column-headers-'+this.getId(),this.$el);
      this.$table_row_headers = $('#es-row-headers-'+this.getId(),this.$el);
    },

    initializeScrolling: function(){
      var view = this;
      var grid_el = this.$grid[0];
      this.$grid.scroll(function(e){
        view.$table_col_headers.css('left',(0-grid_el.scrollLeft)+"px");
        view.$table_row_headers.css('top',(0-grid_el.scrollTop)+"px");
      });
    },


// ## ROW METHODS

    drawRowHeaders: function()
    {
      var view = this;
      var html = '';
      var row_name = '';
      var height = null;

      _.each(this.getSheet().rowIds(), function(row_id,index){
        row_name = index+1;
        height = view.heightForRow(row_id);
        html +='<tr id="es-header-'+row_id+'" style="height:'+height+'px;"><th class="es-row-header"  data-row_id="'+row_id+'">'+row_name+' <img src="/es_client/icons/ethersheet-downarrow.png" class="es-menu-arrow"></th></tr>'
      });

      $('#es-row-headers-'+this.getId(),this.$el).html(html);
    },

    heightForRow: function(row_id){
      var row_el = document.getElementById(row_id);
      if(row_el){
        return row_el.offsetHeight;
      }
      return undefined;
    },

    resizeRowHeader: function(row_id){
      var header = document.getElementById("es-header-"+row_id);
      var height = this.heightForRow(row_id);
      if(!header || !height) return;
      header.style.height = height+"px";
    },

    resizeRow: function(row_id,height){
      var row_el = document.getElementById(row_id);
      if(!row_el || !height) return;
      if(height < MIN_CELL_HEIGHT) height = MIN_CELL_HEIGHT;
      row_el.style.height = height+"px";
    },


// ## COLUMN METHODS
    drawColHeaders: function(){
      var view = this;
      var html = '';

      var width = null;

      _.each(this.getSheet().colIds(), function(col_id,index){
        width = view.widthForCol(col_id);

        var header = (view.getSheet().cells[view.getSheet().rows[0]] == undefined || view.getSheet().cells[view.getSheet().rows[0]][col_id] == undefined ) ? h.columnIndexToName(index) : view.getSheet().cells[view.getSheet().rows[0]][col_id].value;
        html +='<th id="es-col-header-'+col_id+'" data-col_id="'+col_id+'" class="es-column-header" style="width:'+width+'px;">'
              //+h.columnIndexToName(index)
            + header
            +'<img src="/es_client/icons/ethersheet-downarrow.png" class="es-menu-arrow">'
            +'</th>';
      });

      $('#es-column-headers-'+this.getId(),this.$el).html(html);
    },

    /*drawColHeaders: function(){
     var view = this;
     var html = '';

     var width = null;

     _.each(this.getSheet().colIds(), function(col_id,index){
     width = view.widthForCol(col_id);
     html +='<th id="es-col-header-'+col_id+'" data-col_id="'+col_id+'" class="es-column-header" style="width:'+width+'px;">'
     +h.columnIndexToName(index)
     +'<img src="/es_client/icons/ethersheet-downarrow.png" class="es-menu-arrow">'
     +'</th>';
     });

     $('#es-column-headers-'+this.getId(),this.$el).html(html);
     },*/

    widthForCol: function(col_id){
      var row_id = this.getSheet().rowAt(0);
      var col_el = document.getElementById(row_id+'-'+col_id);
      if(col_el){
        return col_el.clientWidth;
      }
      return undefined;

    },

    resizeColHeaders: function(col_id){
      var view = this;
      _.each(this.getSheet().colIds(), function(col_id){
        view.resizeColHeader(col_id);
      });
    },

    resizeColHeader: function(col_id){
      var header = document.getElementById("es-col-header-"+col_id);
      var width = this.widthForCol(col_id);
      if(!header || !width) return;
      header.style.width = width+"px";
    },

    resizeCol: function(col_id,width){
      var row_id = this.getSheet().rowAt(0);
      var col_el = document.getElementById(row_id+'-'+col_id);
      if(!col_el) return;
      if(width < MIN_CELL_WIDTH) width = MIN_CELL_WIDTH;
      col_el.style.width = width+"px";
    },


// ## CELL EVENTS
    cellClicked: function(e){
      if (this.isDraggingCell()) return;
      this.selectCell(e);
      this.current_cell = $(e.currentTarget);
      this.editingCell = true;
    },

    cellMouseDown: function(e){
      this.clearOverlays();
      this.setCellDragTarget(e);
      if (this.isDraggingCell()){
        return false;
      }
    },

    cellMouseMove: function(e){
      if(!this.isDraggingCell()){
        var $cell = $(e.currentTarget);
        if(this.isOverRowDragHandle($cell,e.pageY)){
          this.$table.css("cursor","ns-resize");
        } else if(this.isOverColDragHandle($cell,e.pageX)){
          this.$table.css("cursor","ew-resize");
        } else {
          this.$table.css("cursor","pointer");
        }
      } else if(this.draggingRow){
        var height = e.pageY - this.draggedCell.offset().top;
        var width = null;
        var row_id = this.draggedCell.data('row_id');
        var col_id = this.draggedCell.data('col_id');
        this.getSheet().disableSend();
        this.getSheet().resizeCell(row_id,col_id,width,height);
        this.getSheet().enableSend();
        return false;
      } else if(this.draggingCol){
        var height = null;
        var width = e.pageX - this.draggedCell.offset().left;
        var row_id = this.draggedCell.data('row_id');
        var col_id = this.draggedCell.data('col_id');

        this.getSheet().disableSend();
        this.getSheet().resizeCell(row_id,col_id,width,height);
        this.getSheet().enableSend();
        return false;
      }
    },

    cellMouseUp: function(e){
      if(!this.isDraggingCell()) return;

      if(this.draggingRow){
        var height = e.pageY - this.draggedCell.offset().top;
        var width = null;
        var row_id = this.draggedCell.data('row_id');
        var col_id = this.draggedCell.data('col_id');

        this.getSheet().resizeCell(row_id,col_id,width,height);
      } else if(this.draggingCol){
        var height = null;
        var width = e.pageX - this.draggedCell.offset().left;
        var row_id = this.draggedCell.data('row_id');
        var col_id = this.draggedCell.data('col_id');

        this.getSheet().resizeCell(row_id,col_id,width,height);
      }

      this.draggedCell = null;
      this.draggingRow = false;
      this.draggingCol = false;
      return false;
    },

    resizeCell: function(row_id,col_id,width,height)
    {
      if(height) this.resizeRow(row_id,height);
      if(width) this.resizeCol(col_id,width);
      this.resizeRowHeader(row_id);
      this.resizeColHeader(col_id);
      this.updateCellInputs();
    },

    changeCell: function(e){
      var $el = $(e.currentTarget);
      var data = $el.data();
      this.getSheet().commitCell(data.row_id.toString(), data.col_id.toString());
    },

// ## CELL DRAGGING

    isDraggingCell: function(){
      if (this.draggedCell) return true;
      return false;
    },

    isOverRowDragHandle: function($cell,y){
      var distance_from_cell_bottom = $cell.offset().top + $cell.height() - y;
      if(distance_from_cell_bottom < 4) return true;
      return false;
    },

    isOverColDragHandle: function($cell,x){
      var distance_from_cell_right = $cell.offset().left + $cell.width() - x;
      if(distance_from_cell_right < 4) return true;
      return false;
    },

    setCellDragTarget: function(e){
      if (this.draggedCell) return this.draggedCell;
      var $cell = $(e.currentTarget);
      if(this.isOverRowDragHandle($cell,e.pageY)){
        this.draggedCell = $cell;
        this.draggingRow = true;
        this.draggingCol = false;
      } else if(this.isOverColDragHandle($cell,e.pageX)) {
        this.draggedCell = $cell;
        this.draggingRow = false;
        this.draggingCol = true;
      } else {
        this.draggedCell = null;
      }
    },


// ## CELL INPUT FIELD

    createCellInput: function(e){
      if(e.currentTarget.length == 0) return;
      var $el = $(e.currentTarget);
      var row_id = $el.data().row_id.toString();
      var col_id = $el.data().col_id.toString();
      var cell_id = $el.attr('id');
      var cell_value = this.getSheet().getDisplayFormula(row_id,col_id);

      var $input = $("<textarea id='"+cell_id+"-input' data-row_id='"+row_id+"' data-col_id='"+col_id+"' data-cell_id='"+cell_id+"' class='es-table-cell-input es-overlay'>"+cell_value+"</textarea>");

      this.$grid.append($input);

      var sheet = this.getSheet();
      $input.on('keyup', function(){
        sheet.updateCell(row_id, col_id, $input.val());
      });
      this.updateCellInput($input);
      $input.focus();
      return $input;
    },

    updateCellInput: function($input){
      var s = this.getSelections().getLocal();
      var $cell = $("#"+$input.data().cell_id.toString());
      var x = $cell.position().left + this.$grid.scrollLeft();
      var y = $cell.position().top + this.$grid.scrollTop();;
      var width = $cell.width();
      var height = $cell.height() - 2;
      var color = s.getColor();
      var style="left: "+x+"px; top: "+y+"px; width: "+width+"px; height: "+height+"px; background-color: "+color;
      $input.attr("style",style)
    },

    updateCellInputs: function(){
      var table = this;
      $('.es-table-cell-input').each(function(idx, el){
        table.updateCellInput($(el));
      })
    },

    removeCellInputs: function(){
      $('.es-table-cell-input').remove();
    },

    inputKeypress: function(e){
      //return unless code is 'enter' or 'tab'
      var code = (e.keyCode ? e.keyCode : e.which);
      if(code != 13 && code != 9 && code != 27) return;

      var UP    =-1;
      var LEFT  =-1;
      var DOWN  = 1;
      var RIGHT = 1;
      var NONE  = 0;

      var cells = this.getLocalSelection().getCells();
      _.each(cells, function(cell){
        this.getSheet().commitCell(cell.row_id.toString(), cell.col_id.toString());
      }, this);

      switch(code){
        case 13://ENTER
          this.moveSelection(e,1,0);
          break;
        case 9://TAB
          this.moveSelection(e,0,1);
          break;
        case 27://ESC
          this.clearOverlays();
          this.editingCell = false;
          break;
      }
      return false;
    },


// ## CELL SELECTIONS

    addCellToSelection: function(e){
      var s = this.getLocalSelection();
      var data = $(e.currentTarget).data();
      s.addCell(this.getSheet().id,data.row_id.toString(),data.col_id.toString());
    },

    selectCell: function(e){
      var s = this.clearOverlays();
      this.addCellToSelection(e);
    },

    selectRow: function(e){
      var sel = this.getLocalSelection();
      var sheet = this.getSheet();
      var row_pos = $(e.currentTarget).text();
      var row_id = sheet.rowAt(row_pos - 1);
      sel.clear();
      sel.addRow(sheet.id, row_id);
    },

    selectCol: function(e){
      var col_id = $(e.currentTarget).attr('id').replace('es-col-header-','');
      var sel = this.getLocalSelection();
      sel.clear();
      sel.addColumn(this.getSheet().id, col_id);
    },

    moveSelection: function(e, row_offset, col_offset){
      var selection = this.getLocalSelection();
      var old_cell = selection.getCells()[0];
      var rows = this.getSheet().rows;
      var cols = this.getSheet().cols;
      var new_col_idx = _.indexOf(cols,old_cell.col_id) + col_offset;
      var new_col = cols[new_col_idx];
      var new_row_idx = _.indexOf(rows,old_cell.row_id) + row_offset;
      var new_row = rows[new_row_idx];
      selection.clear();
      selection.addCell(this.getSheet().id, new_row, new_col);
    },

// ## SHEET LEVEL EVENTS
    onChangeCurrentSheetId: function(e){
      var sheet_id = this.getCurrentUser().getCurrentSheetId();
      var sheet = this.getSheets().get(sheet_id);
      this.setSheet(sheet);
      this.render();
    },

    /*Isislab*/
    showCellMenu: function(e){
      if(e.which == 3)//right click
      {
        /*alert("Right mouse button clicked on cell");
         console.log(e);*/
        e.preventDefault();
        this.clearOverlays();
        this.addCellToSelection(e);
        this.editingCell = true;
        this.cell_menu_current_cell = $(e.currentTarget);
        var $selectedCell = $(e.currentTarget);
        var pos = $selectedCell.position();

        var width = $selectedCell.outerWidth();
        var left = pos.left + width; //offset;
        var top = e.clientY;//pos.top + $selectedCell.innerHeight();
        var html = "<div class='es-context-menu es-overlay' style='left:"+left+"px;top:"+top+"px;position: absolute;'></div>";
        var $menu = $(html);

        var menu = new CellMenuView({
          el: $menu,
          cell_id: String($selectedCell.data("cell_id")),
          data: this.data,
        }).render();

        $menu.i18n();

        this.$el.append($menu);
      }else{
        this.cellMouseDown(e);
      }
    },
    /*end isislab*/

    showColMenu: function(e){
      e.preventDefault();
      this.clearOverlays();
      var $headerCell = $(e.currentTarget)
      $headerCell.addClass('es-header-active');
      var pos = $headerCell.position();
      var offset = this.$table_col_headers.position().left + Number(this.$table_col_headers.css("margin-left").replace("px",""));

      var left = pos.left + offset;
      var top = pos.top + $headerCell.innerHeight();
      var width = $headerCell.outerWidth()
      var html = "<div class='es-context-menu es-overlay' style='left:"+left+"px;top:"+top+"px;position: absolute;'></div>";
      var $menu = $(html);

      var menu = new ColMenuView({
        el: $menu,
        col_id: String($headerCell.data("col_id")),
        data: this.data,
      }).render();

      $menu.i18n();

      this.$el.append($menu);
    },

    showRowMenu: function(e){
      e.preventDefault();
      this.clearOverlays();
      var $headerCell = $(e.currentTarget);
      $headerCell.addClass('es-header-active');
      var pos = $headerCell.position();
      var offset = this.$table_row_headers.position().top + Number(this.$table_row_headers.css("margin-top").replace("px",""));

      var left = pos.left + $headerCell.outerWidth();
      var top = pos.top + offset;
      var width = $headerCell.outerWidth()
      var html = "<div class='es-context-menu es-overlay' style='left:"+left+"px;top:"+top+"px;position: absolute;'></div>";
      var $menu = $(html);

      var menu = new RowMenuView({
        el: $menu,
        row_id: String($headerCell.data("row_id")),
        data: this.data,
      }).render();

      $menu.i18n();

      this.$el.append($menu);
    },

    clearOverlays: function(){
      $(".es-header-active").removeClass("es-header-active");
      $(".es-overlay").remove();
      this.getLocalSelection().clear();
    }
  });

});
