/*!
 * Ext JS Library 4.0
 * Copyright(c) 2006-2011 Sencha Inc.
 * licensing@sencha.com
 * http://www.sencha.com/license
 */

var inipath="batch1/";
var myurl='https://marlili.in2p3.fr/py/cosmohandler.py/'

Ext.define('DIRAC.Cosmomc.classes.Cosmomc', {
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

        me.tabbedPanel = new Ext.create('Ext.tab.Panel', {
            layout: 'fit',
            activeTab: 0,
            tabPosition: 'bottom',
            tabBar: {
                layout: {
                    type: 'hbox',
                    align: 'stretch'
                },
                defaults: { flex: 1, padding:0 }
            },
        });

        me.jedit = new Ext.create('Ext.panel.Panel', {
            title: '<div style="background-color:yellow;color:blue">job editor</div>',
            layout: 'border',
        });

        me.jman = new Ext.create('Ext.panel.Panel', {
            title: '<div style="background-color:moccasin;color:blue">job manager</div>',
            layout: 'border',
        });

        me.jproc = new Ext.create('Ext.panel.Panel', {
            title: '<div style="background-color:khaki;color:blue">data manager</div>',
            layout: 'border',
        });

        me.jeditini = new Ext.create('Ext.panel.Panel', {
            title: 'Ini editor',
            region: 'center',
            layout: {
                type: 'hbox',
                align: 'stretch',
            },
        });

        me.iniincl = new Ext.create('Ext.data.TreeStore', {
            fields: [
                {name: 'name',     type: 'string'},
                {name: 'value',     type: 'string'},
            ],
            proxy: {
                type: 'ajax',
                url: GLOBAL.BASE_URL + 'Cosmomc/getIncl',
                //url: 'https://marlili.in2p3.fr/py/cosmohandler.py/getIncl',
                //url: myurl+'getIncl',
	        //useDefaultXhrHeader: false,
		//cors: true,
            },
            sorters: [{
                property: 'name',
                direction: 'ASC' // or 'ASC'
            }],
            autoLoad: true,
        });

        me.inisel = new Ext.create('Ext.data.Store', {
            fields: [
               {name:'inifile', type:'string'}
            ],
            proxy: {
                type: 'ajax',
                url: GLOBAL.BASE_URL + 'Cosmomc/getIni',
            },
            sorters: [{
                property: 'inifile',
                direction: 'ASC' // or 'ASC'
            }],
            autoLoad: true,
        });

        me.jeditinisel = new Ext.create('Ext.grid.Panel', {
            store: me.inisel,
            //title: 'Select ini',
            flex: 1,
            allowDeselect: true,
            sortableColumns: false,
            autoScroll: true,
            forceFit: true,
            bbar: { 
                enableOverflow: true,
                items: [{
                    text: 'New', 
                    handler: function() {
                            Ext.Msg.prompt('Name', 'Please name the ini file:', function(btn, text){
                                if (btn == 'ok' && text != '') {
                                    me.inisel.add({inifile:text});
                                    Ext.Ajax.request({
                                        url : GLOBAL.BASE_URL + 'Cosmomc/manageFile',
                                        params: {'do':'new','name':text},
                                        success : function(response) { },
                                        failure : function(response) { }
                                    });
                                }
                            });
                        }
                    },
                    {
                    text: 'Remove', 
                    handler: function() {
                            Ext.MessageBox.confirm('Cancel', 'Are you sure you want to delete '+me.jeditinisel.getSelectionModel().getSelection()[0].get('inifile')+'?', function(btn, text){
                            if (btn == 'yes' && text != '') {
                                Ext.Ajax.request({
                                        url : GLOBAL.BASE_URL + 'Cosmomc/manageFile',
                                        params: {'do':'del','name':me.jeditinisel.getSelectionModel().getSelection()[0].get('inifile')},
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
                    text: 'Duplicate',
                    handler: function() {
                            Ext.Msg.prompt('Duplicate', 'Please name the duplicate ini file other than '+me.jeditinisel.getSelectionModel().getSelection()[0].get('inifile')+':', function(btn, text){
                            if (btn == 'ok' && text != '') {
                                me.inisel.add({inifile:text});
                                    Ext.Ajax.request({
                                        url : GLOBAL.BASE_URL + 'Cosmomc/manageFile',
                                        params: {'do':'dup','name':me.jeditinisel.getSelectionModel().getSelection()[0].get('inifile'),'dst':text},
                                        success : function(response) { },
                                        failure : function(response) { }
                                    });
                            }
                        });
                        }
                    },
                ]
            },
            columns: [
                { text: 'Select',  menuDisabled: true, dataIndex: 'inifile', sortable: true, },
            ],
            listeners: {
                select: function(selModel, record, index, options){
                    Ext.Ajax.request({
                        url:GLOBAL.BASE_URL + 'Cosmomc/getIni',
                        params: {'name':record.get('inifile')},
                        success:function(response){
                            var lines = response.responseText.split('\n');
                            //remove ini
                            me.inipropval.removeAll();
                            //remove pkg
                            me.jeditinitree.collapseAll();
                            me.iniincl.getRootNode().cascadeBy(function(n){if (n.isLeaf()) n.parentNode.set('checked',false)});
                            for (var i=0;i<lines.length;i++) {
                                if ((lines[i].indexOf('DEFAULT')!=-1)||(lines[i].indexOf('INCLUDE')!=-1)) {
                                    var l=lines[i].replace("DEFAULT("+inipath,"").replace("INCLUDE("+inipath,"").replace(".ini)","").split("/");
                                    var ini = me.iniincl.getRootNode();
                                    for (var path=0; path<l.length; path++) {
                                        ini = ini.findChild("name",l[path]);
                                    }
                                    //if (ini.firstChild) ini.expand();
                                    ini.set('checked',true);
                                }
                                else if (lines[i].indexOf("=")!=-1){
                                    var l = lines[i].split("=");      
                                    me.inipropval.add({"var":l[0],"val":l[1]});
                                }
                            }
                        },
                        failure:function(response){console.log(response.responseText); },
                    });
                    //alert(me.jdl.findRecord('name','InputSandbox').get('value').replace(new RegExp('\"[a-zA-Z_]+\.ini\"'),'"'+me.jeditinisel.getSelectionModel().getSelection()[0].get('inifile')+'.ini"'));
                    me.jdl.findRecord('name','Arguments').set('value','"'+me.jeditinisel.getSelectionModel().getSelection()[0].get('inifile')+'"');
                    me.jdl.findRecord('name','OutputPath').set('value',me.jdl.findRecord('name','OutputPath').get('value').replace(new RegExp('[^\/]+\/%'),me.jeditinisel.getSelectionModel().getSelection()[0].get('inifile')+'\/%'));
                    me.jdl.findRecord('name','InputData').set('value',me.jdl.findRecord('name','InputData').get('value').replace(new RegExp('[^\/]+[.]ini'),me.jeditinisel.getSelectionModel().getSelection()[0].get('inifile')+'.ini'));
                    me.jeditiniprop.enable();
                    me.jeditinitree.enable();
                    Ext.getCmp('jdl-name').setValue(me.jeditinisel.getSelectionModel().getSelection()[0].get('inifile'));
                },
                deselect: function(selModel, record, index, options){
                    me.inipropval.removeAll();
                    me.iniincl.getRootNode().cascadeBy(function(n){if (n.isLeaf()) n.parentNode.set('checked',false)});
                    me.jeditiniprop.disable();
                    me.jeditinitree.collapseAll();
                    me.jeditinitree.disable();
                },
            }
        });

        me.inipropval = new Ext.create('Ext.data.Store', {
            fields: ['var','val'],
            sorters: [{
                property: 'var',
                direction: 'ASC' // or 'ASC'
            }],
        });

        me.jdl = new Ext.create('Ext.data.Store', {
            fields: [
                {name:'name', type:'string'},
                {name:'value', type:'string'},
            ],
            proxy: {
                type: 'ajax',
                url: GLOBAL.BASE_URL + 'Cosmomc/jdl',
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
            autoLoad: true,
        });

        me.joblist = new Ext.create('Ext.data.Store', {
            fields: ['job'],
            proxy: {
                type: 'ajax',
                url: GLOBAL.BASE_URL + 'Cosmomc/joblist',
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
            /*selModel: {
                selType: 'cellmodel',
            },*/
            bbar:{
                enableOverflow: true, 
                items: [{
                    text: 'Add',
                    handler: function() {
                        Ext.Msg.prompt('Name', 'New variable name:', function(btn, text){
                            //    alert('toto');
                            if (btn == 'ok' && text != '')
                                me.inipropval.add({'var': text, 'val': ''});
                                me.inipropval.sync();
                                updateRemoteIni();
                        });
                    },
                },{ 
                    text: 'Remove',
                    handler: function() {
                        Ext.Msg.confirm('Delete', 'Really remove the value of '+me.jeditiniprop.getSelectionModel().getSelection()[0].get('var')+' ?', function(btn){
                            if (btn == 'yes')
                                me.inipropval.remove(me.jeditiniprop.getSelectionModel().getSelection()[0]);
                                me.inipropval.sync();
                                updateRemoteIni();
                        });
                    },                    
                }],
            },
            columns: [
                { text: 'Variable',  menuDisabled: true, dataIndex: 'var' , sortable: true,},
                { text: 'Value',  menuDisabled: true, dataIndex: 'val', field: {allowBlank: false }},
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
                }
            }
        });

        me.jeditinitree = new Ext.create('Ext.tree.Panel', {
            title: 'Include',
            flex: 2,
            rootVisible: false,
            disabled: true,
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
                    return value;
                },
            },{
                text: 'Value',
                menuDisabled: true,
                dataIndex: 'value',
                renderer : function(value, meta, record) {
                    if (record.isLeaf())
                        meta.style = 'color: grey';
                    return value;
                },
            }],
            listeners: {
                checkchange: function (){
                    updateRemoteIni();
                }
            }
            /*bbar: [
//  { xtype: 'spacer' },
  { xtype: 'button', text: 'Add' },
  { xtype: 'button', text: 'Remove' },
//  { xtype: 'spacer' },
],*/
            
        });

        me.jeditini.add([me.jeditinisel,me.jeditiniprop,me.jeditinitree]);

        me.jeditsend = new Ext.create('Ext.button.Button', {
            text: '<div style="font-weight: bold;">Send job</div>',
            handler : function() {
                //alert(Ext.getCmp('tbtext'));
                //alert(GLOBAL.APP.configData.user.username);
                //alert(GLOBAL.APP.configData["user"]["group"]);
                if (me.jeditinisel.getSelectionModel().getSelection()[0]) {
                    /*if (!(me.inipropval.findRecord('var','file_root') && 
                        me.jdl.findRecord('name','InputSandbox') && 
                        me.jeditinisel.getSelectionModel().getSelection()[0].get('inifile')==me.inipropval.findRecord('var','file_root').get('val') && 
                        me.jeditinisel.getSelectionModel().getSelection()[0].get('inifile')==Ext.getCmp('jdl-name').getValue() && -1!=me.jdl.findRecord('name','InputSandbox').get('value').indexOf(me.jeditinisel.getSelectionModel().getSelection()[0].get('inifile')+'.ini') && 
                        me.jeditinisel.getSelectionModel().getSelection()[0].get('inifile')==Ext.getCmp('jdl-name').getValue() && -1!=me.jdl.findRecord('name','OutputSandbox').get('value').indexOf(me.jeditinisel.getSelectionModel().getSelection()[0].get('inifile')+'.ini'))) {*/
                        //Ext.MessageBox.confirm('Warning', 'Maybe synchronize the name of:<br> - your job name<br> - the file_root parameter<br> - the jdl\'s input/output sandbox<br> - and your selected ini name<br>Continue\?',function(btn) {
                        Ext.MessageBox.confirm('Warning', 'Ready to send job \?',function(btn) {
                            if (btn == 'yes') {
                                sendJob();
                            }
                        });
                    /*}
                    else {
                        sendJob();
                    }*/
                }
                else {
                    Ext.MessageBox.alert('Notify', 'Please select a ini first.');
                }
            }
        });

        me.jeditjdl = new Ext.create('Ext.panel.Panel', {
            title: 'Job description',
            region: 'south',
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
                            //editor: { xtype: 'textarea', height: 50 }
                            field: {allowBlank: true},
                        }],
                        plugins: [
                            Ext.create('Ext.grid.plugin.CellEditing', { 
                                clicksToEdit: 1,
                            }),
                        ],
                        listeners: {
                            edit: function(editor, e) {
                        //        alert(e.rowIdx);
                                me.jdl.getAt(e.rowIdx).set(e.field, e.value);
                        //        me.jdl.sync();
                        //        updateJdl();
                            }
                        }
                    }],
                    buttons: [{
                        text: 'Ok',
                        handler: function() {
                            //me.jdl.sync();
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
            labelAlign:'right',
            id: 'jdl-name',
            listeners: {
                change: function(editor, e) {
                    me.jdl.findRecord('name','JobGroup').set('value','"'+e+'"');
                    me.jdl.findRecord('name','OutputPath').set('value',me.jdl.findRecord('name','OutputPath').get('value').replace(new RegExp('[^\/]+\/%'),e+'\/%'));
                    //me.jdl.sync();
                    //alert(me.jdl.findRecord('name','JobGroup').getId());
                }
            }
        },{
            xtype:'numberfield',
            fieldLabel:'Node',
            value: 1/*me.jdl.findRecord('name','Parameters').get('value')*/,
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
                text: 'summary',
                handler: function() {
                    logMe('<table width="100%" cellspacing="0" cellpadding="0"><tr><td align="left"><div style="color:MediumAquamarine;font-weight:bold;font-style: italic;text-decoration: underline; ">Summary</div></td><td align="right">'+(new Date()).toUTCString()+'</td></tr></table>');
                    sendCmd('summary');
                }
            }, {
                xtype: 'button',
                text: 'detail',
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
                text: 'delete',
                handler: function() {                    
                    Ext.Msg.confirm('Delete jobgroup', 'Are you sure you want to delete the '+me.jmansel.getValue()+' JobGroup ?', function(btn, text){
                        if (btn == 'yes'){
                    	    logMe('<table width="100%" cellspacing="0" cellpadding="0"><tr><td align="left"><div style="color:MediumAquamarine;font-weight:bold;font-style: italic;text-decoration: underline; ">Delete</div></td><td align="right">'+(new Date()).toUTCString()+'</td></tr></table>');
                    	    sendCmd('delete');
			}
		    });
                    //Ext.Ajax.request({url:'Cosmomc/joblist',params:{action:'rm',job:me.jmansel.getValue()}});
                    //me.joblist.remove(me.joblist.findRecord('job',me.jmansel.getValue()));
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
            me.iniincl.getRootNode().cascadeBy(function(n){if (n.get('checked')) obj+="DEFAULT("+inipath+n.getPath('name').substring(2)+".ini)\n"});
            me.inipropval.each(function(rec){obj+=rec.get('var')+"="+rec.get('val')+"\n"});
            Ext.Ajax.request({
                url : GLOBAL.BASE_URL + 'Cosmomc/updateIni',
                method : 'POST', 
                params: {'name':me.jeditinisel.getSelectionModel().getSelection()[0].get('inifile')},
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
                url : GLOBAL.BASE_URL + 'Cosmomc/updateJdl',
                //url : myurl + 'jdl',
		method: 'POST',
		//cors: true,
		//headers: {'Content-Type':'application/x-www-form-urlencoded',},
		//useDefaultXhrHeader: false,
		params: {
		     u: GLOBAL.APP.configData["user"]["username"],
                     g: GLOBAL.APP.configData["user"]["group"],
		     action: 'update',
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
                //Ext.Ajax.request({url:'Cosmomc/joblist',params:{action:'add',job:Ext.getCmp('jdl-name').getValue()}});
                //me.joblist.add({job:Ext.getCmp('jdl-name').getValue()});
            //}
            Ext.Ajax.request({
                url : GLOBAL.BASE_URL + 'Cosmomc/sendJob',
                //no parms present will use "GET", otherwise "POST")
                //method : 'POST', 
                params: {'inifile':me.jeditinisel.getSelectionModel().getSelection()[0].get('inifile')},
                success : function(response) {
                    Ext.MessageBox.alert('Message',response.responseText);
                    Ext.Ajax.request({url:'Cosmomc/joblist' });
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
                    src: 'static/DIRAC/Cosmomc/images/ajax-loader.gif',
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
            url : GLOBAL.BASE_URL + 'Cosmomc/diracDo',
            params: {'cmd':cmd,'name':me.jmansel.getValue()},
                success : function(response) {
                    logMe(response.responseText.split("\n").join("<br>"));
                    logMe("<br>");
                    me.jmanlog.header.items.items[1].hide();
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
                url: GLOBAL.BASE_URL + 'Cosmomc/datalist',
                actionMethods: {
                    read: 'POST'
                },
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
            displayField: 'data',
            store: me.datalist,
            editable: false,
            emptyText: 'Select a data',
            //autoSelect: false,
            listeners: {
                select: function(combo, record, index) {
                    me.jprocstat.body.update('');
                    me.jprocshow.body.update('');
                    me.jproccmd.enable();
                    me.jproctree.enable();
                    me.jproccmd.items.items[0].setParams({'path':'/'+combo.getValue()})
                    me.datatree.setProxy(
                        new Ext.data.proxy.Ajax({
                            url:GLOBAL.BASE_URL + 'Cosmomc/datatree',
                            extraParams:{'folder':combo.getValue()},
                            reader: {type:'json'},
                        })
                    );
                    me.datatree.load();
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
                    me.jproccmd.items.items[0].setParams({'path':record.get("path")+'/'+record.get("label")})
                    var msg = new Ext.LoadMask(me.jprocpan, {msg:"Please wait..."});
                    msg.show();
                    Ext.Ajax.request({
                        url : GLOBAL.BASE_URL + 'Cosmomc/status',
                        params: {'path':record.get("path")+'/'+record.get("label")},
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
                        url : GLOBAL.BASE_URL + 'Cosmomc/preview',
                        params: {'path':record.get("path")+'/'+record.get("label")},
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
                    me.jprocstat.body.update('');
                    me.jprocstat.setDisabled(true);
                    me.jprocshow.body.update('');
                    me.jprocshow.setDisabled(true);
                    me.jproccmd.items.items[0].setParams({'path':'/'+me.jprocsel.getValue()})
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
                href: GLOBAL.BASE_URL + 'Cosmomc/get',
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
                        url: GLOBAL.BASE_URL + 'Cosmomc/get',
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
                                url: GLOBAL.BASE_URL + 'Cosmomc/rmtree',
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
                                    }
                                    else {
                                        me.datatree.reload();
                                    }
                                },
                                params: {'path': p}
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
        });

        me.jprocpan = new Ext.create('Ext.panel.Panel',{
            //title: '',
            region: 'center',
            layout: 'border',
            bodyStyle: 'background: lightgray;',
            items: [me.jprocstat,me.jprocshow],
        });

        me.jedit.add([me.jeditini,me.jeditjdl]);

        me.jman.add([me.jmanpanel,me.jmanlog]);

        me.jproc.add([me.jprocpan,me.jprocdata]);

        me.tabbedPanel.add(me.jedit,me.jman,me.jproc);

        me.add(me.tabbedPanel);
    },
});
