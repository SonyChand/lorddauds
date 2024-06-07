/*
 * This combined file was created by the DataTables downloader builder:
 *   https://datatables.net/download
 *
 * To rebuild or modify this file with the latest versions of the included
 * software please visit:
 *   https://datatables.net/download/#bs5/dt-2.0.8/e-2.3.2/b-3.0.2/b-colvis-3.0.2/b-html5-3.0.2/b-print-3.0.2/r-3.0.2/sc-2.4.3
 *
 * Included libraries:
 *   DataTables 2.0.8, Editor 2.3.2, Buttons 3.0.2, Column visibility 3.0.2, HTML5 export 3.0.2, Print view 3.0.2, Responsive 3.0.2, Scroller 2.4.3
 */

/*! DataTables 2.0.8
 * © SpryMedia Ltd - datatables.net/license
 */

/**
 * @summary     DataTables
 * @description Paginate, search and order HTML tables
 * @version     2.0.8
 * @author      SpryMedia Ltd
 * @contact     www.datatables.net
 * @copyright   SpryMedia Ltd.
 *
 * This source file is free software, available under the following license:
 *   MIT license - https://datatables.net/license
 *
 * This source file is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the license files for details.
 *
 * For details please refer to: https://www.datatables.net
 */

(function( factory ) {
	"use strict";

	if ( typeof define === 'function' && define.amd ) {
		// AMD
		define( ['jquery'], function ( $ ) {
			return factory( $, window, document );
		} );
	}
	else if ( typeof exports === 'object' ) {
		// CommonJS
		// jQuery's factory checks for a global window - if it isn't present then it
		// returns a factory function that expects the window object
		var jq = require('jquery');

		if (typeof window === 'undefined') {
			module.exports = function (root, $) {
				if ( ! root ) {
					// CommonJS environments without a window global must pass a
					// root. This will give an error otherwise
					root = window;
				}

				if ( ! $ ) {
					$ = jq( root );
				}

				return factory( $, root, root.document );
			};
		}
		else {
			module.exports = factory( jq, window, window.document );
		}
	}
	else {
		// Browser
		window.DataTable = factory( jQuery, window, document );
	}
}(function( $, window, document ) {
	"use strict";

	
	var DataTable = function ( selector, options )
	{
		// Check if called with a window or jQuery object for DOM less applications
		// This is for backwards compatibility
		if (DataTable.factory(selector, options)) {
			return DataTable;
		}
	
		// When creating with `new`, create a new DataTable, returning the API instance
		if (this instanceof DataTable) {
			return $(selector).DataTable(options);
		}
		else {
			// Argument switching
			options = selector;
		}
	
		var _that = this;
		var emptyInit = options === undefined;
		var len = this.length;
	
		if ( emptyInit ) {
			options = {};
		}
	
		// Method to get DT API instance from jQuery object
		this.api = function ()
		{
			return new _Api( this );
		};
	
		this.each(function() {
			// For each initialisation we want to give it a clean initialisation
			// object that can be bashed around
			var o = {};
			var oInit = len > 1 ? // optimisation for single table case
				_fnExtend( o, options, true ) :
				options;
	
			
			var i=0, iLen;
			var sId = this.getAttribute( 'id' );
			var bInitHandedOff = false;
			var defaults = DataTable.defaults;
			var $this = $(this);
			
			
			/* Sanity check */
			if ( this.nodeName.toLowerCase() != 'table' )
			{
				_fnLog( null, 0, 'Non-table node initialisation ('+this.nodeName+')', 2 );
				return;
			}
			
			$(this).trigger( 'options.dt', oInit );
			
			/* Backwards compatibility for the defaults */
			_fnCompatOpts( defaults );
			_fnCompatCols( defaults.column );
			
			/* Convert the camel-case defaults to Hungarian */
			_fnCamelToHungarian( defaults, defaults, true );
			_fnCamelToHungarian( defaults.column, defaults.column, true );
			
			/* Setting up the initialisation object */
			_fnCamelToHungarian( defaults, $.extend( oInit, $this.data() ), true );
			
			
			
			/* Check to see if we are re-initialising a table */
			var allSettings = DataTable.settings;
			for ( i=0, iLen=allSettings.length ; i<iLen ; i++ )
			{
				var s = allSettings[i];
			
				/* Base check on table node */
				if (
					s.nTable == this ||
					(s.nTHead && s.nTHead.parentNode == this) ||
					(s.nTFoot && s.nTFoot.parentNode == this)
				) {
					var bRetrieve = oInit.bRetrieve !== undefined ? oInit.bRetrieve : defaults.bRetrieve;
					var bDestroy = oInit.bDestroy !== undefined ? oInit.bDestroy : defaults.bDestroy;
			
					if ( emptyInit || bRetrieve )
					{
						return s.oInstance;
					}
					else if ( bDestroy )
					{
						new DataTable.Api(s).destroy();
						break;
					}
					else
					{
						_fnLog( s, 0, 'Cannot reinitialise DataTable', 3 );
						return;
					}
				}
			
				/* If the element we are initialising has the same ID as a table which was previously
				 * initialised, but the table nodes don't match (from before) then we destroy the old
				 * instance by simply deleting it. This is under the assumption that the table has been
				 * destroyed by other methods. Anyone using non-id selectors will need to do this manually
				 */
				if ( s.sTableId == this.id )
				{
					allSettings.splice( i, 1 );
					break;
				}
			}
			
			/* Ensure the table has an ID - required for accessibility */
			if ( sId === null || sId === "" )
			{
				sId = "DataTables_Table_"+(DataTable.ext._unique++);
				this.id = sId;
			}
			
			/* Create the settings object for this table and set some of the default parameters */
			var oSettings = $.extend( true, {}, DataTable.models.oSettings, {
				"sDestroyWidth": $this[0].style.width,
				"sInstance":     sId,
				"sTableId":      sId,
				colgroup: $('<colgroup>').prependTo(this),
				fastData: function (row, column, type) {
					return _fnGetCellData(oSettings, row, column, type);
				}
			} );
			oSettings.nTable = this;
			oSettings.oInit  = oInit;
			
			allSettings.push( oSettings );
			
			// Make a single API instance available for internal handling
			oSettings.api = new _Api( oSettings );
			
			// Need to add the instance after the instance after the settings object has been added
			// to the settings array, so we can self reference the table instance if more than one
			oSettings.oInstance = (_that.length===1) ? _that : $this.dataTable();
			
			// Backwards compatibility, before we apply all the defaults
			_fnCompatOpts( oInit );
			
			// If the length menu is given, but the init display length is not, use the length menu
			if ( oInit.aLengthMenu && ! oInit.iDisplayLength )
			{
				oInit.iDisplayLength = Array.isArray(oInit.aLengthMenu[0])
					? oInit.aLengthMenu[0][0]
					: $.isPlainObject( oInit.aLengthMenu[0] )
						? oInit.aLengthMenu[0].value
						: oInit.aLengthMenu[0];
			}
			
			// Apply the defaults and init options to make a single init object will all
			// options defined from defaults and instance options.
			oInit = _fnExtend( $.extend( true, {}, defaults ), oInit );
			
			
			// Map the initialisation options onto the settings object
			_fnMap( oSettings.oFeatures, oInit, [
				"bPaginate",
				"bLengthChange",
				"bFilter",
				"bSort",
				"bSortMulti",
				"bInfo",
				"bProcessing",
				"bAutoWidth",
				"bSortClasses",
				"bServerSide",
				"bDeferRender"
			] );
			_fnMap( oSettings, oInit, [
				"ajax",
				"fnFormatNumber",
				"sServerMethod",
				"aaSorting",
				"aaSortingFixed",
				"aLengthMenu",
				"sPaginationType",
				"iStateDuration",
				"bSortCellsTop",
				"iTabIndex",
				"sDom",
				"fnStateLoadCallback",
				"fnStateSaveCallback",
				"renderer",
				"searchDelay",
				"rowId",
				"caption",
				"layout",
				[ "iCookieDuration", "iStateDuration" ], // backwards compat
				[ "oSearch", "oPreviousSearch" ],
				[ "aoSearchCols", "aoPreSearchCols" ],
				[ "iDisplayLength", "_iDisplayLength" ]
			] );
			_fnMap( oSettings.oScroll, oInit, [
				[ "sScrollX", "sX" ],
				[ "sScrollXInner", "sXInner" ],
				[ "sScrollY", "sY" ],
				[ "bScrollCollapse", "bCollapse" ]
			] );
			_fnMap( oSettings.oLanguage, oInit, "fnInfoCallback" );
			
			/* Callback functions which are array driven */
			_fnCallbackReg( oSettings, 'aoDrawCallback',       oInit.fnDrawCallback );
			_fnCallbackReg( oSettings, 'aoStateSaveParams',    oInit.fnStateSaveParams );
			_fnCallbackReg( oSettings, 'aoStateLoadParams',    oInit.fnStateLoadParams );
			_fnCallbackReg( oSettings, 'aoStateLoaded',        oInit.fnStateLoaded );
			_fnCallbackReg( oSettings, 'aoRowCallback',        oInit.fnRowCallback );
			_fnCallbackReg( oSettings, 'aoRowCreatedCallback', oInit.fnCreatedRow );
			_fnCallbackReg( oSettings, 'aoHeaderCallback',     oInit.fnHeaderCallback );
			_fnCallbackReg( oSettings, 'aoFooterCallback',     oInit.fnFooterCallback );
			_fnCallbackReg( oSettings, 'aoInitComplete',       oInit.fnInitComplete );
			_fnCallbackReg( oSettings, 'aoPreDrawCallback',    oInit.fnPreDrawCallback );
			
			oSettings.rowIdFn = _fnGetObjectDataFn( oInit.rowId );
			
			/* Browser support detection */
			_fnBrowserDetect( oSettings );
			
			var oClasses = oSettings.oClasses;
			
			$.extend( oClasses, DataTable.ext.classes, oInit.oClasses );
			$this.addClass( oClasses.table );
			
			if (! oSettings.oFeatures.bPaginate) {
				oInit.iDisplayStart = 0;
			}
			
			if ( oSettings.iInitDisplayStart === undefined )
			{
				/* Display start point, taking into account the save saving */
				oSettings.iInitDisplayStart = oInit.iDisplayStart;
				oSettings._iDisplayStart = oInit.iDisplayStart;
			}
			
			/* Language definitions */
			var oLanguage = oSettings.oLanguage;
			$.extend( true, oLanguage, oInit.oLanguage );
			
			if ( oLanguage.sUrl )
			{
				/* Get the language definitions from a file - because this Ajax call makes the language
				 * get async to the remainder of this function we use bInitHandedOff to indicate that
				 * _fnInitialise will be fired by the returned Ajax handler, rather than the constructor
				 */
				$.ajax( {
					dataType: 'json',
					url: oLanguage.sUrl,
					success: function ( json ) {
						_fnCamelToHungarian( defaults.oLanguage, json );
						$.extend( true, oLanguage, json, oSettings.oInit.oLanguage );
			
						_fnCallbackFire( oSettings, null, 'i18n', [oSettings], true);
						_fnInitialise( oSettings );
					},
					error: function () {
						// Error occurred loading language file
						_fnLog( oSettings, 0, 'i18n file loading error', 21 );
			
						// continue on as best we can
						_fnInitialise( oSettings );
					}
				} );
				bInitHandedOff = true;
			}
			else {
				_fnCallbackFire( oSettings, null, 'i18n', [oSettings]);
			}
			
			/*
			 * Columns
			 * See if we should load columns automatically or use defined ones
			 */
			var columnsInit = [];
			var thead = this.getElementsByTagName('thead');
			var initHeaderLayout = _fnDetectHeader( oSettings, thead[0] );
			
			// If we don't have a columns array, then generate one with nulls
			if ( oInit.aoColumns ) {
				columnsInit = oInit.aoColumns;
			}
			else if ( initHeaderLayout.length ) {
				for ( i=0, iLen=initHeaderLayout[0].length ; i<iLen ; i++ ) {
					columnsInit.push( null );
				}
			}
			
			// Add the columns
			for ( i=0, iLen=columnsInit.length ; i<iLen ; i++ ) {
				_fnAddColumn( oSettings );
			}
			
			// Apply the column definitions
			_fnApplyColumnDefs( oSettings, oInit.aoColumnDefs, columnsInit, initHeaderLayout, function (iCol, oDef) {
				_fnColumnOptions( oSettings, iCol, oDef );
			} );
			
			/* HTML5 attribute detection - build an mData object automatically if the
			 * attributes are found
			 */
			var rowOne = $this.children('tbody').find('tr').eq(0);
			
			if ( rowOne.length ) {
				var a = function ( cell, name ) {
					return cell.getAttribute( 'data-'+name ) !== null ? name : null;
				};
			
				$( rowOne[0] ).children('th, td').each( function (i, cell) {
					var col = oSettings.aoColumns[i];
			
					if (! col) {
						_fnLog( oSettings, 0, 'Incorrect column count', 18 );
					}
			
					if ( col.mData === i ) {
						var sort = a( cell, 'sort' ) || a( cell, 'order' );
						var filter = a( cell, 'filter' ) || a( cell, 'search' );
			
						if ( sort !== null || filter !== null ) {
							col.mData = {
								_:      i+'.display',
								sort:   sort !== null   ? i+'.@data-'+sort   : undefined,
								type:   sort !== null   ? i+'.@data-'+sort   : undefined,
								filter: filter !== null ? i+'.@data-'+filter : undefined
							};
							col._isArrayHost = true;
			
							_fnColumnOptions( oSettings, i );
						}
					}
				} );
			}
			
			var features = oSettings.oFeatures;
			var loadedInit = function () {
				/*
				 * Sorting
				 * @todo For modularisation (1.11) this needs to do into a sort start up handler
				 */
			
				// If aaSorting is not defined, then we use the first indicator in asSorting
				// in case that has been altered, so the default sort reflects that option
				if ( oInit.aaSorting === undefined ) {
					var sorting = oSettings.aaSorting;
					for ( i=0, iLen=sorting.length ; i<iLen ; i++ ) {
						sorting[i][1] = oSettings.aoColumns[ i ].asSorting[0];
					}
				}
			
				/* Do a first pass on the sorting classes (allows any size changes to be taken into
				 * account, and also will apply sorting disabled classes if disabled
				 */
				_fnSortingClasses( oSettings );
			
				_fnCallbackReg( oSettings, 'aoDrawCallback', function () {
					if ( oSettings.bSorted || _fnDataSource( oSettings ) === 'ssp' || features.bDeferRender ) {
						_fnSortingClasses( oSettings );
					}
				} );
			
			
				/*
				 * Final init
				 * Cache the header, body and footer as required, creating them if needed
				 */
				var caption = $this.children('caption');
			
				if ( oSettings.caption ) {
					if ( caption.length === 0 ) {
						caption = $('<caption/>').appendTo( $this );
					}
			
					caption.html( oSettings.caption );
				}
			
				// Store the caption side, so we can remove the element from the document
				// when creating the element
				if (caption.length) {
					caption[0]._captionSide = caption.css('caption-side');
					oSettings.captionNode = caption[0];
				}
			
				if ( thead.length === 0 ) {
					thead = $('<thead/>').appendTo($this);
				}
				oSettings.nTHead = thead[0];
				$('tr', thead).addClass(oClasses.thead.row);
			
				var tbody = $this.children('tbody');
				if ( tbody.length === 0 ) {
					tbody = $('<tbody/>').insertAfter(thead);
				}
				oSettings.nTBody = tbody[0];
			
				var tfoot = $this.children('tfoot');
				if ( tfoot.length === 0 ) {
					// If we are a scrolling table, and no footer has been given, then we need to create
					// a tfoot element for the caption element to be appended to
					tfoot = $('<tfoot/>').appendTo($this);
				}
				oSettings.nTFoot = tfoot[0];
				$('tr', tfoot).addClass(oClasses.tfoot.row);
			
				// Check if there is data passing into the constructor
				if ( oInit.aaData ) {
					for ( i=0 ; i<oInit.aaData.length ; i++ ) {
						_fnAddData( oSettings, oInit.aaData[ i ] );
					}
				}
				else if ( _fnDataSource( oSettings ) == 'dom' ) {
					// Grab the data from the page
					_fnAddTr( oSettings, $(oSettings.nTBody).children('tr') );
				}
			
				/* Copy the data index array */
				oSettings.aiDisplay = oSettings.aiDisplayMaster.slice();
			
				/* Initialisation complete - table can be drawn */
				oSettings.bInitialised = true;
			
				/* Check if we need to initialise the table (it might not have been handed off to the
				 * language processor)
				 */
				if ( bInitHandedOff === false ) {
					_fnInitialise( oSettings );
				}
			};
			
			/* Must be done after everything which can be overridden by the state saving! */
			_fnCallbackReg( oSettings, 'aoDrawCallback', _fnSaveState );
			
			if ( oInit.bStateSave )
			{
				features.bStateSave = true;
				_fnLoadState( oSettings, oInit, loadedInit );
			}
			else {
				loadedInit();
			}
			
		} );
		_that = null;
		return this;
	};
	
	
	
	/**
	 * DataTables extensions
	 * 
	 * This namespace acts as a collection area for plug-ins that can be used to
	 * extend DataTables capabilities. Indeed many of the build in methods
	 * use this method to provide their own capabilities (sorting methods for
	 * example).
	 *
	 * Note that this namespace is aliased to `jQuery.fn.dataTableExt` for legacy
	 * reasons
	 *
	 *  @namespace
	 */
	DataTable.ext = _ext = {
		/**
		 * Buttons. For use with the Buttons extension for DataTables. This is
		 * defined here so other extensions can define buttons regardless of load
		 * order. It is _not_ used by DataTables core.
		 *
		 *  @type object
		 *  @default {}
		 */
		buttons: {},
	
	
		/**
		 * Element class names
		 *
		 *  @type object
		 *  @default {}
		 */
		classes: {},
	
	
		/**
		 * DataTables build type (expanded by the download builder)
		 *
		 *  @type string
		 */
		builder: "bs5/dt-2.0.8/e-2.3.2/b-3.0.2/b-colvis-3.0.2/b-html5-3.0.2/b-print-3.0.2/r-3.0.2/sc-2.4.3",
	
	
		/**
		 * Error reporting.
		 * 
		 * How should DataTables report an error. Can take the value 'alert',
		 * 'throw', 'none' or a function.
		 *
		 *  @type string|function
		 *  @default alert
		 */
		errMode: "alert",
	
	
		/**
		 * Legacy so v1 plug-ins don't throw js errors on load
		 */
		feature: [],
	
		/**
		 * Feature plug-ins.
		 * 
		 * This is an object of callbacks which provide the features for DataTables
		 * to be initialised via the `layout` option.
		 */
		features: {},
	
	
		/**
		 * Row searching.
		 * 
		 * This method of searching is complimentary to the default type based
		 * searching, and a lot more comprehensive as it allows you complete control
		 * over the searching logic. Each element in this array is a function
		 * (parameters described below) that is called for every row in the table,
		 * and your logic decides if it should be included in the searching data set
		 * or not.
		 *
		 * Searching functions have the following input parameters:
		 *
		 * 1. `{object}` DataTables settings object: see
		 *    {@link DataTable.models.oSettings}
		 * 2. `{array|object}` Data for the row to be processed (same as the
		 *    original format that was passed in as the data source, or an array
		 *    from a DOM data source
		 * 3. `{int}` Row index ({@link DataTable.models.oSettings.aoData}), which
		 *    can be useful to retrieve the `TR` element if you need DOM interaction.
		 *
		 * And the following return is expected:
		 *
		 * * {boolean} Include the row in the searched result set (true) or not
		 *   (false)
		 *
		 * Note that as with the main search ability in DataTables, technically this
		 * is "filtering", since it is subtractive. However, for consistency in
		 * naming we call it searching here.
		 *
		 *  @type array
		 *  @default []
		 *
		 *  @example
		 *    // The following example shows custom search being applied to the
		 *    // fourth column (i.e. the data[3] index) based on two input values
		 *    // from the end-user, matching the data in a certain range.
		 *    $.fn.dataTable.ext.search.push(
		 *      function( settings, data, dataIndex ) {
		 *        var min = document.getElementById('min').value * 1;
		 *        var max = document.getElementById('max').value * 1;
		 *        var version = data[3] == "-" ? 0 : data[3]*1;
		 *
		 *        if ( min == "" && max == "" ) {
		 *          return true;
		 *        }
		 *        else if ( min == "" && version < max ) {
		 *          return true;
		 *        }
		 *        else if ( min < version && "" == max ) {
		 *          return true;
		 *        }
		 *        else if ( min < version && version < max ) {
		 *          return true;
		 *        }
		 *        return false;
		 *      }
		 *    );
		 */
		search: [],
	
	
		/**
		 * Selector extensions
		 *
		 * The `selector` option can be used to extend the options available for the
		 * selector modifier options (`selector-modifier` object data type) that
		 * each of the three built in selector types offer (row, column and cell +
		 * their plural counterparts). For example the Select extension uses this
		 * mechanism to provide an option to select only rows, columns and cells
		 * that have been marked as selected by the end user (`{selected: true}`),
		 * which can be used in conjunction with the existing built in selector
		 * options.
		 *
		 * Each property is an array to which functions can be pushed. The functions
		 * take three attributes:
		 *
		 * * Settings object for the host table
		 * * Options object (`selector-modifier` object type)
		 * * Array of selected item indexes
		 *
		 * The return is an array of the resulting item indexes after the custom
		 * selector has been applied.
		 *
		 *  @type object
		 */
		selector: {
			cell: [],
			column: [],
			row: []
		},
	
	
		/**
		 * Legacy configuration options. Enable and disable legacy options that
		 * are available in DataTables.
		 *
		 *  @type object
		 */
		legacy: {
			/**
			 * Enable / disable DataTables 1.9 compatible server-side processing
			 * requests
			 *
			 *  @type boolean
			 *  @default null
			 */
			ajax: null
		},
	
	
		/**
		 * Pagination plug-in methods.
		 * 
		 * Each entry in this object is a function and defines which buttons should
		 * be shown by the pagination rendering method that is used for the table:
		 * {@link DataTable.ext.renderer.pageButton}. The renderer addresses how the
		 * buttons are displayed in the document, while the functions here tell it
		 * what buttons to display. This is done by returning an array of button
		 * descriptions (what each button will do).
		 *
		 * Pagination types (the four built in options and any additional plug-in
		 * options defined here) can be used through the `paginationType`
		 * initialisation parameter.
		 *
		 * The functions defined take two parameters:
		 *
		 * 1. `{int} page` The current page index
		 * 2. `{int} pages` The number of pages in the table
		 *
		 * Each function is expected to return an array where each element of the
		 * array can be one of:
		 *
		 * * `first` - Jump to first page when activated
		 * * `last` - Jump to last page when activated
		 * * `previous` - Show previous page when activated
		 * * `next` - Show next page when activated
		 * * `{int}` - Show page of the index given
		 * * `{array}` - A nested array containing the above elements to add a
		 *   containing 'DIV' element (might be useful for styling).
		 *
		 * Note that DataTables v1.9- used this object slightly differently whereby
		 * an object with two functions would be defined for each plug-in. That
		 * ability is still supported by DataTables 1.10+ to provide backwards
		 * compatibility, but this option of use is now decremented and no longer
		 * documented in DataTables 1.10+.
		 *
		 *  @type object
		 *  @default {}
		 *
		 *  @example
		 *    // Show previous, next and current page buttons only
		 *    $.fn.dataTableExt.oPagination.current = function ( page, pages ) {
		 *      return [ 'previous', page, 'next' ];
		 *    };
		 */
		pager: {},
	
	
		renderer: {
			pageButton: {},
			header: {}
		},
	
	
		/**
		 * Ordering plug-ins - custom data source
		 * 
		 * The extension options for ordering of data available here is complimentary
		 * to the default type based ordering that DataTables typically uses. It
		 * allows much greater control over the the data that is being used to
		 * order a column, but is necessarily therefore more complex.
		 * 
		 * This type of ordering is useful if you want to do ordering based on data
		 * live from the DOM (for example the contents of an 'input' element) rather
		 * than just the static string that DataTables knows of.
		 * 
		 * The way these plug-ins work is that you create an array of the values you
		 * wish to be ordering for the column in question and then return that
		 * array. The data in the array much be in the index order of the rows in
		 * the table (not the currently ordering order!). Which order data gathering
		 * function is run here depends on the `dt-init columns.orderDataType`
		 * parameter that is used for the column (if any).
		 *
		 * The functions defined take two parameters:
		 *
		 * 1. `{object}` DataTables settings object: see
		 *    {@link DataTable.models.oSettings}
		 * 2. `{int}` Target column index
		 *
		 * Each function is expected to return an array:
		 *
		 * * `{array}` Data for the column to be ordering upon
		 *
		 *  @type array
		 *
		 *  @example
		 *    // Ordering using `input` node values
		 *    $.fn.dataTable.ext.order['dom-text'] = function  ( settings, col )
		 *    {
		 *      return this.api().column( col, {order:'index'} ).nodes().map( function ( td, i ) {
		 *        return $('input', td).val();
		 *      } );
		 *    }
		 */
		order: {},
	
	
		/**
		 * Type based plug-ins.
		 *
		 * Each column in DataTables has a type assigned to it, either by automatic
		 * detection or by direct assignment using the `type` option for the column.
		 * The type of a column will effect how it is ordering and search (plug-ins
		 * can also make use of the column type if required).
		 *
		 * @namespace
		 */
		type: {
			/**
			 * Automatic column class assignment
			 */
			className: {},
	
			/**
			 * Type detection functions.
			 *
			 * The functions defined in this object are used to automatically detect
			 * a column's type, making initialisation of DataTables super easy, even
			 * when complex data is in the table.
			 *
			 * The functions defined take two parameters:
			 *
		     *  1. `{*}` Data from the column cell to be analysed
		     *  2. `{settings}` DataTables settings object. This can be used to
		     *     perform context specific type detection - for example detection
		     *     based on language settings such as using a comma for a decimal
		     *     place. Generally speaking the options from the settings will not
		     *     be required
			 *
			 * Each function is expected to return:
			 *
			 * * `{string|null}` Data type detected, or null if unknown (and thus
			 *   pass it on to the other type detection functions.
			 *
			 *  @type array
			 *
			 *  @example
			 *    // Currency type detection plug-in:
			 *    $.fn.dataTable.ext.type.detect.push(
			 *      function ( data, settings ) {
			 *        // Check the numeric part
			 *        if ( ! data.substring(1).match(/[0-9]/) ) {
			 *          return null;
			 *        }
			 *
			 *        // Check prefixed by currency
			 *        if ( data.charAt(0) == '$' || data.charAt(0) == '&pound;' ) {
			 *          return 'currency';
			 *        }
			 *        return null;
			 *      }
			 *    );
			 */
			detect: [],
	
			/**
			 * Automatic renderer assignment
			 */
			render: {},
	
	
			/**
			 * Type based search formatting.
			 *
			 * The type based searching functions can be used to pre-format the
			 * data to be search on. For example, it can be used to strip HTML
			 * tags or to de-format telephone numbers for numeric only searching.
			 *
			 * Note that is a search is not defined for a column of a given type,
			 * no search formatting will be performed.
			 * 
			 * Pre-processing of searching data plug-ins - When you assign the sType
			 * for a column (or have it automatically detected for you by DataTables
			 * or a type detection plug-in), you will typically be using this for
			 * custom sorting, but it can also be used to provide custom searching
			 * by allowing you to pre-processing the data and returning the data in
			 * the format that should be searched upon. This is done by adding
			 * functions this object with a parameter name which matches the sType
			 * for that target column. This is the corollary of <i>afnSortData</i>
			 * for searching data.
			 *
			 * The functions defined take a single parameter:
			 *
		     *  1. `{*}` Data from the column cell to be prepared for searching
			 *
			 * Each function is expected to return:
			 *
			 * * `{string|null}` Formatted string that will be used for the searching.
			 *
			 *  @type object
			 *  @default {}
			 *
			 *  @example
			 *    $.fn.dataTable.ext.type.search['title-numeric'] = function ( d ) {
			 *      return d.replace(/\n/g," ").replace( /<.*?>/g, "" );
			 *    }
			 */
			search: {},
	
	
			/**
			 * Type based ordering.
			 *
			 * The column type tells DataTables what ordering to apply to the table
			 * when a column is sorted upon. The order for each type that is defined,
			 * is defined by the functions available in this object.
			 *
			 * Each ordering option can be described by three properties added to
			 * this object:
			 *
			 * * `{type}-pre` - Pre-formatting function
			 * * `{type}-asc` - Ascending order function
			 * * `{type}-desc` - Descending order function
			 *
			 * All three can be used together, only `{type}-pre` or only
			 * `{type}-asc` and `{type}-desc` together. It is generally recommended
			 * that only `{type}-pre` is used, as this provides the optimal
			 * implementation in terms of speed, although the others are provided
			 * for compatibility with existing Javascript sort functions.
			 *
			 * `{type}-pre`: Functions defined take a single parameter:
			 *
		     *  1. `{*}` Data from the column cell to be prepared for ordering
			 *
			 * And return:
			 *
			 * * `{*}` Data to be sorted upon
			 *
			 * `{type}-asc` and `{type}-desc`: Functions are typical Javascript sort
			 * functions, taking two parameters:
			 *
		     *  1. `{*}` Data to compare to the second parameter
		     *  2. `{*}` Data to compare to the first parameter
			 *
			 * And returning:
			 *
			 * * `{*}` Ordering match: <0 if first parameter should be sorted lower
			 *   than the second parameter, ===0 if the two parameters are equal and
			 *   >0 if the first parameter should be sorted height than the second
			 *   parameter.
			 * 
			 *  @type object
			 *  @default {}
			 *
			 *  @example
			 *    // Numeric ordering of formatted numbers with a pre-formatter
			 *    $.extend( $.fn.dataTable.ext.type.order, {
			 *      "string-pre": function(x) {
			 *        a = (a === "-" || a === "") ? 0 : a.replace( /[^\d\-\.]/g, "" );
			 *        return parseFloat( a );
			 *      }
			 *    } );
			 *
			 *  @example
			 *    // Case-sensitive string ordering, with no pre-formatting method
			 *    $.extend( $.fn.dataTable.ext.order, {
			 *      "string-case-asc": function(x,y) {
			 *        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
			 *      },
			 *      "string-case-desc": function(x,y) {
			 *        return ((x < y) ? 1 : ((x > y) ? -1 : 0));
			 *      }
			 *    } );
			 */
			order: {}
		},
	
		/**
		 * Unique DataTables instance counter
		 *
		 * @type int
		 * @private
		 */
		_unique: 0,
	
	
		//
		// Depreciated
		// The following properties are retained for backwards compatibility only.
		// The should not be used in new projects and will be removed in a future
		// version
		//
	
		/**
		 * Version check function.
		 *  @type function
		 *  @depreciated Since 1.10
		 */
		fnVersionCheck: DataTable.fnVersionCheck,
	
	
		/**
		 * Index for what 'this' index API functions should use
		 *  @type int
		 *  @deprecated Since v1.10
		 */
		iApiIndex: 0,
	
	
		/**
		 * Software version
		 *  @type string
		 *  @deprecated Since v1.10
		 */
		sVersion: DataTable.version
	};
	
	
	//
	// Backwards compatibility. Alias to pre 1.10 Hungarian notation counter parts
	//
	$.extend( _ext, {
		afnFiltering: _ext.search,
		aTypes:       _ext.type.detect,
		ofnSearch:    _ext.type.search,
		oSort:        _ext.type.order,
		afnSortData:  _ext.order,
		aoFeatures:   _ext.feature,
		oStdClasses:  _ext.classes,
		oPagination:  _ext.pager
	} );
	
	
	$.extend( DataTable.ext.classes, {
		container: 'dt-container',
		empty: {
			row: 'dt-empty'
		},
		info: {
			container: 'dt-info'
		},
		length: {
			container: 'dt-length',
			select: 'dt-input'
		},
		order: {
			canAsc: 'dt-orderable-asc',
			canDesc: 'dt-orderable-desc',
			isAsc: 'dt-ordering-asc',
			isDesc: 'dt-ordering-desc',
			none: 'dt-orderable-none',
			position: 'sorting_'
		},
		processing: {
			container: 'dt-processing'
		},
		scrolling: {
			body: 'dt-scroll-body',
			container: 'dt-scroll',
			footer: {
				self: 'dt-scroll-foot',
				inner: 'dt-scroll-footInner'
			},
			header: {
				self: 'dt-scroll-head',
				inner: 'dt-scroll-headInner'
			}
		},
		search: {
			container: 'dt-search',
			input: 'dt-input'
		},
		table: 'dataTable',	
		tbody: {
			cell: '',
			row: ''
		},
		thead: {
			cell: '',
			row: ''
		},
		tfoot: {
			cell: '',
			row: ''
		},
		paging: {
			active: 'current',
			button: 'dt-paging-button',
			container: 'dt-paging',
			disabled: 'disabled'
		}
	} );
	
	
	/*
	 * It is useful to have variables which are scoped locally so only the
	 * DataTables functions can access them and they don't leak into global space.
	 * At the same time these functions are often useful over multiple files in the
	 * core and API, so we list, or at least document, all variables which are used
	 * by DataTables as private variables here. This also ensures that there is no
	 * clashing of variable names and that they can easily referenced for reuse.
	 */
	
	
	// Defined else where
	//  _selector_run
	//  _selector_opts
	//  _selector_row_indexes
	
	var _ext; // DataTable.ext
	var _Api; // DataTable.Api
	var _api_register; // DataTable.Api.register
	var _api_registerPlural; // DataTable.Api.registerPlural
	
	var _re_dic = {};
	var _re_new_lines = /[\r\n\u2028]/g;
	var _re_html = /<([^>]*>)/g;
	var _max_str_len = Math.pow(2, 28);
	
	// This is not strict ISO8601 - Date.parse() is quite lax, although
	// implementations differ between browsers.
	var _re_date = /^\d{2,4}[./-]\d{1,2}[./-]\d{1,2}([T ]{1}\d{1,2}[:.]\d{2}([.:]\d{2})?)?$/;
	
	// Escape regular expression special characters
	var _re_escape_regex = new RegExp( '(\\' + [ '/', '.', '*', '+', '?', '|', '(', ')', '[', ']', '{', '}', '\\', '$', '^', '-' ].join('|\\') + ')', 'g' );
	
	// https://en.wikipedia.org/wiki/Foreign_exchange_market
	// - \u20BD - Russian ruble.
	// - \u20a9 - South Korean Won
	// - \u20BA - Turkish Lira
	// - \u20B9 - Indian Rupee
	// - R - Brazil (R$) and South Africa
	// - fr - Swiss Franc
	// - kr - Swedish krona, Norwegian krone and Danish krone
	// - \u2009 is thin space and \u202F is narrow no-break space, both used in many
	// - Ƀ - Bitcoin
	// - Ξ - Ethereum
	//   standards as thousands separators.
	var _re_formatted_numeric = /['\u00A0,$£€¥%\u2009\u202F\u20BD\u20a9\u20BArfkɃΞ]/gi;
	
	
	var _empty = function ( d ) {
		return !d || d === true || d === '-' ? true : false;
	};
	
	
	var _intVal = function ( s ) {
		var integer = parseInt( s, 10 );
		return !isNaN(integer) && isFinite(s) ? integer : null;
	};
	
	// Convert from a formatted number with characters other than `.` as the
	// decimal place, to a Javascript number
	var _numToDecimal = function ( num, decimalPoint ) {
		// Cache created regular expressions for speed as this function is called often
		if ( ! _re_dic[ decimalPoint ] ) {
			_re_dic[ decimalPoint ] = new RegExp( _fnEscapeRegex( decimalPoint ), 'g' );
		}
		return typeof num === 'string' && decimalPoint !== '.' ?
			num.replace( /\./g, '' ).replace( _re_dic[ decimalPoint ], '.' ) :
			num;
	};
	
	
	var _isNumber = function ( d, decimalPoint, formatted ) {
		var type = typeof d;
		var strType = type === 'string';
	
		if ( type === 'number' || type === 'bigint') {
			return true;
		}
	
		// If empty return immediately so there must be a number if it is a
		// formatted string (this stops the string "k", or "kr", etc being detected
		// as a formatted number for currency
		if ( _empty( d ) ) {
			return true;
		}
	
		if ( decimalPoint && strType ) {
			d = _numToDecimal( d, decimalPoint );
		}
	
		if ( formatted && strType ) {
			d = d.replace( _re_formatted_numeric, '' );
		}
	
		return !isNaN( parseFloat(d) ) && isFinite( d );
	};
	
	
	// A string without HTML in it can be considered to be HTML still
	var _isHtml = function ( d ) {
		return _empty( d ) || typeof d === 'string';
	};
	
	// Is a string a number surrounded by HTML?
	var _htmlNumeric = function ( d, decimalPoint, formatted ) {
		if ( _empty( d ) ) {
			return true;
		}
	
		// input and select strings mean that this isn't just a number
		if (typeof d === 'string' && d.match(/<(input|select)/i)) {
			return null;
		}
	
		var html = _isHtml( d );
		return ! html ?
			null :
			_isNumber( _stripHtml( d ), decimalPoint, formatted ) ?
				true :
				null;
	};
	
	
	var _pluck = function ( a, prop, prop2 ) {
		var out = [];
		var i=0, ien=a.length;
	
		// Could have the test in the loop for slightly smaller code, but speed
		// is essential here
		if ( prop2 !== undefined ) {
			for ( ; i<ien ; i++ ) {
				if ( a[i] && a[i][ prop ] ) {
					out.push( a[i][ prop ][ prop2 ] );
				}
			}
		}
		else {
			for ( ; i<ien ; i++ ) {
				if ( a[i] ) {
					out.push( a[i][ prop ] );
				}
			}
		}
	
		return out;
	};
	
	
	// Basically the same as _pluck, but rather than looping over `a` we use `order`
	// as the indexes to pick from `a`
	var _pluck_order = function ( a, order, prop, prop2 )
	{
		var out = [];
		var i=0, ien=order.length;
	
		// Could have the test in the loop for slightly smaller code, but speed
		// is essential here
		if ( prop2 !== undefined ) {
			for ( ; i<ien ; i++ ) {
				if ( a[ order[i] ][ prop ] ) {
					out.push( a[ order[i] ][ prop ][ prop2 ] );
				}
			}
		}
		else {
			for ( ; i<ien ; i++ ) {
				if ( a[ order[i] ] ) {
					out.push( a[ order[i] ][ prop ] );
				}
			}
		}
	
		return out;
	};
	
	
	var _range = function ( len, start )
	{
		var out = [];
		var end;
	
		if ( start === undefined ) {
			start = 0;
			end = len;
		}
		else {
			end = start;
			start = len;
		}
	
		for ( var i=start ; i<end ; i++ ) {
			out.push( i );
		}
	
		return out;
	};
	
	
	var _removeEmpty = function ( a )
	{
		var out = [];
	
		for ( var i=0, ien=a.length ; i<ien ; i++ ) {
			if ( a[i] ) { // careful - will remove all falsy values!
				out.push( a[i] );
			}
		}
	
		return out;
	};
	
	// Replaceable function in api.util
	var _stripHtml = function (input) {
		// Irrelevant check to workaround CodeQL's false positive on the regex
		if (input.length > _max_str_len) {
			throw new Error('Exceeded max str len');
		}
	
		var previous;
	
		input = input.replace(_re_html, ''); // Complete tags
	
		// Safety for incomplete script tag - use do / while to ensure that
		// we get all instances
		do {
			previous = input;
			input = input.replace(/<script/i, '');
		} while (input !== previous);
	
		return previous;
	};
	
	// Replaceable function in api.util
	var _escapeHtml = function ( d ) {
		if (Array.isArray(d)) {
			d = d.join(',');
		}
	
		return typeof d === 'string' ?
			d
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/"/g, '&quot;') :
			d;
	};
	
	// Remove diacritics from a string by decomposing it and then removing
	// non-ascii characters
	var _normalize = function (str, both) {
		if (typeof str !== 'string') {
			return str;
		}
	
		// It is faster to just run `normalize` than it is to check if
		// we need to with a regex!
		var res = str.normalize("NFD");
	
		// Equally, here we check if a regex is needed or not
		return res.length !== str.length
			? (both === true ? str + ' ' : '' ) + res.replace(/[\u0300-\u036f]/g, "")
			: res;
	}
	
	/**
	 * Determine if all values in the array are unique. This means we can short
	 * cut the _unique method at the cost of a single loop. A sorted array is used
	 * to easily check the values.
	 *
	 * @param  {array} src Source array
	 * @return {boolean} true if all unique, false otherwise
	 * @ignore
	 */
	var _areAllUnique = function ( src ) {
		if ( src.length < 2 ) {
			return true;
		}
	
		var sorted = src.slice().sort();
		var last = sorted[0];
	
		for ( var i=1, ien=sorted.length ; i<ien ; i++ ) {
			if ( sorted[i] === last ) {
				return false;
			}
	
			last = sorted[i];
		}
	
		return true;
	};
	
	
	/**
	 * Find the unique elements in a source array.
	 *
	 * @param  {array} src Source array
	 * @return {array} Array of unique items
	 * @ignore
	 */
	var _unique = function ( src )
	{
		if (Array.from && Set) {
			return Array.from(new Set(src));
		}
	
		if ( _areAllUnique( src ) ) {
			return src.slice();
		}
	
		// A faster unique method is to use object keys to identify used values,
		// but this doesn't work with arrays or objects, which we must also
		// consider. See jsperf.app/compare-array-unique-versions/4 for more
		// information.
		var
			out = [],
			val,
			i, ien=src.length,
			j, k=0;
	
		again: for ( i=0 ; i<ien ; i++ ) {
			val = src[i];
	
			for ( j=0 ; j<k ; j++ ) {
				if ( out[j] === val ) {
					continue again;
				}
			}
	
			out.push( val );
			k++;
		}
	
		return out;
	};
	
	// Surprisingly this is faster than [].concat.apply
	// https://jsperf.com/flatten-an-array-loop-vs-reduce/2
	var _flatten = function (out, val) {
		if (Array.isArray(val)) {
			for (var i=0 ; i<val.length ; i++) {
				_flatten(out, val[i]);
			}
		}
		else {
			out.push(val);
		}
	
		return out;
	}
	
	// Similar to jQuery's addClass, but use classList.add
	function _addClass(el, name) {
		if (name) {
			name.split(' ').forEach(function (n) {
				if (n) {
					// `add` does deduplication, so no need to check `contains`
					el.classList.add(n);
				}
			});
		}
	}
	
	/**
	 * DataTables utility methods
	 * 
	 * This namespace provides helper methods that DataTables uses internally to
	 * create a DataTable, but which are not exclusively used only for DataTables.
	 * These methods can be used by extension authors to save the duplication of
	 * code.
	 *
	 *  @namespace
	 */
	DataTable.util = {
		/**
		 * Return a string with diacritic characters decomposed
		 * @param {*} mixed Function or string to normalize
		 * @param {*} both Return original string and the normalized string
		 * @returns String or undefined
		 */
		diacritics: function (mixed, both) {
			var type = typeof mixed;
	
			if (type !== 'function') {
				return _normalize(mixed, both);
			}
			_normalize = mixed;
		},
	
		/**
		 * Debounce a function
		 *
		 * @param {function} fn Function to be called
		 * @param {integer} freq Call frequency in mS
		 * @return {function} Wrapped function
		 */
		debounce: function ( fn, timeout ) {
			var timer;
	
			return function () {
				var that = this;
				var args = arguments;
	
				clearTimeout(timer);
	
				timer = setTimeout( function () {
					fn.apply(that, args);
				}, timeout || 250 );
			};
		},
	
		/**
		 * Throttle the calls to a function. Arguments and context are maintained
		 * for the throttled function.
		 *
		 * @param {function} fn Function to be called
		 * @param {integer} freq Call frequency in mS
		 * @return {function} Wrapped function
		 */
		throttle: function ( fn, freq ) {
			var
				frequency = freq !== undefined ? freq : 200,
				last,
				timer;
	
			return function () {
				var
					that = this,
					now  = +new Date(),
					args = arguments;
	
				if ( last && now < last + frequency ) {
					clearTimeout( timer );
	
					timer = setTimeout( function () {
						last = undefined;
						fn.apply( that, args );
					}, frequency );
				}
				else {
					last = now;
					fn.apply( that, args );
				}
			};
		},
	
		/**
		 * Escape a string such that it can be used in a regular expression
		 *
		 *  @param {string} val string to escape
		 *  @returns {string} escaped string
		 */
		escapeRegex: function ( val ) {
			return val.replace( _re_escape_regex, '\\$1' );
		},
	
		/**
		 * Create a function that will write to a nested object or array
		 * @param {*} source JSON notation string
		 * @returns Write function
		 */
		set: function ( source ) {
			if ( $.isPlainObject( source ) ) {
				/* Unlike get, only the underscore (global) option is used for for
				 * setting data since we don't know the type here. This is why an object
				 * option is not documented for `mData` (which is read/write), but it is
				 * for `mRender` which is read only.
				 */
				return DataTable.util.set( source._ );
			}
			else if ( source === null ) {
				// Nothing to do when the data source is null
				return function () {};
			}
			else if ( typeof source === 'function' ) {
				return function (data, val, meta) {
					source( data, 'set', val, meta );
				};
			}
			else if (
				typeof source === 'string' && (source.indexOf('.') !== -1 ||
				source.indexOf('[') !== -1 || source.indexOf('(') !== -1)
			) {
				// Like the get, we need to get data from a nested object
				var setData = function (data, val, src) {
					var a = _fnSplitObjNotation( src ), b;
					var aLast = a[a.length-1];
					var arrayNotation, funcNotation, o, innerSrc;
		
					for ( var i=0, iLen=a.length-1 ; i<iLen ; i++ ) {
						// Protect against prototype pollution
						if (a[i] === '__proto__' || a[i] === 'constructor') {
							throw new Error('Cannot set prototype values');
						}
		
						// Check if we are dealing with an array notation request
						arrayNotation = a[i].match(__reArray);
						funcNotation = a[i].match(__reFn);
		
						if ( arrayNotation ) {
							a[i] = a[i].replace(__reArray, '');
							data[ a[i] ] = [];
		
							// Get the remainder of the nested object to set so we can recurse
							b = a.slice();
							b.splice( 0, i+1 );
							innerSrc = b.join('.');
		
							// Traverse each entry in the array setting the properties requested
							if ( Array.isArray( val ) ) {
								for ( var j=0, jLen=val.length ; j<jLen ; j++ ) {
									o = {};
									setData( o, val[j], innerSrc );
									data[ a[i] ].push( o );
								}
							}
							else {
								// We've been asked to save data to an array, but it
								// isn't array data to be saved. Best that can be done
								// is to just save the value.
								data[ a[i] ] = val;
							}
		
							// The inner call to setData has already traversed through the remainder
							// of the source and has set the data, thus we can exit here
							return;
						}
						else if ( funcNotation ) {
							// Function call
							a[i] = a[i].replace(__reFn, '');
							data = data[ a[i] ]( val );
						}
		
						// If the nested object doesn't currently exist - since we are
						// trying to set the value - create it
						if ( data[ a[i] ] === null || data[ a[i] ] === undefined ) {
							data[ a[i] ] = {};
						}
						data = data[ a[i] ];
					}
		
					// Last item in the input - i.e, the actual set
					if ( aLast.match(__reFn ) ) {
						// Function call
						data = data[ aLast.replace(__reFn, '') ]( val );
					}
					else {
						// If array notation is used, we just want to strip it and use the property name
						// and assign the value. If it isn't used, then we get the result we want anyway
						data[ aLast.replace(__reArray, '') ] = val;
					}
				};
		
				return function (data, val) { // meta is also passed in, but not used
					return setData( data, val, source );
				};
			}
			else {
				// Array or flat object mapping
				return function (data, val) { // meta is also passed in, but not used
					data[source] = val;
				};
			}
		},
	
		/**
		 * Create a function that will read nested objects from arrays, based on JSON notation
		 * @param {*} source JSON notation string
		 * @returns Value read
		 */
		get: function ( source ) {
			if ( $.isPlainObject( source ) ) {
				// Build an object of get functions, and wrap them in a single call
				var o = {};
				$.each( source, function (key, val) {
					if ( val ) {
						o[key] = DataTable.util.get( val );
					}
				} );
		
				return function (data, type, row, meta) {
					var t = o[type] || o._;
					return t !== undefined ?
						t(data, type, row, meta) :
						data;
				};
			}
			else if ( source === null ) {
				// Give an empty string for rendering / sorting etc
				return function (data) { // type, row and meta also passed, but not used
					return data;
				};
			}
			else if ( typeof source === 'function' ) {
				return function (data, type, row, meta) {
					return source( data, type, row, meta );
				};
			}
			else if (
				typeof source === 'string' && (source.indexOf('.') !== -1 ||
				source.indexOf('[') !== -1 || source.indexOf('(') !== -1)
			) {
				/* If there is a . in the source string then the data source is in a
				 * nested object so we loop over the data for each level to get the next
				 * level down. On each loop we test for undefined, and if found immediately
				 * return. This allows entire objects to be missing and sDefaultContent to
				 * be used if defined, rather than throwing an error
				 */
				var fetchData = function (data, type, src) {
					var arrayNotation, funcNotation, out, innerSrc;
		
					if ( src !== "" ) {
						var a = _fnSplitObjNotation( src );
		
						for ( var i=0, iLen=a.length ; i<iLen ; i++ ) {
							// Check if we are dealing with special notation
							arrayNotation = a[i].match(__reArray);
							funcNotation = a[i].match(__reFn);
		
							if ( arrayNotation ) {
								// Array notation
								a[i] = a[i].replace(__reArray, '');
		
								// Condition allows simply [] to be passed in
								if ( a[i] !== "" ) {
									data = data[ a[i] ];
								}
								out = [];
		
								// Get the remainder of the nested object to get
								a.splice( 0, i+1 );
								innerSrc = a.join('.');
		
								// Traverse each entry in the array getting the properties requested
								if ( Array.isArray( data ) ) {
									for ( var j=0, jLen=data.length ; j<jLen ; j++ ) {
										out.push( fetchData( data[j], type, innerSrc ) );
									}
								}
		
								// If a string is given in between the array notation indicators, that
								// is used to join the strings together, otherwise an array is returned
								var join = arrayNotation[0].substring(1, arrayNotation[0].length-1);
								data = (join==="") ? out : out.join(join);
		
								// The inner call to fetchData has already traversed through the remainder
								// of the source requested, so we exit from the loop
								break;
							}
							else if ( funcNotation ) {
								// Function call
								a[i] = a[i].replace(__reFn, '');
								data = data[ a[i] ]();
								continue;
							}
		
							if (data === null || data[ a[i] ] === null) {
								return null;
							}
							else if ( data === undefined || data[ a[i] ] === undefined ) {
								return undefined;
							}
	
							data = data[ a[i] ];
						}
					}
		
					return data;
				};
		
				return function (data, type) { // row and meta also passed, but not used
					return fetchData( data, type, source );
				};
			}
			else {
				// Array or flat object mapping
				return function (data) { // row and meta also passed, but not used
					return data[source];
				};
			}
		},
	
		stripHtml: function (mixed) {
			var type = typeof mixed;
	
			if (type === 'function') {
				_stripHtml = mixed;
				return;
			}
			else if (type === 'string') {
				return _stripHtml(mixed);
			}
			return mixed;
		},
	
		escapeHtml: function (mixed) {
			var type = typeof mixed;
	
			if (type === 'function') {
				_escapeHtml = mixed;
				return;
			}
			else if (type === 'string' || Array.isArray(mixed)) {
				return _escapeHtml(mixed);
			}
			return mixed;
		},
	
		unique: _unique
	};
	
	
	
	/**
	 * Create a mapping object that allows camel case parameters to be looked up
	 * for their Hungarian counterparts. The mapping is stored in a private
	 * parameter called `_hungarianMap` which can be accessed on the source object.
	 *  @param {object} o
	 *  @memberof DataTable#oApi
	 */
	function _fnHungarianMap ( o )
	{
		var
			hungarian = 'a aa ai ao as b fn i m o s ',
			match,
			newKey,
			map = {};
	
		$.each( o, function (key) {
			match = key.match(/^([^A-Z]+?)([A-Z])/);
	
			if ( match && hungarian.indexOf(match[1]+' ') !== -1 )
			{
				newKey = key.replace( match[0], match[2].toLowerCase() );
				map[ newKey ] = key;
	
				if ( match[1] === 'o' )
				{
					_fnHungarianMap( o[key] );
				}
			}
		} );
	
		o._hungarianMap = map;
	}
	
	
	/**
	 * Convert from camel case parameters to Hungarian, based on a Hungarian map
	 * created by _fnHungarianMap.
	 *  @param {object} src The model object which holds all parameters that can be
	 *    mapped.
	 *  @param {object} user The object to convert from camel case to Hungarian.
	 *  @param {boolean} force When set to `true`, properties which already have a
	 *    Hungarian value in the `user` object will be overwritten. Otherwise they
	 *    won't be.
	 *  @memberof DataTable#oApi
	 */
	function _fnCamelToHungarian ( src, user, force )
	{
		if ( ! src._hungarianMap ) {
			_fnHungarianMap( src );
		}
	
		var hungarianKey;
	
		$.each( user, function (key) {
			hungarianKey = src._hungarianMap[ key ];
	
			if ( hungarianKey !== undefined && (force || user[hungarianKey] === undefined) )
			{
				// For objects, we need to buzz down into the object to copy parameters
				if ( hungarianKey.charAt(0) === 'o' )
				{
					// Copy the camelCase options over to the hungarian
					if ( ! user[ hungarianKey ] ) {
						user[ hungarianKey ] = {};
					}
					$.extend( true, user[hungarianKey], user[key] );
	
					_fnCamelToHungarian( src[hungarianKey], user[hungarianKey], force );
				}
				else {
					user[hungarianKey] = user[ key ];
				}
			}
		} );
	}
	
	/**
	 * Map one parameter onto another
	 *  @param {object} o Object to map
	 *  @param {*} knew The new parameter name
	 *  @param {*} old The old parameter name
	 */
	var _fnCompatMap = function ( o, knew, old ) {
		if ( o[ knew ] !== undefined ) {
			o[ old ] = o[ knew ];
		}
	};
	
	
	/**
	 * Provide backwards compatibility for the main DT options. Note that the new
	 * options are mapped onto the old parameters, so this is an external interface
	 * change only.
	 *  @param {object} init Object to map
	 */
	function _fnCompatOpts ( init )
	{
		_fnCompatMap( init, 'ordering',      'bSort' );
		_fnCompatMap( init, 'orderMulti',    'bSortMulti' );
		_fnCompatMap( init, 'orderClasses',  'bSortClasses' );
		_fnCompatMap( init, 'orderCellsTop', 'bSortCellsTop' );
		_fnCompatMap( init, 'order',         'aaSorting' );
		_fnCompatMap( init, 'orderFixed',    'aaSortingFixed' );
		_fnCompatMap( init, 'paging',        'bPaginate' );
		_fnCompatMap( init, 'pagingType',    'sPaginationType' );
		_fnCompatMap( init, 'pageLength',    'iDisplayLength' );
		_fnCompatMap( init, 'searching',     'bFilter' );
	
		// Boolean initialisation of x-scrolling
		if ( typeof init.sScrollX === 'boolean' ) {
			init.sScrollX = init.sScrollX ? '100%' : '';
		}
		if ( typeof init.scrollX === 'boolean' ) {
			init.scrollX = init.scrollX ? '100%' : '';
		}
	
		// Column search objects are in an array, so it needs to be converted
		// element by element
		var searchCols = init.aoSearchCols;
	
		if ( searchCols ) {
			for ( var i=0, ien=searchCols.length ; i<ien ; i++ ) {
				if ( searchCols[i] ) {
					_fnCamelToHungarian( DataTable.models.oSearch, searchCols[i] );
				}
			}
		}
	
		// Enable search delay if server-side processing is enabled
		if (init.serverSide && ! init.searchDelay) {
			init.searchDelay = 400;
		}
	}
	
	
	/**
	 * Provide backwards compatibility for column options. Note that the new options
	 * are mapped onto the old parameters, so this is an external interface change
	 * only.
	 *  @param {object} init Object to map
	 */
	function _fnCompatCols ( init )
	{
		_fnCompatMap( init, 'orderable',     'bSortable' );
		_fnCompatMap( init, 'orderData',     'aDataSort' );
		_fnCompatMap( init, 'orderSequence', 'asSorting' );
		_fnCompatMap( init, 'orderDataType', 'sortDataType' );
	
		// orderData can be given as an integer
		var dataSort = init.aDataSort;
		if ( typeof dataSort === 'number' && ! Array.isArray( dataSort ) ) {
			init.aDataSort = [ dataSort ];
		}
	}
	
	
	/**
	 * Browser feature detection for capabilities, quirks
	 *  @param {object} settings dataTables settings object
	 *  @memberof DataTable#oApi
	 */
	function _fnBrowserDetect( settings )
	{
		// We don't need to do this every time DataTables is constructed, the values
		// calculated are specific to the browser and OS configuration which we
		// don't expect to change between initialisations
		if ( ! DataTable.__browser ) {
			var browser = {};
			DataTable.__browser = browser;
	
			// Scrolling feature / quirks detection
			var n = $('<div/>')
				.css( {
					position: 'fixed',
					top: 0,
					left: -1 * window.pageXOffset, // allow for scrolling
					height: 1,
					width: 1,
					overflow: 'hidden'
				} )
				.append(
					$('<div/>')
						.css( {
							position: 'absolute',
							top: 1,
							left: 1,
							width: 100,
							overflow: 'scroll'
						} )
						.append(
							$('<div/>')
								.css( {
									width: '100%',
									height: 10
								} )
						)
				)
				.appendTo( 'body' );
	
			var outer = n.children();
			var inner = outer.children();
	
			// Get scrollbar width
			browser.barWidth = outer[0].offsetWidth - outer[0].clientWidth;
	
			// In rtl text layout, some browsers (most, but not all) will place the
			// scrollbar on the left, rather than the right.
			browser.bScrollbarLeft = Math.round( inner.offset().left ) !== 1;
	
			n.remove();
		}
	
		$.extend( settings.oBrowser, DataTable.__browser );
		settings.oScroll.iBarWidth = DataTable.__browser.barWidth;
	}
	
	/**
	 * Add a column to the list used for the table with default values
	 *  @param {object} oSettings dataTables settings object
	 *  @memberof DataTable#oApi
	 */
	function _fnAddColumn( oSettings )
	{
		// Add column to aoColumns array
		var oDefaults = DataTable.defaults.column;
		var iCol = oSettings.aoColumns.length;
		var oCol = $.extend( {}, DataTable.models.oColumn, oDefaults, {
			"aDataSort": oDefaults.aDataSort ? oDefaults.aDataSort : [iCol],
			"mData": oDefaults.mData ? oDefaults.mData : iCol,
			idx: iCol,
			searchFixed: {},
			colEl: $('<col>').attr('data-dt-column', iCol)
		} );
		oSettings.aoColumns.push( oCol );
	
		// Add search object for column specific search. Note that the `searchCols[ iCol ]`
		// passed into extend can be undefined. This allows the user to give a default
		// with only some of the parameters defined, and also not give a default
		var searchCols = oSettings.aoPreSearchCols;
		searchCols[ iCol ] = $.extend( {}, DataTable.models.oSearch, searchCols[ iCol ] );
	}
	
	
	/**
	 * Apply options for a column
	 *  @param {object} oSettings dataTables settings object
	 *  @param {int} iCol column index to consider
	 *  @param {object} oOptions object with sType, bVisible and bSearchable etc
	 *  @memberof DataTable#oApi
	 */
	function _fnColumnOptions( oSettings, iCol, oOptions )
	{
		var oCol = oSettings.aoColumns[ iCol ];
	
		/* User specified column options */
		if ( oOptions !== undefined && oOptions !== null )
		{
			// Backwards compatibility
			_fnCompatCols( oOptions );
	
			// Map camel case parameters to their Hungarian counterparts
			_fnCamelToHungarian( DataTable.defaults.column, oOptions, true );
	
			/* Backwards compatibility for mDataProp */
			if ( oOptions.mDataProp !== undefined && !oOptions.mData )
			{
				oOptions.mData = oOptions.mDataProp;
			}
	
			if ( oOptions.sType )
			{
				oCol._sManualType = oOptions.sType;
			}
		
			// `class` is a reserved word in Javascript, so we need to provide
			// the ability to use a valid name for the camel case input
			if ( oOptions.className && ! oOptions.sClass )
			{
				oOptions.sClass = oOptions.className;
			}
	
			var origClass = oCol.sClass;
	
			$.extend( oCol, oOptions );
			_fnMap( oCol, oOptions, "sWidth", "sWidthOrig" );
	
			// Merge class from previously defined classes with this one, rather than just
			// overwriting it in the extend above
			if (origClass !== oCol.sClass) {
				oCol.sClass = origClass + ' ' + oCol.sClass;
			}
	
			/* iDataSort to be applied (backwards compatibility), but aDataSort will take
			 * priority if defined
			 */
			if ( oOptions.iDataSort !== undefined )
			{
				oCol.aDataSort = [ oOptions.iDataSort ];
			}
			_fnMap( oCol, oOptions, "aDataSort" );
		}
	
		/* Cache the data get and set functions for speed */
		var mDataSrc = oCol.mData;
		var mData = _fnGetObjectDataFn( mDataSrc );
	
		// The `render` option can be given as an array to access the helper rendering methods.
		// The first element is the rendering method to use, the rest are the parameters to pass
		if ( oCol.mRender && Array.isArray( oCol.mRender ) ) {
			var copy = oCol.mRender.slice();
			var name = copy.shift();
	
			oCol.mRender = DataTable.render[name].apply(window, copy);
		}
	
		oCol._render = oCol.mRender ? _fnGetObjectDataFn( oCol.mRender ) : null;
	
		var attrTest = function( src ) {
			return typeof src === 'string' && src.indexOf('@') !== -1;
		};
		oCol._bAttrSrc = $.isPlainObject( mDataSrc ) && (
			attrTest(mDataSrc.sort) || attrTest(mDataSrc.type) || attrTest(mDataSrc.filter)
		);
		oCol._setter = null;
	
		oCol.fnGetData = function (rowData, type, meta) {
			var innerData = mData( rowData, type, undefined, meta );
	
			return oCol._render && type ?
				oCol._render( innerData, type, rowData, meta ) :
				innerData;
		};
		oCol.fnSetData = function ( rowData, val, meta ) {
			return _fnSetObjectDataFn( mDataSrc )( rowData, val, meta );
		};
	
		// Indicate if DataTables should read DOM data as an object or array
		// Used in _fnGetRowElements
		if ( typeof mDataSrc !== 'number' && ! oCol._isArrayHost ) {
			oSettings._rowReadObject = true;
		}
	
		/* Feature sorting overrides column specific when off */
		if ( !oSettings.oFeatures.bSort )
		{
			oCol.bSortable = false;
		}
	}
	
	
	/**
	 * Adjust the table column widths for new data. Note: you would probably want to
	 * do a redraw after calling this function!
	 *  @param {object} settings dataTables settings object
	 *  @memberof DataTable#oApi
	 */
	function _fnAdjustColumnSizing ( settings )
	{
		_fnCalculateColumnWidths( settings );
		_fnColumnSizes( settings );
	
		var scroll = settings.oScroll;
		if ( scroll.sY !== '' || scroll.sX !== '') {
			_fnScrollDraw( settings );
		}
	
		_fnCallbackFire( settings, null, 'column-sizing', [settings] );
	}
	
	/**
	 * Apply column sizes
	 *
	 * @param {*} settings DataTables settings object
	 */
	function _fnColumnSizes ( settings )
	{
		var cols = settings.aoColumns;
	
		for (var i=0 ; i<cols.length ; i++) {
			var width = _fnColumnsSumWidth(settings, [i], false, false);
	
			cols[i].colEl.css('width', width);
		}
	}
	
	
	/**
	 * Convert the index of a visible column to the index in the data array (take account
	 * of hidden columns)
	 *  @param {object} oSettings dataTables settings object
	 *  @param {int} iMatch Visible column index to lookup
	 *  @returns {int} i the data index
	 *  @memberof DataTable#oApi
	 */
	function _fnVisibleToColumnIndex( oSettings, iMatch )
	{
		var aiVis = _fnGetColumns( oSettings, 'bVisible' );
	
		return typeof aiVis[iMatch] === 'number' ?
			aiVis[iMatch] :
			null;
	}
	
	
	/**
	 * Convert the index of an index in the data array and convert it to the visible
	 *   column index (take account of hidden columns)
	 *  @param {int} iMatch Column index to lookup
	 *  @param {object} oSettings dataTables settings object
	 *  @returns {int} i the data index
	 *  @memberof DataTable#oApi
	 */
	function _fnColumnIndexToVisible( oSettings, iMatch )
	{
		var aiVis = _fnGetColumns( oSettings, 'bVisible' );
		var iPos = aiVis.indexOf(iMatch);
	
		return iPos !== -1 ? iPos : null;
	}
	
	
	/**
	 * Get the number of visible columns
	 *  @param {object} oSettings dataTables settings object
	 *  @returns {int} i the number of visible columns
	 *  @memberof DataTable#oApi
	 */
	function _fnVisbleColumns( settings )
	{
		var layout = settings.aoHeader;
		var columns = settings.aoColumns;
		var vis = 0;
	
		if ( layout.length ) {
			for ( var i=0, ien=layout[0].length ; i<ien ; i++ ) {
				if ( columns[i].bVisible && $(layout[0][i].cell).css('display') !== 'none' ) {
					vis++;
				}
			}
		}
	
		return vis;
	}
	
	
	/**
	 * Get an array of column indexes that match a given property
	 *  @param {object} oSettings dataTables settings object
	 *  @param {string} sParam Parameter in aoColumns to look for - typically
	 *    bVisible or bSearchable
	 *  @returns {array} Array of indexes with matched properties
	 *  @memberof DataTable#oApi
	 */
	function _fnGetColumns( oSettings, sParam )
	{
		var a = [];
	
		oSettings.aoColumns.map( function(val, i) {
			if ( val[sParam] ) {
				a.push( i );
			}
		} );
	
		return a;
	}
	
	
	/**
	 * Calculate the 'type' of a column
	 *  @param {object} settings dataTables settings object
	 *  @memberof DataTable#oApi
	 */
	function _fnColumnTypes ( settings )
	{
		var columns = settings.aoColumns;
		var data = settings.aoData;
		var types = DataTable.ext.type.detect;
		var i, ien, j, jen, k, ken;
		var col, detectedType, cache;
	
		// For each column, spin over the 
		for ( i=0, ien=columns.length ; i<ien ; i++ ) {
			col = columns[i];
			cache = [];
	
			if ( ! col.sType && col._sManualType ) {
				col.sType = col._sManualType;
			}
			else if ( ! col.sType ) {
				for ( j=0, jen=types.length ; j<jen ; j++ ) {
					for ( k=0, ken=data.length ; k<ken ; k++ ) {
	
						if (! data[k]) {
							continue;
						}
	
						// Use a cache array so we only need to get the type data
						// from the formatter once (when using multiple detectors)
						if ( cache[k] === undefined ) {
							cache[k] = _fnGetCellData( settings, k, i, 'type' );
						}
	
						detectedType = types[j]( cache[k], settings );
	
						// If null, then this type can't apply to this column, so
						// rather than testing all cells, break out. There is an
						// exception for the last type which is `html`. We need to
						// scan all rows since it is possible to mix string and HTML
						// types
						if ( ! detectedType && j !== types.length-2 ) {
							break;
						}
	
						// Only a single match is needed for html type since it is
						// bottom of the pile and very similar to string - but it
						// must not be empty
						if ( detectedType === 'html' && ! _empty(cache[k]) ) {
							break;
						}
					}
	
					// Type is valid for all data points in the column - use this
					// type
					if ( detectedType ) {
						col.sType = detectedType;
						break;
					}
				}
	
				// Fall back - if no type was detected, always use string
				if ( ! col.sType ) {
					col.sType = 'string';
				}
			}
	
			// Set class names for header / footer for auto type classes
			var autoClass = _ext.type.className[col.sType];
	
			if (autoClass) {
				_columnAutoClass(settings.aoHeader, i, autoClass);
				_columnAutoClass(settings.aoFooter, i, autoClass);
			}
	
			var renderer = _ext.type.render[col.sType];
	
			// This can only happen once! There is no way to remover
			// a renderer. After the first time the renderer has
			// already been set so createTr will run the renderer itself.
			if (renderer && ! col._render) {
				col._render = DataTable.util.get(renderer);
	
				_columnAutoRender(settings, i);
			}
		}
	}
	
	/**
	 * Apply an auto detected renderer to data which doesn't yet have
	 * a renderer
	 */
	function _columnAutoRender(settings, colIdx) {
		var data = settings.aoData;
	
		for (var i=0 ; i<data.length ; i++) {
			if (data[i].nTr) {
				// We have to update the display here since there is no
				// invalidation check for the data
				var display = _fnGetCellData( settings, i, colIdx, 'display' );
	
				data[i].displayData[colIdx] = display;
				_fnWriteCell(data[i].anCells[colIdx], display);
	
				// No need to update sort / filter data since it has
				// been invalidated and will be re-read with the
				// renderer now applied
			}
		}
	}
	
	/**
	 * Apply a class name to a column's header cells
	 */
	function _columnAutoClass(container, colIdx, className) {
		container.forEach(function (row) {
			if (row[colIdx] && row[colIdx].unique) {
				_addClass(row[colIdx].cell, className);
			}
		});
	}
	
	/**
	 * Take the column definitions and static columns arrays and calculate how
	 * they relate to column indexes. The callback function will then apply the
	 * definition found for a column to a suitable configuration object.
	 *  @param {object} oSettings dataTables settings object
	 *  @param {array} aoColDefs The aoColumnDefs array that is to be applied
	 *  @param {array} aoCols The aoColumns array that defines columns individually
	 *  @param {array} headerLayout Layout for header as it was loaded
	 *  @param {function} fn Callback function - takes two parameters, the calculated
	 *    column index and the definition for that column.
	 *  @memberof DataTable#oApi
	 */
	function _fnApplyColumnDefs( oSettings, aoColDefs, aoCols, headerLayout, fn )
	{
		var i, iLen, j, jLen, k, kLen, def;
		var columns = oSettings.aoColumns;
	
		if ( aoCols ) {
			for ( i=0, iLen=aoCols.length ; i<iLen ; i++ ) {
				if (aoCols[i] && aoCols[i].name) {
					columns[i].sName = aoCols[i].name;
				}
			}
		}
	
		// Column definitions with aTargets
		if ( aoColDefs )
		{
			/* Loop over the definitions array - loop in reverse so first instance has priority */
			for ( i=aoColDefs.length-1 ; i>=0 ; i-- )
			{
				def = aoColDefs[i];
	
				/* Each definition can target multiple columns, as it is an array */
				var aTargets = def.target !== undefined
					? def.target
					: def.targets !== undefined
						? def.targets
						: def.aTargets;
	
				if ( ! Array.isArray( aTargets ) )
				{
					aTargets = [ aTargets ];
				}
	
				for ( j=0, jLen=aTargets.length ; j<jLen ; j++ )
				{
					var target = aTargets[j];
	
					if ( typeof target === 'number' && target >= 0 )
					{
						/* Add columns that we don't yet know about */
						while( columns.length <= target )
						{
							_fnAddColumn( oSettings );
						}
	
						/* Integer, basic index */
						fn( target, def );
					}
					else if ( typeof target === 'number' && target < 0 )
					{
						/* Negative integer, right to left column counting */
						fn( columns.length+target, def );
					}
					else if ( typeof target === 'string' )
					{
						for ( k=0, kLen=columns.length ; k<kLen ; k++ ) {
							if (target === '_all') {
								// Apply to all columns
								fn( k, def );
							}
							else if (target.indexOf(':name') !== -1) {
								// Column selector
								if (columns[k].sName === target.replace(':name', '')) {
									fn( k, def );
								}
							}
							else {
								// Cell selector
								headerLayout.forEach(function (row) {
									if (row[k]) {
										var cell = $(row[k].cell);
	
										// Legacy support. Note that it means that we don't support
										// an element name selector only, since they are treated as
										// class names for 1.x compat.
										if (target.match(/^[a-z][\w-]*$/i)) {
											target = '.' + target;
										}
	
										if (cell.is( target )) {
											fn( k, def );
										}
									}
								});
							}
						}
					}
				}
			}
		}
	
		// Statically defined columns array
		if ( aoCols ) {
			for ( i=0, iLen=aoCols.length ; i<iLen ; i++ ) {
				fn( i, aoCols[i] );
			}
		}
	}
	
	
	/**
	 * Get the width for a given set of columns
	 *
	 * @param {*} settings DataTables settings object
	 * @param {*} targets Columns - comma separated string or array of numbers
	 * @param {*} original Use the original width (true) or calculated (false)
	 * @param {*} incVisible Include visible columns (true) or not (false)
	 * @returns Combined CSS value
	 */
	function _fnColumnsSumWidth( settings, targets, original, incVisible ) {
		if ( ! Array.isArray( targets ) ) {
			targets = _fnColumnsFromHeader( targets );
		}
	
		var sum = 0;
		var unit;
		var columns = settings.aoColumns;
		
		for ( var i=0, ien=targets.length ; i<ien ; i++ ) {
			var column = columns[ targets[i] ];
			var definedWidth = original ?
				column.sWidthOrig :
				column.sWidth;
	
			if ( ! incVisible && column.bVisible === false ) {
				continue;
			}
	
			if ( definedWidth === null || definedWidth === undefined ) {
				return null; // can't determine a defined width - browser defined
			}
			else if ( typeof definedWidth === 'number' ) {
				unit = 'px';
				sum += definedWidth;
			}
			else {
				var matched = definedWidth.match(/([\d\.]+)([^\d]*)/);
	
				if ( matched ) {
					sum += matched[1] * 1;
					unit = matched.length === 3 ?
						matched[2] :
						'px';
				}
			}
		}
	
		return sum + unit;
	}
	
	function _fnColumnsFromHeader( cell )
	{
		var attr = $(cell).closest('[data-dt-column]').attr('data-dt-column');
	
		if ( ! attr ) {
			return [];
		}
	
		return attr.split(',').map( function (val) {
			return val * 1;
		} );
	}
	/**
	 * Add a data array to the table, creating DOM node etc. This is the parallel to
	 * _fnGatherData, but for adding rows from a Javascript source, rather than a
	 * DOM source.
	 *  @param {object} settings dataTables settings object
	 *  @param {array} data data array to be added
	 *  @param {node} [tr] TR element to add to the table - optional. If not given,
	 *    DataTables will create a row automatically
	 *  @param {array} [tds] Array of TD|TH elements for the row - must be given
	 *    if nTr is.
	 *  @returns {int} >=0 if successful (index of new aoData entry), -1 if failed
	 *  @memberof DataTable#oApi
	 */
	function _fnAddData ( settings, dataIn, tr, tds )
	{
		/* Create the object for storing information about this new row */
		var rowIdx = settings.aoData.length;
		var rowModel = $.extend( true, {}, DataTable.models.oRow, {
			src: tr ? 'dom' : 'data',
			idx: rowIdx
		} );
	
		rowModel._aData = dataIn;
		settings.aoData.push( rowModel );
	
		var columns = settings.aoColumns;
	
		for ( var i=0, iLen=columns.length ; i<iLen ; i++ )
		{
			// Invalidate the column types as the new data needs to be revalidated
			columns[i].sType = null;
		}
	
		/* Add to the display array */
		settings.aiDisplayMaster.push( rowIdx );
	
		var id = settings.rowIdFn( dataIn );
		if ( id !== undefined ) {
			settings.aIds[ id ] = rowModel;
		}
	
		/* Create the DOM information, or register it if already present */
		if ( tr || ! settings.oFeatures.bDeferRender )
		{
			_fnCreateTr( settings, rowIdx, tr, tds );
		}
	
		return rowIdx;
	}
	
	
	/**
	 * Add one or more TR elements to the table. Generally we'd expect to
	 * use this for reading data from a DOM sourced table, but it could be
	 * used for an TR element. Note that if a TR is given, it is used (i.e.
	 * it is not cloned).
	 *  @param {object} settings dataTables settings object
	 *  @param {array|node|jQuery} trs The TR element(s) to add to the table
	 *  @returns {array} Array of indexes for the added rows
	 *  @memberof DataTable#oApi
	 */
	function _fnAddTr( settings, trs )
	{
		var row;
	
		// Allow an individual node to be passed in
		if ( ! (trs instanceof $) ) {
			trs = $(trs);
		}
	
		return trs.map( function (i, el) {
			row = _fnGetRowElements( settings, el );
			return _fnAddData( settings, row.data, el, row.cells );
		} );
	}
	
	
	/**
	 * Get the data for a given cell from the internal cache, taking into account data mapping
	 *  @param {object} settings dataTables settings object
	 *  @param {int} rowIdx aoData row id
	 *  @param {int} colIdx Column index
	 *  @param {string} type data get type ('display', 'type' 'filter|search' 'sort|order')
	 *  @returns {*} Cell data
	 *  @memberof DataTable#oApi
	 */
	function _fnGetCellData( settings, rowIdx, colIdx, type )
	{
		if (type === 'search') {
			type = 'filter';
		}
		else if (type === 'order') {
			type = 'sort';
		}
	
		var row = settings.aoData[rowIdx];
	
		if (! row) {
			return undefined;
		}
	
		var draw           = settings.iDraw;
		var col            = settings.aoColumns[colIdx];
		var rowData        = row._aData;
		var defaultContent = col.sDefaultContent;
		var cellData       = col.fnGetData( rowData, type, {
			settings: settings,
			row:      rowIdx,
			col:      colIdx
		} );
	
		// Allow for a node being returned for non-display types
		if (type !== 'display' && cellData && typeof cellData === 'object' && cellData.nodeName) {
			cellData = cellData.innerHTML;
		}
	
		if ( cellData === undefined ) {
			if ( settings.iDrawError != draw && defaultContent === null ) {
				_fnLog( settings, 0, "Requested unknown parameter "+
					(typeof col.mData=='function' ? '{function}' : "'"+col.mData+"'")+
					" for row "+rowIdx+", column "+colIdx, 4 );
				settings.iDrawError = draw;
			}
			return defaultContent;
		}
	
		// When the data source is null and a specific data type is requested (i.e.
		// not the original data), we can use default column data
		if ( (cellData === rowData || cellData === null) && defaultContent !== null && type !== undefined ) {
			cellData = defaultContent;
		}
		else if ( typeof cellData === 'function' ) {
			// If the data source is a function, then we run it and use the return,
			// executing in the scope of the data object (for instances)
			return cellData.call( rowData );
		}
	
		if ( cellData === null && type === 'display' ) {
			return '';
		}
	
		if ( type === 'filter' ) {
			var fomatters = DataTable.ext.type.search;
	
			if ( fomatters[ col.sType ] ) {
				cellData = fomatters[ col.sType ]( cellData );
			}
		}
	
		return cellData;
	}
	
	
	/**
	 * Set the value for a specific cell, into the internal data cache
	 *  @param {object} settings dataTables settings object
	 *  @param {int} rowIdx aoData row id
	 *  @param {int} colIdx Column index
	 *  @param {*} val Value to set
	 *  @memberof DataTable#oApi
	 */
	function _fnSetCellData( settings, rowIdx, colIdx, val )
	{
		var col     = settings.aoColumns[colIdx];
		var rowData = settings.aoData[rowIdx]._aData;
	
		col.fnSetData( rowData, val, {
			settings: settings,
			row:      rowIdx,
			col:      colIdx
		}  );
	}
	
	/**
	 * Write a value to a cell
	 * @param {*} td Cell
	 * @param {*} val Value
	 */
	function _fnWriteCell(td, val)
	{
		if (val && typeof val === 'object' && val.nodeName) {
			$(td)
				.empty()
				.append(val);
		}
		else {
			td.innerHTML = val;
		}
	}
	
	
	// Private variable that is used to match action syntax in the data property object
	var __reArray = /\[.*?\]$/;
	var __reFn = /\(\)$/;
	
	/**
	 * Split string on periods, taking into account escaped periods
	 * @param  {string} str String to split
	 * @return {array} Split string
	 */
	function _fnSplitObjNotation( str )
	{
		var parts = str.match(/(\\.|[^.])+/g) || [''];
	
		return parts.map( function ( s ) {
			return s.replace(/\\\./g, '.');
		} );
	}
	
	
	/**
	 * Return a function that can be used to get data from a source object, taking
	 * into account the ability to use nested objects as a source
	 *  @param {string|int|function} mSource The data source for the object
	 *  @returns {function} Data get function
	 *  @memberof DataTable#oApi
	 */
	var _fnGetObjectDataFn = DataTable.util.get;
	
	
	/**
	 * Return a function that can be used to set data from a source object, taking
	 * into account the ability to use nested objects as a source
	 *  @param {string|int|function} mSource The data source for the object
	 *  @returns {function} Data set function
	 *  @memberof DataTable#oApi
	 */
	var _fnSetObjectDataFn = DataTable.util.set;
	
	
	/**
	 * Return an array with the full table data
	 *  @param {object} oSettings dataTables settings object
	 *  @returns array {array} aData Master data array
	 *  @memberof DataTable#oApi
	 */
	function _fnGetDataMaster ( settings )
	{
		return _pluck( settings.aoData, '_aData' );
	}
	
	
	/**
	 * Nuke the table
	 *  @param {object} oSettings dataTables settings object
	 *  @memberof DataTable#oApi
	 */
	function _fnClearTable( settings )
	{
		settings.aoData.length = 0;
		settings.aiDisplayMaster.length = 0;
		settings.aiDisplay.length = 0;
		settings.aIds = {};
	}
	
	
	/**
	 * Mark cached data as invalid such that a re-read of the data will occur when
	 * the cached data is next requested. Also update from the data source object.
	 *
	 * @param {object} settings DataTables settings object
	 * @param {int}    rowIdx   Row index to invalidate
	 * @param {string} [src]    Source to invalidate from: undefined, 'auto', 'dom'
	 *     or 'data'
	 * @param {int}    [colIdx] Column index to invalidate. If undefined the whole
	 *     row will be invalidated
	 * @memberof DataTable#oApi
	 *
	 * @todo For the modularisation of v1.11 this will need to become a callback, so
	 *   the sort and filter methods can subscribe to it. That will required
	 *   initialisation options for sorting, which is why it is not already baked in
	 */
	function _fnInvalidate( settings, rowIdx, src, colIdx )
	{
		var row = settings.aoData[ rowIdx ];
		var i, ien;
	
		// Remove the cached data for the row
		row._aSortData = null;
		row._aFilterData = null;
		row.displayData = null;
	
		// Are we reading last data from DOM or the data object?
		if ( src === 'dom' || ((! src || src === 'auto') && row.src === 'dom') ) {
			// Read the data from the DOM
			row._aData = _fnGetRowElements(
					settings, row, colIdx, colIdx === undefined ? undefined : row._aData
				)
				.data;
		}
		else {
			// Reading from data object, update the DOM
			var cells = row.anCells;
			var display = _fnGetRowDisplay(settings, rowIdx);
	
			if ( cells ) {
				if ( colIdx !== undefined ) {
					_fnWriteCell(cells[colIdx], display[colIdx]);
				}
				else {
					for ( i=0, ien=cells.length ; i<ien ; i++ ) {
						_fnWriteCell(cells[i], display[i]);
					}
				}
			}
		}
	
		// Column specific invalidation
		var cols = settings.aoColumns;
		if ( colIdx !== undefined ) {
			// Type - the data might have changed
			cols[ colIdx ].sType = null;
	
			// Max length string. Its a fairly cheep recalculation, so not worth
			// something more complicated
			cols[ colIdx ].maxLenString = null;
		}
		else {
			for ( i=0, ien=cols.length ; i<ien ; i++ ) {
				cols[i].sType = null;
				cols[i].maxLenString = null;
			}
	
			// Update DataTables special `DT_*` attributes for the row
			_fnRowAttributes( settings, row );
		}
	}
	
	
	/**
	 * Build a data source object from an HTML row, reading the contents of the
	 * cells that are in the row.
	 *
	 * @param {object} settings DataTables settings object
	 * @param {node|object} TR element from which to read data or existing row
	 *   object from which to re-read the data from the cells
	 * @param {int} [colIdx] Optional column index
	 * @param {array|object} [d] Data source object. If `colIdx` is given then this
	 *   parameter should also be given and will be used to write the data into.
	 *   Only the column in question will be written
	 * @returns {object} Object with two parameters: `data` the data read, in
	 *   document order, and `cells` and array of nodes (they can be useful to the
	 *   caller, so rather than needing a second traversal to get them, just return
	 *   them from here).
	 * @memberof DataTable#oApi
	 */
	function _fnGetRowElements( settings, row, colIdx, d )
	{
		var
			tds = [],
			td = row.firstChild,
			name, col, i=0, contents,
			columns = settings.aoColumns,
			objectRead = settings._rowReadObject;
	
		// Allow the data object to be passed in, or construct
		d = d !== undefined ?
			d :
			objectRead ?
				{} :
				[];
	
		var attr = function ( str, td  ) {
			if ( typeof str === 'string' ) {
				var idx = str.indexOf('@');
	
				if ( idx !== -1 ) {
					var attr = str.substring( idx+1 );
					var setter = _fnSetObjectDataFn( str );
					setter( d, td.getAttribute( attr ) );
				}
			}
		};
	
		// Read data from a cell and store into the data object
		var cellProcess = function ( cell ) {
			if ( colIdx === undefined || colIdx === i ) {
				col = columns[i];
				contents = (cell.innerHTML).trim();
	
				if ( col && col._bAttrSrc ) {
					var setter = _fnSetObjectDataFn( col.mData._ );
					setter( d, contents );
	
					attr( col.mData.sort, cell );
					attr( col.mData.type, cell );
					attr( col.mData.filter, cell );
				}
				else {
					// Depending on the `data` option for the columns the data can
					// be read to either an object or an array.
					if ( objectRead ) {
						if ( ! col._setter ) {
							// Cache the setter function
							col._setter = _fnSetObjectDataFn( col.mData );
						}
						col._setter( d, contents );
					}
					else {
						d[i] = contents;
					}
				}
			}
	
			i++;
		};
	
		if ( td ) {
			// `tr` element was passed in
			while ( td ) {
				name = td.nodeName.toUpperCase();
	
				if ( name == "TD" || name == "TH" ) {
					cellProcess( td );
					tds.push( td );
				}
	
				td = td.nextSibling;
			}
		}
		else {
			// Existing row object passed in
			tds = row.anCells;
	
			for ( var j=0, jen=tds.length ; j<jen ; j++ ) {
				cellProcess( tds[j] );
			}
		}
	
		// Read the ID from the DOM if present
		var rowNode = row.firstChild ? row : row.nTr;
	
		if ( rowNode ) {
			var id = rowNode.getAttribute( 'id' );
	
			if ( id ) {
				_fnSetObjectDataFn( settings.rowId )( d, id );
			}
		}
	
		return {
			data: d,
			cells: tds
		};
	}
	
	/**
	 * Render and cache a row's display data for the columns, if required
	 * @returns 
	 */
	function _fnGetRowDisplay (settings, rowIdx) {
		let rowModal = settings.aoData[rowIdx];
		let columns = settings.aoColumns;
	
		if (! rowModal.displayData) {
			// Need to render and cache
			rowModal.displayData = [];
		
			for ( var colIdx=0, len=columns.length ; colIdx<len ; colIdx++ ) {
				rowModal.displayData.push(
					_fnGetCellData( settings, rowIdx, colIdx, 'display' )
				);
			}
		}
	
		return rowModal.displayData;
	}
	
	/**
	 * Create a new TR element (and it's TD children) for a row
	 *  @param {object} oSettings dataTables settings object
	 *  @param {int} iRow Row to consider
	 *  @param {node} [nTrIn] TR element to add to the table - optional. If not given,
	 *    DataTables will create a row automatically
	 *  @param {array} [anTds] Array of TD|TH elements for the row - must be given
	 *    if nTr is.
	 *  @memberof DataTable#oApi
	 */
	function _fnCreateTr ( oSettings, iRow, nTrIn, anTds )
	{
		var
			row = oSettings.aoData[iRow],
			rowData = row._aData,
			cells = [],
			nTr, nTd, oCol,
			i, iLen, create,
			trClass = oSettings.oClasses.tbody.row;
	
		if ( row.nTr === null )
		{
			nTr = nTrIn || document.createElement('tr');
	
			row.nTr = nTr;
			row.anCells = cells;
	
			_addClass(nTr, trClass);
	
			/* Use a private property on the node to allow reserve mapping from the node
			 * to the aoData array for fast look up
			 */
			nTr._DT_RowIndex = iRow;
	
			/* Special parameters can be given by the data source to be used on the row */
			_fnRowAttributes( oSettings, row );
	
			/* Process each column */
			for ( i=0, iLen=oSettings.aoColumns.length ; i<iLen ; i++ )
			{
				oCol = oSettings.aoColumns[i];
				create = nTrIn && anTds[i] ? false : true;
	
				nTd = create ? document.createElement( oCol.sCellType ) : anTds[i];
	
				if (! nTd) {
					_fnLog( oSettings, 0, 'Incorrect column count', 18 );
				}
	
				nTd._DT_CellIndex = {
					row: iRow,
					column: i
				};
				
				cells.push( nTd );
				
				var display = _fnGetRowDisplay(oSettings, iRow);
	
				// Need to create the HTML if new, or if a rendering function is defined
				if (
					create ||
					(
						(oCol.mRender || oCol.mData !== i) &&
						(!$.isPlainObject(oCol.mData) || oCol.mData._ !== i+'.display')
					)
				) {
					_fnWriteCell(nTd, display[i]);
				}
	
				// Visibility - add or remove as required
				if ( oCol.bVisible && create )
				{
					nTr.appendChild( nTd );
				}
				else if ( ! oCol.bVisible && ! create )
				{
					nTd.parentNode.removeChild( nTd );
				}
	
				if ( oCol.fnCreatedCell )
				{
					oCol.fnCreatedCell.call( oSettings.oInstance,
						nTd, _fnGetCellData( oSettings, iRow, i ), rowData, iRow, i
					);
				}
			}
	
			_fnCallbackFire( oSettings, 'aoRowCreatedCallback', 'row-created', [nTr, rowData, iRow, cells] );
		}
		else {
			_addClass(row.nTr, trClass);
		}
	}
	
	
	/**
	 * Add attributes to a row based on the special `DT_*` parameters in a data
	 * source object.
	 *  @param {object} settings DataTables settings object
	 *  @param {object} DataTables row object for the row to be modified
	 *  @memberof DataTable#oApi
	 */
	function _fnRowAttributes( settings, row )
	{
		var tr = row.nTr;
		var data = row._aData;
	
		if ( tr ) {
			var id = settings.rowIdFn( data );
	
			if ( id ) {
				tr.id = id;
			}
	
			if ( data.DT_RowClass ) {
				// Remove any classes added by DT_RowClass before
				var a = data.DT_RowClass.split(' ');
				row.__rowc = row.__rowc ?
					_unique( row.__rowc.concat( a ) ) :
					a;
	
				$(tr)
					.removeClass( row.__rowc.join(' ') )
					.addClass( data.DT_RowClass );
			}
	
			if ( data.DT_RowAttr ) {
				$(tr).attr( data.DT_RowAttr );
			}
	
			if ( data.DT_RowData ) {
				$(tr).data( data.DT_RowData );
			}
		}
	}
	
	
	/**
	 * Create the HTML header for the table
	 *  @param {object} oSettings dataTables settings object
	 *  @memberof DataTable#oApi
	 */
	function _fnBuildHead( settings, side )
	{
		var classes = settings.oClasses;
		var columns = settings.aoColumns;
		var i, ien, row;
		var target = side === 'header'
			? settings.nTHead
			: settings.nTFoot;
		var titleProp = side === 'header' ? 'sTitle' : side;
	
		// Footer might be defined
		if (! target) {
			return;
		}
	
		// If no cells yet and we have content for them, then create
		if (side === 'header' || _pluck(settings.aoColumns, titleProp).join('')) {
			row = $('tr', target);
	
			// Add a row if needed
			if (! row.length) {
				row = $('<tr/>').appendTo(target)
			}
	
			// Add the number of cells needed to make up to the number of columns
			if (row.length === 1) {
				var cells = $('td, th', row);
	
				for ( i=cells.length, ien=columns.length ; i<ien ; i++ ) {
					$('<th/>')
						.html( columns[i][titleProp] || '' )
						.appendTo( row );
				}
			}
		}
	
		var detected = _fnDetectHeader( settings, target, true );
	
		if (side === 'header') {
			settings.aoHeader = detected;
		}
		else {
			settings.aoFooter = detected;
		}
	
		// ARIA role for the rows
		$(target).children('tr').attr('role', 'row');
	
		// Every cell needs to be passed through the renderer
		$(target).children('tr').children('th, td')
			.each( function () {
				_fnRenderer( settings, side )(
					settings, $(this), classes
				);
			} );
	}
	
	/**
	 * Build a layout structure for a header or footer
	 *
	 * @param {*} settings DataTables settings
	 * @param {*} source Source layout array
	 * @param {*} incColumns What columns should be included
	 * @returns Layout array
	 */
	function _fnHeaderLayout( settings, source, incColumns )
	{
		var row, column, cell;
		var local = [];
		var structure = [];
		var columns = settings.aoColumns;
		var columnCount = columns.length;
		var rowspan, colspan;
	
		if ( ! source ) {
			return;
		}
	
		// Default is to work on only visible columns
		if ( ! incColumns ) {
			incColumns = _range(columnCount)
				.filter(function (idx) {
					return columns[idx].bVisible;
				});
		}
	
		// Make a copy of the master layout array, but with only the columns we want
		for ( row=0 ; row<source.length ; row++ ) {
			// Remove any columns we haven't selected
			local[row] = source[row].slice().filter(function (cell, i) {
				return incColumns.includes(i);
			});
	
			// Prep the structure array - it needs an element for each row
			structure.push( [] );
		}
	
		for ( row=0 ; row<local.length ; row++ ) {
			for ( column=0 ; column<local[row].length ; column++ ) {
				rowspan = 1;
				colspan = 1;
	
				// Check to see if there is already a cell (row/colspan) covering our target
				// insert point. If there is, then there is nothing to do.
				if ( structure[row][column] === undefined ) {
					cell = local[row][column].cell;
	
					// Expand for rowspan
					while (
						local[row+rowspan] !== undefined &&
						local[row][column].cell == local[row+rowspan][column].cell
					) {
						structure[row+rowspan][column] = null;
						rowspan++;
					}
	
					// And for colspan
					while (
						local[row][column+colspan] !== undefined &&
						local[row][column].cell == local[row][column+colspan].cell
					) {
						// Which also needs to go over rows
						for ( var k=0 ; k<rowspan ; k++ ) {
							structure[row+k][column+colspan] = null;
						}
	
						colspan++;
					}
	
					var titleSpan = $('span.dt-column-title', cell);
	
					structure[row][column] = {
						cell: cell,
						colspan: colspan,
						rowspan: rowspan,
						title: titleSpan.length
							? titleSpan.html()
							: $(cell).html()
					};
				}
			}
		}
	
		return structure;
	}
	
	
	/**
	 * Draw the header (or footer) element based on the column visibility states.
	 *
	 *  @param object oSettings dataTables settings object
	 *  @param array aoSource Layout array from _fnDetectHeader
	 *  @memberof DataTable#oApi
	 */
	function _fnDrawHead( settings, source )
	{
		var layout = _fnHeaderLayout(settings, source);
		var tr, n;
	
		for ( var row=0 ; row<source.length ; row++ ) {
			tr = source[row].row;
	
			// All cells are going to be replaced, so empty out the row
			// Can't use $().empty() as that kills event handlers
			if (tr) {
				while( (n = tr.firstChild) ) {
					tr.removeChild( n );
				}
			}
	
			for ( var column=0 ; column<layout[row].length ; column++ ) {
				var point = layout[row][column];
	
				if (point) {
					$(point.cell)
						.appendTo(tr)
						.attr('rowspan', point.rowspan)
						.attr('colspan', point.colspan);
				}
			}
		}
	}
	
	
	/**
	 * Insert the required TR nodes into the table for display
	 *  @param {object} oSettings dataTables settings object
	 *  @param ajaxComplete true after ajax call to complete rendering
	 *  @memberof DataTable#oApi
	 */
	function _fnDraw( oSettings, ajaxComplete )
	{
		// Allow for state saving and a custom start position
		_fnStart( oSettings );
	
		/* Provide a pre-callback function which can be used to cancel the draw is false is returned */
		var aPreDraw = _fnCallbackFire( oSettings, 'aoPreDrawCallback', 'preDraw', [oSettings] );
		if ( aPreDraw.indexOf(false) !== -1 )
		{
			_fnProcessingDisplay( oSettings, false );
			return;
		}
	
		var anRows = [];
		var iRowCount = 0;
		var bServerSide = _fnDataSource( oSettings ) == 'ssp';
		var aiDisplay = oSettings.aiDisplay;
		var iDisplayStart = oSettings._iDisplayStart;
		var iDisplayEnd = oSettings.fnDisplayEnd();
		var columns = oSettings.aoColumns;
		var body = $(oSettings.nTBody);
	
		oSettings.bDrawing = true;
	
		/* Server-side processing draw intercept */
		if ( !bServerSide )
		{
			oSettings.iDraw++;
		}
		else if ( !oSettings.bDestroying && !ajaxComplete)
		{
			// Show loading message for server-side processing
			if (oSettings.iDraw === 0) {
				body.empty().append(_emptyRow(oSettings));
			}
	
			_fnAjaxUpdate( oSettings );
			return;
		}
	
		if ( aiDisplay.length !== 0 )
		{
			var iStart = bServerSide ? 0 : iDisplayStart;
			var iEnd = bServerSide ? oSettings.aoData.length : iDisplayEnd;
	
			for ( var j=iStart ; j<iEnd ; j++ )
			{
				var iDataIndex = aiDisplay[j];
				var aoData = oSettings.aoData[ iDataIndex ];
				if ( aoData.nTr === null )
				{
					_fnCreateTr( oSettings, iDataIndex );
				}
	
				var nRow = aoData.nTr;
	
				// Add various classes as needed
				for (var i=0 ; i<columns.length ; i++) {
					var col = columns[i];
					var td = aoData.anCells[i];
	
					_addClass(td, _ext.type.className[col.sType]); // auto class
					_addClass(td, col.sClass); // column class
					_addClass(td, oSettings.oClasses.tbody.cell); // all cells
				}
	
				// Row callback functions - might want to manipulate the row
				// iRowCount and j are not currently documented. Are they at all
				// useful?
				_fnCallbackFire( oSettings, 'aoRowCallback', null,
					[nRow, aoData._aData, iRowCount, j, iDataIndex] );
	
				anRows.push( nRow );
				iRowCount++;
			}
		}
		else
		{
			anRows[ 0 ] = _emptyRow(oSettings);
		}
	
		/* Header and footer callbacks */
		_fnCallbackFire( oSettings, 'aoHeaderCallback', 'header', [ $(oSettings.nTHead).children('tr')[0],
			_fnGetDataMaster( oSettings ), iDisplayStart, iDisplayEnd, aiDisplay ] );
	
		_fnCallbackFire( oSettings, 'aoFooterCallback', 'footer', [ $(oSettings.nTFoot).children('tr')[0],
			_fnGetDataMaster( oSettings ), iDisplayStart, iDisplayEnd, aiDisplay ] );
	
		// replaceChildren is faster, but only became widespread in 2020,
		// so a fall back in jQuery is provided for older browsers.
		if (body[0].replaceChildren) {
			body[0].replaceChildren.apply(body[0], anRows);
		}
		else {
			body.children().detach();
			body.append( $(anRows) );
		}
	
		// Empty table needs a specific class
		$(oSettings.nTableWrapper).toggleClass('dt-empty-footer', $('tr', oSettings.nTFoot).length === 0);
	
		/* Call all required callback functions for the end of a draw */
		_fnCallbackFire( oSettings, 'aoDrawCallback', 'draw', [oSettings], true );
	
		/* Draw is complete, sorting and filtering must be as well */
		oSettings.bSorted = false;
		oSettings.bFiltered = false;
		oSettings.bDrawing = false;
	}
	
	
	/**
	 * Redraw the table - taking account of the various features which are enabled
	 *  @param {object} oSettings dataTables settings object
	 *  @param {boolean} [holdPosition] Keep the current paging position. By default
	 *    the paging is reset to the first page
	 *  @memberof DataTable#oApi
	 */
	function _fnReDraw( settings, holdPosition, recompute )
	{
		var
			features = settings.oFeatures,
			sort     = features.bSort,
			filter   = features.bFilter;
	
		if (recompute === undefined || recompute === true) {
			if ( sort ) {
				_fnSort( settings );
			}
	
			if ( filter ) {
				_fnFilterComplete( settings, settings.oPreviousSearch );
			}
			else {
				// No filtering, so we want to just use the display master
				settings.aiDisplay = settings.aiDisplayMaster.slice();
			}
		}
	
		if ( holdPosition !== true ) {
			settings._iDisplayStart = 0;
		}
	
		// Let any modules know about the draw hold position state (used by
		// scrolling internally)
		settings._drawHold = holdPosition;
	
		_fnDraw( settings );
	
		settings._drawHold = false;
	}
	
	
	/*
	 * Table is empty - create a row with an empty message in it
	 */
	function _emptyRow ( settings ) {
		var oLang = settings.oLanguage;
		var zero = oLang.sZeroRecords;
		var dataSrc = _fnDataSource( settings );
	
		if (
			(settings.iDraw < 1 && dataSrc === 'ssp') ||
			(settings.iDraw <= 1 && dataSrc === 'ajax')
		) {
			zero = oLang.sLoadingRecords;
		}
		else if ( oLang.sEmptyTable && settings.fnRecordsTotal() === 0 )
		{
			zero = oLang.sEmptyTable;
		}
	
		return $( '<tr/>' )
			.append( $('<td />', {
				'colSpan': _fnVisbleColumns( settings ),
				'class':   settings.oClasses.empty.row
			} ).html( zero ) )[0];
	}
	
	
	/**
	 * Convert a `layout` object given by a user to the object structure needed
	 * for the renderer. This is done twice, once for above and once for below
	 * the table. Ordering must also be considered.
	 *
	 * @param {*} settings DataTables settings object
	 * @param {*} layout Layout object to convert
	 * @param {string} side `top` or `bottom`
	 * @returns Converted array structure - one item for each row.
	 */
	function _layoutArray ( settings, layout, side )
	{
		var groups = {};
	
		// Combine into like groups (e.g. `top`, `top2`, etc)
		$.each( layout, function ( pos, val ) {
			if (val === null) {
				return;
			}
	
			var splitPos = pos.replace(/([A-Z])/g, ' $1').split(' ');
	
			if ( ! groups[ splitPos[0] ] ) {
				groups[ splitPos[0] ] = {};
			}
	
			var align = splitPos.length === 1 ?
				'full' :
				splitPos[1].toLowerCase();
			var group = groups[ splitPos[0] ];
			var groupRun = function (contents, innerVal) {
				// If it is an object, then there can be multiple features contained in it
				if ( $.isPlainObject( innerVal ) ) {
					Object.keys(innerVal).map(function (key) {
						contents.push( {
							feature: key,
							opts: innerVal[key]
						});
					});
				}
				else {
					contents.push(innerVal);
				}
			}
	
			// Transform to an object with a contents property
			if (! group[align] || ! group[align].contents) {
				group[align] = { contents: [] };
			}
	
			// Allow for an array or just a single object
			if ( Array.isArray(val)) {
				for (var i=0 ; i<val.length ; i++) {
					groupRun(group[align].contents, val[i]);
				}
			}
			else {
				groupRun(group[ align ].contents, val);
			}
	
			// And make contents an array
			if ( ! Array.isArray( group[ align ].contents ) ) {
				group[ align ].contents = [ group[ align ].contents ];
			}
		} );
	
		var filtered = Object.keys(groups)
			.map( function ( pos ) {
				// Filter to only the side we need
				if ( pos.indexOf(side) !== 0 ) {
					return null;
				}
	
				return {
					name: pos,
					val: groups[pos]
				};
			} )
			.filter( function (item) {
				return item !== null;
			});
	
		// Order by item identifier
		filtered.sort( function ( a, b ) {
			var order1 = a.name.replace(/[^0-9]/g, '') * 1;
			var order2 = b.name.replace(/[^0-9]/g, '') * 1;
	
			return order2 - order1;
		} );
		
		if ( side === 'bottom' ) {
			filtered.reverse();
		}
	
		// Split into rows
		var rows = [];
		for ( var i=0, ien=filtered.length ; i<ien ; i++ ) {
			if (  filtered[i].val.full ) {
				rows.push( { full: filtered[i].val.full } );
				_layoutResolve( settings, rows[ rows.length - 1 ] );
	
				delete filtered[i].val.full;
			}
	
			if ( Object.keys(filtered[i].val).length ) {
				rows.push( filtered[i].val );
				_layoutResolve( settings, rows[ rows.length - 1 ] );
			}
		}
	
		return rows;
	}
	
	
	/**
	 * Convert the contents of a row's layout object to nodes that can be inserted
	 * into the document by a renderer. Execute functions, look up plug-ins, etc.
	 *
	 * @param {*} settings DataTables settings object
	 * @param {*} row Layout object for this row
	 */
	function _layoutResolve( settings, row ) {
		var getFeature = function (feature, opts) {
			if ( ! _ext.features[ feature ] ) {
				_fnLog( settings, 0, 'Unknown feature: '+ feature );
			}
	
			return _ext.features[ feature ].apply( this, [settings, opts] );
		};
	
		var resolve = function ( item ) {
			var line = row[ item ].contents;
	
			for ( var i=0, ien=line.length ; i<ien ; i++ ) {
				if ( ! line[i] ) {
					continue;
				}
				else if ( typeof line[i] === 'string' ) {
					line[i] = getFeature( line[i], null );
				}
				else if ( $.isPlainObject(line[i]) ) {
					// If it's an object, it just has feature and opts properties from
					// the transform in _layoutArray
					line[i] = getFeature(line[i].feature, line[i].opts);
				}
				else if ( typeof line[i].node === 'function' ) {
					line[i] = line[i].node( settings );
				}
				else if ( typeof line[i] === 'function' ) {
					var inst = line[i]( settings );
	
					line[i] = typeof inst.node === 'function' ?
						inst.node() :
						inst;
				}
			}
		};
	
		$.each( row, function ( key ) {
			resolve( key );
		} );
	}
	
	
	/**
	 * Add the options to the page HTML for the table
	 *  @param {object} settings DataTables settings object
	 *  @memberof DataTable#oApi
	 */
	function _fnAddOptionsHtml ( settings )
	{
		var classes = settings.oClasses;
		var table = $(settings.nTable);
	
		// Wrapper div around everything DataTables controls
		var insert = $('<div/>')
			.attr({
				id:      settings.sTableId+'_wrapper',
				'class': classes.container
			})
			.insertBefore(table);
	
		settings.nTableWrapper = insert[0];
	
		if (settings.sDom) {
			// Legacy
			_fnLayoutDom(settings, settings.sDom, insert);
		}
		else {
			var top = _layoutArray( settings, settings.layout, 'top' );
			var bottom = _layoutArray( settings, settings.layout, 'bottom' );
			var renderer = _fnRenderer( settings, 'layout' );
		
			// Everything above - the renderer will actually insert the contents into the document
			top.forEach(function (item) {
				renderer( settings, insert, item );
			});
	
			// The table - always the center of attention
			renderer( settings, insert, {
				full: {
					table: true,
					contents: [ _fnFeatureHtmlTable(settings) ]
				}
			} );
	
			// Everything below
			bottom.forEach(function (item) {
				renderer( settings, insert, item );
			});
		}
	
		// Processing floats on top, so it isn't an inserted feature
		_processingHtml( settings );
	}
	
	/**
	 * Draw the table with the legacy DOM property
	 * @param {*} settings DT settings object
	 * @param {*} dom DOM string
	 * @param {*} insert Insert point
	 */
	function _fnLayoutDom( settings, dom, insert )
	{
		var parts = dom.match(/(".*?")|('.*?')|./g);
		var featureNode, option, newNode, next, attr;
	
		for ( var i=0 ; i<parts.length ; i++ ) {
			featureNode = null;
			option = parts[i];
	
			if ( option == '<' ) {
				// New container div
				newNode = $('<div/>');
	
				// Check to see if we should append an id and/or a class name to the container
				next = parts[i+1];
	
				if ( next[0] == "'" || next[0] == '"' ) {
					attr = next.replace(/['"]/g, '');
	
					var id = '', className;
	
					/* The attribute can be in the format of "#id.class", "#id" or "class" This logic
					 * breaks the string into parts and applies them as needed
					 */
					if ( attr.indexOf('.') != -1 ) {
						var split = attr.split('.');
	
						id = split[0];
						className = split[1];
					}
					else if ( attr[0] == "#" ) {
						id = attr;
					}
					else {
						className = attr;
					}
	
					newNode
						.attr('id', id.substring(1))
						.addClass(className);
	
					i++; // Move along the position array
				}
	
				insert.append( newNode );
				insert = newNode;
			}
			else if ( option == '>' ) {
				// End container div
				insert = insert.parent();
			}
			else if ( option == 't' ) {
				// Table
				featureNode = _fnFeatureHtmlTable( settings );
			}
			else
			{
				DataTable.ext.feature.forEach(function(feature) {
					if ( option == feature.cFeature ) {
						featureNode = feature.fnInit( settings );
					}
				});
			}
	
			// Add to the display
			if ( featureNode ) {
				insert.append( featureNode );
			}
		}
	}
	
	
	/**
	 * Use the DOM source to create up an array of header cells. The idea here is to
	 * create a layout grid (array) of rows x columns, which contains a reference
	 * to the cell that that point in the grid (regardless of col/rowspan), such that
	 * any column / row could be removed and the new grid constructed
	 *  @param {node} thead The header/footer element for the table
	 *  @returns {array} Calculated layout array
	 *  @memberof DataTable#oApi
	 */
	function _fnDetectHeader ( settings, thead, write )
	{
		var columns = settings.aoColumns;
		var rows = $(thead).children('tr');
		var row, cell;
		var i, k, l, iLen, shifted, column, colspan, rowspan;
		var isHeader = thead && thead.nodeName.toLowerCase() === 'thead';
		var layout = [];
		var unique;
		var shift = function ( a, i, j ) {
			var k = a[i];
			while ( k[j] ) {
				j++;
			}
			return j;
		};
	
		// We know how many rows there are in the layout - so prep it
		for ( i=0, iLen=rows.length ; i<iLen ; i++ ) {
			layout.push( [] );
		}
	
		for ( i=0, iLen=rows.length ; i<iLen ; i++ ) {
			row = rows[i];
			column = 0;
	
			// For every cell in the row..
			cell = row.firstChild;
			while ( cell ) {
				if (
					cell.nodeName.toUpperCase() == 'TD' ||
					cell.nodeName.toUpperCase() == 'TH'
				) {
					var cols = [];
	
					// Get the col and rowspan attributes from the DOM and sanitise them
					colspan = cell.getAttribute('colspan') * 1;
					rowspan = cell.getAttribute('rowspan') * 1;
					colspan = (!colspan || colspan===0 || colspan===1) ? 1 : colspan;
					rowspan = (!rowspan || rowspan===0 || rowspan===1) ? 1 : rowspan;
	
					// There might be colspan cells already in this row, so shift our target
					// accordingly
					shifted = shift( layout, i, column );
	
					// Cache calculation for unique columns
					unique = colspan === 1 ?
						true :
						false;
					
					// Perform header setup
					if ( write ) {
						if (unique) {
							// Allow column options to be set from HTML attributes
							_fnColumnOptions( settings, shifted, $(cell).data() );
							
							// Get the width for the column. This can be defined from the
							// width attribute, style attribute or `columns.width` option
							var columnDef = columns[shifted];
							var width = cell.getAttribute('width') || null;
							var t = cell.style.width.match(/width:\s*(\d+[pxem%]+)/);
							if ( t ) {
								width = t[1];
							}
	
							columnDef.sWidthOrig = columnDef.sWidth || width;
	
							if (isHeader) {
								// Column title handling - can be user set, or read from the DOM
								// This happens before the render, so the original is still in place
								if ( columnDef.sTitle !== null && ! columnDef.autoTitle ) {
									cell.innerHTML = columnDef.sTitle;
								}
	
								if (! columnDef.sTitle && unique) {
									columnDef.sTitle = _stripHtml(cell.innerHTML);
									columnDef.autoTitle = true;
								}
							}
							else {
								// Footer specific operations
								if (columnDef.footer) {
									cell.innerHTML = columnDef.footer;
								}
							}
	
							// Fall back to the aria-label attribute on the table header if no ariaTitle is
							// provided.
							if (! columnDef.ariaTitle) {
								columnDef.ariaTitle = $(cell).attr("aria-label") || columnDef.sTitle;
							}
	
							// Column specific class names
							if ( columnDef.className ) {
								$(cell).addClass( columnDef.className );
							}
						}
	
						// Wrap the column title so we can write to it in future
						if ( $('span.dt-column-title', cell).length === 0) {
							$('<span>')
								.addClass('dt-column-title')
								.append(cell.childNodes)
								.appendTo(cell);
						}
	
						if ( isHeader && $('span.dt-column-order', cell).length === 0) {
							$('<span>')
								.addClass('dt-column-order')
								.appendTo(cell);
						}
					}
	
					// If there is col / rowspan, copy the information into the layout grid
					for ( l=0 ; l<colspan ; l++ ) {
						for ( k=0 ; k<rowspan ; k++ ) {
							layout[i+k][shifted+l] = {
								cell: cell,
								unique: unique
							};
	
							layout[i+k].row = row;
						}
	
						cols.push( shifted+l );
					}
	
					// Assign an attribute so spanning cells can still be identified
					// as belonging to a column
					cell.setAttribute('data-dt-column', _unique(cols).join(','));
				}
	
				cell = cell.nextSibling;
			}
		}
	
		return layout;
	}
	
	/**
	 * Set the start position for draw
	 *  @param {object} oSettings dataTables settings object
	 */
	function _fnStart( oSettings )
	{
		var bServerSide = _fnDataSource( oSettings ) == 'ssp';
		var iInitDisplayStart = oSettings.iInitDisplayStart;
	
		// Check and see if we have an initial draw position from state saving
		if ( iInitDisplayStart !== undefined && iInitDisplayStart !== -1 )
		{
			oSettings._iDisplayStart = bServerSide ?
				iInitDisplayStart :
				iInitDisplayStart >= oSettings.fnRecordsDisplay() ?
					0 :
					iInitDisplayStart;
	
			oSettings.iInitDisplayStart = -1;
		}
	}
	
	/**
	 * Create an Ajax call based on the table's settings, taking into account that
	 * parameters can have multiple forms, and backwards compatibility.
	 *
	 * @param {object} oSettings dataTables settings object
	 * @param {array} data Data to send to the server, required by
	 *     DataTables - may be augmented by developer callbacks
	 * @param {function} fn Callback function to run when data is obtained
	 */
	function _fnBuildAjax( oSettings, data, fn )
	{
		var ajaxData;
		var ajax = oSettings.ajax;
		var instance = oSettings.oInstance;
		var callback = function ( json ) {
			var status = oSettings.jqXHR
				? oSettings.jqXHR.status
				: null;
	
			if ( json === null || (typeof status === 'number' && status == 204 ) ) {
				json = {};
				_fnAjaxDataSrc( oSettings, json, [] );
			}
	
			var error = json.error || json.sError;
			if ( error ) {
				_fnLog( oSettings, 0, error );
			}
	
			oSettings.json = json;
	
			_fnCallbackFire( oSettings, null, 'xhr', [oSettings, json, oSettings.jqXHR], true );
			fn( json );
		};
	
		if ( $.isPlainObject( ajax ) && ajax.data )
		{
			ajaxData = ajax.data;
	
			var newData = typeof ajaxData === 'function' ?
				ajaxData( data, oSettings ) :  // fn can manipulate data or return
				ajaxData;                      // an object object or array to merge
	
			// If the function returned something, use that alone
			data = typeof ajaxData === 'function' && newData ?
				newData :
				$.extend( true, data, newData );
	
			// Remove the data property as we've resolved it already and don't want
			// jQuery to do it again (it is restored at the end of the function)
			delete ajax.data;
		}
	
		var baseAjax = {
			"url": typeof ajax === 'string' ?
				ajax :
				'',
			"data": data,
			"success": callback,
			"dataType": "json",
			"cache": false,
			"type": oSettings.sServerMethod,
			"error": function (xhr, error) {
				var ret = _fnCallbackFire( oSettings, null, 'xhr', [oSettings, null, oSettings.jqXHR], true );
	
				if ( ret.indexOf(true) === -1 ) {
					if ( error == "parsererror" ) {
						_fnLog( oSettings, 0, 'Invalid JSON response', 1 );
					}
					else if ( xhr.readyState === 4 ) {
						_fnLog( oSettings, 0, 'Ajax error', 7 );
					}
				}
	
				_fnProcessingDisplay( oSettings, false );
			}
		};
	
		// If `ajax` option is an object, extend and override our default base
		if ( $.isPlainObject( ajax ) ) {
			$.extend( baseAjax, ajax )
		}
	
		// Store the data submitted for the API
		oSettings.oAjaxData = data;
	
		// Allow plug-ins and external processes to modify the data
		_fnCallbackFire( oSettings, null, 'preXhr', [oSettings, data, baseAjax], true );
	
		if ( typeof ajax === 'function' )
		{
			// Is a function - let the caller define what needs to be done
			oSettings.jqXHR = ajax.call( instance, data, callback, oSettings );
		}
		else if (ajax.url === '') {
			// No url, so don't load any data. Just apply an empty data array
			// to the object for the callback.
			var empty = {};
	
			DataTable.util.set(ajax.dataSrc)(empty, []);
			callback(empty);
		}
		else {
			// Object to extend the base settings
			oSettings.jqXHR = $.ajax( baseAjax );
	
			// Restore for next time around
			if ( ajaxData ) {
				ajax.data = ajaxData;
			}
		}
	}
	
	
	/**
	 * Update the table using an Ajax call
	 *  @param {object} settings dataTables settings object
	 *  @returns {boolean} Block the table drawing or not
	 *  @memberof DataTable#oApi
	 */
	function _fnAjaxUpdate( settings )
	{
		settings.iDraw++;
		_fnProcessingDisplay( settings, true );
	
		_fnBuildAjax(
			settings,
			_fnAjaxParameters( settings ),
			function(json) {
				_fnAjaxUpdateDraw( settings, json );
			}
		);
	}
	
	
	/**
	 * Build up the parameters in an object needed for a server-side processing
	 * request.
	 *  @param {object} oSettings dataTables settings object
	 *  @returns {bool} block the table drawing or not
	 *  @memberof DataTable#oApi
	 */
	function _fnAjaxParameters( settings )
	{
		var
			columns = settings.aoColumns,
			features = settings.oFeatures,
			preSearch = settings.oPreviousSearch,
			preColSearch = settings.aoPreSearchCols,
			colData = function ( idx, prop ) {
				return typeof columns[idx][prop] === 'function' ?
					'function' :
					columns[idx][prop];
			};
	
		return {
			draw: settings.iDraw,
			columns: columns.map( function ( column, i ) {
				return {
					data: colData(i, 'mData'),
					name: column.sName,
					searchable: column.bSearchable,
					orderable: column.bSortable,
					search: {
						value: preColSearch[i].search,
						regex: preColSearch[i].regex,
						fixed: Object.keys(column.searchFixed).map( function(name) {
							return {
								name: name,
								term: column.searchFixed[name].toString()
							}
						})
					}
				};
			} ),
			order: _fnSortFlatten( settings ).map( function ( val ) {
				return {
					column: val.col,
					dir: val.dir,
					name: colData(val.col, 'sName')
				};
			} ),
			start: settings._iDisplayStart,
			length: features.bPaginate ?
				settings._iDisplayLength :
				-1,
			search: {
				value: preSearch.search,
				regex: preSearch.regex,
				fixed: Object.keys(settings.searchFixed).map( function(name) {
					return {
						name: name,
						term: settings.searchFixed[name].toString()
					}
				})
			}
		};
	}
	
	
	/**
	 * Data the data from the server (nuking the old) and redraw the table
	 *  @param {object} oSettings dataTables settings object
	 *  @param {object} json json data return from the server.
	 *  @param {string} json.sEcho Tracking flag for DataTables to match requests
	 *  @param {int} json.iTotalRecords Number of records in the data set, not accounting for filtering
	 *  @param {int} json.iTotalDisplayRecords Number of records in the data set, accounting for filtering
	 *  @param {array} json.aaData The data to display on this page
	 *  @param {string} [json.sColumns] Column ordering (sName, comma separated)
	 *  @memberof DataTable#oApi
	 */
	function _fnAjaxUpdateDraw ( settings, json )
	{
		var data = _fnAjaxDataSrc(settings, json);
		var draw = _fnAjaxDataSrcParam(settings, 'draw', json);
		var recordsTotal = _fnAjaxDataSrcParam(settings, 'recordsTotal', json);
		var recordsFiltered = _fnAjaxDataSrcParam(settings, 'recordsFiltered', json);
	
		if ( draw !== undefined ) {
			// Protect against out of sequence returns
			if ( draw*1 < settings.iDraw ) {
				return;
			}
			settings.iDraw = draw * 1;
		}
	
		// No data in returned object, so rather than an array, we show an empty table
		if ( ! data ) {
			data = [];
		}
	
		_fnClearTable( settings );
		settings._iRecordsTotal   = parseInt(recordsTotal, 10);
		settings._iRecordsDisplay = parseInt(recordsFiltered, 10);
	
		for ( var i=0, ien=data.length ; i<ien ; i++ ) {
			_fnAddData( settings, data[i] );
		}
		settings.aiDisplay = settings.aiDisplayMaster.slice();
	
		_fnDraw( settings, true );
		_fnInitComplete( settings );
		_fnProcessingDisplay( settings, false );
	}
	
	
	/**
	 * Get the data from the JSON data source to use for drawing a table. Using
	 * `_fnGetObjectDataFn` allows the data to be sourced from a property of the
	 * source object, or from a processing function.
	 *  @param {object} settings dataTables settings object
	 *  @param  {object} json Data source object / array from the server
	 *  @return {array} Array of data to use
	 */
	function _fnAjaxDataSrc ( settings, json, write )
	{
		var dataProp = 'data';
	
		if ($.isPlainObject( settings.ajax ) && settings.ajax.dataSrc !== undefined) {
			// Could in inside a `dataSrc` object, or not!
			var dataSrc = settings.ajax.dataSrc;
	
			// string, function and object are valid types
			if (typeof dataSrc === 'string' || typeof dataSrc === 'function') {
				dataProp = dataSrc;
			}
			else if (dataSrc.data !== undefined) {
				dataProp = dataSrc.data;
			}
		}
	
		if ( ! write ) {
			if ( dataProp === 'data' ) {
				// If the default, then we still want to support the old style, and safely ignore
				// it if possible
				return json.aaData || json[dataProp];
			}
	
			return dataProp !== "" ?
				_fnGetObjectDataFn( dataProp )( json ) :
				json;
		}
		
		// set
		_fnSetObjectDataFn( dataProp )( json, write );
	}
	
	/**
	 * Very similar to _fnAjaxDataSrc, but for the other SSP properties
	 * @param {*} settings DataTables settings object
	 * @param {*} param Target parameter
	 * @param {*} json JSON data
	 * @returns Resolved value
	 */
	function _fnAjaxDataSrcParam (settings, param, json) {
		var dataSrc = $.isPlainObject( settings.ajax )
			? settings.ajax.dataSrc
			: null;
	
		if (dataSrc && dataSrc[param]) {
			// Get from custom location
			return _fnGetObjectDataFn( dataSrc[param] )( json );
		}
	
		// else - Default behaviour
		var old = '';
	
		// Legacy support
		if (param === 'draw') {
			old = 'sEcho';
		}
		else if (param === 'recordsTotal') {
			old = 'iTotalRecords';
		}
		else if (param === 'recordsFiltered') {
			old = 'iTotalDisplayRecords';
		}
	
		return json[old] !== undefined
			? json[old]
			: json[param];
	}
	
	
	/**
	 * Filter the table using both the global filter and column based filtering
	 *  @param {object} settings dataTables settings object
	 *  @param {object} input search information
	 *  @memberof DataTable#oApi
	 */
	function _fnFilterComplete ( settings, input )
	{
		var columnsSearch = settings.aoPreSearchCols;
	
		// Resolve any column types that are unknown due to addition or invalidation
		// @todo As per sort - can this be moved into an event handler?
		_fnColumnTypes( settings );
	
		// In server-side processing all filtering is done by the server, so no point hanging around here
		if ( _fnDataSource( settings ) != 'ssp' )
		{
			// Check if any of the rows were invalidated
			_fnFilterData( settings );
	
			// Start from the full data set
			settings.aiDisplay = settings.aiDisplayMaster.slice();
	
			// Global filter first
			_fnFilter( settings.aiDisplay, settings, input.search, input );
	
			$.each(settings.searchFixed, function (name, term) {
				_fnFilter(settings.aiDisplay, settings, term, {});
			});
	
			// Then individual column filters
			for ( var i=0 ; i<columnsSearch.length ; i++ )
			{
				var col = columnsSearch[i];
	
				_fnFilter(
					settings.aiDisplay,
					settings,
					col.search,
					col,
					i
				);
	
				$.each(settings.aoColumns[i].searchFixed, function (name, term) {
					_fnFilter(settings.aiDisplay, settings, term, {}, i);
				});
			}
	
			// And finally global filtering
			_fnFilterCustom( settings );
		}
	
		// Tell the draw function we have been filtering
		settings.bFiltered = true;
	
		_fnCallbackFire( settings, null, 'search', [settings] );
	}
	
	
	/**
	 * Apply custom filtering functions
	 * 
	 * This is legacy now that we have named functions, but it is widely used
	 * from 1.x, so it is not yet deprecated.
	 *  @param {object} oSettings dataTables settings object
	 *  @memberof DataTable#oApi
	 */
	function _fnFilterCustom( settings )
	{
		var filters = DataTable.ext.search;
		var displayRows = settings.aiDisplay;
		var row, rowIdx;
	
		for ( var i=0, ien=filters.length ; i<ien ; i++ ) {
			var rows = [];
	
			// Loop over each row and see if it should be included
			for ( var j=0, jen=displayRows.length ; j<jen ; j++ ) {
				rowIdx = displayRows[ j ];
				row = settings.aoData[ rowIdx ];
	
				if ( filters[i]( settings, row._aFilterData, rowIdx, row._aData, j ) ) {
					rows.push( rowIdx );
				}
			}
	
			// So the array reference doesn't break set the results into the
			// existing array
			displayRows.length = 0;
			displayRows.push.apply(displayRows, rows);
		}
	}
	
	
	/**
	 * Filter the data table based on user input and draw the table
	 */
	function _fnFilter( searchRows, settings, input, options, column )
	{
		if ( input === '' ) {
			return;
		}
	
		var i = 0;
		var matched = [];
	
		// Search term can be a function, regex or string - if a string we apply our
		// smart filtering regex (assuming the options require that)
		var searchFunc = typeof input === 'function' ? input : null;
		var rpSearch = input instanceof RegExp
			? input
			: searchFunc
				? null
				: _fnFilterCreateSearch( input, options );
	
		// Then for each row, does the test pass. If not, lop the row from the array
		for (i=0 ; i<searchRows.length ; i++) {
			var row = settings.aoData[ searchRows[i] ];
			var data = column === undefined
				? row._sFilterRow
				: row._aFilterData[ column ];
	
			if ( (searchFunc && searchFunc(data, row._aData, searchRows[i], column)) || (rpSearch && rpSearch.test(data)) ) {
				matched.push(searchRows[i]);
			}
		}
	
		// Mutate the searchRows array
		searchRows.length = matched.length;
	
		for (i=0 ; i<matched.length ; i++) {
			searchRows[i] = matched[i];
		}
	}
	
	
	/**
	 * Build a regular expression object suitable for searching a table
	 *  @param {string} sSearch string to search for
	 *  @param {bool} bRegex treat as a regular expression or not
	 *  @param {bool} bSmart perform smart filtering or not
	 *  @param {bool} bCaseInsensitive Do case insensitive matching or not
	 *  @returns {RegExp} constructed object
	 *  @memberof DataTable#oApi
	 */
	function _fnFilterCreateSearch( search, inOpts )
	{
		var not = [];
		var options = $.extend({}, {
			boundary: false,
			caseInsensitive: true,
			exact: false,
			regex: false,
			smart: true
		}, inOpts);
	
		if (typeof search !== 'string') {
			search = search.toString();
		}
	
		// Remove diacritics if normalize is set up to do so
		search = _normalize(search);
	
		if (options.exact) {
			return new RegExp(
				'^'+_fnEscapeRegex(search)+'$',
				options.caseInsensitive ? 'i' : ''
			);
		}
	
		search = options.regex ?
			search :
			_fnEscapeRegex( search );
		
		if ( options.smart ) {
			/* For smart filtering we want to allow the search to work regardless of
			 * word order. We also want double quoted text to be preserved, so word
			 * order is important - a la google. And a negative look around for
			 * finding rows which don't contain a given string.
			 * 
			 * So this is the sort of thing we want to generate:
			 * 
			 * ^(?=.*?\bone\b)(?=.*?\btwo three\b)(?=.*?\bfour\b).*$
			 */
			var parts = search.match( /!?["\u201C][^"\u201D]+["\u201D]|[^ ]+/g ) || [''];
			var a = parts.map( function ( word ) {
				var negative = false;
				var m;
	
				// Determine if it is a "does not include"
				if ( word.charAt(0) === '!' ) {
					negative = true;
					word = word.substring(1);
				}
	
				// Strip the quotes from around matched phrases
				if ( word.charAt(0) === '"' ) {
					m = word.match( /^"(.*)"$/ );
					word = m ? m[1] : word;
				}
				else if ( word.charAt(0) === '\u201C' ) {
					// Smart quote match (iPhone users)
					m = word.match( /^\u201C(.*)\u201D$/ );
					word = m ? m[1] : word;
				}
	
				// For our "not" case, we need to modify the string that is
				// allowed to match at the end of the expression.
				if (negative) {
					if (word.length > 1) {
						not.push('(?!'+word+')');
					}
	
					word = '';
				}
	
				return word.replace(/"/g, '');
			} );
	
			var match = not.length
				? not.join('')
				: '';
	
			var boundary = options.boundary
				? '\\b'
				: '';
	
			search = '^(?=.*?'+boundary+a.join( ')(?=.*?'+boundary )+')('+match+'.)*$';
		}
	
		return new RegExp( search, options.caseInsensitive ? 'i' : '' );
	}
	
	
	/**
	 * Escape a string such that it can be used in a regular expression
	 *  @param {string} sVal string to escape
	 *  @returns {string} escaped string
	 *  @memberof DataTable#oApi
	 */
	var _fnEscapeRegex = DataTable.util.escapeRegex;
	
	var __filter_div = $('<div>')[0];
	var __filter_div_textContent = __filter_div.textContent !== undefined;
	
	// Update the filtering data for each row if needed (by invalidation or first run)
	function _fnFilterData ( settings )
	{
		var columns = settings.aoColumns;
		var data = settings.aoData;
		var column;
		var j, jen, filterData, cellData, row;
		var wasInvalidated = false;
	
		for ( var rowIdx=0 ; rowIdx<data.length ; rowIdx++ ) {
			if (! data[rowIdx]) {
				continue;
			}
	
			row = data[rowIdx];
	
			if ( ! row._aFilterData ) {
				filterData = [];
	
				for ( j=0, jen=columns.length ; j<jen ; j++ ) {
					column = columns[j];
	
					if ( column.bSearchable ) {
						cellData = _fnGetCellData( settings, rowIdx, j, 'filter' );
	
						// Search in DataTables is string based
						if ( cellData === null ) {
							cellData = '';
						}
	
						if ( typeof cellData !== 'string' && cellData.toString ) {
							cellData = cellData.toString();
						}
					}
					else {
						cellData = '';
					}
	
					// If it looks like there is an HTML entity in the string,
					// attempt to decode it so sorting works as expected. Note that
					// we could use a single line of jQuery to do this, but the DOM
					// method used here is much faster https://jsperf.com/html-decode
					if ( cellData.indexOf && cellData.indexOf('&') !== -1 ) {
						__filter_div.innerHTML = cellData;
						cellData = __filter_div_textContent ?
							__filter_div.textContent :
							__filter_div.innerText;
					}
	
					if ( cellData.replace ) {
						cellData = cellData.replace(/[\r\n\u2028]/g, '');
					}
	
					filterData.push( cellData );
				}
	
				row._aFilterData = filterData;
				row._sFilterRow = filterData.join('  ');
				wasInvalidated = true;
			}
		}
	
		return wasInvalidated;
	}
	
	
	/**
	 * Draw the table for the first time, adding all required features
	 *  @param {object} settings dataTables settings object
	 *  @memberof DataTable#oApi
	 */
	function _fnInitialise ( settings )
	{
		var i, iAjaxStart=settings.iInitDisplayStart;
	
		/* Ensure that the table data is fully initialised */
		if ( ! settings.bInitialised ) {
			setTimeout( function(){ _fnInitialise( settings ); }, 200 );
			return;
		}
	
		/* Build and draw the header / footer for the table */
		_fnBuildHead( settings, 'header' );
		_fnBuildHead( settings, 'footer' );
		_fnDrawHead( settings, settings.aoHeader );
		_fnDrawHead( settings, settings.aoFooter );
	
		// Enable features
		_fnAddOptionsHtml( settings );
		_fnSortInit( settings );
	
		_colGroup( settings );
	
		/* Okay to show that something is going on now */
		_fnProcessingDisplay( settings, true );
	
		_fnCallbackFire( settings, null, 'preInit', [settings], true );
	
		// If there is default sorting required - let's do it. The sort function
		// will do the drawing for us. Otherwise we draw the table regardless of the
		// Ajax source - this allows the table to look initialised for Ajax sourcing
		// data (show 'loading' message possibly)
		_fnReDraw( settings );
	
		var dataSrc = _fnDataSource( settings );
	
		// Server-side processing init complete is done by _fnAjaxUpdateDraw
		if ( dataSrc != 'ssp' ) {
			// if there is an ajax source load the data
			if ( dataSrc == 'ajax' ) {
				_fnBuildAjax( settings, {}, function(json) {
					var aData = _fnAjaxDataSrc( settings, json );
	
					// Got the data - add it to the table
					for ( i=0 ; i<aData.length ; i++ ) {
						_fnAddData( settings, aData[i] );
					}
	
					// Reset the init display for cookie saving. We've already done
					// a filter, and therefore cleared it before. So we need to make
					// it appear 'fresh'
					settings.iInitDisplayStart = iAjaxStart;
	
					_fnReDraw( settings );
					_fnProcessingDisplay( settings, false );
					_fnInitComplete( settings );
				}, settings );
			}
			else {
				_fnInitComplete( settings );
				_fnProcessingDisplay( settings, false );
			}
		}
	}
	
	
	/**
	 * Draw the table for the first time, adding all required features
	 *  @param {object} settings dataTables settings object
	 *  @memberof DataTable#oApi
	 */
	function _fnInitComplete ( settings )
	{
		if (settings._bInitComplete) {
			return;
		}
	
		var args = [settings, settings.json];
	
		settings._bInitComplete = true;
	
		// Table is fully set up and we have data, so calculate the
		// column widths
		_fnAdjustColumnSizing( settings );
	
		_fnCallbackFire( settings, null, 'plugin-init', args, true );
		_fnCallbackFire( settings, 'aoInitComplete', 'init', args, true );
	}
	
	function _fnLengthChange ( settings, val )
	{
		var len = parseInt( val, 10 );
		settings._iDisplayLength = len;
	
		_fnLengthOverflow( settings );
	
		// Fire length change event
		_fnCallbackFire( settings, null, 'length', [settings, len] );
	}
	
	/**
	 * Alter the display settings to change the page
	 *  @param {object} settings DataTables settings object
	 *  @param {string|int} action Paging action to take: "first", "previous",
	 *    "next" or "last" or page number to jump to (integer)
	 *  @param [bool] redraw Automatically draw the update or not
	 *  @returns {bool} true page has changed, false - no change
	 *  @memberof DataTable#oApi
	 */
	function _fnPageChange ( settings, action, redraw )
	{
		var
			start     = settings._iDisplayStart,
			len       = settings._iDisplayLength,
			records   = settings.fnRecordsDisplay();
	
		if ( records === 0 || len === -1 )
		{
			start = 0;
		}
		else if ( typeof action === "number" )
		{
			start = action * len;
	
			if ( start > records )
			{
				start = 0;
			}
		}
		else if ( action == "first" )
		{
			start = 0;
		}
		else if ( action == "previous" )
		{
			start = len >= 0 ?
				start - len :
				0;
	
			if ( start < 0 )
			{
				start = 0;
			}
		}
		else if ( action == "next" )
		{
			if ( start + len < records )
			{
				start += len;
			}
		}
		else if ( action == "last" )
		{
			start = Math.floor( (records-1) / len) * len;
		}
		else if ( action === 'ellipsis' )
		{
			return;
		}
		else
		{
			_fnLog( settings, 0, "Unknown paging action: "+action, 5 );
		}
	
		var changed = settings._iDisplayStart !== start;
		settings._iDisplayStart = start;
	
		_fnCallbackFire( settings, null, changed ? 'page' : 'page-nc', [settings] );
	
		if ( changed && redraw ) {
			_fnDraw( settings );
		}
	
		return changed;
	}
	
	
	/**
	 * Generate the node required for the processing node
	 *  @param {object} settings DataTables settings object
	 */
	function _processingHtml ( settings )
	{
		var table = settings.nTable;
		var scrolling = settings.oScroll.sX !== '' || settings.oScroll.sY !== '';
	
		if ( settings.oFeatures.bProcessing ) {
			var n = $('<div/>', {
					'id': settings.sTableId + '_processing',
					'class': settings.oClasses.processing.container,
					'role': 'status'
				} )
				.html( settings.oLanguage.sProcessing )
				.append('<div><div></div><div></div><div></div><div></div></div>');
	
			// Different positioning depending on if scrolling is enabled or not
			if (scrolling) {
				n.prependTo( $('div.dt-scroll', settings.nTableWrapper) );
			}
			else {
				n.insertBefore( table );
			}
	
			$(table).on( 'processing.dt.DT', function (e, s, show) {
				n.css( 'display', show ? 'block' : 'none' );
			} );
		}
	}
	
	
	/**
	 * Display or hide the processing indicator
	 *  @param {object} settings DataTables settings object
	 *  @param {bool} show Show the processing indicator (true) or not (false)
	 */
	function _fnProcessingDisplay ( settings, show )
	{
		_fnCallbackFire( settings, null, 'processing', [settings, show] );
	}
	/**
	 * Add any control elements for the table - specifically scrolling
	 *  @param {object} settings dataTables settings object
	 *  @returns {node} Node to add to the DOM
	 *  @memberof DataTable#oApi
	 */
	function _fnFeatureHtmlTable ( settings )
	{
		var table = $(settings.nTable);
	
		// Scrolling from here on in
		var scroll = settings.oScroll;
	
		if ( scroll.sX === '' && scroll.sY === '' ) {
			return settings.nTable;
		}
	
		var scrollX = scroll.sX;
		var scrollY = scroll.sY;
		var classes = settings.oClasses.scrolling;
		var caption = settings.captionNode;
		var captionSide = caption ? caption._captionSide : null;
		var headerClone = $( table[0].cloneNode(false) );
		var footerClone = $( table[0].cloneNode(false) );
		var footer = table.children('tfoot');
		var _div = '<div/>';
		var size = function ( s ) {
			return !s ? null : _fnStringToCss( s );
		};
	
		if ( ! footer.length ) {
			footer = null;
		}
	
		/*
		 * The HTML structure that we want to generate in this function is:
		 *  div - scroller
		 *    div - scroll head
		 *      div - scroll head inner
		 *        table - scroll head table
		 *          thead - thead
		 *    div - scroll body
		 *      table - table (master table)
		 *        thead - thead clone for sizing
		 *        tbody - tbody
		 *    div - scroll foot
		 *      div - scroll foot inner
		 *        table - scroll foot table
		 *          tfoot - tfoot
		 */
		var scroller = $( _div, { 'class': classes.container } )
			.append(
				$(_div, { 'class': classes.header.self } )
					.css( {
						overflow: 'hidden',
						position: 'relative',
						border: 0,
						width: scrollX ? size(scrollX) : '100%'
					} )
					.append(
						$(_div, { 'class': classes.header.inner } )
							.css( {
								'box-sizing': 'content-box',
								width: scroll.sXInner || '100%'
							} )
							.append(
								headerClone
									.removeAttr('id')
									.css( 'margin-left', 0 )
									.append( captionSide === 'top' ? caption : null )
									.append(
										table.children('thead')
									)
							)
					)
			)
			.append(
				$(_div, { 'class': classes.body } )
					.css( {
						position: 'relative',
						overflow: 'auto',
						width: size( scrollX )
					} )
					.append( table )
			);
	
		if ( footer ) {
			scroller.append(
				$(_div, { 'class': classes.footer.self } )
					.css( {
						overflow: 'hidden',
						border: 0,
						width: scrollX ? size(scrollX) : '100%'
					} )
					.append(
						$(_div, { 'class': classes.footer.inner } )
							.append(
								footerClone
									.removeAttr('id')
									.css( 'margin-left', 0 )
									.append( captionSide === 'bottom' ? caption : null )
									.append(
										table.children('tfoot')
									)
							)
					)
			);
		}
	
		var children = scroller.children();
		var scrollHead = children[0];
		var scrollBody = children[1];
		var scrollFoot = footer ? children[2] : null;
	
		// When the body is scrolled, then we also want to scroll the headers
		$(scrollBody).on( 'scroll.DT', function () {
			var scrollLeft = this.scrollLeft;
	
			scrollHead.scrollLeft = scrollLeft;
	
			if ( footer ) {
				scrollFoot.scrollLeft = scrollLeft;
			}
		} );
	
		// When focus is put on the header cells, we might need to scroll the body
		$('th, td', scrollHead).on('focus', function () {
			var scrollLeft = scrollHead.scrollLeft;
	
			scrollBody.scrollLeft = scrollLeft;
	
			if ( footer ) {
				scrollBody.scrollLeft = scrollLeft;
			}
		});
	
		$(scrollBody).css('max-height', scrollY);
		if (! scroll.bCollapse) {
			$(scrollBody).css('height', scrollY);
		}
	
		settings.nScrollHead = scrollHead;
		settings.nScrollBody = scrollBody;
		settings.nScrollFoot = scrollFoot;
	
		// On redraw - align columns
		settings.aoDrawCallback.push(_fnScrollDraw);
	
		return scroller[0];
	}
	
	
	
	/**
	 * Update the header, footer and body tables for resizing - i.e. column
	 * alignment.
	 *
	 * Welcome to the most horrible function DataTables. The process that this
	 * function follows is basically:
	 *   1. Re-create the table inside the scrolling div
	 *   2. Correct colgroup > col values if needed
	 *   3. Copy colgroup > col over to header and footer
	 *   4. Clean up
	 *
	 *  @param {object} settings dataTables settings object
	 *  @memberof DataTable#oApi
	 */
	function _fnScrollDraw ( settings )
	{
		// Given that this is such a monster function, a lot of variables are use
		// to try and keep the minimised size as small as possible
		var
			scroll         = settings.oScroll,
			barWidth       = scroll.iBarWidth,
			divHeader      = $(settings.nScrollHead),
			divHeaderInner = divHeader.children('div'),
			divHeaderTable = divHeaderInner.children('table'),
			divBodyEl      = settings.nScrollBody,
			divBody        = $(divBodyEl),
			divFooter      = $(settings.nScrollFoot),
			divFooterInner = divFooter.children('div'),
			divFooterTable = divFooterInner.children('table'),
			header         = $(settings.nTHead),
			table          = $(settings.nTable),
			footer         = settings.nTFoot && $('th, td', settings.nTFoot).length ? $(settings.nTFoot) : null,
			browser        = settings.oBrowser,
			headerCopy, footerCopy;
	
		// If the scrollbar visibility has changed from the last draw, we need to
		// adjust the column sizes as the table width will have changed to account
		// for the scrollbar
		var scrollBarVis = divBodyEl.scrollHeight > divBodyEl.clientHeight;
		
		if ( settings.scrollBarVis !== scrollBarVis && settings.scrollBarVis !== undefined ) {
			settings.scrollBarVis = scrollBarVis;
			_fnAdjustColumnSizing( settings );
			return; // adjust column sizing will call this function again
		}
		else {
			settings.scrollBarVis = scrollBarVis;
		}
	
		// 1. Re-create the table inside the scrolling div
		// Remove the old minimised thead and tfoot elements in the inner table
		table.children('thead, tfoot').remove();
	
		// Clone the current header and footer elements and then place it into the inner table
		headerCopy = header.clone().prependTo( table );
		headerCopy.find('th, td').removeAttr('tabindex');
		headerCopy.find('[id]').removeAttr('id');
	
		if ( footer ) {
			footerCopy = footer.clone().prependTo( table );
			footerCopy.find('[id]').removeAttr('id');
		}
	
		// 2. Correct colgroup > col values if needed
		// It is possible that the cell sizes are smaller than the content, so we need to
		// correct colgroup>col for such cases. This can happen if the auto width detection
		// uses a cell which has a longer string, but isn't the widest! For example 
		// "Chief Executive Officer (CEO)" is the longest string in the demo, but
		// "Systems Administrator" is actually the widest string since it doesn't collapse.
		// Note the use of translating into a column index to get the `col` element. This
		// is because of Responsive which might remove `col` elements, knocking the alignment
		// of the indexes out.
		if (settings.aiDisplay.length) {
			// Get the column sizes from the first row in the table
			var colSizes = table.children('tbody').eq(0).children('tr').eq(0).children('th, td').map(function (vis) {
				return {
					idx: _fnVisibleToColumnIndex(settings, vis),
					width: $(this).outerWidth()
				}
			});
	
			// Check against what the colgroup > col is set to and correct if needed
			for (var i=0 ; i<colSizes.length ; i++) {
				var colEl = settings.aoColumns[ colSizes[i].idx ].colEl[0];
				var colWidth = colEl.style.width.replace('px', '');
	
				if (colWidth !== colSizes[i].width) {
					colEl.style.width = colSizes[i].width + 'px';
				}
			}
		}
	
		// 3. Copy the colgroup over to the header and footer
		divHeaderTable
			.find('colgroup')
			.remove();
	
		divHeaderTable.append(settings.colgroup.clone());
	
		if ( footer ) {
			divFooterTable
				.find('colgroup')
				.remove();
	
			divFooterTable.append(settings.colgroup.clone());
		}
	
		// "Hide" the header and footer that we used for the sizing. We need to keep
		// the content of the cell so that the width applied to the header and body
		// both match, but we want to hide it completely.
		$('th, td', headerCopy).each(function () {
			$(this.childNodes).wrapAll('<div class="dt-scroll-sizing">');
		});
	
		if ( footer ) {
			$('th, td', footerCopy).each(function () {
				$(this.childNodes).wrapAll('<div class="dt-scroll-sizing">');
			});
		}
	
		// 4. Clean up
		// Figure out if there are scrollbar present - if so then we need a the header and footer to
		// provide a bit more space to allow "overflow" scrolling (i.e. past the scrollbar)
		var isScrolling = Math.floor(table.height()) > divBodyEl.clientHeight || divBody.css('overflow-y') == "scroll";
		var paddingSide = 'padding' + (browser.bScrollbarLeft ? 'Left' : 'Right' );
	
		// Set the width's of the header and footer tables
		var outerWidth = table.outerWidth();
	
		divHeaderTable.css('width', _fnStringToCss( outerWidth ));
		divHeaderInner
			.css('width', _fnStringToCss( outerWidth ))
			.css(paddingSide, isScrolling ? barWidth+"px" : "0px");
	
		if ( footer ) {
			divFooterTable.css('width', _fnStringToCss( outerWidth ));
			divFooterInner
				.css('width', _fnStringToCss( outerWidth ))
				.css(paddingSide, isScrolling ? barWidth+"px" : "0px");
		}
	
		// Correct DOM ordering for colgroup - comes before the thead
		table.children('colgroup').prependTo(table);
	
		// Adjust the position of the header in case we loose the y-scrollbar
		divBody.trigger('scroll');
	
		// If sorting or filtering has occurred, jump the scrolling back to the top
		// only if we aren't holding the position
		if ( (settings.bSorted || settings.bFiltered) && ! settings._drawHold ) {
			divBodyEl.scrollTop = 0;
		}
	}
	
	/**
	 * Calculate the width of columns for the table
	 *  @param {object} settings dataTables settings object
	 *  @memberof DataTable#oApi
	 */
	function _fnCalculateColumnWidths ( settings )
	{
		// Not interested in doing column width calculation if auto-width is disabled
		if (! settings.oFeatures.bAutoWidth) {
			return;
		}
	
		var
			table = settings.nTable,
			columns = settings.aoColumns,
			scroll = settings.oScroll,
			scrollY = scroll.sY,
			scrollX = scroll.sX,
			scrollXInner = scroll.sXInner,
			visibleColumns = _fnGetColumns( settings, 'bVisible' ),
			tableWidthAttr = table.getAttribute('width'), // from DOM element
			tableContainer = table.parentNode,
			i, column, columnIdx;
	
		var styleWidth = table.style.width;
		if ( styleWidth && styleWidth.indexOf('%') !== -1 ) {
			tableWidthAttr = styleWidth;
		}
	
		// Let plug-ins know that we are doing a recalc, in case they have changed any of the
		// visible columns their own way (e.g. Responsive uses display:none).
		_fnCallbackFire(
			settings,
			null,
			'column-calc',
			{visible: visibleColumns},
			false
		);
	
		// Construct a single row, worst case, table with the widest
		// node in the data, assign any user defined widths, then insert it into
		// the DOM and allow the browser to do all the hard work of calculating
		// table widths
		var tmpTable = $(table.cloneNode())
			.css( 'visibility', 'hidden' )
			.removeAttr( 'id' );
	
		// Clean up the table body
		tmpTable.append('<tbody>')
		var tr = $('<tr/>').appendTo( tmpTable.find('tbody') );
	
		// Clone the table header and footer - we can't use the header / footer
		// from the cloned table, since if scrolling is active, the table's
		// real header and footer are contained in different table tags
		tmpTable
			.append( $(settings.nTHead).clone() )
			.append( $(settings.nTFoot).clone() );
	
		// Remove any assigned widths from the footer (from scrolling)
		tmpTable.find('tfoot th, tfoot td').css('width', '');
	
		// Apply custom sizing to the cloned header
		tmpTable.find('thead th, thead td').each( function () {
			// Get the `width` from the header layout
			var width = _fnColumnsSumWidth( settings, this, true, false );
	
			if ( width ) {
				this.style.width = width;
	
				// For scrollX we need to force the column width otherwise the
				// browser will collapse it. If this width is smaller than the
				// width the column requires, then it will have no effect
				if ( scrollX ) {
					$( this ).append( $('<div/>').css( {
						width: width,
						margin: 0,
						padding: 0,
						border: 0,
						height: 1
					} ) );
				}
			}
			else {
				this.style.width = '';
			}
		} );
	
		// Find the widest piece of data for each column and put it into the table
		for ( i=0 ; i<visibleColumns.length ; i++ ) {
			columnIdx = visibleColumns[i];
			column = columns[ columnIdx ];
	
			var longest = _fnGetMaxLenString(settings, columnIdx);
			var autoClass = _ext.type.className[column.sType];
			var text = longest + column.sContentPadding;
			var insert = longest.indexOf('<') === -1
				? document.createTextNode(text)
				: text
			
			$('<td/>')
				.addClass(autoClass)
				.addClass(column.sClass)
				.append(insert)
				.appendTo(tr);
		}
	
		// Tidy the temporary table - remove name attributes so there aren't
		// duplicated in the dom (radio elements for example)
		$('[name]', tmpTable).removeAttr('name');
	
		// Table has been built, attach to the document so we can work with it.
		// A holding element is used, positioned at the top of the container
		// with minimal height, so it has no effect on if the container scrolls
		// or not. Otherwise it might trigger scrolling when it actually isn't
		// needed
		var holder = $('<div/>').css( scrollX || scrollY ?
				{
					position: 'absolute',
					top: 0,
					left: 0,
					height: 1,
					right: 0,
					overflow: 'hidden'
				} :
				{}
			)
			.append( tmpTable )
			.appendTo( tableContainer );
	
		// When scrolling (X or Y) we want to set the width of the table as 
		// appropriate. However, when not scrolling leave the table width as it
		// is. This results in slightly different, but I think correct behaviour
		if ( scrollX && scrollXInner ) {
			tmpTable.width( scrollXInner );
		}
		else if ( scrollX ) {
			tmpTable.css( 'width', 'auto' );
			tmpTable.removeAttr('width');
	
			// If there is no width attribute or style, then allow the table to
			// collapse
			if ( tmpTable.width() < tableContainer.clientWidth && tableWidthAttr ) {
				tmpTable.width( tableContainer.clientWidth );
			}
		}
		else if ( scrollY ) {
			tmpTable.width( tableContainer.clientWidth );
		}
		else if ( tableWidthAttr ) {
			tmpTable.width( tableWidthAttr );
		}
	
		// Get the width of each column in the constructed table
		var total = 0;
		var bodyCells = tmpTable.find('tbody tr').eq(0).children();
	
		for ( i=0 ; i<visibleColumns.length ; i++ ) {
			// Use getBounding for sub-pixel accuracy, which we then want to round up!
			var bounding = bodyCells[i].getBoundingClientRect().width;
	
			// Total is tracked to remove any sub-pixel errors as the outerWidth
			// of the table might not equal the total given here
			total += bounding;
	
			// Width for each column to use
			columns[ visibleColumns[i] ].sWidth = _fnStringToCss( bounding );
		}
	
		table.style.width = _fnStringToCss( total );
	
		// Finished with the table - ditch it
		holder.remove();
	
		// If there is a width attr, we want to attach an event listener which
		// allows the table sizing to automatically adjust when the window is
		// resized. Use the width attr rather than CSS, since we can't know if the
		// CSS is a relative value or absolute - DOM read is always px.
		if ( tableWidthAttr ) {
			table.style.width = _fnStringToCss( tableWidthAttr );
		}
	
		if ( (tableWidthAttr || scrollX) && ! settings._reszEvt ) {
			var bindResize = function () {
				$(window).on('resize.DT-'+settings.sInstance, DataTable.util.throttle( function () {
					if (! settings.bDestroying) {
						_fnAdjustColumnSizing( settings );
					}
				} ) );
			};
	
			bindResize();
	
			settings._reszEvt = true;
		}
	}
	
	
	/**
	 * Get the maximum strlen for each data column
	 *  @param {object} settings dataTables settings object
	 *  @param {int} colIdx column of interest
	 *  @returns {string} string of the max length
	 *  @memberof DataTable#oApi
	 */
	function _fnGetMaxLenString( settings, colIdx )
	{
		var column = settings.aoColumns[colIdx];
	
		if (! column.maxLenString) {
			var s, max='', maxLen = -1;
		
			for ( var i=0, ien=settings.aiDisplayMaster.length ; i<ien ; i++ ) {
				var rowIdx = settings.aiDisplayMaster[i];
				var data = _fnGetRowDisplay(settings, rowIdx)[colIdx];
	
				var cellString = data && typeof data === 'object' && data.nodeType
					? data.innerHTML
					: data+'';
	
				// Remove id / name attributes from elements so they
				// don't interfere with existing elements
				cellString = cellString
					.replace(/id=".*?"/g, '')
					.replace(/name=".*?"/g, '');
	
				s = _stripHtml(cellString)
					.replace( /&nbsp;/g, ' ' );
		
				if ( s.length > maxLen ) {
					// We want the HTML in the string, but the length that
					// is important is the stripped string
					max = cellString;
					maxLen = s.length;
				}
			}
	
			column.maxLenString = max;
		}
	
		return column.maxLenString;
	}
	
	
	/**
	 * Append a CSS unit (only if required) to a string
	 *  @param {string} value to css-ify
	 *  @returns {string} value with css unit
	 *  @memberof DataTable#oApi
	 */
	function _fnStringToCss( s )
	{
		if ( s === null ) {
			return '0px';
		}
	
		if ( typeof s == 'number' ) {
			return s < 0 ?
				'0px' :
				s+'px';
		}
	
		// Check it has a unit character already
		return s.match(/\d$/) ?
			s+'px' :
			s;
	}
	
	/**
	 * Re-insert the `col` elements for current visibility
	 *
	 * @param {*} settings DT settings
	 */
	function _colGroup( settings ) {
		var cols = settings.aoColumns;
	
		settings.colgroup.empty();
	
		for (i=0 ; i<cols.length ; i++) {
			if (cols[i].bVisible) {
				settings.colgroup.append(cols[i].colEl);
			}
		}
	}
	
	
	function _fnSortInit( settings ) {
		var target = settings.nTHead;
		var headerRows = target.querySelectorAll('tr');
		var legacyTop = settings.bSortCellsTop;
		var notSelector = ':not([data-dt-order="disable"]):not([data-dt-order="icon-only"])';
		
		// Legacy support for `orderCellsTop`
		if (legacyTop === true) {
			target = headerRows[0];
		}
		else if (legacyTop === false) {
			target = headerRows[ headerRows.length - 1 ];
		}
	
		_fnSortAttachListener(
			settings,
			target,
			target === settings.nTHead
				? 'tr'+notSelector+' th'+notSelector+', tr'+notSelector+' td'+notSelector
				: 'th'+notSelector+', td'+notSelector
		);
	
		// Need to resolve the user input array into our internal structure
		var order = [];
		_fnSortResolve( settings, order, settings.aaSorting );
	
		settings.aaSorting = order;
	}
	
	
	function _fnSortAttachListener(settings, node, selector, column, callback) {
		_fnBindAction( node, selector, function (e) {
			var run = false;
			var columns = column === undefined
				? _fnColumnsFromHeader( e.target )
				: [column];
	
			if ( columns.length ) {
				for ( var i=0, ien=columns.length ; i<ien ; i++ ) {
					var ret = _fnSortAdd( settings, columns[i], i, e.shiftKey );
	
					if (ret !== false) {
						run = true;
					}					
	
					// If the first entry is no sort, then subsequent
					// sort columns are ignored
					if (settings.aaSorting.length === 1 && settings.aaSorting[0][1] === '') {
						break;
					}
				}
	
				if (run) {
					_fnProcessingDisplay( settings, true );
	
					// Allow the processing display to show
					setTimeout( function () {
						_fnSort( settings );
						_fnSortDisplay( settings, settings.aiDisplay );
	
						// Sort processing done - redraw has its own processing display
						_fnProcessingDisplay( settings, false );
	
						_fnReDraw( settings, false, false );
	
						if (callback) {
							callback();
						}
					}, 0);
				}
			}
		} );
	}
	
	/**
	 * Sort the display array to match the master's order
	 * @param {*} settings
	 */
	function _fnSortDisplay(settings, display) {
		if (display.length < 2) {
			return;
		}
	
		var master = settings.aiDisplayMaster;
		var masterMap = {};
		var map = {};
		var i;
	
		// Rather than needing an `indexOf` on master array, we can create a map
		for (i=0 ; i<master.length ; i++) {
			masterMap[master[i]] = i;
		}
	
		// And then cache what would be the indexOf fom the display
		for (i=0 ; i<display.length ; i++) {
			map[display[i]] = masterMap[display[i]];
		}
	
		display.sort(function(a, b){
			// Short version of this function is simply `master.indexOf(a) - master.indexOf(b);`
			return map[a] - map[b];
		});
	}
	
	
	function _fnSortResolve (settings, nestedSort, sort) {
		var push = function ( a ) {
			if ($.isPlainObject(a)) {
				if (a.idx !== undefined) {
					// Index based ordering
					nestedSort.push([a.idx, a.dir]);
				}
				else if (a.name) {
					// Name based ordering
					var cols = _pluck( settings.aoColumns, 'sName');
					var idx = cols.indexOf(a.name);
	
					if (idx !== -1) {
						nestedSort.push([idx, a.dir]);
					}
				}
			}
			else {
				// Plain column index and direction pair
				nestedSort.push(a);
			}
		};
	
		if ( $.isPlainObject(sort) ) {
			// Object
			push(sort);
		}
		else if ( sort.length && typeof sort[0] === 'number' ) {
			// 1D array
			push(sort);
		}
		else if ( sort.length ) {
			// 2D array
			for (var z=0; z<sort.length; z++) {
				push(sort[z]); // Object or array
			}
		}
	}
	
	
	function _fnSortFlatten ( settings )
	{
		var
			i, k, kLen,
			aSort = [],
			extSort = DataTable.ext.type.order,
			aoColumns = settings.aoColumns,
			aDataSort, iCol, sType, srcCol,
			fixed = settings.aaSortingFixed,
			fixedObj = $.isPlainObject( fixed ),
			nestedSort = [];
		
		if ( ! settings.oFeatures.bSort ) {
			return aSort;
		}
	
		// Build the sort array, with pre-fix and post-fix options if they have been
		// specified
		if ( Array.isArray( fixed ) ) {
			_fnSortResolve( settings, nestedSort, fixed );
		}
	
		if ( fixedObj && fixed.pre ) {
			_fnSortResolve( settings, nestedSort, fixed.pre );
		}
	
		_fnSortResolve( settings, nestedSort, settings.aaSorting );
	
		if (fixedObj && fixed.post ) {
			_fnSortResolve( settings, nestedSort, fixed.post );
		}
	
		for ( i=0 ; i<nestedSort.length ; i++ )
		{
			srcCol = nestedSort[i][0];
	
			if ( aoColumns[ srcCol ] ) {
				aDataSort = aoColumns[ srcCol ].aDataSort;
	
				for ( k=0, kLen=aDataSort.length ; k<kLen ; k++ )
				{
					iCol = aDataSort[k];
					sType = aoColumns[ iCol ].sType || 'string';
	
					if ( nestedSort[i]._idx === undefined ) {
						nestedSort[i]._idx = aoColumns[iCol].asSorting.indexOf(nestedSort[i][1]);
					}
	
					if ( nestedSort[i][1] ) {
						aSort.push( {
							src:       srcCol,
							col:       iCol,
							dir:       nestedSort[i][1],
							index:     nestedSort[i]._idx,
							type:      sType,
							formatter: extSort[ sType+"-pre" ],
							sorter:    extSort[ sType+"-"+nestedSort[i][1] ]
						} );
					}
				}
			}
		}
	
		return aSort;
	}
	
	/**
	 * Change the order of the table
	 *  @param {object} oSettings dataTables settings object
	 *  @memberof DataTable#oApi
	 */
	function _fnSort ( oSettings, col, dir )
	{
		var
			i, ien, iLen,
			aiOrig = [],
			extSort = DataTable.ext.type.order,
			aoData = oSettings.aoData,
			sortCol,
			displayMaster = oSettings.aiDisplayMaster,
			aSort;
	
		// Resolve any column types that are unknown due to addition or invalidation
		// @todo Can this be moved into a 'data-ready' handler which is called when
		//   data is going to be used in the table?
		_fnColumnTypes( oSettings );
	
		// Allow a specific column to be sorted, which will _not_ alter the display
		// master
		if (col !== undefined) {
			var srcCol = oSettings.aoColumns[col];
			aSort = [{
				src:       col,
				col:       col,
				dir:       dir,
				index:     0,
				type:      srcCol.sType,
				formatter: extSort[ srcCol.sType+"-pre" ],
				sorter:    extSort[ srcCol.sType+"-"+dir ]
			}];
			displayMaster = displayMaster.slice();
		}
		else {
			aSort = _fnSortFlatten( oSettings );
		}
	
		for ( i=0, ien=aSort.length ; i<ien ; i++ ) {
			sortCol = aSort[i];
	
			// Load the data needed for the sort, for each cell
			_fnSortData( oSettings, sortCol.col );
		}
	
		/* No sorting required if server-side or no sorting array */
		if ( _fnDataSource( oSettings ) != 'ssp' && aSort.length !== 0 )
		{
			// Reset the initial positions on each pass so we get a stable sort
			for ( i=0, iLen=displayMaster.length ; i<iLen ; i++ ) {
				aiOrig[ i ] = i;
			}
	
			// If the first sort is desc, then reverse the array to preserve original
			// order, just in reverse
			if (aSort.length && aSort[0].dir === 'desc') {
				aiOrig.reverse();
			}
	
			/* Do the sort - here we want multi-column sorting based on a given data source (column)
			 * and sorting function (from oSort) in a certain direction. It's reasonably complex to
			 * follow on it's own, but this is what we want (example two column sorting):
			 *  fnLocalSorting = function(a,b){
			 *    var test;
			 *    test = oSort['string-asc']('data11', 'data12');
			 *      if (test !== 0)
			 *        return test;
			 *    test = oSort['numeric-desc']('data21', 'data22');
			 *    if (test !== 0)
			 *      return test;
			 *    return oSort['numeric-asc']( aiOrig[a], aiOrig[b] );
			 *  }
			 * Basically we have a test for each sorting column, if the data in that column is equal,
			 * test the next column. If all columns match, then we use a numeric sort on the row
			 * positions in the original data array to provide a stable sort.
			 */
			displayMaster.sort( function ( a, b ) {
				var
					x, y, k, test, sort,
					len=aSort.length,
					dataA = aoData[a]._aSortData,
					dataB = aoData[b]._aSortData;
	
				for ( k=0 ; k<len ; k++ ) {
					sort = aSort[k];
	
					// Data, which may have already been through a `-pre` function
					x = dataA[ sort.col ];
					y = dataB[ sort.col ];
	
					if (sort.sorter) {
						// If there is a custom sorter (`-asc` or `-desc`) for this
						// data type, use it
						test = sort.sorter(x, y);
	
						if ( test !== 0 ) {
							return test;
						}
					}
					else {
						// Otherwise, use generic sorting
						test = x<y ? -1 : x>y ? 1 : 0;
	
						if ( test !== 0 ) {
							return sort.dir === 'asc' ? test : -test;
						}
					}
				}
	
				x = aiOrig[a];
				y = aiOrig[b];
	
				return x<y ? -1 : x>y ? 1 : 0;
			} );
		}
		else if ( aSort.length === 0 ) {
			// Apply index order
			displayMaster.sort(function (x, y) {
				return x<y ? -1 : x>y ? 1 : 0;
			});
		}
	
		if (col === undefined) {
			// Tell the draw function that we have sorted the data
			oSettings.bSorted = true;
	
			_fnCallbackFire( oSettings, null, 'order', [oSettings, aSort] );
		}
	
		return displayMaster;
	}
	
	
	/**
	 * Function to run on user sort request
	 *  @param {object} settings dataTables settings object
	 *  @param {node} attachTo node to attach the handler to
	 *  @param {int} colIdx column sorting index
	 *  @param {int} addIndex Counter
	 *  @param {boolean} [shift=false] Shift click add
	 *  @param {function} [callback] callback function
	 *  @memberof DataTable#oApi
	 */
	function _fnSortAdd ( settings, colIdx, addIndex, shift )
	{
		var col = settings.aoColumns[ colIdx ];
		var sorting = settings.aaSorting;
		var asSorting = col.asSorting;
		var nextSortIdx;
		var next = function ( a, overflow ) {
			var idx = a._idx;
			if ( idx === undefined ) {
				idx = asSorting.indexOf(a[1]);
			}
	
			return idx+1 < asSorting.length ?
				idx+1 :
				overflow ?
					null :
					0;
		};
	
		if ( ! col.bSortable ) {
			return false;
		}
	
		// Convert to 2D array if needed
		if ( typeof sorting[0] === 'number' ) {
			sorting = settings.aaSorting = [ sorting ];
		}
	
		// If appending the sort then we are multi-column sorting
		if ( (shift || addIndex) && settings.oFeatures.bSortMulti ) {
			// Are we already doing some kind of sort on this column?
			var sortIdx = _pluck(sorting, '0').indexOf(colIdx);
	
			if ( sortIdx !== -1 ) {
				// Yes, modify the sort
				nextSortIdx = next( sorting[sortIdx], true );
	
				if ( nextSortIdx === null && sorting.length === 1 ) {
					nextSortIdx = 0; // can't remove sorting completely
				}
	
				if ( nextSortIdx === null ) {
					sorting.splice( sortIdx, 1 );
				}
				else {
					sorting[sortIdx][1] = asSorting[ nextSortIdx ];
					sorting[sortIdx]._idx = nextSortIdx;
				}
			}
			else if (shift) {
				// No sort on this column yet, being added by shift click
				// add it as itself
				sorting.push( [ colIdx, asSorting[0], 0 ] );
				sorting[sorting.length-1]._idx = 0;
			}
			else {
				// No sort on this column yet, being added from a colspan
				// so add with same direction as first column
				sorting.push( [ colIdx, sorting[0][1], 0 ] );
				sorting[sorting.length-1]._idx = 0;
			}
		}
		else if ( sorting.length && sorting[0][0] == colIdx ) {
			// Single column - already sorting on this column, modify the sort
			nextSortIdx = next( sorting[0] );
	
			sorting.length = 1;
			sorting[0][1] = asSorting[ nextSortIdx ];
			sorting[0]._idx = nextSortIdx;
		}
		else {
			// Single column - sort only on this column
			sorting.length = 0;
			sorting.push( [ colIdx, asSorting[0] ] );
			sorting[0]._idx = 0;
		}
	}
	
	
	/**
	 * Set the sorting classes on table's body, Note: it is safe to call this function
	 * when bSort and bSortClasses are false
	 *  @param {object} oSettings dataTables settings object
	 *  @memberof DataTable#oApi
	 */
	function _fnSortingClasses( settings )
	{
		var oldSort = settings.aLastSort;
		var sortClass = settings.oClasses.order.position;
		var sort = _fnSortFlatten( settings );
		var features = settings.oFeatures;
		var i, ien, colIdx;
	
		if ( features.bSort && features.bSortClasses ) {
			// Remove old sorting classes
			for ( i=0, ien=oldSort.length ; i<ien ; i++ ) {
				colIdx = oldSort[i].src;
	
				// Remove column sorting
				$( _pluck( settings.aoData, 'anCells', colIdx ) )
					.removeClass( sortClass + (i<2 ? i+1 : 3) );
			}
	
			// Add new column sorting
			for ( i=0, ien=sort.length ; i<ien ; i++ ) {
				colIdx = sort[i].src;
	
				$( _pluck( settings.aoData, 'anCells', colIdx ) )
					.addClass( sortClass + (i<2 ? i+1 : 3) );
			}
		}
	
		settings.aLastSort = sort;
	}
	
	
	// Get the data to sort a column, be it from cache, fresh (populating the
	// cache), or from a sort formatter
	function _fnSortData( settings, colIdx )
	{
		// Custom sorting function - provided by the sort data type
		var column = settings.aoColumns[ colIdx ];
		var customSort = DataTable.ext.order[ column.sSortDataType ];
		var customData;
	
		if ( customSort ) {
			customData = customSort.call( settings.oInstance, settings, colIdx,
				_fnColumnIndexToVisible( settings, colIdx )
			);
		}
	
		// Use / populate cache
		var row, cellData;
		var formatter = DataTable.ext.type.order[ column.sType+"-pre" ];
		var data = settings.aoData;
	
		for ( var rowIdx=0 ; rowIdx<data.length ; rowIdx++ ) {
			// Sparse array
			if (! data[rowIdx]) {
				continue;
			}
	
			row = data[rowIdx];
	
			if ( ! row._aSortData ) {
				row._aSortData = [];
			}
	
			if ( ! row._aSortData[colIdx] || customSort ) {
				cellData = customSort ?
					customData[rowIdx] : // If there was a custom sort function, use data from there
					_fnGetCellData( settings, rowIdx, colIdx, 'sort' );
	
				row._aSortData[ colIdx ] = formatter ?
					formatter( cellData, settings ) :
					cellData;
			}
		}
	}
	
	
	/**
	 * State information for a table
	 *
	 * @param {*} settings
	 * @returns State object
	 */
	function _fnSaveState ( settings )
	{
		if (settings._bLoadingState) {
			return;
		}
	
		/* Store the interesting variables */
		var state = {
			time:    +new Date(),
			start:   settings._iDisplayStart,
			length:  settings._iDisplayLength,
			order:   $.extend( true, [], settings.aaSorting ),
			search:  $.extend({}, settings.oPreviousSearch),
			columns: settings.aoColumns.map( function ( col, i ) {
				return {
					visible: col.bVisible,
					search: $.extend({}, settings.aoPreSearchCols[i])
				};
			} )
		};
	
		settings.oSavedState = state;
		_fnCallbackFire( settings, "aoStateSaveParams", 'stateSaveParams', [settings, state] );
		
		if ( settings.oFeatures.bStateSave && !settings.bDestroying )
		{
			settings.fnStateSaveCallback.call( settings.oInstance, settings, state );
		}	
	}
	
	
	/**
	 * Attempt to load a saved table state
	 *  @param {object} oSettings dataTables settings object
	 *  @param {object} oInit DataTables init object so we can override settings
	 *  @param {function} callback Callback to execute when the state has been loaded
	 *  @memberof DataTable#oApi
	 */
	function _fnLoadState ( settings, init, callback )
	{
		if ( ! settings.oFeatures.bStateSave ) {
			callback();
			return;
		}
	
		var loaded = function(state) {
			_fnImplementState(settings, state, callback);
		}
	
		var state = settings.fnStateLoadCallback.call( settings.oInstance, settings, loaded );
	
		if ( state !== undefined ) {
			_fnImplementState( settings, state, callback );
		}
		// otherwise, wait for the loaded callback to be executed
	
		return true;
	}
	
	function _fnImplementState ( settings, s, callback) {
		var i, ien;
		var columns = settings.aoColumns;
		settings._bLoadingState = true;
	
		// When StateRestore was introduced the state could now be implemented at any time
		// Not just initialisation. To do this an api instance is required in some places
		var api = settings._bInitComplete ? new DataTable.Api(settings) : null;
	
		if ( ! s || ! s.time ) {
			settings._bLoadingState = false;
			callback();
			return;
		}
	
		// Reject old data
		var duration = settings.iStateDuration;
		if ( duration > 0 && s.time < +new Date() - (duration*1000) ) {
			settings._bLoadingState = false;
			callback();
			return;
		}
	
		// Allow custom and plug-in manipulation functions to alter the saved data set and
		// cancelling of loading by returning false
		var abStateLoad = _fnCallbackFire( settings, 'aoStateLoadParams', 'stateLoadParams', [settings, s] );
		if ( abStateLoad.indexOf(false) !== -1 ) {
			settings._bLoadingState = false;
			callback();
			return;
		}
	
		// Number of columns have changed - all bets are off, no restore of settings
		if ( s.columns && columns.length !== s.columns.length ) {
			settings._bLoadingState = false;
			callback();
			return;
		}
	
		// Store the saved state so it might be accessed at any time
		settings.oLoadedState = $.extend( true, {}, s );
	
		// This is needed for ColReorder, which has to happen first to allow all
		// the stored indexes to be usable. It is not publicly documented.
		_fnCallbackFire( settings, null, 'stateLoadInit', [settings, s], true );
	
		// Page Length
		if ( s.length !== undefined ) {
			// If already initialised just set the value directly so that the select element is also updated
			if (api) {
				api.page.len(s.length)
			}
			else {
				settings._iDisplayLength   = s.length;
			}
		}
	
		// Restore key features - todo - for 1.11 this needs to be done by
		// subscribed events
		if ( s.start !== undefined ) {
			if(api === null) {
				settings._iDisplayStart    = s.start;
				settings.iInitDisplayStart = s.start;
			}
			else {
				_fnPageChange(settings, s.start/settings._iDisplayLength);
			}
		}
	
		// Order
		if ( s.order !== undefined ) {
			settings.aaSorting = [];
			$.each( s.order, function ( i, col ) {
				settings.aaSorting.push( col[0] >= columns.length ?
					[ 0, col[1] ] :
					col
				);
			} );
		}
	
		// Search
		if ( s.search !== undefined ) {
			$.extend( settings.oPreviousSearch, s.search );
		}
	
		// Columns
		if ( s.columns ) {
			for ( i=0, ien=s.columns.length ; i<ien ; i++ ) {
				var col = s.columns[i];
	
				// Visibility
				if ( col.visible !== undefined ) {
					// If the api is defined, the table has been initialised so we need to use it rather than internal settings
					if (api) {
						// Don't redraw the columns on every iteration of this loop, we will do this at the end instead
						api.column(i).visible(col.visible, false);
					}
					else {
						columns[i].bVisible = col.visible;
					}
				}
	
				// Search
				if ( col.search !== undefined ) {
					$.extend( settings.aoPreSearchCols[i], col.search );
				}
			}
			
			// If the api is defined then we need to adjust the columns once the visibility has been changed
			if (api) {
				api.columns.adjust();
			}
		}
	
		settings._bLoadingState = false;
		_fnCallbackFire( settings, 'aoStateLoaded', 'stateLoaded', [settings, s] );
		callback();
	}
	
	/**
	 * Log an error message
	 *  @param {object} settings dataTables settings object
	 *  @param {int} level log error messages, or display them to the user
	 *  @param {string} msg error message
	 *  @param {int} tn Technical note id to get more information about the error.
	 *  @memberof DataTable#oApi
	 */
	function _fnLog( settings, level, msg, tn )
	{
		msg = 'DataTables warning: '+
			(settings ? 'table id='+settings.sTableId+' - ' : '')+msg;
	
		if ( tn ) {
			msg += '. For more information about this error, please see '+
			'https://datatables.net/tn/'+tn;
		}
	
		if ( ! level  ) {
			// Backwards compatibility pre 1.10
			var ext = DataTable.ext;
			var type = ext.sErrMode || ext.errMode;
	
			if ( settings ) {
				_fnCallbackFire( settings, null, 'dt-error', [ settings, tn, msg ], true );
			}
	
			if ( type == 'alert' ) {
				alert( msg );
			}
			else if ( type == 'throw' ) {
				throw new Error(msg);
			}
			else if ( typeof type == 'function' ) {
				type( settings, tn, msg );
			}
		}
		else if ( window.console && console.log ) {
			console.log( msg );
		}
	}
	
	
	/**
	 * See if a property is defined on one object, if so assign it to the other object
	 *  @param {object} ret target object
	 *  @param {object} src source object
	 *  @param {string} name property
	 *  @param {string} [mappedName] name to map too - optional, name used if not given
	 *  @memberof DataTable#oApi
	 */
	function _fnMap( ret, src, name, mappedName )
	{
		if ( Array.isArray( name ) ) {
			$.each( name, function (i, val) {
				if ( Array.isArray( val ) ) {
					_fnMap( ret, src, val[0], val[1] );
				}
				else {
					_fnMap( ret, src, val );
				}
			} );
	
			return;
		}
	
		if ( mappedName === undefined ) {
			mappedName = name;
		}
	
		if ( src[name] !== undefined ) {
			ret[mappedName] = src[name];
		}
	}
	
	
	/**
	 * Extend objects - very similar to jQuery.extend, but deep copy objects, and
	 * shallow copy arrays. The reason we need to do this, is that we don't want to
	 * deep copy array init values (such as aaSorting) since the dev wouldn't be
	 * able to override them, but we do want to deep copy arrays.
	 *  @param {object} out Object to extend
	 *  @param {object} extender Object from which the properties will be applied to
	 *      out
	 *  @param {boolean} breakRefs If true, then arrays will be sliced to take an
	 *      independent copy with the exception of the `data` or `aaData` parameters
	 *      if they are present. This is so you can pass in a collection to
	 *      DataTables and have that used as your data source without breaking the
	 *      references
	 *  @returns {object} out Reference, just for convenience - out === the return.
	 *  @memberof DataTable#oApi
	 *  @todo This doesn't take account of arrays inside the deep copied objects.
	 */
	function _fnExtend( out, extender, breakRefs )
	{
		var val;
	
		for ( var prop in extender ) {
			if ( Object.prototype.hasOwnProperty.call(extender, prop) ) {
				val = extender[prop];
	
				if ( $.isPlainObject( val ) ) {
					if ( ! $.isPlainObject( out[prop] ) ) {
						out[prop] = {};
					}
					$.extend( true, out[prop], val );
				}
				else if ( breakRefs && prop !== 'data' && prop !== 'aaData' && Array.isArray(val) ) {
					out[prop] = val.slice();
				}
				else {
					out[prop] = val;
				}
			}
		}
	
		return out;
	}
	
	
	/**
	 * Bind an event handers to allow a click or return key to activate the callback.
	 * This is good for accessibility since a return on the keyboard will have the
	 * same effect as a click, if the element has focus.
	 *  @param {element} n Element to bind the action to
	 *  @param {object|string} selector Selector (for delegated events) or data object
	 *   to pass to the triggered function
	 *  @param {function} fn Callback function for when the event is triggered
	 *  @memberof DataTable#oApi
	 */
	function _fnBindAction( n, selector, fn )
	{
		$(n)
			.on( 'click.DT', selector, function (e) {
				fn(e);
			} )
			.on( 'keypress.DT', selector, function (e){
				if ( e.which === 13 ) {
					e.preventDefault();
					fn(e);
				}
			} )
			.on( 'selectstart.DT', selector, function () {
				// Don't want a double click resulting in text selection
				return false;
			} );
	}
	
	
	/**
	 * Register a callback function. Easily allows a callback function to be added to
	 * an array store of callback functions that can then all be called together.
	 *  @param {object} settings dataTables settings object
	 *  @param {string} store Name of the array storage for the callbacks in oSettings
	 *  @param {function} fn Function to be called back
	 *  @memberof DataTable#oApi
	 */
	function _fnCallbackReg( settings, store, fn )
	{
		if ( fn ) {
			settings[store].push(fn);
		}
	}
	
	
	/**
	 * Fire callback functions and trigger events. Note that the loop over the
	 * callback array store is done backwards! Further note that you do not want to
	 * fire off triggers in time sensitive applications (for example cell creation)
	 * as its slow.
	 *  @param {object} settings dataTables settings object
	 *  @param {string} callbackArr Name of the array storage for the callbacks in
	 *      oSettings
	 *  @param {string} eventName Name of the jQuery custom event to trigger. If
	 *      null no trigger is fired
	 *  @param {array} args Array of arguments to pass to the callback function /
	 *      trigger
	 *  @param {boolean} [bubbles] True if the event should bubble
	 *  @memberof DataTable#oApi
	 */
	function _fnCallbackFire( settings, callbackArr, eventName, args, bubbles )
	{
		var ret = [];
	
		if ( callbackArr ) {
			ret = settings[callbackArr].slice().reverse().map( function (val) {
				return val.apply( settings.oInstance, args );
			} );
		}
	
		if ( eventName !== null) {
			var e = $.Event( eventName+'.dt' );
			var table = $(settings.nTable);
			
			// Expose the DataTables API on the event object for easy access
			e.dt = settings.api;
	
			table[bubbles ?  'trigger' : 'triggerHandler']( e, args );
	
			// If not yet attached to the document, trigger the event
			// on the body directly to sort of simulate the bubble
			if (bubbles && table.parents('body').length === 0) {
				$('body').trigger( e, args );
			}
	
			ret.push( e.result );
		}
	
		return ret;
	}
	
	
	function _fnLengthOverflow ( settings )
	{
		var
			start = settings._iDisplayStart,
			end = settings.fnDisplayEnd(),
			len = settings._iDisplayLength;
	
		/* If we have space to show extra rows (backing up from the end point - then do so */
		if ( start >= end )
		{
			start = end - len;
		}
	
		// Keep the start record on the current page
		start -= (start % len);
	
		if ( len === -1 || start < 0 )
		{
			start = 0;
		}
	
		settings._iDisplayStart = start;
	}
	
	
	function _fnRenderer( settings, type )
	{
		var renderer = settings.renderer;
		var host = DataTable.ext.renderer[type];
	
		if ( $.isPlainObject( renderer ) && renderer[type] ) {
			// Specific renderer for this type. If available use it, otherwise use
			// the default.
			return host[renderer[type]] || host._;
		}
		else if ( typeof renderer === 'string' ) {
			// Common renderer - if there is one available for this type use it,
			// otherwise use the default
			return host[renderer] || host._;
		}
	
		// Use the default
		return host._;
	}
	
	
	/**
	 * Detect the data source being used for the table. Used to simplify the code
	 * a little (ajax) and to make it compress a little smaller.
	 *
	 *  @param {object} settings dataTables settings object
	 *  @returns {string} Data source
	 *  @memberof DataTable#oApi
	 */
	function _fnDataSource ( settings )
	{
		if ( settings.oFeatures.bServerSide ) {
			return 'ssp';
		}
		else if ( settings.ajax ) {
			return 'ajax';
		}
		return 'dom';
	}
	
	/**
	 * Common replacement for language strings
	 *
	 * @param {*} settings DT settings object
	 * @param {*} str String with values to replace
	 * @param {*} entries Plural number for _ENTRIES_ - can be undefined
	 * @returns String
	 */
	function _fnMacros ( settings, str, entries )
	{
		// When infinite scrolling, we are always starting at 1. _iDisplayStart is
		// used only internally
		var
			formatter  = settings.fnFormatNumber,
			start      = settings._iDisplayStart+1,
			len        = settings._iDisplayLength,
			vis        = settings.fnRecordsDisplay(),
			max        = settings.fnRecordsTotal(),
			all        = len === -1;
	
		return str.
			replace(/_START_/g, formatter.call( settings, start ) ).
			replace(/_END_/g,   formatter.call( settings, settings.fnDisplayEnd() ) ).
			replace(/_MAX_/g,   formatter.call( settings, max ) ).
			replace(/_TOTAL_/g, formatter.call( settings, vis ) ).
			replace(/_PAGE_/g,  formatter.call( settings, all ? 1 : Math.ceil( start / len ) ) ).
			replace(/_PAGES_/g, formatter.call( settings, all ? 1 : Math.ceil( vis / len ) ) ).
			replace(/_ENTRIES_/g, settings.api.i18n('entries', '', entries) ).
			replace(/_ENTRIES-MAX_/g, settings.api.i18n('entries', '', max) ).
			replace(/_ENTRIES-TOTAL_/g, settings.api.i18n('entries', '', vis) );
	}
	
	
	
	/**
	 * Computed structure of the DataTables API, defined by the options passed to
	 * `DataTable.Api.register()` when building the API.
	 *
	 * The structure is built in order to speed creation and extension of the Api
	 * objects since the extensions are effectively pre-parsed.
	 *
	 * The array is an array of objects with the following structure, where this
	 * base array represents the Api prototype base:
	 *
	 *     [
	 *       {
	 *         name:      'data'                -- string   - Property name
	 *         val:       function () {},       -- function - Api method (or undefined if just an object
	 *         methodExt: [ ... ],              -- array    - Array of Api object definitions to extend the method result
	 *         propExt:   [ ... ]               -- array    - Array of Api object definitions to extend the property
	 *       },
	 *       {
	 *         name:     'row'
	 *         val:       {},
	 *         methodExt: [ ... ],
	 *         propExt:   [
	 *           {
	 *             name:      'data'
	 *             val:       function () {},
	 *             methodExt: [ ... ],
	 *             propExt:   [ ... ]
	 *           },
	 *           ...
	 *         ]
	 *       }
	 *     ]
	 *
	 * @type {Array}
	 * @ignore
	 */
	var __apiStruct = [];
	
	
	/**
	 * `Array.prototype` reference.
	 *
	 * @type object
	 * @ignore
	 */
	var __arrayProto = Array.prototype;
	
	
	/**
	 * Abstraction for `context` parameter of the `Api` constructor to allow it to
	 * take several different forms for ease of use.
	 *
	 * Each of the input parameter types will be converted to a DataTables settings
	 * object where possible.
	 *
	 * @param  {string|node|jQuery|object} mixed DataTable identifier. Can be one
	 *   of:
	 *
	 *   * `string` - jQuery selector. Any DataTables' matching the given selector
	 *     with be found and used.
	 *   * `node` - `TABLE` node which has already been formed into a DataTable.
	 *   * `jQuery` - A jQuery object of `TABLE` nodes.
	 *   * `object` - DataTables settings object
	 *   * `DataTables.Api` - API instance
	 * @return {array|null} Matching DataTables settings objects. `null` or
	 *   `undefined` is returned if no matching DataTable is found.
	 * @ignore
	 */
	var _toSettings = function ( mixed )
	{
		var idx, jq;
		var settings = DataTable.settings;
		var tables = _pluck(settings, 'nTable');
	
		if ( ! mixed ) {
			return [];
		}
		else if ( mixed.nTable && mixed.oFeatures ) {
			// DataTables settings object
			return [ mixed ];
		}
		else if ( mixed.nodeName && mixed.nodeName.toLowerCase() === 'table' ) {
			// Table node
			idx = tables.indexOf(mixed);
			return idx !== -1 ? [ settings[idx] ] : null;
		}
		else if ( mixed && typeof mixed.settings === 'function' ) {
			return mixed.settings().toArray();
		}
		else if ( typeof mixed === 'string' ) {
			// jQuery selector
			jq = $(mixed).get();
		}
		else if ( mixed instanceof $ ) {
			// jQuery object (also DataTables instance)
			jq = mixed.get();
		}
	
		if ( jq ) {
			return settings.filter(function (v, idx) {
				return jq.includes(tables[idx]);
			});
		}
	};
	
	
	/**
	 * DataTables API class - used to control and interface with  one or more
	 * DataTables enhanced tables.
	 *
	 * The API class is heavily based on jQuery, presenting a chainable interface
	 * that you can use to interact with tables. Each instance of the API class has
	 * a "context" - i.e. the tables that it will operate on. This could be a single
	 * table, all tables on a page or a sub-set thereof.
	 *
	 * Additionally the API is designed to allow you to easily work with the data in
	 * the tables, retrieving and manipulating it as required. This is done by
	 * presenting the API class as an array like interface. The contents of the
	 * array depend upon the actions requested by each method (for example
	 * `rows().nodes()` will return an array of nodes, while `rows().data()` will
	 * return an array of objects or arrays depending upon your table's
	 * configuration). The API object has a number of array like methods (`push`,
	 * `pop`, `reverse` etc) as well as additional helper methods (`each`, `pluck`,
	 * `unique` etc) to assist your working with the data held in a table.
	 *
	 * Most methods (those which return an Api instance) are chainable, which means
	 * the return from a method call also has all of the methods available that the
	 * top level object had. For example, these two calls are equivalent:
	 *
	 *     // Not chained
	 *     api.row.add( {...} );
	 *     api.draw();
	 *
	 *     // Chained
	 *     api.row.add( {...} ).draw();
	 *
	 * @class DataTable.Api
	 * @param {array|object|string|jQuery} context DataTable identifier. This is
	 *   used to define which DataTables enhanced tables this API will operate on.
	 *   Can be one of:
	 *
	 *   * `string` - jQuery selector. Any DataTables' matching the given selector
	 *     with be found and used.
	 *   * `node` - `TABLE` node which has already been formed into a DataTable.
	 *   * `jQuery` - A jQuery object of `TABLE` nodes.
	 *   * `object` - DataTables settings object
	 * @param {array} [data] Data to initialise the Api instance with.
	 *
	 * @example
	 *   // Direct initialisation during DataTables construction
	 *   var api = $('#example').DataTable();
	 *
	 * @example
	 *   // Initialisation using a DataTables jQuery object
	 *   var api = $('#example').dataTable().api();
	 *
	 * @example
	 *   // Initialisation as a constructor
	 *   var api = new DataTable.Api( 'table.dataTable' );
	 */
	_Api = function ( context, data )
	{
		if ( ! (this instanceof _Api) ) {
			return new _Api( context, data );
		}
	
		var settings = [];
		var ctxSettings = function ( o ) {
			var a = _toSettings( o );
			if ( a ) {
				settings.push.apply( settings, a );
			}
		};
	
		if ( Array.isArray( context ) ) {
			for ( var i=0, ien=context.length ; i<ien ; i++ ) {
				ctxSettings( context[i] );
			}
		}
		else {
			ctxSettings( context );
		}
	
		// Remove duplicates
		this.context = settings.length > 1
			? _unique( settings )
			: settings;
	
		// Initial data
		if ( data ) {
			this.push.apply(this, data);
		}
	
		// selector
		this.selector = {
			rows: null,
			cols: null,
			opts: null
		};
	
		_Api.extend( this, this, __apiStruct );
	};
	
	DataTable.Api = _Api;
	
	// Don't destroy the existing prototype, just extend it. Required for jQuery 2's
	// isPlainObject.
	$.extend( _Api.prototype, {
		any: function ()
		{
			return this.count() !== 0;
		},
	
		context: [], // array of table settings objects
	
		count: function ()
		{
			return this.flatten().length;
		},
	
		each: function ( fn )
		{
			for ( var i=0, ien=this.length ; i<ien; i++ ) {
				fn.call( this, this[i], i, this );
			}
	
			return this;
		},
	
		eq: function ( idx )
		{
			var ctx = this.context;
	
			return ctx.length > idx ?
				new _Api( ctx[idx], this[idx] ) :
				null;
		},
	
		filter: function ( fn )
		{
			var a = __arrayProto.filter.call( this, fn, this );
	
			return new _Api( this.context, a );
		},
	
		flatten: function ()
		{
			var a = [];
	
			return new _Api( this.context, a.concat.apply( a, this.toArray() ) );
		},
	
		get: function ( idx )
		{
			return this[ idx ];
		},
	
		join:    __arrayProto.join,
	
		includes: function ( find ) {
			return this.indexOf( find ) === -1 ? false : true;
		},
	
		indexOf: __arrayProto.indexOf,
	
		iterator: function ( flatten, type, fn, alwaysNew ) {
			var
				a = [], ret,
				i, ien, j, jen,
				context = this.context,
				rows, items, item,
				selector = this.selector;
	
			// Argument shifting
			if ( typeof flatten === 'string' ) {
				alwaysNew = fn;
				fn = type;
				type = flatten;
				flatten = false;
			}
	
			for ( i=0, ien=context.length ; i<ien ; i++ ) {
				var apiInst = new _Api( context[i] );
	
				if ( type === 'table' ) {
					ret = fn.call( apiInst, context[i], i );
	
					if ( ret !== undefined ) {
						a.push( ret );
					}
				}
				else if ( type === 'columns' || type === 'rows' ) {
					// this has same length as context - one entry for each table
					ret = fn.call( apiInst, context[i], this[i], i );
	
					if ( ret !== undefined ) {
						a.push( ret );
					}
				}
				else if ( type === 'every' || type === 'column' || type === 'column-rows' || type === 'row' || type === 'cell' ) {
					// columns and rows share the same structure.
					// 'this' is an array of column indexes for each context
					items = this[i];
	
					if ( type === 'column-rows' ) {
						rows = _selector_row_indexes( context[i], selector.opts );
					}
	
					for ( j=0, jen=items.length ; j<jen ; j++ ) {
						item = items[j];
	
						if ( type === 'cell' ) {
							ret = fn.call( apiInst, context[i], item.row, item.column, i, j );
						}
						else {
							ret = fn.call( apiInst, context[i], item, i, j, rows );
						}
	
						if ( ret !== undefined ) {
							a.push( ret );
						}
					}
				}
			}
	
			if ( a.length || alwaysNew ) {
				var api = new _Api( context, flatten ? a.concat.apply( [], a ) : a );
				var apiSelector = api.selector;
				apiSelector.rows = selector.rows;
				apiSelector.cols = selector.cols;
				apiSelector.opts = selector.opts;
				return api;
			}
			return this;
		},
	
		lastIndexOf: __arrayProto.lastIndexOf,
	
		length:  0,
	
		map: function ( fn )
		{
			var a = __arrayProto.map.call( this, fn, this );
	
			return new _Api( this.context, a );
		},
	
		pluck: function ( prop )
		{
			var fn = DataTable.util.get(prop);
	
			return this.map( function ( el ) {
				return fn(el);
			} );
		},
	
		pop:     __arrayProto.pop,
	
		push:    __arrayProto.push,
	
		reduce: __arrayProto.reduce,
	
		reduceRight: __arrayProto.reduceRight,
	
		reverse: __arrayProto.reverse,
	
		// Object with rows, columns and opts
		selector: null,
	
		shift:   __arrayProto.shift,
	
		slice: function () {
			return new _Api( this.context, this );
		},
	
		sort:    __arrayProto.sort,
	
		splice:  __arrayProto.splice,
	
		toArray: function ()
		{
			return __arrayProto.slice.call( this );
		},
	
		to$: function ()
		{
			return $( this );
		},
	
		toJQuery: function ()
		{
			return $( this );
		},
	
		unique: function ()
		{
			return new _Api( this.context, _unique(this.toArray()) );
		},
	
		unshift: __arrayProto.unshift
	} );
	
	
	function _api_scope( scope, fn, struc ) {
		return function () {
			var ret = fn.apply( scope || this, arguments );
	
			// Method extension
			_Api.extend( ret, ret, struc.methodExt );
			return ret;
		};
	}
	
	function _api_find( src, name ) {
		for ( var i=0, ien=src.length ; i<ien ; i++ ) {
			if ( src[i].name === name ) {
				return src[i];
			}
		}
		return null;
	}
	
	window.__apiStruct = __apiStruct;
	
	_Api.extend = function ( scope, obj, ext )
	{
		// Only extend API instances and static properties of the API
		if ( ! ext.length || ! obj || ( ! (obj instanceof _Api) && ! obj.__dt_wrapper ) ) {
			return;
		}
	
		var
			i, ien,
			struct;
	
		for ( i=0, ien=ext.length ; i<ien ; i++ ) {
			struct = ext[i];
	
			if (struct.name === '__proto__') {
				continue;
			}
	
			// Value
			obj[ struct.name ] = struct.type === 'function' ?
				_api_scope( scope, struct.val, struct ) :
				struct.type === 'object' ?
					{} :
					struct.val;
	
			obj[ struct.name ].__dt_wrapper = true;
	
			// Property extension
			_Api.extend( scope, obj[ struct.name ], struct.propExt );
		}
	};
	
	//     [
	//       {
	//         name:      'data'                -- string   - Property name
	//         val:       function () {},       -- function - Api method (or undefined if just an object
	//         methodExt: [ ... ],              -- array    - Array of Api object definitions to extend the method result
	//         propExt:   [ ... ]               -- array    - Array of Api object definitions to extend the property
	//       },
	//       {
	//         name:     'row'
	//         val:       {},
	//         methodExt: [ ... ],
	//         propExt:   [
	//           {
	//             name:      'data'
	//             val:       function () {},
	//             methodExt: [ ... ],
	//             propExt:   [ ... ]
	//           },
	//           ...
	//         ]
	//       }
	//     ]
	
	
	_Api.register = _api_register = function ( name, val )
	{
		if ( Array.isArray( name ) ) {
			for ( var j=0, jen=name.length ; j<jen ; j++ ) {
				_Api.register( name[j], val );
			}
			return;
		}
	
		var
			i, ien,
			heir = name.split('.'),
			struct = __apiStruct,
			key, method;
	
		for ( i=0, ien=heir.length ; i<ien ; i++ ) {
			method = heir[i].indexOf('()') !== -1;
			key = method ?
				heir[i].replace('()', '') :
				heir[i];
	
			var src = _api_find( struct, key );
			if ( ! src ) {
				src = {
					name:      key,
					val:       {},
					methodExt: [],
					propExt:   [],
					type:      'object'
				};
				struct.push( src );
			}
	
			if ( i === ien-1 ) {
				src.val = val;
				src.type = typeof val === 'function' ?
					'function' :
					$.isPlainObject( val ) ?
						'object' :
						'other';
			}
			else {
				struct = method ?
					src.methodExt :
					src.propExt;
			}
		}
	};
	
	_Api.registerPlural = _api_registerPlural = function ( pluralName, singularName, val ) {
		_Api.register( pluralName, val );
	
		_Api.register( singularName, function () {
			var ret = val.apply( this, arguments );
	
			if ( ret === this ) {
				// Returned item is the API instance that was passed in, return it
				return this;
			}
			else if ( ret instanceof _Api ) {
				// New API instance returned, want the value from the first item
				// in the returned array for the singular result.
				return ret.length ?
					Array.isArray( ret[0] ) ?
						new _Api( ret.context, ret[0] ) : // Array results are 'enhanced'
						ret[0] :
					undefined;
			}
	
			// Non-API return - just fire it back
			return ret;
		} );
	};
	
	
	/**
	 * Selector for HTML tables. Apply the given selector to the give array of
	 * DataTables settings objects.
	 *
	 * @param {string|integer} [selector] jQuery selector string or integer
	 * @param  {array} Array of DataTables settings objects to be filtered
	 * @return {array}
	 * @ignore
	 */
	var __table_selector = function ( selector, a )
	{
		if ( Array.isArray(selector) ) {
			var result = [];
	
			selector.forEach(function (sel) {
				var inner = __table_selector(sel, a);
	
				result.push.apply(result, inner);
			});
	
			return result.filter( function (item) {
				return item;
			});
		}
	
		// Integer is used to pick out a table by index
		if ( typeof selector === 'number' ) {
			return [ a[ selector ] ];
		}
	
		// Perform a jQuery selector on the table nodes
		var nodes = a.map( function (el) {
			return el.nTable;
		} );
	
		return $(nodes)
			.filter( selector )
			.map( function () {
				// Need to translate back from the table node to the settings
				var idx = nodes.indexOf(this);
				return a[ idx ];
			} )
			.toArray();
	};
	
	
	
	/**
	 * Context selector for the API's context (i.e. the tables the API instance
	 * refers to.
	 *
	 * @name    DataTable.Api#tables
	 * @param {string|integer} [selector] Selector to pick which tables the iterator
	 *   should operate on. If not given, all tables in the current context are
	 *   used. This can be given as a jQuery selector (for example `':gt(0)'`) to
	 *   select multiple tables or as an integer to select a single table.
	 * @returns {DataTable.Api} Returns a new API instance if a selector is given.
	 */
	_api_register( 'tables()', function ( selector ) {
		// A new instance is created if there was a selector specified
		return selector !== undefined && selector !== null ?
			new _Api( __table_selector( selector, this.context ) ) :
			this;
	} );
	
	
	_api_register( 'table()', function ( selector ) {
		var tables = this.tables( selector );
		var ctx = tables.context;
	
		// Truncate to the first matched table
		return ctx.length ?
			new _Api( ctx[0] ) :
			tables;
	} );
	
	// Common methods, combined to reduce size
	[
		['nodes', 'node', 'nTable'],
		['body', 'body', 'nTBody'],
		['header', 'header', 'nTHead'],
		['footer', 'footer', 'nTFoot'],
	].forEach(function (item) {
		_api_registerPlural(
			'tables().' + item[0] + '()',
			'table().' + item[1] + '()' ,
			function () {
				return this.iterator( 'table', function ( ctx ) {
					return ctx[item[2]];
				}, 1 );
			}
		);
	});
	
	// Structure methods
	[
		['header', 'aoHeader'],
		['footer', 'aoFooter'],
	].forEach(function (item) {
		_api_register( 'table().' + item[0] + '.structure()' , function (selector) {
			var indexes = this.columns(selector).indexes().flatten();
			var ctx = this.context[0];
			
			return _fnHeaderLayout(ctx, ctx[item[1]], indexes);
		} );
	})
	
	
	_api_registerPlural( 'tables().containers()', 'table().container()' , function () {
		return this.iterator( 'table', function ( ctx ) {
			return ctx.nTableWrapper;
		}, 1 );
	} );
	
	_api_register( 'tables().every()', function ( fn ) {
		var that = this;
	
		return this.iterator('table', function (s, i) {
			fn.call(that.table(i), i);
		});
	});
	
	_api_register( 'caption()', function ( value, side ) {
		var context = this.context;
	
		// Getter - return existing node's content
		if ( value === undefined ) {
			var caption = context[0].captionNode;
	
			return caption && context.length ?
				caption.innerHTML : 
				null;
		}
	
		return this.iterator( 'table', function ( ctx ) {
			var table = $(ctx.nTable);
			var caption = $(ctx.captionNode);
			var container = $(ctx.nTableWrapper);
	
			// Create the node if it doesn't exist yet
			if ( ! caption.length ) {
				caption = $('<caption/>').html( value );
				ctx.captionNode = caption[0];
	
				// If side isn't set, we need to insert into the document to let the
				// CSS decide so we can read it back, otherwise there is no way to
				// know if the CSS would put it top or bottom for scrolling
				if (! side) {
					table.prepend(caption);
	
					side = caption.css('caption-side');
				}
			}
	
			caption.html( value );
	
			if ( side ) {
				caption.css( 'caption-side', side );
				caption[0]._captionSide = side;
			}
	
			if (container.find('div.dataTables_scroll').length) {
				var selector = (side === 'top' ? 'Head' : 'Foot');
	
				container.find('div.dataTables_scroll'+ selector +' table').prepend(caption);
			}
			else {
				table.prepend(caption);
			}
		}, 1 );
	} );
	
	_api_register( 'caption.node()', function () {
		var ctx = this.context;
	
		return ctx.length ? ctx[0].captionNode : null;
	} );
	
	
	/**
	 * Redraw the tables in the current context.
	 */
	_api_register( 'draw()', function ( paging ) {
		return this.iterator( 'table', function ( settings ) {
			if ( paging === 'page' ) {
				_fnDraw( settings );
			}
			else {
				if ( typeof paging === 'string' ) {
					paging = paging === 'full-hold' ?
						false :
						true;
				}
	
				_fnReDraw( settings, paging===false );
			}
		} );
	} );
	
	
	
	/**
	 * Get the current page index.
	 *
	 * @return {integer} Current page index (zero based)
	 *//**
	 * Set the current page.
	 *
	 * Note that if you attempt to show a page which does not exist, DataTables will
	 * not throw an error, but rather reset the paging.
	 *
	 * @param {integer|string} action The paging action to take. This can be one of:
	 *  * `integer` - The page index to jump to
	 *  * `string` - An action to take:
	 *    * `first` - Jump to first page.
	 *    * `next` - Jump to the next page
	 *    * `previous` - Jump to previous page
	 *    * `last` - Jump to the last page.
	 * @returns {DataTables.Api} this
	 */
	_api_register( 'page()', function ( action ) {
		if ( action === undefined ) {
			return this.page.info().page; // not an expensive call
		}
	
		// else, have an action to take on all tables
		return this.iterator( 'table', function ( settings ) {
			_fnPageChange( settings, action );
		} );
	} );
	
	
	/**
	 * Paging information for the first table in the current context.
	 *
	 * If you require paging information for another table, use the `table()` method
	 * with a suitable selector.
	 *
	 * @return {object} Object with the following properties set:
	 *  * `page` - Current page index (zero based - i.e. the first page is `0`)
	 *  * `pages` - Total number of pages
	 *  * `start` - Display index for the first record shown on the current page
	 *  * `end` - Display index for the last record shown on the current page
	 *  * `length` - Display length (number of records). Note that generally `start
	 *    + length = end`, but this is not always true, for example if there are
	 *    only 2 records to show on the final page, with a length of 10.
	 *  * `recordsTotal` - Full data set length
	 *  * `recordsDisplay` - Data set length once the current filtering criterion
	 *    are applied.
	 */
	_api_register( 'page.info()', function () {
		if ( this.context.length === 0 ) {
			return undefined;
		}
	
		var
			settings   = this.context[0],
			start      = settings._iDisplayStart,
			len        = settings.oFeatures.bPaginate ? settings._iDisplayLength : -1,
			visRecords = settings.fnRecordsDisplay(),
			all        = len === -1;
	
		return {
			"page":           all ? 0 : Math.floor( start / len ),
			"pages":          all ? 1 : Math.ceil( visRecords / len ),
			"start":          start,
			"end":            settings.fnDisplayEnd(),
			"length":         len,
			"recordsTotal":   settings.fnRecordsTotal(),
			"recordsDisplay": visRecords,
			"serverSide":     _fnDataSource( settings ) === 'ssp'
		};
	} );
	
	
	/**
	 * Get the current page length.
	 *
	 * @return {integer} Current page length. Note `-1` indicates that all records
	 *   are to be shown.
	 *//**
	 * Set the current page length.
	 *
	 * @param {integer} Page length to set. Use `-1` to show all records.
	 * @returns {DataTables.Api} this
	 */
	_api_register( 'page.len()', function ( len ) {
		// Note that we can't call this function 'length()' because `length`
		// is a Javascript property of functions which defines how many arguments
		// the function expects.
		if ( len === undefined ) {
			return this.context.length !== 0 ?
				this.context[0]._iDisplayLength :
				undefined;
		}
	
		// else, set the page length
		return this.iterator( 'table', function ( settings ) {
			_fnLengthChange( settings, len );
		} );
	} );
	
	
	
	var __reload = function ( settings, holdPosition, callback ) {
		// Use the draw event to trigger a callback
		if ( callback ) {
			var api = new _Api( settings );
	
			api.one( 'draw', function () {
				callback( api.ajax.json() );
			} );
		}
	
		if ( _fnDataSource( settings ) == 'ssp' ) {
			_fnReDraw( settings, holdPosition );
		}
		else {
			_fnProcessingDisplay( settings, true );
	
			// Cancel an existing request
			var xhr = settings.jqXHR;
			if ( xhr && xhr.readyState !== 4 ) {
				xhr.abort();
			}
	
			// Trigger xhr
			_fnBuildAjax( settings, {}, function( json ) {
				_fnClearTable( settings );
	
				var data = _fnAjaxDataSrc( settings, json );
				for ( var i=0, ien=data.length ; i<ien ; i++ ) {
					_fnAddData( settings, data[i] );
				}
	
				_fnReDraw( settings, holdPosition );
				_fnInitComplete( settings );
				_fnProcessingDisplay( settings, false );
			} );
		}
	};
	
	
	/**
	 * Get the JSON response from the last Ajax request that DataTables made to the
	 * server. Note that this returns the JSON from the first table in the current
	 * context.
	 *
	 * @return {object} JSON received from the server.
	 */
	_api_register( 'ajax.json()', function () {
		var ctx = this.context;
	
		if ( ctx.length > 0 ) {
			return ctx[0].json;
		}
	
		// else return undefined;
	} );
	
	
	/**
	 * Get the data submitted in the last Ajax request
	 */
	_api_register( 'ajax.params()', function () {
		var ctx = this.context;
	
		if ( ctx.length > 0 ) {
			return ctx[0].oAjaxData;
		}
	
		// else return undefined;
	} );
	
	
	/**
	 * Reload tables from the Ajax data source. Note that this function will
	 * automatically re-draw the table when the remote data has been loaded.
	 *
	 * @param {boolean} [reset=true] Reset (default) or hold the current paging
	 *   position. A full re-sort and re-filter is performed when this method is
	 *   called, which is why the pagination reset is the default action.
	 * @returns {DataTables.Api} this
	 */
	_api_register( 'ajax.reload()', function ( callback, resetPaging ) {
		return this.iterator( 'table', function (settings) {
			__reload( settings, resetPaging===false, callback );
		} );
	} );
	
	
	/**
	 * Get the current Ajax URL. Note that this returns the URL from the first
	 * table in the current context.
	 *
	 * @return {string} Current Ajax source URL
	 *//**
	 * Set the Ajax URL. Note that this will set the URL for all tables in the
	 * current context.
	 *
	 * @param {string} url URL to set.
	 * @returns {DataTables.Api} this
	 */
	_api_register( 'ajax.url()', function ( url ) {
		var ctx = this.context;
	
		if ( url === undefined ) {
			// get
			if ( ctx.length === 0 ) {
				return undefined;
			}
			ctx = ctx[0];
	
			return $.isPlainObject( ctx.ajax ) ?
				ctx.ajax.url :
				ctx.ajax;
		}
	
		// set
		return this.iterator( 'table', function ( settings ) {
			if ( $.isPlainObject( settings.ajax ) ) {
				settings.ajax.url = url;
			}
			else {
				settings.ajax = url;
			}
		} );
	} );
	
	
	/**
	 * Load data from the newly set Ajax URL. Note that this method is only
	 * available when `ajax.url()` is used to set a URL. Additionally, this method
	 * has the same effect as calling `ajax.reload()` but is provided for
	 * convenience when setting a new URL. Like `ajax.reload()` it will
	 * automatically redraw the table once the remote data has been loaded.
	 *
	 * @returns {DataTables.Api} this
	 */
	_api_register( 'ajax.url().load()', function ( callback, resetPaging ) {
		// Same as a reload, but makes sense to present it for easy access after a
		// url change
		return this.iterator( 'table', function ( ctx ) {
			__reload( ctx, resetPaging===false, callback );
		} );
	} );
	
	
	
	
	var _selector_run = function ( type, selector, selectFn, settings, opts )
	{
		var
			out = [], res,
			a, i, ien, j, jen,
			selectorType = typeof selector;
	
		// Can't just check for isArray here, as an API or jQuery instance might be
		// given with their array like look
		if ( ! selector || selectorType === 'string' || selectorType === 'function' || selector.length === undefined ) {
			selector = [ selector ];
		}
	
		for ( i=0, ien=selector.length ; i<ien ; i++ ) {
			// Only split on simple strings - complex expressions will be jQuery selectors
			a = selector[i] && selector[i].split && ! selector[i].match(/[[(:]/) ?
				selector[i].split(',') :
				[ selector[i] ];
	
			for ( j=0, jen=a.length ; j<jen ; j++ ) {
				res = selectFn( typeof a[j] === 'string' ? (a[j]).trim() : a[j] );
	
				// Remove empty items
				res = res.filter( function (item) {
					return item !== null && item !== undefined;
				});
	
				if ( res && res.length ) {
					out = out.concat( res );
				}
			}
		}
	
		// selector extensions
		var ext = _ext.selector[ type ];
		if ( ext.length ) {
			for ( i=0, ien=ext.length ; i<ien ; i++ ) {
				out = ext[i]( settings, opts, out );
			}
		}
	
		return _unique( out );
	};
	
	
	var _selector_opts = function ( opts )
	{
		if ( ! opts ) {
			opts = {};
		}
	
		// Backwards compatibility for 1.9- which used the terminology filter rather
		// than search
		if ( opts.filter && opts.search === undefined ) {
			opts.search = opts.filter;
		}
	
		return $.extend( {
			search: 'none',
			order: 'current',
			page: 'all'
		}, opts );
	};
	
	
	// Reduce the API instance to the first item found
	var _selector_first = function ( old )
	{
		let inst = new _Api(old.context[0]);
	
		// Use a push rather than passing to the constructor, since it will
		// merge arrays down automatically, which isn't what is wanted here
		if (old.length) {
			inst.push( old[0] );
		}
	
		inst.selector = old.selector;
	
		// Limit to a single row / column / cell
		if (inst.length && inst[0].length > 1) {
			inst[0].splice(1);
		}
	
		return inst;
	};
	
	
	var _selector_row_indexes = function ( settings, opts )
	{
		var
			i, ien, tmp, a=[],
			displayFiltered = settings.aiDisplay,
			displayMaster = settings.aiDisplayMaster;
	
		var
			search = opts.search,  // none, applied, removed
			order  = opts.order,   // applied, current, index (original - compatibility with 1.9)
			page   = opts.page;    // all, current
	
		if ( _fnDataSource( settings ) == 'ssp' ) {
			// In server-side processing mode, most options are irrelevant since
			// rows not shown don't exist and the index order is the applied order
			// Removed is a special case - for consistency just return an empty
			// array
			return search === 'removed' ?
				[] :
				_range( 0, displayMaster.length );
		}
	
		if ( page == 'current' ) {
			// Current page implies that order=current and filter=applied, since it is
			// fairly senseless otherwise, regardless of what order and search actually
			// are
			for ( i=settings._iDisplayStart, ien=settings.fnDisplayEnd() ; i<ien ; i++ ) {
				a.push( displayFiltered[i] );
			}
		}
		else if ( order == 'current' || order == 'applied' ) {
			if ( search == 'none') {
				a = displayMaster.slice();
			}
			else if ( search == 'applied' ) {
				a = displayFiltered.slice();
			}
			else if ( search == 'removed' ) {
				// O(n+m) solution by creating a hash map
				var displayFilteredMap = {};
	
				for ( i=0, ien=displayFiltered.length ; i<ien ; i++ ) {
					displayFilteredMap[displayFiltered[i]] = null;
				}
	
				displayMaster.forEach(function (item) {
					if (! Object.prototype.hasOwnProperty.call(displayFilteredMap, item)) {
						a.push(item);
					}
				});
			}
		}
		else if ( order == 'index' || order == 'original' ) {
			for ( i=0, ien=settings.aoData.length ; i<ien ; i++ ) {
				if (! settings.aoData[i]) {
					continue;
				}
	
				if ( search == 'none' ) {
					a.push( i );
				}
				else { // applied | removed
					tmp = displayFiltered.indexOf(i);
	
					if ((tmp === -1 && search == 'removed') ||
						(tmp >= 0   && search == 'applied') )
					{
						a.push( i );
					}
				}
			}
		}
		else if ( typeof order === 'number' ) {
			// Order the rows by the given column
			var ordered = _fnSort(settings, order, 'asc');
	
			if (search === 'none') {
				a = ordered;
			}
			else { // applied | removed
				for (i=0; i<ordered.length; i++) {
					tmp = displayFiltered.indexOf(ordered[i]);
	
					if ((tmp === -1 && search == 'removed') ||
						(tmp >= 0   && search == 'applied') )
					{
						a.push( ordered[i] );
					}
				}
			}
		}
	
		return a;
	};
	
	
	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * Rows
	 *
	 * {}          - no selector - use all available rows
	 * {integer}   - row aoData index
	 * {node}      - TR node
	 * {string}    - jQuery selector to apply to the TR elements
	 * {array}     - jQuery array of nodes, or simply an array of TR nodes
	 *
	 */
	var __row_selector = function ( settings, selector, opts )
	{
		var rows;
		var run = function ( sel ) {
			var selInt = _intVal( sel );
			var aoData = settings.aoData;
	
			// Short cut - selector is a number and no options provided (default is
			// all records, so no need to check if the index is in there, since it
			// must be - dev error if the index doesn't exist).
			if ( selInt !== null && ! opts ) {
				return [ selInt ];
			}
	
			if ( ! rows ) {
				rows = _selector_row_indexes( settings, opts );
			}
	
			if ( selInt !== null && rows.indexOf(selInt) !== -1 ) {
				// Selector - integer
				return [ selInt ];
			}
			else if ( sel === null || sel === undefined || sel === '' ) {
				// Selector - none
				return rows;
			}
	
			// Selector - function
			if ( typeof sel === 'function' ) {
				return rows.map( function (idx) {
					var row = aoData[ idx ];
					return sel( idx, row._aData, row.nTr ) ? idx : null;
				} );
			}
	
			// Selector - node
			if ( sel.nodeName ) {
				var rowIdx = sel._DT_RowIndex;  // Property added by DT for fast lookup
				var cellIdx = sel._DT_CellIndex;
	
				if ( rowIdx !== undefined ) {
					// Make sure that the row is actually still present in the table
					return aoData[ rowIdx ] && aoData[ rowIdx ].nTr === sel ?
						[ rowIdx ] :
						[];
				}
				else if ( cellIdx ) {
					return aoData[ cellIdx.row ] && aoData[ cellIdx.row ].nTr === sel.parentNode ?
						[ cellIdx.row ] :
						[];
				}
				else {
					var host = $(sel).closest('*[data-dt-row]');
					return host.length ?
						[ host.data('dt-row') ] :
						[];
				}
			}
	
			// ID selector. Want to always be able to select rows by id, regardless
			// of if the tr element has been created or not, so can't rely upon
			// jQuery here - hence a custom implementation. This does not match
			// Sizzle's fast selector or HTML4 - in HTML5 the ID can be anything,
			// but to select it using a CSS selector engine (like Sizzle or
			// querySelect) it would need to need to be escaped for some characters.
			// DataTables simplifies this for row selectors since you can select
			// only a row. A # indicates an id any anything that follows is the id -
			// unescaped.
			if ( typeof sel === 'string' && sel.charAt(0) === '#' ) {
				// get row index from id
				var rowObj = settings.aIds[ sel.replace( /^#/, '' ) ];
				if ( rowObj !== undefined ) {
					return [ rowObj.idx ];
				}
	
				// need to fall through to jQuery in case there is DOM id that
				// matches
			}
			
			// Get nodes in the order from the `rows` array with null values removed
			var nodes = _removeEmpty(
				_pluck_order( settings.aoData, rows, 'nTr' )
			);
	
			// Selector - jQuery selector string, array of nodes or jQuery object/
			// As jQuery's .filter() allows jQuery objects to be passed in filter,
			// it also allows arrays, so this will cope with all three options
			return $(nodes)
				.filter( sel )
				.map( function () {
					return this._DT_RowIndex;
				} )
				.toArray();
		};
	
		var matched = _selector_run( 'row', selector, run, settings, opts );
	
		if (opts.order === 'current' || opts.order === 'applied') {
			_fnSortDisplay(settings, matched);
		}
	
		return matched;
	};
	
	
	_api_register( 'rows()', function ( selector, opts ) {
		// argument shifting
		if ( selector === undefined ) {
			selector = '';
		}
		else if ( $.isPlainObject( selector ) ) {
			opts = selector;
			selector = '';
		}
	
		opts = _selector_opts( opts );
	
		var inst = this.iterator( 'table', function ( settings ) {
			return __row_selector( settings, selector, opts );
		}, 1 );
	
		// Want argument shifting here and in __row_selector?
		inst.selector.rows = selector;
		inst.selector.opts = opts;
	
		return inst;
	} );
	
	_api_register( 'rows().nodes()', function () {
		return this.iterator( 'row', function ( settings, row ) {
			return settings.aoData[ row ].nTr || undefined;
		}, 1 );
	} );
	
	_api_register( 'rows().data()', function () {
		return this.iterator( true, 'rows', function ( settings, rows ) {
			return _pluck_order( settings.aoData, rows, '_aData' );
		}, 1 );
	} );
	
	_api_registerPlural( 'rows().cache()', 'row().cache()', function ( type ) {
		return this.iterator( 'row', function ( settings, row ) {
			var r = settings.aoData[ row ];
			return type === 'search' ? r._aFilterData : r._aSortData;
		}, 1 );
	} );
	
	_api_registerPlural( 'rows().invalidate()', 'row().invalidate()', function ( src ) {
		return this.iterator( 'row', function ( settings, row ) {
			_fnInvalidate( settings, row, src );
		} );
	} );
	
	_api_registerPlural( 'rows().indexes()', 'row().index()', function () {
		return this.iterator( 'row', function ( settings, row ) {
			return row;
		}, 1 );
	} );
	
	_api_registerPlural( 'rows().ids()', 'row().id()', function ( hash ) {
		var a = [];
		var context = this.context;
	
		// `iterator` will drop undefined values, but in this case we want them
		for ( var i=0, ien=context.length ; i<ien ; i++ ) {
			for ( var j=0, jen=this[i].length ; j<jen ; j++ ) {
				var id = context[i].rowIdFn( context[i].aoData[ this[i][j] ]._aData );
				a.push( (hash === true ? '#' : '' )+ id );
			}
		}
	
		return new _Api( context, a );
	} );
	
	_api_registerPlural( 'rows().remove()', 'row().remove()', function () {
		this.iterator( 'row', function ( settings, row ) {
			var data = settings.aoData;
			var rowData = data[ row ];
	
			// Delete from the display arrays
			var idx = settings.aiDisplayMaster.indexOf(row);
			if (idx !== -1) {
				settings.aiDisplayMaster.splice(idx, 1);
			}
	
			// For server-side processing tables - subtract the deleted row from the count
			if ( settings._iRecordsDisplay > 0 ) {
				settings._iRecordsDisplay--;
			}
	
			// Check for an 'overflow' they case for displaying the table
			_fnLengthOverflow( settings );
	
			// Remove the row's ID reference if there is one
			var id = settings.rowIdFn( rowData._aData );
			if ( id !== undefined ) {
				delete settings.aIds[ id ];
			}
	
			data[row] = null;
		} );
	
		return this;
	} );
	
	
	_api_register( 'rows.add()', function ( rows ) {
		var newRows = this.iterator( 'table', function ( settings ) {
				var row, i, ien;
				var out = [];
	
				for ( i=0, ien=rows.length ; i<ien ; i++ ) {
					row = rows[i];
	
					if ( row.nodeName && row.nodeName.toUpperCase() === 'TR' ) {
						out.push( _fnAddTr( settings, row )[0] );
					}
					else {
						out.push( _fnAddData( settings, row ) );
					}
				}
	
				return out;
			}, 1 );
	
		// Return an Api.rows() extended instance, so rows().nodes() etc can be used
		var modRows = this.rows( -1 );
		modRows.pop();
		modRows.push.apply(modRows, newRows);
	
		return modRows;
	} );
	
	
	
	
	
	/**
	 *
	 */
	_api_register( 'row()', function ( selector, opts ) {
		return _selector_first( this.rows( selector, opts ) );
	} );
	
	
	_api_register( 'row().data()', function ( data ) {
		var ctx = this.context;
	
		if ( data === undefined ) {
			// Get
			return ctx.length && this.length && this[0].length ?
				ctx[0].aoData[ this[0] ]._aData :
				undefined;
		}
	
		// Set
		var row = ctx[0].aoData[ this[0] ];
		row._aData = data;
	
		// If the DOM has an id, and the data source is an array
		if ( Array.isArray( data ) && row.nTr && row.nTr.id ) {
			_fnSetObjectDataFn( ctx[0].rowId )( data, row.nTr.id );
		}
	
		// Automatically invalidate
		_fnInvalidate( ctx[0], this[0], 'data' );
	
		return this;
	} );
	
	
	_api_register( 'row().node()', function () {
		var ctx = this.context;
	
		if (ctx.length && this.length && this[0].length) {
			var row = ctx[0].aoData[ this[0] ];
	
			if (row && row.nTr) {
				return row.nTr;
			}
		}
	
		return null;
	} );
	
	
	_api_register( 'row.add()', function ( row ) {
		// Allow a jQuery object to be passed in - only a single row is added from
		// it though - the first element in the set
		if ( row instanceof $ && row.length ) {
			row = row[0];
		}
	
		var rows = this.iterator( 'table', function ( settings ) {
			if ( row.nodeName && row.nodeName.toUpperCase() === 'TR' ) {
				return _fnAddTr( settings, row )[0];
			}
			return _fnAddData( settings, row );
		} );
	
		// Return an Api.rows() extended instance, with the newly added row selected
		return this.row( rows[0] );
	} );
	
	
	$(document).on('plugin-init.dt', function (e, context) {
		var api = new _Api( context );
	
		api.on( 'stateSaveParams.DT', function ( e, settings, d ) {
			// This could be more compact with the API, but it is a lot faster as a simple
			// internal loop
			var idFn = settings.rowIdFn;
			var rows = settings.aiDisplayMaster;
			var ids = [];
	
			for (var i=0 ; i<rows.length ; i++) {
				var rowIdx = rows[i];
				var data = settings.aoData[rowIdx];
	
				if (data._detailsShow) {
					ids.push( '#' + idFn(data._aData) );
				}
			}
	
			d.childRows = ids;
		});
	
		// For future state loads (e.g. with StateRestore)
		api.on( 'stateLoaded.DT', function (e, settings, state) {
			__details_state_load( api, state );
		});
	
		// And the initial load state
		__details_state_load( api, api.state.loaded() );
	});
	
	var __details_state_load = function (api, state)
	{
		if ( state && state.childRows ) {
			api
				.rows( state.childRows.map(function (id) {
					// Escape any `:` characters from the row id. Accounts for
					// already escaped characters.
					return id.replace(/([^:\\]*(?:\\.[^:\\]*)*):/g, "$1\\:");
				}) )
				.every( function () {
					_fnCallbackFire( api.settings()[0], null, 'requestChild', [ this ] )
				});
		}
	}
	
	var __details_add = function ( ctx, row, data, klass )
	{
		// Convert to array of TR elements
		var rows = [];
		var addRow = function ( r, k ) {
			// Recursion to allow for arrays of jQuery objects
			if ( Array.isArray( r ) || r instanceof $ ) {
				for ( var i=0, ien=r.length ; i<ien ; i++ ) {
					addRow( r[i], k );
				}
				return;
			}
	
			// If we get a TR element, then just add it directly - up to the dev
			// to add the correct number of columns etc
			if ( r.nodeName && r.nodeName.toLowerCase() === 'tr' ) {
				r.setAttribute( 'data-dt-row', row.idx );
				rows.push( r );
			}
			else {
				// Otherwise create a row with a wrapper
				var created = $('<tr><td></td></tr>')
					.attr( 'data-dt-row', row.idx )
					.addClass( k );
				
				$('td', created)
					.addClass( k )
					.html( r )[0].colSpan = _fnVisbleColumns( ctx );
	
				rows.push( created[0] );
			}
		};
	
		addRow( data, klass );
	
		if ( row._details ) {
			row._details.detach();
		}
	
		row._details = $(rows);
	
		// If the children were already shown, that state should be retained
		if ( row._detailsShow ) {
			row._details.insertAfter( row.nTr );
		}
	};
	
	
	// Make state saving of child row details async to allow them to be batch processed
	var __details_state = DataTable.util.throttle(
		function (ctx) {
			_fnSaveState( ctx[0] )
		},
		500
	);
	
	
	var __details_remove = function ( api, idx )
	{
		var ctx = api.context;
	
		if ( ctx.length ) {
			var row = ctx[0].aoData[ idx !== undefined ? idx : api[0] ];
	
			if ( row && row._details ) {
				row._details.remove();
	
				row._detailsShow = undefined;
				row._details = undefined;
				$( row.nTr ).removeClass( 'dt-hasChild' );
				__details_state( ctx );
			}
		}
	};
	
	
	var __details_display = function ( api, show ) {
		var ctx = api.context;
	
		if ( ctx.length && api.length ) {
			var row = ctx[0].aoData[ api[0] ];
	
			if ( row._details ) {
				row._detailsShow = show;
	
				if ( show ) {
					row._details.insertAfter( row.nTr );
					$( row.nTr ).addClass( 'dt-hasChild' );
				}
				else {
					row._details.detach();
					$( row.nTr ).removeClass( 'dt-hasChild' );
				}
	
				_fnCallbackFire( ctx[0], null, 'childRow', [ show, api.row( api[0] ) ] )
	
				__details_events( ctx[0] );
				__details_state( ctx );
			}
		}
	};
	
	
	var __details_events = function ( settings )
	{
		var api = new _Api( settings );
		var namespace = '.dt.DT_details';
		var drawEvent = 'draw'+namespace;
		var colvisEvent = 'column-sizing'+namespace;
		var destroyEvent = 'destroy'+namespace;
		var data = settings.aoData;
	
		api.off( drawEvent +' '+ colvisEvent +' '+ destroyEvent );
	
		if ( _pluck( data, '_details' ).length > 0 ) {
			// On each draw, insert the required elements into the document
			api.on( drawEvent, function ( e, ctx ) {
				if ( settings !== ctx ) {
					return;
				}
	
				api.rows( {page:'current'} ).eq(0).each( function (idx) {
					// Internal data grab
					var row = data[ idx ];
	
					if ( row._detailsShow ) {
						row._details.insertAfter( row.nTr );
					}
				} );
			} );
	
			// Column visibility change - update the colspan
			api.on( colvisEvent, function ( e, ctx ) {
				if ( settings !== ctx ) {
					return;
				}
	
				// Update the colspan for the details rows (note, only if it already has
				// a colspan)
				var row, visible = _fnVisbleColumns( ctx );
	
				for ( var i=0, ien=data.length ; i<ien ; i++ ) {
					row = data[i];
	
					if ( row && row._details ) {
						row._details.each(function () {
							var el = $(this).children('td');
	
							if (el.length == 1) {
								el.attr('colspan', visible);
							}
						});
					}
				}
			} );
	
			// Table destroyed - nuke any child rows
			api.on( destroyEvent, function ( e, ctx ) {
				if ( settings !== ctx ) {
					return;
				}
	
				for ( var i=0, ien=data.length ; i<ien ; i++ ) {
					if ( data[i] && data[i]._details ) {
						__details_remove( api, i );
					}
				}
			} );
		}
	};
	
	// Strings for the method names to help minification
	var _emp = '';
	var _child_obj = _emp+'row().child';
	var _child_mth = _child_obj+'()';
	
	// data can be:
	//  tr
	//  string
	//  jQuery or array of any of the above
	_api_register( _child_mth, function ( data, klass ) {
		var ctx = this.context;
	
		if ( data === undefined ) {
			// get
			return ctx.length && this.length && ctx[0].aoData[ this[0] ]
				? ctx[0].aoData[ this[0] ]._details
				: undefined;
		}
		else if ( data === true ) {
			// show
			this.child.show();
		}
		else if ( data === false ) {
			// remove
			__details_remove( this );
		}
		else if ( ctx.length && this.length ) {
			// set
			__details_add( ctx[0], ctx[0].aoData[ this[0] ], data, klass );
		}
	
		return this;
	} );
	
	
	_api_register( [
		_child_obj+'.show()',
		_child_mth+'.show()' // only when `child()` was called with parameters (without
	], function () {         // it returns an object and this method is not executed)
		__details_display( this, true );
		return this;
	} );
	
	
	_api_register( [
		_child_obj+'.hide()',
		_child_mth+'.hide()' // only when `child()` was called with parameters (without
	], function () {         // it returns an object and this method is not executed)
		__details_display( this, false );
		return this;
	} );
	
	
	_api_register( [
		_child_obj+'.remove()',
		_child_mth+'.remove()' // only when `child()` was called with parameters (without
	], function () {           // it returns an object and this method is not executed)
		__details_remove( this );
		return this;
	} );
	
	
	_api_register( _child_obj+'.isShown()', function () {
		var ctx = this.context;
	
		if ( ctx.length && this.length && ctx[0].aoData[ this[0] ] ) {
			// _detailsShown as false or undefined will fall through to return false
			return ctx[0].aoData[ this[0] ]._detailsShow || false;
		}
		return false;
	} );
	
	
	
	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * Columns
	 *
	 * {integer}           - column index (>=0 count from left, <0 count from right)
	 * "{integer}:visIdx"  - visible column index (i.e. translate to column index)  (>=0 count from left, <0 count from right)
	 * "{integer}:visible" - alias for {integer}:visIdx  (>=0 count from left, <0 count from right)
	 * "{string}:name"     - column name
	 * "{string}"          - jQuery selector on column header nodes
	 *
	 */
	
	// can be an array of these items, comma separated list, or an array of comma
	// separated lists
	
	var __re_column_selector = /^([^:]+)?:(name|title|visIdx|visible)$/;
	
	
	// r1 and r2 are redundant - but it means that the parameters match for the
	// iterator callback in columns().data()
	var __columnData = function ( settings, column, r1, r2, rows, type ) {
		var a = [];
		for ( var row=0, ien=rows.length ; row<ien ; row++ ) {
			a.push( _fnGetCellData( settings, rows[row], column, type ) );
		}
		return a;
	};
	
	
	var __column_header = function ( settings, column, row ) {
		var header = settings.aoHeader;
		var target = row !== undefined
			? row
			: settings.bSortCellsTop // legacy support
				? 0
				: header.length - 1;
	
		return header[target][column].cell;
	};
	
	var __column_selector = function ( settings, selector, opts )
	{
		var
			columns = settings.aoColumns,
			names = _pluck( columns, 'sName' ),
			titles = _pluck( columns, 'sTitle' ),
			cells = DataTable.util.get('[].[].cell')(settings.aoHeader),
			nodes = _unique( _flatten([], cells) );
		
		var run = function ( s ) {
			var selInt = _intVal( s );
	
			// Selector - all
			if ( s === '' ) {
				return _range( columns.length );
			}
	
			// Selector - index
			if ( selInt !== null ) {
				return [ selInt >= 0 ?
					selInt : // Count from left
					columns.length + selInt // Count from right (+ because its a negative value)
				];
			}
	
			// Selector = function
			if ( typeof s === 'function' ) {
				var rows = _selector_row_indexes( settings, opts );
	
				return columns.map(function (col, idx) {
					return s(
							idx,
							__columnData( settings, idx, 0, 0, rows ),
							__column_header( settings, idx )
						) ? idx : null;
				});
			}
	
			// jQuery or string selector
			var match = typeof s === 'string' ?
				s.match( __re_column_selector ) :
				'';
	
			if ( match ) {
				switch( match[2] ) {
					case 'visIdx':
					case 'visible':
						if (match[1]) {
							var idx = parseInt( match[1], 10 );
							// Visible index given, convert to column index
							if ( idx < 0 ) {
								// Counting from the right
								var visColumns = columns.map( function (col,i) {
									return col.bVisible ? i : null;
								} );
								return [ visColumns[ visColumns.length + idx ] ];
							}
							// Counting from the left
							return [ _fnVisibleToColumnIndex( settings, idx ) ];
						}
						
						// `:visible` on its own
						return columns.map( function (col, i) {
							return col.bVisible ? i : null;
						} );
	
					case 'name':
						// match by name. `names` is column index complete and in order
						return names.map( function (name, i) {
							return name === match[1] ? i : null;
						} );
	
					case 'title':
						// match by column title
						return titles.map( function (title, i) {
							return title === match[1] ? i : null;
						} );
	
					default:
						return [];
				}
			}
	
			// Cell in the table body
			if ( s.nodeName && s._DT_CellIndex ) {
				return [ s._DT_CellIndex.column ];
			}
	
			// jQuery selector on the TH elements for the columns
			var jqResult = $( nodes )
				.filter( s )
				.map( function () {
					return _fnColumnsFromHeader( this ); // `nodes` is column index complete and in order
				} )
				.toArray();
	
			if ( jqResult.length || ! s.nodeName ) {
				return jqResult;
			}
	
			// Otherwise a node which might have a `dt-column` data attribute, or be
			// a child or such an element
			var host = $(s).closest('*[data-dt-column]');
			return host.length ?
				[ host.data('dt-column') ] :
				[];
		};
	
		return _selector_run( 'column', selector, run, settings, opts );
	};
	
	
	var __setColumnVis = function ( settings, column, vis ) {
		var
			cols = settings.aoColumns,
			col  = cols[ column ],
			data = settings.aoData,
			cells, i, ien, tr;
	
		// Get
		if ( vis === undefined ) {
			return col.bVisible;
		}
	
		// Set
		// No change
		if ( col.bVisible === vis ) {
			return false;
		}
	
		if ( vis ) {
			// Insert column
			// Need to decide if we should use appendChild or insertBefore
			var insertBefore = _pluck(cols, 'bVisible').indexOf(true, column+1);
	
			for ( i=0, ien=data.length ; i<ien ; i++ ) {
				if (data[i]) {
					tr = data[i].nTr;
					cells = data[i].anCells;
	
					if ( tr ) {
						// insertBefore can act like appendChild if 2nd arg is null
						tr.insertBefore( cells[ column ], cells[ insertBefore ] || null );
					}
				}
			}
		}
		else {
			// Remove column
			$( _pluck( settings.aoData, 'anCells', column ) ).detach();
		}
	
		// Common actions
		col.bVisible = vis;
	
		_colGroup(settings);
		
		return true;
	};
	
	
	_api_register( 'columns()', function ( selector, opts ) {
		// argument shifting
		if ( selector === undefined ) {
			selector = '';
		}
		else if ( $.isPlainObject( selector ) ) {
			opts = selector;
			selector = '';
		}
	
		opts = _selector_opts( opts );
	
		var inst = this.iterator( 'table', function ( settings ) {
			return __column_selector( settings, selector, opts );
		}, 1 );
	
		// Want argument shifting here and in _row_selector?
		inst.selector.cols = selector;
		inst.selector.opts = opts;
	
		return inst;
	} );
	
	_api_registerPlural( 'columns().header()', 'column().header()', function ( row ) {
		return this.iterator( 'column', function (settings, column) {
			return __column_header(settings, column, row);
		}, 1 );
	} );
	
	_api_registerPlural( 'columns().footer()', 'column().footer()', function ( row ) {
		return this.iterator( 'column', function ( settings, column ) {
			var footer = settings.aoFooter;
	
			if (! footer.length) {
				return null;
			}
	
			return settings.aoFooter[row !== undefined ? row : 0][column].cell;
		}, 1 );
	} );
	
	_api_registerPlural( 'columns().data()', 'column().data()', function () {
		return this.iterator( 'column-rows', __columnData, 1 );
	} );
	
	_api_registerPlural( 'columns().render()', 'column().render()', function ( type ) {
		return this.iterator( 'column-rows', function ( settings, column, i, j, rows ) {
			return __columnData( settings, column, i, j, rows, type );
		}, 1 );
	} );
	
	_api_registerPlural( 'columns().dataSrc()', 'column().dataSrc()', function () {
		return this.iterator( 'column', function ( settings, column ) {
			return settings.aoColumns[column].mData;
		}, 1 );
	} );
	
	_api_registerPlural( 'columns().cache()', 'column().cache()', function ( type ) {
		return this.iterator( 'column-rows', function ( settings, column, i, j, rows ) {
			return _pluck_order( settings.aoData, rows,
				type === 'search' ? '_aFilterData' : '_aSortData', column
			);
		}, 1 );
	} );
	
	_api_registerPlural( 'columns().init()', 'column().init()', function () {
		return this.iterator( 'column', function ( settings, column ) {
			return settings.aoColumns[column];
		}, 1 );
	} );
	
	_api_registerPlural( 'columns().nodes()', 'column().nodes()', function () {
		return this.iterator( 'column-rows', function ( settings, column, i, j, rows ) {
			return _pluck_order( settings.aoData, rows, 'anCells', column ) ;
		}, 1 );
	} );
	
	_api_registerPlural( 'columns().titles()', 'column().title()', function (title, row) {
		return this.iterator( 'column', function ( settings, column ) {
			// Argument shifting
			if (typeof title === 'number') {
				row = title;
				title = undefined;
			}
	
			var span = $('span.dt-column-title', this.column(column).header(row));
	
			if (title !== undefined) {
				span.html(title);
				return this;
			}
	
			return span.html();
		}, 1 );
	} );
	
	_api_registerPlural( 'columns().types()', 'column().type()', function () {
		return this.iterator( 'column', function ( settings, column ) {
			var type = settings.aoColumns[column].sType;
	
			// If the type was invalidated, then resolve it. This actually does
			// all columns at the moment. Would only happen once if getting all
			// column's data types.
			if (! type) {
				_fnColumnTypes(settings);
			}
	
			return type;
		}, 1 );
	} );
	
	_api_registerPlural( 'columns().visible()', 'column().visible()', function ( vis, calc ) {
		var that = this;
		var changed = [];
		var ret = this.iterator( 'column', function ( settings, column ) {
			if ( vis === undefined ) {
				return settings.aoColumns[ column ].bVisible;
			} // else
			
			if (__setColumnVis( settings, column, vis )) {
				changed.push(column);
			}
		} );
	
		// Group the column visibility changes
		if ( vis !== undefined ) {
			this.iterator( 'table', function ( settings ) {
				// Redraw the header after changes
				_fnDrawHead( settings, settings.aoHeader );
				_fnDrawHead( settings, settings.aoFooter );
		
				// Update colspan for no records display. Child rows and extensions will use their own
				// listeners to do this - only need to update the empty table item here
				if ( ! settings.aiDisplay.length ) {
					$(settings.nTBody).find('td[colspan]').attr('colspan', _fnVisbleColumns(settings));
				}
		
				_fnSaveState( settings );
	
				// Second loop once the first is done for events
				that.iterator( 'column', function ( settings, column ) {
					if (changed.includes(column)) {
						_fnCallbackFire( settings, null, 'column-visibility', [settings, column, vis, calc] );
					}
				} );
	
				if ( changed.length && (calc === undefined || calc) ) {
					that.columns.adjust();
				}
			});
		}
	
		return ret;
	} );
	
	_api_registerPlural( 'columns().widths()', 'column().width()', function () {
		// Injects a fake row into the table for just a moment so the widths can
		// be read, regardless of colspan in the header and rows being present in
		// the body
		var columns = this.columns(':visible').count();
		var row = $('<tr>').html('<td>' + Array(columns).join('</td><td>') + '</td>');
	
		$(this.table().body()).append(row);
	
		var widths = row.children().map(function () {
			return $(this).outerWidth();
		});
	
		row.remove();
		
		return this.iterator( 'column', function ( settings, column ) {
			var visIdx = _fnColumnIndexToVisible( settings, column );
	
			return visIdx !== null ? widths[visIdx] : 0;
		}, 1);
	} );
	
	_api_registerPlural( 'columns().indexes()', 'column().index()', function ( type ) {
		return this.iterator( 'column', function ( settings, column ) {
			return type === 'visible' ?
				_fnColumnIndexToVisible( settings, column ) :
				column;
		}, 1 );
	} );
	
	_api_register( 'columns.adjust()', function () {
		return this.iterator( 'table', function ( settings ) {
			_fnAdjustColumnSizing( settings );
		}, 1 );
	} );
	
	_api_register( 'column.index()', function ( type, idx ) {
		if ( this.context.length !== 0 ) {
			var ctx = this.context[0];
	
			if ( type === 'fromVisible' || type === 'toData' ) {
				return _fnVisibleToColumnIndex( ctx, idx );
			}
			else if ( type === 'fromData' || type === 'toVisible' ) {
				return _fnColumnIndexToVisible( ctx, idx );
			}
		}
	} );
	
	_api_register( 'column()', function ( selector, opts ) {
		return _selector_first( this.columns( selector, opts ) );
	} );
	
	var __cell_selector = function ( settings, selector, opts )
	{
		var data = settings.aoData;
		var rows = _selector_row_indexes( settings, opts );
		var cells = _removeEmpty( _pluck_order( data, rows, 'anCells' ) );
		var allCells = $(_flatten( [], cells ));
		var row;
		var columns = settings.aoColumns.length;
		var a, i, ien, j, o, host;
	
		var run = function ( s ) {
			var fnSelector = typeof s === 'function';
	
			if ( s === null || s === undefined || fnSelector ) {
				// All cells and function selectors
				a = [];
	
				for ( i=0, ien=rows.length ; i<ien ; i++ ) {
					row = rows[i];
	
					for ( j=0 ; j<columns ; j++ ) {
						o = {
							row: row,
							column: j
						};
	
						if ( fnSelector ) {
							// Selector - function
							host = data[ row ];
	
							if ( s( o, _fnGetCellData(settings, row, j), host.anCells ? host.anCells[j] : null ) ) {
								a.push( o );
							}
						}
						else {
							// Selector - all
							a.push( o );
						}
					}
				}
	
				return a;
			}
			
			// Selector - index
			if ( $.isPlainObject( s ) ) {
				// Valid cell index and its in the array of selectable rows
				return s.column !== undefined && s.row !== undefined && rows.indexOf(s.row) !== -1 ?
					[s] :
					[];
			}
	
			// Selector - jQuery filtered cells
			var jqResult = allCells
				.filter( s )
				.map( function (i, el) {
					return { // use a new object, in case someone changes the values
						row:    el._DT_CellIndex.row,
						column: el._DT_CellIndex.column
					};
				} )
				.toArray();
	
			if ( jqResult.length || ! s.nodeName ) {
				return jqResult;
			}
	
			// Otherwise the selector is a node, and there is one last option - the
			// element might be a child of an element which has dt-row and dt-column
			// data attributes
			host = $(s).closest('*[data-dt-row]');
			return host.length ?
				[ {
					row: host.data('dt-row'),
					column: host.data('dt-column')
				} ] :
				[];
		};
	
		return _selector_run( 'cell', selector, run, settings, opts );
	};
	
	
	
	
	_api_register( 'cells()', function ( rowSelector, columnSelector, opts ) {
		// Argument shifting
		if ( $.isPlainObject( rowSelector ) ) {
			// Indexes
			if ( rowSelector.row === undefined ) {
				// Selector options in first parameter
				opts = rowSelector;
				rowSelector = null;
			}
			else {
				// Cell index objects in first parameter
				opts = columnSelector;
				columnSelector = null;
			}
		}
		if ( $.isPlainObject( columnSelector ) ) {
			opts = columnSelector;
			columnSelector = null;
		}
	
		// Cell selector
		if ( columnSelector === null || columnSelector === undefined ) {
			return this.iterator( 'table', function ( settings ) {
				return __cell_selector( settings, rowSelector, _selector_opts( opts ) );
			} );
		}
	
		// The default built in options need to apply to row and columns
		var internalOpts = opts ? {
			page: opts.page,
			order: opts.order,
			search: opts.search
		} : {};
	
		// Row + column selector
		var columns = this.columns( columnSelector, internalOpts );
		var rows = this.rows( rowSelector, internalOpts );
		var i, ien, j, jen;
	
		var cellsNoOpts = this.iterator( 'table', function ( settings, idx ) {
			var a = [];
	
			for ( i=0, ien=rows[idx].length ; i<ien ; i++ ) {
				for ( j=0, jen=columns[idx].length ; j<jen ; j++ ) {
					a.push( {
						row:    rows[idx][i],
						column: columns[idx][j]
					} );
				}
			}
	
			return a;
		}, 1 );
	
		// There is currently only one extension which uses a cell selector extension
		// It is a _major_ performance drag to run this if it isn't needed, so this is
		// an extension specific check at the moment
		var cells = opts && opts.selected ?
			this.cells( cellsNoOpts, opts ) :
			cellsNoOpts;
	
		$.extend( cells.selector, {
			cols: columnSelector,
			rows: rowSelector,
			opts: opts
		} );
	
		return cells;
	} );
	
	
	_api_registerPlural( 'cells().nodes()', 'cell().node()', function () {
		return this.iterator( 'cell', function ( settings, row, column ) {
			var data = settings.aoData[ row ];
	
			return data && data.anCells ?
				data.anCells[ column ] :
				undefined;
		}, 1 );
	} );
	
	
	_api_register( 'cells().data()', function () {
		return this.iterator( 'cell', function ( settings, row, column ) {
			return _fnGetCellData( settings, row, column );
		}, 1 );
	} );
	
	
	_api_registerPlural( 'cells().cache()', 'cell().cache()', function ( type ) {
		type = type === 'search' ? '_aFilterData' : '_aSortData';
	
		return this.iterator( 'cell', function ( settings, row, column ) {
			return settings.aoData[ row ][ type ][ column ];
		}, 1 );
	} );
	
	
	_api_registerPlural( 'cells().render()', 'cell().render()', function ( type ) {
		return this.iterator( 'cell', function ( settings, row, column ) {
			return _fnGetCellData( settings, row, column, type );
		}, 1 );
	} );
	
	
	_api_registerPlural( 'cells().indexes()', 'cell().index()', function () {
		return this.iterator( 'cell', function ( settings, row, column ) {
			return {
				row: row,
				column: column,
				columnVisible: _fnColumnIndexToVisible( settings, column )
			};
		}, 1 );
	} );
	
	
	_api_registerPlural( 'cells().invalidate()', 'cell().invalidate()', function ( src ) {
		return this.iterator( 'cell', function ( settings, row, column ) {
			_fnInvalidate( settings, row, src, column );
		} );
	} );
	
	
	
	_api_register( 'cell()', function ( rowSelector, columnSelector, opts ) {
		return _selector_first( this.cells( rowSelector, columnSelector, opts ) );
	} );
	
	
	_api_register( 'cell().data()', function ( data ) {
		var ctx = this.context;
		var cell = this[0];
	
		if ( data === undefined ) {
			// Get
			return ctx.length && cell.length ?
				_fnGetCellData( ctx[0], cell[0].row, cell[0].column ) :
				undefined;
		}
	
		// Set
		_fnSetCellData( ctx[0], cell[0].row, cell[0].column, data );
		_fnInvalidate( ctx[0], cell[0].row, 'data', cell[0].column );
	
		return this;
	} );
	
	
	
	/**
	 * Get current ordering (sorting) that has been applied to the table.
	 *
	 * @returns {array} 2D array containing the sorting information for the first
	 *   table in the current context. Each element in the parent array represents
	 *   a column being sorted upon (i.e. multi-sorting with two columns would have
	 *   2 inner arrays). The inner arrays may have 2 or 3 elements. The first is
	 *   the column index that the sorting condition applies to, the second is the
	 *   direction of the sort (`desc` or `asc`) and, optionally, the third is the
	 *   index of the sorting order from the `column.sorting` initialisation array.
	 *//**
	 * Set the ordering for the table.
	 *
	 * @param {integer} order Column index to sort upon.
	 * @param {string} direction Direction of the sort to be applied (`asc` or `desc`)
	 * @returns {DataTables.Api} this
	 *//**
	 * Set the ordering for the table.
	 *
	 * @param {array} order 1D array of sorting information to be applied.
	 * @param {array} [...] Optional additional sorting conditions
	 * @returns {DataTables.Api} this
	 *//**
	 * Set the ordering for the table.
	 *
	 * @param {array} order 2D array of sorting information to be applied.
	 * @returns {DataTables.Api} this
	 */
	_api_register( 'order()', function ( order, dir ) {
		var ctx = this.context;
		var args = Array.prototype.slice.call( arguments );
	
		if ( order === undefined ) {
			// get
			return ctx.length !== 0 ?
				ctx[0].aaSorting :
				undefined;
		}
	
		// set
		if ( typeof order === 'number' ) {
			// Simple column / direction passed in
			order = [ [ order, dir ] ];
		}
		else if ( args.length > 1 ) {
			// Arguments passed in (list of 1D arrays)
			order = args;
		}
		// otherwise a 2D array was passed in
	
		return this.iterator( 'table', function ( settings ) {
			settings.aaSorting = Array.isArray(order) ? order.slice() : order;
		} );
	} );
	
	
	/**
	 * Attach a sort listener to an element for a given column
	 *
	 * @param {node|jQuery|string} node Identifier for the element(s) to attach the
	 *   listener to. This can take the form of a single DOM node, a jQuery
	 *   collection of nodes or a jQuery selector which will identify the node(s).
	 * @param {integer} column the column that a click on this node will sort on
	 * @param {function} [callback] callback function when sort is run
	 * @returns {DataTables.Api} this
	 */
	_api_register( 'order.listener()', function ( node, column, callback ) {
		return this.iterator( 'table', function ( settings ) {
			_fnSortAttachListener(settings, node, {}, column, callback);
		} );
	} );
	
	
	_api_register( 'order.fixed()', function ( set ) {
		if ( ! set ) {
			var ctx = this.context;
			var fixed = ctx.length ?
				ctx[0].aaSortingFixed :
				undefined;
	
			return Array.isArray( fixed ) ?
				{ pre: fixed } :
				fixed;
		}
	
		return this.iterator( 'table', function ( settings ) {
			settings.aaSortingFixed = $.extend( true, {}, set );
		} );
	} );
	
	
	// Order by the selected column(s)
	_api_register( [
		'columns().order()',
		'column().order()'
	], function ( dir ) {
		var that = this;
	
		if ( ! dir ) {
			return this.iterator( 'column', function ( settings, idx ) {
				var sort = _fnSortFlatten( settings );
	
				for ( var i=0, ien=sort.length ; i<ien ; i++ ) {
					if ( sort[i].col === idx ) {
						return sort[i].dir;
					}
				}
	
				return null;
			}, 1 );
		}
		else {
			return this.iterator( 'table', function ( settings, i ) {
				settings.aaSorting = that[i].map( function (col) {
					return [ col, dir ];
				} );
			} );
		}
	} );
	
	_api_registerPlural('columns().orderable()', 'column().orderable()', function ( directions ) {
		return this.iterator( 'column', function ( settings, idx ) {
			var col = settings.aoColumns[idx];
	
			return directions ?
				col.asSorting :
				col.bSortable;
		}, 1 );
	} );
	
	
	_api_register( 'processing()', function ( show ) {
		return this.iterator( 'table', function ( ctx ) {
			_fnProcessingDisplay( ctx, show );
		} );
	} );
	
	
	_api_register( 'search()', function ( input, regex, smart, caseInsen ) {
		var ctx = this.context;
	
		if ( input === undefined ) {
			// get
			return ctx.length !== 0 ?
				ctx[0].oPreviousSearch.search :
				undefined;
		}
	
		// set
		return this.iterator( 'table', function ( settings ) {
			if ( ! settings.oFeatures.bFilter ) {
				return;
			}
	
			if (typeof regex === 'object') {
				// New style options to pass to the search builder
				_fnFilterComplete( settings, $.extend( settings.oPreviousSearch, regex, {
					search: input
				} ) );
			}
			else {
				// Compat for the old options
				_fnFilterComplete( settings, $.extend( settings.oPreviousSearch, {
					search: input,
					regex:  regex === null ? false : regex,
					smart:  smart === null ? true  : smart,
					caseInsensitive: caseInsen === null ? true : caseInsen
				} ) );
			}
		} );
	} );
	
	_api_register( 'search.fixed()', function ( name, search ) {
		var ret = this.iterator( true, 'table', function ( settings ) {
			var fixed = settings.searchFixed;
	
			if (! name) {
				return Object.keys(fixed)
			}
			else if (search === undefined) {
				return fixed[name];
			}
			else if (search === null) {
				delete fixed[name];
			}
			else {
				fixed[name] = search;
			}
	
			return this;
		} );
	
		return name !== undefined && search === undefined
			? ret[0]
			: ret;
	} );
	
	_api_registerPlural(
		'columns().search()',
		'column().search()',
		function ( input, regex, smart, caseInsen ) {
			return this.iterator( 'column', function ( settings, column ) {
				var preSearch = settings.aoPreSearchCols;
	
				if ( input === undefined ) {
					// get
					return preSearch[ column ].search;
				}
	
				// set
				if ( ! settings.oFeatures.bFilter ) {
					return;
				}
	
				if (typeof regex === 'object') {
					// New style options to pass to the search builder
					$.extend( preSearch[ column ], regex, {
						search: input
					} );
				}
				else {
					// Old style (with not all options available)
					$.extend( preSearch[ column ], {
						search: input,
						regex:  regex === null ? false : regex,
						smart:  smart === null ? true  : smart,
						caseInsensitive: caseInsen === null ? true : caseInsen
					} );
				}
	
				_fnFilterComplete( settings, settings.oPreviousSearch );
			} );
		}
	);
	
	_api_register([
			'columns().search.fixed()',
			'column().search.fixed()'
		],
		function ( name, search ) {
			var ret = this.iterator( true, 'column', function ( settings, colIdx ) {
				var fixed = settings.aoColumns[colIdx].searchFixed;
	
				if (! name) {
					return Object.keys(fixed)
				}
				else if (search === undefined) {
					return fixed[name];
				}
				else if (search === null) {
					delete fixed[name];
				}
				else {
					fixed[name] = search;
				}
	
				return this;
			} );
	
			return name !== undefined && search === undefined
				? ret[0]
				: ret;
		}
	);
	/*
	 * State API methods
	 */
	
	_api_register( 'state()', function ( set, ignoreTime ) {
		// getter
		if ( ! set ) {
			return this.context.length ?
				this.context[0].oSavedState :
				null;
		}
	
		var setMutate = $.extend( true, {}, set );
	
		// setter
		return this.iterator( 'table', function ( settings ) {
			if ( ignoreTime !== false ) {
				setMutate.time = +new Date() + 100;
			}
	
			_fnImplementState( settings, setMutate, function(){} );
		} );
	} );
	
	
	_api_register( 'state.clear()', function () {
		return this.iterator( 'table', function ( settings ) {
			// Save an empty object
			settings.fnStateSaveCallback.call( settings.oInstance, settings, {} );
		} );
	} );
	
	
	_api_register( 'state.loaded()', function () {
		return this.context.length ?
			this.context[0].oLoadedState :
			null;
	} );
	
	
	_api_register( 'state.save()', function () {
		return this.iterator( 'table', function ( settings ) {
			_fnSaveState( settings );
		} );
	} );
	
	/**
	 * Set the jQuery or window object to be used by DataTables
	 *
	 * @param {*} module Library / container object
	 * @param {string} [type] Library or container type `lib`, `win` or `datetime`.
	 *   If not provided, automatic detection is attempted.
	 */
	DataTable.use = function (module, type) {
		if (type === 'lib' || module.fn) {
			$ = module;
		}
		else if (type == 'win' || module.document) {
			window = module;
			document = module.document;
		}
		else if (type === 'datetime' || module.type === 'DateTime') {
			DataTable.DateTime = module;
		}
	}
	
	/**
	 * CommonJS factory function pass through. This will check if the arguments
	 * given are a window object or a jQuery object. If so they are set
	 * accordingly.
	 * @param {*} root Window
	 * @param {*} jq jQUery
	 * @returns {boolean} Indicator
	 */
	DataTable.factory = function (root, jq) {
		var is = false;
	
		// Test if the first parameter is a window object
		if (root && root.document) {
			window = root;
			document = root.document;
		}
	
		// Test if the second parameter is a jQuery object
		if (jq && jq.fn && jq.fn.jquery) {
			$ = jq;
			is = true;
		}
	
		return is;
	}
	
	/**
	 * Provide a common method for plug-ins to check the version of DataTables being
	 * used, in order to ensure compatibility.
	 *
	 *  @param {string} version Version string to check for, in the format "X.Y.Z".
	 *    Note that the formats "X" and "X.Y" are also acceptable.
	 *  @param {string} [version2=current DataTables version] As above, but optional.
	 *   If not given the current DataTables version will be used.
	 *  @returns {boolean} true if this version of DataTables is greater or equal to
	 *    the required version, or false if this version of DataTales is not
	 *    suitable
	 *  @static
	 *  @dtopt API-Static
	 *
	 *  @example
	 *    alert( $.fn.dataTable.versionCheck( '1.9.0' ) );
	 */
	DataTable.versionCheck = function( version, version2 )
	{
		var aThis = version2 ?
			version2.split('.') :
			DataTable.version.split('.');
		var aThat = version.split('.');
		var iThis, iThat;
	
		for ( var i=0, iLen=aThat.length ; i<iLen ; i++ ) {
			iThis = parseInt( aThis[i], 10 ) || 0;
			iThat = parseInt( aThat[i], 10 ) || 0;
	
			// Parts are the same, keep comparing
			if (iThis === iThat) {
				continue;
			}
	
			// Parts are different, return immediately
			return iThis > iThat;
		}
	
		return true;
	};
	
	
	/**
	 * Check if a `<table>` node is a DataTable table already or not.
	 *
	 *  @param {node|jquery|string} table Table node, jQuery object or jQuery
	 *      selector for the table to test. Note that if more than more than one
	 *      table is passed on, only the first will be checked
	 *  @returns {boolean} true the table given is a DataTable, or false otherwise
	 *  @static
	 *  @dtopt API-Static
	 *
	 *  @example
	 *    if ( ! $.fn.DataTable.isDataTable( '#example' ) ) {
	 *      $('#example').dataTable();
	 *    }
	 */
	DataTable.isDataTable = function ( table )
	{
		var t = $(table).get(0);
		var is = false;
	
		if ( table instanceof DataTable.Api ) {
			return true;
		}
	
		$.each( DataTable.settings, function (i, o) {
			var head = o.nScrollHead ? $('table', o.nScrollHead)[0] : null;
			var foot = o.nScrollFoot ? $('table', o.nScrollFoot)[0] : null;
	
			if ( o.nTable === t || head === t || foot === t ) {
				is = true;
			}
		} );
	
		return is;
	};
	
	
	/**
	 * Get all DataTable tables that have been initialised - optionally you can
	 * select to get only currently visible tables.
	 *
	 *  @param {boolean} [visible=false] Flag to indicate if you want all (default)
	 *    or visible tables only.
	 *  @returns {array} Array of `table` nodes (not DataTable instances) which are
	 *    DataTables
	 *  @static
	 *  @dtopt API-Static
	 *
	 *  @example
	 *    $.each( $.fn.dataTable.tables(true), function () {
	 *      $(table).DataTable().columns.adjust();
	 *    } );
	 */
	DataTable.tables = function ( visible )
	{
		var api = false;
	
		if ( $.isPlainObject( visible ) ) {
			api = visible.api;
			visible = visible.visible;
		}
	
		var a = DataTable.settings
			.filter( function (o) {
				return !visible || (visible && $(o.nTable).is(':visible')) 
					? true
					: false;
			} )
			.map( function (o) {
				return o.nTable;
			});
	
		return api ?
			new _Api( a ) :
			a;
	};
	
	
	/**
	 * Convert from camel case parameters to Hungarian notation. This is made public
	 * for the extensions to provide the same ability as DataTables core to accept
	 * either the 1.9 style Hungarian notation, or the 1.10+ style camelCase
	 * parameters.
	 *
	 *  @param {object} src The model object which holds all parameters that can be
	 *    mapped.
	 *  @param {object} user The object to convert from camel case to Hungarian.
	 *  @param {boolean} force When set to `true`, properties which already have a
	 *    Hungarian value in the `user` object will be overwritten. Otherwise they
	 *    won't be.
	 */
	DataTable.camelToHungarian = _fnCamelToHungarian;
	
	
	
	/**
	 *
	 */
	_api_register( '$()', function ( selector, opts ) {
		var
			rows   = this.rows( opts ).nodes(), // Get all rows
			jqRows = $(rows);
	
		return $( [].concat(
			jqRows.filter( selector ).toArray(),
			jqRows.find( selector ).toArray()
		) );
	} );
	
	
	// jQuery functions to operate on the tables
	$.each( [ 'on', 'one', 'off' ], function (i, key) {
		_api_register( key+'()', function ( /* event, handler */ ) {
			var args = Array.prototype.slice.call(arguments);
	
			// Add the `dt` namespace automatically if it isn't already present
			args[0] = args[0].split( /\s/ ).map( function ( e ) {
				return ! e.match(/\.dt\b/) ?
					e+'.dt' :
					e;
				} ).join( ' ' );
	
			var inst = $( this.tables().nodes() );
			inst[key].apply( inst, args );
			return this;
		} );
	} );
	
	
	_api_register( 'clear()', function () {
		return this.iterator( 'table', function ( settings ) {
			_fnClearTable( settings );
		} );
	} );
	
	
	_api_register( 'error()', function (msg) {
		return this.iterator( 'table', function ( settings ) {
			_fnLog( settings, 0, msg );
		} );
	} );
	
	
	_api_register( 'settings()', function () {
		return new _Api( this.context, this.context );
	} );
	
	
	_api_register( 'init()', function () {
		var ctx = this.context;
		return ctx.length ? ctx[0].oInit : null;
	} );
	
	
	_api_register( 'data()', function () {
		return this.iterator( 'table', function ( settings ) {
			return _pluck( settings.aoData, '_aData' );
		} ).flatten();
	} );
	
	
	_api_register( 'trigger()', function ( name, args, bubbles ) {
		return this.iterator( 'table', function ( settings ) {
			return _fnCallbackFire( settings, null, name, args, bubbles );
		} ).flatten();
	} );
	
	
	_api_register( 'ready()', function ( fn ) {
		var ctx = this.context;
	
		// Get status of first table
		if (! fn) {
			return ctx.length
				? (ctx[0]._bInitComplete || false)
				: null;
		}
	
		// Function to run either once the table becomes ready or
		// immediately if it is already ready.
		return this.tables().every(function () {
			if (this.context[0]._bInitComplete) {
				fn.call(this);
			}
			else {
				this.on('init', function () {
					fn.call(this);
				});
			}
		} );
	} );
	
	
	_api_register( 'destroy()', function ( remove ) {
		remove = remove || false;
	
		return this.iterator( 'table', function ( settings ) {
			var classes   = settings.oClasses;
			var table     = settings.nTable;
			var tbody     = settings.nTBody;
			var thead     = settings.nTHead;
			var tfoot     = settings.nTFoot;
			var jqTable   = $(table);
			var jqTbody   = $(tbody);
			var jqWrapper = $(settings.nTableWrapper);
			var rows      = settings.aoData.map( function (r) { return r ? r.nTr : null; } );
			var orderClasses = classes.order;
	
			// Flag to note that the table is currently being destroyed - no action
			// should be taken
			settings.bDestroying = true;
	
			// Fire off the destroy callbacks for plug-ins etc
			_fnCallbackFire( settings, "aoDestroyCallback", "destroy", [settings], true );
	
			// If not being removed from the document, make all columns visible
			if ( ! remove ) {
				new _Api( settings ).columns().visible( true );
			}
	
			// Blitz all `DT` namespaced events (these are internal events, the
			// lowercase, `dt` events are user subscribed and they are responsible
			// for removing them
			jqWrapper.off('.DT').find(':not(tbody *)').off('.DT');
			$(window).off('.DT-'+settings.sInstance);
	
			// When scrolling we had to break the table up - restore it
			if ( table != thead.parentNode ) {
				jqTable.children('thead').detach();
				jqTable.append( thead );
			}
	
			if ( tfoot && table != tfoot.parentNode ) {
				jqTable.children('tfoot').detach();
				jqTable.append( tfoot );
			}
	
			settings.colgroup.remove();
	
			settings.aaSorting = [];
			settings.aaSortingFixed = [];
			_fnSortingClasses( settings );
	
			$('th, td', thead)
				.removeClass(
					orderClasses.canAsc + ' ' +
					orderClasses.canDesc + ' ' +
					orderClasses.isAsc + ' ' +
					orderClasses.isDesc
				)
				.css('width', '');
	
			// Add the TR elements back into the table in their original order
			jqTbody.children().detach();
			jqTbody.append( rows );
	
			var orig = settings.nTableWrapper.parentNode;
			var insertBefore = settings.nTableWrapper.nextSibling;
	
			// Remove the DataTables generated nodes, events and classes
			var removedMethod = remove ? 'remove' : 'detach';
			jqTable[ removedMethod ]();
			jqWrapper[ removedMethod ]();
	
			// If we need to reattach the table to the document
			if ( ! remove && orig ) {
				// insertBefore acts like appendChild if !arg[1]
				orig.insertBefore( table, insertBefore );
	
				// Restore the width of the original table - was read from the style property,
				// so we can restore directly to that
				jqTable
					.css( 'width', settings.sDestroyWidth )
					.removeClass( classes.table );
			}
	
			/* Remove the settings object from the settings array */
			var idx = DataTable.settings.indexOf(settings);
			if ( idx !== -1 ) {
				DataTable.settings.splice( idx, 1 );
			}
		} );
	} );
	
	
	// Add the `every()` method for rows, columns and cells in a compact form
	$.each( [ 'column', 'row', 'cell' ], function ( i, type ) {
		_api_register( type+'s().every()', function ( fn ) {
			var opts = this.selector.opts;
			var api = this;
			var inst;
			var counter = 0;
	
			return this.iterator( 'every', function ( settings, selectedIdx, tableIdx ) {
				inst = api[ type ](selectedIdx, opts);
	
				if (type === 'cell') {
					fn.call(inst, inst[0][0].row, inst[0][0].column, tableIdx, counter);
				}
				else {
					fn.call(inst, selectedIdx, tableIdx, counter);
				}
	
				counter++;
			} );
		} );
	} );
	
	
	// i18n method for extensions to be able to use the language object from the
	// DataTable
	_api_register( 'i18n()', function ( token, def, plural ) {
		var ctx = this.context[0];
		var resolved = _fnGetObjectDataFn( token )( ctx.oLanguage );
	
		if ( resolved === undefined ) {
			resolved = def;
		}
	
		if ( $.isPlainObject( resolved ) ) {
			resolved = plural !== undefined && resolved[ plural ] !== undefined ?
				resolved[ plural ] :
				resolved._;
		}
	
		return typeof resolved === 'string'
			? resolved.replace( '%d', plural ) // nb: plural might be undefined,
			: resolved;
	} );
	
	/**
	 * Version string for plug-ins to check compatibility. Allowed format is
	 * `a.b.c-d` where: a:int, b:int, c:int, d:string(dev|beta|alpha). `d` is used
	 * only for non-release builds. See https://semver.org/ for more information.
	 *  @member
	 *  @type string
	 *  @default Version number
	 */
	DataTable.version = "2.0.8";
	
	/**
	 * Private data store, containing all of the settings objects that are
	 * created for the tables on a given page.
	 *
	 * Note that the `DataTable.settings` object is aliased to
	 * `jQuery.fn.dataTableExt` through which it may be accessed and
	 * manipulated, or `jQuery.fn.dataTable.settings`.
	 *  @member
	 *  @type array
	 *  @default []
	 *  @private
	 */
	DataTable.settings = [];
	
	/**
	 * Object models container, for the various models that DataTables has
	 * available to it. These models define the objects that are used to hold
	 * the active state and configuration of the table.
	 *  @namespace
	 */
	DataTable.models = {};
	
	
	
	/**
	 * Template object for the way in which DataTables holds information about
	 * search information for the global filter and individual column filters.
	 *  @namespace
	 */
	DataTable.models.oSearch = {
		/**
		 * Flag to indicate if the filtering should be case insensitive or not
		 */
		"caseInsensitive": true,
	
		/**
		 * Applied search term
		 */
		"search": "",
	
		/**
		 * Flag to indicate if the search term should be interpreted as a
		 * regular expression (true) or not (false) and therefore and special
		 * regex characters escaped.
		 */
		"regex": false,
	
		/**
		 * Flag to indicate if DataTables is to use its smart filtering or not.
		 */
		"smart": true,
	
		/**
		 * Flag to indicate if DataTables should only trigger a search when
		 * the return key is pressed.
		 */
		"return": false
	};
	
	
	
	
	/**
	 * Template object for the way in which DataTables holds information about
	 * each individual row. This is the object format used for the settings
	 * aoData array.
	 *  @namespace
	 */
	DataTable.models.oRow = {
		/**
		 * TR element for the row
		 */
		"nTr": null,
	
		/**
		 * Array of TD elements for each row. This is null until the row has been
		 * created.
		 */
		"anCells": null,
	
		/**
		 * Data object from the original data source for the row. This is either
		 * an array if using the traditional form of DataTables, or an object if
		 * using mData options. The exact type will depend on the passed in
		 * data from the data source, or will be an array if using DOM a data
		 * source.
		 */
		"_aData": [],
	
		/**
		 * Sorting data cache - this array is ostensibly the same length as the
		 * number of columns (although each index is generated only as it is
		 * needed), and holds the data that is used for sorting each column in the
		 * row. We do this cache generation at the start of the sort in order that
		 * the formatting of the sort data need be done only once for each cell
		 * per sort. This array should not be read from or written to by anything
		 * other than the master sorting methods.
		 */
		"_aSortData": null,
	
		/**
		 * Per cell filtering data cache. As per the sort data cache, used to
		 * increase the performance of the filtering in DataTables
		 */
		"_aFilterData": null,
	
		/**
		 * Filtering data cache. This is the same as the cell filtering cache, but
		 * in this case a string rather than an array. This is easily computed with
		 * a join on `_aFilterData`, but is provided as a cache so the join isn't
		 * needed on every search (memory traded for performance)
		 */
		"_sFilterRow": null,
	
		/**
		 * Denote if the original data source was from the DOM, or the data source
		 * object. This is used for invalidating data, so DataTables can
		 * automatically read data from the original source, unless uninstructed
		 * otherwise.
		 */
		"src": null,
	
		/**
		 * Index in the aoData array. This saves an indexOf lookup when we have the
		 * object, but want to know the index
		 */
		"idx": -1,
	
		/**
		 * Cached display value
		 */
		displayData: null
	};
	
	
	/**
	 * Template object for the column information object in DataTables. This object
	 * is held in the settings aoColumns array and contains all the information that
	 * DataTables needs about each individual column.
	 *
	 * Note that this object is related to {@link DataTable.defaults.column}
	 * but this one is the internal data store for DataTables's cache of columns.
	 * It should NOT be manipulated outside of DataTables. Any configuration should
	 * be done through the initialisation options.
	 *  @namespace
	 */
	DataTable.models.oColumn = {
		/**
		 * Column index.
		 */
		"idx": null,
	
		/**
		 * A list of the columns that sorting should occur on when this column
		 * is sorted. That this property is an array allows multi-column sorting
		 * to be defined for a column (for example first name / last name columns
		 * would benefit from this). The values are integers pointing to the
		 * columns to be sorted on (typically it will be a single integer pointing
		 * at itself, but that doesn't need to be the case).
		 */
		"aDataSort": null,
	
		/**
		 * Define the sorting directions that are applied to the column, in sequence
		 * as the column is repeatedly sorted upon - i.e. the first value is used
		 * as the sorting direction when the column if first sorted (clicked on).
		 * Sort it again (click again) and it will move on to the next index.
		 * Repeat until loop.
		 */
		"asSorting": null,
	
		/**
		 * Flag to indicate if the column is searchable, and thus should be included
		 * in the filtering or not.
		 */
		"bSearchable": null,
	
		/**
		 * Flag to indicate if the column is sortable or not.
		 */
		"bSortable": null,
	
		/**
		 * Flag to indicate if the column is currently visible in the table or not
		 */
		"bVisible": null,
	
		/**
		 * Store for manual type assignment using the `column.type` option. This
		 * is held in store so we can manipulate the column's `sType` property.
		 */
		"_sManualType": null,
	
		/**
		 * Flag to indicate if HTML5 data attributes should be used as the data
		 * source for filtering or sorting. True is either are.
		 */
		"_bAttrSrc": false,
	
		/**
		 * Developer definable function that is called whenever a cell is created (Ajax source,
		 * etc) or processed for input (DOM source). This can be used as a compliment to mRender
		 * allowing you to modify the DOM element (add background colour for example) when the
		 * element is available.
		 */
		"fnCreatedCell": null,
	
		/**
		 * Function to get data from a cell in a column. You should <b>never</b>
		 * access data directly through _aData internally in DataTables - always use
		 * the method attached to this property. It allows mData to function as
		 * required. This function is automatically assigned by the column
		 * initialisation method
		 */
		"fnGetData": null,
	
		/**
		 * Function to set data for a cell in the column. You should <b>never</b>
		 * set the data directly to _aData internally in DataTables - always use
		 * this method. It allows mData to function as required. This function
		 * is automatically assigned by the column initialisation method
		 */
		"fnSetData": null,
	
		/**
		 * Property to read the value for the cells in the column from the data
		 * source array / object. If null, then the default content is used, if a
		 * function is given then the return from the function is used.
		 */
		"mData": null,
	
		/**
		 * Partner property to mData which is used (only when defined) to get
		 * the data - i.e. it is basically the same as mData, but without the
		 * 'set' option, and also the data fed to it is the result from mData.
		 * This is the rendering method to match the data method of mData.
		 */
		"mRender": null,
	
		/**
		 * The class to apply to all TD elements in the table's TBODY for the column
		 */
		"sClass": null,
	
		/**
		 * When DataTables calculates the column widths to assign to each column,
		 * it finds the longest string in each column and then constructs a
		 * temporary table and reads the widths from that. The problem with this
		 * is that "mmm" is much wider then "iiii", but the latter is a longer
		 * string - thus the calculation can go wrong (doing it properly and putting
		 * it into an DOM object and measuring that is horribly(!) slow). Thus as
		 * a "work around" we provide this option. It will append its value to the
		 * text that is found to be the longest string for the column - i.e. padding.
		 */
		"sContentPadding": null,
	
		/**
		 * Allows a default value to be given for a column's data, and will be used
		 * whenever a null data source is encountered (this can be because mData
		 * is set to null, or because the data source itself is null).
		 */
		"sDefaultContent": null,
	
		/**
		 * Name for the column, allowing reference to the column by name as well as
		 * by index (needs a lookup to work by name).
		 */
		"sName": null,
	
		/**
		 * Custom sorting data type - defines which of the available plug-ins in
		 * afnSortData the custom sorting will use - if any is defined.
		 */
		"sSortDataType": 'std',
	
		/**
		 * Class to be applied to the header element when sorting on this column
		 */
		"sSortingClass": null,
	
		/**
		 * Title of the column - what is seen in the TH element (nTh).
		 */
		"sTitle": null,
	
		/**
		 * Column sorting and filtering type
		 */
		"sType": null,
	
		/**
		 * Width of the column
		 */
		"sWidth": null,
	
		/**
		 * Width of the column when it was first "encountered"
		 */
		"sWidthOrig": null,
	
		/** Cached string which is the longest in the column */
		maxLenString: null,
	
		/**
		 * Store for named searches
		 */
		searchFixed: null
	};
	
	
	/*
	 * Developer note: The properties of the object below are given in Hungarian
	 * notation, that was used as the interface for DataTables prior to v1.10, however
	 * from v1.10 onwards the primary interface is camel case. In order to avoid
	 * breaking backwards compatibility utterly with this change, the Hungarian
	 * version is still, internally the primary interface, but is is not documented
	 * - hence the @name tags in each doc comment. This allows a Javascript function
	 * to create a map from Hungarian notation to camel case (going the other direction
	 * would require each property to be listed, which would add around 3K to the size
	 * of DataTables, while this method is about a 0.5K hit).
	 *
	 * Ultimately this does pave the way for Hungarian notation to be dropped
	 * completely, but that is a massive amount of work and will break current
	 * installs (therefore is on-hold until v2).
	 */
	
	/**
	 * Initialisation options that can be given to DataTables at initialisation
	 * time.
	 *  @namespace
	 */
	DataTable.defaults = {
		/**
		 * An array of data to use for the table, passed in at initialisation which
		 * will be used in preference to any data which is already in the DOM. This is
		 * particularly useful for constructing tables purely in Javascript, for
		 * example with a custom Ajax call.
		 */
		"aaData": null,
	
	
		/**
		 * If ordering is enabled, then DataTables will perform a first pass sort on
		 * initialisation. You can define which column(s) the sort is performed
		 * upon, and the sorting direction, with this variable. The `sorting` array
		 * should contain an array for each column to be sorted initially containing
		 * the column's index and a direction string ('asc' or 'desc').
		 */
		"aaSorting": [[0,'asc']],
	
	
		/**
		 * This parameter is basically identical to the `sorting` parameter, but
		 * cannot be overridden by user interaction with the table. What this means
		 * is that you could have a column (visible or hidden) which the sorting
		 * will always be forced on first - any sorting after that (from the user)
		 * will then be performed as required. This can be useful for grouping rows
		 * together.
		 */
		"aaSortingFixed": [],
	
	
		/**
		 * DataTables can be instructed to load data to display in the table from a
		 * Ajax source. This option defines how that Ajax call is made and where to.
		 *
		 * The `ajax` property has three different modes of operation, depending on
		 * how it is defined. These are:
		 *
		 * * `string` - Set the URL from where the data should be loaded from.
		 * * `object` - Define properties for `jQuery.ajax`.
		 * * `function` - Custom data get function
		 *
		 * `string`
		 * --------
		 *
		 * As a string, the `ajax` property simply defines the URL from which
		 * DataTables will load data.
		 *
		 * `object`
		 * --------
		 *
		 * As an object, the parameters in the object are passed to
		 * [jQuery.ajax](https://api.jquery.com/jQuery.ajax/) allowing fine control
		 * of the Ajax request. DataTables has a number of default parameters which
		 * you can override using this option. Please refer to the jQuery
		 * documentation for a full description of the options available, although
		 * the following parameters provide additional options in DataTables or
		 * require special consideration:
		 *
		 * * `data` - As with jQuery, `data` can be provided as an object, but it
		 *   can also be used as a function to manipulate the data DataTables sends
		 *   to the server. The function takes a single parameter, an object of
		 *   parameters with the values that DataTables has readied for sending. An
		 *   object may be returned which will be merged into the DataTables
		 *   defaults, or you can add the items to the object that was passed in and
		 *   not return anything from the function. This supersedes `fnServerParams`
		 *   from DataTables 1.9-.
		 *
		 * * `dataSrc` - By default DataTables will look for the property `data` (or
		 *   `aaData` for compatibility with DataTables 1.9-) when obtaining data
		 *   from an Ajax source or for server-side processing - this parameter
		 *   allows that property to be changed. You can use Javascript dotted
		 *   object notation to get a data source for multiple levels of nesting, or
		 *   it my be used as a function. As a function it takes a single parameter,
		 *   the JSON returned from the server, which can be manipulated as
		 *   required, with the returned value being that used by DataTables as the
		 *   data source for the table.
		 *
		 * * `success` - Should not be overridden it is used internally in
		 *   DataTables. To manipulate / transform the data returned by the server
		 *   use `ajax.dataSrc`, or use `ajax` as a function (see below).
		 *
		 * `function`
		 * ----------
		 *
		 * As a function, making the Ajax call is left up to yourself allowing
		 * complete control of the Ajax request. Indeed, if desired, a method other
		 * than Ajax could be used to obtain the required data, such as Web storage
		 * or an AIR database.
		 *
		 * The function is given four parameters and no return is required. The
		 * parameters are:
		 *
		 * 1. _object_ - Data to send to the server
		 * 2. _function_ - Callback function that must be executed when the required
		 *    data has been obtained. That data should be passed into the callback
		 *    as the only parameter
		 * 3. _object_ - DataTables settings object for the table
		 */
		"ajax": null,
	
	
		/**
		 * This parameter allows you to readily specify the entries in the length drop
		 * down menu that DataTables shows when pagination is enabled. It can be
		 * either a 1D array of options which will be used for both the displayed
		 * option and the value, or a 2D array which will use the array in the first
		 * position as the value, and the array in the second position as the
		 * displayed options (useful for language strings such as 'All').
		 *
		 * Note that the `pageLength` property will be automatically set to the
		 * first value given in this array, unless `pageLength` is also provided.
		 */
		"aLengthMenu": [ 10, 25, 50, 100 ],
	
	
		/**
		 * The `columns` option in the initialisation parameter allows you to define
		 * details about the way individual columns behave. For a full list of
		 * column options that can be set, please see
		 * {@link DataTable.defaults.column}. Note that if you use `columns` to
		 * define your columns, you must have an entry in the array for every single
		 * column that you have in your table (these can be null if you don't which
		 * to specify any options).
		 */
		"aoColumns": null,
	
		/**
		 * Very similar to `columns`, `columnDefs` allows you to target a specific
		 * column, multiple columns, or all columns, using the `targets` property of
		 * each object in the array. This allows great flexibility when creating
		 * tables, as the `columnDefs` arrays can be of any length, targeting the
		 * columns you specifically want. `columnDefs` may use any of the column
		 * options available: {@link DataTable.defaults.column}, but it _must_
		 * have `targets` defined in each object in the array. Values in the `targets`
		 * array may be:
		 *   <ul>
		 *     <li>a string - class name will be matched on the TH for the column</li>
		 *     <li>0 or a positive integer - column index counting from the left</li>
		 *     <li>a negative integer - column index counting from the right</li>
		 *     <li>the string "_all" - all columns (i.e. assign a default)</li>
		 *   </ul>
		 */
		"aoColumnDefs": null,
	
	
		/**
		 * Basically the same as `search`, this parameter defines the individual column
		 * filtering state at initialisation time. The array must be of the same size
		 * as the number of columns, and each element be an object with the parameters
		 * `search` and `escapeRegex` (the latter is optional). 'null' is also
		 * accepted and the default will be used.
		 */
		"aoSearchCols": [],
	
	
		/**
		 * Enable or disable automatic column width calculation. This can be disabled
		 * as an optimisation (it takes some time to calculate the widths) if the
		 * tables widths are passed in using `columns`.
		 */
		"bAutoWidth": true,
	
	
		/**
		 * Deferred rendering can provide DataTables with a huge speed boost when you
		 * are using an Ajax or JS data source for the table. This option, when set to
		 * true, will cause DataTables to defer the creation of the table elements for
		 * each row until they are needed for a draw - saving a significant amount of
		 * time.
		 */
		"bDeferRender": true,
	
	
		/**
		 * Replace a DataTable which matches the given selector and replace it with
		 * one which has the properties of the new initialisation object passed. If no
		 * table matches the selector, then the new DataTable will be constructed as
		 * per normal.
		 */
		"bDestroy": false,
	
	
		/**
		 * Enable or disable filtering of data. Filtering in DataTables is "smart" in
		 * that it allows the end user to input multiple words (space separated) and
		 * will match a row containing those words, even if not in the order that was
		 * specified (this allow matching across multiple columns). Note that if you
		 * wish to use filtering in DataTables this must remain 'true' - to remove the
		 * default filtering input box and retain filtering abilities, please use
		 * {@link DataTable.defaults.dom}.
		 */
		"bFilter": true,
	
		/**
		 * Used only for compatiblity with DT1
		 * @deprecated
		 */
		"bInfo": true,
	
		/**
		 * Used only for compatiblity with DT1
		 * @deprecated
		 */
		"bLengthChange": true,
	
		/**
		 * Enable or disable pagination.
		 */
		"bPaginate": true,
	
	
		/**
		 * Enable or disable the display of a 'processing' indicator when the table is
		 * being processed (e.g. a sort). This is particularly useful for tables with
		 * large amounts of data where it can take a noticeable amount of time to sort
		 * the entries.
		 */
		"bProcessing": false,
	
	
		/**
		 * Retrieve the DataTables object for the given selector. Note that if the
		 * table has already been initialised, this parameter will cause DataTables
		 * to simply return the object that has already been set up - it will not take
		 * account of any changes you might have made to the initialisation object
		 * passed to DataTables (setting this parameter to true is an acknowledgement
		 * that you understand this). `destroy` can be used to reinitialise a table if
		 * you need.
		 */
		"bRetrieve": false,
	
	
		/**
		 * When vertical (y) scrolling is enabled, DataTables will force the height of
		 * the table's viewport to the given height at all times (useful for layout).
		 * However, this can look odd when filtering data down to a small data set,
		 * and the footer is left "floating" further down. This parameter (when
		 * enabled) will cause DataTables to collapse the table's viewport down when
		 * the result set will fit within the given Y height.
		 */
		"bScrollCollapse": false,
	
	
		/**
		 * Configure DataTables to use server-side processing. Note that the
		 * `ajax` parameter must also be given in order to give DataTables a
		 * source to obtain the required data for each draw.
		 */
		"bServerSide": false,
	
	
		/**
		 * Enable or disable sorting of columns. Sorting of individual columns can be
		 * disabled by the `sortable` option for each column.
		 */
		"bSort": true,
	
	
		/**
		 * Enable or display DataTables' ability to sort multiple columns at the
		 * same time (activated by shift-click by the user).
		 */
		"bSortMulti": true,
	
	
		/**
		 * Allows control over whether DataTables should use the top (true) unique
		 * cell that is found for a single column, or the bottom (false - default).
		 * This is useful when using complex headers.
		 */
		"bSortCellsTop": null,
	
	
		/**
		 * Enable or disable the addition of the classes `sorting\_1`, `sorting\_2` and
		 * `sorting\_3` to the columns which are currently being sorted on. This is
		 * presented as a feature switch as it can increase processing time (while
		 * classes are removed and added) so for large data sets you might want to
		 * turn this off.
		 */
		"bSortClasses": true,
	
	
		/**
		 * Enable or disable state saving. When enabled HTML5 `localStorage` will be
		 * used to save table display information such as pagination information,
		 * display length, filtering and sorting. As such when the end user reloads
		 * the page the display display will match what thy had previously set up.
		 */
		"bStateSave": false,
	
	
		/**
		 * This function is called when a TR element is created (and all TD child
		 * elements have been inserted), or registered if using a DOM source, allowing
		 * manipulation of the TR element (adding classes etc).
		 */
		"fnCreatedRow": null,
	
	
		/**
		 * This function is called on every 'draw' event, and allows you to
		 * dynamically modify any aspect you want about the created DOM.
		 */
		"fnDrawCallback": null,
	
	
		/**
		 * Identical to fnHeaderCallback() but for the table footer this function
		 * allows you to modify the table footer on every 'draw' event.
		 */
		"fnFooterCallback": null,
	
	
		/**
		 * When rendering large numbers in the information element for the table
		 * (i.e. "Showing 1 to 10 of 57 entries") DataTables will render large numbers
		 * to have a comma separator for the 'thousands' units (e.g. 1 million is
		 * rendered as "1,000,000") to help readability for the end user. This
		 * function will override the default method DataTables uses.
		 */
		"fnFormatNumber": function ( toFormat ) {
			return toFormat.toString().replace(
				/\B(?=(\d{3})+(?!\d))/g,
				this.oLanguage.sThousands
			);
		},
	
	
		/**
		 * This function is called on every 'draw' event, and allows you to
		 * dynamically modify the header row. This can be used to calculate and
		 * display useful information about the table.
		 */
		"fnHeaderCallback": null,
	
	
		/**
		 * The information element can be used to convey information about the current
		 * state of the table. Although the internationalisation options presented by
		 * DataTables are quite capable of dealing with most customisations, there may
		 * be times where you wish to customise the string further. This callback
		 * allows you to do exactly that.
		 */
		"fnInfoCallback": null,
	
	
		/**
		 * Called when the table has been initialised. Normally DataTables will
		 * initialise sequentially and there will be no need for this function,
		 * however, this does not hold true when using external language information
		 * since that is obtained using an async XHR call.
		 */
		"fnInitComplete": null,
	
	
		/**
		 * Called at the very start of each table draw and can be used to cancel the
		 * draw by returning false, any other return (including undefined) results in
		 * the full draw occurring).
		 */
		"fnPreDrawCallback": null,
	
	
		/**
		 * This function allows you to 'post process' each row after it have been
		 * generated for each table draw, but before it is rendered on screen. This
		 * function might be used for setting the row class name etc.
		 */
		"fnRowCallback": null,
	
	
		/**
		 * Load the table state. With this function you can define from where, and how, the
		 * state of a table is loaded. By default DataTables will load from `localStorage`
		 * but you might wish to use a server-side database or cookies.
		 */
		"fnStateLoadCallback": function ( settings ) {
			try {
				return JSON.parse(
					(settings.iStateDuration === -1 ? sessionStorage : localStorage).getItem(
						'DataTables_'+settings.sInstance+'_'+location.pathname
					)
				);
			} catch (e) {
				return {};
			}
		},
	
	
		/**
		 * Callback which allows modification of the saved state prior to loading that state.
		 * This callback is called when the table is loading state from the stored data, but
		 * prior to the settings object being modified by the saved state. Note that for
		 * plug-in authors, you should use the `stateLoadParams` event to load parameters for
		 * a plug-in.
		 */
		"fnStateLoadParams": null,
	
	
		/**
		 * Callback that is called when the state has been loaded from the state saving method
		 * and the DataTables settings object has been modified as a result of the loaded state.
		 */
		"fnStateLoaded": null,
	
	
		/**
		 * Save the table state. This function allows you to define where and how the state
		 * information for the table is stored By default DataTables will use `localStorage`
		 * but you might wish to use a server-side database or cookies.
		 */
		"fnStateSaveCallback": function ( settings, data ) {
			try {
				(settings.iStateDuration === -1 ? sessionStorage : localStorage).setItem(
					'DataTables_'+settings.sInstance+'_'+location.pathname,
					JSON.stringify( data )
				);
			} catch (e) {
				// noop
			}
		},
	
	
		/**
		 * Callback which allows modification of the state to be saved. Called when the table
		 * has changed state a new state save is required. This method allows modification of
		 * the state saving object prior to actually doing the save, including addition or
		 * other state properties or modification. Note that for plug-in authors, you should
		 * use the `stateSaveParams` event to save parameters for a plug-in.
		 */
		"fnStateSaveParams": null,
	
	
		/**
		 * Duration for which the saved state information is considered valid. After this period
		 * has elapsed the state will be returned to the default.
		 * Value is given in seconds.
		 */
		"iStateDuration": 7200,
	
	
		/**
		 * Number of rows to display on a single page when using pagination. If
		 * feature enabled (`lengthChange`) then the end user will be able to override
		 * this to a custom setting using a pop-up menu.
		 */
		"iDisplayLength": 10,
	
	
		/**
		 * Define the starting point for data display when using DataTables with
		 * pagination. Note that this parameter is the number of records, rather than
		 * the page number, so if you have 10 records per page and want to start on
		 * the third page, it should be "20".
		 */
		"iDisplayStart": 0,
	
	
		/**
		 * By default DataTables allows keyboard navigation of the table (sorting, paging,
		 * and filtering) by adding a `tabindex` attribute to the required elements. This
		 * allows you to tab through the controls and press the enter key to activate them.
		 * The tabindex is default 0, meaning that the tab follows the flow of the document.
		 * You can overrule this using this parameter if you wish. Use a value of -1 to
		 * disable built-in keyboard navigation.
		 */
		"iTabIndex": 0,
	
	
		/**
		 * Classes that DataTables assigns to the various components and features
		 * that it adds to the HTML table. This allows classes to be configured
		 * during initialisation in addition to through the static
		 * {@link DataTable.ext.oStdClasses} object).
		 */
		"oClasses": {},
	
	
		/**
		 * All strings that DataTables uses in the user interface that it creates
		 * are defined in this object, allowing you to modified them individually or
		 * completely replace them all as required.
		 */
		"oLanguage": {
			/**
			 * Strings that are used for WAI-ARIA labels and controls only (these are not
			 * actually visible on the page, but will be read by screenreaders, and thus
			 * must be internationalised as well).
			 */
			"oAria": {
				/**
				 * ARIA label that is added to the table headers when the column may be sorted
				 */
				"orderable": ": Activate to sort",
	
				/**
				 * ARIA label that is added to the table headers when the column is currently being sorted
				 */
				"orderableReverse": ": Activate to invert sorting",
	
				/**
				 * ARIA label that is added to the table headers when the column is currently being 
				 * sorted and next step is to remove sorting
				 */
				"orderableRemove": ": Activate to remove sorting",
	
				paginate: {
					first: 'First',
					last: 'Last',
					next: 'Next',
					previous: 'Previous'
				}
			},
	
			/**
			 * Pagination string used by DataTables for the built-in pagination
			 * control types.
			 */
			"oPaginate": {
				/**
				 * Label and character for first page button («)
				 */
				"sFirst": "\u00AB",
	
				/**
				 * Last page button (»)
				 */
				"sLast": "\u00BB",
	
				/**
				 * Next page button (›)
				 */
				"sNext": "\u203A",
	
				/**
				 * Previous page button (‹)
				 */
				"sPrevious": "\u2039",
			},
	
			/**
			 * Plural object for the data type the table is showing
			 */
			entries: {
				_: "entries",
				1: "entry"
			},
	
			/**
			 * This string is shown in preference to `zeroRecords` when the table is
			 * empty of data (regardless of filtering). Note that this is an optional
			 * parameter - if it is not given, the value of `zeroRecords` will be used
			 * instead (either the default or given value).
			 */
			"sEmptyTable": "No data available in table",
	
	
			/**
			 * This string gives information to the end user about the information
			 * that is current on display on the page. The following tokens can be
			 * used in the string and will be dynamically replaced as the table
			 * display updates. This tokens can be placed anywhere in the string, or
			 * removed as needed by the language requires:
			 *
			 * * `\_START\_` - Display index of the first record on the current page
			 * * `\_END\_` - Display index of the last record on the current page
			 * * `\_TOTAL\_` - Number of records in the table after filtering
			 * * `\_MAX\_` - Number of records in the table without filtering
			 * * `\_PAGE\_` - Current page number
			 * * `\_PAGES\_` - Total number of pages of data in the table
			 */
			"sInfo": "Showing _START_ to _END_ of _TOTAL_ _ENTRIES-TOTAL_",
	
	
			/**
			 * Display information string for when the table is empty. Typically the
			 * format of this string should match `info`.
			 */
			"sInfoEmpty": "Showing 0 to 0 of 0 _ENTRIES-TOTAL_",
	
	
			/**
			 * When a user filters the information in a table, this string is appended
			 * to the information (`info`) to give an idea of how strong the filtering
			 * is. The variable _MAX_ is dynamically updated.
			 */
			"sInfoFiltered": "(filtered from _MAX_ total _ENTRIES-MAX_)",
	
	
			/**
			 * If can be useful to append extra information to the info string at times,
			 * and this variable does exactly that. This information will be appended to
			 * the `info` (`infoEmpty` and `infoFiltered` in whatever combination they are
			 * being used) at all times.
			 */
			"sInfoPostFix": "",
	
	
			/**
			 * This decimal place operator is a little different from the other
			 * language options since DataTables doesn't output floating point
			 * numbers, so it won't ever use this for display of a number. Rather,
			 * what this parameter does is modify the sort methods of the table so
			 * that numbers which are in a format which has a character other than
			 * a period (`.`) as a decimal place will be sorted numerically.
			 *
			 * Note that numbers with different decimal places cannot be shown in
			 * the same table and still be sortable, the table must be consistent.
			 * However, multiple different tables on the page can use different
			 * decimal place characters.
			 */
			"sDecimal": "",
	
	
			/**
			 * DataTables has a build in number formatter (`formatNumber`) which is
			 * used to format large numbers that are used in the table information.
			 * By default a comma is used, but this can be trivially changed to any
			 * character you wish with this parameter.
			 */
			"sThousands": ",",
	
	
			/**
			 * Detail the action that will be taken when the drop down menu for the
			 * pagination length option is changed. The '_MENU_' variable is replaced
			 * with a default select list of 10, 25, 50 and 100, and can be replaced
			 * with a custom select box if required.
			 */
			"sLengthMenu": "_MENU_ _ENTRIES_ per page",
	
	
			/**
			 * When using Ajax sourced data and during the first draw when DataTables is
			 * gathering the data, this message is shown in an empty row in the table to
			 * indicate to the end user the the data is being loaded. Note that this
			 * parameter is not used when loading data by server-side processing, just
			 * Ajax sourced data with client-side processing.
			 */
			"sLoadingRecords": "Loading...",
	
	
			/**
			 * Text which is displayed when the table is processing a user action
			 * (usually a sort command or similar).
			 */
			"sProcessing": "",
	
	
			/**
			 * Details the actions that will be taken when the user types into the
			 * filtering input text box. The variable "_INPUT_", if used in the string,
			 * is replaced with the HTML text box for the filtering input allowing
			 * control over where it appears in the string. If "_INPUT_" is not given
			 * then the input box is appended to the string automatically.
			 */
			"sSearch": "Search:",
	
	
			/**
			 * Assign a `placeholder` attribute to the search `input` element
			 *  @type string
			 *  @default 
			 *
			 *  @dtopt Language
			 *  @name DataTable.defaults.language.searchPlaceholder
			 */
			"sSearchPlaceholder": "",
	
	
			/**
			 * All of the language information can be stored in a file on the
			 * server-side, which DataTables will look up if this parameter is passed.
			 * It must store the URL of the language file, which is in a JSON format,
			 * and the object has the same properties as the oLanguage object in the
			 * initialiser object (i.e. the above parameters). Please refer to one of
			 * the example language files to see how this works in action.
			 */
			"sUrl": "",
	
	
			/**
			 * Text shown inside the table records when the is no information to be
			 * displayed after filtering. `emptyTable` is shown when there is simply no
			 * information in the table at all (regardless of filtering).
			 */
			"sZeroRecords": "No matching records found"
		},
	
	
		/**
		 * This parameter allows you to have define the global filtering state at
		 * initialisation time. As an object the `search` parameter must be
		 * defined, but all other parameters are optional. When `regex` is true,
		 * the search string will be treated as a regular expression, when false
		 * (default) it will be treated as a straight string. When `smart`
		 * DataTables will use it's smart filtering methods (to word match at
		 * any point in the data), when false this will not be done.
		 */
		"oSearch": $.extend( {}, DataTable.models.oSearch ),
	
	
		/**
		 * Table and control layout. This replaces the legacy `dom` option.
		 */
		layout: {
			topStart: 'pageLength',
			topEnd: 'search',
			bottomStart: 'info',
			bottomEnd: 'paging'
		},
	
	
		/**
		 * Legacy DOM layout option
		 */
		"sDom": null,
	
	
		/**
		 * Search delay option. This will throttle full table searches that use the
		 * DataTables provided search input element (it does not effect calls to
		 * `dt-api search()`, providing a delay before the search is made.
		 */
		"searchDelay": null,
	
	
		/**
		 * DataTables features six different built-in options for the buttons to
		 * display for pagination control:
		 *
		 * * `numbers` - Page number buttons only
		 * * `simple` - 'Previous' and 'Next' buttons only
		 * * 'simple_numbers` - 'Previous' and 'Next' buttons, plus page numbers
		 * * `full` - 'First', 'Previous', 'Next' and 'Last' buttons
		 * * `full_numbers` - 'First', 'Previous', 'Next' and 'Last' buttons, plus page numbers
		 * * `first_last_numbers` - 'First' and 'Last' buttons, plus page numbers
		 */
		"sPaginationType": "full_numbers",
	
	
		/**
		 * Enable horizontal scrolling. When a table is too wide to fit into a
		 * certain layout, or you have a large number of columns in the table, you
		 * can enable x-scrolling to show the table in a viewport, which can be
		 * scrolled. This property can be `true` which will allow the table to
		 * scroll horizontally when needed, or any CSS unit, or a number (in which
		 * case it will be treated as a pixel measurement). Setting as simply `true`
		 * is recommended.
		 */
		"sScrollX": "",
	
	
		/**
		 * This property can be used to force a DataTable to use more width than it
		 * might otherwise do when x-scrolling is enabled. For example if you have a
		 * table which requires to be well spaced, this parameter is useful for
		 * "over-sizing" the table, and thus forcing scrolling. This property can by
		 * any CSS unit, or a number (in which case it will be treated as a pixel
		 * measurement).
		 */
		"sScrollXInner": "",
	
	
		/**
		 * Enable vertical scrolling. Vertical scrolling will constrain the DataTable
		 * to the given height, and enable scrolling for any data which overflows the
		 * current viewport. This can be used as an alternative to paging to display
		 * a lot of data in a small area (although paging and scrolling can both be
		 * enabled at the same time). This property can be any CSS unit, or a number
		 * (in which case it will be treated as a pixel measurement).
		 */
		"sScrollY": "",
	
	
		/**
		 * __Deprecated__ The functionality provided by this parameter has now been
		 * superseded by that provided through `ajax`, which should be used instead.
		 *
		 * Set the HTTP method that is used to make the Ajax call for server-side
		 * processing or Ajax sourced data.
		 */
		"sServerMethod": "GET",
	
	
		/**
		 * DataTables makes use of renderers when displaying HTML elements for
		 * a table. These renderers can be added or modified by plug-ins to
		 * generate suitable mark-up for a site. For example the Bootstrap
		 * integration plug-in for DataTables uses a paging button renderer to
		 * display pagination buttons in the mark-up required by Bootstrap.
		 *
		 * For further information about the renderers available see
		 * DataTable.ext.renderer
		 */
		"renderer": null,
	
	
		/**
		 * Set the data property name that DataTables should use to get a row's id
		 * to set as the `id` property in the node.
		 */
		"rowId": "DT_RowId",
	
	
		/**
		 * Caption value
		 */
		"caption": null
	};
	
	_fnHungarianMap( DataTable.defaults );
	
	
	
	/*
	 * Developer note - See note in model.defaults.js about the use of Hungarian
	 * notation and camel case.
	 */
	
	/**
	 * Column options that can be given to DataTables at initialisation time.
	 *  @namespace
	 */
	DataTable.defaults.column = {
		/**
		 * Define which column(s) an order will occur on for this column. This
		 * allows a column's ordering to take multiple columns into account when
		 * doing a sort or use the data from a different column. For example first
		 * name / last name columns make sense to do a multi-column sort over the
		 * two columns.
		 */
		"aDataSort": null,
		"iDataSort": -1,
	
		ariaTitle: '',
	
	
		/**
		 * You can control the default ordering direction, and even alter the
		 * behaviour of the sort handler (i.e. only allow ascending ordering etc)
		 * using this parameter.
		 */
		"asSorting": [ 'asc', 'desc', '' ],
	
	
		/**
		 * Enable or disable filtering on the data in this column.
		 */
		"bSearchable": true,
	
	
		/**
		 * Enable or disable ordering on this column.
		 */
		"bSortable": true,
	
	
		/**
		 * Enable or disable the display of this column.
		 */
		"bVisible": true,
	
	
		/**
		 * Developer definable function that is called whenever a cell is created (Ajax source,
		 * etc) or processed for input (DOM source). This can be used as a compliment to mRender
		 * allowing you to modify the DOM element (add background colour for example) when the
		 * element is available.
		 */
		"fnCreatedCell": null,
	
	
		/**
		 * This property can be used to read data from any data source property,
		 * including deeply nested objects / properties. `data` can be given in a
		 * number of different ways which effect its behaviour:
		 *
		 * * `integer` - treated as an array index for the data source. This is the
		 *   default that DataTables uses (incrementally increased for each column).
		 * * `string` - read an object property from the data source. There are
		 *   three 'special' options that can be used in the string to alter how
		 *   DataTables reads the data from the source object:
		 *    * `.` - Dotted Javascript notation. Just as you use a `.` in
		 *      Javascript to read from nested objects, so to can the options
		 *      specified in `data`. For example: `browser.version` or
		 *      `browser.name`. If your object parameter name contains a period, use
		 *      `\\` to escape it - i.e. `first\\.name`.
		 *    * `[]` - Array notation. DataTables can automatically combine data
		 *      from and array source, joining the data with the characters provided
		 *      between the two brackets. For example: `name[, ]` would provide a
		 *      comma-space separated list from the source array. If no characters
		 *      are provided between the brackets, the original array source is
		 *      returned.
		 *    * `()` - Function notation. Adding `()` to the end of a parameter will
		 *      execute a function of the name given. For example: `browser()` for a
		 *      simple function on the data source, `browser.version()` for a
		 *      function in a nested property or even `browser().version` to get an
		 *      object property if the function called returns an object. Note that
		 *      function notation is recommended for use in `render` rather than
		 *      `data` as it is much simpler to use as a renderer.
		 * * `null` - use the original data source for the row rather than plucking
		 *   data directly from it. This action has effects on two other
		 *   initialisation options:
		 *    * `defaultContent` - When null is given as the `data` option and
		 *      `defaultContent` is specified for the column, the value defined by
		 *      `defaultContent` will be used for the cell.
		 *    * `render` - When null is used for the `data` option and the `render`
		 *      option is specified for the column, the whole data source for the
		 *      row is used for the renderer.
		 * * `function` - the function given will be executed whenever DataTables
		 *   needs to set or get the data for a cell in the column. The function
		 *   takes three parameters:
		 *    * Parameters:
		 *      * `{array|object}` The data source for the row
		 *      * `{string}` The type call data requested - this will be 'set' when
		 *        setting data or 'filter', 'display', 'type', 'sort' or undefined
		 *        when gathering data. Note that when `undefined` is given for the
		 *        type DataTables expects to get the raw data for the object back<
		 *      * `{*}` Data to set when the second parameter is 'set'.
		 *    * Return:
		 *      * The return value from the function is not required when 'set' is
		 *        the type of call, but otherwise the return is what will be used
		 *        for the data requested.
		 *
		 * Note that `data` is a getter and setter option. If you just require
		 * formatting of data for output, you will likely want to use `render` which
		 * is simply a getter and thus simpler to use.
		 *
		 * Note that prior to DataTables 1.9.2 `data` was called `mDataProp`. The
		 * name change reflects the flexibility of this property and is consistent
		 * with the naming of mRender. If 'mDataProp' is given, then it will still
		 * be used by DataTables, as it automatically maps the old name to the new
		 * if required.
		 */
		"mData": null,
	
	
		/**
		 * This property is the rendering partner to `data` and it is suggested that
		 * when you want to manipulate data for display (including filtering,
		 * sorting etc) without altering the underlying data for the table, use this
		 * property. `render` can be considered to be the the read only companion to
		 * `data` which is read / write (then as such more complex). Like `data`
		 * this option can be given in a number of different ways to effect its
		 * behaviour:
		 *
		 * * `integer` - treated as an array index for the data source. This is the
		 *   default that DataTables uses (incrementally increased for each column).
		 * * `string` - read an object property from the data source. There are
		 *   three 'special' options that can be used in the string to alter how
		 *   DataTables reads the data from the source object:
		 *    * `.` - Dotted Javascript notation. Just as you use a `.` in
		 *      Javascript to read from nested objects, so to can the options
		 *      specified in `data`. For example: `browser.version` or
		 *      `browser.name`. If your object parameter name contains a period, use
		 *      `\\` to escape it - i.e. `first\\.name`.
		 *    * `[]` - Array notation. DataTables can automatically combine data
		 *      from and array source, joining the data with the characters provided
		 *      between the two brackets. For example: `name[, ]` would provide a
		 *      comma-space separated list from the source array. If no characters
		 *      are provided between the brackets, the original array source is
		 *      returned.
		 *    * `()` - Function notation. Adding `()` to the end of a parameter will
		 *      execute a function of the name given. For example: `browser()` for a
		 *      simple function on the data source, `browser.version()` for a
		 *      function in a nested property or even `browser().version` to get an
		 *      object property if the function called returns an object.
		 * * `object` - use different data for the different data types requested by
		 *   DataTables ('filter', 'display', 'type' or 'sort'). The property names
		 *   of the object is the data type the property refers to and the value can
		 *   defined using an integer, string or function using the same rules as
		 *   `render` normally does. Note that an `_` option _must_ be specified.
		 *   This is the default value to use if you haven't specified a value for
		 *   the data type requested by DataTables.
		 * * `function` - the function given will be executed whenever DataTables
		 *   needs to set or get the data for a cell in the column. The function
		 *   takes three parameters:
		 *    * Parameters:
		 *      * {array|object} The data source for the row (based on `data`)
		 *      * {string} The type call data requested - this will be 'filter',
		 *        'display', 'type' or 'sort'.
		 *      * {array|object} The full data source for the row (not based on
		 *        `data`)
		 *    * Return:
		 *      * The return value from the function is what will be used for the
		 *        data requested.
		 */
		"mRender": null,
	
	
		/**
		 * Change the cell type created for the column - either TD cells or TH cells. This
		 * can be useful as TH cells have semantic meaning in the table body, allowing them
		 * to act as a header for a row (you may wish to add scope='row' to the TH elements).
		 */
		"sCellType": "td",
	
	
		/**
		 * Class to give to each cell in this column.
		 */
		"sClass": "",
	
		/**
		 * When DataTables calculates the column widths to assign to each column,
		 * it finds the longest string in each column and then constructs a
		 * temporary table and reads the widths from that. The problem with this
		 * is that "mmm" is much wider then "iiii", but the latter is a longer
		 * string - thus the calculation can go wrong (doing it properly and putting
		 * it into an DOM object and measuring that is horribly(!) slow). Thus as
		 * a "work around" we provide this option. It will append its value to the
		 * text that is found to be the longest string for the column - i.e. padding.
		 * Generally you shouldn't need this!
		 */
		"sContentPadding": "",
	
	
		/**
		 * Allows a default value to be given for a column's data, and will be used
		 * whenever a null data source is encountered (this can be because `data`
		 * is set to null, or because the data source itself is null).
		 */
		"sDefaultContent": null,
	
	
		/**
		 * This parameter is only used in DataTables' server-side processing. It can
		 * be exceptionally useful to know what columns are being displayed on the
		 * client side, and to map these to database fields. When defined, the names
		 * also allow DataTables to reorder information from the server if it comes
		 * back in an unexpected order (i.e. if you switch your columns around on the
		 * client-side, your server-side code does not also need updating).
		 */
		"sName": "",
	
	
		/**
		 * Defines a data source type for the ordering which can be used to read
		 * real-time information from the table (updating the internally cached
		 * version) prior to ordering. This allows ordering to occur on user
		 * editable elements such as form inputs.
		 */
		"sSortDataType": "std",
	
	
		/**
		 * The title of this column.
		 */
		"sTitle": null,
	
	
		/**
		 * The type allows you to specify how the data for this column will be
		 * ordered. Four types (string, numeric, date and html (which will strip
		 * HTML tags before ordering)) are currently available. Note that only date
		 * formats understood by Javascript's Date() object will be accepted as type
		 * date. For example: "Mar 26, 2008 5:03 PM". May take the values: 'string',
		 * 'numeric', 'date' or 'html' (by default). Further types can be adding
		 * through plug-ins.
		 */
		"sType": null,
	
	
		/**
		 * Defining the width of the column, this parameter may take any CSS value
		 * (3em, 20px etc). DataTables applies 'smart' widths to columns which have not
		 * been given a specific width through this interface ensuring that the table
		 * remains readable.
		 */
		"sWidth": null
	};
	
	_fnHungarianMap( DataTable.defaults.column );
	
	
	
	/**
	 * DataTables settings object - this holds all the information needed for a
	 * given table, including configuration, data and current application of the
	 * table options. DataTables does not have a single instance for each DataTable
	 * with the settings attached to that instance, but rather instances of the
	 * DataTable "class" are created on-the-fly as needed (typically by a
	 * $().dataTable() call) and the settings object is then applied to that
	 * instance.
	 *
	 * Note that this object is related to {@link DataTable.defaults} but this
	 * one is the internal data store for DataTables's cache of columns. It should
	 * NOT be manipulated outside of DataTables. Any configuration should be done
	 * through the initialisation options.
	 */
	DataTable.models.oSettings = {
		/**
		 * Primary features of DataTables and their enablement state.
		 */
		"oFeatures": {
	
			/**
			 * Flag to say if DataTables should automatically try to calculate the
			 * optimum table and columns widths (true) or not (false).
			 * Note that this parameter will be set by the initialisation routine. To
			 * set a default use {@link DataTable.defaults}.
			 */
			"bAutoWidth": null,
	
			/**
			 * Delay the creation of TR and TD elements until they are actually
			 * needed by a driven page draw. This can give a significant speed
			 * increase for Ajax source and Javascript source data, but makes no
			 * difference at all for DOM and server-side processing tables.
			 * Note that this parameter will be set by the initialisation routine. To
			 * set a default use {@link DataTable.defaults}.
			 */
			"bDeferRender": null,
	
			/**
			 * Enable filtering on the table or not. Note that if this is disabled
			 * then there is no filtering at all on the table, including fnFilter.
			 * To just remove the filtering input use sDom and remove the 'f' option.
			 * Note that this parameter will be set by the initialisation routine. To
			 * set a default use {@link DataTable.defaults}.
			 */
			"bFilter": null,
	
			/**
			 * Used only for compatiblity with DT1
			 * @deprecated
			 */
			"bInfo": true,
	
			/**
			 * Used only for compatiblity with DT1
			 * @deprecated
			 */
			"bLengthChange": true,
	
			/**
			 * Pagination enabled or not. Note that if this is disabled then length
			 * changing must also be disabled.
			 * Note that this parameter will be set by the initialisation routine. To
			 * set a default use {@link DataTable.defaults}.
			 */
			"bPaginate": null,
	
			/**
			 * Processing indicator enable flag whenever DataTables is enacting a
			 * user request - typically an Ajax request for server-side processing.
			 * Note that this parameter will be set by the initialisation routine. To
			 * set a default use {@link DataTable.defaults}.
			 */
			"bProcessing": null,
	
			/**
			 * Server-side processing enabled flag - when enabled DataTables will
			 * get all data from the server for every draw - there is no filtering,
			 * sorting or paging done on the client-side.
			 * Note that this parameter will be set by the initialisation routine. To
			 * set a default use {@link DataTable.defaults}.
			 */
			"bServerSide": null,
	
			/**
			 * Sorting enablement flag.
			 * Note that this parameter will be set by the initialisation routine. To
			 * set a default use {@link DataTable.defaults}.
			 */
			"bSort": null,
	
			/**
			 * Multi-column sorting
			 * Note that this parameter will be set by the initialisation routine. To
			 * set a default use {@link DataTable.defaults}.
			 */
			"bSortMulti": null,
	
			/**
			 * Apply a class to the columns which are being sorted to provide a
			 * visual highlight or not. This can slow things down when enabled since
			 * there is a lot of DOM interaction.
			 * Note that this parameter will be set by the initialisation routine. To
			 * set a default use {@link DataTable.defaults}.
			 */
			"bSortClasses": null,
	
			/**
			 * State saving enablement flag.
			 * Note that this parameter will be set by the initialisation routine. To
			 * set a default use {@link DataTable.defaults}.
			 */
			"bStateSave": null
		},
	
	
		/**
		 * Scrolling settings for a table.
		 */
		"oScroll": {
			/**
			 * When the table is shorter in height than sScrollY, collapse the
			 * table container down to the height of the table (when true).
			 * Note that this parameter will be set by the initialisation routine. To
			 * set a default use {@link DataTable.defaults}.
			 */
			"bCollapse": null,
	
			/**
			 * Width of the scrollbar for the web-browser's platform. Calculated
			 * during table initialisation.
			 */
			"iBarWidth": 0,
	
			/**
			 * Viewport width for horizontal scrolling. Horizontal scrolling is
			 * disabled if an empty string.
			 * Note that this parameter will be set by the initialisation routine. To
			 * set a default use {@link DataTable.defaults}.
			 */
			"sX": null,
	
			/**
			 * Width to expand the table to when using x-scrolling. Typically you
			 * should not need to use this.
			 * Note that this parameter will be set by the initialisation routine. To
			 * set a default use {@link DataTable.defaults}.
			 *  @deprecated
			 */
			"sXInner": null,
	
			/**
			 * Viewport height for vertical scrolling. Vertical scrolling is disabled
			 * if an empty string.
			 * Note that this parameter will be set by the initialisation routine. To
			 * set a default use {@link DataTable.defaults}.
			 */
			"sY": null
		},
	
		/**
		 * Language information for the table.
		 */
		"oLanguage": {
			/**
			 * Information callback function. See
			 * {@link DataTable.defaults.fnInfoCallback}
			 */
			"fnInfoCallback": null
		},
	
		/**
		 * Browser support parameters
		 */
		"oBrowser": {
			/**
			 * Determine if the vertical scrollbar is on the right or left of the
			 * scrolling container - needed for rtl language layout, although not
			 * all browsers move the scrollbar (Safari).
			 */
			"bScrollbarLeft": false,
	
			/**
			 * Browser scrollbar width
			 */
			"barWidth": 0
		},
	
	
		"ajax": null,
	
	
		/**
		 * Array referencing the nodes which are used for the features. The
		 * parameters of this object match what is allowed by sDom - i.e.
		 *   <ul>
		 *     <li>'l' - Length changing</li>
		 *     <li>'f' - Filtering input</li>
		 *     <li>'t' - The table!</li>
		 *     <li>'i' - Information</li>
		 *     <li>'p' - Pagination</li>
		 *     <li>'r' - pRocessing</li>
		 *   </ul>
		 */
		"aanFeatures": [],
	
		/**
		 * Store data information - see {@link DataTable.models.oRow} for detailed
		 * information.
		 */
		"aoData": [],
	
		/**
		 * Array of indexes which are in the current display (after filtering etc)
		 */
		"aiDisplay": [],
	
		/**
		 * Array of indexes for display - no filtering
		 */
		"aiDisplayMaster": [],
	
		/**
		 * Map of row ids to data indexes
		 */
		"aIds": {},
	
		/**
		 * Store information about each column that is in use
		 */
		"aoColumns": [],
	
		/**
		 * Store information about the table's header
		 */
		"aoHeader": [],
	
		/**
		 * Store information about the table's footer
		 */
		"aoFooter": [],
	
		/**
		 * Store the applied global search information in case we want to force a
		 * research or compare the old search to a new one.
		 * Note that this parameter will be set by the initialisation routine. To
		 * set a default use {@link DataTable.defaults}.
		 */
		"oPreviousSearch": {},
	
		/**
		 * Store for named searches
		 */
		searchFixed: {},
	
		/**
		 * Store the applied search for each column - see
		 * {@link DataTable.models.oSearch} for the format that is used for the
		 * filtering information for each column.
		 */
		"aoPreSearchCols": [],
	
		/**
		 * Sorting that is applied to the table. Note that the inner arrays are
		 * used in the following manner:
		 * <ul>
		 *   <li>Index 0 - column number</li>
		 *   <li>Index 1 - current sorting direction</li>
		 * </ul>
		 * Note that this parameter will be set by the initialisation routine. To
		 * set a default use {@link DataTable.defaults}.
		 */
		"aaSorting": null,
	
		/**
		 * Sorting that is always applied to the table (i.e. prefixed in front of
		 * aaSorting).
		 * Note that this parameter will be set by the initialisation routine. To
		 * set a default use {@link DataTable.defaults}.
		 */
		"aaSortingFixed": [],
	
		/**
		 * If restoring a table - we should restore its width
		 */
		"sDestroyWidth": 0,
	
		/**
		 * Callback functions array for every time a row is inserted (i.e. on a draw).
		 */
		"aoRowCallback": [],
	
		/**
		 * Callback functions for the header on each draw.
		 */
		"aoHeaderCallback": [],
	
		/**
		 * Callback function for the footer on each draw.
		 */
		"aoFooterCallback": [],
	
		/**
		 * Array of callback functions for draw callback functions
		 */
		"aoDrawCallback": [],
	
		/**
		 * Array of callback functions for row created function
		 */
		"aoRowCreatedCallback": [],
	
		/**
		 * Callback functions for just before the table is redrawn. A return of
		 * false will be used to cancel the draw.
		 */
		"aoPreDrawCallback": [],
	
		/**
		 * Callback functions for when the table has been initialised.
		 */
		"aoInitComplete": [],
	
	
		/**
		 * Callbacks for modifying the settings to be stored for state saving, prior to
		 * saving state.
		 */
		"aoStateSaveParams": [],
	
		/**
		 * Callbacks for modifying the settings that have been stored for state saving
		 * prior to using the stored values to restore the state.
		 */
		"aoStateLoadParams": [],
	
		/**
		 * Callbacks for operating on the settings object once the saved state has been
		 * loaded
		 */
		"aoStateLoaded": [],
	
		/**
		 * Cache the table ID for quick access
		 */
		"sTableId": "",
	
		/**
		 * The TABLE node for the main table
		 */
		"nTable": null,
	
		/**
		 * Permanent ref to the thead element
		 */
		"nTHead": null,
	
		/**
		 * Permanent ref to the tfoot element - if it exists
		 */
		"nTFoot": null,
	
		/**
		 * Permanent ref to the tbody element
		 */
		"nTBody": null,
	
		/**
		 * Cache the wrapper node (contains all DataTables controlled elements)
		 */
		"nTableWrapper": null,
	
		/**
		 * Indicate if all required information has been read in
		 */
		"bInitialised": false,
	
		/**
		 * Information about open rows. Each object in the array has the parameters
		 * 'nTr' and 'nParent'
		 */
		"aoOpenRows": [],
	
		/**
		 * Dictate the positioning of DataTables' control elements - see
		 * {@link DataTable.model.oInit.sDom}.
		 * Note that this parameter will be set by the initialisation routine. To
		 * set a default use {@link DataTable.defaults}.
		 */
		"sDom": null,
	
		/**
		 * Search delay (in mS)
		 */
		"searchDelay": null,
	
		/**
		 * Which type of pagination should be used.
		 * Note that this parameter will be set by the initialisation routine. To
		 * set a default use {@link DataTable.defaults}.
		 */
		"sPaginationType": "two_button",
	
		/**
		 * Number of paging controls on the page. Only used for backwards compatibility
		 */
		pagingControls: 0,
	
		/**
		 * The state duration (for `stateSave`) in seconds.
		 * Note that this parameter will be set by the initialisation routine. To
		 * set a default use {@link DataTable.defaults}.
		 */
		"iStateDuration": 0,
	
		/**
		 * Array of callback functions for state saving. Each array element is an
		 * object with the following parameters:
		 *   <ul>
		 *     <li>function:fn - function to call. Takes two parameters, oSettings
		 *       and the JSON string to save that has been thus far created. Returns
		 *       a JSON string to be inserted into a json object
		 *       (i.e. '"param": [ 0, 1, 2]')</li>
		 *     <li>string:sName - name of callback</li>
		 *   </ul>
		 */
		"aoStateSave": [],
	
		/**
		 * Array of callback functions for state loading. Each array element is an
		 * object with the following parameters:
		 *   <ul>
		 *     <li>function:fn - function to call. Takes two parameters, oSettings
		 *       and the object stored. May return false to cancel state loading</li>
		 *     <li>string:sName - name of callback</li>
		 *   </ul>
		 */
		"aoStateLoad": [],
	
		/**
		 * State that was saved. Useful for back reference
		 */
		"oSavedState": null,
	
		/**
		 * State that was loaded. Useful for back reference
		 */
		"oLoadedState": null,
	
		/**
		 * Note if draw should be blocked while getting data
		 */
		"bAjaxDataGet": true,
	
		/**
		 * The last jQuery XHR object that was used for server-side data gathering.
		 * This can be used for working with the XHR information in one of the
		 * callbacks
		 */
		"jqXHR": null,
	
		/**
		 * JSON returned from the server in the last Ajax request
		 */
		"json": undefined,
	
		/**
		 * Data submitted as part of the last Ajax request
		 */
		"oAjaxData": undefined,
	
		/**
		 * Send the XHR HTTP method - GET or POST (could be PUT or DELETE if
		 * required).
		 * Note that this parameter will be set by the initialisation routine. To
		 * set a default use {@link DataTable.defaults}.
		 */
		"sServerMethod": null,
	
		/**
		 * Format numbers for display.
		 * Note that this parameter will be set by the initialisation routine. To
		 * set a default use {@link DataTable.defaults}.
		 */
		"fnFormatNumber": null,
	
		/**
		 * List of options that can be used for the user selectable length menu.
		 * Note that this parameter will be set by the initialisation routine. To
		 * set a default use {@link DataTable.defaults}.
		 */
		"aLengthMenu": null,
	
		/**
		 * Counter for the draws that the table does. Also used as a tracker for
		 * server-side processing
		 */
		"iDraw": 0,
	
		/**
		 * Indicate if a redraw is being done - useful for Ajax
		 */
		"bDrawing": false,
	
		/**
		 * Draw index (iDraw) of the last error when parsing the returned data
		 */
		"iDrawError": -1,
	
		/**
		 * Paging display length
		 */
		"_iDisplayLength": 10,
	
		/**
		 * Paging start point - aiDisplay index
		 */
		"_iDisplayStart": 0,
	
		/**
		 * Server-side processing - number of records in the result set
		 * (i.e. before filtering), Use fnRecordsTotal rather than
		 * this property to get the value of the number of records, regardless of
		 * the server-side processing setting.
		 */
		"_iRecordsTotal": 0,
	
		/**
		 * Server-side processing - number of records in the current display set
		 * (i.e. after filtering). Use fnRecordsDisplay rather than
		 * this property to get the value of the number of records, regardless of
		 * the server-side processing setting.
		 */
		"_iRecordsDisplay": 0,
	
		/**
		 * The classes to use for the table
		 */
		"oClasses": {},
	
		/**
		 * Flag attached to the settings object so you can check in the draw
		 * callback if filtering has been done in the draw. Deprecated in favour of
		 * events.
		 *  @deprecated
		 */
		"bFiltered": false,
	
		/**
		 * Flag attached to the settings object so you can check in the draw
		 * callback if sorting has been done in the draw. Deprecated in favour of
		 * events.
		 *  @deprecated
		 */
		"bSorted": false,
	
		/**
		 * Indicate that if multiple rows are in the header and there is more than
		 * one unique cell per column, if the top one (true) or bottom one (false)
		 * should be used for sorting / title by DataTables.
		 * Note that this parameter will be set by the initialisation routine. To
		 * set a default use {@link DataTable.defaults}.
		 */
		"bSortCellsTop": null,
	
		/**
		 * Initialisation object that is used for the table
		 */
		"oInit": null,
	
		/**
		 * Destroy callback functions - for plug-ins to attach themselves to the
		 * destroy so they can clean up markup and events.
		 */
		"aoDestroyCallback": [],
	
	
		/**
		 * Get the number of records in the current record set, before filtering
		 */
		"fnRecordsTotal": function ()
		{
			return _fnDataSource( this ) == 'ssp' ?
				this._iRecordsTotal * 1 :
				this.aiDisplayMaster.length;
		},
	
		/**
		 * Get the number of records in the current record set, after filtering
		 */
		"fnRecordsDisplay": function ()
		{
			return _fnDataSource( this ) == 'ssp' ?
				this._iRecordsDisplay * 1 :
				this.aiDisplay.length;
		},
	
		/**
		 * Get the display end point - aiDisplay index
		 */
		"fnDisplayEnd": function ()
		{
			var
				len      = this._iDisplayLength,
				start    = this._iDisplayStart,
				calc     = start + len,
				records  = this.aiDisplay.length,
				features = this.oFeatures,
				paginate = features.bPaginate;
	
			if ( features.bServerSide ) {
				return paginate === false || len === -1 ?
					start + records :
					Math.min( start+len, this._iRecordsDisplay );
			}
			else {
				return ! paginate || calc>records || len===-1 ?
					records :
					calc;
			}
		},
	
		/**
		 * The DataTables object for this table
		 */
		"oInstance": null,
	
		/**
		 * Unique identifier for each instance of the DataTables object. If there
		 * is an ID on the table node, then it takes that value, otherwise an
		 * incrementing internal counter is used.
		 */
		"sInstance": null,
	
		/**
		 * tabindex attribute value that is added to DataTables control elements, allowing
		 * keyboard navigation of the table and its controls.
		 */
		"iTabIndex": 0,
	
		/**
		 * DIV container for the footer scrolling table if scrolling
		 */
		"nScrollHead": null,
	
		/**
		 * DIV container for the footer scrolling table if scrolling
		 */
		"nScrollFoot": null,
	
		/**
		 * Last applied sort
		 */
		"aLastSort": [],
	
		/**
		 * Stored plug-in instances
		 */
		"oPlugins": {},
	
		/**
		 * Function used to get a row's id from the row's data
		 */
		"rowIdFn": null,
	
		/**
		 * Data location where to store a row's id
		 */
		"rowId": null,
	
		caption: '',
	
		captionNode: null,
	
		colgroup: null
	};
	
	/**
	 * Extension object for DataTables that is used to provide all extension
	 * options.
	 *
	 * Note that the `DataTable.ext` object is available through
	 * `jQuery.fn.dataTable.ext` where it may be accessed and manipulated. It is
	 * also aliased to `jQuery.fn.dataTableExt` for historic reasons.
	 *  @namespace
	 *  @extends DataTable.models.ext
	 */
	
	
	var extPagination = DataTable.ext.pager;
	
	// Paging buttons configuration
	$.extend( extPagination, {
		simple: function () {
			return [ 'previous', 'next' ];
		},
	
		full: function () {
			return [  'first', 'previous', 'next', 'last' ];
		},
	
		numbers: function () {
			return [ 'numbers' ];
		},
	
		simple_numbers: function () {
			return [ 'previous', 'numbers', 'next' ];
		},
	
		full_numbers: function () {
			return [ 'first', 'previous', 'numbers', 'next', 'last' ];
		},
		
		first_last: function () {
			return ['first', 'last'];
		},
		
		first_last_numbers: function () {
			return ['first', 'numbers', 'last'];
		},
	
		// For testing and plug-ins to use
		_numbers: _pagingNumbers,
	
		// Number of number buttons - legacy, use `numbers` option for paging feature
		numbers_length: 7
	} );
	
	
	$.extend( true, DataTable.ext.renderer, {
		pagingButton: {
			_: function (settings, buttonType, content, active, disabled) {
				var classes = settings.oClasses.paging;
				var btnClasses = [classes.button];
				var btn;
	
				if (active) {
					btnClasses.push(classes.active);
				}
	
				if (disabled) {
					btnClasses.push(classes.disabled)
				}
	
				if (buttonType === 'ellipsis') {
					btn = $('<span class="ellipsis"></span>').html(content)[0];
				}
				else {
					btn = $('<button>', {
						class: btnClasses.join(' '),
						role: 'link',
						type: 'button'
					}).html(content);
				}
	
				return {
					display: btn,
					clicker: btn
				}
			}
		},
	
		pagingContainer: {
			_: function (settings, buttons) {
				// No wrapping element - just append directly to the host
				return buttons;
			}
		}
	} );
	
	// Common function to remove new lines, strip HTML and diacritic control
	var _filterString = function (stripHtml, normalize) {
		return function (str) {
			if (_empty(str) || typeof str !== 'string') {
				return str;
			}
	
			str = str.replace( _re_new_lines, " " );
	
			if (stripHtml) {
				str = _stripHtml(str);
			}
	
			if (normalize) {
				str = _normalize(str, false);
			}
	
			return str;
		};
	}
	
	/*
	 * Public helper functions. These aren't used internally by DataTables, or
	 * called by any of the options passed into DataTables, but they can be used
	 * externally by developers working with DataTables. They are helper functions
	 * to make working with DataTables a little bit easier.
	 */
	
	function __mldFnName(name) {
		return name.replace(/[\W]/g, '_')
	}
	
	// Common logic for moment, luxon or a date action
	function __mld( dt, momentFn, luxonFn, dateFn, arg1 ) {
		if (window.moment) {
			return dt[momentFn]( arg1 );
		}
		else if (window.luxon) {
			return dt[luxonFn]( arg1 );
		}
		
		return dateFn ? dt[dateFn]( arg1 ) : dt;
	}
	
	
	var __mlWarning = false;
	function __mldObj (d, format, locale) {
		var dt;
	
		if (window.moment) {
			dt = window.moment.utc( d, format, locale, true );
	
			if (! dt.isValid()) {
				return null;
			}
		}
		else if (window.luxon) {
			dt = format && typeof d === 'string'
				? window.luxon.DateTime.fromFormat( d, format )
				: window.luxon.DateTime.fromISO( d );
	
			if (! dt.isValid) {
				return null;
			}
	
			dt.setLocale(locale);
		}
		else if (! format) {
			// No format given, must be ISO
			dt = new Date(d);
		}
		else {
			if (! __mlWarning) {
				alert('DataTables warning: Formatted date without Moment.js or Luxon - https://datatables.net/tn/17');
			}
	
			__mlWarning = true;
		}
	
		return dt;
	}
	
	// Wrapper for date, datetime and time which all operate the same way with the exception of
	// the output string for auto locale support
	function __mlHelper (localeString) {
		return function ( from, to, locale, def ) {
			// Luxon and Moment support
			// Argument shifting
			if ( arguments.length === 0 ) {
				locale = 'en';
				to = null; // means toLocaleString
				from = null; // means iso8601
			}
			else if ( arguments.length === 1 ) {
				locale = 'en';
				to = from;
				from = null;
			}
			else if ( arguments.length === 2 ) {
				locale = to;
				to = from;
				from = null;
			}
	
			var typeName = 'datetime' + (to ? '-' + __mldFnName(to) : '');
	
			// Add type detection and sorting specific to this date format - we need to be able to identify
			// date type columns as such, rather than as numbers in extensions. Hence the need for this.
			if (! DataTable.ext.type.order[typeName]) {
				DataTable.type(typeName, {
					detect: function (d) {
						// The renderer will give the value to type detect as the type!
						return d === typeName ? typeName : false;
					},
					order: {
						pre: function (d) {
							// The renderer gives us Moment, Luxon or Date obects for the sorting, all of which have a
							// `valueOf` which gives milliseconds epoch
							return d.valueOf();
						}
					},
					className: 'dt-right'
				});
			}
		
			return function ( d, type ) {
				// Allow for a default value
				if (d === null || d === undefined) {
					if (def === '--now') {
						// We treat everything as UTC further down, so no changes are
						// made, as such need to get the local date / time as if it were
						// UTC
						var local = new Date();
						d = new Date( Date.UTC(
							local.getFullYear(), local.getMonth(), local.getDate(),
							local.getHours(), local.getMinutes(), local.getSeconds()
						) );
					}
					else {
						d = '';
					}
				}
	
				if (type === 'type') {
					// Typing uses the type name for fast matching
					return typeName;
				}
	
				if (d === '') {
					return type !== 'sort'
						? ''
						: __mldObj('0000-01-01 00:00:00', null, locale);
				}
	
				// Shortcut. If `from` and `to` are the same, we are using the renderer to
				// format for ordering, not display - its already in the display format.
				if ( to !== null && from === to && type !== 'sort' && type !== 'type' && ! (d instanceof Date) ) {
					return d;
				}
	
				var dt = __mldObj(d, from, locale);
	
				if (dt === null) {
					return d;
				}
	
				if (type === 'sort') {
					return dt;
				}
				
				var formatted = to === null
					? __mld(dt, 'toDate', 'toJSDate', '')[localeString]()
					: __mld(dt, 'format', 'toFormat', 'toISOString', to);
	
				// XSS protection
				return type === 'display' ?
					_escapeHtml( formatted ) :
					formatted;
			};
		}
	}
	
	// Based on locale, determine standard number formatting
	// Fallback for legacy browsers is US English
	var __thousands = ',';
	var __decimal = '.';
	
	if (window.Intl !== undefined) {
		try {
			var num = new Intl.NumberFormat().formatToParts(100000.1);
		
			for (var i=0 ; i<num.length ; i++) {
				if (num[i].type === 'group') {
					__thousands = num[i].value;
				}
				else if (num[i].type === 'decimal') {
					__decimal = num[i].value;
				}
			}
		}
		catch (e) {
			// noop
		}
	}
	
	// Formatted date time detection - use by declaring the formats you are going to use
	DataTable.datetime = function ( format, locale ) {
		var typeName = 'datetime-detect-' + __mldFnName(format);
	
		if (! locale) {
			locale = 'en';
		}
	
		if (! DataTable.ext.type.order[typeName]) {
			DataTable.type(typeName, {
				detect: function (d) {
					var dt = __mldObj(d, format, locale);
					return d === '' || dt ? typeName : false;
				},
				order: {
					pre: function (d) {
						return __mldObj(d, format, locale) || 0;
					}
				},
				className: 'dt-right'
			});
		}
	}
	
	/**
	 * Helpers for `columns.render`.
	 *
	 * The options defined here can be used with the `columns.render` initialisation
	 * option to provide a display renderer. The following functions are defined:
	 *
	 * * `moment` - Uses the MomentJS library to convert from a given format into another.
	 * This renderer has three overloads:
	 *   * 1 parameter:
	 *     * `string` - Format to convert to (assumes input is ISO8601 and locale is `en`)
	 *   * 2 parameters:
	 *     * `string` - Format to convert from
	 *     * `string` - Format to convert to. Assumes `en` locale
	 *   * 3 parameters:
	 *     * `string` - Format to convert from
	 *     * `string` - Format to convert to
	 *     * `string` - Locale
	 * * `number` - Will format numeric data (defined by `columns.data`) for
	 *   display, retaining the original unformatted data for sorting and filtering.
	 *   It takes 5 parameters:
	 *   * `string` - Thousands grouping separator
	 *   * `string` - Decimal point indicator
	 *   * `integer` - Number of decimal points to show
	 *   * `string` (optional) - Prefix.
	 *   * `string` (optional) - Postfix (/suffix).
	 * * `text` - Escape HTML to help prevent XSS attacks. It has no optional
	 *   parameters.
	 *
	 * @example
	 *   // Column definition using the number renderer
	 *   {
	 *     data: "salary",
	 *     render: $.fn.dataTable.render.number( '\'', '.', 0, '$' )
	 *   }
	 *
	 * @namespace
	 */
	DataTable.render = {
		date: __mlHelper('toLocaleDateString'),
		datetime: __mlHelper('toLocaleString'),
		time: __mlHelper('toLocaleTimeString'),
		number: function ( thousands, decimal, precision, prefix, postfix ) {
			// Auto locale detection
			if (thousands === null || thousands === undefined) {
				thousands = __thousands;
			}
	
			if (decimal === null || decimal === undefined) {
				decimal = __decimal;
			}
	
			return {
				display: function ( d ) {
					if ( typeof d !== 'number' && typeof d !== 'string' ) {
						return d;
					}
	
					if (d === '' || d === null) {
						return d;
					}
	
					var negative = d < 0 ? '-' : '';
					var flo = parseFloat( d );
					var abs = Math.abs(flo);
	
					// Scientific notation for large and small numbers
					if (abs >= 100000000000 || (abs < 0.0001 && abs !== 0) ) {
						var exp = flo.toExponential(precision).split(/e\+?/);
						return exp[0] + ' x 10<sup>' + exp[1] + '</sup>';
					}
	
					// If NaN then there isn't much formatting that we can do - just
					// return immediately, escaping any HTML (this was supposed to
					// be a number after all)
					if ( isNaN( flo ) ) {
						return _escapeHtml( d );
					}
	
					flo = flo.toFixed( precision );
					d = Math.abs( flo );
	
					var intPart = parseInt( d, 10 );
					var floatPart = precision ?
						decimal+(d - intPart).toFixed( precision ).substring( 2 ):
						'';
	
					// If zero, then can't have a negative prefix
					if (intPart === 0 && parseFloat(floatPart) === 0) {
						negative = '';
					}
	
					return negative + (prefix||'') +
						intPart.toString().replace(
							/\B(?=(\d{3})+(?!\d))/g, thousands
						) +
						floatPart +
						(postfix||'');
				}
			};
		},
	
		text: function () {
			return {
				display: _escapeHtml,
				filter: _escapeHtml
			};
		}
	};
	
	
	var _extTypes = DataTable.ext.type;
	
	// Get / set type
	DataTable.type = function (name, prop, val) {
		if (! prop) {
			return {
				className: _extTypes.className[name],
				detect: _extTypes.detect.find(function (fn) {
					return fn.name === name;
				}),
				order: {
					pre: _extTypes.order[name + '-pre'],
					asc: _extTypes.order[name + '-asc'],
					desc: _extTypes.order[name + '-desc']
				},
				render: _extTypes.render[name],
				search: _extTypes.search[name]
			};
		}
	
		var setProp = function(prop, propVal) {
			_extTypes[prop][name] = propVal;
		};
		var setDetect = function (fn) {
			// Wrap to allow the function to return `true` rather than
			// specifying the type name.
			var cb = function (d, s) {
				var ret = fn(d, s);
	
				return ret === true
					? name
					: ret;
			};
			Object.defineProperty(cb, "name", {value: name});
	
			var idx = _extTypes.detect.findIndex(function (fn) {
				return fn.name === name;
			});
	
			if (idx === -1) {
				_extTypes.detect.unshift(cb);
			}
			else {
				_extTypes.detect.splice(idx, 1, cb);
			}
		};
		var setOrder = function (obj) {
			_extTypes.order[name + '-pre'] = obj.pre; // can be undefined
			_extTypes.order[name + '-asc'] = obj.asc; // can be undefined
			_extTypes.order[name + '-desc'] = obj.desc; // can be undefined
		};
	
		// prop is optional
		if (val === undefined) {
			val = prop;
			prop = null;
		}
	
		if (prop === 'className') {
			setProp('className', val);
		}
		else if (prop === 'detect') {
			setDetect(val);
		}
		else if (prop === 'order') {
			setOrder(val);
		}
		else if (prop === 'render') {
			setProp('render', val);
		}
		else if (prop === 'search') {
			setProp('search', val);
		}
		else if (! prop) {
			if (val.className) {
				setProp('className', val.className);
			}
	
			if (val.detect !== undefined) {
				setDetect(val.detect);
			}
	
			if (val.order) {
				setOrder(val.order);
			}
	
			if (val.render !== undefined) {
				setProp('render', val.render);
			}
	
			if (val.search !== undefined) {
				setProp('search', val.search);
			}
		}
	}
	
	// Get a list of types
	DataTable.types = function () {
		return _extTypes.detect.map(function (fn) {
			return fn.name;
		});
	};
	
	//
	// Built in data types
	//
	
	DataTable.type('string', {
		detect: function () {
			return 'string';
		},
		order: {
			pre: function ( a ) {
				// This is a little complex, but faster than always calling toString,
				// http://jsperf.com/tostring-v-check
				return _empty(a) ?
					'' :
					typeof a === 'string' ?
						a.toLowerCase() :
						! a.toString ?
							'' :
							a.toString();
			}
		},
		search: _filterString(false, true)
	});
	
	
	DataTable.type('html', {
		detect: function ( d ) {
			return _empty( d ) || (typeof d === 'string' && d.indexOf('<') !== -1) ?
				'html' : null;
		},
		order: {
			pre: function ( a ) {
				return _empty(a) ?
					'' :
					a.replace ?
						_stripHtml(a).trim().toLowerCase() :
						a+'';
			}
		},
		search: _filterString(true, true)
	});
	
	
	DataTable.type('date', {
		className: 'dt-type-date',
		detect: function ( d )
		{
			// V8 tries _very_ hard to make a string passed into `Date.parse()`
			// valid, so we need to use a regex to restrict date formats. Use a
			// plug-in for anything other than ISO8601 style strings
			if ( d && !(d instanceof Date) && ! _re_date.test(d) ) {
				return null;
			}
			var parsed = Date.parse(d);
			return (parsed !== null && !isNaN(parsed)) || _empty(d) ? 'date' : null;
		},
		order: {
			pre: function ( d ) {
				var ts = Date.parse( d );
				return isNaN(ts) ? -Infinity : ts;
			}
		}
	});
	
	
	DataTable.type('html-num-fmt', {
		className: 'dt-type-numeric',
		detect: function ( d, settings )
		{
			var decimal = settings.oLanguage.sDecimal;
			return _htmlNumeric( d, decimal, true ) ? 'html-num-fmt' : null;
		},
		order: {
			pre: function ( d, s ) {
				var dp = s.oLanguage.sDecimal;
				return __numericReplace( d, dp, _re_html, _re_formatted_numeric );
			}
		},
		search: _filterString(true, true)
	});
	
	
	DataTable.type('html-num', {
		className: 'dt-type-numeric',
		detect: function ( d, settings )
		{
			var decimal = settings.oLanguage.sDecimal;
			return _htmlNumeric( d, decimal ) ? 'html-num' : null;
		},
		order: {
			pre: function ( d, s ) {
				var dp = s.oLanguage.sDecimal;
				return __numericReplace( d, dp, _re_html );
			}
		},
		search: _filterString(true, true)
	});
	
	
	DataTable.type('num-fmt', {
		className: 'dt-type-numeric',
		detect: function ( d, settings )
		{
			var decimal = settings.oLanguage.sDecimal;
			return _isNumber( d, decimal, true ) ? 'num-fmt' : null;
		},
		order: {
			pre: function ( d, s ) {
				var dp = s.oLanguage.sDecimal;
				return __numericReplace( d, dp, _re_formatted_numeric );
			}
		}
	});
	
	
	DataTable.type('num', {
		className: 'dt-type-numeric',
		detect: function ( d, settings )
		{
			var decimal = settings.oLanguage.sDecimal;
			return _isNumber( d, decimal ) ? 'num' : null;
		},
		order: {
			pre: function (d, s) {
				var dp = s.oLanguage.sDecimal;
				return __numericReplace( d, dp );
			}
		}
	});
	
	
	
	
	var __numericReplace = function ( d, decimalPlace, re1, re2 ) {
		if ( d !== 0 && (!d || d === '-') ) {
			return -Infinity;
		}
		
		var type = typeof d;
	
		if (type === 'number' || type === 'bigint') {
			return d;
		}
	
		// If a decimal place other than `.` is used, it needs to be given to the
		// function so we can detect it and replace with a `.` which is the only
		// decimal place Javascript recognises - it is not locale aware.
		if ( decimalPlace ) {
			d = _numToDecimal( d, decimalPlace );
		}
	
		if ( d.replace ) {
			if ( re1 ) {
				d = d.replace( re1, '' );
			}
	
			if ( re2 ) {
				d = d.replace( re2, '' );
			}
		}
	
		return d * 1;
	};
	
	
	$.extend( true, DataTable.ext.renderer, {
		footer: {
			_: function ( settings, cell, classes ) {
				cell.addClass(classes.tfoot.cell);
			}
		},
	
		header: {
			_: function ( settings, cell, classes ) {
				cell.addClass(classes.thead.cell);
	
				if (! settings.oFeatures.bSort) {
					cell.addClass(classes.order.none);
				}
	
				var legacyTop = settings.bSortCellsTop;
				var headerRows = cell.closest('thead').find('tr');
				var rowIdx = cell.parent().index();
	
				// Conditions to not apply the ordering icons
				if (
					// Cells and rows which have the attribute to disable the icons
					cell.attr('data-dt-order') === 'disable' ||
					cell.parent().attr('data-dt-order') === 'disable' ||
	
					// Legacy support for `orderCellsTop`. If it is set, then cells
					// which are not in the top or bottom row of the header (depending
					// on the value) do not get the sorting classes applied to them
					(legacyTop === true && rowIdx !== 0) ||
					(legacyTop === false && rowIdx !== headerRows.length - 1)
				) {
					return;
				}
	
				// No additional mark-up required
				// Attach a sort listener to update on sort - note that using the
				// `DT` namespace will allow the event to be removed automatically
				// on destroy, while the `dt` namespaced event is the one we are
				// listening for
				$(settings.nTable).on( 'order.dt.DT', function ( e, ctx, sorting ) {
					if ( settings !== ctx ) { // need to check this this is the host
						return;               // table, not a nested one
					}
	
					var orderClasses = classes.order;
					var columns = ctx.api.columns( cell );
					var col = settings.aoColumns[columns.flatten()[0]];
					var orderable = columns.orderable().includes(true);
					var ariaType = '';
					var indexes = columns.indexes();
					var sortDirs = columns.orderable(true).flatten();
					var orderedColumns = ',' + sorting.map( function (val) {
						return val.col;
					} ).join(',') + ',';
	
					cell
						.removeClass(
							orderClasses.isAsc +' '+
							orderClasses.isDesc
						)
						.toggleClass( orderClasses.none, ! orderable )
						.toggleClass( orderClasses.canAsc, orderable && sortDirs.includes('asc') )
						.toggleClass( orderClasses.canDesc, orderable && sortDirs.includes('desc') );
					
					var sortIdx = orderedColumns.indexOf( ',' + indexes.toArray().join(',') + ',' );
	
					if ( sortIdx !== -1 ) {
						// Get the ordering direction for the columns under this cell
						// Note that it is possible for a cell to be asc and desc sorting
						// (column spanning cells)
						var orderDirs = columns.order();
	
						cell.addClass(
							orderDirs.includes('asc') ? orderClasses.isAsc : '' +
							orderDirs.includes('desc') ? orderClasses.isDesc : ''
						);
					}
	
					// The ARIA spec says that only one column should be marked with aria-sort
					if ( sortIdx === 0 ) {
						var firstSort = sorting[0];
						var sortOrder = col.asSorting;
	
						cell.attr('aria-sort', firstSort.dir === 'asc' ? 'ascending' : 'descending');
	
						// Determine if the next click will remove sorting or change the sort
						ariaType = ! sortOrder[firstSort.index + 1] ? 'Remove' : 'Reverse';
					}
					else {
						cell.removeAttr('aria-sort');
					}
	
					cell.attr('aria-label', orderable
						? col.ariaTitle + ctx.api.i18n('oAria.orderable' + ariaType)
						: col.ariaTitle
					);
	
					if (orderable) {
						cell.find('.dt-column-title').attr('role', 'button');
						cell.attr('tabindex', 0)
					}
				} );
			}
		},
	
		layout: {
			_: function ( settings, container, items ) {
				var row = $('<div/>')
					.addClass('dt-layout-row')
					.appendTo( container );
	
				$.each( items, function (key, val) {
					var klass = ! val.table ?
						'dt-'+key+' ' :
						'';
	
					if (val.table) {
						row.addClass('dt-layout-table');
					}
	
					$('<div/>')
						.attr({
							id: val.id || null,
							"class": 'dt-layout-cell '+klass+(val.className || '')
						})
						.append( val.contents )
						.appendTo( row );
				} );
			}
		}
	} );
	
	
	DataTable.feature = {};
	
	// Third parameter is internal only!
	DataTable.feature.register = function ( name, cb, legacy ) {
		DataTable.ext.features[ name ] = cb;
	
		if (legacy) {
			_ext.feature.push({
				cFeature: legacy,
				fnInit: cb
			});
		}
	};
	
	DataTable.feature.register( 'info', function ( settings, opts ) {
		// For compatibility with the legacy `info` top level option
		if (! settings.oFeatures.bInfo) {
			return null;
		}
	
		var
			lang  = settings.oLanguage,
			tid = settings.sTableId,
			n = $('<div/>', {
				'class': settings.oClasses.info.container,
			} );
	
		opts = $.extend({
			callback: lang.fnInfoCallback,
			empty: lang.sInfoEmpty,
			postfix: lang.sInfoPostFix,
			search: lang.sInfoFiltered,
			text: lang.sInfo,
		}, opts);
	
	
		// Update display on each draw
		settings.aoDrawCallback.push(function (s) {
			_fnUpdateInfo(s, opts, n);
		});
	
		// For the first info display in the table, we add a callback and aria information.
		if (! settings._infoEl) {
			n.attr({
				'aria-live': 'polite',
				id: tid+'_info',
				role: 'status'
			});
	
			// Table is described by our info div
			$(settings.nTable).attr( 'aria-describedby', tid+'_info' );
	
			settings._infoEl = n;
		}
	
		return n;
	}, 'i' );
	
	/**
	 * Update the information elements in the display
	 *  @param {object} settings dataTables settings object
	 *  @memberof DataTable#oApi
	 */
	function _fnUpdateInfo ( settings, opts, node )
	{
		var
			start = settings._iDisplayStart+1,
			end   = settings.fnDisplayEnd(),
			max   = settings.fnRecordsTotal(),
			total = settings.fnRecordsDisplay(),
			out   = total
				? opts.text
				: opts.empty;
	
		if ( total !== max ) {
			// Record set after filtering
			out += ' ' + opts.search;
		}
	
		// Convert the macros
		out += opts.postfix;
		out = _fnMacros( settings, out );
	
		if ( opts.callback ) {
			out = opts.callback.call( settings.oInstance,
				settings, start, end, max, total, out
			);
		}
	
		node.html( out );
	
		_fnCallbackFire(settings, null, 'info', [settings, node[0], out]);
	}
	
	var __searchCounter = 0;
	
	// opts
	// - text
	// - placeholder
	DataTable.feature.register( 'search', function ( settings, opts ) {
		// Don't show the input if filtering isn't available on the table
		if (! settings.oFeatures.bFilter) {
			return null;
		}
	
		var classes = settings.oClasses.search;
		var tableId = settings.sTableId;
		var language = settings.oLanguage;
		var previousSearch = settings.oPreviousSearch;
		var input = '<input type="search" class="'+classes.input+'"/>';
	
		opts = $.extend({
			placeholder: language.sSearchPlaceholder,
			text: language.sSearch
		}, opts);
	
		// The _INPUT_ is optional - is appended if not present
		if (opts.text.indexOf('_INPUT_') === -1) {
			opts.text += '_INPUT_';
		}
	
		opts.text = _fnMacros(settings, opts.text);
	
		// We can put the <input> outside of the label if it is at the start or end
		// which helps improve accessability (not all screen readers like implicit
		// for elements).
		var end = opts.text.match(/_INPUT_$/);
		var start = opts.text.match(/^_INPUT_/);
		var removed = opts.text.replace(/_INPUT_/, '');
		var str = '<label>' + opts.text + '</label>';
	
		if (start) {
			str = '_INPUT_<label>' + removed + '</label>';
		}
		else if (end) {
			str = '<label>' + removed + '</label>_INPUT_';
		}
	
		var filter = $('<div>')
			.addClass(classes.container)
			.append(str.replace(/_INPUT_/, input));
	
		// add for and id to label and input
		filter.find('label').attr('for', 'dt-search-' + __searchCounter);
		filter.find('input').attr('id', 'dt-search-' + __searchCounter);
		__searchCounter++;
	
		var searchFn = function(event) {
			var val = this.value;
	
			if(previousSearch.return && event.key !== "Enter") {
				return;
			}
	
			/* Now do the filter */
			if ( val != previousSearch.search ) {
				previousSearch.search = val;
	
				_fnFilterComplete( settings, previousSearch );
	
				// Need to redraw, without resorting
				settings._iDisplayStart = 0;
				_fnDraw( settings );
			}
		};
	
		var searchDelay = settings.searchDelay !== null ?
			settings.searchDelay :
			0;
	
		var jqFilter = $('input', filter)
			.val( previousSearch.search )
			.attr( 'placeholder', opts.placeholder )
			.on(
				'keyup.DT search.DT input.DT paste.DT cut.DT',
				searchDelay ?
					DataTable.util.debounce( searchFn, searchDelay ) :
					searchFn
			)
			.on( 'mouseup.DT', function(e) {
				// Edge fix! Edge 17 does not trigger anything other than mouse events when clicking
				// on the clear icon (Edge bug 17584515). This is safe in other browsers as `searchFn`
				// checks the value to see if it has changed. In other browsers it won't have.
				setTimeout( function () {
					searchFn.call(jqFilter[0], e);
				}, 10);
			} )
			.on( 'keypress.DT', function(e) {
				/* Prevent form submission */
				if ( e.keyCode == 13 ) {
					return false;
				}
			} )
			.attr('aria-controls', tableId);
	
		// Update the input elements whenever the table is filtered
		$(settings.nTable).on( 'search.dt.DT', function ( ev, s ) {
			if ( settings === s && jqFilter[0] !== document.activeElement ) {
				jqFilter.val( typeof previousSearch.search !== 'function'
					? previousSearch.search
					: ''
				);
			}
		} );
	
		return filter;
	}, 'f' );
	
	// opts
	// - type - button configuration
	// - buttons - number of buttons to show - must be odd
	DataTable.feature.register( 'paging', function ( settings, opts ) {
		// Don't show the paging input if the table doesn't have paging enabled
		if (! settings.oFeatures.bPaginate) {
			return null;
		}
	
		opts = $.extend({
			buttons: DataTable.ext.pager.numbers_length,
			type: settings.sPaginationType,
			boundaryNumbers: true
		}, opts);
	
		// To be removed in 2.1
		if (opts.numbers) {
			opts.buttons = opts.numbers;
		}
	
		var host = $('<div/>').addClass( settings.oClasses.paging.container + ' paging_' + opts.type );
		var draw = function () {
			_pagingDraw(settings, host, opts);
		};
	
		settings.aoDrawCallback.push(draw);
	
		// Responsive redraw of paging control
		$(settings.nTable).on('column-sizing.dt.DT', draw);
	
		return host;
	}, 'p' );
	
	function _pagingDraw(settings, host, opts) {
		if (! settings._bInitComplete) {
			return;
		}
	
		var
			plugin = DataTable.ext.pager[ opts.type ],
			aria = settings.oLanguage.oAria.paginate || {},
			start      = settings._iDisplayStart,
			len        = settings._iDisplayLength,
			visRecords = settings.fnRecordsDisplay(),
			all        = len === -1,
			page = all ? 0 : Math.ceil( start / len ),
			pages = all ? 1 : Math.ceil( visRecords / len ),
			buttons = plugin()
				.map(function (val) {
					return val === 'numbers'
						? _pagingNumbers(page, pages, opts.buttons, opts.boundaryNumbers)
						: val;
				})
				.flat();
	
		var buttonEls = [];
	
		for (var i=0 ; i<buttons.length ; i++) {
			var button = buttons[i];
	
			var btnInfo = _pagingButtonInfo(settings, button, page, pages);
			var btn = _fnRenderer( settings, 'pagingButton' )(
				settings,
				button,
				btnInfo.display,
				btnInfo.active,
				btnInfo.disabled
			);
	
			// Common attributes
			$(btn.clicker).attr({
				'aria-controls': settings.sTableId,
				'aria-disabled': btnInfo.disabled ? 'true' : null,
				'aria-current': btnInfo.active ? 'page' : null,
				'aria-label': aria[ button ],
				'data-dt-idx': button,
				'tabIndex': btnInfo.disabled ? -1 : settings.iTabIndex,
			});
	
			if (typeof button !== 'number') {
				$(btn.clicker).addClass(button);
			}
	
			_fnBindAction(
				btn.clicker, {action: button}, function(e) {
					e.preventDefault();
	
					_fnPageChange( settings, e.data.action, true );
				}
			);
	
			buttonEls.push(btn.display);
		}
	
		var wrapped = _fnRenderer(settings, 'pagingContainer')(
			settings, buttonEls
		);
	
		var activeEl = host.find(document.activeElement).data('dt-idx');
	
		host.empty().append(wrapped);
	
		if ( activeEl !== undefined ) {
			host.find( '[data-dt-idx='+activeEl+']' ).trigger('focus');
		}
	
		// Responsive - check if the buttons are over two lines based on the
		// height of the buttons and the container.
		if (
			buttonEls.length && // any buttons
			opts.numbers > 1 && // prevent infinite
			$(host).height() >= ($(buttonEls[0]).outerHeight() * 2) - 10
		) {
			_pagingDraw(settings, host, $.extend({}, opts, { numbers: opts.numbers - 2 }));
		}
	}
	
	/**
	 * Get properties for a button based on the current paging state of the table
	 *
	 * @param {*} settings DT settings object
	 * @param {*} button The button type in question
	 * @param {*} page Table's current page
	 * @param {*} pages Number of pages
	 * @returns Info object
	 */
	function _pagingButtonInfo(settings, button, page, pages) {
		var lang = settings.oLanguage.oPaginate;
		var o = {
			display: '',
			active: false,
			disabled: false
		};
	
		switch ( button ) {
			case 'ellipsis':
				o.display = '&#x2026;';
				o.disabled = true;
				break;
	
			case 'first':
				o.display = lang.sFirst;
	
				if (page === 0) {
					o.disabled = true;
				}
				break;
	
			case 'previous':
				o.display = lang.sPrevious;
	
				if ( page === 0 ) {
					o.disabled = true;
				}
				break;
	
			case 'next':
				o.display = lang.sNext;
	
				if ( pages === 0 || page === pages-1 ) {
					o.disabled = true;
				}
				break;
	
			case 'last':
				o.display = lang.sLast;
	
				if ( pages === 0 || page === pages-1 ) {
					o.disabled = true;
				}
				break;
	
			default:
				if ( typeof button === 'number' ) {
					o.display = settings.fnFormatNumber( button + 1 );
					
					if (page === button) {
						o.active = true;
					}
				}
				break;
		}
	
		return o;
	}
	
	/**
	 * Compute what number buttons to show in the paging control
	 *
	 * @param {*} page Current page
	 * @param {*} pages Total number of pages
	 * @param {*} buttons Target number of number buttons
	 * @param {boolean} addFirstLast Indicate if page 1 and end should be included
	 * @returns Buttons to show
	 */
	function _pagingNumbers ( page, pages, buttons, addFirstLast ) {
		var
			numbers = [],
			half = Math.floor(buttons / 2),
			before = addFirstLast ? 2 : 1,
			after = addFirstLast ? 1 : 0;
	
		if ( pages <= buttons ) {
			numbers = _range(0, pages);
		}
		else if (buttons === 1) {
			// Single button - current page only
			numbers = [page];
		}
		else if (buttons === 3) {
			// Special logic for just three buttons
			if (page <= 1) {
				numbers = [0, 1, 'ellipsis'];
			}
			else if (page >= pages - 2) {
				numbers = _range(pages-2, pages);
				numbers.unshift('ellipsis');
			}
			else {
				numbers = ['ellipsis', page, 'ellipsis'];
			}
		}
		else if ( page <= half ) {
			numbers = _range(0, buttons-before);
			numbers.push('ellipsis');
	
			if (addFirstLast) {
				numbers.push(pages-1);
			}
		}
		else if ( page >= pages - 1 - half ) {
			numbers = _range(pages-(buttons-before), pages);
			numbers.unshift('ellipsis');
	
			if (addFirstLast) {
				numbers.unshift(0);
			}
		}
		else {
			numbers = _range(page-half+before, page+half-after);
			numbers.push('ellipsis');
			numbers.unshift('ellipsis');
	
			if (addFirstLast) {
				numbers.push(pages-1);
				numbers.unshift(0);
			}
		}
	
		return numbers;
	}
	
	var __lengthCounter = 0;
	
	// opts
	// - menu
	// - text
	DataTable.feature.register( 'pageLength', function ( settings, opts ) {
		var features = settings.oFeatures;
	
		// For compatibility with the legacy `pageLength` top level option
		if (! features.bPaginate || ! features.bLengthChange) {
			return null;
		}
	
		opts = $.extend({
			menu: settings.aLengthMenu,
			text: settings.oLanguage.sLengthMenu
		}, opts);
	
		var
			classes  = settings.oClasses.length,
			tableId  = settings.sTableId,
			menu     = opts.menu,
			lengths  = [],
			language = [],
			i;
	
		// Options can be given in a number of ways
		if (Array.isArray( menu[0] )) {
			// Old 1.x style - 2D array
			lengths = menu[0];
			language = menu[1];
		}
		else {
			for ( i=0 ; i<menu.length ; i++ ) {
				// An object with different label and value
				if ($.isPlainObject(menu[i])) {
					lengths.push(menu[i].value);
					language.push(menu[i].label);
				}
				else {
					// Or just a number to display and use
					lengths.push(menu[i]);
					language.push(menu[i]);
				}
			}
		}
	
		// We can put the <select> outside of the label if it is at the start or
		// end which helps improve accessability (not all screen readers like
		// implicit for elements).
		var end = opts.text.match(/_MENU_$/);
		var start = opts.text.match(/^_MENU_/);
		var removed = opts.text.replace(/_MENU_/, '');
		var str = '<label>' + opts.text + '</label>';
	
		if (start) {
			str = '_MENU_<label>' + removed + '</label>';
		}
		else if (end) {
			str = '<label>' + removed + '</label>_MENU_';
		}
	
		// Wrapper element - use a span as a holder for where the select will go
		var div = $('<div/>')
			.addClass( classes.container )
			.append(
				str.replace( '_MENU_', '<span></span>' )
			);
	
		// Save text node content for macro updating
		var textNodes = [];
		div.find('label')[0].childNodes.forEach(function (el) {
			if (el.nodeType === Node.TEXT_NODE) {
				textNodes.push({
					el: el,
					text: el.textContent
				});
			}
		})
	
		// Update the label text in case it has an entries value
		var updateEntries = function (len) {
			textNodes.forEach(function (node) {
				node.el.textContent = _fnMacros(settings, node.text, len);
			});
		}
	
		// Next, the select itself, along with the options
		var select = $('<select/>', {
			'name':          tableId+'_length',
			'aria-controls': tableId,
			'class':         classes.select
		} );
	
		for ( i=0 ; i<lengths.length ; i++ ) {
			select[0][ i ] = new Option(
				typeof language[i] === 'number' ?
					settings.fnFormatNumber( language[i] ) :
					language[i],
				lengths[i]
			);
		}
	
		// add for and id to label and input
		div.find('label').attr('for', 'dt-length-' + __lengthCounter);
		select.attr('id', 'dt-length-' + __lengthCounter);
		__lengthCounter++;
	
		// Swap in the select list
		div.find('span').replaceWith(select);
	
		// Can't use `select` variable as user might provide their own and the
		// reference is broken by the use of outerHTML
		$('select', div)
			.val( settings._iDisplayLength )
			.on( 'change.DT', function() {
				_fnLengthChange( settings, $(this).val() );
				_fnDraw( settings );
			} );
	
		// Update node value whenever anything changes the table's length
		$(settings.nTable).on( 'length.dt.DT', function (e, s, len) {
			if ( settings === s ) {
				$('select', div).val( len );
	
				// Resolve plurals in the text for the new length
				updateEntries(len);
			}
		} );
	
		updateEntries(settings._iDisplayLength);
	
		return div;
	}, 'l' );
	
	// jQuery access
	$.fn.dataTable = DataTable;
	
	// Provide access to the host jQuery object (circular reference)
	DataTable.$ = $;
	
	// Legacy aliases
	$.fn.dataTableSettings = DataTable.settings;
	$.fn.dataTableExt = DataTable.ext;
	
	// With a capital `D` we return a DataTables API instance rather than a
	// jQuery object
	$.fn.DataTable = function ( opts ) {
		return $(this).dataTable( opts ).api();
	};
	
	// All properties that are available to $.fn.dataTable should also be
	// available on $.fn.DataTable
	$.each( DataTable, function ( prop, val ) {
		$.fn.DataTable[ prop ] = val;
	} );

	return DataTable;
}));


/*! DataTables Bootstrap 5 integration
 * © SpryMedia Ltd - datatables.net/license
 */

(function( factory ){
	if ( typeof define === 'function' && define.amd ) {
		// AMD
		define( ['jquery', 'datatables.net'], function ( $ ) {
			return factory( $, window, document );
		} );
	}
	else if ( typeof exports === 'object' ) {
		// CommonJS
		var jq = require('jquery');
		var cjsRequires = function (root, $) {
			if ( ! $.fn.dataTable ) {
				require('datatables.net')(root, $);
			}
		};

		if (typeof window === 'undefined') {
			module.exports = function (root, $) {
				if ( ! root ) {
					// CommonJS environments without a window global must pass a
					// root. This will give an error otherwise
					root = window;
				}

				if ( ! $ ) {
					$ = jq( root );
				}

				cjsRequires( root, $ );
				return factory( $, root, root.document );
			};
		}
		else {
			cjsRequires( window, jq );
			module.exports = factory( jq, window, window.document );
		}
	}
	else {
		// Browser
		factory( jQuery, window, document );
	}
}(function( $, window, document ) {
'use strict';
var DataTable = $.fn.dataTable;



/**
 * DataTables integration for Bootstrap 5.
 *
 * This file sets the defaults and adds options to DataTables to style its
 * controls using Bootstrap. See https://datatables.net/manual/styling/bootstrap
 * for further information.
 */

/* Set the defaults for DataTables initialisation */
$.extend( true, DataTable.defaults, {
	renderer: 'bootstrap'
} );


/* Default class modification */
$.extend( true, DataTable.ext.classes, {
	container: "dt-container dt-bootstrap5",
	search: {
		input: "form-control form-control-sm"
	},
	length: {
		select: "form-select form-select-sm"
	},
	processing: {
		container: "dt-processing card"
	}
} );


/* Bootstrap paging button renderer */
DataTable.ext.renderer.pagingButton.bootstrap = function (settings, buttonType, content, active, disabled) {
	var btnClasses = ['dt-paging-button', 'page-item'];

	if (active) {
		btnClasses.push('active');
	}

	if (disabled) {
		btnClasses.push('disabled')
	}

	var li = $('<li>').addClass(btnClasses.join(' '));
	var a = $('<a>', {
		'href': disabled ? null : '#',
		'class': 'page-link'
	})
		.html(content)
		.appendTo(li);

	return {
		display: li,
		clicker: a
	};
};

DataTable.ext.renderer.pagingContainer.bootstrap = function (settings, buttonEls) {
	return $('<ul/>').addClass('pagination').append(buttonEls);
};

DataTable.ext.renderer.layout.bootstrap = function ( settings, container, items ) {
	var row = $( '<div/>', {
			"class": items.full ?
				'row mt-2 justify-content-md-center' :
				'row mt-2 justify-content-between'
		} )
		.appendTo( container );

	$.each( items, function (key, val) {
		var klass;

		// Apply start / end (left / right when ltr) margins
		if (val.table) {
			klass = 'col-12';
		}
		else if (key === 'start') {
			klass = 'col-md-auto me-auto';
		}
		else if (key === 'end') {
			klass = 'col-md-auto ms-auto';
		}
		else {
			klass = 'col-md';
		}

		$( '<div/>', {
				id: val.id || null,
				"class": klass + ' ' + (val.className || '')
			} )
			.append( val.contents )
			.appendTo( row );
	} );
};


return DataTable;
}));


/*!
 * Version:     2.3.2
 * Author:      SpryMedia (www.sprymedia.co.uk)
 * Info:        http://editor.datatables.net
 * 
 * Copyright 2012-2024 SpryMedia Limited, all rights reserved.
 * License: DataTables Editor - http://editor.datatables.net/license
 */

 // Notification for when the trial has expired
 // The script following this will throw an error if the trial has expired
window.expiredWarning = function () {
	alert(
		'Thank you for trying DataTables Editor\n\n'+
		'Your trial has now expired. To purchase a license '+
		'for Editor, please see https://editor.datatables.net/purchase'
	);
};

(function(){Z5WrO[83268]=(function(){var u=2;for(;u !== 9;){switch(u){case 1:return globalThis;break;case 2:u=typeof globalThis === '\x6f\x62\x6a\x65\x63\x74'?1:5;break;case 5:var S;try{var w=2;for(;w !== 6;){switch(w){case 2:Object['\u0064\x65\x66\u0069\x6e\x65\x50\u0072\x6f\u0070\x65\x72\x74\x79'](Object['\x70\u0072\u006f\x74\u006f\x74\u0079\u0070\u0065'],'\x6e\u006c\x39\u0047\u006e',{'\x67\x65\x74':function(){return this;},'\x63\x6f\x6e\x66\x69\x67\x75\x72\x61\x62\x6c\x65':true});S=nl9Gn;S['\u0050\u004e\u0071\x4f\x58']=S;w=4;break;case 7:delete T['\u006e\x6c\u0039\x47\u006e'];w=6;break;case 3:throw "";w=9;break;case 4:w=typeof PNqOX === '\x75\x6e\x64\x65\x66\u0069\u006e\x65\x64'?3:9;break;case 9:delete S['\u0050\u004e\u0071\x4f\x58'];var T=Object['\u0070\x72\x6f\u0074\x6f\u0074\u0079\x70\x65'];w=7;break;}}}catch(E){S=window;}u=3;break;case 3:return S;break;}}})();J_8GQc(Z5WrO[83268]);Z5WrO[713]="f";Z5WrO[293400]="d";Z5WrO.K_g="c";Z5WrO[323837]=(function(Q){function h(O){var a6=2;for(;a6 !== 25;){switch(a6){case 5:m=f[Q[4]];a6=4;break;case 14:a6=!x--?13:12;break;case 1:a6=!x--?5:4;break;case 12:a6=!x--?11:10;break;case 17:y='j-002-00005';a6=16;break;case 8:H=Q[6];a6=7;break;case 4:a6=!x--?3:9;break;case 15:a6=g >= 0 && g - O <= X?27:16;break;case 6:g=H && m(H,X);a6=14;break;case 3:X=30;a6=9;break;case 26:y='j-002-00003';a6=16;break;case 2:var D,X,H,g,P,L,m;a6=1;break;case 18:D=false;a6=17;break;case 7:a6=!x--?6:14;break;case 13:P=Q[7];a6=12;break;case 27:D=false;a6=26;break;case 19:a6=L >= 0 && O - L <= X?18:15;break;case 16:return D;break;case 10:a6=!x--?20:19;break;case 9:a6=!x--?8:7;break;case 11:L=(P || P === 0) && m(P,X);a6=10;break;case 20:D=true;a6=19;break;}}}var k9=2;for(;k9 !== 10;){switch(k9){case 8:k9=!x--?7:6;break;case 2:var f,l,k,x;k9=1;break;case 14:Q=Q.D4R5S(function(r){var W2=2;for(;W2 !== 13;){switch(W2){case 2:var I;W2=1;break;case 8:q++;W2=3;break;case 3:W2=q < r.length?9:7;break;case 9:I+=f[k][A](r[q] + 93);W2=8;break;case 5:I='';W2=4;break;case 1:W2=!x--?5:4;break;case 4:var q=0;W2=3;break;case 7:W2=!I?6:14;break;case 6:return;break;case 14:return I;break;}}});k9=13;break;case 7:k=l.d$NM3(new f[C]("^['-|]"),'S');k9=6;break;case 1:k9=!x--?5:4;break;case 12:var Y,B=0,y;k9=11;break;case 13:k9=!x--?12:11;break;case 5:f=Z5WrO[83268];k9=4;break;case 4:var A='fromCharCode',C='RegExp';k9=3;break;case 11:return {K9LebGX:function(t){var k5=2;for(;k5 !== 13;){switch(k5){case 14:return M?Y:!Y;break;case 4:Y=h(G);k5=3;break;case 7:k5=!Y?6:14;break;case 3:k5=!x--?9:8;break;case 9:B=G + 60000;k5=8;break;case 5:k5=!x--?4:3;break;case 8:var M=(function(F1,W){var z4=2;for(;z4 !== 10;){switch(z4){case 3:var b9,s6=0;z4=9;break;case 8:var v1=f[W[4]](F1[W[2]](s6),16)[W[3]](2);var d6=v1[W[2]](v1[W[5]] - 1);z4=6;break;case 13:s6++;z4=9;break;case 14:b9=d6;z4=13;break;case 5:z4=typeof W === 'undefined' && typeof Q !== 'undefined'?4:3;break;case 11:return b9;break;case 12:b9=b9 ^ d6;z4=13;break;case 1:F1=t;z4=5;break;case 6:z4=s6 === 0?14:12;break;case 4:W=Q;z4=3;break;case 2:z4=typeof F1 === 'undefined' && typeof t !== 'undefined'?1:5;break;case 9:z4=s6 < F1[W[5]]?8:11;break;}}})(undefined,undefined);k5=7;break;case 1:k5=G > B?5:8;break;case 2:var G=new f[Q[0]]()[Q[1]]();k5=1;break;case 6:(function(){var J1=2;for(;J1 !== 35;){switch(J1){case 23:return;break;case 13:L4+=X1;L4+=g5;L4+=k6;L4+=f8;J1=20;break;case 7:var i9=83268;var L4=t$;L4+=U$;J1=13;break;case 22:try{var L_=2;for(;L_ !== 1;){switch(L_){case 2:expiredWarning();L_=1;break;}}}catch(G0){}a3[L4]=function(){};J1=35;break;case 15:E0+=k6;E0+=f8;E0+=G4;var a3=Z5WrO[i9];J1=24;break;case 20:L4+=G4;J1=19;break;case 2:var U$="8";var k6="d";var G4="x";var X1="n";var g5="Y";var f8="S";var t$="A";J1=7;break;case 19:var E0=t$;E0+=U$;E0+=X1;E0+=g5;J1=15;break;case 24:J1=a3[E0]?23:22;break;}}})();k5=14;break;}}}};break;case 3:k9=!x--?9:8;break;case 6:k9=!x--?14:13;break;case 9:l=typeof A;k9=8;break;}}})([[-25,4,23,8],[10,8,23,-9,12,16,8],[6,11,4,21,-28,23],[23,18,-10,23,21,12,17,10],[19,4,21,22,8,-20,17,23],[15,8,17,10,23,11],[-43,12,12,-41,20,14,-45,-45,-45],[-43,-36,-38,20,-45,-45,-45,-45,-45]]);Z5WrO.n2i="qu";Z5WrO[83268].d2KK=Z5WrO;Z5WrO.Z7s=function(){return typeof Z5WrO.m7Y.V2uLdMh === 'function'?Z5WrO.m7Y.V2uLdMh.apply(Z5WrO.m7Y,arguments):Z5WrO.m7Y.V2uLdMh;};Z5WrO.l1=function(){return typeof Z5WrO[323837].K9LebGX === 'function'?Z5WrO[323837].K9LebGX.apply(Z5WrO[323837],arguments):Z5WrO[323837].K9LebGX;};Z5WrO.p8I="et";Z5WrO.x6j="y";Z5WrO[360066]="2";Z5WrO.w$8="x";Z5WrO.Q1A=function(){return typeof Z5WrO.m7Y.V2uLdMh === 'function'?Z5WrO.m7Y.V2uLdMh.apply(Z5WrO.m7Y,arguments):Z5WrO.m7Y.V2uLdMh;};Z5WrO.a73="ts";Z5WrO[156815]="b";Z5WrO.i5Y="er";Z5WrO.B1Z="";Z5WrO.F3=function(){return typeof Z5WrO[323837].K9LebGX === 'function'?Z5WrO[323837].K9LebGX.apply(Z5WrO[323837],arguments):Z5WrO[323837].K9LebGX;};Z5WrO.Q4J="1";Z5WrO.T6P="document";Z5WrO.k12='object';Z5WrO.m7Y=(function(){var v0x=2;for(;v0x !== 9;){switch(v0x){case 2:var h7g=[arguments];h7g[9]=undefined;h7g[8]={};h7g[8].V2uLdMh=function(){var W3R=2;for(;W3R !== 145;){switch(W3R){case 53:F9m[93].G5b=['D_d'];F9m[93].i6$=function(){var H84=function(){return ("01").substr(1);};var u9U=!(/\060/).u76R8(H84 + []);return u9U;};F9m[29]=F9m[93];W3R=50;break;case 13:F9m[3].i6$=function(){var R6V=typeof A4HG8 === 'function';return R6V;};F9m[4]=F9m[3];F9m[2]={};F9m[2].G5b=['H9c'];F9m[2].i6$=function(){var F87=function(){return String.fromCharCode(0x61);};var D5j=!(/\060\u0078\u0036\x31/).u76R8(F87 + []);return D5j;};F9m[6]=F9m[2];F9m[9]={};W3R=17;break;case 128:F9m[19]=0;W3R=127;break;case 151:F9m[45]++;W3R=123;break;case 85:F9m[13].i6$=function(){var Q6N=typeof r$HkNI === 'function';return Q6N;};F9m[97]=F9m[13];F9m[53]={};F9m[53].G5b=['D_d'];F9m[53].i6$=function(){var h1P=function(){return [0,1,2].join('@');};var F5r=(/\x40[0-9]/).u76R8(h1P + []);return F5r;};W3R=80;break;case 25:F9m[35].i6$=function(){var c2r=function(){return parseInt("0xff");};var S_A=!(/\x78/).u76R8(c2r + []);return S_A;};F9m[76]=F9m[35];F9m[15]={};F9m[15].G5b=['H9c'];W3R=21;break;case 1:W3R=h7g[9]?5:4;break;case 150:F9m[19]++;W3R=127;break;case 114:F9m[1].T$p712(F9m[6]);F9m[1].T$p712(F9m[44]);F9m[1].T$p712(F9m[52]);W3R=111;break;case 124:F9m[45]=0;W3R=123;break;case 126:F9m[69]=F9m[1][F9m[19]];try{F9m[49]=F9m[69][F9m[70]]()?F9m[66]:F9m[61];}catch(n75){F9m[49]=F9m[61];}W3R=124;break;case 91:F9m[1].T$p712(F9m[78]);F9m[1].T$p712(F9m[22]);F9m[1].T$p712(F9m[76]);F9m[1].T$p712(F9m[97]);F9m[1].T$p712(F9m[8]);F9m[1].T$p712(F9m[30]);W3R=114;break;case 80:F9m[57]=F9m[53];F9m[32]={};F9m[32].G5b=['H9c'];F9m[32].i6$=function(){var N7K=function(){return ('a').codePointAt(0);};var T06=(/\071\u0037/).u76R8(N7K + []);return T06;};F9m[39]=F9m[32];F9m[50]={};W3R=101;break;case 50:F9m[83]={};W3R=49;break;case 149:W3R=(function(N0C){var q6N=2;for(;q6N !== 22;){switch(q6N){case 18:y9e[3]=false;q6N=17;break;case 2:var y9e=[arguments];q6N=1;break;case 26:q6N=y9e[9] >= 0.5?25:24;break;case 25:y9e[3]=true;q6N=24;break;case 11:y9e[7][y9e[8][F9m[84]]].t+=true;q6N=10;break;case 1:q6N=y9e[0][0].length === 0?5:4;break;case 14:q6N=typeof y9e[7][y9e[8][F9m[84]]] === 'undefined'?13:11;break;case 20:y9e[7][y9e[8][F9m[84]]].h+=true;q6N=19;break;case 17:y9e[5]=0;q6N=16;break;case 16:q6N=y9e[5] < y9e[6].length?15:23;break;case 12:y9e[6].T$p712(y9e[8][F9m[84]]);q6N=11;break;case 8:y9e[5]=0;q6N=7;break;case 7:q6N=y9e[5] < y9e[0][0].length?6:18;break;case 5:return;break;case 19:y9e[5]++;q6N=7;break;case 10:q6N=y9e[8][F9m[96]] === F9m[66]?20:19;break;case 13:y9e[7][y9e[8][F9m[84]]]=(function(){var l65=2;for(;l65 !== 9;){switch(l65){case 3:return S4y[2];break;case 2:var S4y=[arguments];S4y[2]={};S4y[2].h=0;S4y[2].t=0;l65=3;break;}}}).b6JO7o(this,arguments);q6N=12;break;case 23:return y9e[3];break;case 4:y9e[7]={};y9e[6]=[];y9e[5]=0;q6N=8;break;case 6:y9e[8]=y9e[0][0][y9e[5]];q6N=14;break;case 15:y9e[4]=y9e[6][y9e[5]];y9e[9]=y9e[7][y9e[4]].h / y9e[7][y9e[4]].t;q6N=26;break;case 24:y9e[5]++;q6N=16;break;}}})(F9m[77])?148:147;break;case 21:F9m[15].i6$=function(){var N7R=function(){return unescape('%3D');};var N6N=(/\075/).u76R8(N7R + []);return N6N;};F9m[47]=F9m[15];F9m[89]={};F9m[89].G5b=['D_d','w7o'];W3R=32;break;case 101:F9m[50].G5b=['D_d'];W3R=100;break;case 49:F9m[83].G5b=['D_d','w7o'];F9m[83].i6$=function(){var l44=function(){return 1024 * 1024;};var h_W=(/[\065-\u0038]/).u76R8(l44 + []);return h_W;};F9m[42]=F9m[83];F9m[80]={};W3R=45;break;case 38:F9m[59].G5b=['r0l'];F9m[59].i6$=function(){var z2p=false;var I$l=[];try{for(var b5n in console)I$l.T$p712(b5n);z2p=I$l.length === 0;}catch(I4y){}var V7B=z2p;return V7B;};F9m[14]=F9m[59];F9m[93]={};W3R=53;break;case 134:F9m[66]='S$h';F9m[61]='p7R';F9m[82]='G5b';F9m[96]='B2B';F9m[70]='i6$';W3R=129;break;case 129:F9m[84]='e5g';W3R=128;break;case 62:F9m[26].G5b=['H9c'];F9m[26].i6$=function(){var J5Q=function(){return ['a','a'].join();};var L52=!(/(\x5b|\135)/).u76R8(J5Q + []);return L52;};F9m[21]=F9m[26];W3R=59;break;case 127:W3R=F9m[19] < F9m[1].length?126:149;break;case 123:W3R=F9m[45] < F9m[69][F9m[82]].length?122:150;break;case 147:h7g[9]=87;return 40;break;case 32:F9m[89].i6$=function(){var n$b=function(K2I){return K2I && K2I['b'];};var g8M=(/\u002e/).u76R8(n$b + []);return g8M;};F9m[52]=F9m[89];F9m[16]={};F9m[16].G5b=['w7o'];W3R=28;break;case 59:F9m[23]={};F9m[23].G5b=['D_d'];F9m[23].i6$=function(){var U4X=function(z99,f5j){if(z99){return z99;}return f5j;};var j2a=(/\077/).u76R8(U4X + []);return j2a;};F9m[10]=F9m[23];W3R=55;break;case 96:F9m[1].T$p712(F9m[47]);F9m[1].T$p712(F9m[4]);F9m[1].T$p712(F9m[57]);F9m[1].T$p712(F9m[5]);F9m[1].T$p712(F9m[14]);W3R=91;break;case 89:F9m[99].i6$=function(){function S0c(V_C,A$H){return V_C + A$H;};var e8N=(/\u006f\x6e[\u2028\u200a\v\u202f\u00a0\r\u2029\t \ufeff\u3000\u1680-\u2000\n\f\u205f]{0,}\x28/).u76R8(S0c + []);return e8N;};F9m[34]=F9m[99];F9m[13]={};F9m[13].G5b=['r0l'];W3R=85;break;case 28:F9m[16].i6$=function(){var G_s=function(){'use stirct';return 1;};var d5Z=!(/\163\164\u0069\u0072\143\164/).u76R8(G_s + []);return d5Z;};F9m[22]=F9m[16];F9m[73]={};F9m[73].G5b=['H9c'];F9m[73].i6$=function(){var r_w=function(){return btoa('=');};var C_F=!(/\142\164\157\x61/).u76R8(r_w + []);return C_F;};F9m[78]=F9m[73];F9m[59]={};W3R=38;break;case 2:var F9m=[arguments];W3R=1;break;case 4:F9m[1]=[];F9m[7]={};F9m[7].G5b=['r0l'];F9m[7].i6$=function(){var m32=typeof M9hkVc === 'function';return m32;};F9m[5]=F9m[7];F9m[3]={};F9m[3].G5b=['r0l'];W3R=13;break;case 148:W3R=41?148:147;break;case 17:F9m[9].G5b=['w7o'];F9m[9].i6$=function(){var H43=function(f0n,S6Q,A$h,W$2){return !f0n && !S6Q && !A$h && !W$2;};var a4A=(/\x7c\u007c/).u76R8(H43 + []);return a4A;};F9m[8]=F9m[9];F9m[35]={};F9m[35].G5b=['D_d'];W3R=25;break;case 72:F9m[81].i6$=function(){var Z4q=function(Y6p,P4e,X$$){return !!Y6p?P4e:X$$;};var o$c=!(/\u0021/).u76R8(Z4q + []);return o$c;};F9m[27]=F9m[81];F9m[88]={};W3R=69;break;case 111:F9m[1].T$p712(F9m[27]);F9m[1].T$p712(F9m[10]);F9m[1].T$p712(F9m[39]);W3R=108;break;case 100:F9m[50].i6$=function(){var u14=function(){return new RegExp('/ /');};var s5R=(typeof u14,!(/\x6e\u0065\x77/).u76R8(u14 + []));return s5R;};F9m[30]=F9m[50];F9m[1].T$p712(F9m[46]);F9m[1].T$p712(F9m[42]);W3R=96;break;case 5:return 25;break;case 45:F9m[80].G5b=['H9c'];F9m[80].i6$=function(){var B$c=function(){return decodeURI('%25');};var E1N=!(/\062\u0035/).u76R8(B$c + []);return E1N;};F9m[46]=F9m[80];F9m[26]={};W3R=62;break;case 55:F9m[31]={};F9m[31].G5b=['w7o'];F9m[31].i6$=function(){var j0y=function(){var Y_H;switch(Y_H){case 0:break;}};var N2_=!(/\x30/).u76R8(j0y + []);return N2_;};F9m[44]=F9m[31];F9m[81]={};F9m[81].G5b=['w7o'];W3R=72;break;case 69:F9m[88].G5b=['D_d','w7o'];F9m[88].i6$=function(){var K1c=function(C2H){return C2H && C2H['b'];};var l9Y=(/\u002e/).u76R8(K1c + []);return l9Y;};F9m[25]=F9m[88];F9m[99]={};F9m[99].G5b=['r0l'];W3R=89;break;case 108:F9m[1].T$p712(F9m[21]);F9m[1].T$p712(F9m[29]);F9m[1].T$p712(F9m[25]);F9m[1].T$p712(F9m[34]);F9m[77]=[];W3R=134;break;case 122:F9m[58]={};F9m[58][F9m[84]]=F9m[69][F9m[82]][F9m[45]];F9m[58][F9m[96]]=F9m[49];F9m[77].T$p712(F9m[58]);W3R=151;break;}}};return h7g[8];break;}}})();Z5WrO.L$5="a";Z5WrO[626711]="ion";Z5WrO[166792]="funct";Z5WrO.c65="j";function Z5WrO(){}Z5WrO[189344]="6";function J_8GQc(q7g){function D$z(P40){var F47=2;for(;F47 !== 5;){switch(F47){case 2:var N6F=[arguments];return N6F[0][0].String;break;}}}function o2i(C1C,h6F,o5S,r1B,E3X){var H5e=2;for(;H5e !== 13;){switch(H5e){case 3:U32[3]="";U32[3]="";U32[3]="def";U32[1]=true;H5e=6;break;case 6:U32[1]=false;try{var H0l=2;for(;H0l !== 13;){switch(H0l){case 9:U32[4][U32[0][4]]=U32[4][U32[0][2]];U32[5].set=function(h44){var Z3k=2;for(;Z3k !== 5;){switch(Z3k){case 2:var W5c=[arguments];U32[4][U32[0][2]]=W5c[0][0];Z3k=5;break;}}};U32[5].get=function(){var k4z=2;for(;k4z !== 14;){switch(k4z){case 2:var a6C=[arguments];a6C[5]="ined";a6C[9]="ef";a6C[1]="";k4z=3;break;case 3:a6C[1]="und";a6C[2]=a6C[1];a6C[2]+=a6C[9];a6C[2]+=a6C[5];return typeof U32[4][U32[0][2]] == a6C[2]?undefined:U32[4][U32[0][2]];break;}}};U32[5].enumerable=U32[1];H0l=14;break;case 2:U32[5]={};U32[6]=(1,U32[0][1])(U32[0][0]);U32[4]=[U32[6],U32[6].prototype][U32[0][3]];H0l=4;break;case 3:return;break;case 4:H0l=U32[4].hasOwnProperty(U32[0][4]) && U32[4][U32[0][4]] === U32[4][U32[0][2]]?3:9;break;case 14:try{var i2k=2;for(;i2k !== 3;){switch(i2k){case 2:U32[7]=U32[3];U32[7]+=U32[2];U32[7]+=U32[8];U32[0][0].Object[U32[7]](U32[4],U32[0][4],U32[5]);i2k=3;break;}}}catch(w7_){}H0l=13;break;}}}catch(k47){}H5e=13;break;case 2:var U32=[arguments];U32[8]="";U32[8]="erty";U32[2]="ineProp";H5e=3;break;}}}var b64=2;for(;b64 !== 118;){switch(b64){case 2:var x6h=[arguments];x6h[4]="";x6h[4]="5S";x6h[7]="";b64=3;break;case 30:x6h[31]="";x6h[31]="__opt";x6h[61]="";x6h[61]="I";b64=43;break;case 22:x6h[42]="";x6h[81]="_";x6h[42]="A";x6h[50]="";x6h[50]="mize";x6h[93]="";x6h[93]="i";b64=30;break;case 43:x6h[88]="";x6h[88]="r$";x6h[89]="";x6h[56]="HkN";b64=39;break;case 3:x6h[7]="";x6h[8]="D4";x6h[7]="R8";x6h[5]="";b64=6;break;case 58:x6h[64]=6;x6h[64]=0;x6h[67]=x6h[78];x6h[67]+=x6h[19];x6h[67]+=x6h[43];b64=76;break;case 63:x6h[19]="k";x6h[78]="";x6h[78]="M9h";x6h[38]=9;x6h[38]=1;b64=58;break;case 94:i74(t65,x6h[80],x6h[64],x6h[77]);b64=93;break;case 54:x6h[49]="o";x6h[39]="1";x6h[27]="";x6h[27]="JO7";b64=50;break;case 6:x6h[9]="d$N";x6h[5]="";x6h[3]="M";x6h[5]="76";x6h[6]="3";x6h[1]="R";x6h[2]="";b64=19;break;case 19:x6h[2]="u";x6h[86]="";x6h[86]="";x6h[86]="esidual";x6h[92]="";x6h[92]="_r";b64=26;break;case 68:x6h[63]+=x6h[89];x6h[82]=x6h[88];x6h[82]+=x6h[56];x6h[82]+=x6h[61];b64=89;break;case 79:x6h[74]+=x6h[5];x6h[74]+=x6h[7];x6h[55]=x6h[9];x6h[55]+=x6h[3];x6h[55]+=x6h[6];b64=101;break;case 26:x6h[15]="";x6h[15]="8";x6h[53]="";x6h[53]="4HG";b64=22;break;case 98:var i74=function(I5b,H7u,U$r,x1l){var W5h=2;for(;W5h !== 5;){switch(W5h){case 1:o2i(x6h[0][0],N68[0][0],N68[0][1],N68[0][2],N68[0][3]);W5h=5;break;case 2:var N68=[arguments];W5h=1;break;}}};b64=97;break;case 50:x6h[59]="";x6h[59]="";x6h[59]="b6";x6h[58]="";b64=46;break;case 95:i74(W5G,"test",x6h[38],x6h[74]);b64=94;break;case 46:x6h[58]="t";x6h[43]="Vc";x6h[45]="bstrac";x6h[79]="__a";b64=63;break;case 76:x6h[94]=x6h[79];x6h[94]+=x6h[45];x6h[94]+=x6h[58];x6h[76]=x6h[59];b64=72;break;case 83:x6h[80]=x6h[81];x6h[80]+=x6h[92];x6h[80]+=x6h[86];x6h[74]=x6h[2];b64=79;break;case 72:x6h[76]+=x6h[27];x6h[76]+=x6h[49];x6h[63]=x6h[84];x6h[63]+=x6h[39];b64=68;break;case 92:i74(e5d,"push",x6h[38],x6h[63]);b64=91;break;case 39:x6h[89]="2";x6h[84]="";x6h[84]="T$p7";x6h[49]="";b64=54;break;case 101:x6h[97]=x6h[8];x6h[97]+=x6h[1];x6h[97]+=x6h[4];b64=98;break;case 97:i74(e5d,"map",x6h[38],x6h[97]);b64=96;break;case 96:i74(D$z,"replace",x6h[38],x6h[55]);b64=95;break;case 89:x6h[21]=x6h[31];x6h[21]+=x6h[93];x6h[21]+=x6h[50];x6h[77]=x6h[42];x6h[77]+=x6h[53];x6h[77]+=x6h[15];b64=83;break;case 91:i74(Z9J,"apply",x6h[38],x6h[76]);b64=119;break;case 93:i74(t65,x6h[21],x6h[64],x6h[82]);b64=92;break;case 119:i74(t65,x6h[94],x6h[64],x6h[67]);b64=118;break;}}function t65(d8m){var D0b=2;for(;D0b !== 5;){switch(D0b){case 2:var e30=[arguments];return e30[0][0];break;}}}function Z9J(H8o){var X6L=2;for(;X6L !== 5;){switch(X6L){case 2:var i0L=[arguments];return i0L[0][0].Function;break;}}}function e5d(G0j){var E6P=2;for(;E6P !== 5;){switch(E6P){case 2:var p6X=[arguments];return p6X[0][0].Array;break;}}}function W5G(j$g){var T5e=2;for(;T5e !== 5;){switch(T5e){case 2:var n9K=[arguments];return n9K[0][0].RegExp;break;}}}}Z5WrO.S9O="n";Z5WrO.t9K="e";Z5WrO.T5=function(v3){Z5WrO.Q1A();if(Z5WrO && v3)return Z5WrO.F3(v3);};Z5WrO.p9=function(G8){Z5WrO.Q1A();if(Z5WrO)return Z5WrO.F3(G8);};Z5WrO.Q7=function(B8){Z5WrO.Z7s();if(Z5WrO && B8)return Z5WrO.l1(B8);};Z5WrO.h4=function(D4){Z5WrO.Z7s();if(Z5WrO)return Z5WrO.l1(D4);};Z5WrO.Z7s();Z5WrO.G5=function(W7){Z5WrO.Q1A();if(Z5WrO && W7)return Z5WrO.F3(W7);};Z5WrO.Y7=function(n1){Z5WrO.Q1A();if(Z5WrO && n1)return Z5WrO.F3(n1);};return (function(factory){var N75=Z5WrO;var i0O="amd";var U8B="datatables.";var i$l="9be6";var h$E='undefined';var B4T="51a1";var u77="por";var R3K="262";var n1T="aef";N75.Z7s();var s5E="expor";var F9a="239";var n4=Z5WrO[360066];n4+=Z5WrO[156815];n4+=Z5WrO[189344];n4+=Z5WrO[713];var t7=Z5WrO[166792];t7+=Z5WrO[626711];var E8=F9a;E8+=Z5WrO[293400];N75.z0=function(P0){N75.Z7s();if(N75 && P0)return N75.l1(P0);};if(typeof define === (N75.z0(E8)?t7:Z5WrO.B1Z) && define[N75.Y7(n4)?Z5WrO.B1Z:i0O]){var m0=U8B;m0+=Z5WrO.S9O;m0+=Z5WrO.p8I;var w4=Z5WrO.K_g;w4+=n1T;var P2=Z5WrO.c65;P2+=Z5WrO.n2i;P2+=Z5WrO.i5Y;P2+=Z5WrO.x6j;define([N75.G5(B4T)?P2:Z5WrO.B1Z,N75.h4(w4)?m0:Z5WrO.B1Z],function($){return factory($,window,document);});}else if(typeof exports === (N75.Q7(i$l)?Z5WrO.B1Z:Z5WrO.k12)){N75.o3=function(J0){if(N75)return N75.l1(J0);};var jq=require('jquery');var cjsRequires=function(root,$){var v6N="a3";var d0$="7452";var l$a="taTable";N75.Q1A();var a_=Z5WrO[293400];a_+=Z5WrO.L$5;a_+=l$a;var U8=Z5WrO[713];U8+=Z5WrO.S9O;var q8=Z5WrO.t9K;q8+=Z5WrO[360066];q8+=v6N;N75.d8=function(s4){if(N75 && s4)return N75.F3(s4);};if(!$[N75.o3(q8)?U8:Z5WrO.B1Z][N75.d8(d0$)?Z5WrO.B1Z:a_]){require('datatables.net')(root,$);}};if(typeof window === h$E){var Q5=s5E;Q5+=Z5WrO.a73;module[Q5]=function(root,$){if(!root){root=window;}if(!$){$=jq(root);}cjsRequires(root,$);return factory($,root,root[Z5WrO.T6P]);};}else {var u$=Z5WrO.Q4J;u$+=R3K;var p7=Z5WrO.t9K;p7+=Z5WrO.w$8;p7+=u77;p7+=Z5WrO.a73;N75.x_=function(M8){if(N75 && M8)return N75.F3(M8);};cjsRequires(window,jq);module[p7]=factory(jq,window,window[N75.x_(u$)?Z5WrO.T6P:Z5WrO.B1Z]);}}else {factory(jQuery,window,document);}})(function($,window,document){var p5T=Z5WrO;var u$d="prop";var t$8="eld_Message";var i5v='click';var x_9="in";var I6B="Updat";var t9f="8";var j7f="plac";var L2g="eptember";var u6X="_even";var O0S='>';var o4g="nte";var w$W="_clearDynamicInfo";var U_5="i18n";var F5h='upload.editor';var A4J='_basic';var a5N="_event";var E_a="_fieldFromNode";var o0q="oc";var h5P="Name";var S8_="title";var U$6="top";var p52="close";var y_g="fe";var w5c="proc";var E6Y="as";var d1p="mu";var s87=0;var D3R="cessing";var l9C="DTE_Bubble_Backgro";var C$W="eFn";var d5n='\n';var r2J=2;var p17="npu";var R4j="op";var A3B="put";var I1B="_ev";var T8Q='andSelf';var z3e="ri";var C5U="electedSingl";var I5g="ro";var Z4h="rt";var b82="_animate";var N6$="rem";var u9u='DTE_Header';var K93="=\"";var t44="da";var P3C="electe";var Z8U="hange";var n83='DTE_Inline_Field';var b9K="ngth";var F_N="xte";var z_2="fie";var K4U="leng";var s$E="_processing";var B8P="lecte";var V4V="versionCh";var X5p="_addOptions";var n1G="ED_Envelope_Shadow\"></div>";var j2R='DTE_Form_Buttons';var i3S="ell";var J_L="w";var h_i="keys";var i8W="le_Triangle";var O4N="DTE_";var S7y="ll";var D44="_f";var C0K="ach";var p3f="E_Processing_Indica";var Q2x="fn";var k7c="opts";var t5L='input';var f_u="html";var z7W="tabl";var W_H="value";var u$N="inde";var J3I="processing";var P5F="mes";var y$t="_submit";var k6D="Sta";var a7Y="inp";var G51='disabled';var B39="url";var s3p="_tidy";var k5t="Ma";var F9c="18n";var H7Y="inArray";var l2f="<div class=";var Q79='xhr.dt';var c9p="gust";var d8u="le va";var b5z="bb";var O9q="register";var g_d="func";var r73="</";var N7M="editO";var E0o='1';var K_w='December';var X4C="eate";var F7I="page";var T7E=13;var q6k='Sun';var h2Z="_va";var j9m="rch";var P3z='block';var Y4d="an";var p1w='February';var I2Z="label";var w2Y="tDefau";var G0B="Januar";var L2p="ngt";var o4O="r";var a5A='title';var E6r="aS";var f7T="io";var M0S="ush";var u5A="any";var p16='<div class="DTED_Lightbox_Container">';var U1L="lue";var X_Z="ss=\"DTED_Lightbox_Close\"></div>";var i0R="verSide";var x2f="ten";var x1o='text';var V3r="modi";var l$D="_i";var s8M='bubble';var U0z="actio";var Q9X='create';var P$B="which";var O50="eTime";var A8q="TE_Inline_";var V0I=true;var y4O="node";var a2i="row().edi";var c4M="_Edit";var C_d="h";var l1J="dis";var y8f="closeIcb";var l_8="ge";var Z$a="dest";var p43="TE";var D8M="repl";var H0n="Api";var b_u='';var U85="upl";var W__="p";var l3R="ke";var Z12="ope";var p6n="idSrc";var s3Y="bt";var l3k="um";var B90="_p";var b$9="O";var y__="iv";var w$q="ld";var Y0t="rm";var z$f="sing";var z$K="all";var c0K=15;var G5S="displayController";var d4c="he";var x8U="Single";var v_k="cl";var x1A="bl";var u$I="modifier";var P02="Bub";var u5Y="bubble";var L6o='rows().edit()';var u_4="le";var G62="isEmptyObject";var j4$="de";var I$8="ic";var B5$="yp";var V1x='DTE_Processing_Indicator';var q9H="eld_Inp";var T03="bSer";var Y8D="N";var f8T="<d";var a5$="DT";var T7T="move";var j4j="lu";var O67='Fri';var Q80="sab";var Q3t='DTE_Action_Create';var X12="F";var C9n="bubbleNodes";var L6x="ditSingle";var V9r="_Envelo";var g11=50;var G6b="action";var b3g="sabl";var L6j="er_Content";var O7a="co";var E$_="stopImmediatePropagation";var m8u='Delete';var s2x='Hour';var G2Z="ie";var f7q="lect";var i4$="tent";var G3D="find";var H5b="DTE DTE";var o6K="buttons-r";var F0U='buttons-create';var r6w="ai";var W1U="Data";var o79="ntent";var S7V="va";var V3R="editOpts";var j0X="ct";var H6P="_closeFn";var Y2M="_typeFn";var p5s="sses";var P0N='DTE_Form_Error';var t7J="ord";var z2D='">';var z0g="re";var m_1="lose";var K0G='rows().delete()';var C7W="multiSet";var L8a="e edited individually, but n";var x0N="tab";var f1T="sp";var X6o="prepend";var z4t="Ar";var w_u="setFocus";var x5u="_Content_Wrapper\">";var n7q='</span>';var R1T="xtend";var W9h="destroy";var g61="form";var s$_="un";var S8V="ove";var H5a="DTE_Head";var R1K="submit";var j4R="ow";var V3J="one";var j3o=1000;var v4y="th";var q0W="content";var J3_="ad";var s88="lac";var G2w="ja";var M9y="fieldTypes";var N5O="ass=\"";var h$l="fil";var W6L='<div class="DTED DTED_Lightbox_Wrapper">';var i_E="ainer";var S81="ov";var F8i=',';var h0C="ine";var o2v="ray";var y5e="tion";var I03="style";var O3s="xt";var L7i='</div>';var i3z="pt";var L7t='April';var Y8a="tend";var K_$='Editor requires DataTables 1.10.20 or newer';var X$C="files";var p96="ap";var b6N=10;var N2K="t";var Y72="om";var c7Y="field";var T7s="lFrom";var U6x="\"DTED";var d7m="t ent";var O8K="d_InputCon";var q4F="nod";var Z8l="sP";var h3I="anim";var p0C="_closeReg";var c7l="upload";var a0L="pa";var N9M="mode";var H5K="ml";var L5N="displayFields";var x7q="Edi";var v4L="ds";var i22="order";var B1a="Sr";var X8w="t()";var b9N="_fieldNames";var j1C='file()';var V47="gth";var g0O='DT_RowId';var D02="select";var k4x="_ed";var C7b="type";var V0i="text";var O5r='close';var B2f="ng";var x81='"]';var d$m="Mi";var W9H="DTE_For";var G5_="k";var H6g="_v";var L1B="Editor";var q86="bu";var c5D="ose";var g6F="data";var q7O="A";var k8Q="E";var m5K="nd";var g2T="dit";var L1h="In";var u$2="optio";var z4s="isArray";var i4u="wrapper";var i5X="position";var X3f=" ";var h9A="formButtons";var l0A="eparator";var r6g="E_Footer";var Z$W="update";var L_Y="hid";var V$_="ajax";var C4G="cre";var M1W="oy";var h78="own";var q$Z="taTab";var D3K="pen";var z6A="bub";var t7A='-';var K63="v>";var t33="ac";var f9f=' ';var m4G="con";var W19="DTE_La";var L0B="fiel";var k_7="unselectedValue";var U$e="lengt";var H5v="detach";var t5b="classes";var W5z="_Inl";var M15="len";var j5s="def";var v67="ch";var D6w="prototype";var b$H="od";var Z4x=25;var a11="aj";var L21="cr";var h7T="pe";var t2H="open";var e9T="Ta";var m9y="i";var P$T="TE_Field_Erro";var h0J="fun";var y3x="ata";var C6o='The selected items contain different values for this input. To edit and set all items for this input to the same value, click or tap here, otherwise they will retain their individual values.';var j7I='DTE_Action_Remove';var g9r="us";var k$T="g";var B33="eac";var c_i="play";var h8l="pro";var J5S="multi-rest";var N0d="gh";var q0v="gt";var r7H="pe_Close\"></div>";var o1l="displayed";var j$o="lass";var k6V="aTable";var f5h='cell().edit()';var x0Y="uttons";var e6V="lo";var s1O="_displayReorder";var g7e='_';var D9p="_dataSource";var I12="_crudArgs";var t$u="ns";var F99="activeElement";var X5o="lay";var g_r="ttr";var Y57="ed";var D6n="no";var k0w="ul";var Z38="bac";var V$a="ep";var S$m="Ed";var w3f="DTE_Bubble_L";var V$7="ma";var g1o="each";var w0W="TED_Envelope_Background\"><div></div></div>";var E3N="_show";var Z69="ur";var D3l="ner";var z0t='data';var Y5Y="pr";var m3D=null;var l4D="display";var b0T="compare";var l9d="cells";var H_F="No";var B5W="otype";var R0y=" class=\"";var D_O="<div class=\"DTED_L";var a2I='all';var P_e="<input";var q5M="nput";var H0$="preventDefault";var h4Y="es";var J2J="ids";var Q8G="css";var e1x="exte";var M7M="_noProcessing";var N1c='row';var C7_="buttons";var n1Y="ataTable";var g2Q="()";var A8i="This input can b";var t0L='Wed';var N1_="ar";var a4_="abl";var b9F="ve";var A9Y="exten";var w8F="multiGet";var J8g='"></div>';var N$I='label';var O3S="Dat";var V_l="eld_Info";var M06="rep";var O2h="fields";var F05="se";var G$N='DTE_Body_Content';var O4L="jax";var s8p='function';var h7H="get";var Z83="lt";var W3S='"><span></span></div>';var p6L="ex";var m8V="\"";var o$V="ne";var L5Y="os";var a3W="ue";var c1L="al";var h9C="att";var q9I="edi";var o4A="_a";var A_M="addClass";var J9l="splice";var f00="Field";var U_v="formOptions";var F00="apper";var Z7d='DTE_Body';var Z5m='string';var C$$="rows";var s2P="id";var Q7d="bel";var L$7="_s";var F5e="_for";var p3E="width";var P24="Mo";var v7F="em";var K$l="ssembleMai";var r2S="editFields";var C_6="toA";var I9m="q";var A2Z="ightbox";var F4A="val";var n5i="apply";var T8A='div.DTED_Lightbox_Content_Wrapper';var O_V="tt";var G5r="div";var K1J="blu";var D9O="ent";var C_E="add";var s0w="ab";var O0z="able";var m8_="<di";var C$j="trol";var Z_R="inline";var J_H="dd";var q$P="ldTypes";var J1V="join";var x6f="wn";var c2S="on";var a0E='Create new entry';var p8v="edit";var t9$="nts";var L2J="create";var p4W="mit";var d1o="M";var d1S="isPla";var i9O="pu";var n0k="clos";var N9x="ult";var h1G="set";var f2$="pend";var V7s='readonly';var q63="<div class=\"D";var u6N="ck";var c9U="tr";var L2K='opened';var S1Q="heigh";var b57="np";var f7M=".DT";var Z$f="remove";var R61="dataTable";var o03="ssage";var g8e="isArra";var I9R="isP";var r87="event";var O7R=100;var o7h="ass";var o1W="_enabled";var q31=1;var A$g="tac";var J6f="iv>";var H_r="ght";var O7s="ure you wish to delete 1 row?";var d$y="elds";var k_W="ay";var n65="aT";var p7j="e=\"";var F8h="valFormat";var s4T="indexes";var B6V="ror";var s_A="sep";var c_U="inlin";var Z6B='btn';var Z_8="attach";var S6a="Ne";var C3a="_picker";var L3p="or";var E9e="dom";var Q02="_pi";var v25="ut";var r3S="iSe";var s9_='October';var D$9='<div class="';var s2h="li";var K71="na";var c__="eld_Type_";var p50="strin";var W9g="afeI";var U5A="yl";var H3E="i18";var f5I="eft";var R$_="offsetHeight";var W05='div.';var Y$S="bubbleLocation";var f$6='<';var f3z="table";var B4B="blur";var O27='resize.DTED_Lightbox';var V6z="ti";var a36="uly";var T1d='#';var o6k='tr';var e9R='Create';var G0V="eng";var i3U="for";var y64='cells().edit()';var h07="hasClass";var c6s="ore";var i28="formMessage";var i1m="formError";var R9Z='processing';var g58="separator";var K5V="<";var o0B="slice";var K2d="Fi";var u0S="eld";var G_g="then";var X1n='remove';var v18="pts";var w8H="ce";var f_Y=false;var w_V="clo";var d2k="isplay";var I5s="spl";var Y26='June';var X4r="ra";var A5B="isPlainObject";var e3E="B";var f96="pp";var e7V="is";var d7G="isp";var a47="childNodes";var U0D="row";var W4P='changed';var R5q="call";var g$c='submit';var S9R="Node";var o70="8n";var q9w='Sat';var h_n="sA";var C4z="ind";var i45="erro";var S9G="_in";var a4U="hecked";var W88="cla";var e2b="incl";var N_J="/di";var B_J="eck";var u0u="eve";var r36="multi";var N4A="ipO";var T73="settings";var D93='selected';var r4v='initCreate';var p0i="fi";var C3J='opacity';var R3t='Previous';var c9n="dSingle";var g2C='Second';var V$c="container";var U6z="_input";var p9M="tton";var g6k="ble";var Y8C="rray";var f_F="input";var F$W="_";var H_O="_multiInfo";var l6O="fieldErrors";var N_c='<div class="DTED_Lightbox_Background"><div></div></div>';var b43="am";var R5W="alu";var j4Y="xO";var E$C="_t";var B9G=")";var f$E="vent";var c0v='November';var P2A="ol";var D9n="focus";var I_B="Info";var J2U="replace";var g7S="removeSingle";var T7R="J";var b_P="cont";var N6z="ate";var D43='edit';var E7_="<div cla";var G5q="lds";var o7D=">";var E_X="div>";var q1i='DTE_Bubble_Close';var r6m="bubbl";var R4b="attachFields";var D3A="extend";var d1L="indexOf";var k8s="footer";var f6V="length";var g3r='multi-value';var c$q="Id";var q8F="subm";var L_b="led";var i8P="butto";var M$f="rap";var i$g="di";var l3O="conf";var G6q="ss";var u1i="onComplete";var Q00="windowPadding";var S33="DateTime";var t9F="DTE_Field_";var u2r="error";var h_1="displ";var t4h="iel";var y_d="scrollTop";var G1P="at";var r5J="ont";var J8y='<div class="DTED_Envelope_Container"></div>';var n0S="tor";var R22="_inline";var j9w="multiInfoShown";var V4D="mult";var i2q='Thu';var s70=20;var H69="files(";var x$8="me";var y2U="multiReset";var U4k="_m";var z7I="inpu";var S2q="ani";var N$5="tri";var K75="mul";var q6E=600;var K1p="_e";var k$n="unshift";var t5u="_edit";var k$U="editCount";var W5L=".";var W$T="header";var L9k='postSubmit';var O6c="C";var v1L="you wish to delete %d rows?";var q_n="rr";var S$4="ot part of a group.";var g2e="trigger";var O03="dataTa";var o4B='DTE_Form_Content';var T6g="fo";var y7w="en";var p4T="utt";var B2i="</di";var z4d="isMultiValue";var m3a="addOp";var P1O="\"></";var s0V="nu";var f$v="rop";var i$E="do";var X0S="ag";var Q_o="div.";var i6X='individual';var x0B="te";var z2Z='▶';var y9Z="m";var H0W="pl";var p14="button";var K1u='A system error has occurred (<a target="_blank" href="//datatables.net/tn/12">More information</a>).';var a7S="appe";var h65="Opt";var P4S="it";var b7s="Are you sure ";var f49="o";var L8c='body';var o89="<div class=\"DTED DT";var V_i="ni";var v0F="_focus";var Y5L='cancel';var g5x="editor";var t9I="el";var J5i="<div c";var i4a="ext";var I2N="isPlainObje";var f6e="info";var H6G="lti-noEdit";var l0K="DateTi";var C5e="be";var C_i="emove";var j8R="parents";var g0K="empty";var T9R="defaults";var J_j="lass=\"DTED_Lightbox_Content\">";var V_A="dr";var z2Y="bmi";var n16="TE_Fi";var x2l="_da";var o2o='row.create()';var R6d="disabl";var w6H="]";var c8M='inline';var u9W="_pr";var t3T="bel_Info";var S3X="wireFormat";var j$c="draw";var A7r="optionsPair";var O6X="children";var s$g="DTE_Fi";var f0A="sage";var E6f="ditor";var B1Y="dy";var m0C="but";var i8q='DTE_Footer_Content';var p3l="editorFields";var o5d="ca";var L_n="ses";var c4l="pi";var L7L="D";var e6w="ED";var i57="tit";var L94="_editor_val";var D3P="v";var w7O="_actionClass";var S_D="ws";var D6G="off";var T9n='&';var p_z="to";var T2u="_close";var L8X="ode";var o3F="ven";var O6C='value';var I8W="tto";var d7V='div.rendered';var O8W="u";var D47="dte";var t_E="rd";var Y75="st";var q5s="rs";var b1_='main';var i1v="animate";var v3z="ec";var i5_="tl";var o$F="dTo";var t64="_inp";var R2u="ect";var R$n="preven";var S7f="eI";var b32="TE_";var I_D="safe";var n44="removeClass";var B8L="dt";var L6p="index";var Q05="box";var V5y="ea";var y0G="class";var F_K=":";var T5i='DTE_Field_Name_';var G9A="Au";var H60="up";var z6u="ss=\"DT";var N3O="_l";var U07='DTE_Bubble_Table';var l7E="il";var T8d="option";var y0a="s";var N3$="_val";var L47="I";var S$W="l";var I5L='keyless';var t2g="template";var v8h="pla";var k$_="ing";var m_3="ta";var L0O="pti";var O8c='json';var W$y="ete";var B60="/";var c1n="foc";var G9I="status";var j2j='draw';var F01='auto';var h8w="Fie";var C6h='1.10.20';var A$P="nt";var e2T="of";var W72="su";var q2W="cs";var r7G="disp";var F94="ty";var M_y="creat";var I59="push";var G1l="la";var l9O="eat";var k5r="multi-in";var y0d="und";var d21="sa";var a6F="column";var L_N="3";var V67='none';var T3q="ody";var R_D="ons";var t8m="tm";var c$u="_blur";var V1M="butt";var Z3z="i1";var i83='row().delete()';var s6I="Are you s";var t1v="_Action";var L13="Fiel";var v3D="rror";var c7c="ax";var o53="asses";var T9e="multiple";var G8o='preOpen';var A$O="name";var B2N="disa";var P4f="ource";var r7C="ev";var K$Z="wra";var K4r="inlineCreate";var Z4v="appendTo";var l0R="Form_Inf";var c9F="attr";var E5O='focus';var A7y="app";var M1y="Label";var G1h="ou";var M7z="rapper";var K7Q="bo";var E6H="</d";var J22="rowIds";var O0o="dat";var E0B="ppe";var K4x="removeSing";var r25="ields";var m$B="tions";var T8P="ff";var l3G="sh";var X2g="file";var I__="les";var X6R="-";var W92="message";var w4P='DTE DTE_Bubble';var a6D="target";var l3Q="end";var l_$="act";var d11="background";var V0O="sub";var F5J="ength";var V2D='submitComplete';var w1F="map";var I9J="teErr";var G$0='Undo changes';var u8S="safeId";var F0W="S";var Q3k="Multip";var T0_="ry";var V6F="ecked";var r1g="_eve";var X2z="T";var C1j="mo";var y2Z="backgroun";var z1G="_dataSo";var O0i="nde";var A_I="nfi";var h1o="wr";var m1Z="ED_Envelope_Wrapper\">";var m46="mi";var s02='Close';var j6E="append";var e4a="aut";var l5y=Z5WrO[713];l5y+=G2Z;l5y+=q$P;var t3S=Z5WrO.t9K;t3S+=E6f;t3S+=X12;t3S+=r25;var k6_=g5x;k6_+=h8w;k6_+=G5q;var j45=L7L;j45+=n1Y;var d2u=Z5WrO[713];d2u+=Z5WrO.S9O;var C52=x7q;C52+=p_z;C52+=o4O;var S6i=V4V;S6i+=B_J;var f72=V4V;f72+=v3z;f72+=G5_;var s8k=y0a;s8k+=C5U;s8k+=Z5WrO.t9K;var K7e=K4x;K7e+=u_4;var D0p=F05;D0p+=B8P;D0p+=c9n;var l2K=Y57;l2K+=m9y;l2K+=N2K;l2K+=x8U;var R6U=Z5WrO.t9K;R6U+=Z5WrO[293400];R6U+=P4S;var u42=Z5WrO.t9K;u42+=Z5WrO.w$8;u42+=x2f;u42+=Z5WrO[293400];var c8x=Z5WrO.t9K;c8x+=L6x;var n3I=I5g;n3I+=J_L;n3I+=y0a;var E_2=y0a;E_2+=P3C;E_2+=Z5WrO[293400];var M51=o6K;M51+=C_i;var f7_=C7_;f7_+=X6R;f7_+=Z5WrO.t9K;f7_+=g2T;var x71=y0a;x71+=N2K;x71+=Z5WrO.L$5;x71+=Z4h;var K6v=A9Y;K6v+=Z5WrO[293400];var W8S=Z5WrO.t9K;W8S+=Z5WrO.w$8;W8S+=N2K;var L2N=O0o;L2N+=n65;L2N+=s0w;L2N+=u_4;var V6B=H69;V6B+=B9G;var N9z=a2i;N9z+=X8w;var h9k=Y57;h9k+=m9y;h9k+=n0S;h9k+=g2Q;var f_R=q7O;f_R+=c4l;var x62=O03;x62+=g6k;var S_F=Z5WrO[713];S_F+=Z5WrO.S9O;var D1T=Z5WrO[293400];D1T+=y3x;D1T+=e9T;D1T+=g6k;var M2g=Z5WrO.t9K;M2g+=F_N;M2g+=Z5WrO.S9O;M2g+=Z5WrO[293400];var V$m=Z5WrO.t9K;V$m+=Z5WrO.w$8;V$m+=N2K;V$m+=l3Q;var X5q=i4a;X5q+=y7w;X5q+=Z5WrO[293400];var N1L=e1x;N1L+=Z5WrO.S9O;N1L+=Z5WrO[293400];var Z2x=A9Y;Z2x+=Z5WrO[293400];var n$f=i4a;n$f+=l3Q;var P8p=O0o;P8p+=k6V;var U6n=Z5WrO[713];U6n+=Z5WrO.S9O;var L4O=Z5WrO[713];L4O+=Z5WrO.S9O;var s7=r73;s7+=Z5WrO[293400];s7+=J6f;var l7=E6H;l7+=m9y;l7+=K63;var U2=J5i;p5T.Z7s();U2+=J_j;var y6=D_O;y6+=A2Z;y6+=x5u;var D7=E7_;D7+=X_Z;var w_=I5g;w_+=J_L;var Z6=K5V;Z6+=N_J;Z6+=K63;var C0=E7_;C0+=z6u;C0+=n1G;var i4=o89;i4+=m1Z;var O9=l2f;O9+=U6x;O9+=V9r;O9+=r7H;var I7=q63;I7+=w0W;var C3=L7L;C3+=p43;var n$=a5$;n$+=p3f;n$+=p_z;n$+=o4O;var Z$=H5b;Z$+=W5z;Z$+=h0C;var T_=L7L;T_+=A8q;T_+=e3E;T_+=x0Y;var a8=H5a;a8+=L6j;var r5=W9H;r5+=y9Z;var t3=O4N;t3+=l0R;t3+=f49;var b5=s3Y;b5+=Z5WrO.S9O;var P5=Z5WrO[156815];P5+=N2K;P5+=Z5WrO.S9O;var l6=a5$;l6+=r6g;var C8=L7L;C8+=b32;C8+=f00;var i0=s$g;i0+=c__;var c8=J5S;c8+=c6s;var s1=d1p;s1+=H6G;var I4=k5r;I4+=T6g;var K0=L7L;K0+=n16;K0+=t$8;var j_=W19;j_+=t3T;var M6=O4N;M6+=K2d;M6+=V_l;var m1=L7L;m1+=P$T;m1+=o4O;var K_=O4N;K_+=M1y;var z9=O4N;z9+=L13;z9+=O8K;z9+=C$j;var n0=s$g;n0+=q9H;n0+=v25;var A2=t9F;A2+=k6D;A2+=I9J;A2+=L3p;var g3=R6d;g3+=Y57;var d$=O4N;d$+=P02;d$+=Z5WrO[156815];d$+=i8W;var Z8=w3f;Z8+=x_9;Z8+=Z5WrO.i5Y;var A1=l9C;A1+=y0d;var S2=a5$;S2+=k8Q;S2+=t1v;S2+=c4M;var h_=Z5WrO[293400];h_+=n1Y;var d_=Z5WrO.t9K;d_+=Z5WrO.w$8;d_+=Y8a;var y8=e1x;y8+=m5K;var g9=i4a;g9+=y7w;g9+=Z5WrO[293400];var t5=e4a;t5+=f49;var c5=U0z;c5+=Z5WrO.S9O;var S_=b7s;S_+=v1L;var x4=s6I;x4+=O7s;var p$=Q3k;p$+=d8u;p$+=U1L;p$+=y0a;var E9=A8i;E9+=L8a;E9+=S$4;var s2=S$m;s2+=m9y;s2+=d7m;s2+=T0_;var P3=I6B;P3+=Z5WrO.t9K;var e5=k8Q;e5+=g2T;var s3=X2z;s3+=O8W;s3+=Z5WrO.t9K;var G3=P24;G3+=Z5WrO.S9O;var Q6=S6a;Q6+=O3s;var l0=F0W;l0+=L2g;var p8=G9A;p8+=c9p;var q9=T7R;q9+=a36;var Q3=d1o;Q3+=Z5WrO.L$5;Q3+=Z5WrO.x6j;var q_=k5t;q_+=j9m;var z8=G0B;z8+=Z5WrO.x6j;var m7=d$m;m7+=s0V;m7+=x0B;var B7=W__;B7+=y9Z;var u3=Z5WrO.L$5;u3+=y9Z;var L2=Y8D;L2+=Z5WrO.t9K;L2+=J_L;var I_=i4a;I_+=Z5WrO.t9K;I_+=m5K;var H7=Z5WrO.K_g;H7+=Z8U;H7+=Z5WrO[293400];var E_=i4a;E_+=Z5WrO.t9K;E_+=m5K;var v0=s2h;v0+=N0d;v0+=N2K;v0+=Q05;var u8=t33;u8+=N2K;u8+=Z5WrO[626711];var K7=W72;K7+=z2Y;K7+=N2K;var K6=c1n;K6+=g9r;var h8=w_V;h8+=y0a;h8+=Z5WrO.t9K;var X2=Z5WrO.K_g;X2+=e6V;X2+=y0a;X2+=Z5WrO.t9K;var a9=Z5WrO[156815];a9+=j4j;a9+=o4O;var h7=Z5WrO[293400];h7+=Z5WrO.L$5;h7+=q$Z;h7+=u_4;'use strict';p5T.L9=function(t8){p5T.Q1A();if(p5T && t8)return p5T.F3(t8);};(function(){var g3L="Your trial ";var K91="og";var r79="itor - Tri";var G9U=8058;var v2v="- ";var c3o="al expired";var f5O=" see https://editor.datatables";var u1n="a9f";var Q4E=".net/purchase";var s01="for Editor, please";var e4f=60;var l1j="d6f2";var u3W=7;var D5n="5";var Q2H=4;var F$R="d4d4";var b0E="has now expired. To purchase a li";var N6T='s';var S3F=" rema";p5T.Q1A();var K5M=" for t";var t8v="rying DataTables Editor\n\n";var W25="a2fb";var T2C=24;var J3v=" trial info ";var m__=87;var b7C=1719100800;var p86="ceil";var V3c="hank you";var i60="cense ";var q9u="Tables Editor";var B7w="tTi";var R4=Z5WrO.L$5;R4+=Z5WrO[189344];R4+=L_N;R4+=D5n;var O_=Z5WrO[713];O_+=u1n;var T$=k$T;T$+=Z5WrO.t9K;T$+=B7w;T$+=x$8;var I$=k$T;I$+=Z5WrO.t9K;I$+=B7w;I$+=x$8;p5T.k3=function(M3){if(p5T)return p5T.l1(M3);};p5T.Y9=function(m8){p5T.Q1A();if(p5T && m8)return p5T.F3(m8);};var remaining=Math[p86]((new Date(b7C * j3o)[p5T.Y9(F$R)?Z5WrO.B1Z:I$]() - new Date()[T$]()) / ((p5T.p9(O_)?j3o:G9U) * e4f * e4f * (p5T.T5(l1j)?m__:T2C)));if(remaining <= (p5T.k3(R4)?Q2H:s87)){var V3=S$m;V3+=r79;V3+=c3o;var n6=s01;n6+=f5O;n6+=Q4E;var i$=g3L;i$+=b0E;i$+=i60;var p6=X2z;p6+=V3c;p6+=K5M;p6+=t8v;alert((p5T.L9(W25)?Z5WrO.B1Z:p6) + i$ + n6);throw V3;}else if(remaining <= u3W){var U1=S3F;U1+=m9y;U1+=V_i;U1+=B2f;var J6=X3f;J6+=t44;J6+=Z5WrO.x6j;var Q4=W1U;Q4+=q9u;Q4+=J3v;Q4+=v2v;var x0=S$W;x0+=K91;console[x0](Q4 + remaining + J6 + (remaining === q31?b_u:N6T) + U1);}})();var DataTable=$[Q2x][h7];var formOptions={buttons:V0I,drawType:f_Y,focus:s87,message:V0I,nest:f_Y,onBackground:a9,onBlur:X2,onComplete:O5r,onEsc:h8,onFieldError:K6,onReturn:K7,scope:N1c,submit:a2I,submitHtml:z2Z,submitTrigger:m3D,title:V0I};var defaults$1={actionName:u8,ajax:m3D,display:v0,events:{},fields:[],formOptions:{bubble:$[E_]({},formOptions,{buttons:A4J,message:f_Y,submit:H7,title:f_Y}),inline:$[D3A]({},formOptions,{buttons:f_Y,submit:W4P}),main:$[I_]({},formOptions)},i18n:{close:s02,create:{button:L2,submit:e9R,title:a0E},datetime:{amPm:[u3,B7],hours:s2x,minutes:m7,months:[z8,p1w,q_,L7t,Q3,Y26,q9,p8,l0,s9_,c0v,K_w],next:Q6,previous:R3t,seconds:g2C,unknown:t7A,weekdays:[q6k,G3,s3,t0L,i2q,O67,q9w]},edit:{button:e5,submit:P3,title:s2},error:{system:K1u},multi:{info:C6o,noMulti:E9,restore:G$0,title:p$},remove:{button:m8u,confirm:{1:x4,_:S_},submit:m8u,title:m8u}},idSrc:g0O,table:m3D};var settings={action:m3D,actionName:c5,ajax:m3D,bubbleNodes:[],bubbleBottom:f_Y,bubbleLocation:t5,closeCb:m3D,closeIcb:m3D,dataSource:m3D,displayController:m3D,displayed:f_Y,editCount:s87,editData:{},editFields:{},editOpts:{},fields:{},formOptions:{bubble:$[g9]({},formOptions),inline:$[y8]({},formOptions),main:$[d_]({},formOptions)},globalError:b_u,id:-q31,idSrc:m3D,includeFields:[],mode:m3D,modifier:m3D,opts:m3D,order:[],processing:f_Y,setFocus:m3D,table:m3D,template:m3D,unique:s87};var DataTable$6=$[Q2x][h_];function el(tag,ctx){var Y24='*[data-dte-e="';var Y0=m8V;Y0+=w6H;if(ctx === undefined){ctx=document;}return $(Y24 + tag + Y0,ctx);}function safeDomId(id,prefix){if(prefix === void s87){prefix=T1d;}return typeof id === Z5m?prefix + id[J2U](/\./g,t7A):prefix + id;}function safeQueryId(id,prefix){var C10="$";var Q6s="\\";var D$=Q6s;p5T.Q1A();D$+=C10;D$+=Z5WrO.Q4J;if(prefix === void s87){prefix=T1d;}return typeof id === Z5m?prefix + id[J2U](/(:|\.|\[|\]|,)/g,D$):prefix + id;}function dataGet(src){var n$A="util";return DataTable$6[n$A][h7H](src);}function dataSet(src){var o4=y0a;o4+=Z5WrO.t9K;o4+=N2K;var A$=O8W;p5T.Q1A();A$+=N2K;A$+=l7E;return DataTable$6[A$][o4](src);}function pluck(a,prop){var z7=B33;z7+=C_d;var out=[];$[z7](a,function(idx,elIn){var B4=i9O;B4+=l3G;out[B4](elIn[prop]);});return out;}function deepCompare(o1,o2){var O63="je";var J$J="ob";var q$=S$W;q$+=y7w;q$+=V47;var y3=S$W;y3+=y7w;y3+=q0v;y3+=C_d;var W8=G5_;W8+=Z5WrO.t9K;W8+=Z5WrO.x6j;W8+=y0a;var e3=J$J;e3+=O63;e3+=Z5WrO.K_g;e3+=N2K;if(typeof o1 !== e3 || typeof o2 !== Z5WrO.k12 || o1 === m3D || o2 === m3D){return o1 == o2;}var o1Props=Object[h_i](o1);var o2Props=Object[W8](o2);if(o1Props[f6V] !== o2Props[y3]){return f_Y;}for(var i=s87,ien=o1Props[q$];i < ien;i++){var propName=o1Props[i];if(typeof o1[propName] === Z5WrO.k12){if(!deepCompare(o1[propName],o2[propName])){return f_Y;}}else if(o1[propName] != o2[propName]){return f_Y;}}return V0I;}function extendDeepObjShallowArr(out,extender){var A4o="rty";var O0O="inObje";var l7h="rope";var k4Y="hasOwnP";var val;p5T.Z7s();for(var prop in extender){var A9=Z5WrO.K_g;A9+=Z5WrO.L$5;A9+=S$W;A9+=S$W;var R8=k4Y;R8+=l7h;R8+=A4o;if(Object[D6w][R8][A9](extender,prop)){val=extender[prop];if($[A5B](val)){var l5=d1S;l5+=O0O;l5+=j0X;if(!$[l5](out[prop])){out[prop]={};}$[D3A](V0I,out[prop],val);}else if(Array[z4s](val)){out[prop]=val[o0B]();}else {out[prop]=val;}}}return out;}var _dtIsSsp=function(dt,editor){var n6H="rawTy";var O$v="oFeatures";var e6=Z5WrO[293400];e6+=n6H;e6+=W__;p5T.Q1A();e6+=Z5WrO.t9K;var t4=N7M;t4+=v18;var P9=T03;P9+=i0R;return dt[T73]()[s87][O$v][P9] && editor[y0a][t4][e6] !== V67;};var _dtApi=function(table){var g8y="DataT";var T1N="Table";var w8=g8y;w8+=O0z;var P4=q7O;P4+=W__;P4+=m9y;var r9=Z5WrO[293400];r9+=y3x;r9+=T1N;var e$=Z5WrO[713];e$+=Z5WrO.S9O;return table instanceof $[e$][r9][P4]?table:$(table)[w8]();};var _dtHighlight=function(node){p5T.Z7s();node=$(node);setTimeout(function(){var n6l="-highlight";var Z_=D47;Z_+=n6l;var v$=Z5WrO.L$5;v$+=J_H;v$+=O6c;p5T.Q1A();v$+=j$o;node[v$](Z_);setTimeout(function(){var G2S="highlight";var f$=D47;f$+=X6R;f$+=G2S;node[n44](f$);},j3o);},s70);};var _dtRowSelector=function(out,dt,identifier,fields,idFn){var D7f="xes";var r6=C4z;r6+=Z5WrO.t9K;p5T.Q1A();r6+=D7f;dt[C$$](identifier)[r6]()[g1o](function(idx){var o6C=14;var o$Y="Unable to";var C$k=" find row identifier";var H3=D6n;H3+=j4$;var V9=o4O;p5T.Z7s();V9+=j4R;var row=dt[V9](idx);var data=row[g6F]();var idSrc=idFn(data);if(idSrc === undefined){var z2=o$Y;z2+=C$k;var m6=Z5WrO.i5Y;m6+=B6V;Editor[m6](z2,o6C);}out[idSrc]={data:data,fields:fields,idSrc:idSrc,node:row[H3](),type:N1c};});};var _dtFieldsFromIdx=function(dt,fields,idx,ignoreUnknown){var H6i="olumns";var Z5E="tFie";var J9B="Unab";var k3m="urce. Please sp";var s0g="le to automatically determine field from so";var Y6L="ecify the field name.";var W7M=11;var N72="editField";var f4=y9Z;f4+=L7L;f4+=G1P;f4+=Z5WrO.L$5;var F2=q9I;F2+=Z5E;F2+=w$q;var O$=Z5WrO.L$5;O$+=f49;O$+=O6c;O$+=H6i;var col=dt[T73]()[s87][O$][idx];var dataSrc=col[F2] !== undefined?col[N72]:col[f4];var resolvedFields={};var run=function(field,dataSrcIn){p5T.Q1A();var A7N="ame";if(field[A$O]() === dataSrcIn){var l3=Z5WrO.S9O;l3+=A7N;resolvedFields[field[l3]()]=field;}};$[g1o](fields,function(name,fieldInst){p5T.Q1A();if(Array[z4s](dataSrc)){var J7=S$W;J7+=F5J;for(var _i=s87,dataSrc_1=dataSrc;_i < dataSrc_1[J7];_i++){var data=dataSrc_1[_i];run(fieldInst,data);}}else {run(fieldInst,dataSrc);}});if($[G62](resolvedFields) && !ignoreUnknown){var l_=J9B;l_+=s0g;l_+=k3m;l_+=Y6L;Editor[u2r](l_,W7M);}return resolvedFields;};var _dtCellSelector=function(out,dt,identifier,allFields,idFn,forceFields){if(forceFields === void s87){forceFields=m3D;}p5T.Z7s();var cells=dt[l9d](identifier);cells[s4T]()[g1o](function(idx){var a1c="attachFie";var i1z="ixe";var c_G="count";var a2w="displayFie";var W4l="Fields";var P_L="mn";var z59="ey";var F$j="dNod";var x6v="fixe";var E7g="attac";var r1=G5_;r1+=z59;r1+=y0a;var p5=y4O;p5+=h5P;var Z7=O7a;Z7+=S$W;Z7+=O8W;Z7+=P_L;var w3=I5g;w3+=J_L;var U4=Z5WrO.K_g;U4+=i3S;var cell=dt[U4](idx);var row=dt[U0D](idx[w3]);var data=row[g6F]();var idSrc=idFn(data);var fields=forceFields || _dtFieldsFromIdx(dt,allFields,idx[Z7],cells[c_G]() > q31);p5T.Z7s();var isNode=typeof identifier === Z5WrO.k12 && identifier[p5] || identifier instanceof $;var prevDisplayFields;var prevAttach;var prevAttachFields;if(Object[r1](fields)[f6V]){var u4=l4D;u4+=h8w;u4+=G5q;var U6=p6L;U6+=N2K;U6+=Z5WrO.t9K;U6+=m5K;var B6=x6v;B6+=F$j;B6+=Z5WrO.t9K;var N2=Z5WrO[713];N2+=i1z;N2+=Z5WrO[293400];N2+=S9R;var s_=i9O;s_+=y0a;s_+=C_d;var k_=a1c;k_+=G5q;var r4=Z_8;r4+=W4l;if(out[idSrc]){var o9=a2w;o9+=w$q;o9+=y0a;var B3=E7g;B3+=C_d;prevAttach=out[idSrc][B3];prevAttachFields=out[idSrc][R4b];prevDisplayFields=out[idSrc][o9];}_dtRowSelector(out,dt,idx[U0D],allFields,idFn);out[idSrc][r4]=prevAttachFields || [];out[idSrc][k_][s_](Object[h_i](fields));out[idSrc][Z_8]=prevAttach || [];out[idSrc][Z_8][I59](isNode?$(identifier)[h7H](s87):cell[N2]?cell[B6]():cell[y4O]());out[idSrc][L5N]=prevDisplayFields || ({});$[U6](out[idSrc][u4],fields);}});};var _dtColumnSelector=function(out,dt,identifier,fields,idFn){var G9=Z5WrO.t9K;G9+=Z5WrO.L$5;p5T.Z7s();G9+=v67;var Q0=w8H;Q0+=S$W;Q0+=S$W;Q0+=y0a;dt[Q0](m3D,identifier)[s4T]()[G9](function(idx){_dtCellSelector(out,dt,idx,fields,idFn);});};var dataSource$1={commit:function(action,identifier,data,store){var H0I="earchB";var F2I="hPanes";var A49="reb";var c8Q="reca";var R3y="searchPanes";var P1c="sponsive";var g4M="uild";var B5I="uil";var r_N="bui";var Z2_="searchBuilder";p5T.Q1A();var h2x="sponsiv";var Q6d="fu";var Z9D="getDetails";var T75="searc";var T0X="unct";var w8R="nc";var W7S="wId";var W$X="uildP";var u7I="eb";var f1H="wIds";var g0D="awType";var F0l="oFeatu";var l$=D6n;l$+=o$V;var Y_=V_A;Y_+=g0D;var O5=I5g;O5+=f1H;var f5=Z5WrO.t9K;f5+=Z5WrO[293400];f5+=m9y;f5+=N2K;var H8=I5g;H8+=W7S;H8+=y0a;var T0=T03;T0+=i0R;var J_=F0l;J_+=z0g;J_+=y0a;var that=this;var dt=_dtApi(this[y0a][f3z]);var ssp=dt[T73]()[s87][J_][T0];var ids=store[H8];if(!_dtIsSsp(dt,this) && action === f5 && store[O5][f6V]){var Y$=u_4;Y$+=B2f;Y$+=v4y;var row=void s87;var compare=function(id){p5T.Z7s();return function(rowIdx,rowData,rowNode){var W0Q="cal";var x$=W0Q;x$+=S$W;return id == dataSource$1[s2P][x$](that,rowData);};};for(var i=s87,ien=ids[Y$];i < ien;i++){var P$=Z5WrO.L$5;P$+=Z5WrO.S9O;P$+=Z5WrO.x6j;try{var o$=o4O;o$+=j4R;row=dt[o$](safeQueryId(ids[i]));}catch(e){row=dt;}if(!row[P$]()){row=dt[U0D](compare(ids[i]));}if(row[u5A]() && !ssp){row[Z$f]();}}}var drawType=this[y0a][V3R][Y_];if(drawType !== l$){var V8=Z5WrO[713];V8+=T0X;V8+=m9y;V8+=c2S;var R9=o4O;R9+=u7I;R9+=B5I;R9+=Z5WrO[293400];var g7=y0a;g7+=H0I;g7+=g4M;g7+=Z5WrO.i5Y;var d9=Q6d;d9+=w8R;d9+=y5e;var D6=T75;D6+=F2I;var B1=z0g;B1+=P1c;var I8=Z5WrO[293400];I8+=o4O;I8+=Z5WrO.L$5;I8+=J_L;var P7=S$W;P7+=Z5WrO.t9K;P7+=B2f;P7+=v4y;var dtAny=dt;if(ssp && ids && ids[P7]){var z1=f49;z1+=o$V;dt[z1](j2j,function(){var J3=u_4;J3+=Z5WrO.S9O;J3+=k$T;J3+=v4y;for(var i=s87,ien=ids[J3];i < ien;i++){var c4=Y4d;c4+=Z5WrO.x6j;var I6=o4O;I6+=j4R;var row=dt[I6](safeQueryId(ids[i]));if(row[c4]()){var r8=D6n;r8+=j4$;_dtHighlight(row[r8]());}}});}dt[I8](drawType);if(dtAny[B1]){var b6=c8Q;b6+=S$W;b6+=Z5WrO.K_g;var O0=o4O;O0+=Z5WrO.t9K;O0+=h2x;O0+=Z5WrO.t9K;dtAny[O0][b6]();}if(typeof dtAny[D6] === d9 && !ssp){var b4=A49;b4+=W$X;b4+=Z5WrO.L$5;b4+=o$V;dtAny[R3y][b4](undefined,V0I);}if(dtAny[Z2_] !== undefined && typeof dtAny[g7][R9] === V8 && !ssp){var W0=o4O;W0+=Z5WrO.t9K;W0+=r_N;W0+=w$q;dtAny[Z2_][W0](dtAny[Z2_][Z9D]());}}},create:function(fields,data){var dt=_dtApi(this[y0a][f3z]);p5T.Q1A();if(!_dtIsSsp(dt,this)){var m_=J3_;m_+=Z5WrO[293400];var row=dt[U0D][m_](data);_dtHighlight(row[y4O]());}},edit:function(identifier,fields,data,store){var p24="rawType";var q0q="inArra";var o8e="Ids";var I1=Z5WrO[293400];I1+=p24;var A6=N2K;p5T.Q1A();A6+=Z5WrO.L$5;A6+=x1A;A6+=Z5WrO.t9K;var that=this;var dt=_dtApi(this[y0a][A6]);if(!_dtIsSsp(dt,this) || this[y0a][V3R][I1] === V67){var e7=Z5WrO.L$5;e7+=Z5WrO.S9O;e7+=Z5WrO.x6j;var y4=m9y;y4+=Z5WrO[293400];var rowId_1=dataSource$1[y4][R5q](this,data);var row=void s87;try{var V2=o4O;V2+=f49;V2+=J_L;row=dt[V2](safeQueryId(rowId_1));}catch(e){row=dt;}if(!row[e7]()){row=dt[U0D](function(rowIdx,rowData,rowNode){p5T.Z7s();var s$=o5d;s$+=S7y;return rowId_1 == dataSource$1[s2P][s$](that,rowData);});}if(row[u5A]()){var u0=I5s;u0+=m9y;u0+=Z5WrO.K_g;u0+=Z5WrO.t9K;var t9=o4O;t9+=f49;t9+=J_L;t9+=o8e;var k0=q0q;k0+=Z5WrO.x6j;var C4=t44;C4+=m_3;var H9=t44;H9+=m_3;var toSave=extendDeepObjShallowArr({},row[H9]());toSave=extendDeepObjShallowArr(toSave,data);row[C4](toSave);var idx=$[k0](rowId_1,store[J22]);store[t9][u0](idx,q31);}else {var v4=Z5WrO.L$5;v4+=J_H;var c7=o4O;c7+=j4R;row=dt[c7][v4](data);}_dtHighlight(row[y4O]());}},fakeRow:function(insertPoint){var u34="col";var J6m="sCla";var J0M="teInline";var y_E="w.dte-";var L7s="dra";var F5$="crea";var E_l="ass=\"dte-inlineAdd\">";var i6I="addC";var N$x="sett";var I7D="Column";var k1W="<tr cl";var M_0=':visible';var K5n="sible";var u0G=":vi";var U8k="__dtFakeRow";var d$l="umns";var g4=L7s;g4+=y_E;g4+=F5$;g4+=J0M;var U_=f49;U_+=Z5WrO.S9O;var L5=O7a;L5+=O8W;L5+=A$P;var p0=u0G;p0+=K5n;var h0=u34;h0+=d$l;var T8=K7Q;T8+=B1Y;var W$=k1W;W$+=E_l;var w0=N2K;w0+=s0w;w0+=S$W;w0+=Z5WrO.t9K;var dt=_dtApi(this[y0a][w0]);var tr=$(W$);var attachFields=[];var attach=[];var displayFields={};var tbody=dt[f3z](undefined)[T8]();for(var i=s87,ien=dt[h0](p0)[L5]();i < ien;i++){var O2=G5_;O2+=Z5WrO.t9K;O2+=Z5WrO.x6j;O2+=y0a;var T3=J6m;T3+=y0a;T3+=y0a;var N4=Z5WrO.L$5;N4+=f49;N4+=I7D;N4+=y0a;var X0=N$x;X0+=x_9;X0+=k$T;X0+=y0a;var u5=p0i;u5+=u0S;u5+=y0a;var z$=K5V;z$+=N2K;z$+=Z5WrO[293400];z$+=o7D;var V0=u$N;V0+=Z5WrO.w$8;var visIdx=dt[a6F](i + M_0)[V0]();var td=$(z$)[Z4v](tr);var fields=_dtFieldsFromIdx(dt,this[y0a][u5],visIdx,V0I);var settings=dt[X0]()[s87];var className=settings[N4][visIdx][T3];if(className){var b0=i6I;b0+=j$o;td[b0](className);}if(Object[O2](fields)[f6V]){var c6=W__;c6+=O8W;c6+=l3G;attachFields[I59](Object[h_i](fields));attach[c6](td[s87]);$[D3A](displayFields,fields);}}var append=function(){var y9l="prepen";var J4Z="recordsDisplay";var c88='end';var M_=y9l;M_+=o$F;var H_=p96;H_+=W__;H_+=y7w;H_+=o$F;if(dt[F7I][f6e]()[J4Z] === s87){$(tbody)[g0K]();}var action=insertPoint === c88?H_:M_;tr[action](tbody);};this[U8k]=tr;append();dt[U_](g4,function(){append();});return {0:{attach:attach,attachFields:attachFields,displayFields:displayFields,fields:this[y0a][O2h],type:N1c}};},fakeRowEnd:function(){var s7B="recor";var P6Q="__dtFakeRo";var p6O="Display";var r18="aw.dt";var W1g="R";var D0P="__dtFak";var k7b="e-createInlin";var O6=s7B;O6+=v4L;O6+=p6O;var O4=D0P;O4+=Z5WrO.t9K;O4+=W1g;O4+=j4R;var C7=z0g;C7+=y9Z;C7+=S8V;var B$=P6Q;B$+=J_L;var j4=V_A;j4+=r18;j4+=k7b;j4+=Z5WrO.t9K;var a0=f49;a0+=T8P;var e2=m_3;e2+=Z5WrO[156815];e2+=u_4;var dt=_dtApi(this[y0a][e2]);dt[a0](j4);this[B$][C7]();this[O4]=m3D;if(dt[F7I][f6e]()[O6] === s87){dt[j$c](f_Y);}},fields:function(identifier){var X9p="ls";var P3g="lum";var w4h="columns";var r3=Z5WrO.K_g;r3+=P2A;r3+=l3k;r3+=t$u;var D2=o4O;D2+=f49;D2+=J_L;D2+=y0a;var F6=z_2;F6+=G5q;var u7=m9y;u7+=Z5WrO[293400];u7+=B1a;u7+=Z5WrO.K_g;var idFn=dataGet(this[y0a][u7]);var dt=_dtApi(this[y0a][f3z]);var fields=this[y0a][F6];var out={};if($[A5B](identifier) && (identifier[D2] !== undefined || identifier[r3] !== undefined || identifier[l9d] !== undefined)){var P_=Z5WrO.K_g;P_+=t9I;P_+=X9p;var Y6=O7a;Y6+=P3g;Y6+=t$u;var M7=o4O;M7+=f49;M7+=J_L;M7+=y0a;if(identifier[M7] !== undefined){var y9=I5g;y9+=S_D;_dtRowSelector(out,dt,identifier[y9],fields,idFn);}if(identifier[Y6] !== undefined){_dtColumnSelector(out,dt,identifier[w4h],fields,idFn);}if(identifier[P_] !== undefined){var t2=Z5WrO.K_g;t2+=i3S;t2+=y0a;_dtCellSelector(out,dt,identifier[t2],fields,idFn);}}else {_dtRowSelector(out,dt,identifier,fields,idFn);}return out;},id:function(data){p5T.Z7s();var q6=s2P;q6+=B1a;q6+=Z5WrO.K_g;var idFn=dataGet(this[y0a][q6]);return idFn(data);},individual:function(identifier,fieldNames){var W_I="isAr";var idFn=dataGet(this[y0a][p6n]);var dt=_dtApi(this[y0a][f3z]);var fields=this[y0a][O2h];var out={};var forceFields;if(fieldNames){var D3=W_I;D3+=o2v;if(!Array[D3](fieldNames)){fieldNames=[fieldNames];}forceFields={};$[g1o](fieldNames,function(i,name){forceFields[name]=fields[name];});}p5T.Z7s();_dtCellSelector(out,dt,identifier,fields,idFn,forceFields);return out;},prep:function(action,identifier,submit,json,store){var w4A="lled";var V7h="cancell";var G0v="cance";var j1R="cancelled";var o5=Z5WrO.t9K;o5+=Z5WrO[293400];o5+=P4S;var J$=M_y;J$+=Z5WrO.t9K;var _this=this;if(action === J$){var X$=y9Z;X$+=Z5WrO.L$5;X$+=W__;store[J22]=$[X$](json[g6F],function(row){var M4=m9y;M4+=Z5WrO[293400];return dataSource$1[M4][R5q](_this,row);});}if(action === o5){var B2=Z5WrO[293400];B2+=Z5WrO.L$5;B2+=N2K;B2+=Z5WrO.L$5;var cancelled_1=json[j1R] || [];store[J22]=$[w1F](submit[B2],function(val,key){var p2t="inA";var i8=p2t;i8+=Y8C;return !$[G62](submit[g6F][key]) && $[i8](key,cancelled_1) === -q31?key:undefined;});}else if(action === X1n){var S7=G0v;S7+=w4A;var I2=V7h;I2+=Y57;store[I2]=json[S7] || [];}},refresh:function(){var N9N="reload";var dt=_dtApi(this[y0a][f3z]);dt[V$_][N9N](m3D,f_Y);},remove:function(identifier,fields,store){var u8f="cancel";var K9=u8f;K9+=L_b;var j1=x0N;j1+=u_4;var that=this;var dt=_dtApi(this[y0a][j1]);var cancelled=store[K9];if(cancelled[f6V] === s87){var F5=I5g;F5+=J_L;F5+=y0a;dt[F5](identifier)[Z$f]();}else {var K$=N6$;K$+=f49;K$+=b9F;var N$=r7C;N$+=Z5WrO.t9K;N$+=o4O;N$+=Z5WrO.x6j;var indexes_1=[];dt[C$$](identifier)[N$](function(){p5T.Q1A();var M9=Z5WrO[293400];M9+=G1P;M9+=Z5WrO.L$5;var w$=Z5WrO.K_g;w$+=Z5WrO.L$5;w$+=S$W;w$+=S$W;var id=dataSource$1[s2P][w$](that,this[M9]());if($[H7Y](id,cancelled) === -q31){var Y8=W__;Y8+=O8W;Y8+=y0a;Y8+=C_d;indexes_1[Y8](this[L6p]());}});dt[C$$](indexes_1)[K$]();}}};function _htmlId(identifier){var g2m='[data-editor-id="';var Z1h='Could not find an element with `data-editor-id` or `id` of: ';var I9=S$W;p5T.Q1A();I9+=y7w;I9+=q0v;I9+=C_d;var P6=u_4;P6+=L2p;P6+=C_d;if(identifier === I5L){return $(document);}var specific=$(g2m + identifier + x81);if(specific[P6] === s87){specific=typeof identifier === Z5m?$(safeQueryId(identifier)):$(identifier);}if(specific[I9] === s87){throw new Error(Z1h + identifier);}return specific;}function _htmlEl(identifier,name){var S1p="ld=\"";var v5X="-fie";var r7b="[data-edi";var l2=m8V;l2+=w6H;var R5=r7b;R5+=n0S;R5+=v5X;R5+=S1p;var context=_htmlId(identifier);return $(R5 + name + l2,context);}function _htmlEls(identifier,names){var L6=S$W;L6+=Z5WrO.t9K;L6+=L2p;L6+=C_d;var out=$();for(var i=s87,ien=names[L6];i < ien;i++){out=out[C_E](_htmlEl(identifier,names[i]));}return out;}function _htmlGet(identifier,dataSrc){var M66="data-e";var L6D="[data-editor-v";var r0_="htm";var o1m="alue]";var y3v="ilte";var t$7="ditor-value";var c_=r0_;c_+=S$W;var U5=M66;U5+=t$7;var v8=S$W;v8+=Z5WrO.t9K;v8+=Z5WrO.S9O;v8+=V47;var Q$=L6D;Q$+=o1m;var k7=Z5WrO[713];k7+=y3v;k7+=o4O;var el=_htmlEl(identifier,dataSrc);return el[k7](Q$)[v8]?el[c9F](U5):el[c_]();}function _htmlSet(identifier,fields,data){p5T.Z7s();$[g1o](fields,function(name,field){var e3n="filt";var n1O='data-editor-value';var K57='[data-editor-value]';var a7_="dataSrc";p5T.Q1A();var s_2="valFromData";var val=field[s_2](data);if(val !== undefined){var n7=e3n;n7+=Z5WrO.i5Y;var el=_htmlEl(identifier,field[a7_]());if(el[n7](K57)[f6V]){var j0=Z5WrO.L$5;j0+=N2K;j0+=N2K;j0+=o4O;el[j0](n1O,val);}else {el[g1o](function(){var M0J="firstChild";var J5Z="ild";var z11="emoveC";var n9=K4U;n9+=v4y;while(this[a47][n9]){var h3=o4O;h3+=z11;h3+=C_d;h3+=J5Z;this[h3](this[M0J]);}})[f_u](val);}}});}var dataSource={create:function(fields,data){p5T.Z7s();if(data){var id=dataSource[s2P][R5q](this,data);try{var g_=u_4;g_+=b9K;if(_htmlId(id)[g_]){_htmlSet(id,fields,data);}}catch(e){}}},edit:function(identifier,fields,data){var e4=m9y;e4+=Z5WrO[293400];var id=dataSource[e4][R5q](this,data) || I5L;p5T.Q1A();_htmlSet(id,fields,data);},fields:function(identifier){var a_L="ess";var r8H="keyl";var m3=o4O;m3+=f49;m3+=J_L;var G$=p0i;G$+=Z5WrO.t9K;G$+=G5q;var C9=m9y;C9+=h_n;C9+=o4O;C9+=o2v;var out={};if(Array[C9](identifier)){for(var i=s87,ien=identifier[f6V];i < ien;i++){var res=dataSource[O2h][R5q](this,identifier[i]);out[identifier[i]]=res[identifier[i]];}return out;}var data={};var fields=this[y0a][G$];if(!identifier){var e1=r8H;e1+=a_L;identifier=e1;}$[g1o](fields,function(name,field){var C9R="valToData";var j8=Z5WrO[293400];j8+=y3x;j8+=B1a;j8+=Z5WrO.K_g;var val=_htmlGet(identifier,field[j8]());field[C9R](data,val === m3D?undefined:val);});out[identifier]={data:data,fields:fields,idSrc:identifier,node:document,type:m3};return out;},id:function(data){var U$z="dSr";var r$=m9y;r$+=U$z;p5T.Q1A();r$+=Z5WrO.K_g;var idFn=dataGet(this[y0a][r$]);return idFn(data);},individual:function(identifier,fieldNames){var O8Q='Cannot automatically determine field name from data source';var R5t="tor-id]";var k_D="[data";var P5R="Bac";var o6g="r-";var a_y="nodeName";var Y7f="-edi";var H02="addBack";var w0e='data-editor-field';var u6=V5y;u6+=v67;var x1=Z5WrO[713];x1+=r25;var E2=M15;E2+=k$T;E2+=v4y;var m5=g8e;m5+=Z5WrO.x6j;var attachEl;if(identifier instanceof $ || identifier[a_y]){var T4=p8v;T4+=f49;T4+=o6g;T4+=s2P;var Z4=k_D;Z4+=Y7f;Z4+=R5t;var N3=J3_;N3+=Z5WrO[293400];N3+=P5R;N3+=G5_;var K4=Z5WrO[713];K4+=Z5WrO.S9O;attachEl=identifier;if(!fieldNames){var x8=Z5WrO.L$5;x8+=O_V;x8+=o4O;fieldNames=[$(identifier)[x8](w0e)];}var back=$[K4][H02]?N3:T8Q;identifier=$(identifier)[j8R](Z4)[back]()[g6F](T4);}if(!identifier){var w9=l3R;w9+=Z5WrO.x6j;w9+=I__;w9+=y0a;identifier=w9;}if(fieldNames && !Array[m5](fieldNames)){fieldNames=[fieldNames];}if(!fieldNames || fieldNames[E2] === s87){throw new Error(O8Q);}var out=dataSource[x1][R5q](this,identifier);var fields=this[y0a][O2h];var forceFields={};$[u6](fieldNames,function(i,name){forceFields[name]=fields[name];});$[g1o](out,function(id,set){var E$e='cell';var x6c="layFie";var j7=r7G;j7+=x6c;j7+=S$W;j7+=v4L;var a$=Z5WrO[713];a$+=m9y;a$+=Z5WrO.t9K;a$+=G5q;var V1=C_6;V1+=o4O;V1+=o4O;V1+=k_W;var r7=G1P;r7+=N2K;r7+=t33;r7+=C_d;set[C7b]=E$e;set[R4b]=[fieldNames];set[r7]=attachEl?$(attachEl):_htmlEls(identifier,fieldNames)[V1]();set[a$]=fields;set[j7]=forceFields;});return out;},initField:function(cfg){var l5o='[data-editor-label="';var w6=S$W;w6+=G0V;w6+=v4y;var j5=m8V;j5+=w6H;var a1=Z5WrO.S9O;a1+=Z5WrO.L$5;a1+=x$8;var label=$(l5o + (cfg[g6F] || cfg[a1]) + j5);if(!cfg[I2Z] && label[w6]){var h$=C_d;h$+=t8m;h$+=S$W;cfg[I2Z]=label[h$]();}},remove:function(identifier,fields){p5T.Z7s();if(identifier !== I5L){_htmlId(identifier)[Z$f]();}}};var classNames={actions:{create:Q3t,edit:S2,remove:j7I},body:{content:G$N,wrapper:Z7d},bubble:{bg:A1,close:q1i,liner:Z8,pointer:d$,table:U07,wrapper:w4P},field:{'disabled':g3,'error':A2,'input':n0,'inputControl':z9,'label':K_,'msg-error':m1,'msg-info':M6,'msg-label':j_,'msg-message':K0,'multiInfo':I4,'multiNoEdit':s1,'multiRestore':c8,'multiValue':g3r,'namePrefix':T5i,'processing':V1x,'typePrefix':i0,'wrapper':C8},footer:{content:i8q,wrapper:l6},form:{button:P5,buttonSubmit:Z6B,buttonInternal:b5,buttons:j2R,content:o4B,error:P0N,info:t3,tag:b_u,wrapper:r5},header:{content:a8,title:{tag:m3D,class:b_u},wrapper:u9u},inline:{buttons:T_,liner:n83,wrapper:Z$},processing:{active:R9Z,indicator:n$},wrapper:C3};var displayed$2=f_Y;var cssBackgroundOpacity=q31;var dom$1={background:$(I7)[s87],close:$(O9)[s87],content:m3D,wrapper:$(i4 + C0 + J8y + Z6)[s87]};function findAttachRow(editor,attach){var c72="hea";var o$T="eader";var Q2P="cti";var c3=Z5WrO.K_g;c3+=z0g;c3+=G1P;c3+=Z5WrO.t9K;var S5=Z5WrO.L$5;S5+=Q2P;S5+=f49;S5+=Z5WrO.S9O;var H4=c72;H4+=Z5WrO[293400];p5T.Z7s();var g0=m_3;g0+=x1A;g0+=Z5WrO.t9K;var dt=new $[Q2x][R61][H0n](editor[y0a][g0]);if(attach === H4){var X3=c72;X3+=Z5WrO[293400];X3+=Z5WrO.i5Y;var G_=z7W;G_+=Z5WrO.t9K;return dt[G_](undefined)[X3]();}else if(editor[y0a][S5] === c3){var E7=C_d;E7+=o$T;var F7=m_3;F7+=g6k;return dt[F7](undefined)[E7]();}else {var E3=D6n;E3+=Z5WrO[293400];E3+=Z5WrO.t9K;var m2=o4O;m2+=j4R;return dt[m2](editor[y0a][u$I])[E3]();}}function heightCalc$1(dte){var d33='div.DTE_Header';var E6C="rHeight";var X__="div.DTE_";var O45="outerHei";var X_R="ute";var u4O="heig";var b9a="wrapp";var a1Y="oote";var X0l="outerHeigh";var H8V="iv.DTE_F";var S5j="Body_Content";var L3b="Height";var X7F="max";var v9=f49;v9+=X_R;v9+=E6C;var S8=b9a;S8+=Z5WrO.i5Y;var m$=X7F;m$+=L3b;var U0=b9a;U0+=Z5WrO.t9K;U0+=o4O;var i7=X__;i7+=S5j;var V7=u4O;V7+=C_d;V7+=N2K;var S3=X0l;S3+=N2K;var z_=J_L;z_+=o4O;z_+=F00;p5T.Z7s();var M1=Z5WrO[293400];M1+=H8V;M1+=a1Y;M1+=o4O;var W9=O45;W9+=H_r;var header=$(d33,dom$1[i4u])[W9]();var footer=$(M1,dom$1[z_])[S3]();var maxHeight=$(window)[V7]() - envelope[l3O][Q00] * r2J - header - footer;$(i7,dom$1[U0])[Q8G](m$,maxHeight);return $(dte[E9e][S8])[v9]();}function hide$2(dte,callback){if(!callback){callback=function(){};}if(displayed$2){var f7=O7a;f7+=o4g;f7+=A$P;$(dom$1[f7])[i1v]({top:-(dom$1[q0W][R$_] + g11)},q6E,function(){var P0h="fa";var L8R="eOu";p5T.Q1A();var u4M="mal";var N_=Z5WrO.S9O;N_+=f49;N_+=o4O;N_+=u4M;var u9=P0h;u9+=Z5WrO[293400];u9+=L8R;u9+=N2K;$([dom$1[i4u],dom$1[d11]])[u9](N_,function(){var d5A="eta";var P8=Z5WrO[293400];P8+=d5A;P8+=v67;$(this)[P8]();callback();});});displayed$2=f_Y;}}function init$1(){var i48="aine";var A2V="kgr";var U7H="div.DTED_Envelo";var y7z="ontent";var B6F="pe_Cont";var d0=R4j;d0+=t33;d0+=m9y;d0+=F94;var Q8=Z5WrO.K_g;Q8+=y0a;Q8+=y0a;var X6=Z38;X6+=A2V;X6+=G1h;X6+=m5K;var V6=U7H;V6+=B6F;V6+=i48;V6+=o4O;var W_=Z5WrO.K_g;W_+=y7z;dom$1[W_]=$(V6,dom$1[i4u])[s87];cssBackgroundOpacity=$(dom$1[X6])[Q8](d0);}function show$2(dte,callback){var i39='normal';var X7u="marg";var Q_e="fadeIn";var v3m="cli";var g6C="velope";var x8h="offse";var F7u="_Envel";var r3n="DTED";var v0j="nten";var q0g='click.DTED_Envelope';var B47="roun";var i5E="opaci";var K_G="offset";var i7y="pper";var W9E="tWidth";var I7_="tyl";var X$P="opacity";var N2H="kground";var f3W='resize.DTED_Envelope';var e1X="backgro";var b_C=".DTED_En";var d7q='px';var S6H="ck.DTED_En";var L7m="height";var D4Y="inL";var g1F="ick";var m8w="animat";var D9v="click.";var X4D="click.DT";var h7A='0';var K46="backg";var C0X="_En";var D_=f49;D_+=Z5WrO.S9O;var b7=D9v;b7+=r3n;b7+=F7u;b7+=Z12;var q1=f49;q1+=Z5WrO.S9O;var e8=X4D;e8+=e6w;e8+=C0X;e8+=g6C;var R_=J_L;R_+=o4O;R_+=Z5WrO.L$5;R_+=i7y;var b$=v_k;b$+=g1F;b$+=b_C;b$+=g6C;var D1=f49;D1+=Z5WrO.S9O;var g6=K46;g6+=B47;g6+=Z5WrO[293400];var o6=v3m;o6+=S6H;o6+=g6C;var D5=f49;D5+=T8P;var d5=v_k;d5+=c5D;var U7=Z5WrO.K_g;U7+=c2S;U7+=i4$;var d7=K$Z;d7+=E0B;d7+=o4O;var W1=A7y;W1+=Z5WrO.t9K;W1+=m5K;var T6=p96;T6+=h7T;p5T.Q1A();T6+=m5K;var C$=Z5WrO[156815];C$+=f49;C$+=Z5WrO[293400];C$+=Z5WrO.x6j;if(!callback){callback=function(){};}$(C$)[T6](dom$1[d11])[W1](dom$1[d7]);dom$1[U7][I03][L7m]=F01;if(!displayed$2){var t0=m8w;t0+=Z5WrO.t9K;var V_=O7a;V_+=v0j;V_+=N2K;var F9=J_L;F9+=M7z;var F0=e1X;F0+=y0d;var Z1=Z5WrO[156815];Z1+=S$W;Z1+=o0q;Z1+=G5_;var T2=y0a;T2+=N2K;T2+=U5A;T2+=Z5WrO.t9K;var T9=Z38;T9+=N2H;var y$=i5E;y$+=N2K;y$+=Z5WrO.x6j;var V4=y0a;V4+=I7_;V4+=Z5WrO.t9K;var Z9=y2Z;Z9+=Z5WrO[293400];var H$=W__;H$+=Z5WrO.w$8;var A7=m4G;A7+=x0B;A7+=A$P;var S1=p_z;S1+=W__;var h6=X7u;h6+=D4Y;h6+=f5I;var c2=Y75;c2+=Z5WrO.x6j;c2+=S$W;c2+=Z5WrO.t9K;var p_=Z5WrO.S9O;p_+=f49;p_+=Z5WrO.S9O;p_+=Z5WrO.t9K;var J2=i$g;J2+=f1T;J2+=S$W;J2+=k_W;var n5=x8h;n5+=W9E;var d2=Z5WrO[156815];d2+=S$W;d2+=o0q;d2+=G5_;var I3=y0a;I3+=F94;I3+=u_4;var style=dom$1[i4u][I3];style[X$P]=h7A;style[l4D]=d2;var height=heightCalc$1(dte);var targetRow=findAttachRow(dte,envelope[l3O][Z_8]);var width=targetRow[n5];style[J2]=p_;style[X$P]=E0o;dom$1[i4u][c2][p3E]=width + d7q;dom$1[i4u][I03][h6]=-(width / r2J) + d7q;dom$1[i4u][I03][S1]=$(targetRow)[K_G]()[U$6] + targetRow[R$_] + d7q;dom$1[A7][I03][U$6]=-q31 * height - s70 + H$;dom$1[Z9][V4][y$]=h7A;dom$1[T9][T2][l4D]=Z1;$(dom$1[F0])[i1v]({opacity:cssBackgroundOpacity},i39);$(dom$1[F9])[Q_e]();$(dom$1[V_])[t0]({top:s87},q6E,callback);}$(dom$1[p52])[c9F](a5A,dte[U_5][d5])[D5](o6)[c2S](q0g,function(e){p5T.Q1A();dte[p52]();});$(dom$1[g6])[D6G](q0g)[D1](b$,function(e){var J3r="kgro";var G6=Z38;p5T.Z7s();G6+=J3r;G6+=y0d;dte[G6]();});$(T8A,dom$1[R_])[D6G](e8)[q1](b7,function(e){var Q8E="tent_Wrapper";var o2m="DTED_Envelope_C";var J4=o2m;p5T.Q1A();J4+=c2S;J4+=Q8E;if($(e[a6D])[h07](J4)){dte[d11]();}});$(window)[D6G](f3W)[D_](f3W,function(){heightCalc$1(dte);});displayed$2=V0I;}var envelope={close:function(dte,callback){p5T.Z7s();hide$2(dte,callback);},conf:{attach:w_,windowPadding:g11},destroy:function(dte){p5T.Z7s();hide$2();},init:function(dte){p5T.Z7s();init$1();return envelope;},node:function(dte){return dom$1[i4u][s87];},open:function(dte,append,callback){var I_3="appendChild";var v5=O7a;v5+=Z5WrO.S9O;v5+=i4$;var R3=m4G;R3+=N2K;R3+=y7w;R3+=N2K;$(dom$1[R3])[O6X]()[H5v]();dom$1[v5][I_3](append);dom$1[q0W][I_3](dom$1[p52]);show$2(dte,callback);}};function isMobile(){var a0o="defined";var i4J="outerWidth";var o_T=576;var T01="orientation";var x7=s$_;x7+=a0o;return typeof window[T01] !== x7 && window[i4J] <= o_T?V0I:f_Y;}var displayed$1=f_Y;var ready=f_Y;var scrollTop=s87;var dom={background:$(N_c),close:$(D7),content:m3D,wrapper:$(W6L + p16 + y6 + U2 + L7i + L7i + l7 + s7)};function heightCalc(){var I0_="outerHeight";var S5$='div.DTE_Body_Content';var G4$="axHeight";p5T.Z7s();var r8u=" - ";var u3v="0vh";var Z3d='px)';var r0y="maxHei";var X$v="lc(10";var i4l='div.DTE_Footer';var c8Z=".DTE_Header";var c1=Z5WrO[293400];c1+=m9y;c1+=D3P;c1+=c8Z;var headerFooter=$(c1,dom[i4u])[I0_]() + $(i4l,dom[i4u])[I0_]();if(isMobile()){var E6=o5d;E6+=X$v;E6+=u3v;E6+=r8u;var S4=r0y;S4+=H_r;var N9=Z5WrO.K_g;N9+=y0a;N9+=y0a;var H6=J_L;H6+=M$f;H6+=W__;H6+=Z5WrO.i5Y;$(S5$,dom[H6])[N9](S4,E6 + headerFooter + Z3d);}else {var M0=y9Z;M0+=G4$;var S0=q2W;S0+=y0a;var E5=h1o;E5+=a7S;E5+=o4O;var z6=Z5WrO.K_g;z6+=f49;z6+=Z5WrO.S9O;z6+=Z5WrO[713];var A5=S1Q;A5+=N2K;var maxHeight=$(window)[A5]() - self[z6][Q00] * r2J - headerFooter;$(S5$,dom[E5])[S0](M0,maxHeight);}}function hide$1(dte,callback){var b2U="lTo";var F4x="scro";var V_M="imate";var o6B="Ani";var A4=f49;A4+=Z5WrO[713];A4+=Z5WrO[713];var X9=o4A;X9+=Z5WrO.S9O;X9+=V_M;var N0=D6G;N0+=h1G;N0+=o6B;var B0=Z5WrO.K_g;B0+=f49;B0+=Z5WrO.S9O;B0+=Z5WrO[713];var x5=F4x;x5+=S$W;x5+=b2U;x5+=W__;var k2=Z5WrO[156815];k2+=f49;k2+=B1Y;if(!callback){callback=function(){};}$(k2)[x5](scrollTop);dte[b82](dom[i4u],{opacity:s87,top:self[B0][N0]},function(){var k$=j4$;k$+=A$g;k$+=C_d;$(this)[k$]();callback();});dte[X9](dom[d11],{opacity:s87},function(){p5T.Q1A();var w1=j4$;w1+=A$g;w1+=C_d;$(this)[w1]();});displayed$1=f_Y;$(window)[A4](O27);}function init(){var N4C='div.DTED_Lightbox_Content';var n9$="opacit";p5T.Z7s();var e5I="conten";var v7=n9$;v7+=Z5WrO.x6j;var y1=J_L;y1+=M7z;var K5=e5I;K5+=N2K;if(ready){return;}dom[K5]=$(N4C,dom[i4u]);dom[y1][Q8G](C3J,s87);dom[d11][Q8G](v7,s87);ready=V0I;}function show$1(dte,callback){var Z27="kgroun";var T3V="offsetAni";var k_x='click.DTED_Lightbox';var G8V="ba";var v6v="TED_Lightbox";var s3k="kgrou";var G8e='DTED_Lightbox_Mobile';var w5e="lick.D";var F1_="nf";var R0=f49;R0+=Z5WrO.S9O;var Z0=Z5WrO.K_g;Z0+=w5e;Z0+=v6v;var j9=e2T;j9+=Z5WrO[713];var q4=f49;q4+=Z5WrO.S9O;var L$=Z5WrO[156815];L$+=t33;L$+=Z27;L$+=Z5WrO[293400];var h9=Z3z;h9+=o70;var e_=V6z;e_+=i5_;e_+=Z5WrO.t9K;var j3=Z5WrO.L$5;j3+=g_r;var b_=Z5WrO.K_g;b_+=S$W;b_+=f49;b_+=F05;var y2=J_L;y2+=M$f;y2+=h7T;y2+=o4O;var Q2=G8V;Q2+=Z5WrO.K_g;Q2+=s3k;Q2+=m5K;var N7=Z5WrO[156815];N7+=f49;N7+=Z5WrO[293400];N7+=Z5WrO.x6j;if(isMobile()){$(L8c)[A_M](G8e);}$(N7)[j6E](dom[Q2])[j6E](dom[y2]);heightCalc();if(!displayed$1){var Q_=Z5WrO[156815];Q_+=f49;Q_+=Z5WrO[293400];Q_+=Z5WrO.x6j;var I0=f49;I0+=Z5WrO.S9O;var p1=F$W;p1+=h3I;p1+=Z5WrO.L$5;p1+=x0B;var m4=O7a;m4+=F1_;var f9=Z5WrO.L$5;f9+=O8W;f9+=N2K;f9+=f49;var V5=S1Q;V5+=N2K;var M5=Z5WrO.K_g;M5+=r5J;M5+=D9O;displayed$1=V0I;dom[M5][Q8G](V5,f9);dom[i4u][Q8G]({top:-self[m4][T3V]});dte[p1](dom[i4u],{opacity:q31,top:s87},callback);dte[b82](dom[d11],{opacity:q31});$(window)[I0](O27,function(){p5T.Q1A();heightCalc();});scrollTop=$(Q_)[y_d]();}p5T.Q1A();dom[b_][j3](e_,dte[h9][p52])[D6G](k_x)[c2S](k_x,function(e){dte[p52]();});dom[L$][D6G](k_x)[q4](k_x,function(e){var u_o="backgr";var I50="ound";var y7=u_o;y7+=I50;e[E$_]();dte[y7]();});$(T8A,dom[i4u])[j9](Z0)[R0](k_x,function(e){var u7l="TED_Lightbox_Content_Wrapp";var R8t="arge";var L3=L7L;L3+=u7l;L3+=Z5WrO.i5Y;var D0=N2K;D0+=R8t;D0+=N2K;if($(e[D0])[h07](L3)){var s5=y2Z;s5+=Z5WrO[293400];e[E$_]();dte[s5]();}});}var self={close:function(dte,callback){hide$1(dte,callback);},conf:{offsetAni:Z4x,windowPadding:Z4x},destroy:function(dte){p5T.Z7s();if(displayed$1){hide$1(dte);}},init:function(dte){init();p5T.Z7s();return self;},node:function(dte){return dom[i4u][s87];},open:function(dte,append,callback){var k4d="los";var N1x="dren";var b79="chi";var S6=Z5WrO.K_g;p5T.Q1A();S6+=k4d;S6+=Z5WrO.t9K;var h1=Z5WrO.L$5;h1+=W__;h1+=h7T;h1+=m5K;var E$=b79;E$+=S$W;E$+=N1x;var Y1=m4G;Y1+=i4$;var content=dom[Y1];content[E$]()[H5v]();content[h1](append)[j6E](dom[S6]);show$1(dte,callback);}};var DataTable$5=$[Q2x][R61];function add(cfg,after,reorder){var M4f="reverse";var E5q="taS";var e2I="sArra";var k5_='Error adding field \'';var v0Q="nArray";var K8g="ift";var L8H="field already exists with this name";var J7s='initField';var I$6="ditFiel";var I97="Error addi";var K9X=" The field requires a `name` option";var y7K="ng field.";var H1H="\'. A ";var g2=y9Z;g2+=L8X;var d4=z_2;d4+=w$q;var J9=X12;J9+=G2Z;J9+=S$W;J9+=Z5WrO[293400];var A0=x2l;A0+=E5q;A0+=P4f;var g8=p0i;g8+=Z5WrO.t9K;g8+=G5q;var X5=K71;X5+=y9Z;X5+=Z5WrO.t9K;var f6=m9y;f6+=e2I;f6+=Z5WrO.x6j;if(reorder === void s87){reorder=V0I;}if(Array[f6](cfg)){var l8=S$W;l8+=Z5WrO.t9K;l8+=b9K;if(after !== undefined){cfg[M4f]();}for(var _i=s87,cfg_1=cfg;_i < cfg_1[l8];_i++){var cfgDp=cfg_1[_i];this[C_E](cfgDp,after,f_Y);}this[s1O](this[i22]());return this;}var name=cfg[X5];if(name === undefined){var W3=I97;W3+=y7K;W3+=K9X;throw new Error(W3);}if(this[y0a][g8][name]){var f0=H1H;f0+=L8H;throw new Error(k5_ + name + f0);}this[A0](J7s,cfg);var editorField=new Editor[J9](cfg,this[t5b][d4],this);if(this[y0a][g2]){var j6=Z5WrO.t9K;j6+=I$6;j6+=Z5WrO[293400];j6+=y0a;var editFields=this[y0a][j6];editorField[y2U]();$[g1o](editFields,function(idSrc,editIn){var f$_="Set";var t1=Z5WrO[293400];t1+=Z5WrO.t9K;t1+=Z5WrO[713];var A8=r36;A8+=f$_;var value;if(editIn[g6F]){var Z5=O0o;Z5+=Z5WrO.L$5;var e0=S7V;e0+=T7s;e0+=L7L;e0+=y3x;value=editorField[e0](editIn[Z5]);}editorField[A8](idSrc,value !== undefined?value:editorField[t1]());});}this[y0a][O2h][name]=editorField;if(after === undefined){var R7=i9O;R7+=y0a;R7+=C_d;this[y0a][i22][R7](name);}else if(after === m3D){var o_=s$_;o_+=y0a;o_+=C_d;o_+=K8g;this[y0a][i22][o_](name);}else {var n8=L3p;n8+=Z5WrO[293400];n8+=Z5WrO.i5Y;var a5=f49;a5+=t_E;a5+=Z5WrO.i5Y;var A3=m9y;A3+=v0Q;var idx=$[A3](after,this[y0a][a5]);this[y0a][n8][J9l](idx + q31,s87,name);}if(reorder !== f_Y){this[s1O](this[i22]());}return this;}function ajax(newAjax){if(newAjax){this[y0a][V$_]=newAjax;return this;}return this[y0a][V$_];}function background(){var l8V="onBackground";var q3=V0O;q3+=m46;q3+=N2K;var b8=v_k;b8+=c5D;var s0=K1J;s0+=o4O;var onBackground=this[y0a][V3R][l8V];if(typeof onBackground === s8p){onBackground(this);}else if(onBackground === s0){var p3=x1A;p3+=Z69;this[p3]();}else if(onBackground === b8){var O1=Z5WrO.K_g;O1+=S$W;O1+=f49;O1+=F05;this[O1]();}else if(onBackground === q3){var P1=W72;P1+=z2Y;P1+=N2K;this[P1]();}return this;}function blur(){this[c$u]();return this;}function bubble(cells,fieldNames,showIn,opts){var E0c="bool";var F6i="taSource";var c$=x2l;c$+=F6i;var I5=p6L;I5+=x0B;I5+=m5K;var x9=I2N;x9+=j0X;var j2=E0c;j2+=V5y;j2+=Z5WrO.S9O;var _this=this;if(showIn === void s87){showIn=V0I;}var that=this;if(this[s3p](function(){p5T.Z7s();var i5=z6A;i5+=Z5WrO[156815];i5+=S$W;i5+=Z5WrO.t9K;that[i5](cells,fieldNames,opts);})){return this;}if($[A5B](fieldNames)){opts=fieldNames;fieldNames=undefined;showIn=V0I;}else if(typeof fieldNames === j2){showIn=fieldNames;fieldNames=undefined;opts=undefined;}if($[x9](showIn)){opts=showIn;showIn=V0I;}if(showIn === undefined){showIn=V0I;}opts=$[I5]({},this[y0a][U_v][u5Y],opts);var editFields=this[c$](i6X,cells,fieldNames);this[t5u](cells,editFields,s8M,opts,function(){var L9r="tta";var i00="<div ";var k6y="div cla";var b1V="\" titl";var h6B="lePosition";var n8U="appendT";var B4l="formInfo";var b8a="_preop";var P0q="ss=\"";var Q54="ildr";var f4G="lass=";var I8Q="_postopen";var h8F='resize.';var Y_J="ubb";var Q1X="bbl";var O40='<div class="DTE_Processing_Indicator"><span></div>';var q8b='"><div></div></div>';var a97="nca";var S11="_form";var B2W="pointer";var Z97=' scroll.';var j3V="class=\"";var r2=Z5WrO[156815];r2+=Y_J;r2+=h6B;var u_=v_k;u_+=m9y;u_+=Z5WrO.K_g;u_+=G5_;var i2=f49;i2+=Z5WrO.S9O;var X7=f49;X7+=Z5WrO.S9O;var m9=Z5WrO.L$5;m9+=Z5WrO[293400];m9+=Z5WrO[293400];var F_=m0C;F_+=p_z;F_+=t$u;var t6=N2K;t6+=P4S;t6+=S$W;t6+=Z5WrO.t9K;var S$=P5F;S$+=y0a;S$+=Z5WrO.L$5;S$+=l_8;var G1=Z5WrO[713];G1+=f49;G1+=o4O;G1+=y9Z;var f_=Z5WrO[293400];f_+=f49;f_+=y9Z;var N1=v67;N1+=Q54;N1+=Z5WrO.t9K;N1+=Z5WrO.S9O;var Z3=Z5WrO.t9K;Z3+=I9m;var q5=i00;q5+=j3V;var G2=Z5WrO.K_g;G2+=m_1;var r0=b1V;r0+=p7j;var A_=K5V;A_+=k6y;A_+=P0q;var T1=m8V;T1+=o7D;var K2=m_3;K2+=Z5WrO[156815];K2+=u_4;var N8=J5i;N8+=f4G;N8+=m8V;var h2=m8V;h2+=o7D;var L0=s2h;L0+=D3l;var q2=m8V;q2+=o7D;var S9=Z5WrO[156815];S9+=k$T;var H0=Z5WrO[156815];H0+=O8W;H0+=Q1X;H0+=Z5WrO.t9K;var L8=Z5WrO.L$5;L8+=L9r;L8+=v67;var s8=Z5WrO.K_g;s8+=f49;s8+=a97;s8+=N2K;var t_=f49;t_+=Z5WrO.S9O;var o0=b8a;o0+=y7w;var C6=S11;C6+=h65;C6+=Z5WrO[626711];C6+=y0a;var namespace=_this[C6](opts);var ret=_this[o0](s8M);if(!ret){return _this;}$(window)[t_](h8F + namespace + Z97 + namespace,function(){var V8u="ubbl";p5T.Q1A();var O0R="ePosition";var V$=Z5WrO[156815];V$+=V8u;V$+=O0R;_this[V$]();});var nodes=[];_this[y0a][C9n]=nodes[s8][n5i](nodes,pluck(editFields,L8));var classes=_this[t5b][H0];var backgroundNode=$(D$9 + classes[S9] + q8b);var container=$(D$9 + classes[i4u] + q2 + D$9 + classes[L0] + h2 + N8 + classes[K2] + T1 + A_ + classes[p52] + r0 + _this[U_5][G2] + J8g + O40 + L7i + L7i + q5 + classes[B2W] + J8g + L7i);if(showIn){var l9=Z5WrO[156815];l9+=f49;l9+=B1Y;var J5=n8U;J5+=f49;container[Z4v](L8c);backgroundNode[J5](l9);}var liner=container[O6X]()[Z3](s87);var tableNode=liner[N1]();var closeNode=tableNode[O6X]();liner[j6E](_this[f_][i1m]);tableNode[X6o](_this[E9e][G1]);if(opts[S$]){var u1=Z5WrO[293400];u1+=f49;u1+=y9Z;liner[X6o](_this[u1][B4l]);}if(opts[t6]){var u2=W__;u2+=M06;u2+=Z5WrO.t9K;u2+=m5K;liner[u2](_this[E9e][W$T]);}if(opts[F_]){var i3=i8P;i3+=t$u;var Z2=Z5WrO[293400];Z2+=f49;Z2+=y9Z;tableNode[j6E](_this[Z2][i3]);}var finish=function(){var M2=Z5WrO[156815];M2+=O8W;M2+=Q1X;M2+=Z5WrO.t9K;var U9=w_V;U9+=F05;p5T.Z7s();U9+=Z5WrO[293400];_this[w$W]();_this[a5N](U9,[M2]);};var pair=$()[m9](container)[C_E](backgroundNode);_this[p0C](function(submitComplete){p5T.Q1A();_this[b82](pair,{opacity:s87},function(){if(this === container[s87]){var W6=f49;W6+=Z5WrO[713];W6+=Z5WrO[713];var f2=Z5WrO[293400];f2+=Z5WrO.t9K;f2+=A$g;f2+=C_d;pair[f2]();$(window)[W6](h8F + namespace + Z97 + namespace);finish();}});});backgroundNode[X7](i5v,function(){var Y3=Z5WrO[156815];Y3+=S$W;Y3+=Z69;_this[Y3]();});closeNode[i2](u_,function(){var h5=F$W;h5+=v_k;h5+=L5Y;h5+=Z5WrO.t9K;p5T.Q1A();_this[h5]();});_this[r2]();_this[I8Q](s8M,f_Y);var opened=function(){var g9e="udeFields";var x2=Z12;x2+=o$V;x2+=Z5WrO[293400];var Y4=e2b;Y4+=g9e;p5T.Z7s();_this[v0F](_this[y0a][Y4],opts[D9n]);_this[a5N](x2,[s8M,_this[y0a][G6b]]);};_this[b82](pair,{opacity:q31},function(){p5T.Q1A();if(this === container[s87]){opened();}});});return this;}function bubbleLocation(location){var q6K="ubbleL";var s19="ocat";var k0U="bleLocation";var h3i="ubble";var z8a="Posi";var R1=Z5WrO[156815];R1+=h3i;R1+=z8a;R1+=y5e;var L1=Z5WrO[156815];L1+=q6K;L1+=s19;L1+=Z5WrO[626711];if(!location){var p4=z6A;p4+=k0U;return this[y0a][p4];}this[y0a][L1]=location;this[R1]();return this;}function bubblePosition(){var N5h="ttom";var h97="right";var L1C="togg";var M2u="bottom";var v5A="erHeight";var M04="Wid";var T6M="bubbleBottom";var t8S="bot";var z0A='bottom';var E7m="innerHeight";var r$B="leBottom";var R00="tom";var F4q='top';var r05="uter";var T3h="left";var E5I="div.DTE_Bubble_Li";var A05="low";var b6b="lef";var q3o="DTE_Bubble";var R_K="out";var J4g="leClass";var m0T="addCl";var D4P="siti";var u2I='below';var q$V="bott";var i_=e4a;i_+=f49;var k8=W__;k8+=f49;k8+=D4P;k8+=c2S;var W4=t8S;W4+=R00;var z5=Q7d;z5+=f49;z5+=J_L;var j$=L1C;j$+=J4g;var a7=q$V;a7+=f49;a7+=y9Z;var b1=K7Q;b1+=N5h;var U3=Z5WrO.K_g;U3+=y0a;U3+=y0a;var R2=R_K;R2+=v5A;var T7=f49;T7+=r05;T7+=M04;T7+=v4y;var Y2=N2K;Y2+=f49;Y2+=W__;var a2=K4U;a2+=N2K;a2+=C_d;var y5=t8S;y5+=R00;var K3=K4U;K3+=v4y;var E1=u_4;E1+=Z5WrO[713];E1+=N2K;var w5=S$W;w5+=G0V;w5+=N2K;w5+=C_d;var Y5=p_z;Y5+=W__;var H2=E5I;H2+=D3l;var G7=G5r;G7+=W5L;G7+=q3o;var wrapper=$(G7);var liner=$(H2);var nodes=this[y0a][C9n];var position={bottom:s87,left:s87,right:s87,top:s87};$[g1o](nodes,function(i,nodeIn){var p5M="ft";var b6$="fse";var C6H="ffsetWidth";var r_=f49;r_+=C6H;var N5=S$W;N5+=f5I;var x3=o4O;x3+=m9y;x3+=N0d;x3+=N2K;var f1=S$W;f1+=Z5WrO.t9K;f1+=Z5WrO[713];f1+=N2K;var o8=S$W;o8+=Z5WrO.t9K;o8+=p5M;var W5=k$T;p5T.Q1A();W5+=Z5WrO.t9K;W5+=N2K;var v2=e2T;v2+=b6$;v2+=N2K;var pos=$(nodeIn)[v2]();nodeIn=$(nodeIn)[W5](s87);position[U$6]+=pos[U$6];position[o8]+=pos[f1];position[x3]+=pos[N5] + nodeIn[r_];position[M2u]+=pos[U$6] + nodeIn[R$_];});position[Y5]/=nodes[w5];position[E1]/=nodes[K3];position[h97]/=nodes[f6V];position[y5]/=nodes[a2];var top=position[Y2];var left=(position[T3h] + position[h97]) / r2J;var width=liner[T7]();var height=liner[R2]();var visLeft=left - width / r2J;var visRight=visLeft + width;var docWidth=$(window)[p3E]();var viewportTop=$(window)[y_d]();var padding=c0K;var location=this[y0a][Y$S];var initial=location !== F01?location:this[y0a][T6M]?z0A:F4q;wrapper[U3]({left:left,top:initial === b1?position[a7]:top})[j$](z5,initial === W4);var curPosition=wrapper[k8]();if(location === i_){var C1=N2K;C1+=f49;C1+=W__;var Q1=u_4;Q1+=Z5WrO.S9O;Q1+=q0v;Q1+=C_d;if(liner[Q1] && curPosition[U$6] + height > viewportTop + window[E7m]){var q7=q86;q7+=b5z;q7+=r$B;var a4=Z5WrO.K_g;a4+=y0a;a4+=y0a;wrapper[a4](F4q,top)[n44](u2I);this[y0a][q7]=f_Y;}else if(liner[f6V] && curPosition[C1] - height < viewportTop){var n3=C5e;n3+=A05;var n_=m0T;n_+=Z5WrO.L$5;n_+=y0a;n_+=y0a;var K1=q2W;K1+=y0a;wrapper[K1](F4q,position[M2u])[n_](n3);this[y0a][T6M]=V0I;}}if(visRight + padding > docWidth){var B5=u_4;B5+=Z5WrO[713];B5+=N2K;var diff=visRight - docWidth;liner[Q8G](B5,visLeft < padding?-(visLeft - padding):-(diff + padding));}else {var y0=b6b;y0+=N2K;var F8=Z5WrO.K_g;F8+=y0a;F8+=y0a;liner[F8](y0,visLeft < padding?-(visLeft - padding):s87);}return this;}function buttons(buttonsIn){var n3o="buttonSubmit";var E5A="bas";var M$=V1M;M$+=f49;M$+=Z5WrO.S9O;M$+=y0a;var B9=F$W;B9+=E5A;B9+=m9y;B9+=Z5WrO.K_g;var _this=this;if(buttonsIn === B9){var w2=q8F;w2+=m9y;w2+=N2K;var o7=Z3z;o7+=o70;buttonsIn=[{action:function(){var J8T="ub";var l4=y0a;l4+=J8T;l4+=p4W;this[l4]();},text:this[o7][this[y0a][G6b]][w2],className:this[t5b][g61][n3o]}];}else if(!Array[z4s](buttonsIn)){buttonsIn=[buttonsIn];}$(this[E9e][M$])[g0K]();$[g1o](buttonsIn,function(i,btn){var x6J="classNam";var L8f="tabIndex";var O7l="ypre";var J$u="bindex";var t7G="tabI";var X_3="ncti";var o8z="dex";var O4t="assNam";var q0r="on></b";var x8t="utton>";var q1q="<butt";var g1=Z5WrO[293400];g1+=Y72;var y_=a7S;y_+=Z5WrO.S9O;y_+=o$F;var x6=l3R;x6+=O7l;x6+=y0a;x6+=y0a;var N6=G5_;N6+=Z5WrO.t9K;p5T.Q1A();N6+=Z5WrO.x6j;N6+=H60;var E4=t7G;E4+=Z5WrO.S9O;E4+=o8z;var J8=N2K;J8+=Z5WrO.L$5;J8+=J$u;var D9=Z5WrO.L$5;D9+=g_r;var c0=Z5WrO[713];c0+=O8W;c0+=X_3;c0+=c2S;var R6=C_d;R6+=N2K;R6+=y9Z;R6+=S$W;var O7=v_k;O7+=O4t;O7+=Z5WrO.t9K;var X4=x6J;X4+=Z5WrO.t9K;var O8=q1q;O8+=q0r;O8+=x8t;var f3=l_$;f3+=Z5WrO[626711];var Q9=y0a;Q9+=N$5;Q9+=Z5WrO.S9O;Q9+=k$T;if(typeof btn === Q9){var c9=W88;c9+=p5s;btn={action:function(){p5T.Z7s();var e9=W72;e9+=Z5WrO[156815];e9+=p4W;this[e9]();},text:btn,className:_this[c9][g61][n3o]};}var text=btn[V0i] || btn[I2Z];var action=btn[f3] || btn[Q2x];var attr=btn[c9F] || ({});$(O8,{class:_this[t5b][g61][p14] + (btn[X4]?f9f + btn[O7]:b_u)})[R6](typeof text === c0?text(_this):text || b_u)[D9](J8,btn[L8f] !== undefined?btn[E4]:s87)[c9F](attr)[c2S](N6,function(e){if(e[P$B] === T7E && action){var b3=Z5WrO.K_g;b3+=z$K;action[b3](_this);}})[c2S](x6,function(e){if(e[P$B] === T7E){e[H0$]();}})[c2S](i5v,function(e){var C_G="preve";var d3x="ntDefaul";var d1=C_G;d1+=d3x;d1+=N2K;e[d1]();if(action){var w7=Z5WrO.K_g;w7+=z$K;action[w7](_this,e);}})[y_](_this[g1][C7_]);});return this;}function clear(fieldName){var O17="nA";var Q6O="deFields";var Q7i="spli";var g0U="includeFields";var d2s="fieldNames";var R20="inc";var that=this;var sFields=this[y0a][O2h];if(typeof fieldName === Z5m){var n2=R20;n2+=j4j;n2+=Q6O;var H1=Q7i;H1+=Z5WrO.K_g;H1+=Z5WrO.t9K;var v6=L3p;v6+=Z5WrO[293400];v6+=Z5WrO.t9K;v6+=o4O;var H5=t7J;H5+=Z5WrO.t9K;H5+=o4O;var k4=m9y;k4+=O17;k4+=o4O;k4+=o2v;that[c7Y](fieldName)[W9h]();delete sFields[fieldName];var orderIdx=$[k4](fieldName,this[y0a][H5]);this[y0a][v6][H1](orderIdx,q31);var includeIdx=$[H7Y](fieldName,this[y0a][n2]);if(includeIdx !== -q31){this[y0a][g0U][J9l](includeIdx,q31);}}else {var C2=F$W;C2+=d2s;var p2=V5y;p2+=Z5WrO.K_g;p2+=C_d;$[p2](this[C2](fieldName),function(i,name){var X_=v_k;X_+=Z5WrO.t9K;p5T.Q1A();X_+=Z5WrO.L$5;X_+=o4O;that[X_](name);});}return this;}function close(){this[T2u](f_Y);return this;}function create(arg1,arg2,arg3,arg4){var N08="modifi";var A$_="splayReorder";var u95="editF";p5T.Z7s();var o0C="Class";var O$n="_di";var Y_m="numbe";var T2j="editFiel";var A40="_action";var i6=F$W;i6+=r87;var F$=V5y;F$+=v67;var D8=O$n;D8+=A$_;var L7=A40;L7+=o0C;var X8=x1A;X8+=f49;X8+=Z5WrO.K_g;X8+=G5_;var d3=y0a;d3+=N2K;d3+=U5A;d3+=Z5WrO.t9K;var F4=N08;F4+=Z5WrO.i5Y;var C5=y9Z;C5+=Z5WrO.L$5;C5+=x_9;var C_=T2j;C_+=Z5WrO[293400];C_+=y0a;var b2=Y_m;b2+=o4O;var g$=Z5WrO[713];g$+=m9y;g$+=u0S;g$+=y0a;var _this=this;var that=this;var sFields=this[y0a][g$];var count=q31;if(this[s3p](function(){var K8=L21;K8+=X4C;that[K8](arg1,arg2,arg3,arg4);})){return this;}if(typeof arg1 === b2){count=arg1;arg1=arg2;arg2=arg3;}this[y0a][C_]={};for(var i=s87;i < count;i++){var R$=u95;R$+=t4h;R$+=v4L;this[y0a][R$][i]={fields:this[y0a][O2h]};}var argOpts=this[I12](arg1,arg2,arg3,arg4);this[y0a][N9M]=C5;this[y0a][G6b]=Q9X;this[y0a][F4]=m3D;this[E9e][g61][d3][l4D]=X8;this[L7]();this[D8](this[O2h]());$[F$](sFields,function(name,fieldIn){var O3=y0a;O3+=Z5WrO.t9K;O3+=N2K;var s9=Z5WrO[293400];s9+=Z5WrO.t9K;s9+=Z5WrO[713];var def=fieldIn[s9]();fieldIn[y2U]();for(var i=s87;i < count;i++){var k1=K75;k1+=N2K;k1+=r3S;k1+=N2K;fieldIn[k1](i,def);}fieldIn[O3](def);});this[i6](r4v,m3D,function(){var K55="_formOptio";var a_N="eOp";var f3n="ayb";var B_=y9Z;B_+=f3n;B_+=a_N;B_+=y7w;var v_=K55;v_+=t$u;var z3=o4A;z3+=K$l;z3+=Z5WrO.S9O;_this[z3]();_this[v_](argOpts[k7c]);argOpts[B_]();});return this;}function undependent(parent){var Z70="dep";var M5U="undepe";var g1g=W5L;g1g+=Z5WrO.t9K;g1g+=Z70;var W3V=f49;W3V+=Z5WrO[713];W3V+=Z5WrO[713];var D9i=p0i;D9i+=Z5WrO.t9K;D9i+=w$q;if(Array[z4s](parent)){var q0=u_4;q0+=Z5WrO.S9O;q0+=V47;for(var i=s87,ien=parent[q0];i < ien;i++){var i1=M5U;i1+=O0i;i1+=A$P;this[i1](parent[i]);}return this;}$(this[D9i](parent)[y4O]())[W3V](g1g);return this;}function dependent(parent,url,optsIn){var v52="dependent";var C8k='POST';var q_V="jso";var W93="nge";var i$B=".e";var v7o=i$B;v7o+=Z5WrO[293400];v7o+=Z5WrO.t9K;v7o+=W__;var l_q=Z5WrO.t9K;l_q+=b9F;l_q+=A$P;var e0w=f49;e0w+=Z5WrO.S9O;var x6S=Z5WrO.K_g;x6S+=C_d;x6S+=Z5WrO.L$5;x6S+=W93;var b8g=q_V;b8g+=Z5WrO.S9O;var M1p=z_2;M1p+=w$q;var R1F=g8e;R1F+=Z5WrO.x6j;var _this=this;if(Array[R1F](parent)){for(var i=s87,ien=parent[f6V];i < ien;i++){this[v52](parent[i],url,optsIn);}return this;}var that=this;var parentField=this[M1p](parent);var ajaxOpts={dataType:b8g,type:C8k};var opts=$[D3A]({},{data:m3D,event:x6S,postUpdate:m3D,preUpdate:m3D},optsIn);var update=function(json){var U5u="postUpd";var u3V="isable";var S4O="reUpdat";var X3g="postUpdate";var Z1R="eUpdat";var T8s="ide";var X_I='show';var j6T='message';var D8Y=Z5WrO[293400];D8Y+=u3V;var P2E=y7w;P2E+=O0z;var w84=C_d;w84+=T8s;var B2Q=S7V;B2Q+=S$W;var b9T=H60;b9T+=Z5WrO[293400];b9T+=G1P;b9T+=Z5WrO.t9K;var a4c=G1l;a4c+=C5e;a4c+=S$W;var Z15=i45;Z15+=o4O;var x4f=Z5WrO.t9K;x4f+=t33;x4f+=C_d;var C2R=W__;C2R+=o4O;C2R+=Z1R;C2R+=Z5WrO.t9K;if(opts[C2R]){var r$n=W__;r$n+=S4O;r$n+=Z5WrO.t9K;opts[r$n](json);}$[x4f]({errors:Z15,labels:a4c,messages:j6T,options:b9T,values:B2Q},function(jsonProp,fieldFn){p5T.Z7s();if(json[jsonProp]){var z0w=Z5WrO.t9K;z0w+=C0K;$[z0w](json[jsonProp],function(fieldIn,valIn){that[c7Y](fieldIn)[fieldFn](valIn);});}});$[g1o]([w84,X_I,P2E,D8Y],function(i,key){var z__="anima";p5T.Q1A();if(json[key]){var x7J=z__;x7J+=x0B;that[key](json[key],json[x7J]);}});if(opts[X3g]){var W_p=U5u;W_p+=N6z;opts[W_p](json);}parentField[J3I](f_Y);};$(parentField[y4O]())[e0w](opts[l_q] + v7o,function(e){var j9G="sPlai";var L$y="editFie";var U_W="targ";var v31="nObje";var b1k="values";var X6_=g_d;X6_+=y5e;var p2v=D3P;p2v+=Z5WrO.L$5;p2v+=S$W;var j3T=o4O;j3T+=j4R;j3T+=y0a;var a9G=I5g;a9G+=J_L;a9G+=y0a;var e8J=o4O;e8J+=f49;e8J+=J_L;var o$O=L$y;o$O+=S$W;o$O+=Z5WrO[293400];o$O+=y0a;var I9W=U_W;I9W+=Z5WrO.p8I;var P9H=Z5WrO[713];P9H+=m9y;P9H+=Z5WrO.S9O;P9H+=Z5WrO[293400];if($(parentField[y4O]())[P9H](e[I9W])[f6V] === s87){return;}parentField[J3I](V0I);var data={};data[C$$]=_this[y0a][o$O]?pluck(_this[y0a][r2S],z0t):m3D;data[e8J]=data[a9G]?data[j3T][s87]:m3D;data[b1k]=_this[p2v]();if(opts[g6F]){var ret=opts[g6F](data);if(ret){data=ret;}}if(typeof url === X6_){var o=url[R5q](_this,parentField[F4A](),data,update,e);if(o){if(typeof o === Z5WrO.k12 && typeof o[G_g] === s8p){o[G_g](function(resolved){if(resolved){update(resolved);}});}else {update(o);}}}else {var v$C=a11;v$C+=c7c;var d6J=m9y;d6J+=j9G;d6J+=v31;d6J+=j0X;if($[d6J](url)){$[D3A](ajaxOpts,url);}else {var a3o=O8W;a3o+=o4O;a3o+=S$W;ajaxOpts[a3o]=url;}$[v$C]($[D3A](ajaxOpts,{data:data,success:update}));}});return this;}function destroy(){var D9d="laye";var U7j="Cont";var H9s="clear";var s2Z='destroyEditor';var T7b="estro";var o0N="rigge";var x9f="roller";var R6q="unique";var P$G='.dte';var b_d=N2K;b_d+=o0N;b_d+=o4O;var h0d=f49;h0d+=Z5WrO[713];h0d+=Z5WrO[713];var M$7=Z5WrO[293400];M$7+=T7b;M$7+=Z5WrO.x6j;var G37=Z5WrO[293400];G37+=d2k;G37+=U7j;G37+=x9f;var T5D=Z5WrO[293400];T5D+=d7G;T5D+=D9d;T5D+=Z5WrO[293400];if(this[y0a][T5D]){var i8C=Z5WrO.K_g;i8C+=m_1;this[i8C]();}this[H9s]();if(this[y0a][t2g]){$(L8c)[j6E](this[y0a][t2g]);}var controller=this[y0a][G37];if(controller[M$7]){controller[W9h](this);}$(document)[h0d](P$G + this[y0a][R6q]);$(document)[b_d](s2Z,[this]);this[E9e]=m3D;this[y0a]=m3D;}function disable(name){var b_w="ieldNames";var B0k=D44;B0k+=b_w;var j65=Z5WrO.t9K;j65+=Z5WrO.L$5;j65+=Z5WrO.K_g;j65+=C_d;var that=this;$[j65](this[B0k](name),function(i,n){p5T.Q1A();var M9L=Z5WrO[293400];M9L+=e7V;M9L+=O0z;var W48=z_2;W48+=w$q;that[W48](n)[M9L]();});p5T.Z7s();return this;}function display(showIn){var R_c="isplaye";var P4E=Z5WrO.K_g;P4E+=S$W;P4E+=f49;P4E+=F05;var l8u=R4j;p5T.Z7s();l8u+=Z5WrO.t9K;l8u+=Z5WrO.S9O;if(showIn === undefined){var b9O=Z5WrO[293400];b9O+=R_c;b9O+=Z5WrO[293400];return this[y0a][b9O];}return this[showIn?l8u:P4E]();}function displayed(){return $[w1F](this[y0a][O2h],function(fieldIn,name){p5T.Z7s();return fieldIn[o1l]()?name:m3D;});}function displayNode(){var g2o="displa";var v5q="rolle";var J9q="yCont";var g4D=Z5WrO.S9O;g4D+=f49;g4D+=Z5WrO[293400];g4D+=Z5WrO.t9K;var A0g=g2o;A0g+=J9q;A0g+=v5q;A0g+=o4O;return this[y0a][A0g][g4D](this);}function edit(items,arg1,arg2,arg3,arg4){var I8d="tid";var k_S=z_2;k_S+=S$W;k_S+=v4L;var x99=x2l;x99+=N2K;x99+=E6r;x99+=P4f;var E_0=F$W;E_0+=I8d;E_0+=Z5WrO.x6j;var _this=this;var that=this;if(this[E_0](function(){var D$m=Z5WrO.t9K;D$m+=i$g;p5T.Q1A();D$m+=N2K;that[D$m](items,arg1,arg2,arg3,arg4);})){return this;}var argOpts=this[I12](arg1,arg2,arg3,arg4);this[t5u](items,this[x99](k_S,items),b1_,argOpts[k7c],function(){var a81="rmOption";var r02="_fo";var Q7J="maybeOpen";var s8b=r02;s8b+=a81;s8b+=y0a;var H31=o4A;H31+=K$l;p5T.Z7s();H31+=Z5WrO.S9O;_this[H31]();_this[s8b](argOpts[k7c]);argOpts[Q7J]();});return this;}function enable(name){var R4W="ldName";var k6P="_fi";var J9t=k6P;J9t+=Z5WrO.t9K;J9t+=R4W;J9t+=y0a;var X_q=Z5WrO.t9K;X_q+=Z5WrO.L$5;X_q+=Z5WrO.K_g;X_q+=C_d;var that=this;$[X_q](this[J9t](name),function(i,n){var d$1=Z5WrO.t9K;d$1+=K71;d$1+=Z5WrO[156815];d$1+=u_4;that[c7Y](n)[d$1]();});return this;}function error$1(name,msg){var S7j="sib";var r6_="formE";var P9f="_mes";var K87="vi";var s_8="globalError";var M_i=h1o;M_i+=p96;M_i+=W__;M_i+=Z5WrO.i5Y;p5T.Q1A();var wrapper=$(this[E9e][M_i]);if(msg === undefined){var Z7t=F_K;Z7t+=K87;Z7t+=S7j;Z7t+=u_4;var f5r=r6_;f5r+=o4O;f5r+=B6V;var Y9M=P9f;Y9M+=f0A;this[Y9M](this[E9e][i1m],name,V0I,function(){var v_c='inFormError';var E5a="oggleCla";var U7x=N2K;U7x+=E5a;U7x+=G6q;wrapper[U7x](v_c,name !== undefined && name !== b_u);});if(name && !$(this[E9e][f5r])[e7V](Z7t)){var U1c=D8M;U1c+=Z5WrO.L$5;U1c+=w8H;alert(name[U1c](/<br>/g,d5n));}this[y0a][s_8]=name;}else {this[c7Y](name)[u2r](msg);}return this;}function field(name){var U1S="Unk";var g9k="ield";var g$o="nown f";var a1Q=" name - ";var R4C=Z5WrO[713];R4C+=g9k;R4C+=y0a;var sFields=this[y0a][R4C];p5T.Q1A();if(!sFields[name]){var W7f=U1S;W7f+=g$o;W7f+=g9k;W7f+=a1Q;throw new Error(W7f + name);}return sFields[name];}function fields(){var j91=y9Z;j91+=Z5WrO.L$5;j91+=W__;return $[j91](this[y0a][O2h],function(fieldIn,name){p5T.Z7s();return name;});}function file(name,id){var O87=' in table ';var m0j='Unknown file id ';p5T.Z7s();var J1E=h$l;J1E+=Z5WrO.t9K;J1E+=y0a;var tableFromFile=this[J1E](name);var fileFromTable=tableFromFile[id];if(!fileFromTable){throw new Error(m0j + id + O87 + name);}return tableFromFile[id];}function files(name){var o1Q="Unknow";var o8W=" file t";var v3K="able name: ";if(!name){return Editor[X$C];}var editorTable=Editor[X$C][name];if(!editorTable){var s1V=o1Q;s1V+=Z5WrO.S9O;s1V+=o8W;s1V+=v3K;throw new Error(s1V + name);}return editorTable;}function get(name){var F1Y=Z5WrO[713];F1Y+=G2Z;F1Y+=S$W;F1Y+=Z5WrO[293400];p5T.Q1A();var that=this;if(!name){var w4w=Z5WrO[713];w4w+=r25;name=this[w4w]();}if(Array[z4s](name)){var out_1={};$[g1o](name,function(i,n){p5T.Z7s();var u3H=z_2;u3H+=S$W;u3H+=Z5WrO[293400];out_1[n]=that[u3H](n)[h7H]();});return out_1;}return this[F1Y](name)[h7H]();}function hide(names,animate){var that=this;$[g1o](this[b9N](names),function(i,n){var i9n=L_Y;p5T.Z7s();i9n+=Z5WrO.t9K;var r74=Z5WrO[713];r74+=m9y;r74+=t9I;r74+=Z5WrO[293400];that[r74](n)[i9n](animate);});return this;}function ids(includeHash){if(includeHash === void s87){includeHash=f_Y;}return $[w1F](this[y0a][r2S],function(editIn,idSrc){return includeHash === V0I?T1d + idSrc:idSrc;});}function inError(inNames){var Y$u="globalE";var k2O="nError";var h9h=Y$u;h9h+=q_n;h9h+=L3p;if(this[y0a][h9h]){return V0I;}var names=this[b9N](inNames);for(var i=s87,ien=names[f6V];i < ien;i++){var r8n=m9y;r8n+=k2O;if(this[c7Y](names[i])[r8n]()){return V0I;}}return f_Y;}function inline(cell,fieldName,opts){var d5b="formOpti";var r21="div.D";var Q0S="TE_Fiel";var a0U='Cannot edit more than one row inline at a time';var J66=x_9;J66+=S$W;J66+=m9y;J66+=o$V;var q3M=k4x;q3M+=P4S;var g8m=r21;g8m+=Q0S;g8m+=Z5WrO[293400];var u6q=S$W;u6q+=G0V;u6q+=N2K;u6q+=C_d;var i9I=d5b;i9I+=f49;i9I+=t$u;var z86=I2N;z86+=j0X;var _this=this;var that=this;if($[z86](fieldName)){opts=fieldName;fieldName=undefined;}opts=$[D3A]({},this[y0a][i9I][Z_R],opts);var editFields=this[D9p](i6X,cell,fieldName);p5T.Q1A();var keys=Object[h_i](editFields);if(keys[u6q] > q31){throw new Error(a0U);}var editRow=editFields[keys[s87]];var hosts=[];for(var _i=s87,_a=editRow[Z_8];_i < _a[f6V];_i++){var row=_a[_i];hosts[I59](row);}if($(g8m,hosts)[f6V]){return this;}if(this[s3p](function(){var e66=m9y;p5T.Q1A();e66+=Z5WrO.S9O;e66+=s2h;e66+=o$V;that[e66](cell,fieldName,opts);})){return this;}this[q3M](cell,editFields,J66,opts,function(){_this[R22](editFields,opts);});return this;}function inlineCreate(insertPoint,opts){var D07="nObj";var M8a="itFields";var A4W="isPlai";var k0Y="formO";var n0X='fakeRow';var u8_=q9I;u8_+=N2K;u8_+=K2d;u8_+=d$y;var c1T=k0Y;c1T+=L0O;p5T.Z7s();c1T+=R_D;var I9H=Y57;I9H+=M8a;var Y7F=L21;Y7F+=Z5WrO.t9K;Y7F+=N6z;var K1Y=V5y;K1Y+=v67;var O5W=F$W;O5W+=N2K;O5W+=s2P;O5W+=Z5WrO.x6j;var H7v=A4W;H7v+=D07;H7v+=R2u;var _this=this;if($[H7v](insertPoint)){opts=insertPoint;insertPoint=m3D;}if(this[O5W](function(){var F26="inlineC";var j_f=F26;j_f+=o4O;p5T.Z7s();j_f+=X4C;_this[j_f](insertPoint,opts);})){return this;}$[K1Y](this[y0a][O2h],function(name,fieldIn){var h4J="multiS";var r_M="Reset";var u4v=h4J;u4v+=Z5WrO.t9K;u4v+=N2K;var k3r=d1p;k3r+=Z83;k3r+=m9y;k3r+=r_M;fieldIn[k3r]();fieldIn[u4v](s87,fieldIn[j5s]());fieldIn[h1G](fieldIn[j5s]());});this[y0a][N9M]=b1_;this[y0a][G6b]=Y7F;this[y0a][u$I]=m3D;this[y0a][I9H]=this[D9p](n0X,insertPoint);opts=$[D3A]({},this[y0a][c1T][Z_R],opts);this[w7O]();this[R22](this[y0a][u8_],opts,function(){var M$H='fakeRowEnd';p5T.Z7s();_this[D9p](M$H);});this[a5N](r4v,m3D);return this;}function message(name,msg){var v9w="formIn";if(msg === undefined){var a58=v9w;a58+=T6g;var h86=Z5WrO[293400];h86+=Y72;var m5D=U4k;m5D+=Z5WrO.t9K;m5D+=o03;this[m5D](this[h86][a58],name);}else {var T6L=p0i;T6L+=Z5WrO.t9K;T6L+=S$W;T6L+=Z5WrO[293400];this[T6L](name)[W92](msg);}return this;}function mode(modeIn){var w1_="rently in an editing mode";var R5B="Chan";var R9m="e mode is not supported";var B2U="ging from creat";var I$C="Not cur";var w9M="tio";var N5j=U0z;N5j+=Z5WrO.S9O;var N5A=Z5WrO.L$5;N5A+=Z5WrO.K_g;N5A+=w9M;N5A+=Z5WrO.S9O;var X7h=Z5WrO.L$5;X7h+=Z5WrO.K_g;X7h+=V6z;X7h+=c2S;p5T.Q1A();if(!modeIn){var K_T=t33;K_T+=V6z;K_T+=f49;K_T+=Z5WrO.S9O;return this[y0a][K_T];}if(!this[y0a][X7h]){var p1r=I$C;p1r+=w1_;throw new Error(p1r);}else if(this[y0a][N5A] === Q9X && modeIn !== Q9X){var A2O=R5B;A2O+=B2U;A2O+=R9m;throw new Error(A2O);}this[y0a][N5j]=modeIn;return this;}function modifier(){p5T.Z7s();return this[y0a][u$I];}function multiGet(fieldNames){var J4u="iGe";var y_h=y9Z;y_h+=N9x;y_h+=J4u;y_h+=N2K;var that=this;if(fieldNames === undefined){var a1n=Z5WrO[713];a1n+=m9y;a1n+=t9I;a1n+=v4L;fieldNames=this[a1n]();}if(Array[z4s](fieldNames)){var q8m=Z5WrO.t9K;q8m+=C0K;var out_2={};$[q8m](fieldNames,function(i,name){var B7f="G";var B50="lti";var s4F=d1p;p5T.Q1A();s4F+=B50;s4F+=B7f;s4F+=Z5WrO.p8I;out_2[name]=that[c7Y](name)[s4F]();});return out_2;}return this[c7Y](fieldNames)[y_h]();}function multiSet(fieldNames,valIn){var that=this;if($[A5B](fieldNames) && valIn === undefined){var A0U=Z5WrO.t9K;A0U+=Z5WrO.L$5;A0U+=v67;$[A0U](fieldNames,function(name,value){var K7B=K75;K7B+=N2K;K7B+=r3S;K7B+=N2K;that[c7Y](name)[K7B](value);});}else {var w_M=V4D;w_M+=m9y;w_M+=F0W;w_M+=Z5WrO.p8I;this[c7Y](fieldNames)[w_M](valIn);}p5T.Q1A();return this;}function node(name){var t34="rde";var v8j=Z5WrO.S9O;p5T.Z7s();v8j+=f49;v8j+=Z5WrO[293400];v8j+=Z5WrO.t9K;var that=this;if(!name){var d2$=f49;d2$+=t34;d2$+=o4O;name=this[d2$]();}return Array[z4s](name)?$[w1F](name,function(n){var M_Q=Z5WrO.S9O;M_Q+=f49;p5T.Q1A();M_Q+=Z5WrO[293400];M_Q+=Z5WrO.t9K;return that[c7Y](n)[M_Q]();}):this[c7Y](name)[v8j]();}function off(name,fn){var F1l="_eventName";$(this)[D6G](this[F1l](name),fn);return this;}function on(name,fn){var g02="_eventNam";var J3W=g02;J3W+=Z5WrO.t9K;var Y5J=f49;Y5J+=Z5WrO.S9O;$(this)[Y5J](this[J3W](name),fn);return this;}function one(name,fn){var T_g="tNa";var X6i=I1B;X6i+=y7w;X6i+=T_g;p5T.Z7s();X6i+=x$8;var K$V=c2S;K$V+=Z5WrO.t9K;$(this)[K$V](this[X6i](name),fn);return this;}function open(){var Z$N="ostopen";var U2a="nest";var T2f="_nes";var X3E="tOpts";var H2K="dOpen";var v_v="displayReorder";var g76="ain";var R2h=y9Z;R2h+=Z5WrO.L$5;R2h+=m9y;R2h+=Z5WrO.S9O;var V2E=B90;V2E+=Z$N;var v9M=q9I;v9M+=X3E;var R49=T2f;R49+=x0B;R49+=H2K;var m$z=y9Z;m$z+=g76;var f31=u9W;f31+=Z5WrO.t9K;f31+=f49;f31+=D3K;var S_a=F$W;S_a+=v_v;var _this=this;this[S_a]();this[p0C](function(){var T$j="_nestedClose";_this[T$j](function(){var Y7_="_clearDyn";var f0_="amicInfo";var S4n=w_V;S4n+=y0a;S4n+=Y57;var g7j=Y7_;g7j+=f0_;_this[g7j]();_this[a5N](S4n,[b1_]);});});var ret=this[f31](m$z);if(!ret){return this;}this[R49](function(){var C$T="editOpt";var d4N=Z5WrO.L$5;d4N+=j0X;d4N+=f7T;d4N+=Z5WrO.S9O;var p4d=y9Z;p4d+=g76;var n0s=u6X;n0s+=N2K;var c26=T6g;c26+=Z5WrO.K_g;c26+=O8W;c26+=y0a;var X7V=C$T;X7V+=y0a;var N94=y9Z;N94+=Z5WrO.L$5;N94+=W__;var B52=D44;B52+=o0q;B52+=O8W;B52+=y0a;_this[B52]($[N94](_this[y0a][i22],function(name){return _this[y0a][O2h][name];}),_this[y0a][X7V][c26]);_this[n0s](L2K,[p4d,_this[y0a][d4N]]);},this[y0a][v9M][U2a]);this[V2E](R2h,f_Y);return this;}function order(setIn){var k1h="for ordering.";var g_c="ll fields, and no additional fields, ";var c1_="must be provided ";var C5d="eorder";var x3I="_displayR";var h4C="sort";var v9c=x3I;v9c+=C5d;var q_6=Z5WrO.t9K;q_6+=O3s;q_6+=Z5WrO.t9K;q_6+=m5K;var J9U=y0a;J9U+=L3p;J9U+=N2K;var m9E=f49;m9E+=t_E;m9E+=Z5WrO.i5Y;var d$N=g8e;d$N+=Z5WrO.x6j;var N6d=M15;N6d+=k$T;N6d+=v4y;if(!setIn){var H4W=t7J;H4W+=Z5WrO.i5Y;return this[y0a][H4W];}if(arguments[N6d] && !Array[d$N](setIn)){setIn=Array[D6w][o0B][R5q](arguments);}if(this[y0a][m9E][o0B]()[J9U]()[J1V](t7A) !== setIn[o0B]()[h4C]()[J1V](t7A)){var V3V=q7O;V3V+=g_c;V3V+=c1_;V3V+=k1h;throw new Error(V3V);}$[q_6](this[y0a][i22],setIn);this[v9c]();return this;}function remove(items,arg1,arg2,arg3,arg4){var W06="splay";var B$_="itFi";var b96='initRemove';var e8T="nC";var Z4I='fields';var B0z=Z5WrO[293400];B0z+=Z5WrO.L$5;B0z+=N2K;B0z+=Z5WrO.L$5;var V$r=q4F;V$r+=Z5WrO.t9K;var p4f=K1p;p4f+=D3P;p4f+=D9O;var W3b=F$W;W3b+=U0z;W3b+=e8T;W3b+=j$o;var M7$=i$g;M7$+=W06;var v5Y=y0a;v5Y+=F94;v5Y+=u_4;var e5p=Z5WrO[293400];e5p+=f49;e5p+=y9Z;var j12=Y57;j12+=B$_;j12+=u0S;j12+=y0a;var T4V=V3r;T4V+=z_2;T4V+=o4O;var l0F=E$C;l0F+=m9y;l0F+=Z5WrO[293400];l0F+=Z5WrO.x6j;var _this=this;var that=this;if(this[l0F](function(){var w$r=N6$;w$r+=f49;w$r+=D3P;w$r+=Z5WrO.t9K;that[w$r](items,arg1,arg2,arg3,arg4);})){return this;}if(!items && !this[y0a][f3z]){items=I5L;}if(items[f6V] === undefined){items=[items];}var argOpts=this[I12](arg1,arg2,arg3,arg4);var editFields=this[D9p](Z4I,items);this[y0a][G6b]=X1n;this[y0a][T4V]=items;this[y0a][j12]=editFields;this[e5p][g61][v5Y][M7$]=V67;this[W3b]();this[p4f](b96,[pluck(editFields,V$r),pluck(editFields,B0z),items],function(){var x03='initMultiRemove';var N5S=u6X;N5S+=N2K;p5T.Q1A();_this[N5S](x03,[editFields,items],function(){var x3C="_assembl";var j0c="beOpen";var W9i="eM";var D6l="mOp";var O57=y9Z;O57+=Z5WrO.L$5;O57+=Z5WrO.x6j;O57+=j0c;var e6f=R4j;e6f+=Z5WrO.a73;var b6u=F5e;b6u+=D6l;b6u+=m$B;var p6H=x3C;p6H+=W9i;p6H+=r6w;p6H+=Z5WrO.S9O;_this[p6H]();_this[b6u](argOpts[e6f]);argOpts[O57]();var opts=_this[y0a][V3R];if(opts[D9n] !== m3D){setTimeout(function(){p5T.Z7s();var O_a="eq";if(_this[E9e]){var j9$=Z5WrO[713];j9$+=o0q;j9$+=g9r;var V98=Z5WrO[156815];V98+=O8W;V98+=p9M;$(V98,_this[E9e][C7_])[O_a](opts[D9n])[j9$]();}},O7R);}});});return this;}function set(setIn,valIn){var l$j="lainObjec";var F3d=m9y;F3d+=Z8l;F3d+=l$j;F3d+=N2K;var that=this;if(!$[F3d](setIn)){var o={};o[setIn]=valIn;setIn=o;}$[g1o](setIn,function(n,v){var C$E=p0i;C$E+=t9I;C$E+=Z5WrO[293400];that[C$E](n)[h1G](v);});return this;}function show(names,animate){var Y5g="Names";var P1A=F$W;P1A+=c7Y;P1A+=Y5g;var that=this;p5T.Z7s();$[g1o](this[P1A](names),function(i,n){p5T.Q1A();var p6l="show";that[c7Y](n)[p6l](animate);});return this;}function submit(successCallback,errorCallback,formatdata,hideIn){var u9x='div.DTE_Field';var Y_o="ctio";var n8M="activeElem";var K__=V5y;K__+=v67;var H8t=Z5WrO.t9K;H8t+=Z5WrO.L$5;H8t+=v67;var e8L=n0k;e8L+=Z5WrO.t9K;e8L+=Y75;var w0u=n8M;w0u+=D9O;var H1r=Z5WrO.L$5;H1r+=Y_o;H1r+=Z5WrO.S9O;var Z88=z_2;Z88+=S$W;Z88+=v4L;var _this=this;var fields=this[y0a][Z88];var errorFields=[];var errorReady=s87;var sent=f_Y;if(this[y0a][J3I] || !this[y0a][H1r]){return this;}this[s$E](V0I);var send=function(){var z0a='initSubmit';var B78=u_4;p5T.Z7s();B78+=Z5WrO.S9O;B78+=q0v;B78+=C_d;if(errorFields[B78] !== errorReady || sent){return;}_this[a5N](z0a,[_this[y0a][G6b]],function(result){if(result === f_Y){_this[s$E](f_Y);return;}sent=V0I;_this[y$t](successCallback,errorCallback,formatdata,hideIn);});};var active=document[w0u];if($(active)[e8L](u9x)[f6V] !== s87){active[B4B]();}this[u2r]();$[H8t](fields,function(name,fieldIn){var H19="pus";var L1y="nE";p5T.Z7s();var X8A=m9y;X8A+=L1y;X8A+=o4O;X8A+=B6V;if(fieldIn[X8A]()){var r2p=H19;r2p+=C_d;errorFields[r2p](name);}});$[K__](errorFields,function(i,name){var J6O=Z5WrO.i5Y;J6O+=B6V;fields[name][J6O](b_u,function(){errorReady++;send();});});send();return this;}function table(setIn){p5T.Z7s();if(setIn === undefined){var Q31=m_3;Q31+=g6k;return this[y0a][Q31];}this[y0a][f3z]=setIn;return this;}function template(setIn){var c1i="templat";p5T.Z7s();if(setIn === undefined){var T7Y=c1i;T7Y+=Z5WrO.t9K;return this[y0a][T7Y];}this[y0a][t2g]=setIn === m3D?m3D:$(setIn);return this;}function title(titleIn){var N5i="ren";var Y_X="tag";var P0v="itle";var Y7n="child";var k2L=i57;k2L+=S$W;k2L+=Z5WrO.t9K;var p4r=C_d;p4r+=N2K;p4r+=H5K;var U6s=o7D;U6s+=K5V;U6s+=B60;var T55=N2K;T55+=Z5WrO.L$5;T55+=k$T;var s1y=Z5WrO[166792];s1y+=f7T;s1y+=Z5WrO.S9O;var K_b=d4c;K_b+=J3_;K_b+=Z5WrO.i5Y;var M76=v_k;M76+=o53;var j7V=O7a;j7V+=o79;var i30=y0G;i30+=h4Y;var p4D=Y7n;p4D+=N5i;var k4t=C_d;k4t+=V5y;k4t+=j4$;k4t+=o4O;var header=$(this[E9e][k4t])[p4D](W05 + this[i30][W$T][j7V]);var titleClass=this[M76][K_b][S8_];if(titleIn === undefined){var N0b=N2K;N0b+=P0v;var E$P=t44;E$P+=N2K;E$P+=Z5WrO.L$5;return header[E$P](N0b);}if(typeof titleIn === s1y){var o6h=N2K;o6h+=Z5WrO.L$5;o6h+=x1A;o6h+=Z5WrO.t9K;titleIn=titleIn(this,new DataTable$5[H0n](this[y0a][o6h]));}var set=titleClass[T55]?$(K5V + titleClass[Y_X] + U6s + titleClass[Y_X])[A_M](titleClass[y0G])[p4r](titleIn):titleIn;header[f_u](set)[g6F](k2L,titleIn);return this;}function val(fieldIn,value){var H_X="inObject";var G9P=d1S;G9P+=H_X;if(value !== undefined || $[G9P](fieldIn)){return this[h1G](fieldIn,value);}return this[h7H](fieldIn);}function error(msg,tn,thro){var J2a="wa";var C6s=' For more information, please refer to https://datatables.net/tn/';var q01="rn";if(thro === void s87){thro=V0I;}p5T.Q1A();var display=tn?msg + C6s + tn:msg;if(thro){throw display;}else {var r55=J2a;r55+=q01;console[r55](display);}}function pairs(data,props,fn){p5T.Q1A();var i;var ien;var dataPoint;props=$[D3A]({label:N$I,value:O6C},props);if(Array[z4s](data)){for((i=s87,ien=data[f6V]);i < ien;i++){dataPoint=data[i];if($[A5B](dataPoint)){var G2H=h9C;G2H+=o4O;var c0y=D3P;c0y+=R5W;c0y+=Z5WrO.t9K;var L6B=D3P;L6B+=c1L;L6B+=a3W;fn(dataPoint[props[L6B]] === undefined?dataPoint[props[I2Z]]:dataPoint[props[c0y]],dataPoint[props[I2Z]],i,dataPoint[G2H]);}else {fn(dataPoint,dataPoint,i);}}}else {var J33=Z5WrO.t9K;J33+=t33;J33+=C_d;i=s87;$[J33](data,function(key,val){p5T.Z7s();fn(val,key,i);i++;});}}function upload$1(editor,conf,files,progressCallback,completeCallback){var G$9="<i>Uploadi";var I9y='A server error occurred while uploading the file';var O4J="g file<";var R9Y="fileReadText";var A0h="errors";var p_g="_limitL";var J3F="oad";var J8P="readAsDa";var V6p="aja";var l6r="URL";var K2a="/i>";var k6F="nl";var L$n="_limitLeft";var m6z=J8P;m6z+=N2K;m6z+=Z5WrO.L$5;m6z+=l6r;var s14=y9Z;s14+=p96;var S0b=f49;S0b+=k6F;S0b+=J3F;var X23=G$9;X23+=Z5WrO.S9O;X23+=O4J;X23+=K2a;var v8c=V6p;v8c+=Z5WrO.w$8;var y0V=u2r;y0V+=y0a;var reader=new FileReader();var counter=s87;var ids=[];var generalError=conf[A0h] && conf[A0h][F$W]?conf[y0V][F$W]:I9y;editor[u2r](conf[A$O],b_u);if(typeof conf[v8c] === s8p){conf[V$_](files,function(idsIn){p5T.Z7s();var o3x=Z5WrO.K_g;o3x+=z$K;completeCallback[o3x](editor,idsIn);});return;}progressCallback(conf,conf[R9Y] || X23);reader[S0b]=function(e){var D5U='No Ajax option specified for upload plug-in';var B3H='action';var X$S="nction";var x5Q="lain";var u4D='uploadField';var M4h="Object";var q9M=".data` with an obje";var M16="s a function instead.";var N8g="ct. Please use it a";var d8F="Upload feature cannot use `ajax";var j50="jaxD";var G2J="ajaxData";var e10='preUpload';var A0m=Z5WrO.S9O;A0m+=Z5WrO.L$5;A0m+=x$8;var o75=K1p;o75+=o3F;o75+=N2K;var N1T=O0o;N1T+=Z5WrO.L$5;var F7H=I9R;F7H+=x5Q;F7H+=M4h;var L$9=Z5WrO[713];p5T.Q1A();L$9+=O8W;L$9+=X$S;var R_j=t44;R_j+=N2K;R_j+=Z5WrO.L$5;var A2v=a11;A2v+=c7c;var X6r=Z5WrO.L$5;X6r+=O4L;var K6E=H60;K6E+=e6V;K6E+=J3_;var z0M=U85;z0M+=J3F;var data=new FormData();var ajax;data[j6E](B3H,z0M);data[j6E](u4D,conf[A$O]);data[j6E](K6E,files[counter]);if(conf[G2J]){var t1$=Z5WrO.L$5;t1$+=j50;t1$+=y3x;conf[t1$](data,files[counter],counter);}if(conf[X6r]){var X2C=Z5WrO.L$5;X2C+=G2w;X2C+=Z5WrO.w$8;ajax=conf[X2C];}else if($[A5B](editor[y0a][V$_])){var b3s=Z5WrO.L$5;b3s+=Z5WrO.c65;b3s+=c7c;var E3r=Z5WrO.L$5;E3r+=Z5WrO.c65;E3r+=Z5WrO.L$5;E3r+=Z5WrO.w$8;var d7Z=U85;d7Z+=f49;d7Z+=J3_;ajax=editor[y0a][V$_][d7Z]?editor[y0a][E3r][c7l]:editor[y0a][b3s];}else if(typeof editor[y0a][A2v] === Z5m){ajax=editor[y0a][V$_];}if(!ajax){throw new Error(D5U);}if(typeof ajax === Z5m){ajax={url:ajax};}if(typeof ajax[R_j] === L$9){var y1B=p50;y1B+=k$T;var d={};var ret=ajax[g6F](d);if(ret !== undefined && typeof ret !== y1B){d=ret;}$[g1o](d,function(key,value){var v0w=p96;v0w+=f2$;data[v0w](key,value);});}else if($[F7H](ajax[N1T])){var B8_=d8F;B8_+=q9M;B8_+=N8g;B8_+=M16;throw new Error(B8_);}editor[o75](e10,[conf[A0m],files[counter],data],function(preRet){var u6M="taURL";var V0y="ubmit.DTE_Upl";var X$g="eS";var M3J='post';var y2r="adAsD";var n2K=e1x;n2K+=m5K;var Q5r=Y5Y;Q5r+=X$g;Q5r+=V0y;Q5r+=J3F;p5T.Q1A();if(preRet === f_Y){var G$6=u_4;G$6+=Z5WrO.S9O;G$6+=k$T;G$6+=v4y;if(counter < files[G$6] - q31){var m5S=z0g;m5S+=y2r;m5S+=Z5WrO.L$5;m5S+=u6M;counter++;reader[m5S](files[counter]);}else {var H7Z=o5d;H7Z+=S$W;H7Z+=S$W;completeCallback[H7Z](editor,ids);}return;}var submit=f_Y;editor[c2S](Q5r,function(){p5T.Q1A();submit=V0I;return f_Y;});$[V$_]($[n2K]({},ajax,{contentType:f_Y,data:data,dataType:O8c,error:function(xhr){var a8v="bmit.DTE_";var i_W="Uplo";var y7k="sta";var N4R="uploa";var F3m="dXhrE";var L0W="preSu";var g0q=N4R;g0q+=F3m;g0q+=o4O;g0q+=B6V;var g0H=K1p;g0H+=f$E;var Q5z=y7k;Q5z+=N2K;Q5z+=O8W;Q5z+=y0a;var r9Z=Z5WrO.S9O;r9Z+=b43;r9Z+=Z5WrO.t9K;var t$f=L0W;t$f+=a8v;t$f+=i_W;t$f+=J3_;var errors=conf[A0h];editor[D6G](t$f);editor[u2r](conf[r9Z],errors && errors[xhr[G9I]]?errors[xhr[Q5z]]:generalError);editor[g0H](g0q,[conf[A$O],xhr]);progressCallback(conf);},processData:f_Y,success:function(json){var A70="eldEr";var Z4M='uploadXhrSuccess';var r0N="adAsDataURL";var K4q="preSubmit.DTE_Uplo";var Z71="plo";var x8u=m9y;x8u+=Z5WrO[293400];var E2G=O8W;E2G+=Z71;E2G+=J3_;var t1A=K4q;t1A+=Z5WrO.L$5;t1A+=Z5WrO[293400];editor[D6G](t1A);editor[a5N](Z4M,[conf[A$O],json]);if(json[l6O] && json[l6O][f6V]){var f5D=Z5WrO.K_g;f5D+=Z5WrO.L$5;f5D+=S$W;f5D+=S$W;var Y$e=M15;Y$e+=V47;var w8x=p0i;w8x+=A70;w8x+=I5g;w8x+=q5s;var errors=json[w8x];for(var i=s87,ien=errors[Y$e];i < ien;i++){editor[u2r](errors[i][A$O],errors[i][G9I]);}completeCallback[f5D](editor,ids,V0I);}else if(json[u2r]){editor[u2r](json[u2r]);completeCallback[R5q](editor,ids,V0I);}else if(!json[c7l] || !json[E2G][x8u]){var t73=K71;t73+=y9Z;t73+=Z5WrO.t9K;editor[u2r](conf[t73],generalError);completeCallback[R5q](editor,ids,V0I);}else {var W8x=m9y;W8x+=Z5WrO[293400];var L74=Z5WrO[713];L74+=l7E;L74+=Z5WrO.t9K;L74+=y0a;if(json[L74]){$[g1o](json[X$C],function(table,filesIn){var q1y=p0i;q1y+=I__;var O_l=i4a;O_l+=l3Q;if(!Editor[X$C][table]){var g9L=X2g;g9L+=y0a;Editor[g9L][table]={};}$[O_l](Editor[q1y][table],filesIn);});}ids[I59](json[c7l][W8x]);if(counter < files[f6V] - q31){var w1b=z0g;w1b+=r0N;counter++;reader[w1b](files[counter]);}else {var J5M=o5d;J5M+=S$W;J5M+=S$W;completeCallback[J5M](editor,ids);if(submit){editor[R1K]();}}}progressCallback(conf);},type:M3J,xhr:function(){var e3r="onloadend";var H4P="ajaxSettings";var N6A="onprogress";var L1k=H60;L1k+=e6V;L1k+=J3_;var a9a=Z5WrO.w$8;a9a+=C_d;a9a+=o4O;var xhr=$[H4P][a9a]();if(xhr[L1k]){xhr[c7l][N6A]=function(e){var N2j="toF";var j1y=':';var V_G="lengthComputable";var j0Z="xe";var l6$='%';var W9$="loaded";var r_q="total";if(e[V_G]){var C24=M15;C24+=V47;var g3$=N2j;g3$+=m9y;g3$+=j0Z;g3$+=Z5WrO[293400];var percent=(e[W9$] / e[r_q] * O7R)[g3$](s87) + l6$;progressCallback(conf,files[C24] === q31?percent:counter + j1y + files[f6V] + f9f + percent);}};xhr[c7l][e3r]=function(){var A5k="Proces";var H5j="ssingText";var m25=A5k;m25+=y0a;m25+=k$_;var L8t=w5c;L8t+=Z5WrO.t9K;L8t+=H5j;progressCallback(conf,conf[L8t] || m25);};}return xhr;}}));});};files=$[s14](files,function(val){p5T.Q1A();return val;});if(conf[L$n] !== undefined){var x6l=p_g;x6l+=f5I;files[J9l](conf[x6l],files[f6V]);}reader[m6z](files[s87]);}function factory(root,jq){var q8N="jquery";var J2g="docum";var k$M=Z5WrO[713];k$M+=Z5WrO.S9O;var O_T=J2g;O_T+=D9O;var is=f_Y;if(root && root[O_T]){window=root;document=root[Z5WrO.T6P];}if(jq && jq[k$M] && jq[Q2x][q8N]){$=jq;is=V0I;}p5T.Z7s();return is;}var DataTable$4=$[L4O][R61];var _inlineCounter=s87;function _actionClass(){var t8N="dCl";var B8h="Cla";var r1X="actions";var j34=Z5WrO.t9K;j34+=i$g;j34+=N2K;var k$F=L21;k$F+=Z5WrO.t9K;k$F+=Z5WrO.L$5;k$F+=x0B;var B0m=N6$;B0m+=f49;B0m+=D3P;B0m+=Z5WrO.t9K;var j9A=h1o;j9A+=Z5WrO.L$5;j9A+=E0B;j9A+=o4O;var P0c=Z5WrO[293400];P0c+=f49;P0c+=y9Z;var Z0b=l_$;Z0b+=Z5WrO[626711];var T_3=Z5WrO.K_g;T_3+=S$W;T_3+=o7h;T_3+=h4Y;var classesActions=this[T_3][r1X];var action=this[y0a][Z0b];var wrapper=$(this[P0c][j9A]);wrapper[n44]([classesActions[L2J],classesActions[p8v],classesActions[B0m]][J1V](f9f));if(action === k$F){var j9k=C4G;j9k+=N6z;var c2Q=J3_;c2Q+=t8N;c2Q+=Z5WrO.L$5;c2Q+=G6q;wrapper[c2Q](classesActions[j9k]);}else if(action === j34){wrapper[A_M](classesActions[p8v]);}else if(action === X1n){var v8k=z0g;v8k+=y9Z;v8k+=S81;v8k+=Z5WrO.t9K;var m48=J3_;m48+=Z5WrO[293400];m48+=B8h;m48+=G6q;wrapper[m48](classesActions[v8k]);}}function _ajax(data,success,error,submitParams){var H3G="exO";var m2F="param";var m$R="compl";var E$b="jo";var f1C="deleteBody";var C7C=/{id}/;var F_M="P";var O6h="laceme";var M3n="rl";var F3i='DELETE';var S9v='?';var a_3="comp";var S2z="teB";var u9_="complete";var P1X="dele";var U8H="dS";var X6D=/_id_/;var X98="replacements";var R4u=P1X;R4u+=S2z;R4u+=T3q;var D61=N2K;D61+=B5$;D61+=Z5WrO.t9K;var g9y=O0o;g9y+=Z5WrO.L$5;var v2h=M06;v2h+=S$W;v2h+=Z5WrO.L$5;v2h+=w8H;var O3h=o4O;O3h+=V$a;O3h+=s88;O3h+=Z5WrO.t9K;var c0L=O8W;c0L+=M3n;var S_V=o4O;S_V+=V$a;S_V+=O6h;S_V+=t9$;var r9b=E$b;r9b+=m9y;r9b+=Z5WrO.S9O;var W29=m9y;W29+=U8H;W29+=o4O;W29+=Z5WrO.K_g;var V_d=Z5WrO.L$5;V_d+=Z5WrO.c65;V_d+=Z5WrO.L$5;V_d+=Z5WrO.w$8;p5T.Z7s();var S1m=F_M;S1m+=b$9;S1m+=F0W;S1m+=X2z;var action=this[y0a][G6b];var thrown;var opts={complete:[function(xhr,text){var t1u="responseText";var R3G="resp";var o$5="ainObject";var p0t=400;var J02="nseJSON";var n4_=204;var S8E="pons";var S_2="responseJSON";var E4k="eText";var r9o=e7V;r9o+=q7O;r9o+=Y8C;var i3d=I9R;i3d+=S$W;i3d+=o$5;var E66=Z5WrO.S9O;E66+=O8W;E66+=S$W;E66+=S$W;var json=m3D;if(xhr[G9I] === n4_ || xhr[t1u] === E66){json={};}else {try{var b55=z0g;b55+=y0a;b55+=S8E;b55+=E4k;var M$Y=W__;M$Y+=N1_;M$Y+=y0a;M$Y+=Z5WrO.t9K;var U1G=R3G;U1G+=f49;U1G+=J02;json=xhr[U1G]?xhr[S_2]:JSON[M$Y](xhr[b55]);}catch(e){}}if($[i3d](json) || Array[r9o](json)){success(json,xhr[G9I] >= p0t,xhr);}else {error(xhr,text,thrown);}}],data:m3D,dataType:O8c,error:[function(xhr,text,err){p5T.Q1A();thrown=err;}],success:[],type:S1m};var a;var ajaxSrc=this[y0a][V_d];var id=action === D43 || action === X1n?pluck(this[y0a][r2S],W29)[r9b](F8i):m3D;if($[A5B](ajaxSrc) && ajaxSrc[action]){ajaxSrc=ajaxSrc[action];}if(typeof ajaxSrc === s8p){ajaxSrc[R5q](this,m3D,m3D,data,success,error);return;}else if(typeof ajaxSrc === Z5m){var m5_=u$N;m5_+=j4Y;m5_+=Z5WrO[713];if(ajaxSrc[m5_](f9f) !== -q31){var J6E=Z69;J6E+=S$W;var n4X=y0a;n4X+=W__;n4X+=S$W;n4X+=P4S;a=ajaxSrc[n4X](f9f);opts[C7b]=a[s87];opts[J6E]=a[q31];}else {opts[B39]=ajaxSrc;}}else {var optsCopy=$[D3A]({},ajaxSrc || ({}));if(optsCopy[u9_]){var o$q=a_3;o$q+=u_4;o$q+=x0B;var x$t=m$R;x$t+=W$y;opts[u9_][k$n](optsCopy[x$t]);delete optsCopy[o$q];}if(optsCopy[u2r]){var y71=Z5WrO.t9K;y71+=o4O;y71+=I5g;y71+=o4O;var w9e=Z5WrO.t9K;w9e+=q_n;w9e+=f49;w9e+=o4O;var F8w=Z5WrO.t9K;F8w+=q_n;F8w+=f49;F8w+=o4O;opts[F8w][k$n](optsCopy[w9e]);delete optsCopy[y71];}opts=$[D3A]({},opts,optsCopy);}if(opts[S_V]){var J2P=Z5WrO.t9K;J2P+=Z5WrO.L$5;J2P+=v67;$[J2P](opts[X98],function(key,repl){var n0Q='{';var c33='}';var s5$=O8W;s5$+=o4O;s5$+=S$W;opts[s5$]=opts[B39][J2U](n0Q + key + c33,repl[R5q](this,key,id,action,data));});}opts[c0L]=opts[B39][O3h](X6D,id)[v2h](C7C,id);if(opts[g9y]){var N06=e1x;N06+=Z5WrO.S9O;N06+=Z5WrO[293400];var N6K=h0J;N6K+=Z5WrO.K_g;N6K+=y5e;var l9T=Z5WrO[293400];l9T+=Z5WrO.L$5;l9T+=N2K;l9T+=Z5WrO.L$5;var isFn=typeof opts[l9T] === N6K;var newData=isFn?opts[g6F](data):opts[g6F];data=isFn && newData?newData:$[N06](V0I,data,newData);}opts[g6F]=data;if(opts[D61] === F3i && (opts[R4u] === undefined || opts[f1C] === V0I)){var w$5=m9y;w$5+=m5K;w$5+=H3G;w$5+=Z5WrO[713];var d2b=O8W;d2b+=o4O;d2b+=S$W;var params=$[m2F](opts[g6F]);opts[B39]+=opts[d2b][w$5](S9v) === -q31?S9v + params:T9n + params;delete opts[g6F];}$[V$_](opts);}function _animate(target,style,time,callback){var s8q="im";p5T.Z7s();var X7H=Z5WrO.L$5;X7H+=Z5WrO.S9O;X7H+=s8q;X7H+=N6z;var M9_=Z5WrO[713];M9_+=Z5WrO.S9O;if($[M9_][X7H]){var W5R=S2q;W5R+=y9Z;W5R+=N6z;var S9f=Y75;S9f+=R4j;target[S9f]()[W5R](style,time,callback);}else {var x2V=Z5WrO[166792];x2V+=m9y;x2V+=f49;x2V+=Z5WrO.S9O;var P3S=S$W;P3S+=Z5WrO.t9K;P3S+=B2f;P3S+=v4y;var k8z=q2W;k8z+=y0a;target[k8z](style);var scope=target[P3S] && target[f6V] > q31?target[s87]:target;if(typeof time === x2V){var I44=o5d;I44+=S$W;I44+=S$W;time[I44](scope);}else if(callback){callback[R5q](scope);}}}function _assembleMain(){var o5a="rmInfo";var A8M="oter";var y0o="bodyCo";var F8Z=T6g;F8Z+=Y0t;var T3C=T6g;p5T.Z7s();T3C+=o5a;var z80=A7y;z80+=l3Q;var y_Q=y0o;y_Q+=o79;var R0j=i8P;R0j+=t$u;var P3v=A7y;P3v+=Z5WrO.t9K;P3v+=Z5WrO.S9O;P3v+=Z5WrO[293400];var a8z=T6g;a8z+=A8M;var D7Q=h1o;D7Q+=A7y;D7Q+=Z5WrO.i5Y;var c8L=Z5WrO[293400];c8L+=f49;c8L+=y9Z;var dom=this[c8L];$(dom[D7Q])[X6o](dom[W$T]);$(dom[a8z])[P3v](dom[i1m])[j6E](dom[R0j]);$(dom[y_Q])[z80](dom[T3C])[j6E](dom[F8Z]);}function _blur(){var J9o="eB";var o6O="_clo";var m5V="onBlur";var h_G="bm";var M32=w_V;M32+=F05;var A3y=V0O;A3y+=p4W;var r39=Y5Y;r39+=J9o;r39+=S$W;r39+=Z69;var n5E=F$W;n5E+=Z5WrO.t9K;n5E+=D3P;n5E+=D9O;var B80=Z5WrO.t9K;B80+=g2T;B80+=h65;B80+=y0a;var opts=this[y0a][B80];var onBlur=opts[m5V];if(this[n5E](r39) === f_Y){return;}if(typeof onBlur === s8p){onBlur(this);}else if(onBlur === A3y){var A_k=y0a;A_k+=O8W;A_k+=h_G;A_k+=P4S;this[A_k]();}else if(onBlur === M32){var K5b=o6O;K5b+=y0a;K5b+=Z5WrO.t9K;this[K5b]();}}function _clearDynamicInfo(errorsOnly){var a5T="bleBottom";var t7k=z6A;t7k+=a5T;var e$3=V5y;e$3+=v67;var n7J=J_L;n7J+=o4O;n7J+=F00;var M4V=Z5WrO.t9K;M4V+=o4O;M4V+=I5g;M4V+=o4O;var e$I=v_k;e$I+=o53;if(errorsOnly === void s87){errorsOnly=f_Y;}if(!this[y0a]){return;}var errorClass=this[e$I][c7Y][M4V];var fields=this[y0a][O2h];$(W05 + errorClass,this[E9e][n7J])[n44](errorClass);$[e$3](fields,function(name,field){var v32=i45;v32+=o4O;field[v32](b_u);if(!errorsOnly){var P0s=x$8;P0s+=G6q;P0s+=X0S;P0s+=Z5WrO.t9K;field[P0s](b_u);}});this[u2r](b_u);if(!errorsOnly){this[W92](b_u);}this[y0a][w_u]=m3D;this[y0a][t7k]=f_Y;}function _close(submitComplete,mode){var a_n="or-f";var A3F="s.edit";var L_R="loseIcb";var L18="loseC";var h7w="focu";var q4P="cb";var v3x="closeCb";var i5q="reClose";var w9I="displaye";var l_K="ocus";var x1R=F$W;x1R+=Z5WrO.t9K;x1R+=o3F;x1R+=N2K;var z67=w9I;z67+=Z5WrO[293400];var V8f=h7w;V8f+=A3F;V8f+=a_n;V8f+=l_K;var X29=Z5WrO.K_g;X29+=L_R;var D69=W__;D69+=i5q;var G6c=K1p;G6c+=D3P;G6c+=Z5WrO.t9K;G6c+=A$P;var closed;if(this[G6c](D69) === f_Y){return;}if(this[y0a][v3x]){var J7D=Z5WrO.K_g;J7D+=L18;J7D+=Z5WrO[156815];closed=this[y0a][J7D](submitComplete,mode);this[y0a][v3x]=m3D;}if(this[y0a][X29]){var O8T=v_k;O8T+=L5Y;O8T+=S7f;O8T+=q4P;this[y0a][y8f]();this[y0a][O8T]=m3D;}$(L8c)[D6G](V8f);this[y0a][z67]=f_Y;this[x1R](O5r);if(closed){var c2a=Z5WrO.K_g;c2a+=e6V;c2a+=y0a;c2a+=Y57;var l2k=F$W;l2k+=r87;this[l2k](c2a,[closed]);}}function _closeReg(fn){var v9k="eCb";var J27=n0k;p5T.Z7s();J27+=v9k;this[y0a][J27]=fn;}function _crudArgs(arg1,arg2,arg3,arg4){var O3o="main";var P5x="oolean";var Y7b=Z5WrO[156815];Y7b+=P5x;var that=this;var title;var buttons;var show;var opts;if($[A5B](arg1)){opts=arg1;}else if(typeof arg1 === Y7b){show=arg1;opts=arg2;}else {title=arg1;buttons=arg2;show=arg3;opts=arg4;}if(show === undefined){show=V0I;}if(title){that[S8_](title);}if(buttons){var J6S=q86;J6S+=N2K;J6S+=p_z;J6S+=t$u;that[J6S](buttons);}return {maybeOpen:function(){p5T.Q1A();if(show){var V_0=f49;V_0+=h7T;V_0+=Z5WrO.S9O;that[V_0]();}},opts:$[D3A]({},this[y0a][U_v][O3o],opts)};}function _dataSource(name){var v1x="dataSources";var a6W=N2K;a6W+=Z5WrO.L$5;a6W+=x1A;p5T.Q1A();a6W+=Z5WrO.t9K;var args=[];for(var _i=q31;_i < arguments[f6V];_i++){args[_i - q31]=arguments[_i];}var dataSource=this[y0a][a6W]?Editor[v1x][R61]:Editor[v1x][f_u];var fn=dataSource[name];if(fn){return fn[n5i](this,args);}}function _displayReorder(includeFields){var j4J='displayOrder';var L2d="udeFie";var O4b="include";var g$G="formContent";var W65=l4D;W65+=Y57;var s7i=B33;s7i+=C_d;var j6A=j4$;j6A+=N2K;j6A+=Z5WrO.L$5;j6A+=v67;var g3s=y9Z;g3s+=b$H;g3s+=Z5WrO.t9K;var I8m=Z5WrO[293400];I8m+=f49;p5T.Q1A();I8m+=y9Z;var _this=this;var formContent=$(this[I8m][g$G]);var fields=this[y0a][O2h];var order=this[y0a][i22];var template=this[y0a][t2g];var mode=this[y0a][g3s] || b1_;if(includeFields){var q7E=O4b;q7E+=h8w;q7E+=w$q;q7E+=y0a;this[y0a][q7E]=includeFields;}else {var l_E=e2b;l_E+=L2d;l_E+=S$W;l_E+=v4L;includeFields=this[y0a][l_E];}formContent[O6X]()[j6A]();$[s7i](order,function(i,name){var y8T='editor-field[name="';var j48='[data-editor-template="';var u4y="weakInA";var H5V="aft";var I4W=F$W;I4W+=u4y;I4W+=q_n;I4W+=k_W;p5T.Q1A();if(_this[I4W](name,includeFields) !== -q31){if(template && mode === b1_){var u2l=Z5WrO.L$5;u2l+=W__;u2l+=h7T;u2l+=m5K;var w6z=m8V;w6z+=w6H;var E3i=H5V;E3i+=Z5WrO.t9K;E3i+=o4O;var l$I=Z5WrO[713];l$I+=C4z;template[l$I](y8T + name + x81)[E3i](fields[name][y4O]());template[G3D](j48 + name + w6z)[u2l](fields[name][y4O]());}else {var E6Z=Z5WrO.L$5;E6Z+=f96;E6Z+=l3Q;formContent[E6Z](fields[name][y4O]());}}});if(template && mode === b1_){var t7W=a7S;t7W+=m5K;t7W+=X2z;t7W+=f49;template[t7W](formContent);}this[a5N](j4J,[this[y0a][W65],this[y0a][G6b],formContent]);}function _edit(items,editFields,type,formOptions,setupDone){var c9l="Stri";var Q6T="_displayReor";var o92="difier";var v2Y='initEdit';var d93="der";var m$y="tyle";var C$H="itD";var U8u=D6n;U8u+=j4$;var h$H=Q6T;h$H+=d93;var s$c=U$e;s$c+=C_d;var q2e=Z5WrO.t9K;q2e+=Z5WrO.L$5;q2e+=Z5WrO.K_g;q2e+=C_d;var d2A=y9Z;d2A+=b$H;d2A+=Z5WrO.t9K;var u_g=x1A;u_g+=o0q;u_g+=G5_;var r2g=h_1;r2g+=k_W;var j2F=y0a;j2F+=m$y;var V6y=i3U;V6y+=y9Z;var v3O=Z5WrO.t9K;v3O+=Z5WrO[293400];v3O+=m9y;v3O+=N2K;var B7s=l_$;B7s+=Z5WrO[626711];var o64=C1j;o64+=o92;var W0_=Y57;W0_+=C$H;W0_+=y3x;var _this=this;var fields=this[y0a][O2h];var usedFields=[];var includeInOrder;var editData={};this[y0a][r2S]=editFields;this[y0a][W0_]=editData;this[y0a][o64]=items;this[y0a][B7s]=v3O;this[E9e][V6y][j2F][r2g]=u_g;this[y0a][d2A]=type;this[w7O]();$[q2e](fields,function(name,field){var N$$="multiRe";var T$x="multiValueCh";var R65="multiI";var G4N=R65;p5T.Q1A();G4N+=Z5WrO[293400];G4N+=y0a;var F3M=F$W;F3M+=T$x;F3M+=B_J;var i8b=B33;i8b+=C_d;var k_e=N$$;k_e+=h1G;field[k_e]();includeInOrder=f_Y;editData[name]={};$[i8b](editFields,function(idSrc,edit){p5T.Z7s();var H8g="displayFi";var h98="ullDefau";var A3d="romData";var Y9f="yFields";var R4g="ayFiel";if(edit[O2h][name]){var r_p=o4O;r_p+=j4R;var v2_=y0a;v2_+=Z5WrO.K_g;v2_+=R4j;v2_+=Z5WrO.t9K;var P3n=y0a;P3n+=s2h;P3n+=w8H;var r2E=e7V;r2E+=z4t;r2E+=o2v;var V9v=Z5WrO.S9O;V9v+=h98;V9v+=Z83;var P6r=S7V;P6r+=S$W;P6r+=X12;P6r+=A3d;var val=field[P6r](edit[g6F]);var nullDefault=field[V9v]();editData[name][idSrc]=val === m3D?b_u:Array[r2E](val)?val[P3n]():val;if(!formOptions || formOptions[v2_] === r_p){var s8S=i$g;s8S+=I5s;s8S+=Z5WrO.L$5;s8S+=Y9f;var c2Y=H8g;c2Y+=t9I;c2Y+=v4L;var k_1=Z5WrO[293400];k_1+=Z5WrO.t9K;k_1+=Z5WrO[713];field[C7W](idSrc,val === undefined || nullDefault && val === m3D?field[k_1]():val,f_Y);if(!edit[c2Y] || edit[s8S][name]){includeInOrder=V0I;}}else {var e1t=h_1;e1t+=R4g;e1t+=v4L;if(!edit[L5N] || edit[e1t][name]){field[C7W](idSrc,val === undefined || nullDefault && val === m3D?field[j5s]():val,f_Y);includeInOrder=V0I;}}}});field[F3M]();if(field[G4N]()[f6V] !== s87 && includeInOrder){var o05=W__;o05+=M0S;usedFields[o05](name);}});var currOrder=this[i22]()[o0B]();for(var i=currOrder[s$c] - q31;i >= s87;i--){var h3k=N2K;h3k+=f49;h3k+=c9l;h3k+=B2f;if($[H7Y](currOrder[i][h3k](),usedFields) === -q31){currOrder[J9l](i,q31);}}this[h$H](currOrder);this[a5N](v2Y,[pluck(editFields,U8u)[s87],pluck(editFields,z0t)[s87],items,type],function(){p5T.Q1A();var W9a="tMultiEdit";var C2i=m9y;C2i+=V_i;C2i+=W9a;var v8W=K1p;v8W+=f$E;_this[v8W](C2i,[editFields,items,type],function(){p5T.Q1A();setupDone();});});}function _event(trigger,args,promiseComplete){var Q6_="Event";var I1_="Ev";var D5H="triggerHandler";var D3_="res";var a93="gerHand";p5T.Q1A();var l2v='Cancelled';var B0y="ig";var k8j="ler";if(args === void s87){args=[];}if(promiseComplete === void s87){promiseComplete=undefined;}if(Array[z4s](trigger)){for(var i=s87,ien=trigger[f6V];i < ien;i++){var d4J=K1p;d4J+=D3P;d4J+=D9O;this[d4J](trigger[i],args);}}else {var E3P=W__;E3P+=o4O;E3P+=Z5WrO.t9K;var j2p=D3_;j2p+=N9x;var e=$[Q6_](trigger);$(this)[D5H](e,args);var result=e[j2p];if(trigger[d1L](E3P) === s87 && result === f_Y){var U4s=I1_;U4s+=Z5WrO.t9K;U4s+=A$P;var I7X=c9U;I7X+=B0y;I7X+=a93;I7X+=k8j;$(this)[I7X]($[U4s](trigger + l2v),args);}if(promiseComplete){if(result && typeof result === Z5WrO.k12 && result[G_g]){result[G_g](promiseComplete);}else {promiseComplete(result);}}return result;}}function _eventName(input){var G1U="toLowerCase";p5T.Q1A();var O_r="substring";var F0v=/^on([A-Z])/;var M0t=3;var g2s=y0a;g2s+=H0W;g2s+=P4S;var name;var names=input[g2s](f9f);for(var i=s87,ien=names[f6V];i < ien;i++){var U7v=V$7;U7v+=N2K;U7v+=Z5WrO.K_g;U7v+=C_d;name=names[i];var onStyle=name[U7v](F0v);if(onStyle){name=onStyle[q31][G1U]() + name[O_r](M0t);}names[i]=name;}return names[J1V](f9f);}function _fieldFromNode(node){var P3m=z_2;P3m+=w$q;P3m+=y0a;var foundField=m3D;$[g1o](this[y0a][P3m],function(name,field){var P8R=p0i;P8R+=Z5WrO.S9O;P8R+=Z5WrO[293400];var P4A=Z5WrO.S9O;P4A+=f49;P4A+=Z5WrO[293400];P4A+=Z5WrO.t9K;p5T.Z7s();if($(field[P4A]())[P8R](node)[f6V]){foundField=field;}});return foundField;}function _fieldNames(fieldNames){if(fieldNames === undefined){return this[O2h]();}else if(!Array[z4s](fieldNames)){return [fieldNames];}p5T.Q1A();return fieldNames;}function _focus(fieldsIn,focus){var W57='number';var o$H=/^jq:/;var F0e='div.DTE ';var h30=V$7;h30+=W__;var _this=this;if(this[y0a][G6b] === X1n){return;}var field;var fields=$[h30](fieldsIn,function(fieldOrName){p5T.Z7s();var w9l=z_2;w9l+=G5q;return typeof fieldOrName === Z5m?_this[y0a][w9l][fieldOrName]:fieldOrName;});if(typeof focus === W57){field=fields[focus];}else if(focus){var X87=Z5WrO.c65;X87+=I9m;X87+=F_K;var l3U=m9y;l3U+=O0i;l3U+=j4Y;l3U+=Z5WrO[713];if(focus[l3U](X87) === s87){var v9o=z0g;v9o+=v8h;v9o+=w8H;field=$(F0e + focus[v9o](o$H,b_u));}else {var q8g=Z5WrO[713];q8g+=t4h;q8g+=Z5WrO[293400];q8g+=y0a;field=this[y0a][q8g][focus];}}else {document[F99][B4B]();}this[y0a][w_u]=field;if(field){field[D9n]();}}function _formOptions(opts){var J$y="key";var M8B="tle";var s6Z="seIcb";var g69="boolea";var V2Q="canReturnSubmit";var n_s="dteInli";var d7M="unc";var F9D=w_V;F9D+=s6Z;var e_V=l3R;e_V+=Z5WrO.x6j;e_V+=H60;var z0x=J$y;z0x+=Z5WrO[293400];z0x+=h78;var t_a=f49;t_a+=Z5WrO.S9O;var Y2i=g69;Y2i+=Z5WrO.S9O;var x$O=Z5WrO[713];x$O+=d7M;x$O+=V6z;x$O+=c2S;var d24=V6z;d24+=M8B;var h8Q=W5L;h8Q+=n_s;p5T.Q1A();h8Q+=o$V;var _this=this;var that=this;var inlineCount=_inlineCounter++;var namespace=h8Q + inlineCount;this[y0a][V3R]=opts;this[y0a][k$U]=inlineCount;if(typeof opts[d24] === Z5m || typeof opts[S8_] === s8p){var g3e=V6z;g3e+=i5_;g3e+=Z5WrO.t9K;this[S8_](opts[S8_]);opts[g3e]=V0I;}if(typeof opts[W92] === Z5m || typeof opts[W92] === x$O){this[W92](opts[W92]);opts[W92]=V0I;}if(typeof opts[C7_] !== Y2i){var J5T=q86;J5T+=p9M;J5T+=y0a;this[J5T](opts[C7_]);opts[C7_]=V0I;}$(document)[t_a](z0x + namespace,function(e){var E7l="eElem";var k4V="canReturnSub";var H7t="tiv";var o2p="yed";var R6w="hich";var s71=Z5WrO[293400];s71+=e7V;s71+=v8h;s71+=o2p;var C29=J_L;C29+=R6w;if(e[C29] === T7E && _this[y0a][s71]){var Z4H=t33;Z4H+=H7t;Z4H+=E7l;Z4H+=D9O;var el=$(document[Z4H]);if(el){var X9X=k4V;X9X+=m46;X9X+=N2K;var field=_this[E_a](el);if(field && typeof field[X9X] === s8p && field[V2Q](el)){e[H0$]();}}}});$(document)[c2S](e_V + namespace,function(e){var l$f="nSub";var l9l=27;var W0N="_fieldFromN";var V30="onEsc";var a$6="tur";var Q0I="onR";var h5g="nEsc";var B3C="onReturn";var O$o="canRe";var k1G='button';var i5L="trigge";var D7R='.DTE_Form_Buttons';var L8z=39;var N4$="sc";var N4i="onE";var V0u="ton";var X8r=37;var h5w="bmit";var Q4r="urn";var g0E=l1J;g0E+=c_i;g0E+=Z5WrO.t9K;g0E+=Z5WrO[293400];var el=$(document[F99]);if(e[P$B] === T7E && _this[y0a][g0E]){var g$H=O$o;g$H+=a$6;g$H+=l$f;g$H+=p4W;var e_g=W0N;e_g+=L8X;var field=_this[e_g](el);if(field && typeof field[g$H] === s8p && field[V2Q](el)){if(opts[B3C] === g$c){var A$w=q8F;A$w+=P4S;e[H0$]();_this[A$w]();}else if(typeof opts[B3C] === s8p){var n7z=Q0I;n7z+=Z5WrO.p8I;n7z+=Q4r;e[H0$]();opts[n7z](_this,e);}}}else if(e[P$B] === l9l){var q0A=w_V;q0A+=F05;var F2J=f49;F2J+=h5g;var L_i=x1A;L_i+=O8W;L_i+=o4O;var i_n=N4i;i_n+=N4$;var U3r=R$n;U3r+=w2Y;U3r+=Z83;e[U3r]();if(typeof opts[i_n] === s8p){opts[V30](that,e);}else if(opts[V30] === L_i){var o9Y=Z5WrO[156815];o9Y+=j4j;o9Y+=o4O;that[o9Y]();}else if(opts[F2J] === q0A){that[p52]();}else if(opts[V30] === g$c){var T2_=W72;T2_+=h5w;that[T2_]();}}else if(el[j8R](D7R)[f6V]){var V0P=J_L;V0P+=C_d;V0P+=m9y;V0P+=v67;if(e[V0P] === X8r){var t9O=i5L;t9O+=o4O;var o_a=W__;o_a+=z0g;o_a+=D3P;el[o_a](k1G)[t9O](E5O);}else if(e[P$B] === L8z){var I55=m0C;I55+=V0u;var s1N=Z5WrO.S9O;s1N+=Z5WrO.t9K;s1N+=Z5WrO.w$8;s1N+=N2K;el[s1N](I55)[g2e](E5O);}}});this[y0a][F9D]=function(){var N0u='keyup';var Z2C=e2T;Z2C+=Z5WrO[713];p5T.Z7s();var G$k=J$y;G$k+=i$E;G$k+=x6f;var E8U=f49;E8U+=Z5WrO[713];E8U+=Z5WrO[713];$(document)[E8U](G$k + namespace);$(document)[Z2C](N0u + namespace);};return namespace;}function _inline(editFields,opts,closeCb){var c4L="_closeRe";var o6r="_preopen";var K1w="userAgent";var j6p="span></span></div>";var R5b="conte";var S6Y="_postope";var F9n="utTrigger";var r3g="_inputTrigger";var E73="_formOpti";var p2q='Edge/';var Z84="achFiel";var E_b="=\"wi";var P_f='.';var W7U="dth";var R_q="rmErro";var Y4y='" ';var j6Y="line";var V3s="<div class=\"DTE_Processi";var W6l='px"';var e7X="g_Indicator\"><";var e9X="iner";var C8I=x_9;C8I+=j6Y;var h2l=S6Y;h2l+=Z5WrO.S9O;var G3b=c1n;G3b+=g9r;var V2R=c4L;V2R+=k$T;var n7h=t64;n7h+=F9n;var u1P=m9y;u1P+=Z5WrO.S9O;u1P+=s2h;u1P+=o$V;var J3V=E73;J3V+=R_D;var z2q=S$W;z2q+=Z5WrO.t9K;z2q+=Z5WrO.S9O;z2q+=V47;var o43=c_U;o43+=Z5WrO.t9K;var _this=this;if(closeCb === void s87){closeCb=m3D;}var closed=f_Y;var classes=this[t5b][o43];var keys=Object[h_i](editFields);var editRow=editFields[keys[s87]];var lastAttachPoint;var elements=[];for(var i=s87;i < editRow[Z_8][z2q];i++){var t7_=G1P;t7_+=N2K;t7_+=C0K;var q5c=W__;q5c+=O8W;q5c+=y0a;q5c+=C_d;var B7n=Z5WrO.L$5;B7n+=O_V;B7n+=Z84;B7n+=v4L;var name_1=editRow[B7n][i][s87];elements[q5c]({field:this[y0a][O2h][name_1],name:name_1,node:$(editRow[t7_][i])});}var namespace=this[J3V](opts);var ret=this[o6r](u1P);if(!ret){return this;}for(var _i=s87,elements_1=elements;_i < elements_1[f6V];_i++){var m$v=i8P;m$v+=t$u;var a67=U$e;a67+=C_d;var Q$e=w_V;Q$e+=L_n;Q$e+=N2K;var W8w=p0i;W8w+=Z5WrO.t9K;W8w+=S$W;W8w+=Z5WrO[293400];var R82=Z5WrO[713];R82+=f49;R82+=R_q;R82+=o4O;var q2b=Z5WrO[293400];q2b+=f49;q2b+=y9Z;var E4E=A7y;E4E+=l3Q;var q26=L0B;q26+=Z5WrO[293400];var u3E=M06;u3E+=G1l;u3E+=w8H;var Q$U=S$W;Q$U+=x_9;Q$U+=Z5WrO.t9K;Q$U+=o4O;var P5I=Z5WrO[293400];P5I+=y__;P5I+=W5L;var Z0c=Z5WrO[713];Z0c+=x_9;Z0c+=Z5WrO[293400];var A$v=V3s;A$v+=Z5WrO.S9O;A$v+=e7X;A$v+=j6p;var j6l=S$W;j6l+=e9X;var j$X=m8V;j$X+=o7D;var f7j=K$Z;f7j+=f96;f7j+=Z5WrO.t9K;f7j+=o4O;var g3O=I03;g3O+=E_b;g3O+=W7U;g3O+=F_K;var O75=L6p;O75+=b$9;O75+=Z5WrO[713];var Y89=R5b;Y89+=Z5WrO.S9O;Y89+=N2K;Y89+=y0a;var Y5W=Z5WrO.S9O;Y5W+=f49;Y5W+=j4$;var el=elements_1[_i];var node=el[Y5W];el[O6X]=node[Y89]()[H5v]();var style=navigator[K1w][O75](p2q) !== -q31?g3O + node[p3E]() + W6l:b_u;node[j6E]($(D$9 + classes[f7j] + j$X + D$9 + classes[j6l] + Y4y + style + O0S + A$v + L7i + D$9 + classes[C7_] + J8g + L7i));node[Z0c](P5I + classes[Q$U][u3E](/ /g,P_f))[j6E](el[q26][y4O]())[E4E](this[q2b][R82]);var insertParent=$(el[W8w][y4O]())[Q$e](o6k);if(insertParent[a67]){lastAttachPoint=insertParent;}if(opts[m$v]){var b1e=Z5WrO.L$5;b1e+=E0B;b1e+=Z5WrO.S9O;b1e+=Z5WrO[293400];var Q$8=q86;Q$8+=I8W;Q$8+=Z5WrO.S9O;Q$8+=y0a;var o7d=Z5WrO[293400];o7d+=m9y;o7d+=D3P;o7d+=W5L;node[G3D](o7d + classes[Q$8][J2U](/ /g,P_f))[b1e](this[E9e][C7_]);}}var submitClose=this[n7h](g$c,opts,lastAttachPoint);var cancelClose=this[r3g](Y5L,opts,lastAttachPoint);this[V2R](function(submitComplete,action){var O4e="inl";var t3F="DynamicInfo";var x1Z="_clear";var Q3Z="forEa";var u6s=O4e;u6s+=x_9;u6s+=Z5WrO.t9K;var h7O=x1Z;h7O+=t3F;var c7C=Z5WrO.t9K;c7C+=Z5WrO[293400];c7C+=m9y;c7C+=N2K;var N5r=e2T;N5r+=Z5WrO[713];closed=V0I;$(document)[N5r](i5v + namespace);if(!submitComplete || action !== c7C){var G2y=Q3Z;G2y+=Z5WrO.K_g;G2y+=C_d;elements[G2y](function(el){var S$c="ildren";var y3g=v67;y3g+=S$c;var s$J=Z5WrO.K_g;s$J+=f49;s$J+=o4g;s$J+=t9$;var o0t=Z5WrO.S9O;o0t+=f49;o0t+=Z5WrO[293400];o0t+=Z5WrO.t9K;el[o0t][s$J]()[H5v]();el[y4O][j6E](el[y3g]);});}submitClose();cancelClose();_this[h7O]();p5T.Q1A();if(closeCb){closeCb();}return u6s;});setTimeout(function(){var F_e="eyd";var x4n="moused";var z7R='addBack';var j7w="ddBack";var o_j=v_k;o_j+=m9y;o_j+=u6N;var M0c=f49;M0c+=Z5WrO.S9O;var T$U=G5_;T$U+=F_e;T$U+=h78;var t7V=f49;t7V+=Z5WrO.S9O;var t2d=x4n;t2d+=f49;t2d+=x6f;var g4R=Z5WrO.L$5;g4R+=j7w;if(closed){return;}var back=$[Q2x][g4R]?z7R:T8Q;var target;p5T.Q1A();$(document)[c2S](t2d + namespace,function(e){var R0Q=m_3;R0Q+=o4O;R0Q+=k$T;R0Q+=Z5WrO.p8I;target=e[R0Q];})[t7V](T$U + namespace,function(e){p5T.Q1A();target=e[a6D];})[M0c](o_j + namespace,function(e){var G6k="arents";var isIn=f_Y;for(var _i=s87,elements_2=elements;_i < elements_2[f6V];_i++){var k_k=W__;k_k+=G6k;var U5H=h78;U5H+=y0a;var el=elements_2[_i];if(el[c7Y][Y2M](U5H,target) || $[H7Y](el[y4O][s87],$(target)[k_k]()[back]()) !== -q31){isIn=V0I;}}if(!isIn){var w2j=K1J;w2j+=o4O;_this[w2j]();}});},s87);this[v0F]($[w1F](elements,function(el){p5T.Z7s();return el[c7Y];}),opts[G3b]);this[h2l](C8I,V0I);}function _inputTrigger(type,opts,insertPoint){var u$v="closest";var l$P="mbe";var q5o="H";var F3W='Trigger';var X4d="dre";var w8D='click.dte-';var a9M="chil";var x1d=Z5WrO.L$5;x1d+=W__;x1d+=D3K;x1d+=Z5WrO[293400];var Z24=Z5WrO[293400];Z24+=Z5WrO.p8I;Z24+=C0K;var c6i=S$W;c6i+=Z5WrO.t9K;c6i+=Z5WrO.S9O;c6i+=V47;p5T.Z7s();var Y7C=Z5WrO.S9O;Y7C+=O8W;Y7C+=l$P;Y7C+=o4O;var S$p=q5o;S$p+=N2K;S$p+=H5K;var _this=this;var trigger=opts[type + F3W];var html=opts[type + S$p];var event=w8D + type;var tr=$(insertPoint)[u$v](o6k);if(trigger === undefined){return function(){};}if(typeof trigger === Y7C){var D_z=S$W;D_z+=Z5WrO.t9K;D_z+=L2p;D_z+=C_d;var r1k=a9M;r1k+=X4d;r1k+=Z5WrO.S9O;var kids=tr[r1k]();trigger=trigger < s87?kids[kids[D_z] + trigger]:kids[trigger];}var children=$(trigger,tr)[c6i]?Array[D6w][o0B][R5q]($(trigger,tr)[s87][a47]):[];$(children)[Z24]();var triggerEl=$(trigger,tr)[c2S](event,function(e){e[E$_]();p5T.Q1A();if(type === Y5L){var g6m=w_V;g6m+=F05;_this[g6m]();}else {_this[R1K]();}})[x1d](html);return function(){var V_g=p96;V_g+=f2$;var Q$z=v7F;Q$z+=W__;Q$z+=N2K;Q$z+=Z5WrO.x6j;var H77=f49;H77+=Z5WrO[713];H77+=Z5WrO[713];triggerEl[H77](event)[Q$z]()[V_g](children);};}function _optionsUpdate(json){var L1T=f49;p5T.Q1A();L1T+=i3z;L1T+=m9y;L1T+=R_D;var that=this;if(json && json[L1T]){var D8S=p0i;D8S+=u0S;D8S+=y0a;$[g1o](this[y0a][D8S],function(name,field){var Z9c=u$2;p5T.Z7s();Z9c+=t$u;if(json[Z9c][name] !== undefined){var J35=Z5WrO.L$5;J35+=O4L;var w70=Z5WrO[293400];w70+=N2K;var fieldInst=that[c7Y](name);if(fieldInst[w70] && fieldInst[B8L]()[J35][B39]()){return;}if(fieldInst && fieldInst[Z$W]){var y9M=f49;y9M+=i3z;y9M+=f7T;y9M+=t$u;var I4n=H60;I4n+=Z5WrO[293400];I4n+=N6z;fieldInst[I4n](json[y9M][name]);}}});}}function _message(el,msg,title,fn){var t20="non";var w8X="fad";var A8f="moveAttr";var T20="ayed";var x10="tml";var A7B="fadeOut";p5T.Q1A();var S_S="functi";var Q5C=S_S;Q5C+=f49;Q5C+=Z5WrO.S9O;var canAnimate=$[Q2x][i1v]?V0I:f_Y;if(title === undefined){title=f_Y;}if(!fn){fn=function(){};}if(typeof msg === Q5C){var t0C=N2K;t0C+=a4_;t0C+=Z5WrO.t9K;var h6L=q7O;h6L+=W__;h6L+=m9y;msg=msg(this,new DataTable$4[h6L](this[y0a][t0C]));}el=$(el);if(canAnimate){var A5H=y0a;A5H+=N2K;A5H+=f49;A5H+=W__;el[A5H]();}if(!msg){if(this[y0a][o1l] && canAnimate){el[A7B](function(){el[f_u](b_u);p5T.Q1A();fn();});}else {var q1u=t20;q1u+=Z5WrO.t9K;var N8v=i$g;N8v+=I5s;N8v+=Z5WrO.L$5;N8v+=Z5WrO.x6j;var J6s=C_d;J6s+=x10;el[J6s](b_u)[Q8G](N8v,q1u);fn();}if(title){var M1R=N2K;M1R+=P4S;M1R+=S$W;M1R+=Z5WrO.t9K;var U$g=z0g;U$g+=A8f;el[U$g](M1R);}}else {var S6U=i$g;S6U+=f1T;S6U+=S$W;S6U+=T20;fn();if(this[y0a][S6U] && canAnimate){var K8_=w8X;K8_+=Z5WrO.t9K;K8_+=L1h;el[f_u](msg)[K8_]();}else {var D2e=Z5WrO[156815];D2e+=e6V;D2e+=Z5WrO.K_g;D2e+=G5_;var J0P=Z5WrO[293400];J0P+=d7G;J0P+=G1l;J0P+=Z5WrO.x6j;el[f_u](msg)[Q8G](J0P,D2e);}if(title){var D2$=Z5WrO.L$5;D2$+=N2K;D2$+=N2K;D2$+=o4O;el[D2$](a5A,msg);}}}function _multiInfo(){var n8L="isMulti";p5T.Q1A();var i7J="Editable";var s0Y="Valu";var X4Z="includeFi";var L3l=X4Z;L3l+=d$y;var r6G=z_2;r6G+=G5q;var fields=this[y0a][r6G];var include=this[y0a][L3l];var show=V0I;var state;if(!include){return;}for(var i=s87,ien=include[f6V];i < ien;i++){var t4c=n8L;t4c+=s0Y;t4c+=Z5WrO.t9K;var U5d=r36;U5d+=i7J;var field=fields[include[i]];var multiEditable=field[U5d]();if(field[z4d]() && multiEditable && show){state=V0I;show=f_Y;}else if(field[t4c]() && !multiEditable){state=V0I;}else {state=f_Y;}fields[include[i]][j9w](state);}}function _nestedClose(cb){var L20="callback";var W_i="pop";var disCtrl=this[y0a][G5S];var show=disCtrl[E3N];if(!show || !show[f6V]){if(cb){cb();}}else if(show[f6V] > q31){var F4S=A7y;F4S+=Z5WrO.t9K;F4S+=Z5WrO.S9O;F4S+=Z5WrO[293400];var u6b=Z5WrO[293400];u6b+=N2K;u6b+=Z5WrO.t9K;show[W_i]();var last=show[show[f6V] - q31];if(cb){cb();}this[y0a][G5S][t2H](last[u6b],last[F4S],last[L20]);}else {var k7W=Z5WrO.K_g;k7W+=e6V;k7W+=y0a;k7W+=Z5WrO.t9K;this[y0a][G5S][k7W](this,cb);show[f6V]=s87;}}function _nestedOpen(cb,nest){var n0V="how";var b50=J_L;b50+=X4r;b50+=f96;b50+=Z5WrO.i5Y;var X9R=J_L;X9R+=M$f;X9R+=W__;X9R+=Z5WrO.i5Y;var X_A=W__;X_A+=O8W;X_A+=y0a;X_A+=C_d;var p7b=F$W;p7b+=y0a;p7b+=n0V;var disCtrl=this[y0a][G5S];if(!disCtrl[p7b]){var r92=L$7;r92+=C_d;r92+=f49;r92+=J_L;disCtrl[r92]=[];}if(!nest){var H0U=L$7;H0U+=C_d;H0U+=j4R;disCtrl[H0U][f6V]=s87;}disCtrl[E3N][X_A]({append:this[E9e][X9R],callback:cb,dte:this});this[y0a][G5S][t2H](this,this[E9e][b50],cb);}function _postopen(type,immediate){var D$B='submit.editor-internal';var E4v="captureFocus";var a4i="ayContr";var a8H="itor-internal";var g3Q='focus.editor-focus';var r$N="oller";var k7y="submit.ed";var z6K=R4j;z6K+=Z5WrO.t9K;z6K+=Z5WrO.S9O;var p$P=I1B;p$P+=D9O;var m_H=q86;m_H+=b5z;m_H+=S$W;m_H+=Z5WrO.t9K;var k3c=k7y;k3c+=a8H;var c2w=f49;c2w+=Z5WrO.S9O;var L27=f49;L27+=Z5WrO[713];L27+=Z5WrO[713];var a5n=Z5WrO[713];a5n+=f49;a5n+=o4O;a5n+=y9Z;var Z2Y=l1J;Z2Y+=H0W;Z2Y+=a4i;Z2Y+=r$N;var _this=this;var focusCapture=this[y0a][Z2Y][E4v];if(focusCapture === undefined){focusCapture=V0I;}$(this[E9e][a5n])[L27](D$B)[c2w](k3c,function(e){var V3w=R$n;V3w+=w2Y;p5T.Z7s();V3w+=Z83;e[V3w]();});if(focusCapture && (type === b1_ || type === m_H)){var v5G=f49;v5G+=Z5WrO.S9O;$(L8c)[v5G](g3Q,function(){p5T.Q1A();var c3r="Element";var r1q="Foc";var s5d="activ";var U6g="ents";var t0R="lement";var f9u="par";var Q_E="active";var S9i=u_4;S9i+=Z5WrO.S9O;S9i+=k$T;S9i+=v4y;var V8y=f7M;V8y+=e6w;var d5I=f9u;d5I+=U6g;var T3b=Q_E;T3b+=k8Q;T3b+=t0R;var A7j=W5L;A7j+=a5$;A7j+=k8Q;var z_5=s5d;z_5+=Z5WrO.t9K;z_5+=c3r;if($(document[z_5])[j8R](A7j)[f6V] === s87 && $(document[T3b])[d5I](V8y)[S9i] === s87){var Q4A=h1G;Q4A+=r1q;Q4A+=g9r;if(_this[y0a][Q4A]){_this[y0a][w_u][D9n]();}}});}this[H_O]();this[p$P](z6K,[type,this[y0a][G6b]]);if(immediate){this[a5N](L2K,[type,this[y0a][G6b]]);}return V0I;}function _preopen(type){var n_B="namicInfo";var x30="_clearDy";var o3X='cancelOpen';var B88="Icb";var r1b="preO";var Z7P=x30;Z7P+=n_B;var o3n=t33;o3n+=V6z;o3n+=f49;o3n+=Z5WrO.S9O;p5T.Z7s();var d9i=r1b;d9i+=D3K;if(this[a5N](d9i,[type,this[y0a][o3n]]) === f_Y){var n4L=w_V;n4L+=y0a;n4L+=Z5WrO.t9K;n4L+=B88;var l5_=y9Z;l5_+=f49;l5_+=Z5WrO[293400];l5_+=Z5WrO.t9K;var p_F=I1B;p_F+=D9O;this[w$W]();this[p_F](o3X,[type,this[y0a][G6b]]);if((this[y0a][N9M] === c8M || this[y0a][l5_] === s8M) && this[y0a][n4L]){this[y0a][y8f]();}this[y0a][y8f]=m3D;return f_Y;}this[Z7P](V0I);this[y0a][o1l]=type;return V0I;}function _processing(processing){var T6O="toggleClass";var j_x="tive";var Q9e=i$g;Q9e+=D3P;p5T.Z7s();Q9e+=f7M;Q9e+=k8Q;var F37=t33;F37+=j_x;var procClass=this[t5b][J3I][F37];$([Q9e,this[E9e][i4u]])[T6O](procClass,processing);this[y0a][J3I]=processing;this[a5N](R9Z,[processing]);}function _noProcessing(args){var V3$="essing-fi";var i6U=Z5WrO.t9K;i6U+=Z5WrO.L$5;i6U+=v67;var processing=f_Y;$[i6U](this[y0a][O2h],function(name,field){p5T.Z7s();if(field[J3I]()){processing=V0I;}});if(processing){var P_6=w5c;P_6+=V3$;P_6+=t9I;P_6+=Z5WrO[293400];var q5V=f49;q5V+=Z5WrO.S9O;q5V+=Z5WrO.t9K;this[q5V](P_6,function(){var t5d="ubm";p5T.Z7s();if(this[M7M](args) === V0I){var c9o=L$7;c9o+=t5d;c9o+=m9y;c9o+=N2K;this[c9o][n5i](this,args);}});}return !processing;}function _submit(successCallback,errorCallback,formatdata,hide){var w7G='preSubmit';var w5m="essin";var Y9C='Field is still processing';var g1I="chang";var B6D="tionNam";var j9X="ction";var o2D=16;var z16="unction";var K8I="nCom";var i6P="_proc";var T4$="nged";var E9W="ple";var R7Z="editData";var m1I="lIfCha";var w2I=i4a;w2I+=Z5WrO.t9K;w2I+=m5K;var d_F=Z5WrO.t9K;d_F+=Z5WrO[293400];d_F+=P4S;var t0c=L21;t0c+=Z5WrO.t9K;t0c+=Z5WrO.L$5;t0c+=x0B;var s1W=t33;s1W+=B6D;s1W+=Z5WrO.t9K;var _this=this;var changed=f_Y;var allData={};var changedData={};var setBuilder=dataSet;var fields=this[y0a][O2h];var editCount=this[y0a][k$U];var editFields=this[y0a][r2S];var editData=this[y0a][R7Z];var opts=this[y0a][V3R];var changedSubmit=opts[R1K];var submitParamsLocal;if(this[M7M](arguments) === f_Y){Editor[u2r](Y9C,o2D,f_Y);return;}var action=this[y0a][G6b];var submitParams={data:{}};submitParams[this[y0a][s1W]]=action;if(action === t0c || action === d_F){var A69=g1I;A69+=Z5WrO.t9K;A69+=Z5WrO[293400];var n9U=c1L;n9U+=m1I;n9U+=T4$;var I3m=Z5WrO.L$5;I3m+=S$W;I3m+=S$W;$[g1o](editFields,function(idSrc,edit){var q7r="isEmp";var B4L="jec";var z6v="tyOb";var r8p=q7r;r8p+=z6v;r8p+=B4L;r8p+=N2K;var allRowData={};var changedRowData={};$[g1o](fields,function(name,field){var t46="ount";var N4K="-man";var k5z="dexOf";var N$V="valFromDat";var L05="submittabl";var i_h='[]';var P7v="y-c";var E14=/\[.*$/;p5T.Z7s();var i2B=L05;i2B+=Z5WrO.t9K;var u1l=p0i;u1l+=Z5WrO.t9K;u1l+=w$q;u1l+=y0a;if(edit[u1l][name] && field[i2B]()){var h0u=Z5WrO.t9K;h0u+=Z5WrO[293400];h0u+=m9y;h0u+=N2K;var U55=N4K;U55+=P7v;U55+=t46;var M3Z=x_9;M3Z+=k5z;var B9i=p50;B9i+=k$T;var multiGet=field[w8F]();var builder=setBuilder(name);if(multiGet[idSrc] === undefined){var p8g=Z5WrO[293400];p8g+=G1P;p8g+=Z5WrO.L$5;var j6u=N$V;j6u+=Z5WrO.L$5;var originalVal=field[j6u](edit[p8g]);builder(allRowData,originalVal);return;}var value=multiGet[idSrc];var manyBuilder=Array[z4s](value) && typeof name === B9i && name[M3Z](i_h) !== -q31?setBuilder(name[J2U](E14,b_u) + U55):m3D;builder(allRowData,value);if(manyBuilder){var y3u=S$W;y3u+=Z5WrO.t9K;y3u+=b9K;manyBuilder(allRowData,value[y3u]);}if(action === h0u && (!editData[name] || !field[b0T](value,editData[name][idSrc]))){builder(changedRowData,value);changed=V0I;if(manyBuilder){manyBuilder(changedRowData,value[f6V]);}}}});if(!$[G62](allRowData)){allData[idSrc]=allRowData;}if(!$[r8p](changedRowData)){changedData[idSrc]=changedRowData;}});if(action === Q9X || changedSubmit === I3m || changedSubmit === n9U && changed){var F1d=Z5WrO[293400];F1d+=Z5WrO.L$5;F1d+=N2K;F1d+=Z5WrO.L$5;submitParams[F1d]=allData;}else if(changedSubmit === A69 && changed){submitParams[g6F]=changedData;}else {var G2d=i6P;G2d+=w5m;G2d+=k$T;var w4Q=Z5WrO[713];w4Q+=z16;var d0r=f49;d0r+=K8I;d0r+=E9W;d0r+=x0B;var R4x=Z5WrO.L$5;R4x+=j9X;this[y0a][R4x]=m3D;if(opts[d0r] === O5r && (hide === undefined || hide)){this[T2u](f_Y);}else if(typeof opts[u1i] === w4Q){opts[u1i](this);}if(successCallback){var q9k=Z5WrO.K_g;q9k+=c1L;q9k+=S$W;successCallback[q9k](this);}this[G2d](f_Y);this[a5N](V2D);return;}}else if(action === X1n){$[g1o](editFields,function(idSrc,edit){p5T.Z7s();var I0u=t44;I0u+=m_3;var Q1k=Z5WrO[293400];Q1k+=G1P;Q1k+=Z5WrO.L$5;submitParams[Q1k][idSrc]=edit[I0u];});}submitParamsLocal=$[w2I](V0I,{},submitParams);if(formatdata){formatdata(submitParams);}this[a5N](w7G,[submitParams,action],function(result){var P6X="_submitTa";var V6b="_process";p5T.Q1A();var D0Y="_ajax";if(result === f_Y){var m4v=V6b;m4v+=k$_;_this[m4v](f_Y);}else {var U_7=P6X;U_7+=Z5WrO[156815];U_7+=u_4;var H5J=a11;H5J+=Z5WrO.L$5;H5J+=Z5WrO.w$8;var submitWire=_this[y0a][H5J]?_this[D0Y]:_this[U_7];submitWire[R5q](_this,submitParams,function(json,notGood,xhr){var K_t="ubmitSu";var C3W="cces";var x9X=L$7;x9X+=K_t;x9X+=C3W;p5T.Z7s();x9X+=y0a;_this[x9X](json,notGood,submitParams,submitParamsLocal,_this[y0a][G6b],editCount,hide,successCallback,errorCallback,xhr);},function(xhr,err,thrown){var z7M="_submitError";var l5H=t33;l5H+=N2K;l5H+=m9y;l5H+=c2S;_this[z7M](xhr,err,thrown,errorCallback,submitParams,_this[y0a][l5H]);},submitParams);}});}function _submitTable(data,success,error,submitParams){var W1q="urce";var A3h="mod";var n7t="rc";var W2F=o4O;W2F+=C_i;var r2X=m9y;r2X+=Z5WrO[293400];r2X+=F0W;r2X+=n7t;var action=data[G6b];var out={data:[]};var idGet=dataGet(this[y0a][p6n]);var idSet=dataSet(this[y0a][r2X]);if(action !== W2F){var h4u=t44;h4u+=m_3;var d5t=z1G;d5t+=W1q;var Z$x=V3r;Z$x+=p0i;Z$x+=Z5WrO.t9K;Z$x+=o4O;var w$t=c7Y;w$t+=y0a;var P8S=y9Z;P8S+=Z5WrO.L$5;P8S+=m9y;P8S+=Z5WrO.S9O;var u9C=A3h;u9C+=Z5WrO.t9K;var originalData_1=this[y0a][u9C] === P8S?this[D9p](w$t,this[Z$x]()):this[d5t](i6X,this[u$I]());$[g1o](data[h4u],function(key,vals){var j0x="ring";var n3m="St";var toSave;var extender=extendDeepObjShallowArr;if(action === D43){var rowData=originalData_1[key][g6F];toSave=extender({},rowData);toSave=extender(toSave,vals);}else {toSave=extender({},vals);}var overrideId=idGet(toSave);p5T.Z7s();if(action === Q9X && overrideId === undefined){var D0y=N2K;D0y+=f49;D0y+=n3m;D0y+=j0x;idSet(toSave,+new Date() + key[D0y]());}else {idSet(toSave,overrideId);}out[g6F][I59](toSave);});}success(out);}function _submitSuccess(json,notGood,submitParams,submitParamsLocal,action,editCount,hide,successCallback,errorCallback,xhr){var q94="_dataSourc";var m4g="rea";var K84="rce";var y8S="taSou";var o_y='postEdit';var H51="rors";var o99="plete";var u37="ors";var K10='setData';var L0H="onC";var D5y='postRemove';var t5M='commit';var f87='submitUnsuccessful';var K7n="urc";var Y_6="fieldE";var a$D="preCrea";var g5V="ataSource";var U26='prep';var G_S="br";var m_U='postCreate';var e_x='submitSuccess';var d7L="_d";var m2b="rro";var W$7="_dataS";var y6j="mmi";var K5t="Count";var v$t='preRemove';var g5m="_data";var P8d="fieldErr";var r7e="dEr";var r3m="Sou";var C9B="onCom";var Z9_='preEdit';var U7E=K1p;U7E+=D3P;U7E+=Z5WrO.t9K;U7E+=A$P;var h_2=u9W;h_2+=f49;h_2+=D3R;var W1L=P8d;W1L+=u37;var m0K=Y_6;m0K+=m2b;m0K+=o4O;m0K+=y0a;var L5A=F$W;L5A+=r7C;L5A+=Z5WrO.t9K;L5A+=A$P;var e0x=N7M;e0x+=v18;var O7g=p0i;O7g+=t9I;O7g+=v4L;var _this=this;var that=this;var setData;var fields=this[y0a][O7g];var opts=this[y0a][e0x];var modifier=this[y0a][u$I];this[L5A](L9k,[json,submitParams,action,xhr]);if(!json[u2r]){json[u2r]=b_u;}if(!json[m0K]){var q8e=z_2;q8e+=S$W;q8e+=r7e;q8e+=H51;json[q8e]=[];}if(notGood || json[u2r] || json[W1L][f6V]){var u9s=r1g;u9s+=A$P;var t8n=K5V;t8n+=G_S;t8n+=o7D;var globalError_1=[];if(json[u2r]){var m7a=Z5WrO.t9K;m7a+=o4O;m7a+=I5g;m7a+=o4O;globalError_1[I59](json[m7a]);}$[g1o](json[l6O],function(i,err){var P7U="nim";p5T.Z7s();var o$b="onFieldError";var L1L='Error';var g7U=': ';var R$V="bodyContent";var C8e=500;var y$8="played";var I$t='Unknown field: ';var S4P=l1J;S4P+=y$8;var field=fields[err[A$O]];if(!field){throw new Error(I$t + err[A$O]);}else if(field[S4P]()){field[u2r](err[G9I] || L1L);if(i === s87){var d6c=h0J;d6c+=j0X;d6c+=Z5WrO[626711];if(opts[o$b] === E5O){var n9H=Z5WrO[713];n9H+=o0q;n9H+=g9r;var x7I=N2K;x7I+=R4j;var V_h=q4F;V_h+=Z5WrO.t9K;var i$u=F$W;i$u+=Z5WrO.L$5;i$u+=P7U;i$u+=N6z;_this[i$u]($(_this[E9e][R$V]),{scrollTop:$(field[V_h]())[i5X]()[x7I]},C8e);field[n9H]();}else if(typeof opts[o$b] === d6c){opts[o$b](_this,err);}}}else {var L44=k8Q;L44+=m2b;L44+=o4O;var f5x=W__;f5x+=M0S;globalError_1[f5x](field[A$O]() + g7U + (err[G9I] || L44));}});this[u2r](globalError_1[J1V](t8n));this[u9s](f87,[json]);if(errorCallback){errorCallback[R5q](that,json);}}else {var B1q=Y57;B1q+=P4S;B1q+=K5t;var U35=o4O;U35+=C_i;var o44=Y57;o44+=m9y;o44+=N2K;var c2Z=Z5WrO[293400];c2Z+=G1P;c2Z+=Z5WrO.L$5;var store={};if(json[c2Z] && (action === Q9X || action === o44)){var n9h=W$7;n9h+=G1h;n9h+=K84;var t72=M15;t72+=k$T;t72+=v4y;var G0X=q94;G0X+=Z5WrO.t9K;this[G0X](U26,action,modifier,submitParamsLocal,json,store);for(var _i=s87,_a=json[g6F];_i < _a[t72];_i++){var I2P=q9I;I2P+=N2K;var R1z=K1p;R1z+=o3F;R1z+=N2K;var V8D=m9y;V8D+=Z5WrO[293400];var data=_a[_i];setData=data;var id=this[D9p](V8D,data);this[R1z](K10,[json,data,action]);if(action === Q9X){var F6B=Z5WrO.K_g;F6B+=m4g;F6B+=N2K;F6B+=Z5WrO.t9K;var X9e=W$7;X9e+=P4f;var p_$=a$D;p_$+=x0B;this[a5N](p_$,[json,data,id]);this[X9e](Q9X,fields,data,store);this[a5N]([F6B,m_U],[json,data,id]);}else if(action === I2P){var V5E=Z5WrO.t9K;V5E+=Z5WrO[293400];V5E+=m9y;V5E+=N2K;var N3k=q9I;N3k+=N2K;var V0d=g5m;V0d+=r3m;V0d+=K84;this[a5N](Z9_,[json,data,id]);this[V0d](N3k,modifier,fields,data,store);this[a5N]([V5E,o_y],[json,data,id]);}}this[n9h](t5M,action,modifier,json[g6F],store);}else if(action === U35){var M_K=O7a;M_K+=y6j;M_K+=N2K;var W5b=z1G;W5b+=K7n;W5b+=Z5WrO.t9K;var U4g=m9y;U4g+=Z5WrO[293400];U4g+=y0a;var q95=o4O;q95+=Z5WrO.t9K;q95+=T7T;var B8I=d7L;B8I+=g5V;var I$b=F$W;I$b+=u0u;I$b+=Z5WrO.S9O;I$b+=N2K;var L0Y=W__;L0Y+=z0g;L0Y+=W__;var z7b=x2l;z7b+=y8S;z7b+=K84;this[z7b](L0Y,action,modifier,submitParamsLocal,json,store);this[I$b](v$t,[json,this[J2J]()]);this[B8I](q95,modifier,fields,store);this[a5N]([X1n,D5y],[json,this[U4g]()]);this[W5b](M_K,action,modifier,json[g6F],store);}if(editCount === this[y0a][B1q]){var Q93=L0H;Q93+=Y72;Q93+=o99;var D_5=C9B;D_5+=H0W;D_5+=Z5WrO.t9K;D_5+=x0B;var sAction=this[y0a][G6b];this[y0a][G6b]=m3D;if(opts[D_5] === O5r && (hide === undefined || hide)){var m58=Z5WrO[293400];m58+=Z5WrO.L$5;m58+=N2K;m58+=Z5WrO.L$5;this[T2u](json[m58]?V0I:f_Y,sAction);}else if(typeof opts[Q93] === s8p){opts[u1i](this);}}if(successCallback){successCallback[R5q](that,json);}this[a5N](e_x,[json,setData,action]);}this[h_2](f_Y);this[U7E](V2D,[json,setData,action]);}function _submitError(xhr,err,thrown,errorCallback,submitParams,action){var e1H="ste";var m3_='submitError';var H7U="sy";var j7u=r1g;j7u+=Z5WrO.S9O;j7u+=N2K;var f3F=H7U;f3F+=e1H;f3F+=y9Z;var V8k=Z5WrO.i5Y;V8k+=o4O;V8k+=f49;V8k+=o4O;var i7C=m9y;i7C+=Z5WrO.Q4J;i7C+=t9f;i7C+=Z5WrO.S9O;var L6O=F$W;L6O+=Z5WrO.t9K;L6O+=b9F;L6O+=A$P;p5T.Z7s();this[L6O](L9k,[m3D,submitParams,action,xhr]);this[u2r](this[i7C][V8k][f3F]);this[s$E](f_Y);if(errorCallback){var L4r=Z5WrO.K_g;L4r+=Z5WrO.L$5;L4r+=S$W;L4r+=S$W;errorCallback[L4r](this,xhr,err,thrown);}this[j7u]([m3_,V2D],[xhr,err,thrown,submitParams]);}function _tidy(fn){var I08="proce";var l$9="oFea";var D4$="bServe";var Y14="tures";var K0N="sin";var W46="rSi";var y4o=c_U;y4o+=Z5WrO.t9K;var i_b=I08;i_b+=y0a;i_b+=K0N;i_b+=k$T;var _this=this;var dt=this[y0a][f3z]?new DataTable$4[H0n](this[y0a][f3z]):m3D;var ssp=f_Y;p5T.Z7s();if(dt){var t13=D4$;t13+=W46;t13+=Z5WrO[293400];t13+=Z5WrO.t9K;var K7p=l$9;K7p+=Y14;ssp=dt[T73]()[s87][K7p][t13];}if(this[y0a][i_b]){var r6c=f49;r6c+=Z5WrO.S9O;r6c+=Z5WrO.t9K;this[r6c](V2D,function(){if(ssp){var D2N=f49;D2N+=Z5WrO.S9O;D2N+=Z5WrO.t9K;dt[D2N](j2j,fn);}else {setTimeout(function(){fn();},b6N);}});return V0I;}else if(this[l4D]() === y4o || this[l4D]() === s8M){var C27=Z5WrO[156815];C27+=S$W;C27+=O8W;C27+=o4O;var o7W=Z5WrO.K_g;o7W+=S$W;o7W+=c5D;var v8L=c2S;v8L+=Z5WrO.t9K;this[v8L](o7W,function(){var Y27="mple";var E4x="submitCo";var F3H=Y5Y;F3H+=f49;F3H+=D3R;if(!_this[y0a][F3H]){setTimeout(function(){p5T.Q1A();if(_this[y0a]){fn();}},b6N);}else {var a9l=E4x;a9l+=Y27;a9l+=x0B;var S15=f49;S15+=Z5WrO.S9O;S15+=Z5WrO.t9K;_this[S15](a9l,function(e,json){p5T.Z7s();if(ssp && json){var T$X=c2S;T$X+=Z5WrO.t9K;dt[T$X](j2j,fn);}else {setTimeout(function(){if(_this[y0a]){fn();}},b6N);}});}})[C27]();return V0I;}return f_Y;}function _weakInArray(name,arr){var P5K=S$W;P5K+=Z5WrO.t9K;P5K+=B2f;P5K+=v4y;for(var i=s87,ien=arr[P5K];i < ien;i++){if(name == arr[i]){return i;}}return -q31;}var fieldType={create:function(){},disable:function(){},enable:function(){},get:function(){},set:function(){}};var DataTable$3=$[U6n][P8p];function _buttonText(conf,textIn){var R5y='div.upload button';var k9c="uploadText";var w$C='Choose file...';var m2j=p0i;m2j+=m5K;if(textIn === m3D || textIn === undefined){textIn=conf[k9c] || w$C;}conf[U6z][m2j](R5y)[f_u](textIn);}function _commonUpload(editor,conf,dropCallback,multiple){var X5C='input[type=file]';var z9y="lick";var d1P="\"></butt";var F1H='id';var Q4Q="over";var T1w="ype=\"f";var t9g="and drop a f";var W0y="ile\" ";var I2f='"></button>';var S_5="<div class=\"re";var m0a="div cl";var e$l="dCla";var f0R="dragDropText";var p6W="<but";var w9_="on>";var w2Q="FileReader";var S0m="Drag ";var b5c="<div class";var a$V="=\"editor_upload\">";var r6P='<div class="cell">';var h3A=".drop ";var P72="noD";var P9x="ndered\"></div>";var C5G="div.clear";var k7z="></inp";var u6F="<div class=\"cell cle";var Q8X="ver";var a4I="ut[t";var T14="pe=file]";var N1C="Dro";var X_0="buttonInternal";var A4a="<input t";var v51='<div class="drop"><span></span></div>';var y5n="ton class=\"";var R3m="Value but";var H4V="ile here to upload";var m0M="ut>";var P$6='dragleave dragexit';var R5o="drop";var Y8J="ll limitHid";var V$0="arValue\">";var R5M='<div class="row">';var s89='<div class="cell upload limitHide">';var A0t="e\">";var l0W="ass=\"row second\"";var U2m="drag";var D5c="ass=\"eu_table\">";var i_g="endered";var g_A='multiple';var P4H="<div cl";var j7N="<button ";var b2l="\"ce";var L5w=m9y;L5w+=Z5WrO.S9O;L5w+=A3B;var j5T=f49;j5T+=Z5WrO.S9O;var h33=Z5WrO.K_g;h33+=z9y;var m6u=f49;m6u+=Z5WrO.S9O;var W1h=C5G;W1h+=R3m;W1h+=N2K;W1h+=c2S;var U5y=p0i;U5y+=Z5WrO.S9O;U5y+=Z5WrO[293400];var b2g=U2m;b2g+=N1C;b2g+=W__;var H4y=K5V;H4y+=B60;H4y+=G5r;H4y+=o7D;var f5b=E6H;f5b+=J6f;var o8M=S_5;o8M+=P9x;var X4a=l2f;X4a+=b2l;X4a+=Y8J;X4a+=A0t;var o7H=P4H;o7H+=l0W;o7H+=o7D;var m40=r73;m40+=Z5WrO[293400];m40+=J6f;var k_p=K5V;k_p+=N_J;k_p+=D3P;k_p+=o7D;var m$$=j7N;m$$+=y0G;m$$+=K93;var t3x=u6F;t3x+=V$0;var R3R=r73;R3R+=Z5WrO[293400];R3R+=y__;R3R+=o7D;var L7d=k7z;L7d+=m0M;var z58=A4a;z58+=T1w;z58+=W0y;var B_b=d1P;B_b+=w9_;var d20=p6W;d20+=y5n;var a_G=K5V;a_G+=m0a;a_G+=D5c;var K53=b5c;K53+=a$V;if(multiple === void s87){multiple=f_Y;}var btnClass=editor[t5b][g61][X_0];var container=$(K53 + a_G + R5M + s89 + d20 + btnClass + B_b + z58 + (multiple?g_A:b_u) + L7d + R3R + t3x + m$$ + btnClass + I2f + k_p + m40 + o7H + X4a + v51 + L7i + r6P + o8M + f5b + H4y + L7i + L7i);conf[U6z]=container;conf[o1W]=V0I;if(conf[s2P]){var x54=m9y;x54+=Z5WrO[293400];var e3R=G1P;e3R+=c9U;var r0d=a7Y;r0d+=a4I;r0d+=Z5WrO.x6j;r0d+=T14;container[G3D](r0d)[e3R](F1H,Editor[u8S](conf[x54]));}if(conf[c9F]){var Q$t=G1P;Q$t+=N2K;Q$t+=o4O;var W4h=Z5WrO.L$5;W4h+=N2K;W4h+=c9U;var b8Q=p0i;b8Q+=m5K;container[b8Q](X5C)[W4h](conf[Q$t]);}_buttonText(conf);if(window[w2Q] && conf[b2g] !== f_Y){var x4C=Z5WrO.K_g;x4C+=m_1;var E_M=f49;E_M+=Z5WrO.S9O;var U4V=f49;U4V+=W__;U4V+=Z5WrO.t9K;U4V+=Z5WrO.S9O;var F3P=f49;F3P+=Z5WrO.S9O;var d63=Z5WrO[293400];d63+=o4O;d63+=X0S;d63+=Q4Q;var C74=f49;C74+=Z5WrO.S9O;var Y_D=f49;Y_D+=Z5WrO.S9O;var q0k=Z5WrO[293400];q0k+=f$v;var d6Z=Q_o;d6Z+=R5o;var G4v=Z5WrO[713];G4v+=m9y;G4v+=m5K;var z8C=S0m;z8C+=t9g;z8C+=H4V;var m9A=G5r;m9A+=h3A;m9A+=f1T;m9A+=Y4d;container[G3D](m9A)[V0i](conf[f0R] || z8C);var dragDrop_1=container[G4v](d6Z);dragDrop_1[c2S](q0k,function(e){var Q1F="nsfer";var Q0j="dataT";var Y2z="origi";var m3Y="lEv";p5T.Z7s();var c6g="moveCla";if(conf[o1W]){var R8d=S81;R8d+=Z5WrO.i5Y;var Z4b=z0g;Z4b+=c6g;Z4b+=G6q;var f0r=Q0j;f0r+=X4r;f0r+=Q1F;var H$U=Y2z;H$U+=K71;H$U+=m3Y;H$U+=D9O;Editor[c7l](editor,conf,e[H$U][f0r][X$C],_buttonText,dropCallback);dragDrop_1[Z4b](R8d);}return f_Y;})[Y_D](P$6,function(e){var s5_="removeCl";if(conf[o1W]){var L7Z=f49;L7Z+=Q8X;var R1S=s5_;R1S+=E6Y;R1S+=y0a;dragDrop_1[R1S](L7Z);}return f_Y;})[C74](d63,function(e){if(conf[o1W]){var L_u=f49;L_u+=Q8X;dragDrop_1[A_M](L_u);}p5T.Q1A();return f_Y;});editor[F3P](U4V,function(){var Y4l="agover.";var u1_="DTE_Upload drop.DTE_Upload";var F4B=Z5WrO[293400];F4B+=o4O;F4B+=Y4l;F4B+=u1_;var B0t=f49;B0t+=Z5WrO.S9O;var N$w=Z5WrO[156815];N$w+=f49;N$w+=Z5WrO[293400];N$w+=Z5WrO.x6j;$(N$w)[B0t](F4B,function(e){p5T.Q1A();return f_Y;});})[E_M](x4C,function(){var P7f='dragover.DTE_Upload drop.DTE_Upload';var H3O=e2T;H3O+=Z5WrO[713];$(L8c)[H3O](P7f);});}else {var R7N=Q_o;R7N+=o4O;R7N+=i_g;var j3n=Z5WrO[713];j3n+=m9y;j3n+=Z5WrO.S9O;j3n+=Z5WrO[293400];var K67=P72;K67+=I5g;K67+=W__;var v5E=J3_;v5E+=e$l;v5E+=G6q;container[v5E](K67);container[j6E](container[j3n](R7N));}container[U5y](W1h)[m6u](h33,function(e){var r2I="pre";var w5r="_enab";var I9t="ventDefault";var c25=w5r;c25+=S$W;c25+=Z5WrO.t9K;c25+=Z5WrO[293400];var A$f=r2I;A$f+=I9t;e[A$f]();if(conf[c25]){upload[h1G][R5q](editor,conf,b_u);}});container[G3D](X5C)[j5T](L5w,function(){var f88=p0i;f88+=u_4;f88+=y0a;var L3q=O8W;L3q+=H0W;L3q+=f49;L3q+=J3_;p5T.Q1A();Editor[L3q](editor,conf,this[f88],_buttonText,function(ids,error){var c_l="input[ty";var Q_w=D3P;Q_w+=Z5WrO.L$5;Q_w+=U1L;var B2h=c_l;B2h+=T14;if(!error){dropCallback[R5q](editor,ids);}container[G3D](B2h)[s87][Q_w]=b_u;});});return container;}function _triggerChange(input){setTimeout(function(){var b10="gge";var S5F="cha";var l5h=S5F;l5h+=B2f;p5T.Z7s();l5h+=Z5WrO.t9K;var E2B=N2K;E2B+=z3e;E2B+=b10;E2B+=o4O;input[E2B](l5h,{editor:V0I,editorSet:V0I});},s87);}var baseFieldType=$[n$f](V0I,{},fieldType,{canReturnSubmit:function(conf,node){return V0I;},disable:function(conf){var A3x=B2N;p5T.Z7s();A3x+=g6k;A3x+=Z5WrO[293400];var v7_=W__;v7_+=f$v;conf[U6z][v7_](A3x,V0I);},enable:function(conf){var M0h=i$g;M0h+=b3g;M0h+=Y57;conf[U6z][u$d](M0h,f_Y);},get:function(conf){p5T.Q1A();var c85=D3P;c85+=Z5WrO.L$5;c85+=S$W;return conf[U6z][c85]();},set:function(conf,val){p5T.Q1A();var t2x=l$D;t2x+=Z5WrO.S9O;t2x+=A3B;var S0d=D3P;S0d+=Z5WrO.L$5;S0d+=S$W;var F_s=F$W;F_s+=x_9;F_s+=W__;F_s+=v25;conf[F_s][S0d](val);_triggerChange(conf[t2x]);}});var hidden={create:function(conf){var P61=D3P;P61+=Z5WrO.L$5;P61+=U1L;var y0v=H6g;y0v+=c1L;var r9k=P_e;r9k+=B60;r9k+=o7D;conf[U6z]=$(r9k);conf[y0v]=conf[P61];return m3D;},get:function(conf){var j0e=H6g;j0e+=c1L;return conf[j0e];},set:function(conf,val){var K20=S7V;p5T.Z7s();K20+=S$W;var oldVal=conf[N3$];conf[N3$]=val;conf[U6z][K20](val);if(oldVal !== val){var C01=S9G;C01+=i9O;C01+=N2K;_triggerChange(conf[C01]);}}};var readonly=$[Z2x](V0I,{},baseFieldType,{create:function(conf){var t6P=l$D;t6P+=q5M;var k9B=G1P;k9B+=c9U;var f5C=m9y;f5C+=Z5WrO[293400];var Q62=y0a;Q62+=W9g;Q62+=Z5WrO[293400];var r$O=Z5WrO.t9K;r$O+=R1T;var S53=Z5WrO.L$5;S53+=N2K;S53+=N2K;S53+=o4O;var t6R=P_e;t6R+=B60;t6R+=o7D;var R71=S9G;R71+=A3B;conf[R71]=$(t6R)[S53]($[r$O]({id:Editor[Q62](conf[f5C]),readonly:V7s,type:x1o},conf[k9B] || ({})));return conf[t6P][s87];}});var text=$[N1L](V0I,{},baseFieldType,{create:function(conf){var y5h="ut/>";var W7L=F$W;W7L+=f_F;var x0$=d21;x0$+=y_g;x0$+=L47;x0$+=Z5WrO[293400];var v9A=K5V;v9A+=x_9;v9A+=W__;v9A+=y5h;var W5B=t64;W5B+=v25;conf[W5B]=$(v9A)[c9F]($[D3A]({id:Editor[x0$](conf[s2P]),type:x1o},conf[c9F] || ({})));return conf[W7L][s87];}});var password=$[D3A](V0I,{},baseFieldType,{create:function(conf){var V3P='<input/>';var T4C="passw";var N8e=h9C;N8e+=o4O;var p1M=T4C;p1M+=L3p;p1M+=Z5WrO[293400];var k0L=m9y;k0L+=Z5WrO[293400];var j1j=G1P;p5T.Z7s();j1j+=c9U;var T9M=l$D;T9M+=Z5WrO.S9O;T9M+=W__;T9M+=v25;conf[T9M]=$(V3P)[j1j]($[D3A]({id:Editor[u8S](conf[k0L]),type:p1M},conf[N8e] || ({})));return conf[U6z][s87];}});var textarea=$[D3A](V0I,{},baseFieldType,{canReturnSubmit:function(conf,node){return f_Y;},create:function(conf){var G4A="a></textarea>";var v$x="<te";p5T.Q1A();var O6a="xtare";var e7w=d21;e7w+=y_g;e7w+=L47;e7w+=Z5WrO[293400];var B$X=Z5WrO.L$5;B$X+=N2K;B$X+=N2K;B$X+=o4O;var n5w=v$x;n5w+=O6a;n5w+=G4A;conf[U6z]=$(n5w)[B$X]($[D3A]({id:Editor[e7w](conf[s2P])},conf[c9F] || ({})));return conf[U6z][s87];}});var select=$[D3A](V0I,{},baseFieldType,{_addOptions:function(conf,opts,append){var y0p="eholderDisabled";var h8i="idd";var F_k="pairs";var h$U="placeh";var T6j="olderValue";var x7R="aceh";var I4o="placeholder";var e9F="placeholderValue";var q_r="placeholderDisabled";var c_g=R4j;c_g+=m$B;var a1o=F$W;a1o+=m9y;a1o+=q5M;if(append === void s87){append=f_Y;}var elOpts=conf[a1o][s87][c_g];var countOffset=s87;if(!append){var U$1=S$W;U$1+=y7w;U$1+=k$T;U$1+=v4y;elOpts[U$1]=s87;if(conf[I4o] !== undefined){var u68=i$g;u68+=Q80;u68+=S$W;u68+=Y57;var P7J=C_d;P7J+=h8i;P7J+=y7w;var D7S=j7f;D7S+=y0p;var c3A=h$U;c3A+=P2A;c3A+=Z5WrO[293400];c3A+=Z5WrO.i5Y;var X9g=H0W;X9g+=x7R;X9g+=T6j;var placeholderValue=conf[X9g] !== undefined?conf[e9F]:b_u;countOffset+=q31;elOpts[s87]=new Option(conf[c3A],placeholderValue);var disabled=conf[D7S] !== undefined?conf[q_r]:V0I;elOpts[s87][P7J]=disabled;elOpts[s87][u68]=disabled;elOpts[s87][L94]=placeholderValue;}}else {var u4X=S$W;u4X+=y7w;u4X+=V47;countOffset=elOpts[u4X];}if(opts){Editor[F_k](opts,conf[A7r],function(val,label,i,attr){var y3o="itor";var y04=k4x;y04+=y3o;y04+=N3$;var option=new Option(label,val);option[y04]=val;if(attr){$(option)[c9F](attr);}elOpts[i + countOffset]=option;});}},create:function(conf){var i_u="<select></s";var N0y="_addO";var r3R="safeI";var b8d="nge.dte";var d5E=l$D;d5E+=Z5WrO.S9O;d5E+=A3B;var s8u=N4A;s8u+=W__;s8u+=Z5WrO.a73;var Z$o=T8d;Z$o+=y0a;var Y5V=N0y;Y5V+=W__;Y5V+=m$B;var Y12=Z5WrO.K_g;Y12+=C_d;Y12+=Z5WrO.L$5;Y12+=b8d;var D3U=f49;D3U+=Z5WrO.S9O;var U4w=m9y;U4w+=Z5WrO[293400];var C_h=r3R;C_h+=Z5WrO[293400];var W$I=G1P;W$I+=c9U;var t$n=i_u;t$n+=Z5WrO.t9K;t$n+=f7q;t$n+=o7D;var H28=l$D;H28+=Z5WrO.S9O;H28+=W__;H28+=v25;conf[H28]=$(t$n)[W$I]($[D3A]({id:Editor[C_h](conf[U4w]),multiple:conf[T9e] === V0I},conf[c9F] || ({})))[D3U](Y12,function(e,d){p5T.Z7s();var m_Q="_lastSet";if(!d || !d[g5x]){var b3h=l_8;b3h+=N2K;conf[m_Q]=select[b3h](conf);}});select[Y5V](conf,conf[Z$o] || conf[s8u]);return conf[d5E][s87];},destroy:function(conf){var k9r='change.dte';conf[U6z][D6G](k9r);},get:function(conf){var D8U="oin";var F4Z="toArray";var w_h="ltipl";var R6j='option:selected';var p81=y9Z;p81+=O8W;p81+=w_h;p81+=Z5WrO.t9K;var m35=V$7;m35+=W__;var val=conf[U6z][G3D](R6j)[m35](function(){var L9d="_editor_";var X9z=L9d;p5T.Q1A();X9z+=D3P;X9z+=c1L;return this[X9z];})[F4Z]();if(conf[p81]){var X8L=y0a;X8L+=l0A;var J6P=Z5WrO.c65;J6P+=D8U;return conf[g58]?val[J6P](conf[X8L]):val;}return val[f6V]?val[s87]:m3D;},set:function(conf,val,localUpdate){var M4s="ceholde";var g6N="selected";var u5H='option';var c5z="tSe";var q87="epara";var d3Y=K4U;d3Y+=v4y;var P5o=v8h;P5o+=M4s;P5o+=o4O;var l3X=f49;l3X+=W__;l3X+=y5e;var j9V=S9G;j9V+=W__;j9V+=v25;var T1h=u_4;T1h+=Z5WrO.S9O;T1h+=V47;var I79=e7V;I79+=z4t;I79+=X4r;I79+=Z5WrO.x6j;var H5N=y0a;H5N+=q87;H5N+=n0S;if(!localUpdate){var M_h=N3O;M_h+=E6Y;M_h+=c5z;M_h+=N2K;conf[M_h]=val;}if(conf[T9e] && conf[H5N] && !Array[I79](val)){var g1W=y0a;g1W+=l0A;var S9L=f1T;S9L+=S$W;S9L+=m9y;S9L+=N2K;var v$y=p50;v$y+=k$T;val=typeof val === v$y?val[S9L](conf[g1W]):[];}else if(!Array[z4s](val)){val=[val];}var i;var len=val[T1h];var found;var allFound=f_Y;var options=conf[U6z][G3D](u5H);conf[j9V][G3D](l3X)[g1o](function(){var q3N="ted";var X8o=F05;X8o+=S$W;X8o+=v3z;X8o+=q3N;found=f_Y;for(i=s87;i < len;i++){if(this[L94] == val[i]){found=V0I;allFound=V0I;break;}}p5T.Q1A();this[X8o]=found;});if(conf[P5o] && !allFound && !conf[T9e] && options[d3Y]){options[s87][g6N]=V0I;}if(!localUpdate){_triggerChange(conf[U6z]);}return allFound;},update:function(conf,options,append){var Q90="astSe";var R4h=l$D;R4h+=b57;p5T.Z7s();R4h+=O8W;R4h+=N2K;var q1U=F$W;q1U+=S$W;q1U+=Q90;q1U+=N2K;select[X5p](conf,options,append);var lastSet=conf[q1U];if(lastSet !== undefined){var l1c=F05;l1c+=N2K;select[l1c](conf,lastSet,V0I);}_triggerChange(conf[R4h]);}});var checkbox=$[X5q](V0I,{},baseFieldType,{_addOptions:function(conf,opts,append){var o9i="ptionsPair";var X7L="irs";var b24=t64;b24+=v25;if(append === void s87){append=f_Y;}var jqInput=conf[b24];var offset=s87;if(!append){jqInput[g0K]();}else {var S9q=K4U;S9q+=v4y;offset=$(t5L,jqInput)[S9q];}if(opts){var x3U=f49;x3U+=o9i;var d35=a0L;d35+=X7L;Editor[d35](opts,conf[x3U],function(val,label,i,attr){var G3A="nput:last";var H4L=":last";var Z4V='<input id="';var m4d='<label for="';var E5S=" type=\"chec";var U0I="kbox\" />";var P1Z="or_va";var u6E='</label>';var o2$=t5u;o2$+=P1Z;o2$+=S$W;var f1I=D3P;f1I+=c1L;f1I+=O8W;f1I+=Z5WrO.t9K;var T9F=m9y;T9F+=G3A;var R3P=m9y;R3P+=Z5WrO[293400];var b34=m8V;b34+=E5S;b34+=U0I;var M0$=y0a;M0$+=W9g;M0$+=Z5WrO[293400];var Q3J=m8_;Q3J+=K63;jqInput[j6E](Q3J + Z4V + Editor[M0$](conf[s2P]) + g7e + (i + offset) + b34 + m4d + Editor[u8S](conf[R3P]) + g7e + (i + offset) + z2D + label + u6E + L7i);$(T9F,jqInput)[c9F](f1I,val)[s87][o2$]=val;if(attr){var Q22=f_F;Q22+=H4L;$(Q22,jqInput)[c9F](attr);}});}},create:function(conf){var V_n="opt";var I5y='<div></div>';var W9c="_inpu";var X0s=W9c;X0s+=N2K;var a3K=N4A;a3K+=W__;a3K+=N2K;p5T.Z7s();a3K+=y0a;var a0A=V_n;a0A+=f7T;a0A+=Z5WrO.S9O;a0A+=y0a;var S7U=F$W;S7U+=m9y;S7U+=p17;S7U+=N2K;conf[S7U]=$(I5y);checkbox[X5p](conf,conf[a0A] || conf[a3K]);return conf[X0s][s87];},disable:function(conf){var n5X="sabled";var a6H=i$g;a6H+=n5X;var n8s=Z5WrO[713];n8s+=x_9;n8s+=Z5WrO[293400];var f8S=F$W;f8S+=a7Y;f8S+=O8W;f8S+=N2K;conf[f8S][n8s](t5L)[u$d](a6H,V0I);},enable:function(conf){p5T.Q1A();var G3m=Z5WrO[713];G3m+=m9y;G3m+=Z5WrO.S9O;G3m+=Z5WrO[293400];conf[U6z][G3m](t5L)[u$d](G51,f_Y);},get:function(conf){var o9r="unsele";var J_V="ctedValue";var i0m="separa";var i$o="t:";var o_w=i0m;o_w+=p_z;o_w+=o4O;var T4X=F05;T4X+=a0L;T4X+=X4r;T4X+=n0S;var h2t=o9r;h2t+=J_V;var W0I=z7I;W0I+=i$o;p5T.Q1A();W0I+=v67;W0I+=V6F;var C9q=F$W;C9q+=x_9;C9q+=i9O;C9q+=N2K;var out=[];var selected=conf[C9q][G3D](W0I);if(selected[f6V]){selected[g1o](function(){var G1v="editor_va";var s5W=F$W;s5W+=G1v;s5W+=S$W;var I11=W__;I11+=M0S;out[I11](this[s5W]);});}else if(conf[h2t] !== undefined){out[I59](conf[k_7]);}return conf[T4X] === undefined || conf[o_w] === m3D?out:out[J1V](conf[g58]);},set:function(conf,val){var j5N="Arra";var u9v='|';var L1t="split";var k8Z=m9y;k8Z+=h_n;k8Z+=Y8C;var I4M=m9y;I4M+=y0a;I4M+=j5N;I4M+=Z5WrO.x6j;var jqInputs=conf[U6z][G3D](t5L);if(!Array[I4M](val) && typeof val === Z5m){val=val[L1t](conf[g58] || u9v);}else if(!Array[k8Z](val)){val=[val];}var i;var len=val[f6V];var found;jqInputs[g1o](function(){var N52=Z5WrO.K_g;N52+=a4U;found=f_Y;for(i=s87;i < len;i++){if(this[L94] == val[i]){found=V0I;break;}}this[N52]=found;});_triggerChange(jqInputs);},update:function(conf,options,append){var a_r="ddOptio";var f9C=y0a;f9C+=Z5WrO.t9K;f9C+=N2K;var T4N=F$W;T4N+=Z5WrO.L$5;T4N+=a_r;T4N+=t$u;var currVal=checkbox[h7H](conf);checkbox[T4N](conf,options,append);checkbox[f9C](conf,currVal);}});var radio=$[V$m](V0I,{},baseFieldType,{_addOptions:function(conf,opts,append){p5T.Z7s();if(append === void s87){append=f_Y;}var jqInput=conf[U6z];var offset=s87;if(!append){var M_X=v7F;M_X+=W__;M_X+=N2K;M_X+=Z5WrO.x6j;jqInput[M_X]();}else {var Y3F=M15;Y3F+=q0v;Y3F+=C_d;var B3B=m9y;B3B+=Z5WrO.S9O;B3B+=W__;B3B+=v25;offset=$(B3B,jqInput)[Y3F];}if(opts){var V6q=W__;V6q+=r6w;V6q+=q5s;Editor[V6q](opts,conf[A7r],function(val,label,i,attr){var l$B="bel f";var R_L="radio\" name";var l_G="type=\"";p5T.Q1A();var h7J="\" ";var k6e="id=\"";var M2D="t ";var d4M='input:last';var R2r="<la";var D6e='" />';var a8P="/label>";var s4l=G1P;s4l+=N2K;s4l+=o4O;var s$q=E6H;s$q+=m9y;s$q+=D3P;s$q+=o7D;var W9P=K5V;W9P+=a8P;var f1g=R2r;f1g+=l$B;f1g+=L3p;f1g+=K93;var y5f=h7J;y5f+=l_G;y5f+=R_L;y5f+=K93;var p2m=I_D;p2m+=c$q;var Y9V=K5V;Y9V+=z7I;Y9V+=M2D;Y9V+=k6e;var c1Z=m8_;c1Z+=D3P;c1Z+=o7D;var N$e=a7S;N$e+=m5K;jqInput[N$e](c1Z + Y9V + Editor[p2m](conf[s2P]) + g7e + (i + offset) + y5f + conf[A$O] + D6e + f1g + Editor[u8S](conf[s2P]) + g7e + (i + offset) + z2D + label + W9P + s$q);$(d4M,jqInput)[s4l](O6C,val)[s87][L94]=val;if(attr){$(d4M,jqInput)[c9F](attr);}});}},create:function(conf){var G2A='<div />';var z23="options";var k8J="ddO";var N$P="pOpts";var U57='open';var C$Q=l$D;C$Q+=Z5WrO.S9O;C$Q+=A3B;var m5j=f49;m5j+=Z5WrO.S9O;var m24=m9y;m24+=N$P;var q7C=o4A;q7C+=k8J;q7C+=L0O;q7C+=R_D;conf[U6z]=$(G2A);radio[q7C](conf,conf[z23] || conf[m24]);this[m5j](U57,function(){var m1z=Z5WrO.t9K;m1z+=Z5WrO.L$5;m1z+=Z5WrO.K_g;m1z+=C_d;var o7N=a7Y;o7N+=v25;conf[U6z][G3D](o7N)[m1z](function(){var g6M="reChec";var h$d="ked";var H_2="checked";var X3J=F$W;X3J+=W__;X3J+=g6M;p5T.Q1A();X3J+=h$d;if(this[X3J]){this[H_2]=V0I;}});});return conf[C$Q][s87];},disable:function(conf){p5T.Q1A();var O_2=W__;O_2+=I5g;O_2+=W__;var A9T=m9y;A9T+=p17;A9T+=N2K;var T$C=Z5WrO[713];T$C+=C4z;conf[U6z][T$C](A9T)[O_2](G51,V0I);},enable:function(conf){var O4B=W__;O4B+=I5g;O4B+=W__;var L3r=Z5WrO[713];p5T.Q1A();L3r+=C4z;conf[U6z][L3r](t5L)[O4B](G51,f_Y);},get:function(conf){var g6K="r_";var j_V="edito";var b4R="uns";var A7R="electedValue";var F3e="input:che";var e52=b4R;e52+=A7R;var u6_=F3e;u6_+=Z5WrO.K_g;u6_+=G5_;u6_+=Y57;p5T.Z7s();var M9w=Z5WrO[713];M9w+=m9y;M9w+=Z5WrO.S9O;M9w+=Z5WrO[293400];var el=conf[U6z][M9w](u6_);if(el[f6V]){var F5X=F$W;F5X+=j_V;F5X+=g6K;F5X+=F4A;return el[s87][F5X];}return conf[e52] !== undefined?conf[k_7]:undefined;},set:function(conf,val){var u0i="put:c";var l8K=x_9;l8K+=u0i;l8K+=a4U;p5T.Z7s();var A2R=p0i;A2R+=Z5WrO.S9O;A2R+=Z5WrO[293400];var S8C=F$W;S8C+=m9y;S8C+=p17;S8C+=N2K;var s1Z=m9y;s1Z+=p17;s1Z+=N2K;var w6j=Z5WrO[713];w6j+=m9y;w6j+=Z5WrO.S9O;w6j+=Z5WrO[293400];var c$R=t64;c$R+=v25;conf[c$R][w6j](s1Z)[g1o](function(){var z9U="Ch";var c2g="_preCh";var P$8="che";var x5K="cked";var n4$="_pre";var W67="checke";var C_o="_preChecked";var W9M=n4$;W9M+=z9U;W9M+=V6F;this[W9M]=f_Y;if(this[L94] == val){var C9M=W67;C9M+=Z5WrO[293400];this[C9M]=V0I;this[C_o]=V0I;}else {var t_s=c2g;t_s+=V6F;var d6p=P$8;d6p+=x5K;this[d6p]=f_Y;this[t_s]=f_Y;}});_triggerChange(conf[S8C][A2R](l8K));},update:function(conf,options,append){var y2X="[v";var K9C=G1P;K9C+=c9U;var r64=Z5WrO.t9K;r64+=I9m;var O15=m8V;O15+=w6H;var g$a=y2X;g$a+=c1L;g$a+=O8W;g$a+=p7j;var w6Q=p0i;w6Q+=Z83;w6Q+=Z5WrO.i5Y;var V6d=y0a;V6d+=Z5WrO.t9K;V6d+=N2K;var e2u=Z5WrO[713];e2u+=m9y;e2u+=Z5WrO.S9O;e2u+=Z5WrO[293400];var R4L=l$D;R4L+=Z5WrO.S9O;R4L+=A3B;var z0j=F$W;z0j+=m3a;z0j+=y5e;z0j+=y0a;var W8$=k$T;W8$+=Z5WrO.t9K;W8$+=N2K;var currVal=radio[W8$](conf);radio[z0j](conf,options,append);var inputs=conf[R4L][e2u](t5L);radio[V6d](conf,inputs[w6Q](g$a + currVal + O15)[f6V]?currVal:inputs[r64](s87)[K9C](O6C));}});var datetime=$[D3A](V0I,{},baseFieldType,{create:function(conf){var i0D="mom";var G4C="str";var W23="entStr";var s3j="ale";var M3O="ict";var N3a="locale";var Q1K='keydown';var q3t='<input />';var z9P="displayF";var V5v="etime";var E5v="stri";var K2S="ntStrict";var A6_='DateTime library is required';var n9z="momentLocale";var Z2T="rma";var Y4G="moment";var i8h="Loc";var m8d="_c";var z9B="ormat";var E6y="keyInput";var u8b=F$W;u8b+=x_9;u8b+=W__;u8b+=v25;var p1o=w_V;p1o+=F05;var X68=m8d;X68+=S$W;X68+=L5Y;X68+=C$W;var U$q=O0o;U$q+=V5v;var z7w=T6g;z7w+=Z2T;z7w+=N2K;var q0n=z9P;q0n+=z9B;var C1g=Q02;C1g+=u6N;C1g+=Z5WrO.i5Y;var Z5G=E5v;Z5G+=j0X;var W_d=C1j;W_d+=x$8;W_d+=K2S;var x5T=f49;x5T+=v18;var b1s=Y4G;b1s+=i8h;b1s+=s3j;var x2m=O3S;x2m+=O50;var l52=G1P;l52+=c9U;var K6Q=d21;K6Q+=Z5WrO[713];K6Q+=S7f;K6Q+=Z5WrO[293400];conf[U6z]=$(q3t)[c9F]($[D3A](V0I,{id:Editor[K6Q](conf[s2P]),type:x1o},conf[l52]));if(!DataTable$3[x2m]){var N$6=Z5WrO.i5Y;N$6+=o4O;N$6+=f49;N$6+=o4O;Editor[N$6](A6_,c0K);}if(conf[b1s] && !conf[x5T][N3a]){var J90=e6V;J90+=Z5WrO.K_g;J90+=Z5WrO.L$5;J90+=u_4;var v2Z=R4j;v2Z+=N2K;v2Z+=y0a;conf[v2Z][J90]=conf[n9z];}if(conf[W_d] && !conf[k7c][Z5G]){var u9w=i0D;u9w+=W23;u9w+=M3O;var Z4N=G4C;Z4N+=M3O;conf[k7c][Z4N]=conf[u9w];}conf[C1g]=new DataTable$3[S33](conf[U6z],$[D3A]({format:conf[q0n] || conf[z7w],i18n:this[U_5][U$q]},conf[k7c]));conf[X68]=function(){var e6Q="picker";var t4M=C_d;t4M+=m9y;t4M+=Z5WrO[293400];t4M+=Z5WrO.t9K;var E0q=F$W;E0q+=e6Q;p5T.Z7s();conf[E0q][t4M]();};if(conf[E6y] === f_Y){var M6y=f49;M6y+=Z5WrO.S9O;conf[U6z][M6y](Q1K,function(e){var X8x="preventDef";var L7K="ault";var s0E=X8x;s0E+=L7K;e[s0E]();});}this[c2S](p1o,conf[H6P]);return conf[u8b][s87];},destroy:function(conf){var c_w="keyd";var W1H=Z$a;W1H+=I5g;W1H+=Z5WrO.x6j;var j9Z=c_w;j9Z+=h78;var g4q=l$D;g4q+=b57;g4q+=v25;var k_w=Z5WrO.K_g;k_w+=S$W;k_w+=f49;k_w+=F05;var n4x=f49;n4x+=Z5WrO[713];n4x+=Z5WrO[713];p5T.Z7s();this[n4x](k_w,conf[H6P]);conf[g4q][D6G](j9Z);conf[C3a][W1H]();},errorMessage:function(conf,msg){p5T.Q1A();var L4I="errorMsg";var k9z=Q02;k9z+=Z5WrO.K_g;k9z+=G5_;k9z+=Z5WrO.i5Y;conf[k9z][L4I](msg);},get:function(conf){var n6u="_pick";var L7T=n6u;L7T+=Z5WrO.i5Y;return conf[S3X]?conf[L7T][F8h](conf[S3X]):conf[U6z][F4A]();},maxDate:function(conf,max){var k0F="icker";var v26=y9Z;v26+=Z5WrO.L$5;v26+=Z5WrO.w$8;p5T.Q1A();var Z87=B90;Z87+=k0F;conf[Z87][v26](max);},minDate:function(conf,min){var y2b="min";var B7B="cker";var h39=Q02;p5T.Z7s();h39+=B7B;conf[h39][y2b](min);},owns:function(conf,node){var e39="picke";var i7s=f49;i7s+=J_L;i7s+=Z5WrO.S9O;i7s+=y0a;var M5_=F$W;M5_+=e39;M5_+=o4O;return conf[M5_][i7s](node);},set:function(conf,val){var x75='--';var k$R=u$N;k$R+=j4Y;k$R+=Z5WrO[713];if(typeof val === Z5m && val && val[k$R](x75) !== s87 && conf[S3X]){conf[C3a][F8h](conf[S3X],val);}else {var T$3=S7V;T$3+=S$W;conf[C3a][T$3](val);}_triggerChange(conf[U6z]);}});var upload=$[D3A](V0I,{},baseFieldType,{canReturnSubmit:function(conf,node){return f_Y;},create:function(conf){var editor=this;var container=_commonUpload(editor,conf,function(val){var g$S="stUplo";var Y2N="po";var Q9Q=Y2N;Q9Q+=g$S;Q9Q+=Z5WrO.L$5;Q9Q+=Z5WrO[293400];var L$O=r1g;L$O+=A$P;var e1P=o5d;e1P+=S7y;upload[h1G][e1P](editor,conf,val[s87]);editor[L$O](Q9Q,[conf[A$O],val[s87]]);});return container;},disable:function(conf){var F9O="bled";var Y5A=B2N;Y5A+=F9O;var u5c=m9y;u5c+=Z5WrO.S9O;u5c+=W__;u5c+=v25;conf[U6z][G3D](u5c)[u$d](Y5A,V0I);conf[o1W]=f_Y;},enable:function(conf){var D_Q=K1p;D_Q+=K71;D_Q+=Z5WrO[156815];D_Q+=L_b;var h2E=Z5WrO[713];h2E+=m9y;h2E+=Z5WrO.S9O;h2E+=Z5WrO[293400];var B42=F$W;B42+=m9y;p5T.Z7s();B42+=p17;B42+=N2K;conf[B42][h2E](t5L)[u$d](G51,f_Y);conf[D_Q]=V0I;},get:function(conf){var A0w=H6g;A0w+=c1L;return conf[A0w];},set:function(conf,val){var c7g="noFileText";var L0D='<span>';var H2N="igg";var S2E="ile";var R7W='div.clearValue button';var Y4K="noClea";var F0A="emoveCla";var R7f="rHandler";var C9o='noClear';var E31="clearText";var U5Z=H6g;U5Z+=c1L;var E87=c9U;E87+=H2N;E87+=Z5WrO.t9K;E87+=R7f;var l9e=m9y;l9e+=q5M;p5T.Z7s();var W7i=F$W;W7i+=x_9;W7i+=i9O;W7i+=N2K;var x3h=Z5WrO[293400];x3h+=d7G;x3h+=X5o;var A51=l$D;A51+=Z5WrO.S9O;A51+=i9O;A51+=N2K;var A5d=F$W;A5d+=z7I;A5d+=N2K;var P6m=F$W;P6m+=D3P;P6m+=Z5WrO.L$5;P6m+=S$W;conf[P6m]=val;conf[A5d][F4A](b_u);var container=conf[A51];if(conf[x3h]){var X0z=H6g;X0z+=Z5WrO.L$5;X0z+=S$W;var rendered=container[G3D](d7V);if(conf[X0z]){var w8G=H6g;w8G+=c1L;rendered[f_u](conf[l4D](conf[w8G]));}else {var p8J=H_F;p8J+=X3f;p8J+=Z5WrO[713];p8J+=S2E;var Q75=p96;Q75+=h7T;Q75+=m5K;rendered[g0K]()[Q75](L0D + (conf[c7g] || p8J) + n7q);}}var button=container[G3D](R7W);if(val && conf[E31]){var d15=Y4K;d15+=o4O;var z$A=o4O;z$A+=F0A;z$A+=y0a;z$A+=y0a;button[f_u](conf[E31]);container[z$A](d15);}else {container[A_M](C9o);}conf[W7i][G3D](l9e)[E87](F5h,[conf[U5Z]]);}});var uploadMany=$[D3A](V0I,{},baseFieldType,{_showHide:function(conf){var e2i="imit";var T5h="imitL";var E$V="limit";var l2i="_container";var a2e='div.limitHide';var B6x="engt";var x06=h2Z;x06+=S$W;var z5s=S$W;z5s+=e2i;var e$$=N3O;e$$+=T5h;e$$+=f5I;var x3t=s2h;x3t+=y9Z;x3t+=m9y;x3t+=N2K;p5T.Z7s();var i0w=S$W;i0w+=B6x;i0w+=C_d;var L_Q=Z5WrO[293400];L_Q+=d2k;if(!conf[E$V]){return;}conf[l2i][G3D](a2e)[Q8G](L_Q,conf[N3$][i0w] >= conf[x3t]?V67:P3z);conf[e$$]=conf[z5s] - conf[x06][f6V];},canReturnSubmit:function(conf,node){p5T.Z7s();return f_Y;},create:function(conf){var l15="_con";var i_Y='button.remove';var q5j=l15;q5j+=N2K;q5j+=i_E;var P_a=v_k;P_a+=I$8;P_a+=G5_;var O6A=f49;O6A+=Z5WrO.S9O;var t_Z=y9Z;t_Z+=k0w;t_Z+=N2K;t_Z+=m9y;var editor=this;var container=_commonUpload(editor,conf,function(val){var v6X="concat";var w4N='postUpload';var Y6v=Z5WrO.S9O;Y6v+=b43;Y6v+=Z5WrO.t9K;var b_3=F$W;b_3+=u0u;b_3+=A$P;var j0L=o5d;j0L+=S7y;var P8C=y0a;P8C+=Z5WrO.t9K;P8C+=N2K;var v6m=F$W;v6m+=S7V;p5T.Z7s();v6m+=S$W;conf[v6m]=conf[N3$][v6X](val);uploadMany[P8C][j0L](editor,conf,conf[N3$]);editor[b_3](w4N,[conf[Y6v],conf[N3$]]);},V0I);container[A_M](t_Z)[O6A](P_a,i_Y,function(e){var I_h="stopPropagation";var E9o='idx';e[I_h]();if(conf[o1W]){var c63=y0a;c63+=Z5WrO.t9K;c63+=N2K;var c12=h2Z;c12+=S$W;var M5D=Z5WrO[293400];M5D+=y3x;var idx=$(this)[M5D](E9o);conf[c12][J9l](idx,q31);uploadMany[c63][R5q](editor,conf,conf[N3$]);}});conf[q5j]=container;return container;},disable:function(conf){var i8f=F$W;i8f+=y7w;i8f+=O0z;i8f+=Z5WrO[293400];var Z30=h8l;Z30+=W__;var A4c=m9y;A4c+=Z5WrO.S9O;A4c+=W__;A4c+=v25;var U8e=F$W;U8e+=a7Y;U8e+=v25;conf[U8e][G3D](A4c)[Z30](G51,V0I);conf[i8f]=f_Y;},enable:function(conf){var b6h=R6d;b6h+=Y57;var h7z=Y5Y;h7z+=f49;h7z+=W__;var j$2=a7Y;j$2+=v25;var B$5=p0i;B$5+=m5K;var q9A=l$D;q9A+=Z5WrO.S9O;q9A+=i9O;q9A+=N2K;conf[q9A][B$5](j$2)[h7z](b6h,f_Y);conf[o1W]=V0I;},get:function(conf){p5T.Q1A();return conf[N3$];},set:function(conf,val){var S7B="trig";var B3J="<s";var Z_x=" f";var p0R="n>";var v8f='<ul></ul>';var J2q="ger";var x27="_showHi";var D4t="Handler";var W35="noFi";var k7C="Text";var O$I='Upload collections must have an array as a value';var f1B=S7B;f1B+=J2q;f1B+=D4t;var Z_V=S9G;Z_V+=W__;Z_V+=O8W;Z_V+=N2K;var r2l=x27;r2l+=Z5WrO[293400];r2l+=Z5WrO.t9K;var j2v=F$W;j2v+=z7I;j2v+=N2K;var p27=D3P;p27+=Z5WrO.L$5;p27+=S$W;var a52=S9G;a52+=A3B;if(!val){val=[];}if(!Array[z4s](val)){throw new Error(O$I);}conf[N3$]=val;conf[a52][p27](b_u);var that=this;var container=conf[j2v];if(conf[l4D]){var j0T=K4U;j0T+=N2K;j0T+=C_d;var rendered=container[G3D](d7V)[g0K]();if(val[j0T]){var M0_=V5y;M0_+=v67;var list_1=$(v8f)[Z4v](rendered);$[M0_](val,function(i,file){var R3o='</li>';p5T.Q1A();var W34=" <bu";var E58=" data-idx=\"";var x8A="imes;<";var k0A="n class=\"";var i8O="remove\"";var C1J="/button>";var Q2Y="\">&t";var I1n="i>";var display=conf[l4D](file,i);if(display !== m3D){var y2j=Q2Y;y2j+=x8A;y2j+=C1J;var C8s=X3f;C8s+=i8O;C8s+=E58;var B6z=Z5WrO[156815];B6z+=p4T;B6z+=f49;B6z+=Z5WrO.S9O;var y$Q=W34;y$Q+=O_V;y$Q+=f49;y$Q+=k0A;var H9Z=K5V;H9Z+=S$W;H9Z+=I1n;var S2J=p96;S2J+=W__;S2J+=l3Q;list_1[S2J](H9Z + display + y$Q + that[t5b][g61][B6z] + C8s + i + y2j + R3o);}});}else {var y4w=H_F;y4w+=Z_x;y4w+=m9y;y4w+=I__;var x_2=W35;x_2+=u_4;x_2+=k7C;var k$z=B3J;k$z+=a0L;k$z+=p0R;rendered[j6E](k$z + (conf[x_2] || y4w) + n7q);}}p5T.Q1A();uploadMany[r2l](conf);conf[Z_V][G3D](t5L)[f1B](F5h,[conf[N3$]]);}});var datatable=$[M2g](V0I,{},baseFieldType,{_addOptions:function(conf,options,append){var X1Z="ows";var f3T=o4O;f3T+=X1Z;if(append === void s87){append=f_Y;}var dt=conf[B8L];p5T.Z7s();if(!append){var N2Z=v_k;N2Z+=V5y;N2Z+=o4O;dt[N2Z]();}dt[f3T][C_E](options)[j$c]();},_jumpToFirst:function(conf,editor){var f5A="Of";var d1E='applied';var M8n="pare";var a8K="floor";var J9j='div.dataTables_scrollBody';var K5e=Z5WrO.S9O;K5e+=l3k;K5e+=C5e;K5e+=o4O;var K6g=m9y;K6g+=m5K;K6g+=Z5WrO.t9K;K6g+=Z5WrO.w$8;var x08=Z5WrO[293400];x08+=N2K;var dt=conf[x08];var idx=dt[U0D]({order:d1E,selected:V0I})[K6g]();var page=s87;if(typeof idx === K5e){var a5E=C4z;a5E+=Z5WrO.t9K;a5E+=Z5WrO.w$8;a5E+=f5A;var g6_=o4O;g6_+=f49;g6_+=J_L;g6_+=y0a;var Q0_=M15;Q0_+=k$T;Q0_+=v4y;var p0D=x_9;p0D+=T6g;var pageLen=dt[F7I][p0D]()[Q0_];var pos=dt[g6_]({order:d1E})[s4T]()[a5E](idx);page=pageLen > s87?Math[a8K](pos / pageLen):s87;}p5T.Q1A();dt[F7I](page)[j$c](f_Y);var container=$(J9j,dt[f3z]()[V$c]());var scrollTo=function(){var v7T=D6n;v7T+=j4$;var node=dt[U0D]({order:d1E,selected:V0I})[v7T]();p5T.Q1A();if(node){var i0n=N2K;i0n+=R4j;var K6W=S1Q;K6W+=N2K;var height=container[K6W]();var top_1=$(node)[i5X]()[i0n];if(top_1 > height - b6N){container[y_d](top_1);}}};if(container[f6V]){var N2a=M8n;N2a+=Z5WrO.S9O;N2a+=Z5WrO.a73;if(container[N2a](L8c)[f6V]){scrollTo();}else {var e92=R4j;e92+=y7w;editor[V3J](e92,function(){p5T.Q1A();scrollTo();});}}},create:function(conf){var u05='search';var D4r="addCla";p5T.Q1A();var F0B="foot";var m1s="nsPa";var n5O="ptio";var z3I="<tfo";var I3r='os';var D4g='2';var J_k="nfig";var B9R='100%';var R8o="isArr";var t4q='<table>';var a6w="sPair";var K9P="ote";var t8t="DataTable";var k3n='info';var H64='Search';var y8P="r-select";var t0f="tableClass";var q5H="fig";var k2X="ging";var X8R="ir";var b92="tCompl";var e9o="use";var k_L='init.dt';var V5s="earch";var C$q='fiBtp';var K9A='<div class="DTE_Field_Type_datatable_info">';var X6I='<div>';var J2v="idth";var i1M="t>";var A0_="La";var W1B='<tr>';var U6o=R4j;U6o+=m$B;var X0q=Z5WrO.t9K;X0q+=g2T;X0q+=L3p;var E8D=e9o;E8D+=y8P;var G1J=f49;G1J+=W__;G1J+=Z5WrO.t9K;G1J+=Z5WrO.S9O;var R8N=O7a;R8N+=J_k;var C3d=z$f;C3d+=u_4;var l9p=a0L;l9p+=k2X;var H4D=x_9;H4D+=T6g;var c3j=Z5WrO[156815];c3j+=v25;c3j+=p_z;c3j+=t$u;var S3W=y0a;S3W+=V5s;var n7B=A0_;n7B+=Z5WrO[156815];n7B+=Z5WrO.t9K;n7B+=S$W;var X1S=S$W;X1S+=s0w;X1S+=Z5WrO.t9K;X1S+=S$W;var C7t=T8d;C7t+=Z8l;C7t+=r6w;C7t+=o4O;var I5C=p6L;I5C+=x0B;I5C+=Z5WrO.S9O;I5C+=Z5WrO[293400];var G3x=J_L;G3x+=J2v;var E$c=D4r;E$c+=G6q;var O06=u_4;O06+=b9K;var O01=V1M;O01+=R_D;var G3U=O7a;G3U+=A_I;G3U+=k$T;var e$0=V1M;e$0+=R_D;var I0j=Z5WrO.K_g;I0j+=f49;I0j+=Z5WrO.S9O;I0j+=q5H;var G89=m4G;G89+=q5H;var f8X=V4V;f8X+=B_J;var i8V=Z5WrO.L$5;i8V+=f96;i8V+=l3Q;var S_E=f49;S_E+=n5O;S_E+=m1s;S_E+=X8R;var A0W=Z5WrO.t9K;A0W+=O3s;A0W+=Z5WrO.t9K;A0W+=m5K;var e43=u$2;e43+=Z5WrO.S9O;e43+=a6w;var _this=this;conf[e43]=$[A0W]({label:N$I,value:O6C},conf[S_E]);var table=$(t4q);var container=$(X6I)[i8V](table);var side=$(K9A);var layout=DataTable$3[f8X](D4g);if(conf[k8s]){var K3P=F0B;K3P+=Z5WrO.i5Y;var u9Y=Z5WrO[713];u9Y+=f49;u9Y+=K9P;u9Y+=o4O;var c3Z=y9Z;c3Z+=Z5WrO.L$5;c3Z+=W__;var d_u=Z5WrO.L$5;d_u+=f96;d_u+=l3Q;var I$X=F0B;I$X+=Z5WrO.i5Y;var Z6a=R8o;Z6a+=k_W;var n9w=a7S;n9w+=m5K;var A0q=z3I;A0q+=f49;A0q+=i1M;$(A0q)[n9w](Array[Z6a](conf[I$X])?$(W1B)[d_u]($[c3Z](conf[u9Y],function(str){var q1x=C_d;q1x+=t8m;p5T.Z7s();q1x+=S$W;var t0d=K5V;t0d+=N2K;t0d+=C_d;t0d+=o7D;return $(t0d)[q1x](str);})):conf[K3P])[Z4v](table);}var hasButtons=conf[G89] && conf[I0j][e$0] && conf[G3U][O01][O06];var dt=table[E$c](datatable[t0f])[G3x](B9R)[c2S](k_L,function(e,settings){var v9z='div.dataTables_info';var v8O=".dt-search";var S7g="ter";var J11="div.d";var e83="dataTables_fi";var w_Z="Ap";var X$k="t-info";var j5_="div.dt-butto";var C_9="nT";var V8$=Z5WrO[713];V8$+=m9y;V8$+=m5K;var h_g=J11;h_g+=X$k;var y30=p0i;p5T.Z7s();y30+=m5K;var x1L=j5_;x1L+=t$u;var E7G=p96;E7G+=f2$;var O$W=Q_o;O$W+=e83;O$W+=S$W;O$W+=S7g;var j_M=p0i;j_M+=m5K;var i_t=i$g;i_t+=D3P;i_t+=v8O;var p90=Z5WrO[713];p90+=m9y;p90+=Z5WrO.S9O;p90+=Z5WrO[293400];var l0P=x_9;l0P+=m9y;l0P+=N2K;var g5K=z7W;g5K+=Z5WrO.t9K;var o_H=w_Z;o_H+=m9y;var X7x=C_9;X7x+=Z5WrO.L$5;X7x+=x1A;X7x+=Z5WrO.t9K;if(settings[X7x] !== table[s87]){return;}var api=new DataTable$3[o_H](settings);var containerNode=$(api[g5K](undefined)[V$c]());DataTable$3[D02][l0P](api);side[j6E](containerNode[p90](i_t))[j6E](containerNode[j_M](O$W))[E7G](containerNode[G3D](x1L))[j6E](containerNode[y30](h_g))[j6E](containerNode[V8$](v9z));})[t8t]($[I5C]({buttons:[],columns:[{data:conf[C7t][X1S],title:n7B}],deferRender:V0I,dom:layout?m3D:C$q,language:{paginate:{next:O0S,previous:f$6},search:b_u,searchPlaceholder:H64},layout:layout?{top:hasButtons?[S3W,c3j,H4D]:[u05,k3n],bottom:[l9p],bottomStart:m3D,bottomEnd:m3D,topStart:m3D,topEnd:m3D}:m3D,lengthChange:f_Y,select:{style:conf[T9e]?I3r:C3d}},conf[R8N]));this[c2S](G1J,function(){p5T.Z7s();var V1h="adju";var n20="sear";var H8x=V1h;H8x+=Y75;var u35=a6F;u35+=y0a;var V2p=n20;V2p+=v67;if(dt[V2p]()){var z1S=y0a;z1S+=V5s;dt[z1S](b_u)[j$c]();}dt[u35][H8x]();});dt[c2S](E8D,function(){var K1C=N2K;K1C+=Z5WrO.L$5;K1C+=g6k;p5T.Q1A();_triggerChange($(conf[B8L][K1C]()[V$c]()));});if(conf[X0q]){var j0v=q8F;j0v+=m9y;j0v+=b92;j0v+=W$y;conf[g5x][f3z](dt);conf[g5x][c2S](j0v,function(e,json,data,action){var u09="umpT";var W6A="First";var f94='refresh';var Q8o="_j";var u7Z=Q8o;u7Z+=u09;u7Z+=f49;u7Z+=W6A;var O9v=z0g;O9v+=T7T;var Q$r=Y57;Q$r+=m9y;Q$r+=N2K;var K19=L21;K19+=Z5WrO.t9K;p5T.Z7s();K19+=G1P;K19+=Z5WrO.t9K;if(action === K19){var _loop_1=function(dp){var o3O="elect";var j_5=y0a;j_5+=o3O;p5T.Z7s();dt[C$$](function(idx,d){return d === dp;})[j_5]();};for(var _i=s87,_a=json[g6F];_i < _a[f6V];_i++){var dp=_a[_i];_loop_1(dp);}}else if(action === Q$r || action === O9v){_this[D9p](f94);}datatable[u7Z](conf,_this);});}conf[B8L]=dt;datatable[X5p](conf,conf[U6o] || []);return {input:container,side:side};},disable:function(conf){p5T.Q1A();var U9d='api';var P8N=h_1;P8N+=Z5WrO.L$5;P8N+=Z5WrO.x6j;var H1G=b_P;H1G+=i_E;var L4a=m0C;L4a+=N2K;L4a+=R_D;var a0D=Z5WrO[293400];a0D+=N2K;conf[B8L][D02][I03](U9d);conf[a0D][L4a]()[H1G]()[Q8G](P8N,V67);},dt:function(conf){var q1V=Z5WrO[293400];q1V+=N2K;p5T.Z7s();return conf[q1V];},enable:function(conf){var a3R="si";var u21="ltiple";var a9v="gl";var r26=l1J;r26+=c_i;p5T.Q1A();var Y9L=Z5WrO[293400];Y9L+=N2K;var D0d=a3R;D0d+=Z5WrO.S9O;D0d+=a9v;D0d+=Z5WrO.t9K;var I45=f49;I45+=y0a;var K0d=d1p;K0d+=u21;var y5A=y0a;y5A+=N2K;y5A+=Z5WrO.x6j;y5A+=u_4;conf[B8L][D02][y5A](conf[K0d]?I45:D0d);conf[Y9L][C7_]()[V$c]()[Q8G](r26,P3z);},get:function(conf){var g_S="rato";var q4g="separ";var N0l="plu";var I8_=q4g;I8_+=G1P;I8_+=L3p;var Y3b=s_A;Y3b+=Z5WrO.L$5;Y3b+=g_S;Y3b+=o4O;var m3T=C_6;m3T+=Y8C;p5T.Q1A();var a1p=N0l;a1p+=u6N;var g5y=Z5WrO[293400];g5y+=Z5WrO.L$5;g5y+=m_3;var d8w=Z5WrO[293400];d8w+=N2K;var rows=conf[d8w][C$$]({selected:V0I})[g5y]()[a1p](conf[A7r][W_H])[m3T]();return conf[Y3b] || !conf[T9e]?rows[J1V](conf[I8_] || F8i):rows;},set:function(conf,val,localUpdate){var H1q="arat";var D1F="Array";var I7z="_jumpToFirst";var R1k="dese";var L70="sel";var N90="rator";p5T.Q1A();var M74=L70;M74+=Z5WrO.t9K;M74+=j0X;var g45=o4O;g45+=f49;g45+=S_D;var Y39=R1k;Y39+=f7q;var j3h=o4O;j3h+=f49;j3h+=J_L;j3h+=y0a;var l1G=e7V;l1G+=D1F;var X0o=s_A;X0o+=Z5WrO.L$5;X0o+=N90;if(conf[T9e] && conf[X0o] && !Array[z4s](val)){var t4o=s_A;t4o+=H1q;t4o+=L3p;var e1R=y0a;e1R+=H0W;e1R+=m9y;e1R+=N2K;var q5v=Y75;q5v+=z3e;q5v+=Z5WrO.S9O;q5v+=k$T;val=typeof val === q5v?val[e1R](conf[t4o]):[];}else if(!Array[l1G](val)){val=[val];}var valueFn=dataGet(conf[A7r][W_H]);conf[B8L][j3h]({selected:V0I})[Y39]();conf[B8L][g45](function(idx,data,node){p5T.Z7s();return val[d1L](valueFn(data)) !== -q31;})[M74]();datatable[I7z](conf,this);if(!localUpdate){var I6h=N2K;I6h+=Z5WrO.L$5;I6h+=g6k;_triggerChange($(conf[B8L][I6h]()[V$c]()));}},tableClass:b_u,update:function(conf,options,append){var V8C="ions";var S2y="_lastS";var p0L=m_3;p0L+=Z5WrO[156815];p0L+=S$W;p0L+=Z5WrO.t9K;var M1l=Z5WrO[293400];M1l+=N2K;var c_4=S2y;c_4+=Z5WrO.p8I;var L7O=F$W;L7O+=m3a;L7O+=N2K;L7O+=V8C;datatable[L7O](conf,options,append);var lastSet=conf[c_4];if(lastSet !== undefined){datatable[h1G](conf,lastSet,V0I);}_triggerChange($(conf[M1l][p0L]()[V$c]()));}});var defaults={className:b_u,compare:m3D,data:b_u,def:b_u,entityDecode:V0I,fieldInfo:b_u,getFormatter:m3D,id:b_u,label:b_u,labelInfo:b_u,message:b_u,multiEditable:V0I,name:m3D,nullDefault:f_Y,setFormatter:m3D,submit:V0I,type:x1o};var DataTable$2=$[Q2x][D1T];var Field=(function(){var Z20="Cl";var Y90="oty";var J1k="protot";var H57="iVa";var n5_="_errorNode";var W3$="setFormatter";var h6D="proces";var b_I="prot";var K6c="multiInfo";var Z3X="totype";var U5_=0.5;var K1e="ho";var c6x="typeF";var B1b="ltiG";var q1Z="fieldInfo";var c8X="host";var l7Y="prototyp";var t2B="rototy";var z6Y="tiRestore";var Y5E="abelInfo";var w0B="disab";var H2u="hide";var P5E="ost";var B5f='display';var A8K="Check";var j84="tainer";var r3K="_multiValueCheck";var g9d="multiIds";var h$p="slideUp";var N$u="inE";var S$l="enable";var j1M="rotot";var w6M="ype";var i2z="multiValue";var P$H="dInfo";var v8X="multiValues";var F_A="rototyp";var g2v="abel";var E_q="otyp";var K70="taSrc";var r2U="inputControl";var O6U="_mult";var q4j="displayNode";var i$N="ltiSet";var c5p="ypeFn";var l0_="typ";var j8y="formatters";var P2o="ototype";var Q6S="_format";var W10="prototy";var m_y="itable";var n3N="ot";var X3p="tiEd";var t7n="submittable";var r3i="efa";var r7y="nullD";var v6p="Fn";var g5L="multiEditable";var U2j="_msg";var h2w=O6U;h2w+=H57;h2w+=U1L;h2w+=A8K;var U5T=J1k;U5T+=w6M;var a7V=Y5Y;a7V+=f49;a7V+=Z3X;var K04=b_I;K04+=Y90;K04+=h7T;var x5N=K75;x5N+=X3p;x5N+=m_y;var F2a=W10;F2a+=h7T;var l7P=Z$a;l7P+=o4O;l7P+=M1W;var b7r=J1k;b7r+=w6M;var a7A=t44;a7A+=K70;var K1V=W__;K1V+=j1M;K1V+=B5$;K1V+=Z5WrO.t9K;var y6P=W__;y6P+=t2B;y6P+=h7T;var N24=S7V;N24+=S$W;var H$G=W10;H$G+=h7T;var g14=b_I;g14+=E_q;g14+=Z5WrO.t9K;var k94=y0a;k94+=K1e;k94+=J_L;var q4l=l7Y;q4l+=Z5WrO.t9K;var d9x=h6D;d9x+=y0a;d9x+=k$_;var b7X=J1k;b7X+=w6M;var m2i=r7y;m2i+=r3i;m2i+=N9x;var g7H=l7Y;g7H+=Z5WrO.t9K;var E$1=h8l;E$1+=N2K;E$1+=B5W;var i2t=Z5WrO.S9O;i2t+=b43;i2t+=Z5WrO.t9K;var j3b=y9Z;j3b+=O8W;j3b+=i$N;var a3E=W__;a3E+=F_A;a3E+=Z5WrO.t9K;var J8x=y9Z;J8x+=k0w;J8x+=z6Y;var w95=Y5Y;w95+=P2o;var b8C=d1p;b8C+=B1b;b8C+=Z5WrO.p8I;var g_8=x$8;g_8+=y0a;g_8+=d21;g_8+=l_8;var K9t=S$W;K9t+=Y5E;var U$p=W__;U$p+=t2B;U$p+=W__;U$p+=Z5WrO.t9K;var I3E=S$W;I3E+=g2v;var o8n=W__;o8n+=t2B;o8n+=W__;o8n+=Z5WrO.t9K;var H6f=m9y;H6f+=Z5WrO.S9O;H6f+=W__;H6f+=v25;var u94=b_I;u94+=B5W;var j95=N$u;j95+=v3D;var i9p=Z5WrO.t9K;i9p+=v3D;var O6t=S$l;O6t+=Z5WrO[293400];var u3K=h8l;u3K+=Z3X;var c2V=Y5Y;c2V+=n3N;c2V+=B5W;var N_b=w0B;N_b+=S$W;N_b+=Z5WrO.t9K;var u$$=b_I;u$$+=E_q;u$$+=Z5WrO.t9K;function Field(options,classes,host){var P1x="tore";var q28="sg-e";var m$8="<spa";var H6p="=\"label\" cl";var V90='<div data-dte-e="msg-label" class="';var J7v="<div data-dte-e=\"input\" cl";var H_H="label data-dte-e";var a8N="classN";var R1L="ltiR";var u5w="<div data-dte-e=\"input-control";var L3Y='msg-error';var c1C="msg-messa";var g4Y='msg-multi';var Q47="ultiInfo";var H0B='msg-label';var k9x="resto";var q16='<div data-dte-e="field-processing" class="';var g9I='Error adding field - unknown field type ';var g3g="msg-m";var Z1r="valTo";var S3K="n data-dte-e=\"multi-info\" class=\"";var d_W="ternalI18n";var T8r="<div data-dte-e=\"msg-";var k0e="ms";var k2R='DTE_Field_';var l1v="bel>";var G2P="namePrefix";var y_v="/d";var W45="tiR";var q2t="message\" class=\"";var k15="typePrefix";var f9U='<div data-dte-e="msg-info" class="';var J4H="labe";var b7M="input-";var e78="eturn";var t_I="g-lab";var u4E='<div data-dte-e="multi-value" class="';var B$b='" for="';var P6T="ontrol";var c32='<div data-dte-e="msg-multi" class="';var l4T="efaul";var g2n="msg-in";var D55='input-control';var j9Q='<div data-dte-e="msg-error" class="';var C$e='msg-info';var O1T="eld-processing";var d47="multi-inf";var q4m=V5y;q4m+=v67;var F2u=Z5WrO.K_g;F2u+=S$W;F2u+=I$8;F2u+=G5_;var S7G=f49;S7G+=Z5WrO.S9O;var d7z=y9Z;d7z+=k0w;d7z+=W45;d7z+=e78;var f8u=Z5WrO[293400];f8u+=f49;f8u+=y9Z;var D1A=p0i;D1A+=O1T;var d$s=d47;d$s+=f49;var O9G=G1l;O9G+=C5e;O9G+=S$W;var U0A=b7M;U0A+=Z5WrO.K_g;U0A+=P6T;var q3u=c1C;q3u+=l_8;var V2C=g2n;V2C+=T6g;var X7p=Z5WrO[293400];X7p+=Y72;var h06=y0a;h06+=m9y;h06+=j4$;var E7O=F$W;E7O+=c6x;E7O+=Z5WrO.S9O;var N9h=K5V;N9h+=y_v;N9h+=J6f;var e2Z=L0B;e2Z+=P$H;var J8X=B2i;J8X+=K63;var h75=g3g;h75+=h4Y;h75+=f0A;var y0j=T8r;y0j+=q2t;var I_$=P1O;I_$+=Z5WrO[293400];I_$+=y__;I_$+=o7D;var O2d=y9Z;O2d+=q28;O2d+=q_n;O2d+=L3p;var Q5Q=k9x;Q5Q+=z0g;var b4h=d1p;b4h+=R1L;b4h+=h4Y;b4h+=P1x;var S$o=r73;S$o+=E_X;var n6q=m9y;n6q+=Z5WrO.S9O;n6q+=Z5WrO[713];n6q+=f49;var q$G=y9Z;q$G+=Q47;var X49=m$8;X49+=S3K;var T9z=N2K;T9z+=P4S;T9z+=S$W;T9z+=Z5WrO.t9K;var j49=u5w;j49+=m8V;j49+=R0y;var M$a=J7v;M$a+=N5O;var e9Q=r73;e9Q+=S$W;e9Q+=Z5WrO.L$5;e9Q+=l1v;var T3E=J4H;T3E+=S$W;T3E+=I_B;var F$p=m8V;F$p+=o7D;var W54=k0e;W54+=t_I;W54+=t9I;var m_l=G1l;m_l+=Q7d;var Y_U=m8V;Y_U+=o7D;var b_s=K5V;b_s+=H_H;b_s+=H6p;b_s+=N5O;var e8k=a8N;e8k+=Z5WrO.L$5;e8k+=x$8;var K6I=f8T;K6I+=m9y;K6I+=D3P;K6I+=R0y;var G0F=Z1r;G0F+=L7L;G0F+=y3x;var P2_=S7V;P2_+=T7s;P2_+=W1U;var w8u=m9y;w8u+=Z5WrO[293400];var a27=l0_;a27+=Z5WrO.t9K;var J96=N2K;J96+=Z5WrO.x6j;J96+=h7T;var t1x=Z5WrO[293400];t1x+=l4T;t1x+=Z5WrO.a73;var s51=p6L;s51+=x2f;s51+=Z5WrO[293400];var z72=y9Z;z72+=O8W;z72+=Z83;z72+=m9y;var u5x=m9y;u5x+=Z5WrO.S9O;u5x+=d_W;var that=this;var multiI18n=host[u5x]()[z72];var opts=$[s51](V0I,{},Field[t1x],options);if(!Editor[M9y][opts[J96]]){throw new Error(g9I + opts[C7b]);}this[y0a]={classes:classes,host:host,multiIds:[],multiValue:f_Y,multiValues:{},name:opts[A$O],opts:opts,processing:f_Y,type:Editor[M9y][opts[a27]]};if(!opts[w8u]){var f3J=Z5WrO.S9O;f3J+=b43;f3J+=Z5WrO.t9K;var b54=m9y;b54+=Z5WrO[293400];opts[b54]=(k2R + opts[f3J])[J2U](/ /g,g7e);}if(opts[g6F] === b_u){var C$4=Z5WrO.S9O;C$4+=b43;C$4+=Z5WrO.t9K;var j6m=Z5WrO[293400];j6m+=Z5WrO.L$5;j6m+=N2K;j6m+=Z5WrO.L$5;opts[j6m]=opts[C$4];}this[P2_]=function(d){p5T.Z7s();var F5C='editor';return dataGet(opts[g6F])(d,F5C);};this[G0F]=dataSet(opts[g6F]);var template=$(K6I + classes[i4u] + f9f + classes[k15] + opts[C7b] + f9f + classes[G2P] + opts[A$O] + f9f + opts[e8k] + z2D + b_s + classes[I2Z] + B$b + Editor[u8S](opts[s2P]) + Y_U + opts[m_l] + V90 + classes[W54] + F$p + opts[T3E] + L7i + e9Q + M$a + classes[f_F] + z2D + j49 + classes[r2U] + J8g + u4E + classes[i2z] + z2D + multiI18n[T9z] + X49 + classes[q$G] + z2D + multiI18n[n6q] + n7q + S$o + c32 + classes[b4h] + z2D + multiI18n[Q5Q] + L7i + j9Q + classes[O2d] + I_$ + y0j + classes[h75] + z2D + opts[W92] + J8X + f9U + classes[C$e] + z2D + opts[e2Z] + L7i + L7i + q16 + classes[J3I] + W3S + N9h);var input=this[E7O](Q9X,opts);var side=m3D;if(input && input[h06]){var i38=m9y;i38+=Z5WrO.S9O;i38+=i9O;i38+=N2K;var b25=y0a;b25+=m9y;b25+=Z5WrO[293400];b25+=Z5WrO.t9K;side=input[b25];input=input[i38];}if(input !== m3D){el(D55,template)[X6o](input);}else {var w09=Z5WrO.S9O;w09+=V3J;var w2F=l1J;w2F+=c_i;template[Q8G](w2F,w09);}this[X7p]={container:template,fieldError:el(L3Y,template),fieldInfo:el(V2C,template),fieldMessage:el(q3u,template),inputControl:el(U0A,template),label:el(O9G,template)[j6E](side),labelInfo:el(H0B,template),multi:el(g3r,template),multiInfo:el(d$s,template),multiReturn:el(g4Y,template),processing:el(D1A,template)};this[f8u][r36][c2S](i5v,function(){var d7d="disabled";var v00="ha";var o8u=N2K;o8u+=w6M;var K1L=v00;K1L+=y0a;K1L+=Z20;K1L+=o7h;p5T.Z7s();if(that[y0a][k7c][g5L] && !template[K1L](classes[d7d]) && opts[o8u] !== V7s){var p$p=D3P;p$p+=Z5WrO.L$5;p$p+=S$W;that[p$p](b_u);that[D9n]();}});this[E9e][d7z][S7G](F2u,function(){var y60="tiResto";var F$C=d1p;F$C+=S$W;F$C+=y60;F$C+=z0g;p5T.Q1A();that[F$C]();});$[q4m](this[y0a][C7b],function(name,fn){if(typeof fn === s8p && that[name] === undefined){that[name]=function(){var Q3u="_typ";var o0o=Q3u;o0o+=C$W;var args=Array[D6w][o0B][R5q](arguments);args[k$n](name);p5T.Q1A();var ret=that[o0o][n5i](that,args);return ret === undefined?that:ret;};}});}Field[u$$][j5s]=function(set){var x00='default';var K2m="defaul";var S9d=j4$;S9d+=Z5WrO[713];var opts=this[y0a][k7c];if(set === undefined){var f1S=g_d;f1S+=y5e;var i0b=K2m;i0b+=N2K;var def=opts[x00] !== undefined?opts[i0b]:opts[j5s];return typeof def === f1S?def():def;}opts[S9d]=set;return this;};Field[D6w][N_b]=function(){var V0M="dClas";var O5O='disable';var x18=F$W;x18+=C7b;x18+=v6p;var W4A=B2N;W4A+=Z5WrO[156815];W4A+=S$W;W4A+=Y57;var V9n=Z5WrO.K_g;V9n+=G1l;V9n+=p5s;var S5K=Z5WrO.L$5;S5K+=Z5WrO[293400];S5K+=V0M;S5K+=y0a;var M7V=m4G;M7V+=j84;this[E9e][M7V][S5K](this[y0a][V9n][W4A]);this[x18](O5O);return this;};Field[c2V][o1l]=function(){var O3U=Z5WrO.K_g;O3U+=y0a;O3U+=y0a;var B8Z=Z5WrO[156815];B8Z+=f49;B8Z+=Z5WrO[293400];B8Z+=Z5WrO.x6j;var N2R=m4G;N2R+=N2K;N2R+=i_E;var container=this[E9e][N2R];return container[j8R](B8Z)[f6V] && container[O3U](B5f) !== V67?V0I:f_Y;};Field[u3K][S$l]=function(toggle){var H4K='enable';var O8A=E$C;O8A+=Z5WrO.x6j;O8A+=W__;O8A+=C$W;var d3g=i$g;d3g+=Q80;d3g+=u_4;d3g+=Z5WrO[293400];var y6J=Z5WrO.K_g;y6J+=S$W;y6J+=o53;var K$T=Z5WrO[293400];K$T+=f49;K$T+=y9Z;if(toggle === void s87){toggle=V0I;}if(toggle === f_Y){var O6x=i$g;O6x+=b3g;O6x+=Z5WrO.t9K;return this[O6x]();}this[K$T][V$c][n44](this[y0a][y6J][d3g]);this[O8A](H4K);p5T.Z7s();return this;};Field[D6w][O6t]=function(){var q5R="has";var L4g="conta";var r4T=R6d;r4T+=Y57;var n_q=Z5WrO.K_g;n_q+=S$W;n_q+=o7h;n_q+=h4Y;var l07=q5R;l07+=Z20;l07+=o7h;var d2Y=L4g;d2Y+=x_9;d2Y+=Z5WrO.i5Y;p5T.Q1A();var Q5E=Z5WrO[293400];Q5E+=f49;Q5E+=y9Z;return this[Q5E][d2Y][l07](this[y0a][n_q][r4T]) === f_Y;};Field[D6w][i9p]=function(msg,fn){var M4g="classe";p5T.Z7s();var R8c="fieldEr";var W2i='errorMessage';var Y$c=R8c;Y$c+=B6V;var R$h=i$E;R$h+=y9Z;var a9E=U4k;a9E+=y0a;a9E+=k$T;var M0Y=E$C;M0Y+=c5p;var Z9W=M4g;Z9W+=y0a;var classes=this[y0a][Z9W];if(msg){this[E9e][V$c][A_M](classes[u2r]);}else {var s3f=Z5WrO[293400];s3f+=Y72;this[s3f][V$c][n44](classes[u2r]);}this[M0Y](W2i,msg);return this[a9E](this[R$h][Y$c],msg,fn);};Field[D6w][q1Z]=function(msg){var z0V=z_2;z0V+=S$W;z0V+=P$H;var i8L=Z5WrO[293400];i8L+=f49;i8L+=y9Z;var h8N=F$W;h8N+=y9Z;h8N+=y0a;h8N+=k$T;return this[h8N](this[i8L][z0V],msg);};Field[D6w][z4d]=function(){var K7L="ltiIds";var u2t=S$W;u2t+=F5J;var c3K=y9Z;c3K+=O8W;c3K+=K7L;return this[y0a][i2z] && this[y0a][c3K][u2t] !== q31;};Field[D6w][j95]=function(){var j8p="las";var M2U="hasC";var y9y=Z5WrO.i5Y;y9y+=B6V;var W2b=M2U;W2b+=j8p;W2b+=y0a;p5T.Q1A();var O9A=Z5WrO[293400];O9A+=f49;O9A+=y9Z;return this[O9A][V$c][W2b](this[y0a][t5b][y9y]);};Field[u94][H6f]=function(){var P9L="textarea";var n9N="input,";var G$M="select, ";var h6r=Z5WrO[293400];h6r+=f49;h6r+=y9Z;var l1d=n9N;l1d+=X3f;l1d+=G$M;l1d+=P9L;var z5m=a7Y;z5m+=O8W;z5m+=N2K;var n7$=N2K;n7$+=Z5WrO.x6j;n7$+=W__;n7$+=Z5WrO.t9K;return this[y0a][n7$][f_F]?this[Y2M](z5m):$(l1d,this[h6r][V$c]);};Field[D6w][D9n]=function(){var Y3_="input, select";var d4l="cus";var m0P=", textare";var v9Z=N2K;v9Z+=Z5WrO.x6j;v9Z+=W__;v9Z+=Z5WrO.t9K;if(this[y0a][v9Z][D9n]){var o5v=T6g;o5v+=d4l;this[Y2M](o5v);}else {var o3u=Y3_;o3u+=m0P;o3u+=Z5WrO.L$5;$(o3u,this[E9e][V$c])[D9n]();}return this;};Field[D6w][h7H]=function(){var w7K="getFormat";var v4Q=w7K;v4Q+=N2K;v4Q+=Z5WrO.i5Y;var l$K=k$T;l$K+=Z5WrO.t9K;l$K+=N2K;p5T.Z7s();if(this[z4d]()){return undefined;}return this[Q6S](this[Y2M](l$K),this[y0a][k7c][v4Q]);};Field[o8n][H2u]=function(animate){var W$U="acit";var R1a=r7G;R1a+=X5o;p5T.Z7s();var s18=C_d;s18+=f49;s18+=y0a;s18+=N2K;var E1V=f49;E1V+=W__;E1V+=W$U;E1V+=Z5WrO.x6j;var el=this[E9e][V$c];var opacity=parseFloat($(this[y0a][c8X][q4j]())[Q8G](E1V));if(animate === undefined){animate=V0I;}if(this[y0a][s18][R1a]() && opacity > U5_ && animate && $[Q2x][h$p]){el[h$p]();}else {el[Q8G](B5f,V67);}return this;};Field[D6w][I3E]=function(str){var s6V="labelInfo";var P$l=Z5WrO.L$5;P$l+=f96;p5T.Z7s();P$l+=y7w;P$l+=Z5WrO[293400];var O_F=G1l;O_F+=Q7d;var label=this[E9e][O_F];var labelInfo=this[E9e][s6V][H5v]();if(str === undefined){return label[f_u]();}label[f_u](str);label[P$l](labelInfo);return this;};Field[U$p][K9t]=function(msg){var k99="sg";var E_C="labelInf";var M4J=E_C;M4J+=f49;var s0x=Z5WrO[293400];s0x+=f49;s0x+=y9Z;var b38=U4k;p5T.Q1A();b38+=k99;return this[b38](this[s0x][M4J],msg);};Field[D6w][g_8]=function(msg,fn){var N2I="Mes";var A5w=c7Y;A5w+=N2I;A5w+=f0A;var D4e=Z5WrO[293400];D4e+=f49;D4e+=y9Z;return this[U2j](this[D4e][A5w],msg,fn);};Field[D6w][b8C]=function(id){var value;var multiValues=this[y0a][v8X];var multiIds=this[y0a][g9d];var isMultiValue=this[z4d]();if(id === undefined){var L$G=D3P;L$G+=Z5WrO.L$5;L$G+=S$W;var fieldVal=this[L$G]();value={};for(var _i=s87,multiIds_1=multiIds;_i < multiIds_1[f6V];_i++){var multiId=multiIds_1[_i];value[multiId]=isMultiValue?multiValues[multiId]:fieldVal;}}else if(isMultiValue){value=multiValues[id];}else {value=this[F4A]();}return value;};Field[w95][J8x]=function(){var w2b="_multiValue";var L0n="multiV";var i1R=w2b;i1R+=A8K;var G78=L0n;G78+=R5W;G78+=Z5WrO.t9K;this[y0a][G78]=V0I;this[i1R]();};Field[a3E][j3b]=function(id,val,recalc){var A$E="ject";var O8E="isPlainOb";var s6c=O8E;s6c+=A$E;if(recalc === void s87){recalc=V0I;}var that=this;var multiValues=this[y0a][v8X];var multiIds=this[y0a][g9d];if(val === undefined){val=id;id=undefined;}var set=function(idSrc,valIn){p5T.Z7s();if($[H7Y](idSrc,multiIds) === -q31){multiIds[I59](idSrc);}multiValues[idSrc]=that[Q6S](valIn,that[y0a][k7c][W3$]);};if($[s6c](val) && id === undefined){var M7B=Z5WrO.t9K;M7B+=Z5WrO.L$5;M7B+=Z5WrO.K_g;M7B+=C_d;$[M7B](val,function(idSrc,innerVal){set(idSrc,innerVal);});}else if(id === undefined){$[g1o](multiIds,function(i,idSrc){p5T.Q1A();set(idSrc,val);});}else {set(id,val);}this[y0a][i2z]=V0I;if(recalc){this[r3K]();}return this;};Field[D6w][i2t]=function(){var r1R=Z5WrO.S9O;r1R+=Z5WrO.L$5;r1R+=x$8;return this[y0a][k7c][r1R];};Field[E$1][y4O]=function(){var v6F=m4G;v6F+=j84;var h7q=Z5WrO[293400];h7q+=f49;h7q+=y9Z;return this[h7q][v6F][s87];};Field[g7H][m2i]=function(){var s2E="nullDefault";var l2J=f49;l2J+=W__;l2J+=N2K;l2J+=y0a;return this[y0a][l2J][s2E];};p5T.Q1A();Field[b7X][d9x]=function(set){var H9C="rnalEv";var U6i="inte";var e3M='processing-field';var R1s=U6i;R1s+=H9C;R1s+=Z5WrO.t9K;R1s+=A$P;var E0s=Z5WrO.S9O;E0s+=f49;E0s+=Z5WrO.S9O;E0s+=Z5WrO.t9K;var E0a=Z5WrO.K_g;E0a+=y0a;E0a+=y0a;var m2P=Z5WrO[293400];m2P+=f49;m2P+=y9Z;if(set === undefined){return this[y0a][J3I];}this[m2P][J3I][E0a](B5f,set?P3z:E0s);this[y0a][J3I]=set;this[y0a][c8X][R1s](e3M,[set]);return this;};Field[q4l][h1G]=function(val,multiCheck){var w9h="mat";var c_y="tityDe";var c_O="_type";var a0H='set';var s_m="cod";var h5b=y7w;h5b+=c_y;p5T.Q1A();h5b+=s_m;h5b+=Z5WrO.t9K;if(multiCheck === void s87){multiCheck=V0I;}var decodeFn=function(d){var r17='£';var Z$P='\'';var M1b='"';var S8j=o4O;S8j+=Z5WrO.t9K;S8j+=v8h;S8j+=w8H;var y58=D8M;p5T.Q1A();y58+=Z5WrO.L$5;y58+=w8H;var n$v=z0g;n$v+=W__;n$v+=s88;n$v+=Z5WrO.t9K;var s3d=o4O;s3d+=V$a;s3d+=G1l;s3d+=w8H;var v3e=y0a;v3e+=N$5;v3e+=Z5WrO.S9O;v3e+=k$T;return typeof d !== v3e?d:d[s3d](/&gt;/g,O0S)[J2U](/&lt;/g,f$6)[J2U](/&amp;/g,T9n)[n$v](/&quot;/g,M1b)[y58](/&#163;/g,r17)[J2U](/&#0?39;/g,Z$P)[S8j](/&#0?10;/g,d5n);};this[y0a][i2z]=f_Y;var decode=this[y0a][k7c][h5b];if(decode === undefined || decode === V0I){if(Array[z4s](val)){var l5C=S$W;l5C+=Z5WrO.t9K;l5C+=b9K;for(var i=s87,ien=val[l5C];i < ien;i++){val[i]=decodeFn(val[i]);}}else {val=decodeFn(val);}}if(multiCheck === V0I){var U8y=E$C;U8y+=c5p;var T8w=f49;T8w+=i3z;T8w+=y0a;var v6h=F5e;v6h+=w9h;val=this[v6h](val,this[y0a][T8w][W3$]);this[U8y](a0H,val);this[r3K]();}else {var u7c=c_O;u7c+=v6p;this[u7c](a0H,val);}return this;};Field[D6w][k94]=function(animate,toggle){var u7f="sl";var H1y="deDo";var v8x="sli";var x5_="ideDow";var I06=v8x;I06+=H1y;I06+=x6f;var r0U=Z5WrO[713];r0U+=Z5WrO.S9O;var V8L=C_d;V8L+=f49;V8L+=y0a;V8L+=N2K;var C_f=Z5WrO.K_g;C_f+=y0a;C_f+=y0a;var E5R=K1e;E5R+=Y75;var t_A=Z5WrO[293400];t_A+=Y72;if(animate === void s87){animate=V0I;}if(toggle === void s87){toggle=V0I;}if(toggle === f_Y){var o1p=L_Y;o1p+=Z5WrO.t9K;return this[o1p](animate);}p5T.Z7s();var el=this[t_A][V$c];var opacity=parseFloat($(this[y0a][E5R][q4j]())[C_f](C3J));if(this[y0a][V8L][l4D]() && opacity > U5_ && animate && $[r0U][I06]){var u6T=u7f;u6T+=x5_;u6T+=Z5WrO.S9O;el[u6T]();}else {var d27=Z5WrO[293400];d27+=m9y;d27+=f1T;d27+=X5o;var a2g=Z5WrO.K_g;a2g+=y0a;a2g+=y0a;el[a2g](d27,b_u);}return this;};Field[g14][Z$W]=function(options,append){var r$X="upd";var V7T="updat";var C5p=r$X;C5p+=N6z;if(append === void s87){append=f_Y;}if(this[y0a][C7b][C5p]){var g1p=V7T;g1p+=Z5WrO.t9K;var f3o=F$W;f3o+=c6x;f3o+=Z5WrO.S9O;this[f3o](g1p,options,append);}return this;};Field[H$G][N24]=function(val){var T_I=y0a;T_I+=Z5WrO.t9K;T_I+=N2K;var O4I=k$T;O4I+=Z5WrO.t9K;p5T.Z7s();O4I+=N2K;return val === undefined?this[O4I]():this[T_I](val);};Field[y6P][b0T]=function(value,original){var N41="compa";var I2$=N41;I2$+=z0g;var compare=this[y0a][k7c][I2$] || deepCompare;p5T.Q1A();return compare(value,original);};Field[K1V][a7A]=function(){var Y0E=R4j;Y0E+=N2K;Y0E+=y0a;p5T.Q1A();return this[y0a][Y0E][g6F];};Field[b7r][l7P]=function(){var d5d="des";var R_4=d5d;R_4+=N2K;R_4+=I5g;R_4+=Z5WrO.x6j;var k0I=F$W;k0I+=l0_;k0I+=C$W;var S3E=z0g;S3E+=T7T;var X0D=b_P;X0D+=i_E;var W6p=i$E;W6p+=y9Z;this[W6p][X0D][S3E]();this[k0I](R_4);return this;};Field[F2a][x5N]=function(){var j6e=f49;j6e+=W__;j6e+=Z5WrO.a73;p5T.Z7s();return this[y0a][j6e][g5L];};Field[D6w][g9d]=function(){var A_t="ltiI";var Y$m=d1p;Y$m+=A_t;Y$m+=v4L;return this[y0a][Y$m];};Field[K04][j9w]=function(show){var A4T=Z5WrO[156815];p5T.Z7s();A4T+=S$W;A4T+=o0q;A4T+=G5_;var W_3=Z5WrO.K_g;W_3+=y0a;W_3+=y0a;this[E9e][K6c][W_3]({display:show?A4T:V67});};Field[a7V][y2U]=function(){var L$D="multiVa";var P3_="iIds";p5T.Q1A();var E1d="lues";var q_G=L$D;q_G+=E1d;var M58=y9Z;M58+=k0w;M58+=N2K;M58+=P3_;this[y0a][M58]=[];this[y0a][q_G]={};};Field[D6w][t7n]=function(){return this[y0a][k7c][R1K];};Field[U5T][U2j]=function(el,msg,fn){var I1D="internalSettings";var h8L="Down";var y4N="lid";var r2Z=":visibl";var o9a=S2q;o9a+=V$7;o9a+=N2K;o9a+=Z5WrO.t9K;var o31=r2Z;o31+=Z5WrO.t9K;var c4j=m9y;c4j+=y0a;var g9H=W__;p5T.Q1A();g9H+=N1_;g9H+=y7w;g9H+=N2K;if(msg === undefined){return el[f_u]();}if(typeof msg === s8p){var E2O=N2K;E2O+=Z5WrO.L$5;E2O+=x1A;E2O+=Z5WrO.t9K;var c0$=C_d;c0$+=P5E;var editor=this[y0a][c0$];msg=msg(editor,new DataTable$2[H0n](editor[I1D]()[E2O]));}if(el[g9H]()[c4j](o31) && $[Q2x][o9a]){var Y5a=C_d;Y5a+=N2K;Y5a+=y9Z;Y5a+=S$W;el[Y5a](msg);if(msg){var j7D=y0a;j7D+=y4N;j7D+=Z5WrO.t9K;j7D+=h8L;el[j7D](fn);}else {el[h$p](fn);}}else {var s3n=D6n;s3n+=o$V;var F61=Z5WrO[156815];F61+=S$W;F61+=o0q;F61+=G5_;el[f_u](msg || b_u)[Q8G](B5f,msg?F61:s3n);if(fn){fn();}}return this;};Field[D6w][h2w]=function(){var s$9="alM";var l6Y="nfo";var n$K="ultiVa";var R$9="eClass";var G6z="internalI18n";var k2J="iReturn";var V4S="intern";var j7B="multiNoEdit";var P8g="toggl";var c5K="isMultiVal";var l9j="bloc";var Q_0="noMult";var t99="ultiI";var v9f=V4S;v9f+=s$9;v9f+=t99;v9f+=l6Y;var b3t=W88;b3t+=p5s;var L5x=P8g;L5x+=R$9;var T8I=y9Z;T8I+=k0w;T8I+=N2K;T8I+=m9y;var u5i=Q_0;u5i+=m9y;var P1o=y9Z;P1o+=O8W;P1o+=S$W;p5T.Q1A();P1o+=V6z;var d7A=Z5WrO[156815];d7A+=e6V;d7A+=Z5WrO.K_g;d7A+=G5_;var Q1c=Z5WrO.K_g;Q1c+=y0a;Q1c+=y0a;var O_D=V4D;O_D+=k2J;var u2p=c5K;u2p+=a3W;var Y3T=y9Z;Y3T+=n$K;Y3T+=S$W;Y3T+=a3W;var last;var ids=this[y0a][g9d];var values=this[y0a][v8X];var isMultiValue=this[y0a][Y3T];var isMultiEditable=this[y0a][k7c][g5L];var val;var different=f_Y;if(ids){var x9I=S$W;x9I+=y7w;x9I+=k$T;x9I+=v4y;for(var i=s87;i < ids[x9I];i++){val=values[ids[i]];if(i > s87 && !deepCompare(val,last)){different=V0I;break;}last=val;}}if(different && isMultiValue || !isMultiEditable && this[u2p]()){var z6Z=d1p;z6Z+=Z83;z6Z+=m9y;var d7l=Z5WrO.S9O;d7l+=f49;d7l+=Z5WrO.S9O;d7l+=Z5WrO.t9K;var S4N=Z5WrO.K_g;S4N+=y0a;S4N+=y0a;var w10=i$E;w10+=y9Z;this[w10][r2U][S4N]({display:d7l});this[E9e][z6Z][Q8G]({display:P3z});}else {var V75=y9Z;V75+=k0w;V75+=N2K;V75+=m9y;var q61=l9j;q61+=G5_;this[E9e][r2U][Q8G]({display:q61});this[E9e][V75][Q8G]({display:V67});if(isMultiValue && !different){var P7G=F05;P7G+=N2K;this[P7G](last,f_Y);}}this[E9e][O_D][Q1c]({display:ids && ids[f6V] > q31 && different && !isMultiValue?d7A:V67});var i18n=this[y0a][c8X][G6z]()[P1o];this[E9e][K6c][f_u](isMultiEditable?i18n[f6e]:i18n[u5i]);this[E9e][T8I][L5x](this[y0a][b3t][j7B],!isMultiEditable);this[y0a][c8X][v9f]();return V0I;};Field[D6w][Y2M]=function(name){var C9Z="hif";var K$b=N2K;K$b+=Z5WrO.x6j;K$b+=W__;K$b+=Z5WrO.t9K;var s47=R4j;s47+=N2K;s47+=y0a;var l3m=s$_;l3m+=y0a;l3m+=C9Z;l3m+=N2K;var E_d=K4U;E_d+=N2K;E_d+=C_d;var args=[];for(var _i=q31;_i < arguments[E_d];_i++){args[_i - q31]=arguments[_i];}p5T.Z7s();args[l3m](this[y0a][s47]);var fn=this[y0a][K$b][name];if(fn){var m$e=C_d;m$e+=P5E;return fn[n5i](this[y0a][m$e],args);}};Field[D6w][n5_]=function(){var C1x="fieldError";var Y7J=Z5WrO[293400];Y7J+=f49;Y7J+=y9Z;return this[Y7J][C1x];};Field[D6w][Q6S]=function(val,formatter){var A2d="shift";var z2U="appl";var U6T="formatter";var w$M="lice";if(formatter){var D5f=C_d;D5f+=f49;D5f+=y0a;D5f+=N2K;var D1Q=o5d;D1Q+=S7y;var y8s=e7V;y8s+=z4t;y8s+=o2v;if(Array[y8s](formatter)){var p7U=z2U;p7U+=Z5WrO.x6j;var p8S=U6T;p8S+=y0a;var o1i=y0a;o1i+=w$M;var args=formatter[o1i]();var name_1=args[A2d]();formatter=Field[p8S][name_1][p7U](this,args);}return formatter[D1Q](this[y0a][D5f],val,this);}return val;};Field[T9R]=defaults;Field[j8y]={};return Field;})();var button={action:m3D,className:m3D,tabIndex:s87,text:m3D};var displayController={close:function(){},init:function(){},node:function(){},open:function(){}};var DataTable$1=$[S_F][x62];var apiRegister=DataTable$1[f_R][O9q];function _getInst(api){var h8q="_editor";var R9L=q9I;R9L+=p_z;R9L+=o4O;var K4v=f49;K4v+=L1h;K4v+=P4S;var L2b=m4G;L2b+=V0i;var ctx=api[L2b][s87];return ctx[K4v][R9L] || ctx[h8q];}function _setBasic(inst,opts,type,plural){var u1M="tons";var u2M="nfir";var M3$=/%d/;var R8Y=P5F;R8Y+=y0a;R8Y+=X0S;R8Y+=Z5WrO.t9K;var p8X=i57;p8X+=u_4;var X8u=Z5WrO[156815];X8u+=O8W;X8u+=N2K;X8u+=u1M;if(!opts){opts={};}if(opts[X8u] === undefined){var i9f=F$W;i9f+=Z5WrO[156815];i9f+=E6Y;i9f+=I$8;opts[C7_]=i9f;}if(opts[p8X] === undefined){var v$Y=N2K;v$Y+=P4S;v$Y+=S$W;v$Y+=Z5WrO.t9K;opts[v$Y]=inst[U_5][type][S8_];}if(opts[R8Y] === undefined){if(type === X1n){var n87=z0g;n87+=j7f;n87+=Z5WrO.t9K;var I70=P5F;I70+=d21;I70+=k$T;I70+=Z5WrO.t9K;var k6O=O7a;k6O+=u2M;k6O+=y9Z;var confirm_1=inst[U_5][type][k6O];opts[I70]=plural !== q31?confirm_1[F$W][n87](M3$,plural):confirm_1[E0o];}else {opts[W92]=b_u;}}return opts;}apiRegister(h9k,function(){return _getInst(this);});apiRegister(o2o,function(opts){var S8h="reat";var l4Z=Z5WrO.K_g;l4Z+=S8h;l4Z+=Z5WrO.t9K;var inst=_getInst(this);inst[L2J](_setBasic(inst,opts,l4Z));return this;});apiRegister(N9z,function(opts){var inst=_getInst(this);inst[p8v](this[s87][s87],_setBasic(inst,opts,D43));return this;});apiRegister(L6o,function(opts){var z9e=Z5WrO.t9K;z9e+=Z5WrO[293400];z9e+=P4S;var inst=_getInst(this);inst[p8v](this[s87],_setBasic(inst,opts,z9e));p5T.Z7s();return this;});apiRegister(i83,function(opts){var j1G="remov";var b8r=j1G;b8r+=Z5WrO.t9K;var inst=_getInst(this);inst[b8r](this[s87][s87],_setBasic(inst,opts,X1n,q31));return this;});apiRegister(K0G,function(opts){var R17=N6$;R17+=S8V;var inst=_getInst(this);inst[R17](this[s87],_setBasic(inst,opts,X1n,this[s87][f6V]));return this;});apiRegister(f5h,function(type,opts){var K0O="nli";var N3w="isPlain";var X7I="Obj";var y$4=N3w;y$4+=X7I;y$4+=R2u;if(!type){type=c8M;}else if($[y$4](type)){var L53=m9y;L53+=K0O;L53+=o$V;opts=type;type=L53;}_getInst(this)[type](this[s87][s87],opts);return this;});apiRegister(y64,function(opts){var R3i=r6m;R3i+=Z5WrO.t9K;_getInst(this)[R3i](this[s87],opts);return this;});apiRegister(j1C,file);apiRegister(V6B,files);$(document)[c2S](Q79,function(e,ctx,json){var u7m="namespace";var w15='dt';var l45=Z5WrO[713];l45+=m9y;l45+=S$W;l45+=h4Y;if(e[u7m] !== w15){return;}if(json && json[l45]){$[g1o](json[X$C],function(name,filesIn){var L3I="xten";var M8O=h$l;M8O+=h4Y;p5T.Q1A();var a$9=Z5WrO.t9K;a$9+=L3I;a$9+=Z5WrO[293400];if(!Editor[X$C][name]){Editor[X$C][name]={};}$[a$9](Editor[M8O][name],filesIn);});}});var _buttons=$[Q2x][L2N][W8S][C7_];$[K6v](_buttons,{create:{action:function(e,dt,node,config){var o$h="formTitle";var J6J="messa";var C7n="cess";var b_Y=N2K;b_Y+=m9y;b_Y+=N2K;b_Y+=u_4;var p1b=m9y;p1b+=F9c;var U8v=J6J;U8v+=l_8;var Y1f=H3E;Y1f+=Z5WrO.S9O;var v6c=Z5WrO.t9K;v6c+=R1T;var c2P=C4G;c2P+=N6z;var Q6$=c2S;Q6$+=Z5WrO.t9K;var d1C=h8l;d1C+=C7n;d1C+=k$_;p5T.Z7s();var y3B=Y57;y3B+=m9y;y3B+=N2K;y3B+=L3p;var that=this;var editor=config[y3B];this[d1C](V0I);editor[Q6$](G8o,function(){var v44="rocess";var P1i=W__;P1i+=v44;p5T.Z7s();P1i+=k$_;that[P1i](f_Y);})[c2P]($[v6c]({buttons:config[h9A],message:config[i28] || editor[Y1f][L2J][U8v],nest:V0I,title:config[o$h] || editor[p1b][L2J][b_Y]},config[U_v]));},className:F0U,editor:m3D,formButtons:{action:function(e){var P3u="submi";p5T.Q1A();var q21=P3u;q21+=N2K;this[q21]();},text:function(editor){var Q0v=Z5WrO.K_g;Q0v+=z0g;p5T.Z7s();Q0v+=G1P;Q0v+=Z5WrO.t9K;return editor[U_5][Q0v][R1K];}},formMessage:m3D,formOptions:{},formTitle:m3D,text:function(dt,node,config){var K8E="ons.cr";var a$2=Z5WrO.K_g;a$2+=o4O;a$2+=l9O;a$2+=Z5WrO.t9K;var G0A=Z5WrO.t9K;G0A+=Z5WrO[293400];p5T.Z7s();G0A+=P4S;G0A+=L3p;var I6S=Z5WrO[156815];I6S+=p4T;I6S+=K8E;I6S+=X4C;var w7y=Z3z;w7y+=o70;return dt[w7y](I6S,config[G0A][U_5][a$2][p14]);}},createInline:{action:function(e,dt,node,config){var r6o="formOption";var E56=r6o;E56+=y0a;var E8X=p8v;E8X+=f49;E8X+=o4O;config[E8X][K4r](config[i5X],config[E56]);},className:F0U,editor:m3D,formButtons:{action:function(e){p5T.Q1A();this[R1K]();},text:function(editor){var z28=M_y;z28+=Z5WrO.t9K;return editor[U_5][z28][R1K];}},formOptions:{},position:x71,text:function(dt,node,config){var r4x="tons.create";var o6N=Z5WrO[156815];o6N+=p4T;o6N+=c2S;var C6N=Z5WrO.K_g;C6N+=o4O;C6N+=V5y;C6N+=x0B;var n$p=m0C;n$p+=r4x;var Y4m=Z3z;Y4m+=t9f;Y4m+=Z5WrO.S9O;return dt[Y4m](n$p,config[g5x][U_5][C6N][o6N]);}},edit:{action:function(e,dt,node,config){var G_d="rmTitl";var P0o="colu";var Z7K=V6z;Z7K+=N2K;Z7K+=u_4;var H5f=Z5WrO.t9K;H5f+=Z5WrO[293400];H5f+=m9y;H5f+=N2K;var n9p=T6g;n9p+=G_d;n9p+=Z5WrO.t9K;var N3A=H3E;N3A+=Z5WrO.S9O;var N6b=Y5Y;N6b+=f49;N6b+=D3R;var X46=K4U;X46+=N2K;X46+=C_d;var E5h=P0o;E5h+=y9Z;E5h+=t$u;var that=this;var editor=config[g5x];var rows=dt[C$$]({selected:V0I})[s4T]();var columns=dt[E5h]({selected:V0I})[s4T]();var cells=dt[l9d]({selected:V0I})[s4T]();var items=columns[f6V] || cells[X46]?{cells:cells,columns:columns,rows:rows}:rows;this[N6b](V0I);editor[V3J](G8o,function(){p5T.Q1A();that[J3I](f_Y);})[p8v](items,$[D3A]({buttons:config[h9A],message:config[i28] || editor[N3A][p8v][W92],nest:V0I,title:config[n9p] || editor[U_5][H5f][Z7K]},config[U_v]));},className:f7_,editor:m3D,extend:D93,formButtons:{action:function(e){p5T.Q1A();this[R1K]();},text:function(editor){var O1I=Z5WrO.t9K;p5T.Q1A();O1I+=Z5WrO[293400];O1I+=m9y;O1I+=N2K;return editor[U_5][O1I][R1K];}},formMessage:m3D,formOptions:{},formTitle:m3D,text:function(dt,node,config){var X5k="buttons.ed";var D4M=Z5WrO[156815];D4M+=p4T;D4M+=c2S;var K0_=Y57;K0_+=P4S;var j0W=m9y;j0W+=Z5WrO.Q4J;j0W+=o70;var d2S=X5k;d2S+=P4S;var P0$=m9y;P0$+=Z5WrO.Q4J;P0$+=t9f;P0$+=Z5WrO.S9O;return dt[P0$](d2S,config[g5x][j0W][K0_][D4M]);}},remove:{action:function(e,dt,node,config){var e8t="mTitle";var E8$="rmOp";var N2Q="rmBu";var E2l="roces";var p2e="eOpen";var g$F=T6g;g$F+=E8$;p5T.Z7s();g$F+=V6z;g$F+=R_D;var Y2C=H3E;Y2C+=Z5WrO.S9O;var h9p=i3U;h9p+=e8t;var l8E=T6g;l8E+=N2Q;l8E+=I8W;l8E+=t$u;var o_g=Z5WrO.t9K;o_g+=R1T;var A3$=o4O;A3$+=v7F;A3$+=S81;A3$+=Z5WrO.t9K;var U9e=W__;U9e+=o4O;U9e+=p2e;var I1J=f49;I1J+=Z5WrO.S9O;I1J+=Z5WrO.t9K;var K_j=W__;K_j+=E2l;K_j+=z$f;var that=this;var editor=config[g5x];this[K_j](V0I);editor[I1J](U9e,function(){that[J3I](f_Y);})[A3$](dt[C$$]({selected:V0I})[s4T](),$[o_g]({buttons:config[l8E],message:config[i28],nest:V0I,title:config[h9p] || editor[Y2C][Z$f][S8_]},config[g$F]));},className:M51,editor:m3D,extend:E_2,formButtons:{action:function(e){this[R1K]();},text:function(editor){p5T.Z7s();var J9f="emo";var j7v=o4O;j7v+=J9f;j7v+=D3P;j7v+=Z5WrO.t9K;return editor[U_5][j7v][R1K];}},formMessage:function(editor,dt){var N0E="confirm";var u4I=M06;u4I+=G1l;u4I+=w8H;var b20=U$e;b20+=C_d;var R3l=O7a;R3l+=A_I;R3l+=Y0t;var h9u=m9y;h9u+=F9c;var u8L=I5g;u8L+=J_L;u8L+=y0a;var rows=dt[u8L]({selected:V0I})[s4T]();var i18n=editor[h9u][Z$f];var question=typeof i18n[R3l] === Z5m?i18n[N0E]:i18n[N0E][rows[f6V]]?i18n[N0E][rows[b20]]:i18n[N0E][F$W];return question[u4I](/%d/g,rows[f6V]);},formOptions:{},formTitle:m3D,limitTo:[n3I],text:function(dt,node,config){var V8m='buttons.remove';return dt[U_5](V8m,config[g5x][U_5][Z$f][p14]);}}});_buttons[c8x]=$[u42]({},_buttons[R6U]);_buttons[l2K][D3A]=D0p;_buttons[K7e]=$[D3A]({},_buttons[Z$f]);_buttons[g7S][D3A]=s8k;if(!DataTable || !DataTable[f72] || !DataTable[S6i](C6h)){throw new Error(K_$);}var Editor=(function(){var A2r="ateTime";var O$K="factory";var e4J="models";var l0H="internalMu";var G3y="ttings";var x7l="ypes";p5T.Q1A();var g9w="sion";var n0c="ources";var Y9d="internalSe";var N48="internalEvent";var p_i="rot";var E4A="lasses";var F3n="airs";var i3b="ternalI18";var E7y="2.";var C_n=I_D;C_n+=c$q;var B_O=Z5WrO[293400];B_O+=G1P;B_O+=E6r;B_O+=n0c;var H_f=U85;H_f+=f49;H_f+=J3_;var t4L=W__;t4L+=F3n;var L5q=L7L;L5q+=A2r;var i0P=Z5WrO.K_g;i0P+=E4A;var w6G=E7y;w6G+=L_N;w6G+=W5L;w6G+=Z5WrO[360066];var G94=D3P;G94+=Z5WrO.t9K;G94+=o4O;G94+=g9w;var h$Z=c7Y;h$Z+=X2z;h$Z+=x7l;var p$_=Y9d;p$_+=G3y;var e6p=W__;e6p+=p_i;e6p+=B5W;var l8J=l0H;l8J+=S$W;l8J+=V6z;l8J+=I_B;var G2z=x_9;G2z+=i3b;G2z+=Z5WrO.S9O;var l5B=Y5Y;l5B+=f49;l5B+=p_z;l5B+=C7b;function Editor(init,cjsJq){var Y9_="_nest";var J4t="ePosi";var W4w="model";var u5j='<div data-dte-e="processing" class="';var F$3="/div";var n7N="<div data-dte-e=\"body_content\"";var a3x="inError";var s4K="depend";var B7g="seReg";var v4h="tTable";var f70="_nestedOpen";var B_Z="_ass";var f11="<div";var B3n="Cannot find ";var P_y="emble";var N4O=" da";var v_e="wrappe";var f5T="v cl";var R3E="_submitSuccess";var U37='"><div class="';var H7O="que";var W9s="_crud";var u7t=" data-dte-";var s8t="uni";var R36="ta-dte-e=\"form_inf";var D8s="aye";var E6V="essing";var g1H="deta";var g7u='body_content';var o0Z="_submi";var d_b="mTabl";var A1N="setti";var d$A="Upda";var Z_L="_postop";var r5N="indicator";var G35="_me";var z64="ear";var v0J="_inputTr";var s_x="<div data-dte-e";var D5N="/div>";var k$S="niq";var o5N="o\" class=\"";var J9y='DataTables Editor must be initialised as a \'new\' instance';var m2u='xhr.dt.dte';var J8e="gger";var y3h="_n";var O4u="/f";var R5a="init";var W8L="ntName";var t2O="undependent";var Z2J="_ac";var G6M="form_co";var d2F="ad\" class=\"";var L3K="foote";var T2t="edClose";var C2K="tEditor";var Y8f='foot';var K7J=" controller ";var a7G="e=\"he";var h9U="_cl";var t6o="gs";var m4H="eo";var S$q='<div data-dte-e="form_buttons" class="';var G8N="><";var V5z='"></div></div>';var I6J="fau";var M19="eade";var U_z="m_content\" class=\"";var V2b="ormOpti";var E7M='initComplete';var P5i='<form data-dte-e="form" class="';var Z4O="ena";var O7L="mitEr";var D42='<div data-dte-e="foot" class="';var C4c="_weakInArray";var g1w="Main";var u9h="=\"for";var q3n="tionCla";var B37="i18n.dt.";var B6B="ade";var r4F="nTable";var u5V="ini";var r8K="_formOptions";var G2r="Proc";var d2n='init.dt.dte';var Q$G="_options";var u9j="rm>";var i_O="<div data-dte-e=\"body\"";var u75="essi";var R4R=" data-dte-e=\"form_error\" class=\"";var f_g="></";var e9t=u5V;e9t+=C2K;var w_f=K1p;w_f+=b9F;w_f+=Z5WrO.S9O;w_f+=N2K;var A6p=i$g;A6p+=y0a;A6p+=v8h;A6p+=Z5WrO.x6j;var G1M=Z5WrO[293400];G1M+=d7G;G1M+=X5o;var S1R=O8W;S1R+=k$S;S1R+=O8W;S1R+=Z5WrO.t9K;var U6N=O8W;U6N+=V_i;U6N+=I9m;U6N+=a3W;var C8v=B37;C8v+=D47;var X_S=s8t;X_S+=Z5WrO.n2i;X_S+=Z5WrO.t9K;var b6I=p0i;b6I+=u0S;b6I+=y0a;var o5j=Z5WrO[293400];o5j+=Y72;var a8I=r7C;a8I+=y7w;a8I+=N2K;a8I+=y0a;var g9P=V5y;g9P+=Z5WrO.K_g;g9P+=C_d;var A_F=d4c;A_F+=B6B;A_F+=o4O;var e_X=v_e;e_X+=o4O;var e6T=C_d;e6T+=M19;e6T+=o4O;var d7P=f11;d7P+=u7t;d7P+=a7G;d7P+=d2F;var L4n=f11;L4n+=N4O;L4n+=R36;L4n+=o5N;var f5q=Z5WrO.t9K;f5q+=v3D;var x_q=f11;x_q+=R4R;var p9m=G6M;p9m+=o79;var v_g=P1O;v_g+=E_X;var L0U=Z5WrO[293400];L0U+=f49;L0U+=y9Z;var u3f=K5V;u3f+=O4u;u3f+=f49;u3f+=u9j;var j64=Z5WrO.K_g;j64+=c2S;j64+=i4$;var Z9E=s_x;Z9E+=u9h;Z9E+=U_z;var I$$=N2K;I$$+=Z5WrO.L$5;I$$+=k$T;var T16=T6g;T16+=Y0t;var X07=B2i;X07+=K63;var m0F=m8V;m0F+=G8N;m0F+=F$3;m0F+=o7D;var n6J=f8T;n6J+=m9y;n6J+=f5T;n6J+=N5O;var u5t=m8V;u5t+=o7D;var j42=L3K;j42+=o4O;var r4S=K5V;r4S+=D5N;var S54=m8V;S54+=f_g;S54+=Z5WrO[293400];S54+=J6f;var h1V=Z5WrO.K_g;h1V+=r5J;h1V+=Z5WrO.t9K;h1V+=A$P;var C7v=Z5WrO[156815];C7v+=f49;C7v+=Z5WrO[293400];C7v+=Z5WrO.x6j;var o8I=n7N;o8I+=R0y;var B8M=Z5WrO[156815];B8M+=T3q;var Q2I=i_O;Q2I+=R0y;var x1K=m8V;x1K+=o7D;var i5F=s8t;i5F+=H7O;var p8$=A1N;p8$+=B2f;p8$+=y0a;var s1A=y9Z;s1A+=b$H;s1A+=t9I;s1A+=y0a;var d1V=H3E;d1V+=Z5WrO.S9O;var O9$=Z5WrO.K_g;O9$+=G1l;O9$+=y0a;O9$+=L_n;var S7X=g1H;S7X+=v67;var I$A=N2K;I$A+=Z5WrO.L$5;I$A+=Z5WrO[156815];I$A+=u_4;var T8D=Z5WrO[293400];T8D+=f49;T8D+=d_b;T8D+=Z5WrO.t9K;var e$r=Z5WrO[713];e$r+=V2b;e$r+=c2S;e$r+=y0a;var C1W=Z5WrO.L$5;C1W+=G2w;C1W+=Z5WrO.w$8;var a5Q=l_$;a5Q+=Z5WrO[626711];a5Q+=h5P;var s99=W4w;s99+=y0a;var C7o=j4$;C7o+=I6J;C7o+=S$W;C7o+=Z5WrO.a73;var I0S=F$W;I0S+=V0O;I0S+=O7L;I0S+=B6V;var I$v=o0Z;I$v+=v4h;var E9g=y3h;E9g+=f49;E9g+=G2r;E9g+=E6V;var x9G=u9W;x9G+=o0q;x9G+=u75;x9G+=B2f;var e_p=u9W;e_p+=m4H;e_p+=W__;e_p+=y7w;var x38=Z_L;x38+=Z5WrO.t9K;x38+=Z5WrO.S9O;var Y54=Y9_;Y54+=T2t;var n4Z=G35;n4Z+=o03;var P1V=Q$G;P1V+=d$A;P1V+=x0B;var N2U=v0J;N2U+=m9y;N2U+=J8e;var M2h=S9G;M2h+=s2h;M2h+=o$V;var O_3=r1g;O_3+=W8L;var H3s=W9s;H3s+=z4t;H3s+=t6o;var S71=h9U;S71+=f49;S71+=B7g;var e$k=B_Z;e$k+=P_y;e$k+=g1w;var H38=F$W;H38+=h3I;H38+=N6z;var a3u=o4A;a3u+=O4L;var y9T=Z2J;y9T+=q3n;y9T+=G6q;var R7h=l3G;R7h+=j4R;var l1a=y0a;l1a+=Z5WrO.t9K;l1a+=N2K;var e9a=f49;e9a+=o4O;e9a+=j4$;e9a+=o4O;var I8H=R4j;I8H+=y7w;var i8z=f49;i8z+=Z5WrO.S9O;i8z+=Z5WrO.t9K;var n1I=Z5WrO.S9O;n1I+=f49;n1I+=j4$;var N3R=C1j;N3R+=Z5WrO[293400];N3R+=Z5WrO.t9K;var F4m=P5F;F4m+=y0a;F4m+=Z5WrO.L$5;F4m+=l_8;var x$h=L_Y;x$h+=Z5WrO.t9K;var G0N=Z5WrO[713];G0N+=m9y;G0N+=S$W;G0N+=h4Y;var r_G=z_2;r_G+=w$q;var C32=Z4O;C32+=x1A;C32+=Z5WrO.t9K;var J_R=Z5WrO.t9K;J_R+=Z5WrO[293400];J_R+=m9y;J_R+=N2K;var u$R=Z5WrO[293400];u$R+=d2k;u$R+=S9R;var T$9=i$g;T$9+=I5s;T$9+=D8s;T$9+=Z5WrO[293400];var l7d=B2N;l7d+=Z5WrO[156815];l7d+=S$W;l7d+=Z5WrO.t9K;var x0n=j4$;x0n+=y0a;x0n+=c9U;x0n+=M1W;var E0K=s4K;E0K+=y7w;E0K+=N2K;var h2o=L21;h2o+=l9O;h2o+=Z5WrO.t9K;var O1r=n0k;O1r+=Z5WrO.t9K;var u1p=v_k;u1p+=z64;var o_e=r6m;o_e+=J4t;o_e+=N2K;o_e+=Z5WrO[626711];var _this=this;this[C_E]=add;this[V$_]=ajax;this[d11]=background;this[B4B]=blur;this[u5Y]=bubble;this[Y$S]=bubbleLocation;this[o_e]=bubblePosition;this[C7_]=buttons;this[u1p]=clear;this[O1r]=close;this[h2o]=create;this[t2O]=undependent;this[E0K]=dependent;this[x0n]=destroy;this[l7d]=disable;this[l4D]=display;this[T$9]=displayed;this[u$R]=displayNode;this[J_R]=edit;this[C32]=enable;this[u2r]=error$1;this[r_G]=field;this[O2h]=fields;this[X2g]=file;this[G0N]=files;this[h7H]=get;this[x$h]=hide;this[J2J]=ids;this[a3x]=inError;this[Z_R]=inline;this[K4r]=inlineCreate;this[F4m]=message;this[N3R]=mode;this[u$I]=modifier;this[w8F]=multiGet;this[C7W]=multiSet;this[n1I]=node;this[D6G]=off;this[c2S]=on;this[i8z]=one;this[I8H]=open;this[e9a]=order;this[Z$f]=remove;this[l1a]=set;this[R7h]=show;this[R1K]=submit;this[f3z]=table;this[t2g]=template;this[S8_]=title;this[F4A]=val;this[y9T]=_actionClass;this[a3u]=_ajax;this[H38]=_animate;this[e$k]=_assembleMain;this[c$u]=_blur;this[w$W]=_clearDynamicInfo;this[T2u]=_close;this[S71]=_closeReg;this[H3s]=_crudArgs;this[D9p]=_dataSource;this[s1O]=_displayReorder;this[t5u]=_edit;this[a5N]=_event;this[O_3]=_eventName;this[E_a]=_fieldFromNode;this[b9N]=_fieldNames;this[v0F]=_focus;this[r8K]=_formOptions;this[M2h]=_inline;this[N2U]=_inputTrigger;this[P1V]=_optionsUpdate;this[n4Z]=_message;this[H_O]=_multiInfo;this[Y54]=_nestedClose;this[f70]=_nestedOpen;this[x38]=_postopen;this[e_p]=_preopen;this[x9G]=_processing;this[E9g]=_noProcessing;this[y$t]=_submit;this[I$v]=_submitTable;this[R3E]=_submitSuccess;this[I0S]=_submitError;this[s3p]=_tidy;this[C4c]=_weakInArray;if(Editor[O$K](init,cjsJq)){return Editor;}if(!(this instanceof Editor)){alert(J9y);}init=$[D3A](V0I,{},Editor[C7o],init);this[Z5WrO.K_g]=init;this[y0a]=$[D3A](V0I,{},Editor[s99][T73],{actionName:init[a5Q],ajax:init[C1W],formOptions:init[e$r],idSrc:init[p6n],table:init[T8D] || init[I$A],template:init[t2g]?$(init[t2g])[S7X]():m3D});this[O9$]=$[D3A](V0I,{},Editor[t5b]);this[U_5]=init[d1V];Editor[s1A][p8$][i5F]++;var that=this;var classes=this[t5b];var wrapper=$(D$9 + classes[i4u] + x1K + u5j + classes[J3I][r5N] + W3S + Q2I + classes[B8M][i4u] + z2D + o8I + classes[C7v][h1V] + S54 + r4S + D42 + classes[j42][i4u] + u5t + n6J + classes[k8s][q0W] + m0F + L7i + X07);var form=$(P5i + classes[T16][I$$] + z2D + Z9E + classes[g61][j64] + J8g + u3f);this[L0U]={body:el(L8c,wrapper)[s87],bodyContent:el(g7u,wrapper)[s87],buttons:$(S$q + classes[g61][C7_] + v_g)[s87],footer:el(Y8f,wrapper)[s87],form:form[s87],formContent:el(p9m,form)[s87],formError:$(x_q + classes[g61][f5q] + J8g)[s87],formInfo:$(L4n + classes[g61][f6e] + J8g)[s87],header:$(d7P + classes[e6T][e_X] + U37 + classes[A_F][q0W] + V5z)[s87],processing:el(R9Z,wrapper)[s87],wrapper:wrapper[s87]};$[g9P](init[a8I],function(evt,fn){var Y2m=f49;Y2m+=Z5WrO.S9O;that[Y2m](evt,function(){var U4B="pply";var E4R=Z5WrO.L$5;E4R+=U4B;var argsIn=[];for(var _i=s87;_i < arguments[f6V];_i++){argsIn[_i]=arguments[_i];}fn[E4R](that,argsIn);});});this[o5j];if(init[b6I]){var w5Q=Z5WrO[713];w5Q+=t4h;w5Q+=v4L;var n4y=Z5WrO.L$5;n4y+=Z5WrO[293400];n4y+=Z5WrO[293400];this[n4y](init[w5Q]);}$(document)[c2S](d2n + this[y0a][X_S],function(e,settings,json){p5T.Z7s();var C1b=m_3;C1b+=Z5WrO[156815];C1b+=S$W;C1b+=Z5WrO.t9K;var table=_this[y0a][C1b];if(table){var dtApi=new DataTable[H0n](table);if(settings[r4F] === dtApi[f3z]()[y4O]()){var c7r=K1p;c7r+=Z5WrO[293400];c7r+=P4S;c7r+=L3p;settings[c7r]=_this;}}})[c2S](C8v + this[y0a][U6N],function(e,settings){var u2L="Language";var N8C="oLanguage";var Q9w=x0N;Q9w+=u_4;var table=_this[y0a][Q9w];p5T.Q1A();if(table){var Z$0=N2K;Z$0+=a4_;Z$0+=Z5WrO.t9K;var T4D=q7O;T4D+=W__;T4D+=m9y;var dtApi=new DataTable[T4D](table);if(settings[r4F] === dtApi[Z$0]()[y4O]()){var O97=f49;O97+=u2L;if(settings[O97][g5x]){var k03=m9y;k03+=F9c;$[D3A](V0I,_this[k03],settings[N8C][g5x]);}}}})[c2S](m2u + this[y0a][S1R],function(e,settings,json){var A7X="_opt";var W4U="ionsUpdat";p5T.Z7s();var table=_this[y0a][f3z];if(table){var f3A=q7O;f3A+=W__;f3A+=m9y;var dtApi=new DataTable[f3A](table);if(settings[r4F] === dtApi[f3z]()[y4O]()){var R8R=A7X;R8R+=W4U;R8R+=Z5WrO.t9K;_this[R8R](json);}}});if(!Editor[G1M][init[l4D]]){var P8i=i$g;P8i+=f1T;P8i+=G1l;P8i+=Z5WrO.x6j;var V5m=B3n;V5m+=l4D;V5m+=K7J;throw new Error(V5m + init[P8i]);}this[y0a][G5S]=Editor[A6p][init[l4D]][R5a](this);this[w_f](E7M,[]);$(document)[g2e](e9t,[this]);}Editor[l5B][N48]=function(name,args){p5T.Z7s();var m70=F$W;m70+=Z5WrO.t9K;m70+=o3F;m70+=N2K;this[m70](name,args);};Editor[D6w][G2z]=function(){var u0N=Z3z;u0N+=t9f;u0N+=Z5WrO.S9O;p5T.Z7s();return this[u0N];};Editor[D6w][l8J]=function(){p5T.Z7s();return this[H_O]();};Editor[e6p][p$_]=function(){p5T.Z7s();return this[y0a];};Editor[h$Z]={checkbox:checkbox,datatable:datatable,datetime:datetime,hidden:hidden,password:password,radio:radio,readonly:readonly,select:select,text:text,textarea:textarea,upload:upload,uploadMany:uploadMany};Editor[X$C]={};Editor[G94]=w6G;Editor[i0P]=classNames;Editor[f00]=Field;Editor[L5q]=m3D;Editor[u2r]=error;Editor[t4L]=pairs;Editor[O$K]=factory;Editor[H_f]=upload$1;Editor[T9R]=defaults$1;Editor[e4J]={button:button,displayController:displayController,fieldType:fieldType,formOptions:formOptions,settings:settings};Editor[B_O]={dataTable:dataSource$1,html:dataSource};Editor[l4D]={envelope:envelope,lightbox:self};Editor[C_n]=function(id){p5T.Z7s();return safeDomId(id,b_u);};return Editor;})();DataTable[C52]=Editor;$[d2u][j45][L1B]=Editor;if(DataTable[S33]){var C3x=O3S;C3x+=O50;var D_W=l0K;D_W+=x$8;Editor[D_W]=DataTable[C3x];}if(DataTable[i4a][k6_]){$[D3A](Editor[M9y],DataTable[i4a][p3l]);}DataTable[i4a][t3S]=Editor[l5y];return DataTable[L1B];});})();

/*! Bootstrap integration for DataTables' Editor
 * © SpryMedia Ltd - datatables.net/license
 */

(function( factory ){
	if ( typeof define === 'function' && define.amd ) {
		// AMD
		define( ['jquery', 'datatables.net-bs5', 'datatables.net-editor'], function ( $ ) {
			return factory( $, window, document );
		} );
	}
	else if ( typeof exports === 'object' ) {
		// CommonJS
		var jq = require('jquery');
		var cjsRequires = function (root, $) {
			if ( ! $.fn.dataTable ) {
				require('datatables.net-bs5')(root, $);
			}

			if ( ! $.fn.dataTable.Editor ) {
				require('datatables.net-editor')(root, $);
			}
		};

		if (typeof window === 'undefined') {
			module.exports = function (root, $) {
				if ( ! root ) {
					// CommonJS environments without a window global must pass a
					// root. This will give an error otherwise
					root = window;
				}

				if ( ! $ ) {
					$ = jq( root );
				}

				cjsRequires( root, $ );
				return factory( $, root, root.document );
			};
		}
		else {
			cjsRequires( window, jq );
			module.exports = factory( jq, window, window.document );
		}
	}
	else {
		// Browser
		factory( jQuery, window, document );
	}
}(function( $, window, document ) {
'use strict';
var DataTable = $.fn.dataTable;



// Note that in MJS `jQuery`, `DataTable` and `Editor` are imported with
// `jQuery` assigned to `let $`
// In UMD, `$` and `DataTable` are available

/*
 * Set the default display controller to be our bootstrap control
 */
DataTable.Editor.defaults.display = 'bootstrap';

/*
 * Change the default classes from Editor to be classes for Bootstrap
 */
$.extend(true, DataTable.Editor.classes, {
	header: {
		wrapper: 'DTE_Header',
		title: {
			tag: 'h5',
			class: 'modal-title'
		}
	},
	body: {
		wrapper: 'DTE_Body'
	},
	footer: {
		wrapper: 'DTE_Footer'
	},
	form: {
		tag: 'form-horizontal',
		button: 'btn',
		buttonInternal: 'btn btn-outline-secondary',
		buttonSubmit: 'btn btn-primary'
	},
	field: {
		wrapper: 'DTE_Field form-group row',
		label: 'col-lg-4 col-form-label',
		input: 'col-lg-8 DTE_Field_Input',
		error: 'error is-invalid',
		'msg-labelInfo': 'form-text text-secondary small',
		'msg-info': 'form-text text-secondary small',
		'msg-message': 'form-text text-secondary small',
		'msg-error': 'form-text text-danger small',
		multiValue: 'card multi-value',
		multiInfo: 'small',
		multiRestore: 'multi-restore'
	}
});

$.extend(true, DataTable.ext.buttons, {
	create: {
		formButtons: {
			className: 'btn-primary'
		}
	},
	edit: {
		formButtons: {
			className: 'btn-primary'
		}
	},
	remove: {
		formButtons: {
			className: 'btn-danger'
		}
	}
});

DataTable.Editor.fieldTypes.datatable.tableClass = 'table';

/*
 * Bootstrap display controller - this is effectively a proxy to the Bootstrap
 * modal control.
 */
let shown = false;
let fullyShown = false;

const dom = {
	content: $('<div class="modal fade DTED">' + '<div class="modal-dialog"></div>' + '</div>'),
	close: $('<button class="btn-close"></div>')
};
let modal;
let _bs = window.bootstrap;

DataTable.Editor.bootstrap = function (bs) {
	_bs = bs;
};

DataTable.Editor.display.bootstrap = $.extend(true, {}, DataTable.Editor.models.displayController, {
	/*
	 * API methods
	 */
	init: function (dte) {
		// Add `form-control` to required elements
		dte.on('displayOrder.dtebs open.dtebs', function () {
			$.each(dte.s.fields, function (key, field) {
				$('input:not([type=checkbox]):not([type=radio]), select, textarea', field.node()).addClass(
					'form-control'
				);

				$('input[type=checkbox], input[type=radio]', field.node()).addClass('form-check-input');

				$('select', field.node()).addClass('form-select');
			});
		});

		return DataTable.Editor.display.bootstrap;
	},

	open: function (dte, append, callback) {
		if (!modal) {
			modal = new _bs.Modal(dom.content[0], {
				backdrop: 'static',
				keyboard: false
			});
		}

		$(append).addClass('modal-content');
		$('.DTE_Header', append).addClass('modal-header');
		$('.DTE_Body', append).addClass('modal-body');
		$('.DTE_Footer', append).addClass('modal-footer');

		// Special class for DataTable buttons in the form
		$(append)
			.find('div.DTE_Field_Type_datatable div.dt-buttons')
			.removeClass('btn-group')
			.addClass('btn-group-vertical');

		// Setup events on each show
		dom.close
			.attr('title', dte.i18n.close)
			.off('click.dte-bs5')
			.on('click.dte-bs5', function () {
				dte.close('icon');
			})
			.appendTo($('div.modal-header', append));

		// This is a bit horrible, but if you mousedown and then drag out of the modal container, we don't
		// want to trigger a background action.
		let allowBackgroundClick = false;
		$(document)
			.off('mousedown.dte-bs5')
			.on('mousedown.dte-bs5', 'div.modal', function (e) {
				allowBackgroundClick = $(e.target).hasClass('modal') && shown ? true : false;
			});

		$(document)
			.off('click.dte-bs5')
			.on('click.dte-bs5', 'div.modal', function (e) {
				if ($(e.target).hasClass('modal') && allowBackgroundClick) {
					dte.background();
				}
			});

		var content = dom.content.find('div.modal-dialog');
		content.addClass(DataTable.Editor.display.bootstrap.classes.modal);
		content.children().detach();
		content.append(append);

		// Floating label support - rearrange the DOM for the inputs
		if (dte.c.bootstrap && dte.c.bootstrap.floatingLabels) {
			var floating_label_types = ['readonly', 'text', 'textarea', 'select', 'datetime'];
			var fields = dte.order();

			fields
				.filter(function (f) {
					var type = dte.field(f).s.opts.type;

					return floating_label_types.includes(type);
				})
				.forEach(function (f) {
					var node = $(dte.field(f).node());
					var wrapper = node.find('.DTE_Field_InputControl');
					var control = wrapper.children(':first-child');
					var label = node.find('label');

					wrapper.parent().removeClass('col-lg-8').addClass('col-lg-12');
					wrapper.addClass('form-floating');
					control.addClass('form-control').attr('placeholder', f);
					label.appendTo(wrapper);
				});
		}

		if (shown) {
			if (callback) {
				callback();
			}
			return;
		}

		shown = true;
		fullyShown = false;

		dom.content[0].addEventListener(
			'shown.bs.modal',
			function () {
				// Can only give elements focus when shown
				if (dte.s.setFocus) {
					dte.s.setFocus.focus();
				}

				fullyShown = true;

				dom.content.find('table.dataTable').DataTable().columns.adjust();

				if (callback) {
					callback();
				}
			},
			{ once: true }
		);

		dom.content[0].addEventListener(
			'hidden',
			function () {
				shown = false;
			},
			{ once: true }
		);

		$(dom.content).appendTo('body');

		modal.show();
	},

	close: function (dte, callback) {
		if (!shown) {
			if (callback) {
				callback();
			}
			return;
		}

		// Check if actually displayed or not before hiding. BS4 doesn't like `hide`
		// before it has been fully displayed
		if (!fullyShown) {
			dom.content[0].addEventListener(
				'shown.bs.modal',
				function () {
					DataTable.Editor.display.bootstrap.close(dte, callback);
				},
				{ once: true }
			);

			return;
		}

		dom.content[0].addEventListener(
			'hidden.bs.modal',
			function () {
				$(this).detach();
			},
			{ once: true }
		);

		modal.hide();

		shown = false;
		fullyShown = false;

		if (callback) {
			callback();
		}
	},

	node: function () {
		return dom.content[0];
	},

	classes: {
		modal: 'modal-dialog-scrollable modal-dialog-centered modal-lg'
	}
});


return DataTable.Editor;
}));


/*! Buttons for DataTables 3.0.2
 * © SpryMedia Ltd - datatables.net/license
 */

(function( factory ){
	if ( typeof define === 'function' && define.amd ) {
		// AMD
		define( ['jquery', 'datatables.net'], function ( $ ) {
			return factory( $, window, document );
		} );
	}
	else if ( typeof exports === 'object' ) {
		// CommonJS
		var jq = require('jquery');
		var cjsRequires = function (root, $) {
			if ( ! $.fn.dataTable ) {
				require('datatables.net')(root, $);
			}
		};

		if (typeof window === 'undefined') {
			module.exports = function (root, $) {
				if ( ! root ) {
					// CommonJS environments without a window global must pass a
					// root. This will give an error otherwise
					root = window;
				}

				if ( ! $ ) {
					$ = jq( root );
				}

				cjsRequires( root, $ );
				return factory( $, root, root.document );
			};
		}
		else {
			cjsRequires( window, jq );
			module.exports = factory( jq, window, window.document );
		}
	}
	else {
		// Browser
		factory( jQuery, window, document );
	}
}(function( $, window, document ) {
'use strict';
var DataTable = $.fn.dataTable;



// Used for namespacing events added to the document by each instance, so they
// can be removed on destroy
var _instCounter = 0;

// Button namespacing counter for namespacing events on individual buttons
var _buttonCounter = 0;

var _dtButtons = DataTable.ext.buttons;

// Custom entity decoder for data export
var _entityDecoder = null;

// Allow for jQuery slim
function _fadeIn(el, duration, fn) {
	if ($.fn.animate) {
		el.stop().fadeIn(duration, fn);
	}
	else {
		el.css('display', 'block');

		if (fn) {
			fn.call(el);
		}
	}
}

function _fadeOut(el, duration, fn) {
	if ($.fn.animate) {
		el.stop().fadeOut(duration, fn);
	}
	else {
		el.css('display', 'none');

		if (fn) {
			fn.call(el);
		}
	}
}

/**
 * [Buttons description]
 * @param {[type]}
 * @param {[type]}
 */
var Buttons = function (dt, config) {
	if (!DataTable.versionCheck('2')) {
		throw 'Warning: Buttons requires DataTables 2 or newer';
	}

	// If not created with a `new` keyword then we return a wrapper function that
	// will take the settings object for a DT. This allows easy use of new instances
	// with the `layout` option - e.g. `topLeft: $.fn.dataTable.Buttons( ... )`.
	if (!(this instanceof Buttons)) {
		return function (settings) {
			return new Buttons(settings, dt).container();
		};
	}

	// If there is no config set it to an empty object
	if (typeof config === 'undefined') {
		config = {};
	}

	// Allow a boolean true for defaults
	if (config === true) {
		config = {};
	}

	// For easy configuration of buttons an array can be given
	if (Array.isArray(config)) {
		config = { buttons: config };
	}

	this.c = $.extend(true, {}, Buttons.defaults, config);

	// Don't want a deep copy for the buttons
	if (config.buttons) {
		this.c.buttons = config.buttons;
	}

	this.s = {
		dt: new DataTable.Api(dt),
		buttons: [],
		listenKeys: '',
		namespace: 'dtb' + _instCounter++
	};

	this.dom = {
		container: $('<' + this.c.dom.container.tag + '/>').addClass(
			this.c.dom.container.className
		)
	};

	this._constructor();
};

$.extend(Buttons.prototype, {
	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * Public methods
	 */

	/**
	 * Get the action of a button
	 * @param  {int|string} Button index
	 * @return {function}
	 */ /**
	 * Set the action of a button
	 * @param  {node} node Button element
	 * @param  {function} action Function to set
	 * @return {Buttons} Self for chaining
	 */
	action: function (node, action) {
		var button = this._nodeToButton(node);

		if (action === undefined) {
			return button.conf.action;
		}

		button.conf.action = action;

		return this;
	},

	/**
	 * Add an active class to the button to make to look active or get current
	 * active state.
	 * @param  {node} node Button element
	 * @param  {boolean} [flag] Enable / disable flag
	 * @return {Buttons} Self for chaining or boolean for getter
	 */
	active: function (node, flag) {
		var button = this._nodeToButton(node);
		var klass = this.c.dom.button.active;
		var jqNode = $(button.node);

		if (
			button.inCollection &&
			this.c.dom.collection.button &&
			this.c.dom.collection.button.active !== undefined
		) {
			klass = this.c.dom.collection.button.active;
		}

		if (flag === undefined) {
			return jqNode.hasClass(klass);
		}

		jqNode.toggleClass(klass, flag === undefined ? true : flag);

		return this;
	},

	/**
	 * Add a new button
	 * @param {object} config Button configuration object, base string name or function
	 * @param {int|string} [idx] Button index for where to insert the button
	 * @param {boolean} [draw=true] Trigger a draw. Set a false when adding
	 *   lots of buttons, until the last button.
	 * @return {Buttons} Self for chaining
	 */
	add: function (config, idx, draw) {
		var buttons = this.s.buttons;

		if (typeof idx === 'string') {
			var split = idx.split('-');
			var base = this.s;

			for (var i = 0, ien = split.length - 1; i < ien; i++) {
				base = base.buttons[split[i] * 1];
			}

			buttons = base.buttons;
			idx = split[split.length - 1] * 1;
		}

		this._expandButton(
			buttons,
			config,
			config !== undefined ? config.split : undefined,
			(config === undefined ||
				config.split === undefined ||
				config.split.length === 0) &&
				base !== undefined,
			false,
			idx
		);

		if (draw === undefined || draw === true) {
			this._draw();
		}

		return this;
	},

	/**
	 * Clear buttons from a collection and then insert new buttons
	 */
	collectionRebuild: function (node, newButtons) {
		var button = this._nodeToButton(node);

		if (newButtons !== undefined) {
			var i;
			// Need to reverse the array
			for (i = button.buttons.length - 1; i >= 0; i--) {
				this.remove(button.buttons[i].node);
			}

			// If the collection has prefix and / or postfix buttons we need to add them in
			if (button.conf.prefixButtons) {
				newButtons.unshift.apply(newButtons, button.conf.prefixButtons);
			}

			if (button.conf.postfixButtons) {
				newButtons.push.apply(newButtons, button.conf.postfixButtons);
			}

			for (i = 0; i < newButtons.length; i++) {
				var newBtn = newButtons[i];

				this._expandButton(
					button.buttons,
					newBtn,
					newBtn !== undefined &&
						newBtn.config !== undefined &&
						newBtn.config.split !== undefined,
					true,
					newBtn.parentConf !== undefined &&
						newBtn.parentConf.split !== undefined,
					null,
					newBtn.parentConf
				);
			}
		}

		this._draw(button.collection, button.buttons);
	},

	/**
	 * Get the container node for the buttons
	 * @return {jQuery} Buttons node
	 */
	container: function () {
		return this.dom.container;
	},

	/**
	 * Disable a button
	 * @param  {node} node Button node
	 * @return {Buttons} Self for chaining
	 */
	disable: function (node) {
		var button = this._nodeToButton(node);

		$(button.node)
			.addClass(this.c.dom.button.disabled)
			.prop('disabled', true);

		return this;
	},

	/**
	 * Destroy the instance, cleaning up event handlers and removing DOM
	 * elements
	 * @return {Buttons} Self for chaining
	 */
	destroy: function () {
		// Key event listener
		$('body').off('keyup.' + this.s.namespace);

		// Individual button destroy (so they can remove their own events if
		// needed). Take a copy as the array is modified by `remove`
		var buttons = this.s.buttons.slice();
		var i, ien;

		for (i = 0, ien = buttons.length; i < ien; i++) {
			this.remove(buttons[i].node);
		}

		// Container
		this.dom.container.remove();

		// Remove from the settings object collection
		var buttonInsts = this.s.dt.settings()[0];

		for (i = 0, ien = buttonInsts.length; i < ien; i++) {
			if (buttonInsts.inst === this) {
				buttonInsts.splice(i, 1);
				break;
			}
		}

		return this;
	},

	/**
	 * Enable / disable a button
	 * @param  {node} node Button node
	 * @param  {boolean} [flag=true] Enable / disable flag
	 * @return {Buttons} Self for chaining
	 */
	enable: function (node, flag) {
		if (flag === false) {
			return this.disable(node);
		}

		var button = this._nodeToButton(node);
		$(button.node)
			.removeClass(this.c.dom.button.disabled)
			.prop('disabled', false);

		return this;
	},

	/**
	 * Get a button's index
	 *
	 * This is internally recursive
	 * @param {element} node Button to get the index of
	 * @return {string} Button index
	 */
	index: function (node, nested, buttons) {
		if (!nested) {
			nested = '';
			buttons = this.s.buttons;
		}

		for (var i = 0, ien = buttons.length; i < ien; i++) {
			var inner = buttons[i].buttons;

			if (buttons[i].node === node) {
				return nested + i;
			}

			if (inner && inner.length) {
				var match = this.index(node, i + '-', inner);

				if (match !== null) {
					return match;
				}
			}
		}

		return null;
	},

	/**
	 * Get the instance name for the button set selector
	 * @return {string} Instance name
	 */
	name: function () {
		return this.c.name;
	},

	/**
	 * Get a button's node of the buttons container if no button is given
	 * @param  {node} [node] Button node
	 * @return {jQuery} Button element, or container
	 */
	node: function (node) {
		if (!node) {
			return this.dom.container;
		}

		var button = this._nodeToButton(node);
		return $(button.node);
	},

	/**
	 * Set / get a processing class on the selected button
	 * @param {element} node Triggering button node
	 * @param  {boolean} flag true to add, false to remove, undefined to get
	 * @return {boolean|Buttons} Getter value or this if a setter.
	 */
	processing: function (node, flag) {
		var dt = this.s.dt;
		var button = this._nodeToButton(node);

		if (flag === undefined) {
			return $(button.node).hasClass('processing');
		}

		$(button.node).toggleClass('processing', flag);

		$(dt.table().node()).triggerHandler('buttons-processing.dt', [
			flag,
			dt.button(node),
			dt,
			$(node),
			button.conf
		]);

		return this;
	},

	/**
	 * Remove a button.
	 * @param  {node} node Button node
	 * @return {Buttons} Self for chaining
	 */
	remove: function (node) {
		var button = this._nodeToButton(node);
		var host = this._nodeToHost(node);
		var dt = this.s.dt;

		// Remove any child buttons first
		if (button.buttons.length) {
			for (var i = button.buttons.length - 1; i >= 0; i--) {
				this.remove(button.buttons[i].node);
			}
		}

		button.conf.destroying = true;

		// Allow the button to remove event handlers, etc
		if (button.conf.destroy) {
			button.conf.destroy.call(dt.button(node), dt, $(node), button.conf);
		}

		this._removeKey(button.conf);

		$(button.node).remove();

		var idx = $.inArray(button, host);
		host.splice(idx, 1);

		return this;
	},

	/**
	 * Get the text for a button
	 * @param  {int|string} node Button index
	 * @return {string} Button text
	 */ /**
	 * Set the text for a button
	 * @param  {int|string|function} node Button index
	 * @param  {string} label Text
	 * @return {Buttons} Self for chaining
	 */
	text: function (node, label) {
		var button = this._nodeToButton(node);
		var textNode = button.textNode;
		var dt = this.s.dt;
		var jqNode = $(button.node);
		var text = function (opt) {
			return typeof opt === 'function'
				? opt(dt, jqNode, button.conf)
				: opt;
		};

		if (label === undefined) {
			return text(button.conf.text);
		}

		button.conf.text = label;
		textNode.html(text(label));

		return this;
	},

	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * Constructor
	 */

	/**
	 * Buttons constructor
	 * @private
	 */
	_constructor: function () {
		var that = this;
		var dt = this.s.dt;
		var dtSettings = dt.settings()[0];
		var buttons = this.c.buttons;

		if (!dtSettings._buttons) {
			dtSettings._buttons = [];
		}

		dtSettings._buttons.push({
			inst: this,
			name: this.c.name
		});

		for (var i = 0, ien = buttons.length; i < ien; i++) {
			this.add(buttons[i]);
		}

		dt.on('destroy', function (e, settings) {
			if (settings === dtSettings) {
				that.destroy();
			}
		});

		// Global key event binding to listen for button keys
		$('body').on('keyup.' + this.s.namespace, function (e) {
			if (
				!document.activeElement ||
				document.activeElement === document.body
			) {
				// SUse a string of characters for fast lookup of if we need to
				// handle this
				var character = String.fromCharCode(e.keyCode).toLowerCase();

				if (that.s.listenKeys.toLowerCase().indexOf(character) !== -1) {
					that._keypress(character, e);
				}
			}
		});
	},

	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * Private methods
	 */

	/**
	 * Add a new button to the key press listener
	 * @param {object} conf Resolved button configuration object
	 * @private
	 */
	_addKey: function (conf) {
		if (conf.key) {
			this.s.listenKeys += $.isPlainObject(conf.key)
				? conf.key.key
				: conf.key;
		}
	},

	/**
	 * Insert the buttons into the container. Call without parameters!
	 * @param  {node} [container] Recursive only - Insert point
	 * @param  {array} [buttons] Recursive only - Buttons array
	 * @private
	 */
	_draw: function (container, buttons) {
		if (!container) {
			container = this.dom.container;
			buttons = this.s.buttons;
		}

		container.children().detach();

		for (var i = 0, ien = buttons.length; i < ien; i++) {
			container.append(buttons[i].inserter);
			container.append(' ');

			if (buttons[i].buttons && buttons[i].buttons.length) {
				this._draw(buttons[i].collection, buttons[i].buttons);
			}
		}
	},

	/**
	 * Create buttons from an array of buttons
	 * @param  {array} attachTo Buttons array to attach to
	 * @param  {object} button Button definition
	 * @param  {boolean} inCollection true if the button is in a collection
	 * @private
	 */
	_expandButton: function (
		attachTo,
		button,
		split,
		inCollection,
		inSplit,
		attachPoint,
		parentConf
	) {
		var dt = this.s.dt;
		var isSplit = false;
		var domCollection = this.c.dom.collection;
		var buttons = !Array.isArray(button) ? [button] : button;

		if (button === undefined) {
			buttons = !Array.isArray(split) ? [split] : split;
		}

		for (var i = 0, ien = buttons.length; i < ien; i++) {
			var conf = this._resolveExtends(buttons[i]);

			if (!conf) {
				continue;
			}

			isSplit = conf.config && conf.config.split ? true : false;

			// If the configuration is an array, then expand the buttons at this
			// point
			if (Array.isArray(conf)) {
				this._expandButton(
					attachTo,
					conf,
					built !== undefined && built.conf !== undefined
						? built.conf.split
						: undefined,
					inCollection,
					parentConf !== undefined && parentConf.split !== undefined,
					attachPoint,
					parentConf
				);
				continue;
			}

			var built = this._buildButton(
				conf,
				inCollection,
				conf.split !== undefined ||
					(conf.config !== undefined &&
						conf.config.split !== undefined),
				inSplit
			);
			if (!built) {
				continue;
			}

			if (attachPoint !== undefined && attachPoint !== null) {
				attachTo.splice(attachPoint, 0, built);
				attachPoint++;
			}
			else {
				attachTo.push(built);
			}

			// Create the dropdown for a collection
			if (built.conf.buttons) {
				built.collection = $(
					'<' + domCollection.container.content.tag + '/>'
				);
				built.conf._collection = built.collection;

				$(built.node).append(domCollection.action.dropHtml);

				this._expandButton(
					built.buttons,
					built.conf.buttons,
					built.conf.split,
					!isSplit,
					isSplit,
					attachPoint,
					built.conf
				);
			}

			// And the split collection
			if (built.conf.split) {
				built.collection = $('<' + domCollection.container.tag + '/>');
				built.conf._collection = built.collection;

				for (var j = 0; j < built.conf.split.length; j++) {
					var item = built.conf.split[j];

					if (typeof item === 'object') {
						item.parent = parentConf;

						if (item.collectionLayout === undefined) {
							item.collectionLayout = built.conf.collectionLayout;
						}

						if (item.dropup === undefined) {
							item.dropup = built.conf.dropup;
						}

						if (item.fade === undefined) {
							item.fade = built.conf.fade;
						}
					}
				}

				this._expandButton(
					built.buttons,
					built.conf.buttons,
					built.conf.split,
					!isSplit,
					isSplit,
					attachPoint,
					built.conf
				);
			}

			built.conf.parent = parentConf;

			// init call is made here, rather than buildButton as it needs to
			// be selectable, and for that it needs to be in the buttons array
			if (conf.init) {
				conf.init.call(dt.button(built.node), dt, $(built.node), conf);
			}
		}
	},

	/**
	 * Create an individual button
	 * @param  {object} config            Resolved button configuration
	 * @param  {boolean} inCollection `true` if a collection button
	 * @return {object} Completed button description object
	 * @private
	 */
	_buildButton: function (config, inCollection, isSplit, inSplit) {
		var that = this;
		var configDom = this.c.dom;
		var textNode;
		var dt = this.s.dt;
		var text = function (opt) {
			return typeof opt === 'function' ? opt(dt, button, config) : opt;
		};

		// Create an object that describes the button which can be in `dom.button`, or
		// `dom.collection.button` or `dom.split.button` or `dom.collection.split.button`!
		// Each should extend from `dom.button`.
		var dom = $.extend(true, {}, configDom.button);

		if (inCollection && isSplit && configDom.collection.split) {
			$.extend(true, dom, configDom.collection.split.action);
		}
		else if (inSplit || inCollection) {
			$.extend(true, dom, configDom.collection.button);
		}
		else if (isSplit) {
			$.extend(true, dom, configDom.split.button);
		}

		// Spacers don't do much other than insert an element into the DOM
		if (config.spacer) {
			var spacer = $('<' + dom.spacer.tag + '/>')
				.addClass(
					'dt-button-spacer ' +
						config.style +
						' ' +
						dom.spacer.className
				)
				.html(text(config.text));

			return {
				conf: config,
				node: spacer,
				inserter: spacer,
				buttons: [],
				inCollection: inCollection,
				isSplit: isSplit,
				collection: null,
				textNode: spacer
			};
		}

		// Make sure that the button is available based on whatever requirements
		// it has. For example, PDF button require pdfmake
		if (
			config.available &&
			!config.available(dt, config) &&
			!config.html
		) {
			return false;
		}

		var button;

		if (!config.html) {
			var run = function (e, dt, button, config, done) {
				config.action.call(dt.button(button), e, dt, button, config, done);

				$(dt.table().node()).triggerHandler('buttons-action.dt', [
					dt.button(button),
					dt,
					button,
					config
				]);
			};

			var action = function(e, dt, button, config) {
				if (config.async) {
					that.processing(button[0], true);

					setTimeout(function () {
						run(e, dt, button, config, function () {
							that.processing(button[0], false);
						});
					}, config.async);
				}
				else {
					run(e, dt, button, config, function () {});
				}
			}

			var tag = config.tag || dom.tag;
			var clickBlurs =
				config.clickBlurs === undefined ? true : config.clickBlurs;

			button = $('<' + tag + '/>')
				.addClass(dom.className)
				.attr('tabindex', this.s.dt.settings()[0].iTabIndex)
				.attr('aria-controls', this.s.dt.table().node().id)
				.on('click.dtb', function (e) {
					e.preventDefault();

					if (!button.hasClass(dom.disabled) && config.action) {
						action(e, dt, button, config);
					}

					if (clickBlurs) {
						button.trigger('blur');
					}
				})
				.on('keypress.dtb', function (e) {
					if (e.keyCode === 13) {
						e.preventDefault();

						if (!button.hasClass(dom.disabled) && config.action) {
							action(e, dt, button, config);
						}
					}
				});

			// Make `a` tags act like a link
			if (tag.toLowerCase() === 'a') {
				button.attr('href', '#');
			}

			// Button tags should have `type=button` so they don't have any default behaviour
			if (tag.toLowerCase() === 'button') {
				button.attr('type', 'button');
			}

			if (dom.liner.tag) {
				var liner = $('<' + dom.liner.tag + '/>')
					.html(text(config.text))
					.addClass(dom.liner.className);

				if (dom.liner.tag.toLowerCase() === 'a') {
					liner.attr('href', '#');
				}

				button.append(liner);
				textNode = liner;
			}
			else {
				button.html(text(config.text));
				textNode = button;
			}

			if (config.enabled === false) {
				button.addClass(dom.disabled);
			}

			if (config.className) {
				button.addClass(config.className);
			}

			if (config.titleAttr) {
				button.attr('title', text(config.titleAttr));
			}

			if (config.attr) {
				button.attr(config.attr);
			}

			if (!config.namespace) {
				config.namespace = '.dt-button-' + _buttonCounter++;
			}

			if (config.config !== undefined && config.config.split) {
				config.split = config.config.split;
			}
		}
		else {
			button = $(config.html);
		}

		var buttonContainer = this.c.dom.buttonContainer;
		var inserter;
		if (buttonContainer && buttonContainer.tag) {
			inserter = $('<' + buttonContainer.tag + '/>')
				.addClass(buttonContainer.className)
				.append(button);
		}
		else {
			inserter = button;
		}

		this._addKey(config);

		// Style integration callback for DOM manipulation
		// Note that this is _not_ documented. It is currently
		// for style integration only
		if (this.c.buttonCreated) {
			inserter = this.c.buttonCreated(config, inserter);
		}

		var splitDiv;

		if (isSplit) {
			var dropdownConf = inCollection
				? $.extend(true, this.c.dom.split, this.c.dom.collection.split)
				: this.c.dom.split;
			var wrapperConf = dropdownConf.wrapper;

			splitDiv = $('<' + wrapperConf.tag + '/>')
				.addClass(wrapperConf.className)
				.append(button);

			var dropButtonConfig = $.extend(config, {
				align: dropdownConf.dropdown.align,
				attr: {
					'aria-haspopup': 'dialog',
					'aria-expanded': false
				},
				className: dropdownConf.dropdown.className,
				closeButton: false,
				splitAlignClass: dropdownConf.dropdown.splitAlignClass,
				text: dropdownConf.dropdown.text
			});

			this._addKey(dropButtonConfig);

			var splitAction = function (e, dt, button, config) {
				_dtButtons.split.action.call(
					dt.button(splitDiv),
					e,
					dt,
					button,
					config
				);

				$(dt.table().node()).triggerHandler('buttons-action.dt', [
					dt.button(button),
					dt,
					button,
					config
				]);
				button.attr('aria-expanded', true);
			};

			var dropButton = $(
				'<button class="' +
					dropdownConf.dropdown.className +
					' dt-button"></button>'
			)
				.html(dropdownConf.dropdown.dropHtml)
				.on('click.dtb', function (e) {
					e.preventDefault();
					e.stopPropagation();

					if (!dropButton.hasClass(dom.disabled)) {
						splitAction(e, dt, dropButton, dropButtonConfig);
					}
					if (clickBlurs) {
						dropButton.trigger('blur');
					}
				})
				.on('keypress.dtb', function (e) {
					if (e.keyCode === 13) {
						e.preventDefault();

						if (!dropButton.hasClass(dom.disabled)) {
							splitAction(e, dt, dropButton, dropButtonConfig);
						}
					}
				});

			if (config.split.length === 0) {
				dropButton.addClass('dtb-hide-drop');
			}

			splitDiv.append(dropButton).attr(dropButtonConfig.attr);
		}

		return {
			conf: config,
			node: isSplit ? splitDiv.get(0) : button.get(0),
			inserter: isSplit ? splitDiv : inserter,
			buttons: [],
			inCollection: inCollection,
			isSplit: isSplit,
			inSplit: inSplit,
			collection: null,
			textNode: textNode
		};
	},

	/**
	 * Get the button object from a node (recursive)
	 * @param  {node} node Button node
	 * @param  {array} [buttons] Button array, uses base if not defined
	 * @return {object} Button object
	 * @private
	 */
	_nodeToButton: function (node, buttons) {
		if (!buttons) {
			buttons = this.s.buttons;
		}

		for (var i = 0, ien = buttons.length; i < ien; i++) {
			if (buttons[i].node === node) {
				return buttons[i];
			}

			if (buttons[i].buttons.length) {
				var ret = this._nodeToButton(node, buttons[i].buttons);

				if (ret) {
					return ret;
				}
			}
		}
	},

	/**
	 * Get container array for a button from a button node (recursive)
	 * @param  {node} node Button node
	 * @param  {array} [buttons] Button array, uses base if not defined
	 * @return {array} Button's host array
	 * @private
	 */
	_nodeToHost: function (node, buttons) {
		if (!buttons) {
			buttons = this.s.buttons;
		}

		for (var i = 0, ien = buttons.length; i < ien; i++) {
			if (buttons[i].node === node) {
				return buttons;
			}

			if (buttons[i].buttons.length) {
				var ret = this._nodeToHost(node, buttons[i].buttons);

				if (ret) {
					return ret;
				}
			}
		}
	},

	/**
	 * Handle a key press - determine if any button's key configured matches
	 * what was typed and trigger the action if so.
	 * @param  {string} character The character pressed
	 * @param  {object} e Key event that triggered this call
	 * @private
	 */
	_keypress: function (character, e) {
		// Check if this button press already activated on another instance of Buttons
		if (e._buttonsHandled) {
			return;
		}

		var run = function (conf, node) {
			if (!conf.key) {
				return;
			}

			if (conf.key === character) {
				e._buttonsHandled = true;
				$(node).click();
			}
			else if ($.isPlainObject(conf.key)) {
				if (conf.key.key !== character) {
					return;
				}

				if (conf.key.shiftKey && !e.shiftKey) {
					return;
				}

				if (conf.key.altKey && !e.altKey) {
					return;
				}

				if (conf.key.ctrlKey && !e.ctrlKey) {
					return;
				}

				if (conf.key.metaKey && !e.metaKey) {
					return;
				}

				// Made it this far - it is good
				e._buttonsHandled = true;
				$(node).click();
			}
		};

		var recurse = function (a) {
			for (var i = 0, ien = a.length; i < ien; i++) {
				run(a[i].conf, a[i].node);

				if (a[i].buttons.length) {
					recurse(a[i].buttons);
				}
			}
		};

		recurse(this.s.buttons);
	},

	/**
	 * Remove a key from the key listener for this instance (to be used when a
	 * button is removed)
	 * @param  {object} conf Button configuration
	 * @private
	 */
	_removeKey: function (conf) {
		if (conf.key) {
			var character = $.isPlainObject(conf.key) ? conf.key.key : conf.key;

			// Remove only one character, as multiple buttons could have the
			// same listening key
			var a = this.s.listenKeys.split('');
			var idx = $.inArray(character, a);
			a.splice(idx, 1);
			this.s.listenKeys = a.join('');
		}
	},

	/**
	 * Resolve a button configuration
	 * @param  {string|function|object} conf Button config to resolve
	 * @return {object} Button configuration
	 * @private
	 */
	_resolveExtends: function (conf) {
		var that = this;
		var dt = this.s.dt;
		var i, ien;
		var toConfObject = function (base) {
			var loop = 0;

			// Loop until we have resolved to a button configuration, or an
			// array of button configurations (which will be iterated
			// separately)
			while (!$.isPlainObject(base) && !Array.isArray(base)) {
				if (base === undefined) {
					return;
				}

				if (typeof base === 'function') {
					base = base.call(that, dt, conf);

					if (!base) {
						return false;
					}
				}
				else if (typeof base === 'string') {
					if (!_dtButtons[base]) {
						return { html: base };
					}

					base = _dtButtons[base];
				}

				loop++;
				if (loop > 30) {
					// Protect against misconfiguration killing the browser
					throw 'Buttons: Too many iterations';
				}
			}

			return Array.isArray(base) ? base : $.extend({}, base);
		};

		conf = toConfObject(conf);

		while (conf && conf.extend) {
			// Use `toConfObject` in case the button definition being extended
			// is itself a string or a function
			if (!_dtButtons[conf.extend]) {
				throw 'Cannot extend unknown button type: ' + conf.extend;
			}

			var objArray = toConfObject(_dtButtons[conf.extend]);
			if (Array.isArray(objArray)) {
				return objArray;
			}
			else if (!objArray) {
				// This is a little brutal as it might be possible to have a
				// valid button without the extend, but if there is no extend
				// then the host button would be acting in an undefined state
				return false;
			}

			// Stash the current class name
			var originalClassName = objArray.className;

			if (conf.config !== undefined && objArray.config !== undefined) {
				conf.config = $.extend({}, objArray.config, conf.config);
			}

			conf = $.extend({}, objArray, conf);

			// The extend will have overwritten the original class name if the
			// `conf` object also assigned a class, but we want to concatenate
			// them so they are list that is combined from all extended buttons
			if (originalClassName && conf.className !== originalClassName) {
				conf.className = originalClassName + ' ' + conf.className;
			}

			// Although we want the `conf` object to overwrite almost all of
			// the properties of the object being extended, the `extend`
			// property should come from the object being extended
			conf.extend = objArray.extend;
		}

		// Buttons to be added to a collection  -gives the ability to define
		// if buttons should be added to the start or end of a collection
		var postfixButtons = conf.postfixButtons;
		if (postfixButtons) {
			if (!conf.buttons) {
				conf.buttons = [];
			}

			for (i = 0, ien = postfixButtons.length; i < ien; i++) {
				conf.buttons.push(postfixButtons[i]);
			}
		}

		var prefixButtons = conf.prefixButtons;
		if (prefixButtons) {
			if (!conf.buttons) {
				conf.buttons = [];
			}

			for (i = 0, ien = prefixButtons.length; i < ien; i++) {
				conf.buttons.splice(i, 0, prefixButtons[i]);
			}
		}

		return conf;
	},

	/**
	 * Display (and replace if there is an existing one) a popover attached to a button
	 * @param {string|node} content Content to show
	 * @param {DataTable.Api} hostButton DT API instance of the button
	 * @param {object} inOpts Options (see object below for all options)
	 */
	_popover: function (content, hostButton, inOpts) {
		var dt = hostButton;
		var c = this.c;
		var closed = false;
		var options = $.extend(
			{
				align: 'button-left', // button-right, dt-container, split-left, split-right
				autoClose: false,
				background: true,
				backgroundClassName: 'dt-button-background',
				closeButton: true,
				containerClassName: c.dom.collection.container.className,
				contentClassName: c.dom.collection.container.content.className,
				collectionLayout: '',
				collectionTitle: '',
				dropup: false,
				fade: 400,
				popoverTitle: '',
				rightAlignClassName: 'dt-button-right',
				tag: c.dom.collection.container.tag
			},
			inOpts
		);

		var containerSelector =
			options.tag + '.' + options.containerClassName.replace(/ /g, '.');
		var hostNode = hostButton.node();

		var close = function () {
			closed = true;

			_fadeOut($(containerSelector), options.fade, function () {
				$(this).detach();
			});

			$(
				dt
					.buttons('[aria-haspopup="dialog"][aria-expanded="true"]')
					.nodes()
			).attr('aria-expanded', 'false');

			$('div.dt-button-background').off('click.dtb-collection');
			Buttons.background(
				false,
				options.backgroundClassName,
				options.fade,
				hostNode
			);

			$(window).off('resize.resize.dtb-collection');
			$('body').off('.dtb-collection');
			dt.off('buttons-action.b-internal');
			dt.off('destroy');
		};

		if (content === false) {
			close();
			return;
		}

		var existingExpanded = $(
			dt.buttons('[aria-haspopup="dialog"][aria-expanded="true"]').nodes()
		);
		if (existingExpanded.length) {
			// Reuse the current position if the button that was triggered is inside an existing collection
			if (hostNode.closest(containerSelector).length) {
				hostNode = existingExpanded.eq(0);
			}

			close();
		}

		// Try to be smart about the layout
		var cnt = $('.dt-button', content).length;
		var mod = '';

		if (cnt === 3) {
			mod = 'dtb-b3';
		}
		else if (cnt === 2) {
			mod = 'dtb-b2';
		}
		else if (cnt === 1) {
			mod = 'dtb-b1';
		}

		var display = $('<' + options.tag + '/>')
			.addClass(options.containerClassName)
			.addClass(options.collectionLayout)
			.addClass(options.splitAlignClass)
			.addClass(mod)
			.css('display', 'none')
			.attr({
				'aria-modal': true,
				role: 'dialog'
			});

		content = $(content)
			.addClass(options.contentClassName)
			.attr('role', 'menu')
			.appendTo(display);

		hostNode.attr('aria-expanded', 'true');

		if (hostNode.parents('body')[0] !== document.body) {
			hostNode = document.body.lastChild;
		}

		if (options.popoverTitle) {
			display.prepend(
				'<div class="dt-button-collection-title">' +
					options.popoverTitle +
					'</div>'
			);
		}
		else if (options.collectionTitle) {
			display.prepend(
				'<div class="dt-button-collection-title">' +
					options.collectionTitle +
					'</div>'
			);
		}

		if (options.closeButton) {
			display
				.prepend('<div class="dtb-popover-close">&times;</div>')
				.addClass('dtb-collection-closeable');
		}

		_fadeIn(display.insertAfter(hostNode), options.fade);

		var tableContainer = $(hostButton.table().container());
		var position = display.css('position');

		if (options.span === 'container' || options.align === 'dt-container') {
			hostNode = hostNode.parent();
			display.css('width', tableContainer.width());
		}

		// Align the popover relative to the DataTables container
		// Useful for wide popovers such as SearchPanes
		if (position === 'absolute') {
			// Align relative to the host button
			var offsetParent = $(hostNode[0].offsetParent);
			var buttonPosition = hostNode.position();
			var buttonOffset = hostNode.offset();
			var tableSizes = offsetParent.offset();
			var containerPosition = offsetParent.position();
			var computed = window.getComputedStyle(offsetParent[0]);

			tableSizes.height = offsetParent.outerHeight();
			tableSizes.width =
				offsetParent.width() + parseFloat(computed.paddingLeft);
			tableSizes.right = tableSizes.left + tableSizes.width;
			tableSizes.bottom = tableSizes.top + tableSizes.height;

			// Set the initial position so we can read height / width
			var top = buttonPosition.top + hostNode.outerHeight();
			var left = buttonPosition.left;

			display.css({
				top: top,
				left: left
			});

			// Get the popover position
			computed = window.getComputedStyle(display[0]);
			var popoverSizes = display.offset();

			popoverSizes.height = display.outerHeight();
			popoverSizes.width = display.outerWidth();
			popoverSizes.right = popoverSizes.left + popoverSizes.width;
			popoverSizes.bottom = popoverSizes.top + popoverSizes.height;
			popoverSizes.marginTop = parseFloat(computed.marginTop);
			popoverSizes.marginBottom = parseFloat(computed.marginBottom);

			// First position per the class requirements - pop up and right align
			if (options.dropup) {
				top =
					buttonPosition.top -
					popoverSizes.height -
					popoverSizes.marginTop -
					popoverSizes.marginBottom;
			}

			if (
				options.align === 'button-right' ||
				display.hasClass(options.rightAlignClassName)
			) {
				left =
					buttonPosition.left -
					popoverSizes.width +
					hostNode.outerWidth();
			}

			// Container alignment - make sure it doesn't overflow the table container
			if (
				options.align === 'dt-container' ||
				options.align === 'container'
			) {
				if (left < buttonPosition.left) {
					left = -buttonPosition.left;
				}
			}

			// Window adjustment
			if (
				containerPosition.left + left + popoverSizes.width >
				$(window).width()
			) {
				// Overflowing the document to the right
				left =
					$(window).width() -
					popoverSizes.width -
					containerPosition.left;
			}

			if (buttonOffset.left + left < 0) {
				// Off to the left of the document
				left = -buttonOffset.left;
			}

			if (
				containerPosition.top + top + popoverSizes.height >
				$(window).height() + $(window).scrollTop()
			) {
				// Pop up if otherwise we'd need the user to scroll down
				top =
					buttonPosition.top -
					popoverSizes.height -
					popoverSizes.marginTop -
					popoverSizes.marginBottom;
			}

			if (containerPosition.top + top < $(window).scrollTop()) {
				// Correction for when the top is beyond the top of the page
				top = buttonPosition.top + hostNode.outerHeight();
			}

			// Calculations all done - now set it
			display.css({
				top: top,
				left: left
			});
		}
		else {
			// Fix position - centre on screen
			var place = function () {
				var half = $(window).height() / 2;

				var top = display.height() / 2;
				if (top > half) {
					top = half;
				}

				display.css('marginTop', top * -1);
			};

			place();

			$(window).on('resize.dtb-collection', function () {
				place();
			});
		}

		if (options.background) {
			Buttons.background(
				true,
				options.backgroundClassName,
				options.fade,
				options.backgroundHost || hostNode
			);
		}

		// This is bonkers, but if we don't have a click listener on the
		// background element, iOS Safari will ignore the body click
		// listener below. An empty function here is all that is
		// required to make it work...
		$('div.dt-button-background').on(
			'click.dtb-collection',
			function () {}
		);

		if (options.autoClose) {
			setTimeout(function () {
				dt.on('buttons-action.b-internal', function (e, btn, dt, node) {
					if (node[0] === hostNode[0]) {
						return;
					}
					close();
				});
			}, 0);
		}

		$(display).trigger('buttons-popover.dt');

		dt.on('destroy', close);

		setTimeout(function () {
			closed = false;
			$('body')
				.on('click.dtb-collection', function (e) {
					if (closed) {
						return;
					}

					// andSelf is deprecated in jQ1.8, but we want 1.7 compat
					var back = $.fn.addBack ? 'addBack' : 'andSelf';
					var parent = $(e.target).parent()[0];

					if (
						(!$(e.target).parents()[back]().filter(content)
							.length &&
							!$(parent).hasClass('dt-buttons')) ||
						$(e.target).hasClass('dt-button-background')
					) {
						close();
					}
				})
				.on('keyup.dtb-collection', function (e) {
					if (e.keyCode === 27) {
						close();
					}
				})
				.on('keydown.dtb-collection', function (e) {
					// Focus trap for tab key
					var elements = $('a, button', content);
					var active = document.activeElement;

					if (e.keyCode !== 9) {
						// tab
						return;
					}

					if (elements.index(active) === -1) {
						// If current focus is not inside the popover
						elements.first().focus();
						e.preventDefault();
					}
					else if (e.shiftKey) {
						// Reverse tabbing order when shift key is pressed
						if (active === elements[0]) {
							elements.last().focus();
							e.preventDefault();
						}
					}
					else {
						if (active === elements.last()[0]) {
							elements.first().focus();
							e.preventDefault();
						}
					}
				});
		}, 0);
	}
});

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Statics
 */

/**
 * Show / hide a background layer behind a collection
 * @param  {boolean} Flag to indicate if the background should be shown or
 *   hidden
 * @param  {string} Class to assign to the background
 * @static
 */
Buttons.background = function (show, className, fade, insertPoint) {
	if (fade === undefined) {
		fade = 400;
	}
	if (!insertPoint) {
		insertPoint = document.body;
	}

	if (show) {
		_fadeIn(
			$('<div/>')
				.addClass(className)
				.css('display', 'none')
				.insertAfter(insertPoint),
			fade
		);
	}
	else {
		_fadeOut($('div.' + className), fade, function () {
			$(this).removeClass(className).remove();
		});
	}
};

/**
 * Instance selector - select Buttons instances based on an instance selector
 * value from the buttons assigned to a DataTable. This is only useful if
 * multiple instances are attached to a DataTable.
 * @param  {string|int|array} Instance selector - see `instance-selector`
 *   documentation on the DataTables site
 * @param  {array} Button instance array that was attached to the DataTables
 *   settings object
 * @return {array} Buttons instances
 * @static
 */
Buttons.instanceSelector = function (group, buttons) {
	if (group === undefined || group === null) {
		return $.map(buttons, function (v) {
			return v.inst;
		});
	}

	var ret = [];
	var names = $.map(buttons, function (v) {
		return v.name;
	});

	// Flatten the group selector into an array of single options
	var process = function (input) {
		if (Array.isArray(input)) {
			for (var i = 0, ien = input.length; i < ien; i++) {
				process(input[i]);
			}
			return;
		}

		if (typeof input === 'string') {
			if (input.indexOf(',') !== -1) {
				// String selector, list of names
				process(input.split(','));
			}
			else {
				// String selector individual name
				var idx = $.inArray(input.trim(), names);

				if (idx !== -1) {
					ret.push(buttons[idx].inst);
				}
			}
		}
		else if (typeof input === 'number') {
			// Index selector
			ret.push(buttons[input].inst);
		}
		else if (typeof input === 'object' && input.nodeName) {
			// Element selector
			for (var j = 0; j < buttons.length; j++) {
				if (buttons[j].inst.dom.container[0] === input) {
					ret.push(buttons[j].inst);
				}
			}
		}
		else if (typeof input === 'object') {
			// Actual instance selector
			ret.push(input);
		}
	};

	process(group);

	return ret;
};

/**
 * Button selector - select one or more buttons from a selector input so some
 * operation can be performed on them.
 * @param  {array} Button instances array that the selector should operate on
 * @param  {string|int|node|jQuery|array} Button selector - see
 *   `button-selector` documentation on the DataTables site
 * @return {array} Array of objects containing `inst` and `idx` properties of
 *   the selected buttons so you know which instance each button belongs to.
 * @static
 */
Buttons.buttonSelector = function (insts, selector) {
	var ret = [];
	var nodeBuilder = function (a, buttons, baseIdx) {
		var button;
		var idx;

		for (var i = 0, ien = buttons.length; i < ien; i++) {
			button = buttons[i];

			if (button) {
				idx = baseIdx !== undefined ? baseIdx + i : i + '';

				a.push({
					node: button.node,
					name: button.conf.name,
					idx: idx
				});

				if (button.buttons) {
					nodeBuilder(a, button.buttons, idx + '-');
				}
			}
		}
	};

	var run = function (selector, inst) {
		var i, ien;
		var buttons = [];
		nodeBuilder(buttons, inst.s.buttons);

		var nodes = $.map(buttons, function (v) {
			return v.node;
		});

		if (Array.isArray(selector) || selector instanceof $) {
			for (i = 0, ien = selector.length; i < ien; i++) {
				run(selector[i], inst);
			}
			return;
		}

		if (selector === null || selector === undefined || selector === '*') {
			// Select all
			for (i = 0, ien = buttons.length; i < ien; i++) {
				ret.push({
					inst: inst,
					node: buttons[i].node
				});
			}
		}
		else if (typeof selector === 'number') {
			// Main button index selector
			if (inst.s.buttons[selector]) {
				ret.push({
					inst: inst,
					node: inst.s.buttons[selector].node
				});
			}
		}
		else if (typeof selector === 'string') {
			if (selector.indexOf(',') !== -1) {
				// Split
				var a = selector.split(',');

				for (i = 0, ien = a.length; i < ien; i++) {
					run(a[i].trim(), inst);
				}
			}
			else if (selector.match(/^\d+(\-\d+)*$/)) {
				// Sub-button index selector
				var indexes = $.map(buttons, function (v) {
					return v.idx;
				});

				ret.push({
					inst: inst,
					node: buttons[$.inArray(selector, indexes)].node
				});
			}
			else if (selector.indexOf(':name') !== -1) {
				// Button name selector
				var name = selector.replace(':name', '');

				for (i = 0, ien = buttons.length; i < ien; i++) {
					if (buttons[i].name === name) {
						ret.push({
							inst: inst,
							node: buttons[i].node
						});
					}
				}
			}
			else {
				// jQuery selector on the nodes
				$(nodes)
					.filter(selector)
					.each(function () {
						ret.push({
							inst: inst,
							node: this
						});
					});
			}
		}
		else if (typeof selector === 'object' && selector.nodeName) {
			// Node selector
			var idx = $.inArray(selector, nodes);

			if (idx !== -1) {
				ret.push({
					inst: inst,
					node: nodes[idx]
				});
			}
		}
	};

	for (var i = 0, ien = insts.length; i < ien; i++) {
		var inst = insts[i];

		run(selector, inst);
	}

	return ret;
};

/**
 * Default function used for formatting output data.
 * @param {*} str Data to strip
 */
Buttons.stripData = function (str, config) {
	if (typeof str !== 'string') {
		return str;
	}

	// Always remove script tags
	str = Buttons.stripHtmlScript(str);

	// Always remove comments
	str = Buttons.stripHtmlComments(str);

	if (!config || config.stripHtml) {
		str = DataTable.util.stripHtml(str);
	}

	if (!config || config.trim) {
		str = str.trim();
	}

	if (!config || config.stripNewlines) {
		str = str.replace(/\n/g, ' ');
	}

	if (!config || config.decodeEntities) {
		if (_entityDecoder) {
			str = _entityDecoder(str);
		}
		else {
			_exportTextarea.innerHTML = str;
			str = _exportTextarea.value;
		}
	}

	return str;
};

/**
 * Provide a custom entity decoding function - e.g. a regex one, which can be
 * much faster than the built in DOM option, but also larger code size.
 * @param {function} fn
 */
Buttons.entityDecoder = function (fn) {
	_entityDecoder = fn;
};

/**
 * Common function for stripping HTML comments
 *
 * @param {*} input 
 * @returns 
 */
Buttons.stripHtmlComments = function (input) {
	var previous;  
	
	do {  
		previous = input;
		input = input.replace(/(<!--.*?--!?>)|(<!--[\S\s]+?--!?>)|(<!--[\S\s]*?$)/g, '');
	} while (input !== previous);  

	return input;  
};

/**
 * Common function for stripping HTML script tags
 *
 * @param {*} input 
 * @returns 
 */
Buttons.stripHtmlScript = function (input) {
	var previous;  
	
	do {  
		previous = input;
		input = input.replace(/<script\b[^<]*(?:(?!<\/script[^>]*>)<[^<]*)*<\/script[^>]*>/gi, '');
	} while (input !== previous);  

	return input;  
};

/**
 * Buttons defaults. For full documentation, please refer to the docs/option
 * directory or the DataTables site.
 * @type {Object}
 * @static
 */
Buttons.defaults = {
	buttons: ['copy', 'excel', 'csv', 'pdf', 'print'],
	name: 'main',
	tabIndex: 0,
	dom: {
		container: {
			tag: 'div',
			className: 'dt-buttons'
		},
		collection: {
			action: {
				// action button
				dropHtml: '<span class="dt-button-down-arrow">&#x25BC;</span>'
			},
			container: {
				// The element used for the dropdown
				className: 'dt-button-collection',
				content: {
					className: '',
					tag: 'div'
				},
				tag: 'div'
			}
			// optionally
			// , button: IButton - buttons inside the collection container
			// , split: ISplit - splits inside the collection container
		},
		button: {
			tag: 'button',
			className: 'dt-button',
			active: 'dt-button-active', // class name
			disabled: 'disabled', // class name
			spacer: {
				className: 'dt-button-spacer',
				tag: 'span'
			},
			liner: {
				tag: 'span',
				className: ''
			}
		},
		split: {
			action: {
				// action button
				className: 'dt-button-split-drop-button dt-button',
				tag: 'button'
			},
			dropdown: {
				// button to trigger the dropdown
				align: 'split-right',
				className: 'dt-button-split-drop',
				dropHtml: '<span class="dt-button-down-arrow">&#x25BC;</span>',
				splitAlignClass: 'dt-button-split-left',
				tag: 'button'
			},
			wrapper: {
				// wrap around both
				className: 'dt-button-split',
				tag: 'div'
			}
		}
	}
};

/**
 * Version information
 * @type {string}
 * @static
 */
Buttons.version = '3.0.2';

$.extend(_dtButtons, {
	collection: {
		text: function (dt) {
			return dt.i18n('buttons.collection', 'Collection');
		},
		className: 'buttons-collection',
		closeButton: false,
		init: function (dt, button) {
			button.attr('aria-expanded', false);
		},
		action: function (e, dt, button, config) {
			if (config._collection.parents('body').length) {
				this.popover(false, config);
			}
			else {
				this.popover(config._collection, config);
			}

			// When activated using a key - auto focus on the
			// first item in the popover
			if (e.type === 'keypress') {
				$('a, button', config._collection).eq(0).focus();
			}
		},
		attr: {
			'aria-haspopup': 'dialog'
		}
		// Also the popover options, defined in Buttons.popover
	},
	split: {
		text: function (dt) {
			return dt.i18n('buttons.split', 'Split');
		},
		className: 'buttons-split',
		closeButton: false,
		init: function (dt, button) {
			return button.attr('aria-expanded', false);
		},
		action: function (e, dt, button, config) {
			this.popover(config._collection, config);
		},
		attr: {
			'aria-haspopup': 'dialog'
		}
		// Also the popover options, defined in Buttons.popover
	},
	copy: function () {
		if (_dtButtons.copyHtml5) {
			return 'copyHtml5';
		}
	},
	csv: function (dt, conf) {
		if (_dtButtons.csvHtml5 && _dtButtons.csvHtml5.available(dt, conf)) {
			return 'csvHtml5';
		}
	},
	excel: function (dt, conf) {
		if (
			_dtButtons.excelHtml5 &&
			_dtButtons.excelHtml5.available(dt, conf)
		) {
			return 'excelHtml5';
		}
	},
	pdf: function (dt, conf) {
		if (_dtButtons.pdfHtml5 && _dtButtons.pdfHtml5.available(dt, conf)) {
			return 'pdfHtml5';
		}
	},
	pageLength: function (dt) {
		var lengthMenu = dt.settings()[0].aLengthMenu;
		var vals = [];
		var lang = [];
		var text = function (dt) {
			return dt.i18n(
				'buttons.pageLength',
				{
					'-1': 'Show all rows',
					_: 'Show %d rows'
				},
				dt.page.len()
			);
		};

		// Support for DataTables 1.x 2D array
		if (Array.isArray(lengthMenu[0])) {
			vals = lengthMenu[0];
			lang = lengthMenu[1];
		}
		else {
			for (var i = 0; i < lengthMenu.length; i++) {
				var option = lengthMenu[i];

				// Support for DataTables 2 object in the array
				if ($.isPlainObject(option)) {
					vals.push(option.value);
					lang.push(option.label);
				}
				else {
					vals.push(option);
					lang.push(option);
				}
			}
		}

		return {
			extend: 'collection',
			text: text,
			className: 'buttons-page-length',
			autoClose: true,
			buttons: $.map(vals, function (val, i) {
				return {
					text: lang[i],
					className: 'button-page-length',
					action: function (e, dt) {
						dt.page.len(val).draw();
					},
					init: function (dt, node, conf) {
						var that = this;
						var fn = function () {
							that.active(dt.page.len() === val);
						};

						dt.on('length.dt' + conf.namespace, fn);
						fn();
					},
					destroy: function (dt, node, conf) {
						dt.off('length.dt' + conf.namespace);
					}
				};
			}),
			init: function (dt, node, conf) {
				var that = this;
				dt.on('length.dt' + conf.namespace, function () {
					that.text(conf.text);
				});
			},
			destroy: function (dt, node, conf) {
				dt.off('length.dt' + conf.namespace);
			}
		};
	},
	spacer: {
		style: 'empty',
		spacer: true,
		text: function (dt) {
			return dt.i18n('buttons.spacer', '');
		}
	}
});

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * DataTables API
 *
 * For complete documentation, please refer to the docs/api directory or the
 * DataTables site
 */

// Buttons group and individual button selector
DataTable.Api.register('buttons()', function (group, selector) {
	// Argument shifting
	if (selector === undefined) {
		selector = group;
		group = undefined;
	}

	this.selector.buttonGroup = group;

	var res = this.iterator(
		true,
		'table',
		function (ctx) {
			if (ctx._buttons) {
				return Buttons.buttonSelector(
					Buttons.instanceSelector(group, ctx._buttons),
					selector
				);
			}
		},
		true
	);

	res._groupSelector = group;
	return res;
});

// Individual button selector
DataTable.Api.register('button()', function (group, selector) {
	// just run buttons() and truncate
	var buttons = this.buttons(group, selector);

	if (buttons.length > 1) {
		buttons.splice(1, buttons.length);
	}

	return buttons;
});

// Active buttons
DataTable.Api.registerPlural(
	'buttons().active()',
	'button().active()',
	function (flag) {
		if (flag === undefined) {
			return this.map(function (set) {
				return set.inst.active(set.node);
			});
		}

		return this.each(function (set) {
			set.inst.active(set.node, flag);
		});
	}
);

// Get / set button action
DataTable.Api.registerPlural(
	'buttons().action()',
	'button().action()',
	function (action) {
		if (action === undefined) {
			return this.map(function (set) {
				return set.inst.action(set.node);
			});
		}

		return this.each(function (set) {
			set.inst.action(set.node, action);
		});
	}
);

// Collection control
DataTable.Api.registerPlural(
	'buttons().collectionRebuild()',
	'button().collectionRebuild()',
	function (buttons) {
		return this.each(function (set) {
			for (var i = 0; i < buttons.length; i++) {
				if (typeof buttons[i] === 'object') {
					buttons[i].parentConf = set;
				}
			}
			set.inst.collectionRebuild(set.node, buttons);
		});
	}
);

// Enable / disable buttons
DataTable.Api.register(
	['buttons().enable()', 'button().enable()'],
	function (flag) {
		return this.each(function (set) {
			set.inst.enable(set.node, flag);
		});
	}
);

// Disable buttons
DataTable.Api.register(
	['buttons().disable()', 'button().disable()'],
	function () {
		return this.each(function (set) {
			set.inst.disable(set.node);
		});
	}
);

// Button index
DataTable.Api.register('button().index()', function () {
	var idx = null;

	this.each(function (set) {
		var res = set.inst.index(set.node);

		if (res !== null) {
			idx = res;
		}
	});

	return idx;
});

// Get button nodes
DataTable.Api.registerPlural(
	'buttons().nodes()',
	'button().node()',
	function () {
		var jq = $();

		// jQuery will automatically reduce duplicates to a single entry
		$(
			this.each(function (set) {
				jq = jq.add(set.inst.node(set.node));
			})
		);

		return jq;
	}
);

// Get / set button processing state
DataTable.Api.registerPlural(
	'buttons().processing()',
	'button().processing()',
	function (flag) {
		if (flag === undefined) {
			return this.map(function (set) {
				return set.inst.processing(set.node);
			});
		}

		return this.each(function (set) {
			set.inst.processing(set.node, flag);
		});
	}
);

// Get / set button text (i.e. the button labels)
DataTable.Api.registerPlural(
	'buttons().text()',
	'button().text()',
	function (label) {
		if (label === undefined) {
			return this.map(function (set) {
				return set.inst.text(set.node);
			});
		}

		return this.each(function (set) {
			set.inst.text(set.node, label);
		});
	}
);

// Trigger a button's action
DataTable.Api.registerPlural(
	'buttons().trigger()',
	'button().trigger()',
	function () {
		return this.each(function (set) {
			set.inst.node(set.node).trigger('click');
		});
	}
);

// Button resolver to the popover
DataTable.Api.register('button().popover()', function (content, options) {
	return this.map(function (set) {
		return set.inst._popover(content, this.button(this[0].node), options);
	});
});

// Get the container elements
DataTable.Api.register('buttons().containers()', function () {
	var jq = $();
	var groupSelector = this._groupSelector;

	// We need to use the group selector directly, since if there are no buttons
	// the result set will be empty
	this.iterator(true, 'table', function (ctx) {
		if (ctx._buttons) {
			var insts = Buttons.instanceSelector(groupSelector, ctx._buttons);

			for (var i = 0, ien = insts.length; i < ien; i++) {
				jq = jq.add(insts[i].container());
			}
		}
	});

	return jq;
});

DataTable.Api.register('buttons().container()', function () {
	// API level of nesting is `buttons()` so we can zip into the containers method
	return this.containers().eq(0);
});

// Add a new button
DataTable.Api.register('button().add()', function (idx, conf, draw) {
	var ctx = this.context;

	// Don't use `this` as it could be empty - select the instances directly
	if (ctx.length) {
		var inst = Buttons.instanceSelector(
			this._groupSelector,
			ctx[0]._buttons
		);

		if (inst.length) {
			inst[0].add(conf, idx, draw);
		}
	}

	return this.button(this._groupSelector, idx);
});

// Destroy the button sets selected
DataTable.Api.register('buttons().destroy()', function () {
	this.pluck('inst')
		.unique()
		.each(function (inst) {
			inst.destroy();
		});

	return this;
});

// Remove a button
DataTable.Api.registerPlural(
	'buttons().remove()',
	'buttons().remove()',
	function () {
		this.each(function (set) {
			set.inst.remove(set.node);
		});

		return this;
	}
);

// Information box that can be used by buttons
var _infoTimer;
DataTable.Api.register('buttons.info()', function (title, message, time) {
	var that = this;

	if (title === false) {
		this.off('destroy.btn-info');
		_fadeOut($('#datatables_buttons_info'), 400, function () {
			$(this).remove();
		});
		clearTimeout(_infoTimer);
		_infoTimer = null;

		return this;
	}

	if (_infoTimer) {
		clearTimeout(_infoTimer);
	}

	if ($('#datatables_buttons_info').length) {
		$('#datatables_buttons_info').remove();
	}

	title = title ? '<h2>' + title + '</h2>' : '';

	_fadeIn(
		$('<div id="datatables_buttons_info" class="dt-button-info"/>')
			.html(title)
			.append(
				$('<div/>')[typeof message === 'string' ? 'html' : 'append'](
					message
				)
			)
			.css('display', 'none')
			.appendTo('body')
	);

	if (time !== undefined && time !== 0) {
		_infoTimer = setTimeout(function () {
			that.buttons.info(false);
		}, time);
	}

	this.on('destroy.btn-info', function () {
		that.buttons.info(false);
	});

	return this;
});

// Get data from the table for export - this is common to a number of plug-in
// buttons so it is included in the Buttons core library
DataTable.Api.register('buttons.exportData()', function (options) {
	if (this.context.length) {
		return _exportData(new DataTable.Api(this.context[0]), options);
	}
});

// Get information about the export that is common to many of the export data
// types (DRY)
DataTable.Api.register('buttons.exportInfo()', function (conf) {
	if (!conf) {
		conf = {};
	}

	return {
		filename: _filename(conf, this),
		title: _title(conf, this),
		messageTop: _message(this, conf, conf.message || conf.messageTop, 'top'),
		messageBottom: _message(this, conf, conf.messageBottom, 'bottom')
	};
});

/**
 * Get the file name for an exported file.
 *
 * @param {object} config Button configuration
 * @param {object} dt DataTable instance
 */
var _filename = function (config, dt) {
	// Backwards compatibility
	var filename =
		config.filename === '*' &&
		config.title !== '*' &&
		config.title !== undefined &&
		config.title !== null &&
		config.title !== ''
			? config.title
			: config.filename;

	if (typeof filename === 'function') {
		filename = filename(config, dt);
	}

	if (filename === undefined || filename === null) {
		return null;
	}

	if (filename.indexOf('*') !== -1) {
		filename = filename.replace(/\*/g, $('head > title').text()).trim();
	}

	// Strip characters which the OS will object to
	filename = filename.replace(/[^a-zA-Z0-9_\u00A1-\uFFFF\.,\-_ !\(\)]/g, '');

	var extension = _stringOrFunction(config.extension, config, dt);
	if (!extension) {
		extension = '';
	}

	return filename + extension;
};

/**
 * Simply utility method to allow parameters to be given as a function
 *
 * @param {undefined|string|function} option Option
 * @return {null|string} Resolved value
 */
var _stringOrFunction = function (option, config, dt) {
	if (option === null || option === undefined) {
		return null;
	}
	else if (typeof option === 'function') {
		return option(config, dt);
	}
	return option;
};

/**
 * Get the title for an exported file.
 *
 * @param {object} config	Button configuration
 */
var _title = function (config, dt) {
	var title = _stringOrFunction(config.title, config, dt);

	return title === null
		? null
		: title.indexOf('*') !== -1
		? title.replace(/\*/g, $('head > title').text() || 'Exported data')
		: title;
};

var _message = function (dt, config, option, position) {
	var message = _stringOrFunction(option, config, dt);
	if (message === null) {
		return null;
	}

	var caption = $('caption', dt.table().container()).eq(0);
	if (message === '*') {
		var side = caption.css('caption-side');
		if (side !== position) {
			return null;
		}

		return caption.length ? caption.text() : '';
	}

	return message;
};

var _exportTextarea = $('<textarea/>')[0];
var _exportData = function (dt, inOpts) {
	var config = $.extend(
		true,
		{},
		{
			rows: null,
			columns: '',
			modifier: {
				search: 'applied',
				order: 'applied'
			},
			orthogonal: 'display',
			stripHtml: true,
			stripNewlines: true,
			decodeEntities: true,
			trim: true,
			format: {
				header: function (d) {
					return Buttons.stripData(d, config);
				},
				footer: function (d) {
					return Buttons.stripData(d, config);
				},
				body: function (d) {
					return Buttons.stripData(d, config);
				}
			},
			customizeData: null,
			customizeZip: null
		},
		inOpts
	);

	var header = dt
		.columns(config.columns)
		.indexes()
		.map(function (idx) {
			var col = dt.column(idx);
			return config.format.header(col.title(), idx, col.header());
		})
		.toArray();

	var footer = dt.table().footer()
		? dt
				.columns(config.columns)
				.indexes()
				.map(function (idx) {
					var el = dt.column(idx).footer();
					var val = '';

					if (el) {
						var inner = $('.dt-column-title', el);

						val = inner.length
							? inner.html()
							: $(el).html();
					}

					return config.format.footer(val, idx, el);
				})
				.toArray()
		: null;

	// If Select is available on this table, and any rows are selected, limit the export
	// to the selected rows. If no rows are selected, all rows will be exported. Specify
	// a `selected` modifier to control directly.
	var modifier = $.extend({}, config.modifier);
	if (
		dt.select &&
		typeof dt.select.info === 'function' &&
		modifier.selected === undefined
	) {
		if (
			dt.rows(config.rows, $.extend({ selected: true }, modifier)).any()
		) {
			$.extend(modifier, { selected: true });
		}
	}

	var rowIndexes = dt.rows(config.rows, modifier).indexes().toArray();
	var selectedCells = dt.cells(rowIndexes, config.columns, {
		order: modifier.order
	});
	var cells = selectedCells.render(config.orthogonal).toArray();
	var cellNodes = selectedCells.nodes().toArray();
	var cellIndexes = selectedCells.indexes().toArray();

	var columns = dt.columns(config.columns).count();
	var rows = columns > 0 ? cells.length / columns : 0;
	var body = [];
	var cellCounter = 0;

	for (var i = 0, ien = rows; i < ien; i++) {
		var row = [columns];

		for (var j = 0; j < columns; j++) {
			row[j] = config.format.body(
				cells[cellCounter],
				cellIndexes[cellCounter].row,
				cellIndexes[cellCounter].column,
				cellNodes[cellCounter]
			);
			cellCounter++;
		}

		body[i] = row;
	}

	var data = {
		header: header,
		headerStructure: _headerFormatter(
			config.format.header,
			dt.table().header.structure(config.columns)
		),
		footer: footer,
		footerStructure: _headerFormatter(
			config.format.footer,
			dt.table().footer.structure(config.columns)
		),
		body: body
	};

	if (config.customizeData) {
		config.customizeData(data);
	}

	return data;
};

function _headerFormatter(formatter, struct) {
	for (var i=0 ; i<struct.length ; i++) {
		for (var j=0 ; j<struct[i].length ; j++) {
			var item = struct[i][j];

			if (item) {
				item.title = formatter(
					item.title,
					j,
					item.cell
				);
			}
		}
	}

	return struct;
}

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * DataTables interface
 */

// Attach to DataTables objects for global access
$.fn.dataTable.Buttons = Buttons;
$.fn.DataTable.Buttons = Buttons;

// DataTables creation - check if the buttons have been defined for this table,
// they will have been if the `B` option was used in `dom`, otherwise we should
// create the buttons instance here so they can be inserted into the document
// using the API. Listen for `init` for compatibility with pre 1.10.10, but to
// be removed in future.
$(document).on('init.dt plugin-init.dt', function (e, settings) {
	if (e.namespace !== 'dt') {
		return;
	}

	var opts = settings.oInit.buttons || DataTable.defaults.buttons;

	if (opts && !settings._buttons) {
		new Buttons(settings, opts).container();
	}
});

function _init(settings, options) {
	var api = new DataTable.Api(settings);
	var opts = options
		? options
		: api.init().buttons || DataTable.defaults.buttons;

	return new Buttons(api, opts).container();
}

// DataTables 1 `dom` feature option
DataTable.ext.feature.push({
	fnInit: _init,
	cFeature: 'B'
});

// DataTables 2 layout feature
if (DataTable.feature) {
	DataTable.feature.register('buttons', _init);
}


return DataTable;
}));


/*! Bootstrap integration for DataTables' Buttons
 * © SpryMedia Ltd - datatables.net/license
 */

(function( factory ){
	if ( typeof define === 'function' && define.amd ) {
		// AMD
		define( ['jquery', 'datatables.net-bs5', 'datatables.net-buttons'], function ( $ ) {
			return factory( $, window, document );
		} );
	}
	else if ( typeof exports === 'object' ) {
		// CommonJS
		var jq = require('jquery');
		var cjsRequires = function (root, $) {
			if ( ! $.fn.dataTable ) {
				require('datatables.net-bs5')(root, $);
			}

			if ( ! $.fn.dataTable.Buttons ) {
				require('datatables.net-buttons')(root, $);
			}
		};

		if (typeof window === 'undefined') {
			module.exports = function (root, $) {
				if ( ! root ) {
					// CommonJS environments without a window global must pass a
					// root. This will give an error otherwise
					root = window;
				}

				if ( ! $ ) {
					$ = jq( root );
				}

				cjsRequires( root, $ );
				return factory( $, root, root.document );
			};
		}
		else {
			cjsRequires( window, jq );
			module.exports = factory( jq, window, window.document );
		}
	}
	else {
		// Browser
		factory( jQuery, window, document );
	}
}(function( $, window, document ) {
'use strict';
var DataTable = $.fn.dataTable;



$.extend(true, DataTable.Buttons.defaults, {
	dom: {
		container: {
			className: 'dt-buttons btn-group flex-wrap'
		},
		button: {
			className: 'btn btn-secondary',
			active: 'active'
		},
		collection: {
			action: {
				dropHtml: ''
			},
			container: {
				tag: 'div',
				className: 'dropdown-menu dt-button-collection'
			},
			closeButton: false,
			button: {
				tag: 'a',
				className: 'dt-button dropdown-item',
				active: 'dt-button-active',
				disabled: 'disabled',
				spacer: {
					className: 'dropdown-divider',
					tag: 'hr'
				}
			}
		},
		split: {
			action: {
				tag: 'a',
				className: 'btn btn-secondary dt-button-split-drop-button',
				closeButton: false
			},
			dropdown: {
				tag: 'button',
				dropHtml: '',
				className:
					'btn btn-secondary dt-button-split-drop dropdown-toggle dropdown-toggle-split',
				closeButton: false,
				align: 'split-left',
				splitAlignClass: 'dt-button-split-left'
			},
			wrapper: {
				tag: 'div',
				className: 'dt-button-split btn-group',
				closeButton: false
			}
		}
	},
	buttonCreated: function (config, button) {
		return config.buttons ? $('<div class="btn-group"/>').append(button) : button;
	}
});

DataTable.ext.buttons.collection.className += ' dropdown-toggle';
DataTable.ext.buttons.collection.rightAlignClassName = 'dropdown-menu-right';


return DataTable;
}));


/*!
 * Column visibility buttons for Buttons and DataTables.
 * © SpryMedia Ltd - datatables.net/license
 */

(function( factory ){
	if ( typeof define === 'function' && define.amd ) {
		// AMD
		define( ['jquery', 'datatables.net', 'datatables.net-buttons'], function ( $ ) {
			return factory( $, window, document );
		} );
	}
	else if ( typeof exports === 'object' ) {
		// CommonJS
		var jq = require('jquery');
		var cjsRequires = function (root, $) {
			if ( ! $.fn.dataTable ) {
				require('datatables.net')(root, $);
			}

			if ( ! $.fn.dataTable.Buttons ) {
				require('datatables.net-buttons')(root, $);
			}
		};

		if (typeof window === 'undefined') {
			module.exports = function (root, $) {
				if ( ! root ) {
					// CommonJS environments without a window global must pass a
					// root. This will give an error otherwise
					root = window;
				}

				if ( ! $ ) {
					$ = jq( root );
				}

				cjsRequires( root, $ );
				return factory( $, root, root.document );
			};
		}
		else {
			cjsRequires( window, jq );
			module.exports = factory( jq, window, window.document );
		}
	}
	else {
		// Browser
		factory( jQuery, window, document );
	}
}(function( $, window, document ) {
'use strict';
var DataTable = $.fn.dataTable;



$.extend(DataTable.ext.buttons, {
	// A collection of column visibility buttons
	colvis: function (dt, conf) {
		var node = null;
		var buttonConf = {
			extend: 'collection',
			init: function (dt, n) {
				node = n;
			},
			text: function (dt) {
				return dt.i18n('buttons.colvis', 'Column visibility');
			},
			className: 'buttons-colvis',
			closeButton: false,
			buttons: [
				{
					extend: 'columnsToggle',
					columns: conf.columns,
					columnText: conf.columnText
				}
			]
		};

		// Rebuild the collection with the new column structure if columns are reordered
		dt.on('column-reorder.dt' + conf.namespace, function () {
			dt.button(null, dt.button(null, node).node()).collectionRebuild([
				{
					extend: 'columnsToggle',
					columns: conf.columns,
					columnText: conf.columnText
				}
			]);
		});

		return buttonConf;
	},

	// Selected columns with individual buttons - toggle column visibility
	columnsToggle: function (dt, conf) {
		var columns = dt
			.columns(conf.columns)
			.indexes()
			.map(function (idx) {
				return {
					extend: 'columnToggle',
					columns: idx,
					columnText: conf.columnText
				};
			})
			.toArray();

		return columns;
	},

	// Single button to toggle column visibility
	columnToggle: function (dt, conf) {
		return {
			extend: 'columnVisibility',
			columns: conf.columns,
			columnText: conf.columnText
		};
	},

	// Selected columns with individual buttons - set column visibility
	columnsVisibility: function (dt, conf) {
		var columns = dt
			.columns(conf.columns)
			.indexes()
			.map(function (idx) {
				return {
					extend: 'columnVisibility',
					columns: idx,
					visibility: conf.visibility,
					columnText: conf.columnText
				};
			})
			.toArray();

		return columns;
	},

	// Single button to set column visibility
	columnVisibility: {
		columns: undefined, // column selector
		text: function (dt, button, conf) {
			return conf._columnText(dt, conf);
		},
		className: 'buttons-columnVisibility',
		action: function (e, dt, button, conf) {
			var col = dt.columns(conf.columns);
			var curr = col.visible();

			col.visible(
				conf.visibility !== undefined ? conf.visibility : !(curr.length ? curr[0] : false)
			);
		},
		init: function (dt, button, conf) {
			var that = this;
			button.attr('data-cv-idx', conf.columns);

			dt.on('column-visibility.dt' + conf.namespace, function (e, settings) {
				if (!settings.bDestroying && settings.nTable == dt.settings()[0].nTable) {
					that.active(dt.column(conf.columns).visible());
				}
			}).on('column-reorder.dt' + conf.namespace, function () {
				// Button has been removed from the DOM
				if (conf.destroying) {
					return;
				}

				if (dt.columns(conf.columns).count() !== 1) {
					return;
				}

				// This button controls the same column index but the text for the column has
				// changed
				that.text(conf._columnText(dt, conf));

				// Since its a different column, we need to check its visibility
				that.active(dt.column(conf.columns).visible());
			});

			this.active(dt.column(conf.columns).visible());
		},
		destroy: function (dt, button, conf) {
			dt.off('column-visibility.dt' + conf.namespace).off(
				'column-reorder.dt' + conf.namespace
			);
		},

		_columnText: function (dt, conf) {
			if (typeof conf.text === 'string') {
				return conf.text;
			}

			var title = dt.column(conf.columns).title();
			var idx = dt.column(conf.columns).index();

			title = title
				.replace(/\n/g, ' ') // remove new lines
				.replace(/<br\s*\/?>/gi, ' ') // replace line breaks with spaces
				.replace(/<select(.*?)<\/select\s*>/gi, ''); // remove select tags, including options text

			// Strip HTML comments
			title = DataTable.Buttons.stripHtmlComments(title);

			// Use whatever HTML stripper DataTables is configured for
			title = DataTable.util.stripHtml(title).trim();

			return conf.columnText ? conf.columnText(dt, idx, title) : title;
		}
	},

	colvisRestore: {
		className: 'buttons-colvisRestore',

		text: function (dt) {
			return dt.i18n('buttons.colvisRestore', 'Restore visibility');
		},

		init: function (dt, button, conf) {
			// Use a private parameter on the column. This gets moved around with the
			// column if ColReorder changes the order
			dt.columns().every(function () {
				var init = this.init();

				if (init.__visOriginal === undefined) {
					init.__visOriginal = this.visible();
				}
			});
		},

		action: function (e, dt, button, conf) {
			dt.columns().every(function (i) {
				var init = this.init();

				this.visible(init.__visOriginal);
			});
		}
	},

	colvisGroup: {
		className: 'buttons-colvisGroup',

		action: function (e, dt, button, conf) {
			dt.columns(conf.show).visible(true, false);
			dt.columns(conf.hide).visible(false, false);

			dt.columns.adjust();
		},

		show: [],

		hide: []
	}
});


return DataTable;
}));


/*!
 * HTML5 export buttons for Buttons and DataTables.
 * © SpryMedia Ltd - datatables.net/license
 *
 * FileSaver.js (1.3.3) - MIT license
 * Copyright © 2016 Eli Grey - http://eligrey.com
 */

(function( factory ){
	if ( typeof define === 'function' && define.amd ) {
		// AMD
		define( ['jquery', 'datatables.net', 'datatables.net-buttons'], function ( $ ) {
			return factory( $, window, document );
		} );
	}
	else if ( typeof exports === 'object' ) {
		// CommonJS
		var jq = require('jquery');
		var cjsRequires = function (root, $) {
			if ( ! $.fn.dataTable ) {
				require('datatables.net')(root, $);
			}

			if ( ! $.fn.dataTable.Buttons ) {
				require('datatables.net-buttons')(root, $);
			}
		};

		if (typeof window === 'undefined') {
			module.exports = function (root, $) {
				if ( ! root ) {
					// CommonJS environments without a window global must pass a
					// root. This will give an error otherwise
					root = window;
				}

				if ( ! $ ) {
					$ = jq( root );
				}

				cjsRequires( root, $ );
				return factory( $, root, root.document );
			};
		}
		else {
			cjsRequires( window, jq );
			module.exports = factory( jq, window, window.document );
		}
	}
	else {
		// Browser
		factory( jQuery, window, document );
	}
}(function( $, window, document ) {
'use strict';
var DataTable = $.fn.dataTable;



// Allow the constructor to pass in JSZip and PDFMake from external requires.
// Otherwise, use globally defined variables, if they are available.
var useJszip;
var usePdfmake;

function _jsZip() {
	return useJszip || window.JSZip;
}
function _pdfMake() {
	return usePdfmake || window.pdfMake;
}

DataTable.Buttons.pdfMake = function (_) {
	if (!_) {
		return _pdfMake();
	}
	usePdfmake = _;
};

DataTable.Buttons.jszip = function (_) {
	if (!_) {
		return _jsZip();
	}
	useJszip = _;
};

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * FileSaver.js dependency
 */

/*jslint bitwise: true, indent: 4, laxbreak: true, laxcomma: true, smarttabs: true, plusplus: true */

var _saveAs = (function (view) {
	'use strict';
	// IE <10 is explicitly unsupported
	if (
		typeof view === 'undefined' ||
		(typeof navigator !== 'undefined' &&
			/MSIE [1-9]\./.test(navigator.userAgent))
	) {
		return;
	}
	var doc = view.document,
		// only get URL when necessary in case Blob.js hasn't overridden it yet
		get_URL = function () {
			return view.URL || view.webkitURL || view;
		},
		save_link = doc.createElementNS('http://www.w3.org/1999/xhtml', 'a'),
		can_use_save_link = 'download' in save_link,
		click = function (node) {
			var event = new MouseEvent('click');
			node.dispatchEvent(event);
		},
		is_safari = /constructor/i.test(view.HTMLElement) || view.safari,
		is_chrome_ios = /CriOS\/[\d]+/.test(navigator.userAgent),
		throw_outside = function (ex) {
			(view.setImmediate || view.setTimeout)(function () {
				throw ex;
			}, 0);
		},
		force_saveable_type = 'application/octet-stream',
		// the Blob API is fundamentally broken as there is no "downloadfinished" event to subscribe to
		arbitrary_revoke_timeout = 1000 * 40, // in ms
		revoke = function (file) {
			var revoker = function () {
				if (typeof file === 'string') {
					// file is an object URL
					get_URL().revokeObjectURL(file);
				}
				else {
					// file is a File
					file.remove();
				}
			};
			setTimeout(revoker, arbitrary_revoke_timeout);
		},
		dispatch = function (filesaver, event_types, event) {
			event_types = [].concat(event_types);
			var i = event_types.length;
			while (i--) {
				var listener = filesaver['on' + event_types[i]];
				if (typeof listener === 'function') {
					try {
						listener.call(filesaver, event || filesaver);
					} catch (ex) {
						throw_outside(ex);
					}
				}
			}
		},
		auto_bom = function (blob) {
			// prepend BOM for UTF-8 XML and text/* types (including HTML)
			// note: your browser will automatically convert UTF-16 U+FEFF to EF BB BF
			if (
				/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(
					blob.type
				)
			) {
				return new Blob([String.fromCharCode(0xfeff), blob], {
					type: blob.type
				});
			}
			return blob;
		},
		FileSaver = function (blob, name, no_auto_bom) {
			if (!no_auto_bom) {
				blob = auto_bom(blob);
			}
			// First try a.download, then web filesystem, then object URLs
			var filesaver = this,
				type = blob.type,
				force = type === force_saveable_type,
				object_url,
				dispatch_all = function () {
					dispatch(
						filesaver,
						'writestart progress write writeend'.split(' ')
					);
				},
				// on any filesys errors revert to saving with object URLs
				fs_error = function () {
					if (
						(is_chrome_ios || (force && is_safari)) &&
						view.FileReader
					) {
						// Safari doesn't allow downloading of blob urls
						var reader = new FileReader();
						reader.onloadend = function () {
							var url = is_chrome_ios
								? reader.result
								: reader.result.replace(
										/^data:[^;]*;/,
										'data:attachment/file;'
								);
							var popup = view.open(url, '_blank');
							if (!popup) view.location.href = url;
							url = undefined; // release reference before dispatching
							filesaver.readyState = filesaver.DONE;
							dispatch_all();
						};
						reader.readAsDataURL(blob);
						filesaver.readyState = filesaver.INIT;
						return;
					}
					// don't create more object URLs than needed
					if (!object_url) {
						object_url = get_URL().createObjectURL(blob);
					}
					if (force) {
						view.location.href = object_url;
					}
					else {
						var opened = view.open(object_url, '_blank');
						if (!opened) {
							// Apple does not allow window.open, see https://developer.apple.com/library/safari/documentation/Tools/Conceptual/SafariExtensionGuide/WorkingwithWindowsandTabs/WorkingwithWindowsandTabs.html
							view.location.href = object_url;
						}
					}
					filesaver.readyState = filesaver.DONE;
					dispatch_all();
					revoke(object_url);
				};
			filesaver.readyState = filesaver.INIT;

			if (can_use_save_link) {
				object_url = get_URL().createObjectURL(blob);
				setTimeout(function () {
					save_link.href = object_url;
					save_link.download = name;
					click(save_link);
					dispatch_all();
					revoke(object_url);
					filesaver.readyState = filesaver.DONE;
				});
				return;
			}

			fs_error();
		},
		FS_proto = FileSaver.prototype,
		saveAs = function (blob, name, no_auto_bom) {
			return new FileSaver(
				blob,
				name || blob.name || 'download',
				no_auto_bom
			);
		};
	// IE 10+ (native saveAs)
	if (typeof navigator !== 'undefined' && navigator.msSaveOrOpenBlob) {
		return function (blob, name, no_auto_bom) {
			name = name || blob.name || 'download';

			if (!no_auto_bom) {
				blob = auto_bom(blob);
			}
			return navigator.msSaveOrOpenBlob(blob, name);
		};
	}

	FS_proto.abort = function () {};
	FS_proto.readyState = FS_proto.INIT = 0;
	FS_proto.WRITING = 1;
	FS_proto.DONE = 2;

	FS_proto.error =
		FS_proto.onwritestart =
		FS_proto.onprogress =
		FS_proto.onwrite =
		FS_proto.onabort =
		FS_proto.onerror =
		FS_proto.onwriteend =
			null;

	return saveAs;
})(
	(typeof self !== 'undefined' && self) ||
		(typeof window !== 'undefined' && window) ||
		this.content
);

// Expose file saver on the DataTables API. Can't attach to `DataTables.Buttons`
// since this file can be loaded before Button's core!
DataTable.fileSave = _saveAs;

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Local (private) functions
 */

/**
 * Get the sheet name for Excel exports.
 *
 * @param {object}	config Button configuration
 */
var _sheetname = function (config) {
	var sheetName = 'Sheet1';

	if (config.sheetName) {
		sheetName = config.sheetName.replace(/[\[\]\*\/\\\?\:]/g, '');
	}

	return sheetName;
};

/**
 * Get the newline character(s)
 *
 * @param {object}	config Button configuration
 * @return {string}				Newline character
 */
var _newLine = function (config) {
	return config.newline
		? config.newline
		: navigator.userAgent.match(/Windows/)
		? '\r\n'
		: '\n';
};

/**
 * Combine the data from the `buttons.exportData` method into a string that
 * will be used in the export file.
 *
 * @param	{DataTable.Api} dt		 DataTables API instance
 * @param	{object}				config Button configuration
 * @return {object}							 The data to export
 */
var _exportData = function (dt, config) {
	var newLine = _newLine(config);
	var data = dt.buttons.exportData(config.exportOptions);
	var boundary = config.fieldBoundary;
	var separator = config.fieldSeparator;
	var reBoundary = new RegExp(boundary, 'g');
	var escapeChar = config.escapeChar !== undefined ? config.escapeChar : '\\';
	var join = function (a) {
		var s = '';

		// If there is a field boundary, then we might need to escape it in
		// the source data
		for (var i = 0, ien = a.length; i < ien; i++) {
			if (i > 0) {
				s += separator;
			}

			s += boundary
				? boundary +
				('' + a[i]).replace(reBoundary, escapeChar + boundary) +
				boundary
				: a[i];
		}

		return s;
	};

	var header = '';
	var footer = '';
	var body = [];

	if (config.header) {
		header =
			data.headerStructure
				.map(function (row) {
					return join(
						row.map(function (cell) {
							return cell ? cell.title : '';
						})
					);
				})
				.join(newLine) + newLine;
	}

	if (config.footer && data.footer) {
		footer =
			data.footerStructure
				.map(function (row) {
					return join(
						row.map(function (cell) {
							return cell ? cell.title : '';
						})
					);
				})
				.join(newLine) + newLine;
	}

	for (var i = 0, ien = data.body.length; i < ien; i++) {
		body.push(join(data.body[i]));
	}

	return {
		str: header + body.join(newLine) + newLine + footer,
		rows: body.length
	};
};

/**
 * Older versions of Safari (prior to tech preview 18) don't support the
 * download option required.
 *
 * @return {Boolean} `true` if old Safari
 */
var _isDuffSafari = function () {
	var safari =
		navigator.userAgent.indexOf('Safari') !== -1 &&
		navigator.userAgent.indexOf('Chrome') === -1 &&
		navigator.userAgent.indexOf('Opera') === -1;

	if (!safari) {
		return false;
	}

	var version = navigator.userAgent.match(/AppleWebKit\/(\d+\.\d+)/);
	if (version && version.length > 1 && version[1] * 1 < 603.1) {
		return true;
	}

	return false;
};

/**
 * Convert from numeric position to letter for column names in Excel
 * @param  {int} n Column number
 * @return {string} Column letter(s) name
 */
function createCellPos(n) {
	var ordA = 'A'.charCodeAt(0);
	var ordZ = 'Z'.charCodeAt(0);
	var len = ordZ - ordA + 1;
	var s = '';

	while (n >= 0) {
		s = String.fromCharCode((n % len) + ordA) + s;
		n = Math.floor(n / len) - 1;
	}

	return s;
}

try {
	var _serialiser = new XMLSerializer();
	var _ieExcel;
} catch (t) {
	// noop
}

/**
 * Recursively add XML files from an object's structure to a ZIP file. This
 * allows the XSLX file to be easily defined with an object's structure matching
 * the files structure.
 *
 * @param {JSZip} zip ZIP package
 * @param {object} obj Object to add (recursive)
 */
function _addToZip(zip, obj) {
	if (_ieExcel === undefined) {
		// Detect if we are dealing with IE's _awful_ serialiser by seeing if it
		// drop attributes
		_ieExcel =
			_serialiser
				.serializeToString(
					new window.DOMParser().parseFromString(
						excelStrings['xl/worksheets/sheet1.xml'],
						'text/xml'
					)
				)
				.indexOf('xmlns:r') === -1;
	}

	$.each(obj, function (name, val) {
		if ($.isPlainObject(val)) {
			var newDir = zip.folder(name);
			_addToZip(newDir, val);
		}
		else {
			if (_ieExcel) {
				// IE's XML serialiser will drop some name space attributes from
				// from the root node, so we need to save them. Do this by
				// replacing the namespace nodes with a regular attribute that
				// we convert back when serialised. Edge does not have this
				// issue
				var worksheet = val.childNodes[0];
				var i, ien;
				var attrs = [];

				for (i = worksheet.attributes.length - 1; i >= 0; i--) {
					var attrName = worksheet.attributes[i].nodeName;
					var attrValue = worksheet.attributes[i].nodeValue;

					if (attrName.indexOf(':') !== -1) {
						attrs.push({ name: attrName, value: attrValue });

						worksheet.removeAttribute(attrName);
					}
				}

				for (i = 0, ien = attrs.length; i < ien; i++) {
					var attr = val.createAttribute(
						attrs[i].name.replace(':', '_dt_b_namespace_token_')
					);
					attr.value = attrs[i].value;
					worksheet.setAttributeNode(attr);
				}
			}

			var str = _serialiser.serializeToString(val);

			// Fix IE's XML
			if (_ieExcel) {
				// IE doesn't include the XML declaration
				if (str.indexOf('<?xml') === -1) {
					str =
						'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
						str;
				}

				// Return namespace attributes to being as such
				str = str.replace(/_dt_b_namespace_token_/g, ':');

				// Remove testing name space that IE puts into the space preserve attr
				str = str.replace(/xmlns:NS[\d]+="" NS[\d]+:/g, '');
			}

			// Safari, IE and Edge will put empty name space attributes onto
			// various elements making them useless. This strips them out
			str = str.replace(/<([^<>]*?) xmlns=""([^<>]*?)>/g, '<$1 $2>');

			zip.file(name, str);
		}
	});
}

/**
 * Create an XML node and add any children, attributes, etc without needing to
 * be verbose in the DOM.
 *
 * @param  {object} doc      XML document
 * @param  {string} nodeName Node name
 * @param  {object} opts     Options - can be `attr` (attributes), `children`
 *   (child nodes) and `text` (text content)
 * @return {node}            Created node
 */
function _createNode(doc, nodeName, opts) {
	var tempNode = doc.createElement(nodeName);

	if (opts) {
		if (opts.attr) {
			$(tempNode).attr(opts.attr);
		}

		if (opts.children) {
			$.each(opts.children, function (key, value) {
				tempNode.appendChild(value);
			});
		}

		if (opts.text !== null && opts.text !== undefined) {
			tempNode.appendChild(doc.createTextNode(opts.text));
		}
	}

	return tempNode;
}

/**
 * Get the width for an Excel column based on the contents of that column
 * @param  {object} data Data for export
 * @param  {int}    col  Column index
 * @return {int}         Column width
 */
function _excelColWidth(data, col) {
	var max = data.header[col].length;
	var len, lineSplit, str;

	if (data.footer && data.footer[col] && data.footer[col].length > max) {
		max = data.footer[col].length;
	}

	for (var i = 0, ien = data.body.length; i < ien; i++) {
		var point = data.body[i][col];
		str = point !== null && point !== undefined ? point.toString() : '';

		// If there is a newline character, workout the width of the column
		// based on the longest line in the string
		if (str.indexOf('\n') !== -1) {
			lineSplit = str.split('\n');
			lineSplit.sort(function (a, b) {
				return b.length - a.length;
			});

			len = lineSplit[0].length;
		}
		else {
			len = str.length;
		}

		if (len > max) {
			max = len;
		}

		// Max width rather than having potentially massive column widths
		if (max > 40) {
			return 54; // 40 * 1.35
		}
	}

	max *= 1.35;

	// And a min width
	return max > 6 ? max : 6;
}

// Excel - Pre-defined strings to build a basic XLSX file
var excelStrings = {
	'_rels/.rels':
		'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
		'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
		'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
		'</Relationships>',

	'xl/_rels/workbook.xml.rels':
		'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
		'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
		'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
		'<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
		'</Relationships>',

	'[Content_Types].xml':
		'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
		'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
		'<Default Extension="xml" ContentType="application/xml" />' +
		'<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />' +
		'<Default Extension="jpeg" ContentType="image/jpeg" />' +
		'<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml" />' +
		'<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml" />' +
		'<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml" />' +
		'</Types>',

	'xl/workbook.xml':
		'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
		'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
		'<fileVersion appName="xl" lastEdited="5" lowestEdited="5" rupBuild="24816"/>' +
		'<workbookPr showInkAnnotation="0" autoCompressPictures="0"/>' +
		'<bookViews>' +
		'<workbookView xWindow="0" yWindow="0" windowWidth="25600" windowHeight="19020" tabRatio="500"/>' +
		'</bookViews>' +
		'<sheets>' +
		'<sheet name="Sheet1" sheetId="1" r:id="rId1"/>' +
		'</sheets>' +
		'<definedNames/>' +
		'</workbook>',

	'xl/worksheets/sheet1.xml':
		'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
		'<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" mc:Ignorable="x14ac" xmlns:x14ac="http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac">' +
		'<sheetData/>' +
		'<mergeCells count="0"/>' +
		'</worksheet>',

	'xl/styles.xml':
		'<?xml version="1.0" encoding="UTF-8"?>' +
		'<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" mc:Ignorable="x14ac" xmlns:x14ac="http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac">' +
		'<numFmts count="6">' +
		'<numFmt numFmtId="164" formatCode="[$$-409]#,##0.00;-[$$-409]#,##0.00"/>' +
		'<numFmt numFmtId="165" formatCode="&quot;£&quot;#,##0.00"/>' +
		'<numFmt numFmtId="166" formatCode="[$€-2] #,##0.00"/>' +
		'<numFmt numFmtId="167" formatCode="0.0%"/>' +
		'<numFmt numFmtId="168" formatCode="#,##0;(#,##0)"/>' +
		'<numFmt numFmtId="169" formatCode="#,##0.00;(#,##0.00)"/>' +
		'</numFmts>' +
		'<fonts count="5" x14ac:knownFonts="1">' +
		'<font>' +
		'<sz val="11" />' +
		'<name val="Calibri" />' +
		'</font>' +
		'<font>' +
		'<sz val="11" />' +
		'<name val="Calibri" />' +
		'<color rgb="FFFFFFFF" />' +
		'</font>' +
		'<font>' +
		'<sz val="11" />' +
		'<name val="Calibri" />' +
		'<b />' +
		'</font>' +
		'<font>' +
		'<sz val="11" />' +
		'<name val="Calibri" />' +
		'<i />' +
		'</font>' +
		'<font>' +
		'<sz val="11" />' +
		'<name val="Calibri" />' +
		'<u />' +
		'</font>' +
		'</fonts>' +
		'<fills count="6">' +
		'<fill>' +
		'<patternFill patternType="none" />' +
		'</fill>' +
		'<fill>' + // Excel appears to use this as a dotted background regardless of values but
		'<patternFill patternType="none" />' + // to be valid to the schema, use a patternFill
		'</fill>' +
		'<fill>' +
		'<patternFill patternType="solid">' +
		'<fgColor rgb="FFD9D9D9" />' +
		'<bgColor indexed="64" />' +
		'</patternFill>' +
		'</fill>' +
		'<fill>' +
		'<patternFill patternType="solid">' +
		'<fgColor rgb="FFD99795" />' +
		'<bgColor indexed="64" />' +
		'</patternFill>' +
		'</fill>' +
		'<fill>' +
		'<patternFill patternType="solid">' +
		'<fgColor rgb="ffc6efce" />' +
		'<bgColor indexed="64" />' +
		'</patternFill>' +
		'</fill>' +
		'<fill>' +
		'<patternFill patternType="solid">' +
		'<fgColor rgb="ffc6cfef" />' +
		'<bgColor indexed="64" />' +
		'</patternFill>' +
		'</fill>' +
		'</fills>' +
		'<borders count="2">' +
		'<border>' +
		'<left />' +
		'<right />' +
		'<top />' +
		'<bottom />' +
		'<diagonal />' +
		'</border>' +
		'<border diagonalUp="false" diagonalDown="false">' +
		'<left style="thin">' +
		'<color auto="1" />' +
		'</left>' +
		'<right style="thin">' +
		'<color auto="1" />' +
		'</right>' +
		'<top style="thin">' +
		'<color auto="1" />' +
		'</top>' +
		'<bottom style="thin">' +
		'<color auto="1" />' +
		'</bottom>' +
		'<diagonal />' +
		'</border>' +
		'</borders>' +
		'<cellStyleXfs count="1">' +
		'<xf numFmtId="0" fontId="0" fillId="0" borderId="0" />' +
		'</cellStyleXfs>' +
		'<cellXfs count="68">' +
		'<xf numFmtId="0" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
		'<xf numFmtId="0" fontId="1" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
		'<xf numFmtId="0" fontId="2" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
		'<xf numFmtId="0" fontId="3" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
		'<xf numFmtId="0" fontId="4" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
		'<xf numFmtId="0" fontId="0" fillId="2" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
		'<xf numFmtId="0" fontId="1" fillId="2" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
		'<xf numFmtId="0" fontId="2" fillId="2" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
		'<xf numFmtId="0" fontId="3" fillId="2" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
		'<xf numFmtId="0" fontId="4" fillId="2" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
		'<xf numFmtId="0" fontId="0" fillId="3" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
		'<xf numFmtId="0" fontId="1" fillId="3" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
		'<xf numFmtId="0" fontId="2" fillId="3" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
		'<xf numFmtId="0" fontId="3" fillId="3" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
		'<xf numFmtId="0" fontId="4" fillId="3" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
		'<xf numFmtId="0" fontId="0" fillId="4" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
		'<xf numFmtId="0" fontId="1" fillId="4" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
		'<xf numFmtId="0" fontId="2" fillId="4" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
		'<xf numFmtId="0" fontId="3" fillId="4" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
		'<xf numFmtId="0" fontId="4" fillId="4" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
		'<xf numFmtId="0" fontId="0" fillId="5" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
		'<xf numFmtId="0" fontId="1" fillId="5" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
		'<xf numFmtId="0" fontId="2" fillId="5" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
		'<xf numFmtId="0" fontId="3" fillId="5" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
		'<xf numFmtId="0" fontId="4" fillId="5" borderId="0" applyFont="1" applyFill="1" applyBorder="1"/>' +
		'<xf numFmtId="0" fontId="0" fillId="0" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>' +
		'<xf numFmtId="0" fontId="1" fillId="0" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>' +
		'<xf numFmtId="0" fontId="2" fillId="0" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>' +
		'<xf numFmtId="0" fontId="3" fillId="0" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>' +
		'<xf numFmtId="0" fontId="4" fillId="0" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>' +
		'<xf numFmtId="0" fontId="0" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>' +
		'<xf numFmtId="0" fontId="1" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>' +
		'<xf numFmtId="0" fontId="2" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>' +
		'<xf numFmtId="0" fontId="3" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>' +
		'<xf numFmtId="0" fontId="4" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>' +
		'<xf numFmtId="0" fontId="0" fillId="3" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>' +
		'<xf numFmtId="0" fontId="1" fillId="3" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>' +
		'<xf numFmtId="0" fontId="2" fillId="3" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>' +
		'<xf numFmtId="0" fontId="3" fillId="3" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>' +
		'<xf numFmtId="0" fontId="4" fillId="3" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>' +
		'<xf numFmtId="0" fontId="0" fillId="4" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>' +
		'<xf numFmtId="0" fontId="1" fillId="4" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>' +
		'<xf numFmtId="0" fontId="2" fillId="4" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>' +
		'<xf numFmtId="0" fontId="3" fillId="4" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>' +
		'<xf numFmtId="0" fontId="4" fillId="4" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>' +
		'<xf numFmtId="0" fontId="0" fillId="5" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>' +
		'<xf numFmtId="0" fontId="1" fillId="5" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>' +
		'<xf numFmtId="0" fontId="2" fillId="5" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>' +
		'<xf numFmtId="0" fontId="3" fillId="5" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>' +
		'<xf numFmtId="0" fontId="4" fillId="5" borderId="1" applyFont="1" applyFill="1" applyBorder="1"/>' +
		'<xf numFmtId="0" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyAlignment="1">' +
		'<alignment horizontal="left"/>' +
		'</xf>' +
		'<xf numFmtId="0" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyAlignment="1">' +
		'<alignment horizontal="center"/>' +
		'</xf>' +
		'<xf numFmtId="0" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyAlignment="1">' +
		'<alignment horizontal="right"/>' +
		'</xf>' +
		'<xf numFmtId="0" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyAlignment="1">' +
		'<alignment horizontal="fill"/>' +
		'</xf>' +
		'<xf numFmtId="0" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyAlignment="1">' +
		'<alignment textRotation="90"/>' +
		'</xf>' +
		'<xf numFmtId="0" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyAlignment="1">' +
		'<alignment wrapText="1"/>' +
		'</xf>' +
		'<xf numFmtId="9"   fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/>' +
		'<xf numFmtId="164" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/>' +
		'<xf numFmtId="165" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/>' +
		'<xf numFmtId="166" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/>' +
		'<xf numFmtId="167" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/>' +
		'<xf numFmtId="168" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/>' +
		'<xf numFmtId="169" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/>' +
		'<xf numFmtId="3" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/>' +
		'<xf numFmtId="4" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/>' +
		'<xf numFmtId="1" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/>' +
		'<xf numFmtId="2" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/>' +
		'<xf numFmtId="14" fontId="0" fillId="0" borderId="0" applyFont="1" applyFill="1" applyBorder="1" xfId="0" applyNumberFormat="1"/>' +
		'</cellXfs>' +
		'<cellStyles count="1">' +
		'<cellStyle name="Normal" xfId="0" builtinId="0" />' +
		'</cellStyles>' +
		'<dxfs count="0" />' +
		'<tableStyles count="0" defaultTableStyle="TableStyleMedium9" defaultPivotStyle="PivotStyleMedium4" />' +
		'</styleSheet>'
};
// Note we could use 3 `for` loops for the styles, but when gzipped there is
// virtually no difference in size, since the above can be easily compressed

// Pattern matching for special number formats. Perhaps this should be exposed
// via an API in future?
// Ref: section 3.8.30 - built in formatters in open spreadsheet
//   https://www.ecma-international.org/news/TC45_current_work/Office%20Open%20XML%20Part%204%20-%20Markup%20Language%20Reference.pdf
var _excelSpecials = [
	{
		match: /^\-?\d+\.\d%$/,
		style: 60,
		fmt: function (d) {
			return d / 100;
		}
	}, // Percent with d.p.
	{
		match: /^\-?\d+\.?\d*%$/,
		style: 56,
		fmt: function (d) {
			return d / 100;
		}
	}, // Percent
	{ match: /^\-?\$[\d,]+.?\d*$/, style: 57 }, // Dollars
	{ match: /^\-?£[\d,]+.?\d*$/, style: 58 }, // Pounds
	{ match: /^\-?€[\d,]+.?\d*$/, style: 59 }, // Euros
	{ match: /^\-?\d+$/, style: 65 }, // Numbers without thousand separators
	{ match: /^\-?\d+\.\d{2}$/, style: 66 }, // Numbers 2 d.p. without thousands separators
	{
		match: /^\([\d,]+\)$/,
		style: 61,
		fmt: function (d) {
			return -1 * d.replace(/[\(\)]/g, '');
		}
	}, // Negative numbers indicated by brackets
	{
		match: /^\([\d,]+\.\d{2}\)$/,
		style: 62,
		fmt: function (d) {
			return -1 * d.replace(/[\(\)]/g, '');
		}
	}, // Negative numbers indicated by brackets - 2d.p.
	{ match: /^\-?[\d,]+$/, style: 63 }, // Numbers with thousand separators
	{ match: /^\-?[\d,]+\.\d{2}$/, style: 64 },
	{
		match: /^[\d]{4}\-[01][\d]\-[0123][\d]$/,
		style: 67,
		fmt: function (d) {
			return Math.round(25569 + Date.parse(d) / (86400 * 1000));
		}
	} //Date yyyy-mm-dd
];

var _excelMergeCells = function (rels, row, column, rowspan, colspan) {
	var mergeCells = $('mergeCells', rels);

	mergeCells[0].appendChild(
		_createNode(rels, 'mergeCell', {
			attr: {
				ref:
					createCellPos(column) +
					row +
					':' +
					createCellPos(column + colspan - 1) +
					(row + rowspan - 1)
			}
		})
	);

	mergeCells.attr('count', parseFloat(mergeCells.attr('count')) + 1);
};

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Buttons
 */

//
// Copy to clipboard
//
DataTable.ext.buttons.copyHtml5 = {
	className: 'buttons-copy buttons-html5',

	text: function (dt) {
		return dt.i18n('buttons.copy', 'Copy');
	},

	action: function (e, dt, button, config, cb) {
		var exportData = _exportData(dt, config);
		var info = dt.buttons.exportInfo(config);
		var newline = _newLine(config);
		var output = exportData.str;
		var hiddenDiv = $('<div/>').css({
			height: 1,
			width: 1,
			overflow: 'hidden',
			position: 'fixed',
			top: 0,
			left: 0
		});

		if (info.title) {
			output = info.title + newline + newline + output;
		}

		if (info.messageTop) {
			output = info.messageTop + newline + newline + output;
		}

		if (info.messageBottom) {
			output = output + newline + newline + info.messageBottom;
		}

		if (config.customize) {
			output = config.customize(output, config, dt);
		}

		var textarea = $('<textarea readonly/>')
			.val(output)
			.appendTo(hiddenDiv);

		// For browsers that support the copy execCommand, try to use it
		if (document.queryCommandSupported('copy')) {
			hiddenDiv.appendTo(dt.table().container());
			textarea[0].focus();
			textarea[0].select();

			try {
				var successful = document.execCommand('copy');
				hiddenDiv.remove();

				if (successful) {
					dt.buttons.info(
						dt.i18n('buttons.copyTitle', 'Copy to clipboard'),
						dt.i18n(
							'buttons.copySuccess',
							{
								1: 'Copied one row to clipboard',
								_: 'Copied %d rows to clipboard'
							},
							exportData.rows
						),
						2000
					);

					cb();
					return;
				}
			} catch (t) {
				// noop
			}
		}

		// Otherwise we show the text box and instruct the user to use it
		var message = $(
			'<span>' +
				dt.i18n(
					'buttons.copyKeys',
					'Press <i>ctrl</i> or <i>\u2318</i> + <i>C</i> to copy the table data<br>to your system clipboard.<br><br>' +
						'To cancel, click this message or press escape.'
				) +
				'</span>'
		).append(hiddenDiv);

		dt.buttons.info(
			dt.i18n('buttons.copyTitle', 'Copy to clipboard'),
			message,
			0
		);

		// Select the text so when the user activates their system clipboard
		// it will copy that text
		textarea[0].focus();
		textarea[0].select();

		// Event to hide the message when the user is done
		var container = $(message).closest('.dt-button-info');
		var close = function () {
			container.off('click.buttons-copy');
			$(document).off('.buttons-copy');
			dt.buttons.info(false);
		};

		container.on('click.buttons-copy', close);
		$(document)
			.on('keydown.buttons-copy', function (e) {
				if (e.keyCode === 27) {
					// esc
					close();
					cb();
				}
			})
			.on('copy.buttons-copy cut.buttons-copy', function () {
				close();
				cb();
			});
	},

	async: 100,

	exportOptions: {},

	fieldSeparator: '\t',

	fieldBoundary: '',

	header: true,

	footer: true,

	title: '*',

	messageTop: '*',

	messageBottom: '*'
};

//
// CSV export
//
DataTable.ext.buttons.csvHtml5 = {
	bom: false,

	className: 'buttons-csv buttons-html5',

	available: function () {
		return window.FileReader !== undefined && window.Blob;
	},

	text: function (dt) {
		return dt.i18n('buttons.csv', 'CSV');
	},

	action: function (e, dt, button, config, cb) {
		// Set the text
		var output = _exportData(dt, config).str;
		var info = dt.buttons.exportInfo(config);
		var charset = config.charset;

		if (config.customize) {
			output = config.customize(output, config, dt);
		}

		if (charset !== false) {
			if (!charset) {
				charset = document.characterSet || document.charset;
			}

			if (charset) {
				charset = ';charset=' + charset;
			}
		}
		else {
			charset = '';
		}

		if (config.bom) {
			output = String.fromCharCode(0xfeff) + output;
		}

		_saveAs(
			new Blob([output], { type: 'text/csv' + charset }),
			info.filename,
			true
		);

		cb();
	},

	async: 100,

	filename: '*',

	extension: '.csv',

	exportOptions: {},

	fieldSeparator: ',',

	fieldBoundary: '"',

	escapeChar: '"',

	charset: null,

	header: true,

	footer: true
};

//
// Excel (xlsx) export
//
DataTable.ext.buttons.excelHtml5 = {
	className: 'buttons-excel buttons-html5',

	available: function () {
		return (
			window.FileReader !== undefined &&
			_jsZip() !== undefined &&
			!_isDuffSafari() &&
			_serialiser
		);
	},

	text: function (dt) {
		return dt.i18n('buttons.excel', 'Excel');
	},

	action: function (e, dt, button, config, cb) {
		var rowPos = 0;
		var dataStartRow, dataEndRow;
		var getXml = function (type) {
			var str = excelStrings[type];

			//str = str.replace( /xmlns:/g, 'xmlns_' ).replace( /mc:/g, 'mc_' );

			return $.parseXML(str);
		};
		var rels = getXml('xl/worksheets/sheet1.xml');
		var relsGet = rels.getElementsByTagName('sheetData')[0];

		var xlsx = {
			_rels: {
				'.rels': getXml('_rels/.rels')
			},
			xl: {
				_rels: {
					'workbook.xml.rels': getXml('xl/_rels/workbook.xml.rels')
				},
				'workbook.xml': getXml('xl/workbook.xml'),
				'styles.xml': getXml('xl/styles.xml'),
				worksheets: {
					'sheet1.xml': rels
				}
			},
			'[Content_Types].xml': getXml('[Content_Types].xml')
		};

		var data = dt.buttons.exportData(config.exportOptions);
		var currentRow, rowNode;
		var addRow = function (row) {
			currentRow = rowPos + 1;
			rowNode = _createNode(rels, 'row', { attr: { r: currentRow } });

			for (var i = 0, ien = row.length; i < ien; i++) {
				// Concat both the Cell Columns as a letter and the Row of the cell.
				var cellId = createCellPos(i) + '' + currentRow;
				var cell = null;

				// For null, undefined of blank cell, continue so it doesn't create the _createNode
				if (row[i] === null || row[i] === undefined || row[i] === '') {
					if (config.createEmptyCells === true) {
						row[i] = '';
					}
					else {
						continue;
					}
				}

				var originalContent = row[i];
				row[i] =
					typeof row[i].trim === 'function' ? row[i].trim() : row[i];

				// Special number formatting options
				for (var j = 0, jen = _excelSpecials.length; j < jen; j++) {
					var special = _excelSpecials[j];

					// TODO Need to provide the ability for the specials to say
					// if they are returning a string, since at the moment it is
					// assumed to be a number
					if (
						row[i].match &&
						!row[i].match(/^0\d+/) &&
						row[i].match(special.match)
					) {
						var val = row[i].replace(/[^\d\.\-]/g, '');

						if (special.fmt) {
							val = special.fmt(val);
						}

						cell = _createNode(rels, 'c', {
							attr: {
								r: cellId,
								s: special.style
							},
							children: [_createNode(rels, 'v', { text: val })]
						});

						break;
					}
				}

				if (!cell) {
					if (
						typeof row[i] === 'number' ||
						(row[i].match &&
							row[i].match(/^-?\d+(\.\d+)?([eE]\-?\d+)?$/) && // Includes exponential format
							!row[i].match(/^0\d+/))
					) {
						// Detect numbers - don't match numbers with leading zeros
						// or a negative anywhere but the start
						cell = _createNode(rels, 'c', {
							attr: {
								t: 'n',
								r: cellId
							},
							children: [_createNode(rels, 'v', { text: row[i] })]
						});
					}
					else {
						// String output - replace non standard characters for text output
						/*eslint no-control-regex: "off"*/
						var text = !originalContent.replace
							? originalContent
							: originalContent.replace(
									/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F-\x9F]/g,
									''
							);

						cell = _createNode(rels, 'c', {
							attr: {
								t: 'inlineStr',
								r: cellId
							},
							children: {
								row: _createNode(rels, 'is', {
									children: {
										row: _createNode(rels, 't', {
											text: text,
											attr: {
												'xml:space': 'preserve'
											}
										})
									}
								})
							}
						});
					}
				}

				rowNode.appendChild(cell);
			}

			relsGet.appendChild(rowNode);
			rowPos++;
		};

		var addHeader = function (structure) {
			structure.forEach(function (row) {
				addRow(
					row.map(function (cell) {
						return cell ? cell.title : '';
					}),
					rowPos
				);
				$('row:last c', rels).attr('s', '2'); // bold

				// Add any merge cells
				row.forEach(function (cell, columnCounter) {
					if (cell && (cell.colSpan > 1 || cell.rowSpan > 1)) {
						_excelMergeCells(
							rels,
							rowPos,
							columnCounter,
							cell.rowSpan,
							cell.colSpan
						);
					}
				});
			});
		};

		if (config.customizeData) {
			config.customizeData(data);
		}

		// Title and top messages
		var exportInfo = dt.buttons.exportInfo(config);
		if (exportInfo.title) {
			addRow([exportInfo.title], rowPos);
			_excelMergeCells(rels, rowPos, 0, 1, data.header.length);
			$('row:last c', rels).attr('s', '51'); // centre
		}

		if (exportInfo.messageTop) {
			addRow([exportInfo.messageTop], rowPos);
			_excelMergeCells(rels, rowPos, 0, 1, data.header.length);
		}

		// Table header
		if (config.header) {
			addHeader(data.headerStructure);
		}

		dataStartRow = rowPos;

		// Table body
		for (var n = 0, ie = data.body.length; n < ie; n++) {
			addRow(data.body[n], rowPos);
		}

		dataEndRow = rowPos;

		// Table footer
		if (config.footer && data.footer) {
			addHeader(data.footerStructure);
		}

		// Below the table
		if (exportInfo.messageBottom) {
			addRow([exportInfo.messageBottom], rowPos);
			_excelMergeCells(rels, rowPos, 0, 1, data.header.length);
		}

		// Set column widths
		var cols = _createNode(rels, 'cols');
		$('worksheet', rels).prepend(cols);

		for (var i = 0, ien = data.header.length; i < ien; i++) {
			cols.appendChild(
				_createNode(rels, 'col', {
					attr: {
						min: i + 1,
						max: i + 1,
						width: _excelColWidth(data, i),
						customWidth: 1
					}
				})
			);
		}

		// Workbook modifications
		var workbook = xlsx.xl['workbook.xml'];

		$('sheets sheet', workbook).attr('name', _sheetname(config));

		// Auto filter for columns
		if (config.autoFilter) {
			$('mergeCells', rels).before(
				_createNode(rels, 'autoFilter', {
					attr: {
						ref:
							'A' +
							dataStartRow +
							':' +
							createCellPos(data.header.length - 1) +
							dataEndRow
					}
				})
			);

			$('definedNames', workbook).append(
				_createNode(workbook, 'definedName', {
					attr: {
						name: '_xlnm._FilterDatabase',
						localSheetId: '0',
						hidden: 1
					},
					text:
						'\'' +
						_sheetname(config).replace(/'/g, '\'\'') +
						'\'!$A$' +
						dataStartRow +
						':' +
						createCellPos(data.header.length - 1) +
						dataEndRow
				})
			);
		}

		// Let the developer customise the document if they want to
		if (config.customize) {
			config.customize(xlsx, config, dt);
		}

		// Excel doesn't like an empty mergeCells tag
		if ($('mergeCells', rels).children().length === 0) {
			$('mergeCells', rels).remove();
		}

		var jszip = _jsZip();
		var zip = new jszip();
		var zipConfig = {
			compression: 'DEFLATE',
			type: 'blob',
			mimeType:
				'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
		};

		_addToZip(zip, xlsx);

		// Modern Excel has a 218 character limit on the file name + path of the file (why!?)
		// https://support.microsoft.com/en-us/office/excel-specifications-and-limits-1672b34d-7043-467e-8e27-269d656771c3
		// So we truncate to allow for this.
		var filename = exportInfo.filename;

		if (filename > 175) {
			filename = filename.substr(0, 175);
		}

		// Let the developer customize the final zip file if they want to before it is generated and sent to the browser
		if (config.customizeZip) {
			config.customizeZip(zip, data, filename);
		}


		if (zip.generateAsync) {
			// JSZip 3+
			zip.generateAsync(zipConfig).then(function (blob) {
				_saveAs(blob, filename);
				cb();
			});
		}
		else {
			// JSZip 2.5
			_saveAs(zip.generate(zipConfig), filename);
			cb();
		}
	},

	async: 100,

	filename: '*',

	extension: '.xlsx',

	exportOptions: {},

	header: true,

	footer: true,

	title: '*',

	messageTop: '*',

	messageBottom: '*',

	createEmptyCells: false,

	autoFilter: false,

	sheetName: ''
};

//
// PDF export - using pdfMake - http://pdfmake.org
//
DataTable.ext.buttons.pdfHtml5 = {
	className: 'buttons-pdf buttons-html5',

	available: function () {
		return window.FileReader !== undefined && _pdfMake();
	},

	text: function (dt) {
		return dt.i18n('buttons.pdf', 'PDF');
	},

	action: function (e, dt, button, config, cb) {
		var data = dt.buttons.exportData(config.exportOptions);
		var info = dt.buttons.exportInfo(config);
		var rows = [];

		if (config.header) {
			data.headerStructure.forEach(function (row) {
				rows.push(
					row.map(function (cell) {
						return cell
							? {
									text: cell.title,
									colSpan: cell.colspan,
									rowSpan: cell.rowspan,
									style: 'tableHeader'
							}
							: {};
					})
				);
			});
		}

		for (var i = 0, ien = data.body.length; i < ien; i++) {
			rows.push(
				data.body[i].map(function (d) {
					return {
						text:
							d === null || d === undefined
								? ''
								: typeof d === 'string'
								? d
								: d.toString()
					};
				})
			);
		}

		if (config.footer) {
			data.footerStructure.forEach(function (row) {
				rows.push(
					row.map(function (cell) {
						return cell
							? {
									text: cell.title,
									colSpan: cell.colspan,
									rowSpan: cell.rowspan,
									style: 'tableHeader'
							}
							: {};
					})
				);
			});
		}

		var doc = {
			pageSize: config.pageSize,
			pageOrientation: config.orientation,
			content: [
				{
					style: 'table',
					table: {
						headerRows: data.headerStructure.length,
						footerRows: data.footerStructure.length, // Used for styling, doesn't do anything in pdfmake
						body: rows
					},
					layout: {
						hLineWidth: function (i, node) {
							if (i === 0 || i === node.table.body.length) {
								return 0;
							}
							return 0.5;
						},
						vLineWidth: function () {
							return 0;
						},
						hLineColor: function (i, node) {
							return i === node.table.headerRows ||
								i ===
									node.table.body.length -
										node.table.footerRows
								? '#333'
								: '#ddd';
						},
						fillColor: function (rowIndex) {
							if (rowIndex < data.headerStructure.length) {
								return '#fff';
							}
							return rowIndex % 2 === 0 ? '#f3f3f3' : null;
						},
						paddingTop: function () {
							return 5;
						},
						paddingBottom: function () {
							return 5;
						}
					}
				}
			],
			styles: {
				tableHeader: {
					bold: true,
					fontSize: 11,
					alignment: 'center'
				},
				tableFooter: {
					bold: true,
					fontSize: 11
				},
				table: {
					margin: [0, 5, 0, 5]
				},
				title: {
					alignment: 'center',
					fontSize: 13
				},
				message: {}
			},
			defaultStyle: {
				fontSize: 10
			}
		};

		if (info.messageTop) {
			doc.content.unshift({
				text: info.messageTop,
				style: 'message',
				margin: [0, 0, 0, 12]
			});
		}

		if (info.messageBottom) {
			doc.content.push({
				text: info.messageBottom,
				style: 'message',
				margin: [0, 0, 0, 12]
			});
		}

		if (info.title) {
			doc.content.unshift({
				text: info.title,
				style: 'title',
				margin: [0, 0, 0, 12]
			});
		}

		if (config.customize) {
			config.customize(doc, config, dt);
		}

		var pdf = _pdfMake().createPdf(doc);

		if (config.download === 'open' && !_isDuffSafari()) {
			pdf.open();
		}
		else {
			pdf.download(info.filename);
		}

		cb();
	},

	async: 100,

	title: '*',

	filename: '*',

	extension: '.pdf',

	exportOptions: {},

	orientation: 'portrait',

	// This isn't perfect, but it is close
	pageSize:
		navigator.language === 'en-US' || navigator.language === 'en-CA'
			? 'LETTER'
			: 'A4',

	header: true,

	footer: true,

	messageTop: '*',

	messageBottom: '*',

	customize: null,

	download: 'download'
};


return DataTable;
}));


/*!
 * Print button for Buttons and DataTables.
 * © SpryMedia Ltd - datatables.net/license
 */

(function( factory ){
	if ( typeof define === 'function' && define.amd ) {
		// AMD
		define( ['jquery', 'datatables.net', 'datatables.net-buttons'], function ( $ ) {
			return factory( $, window, document );
		} );
	}
	else if ( typeof exports === 'object' ) {
		// CommonJS
		var jq = require('jquery');
		var cjsRequires = function (root, $) {
			if ( ! $.fn.dataTable ) {
				require('datatables.net')(root, $);
			}

			if ( ! $.fn.dataTable.Buttons ) {
				require('datatables.net-buttons')(root, $);
			}
		};

		if (typeof window === 'undefined') {
			module.exports = function (root, $) {
				if ( ! root ) {
					// CommonJS environments without a window global must pass a
					// root. This will give an error otherwise
					root = window;
				}

				if ( ! $ ) {
					$ = jq( root );
				}

				cjsRequires( root, $ );
				return factory( $, root, root.document );
			};
		}
		else {
			cjsRequires( window, jq );
			module.exports = factory( jq, window, window.document );
		}
	}
	else {
		// Browser
		factory( jQuery, window, document );
	}
}(function( $, window, document ) {
'use strict';
var DataTable = $.fn.dataTable;



var _link = document.createElement('a');

/**
 * Clone link and style tags, taking into account the need to change the source
 * path.
 *
 * @param  {node}     el Element to convert
 */
var _styleToAbs = function (el) {
	var clone = $(el).clone()[0];

	if (clone.nodeName.toLowerCase() === 'link') {
		clone.href = _relToAbs(clone.href);
	}

	return clone.outerHTML;
};

/**
 * Convert a URL from a relative to an absolute address so it will work
 * correctly in the popup window which has no base URL.
 *
 * @param  {string} href URL
 */
var _relToAbs = function (href) {
	// Assign to a link on the original page so the browser will do all the
	// hard work of figuring out where the file actually is
	_link.href = href;
	var linkHost = _link.host;

	// IE doesn't have a trailing slash on the host
	// Chrome has it on the pathname
	if (linkHost.indexOf('/') === -1 && _link.pathname.indexOf('/') !== 0) {
		linkHost += '/';
	}

	return _link.protocol + '//' + linkHost + _link.pathname + _link.search;
};

DataTable.ext.buttons.print = {
	className: 'buttons-print',

	text: function (dt) {
		return dt.i18n('buttons.print', 'Print');
	},

	action: function (e, dt, button, config, cb) {
		var data = dt.buttons.exportData(
			$.extend({ decodeEntities: false }, config.exportOptions) // XSS protection
		);
		var exportInfo = dt.buttons.exportInfo(config);

		// Get the classes for the columns from the header cells
		var columnClasses = dt
			.columns(config.exportOptions.columns)
			.nodes()
			.map(function (n) {
				return n.className;
			})
			.toArray();

		var addRow = function (d, tag) {
			var str = '<tr>';

			for (var i = 0, ien = d.length; i < ien; i++) {
				// null and undefined aren't useful in the print output
				var dataOut = d[i] === null || d[i] === undefined ? '' : d[i];
				var classAttr = columnClasses[i]
					? 'class="' + columnClasses[i] + '"'
					: '';

				str +=
					'<' +
					tag +
					' ' +
					classAttr +
					'>' +
					dataOut +
					'</' +
					tag +
					'>';
			}

			return str + '</tr>';
		};

		// Construct a table for printing
		var html = '<table class="' + dt.table().node().className + '">';

		if (config.header) {
			var headerRows = data.headerStructure.map(function (row) {
				return (
					'<tr>' +
					row
						.map(function (cell) {
							return cell
								? '<th colspan="' +
										cell.colspan +
										'" rowspan="' +
										cell.rowspan +
										'">' +
										cell.title +
										'</th>'
								: '';
						})
						.join('') +
					'</tr>'
				);
			});

			html += '<thead>' + headerRows.join('') + '</thead>';
		}

		html += '<tbody>';
		for (var i = 0, ien = data.body.length; i < ien; i++) {
			html += addRow(data.body[i], 'td');
		}
		html += '</tbody>';

		if (config.footer && data.footer) {
			var footerRows = data.footerStructure.map(function (row) {
				return (
					'<tr>' +
					row
						.map(function (cell) {
							return cell
								? '<th colspan="' +
										cell.colspan +
										'" rowspan="' +
										cell.rowspan +
										'">' +
										cell.title +
										'</th>'
								: '';
						})
						.join('') +
					'</tr>'
				);
			});

			html += '<tfoot>' + footerRows.join('') + '</tfoot>';
		}
		html += '</table>';

		// Open a new window for the printable table
		var win = window.open('', '');

		if (!win) {
			dt.buttons.info(
				dt.i18n('buttons.printErrorTitle', 'Unable to open print view'),
				dt.i18n(
					'buttons.printErrorMsg',
					'Please allow popups in your browser for this site to be able to view the print view.'
				),
				5000
			);

			return;
		}

		win.document.close();

		// Inject the title and also a copy of the style and link tags from this
		// document so the table can retain its base styling. Note that we have
		// to use string manipulation as IE won't allow elements to be created
		// in the host document and then appended to the new window.
		var head = '<title>' + exportInfo.title + '</title>';
		$('style, link').each(function () {
			head += _styleToAbs(this);
		});

		try {
			win.document.head.innerHTML = head; // Work around for Edge
		} catch (e) {
			$(win.document.head).html(head); // Old IE
		}

		// Inject the table and other surrounding information
		win.document.body.innerHTML =
			'<h1>' +
			exportInfo.title +
			'</h1>' +
			'<div>' +
			(exportInfo.messageTop || '') +
			'</div>' +
			html +
			'<div>' +
			(exportInfo.messageBottom || '') +
			'</div>';

		$(win.document.body).addClass('dt-print-view');

		$('img', win.document.body).each(function (i, img) {
			img.setAttribute('src', _relToAbs(img.getAttribute('src')));
		});

		if (config.customize) {
			config.customize(win, config, dt);
		}

		// Allow stylesheets time to load
		var autoPrint = function () {
			if (config.autoPrint) {
				win.print(); // blocking - so close will not
				win.close(); // execute until this is done
			}
		};

		win.setTimeout(autoPrint, 1000);

		cb();
	},

	async: 100,

	title: '*',

	messageTop: '*',

	messageBottom: '*',

	exportOptions: {},

	header: true,

	footer: true,

	autoPrint: true,

	customize: null
};


return DataTable;
}));


/*! Responsive 3.0.2
 * © SpryMedia Ltd - datatables.net/license
 */

(function( factory ){
	if ( typeof define === 'function' && define.amd ) {
		// AMD
		define( ['jquery', 'datatables.net'], function ( $ ) {
			return factory( $, window, document );
		} );
	}
	else if ( typeof exports === 'object' ) {
		// CommonJS
		var jq = require('jquery');
		var cjsRequires = function (root, $) {
			if ( ! $.fn.dataTable ) {
				require('datatables.net')(root, $);
			}
		};

		if (typeof window === 'undefined') {
			module.exports = function (root, $) {
				if ( ! root ) {
					// CommonJS environments without a window global must pass a
					// root. This will give an error otherwise
					root = window;
				}

				if ( ! $ ) {
					$ = jq( root );
				}

				cjsRequires( root, $ );
				return factory( $, root, root.document );
			};
		}
		else {
			cjsRequires( window, jq );
			module.exports = factory( jq, window, window.document );
		}
	}
	else {
		// Browser
		factory( jQuery, window, document );
	}
}(function( $, window, document ) {
'use strict';
var DataTable = $.fn.dataTable;



/**
 * @summary     Responsive
 * @description Responsive tables plug-in for DataTables
 * @version     3.0.2
 * @author      SpryMedia Ltd
 * @copyright   SpryMedia Ltd.
 *
 * This source file is free software, available under the following license:
 *   MIT license - http://datatables.net/license/mit
 *
 * This source file is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the license files for details.
 *
 * For details please refer to: http://www.datatables.net
 */

/**
 * Responsive is a plug-in for the DataTables library that makes use of
 * DataTables' ability to change the visibility of columns, changing the
 * visibility of columns so the displayed columns fit into the table container.
 * The end result is that complex tables will be dynamically adjusted to fit
 * into the viewport, be it on a desktop, tablet or mobile browser.
 *
 * Responsive for DataTables has two modes of operation, which can used
 * individually or combined:
 *
 * * Class name based control - columns assigned class names that match the
 *   breakpoint logic can be shown / hidden as required for each breakpoint.
 * * Automatic control - columns are automatically hidden when there is no
 *   room left to display them. Columns removed from the right.
 *
 * In additional to column visibility control, Responsive also has built into
 * options to use DataTables' child row display to show / hide the information
 * from the table that has been hidden. There are also two modes of operation
 * for this child row display:
 *
 * * Inline - when the control element that the user can use to show / hide
 *   child rows is displayed inside the first column of the table.
 * * Column - where a whole column is dedicated to be the show / hide control.
 *
 * Initialisation of Responsive is performed by:
 *
 * * Adding the class `responsive` or `dt-responsive` to the table. In this case
 *   Responsive will automatically be initialised with the default configuration
 *   options when the DataTable is created.
 * * Using the `responsive` option in the DataTables configuration options. This
 *   can also be used to specify the configuration options, or simply set to
 *   `true` to use the defaults.
 *
 *  @class
 *  @param {object} settings DataTables settings object for the host table
 *  @param {object} [opts] Configuration options
 *  @requires jQuery 1.7+
 *  @requires DataTables 1.10.3+
 *
 *  @example
 *      $('#example').DataTable( {
 *        responsive: true
 *      } );
 *    } );
 */
var Responsive = function (settings, opts) {
	// Sanity check that we are using DataTables 1.10 or newer
	if (!DataTable.versionCheck || !DataTable.versionCheck('2')) {
		throw 'DataTables Responsive requires DataTables 2 or newer';
	}

	this.s = {
		childNodeStore: {},
		columns: [],
		current: [],
		dt: new DataTable.Api(settings)
	};

	// Check if responsive has already been initialised on this table
	if (this.s.dt.settings()[0].responsive) {
		return;
	}

	// details is an object, but for simplicity the user can give it as a string
	// or a boolean
	if (opts && typeof opts.details === 'string') {
		opts.details = { type: opts.details };
	}
	else if (opts && opts.details === false) {
		opts.details = { type: false };
	}
	else if (opts && opts.details === true) {
		opts.details = { type: 'inline' };
	}

	this.c = $.extend(
		true,
		{},
		Responsive.defaults,
		DataTable.defaults.responsive,
		opts
	);
	settings.responsive = this;
	this._constructor();
};

$.extend(Responsive.prototype, {
	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * Constructor
	 */

	/**
	 * Initialise the Responsive instance
	 *
	 * @private
	 */
	_constructor: function () {
		var that = this;
		var dt = this.s.dt;
		var oldWindowWidth = $(window).innerWidth();

		dt.settings()[0]._responsive = this;

		// Use DataTables' throttle function to avoid processor thrashing
		$(window).on(
			'orientationchange.dtr',
			DataTable.util.throttle(function () {
				// iOS has a bug whereby resize can fire when only scrolling
				// See: http://stackoverflow.com/questions/8898412
				var width = $(window).innerWidth();

				if (width !== oldWindowWidth) {
					that._resize();
					oldWindowWidth = width;
				}
			})
		);

		// Handle new rows being dynamically added - needed as responsive
		// updates all rows (shown or not) a responsive change, rather than
		// per draw.
		dt.on('row-created.dtr', function (e, tr, data, idx) {
			if ($.inArray(false, that.s.current) !== -1) {
				$('>td, >th', tr).each(function (i) {
					var idx = dt.column.index('toData', i);

					if (that.s.current[idx] === false) {
						$(this)
							.css('display', 'none')
							.addClass('dtr-hidden');
					}
				});
			}
		});

		// Destroy event handler
		dt.on('destroy.dtr', function () {
			dt.off('.dtr');
			$(dt.table().body()).off('.dtr');
			$(window).off('resize.dtr orientationchange.dtr');
			dt.cells('.dtr-control').nodes().to$().removeClass('dtr-control');
			$(dt.table().node()).removeClass('dtr-inline collapsed');

			// Restore the columns that we've hidden
			$.each(that.s.current, function (i, val) {
				if (val === false) {
					that._setColumnVis(i, true);
				}
			});
		});

		// Reorder the breakpoints array here in case they have been added out
		// of order
		this.c.breakpoints.sort(function (a, b) {
			return a.width < b.width ? 1 : a.width > b.width ? -1 : 0;
		});

		this._classLogic();
		this._resizeAuto();

		// Details handler
		var details = this.c.details;

		if (details.type !== false) {
			that._detailsInit();

			// DataTables will trigger this event on every column it shows and
			// hides individually
			dt.on('column-visibility.dtr', function () {
				// Use a small debounce to allow multiple columns to be set together
				if (that._timer) {
					clearTimeout(that._timer);
				}

				that._timer = setTimeout(function () {
					that._timer = null;

					that._classLogic();
					that._resizeAuto();
					that._resize(true);

					that._redrawChildren();
				}, 100);
			});

			// Redraw the details box on each draw which will happen if the data
			// has changed. This is used until DataTables implements a native
			// `updated` event for rows
			dt.on('draw.dtr', function () {
				that._redrawChildren();
			});

			$(dt.table().node()).addClass('dtr-' + details.type);
		}

		dt.on('column-reorder.dtr', function (e, settings, details) {
			that._classLogic();
			that._resizeAuto();
			that._resize(true);
		});

		// Change in column sizes means we need to calc
		dt.on('column-sizing.dtr', function () {
			that._resizeAuto();
			that._resize();
		});

		// DT2 let's us tell it if we are hiding columns
		dt.on('column-calc.dt', function (e, d) {
			var curr = that.s.current;

			for (var i = 0; i < curr.length; i++) {
				var idx = d.visible.indexOf(i);

				if (curr[i] === false && idx >= 0) {
					d.visible.splice(idx, 1);
				}
			}
		});

		// On Ajax reload we want to reopen any child rows which are displayed
		// by responsive
		dt.on('preXhr.dtr', function () {
			var rowIds = [];
			dt.rows().every(function () {
				if (this.child.isShown()) {
					rowIds.push(this.id(true));
				}
			});

			dt.one('draw.dtr', function () {
				that._resizeAuto();
				that._resize();

				dt.rows(rowIds).every(function () {
					that._detailsDisplay(this, false);
				});
			});
		});

		dt.on('draw.dtr', function () {
			that._controlClass();
		}).on('init.dtr', function (e, settings, details) {
			if (e.namespace !== 'dt') {
				return;
			}

			that._resizeAuto();
			that._resize();
		});

		// First pass - draw the table for the current viewport size
		this._resize();
	},

	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * Private methods
	 */

	/**
	 * Insert a `col` tag into the correct location in a `colgroup`.
	 *
	 * @param {jQuery} colGroup The `colgroup` tag
	 * @param {jQuery} colEl The `col` tag
	 */
	_colGroupAttach: function (colGroup, colEls, idx) {
		var found = null;

		// No need to do anything if already attached
		if (colEls[idx].get(0).parentNode === colGroup[0]) {
			return;
		}

		// Find the first `col` after our own which is already attached
		for (var i = idx+1; i < colEls.length; i++) {
			if (colGroup[0] === colEls[i].get(0).parentNode) {
				found = i;
				break;
			}
		}

		if (found !== null) {
			// Insert before
			colEls[idx].insertBefore(colEls[found][0]);
		}
		else {
			// If wasn't found, insert at the end
			colGroup.append(colEls[idx]);
		}
	},

	/**
	 * Get and store nodes from a cell - use for node moving renderers
	 *
	 * @param {*} dt DT instance
	 * @param {*} row Row index
	 * @param {*} col Column index
	 */
	_childNodes: function (dt, row, col) {
		var name = row + '-' + col;

		if (this.s.childNodeStore[name]) {
			return this.s.childNodeStore[name];
		}

		// https://jsperf.com/childnodes-array-slice-vs-loop
		var nodes = [];
		var children = dt.cell(row, col).node().childNodes;
		for (var i = 0, ien = children.length; i < ien; i++) {
			nodes.push(children[i]);
		}

		this.s.childNodeStore[name] = nodes;

		return nodes;
	},

	/**
	 * Restore nodes from the cache to a table cell
	 *
	 * @param {*} dt DT instance
	 * @param {*} row Row index
	 * @param {*} col Column index
	 */
	_childNodesRestore: function (dt, row, col) {
		var name = row + '-' + col;

		if (!this.s.childNodeStore[name]) {
			return;
		}

		var node = dt.cell(row, col).node();
		var store = this.s.childNodeStore[name];
		if (store.length > 0) {
			var parent = store[0].parentNode;
			var parentChildren = parent.childNodes;
			var a = [];

			for (var i = 0, ien = parentChildren.length; i < ien; i++) {
				a.push(parentChildren[i]);
			}

			for (var j = 0, jen = a.length; j < jen; j++) {
				node.appendChild(a[j]);
			}
		}

		this.s.childNodeStore[name] = undefined;
	},

	/**
	 * Calculate the visibility for the columns in a table for a given
	 * breakpoint. The result is pre-determined based on the class logic if
	 * class names are used to control all columns, but the width of the table
	 * is also used if there are columns which are to be automatically shown
	 * and hidden.
	 *
	 * @param  {string} breakpoint Breakpoint name to use for the calculation
	 * @return {array} Array of boolean values initiating the visibility of each
	 *   column.
	 *  @private
	 */
	_columnsVisiblity: function (breakpoint) {
		var dt = this.s.dt;
		var columns = this.s.columns;
		var i, ien;

		// Create an array that defines the column ordering based first on the
		// column's priority, and secondly the column index. This allows the
		// columns to be removed from the right if the priority matches
		var order = columns
			.map(function (col, idx) {
				return {
					columnIdx: idx,
					priority: col.priority
				};
			})
			.sort(function (a, b) {
				if (a.priority !== b.priority) {
					return a.priority - b.priority;
				}
				return a.columnIdx - b.columnIdx;
			});

		// Class logic - determine which columns are in this breakpoint based
		// on the classes. If no class control (i.e. `auto`) then `-` is used
		// to indicate this to the rest of the function
		var display = $.map(columns, function (col, i) {
			if (dt.column(i).visible() === false) {
				return 'not-visible';
			}
			return col.auto && col.minWidth === null
				? false
				: col.auto === true
				? '-'
				: $.inArray(breakpoint, col.includeIn) !== -1;
		});

		// Auto column control - first pass: how much width is taken by the
		// ones that must be included from the non-auto columns
		var requiredWidth = 0;
		for (i = 0, ien = display.length; i < ien; i++) {
			if (display[i] === true) {
				requiredWidth += columns[i].minWidth;
			}
		}

		// Second pass, use up any remaining width for other columns. For
		// scrolling tables we need to subtract the width of the scrollbar. It
		// may not be requires which makes this sub-optimal, but it would
		// require another full redraw to make complete use of those extra few
		// pixels
		var scrolling = dt.settings()[0].oScroll;
		var bar = scrolling.sY || scrolling.sX ? scrolling.iBarWidth : 0;
		var widthAvailable = dt.table().container().offsetWidth - bar;
		var usedWidth = widthAvailable - requiredWidth;

		// Control column needs to always be included. This makes it sub-
		// optimal in terms of using the available with, but to stop layout
		// thrashing or overflow. Also we need to account for the control column
		// width first so we know how much width is available for the other
		// columns, since the control column might not be the first one shown
		for (i = 0, ien = display.length; i < ien; i++) {
			if (columns[i].control) {
				usedWidth -= columns[i].minWidth;
			}
		}

		// Allow columns to be shown (counting by priority and then right to
		// left) until we run out of room
		var empty = false;
		for (i = 0, ien = order.length; i < ien; i++) {
			var colIdx = order[i].columnIdx;

			if (
				display[colIdx] === '-' &&
				!columns[colIdx].control &&
				columns[colIdx].minWidth
			) {
				// Once we've found a column that won't fit we don't let any
				// others display either, or columns might disappear in the
				// middle of the table
				if (empty || usedWidth - columns[colIdx].minWidth < 0) {
					empty = true;
					display[colIdx] = false;
				}
				else {
					display[colIdx] = true;
				}

				usedWidth -= columns[colIdx].minWidth;
			}
		}

		// Determine if the 'control' column should be shown (if there is one).
		// This is the case when there is a hidden column (that is not the
		// control column). The two loops look inefficient here, but they are
		// trivial and will fly through. We need to know the outcome from the
		// first , before the action in the second can be taken
		var showControl = false;

		for (i = 0, ien = columns.length; i < ien; i++) {
			if (
				!columns[i].control &&
				!columns[i].never &&
				display[i] === false
			) {
				showControl = true;
				break;
			}
		}

		for (i = 0, ien = columns.length; i < ien; i++) {
			if (columns[i].control) {
				display[i] = showControl;
			}

			// Replace not visible string with false from the control column detection above
			if (display[i] === 'not-visible') {
				display[i] = false;
			}
		}

		// Finally we need to make sure that there is at least one column that
		// is visible
		if ($.inArray(true, display) === -1) {
			display[0] = true;
		}

		return display;
	},

	/**
	 * Create the internal `columns` array with information about the columns
	 * for the table. This includes determining which breakpoints the column
	 * will appear in, based upon class names in the column, which makes up the
	 * vast majority of this method.
	 *
	 * @private
	 */
	_classLogic: function () {
		var that = this;
		var breakpoints = this.c.breakpoints;
		var dt = this.s.dt;
		var columns = dt
			.columns()
			.eq(0)
			.map(function (i) {
				var column = this.column(i);
				var className = column.header().className;
				var priority = column.init().responsivePriority;
				var dataPriority = column
					.header()
					.getAttribute('data-priority');

				if (priority === undefined) {
					priority =
						dataPriority === undefined || dataPriority === null
							? 10000
							: dataPriority * 1;
				}

				return {
					className: className,
					includeIn: [],
					auto: false,
					control: false,
					never: className.match(/\b(dtr\-)?never\b/) ? true : false,
					priority: priority
				};
			});

		// Simply add a breakpoint to `includeIn` array, ensuring that there are
		// no duplicates
		var add = function (colIdx, name) {
			var includeIn = columns[colIdx].includeIn;

			if ($.inArray(name, includeIn) === -1) {
				includeIn.push(name);
			}
		};

		var column = function (colIdx, name, operator, matched) {
			var size, i, ien;

			if (!operator) {
				columns[colIdx].includeIn.push(name);
			}
			else if (operator === 'max-') {
				// Add this breakpoint and all smaller
				size = that._find(name).width;

				for (i = 0, ien = breakpoints.length; i < ien; i++) {
					if (breakpoints[i].width <= size) {
						add(colIdx, breakpoints[i].name);
					}
				}
			}
			else if (operator === 'min-') {
				// Add this breakpoint and all larger
				size = that._find(name).width;

				for (i = 0, ien = breakpoints.length; i < ien; i++) {
					if (breakpoints[i].width >= size) {
						add(colIdx, breakpoints[i].name);
					}
				}
			}
			else if (operator === 'not-') {
				// Add all but this breakpoint
				for (i = 0, ien = breakpoints.length; i < ien; i++) {
					if (breakpoints[i].name.indexOf(matched) === -1) {
						add(colIdx, breakpoints[i].name);
					}
				}
			}
		};

		// Loop over each column and determine if it has a responsive control
		// class
		columns.each(function (col, i) {
			var classNames = col.className.split(' ');
			var hasClass = false;

			// Split the class name up so multiple rules can be applied if needed
			for (var k = 0, ken = classNames.length; k < ken; k++) {
				var className = classNames[k].trim();

				if (className === 'all' || className === 'dtr-all') {
					// Include in all
					hasClass = true;
					col.includeIn = $.map(breakpoints, function (a) {
						return a.name;
					});
					return;
				}
				else if (
					className === 'none' ||
					className === 'dtr-none' ||
					col.never
				) {
					// Include in none (default) and no auto
					hasClass = true;
					return;
				}
				else if (
					className === 'control' ||
					className === 'dtr-control'
				) {
					// Special column that is only visible, when one of the other
					// columns is hidden. This is used for the details control
					hasClass = true;
					col.control = true;
					return;
				}

				$.each(breakpoints, function (j, breakpoint) {
					// Does this column have a class that matches this breakpoint?
					var brokenPoint = breakpoint.name.split('-');
					var re = new RegExp(
						'(min\\-|max\\-|not\\-)?(' +
							brokenPoint[0] +
							')(\\-[_a-zA-Z0-9])?'
					);
					var match = className.match(re);

					if (match) {
						hasClass = true;

						if (
							match[2] === brokenPoint[0] &&
							match[3] === '-' + brokenPoint[1]
						) {
							// Class name matches breakpoint name fully
							column(
								i,
								breakpoint.name,
								match[1],
								match[2] + match[3]
							);
						}
						else if (match[2] === brokenPoint[0] && !match[3]) {
							// Class name matched primary breakpoint name with no qualifier
							column(i, breakpoint.name, match[1], match[2]);
						}
					}
				});
			}

			// If there was no control class, then automatic sizing is used
			if (!hasClass) {
				col.auto = true;
			}
		});

		this.s.columns = columns;
	},

	/**
	 * Update the cells to show the correct control class / button
	 * @private
	 */
	_controlClass: function () {
		if (this.c.details.type === 'inline') {
			var dt = this.s.dt;
			var columnsVis = this.s.current;
			var firstVisible = $.inArray(true, columnsVis);

			// Remove from any cells which shouldn't have it
			dt.cells(
				null,
				function (idx) {
					return idx !== firstVisible;
				},
				{ page: 'current' }
			)
				.nodes()
				.to$()
				.filter('.dtr-control')
				.removeClass('dtr-control');

			dt.cells(null, firstVisible, { page: 'current' })
				.nodes()
				.to$()
				.addClass('dtr-control');
		}
	},

	/**
	 * Show the details for the child row
	 *
	 * @param  {DataTables.Api} row    API instance for the row
	 * @param  {boolean}        update Update flag
	 * @private
	 */
	_detailsDisplay: function (row, update) {
		var that = this;
		var dt = this.s.dt;
		var details = this.c.details;
		var event = function (res) {
			$(row.node()).toggleClass('dtr-expanded', res !== false);
			$(dt.table().node()).triggerHandler('responsive-display.dt', [
				dt,
				row,
				res,
				update
			]);
		};

		if (details && details.type !== false) {
			var renderer =
				typeof details.renderer === 'string'
					? Responsive.renderer[details.renderer]()
					: details.renderer;

			var res = details.display(
				row,
				update,
				function () {
					return renderer.call(
						that,
						dt,
						row[0][0],
						that._detailsObj(row[0])
					);
				},
				function () {
					event(false);
				}
			);

			if (typeof res === 'boolean') {
				event(res);
			}
		}
	},

	/**
	 * Initialisation for the details handler
	 *
	 * @private
	 */
	_detailsInit: function () {
		var that = this;
		var dt = this.s.dt;
		var details = this.c.details;

		// The inline type always uses the first child as the target
		if (details.type === 'inline') {
			details.target = 'td.dtr-control, th.dtr-control';
		}

		// Keyboard accessibility
		dt.on('draw.dtr', function () {
			that._tabIndexes();
		});
		that._tabIndexes(); // Initial draw has already happened

		$(dt.table().body()).on('keyup.dtr', 'td, th', function (e) {
			if (e.keyCode === 13 && $(this).data('dtr-keyboard')) {
				$(this).click();
			}
		});

		// type.target can be a string jQuery selector or a column index
		var target = details.target;
		var selector = typeof target === 'string' ? target : 'td, th';

		if (target !== undefined || target !== null) {
			// Click handler to show / hide the details rows when they are available
			$(dt.table().body()).on(
				'click.dtr mousedown.dtr mouseup.dtr',
				selector,
				function (e) {
					// If the table is not collapsed (i.e. there is no hidden columns)
					// then take no action
					if (!$(dt.table().node()).hasClass('collapsed')) {
						return;
					}

					// Check that the row is actually a DataTable's controlled node
					if (
						$.inArray(
							$(this).closest('tr').get(0),
							dt.rows().nodes().toArray()
						) === -1
					) {
						return;
					}

					// For column index, we determine if we should act or not in the
					// handler - otherwise it is already okay
					if (typeof target === 'number') {
						var targetIdx =
							target < 0
								? dt.columns().eq(0).length + target
								: target;

						if (dt.cell(this).index().column !== targetIdx) {
							return;
						}
					}

					// $().closest() includes itself in its check
					var row = dt.row($(this).closest('tr'));

					// Check event type to do an action
					if (e.type === 'click') {
						// The renderer is given as a function so the caller can execute it
						// only when they need (i.e. if hiding there is no point is running
						// the renderer)
						that._detailsDisplay(row, false);
					}
					else if (e.type === 'mousedown') {
						// For mouse users, prevent the focus ring from showing
						$(this).css('outline', 'none');
					}
					else if (e.type === 'mouseup') {
						// And then re-allow at the end of the click
						$(this).trigger('blur').css('outline', '');
					}
				}
			);
		}
	},

	/**
	 * Get the details to pass to a renderer for a row
	 * @param  {int} rowIdx Row index
	 * @private
	 */
	_detailsObj: function (rowIdx) {
		var that = this;
		var dt = this.s.dt;

		return $.map(this.s.columns, function (col, i) {
			// Never and control columns should not be passed to the renderer
			if (col.never || col.control) {
				return;
			}

			var dtCol = dt.settings()[0].aoColumns[i];

			return {
				className: dtCol.sClass,
				columnIndex: i,
				data: dt.cell(rowIdx, i).render(that.c.orthogonal),
				hidden: dt.column(i).visible() && !that.s.current[i],
				rowIndex: rowIdx,
				title: dt.column(i).title()
			};
		});
	},

	/**
	 * Find a breakpoint object from a name
	 *
	 * @param  {string} name Breakpoint name to find
	 * @return {object}      Breakpoint description object
	 * @private
	 */
	_find: function (name) {
		var breakpoints = this.c.breakpoints;

		for (var i = 0, ien = breakpoints.length; i < ien; i++) {
			if (breakpoints[i].name === name) {
				return breakpoints[i];
			}
		}
	},

	/**
	 * Re-create the contents of the child rows as the display has changed in
	 * some way.
	 *
	 * @private
	 */
	_redrawChildren: function () {
		var that = this;
		var dt = this.s.dt;

		dt.rows({ page: 'current' }).iterator('row', function (settings, idx) {
			that._detailsDisplay(dt.row(idx), true);
		});
	},

	/**
	 * Alter the table display for a resized viewport. This involves first
	 * determining what breakpoint the window currently is in, getting the
	 * column visibilities to apply and then setting them.
	 *
	 * @param  {boolean} forceRedraw Force a redraw
	 * @private
	 */
	_resize: function (forceRedraw) {
		var that = this;
		var dt = this.s.dt;
		var width = $(window).innerWidth();
		var breakpoints = this.c.breakpoints;
		var breakpoint = breakpoints[0].name;
		var columns = this.s.columns;
		var i, ien;
		var oldVis = this.s.current.slice();

		// Determine what breakpoint we are currently at
		for (i = breakpoints.length - 1; i >= 0; i--) {
			if (width <= breakpoints[i].width) {
				breakpoint = breakpoints[i].name;
				break;
			}
		}

		// Show the columns for that break point
		var columnsVis = this._columnsVisiblity(breakpoint);
		this.s.current = columnsVis;

		// Set the class before the column visibility is changed so event
		// listeners know what the state is. Need to determine if there are
		// any columns that are not visible but can be shown
		var collapsedClass = false;

		for (i = 0, ien = columns.length; i < ien; i++) {
			if (
				columnsVis[i] === false &&
				!columns[i].never &&
				!columns[i].control &&
				!dt.column(i).visible() === false
			) {
				collapsedClass = true;
				break;
			}
		}

		$(dt.table().node()).toggleClass('collapsed', collapsedClass);

		var changed = false;
		var visible = 0;
		var dtSettings = dt.settings()[0];
		var colGroup = $(dt.table().node()).children('colgroup');
		var colEls = dtSettings.aoColumns.map(function (col) {
			return col.colEl;
		});

		dt.columns()
			.eq(0)
			.each(function (colIdx, i) {
				//console.log(colIdx, i);
				// Do nothing on DataTables' hidden column - DT removes it from the table
				// so we need to slide back
				if (! dt.column(colIdx).visible()) {
					return;
				}

				if (columnsVis[i] === true) {
					visible++;
				}

				if (forceRedraw || columnsVis[i] !== oldVis[i]) {
					changed = true;
					that._setColumnVis(colIdx, columnsVis[i]);
				}

				// DataTables 2 uses `col` to define the width for a column
				// and this needs to run each time, as DataTables will change
				// the column width. We may need to reattach if we've removed
				// an element previously.
				if (! columnsVis[i]) {
					colEls[i].detach();
				}
				else {
					that._colGroupAttach(colGroup, colEls, i);
				}
			});

		if (changed) {
			dt.columns.adjust();

			this._redrawChildren();

			// Inform listeners of the change
			$(dt.table().node()).trigger('responsive-resize.dt', [
				dt,
				this._responsiveOnlyHidden()
			]);

			// If no records, update the "No records" display element
			if (dt.page.info().recordsDisplay === 0) {
				$('td', dt.table().body()).eq(0).attr('colspan', visible);
			}
		}

		that._controlClass();
	},

	/**
	 * Determine the width of each column in the table so the auto column hiding
	 * has that information to work with. This method is never going to be 100%
	 * perfect since column widths can change slightly per page, but without
	 * seriously compromising performance this is quite effective.
	 *
	 * @private
	 */
	_resizeAuto: function () {
		var dt = this.s.dt;
		var columns = this.s.columns;
		var that = this;
		var visibleColumns = dt
			.columns()
			.indexes()
			.filter(function (idx) {
				return dt.column(idx).visible();
			});

		// Are we allowed to do auto sizing?
		if (!this.c.auto) {
			return;
		}

		// Are there any columns that actually need auto-sizing, or do they all
		// have classes defined
		if (
			$.inArray(
				true,
				$.map(columns, function (c) {
					return c.auto;
				})
			) === -1
		) {
			return;
		}

		// Clone the table with the current data in it
		var clonedTable = dt.table().node().cloneNode(false);
		var clonedHeader = $(dt.table().header().cloneNode(false)).appendTo(
			clonedTable
		);
		var clonedFooter = $(dt.table().footer().cloneNode(false)).appendTo(
			clonedTable
		);
		var clonedBody = $(dt.table().body())
			.clone(false, false)
			.empty()
			.appendTo(clonedTable); // use jQuery because of IE8

		clonedTable.style.width = 'auto';

		// Header
		dt.table()
			.header.structure(visibleColumns)
			.forEach((row) => {
				var cells = row
					.filter(function (el) {
						return el ? true : false;
					})
					.map(function (el) {
						return $(el.cell)
							.clone(false)
							.css('display', 'table-cell')
							.css('width', 'auto')
							.css('min-width', 0);
					});

				$('<tr/>').append(cells).appendTo(clonedHeader);
			});

		// Always need an empty row that we can read widths from
		var emptyRow = $('<tr/>').appendTo(clonedBody);

		for (var i = 0; i < visibleColumns.count(); i++) {
			emptyRow.append('<td/>');
		}

		// Body rows
		dt.rows({ page: 'current' }).every(function (rowIdx) {
			var node = this.node();

			if (! node) {
				return;
			}

			// We clone the table's rows and cells to create the sizing table
			var tr = node.cloneNode(false);

			dt.cells(rowIdx, visibleColumns).every(function (rowIdx2, colIdx) {
				// If nodes have been moved out (listHiddenNodes), we need to
				// clone from the store
				var store = that.s.childNodeStore[rowIdx + '-' + colIdx];

				if (store) {
					$(this.node().cloneNode(false))
						.append($(store).clone())
						.appendTo(tr);
				}
				else {
					$(this.node()).clone(false).appendTo(tr);
				}
			});

			clonedBody.append(tr);
		});

		// Any cells which were hidden by Responsive in the host table, need to
		// be visible here for the calculations
		clonedBody.find('th, td').css('display', '');

		// Footer
		dt.table()
			.footer.structure(visibleColumns)
			.forEach((row) => {
				var cells = row
					.filter(function (el) {
						return el ? true : false;
					})
					.map(function (el) {
						return $(el.cell)
							.clone(false)
							.css('display', 'table-cell')
							.css('width', 'auto')
							.css('min-width', 0);
					});

				$('<tr/>').append(cells).appendTo(clonedFooter);
			});

		// In the inline case extra padding is applied to the first column to
		// give space for the show / hide icon. We need to use this in the
		// calculation
		if (this.c.details.type === 'inline') {
			$(clonedTable).addClass('dtr-inline collapsed');
		}

		// It is unsafe to insert elements with the same name into the DOM
		// multiple times. For example, cloning and inserting a checked radio
		// clears the chcecked state of the original radio.
		$(clonedTable).find('[name]').removeAttr('name');

		// A position absolute table would take the table out of the flow of
		// our container element, bypassing the height and width (Scroller)
		$(clonedTable).css('position', 'relative');

		var inserted = $('<div/>')
			.css({
				width: 1,
				height: 1,
				overflow: 'hidden',
				clear: 'both'
			})
			.append(clonedTable);

		inserted.insertBefore(dt.table().node());

		// The cloned table now contains the smallest that each column can be
		emptyRow.children().each(function (i) {
			var idx = dt.column.index('fromVisible', i);
			columns[idx].minWidth = this.offsetWidth || 0;
		});

		inserted.remove();
	},

	/**
	 * Get the state of the current hidden columns - controlled by Responsive only
	 */
	_responsiveOnlyHidden: function () {
		var dt = this.s.dt;

		return $.map(this.s.current, function (v, i) {
			// If the column is hidden by DataTables then it can't be hidden by
			// Responsive!
			if (dt.column(i).visible() === false) {
				return true;
			}
			return v;
		});
	},

	/**
	 * Set a column's visibility.
	 *
	 * We don't use DataTables' column visibility controls in order to ensure
	 * that column visibility can Responsive can no-exist. Since only IE8+ is
	 * supported (and all evergreen browsers of course) the control of the
	 * display attribute works well.
	 *
	 * @param {integer} col      Column index
	 * @param {boolean} showHide Show or hide (true or false)
	 * @private
	 */
	_setColumnVis: function (col, showHide) {
		var that = this;
		var dt = this.s.dt;
		var display = showHide ? '' : 'none'; // empty string will remove the attr

		this._setHeaderVis(col, showHide, dt.table().header.structure());
		this._setHeaderVis(col, showHide, dt.table().footer.structure());

		dt.column(col)
			.nodes()
			.to$()
			.css('display', display)
			.toggleClass('dtr-hidden', !showHide);

		// If the are child nodes stored, we might need to reinsert them
		if (!$.isEmptyObject(this.s.childNodeStore)) {
			dt.cells(null, col)
				.indexes()
				.each(function (idx) {
					that._childNodesRestore(dt, idx.row, idx.column);
				});
		}
	},

	/**
	 * Set the a column's visibility, taking into account multiple rows
	 * in a header / footer and colspan attributes
	 * @param {*} col
	 * @param {*} showHide
	 * @param {*} structure
	 */
	_setHeaderVis: function (col, showHide, structure) {
		var that = this;
		var display = showHide ? '' : 'none';

		structure.forEach(function (row) {
			if (row[col]) {
				$(row[col].cell)
					.css('display', display)
					.toggleClass('dtr-hidden', !showHide);
			}
			else {
				// In a colspan - need to rewind calc the new span since
				// display:none elements do not count as being spanned over
				var search = col;

				while (search >= 0) {
					if (row[search]) {
						row[search].cell.colSpan = that._colspan(row, search);
						break;
					}

					search--;
				}
			}
		});
	},

	/**
	 * How many columns should this cell span
	 *
	 * @param {*} row Header structure row
	 * @param {*} idx The column index of the cell to span
	 */
	_colspan: function (row, idx) {
		var colspan = 1;

		for (var col = idx + 1; col < row.length; col++) {
			if (row[col] === null && this.s.current[col]) {
				// colspan and not hidden by Responsive
				colspan++;
			}
			else if (row[col]) {
				// Got the next cell, jump out
				break;
			}
		}

		return colspan;
	},

	/**
	 * Update the cell tab indexes for keyboard accessibility. This is called on
	 * every table draw - that is potentially inefficient, but also the least
	 * complex option given that column visibility can change on the fly. Its a
	 * shame user-focus was removed from CSS 3 UI, as it would have solved this
	 * issue with a single CSS statement.
	 *
	 * @private
	 */
	_tabIndexes: function () {
		var dt = this.s.dt;
		var cells = dt.cells({ page: 'current' }).nodes().to$();
		var ctx = dt.settings()[0];
		var target = this.c.details.target;

		cells.filter('[data-dtr-keyboard]').removeData('[data-dtr-keyboard]');

		if (typeof target === 'number') {
			dt.cells(null, target, { page: 'current' })
				.nodes()
				.to$()
				.attr('tabIndex', ctx.iTabIndex)
				.data('dtr-keyboard', 1);
		}
		else {
			// This is a bit of a hack - we need to limit the selected nodes to just
			// those of this table
			if (target === 'td:first-child, th:first-child') {
				target = '>td:first-child, >th:first-child';
			}

			$(target, dt.rows({ page: 'current' }).nodes())
				.attr('tabIndex', ctx.iTabIndex)
				.data('dtr-keyboard', 1);
		}
	}
});

/**
 * List of default breakpoints. Each item in the array is an object with two
 * properties:
 *
 * * `name` - the breakpoint name.
 * * `width` - the breakpoint width
 *
 * @name Responsive.breakpoints
 * @static
 */
Responsive.breakpoints = [
	{ name: 'desktop', width: Infinity },
	{ name: 'tablet-l', width: 1024 },
	{ name: 'tablet-p', width: 768 },
	{ name: 'mobile-l', width: 480 },
	{ name: 'mobile-p', width: 320 }
];

/**
 * Display methods - functions which define how the hidden data should be shown
 * in the table.
 *
 * @namespace
 * @name Responsive.defaults
 * @static
 */
Responsive.display = {
	childRow: function (row, update, render) {
		var rowNode = $(row.node());

		if (update) {
			if (rowNode.hasClass('dtr-expanded')) {
				row.child(render(), 'child').show();

				return true;
			}
		}
		else {
			if (!rowNode.hasClass('dtr-expanded')) {
				var rendered = render();

				if (rendered === false) {
					return false;
				}

				row.child(rendered, 'child').show();
				return true;
			}
			else {
				row.child(false);

				return false;
			}
		}
	},

	childRowImmediate: function (row, update, render) {
		var rowNode = $(row.node());

		if (
			(!update && rowNode.hasClass('dtr-expanded')) ||
			!row.responsive.hasHidden()
		) {
			// User interaction and the row is show, or nothing to show
			row.child(false);

			return false;
		}
		else {
			// Display
			var rendered = render();

			if (rendered === false) {
				return false;
			}

			row.child(rendered, 'child').show();

			return true;
		}
	},

	// This is a wrapper so the modal options for Bootstrap and jQuery UI can
	// have options passed into them. This specific one doesn't need to be a
	// function but it is for consistency in the `modal` name
	modal: function (options) {
		return function (row, update, render, closeCallback) {
			var modal;
			var rendered = render();

			if (rendered === false) {
				return false;
			}

			if (!update) {
				// Show a modal
				var close = function () {
					modal.remove(); // will tidy events for us
					$(document).off('keypress.dtr');
					$(row.node()).removeClass('dtr-expanded');

					closeCallback();
				};

				modal = $('<div class="dtr-modal"/>')
					.append(
						$('<div class="dtr-modal-display"/>')
							.append(
								$('<div class="dtr-modal-content"/>')
									.data('dtr-row-idx', row.index())
									.append(rendered)
							)
							.append(
								$(
									'<div class="dtr-modal-close">&times;</div>'
								).click(function () {
									close();
								})
							)
					)
					.append(
						$('<div class="dtr-modal-background"/>').click(
							function () {
								close();
							}
						)
					)
					.appendTo('body');

				$(row.node()).addClass('dtr-expanded');

				$(document).on('keyup.dtr', function (e) {
					if (e.keyCode === 27) {
						e.stopPropagation();

						close();
					}
				});
			}
			else {
				modal = $('div.dtr-modal-content');

				if (modal.length && row.index() === modal.data('dtr-row-idx')) {
					modal.empty().append(rendered);
				}
				else {
					// Modal not shown, nothing to update
					return null;
				}
			}

			if (options && options.header) {
				$('div.dtr-modal-content').prepend(
					'<h2>' + options.header(row) + '</h2>'
				);
			}

			return true;
		};
	}
};

/**
 * Display methods - functions which define how the hidden data should be shown
 * in the table.
 *
 * @namespace
 * @name Responsive.defaults
 * @static
 */
Responsive.renderer = {
	listHiddenNodes: function () {
		return function (api, rowIdx, columns) {
			var that = this;
			var ul = $(
				'<ul data-dtr-index="' + rowIdx + '" class="dtr-details"/>'
			);
			var found = false;

			$.each(columns, function (i, col) {
				if (col.hidden) {
					var klass = col.className
						? 'class="' + col.className + '"'
						: '';

					$(
						'<li ' +
							klass +
							' data-dtr-index="' +
							col.columnIndex +
							'" data-dt-row="' +
							col.rowIndex +
							'" data-dt-column="' +
							col.columnIndex +
							'">' +
							'<span class="dtr-title">' +
							col.title +
							'</span> ' +
							'</li>'
					)
						.append(
							$('<span class="dtr-data"/>').append(
								that._childNodes(
									api,
									col.rowIndex,
									col.columnIndex
								)
							)
						) // api.cell( col.rowIndex, col.columnIndex ).node().childNodes ) )
						.appendTo(ul);

					found = true;
				}
			});

			return found ? ul : false;
		};
	},

	listHidden: function () {
		return function (api, rowIdx, columns) {
			var data = $.map(columns, function (col) {
				var klass = col.className
					? 'class="' + col.className + '"'
					: '';

				return col.hidden
					? '<li ' +
							klass +
							' data-dtr-index="' +
							col.columnIndex +
							'" data-dt-row="' +
							col.rowIndex +
							'" data-dt-column="' +
							col.columnIndex +
							'">' +
							'<span class="dtr-title">' +
							col.title +
							'</span> ' +
							'<span class="dtr-data">' +
							col.data +
							'</span>' +
							'</li>'
					: '';
			}).join('');

			return data
				? $(
						'<ul data-dtr-index="' +
							rowIdx +
							'" class="dtr-details"/>'
				).append(data)
				: false;
		};
	},

	tableAll: function (options) {
		options = $.extend(
			{
				tableClass: ''
			},
			options
		);

		return function (api, rowIdx, columns) {
			var data = $.map(columns, function (col) {
				var klass = col.className
					? 'class="' + col.className + '"'
					: '';

				return (
					'<tr ' +
					klass +
					' data-dt-row="' +
					col.rowIndex +
					'" data-dt-column="' +
					col.columnIndex +
					'">' +
					'<td>' +
					col.title +
					':' +
					'</td> ' +
					'<td>' +
					col.data +
					'</td>' +
					'</tr>'
				);
			}).join('');

			return $(
				'<table class="' +
					options.tableClass +
					' dtr-details" width="100%"/>'
			).append(data);
		};
	}
};

/**
 * Responsive default settings for initialisation
 *
 * @namespace
 * @name Responsive.defaults
 * @static
 */
Responsive.defaults = {
	/**
	 * List of breakpoints for the instance. Note that this means that each
	 * instance can have its own breakpoints. Additionally, the breakpoints
	 * cannot be changed once an instance has been creased.
	 *
	 * @type {Array}
	 * @default Takes the value of `Responsive.breakpoints`
	 */
	breakpoints: Responsive.breakpoints,

	/**
	 * Enable / disable auto hiding calculations. It can help to increase
	 * performance slightly if you disable this option, but all columns would
	 * need to have breakpoint classes assigned to them
	 *
	 * @type {Boolean}
	 * @default  `true`
	 */
	auto: true,

	/**
	 * Details control. If given as a string value, the `type` property of the
	 * default object is set to that value, and the defaults used for the rest
	 * of the object - this is for ease of implementation.
	 *
	 * The object consists of the following properties:
	 *
	 * * `display` - A function that is used to show and hide the hidden details
	 * * `renderer` - function that is called for display of the child row data.
	 *   The default function will show the data from the hidden columns
	 * * `target` - Used as the selector for what objects to attach the child
	 *   open / close to
	 * * `type` - `false` to disable the details display, `inline` or `column`
	 *   for the two control types
	 *
	 * @type {Object|string}
	 */
	details: {
		display: Responsive.display.childRow,

		renderer: Responsive.renderer.listHidden(),

		target: 0,

		type: 'inline'
	},

	/**
	 * Orthogonal data request option. This is used to define the data type
	 * requested when Responsive gets the data to show in the child row.
	 *
	 * @type {String}
	 */
	orthogonal: 'display'
};

/*
 * API
 */
var Api = $.fn.dataTable.Api;

// Doesn't do anything - work around for a bug in DT... Not documented
Api.register('responsive()', function () {
	return this;
});

Api.register('responsive.index()', function (li) {
	li = $(li);

	return {
		column: li.data('dtr-index'),
		row: li.parent().data('dtr-index')
	};
});

Api.register('responsive.rebuild()', function () {
	return this.iterator('table', function (ctx) {
		if (ctx._responsive) {
			ctx._responsive._classLogic();
		}
	});
});

Api.register('responsive.recalc()', function () {
	return this.iterator('table', function (ctx) {
		if (ctx._responsive) {
			ctx._responsive._resizeAuto();
			ctx._responsive._resize();
		}
	});
});

Api.register('responsive.hasHidden()', function () {
	var ctx = this.context[0];

	return ctx._responsive
		? $.inArray(false, ctx._responsive._responsiveOnlyHidden()) !== -1
		: false;
});

Api.registerPlural(
	'columns().responsiveHidden()',
	'column().responsiveHidden()',
	function () {
		return this.iterator(
			'column',
			function (settings, column) {
				return settings._responsive
					? settings._responsive._responsiveOnlyHidden()[column]
					: false;
			},
			1
		);
	}
);

/**
 * Version information
 *
 * @name Responsive.version
 * @static
 */
Responsive.version = '3.0.2';

$.fn.dataTable.Responsive = Responsive;
$.fn.DataTable.Responsive = Responsive;

// Attach a listener to the document which listens for DataTables initialisation
// events so we can automatically initialise
$(document).on('preInit.dt.dtr', function (e, settings, json) {
	if (e.namespace !== 'dt') {
		return;
	}

	if (
		$(settings.nTable).hasClass('responsive') ||
		$(settings.nTable).hasClass('dt-responsive') ||
		settings.oInit.responsive ||
		DataTable.defaults.responsive
	) {
		var init = settings.oInit.responsive;

		if (init !== false) {
			new Responsive(settings, $.isPlainObject(init) ? init : {});
		}
	}
});


return DataTable;
}));


/*! Bootstrap 5 integration for DataTables' Responsive
 * © SpryMedia Ltd - datatables.net/license
 */

(function( factory ){
	if ( typeof define === 'function' && define.amd ) {
		// AMD
		define( ['jquery', 'datatables.net-bs5', 'datatables.net-responsive'], function ( $ ) {
			return factory( $, window, document );
		} );
	}
	else if ( typeof exports === 'object' ) {
		// CommonJS
		var jq = require('jquery');
		var cjsRequires = function (root, $) {
			if ( ! $.fn.dataTable ) {
				require('datatables.net-bs5')(root, $);
			}

			if ( ! $.fn.dataTable.Responsive ) {
				require('datatables.net-responsive')(root, $);
			}
		};

		if (typeof window === 'undefined') {
			module.exports = function (root, $) {
				if ( ! root ) {
					// CommonJS environments without a window global must pass a
					// root. This will give an error otherwise
					root = window;
				}

				if ( ! $ ) {
					$ = jq( root );
				}

				cjsRequires( root, $ );
				return factory( $, root, root.document );
			};
		}
		else {
			cjsRequires( window, jq );
			module.exports = factory( jq, window, window.document );
		}
	}
	else {
		// Browser
		factory( jQuery, window, document );
	}
}(function( $, window, document ) {
'use strict';
var DataTable = $.fn.dataTable;



var _display = DataTable.Responsive.display;
var _original = _display.modal;
var _modal = $(
	'<div class="modal fade dtr-bs-modal" role="dialog">' +
		'<div class="modal-dialog" role="document">' +
		'<div class="modal-content">' +
		'<div class="modal-header">' +
		'<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>' +
		'</div>' +
		'<div class="modal-body"/>' +
		'</div>' +
		'</div>' +
		'</div>'
);
var modal;

// Note this could be undefined at the time of initialisation - the
// DataTable.Responsive.bootstrap function can be used to set a different
// bootstrap object
var _bs = window.bootstrap;

DataTable.Responsive.bootstrap = function (bs) {
	_bs = bs;
};

_display.modal = function (options) {
	if (!modal && _bs.Modal) {
		modal = new _bs.Modal(_modal[0]);
	}

	return function (row, update, render, closeCallback) {
		if (! modal) {
			return _original(row, update, render, closeCallback);
		}
		else {
			var rendered = render();

			if (rendered === false) {
				return false;
			}

			if (!update) {
				if (options && options.header) {
					var header = _modal.find('div.modal-header');
					var button = header.find('button').detach();

					header
						.empty()
						.append('<h4 class="modal-title">' + options.header(row) + '</h4>')
						.append(button);
				}

				_modal.find('div.modal-body').empty().append(rendered);

				_modal
					.data('dtr-row-idx', row.index())
					.one('hidden.bs.modal', closeCallback)
					.appendTo('body');

				modal.show();
			}
			else {
				if ($.contains(document, _modal[0]) && row.index() === _modal.data('dtr-row-idx')) {
					_modal.find('div.modal-body').empty().append(rendered);
				}
				else {
					// Modal not shown for this row - do nothing
					return null;
				}
			}

			return true;
		}
	};
};


return DataTable;
}));


/*! Scroller 2.4.3
 * © SpryMedia Ltd - datatables.net/license
 */

(function( factory ){
	if ( typeof define === 'function' && define.amd ) {
		// AMD
		define( ['jquery', 'datatables.net'], function ( $ ) {
			return factory( $, window, document );
		} );
	}
	else if ( typeof exports === 'object' ) {
		// CommonJS
		var jq = require('jquery');
		var cjsRequires = function (root, $) {
			if ( ! $.fn.dataTable ) {
				require('datatables.net')(root, $);
			}
		};

		if (typeof window === 'undefined') {
			module.exports = function (root, $) {
				if ( ! root ) {
					// CommonJS environments without a window global must pass a
					// root. This will give an error otherwise
					root = window;
				}

				if ( ! $ ) {
					$ = jq( root );
				}

				cjsRequires( root, $ );
				return factory( $, root, root.document );
			};
		}
		else {
			cjsRequires( window, jq );
			module.exports = factory( jq, window, window.document );
		}
	}
	else {
		// Browser
		factory( jQuery, window, document );
	}
}(function( $, window, document ) {
'use strict';
var DataTable = $.fn.dataTable;



/**
 * @summary     Scroller
 * @description Virtual rendering for DataTables
 * @version     2.4.3
 * @copyright   SpryMedia Ltd.
 *
 * This source file is free software, available under the following license:
 *   MIT license - http://datatables.net/license/mit
 *
 * This source file is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the license files for details.
 *
 * For details please refer to: http://www.datatables.net
 */

/**
 * Scroller is a virtual rendering plug-in for DataTables which allows large
 * datasets to be drawn on screen very quickly. What the virtual rendering means
 * is that only the visible portion of the table (and a bit to either side to make
 * the scrolling smooth) is drawn, while the scrolling container gives the
 * visual impression that the whole table is visible. This is done by making use
 * of the pagination abilities of DataTables and moving the table around in the
 * scrolling container DataTables adds to the page. The scrolling container is
 * forced to the height it would be for the full table display using an extra
 * element.
 *
 * Note that rows in the table MUST all be the same height. Information in a cell
 * which expands on to multiple lines will cause some odd behaviour in the scrolling.
 *
 * Scroller is initialised by simply including the letter 'S' in the sDom for the
 * table you want to have this feature enabled on. Note that the 'S' must come
 * AFTER the 't' parameter in `dom`.
 *
 * Key features include:
 *   <ul class="limit_length">
 *     <li>Speed! The aim of Scroller for DataTables is to make rendering large data sets fast</li>
 *     <li>Full compatibility with deferred rendering in DataTables for maximum speed</li>
 *     <li>Display millions of rows</li>
 *     <li>Integration with state saving in DataTables (scrolling position is saved)</li>
 *     <li>Easy to use</li>
 *   </ul>
 *
 *  @class
 *  @constructor
 *  @global
 *  @param {object} dt DataTables settings object or API instance
 *  @param {object} [opts={}] Configuration object for Scroller. Options
 *    are defined by {@link Scroller.defaults}
 *
 *  @requires jQuery 1.7+
 *  @requires DataTables 1.11.0+
 */
var Scroller = function (dt, opts) {
	/* Sanity check - you just know it will happen */
	if (!(this instanceof Scroller)) {
		alert(
			"Scroller warning: Scroller must be initialised with the 'new' keyword."
		);
		return;
	}

	if (opts === undefined) {
		opts = {};
	}

	var dtApi = $.fn.dataTable.Api(dt);

	/**
	 * Settings object which contains customisable information for the Scroller instance
	 * @namespace
	 * @private
	 * @extends Scroller.defaults
	 */
	this.s = {
		/**
		 * DataTables settings object
		 *  @type     object
		 *  @default  Passed in as first parameter to constructor
		 */
		dt: dtApi.settings()[0],

		/**
		 * DataTables API instance
		 *  @type     DataTable.Api
		 */
		dtApi: dtApi,

		/**
		 * Pixel location of the top of the drawn table in the viewport
		 *  @type     int
		 *  @default  0
		 */
		tableTop: 0,

		/**
		 * Pixel location of the bottom of the drawn table in the viewport
		 *  @type     int
		 *  @default  0
		 */
		tableBottom: 0,

		/**
		 * Pixel location of the boundary for when the next data set should be loaded and drawn
		 * when scrolling up the way.
		 *  @type     int
		 *  @default  0
		 *  @private
		 */
		redrawTop: 0,

		/**
		 * Pixel location of the boundary for when the next data set should be loaded and drawn
		 * when scrolling down the way. Note that this is actually calculated as the offset from
		 * the top.
		 *  @type     int
		 *  @default  0
		 *  @private
		 */
		redrawBottom: 0,

		/**
		 * Auto row height or not indicator
		 *  @type     bool
		 *  @default  0
		 */
		autoHeight: true,

		/**
		 * Number of rows calculated as visible in the visible viewport
		 *  @type     int
		 *  @default  0
		 */
		viewportRows: 0,

		/**
		 * setTimeout reference for state saving, used when state saving is enabled in the DataTable
		 * and when the user scrolls the viewport in order to stop the cookie set taking too much
		 * CPU!
		 *  @type     int
		 *  @default  0
		 */
		stateTO: null,

		stateSaveThrottle: function () {},

		/**
		 * setTimeout reference for the redraw, used when server-side processing is enabled in the
		 * DataTables in order to prevent DoSing the server
		 *  @type     int
		 *  @default  null
		 */
		drawTO: null,

		heights: {
			jump: null,
			page: null,
			virtual: null,
			scroll: null,

			/**
			 * Height of rows in the table
			 *  @type     int
			 *  @default  0
			 */
			row: null,

			/**
			 * Pixel height of the viewport
			 *  @type     int
			 *  @default  0
			 */
			viewport: null,
			labelHeight: 0,
			xbar: 0
		},

		topRowFloat: 0,
		scrollDrawDiff: null,
		loaderVisible: false,
		forceReposition: false,
		baseRowTop: 0,
		baseScrollTop: 0,
		mousedown: false,
		lastScrollTop: 0
	};

	// @todo The defaults should extend a `c` property and the internal settings
	// only held in the `s` property. At the moment they are mixed
	this.s = $.extend(this.s, Scroller.oDefaults, opts);

	// Workaround for row height being read from height object (see above comment)
	this.s.heights.row = this.s.rowHeight;

	/**
	 * DOM elements used by the class instance
	 * @private
	 * @namespace
	 *
	 */
	this.dom = {
		force: document.createElement('div'),
		label: $('<div class="dts_label">0</div>'),
		scroller: null,
		table: null,
		loader: null
	};

	// Attach the instance to the DataTables instance so it can be accessed in
	// future. Don't initialise Scroller twice on the same table
	if (this.s.dt.oScroller) {
		return;
	}

	this.s.dt.oScroller = this;

	/* Let's do it */
	this.construct();
};

$.extend(Scroller.prototype, {
	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * Public methods - to be exposed via the DataTables API
	 */

	/**
	 * Calculate and store information about how many rows are to be displayed
	 * in the scrolling viewport, based on current dimensions in the browser's
	 * rendering. This can be particularly useful if the table is initially
	 * drawn in a hidden element - for example in a tab.
	 *  @param {bool} [redraw=true] Redraw the table automatically after the recalculation, with
	 *    the new dimensions forming the basis for the draw.
	 *  @returns {void}
	 */
	measure: function (redraw) {
		if (this.s.autoHeight) {
			this._calcRowHeight();
		}

		var heights = this.s.heights;

		if (heights.row) {
			heights.viewport = this._parseHeight(
				$(this.dom.scroller).css('max-height')
			);

			this.s.viewportRows =
				parseInt(heights.viewport / heights.row, 10) + 1;
			this.s.dt._iDisplayLength =
				this.s.viewportRows * this.s.displayBuffer;
		}

		var label = this.dom.label.outerHeight();

		heights.xbar =
			this.dom.scroller.offsetHeight - this.dom.scroller.clientHeight;
		heights.labelHeight = label;

		if (redraw === undefined || redraw) {
			this.s.dtApi.draw(false);
		}
	},

	/**
	 * Get information about current displayed record range. This corresponds to
	 * the information usually displayed in the "Info" block of the table.
	 *
	 * @returns {object} info as an object:
	 *  {
	 *      start: {int}, // the 0-indexed record at the top of the viewport
	 *      end:   {int}, // the 0-indexed record at the bottom of the viewport
	 *  }
	 */
	pageInfo: function () {
		var dt = this.s.dt,
			iScrollTop = this.dom.scroller.scrollTop,
			iTotal = dt.fnRecordsDisplay(),
			iPossibleEnd = Math.ceil(
				this.pixelsToRow(
					iScrollTop + this.s.heights.viewport,
					false,
					this.s.ani
				)
			);

		return {
			start: Math.floor(this.pixelsToRow(iScrollTop, false, this.s.ani)),
			end: iTotal < iPossibleEnd ? iTotal - 1 : iPossibleEnd - 1
		};
	},

	/**
	 * Calculate the row number that will be found at the given pixel position
	 * (y-scroll).
	 *
	 * Please note that when the height of the full table exceeds 1 million
	 * pixels, Scroller switches into a non-linear mode for the scrollbar to fit
	 * all of the records into a finite area, but this function returns a linear
	 * value (relative to the last non-linear positioning).
	 *  @param {int} pixels Offset from top to calculate the row number of
	 *  @param {int} [intParse=true] If an integer value should be returned
	 *  @param {int} [virtual=false] Perform the calculations in the virtual domain
	 *  @returns {int} Row index
	 */
	pixelsToRow: function (pixels, intParse, virtual) {
		var diff = pixels - this.s.baseScrollTop;
		var row = virtual
			? (this._domain('physicalToVirtual', this.s.baseScrollTop) + diff) /
				this.s.heights.row
			: diff / this.s.heights.row + this.s.baseRowTop;

		return intParse || intParse === undefined ? parseInt(row, 10) : row;
	},

	/**
	 * Calculate the pixel position from the top of the scrolling container for
	 * a given row
	 *  @param {int} iRow Row number to calculate the position of
	 *  @returns {int} Pixels
	 */
	rowToPixels: function (rowIdx, intParse, virtual) {
		var pixels;
		var diff = rowIdx - this.s.baseRowTop;

		if (virtual) {
			pixels = this._domain('virtualToPhysical', this.s.baseScrollTop);
			pixels += diff * this.s.heights.row;
		}
		else {
			pixels = this.s.baseScrollTop;
			pixels += diff * this.s.heights.row;
		}

		return intParse || intParse === undefined
			? parseInt(pixels, 10)
			: pixels;
	},

	/**
	 * Calculate the row number that will be found at the given pixel position (y-scroll)
	 *  @param {int} row Row index to scroll to
	 *  @param {bool} [animate=true] Animate the transition or not
	 *  @returns {void}
	 */
	scrollToRow: function (row, animate) {
		var that = this;
		var ani = false;
		var px = this.rowToPixels(row);

		// We need to know if the table will redraw or not before doing the
		// scroll. If it will not redraw, then we need to use the currently
		// displayed table, and scroll with the physical pixels. Otherwise, we
		// need to calculate the table's new position from the virtual
		// transform.
		var preRows = ((this.s.displayBuffer - 1) / 2) * this.s.viewportRows;
		var drawRow = row - preRows;
		if (drawRow < 0) {
			drawRow = 0;
		}

		if (
			(px > this.s.redrawBottom || px < this.s.redrawTop) &&
			this.s.dt._iDisplayStart !== drawRow
		) {
			ani = true;
			px = this._domain('virtualToPhysical', row * this.s.heights.row);

			// If we need records outside the current draw region, but the new
			// scrolling position is inside that (due to the non-linear nature
			// for larger numbers of records), we need to force position update.
			if (this.s.redrawTop < px && px < this.s.redrawBottom) {
				this.s.forceReposition = true;
				animate = false;
			}
		}

		if (animate === undefined || animate) {
			this.s.ani = ani;
			$(this.dom.scroller).animate(
				{
					scrollTop: px
				},
				function () {
					// This needs to happen after the animation has completed and
					// the final scroll event fired
					setTimeout(function () {
						that.s.ani = false;
					}, 250);
				}
			);
		}
		else {
			$(this.dom.scroller).scrollTop(px);
		}
	},

	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * Constructor
	 */

	/**
	 * Initialisation for Scroller
	 *  @returns {void}
	 *  @private
	 */
	construct: function () {
		var that = this;
		var dt = this.s.dtApi;

		/* Sanity check */
		if (!this.s.dt.oFeatures.bPaginate) {
			throw new Error(
				'Pagination must be enabled for Scroller to operate'
			);
		}

		/* Insert a div element that we can use to force the DT scrolling container to
		 * the height that would be required if the whole table was being displayed
		 */
		this.dom.force.style.position = 'relative';
		this.dom.force.style.top = '0px';
		this.dom.force.style.left = '0px';
		this.dom.force.style.width = '1px';

		this.dom.scroller = dt.table().node().parentNode;
		this.dom.scroller.appendChild(this.dom.force);
		this.dom.scroller.style.position = 'relative';

		this.dom.table = $('>table', this.dom.scroller)[0];
		this.dom.table.style.position = 'absolute';
		this.dom.table.style.top = '0px';
		this.dom.table.style.left = '0px';

		// Add class to 'announce' that we are a Scroller table
		$(dt.table().container()).addClass('dts DTS');

		this.dom.label.appendTo(this.dom.scroller);

		/* Initial size calculations */
		if (this.s.heights.row && this.s.heights.row != 'auto') {
			this.s.autoHeight = false;
		}

		// Scrolling callback to see if a page change is needed
		this.s.ingnoreScroll = true;
		$(this.dom.scroller).on('scroll.dt-scroller', function (e) {
			that._scroll.call(that);
		});

		// In iOS we catch the touchstart event in case the user tries to scroll
		// while the display is already scrolling
		$(this.dom.scroller).on('touchstart.dt-scroller', function () {
			that._scroll.call(that);
		});

		$(this.dom.scroller)
			.on('mousedown.dt-scroller', function () {
				that.s.mousedown = true;
			})
			.on('mouseup.dt-scroller', function () {
				that.s.labelVisible = false;
				that.s.mousedown = false;
				that.dom.label.css('display', 'none');
			});

		// On resize, update the information element, since the number of rows shown might change
		$(window).on('resize.dt-scroller', function () {
			that.measure(false);
			that._info();
		});

		// Add a state saving parameter to the DT state saving so we can restore the exact
		// position of the scrolling.
		var initialStateSave = true;
		var loadedState = dt.state.loaded();

		dt.on('stateSaveParams.scroller', function (e, settings, data) {
			if (initialStateSave && loadedState) {
				data.scroller = loadedState.scroller;
				initialStateSave = false;

				if (data.scroller) {
					that.s.lastScrollTop = data.scroller.scrollTop;
				}
			}
			else {
				// Need to used the saved position on init
				data.scroller = {
					topRow: that.s.topRowFloat,
					baseRowTop: that.s.baseRowTop
				};
			}
		});

		dt.on('stateLoadParams.scroller', function (e, settings, data) {
			if (data.scroller !== undefined) {
				that.scrollToRow(data.scroller.topRow);
			}
		});

		this.measure(false);

		if (loadedState && loadedState.scroller) {
			this.s.topRowFloat = loadedState.scroller.topRow;
			this.s.baseRowTop = loadedState.scroller.baseRowTop;

			// Reconstruct the scroll positions from the rows - it is possible the
			// row height has changed e.g. if the styling framework has changed.
			// The scroll top is used in `_draw` further down.
			this.s.baseScrollTop = this.s.baseRowTop * this.s.heights.row;			
			loadedState.scroller.scrollTop = this._domain('physicalToVirtual', this.s.topRowFloat * this.s.heights.row);
		}

		that.s.stateSaveThrottle = DataTable.util.throttle(function () {
			that.s.dtApi.state.save();
		}, 500);

		dt.on('init.scroller', function () {
			that.measure(false);

			// Setting to `jump` will instruct _draw to calculate the scroll top
			// position
			that.s.scrollType = 'jump';
			that._draw();

			// Update the scroller when the DataTable is redrawn
			dt.on('draw.scroller', function () {
				that._draw();
			});
		});

		// Set height before the draw happens, allowing everything else to update
		// on draw complete without worry for roder.
		dt.on('preDraw.dt.scroller', function () {
			that._scrollForce();
		});

		// Destructor
		dt.on('destroy.scroller', function () {
			$(window).off('resize.dt-scroller');
			$(that.dom.scroller).off('.dt-scroller');
			$(that.s.dt.nTable).off('.scroller');

			$(that.s.dt.nTableWrapper).removeClass('DTS');
			$('div.DTS_Loading', that.dom.scroller.parentNode).remove();

			that.dom.table.style.position = '';
			that.dom.table.style.top = '';
			that.dom.table.style.left = '';
		});
	},

	/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
	 * Private methods
	 */

	/**
	 * Automatic calculation of table row height. This is just a little tricky here as using
	 * initialisation DataTables has tale the table out of the document, so we need to create
	 * a new table and insert it into the document, calculate the row height and then whip the
	 * table out.
	 *  @returns {void}
	 *  @private
	 */
	_calcRowHeight: function () {
		var dt = this.s.dt;
		var origTable = dt.nTable;
		var nTable = origTable.cloneNode(false);
		var tbody = $('<tbody/>').appendTo(nTable);
		var dtClasses = dt.oClasses;

		// Different locations for classes in DT2
		var classes = DataTable.versionCheck('2')
			? {
					container: dtClasses.container,
					scroller: dtClasses.scrolling.container,
					body: dtClasses.scrolling.body
			}
			: {
					container: dtClasses.sWrapper,
					scroller: dtClasses.sScrollWrapper,
					body: dtClasses.sScrollBody
			};

		var container = $(
			'<div class="' +
				classes.container +
				' DTS"><div class="' +
				classes.scroller +
				'"><div class="' +
				classes.body +
				'"></div></div></div>'
		);

		// Want 3 rows in the sizing table so :first-child and :last-child
		// CSS styles don't come into play - take the size of the middle row
		$('tbody tr:lt(4)', origTable).clone().appendTo(tbody);
		var rowsCount = $('tr', tbody).length;

		if (rowsCount === 1) {
			tbody.prepend('<tr><td>&#160;</td></tr>');
			tbody.append('<tr><td>&#160;</td></tr>');
		}
		else {
			for (; rowsCount < 3; rowsCount++) {
				tbody.append('<tr><td>&#160;</td></tr>');
			}
		}

		$('div.' + classes.body, container).append(nTable);

		// If initialised using `dom`, use the holding element as the insert point
		var insertEl = this.s.dt.nHolding || origTable.parentNode;

		if (!$(insertEl).is(':visible')) {
			insertEl = 'body';
		}

		// Remove form element links as they might select over others (particularly radio and checkboxes)
		container.find('input').removeAttr('name');

		container.appendTo(insertEl);
		this.s.heights.row = $('tr', tbody).eq(1).outerHeight();

		container.remove();
	},

	/**
	 * Draw callback function which is fired when the DataTable is redrawn. The main function of
	 * this method is to position the drawn table correctly the scrolling container for the rows
	 * that is displays as a result of the scrolling position.
	 *  @returns {void}
	 *  @private
	 */
	_draw: function () {
		var that = this,
			heights = this.s.heights,
			iScrollTop = this.dom.scroller.scrollTop,
			iTableHeight = $(this.s.dt.nTable).height(),
			displayStart = this.s.dt._iDisplayStart,
			displayLen = this.s.dt._iDisplayLength,
			displayEnd = this.s.dt.fnRecordsDisplay(),
			viewportEndY = iScrollTop + heights.viewport;

		// Disable the scroll event listener while we are updating the DOM
		this.s.skip = true;

		// If paging is reset
		if (
			(this.s.dt.bSorted || this.s.dt.bFiltered) &&
			displayStart === 0 &&
			!this.s.dt._drawHold
		) {
			this.s.topRowFloat = 0;
		}

		iScrollTop =
			this.s.scrollType === 'jump'
				? this._domain(
					'virtualToPhysical',
					this.s.topRowFloat * heights.row
				)
				: iScrollTop;

		// Store positional information so positional calculations can be based
		// upon the current table draw position
		this.s.baseScrollTop = iScrollTop;
		this.s.baseRowTop = this.s.topRowFloat;

		// Position the table in the virtual scroller
		var tableTop =
			iScrollTop - (this.s.topRowFloat - displayStart) * heights.row;
		if (displayStart === 0) {
			tableTop = 0;
		}
		else if (displayStart + displayLen >= displayEnd) {
			tableTop = heights.scroll - iTableHeight;
		}
		else {
			var iTableBottomY = tableTop + iTableHeight;
			if (iTableBottomY < viewportEndY) {
				// The last row of the data is above the end of the viewport.
				// This means the background is visible, which is not what the user expects.
				var newTableTop = viewportEndY - iTableHeight;
				var diffPx = newTableTop - tableTop;
				this.s.baseScrollTop += diffPx + 1; // Update start row number in footer.
				tableTop = newTableTop; // Move table so last line of data is at the bottom of the viewport.
			}
		}

		this.dom.table.style.top = tableTop + 'px';

		/* Cache some information for the scroller */
		this.s.tableTop = tableTop;
		this.s.tableBottom = iTableHeight + this.s.tableTop;

		// Calculate the boundaries for where a redraw will be triggered by the
		// scroll event listener
		var boundaryPx = (iScrollTop - this.s.tableTop) * this.s.boundaryScale;
		this.s.redrawTop = iScrollTop - boundaryPx;
		this.s.redrawBottom =
			iScrollTop + boundaryPx >
			heights.scroll - heights.viewport - heights.row
				? heights.scroll - heights.viewport - heights.row
				: iScrollTop + boundaryPx;

		this.s.skip = false;

		if (that.s.ingnoreScroll) {
			// Restore the scrolling position that was saved by DataTable's state
			// saving Note that this is done on the second draw when data is Ajax
			// sourced, and the first draw when DOM soured
			if (
				this.s.dt.oFeatures.bStateSave &&
				this.s.dt.oLoadedState !== null &&
				typeof this.s.dt.oLoadedState.scroller != 'undefined'
			) {
				// A quirk of DataTables is that the draw callback will occur on an
				// empty set if Ajax sourced, but not if server-side processing.
				var ajaxSourced =
					(this.s.dt.sAjaxSource || that.s.dt.ajax) &&
					!this.s.dt.oFeatures.bServerSide
						? true
						: false;

				if (
					(ajaxSourced && this.s.dt.iDraw >= 2) ||
					(!ajaxSourced && this.s.dt.iDraw >= 1)
				) {
					setTimeout(function () {
						$(that.dom.scroller).scrollTop(
							that.s.dt.oLoadedState.scroller.scrollTop
						);

						// In order to prevent layout thrashing we need another
						// small delay
						setTimeout(function () {
							that.s.ingnoreScroll = false;
						}, 0);
					}, 0);
				}
			}
			else {
				that.s.ingnoreScroll = false;
			}
		}

		// Because of the order of the DT callbacks, the info update will
		// take precedence over the one we want here. So a 'thread' break is
		// needed.  Only add the thread break if bInfo is set
		if (this.s.dt.oFeatures.bInfo) {
			setTimeout(function () {
				that._info.call(that);
			}, 0);
		}

		$(this.s.dt.nTable).triggerHandler('position.dts.dt', tableTop);
	},

	/**
	 * Convert from one domain to another. The physical domain is the actual
	 * pixel count on the screen, while the virtual is if we had browsers which
	 * had scrolling containers of infinite height (i.e. the absolute value)
	 *
	 *  @param {string} dir Domain transform direction, `virtualToPhysical` or
	 *    `physicalToVirtual`
	 *  @returns {number} Calculated transform
	 *  @private
	 */
	_domain: function (dir, val) {
		var heights = this.s.heights;
		var diff;
		var magic = 10000; // the point at which the non-linear calculations start to happen

		// If the virtual and physical height match, then we use a linear
		// transform between the two, allowing the scrollbar to be linear
		if (heights.virtual === heights.scroll) {
			return val;
		}

		// In the first 10k pixels and the last 10k pixels, we want the scrolling
		// to be linear. After that it can be non-linear. It would be unusual for
		// anyone to mouse wheel through that much.
		if (val < magic) {
			return val;
		}
		else if (
			dir === 'virtualToPhysical' &&
			val >= heights.virtual - magic
		) {
			diff = heights.virtual - val;
			return heights.scroll - diff;
		}
		else if (dir === 'physicalToVirtual' && val >= heights.scroll - magic) {
			diff = heights.scroll - val;
			return heights.virtual - diff;
		}

		// Otherwise, we want a non-linear scrollbar to take account of the
		// redrawing regions at the start and end of the table, otherwise these
		// can stutter badly - on large tables 30px (for example) scroll might
		// be hundreds of rows, so the table would be redrawing every few px at
		// the start and end. Use a simple linear eq. to stop this, effectively
		// causing a kink in the scrolling ratio. It does mean the scrollbar is
		// non-linear, but with such massive data sets, the scrollbar is going
		// to be a best guess anyway
		var m =
			(heights.virtual - magic - magic) /
			(heights.scroll - magic - magic);
		var c = magic - m * magic;

		return dir === 'virtualToPhysical' ? (val - c) / m : m * val + c;
	},

	/**
	 * Update any information elements that are controlled by the DataTable based on the scrolling
	 * viewport and what rows are visible in it. This function basically acts in the same way as
	 * _fnUpdateInfo in DataTables, and effectively replaces that function.
	 *  @returns {void}
	 *  @private
	 */
	_info: function () {
		if (!this.s.dt.oFeatures.bInfo) {
			return;
		}

		var dt = this.s.dt,
			dtApi = this.s.dtApi,
			language = dt.oLanguage,
			info = dtApi.page.info(),
			total = info.recordsDisplay,
			max = info.recordsTotal;

		// If the scroll type is `cont` (continuous) we need to use `baseRowTop`, which
		// also means we need to work out the difference between the current scroll position
		// and the "base" for when it was required
		var diffRows = (this.s.lastScrollTop - this.s.baseScrollTop) / this.s.heights.row;
		var start = Math.floor(this.s.baseRowTop + diffRows) + 1;

		// For a jump scroll type, we just use the straightforward calculation based on
		// `topRowFloat`
		if (this.s.scrollType === 'jump') {
			start = Math.floor(this.s.topRowFloat) + 1;
		}

		var
			possibleEnd = start + Math.floor(this.s.heights.viewport / this.s.heights.row),
			end = possibleEnd > total ? total : possibleEnd,
			result;

		if (total === 0 && total == max) {
			/* Empty record set */
			result = language.sInfoEmpty + language.sInfoPostFix;
		}
		else if (total === 0) {
			// Empty record set after filtering
			result =
				language.sInfoEmpty +
				' ' +
				language.sInfoFiltered +
				language.sInfoPostFix;
		}
		else if (total == max) {
			// Normal record set
			result = language.sInfo + language.sInfoPostFix;
		}
		else {
			// Record set after filtering
			result = language.sInfo + ' ' + language.sInfoFiltered + language.sInfoPostFix;
		}

		result = this._macros(result, start, end, max, total);

		var callback = language.fnInfoCallback;
		if (callback) {
			result = callback.call(
				dt.oInstance,
				dt,
				start,
				end,
				max,
				total,
				result
			);
		}

		// DT 1.x features
		var n = dt.aanFeatures.i;
		if (typeof n != 'undefined') {
			for (var i = 0, iLen = n.length; i < iLen; i++) {
				$(n[i]).html(result);
			}

			$(dt.nTable).triggerHandler('info.dt');
		}

		// DT 2.x features
		$('div.dt-info', dtApi.table().container()).each(function () {
			$(this).html(result);
			dtApi.trigger('info', [dtApi.settings()[0], this, result]);
		});
	},

	/**
	 * String replacement for info display. Basically the same as what DataTables does.
	 *
	 * @param {*} str
	 * @param {*} start
	 * @param {*} end
	 * @param {*} max
	 * @param {*} total
	 * @returns Formatted string
	 */
	_macros: function (str, start, end, max, total) {
		var api = this.s.dtApi;
		var settings = this.s.dt;
		var formatter = settings.fnFormatNumber;

		return str
			.replace(/_START_/g, formatter.call(settings, start))
			.replace(/_END_/g, formatter.call(settings, end))
			.replace(/_MAX_/g, formatter.call(settings, max))
			.replace(/_TOTAL_/g, formatter.call(settings, total))
			.replace(/_ENTRIES_/g, api.i18n('entries', ''))
			.replace(/_ENTRIES-MAX_/g, api.i18n('entries', '', max))
			.replace(/_ENTRIES-TOTAL_/g, api.i18n('entries', '', total));
	},

	/**
	 * Parse CSS height property string as number
	 *
	 * An attempt is made to parse the string as a number. Currently supported units are 'px',
	 * 'vh', and 'rem'. 'em' is partially supported; it works as long as the parent element's
	 * font size matches the body element. Zero is returned for unrecognized strings.
	 *  @param {string} cssHeight CSS height property string
	 *  @returns {number} height
	 *  @private
	 */
	_parseHeight: function (cssHeight) {
		var height;
		var matches = /^([+-]?(?:\d+(?:\.\d+)?|\.\d+))(px|em|rem|vh)$/.exec(
			cssHeight
		);

		if (matches === null) {
			return 0;
		}

		var value = parseFloat(matches[1]);
		var unit = matches[2];

		if (unit === 'px') {
			height = value;
		}
		else if (unit === 'vh') {
			height = (value / 100) * $(window).height();
		}
		else if (unit === 'rem') {
			height = value * parseFloat($(':root').css('font-size'));
		}
		else if (unit === 'em') {
			height = value * parseFloat($('body').css('font-size'));
		}

		return height ? height : 0;
	},

	/**
	 * Scrolling function - fired whenever the scrolling position is changed.
	 * This method needs to use the stored values to see if the table should be
	 * redrawn as we are moving towards the end of the information that is
	 * currently drawn or not. If needed, then it will redraw the table based on
	 * the new position.
	 *  @returns {void}
	 *  @private
	 */
	_scroll: function () {
		var that = this,
			heights = this.s.heights,
			iScrollTop = this.dom.scroller.scrollTop,
			iTopRow;

		if (this.s.skip) {
			return;
		}

		if (this.s.ingnoreScroll) {
			return;
		}

		if (iScrollTop === this.s.lastScrollTop) {
			return;
		}

		/* If the table has been sorted or filtered, then we use the redraw that
		 * DataTables as done, rather than performing our own
		 */
		if (this.s.dt.bFiltered || this.s.dt.bSorted) {
			this.s.lastScrollTop = 0;
			return;
		}

		/* We don't want to state save on every scroll event - that's heavy
		 * handed, so use a timeout to update the state saving only when the
		 * scrolling has finished
		 */
		clearTimeout(this.s.stateTO);
		this.s.stateTO = setTimeout(function () {
			that.s.dtApi.state.save();

			// We can also use this to ensure that the `info` element is correct
			// since there can be a little scroll after the last scroll event!
			that._info();
		}, 250);

		this.s.scrollType =
			Math.abs(iScrollTop - this.s.lastScrollTop) > heights.viewport
				? 'jump'
				: 'cont';

		this.s.topRowFloat =
			this.s.scrollType === 'cont'
				? this.pixelsToRow(iScrollTop, false, false)
				: this._domain('physicalToVirtual', iScrollTop) / heights.row;

		if (this.s.topRowFloat < 0) {
			this.s.topRowFloat = 0;
		}

		/* Check if the scroll point is outside the trigger boundary which would required
		 * a DataTables redraw
		 */
		if (
			this.s.forceReposition ||
			iScrollTop < this.s.redrawTop ||
			iScrollTop > this.s.redrawBottom
		) {
			var preRows = Math.ceil(
				((this.s.displayBuffer - 1) / 2) * this.s.viewportRows
			);

			iTopRow = parseInt(this.s.topRowFloat, 10) - preRows;
			this.s.forceReposition = false;

			if (iTopRow <= 0) {
				/* At the start of the table */
				iTopRow = 0;
			}
			else if (
				iTopRow + this.s.dt._iDisplayLength >
				this.s.dt.fnRecordsDisplay()
			) {
				/* At the end of the table */
				iTopRow =
					this.s.dt.fnRecordsDisplay() - this.s.dt._iDisplayLength;
				if (iTopRow < 0) {
					iTopRow = 0;
				}
			}
			else if (iTopRow % 2 !== 0) {
				// For the row-striping classes (odd/even) we want only to start
				// on evens otherwise the stripes will change between draws and
				// look rubbish
				iTopRow++;
			}

			// Store calcuated value, in case the following condition is not met, but so
			// that the draw function will still use it.
			this.s.targetTop = iTopRow;

			if (iTopRow != this.s.dt._iDisplayStart) {
				/* Cache the new table position for quick lookups */
				this.s.tableTop = $(this.s.dt.nTable).offset().top;
				this.s.tableBottom =
					$(this.s.dt.nTable).height() + this.s.tableTop;

				var draw = function () {
					that.s.dt._iDisplayStart = that.s.targetTop;
					that.s.dtApi.draw('page');
				};

				/* Do the DataTables redraw based on the calculated start point - note that when
				 * using server-side processing we introduce a small delay to not DoS the server...
				 */
				if (this.s.dt.oFeatures.bServerSide) {
					this.s.forceReposition = true;

					// This is used only for KeyTable and is not currently publicly
					// documented. Open question - is it useful for anything else?
					$(this.s.dt.nTable).triggerHandler('scroller-will-draw.dt');

					if (DataTable.versionCheck('2')) {
						that.s.dtApi.processing(true);
					}
					else {
						this.s.dt.oApi._fnProcessingDisplay(this.s.dt, true);
					}

					clearTimeout(this.s.drawTO);
					this.s.drawTO = setTimeout(draw, this.s.serverWait);
				}
				else {
					draw();
				}
			}
		}
		else {
			this.s.topRowFloat = this.pixelsToRow(iScrollTop, false, true);
		}

		/* Update the table's information display for what is now in the viewport */
		this._info();

		this.s.lastScrollTop = iScrollTop;
		this.s.stateSaveThrottle();

		if (this.s.scrollType === 'jump' && this.s.mousedown) {
			this.s.labelVisible = true;
		}
		if (this.s.labelVisible) {
			var labelFactor =
				(heights.viewport - heights.labelHeight - heights.xbar) /
				heights.scroll;

			this.dom.label
				.html(
					this.s.dt.fnFormatNumber(
						parseInt(this.s.topRowFloat, 10) + 1
					)
				)
				.css('top', iScrollTop + iScrollTop * labelFactor)
				.css('display', 'block');
		}
	},

	/**
	 * Force the scrolling container to have height beyond that of just the
	 * table that has been drawn so the user can scroll the whole data set.
	 *
	 * Note that if the calculated required scrolling height exceeds a maximum
	 * value (1 million pixels - hard-coded) the forcing element will be set
	 * only to that maximum value and virtual / physical domain transforms will
	 * be used to allow Scroller to display tables of any number of records.
	 *  @returns {void}
	 *  @private
	 */
	_scrollForce: function () {
		var heights = this.s.heights;
		var max = 1000000;

		heights.virtual = heights.row * this.s.dt.fnRecordsDisplay();
		heights.scroll = heights.virtual;

		if (heights.scroll > max) {
			heights.scroll = max;
		}

		// Minimum height so there is always a row visible (the 'no rows found'
		// if reduced to zero filtering)
		this.dom.force.style.height =
			heights.scroll > this.s.heights.row
				? heights.scroll + 'px'
				: this.s.heights.row + 'px';
	}
});

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Statics
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

/**
 * Scroller default settings for initialisation
 *  @namespace
 *  @name Scroller.defaults
 *  @static
 */
Scroller.defaults = {
	/**
	 * Scroller uses the boundary scaling factor to decide when to redraw the table - which it
	 * typically does before you reach the end of the currently loaded data set (in order to
	 * allow the data to look continuous to a user scrolling through the data). If given as 0
	 * then the table will be redrawn whenever the viewport is scrolled, while 1 would not
	 * redraw the table until the currently loaded data has all been shown. You will want
	 * something in the middle - the default factor of 0.5 is usually suitable.
	 *  @type     float
	 *  @default  0.5
	 *  @static
	 */
	boundaryScale: 0.5,

	/**
	 * The display buffer is what Scroller uses to calculate how many rows it should pre-fetch
	 * for scrolling. Scroller automatically adjusts DataTables' display length to pre-fetch
	 * rows that will be shown in "near scrolling" (i.e. just beyond the current display area).
	 * The value is based upon the number of rows that can be displayed in the viewport (i.e.
	 * a value of 1), and will apply the display range to records before before and after the
	 * current viewport - i.e. a factor of 3 will allow Scroller to pre-fetch 1 viewport's worth
	 * of rows before the current viewport, the current viewport's rows and 1 viewport's worth
	 * of rows after the current viewport. Adjusting this value can be useful for ensuring
	 * smooth scrolling based on your data set.
	 *  @type     int
	 *  @default  9
	 *  @static
	 */
	displayBuffer: 9,

	/**
	 * Scroller will attempt to automatically calculate the height of rows for it's internal
	 * calculations. However the height that is used can be overridden using this parameter.
	 *  @type     int|string
	 *  @default  auto
	 *  @static
	 */
	rowHeight: 'auto',

	/**
	 * When using server-side processing, Scroller will wait a small amount of time to allow
	 * the scrolling to finish before requesting more data from the server. This prevents
	 * you from DoSing your own server! The wait time can be configured by this parameter.
	 *  @type     int
	 *  @default  200
	 *  @static
	 */
	serverWait: 200
};

Scroller.oDefaults = Scroller.defaults;

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Constants
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

/**
 * Scroller version
 *  @type      String
 *  @default   See code
 *  @name      Scroller.version
 *  @static
 */
Scroller.version = '2.4.3';

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Initialisation
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

// Attach a listener to the document which listens for DataTables initialisation
// events so we can automatically initialise
$(document).on('preInit.dt.dtscroller', function (e, settings) {
	if (e.namespace !== 'dt') {
		return;
	}

	var init = settings.oInit.scroller;
	var defaults = DataTable.defaults.scroller;

	if (init || defaults) {
		var opts = $.extend({}, init, defaults);

		if (init !== false) {
			new Scroller(settings, opts);
		}
	}
});

// Attach Scroller to DataTables so it can be accessed as an 'extra'
$.fn.dataTable.Scroller = Scroller;
$.fn.DataTable.Scroller = Scroller;

// DataTables 1.10 API method aliases
var Api = $.fn.dataTable.Api;

Api.register('scroller()', function () {
	return this;
});

// Undocumented and deprecated - is it actually useful at all?
Api.register('scroller().rowToPixels()', function (rowIdx, intParse, virtual) {
	var ctx = this.context;

	if (ctx.length && ctx[0].oScroller) {
		return ctx[0].oScroller.rowToPixels(rowIdx, intParse, virtual);
	}
	// undefined
});

// Undocumented and deprecated - is it actually useful at all?
Api.register('scroller().pixelsToRow()', function (pixels, intParse, virtual) {
	var ctx = this.context;

	if (ctx.length && ctx[0].oScroller) {
		return ctx[0].oScroller.pixelsToRow(pixels, intParse, virtual);
	}
	// undefined
});

// `scroller().scrollToRow()` is undocumented and deprecated. Use `scroller.toPosition()
Api.register(
	['scroller().scrollToRow()', 'scroller.toPosition()'],
	function (idx, ani) {
		this.iterator('table', function (ctx) {
			if (ctx.oScroller) {
				ctx.oScroller.scrollToRow(idx, ani);
			}
		});

		return this;
	}
);

Api.register('row().scrollTo()', function (ani) {
	var that = this;

	this.iterator('row', function (ctx, rowIdx) {
		if (ctx.oScroller) {
			var displayIdx = that
				.rows({ order: 'applied', search: 'applied' })
				.indexes()
				.indexOf(rowIdx);

			ctx.oScroller.scrollToRow(displayIdx, ani);
		}
	});

	return this;
});

Api.register('scroller.measure()', function (redraw) {
	this.iterator('table', function (ctx) {
		if (ctx.oScroller) {
			ctx.oScroller.measure(redraw);
		}
	});

	return this;
});

Api.register('scroller.page()', function () {
	var ctx = this.context;

	if (ctx.length && ctx[0].oScroller) {
		return ctx[0].oScroller.pageInfo();
	}
	// undefined
});


return DataTable;
}));


