/*!
 * Ext JS Library 4.0
 * Copyright(c) 2006-2011 Sencha Inc.
 * licensing@sencha.com
 * http://www.sencha.com/license
 */

const helpabout ='<center></br><table><tr><td><img src='+GLOBAL.BASE_URL+'static/DIRAC/KosmoUI/images/logo.png></br>Version &nbsp;: &nbsp;2.1.0</td><td><table><tr><td>Developper &nbsp;:</td><td>LI&nbsp;Xiabo</td></tr><tr><td></td><td>QIAN&nbsp;Zuxuan</td><tr></table><table><tr><td>Contact&nbsp;:</td><td>li.xiabo@gmail.com</td></tr><tr><td></td><td>zuxuan.qian@gmail.com</td><tr></table></td></tr></table></center>';

const changelog='<b>Changelog:</b></br>\
      <ul style="list-style-type:none">\
        <li>2015-08-11</li>\
        <ul style="list-style-type:disc">\
          <li>Enhanced UI</li>\
          <li>Change labels to icons</li>\
        </ul>\
        <li>2015-08-09</li>\
        <ul style="list-style-type:disc">\
          <li>Add multiproject functionnality</li>\
          <li>Add icons</li><li>Add info/help tab</li>\
        </ul>\
        <li>2015-02-12</li>\
        <ul style="list-style-type:disc">\
          <li>Initial version</li>\
        </ul>\
      </ul></br>';

const manual='<b>Manual:</b>\
      <ul>\
        <li>install project&lsquo;s directories under <i>kosmoui</i> directory in the user&lsquo;s home directory</li>\
        <li>every project should include following mandatory directories:\
          <ul style="list-style-type:none">\
            <li><i>ini</i></li>\
            <li><i>include</i></li>\
            <li><i>output</i></li>\
          </ul>\
          and a <i>job.jdl</i> file\
        </li>\
        <li><i>include</i> directory is read-only and can be empty. Files in this folder have to be tar gzipped files and named as <i>package.gz</i>\
        </li>\
      </ul>';

const issue='<b>Issues:</b>\
      <ul>\
        <li>The execution time of command depends on the charge of DIRAC Storage Element. Some operation might take very long time.\
        </li>\
      </ul>';

const helpnews=manual+issue+changelog;

Ext.define('DIRAC.KosmoUI.classes.KosmoUI', {
        extend : 'Ext.dirac.core.Module',

        requires : [ 'Ext.form.field.HtmlEditor', 'Ext.tab.*', 'Ext.panel.*', 'Ext.form.*' ],

        initComponent : function() {

                var me = this;

                if (GLOBAL.VIEW_ID == "desktop") {

                        me.launcher.title = "Kosmo UI";
                        me.launcher.maximized = false;
                        me.launcher.width = 850;
                        me.launcher.height = 500;

                }

                if (GLOBAL.VIEW_ID == "tabs") {

                        me.launcher.title = "Kosmo UI";
                        me.launcher.maximized = false;
                        me.launcher.width = 850;
                        me.launcher.height = 500;

                }

                Ext.apply(me, {
                        layout : 'fit',
                        items : [ me.editor ]
                });

                me.callParent(arguments);

        },

    buildUI: function() {
        var me = this;

            Ext.Ajax.useDefaultXhrHeader = false;
            Ext.Ajax.cors = true;
        
        var packchk='';

        me.tabbedPanel = new Ext.create('Ext.tab.Panel', {
            layout: 'fit',
            activeTab: 0,
            tabPosition: 'bottom',
            tabBar: {
                layout: {
                    type: 'hbox',
                    align: 'stretch'
                },
                height : 40,
                defaults: { flex: 1, padding:0 }
            },
        });

        me.jedit = new Ext.create('Ext.panel.Panel', {
            //title: '<div style="background-color:yellow;color:blue">job editor</div>',
            title: '<center><img src='+GLOBAL.BASE_URL+'static/DIRAC/KosmoUI/images/prepare-2.png width="36"></center>',
            layout: 'border',
            tooltip: 'Edit&nbsp;job&nbsp;parameters&nbsp;to&nbsp;send',
        });

        me.jman = new Ext.create('Ext.panel.Panel', {
            //title: '<div style="background-color:moccasin;color:blue">job manager</div>',
            title: '<center><img src='+GLOBAL.BASE_URL+'static/DIRAC/KosmoUI/images/moni.png width="36"></center>',
            layout: 'border',
            tooltip: 'Manage&nbsp;online&nbsp;jobs',
        });

        me.jproc = new Ext.create('Ext.panel.Panel', {
            //title: '<div style="background-color:khaki;color:blue">data manager</div>',
            title: '<center><img src='+GLOBAL.BASE_URL+'static/DIRAC/KosmoUI/images/dataExport.png width="36"></center>',
            layout: 'border',
            tooltip: "Manage&nbsp;data",
        });

        me.jhelp = new Ext.create('Ext.panel.Panel', {
            //title: '<div style="background-color:green;color:blue">about</div>',
            title: '<center><img src='+GLOBAL.BASE_URL+'static/DIRAC/KosmoUI/images/info.png width="36"></center>',
            layout: 'vbox',
            tooltip: 'Help&nbsp;and&nbsp;about&nbsp;this&nbsp;software',
            items: [{
                xtype:'panel',
                flex: 4,
                width: '100%',
                html: helpabout,
                bodyStyle: 'background: lightgray;',
            },{
                xtype:'panel',
                flex: 7,
                width: '100%',
                html: helpnews,
                autoScroll: true,
            }],
        });

        me.jeditini = new Ext.create('Ext.panel.Panel', {
            title: 'Ini editor',
            region: 'center',
            layout: {
                type: 'hbox',
                align: 'stretch',
            },
        });

        me.proj = new Ext.create('Ext.data.Store', {
            fields: [
               {name:'proj', type:'string'}
            ],
            proxy: {
                type: 'ajax',
                url: GLOBAL.BASE_URL + 'KosmoUI/proj',
            },
            sorters: [{
                property: 'proj',
                direction: 'ASC' // or 'ASC'
            }],
            autoLoad: true,
        });

        me.iniproj = new Ext.create('Ext.data.Store', {
            fields: [
               {name:'proj', type:'string'}
            ],
            proxy: {
                type: 'ajax',
                url: GLOBAL.BASE_URL + 'KosmoUI/proj',
            },
            sorters: [{
                property: 'proj',
                direction: 'ASC' // or 'ASC'
            }],
        });

        me.inipack = new Ext.create('Ext.data.Store', {
            fields: [
                {name: 'inclfile',     type: 'string'},
            ],
            proxy: {
                type: 'ajax',
                url: GLOBAL.BASE_URL + 'KosmoUI/getIncl',
            },
            sorters: [{
                property: 'name',
                direction: 'ASC' // or 'ASC'
            }],
            autoLoad: false,
            listeners: {
                load: function( sender, records, successful, operation, eOpts ) {
                    //console.log(records);
                    if (records.length>0) {
                        me.jeditinitree.show()
                    }
                    else{  
                        me.jeditinitree.hide()
                    }
                },
            },
        });

        me.iniincl = new Ext.create('Ext.data.TreeStore', {
            fields: [
                {name: 'name',     type: 'string'},
                {name: 'value',     type: 'string'},
            ],
            proxy: {
                type: 'ajax',
                url: GLOBAL.BASE_URL + 'KosmoUI/getIncl',
            },
            sorters: [{
                property: 'name',
                direction: 'ASC' // or 'ASC'
            }],
        });

        me.inisel = new Ext.create('Ext.data.Store', {
            fields: [
               {name:'inifile', type:'string'}
            ],
            proxy: {
                type: 'ajax',
                url: GLOBAL.BASE_URL + 'KosmoUI/getIni',
            },
            sorters: [{
                property: 'inifile',
                direction: 'ASC' // or 'ASC'
            }],
        });

        me.jeditprojsel = new Ext.create('Ext.panel.Panel',{
            title: '',
            flex: 1,
            layout: 'border',
            bodyStyle: 'background: lightgray;',
        });

        me.jeditproj = new Ext.create('Ext.form.field.ComboBox',{
            region: 'north',
            displayField: 'proj',
            store: me.proj,
            editable: false,
            emptyText: 'Select a project',
            //autoSelect: false,
            listeners: {
                select: function(combo, record, index) {
                    me.jeditinisel.enable();
                    me.inipropval.removeAll();
                    me.jeditiniprop.disable();
                    //me.jeditinitree.enable();
                    Ext.getCmp('pkg').reset();
                    me.iniproj.load({params:{proj:combo.getValue()}});
                    me.inipack.load({params:{proj:combo.getValue()}});
                    me.inisel.load({params:{proj:combo.getValue()}});
                    me.jeditjdl.disable();
                    me.jdl.load({params:{proj:combo.getValue()}});
                    //alert(combo.getValue())
                },
            },
        });

        me.jeditinisel = new Ext.create('Ext.grid.Panel', {
            store: me.inisel,
            //title: 'Select ini',
            region: 'center',
            allowDeselect: true,
            disabled: true,
            sortableColumns: false,
            autoScroll: true,
            forceFit: true,
            bbar: { 
                enableOverflow: true,
                items: ['->',{
                    text: '&#10133;', 
                    tooltip: 'new&nbsp;ini',
                    handler: function() {
                            Ext.Msg.prompt('Name', 'Please name the ini file:', function(btn, text){
                                if (btn == 'ok' && text != '') {
                                    me.inisel.add({inifile:text});
                                    Ext.Ajax.request({
                                        url : GLOBAL.BASE_URL + 'KosmoUI/manageFile',
                                        params: {'do':'new','name':text,'proj':me.jeditproj.getValue()},
                                        success : function(response) { },
                                        failure : function(response) { }
                                    });
                                }
                            });
                        }
                    },
                    {
                    text: '&#10134;', 
                    tooltip: 'remove&nbsp;ini',
                    handler: function() {
                            Ext.MessageBox.confirm('Cancel', 'Are you sure you want to delete '+me.jeditinisel.getSelectionModel().getSelection()[0].get('inifile')+'?', function(btn, text){
                            if (btn == 'yes' && text != '') {
                                Ext.Ajax.request({
                                        url : GLOBAL.BASE_URL + 'KosmoUI/manageFile',
                                        params: {'do':'del','name':me.jeditinisel.getSelectionModel().getSelection()[0].get('inifile'),'proj':me.jeditproj.getValue()},
                                        success : function(response) { },
                                        failure : function(response) { }
                                    });
                                }
                                me.inisel.remove(me.jeditinisel.getSelectionModel().getSelection()[0]);
                                me.jeditinisel.fireEvent('deselect');
                            });
                        }
                    },
                    {
                    text: '<div style="display: inline-block; font-size: 140%; -webkit-transform: rotate(90deg); -moz-transform: rotate(90deg); -o-transform: rotate(90deg);">&#x29C9;</div>',
                    tooltip: 'duplicate&nbsp;selected&nbsp;ini',
                    handler: function() {
                            Ext.Msg.prompt('Duplicate', 'Please name the duplicate ini file other than '+me.jeditinisel.getSelectionModel().getSelection()[0].get('inifile')+':', function(btn, text){
                            if (btn == 'ok' && text != '') {
                                me.inisel.add({inifile:text});
                                    Ext.Ajax.request({
                                        url : GLOBAL.BASE_URL + 'KosmoUI/manageFile',
                                        params: {'do':'dup','name':me.jeditinisel.getSelectionModel().getSelection()[0].get('inifile'),'dst':text,'proj':me.jeditproj.getValue()},
                                        success : function(response) { },
                                        failure : function(response) { }
                                    });
                            }
                        });
                        }
                    },'->',
                ]
            },
            columns: [
                { text: 'Select ini',  menuDisabled: true, dataIndex: 'inifile', sortable: true, },
            ],
            listeners: {
                select: function(selModel, record, index, options){
                    var msg = new Ext.LoadMask({target:me.jeditiniprop, msg:"Please wait..."});
                    msg.show();
                    Ext.Ajax.request({
                        url:GLOBAL.BASE_URL + 'KosmoUI/getIni',
                        params: {name:record.get('inifile'),proj:me.jeditproj.getValue()},
                        success:function(response){
                            var lines = response.responseText.split('\n');
                            //remove ini
                            me.inipropval.removeAll();
                            //remove pkg
                            packchk = '';
                            for (var i=0;i<lines.length;i++) {
                                if ((lines[i].indexOf('DEFAULT')!=-1)||(lines[i].indexOf('INCLUDE')!=-1)) {
                                    packchk += lines[i]+'\n';
                                }
                                else if (lines[i].indexOf("=")!=-1){
                                    var l = lines[i].split("=");      
                                    me.inipropval.add({"var":l[0],"val":l[1]});
                                }
                            }
                            synchro();
                            msg.hide();
                            msg.disable();
                            me.jeditiniprop.enable();
                        },
                        failure:function(response){console.log(response.responseText); },
                    });
                    me.jeditjdl.enable();
                    me.jdl.findRecord('name','Arguments').set('value',me.jdl.findRecord('name','Arguments').get('value').replace(new RegExp('^\"\s*[^\ |^\"]+'),'\"'+me.jeditinisel.getSelectionModel().getSelection()[0].get('inifile')));
                    me.jdl.findRecord('name','OutputPath').set('value',me.jdl.findRecord('name','OutputPath').get('value').replace(new RegExp('\/[^\/]*\/%'),'\/'+me.jeditinisel.getSelectionModel().getSelection()[0].get('inifile')+'\/%'));
                    me.jdl.findRecord('name','OutputData').set('value',me.jdl.findRecord('name','OutputData').get('value').replace(new RegExp('_[^_]+_%s','g'),'_'+me.jeditinisel.getSelectionModel().getSelection()[0].get('inifile')+'_%s'));
                    me.jdl.findRecord('name','OutputSandbox').set('value',me.jdl.findRecord('name','OutputSandbox').get('value').replace(new RegExp('_[^_]+_%s','g'),'_'+me.jeditinisel.getSelectionModel().getSelection()[0].get('inifile')+'_%s'));
                    me.jdl.findRecord('name','InputData').set('value',me.jdl.findRecord('name','InputData').get('value').replace(new RegExp('[^\/]+[.]ini'),me.jeditinisel.getSelectionModel().getSelection()[0].get('inifile')+'.ini'));
                    Ext.getCmp('jdl-name').setValue(me.jeditinisel.getSelectionModel().getSelection()[0].get('inifile'));
                },
                deselect: function(selModel, record, index, options){
                    me.inipropval.removeAll();
                    me.iniincl.getRootNode().cascadeBy(function(n){if (n.isLeaf()) n.parentNode.set('checked',false)});
                    me.jeditiniprop.disable();
                    me.jeditjdl.disable();
                },
            }
        });

        me.inipropval = new Ext.create('Ext.data.Store', {
            fields: ['var','val'],
            sorters: [{
                property: 'var',
                direction: 'ASC' // or 'ASC'
            }],
            listeners: {
                'add': function(store, records, index, eOpts ) {
                    me.jeditiniprop.getView().focusRow(index)
                },
            }
        });

        me.jdl = new Ext.create('Ext.data.Store', {
            fields: [
                {name:'name', type:'string'},
                {name:'value', type:'string'},
            ],
            proxy: {
                type: 'ajax',
                url: GLOBAL.BASE_URL + 'KosmoUI/jdl',
                //url: myurl + 'jdl',
                    extraParams: {
                            u: GLOBAL.APP.configData["user"]["username"],
                    g: GLOBAL.APP.configData["user"]["group"],
                            action: 'get',
                    },
            },
            sorters: [{
                property: 'name',
                direction: 'ASC' // or 'ASC'
            }],
        });

        me.joblist = new Ext.create('Ext.data.Store', {
            fields: ['job'],
            proxy: {
                type: 'ajax',
                url: GLOBAL.BASE_URL + 'KosmoUI/joblist',
                actionMethods: {
                    read: 'POST'
                },
            },
            sorters: [{
                property: 'job',
                direction: 'ASC' // or 'ASC'
            }],
            //autoLoad: true,
        });

        me.jdl.on('load',function (store, records, successful, eOpts ){
            Ext.getCmp('jdl-name').setValue(me.jdl.findRecord('name','JobGroup').get('value').replace(/\"/g,''));
            Ext.getCmp('jdl-node').setValue(me.jdl.findRecord('name','Parameters').get('value'));
        });

        me.jeditiniprop = new Ext.create('Ext.grid.Panel', {
            title: 'Custom values',
            flex: 2,
            allowDeselect: true,
            disabled: true,
            sortableColumns: false,
            autoScroll: true,
            forceFit: true,
            bbar:{
                enableOverflow: true, 
                items: ['->',{
                    text: '&#10133;/<div style="display: inline-block; -webkit-transform: rotate(-45deg); -moz-transform: rotate(-45deg); -o-transform: rotate(-45deg);">&#9906;</div>',
                    tooltip: 'add/find&nbsp;variable',
                    handler: function() {
                        Ext.Msg.prompt('Name', 'New variable name:', function(btn, text){
                            if (btn == 'ok' && text != '') {
                                if (me.inipropval.findRecord('var',text)==null) {
                                    me.inipropval.add({'var': text, 'val': ''});
                                    me.inipropval.sync();
                                    me.jeditiniprop.getView().focusRow(me.inipropval.indexOf(me.inipropval.findRecord('var',text)));
                                    updateRemoteIni();
                                }
                                else {
                                    me.jeditiniprop.getView().focusRow(me.inipropval.indexOf(me.inipropval.findRecord('var',text)));
                                }
                            }
                        });
                    },
                },{ 
                    text: '&#10134;',
                    tooltip: 'remove&nbsp;variable',
                    handler: function() {
                        Ext.Msg.confirm('Delete', 'Really remove the value of '+me.jeditiniprop.getSelectionModel().getSelection()[0].get('var')+' ?', function(btn){
                            if (btn == 'yes')
                                me.inipropval.remove(me.jeditiniprop.getSelectionModel().getSelection()[0]);
                                me.inipropval.sync();
                                updateRemoteIni();
                        });
                    },                    
                },'->'],
            },
            columns: [
                { text: 'Variable',  menuDisabled: true, dataIndex: 'var' , sortable: true,renderer: function(value, meta, record) {meta.tdAttr = 'data-qtip="'+value+'"';return value;},},
                { text: 'Value',  menuDisabled: true, dataIndex: 'val', field: {allowBlank: false },renderer: function(value, meta, record) {meta.tdAttr = 'data-qtip="'+value+'"';return value;},},
            ],
            store: me.inipropval,
            plugins: [
                Ext.create('Ext.grid.plugin.CellEditing', { 
                    clicksToEdit: 1,
                }),
            ],
            listeners: {
                edit: function(editor, e) {
                    me.inipropval.getAt(e.rowIdx).set(e.field, e.value);
                    me.inipropval.sync();
                    updateRemoteIni();
                },
                enable: function (e) {
                    if (me.jeditinitree.getSelectionModel().getSelection().length==1 && me.jeditinitree.getSelectionModel().getSelection()[0].isLeaf()) Ext.getCmp('inival').enable();
                    else Ext.getCmp('inival').disable();
                },
                disable: function(e) {
                    Ext.getCmp('inival').disable();
                },
            },
        });

        me.jeditinitree = new Ext.create('Ext.tree.Panel', {
            title: 'Include',
            flex: 2,
            rootVisible: false,
            hidden: true,
            useArrows: true,
            animate: true,
            sortableColumns: false,
            expanded: false,
            singleExpand: true,
            store: me.iniincl,
            autoScroll: true,
            forceFit: true,
            columns: [{
                xtype: 'treecolumn',
                text: 'Package',
                sortable: true,
                menuDisabled: true,
                dataIndex: 'name',
                renderer : function(value, meta, record) {
                    if (record.isLeaf())
                        meta.style = 'color: grey';
                    else {
                        meta.style = 'font-weight: bold';
                    }
                    meta.tdAttr = 'data-qtip="'+value+'"';
                    return value;
                },
            },{
                text: 'Value',
                menuDisabled: true,
                dataIndex: 'value',
                renderer : function(value, meta, record) {
                    if (record.isLeaf())
                        meta.style = 'color: grey';
                    meta.tdAttr = 'data-qtip="'+value+'"';
                    return value;
                },
            }],
            listeners: {
                checkchange: function (){
                    updateRemoteIni();
                },
                select: function (tree, record, eOpts ){
                    if (record.isLeaf() && !me.jeditiniprop.isDisabled()) Ext.getCmp('inival').enable();
                    else Ext.getCmp('inival').disable();
                },
            },
            tbar: [
                {
                    xtype: 'combobox',
                    flex: 1,
                    id: 'pkg',
                    store: me.inipack,
                    editable:false,
                    displayField: 'inclfile',
                    queryMode: 'local',
                    emptyText: 'Include package',
                    listeners: {
                        select: function(combo, record, index) {
                            me.iniincl.load({params:{incl:combo.getValue(),proj:me.jeditproj.getValue()}});
                        }
                    },
                },
            ],
            lbar: ['->',
                {
                    xtype: 'button',
                    text: '&#x2770;',
                    tooltip:'insert&nbsp;variable&nbsp;to&nbsp;ini',
                    id: 'inival',
                    disabled: true,
                    listeners: {
                        click: function() {
                            //console.log(me.jeditinitree.getSelectionModel().getSelection()[0].get('name'));
                            if (me.inipropval.findRecord('var',me.jeditinitree.getSelectionModel().getSelection()[0].get('name'))==null) {
                                me.inipropval.add({'var': me.jeditinitree.getSelectionModel().getSelection()[0].get('name'), 'val': ''});
                                me.inipropval.sync();
                                updateRemoteIni();
                            }
                            else {
                                me.jeditiniprop.getView().focusRow(me.inipropval.indexOf(me.inipropval.findRecord('var',me.jeditinitree.getSelectionModel().getSelection()[0].get('name'))))
                            }
                        },
                    },
                },'->',
            ],
        });

        me.iniincl.on('load',function ( store, records, successful, operation, eOpts ) {
            if (successful) {
                synchro();
            }
        });

        function synchro() {
            var lines = packchk.split('\n');
            if (Ext.getCmp('pkg').getValue()) {
                var p = Ext.getCmp('pkg').getValue().split('.')[0]
                for (var i=0;i<lines.length;i++) {
                   if (lines[i].match(new RegExp(p,"g"))) {
                       var l=lines[i].replace("DEFAULT("+p+'/',"").replace("INCLUDE("+p+'/',"").replace(".ini)","").split("/");
                       //console.log(l);
                       me.iniincl.getRootNode().findChild("name",l[l.length-1],true).set('checked',true);
                    }
                }
            }
        }

        me.jeditsend = new Ext.create('Ext.button.Button', {
            text: '<div style="font-weight: bold;">Send job</div>',
            handler : function() {
                if (me.jeditinisel.getSelectionModel().getSelection()[0]) {
                        Ext.MessageBox.confirm('Warning', 'Ready to send job \?',function(btn) {
                            if (btn == 'yes') {
                                sendJob();
                            }
                        });
                }
                else {
                    Ext.MessageBox.alert('Notify', 'Please select a ini first.');
                }
            }
        });

        me.jeditjdl = new Ext.create('Ext.panel.Panel', {
            title: 'Job description',
            region: 'south',
            disabled: true,
            layout: {
                type: 'hbox',
                align: 'stretch',
            },
            defaults: {flex:1},
        });

        me.jeditjdlset = new Ext.create('Ext.button.Button', {
            text: 'Other settings...',
            handler: function() {
                Ext.create('Ext.window.Window', {
                    title: 'Job Description Language settings',
                    height: 400,
                    width: 600,
                    layout: 'fit',
                    modal: true,
                    items: [{
                        xtype: 'gridpanel',
                        store: me.jdl,
                        forceFit: true,
                        autoScroll: true,
                        columns: [{
                            dataIndex: 'name',
                            text: 'Parameter',
                            sortable: true,
                            menuDisabled: true,
                        }, {
                            dataIndex: 'value',
                            text: 'Value',
                            menuDisabled: true,
                            flex: 1,
                            renderer: function(value, meta, record) {
                                meta.style = 'white-space:normal; color: grey';
                                return value;
                            },
                            field: {allowBlank: true},
                        }],
                        plugins: [
                            Ext.create('Ext.grid.plugin.CellEditing', { 
                                clicksToEdit: 1,
                            }),
                        ],
                        listeners: {
                            edit: function(editor, e) {
                                me.jdl.getAt(e.rowIdx).set(e.field, e.value);
                            }
                        }
                    }],
                    buttons: [{
                        text: 'Ok',
                        handler: function() {
                            Ext.getCmp('jdl-name').setValue(me.jdl.findRecord('name','JobGroup').get('value').replace(/\"/g,''));
                            Ext.getCmp('jdl-node').setValue(me.jdl.findRecord('name','Parameters').get('value'));
                            this.up('window').close();
                        },
                    }, {
                        text: 'Cancel',
                        handler: function() {this.up('window').close()},
                    }],
                    buttonAlign : 'center',
                }).show();
            },
        });

        me.jeditjdl.add([{
            xtype: 'textfield',
            fieldLabel: 'Name',
            style: 'backgroundColor: lightgray;',
            labelAlign:'right',
            id: 'jdl-name',
            listeners: {
                change: function(editor, e) {
                    me.jdl.findRecord('name','JobGroup').set('value','"'+e+'"');
                    me.jdl.findRecord('name','OutputPath').set('value',me.jdl.findRecord('name','OutputPath').get('value').replace(new RegExp('\/[^\/]*\/%'),'\/'+e+'\/%'));
                }
            }
        },{
            xtype:'numberfield',
            fieldLabel:'Node',
            //value: 1,
            style: 'backgroundColor: lightgray;',
            minValue: 1,
            id: 'jdl-node',
            labelAlign:'right',
            listeners: {change: function(editor, e) {me.jdl.findRecord('name','Parameters',0,0,1).set('value', e);/*me.jdl.sync();updateJdl();*/} }
        },me.jeditjdlset,me.jeditsend]);

        me.jmancmd = new Ext.create('Ext.panel.Panel', {
            title: 'Commands',
            disabled: true,
            region: 'center',
            bodyStyle: 'background: lightgray;',
            layout: {type:'vbox',align:'stretch'},
            defaults: {flex:1},
            items: [{
                xtype: 'button',
                text: '<center><img src='+GLOBAL.BASE_URL+'static/DIRAC/KosmoUI/images/summary.png width="36"></center>',
                tooltip: 'job&nbsp;summary',
                handler: function() {
                    logMe('<table width="100%" cellspacing="0" cellpadding="0"><tr><td align="left"><div style="color:MediumAquamarine;font-weight:bold;font-style: italic;text-decoration: underline; ">Summary</div></td><td align="right">'+(new Date()).toUTCString()+'</td></tr></table>');
                    sendCmd('summary');
                }
            }, {
                xtype: 'button',
                text: '<center><img src='+GLOBAL.BASE_URL+'static/DIRAC/KosmoUI/images/detail.png width="36"></center>',
                tooltip: 'job&nbsp;details',
                handler: function() {
                    logMe('<table width="100%" cellspacing="0" cellpadding="0"><tr><td align="left"><div style="color:MediumAquamarine;font-weight:bold;font-style: italic;text-decoration: underline; ">Detail</div></td><td align="right">'+(new Date()).toUTCString()+'</td></tr></table>');
                    sendCmd('detail');
                }
            }, /*{
                xtype: 'button',
                text: 'receive',
                handler: function() {
                    logMe('<table width="100%" cellspacing="0" cellpadding="0"><tr><td align="left"><div style="color:MediumAquamarine;font-weight:bold;font-style: italic;text-decoration: underline; ">Receive</div></td><td align="right">'+(new Date()).toUTCString()+'</td></tr></table>');
                    sendCmd('receive');
                }
            },*/ {
                xtype: 'button',
                text: '<center><img src='+GLOBAL.BASE_URL+'static/DIRAC/KosmoUI/images/delete-s.png width="36"></center>',
                tooltip: 'delete&nbsp;this&nbsp;job',
                handler: function() {                    
                    Ext.Msg.confirm('Delete jobgroup', 'Are you sure you want to delete the '+me.jmansel.getValue()+' JobGroup ?', function(btn, text){
                        if (btn == 'yes'){
                            logMe('<table width="100%" cellspacing="0" cellpadding="0"><tr><td align="left"><div style="color:MediumAquamarine;font-weight:bold;font-style: italic;text-decoration: underline; ">Delete</div></td><td align="right">'+(new Date()).toUTCString()+'</td></tr></table>');
                            sendCmd('delete');
                                    }
                            });
                }
            }],
        });


        me.jmansel = new Ext.create('Ext.form.field.ComboBox',{
            region: 'north',
            displayField: 'job',
            store: me.joblist,
            editable: true,
            emptyText: 'Select a job',
            autoSelect: false,
            listeners: {
                specialkey: function(field, e) {
                    if (e.getKey() === e.ENTER || e.getKey() === e.TAB) {
                        me.jmansel.fireEvent('select',field,null,0);
                    }
                    else {
                        me.jmancmd.disable();
                    }
                },
                select: function(combo, record, index) {
                    me.jmancmd.enable();
                    //me.jmanlog.add({html:'<p style="color:blue;font-weight:bold;">Select job : '+combo.getValue()+'</p><br>',xtype:'label'});
                    logMe('<hr><table width="100%" cellspacing="0" cellpadding="0"><tr><td align="left"><div style="color:blue;font-weight:bold;">Select job : '+combo.getValue()+'</div></td><td align="right">'+(new Date()).toUTCString()+'</td></tr></table><hr>');
                },
                change: function(combo, value) {
                    //if (value===null)
                        me.jmancmd.disable();
                    //else
                    //    me.jmancmd.enable();
                },
                expand: function(combo, value) {
                    me.joblist.reload();
                }
            },
        });

        me.jmanpanel = new Ext.create('Ext.panel.Panel', {
            title: 'Manager',
            region: 'west',
            layout: 'border',
            width: 160,
            items: [me.jmansel, me.jmancmd],
        });

        function logMe(content) {
            me.jmanlog.update({data: content});
            me.jmanlog.body.scroll('b',Infinity,true);
        }

        function updateRemoteIni() {
            var obj = "";
            if (Ext.getCmp('pkg').getValue()) {
                var lines = packchk.split('\n');
                for (i = 0;i<lines.length;i++) {
                    if (!lines[i].match(new RegExp(Ext.getCmp('pkg').getValue().split('.')[0],'g'))) {
                        obj += lines[i]+'\n';
                        //console.log('match : '+lines[i])
                    }
                }
                packchk = obj;
                me.iniincl.getRootNode().cascadeBy(function(n){
                    if (n.get('checked')) {
                        packchk+="DEFAULT("+Ext.getCmp('pkg').getValue().split('.')[0]+'/'+n.getPath('name').substring(2)+".ini)\n"
                    }
                });
            }
            obj = packchk.replace(/^\s*[\r\n]/gm,'');
            me.inipropval.each(function(rec){obj+=rec.get('var')+"="+rec.get('val')+"\n"});
            //console.log(obj);
            Ext.Ajax.request({
                url : GLOBAL.BASE_URL + 'KosmoUI/updateIni',
                method : 'POST', 
                params: {'name':me.jeditinisel.getSelectionModel().getSelection()[0].get('inifile'),'proj':me.jeditproj.getValue()},
                jsonData: obj,
                success : function(response) {
                    console.log(response.responseText);
                },
                failure : function(response) {
                    console.log(response.responseText);
                }
            });
        }

        function updateJdl() {
            var obj = "";
            me.jdl.each(function(rec){obj+=rec.get('name')+"="+rec.get('value')+"\n"});
            Ext.Ajax.request({
                url : GLOBAL.BASE_URL + 'KosmoUI/updateJdl',
                        method: 'POST',
                        params: {
                            u: GLOBAL.APP.configData["user"]["username"],
                            g: GLOBAL.APP.configData["user"]["group"],
                            action: 'update',
                            proj: me.jeditproj.getValue(),
                        },
                jsonData: obj,
                success : function(response) {
                    console.log(response.responseText);
                },
                failure : function(response) {
                    console.log(response.responseText);
                }
            });
        }

        function sendJob() {
            updateJdl();
            //if (me.joblist.find('job',Ext.getCmp('jdl-name').getValue()) == -1) {
                //Ext.Ajax.request({url:'KosmoUI/joblist',params:{action:'add',job:Ext.getCmp('jdl-name').getValue()}});
                //me.joblist.add({job:Ext.getCmp('jdl-name').getValue()});
            //}
            Ext.Ajax.request({
                url : GLOBAL.BASE_URL + 'KosmoUI/sendJob',
                params: {'inifile':me.jeditinisel.getSelectionModel().getSelection()[0].get('inifile'),'proj':me.jeditproj.getValue()},
                success : function(response) {
                    Ext.MessageBox.alert('Message',response.responseText);
                    Ext.Ajax.request({url:'KosmoUI/joblist' });
                },
                failure : function(response) {}
            });
        }

        me.jmanlog = new Ext.create('Ext.panel.Panel',{
            title: 'Log',
            region: 'center',
            tpl: '{data}',
            tplWriteMode: 'append',
            autoScroll: true,
            header: {
                titlePosition: 0, 
                padding: '0 0 0 5',
                items: [{
                    xtype: 'image',
                    src: 'static/DIRAC/KosmoUI/images/ajax-loader.gif',
                    height: 20,
                    width: 16,
                    hidden: true,
                }, {
                    xtype: 'button',
                    text: 'clear',
                    align: 'right',
                    handler: function() {
                        me.jmanlog.update("");
                    }
                }],
            },
        });

        function sendCmd(cmd) {
            me.jmanlog.header.items.items[1].show();
            Ext.Ajax.request({
            url : GLOBAL.BASE_URL + 'KosmoUI/diracDo',
            params: {'cmd':cmd,'name':me.jmansel.getValue()},
                success : function(response) {
                    logMe(response.responseText.split("\n").join("<br>"));
                    logMe("<br>");
                    me.jmanlog.header.items.items[1].hide();
                    if (cmd=='delete') {
                        me.jmansel.reset();
                    }
                },
                failure : function(response) {
                    logMe(response.responseText);
                    me.jmanlog.header.items.items[1].hide();
                }
            });
        }

        me.datalist =  new Ext.create('Ext.data.Store', {
            fields: ['data'],
            proxy: {
                type: 'ajax',
                url: GLOBAL.BASE_URL + 'KosmoUI/datalist',
            },
            sorters: [{
                property: 'data',
                direction: 'ASC' // or 'ASC'
            }],
        });

        me.datatree =  new Ext.create('Ext.data.TreeStore', {
            fields: ['label','path'],
            sorters: [{
                property: 'label',
                direction: 'ASC' // or 'ASC'
            }],
        });

        me.jprocsel = new Ext.create('Ext.form.field.ComboBox',{
            region: 'north',
            queryMode: 'local',
            displayField: 'data',
            store: me.datalist,
            editable: false,
            emptyText: 'Select a datum',
            listeners: {
                select: function(combo, record, index) {
                    me.jprocstat.body.update('');
                    me.jprocshow.body.update('');
                    me.jproccmd.enable();
                    me.jproctree.enable();
                    me.jproccmd.items.items[0].setParams({'path':'/'+combo.getValue(),'proj':Ext.getCmp('tree').getValue()})
                    me.datatree.setProxy(
                        new Ext.data.proxy.Ajax({
                            url:GLOBAL.BASE_URL + 'KosmoUI/datatree',
                            extraParams:{'folder':combo.getValue(),'proj':Ext.getCmp('tree').getValue()},
                            reader: {type:'json'},
                        })
                    );
                    me.datatree.reload();
                },
                change: function(combo, value) {
                    me.jproccmd.disable();
                    me.jproctree.disable();
                    me.jproctree.getSelectionModel().deselectAll();
                },
                expand: function(combo, value) {
                    me.datalist.reload();
                }
            },
        });

        me.jproctree =  new Ext.create('Ext.tree.Panel', {
            //title: 'Data tree',
            region: 'center',
            rootVisible: false,
            disabled: true,
            useArrows: true,
            animate: true,
            sortableColumns: false,
            singleExpand: true,
            expanded: false,
            allowDeselect: true, 
            store: me.datatree,
            autoScroll: true,
            forceFit: true,
            columns: [{
                xtype: 'treecolumn',
                text: '<b>Data tree</b>',
                sortable: true,
                menuDisabled: true,
                dataIndex: 'label',
                renderer : function(value, meta, record) {
                    if (record.isLeaf())
                        meta.style = 'color: grey';
                    else {
                        meta.style = 'font-weight: bold';
                    }
                    return value;
                },
            }],
            listeners: {
                select: function (selModel, record, index, options){
                    me.jproccmd.items.items[0].setParams({'path':record.get("path")+'/'+record.get("label"),'proj':Ext.getCmp('tree').getValue()})
                    var msg = new Ext.LoadMask(me.jprocpan, {msg:"Please wait..."});
                    msg.show();
                    Ext.Ajax.request({
                        url : GLOBAL.BASE_URL + 'KosmoUI/status',
                        params: {'path':record.get("path")+'/'+record.get("label"),'proj':Ext.getCmp('tree').getValue()},
                        success : function(response) {
                            me.jprocstat.setDisabled(false);
                            if (!record.isLeaf())
                                me.jprocstat.body.update(response.responseText);
                            else {
                                dec = Ext.decode( response.responseText);
                                status = '<table style="border:1px solid black"><tr>';
                                for (k in dec)
                                    status += '<td style="border:1px solid black" align="center">'+k+'</td>';
                                status += '</tr><tr>';
                                for (k in dec)
                                    status += '<td style="border:1px solid black" align="center">'+dec[k]+'</td>';
                                status += '</tr></table>';
                                me.jprocstat.body.update(status);
                            }
                        },
                        failure : function(response) {
                        }
                    });
                    Ext.Ajax.request({
                        url : GLOBAL.BASE_URL + 'KosmoUI/preview',
                        params: {'path':record.get("path")+'/'+record.get("label"),'proj':Ext.getCmp('tree').getValue()},
                        success : function(response) {
                            me.jprocshow.setDisabled(false);
                            me.jprocshow.body.update(response.responseText);
                        },
                        failure : function(response) {
                        },
                        callback: function(response) {
                            msg.hide();
                            msg.disable();
                            me.jprocpan.setDisabled(false);
                        }
                    });
                },
                deselect: function (selModel, record, index, options){
                    me.jproccmd.items.items[0].setParams({'path':'/'+me.jprocsel.getValue(),'proj':Ext.getCmp('tree').getValue()})
                    me.jprocstat.body.update('');
                    me.jprocstat.setDisabled(true);
                    me.jprocshow.body.update('');
                    me.jprocshow.setDisabled(true);
                }
            }
        });

        me.jproccmd = new Ext.create('Ext.panel.Panel', {
            title: 'Commands',
            disabled: true,
            region: 'south',
            bodyStyle: 'background: lightgray;',
            layout: {type:'hbox',align:'stretch'},
            defaults: {flex:1},
            items: [{
                xtype: 'button',
                text: 'Download',
                tooltip: 'Download the selected<br>file/directory or<br>unselect for all JobGroup<br>in .zip archive',
                href: GLOBAL.BASE_URL + 'KosmoUI/get',
                hrefTarget: '_self',
                handler: function() {
                    /*msg = new Ext.LoadMask(me, {msg:"Processing..."});
                    msg.show();
                    p = '';
                    console.log(me.jproctree.getSelectionModel().getSelection())
                    if (me.jproctree.getSelectionModel().getSelection()[0]==null) {
                        p = '/'+me.jprocsel.getValue()
                    }
                    else {
                        p = me.jproctree.getSelectionModel().getSelection()[0].get('path')+'/'+me.jproctree.getSelectionModel().getSelection()[0].get('label')
                    }
                    console.log(p);
                    Ext.Ajax.request({
                        url: GLOBAL.BASE_URL + 'KosmoUI/get',
                        callback: function() {
                            msg.hide();
                            msg.disable();
                            me.setDisabled(false);
                        },
                        params: {'path': p}
                    });*/
                }
            }, {
                xtype: 'button',
                text: 'Delete',
                tooltip: 'Delete the selected<br>file/directory or<br>unselect to<br>remove all JobGroup',
                handler: function() {
                    p = '';
                    reload = '';
                    if (me.jproctree.getSelectionModel().getSelection()[0]==null) {
                        p = '/'+me.jprocsel.getValue()
                        reload = true;
                    }
                    else {
                        p = me.jproctree.getSelectionModel().getSelection()[0].get('path')+'/'+me.jproctree.getSelectionModel().getSelection()[0].get('label')
                        reload = false;
                    }
                    Ext.Msg.confirm('Remove file(s)', 'Are you sure you want to remove <b>'+p+'</b> (and all its subdirectory) ?', function(btn, text){
                        if (btn == 'yes'){
                            msg = new Ext.LoadMask(me, {msg:"Processing..."});
                            msg.show();
                            Ext.Ajax.request({
                                url: GLOBAL.BASE_URL + 'KosmoUI/rmtree',
                                callback: function() {
                                    me.jprocshow.body.update('');
                                    me.jprocshow.setDisabled(true);
                                    me.jprocstat.body.update('');
                                    me.jprocstat.setDisabled(true);
                                    msg.hide();
                                    msg.disable();
                                    me.setDisabled(false);
                                    if (reload) {
                                        me.datalist.removeAll();
                                        me.datatree.getRootNode().removeAll();
                                        me.jprocsel.reset();
                                    }
                                    else {
                                        me.datatree.reload();
                                    }
                                },
                                params: {'path': p,'proj':Ext.getCmp('tree').getValue()}
                            });
                        }
                    });
                }
            }],
        });

        me.jprocstat = new Ext.create('Ext.panel.Panel', {
            title: 'Metadata',
            disabled: true,
            autoScroll: true,
            region: 'north',
            height: 120,
            bodyStyle: 'background: lightgray;',
        });

        me.jprocshow = new Ext.create('Ext.panel.Panel', {
            title: 'Content',
            region: 'center',
            layout: {type:'vbox',align:'stretch'},
            autoScroll: true,
            disabled: true,
            bodyStyle: 'background: lightgray;',
        });

        me.jprocdata = new Ext.create('Ext.panel.Panel', {
            title: 'Data',
            region: 'east',
            layout: 'border',
            width: 200,
            items: [me.jprocsel, me.jproctree, me.jproccmd],
            tbar: {
                xtype:'combobox',
                flex:1,
                id: 'tree',
                displayField: 'proj',
                editable:false,
                store:me.proj,
                emptyText:'select a project',
                listeners: {
                    select: function( combo, records, eOpts ) {
                        me.jprocsel.reset();
                        me.datalist.load({params:{proj:combo.getValue()}})
                        me.jproctree.getRootNode().removeAll();;
                    }
                },
            },
        });

        me.jprocpan = new Ext.create('Ext.panel.Panel',{
            //title: '',
            region: 'center',
            layout: 'border',
            bodyStyle: 'background: lightgray;',
            items: [me.jprocstat,me.jprocshow],
        });

        me.jeditprojsel.add([me.jeditproj,me.jeditinisel]);

        me.jeditini.add([me.jeditprojsel,me.jeditiniprop,me.jeditinitree]);

        me.jedit.add([me.jeditini,me.jeditjdl]);

        me.jman.add([me.jmanpanel,me.jmanlog]);

        me.jproc.add([me.jprocpan,me.jprocdata]);

        //me.jhelp.add([me.jprocpan,me.jprocdata]);

        me.tabbedPanel.add(me.jedit,me.jman,me.jproc,me.jhelp);

        me.add(me.tabbedPanel);
    },
});
