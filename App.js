Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    items: [
        {
            xtype: 'rallysolrartifactchooserdialog',
            id: 'portfolioItemPicker',
            artifactTypes: ['portfolioitem/initiative'],
            autoShow: true,
            height: 250,
            title: 'Choose an Initiative',
            storeConfig: {
                context: {
                    //specify the workspace to search
                    workspace: Rally.util.Ref.getRelativeUri(),
                    //all projects
                    project: null
                },
                listeners: {
                    load: function() {
                        Ext.getBody().unmask();
                        $('.x-mask').css("background", "none");
                    }
                }
            },
            listeners: {
                scope: this,
                artifactchosen: function(picker, selectedRecord) {
                    Ext.getBody().mask("Loading");

                    var injector = angular.bootstrap(document.body, ['angularBlastdown']);
                    injector.get('LookbackService').connect(selectedRecord.get('ObjectID'));
                    
                    var scope = angular.element(document.body).scope();
                    scope.app = Rally.getApp().getContext().map.map;
                    
                    scope.$digest();                  
                }
            }
        }
    ],
    launch: function() {
        // TODO use the recyclingbin endpoint?
        Ext.getBody().mask('Loading');
        Ext.create('Rally.data.WsapiDataStore', {
            model: 'recyclebinentry',
            fetch: true, //['Name', 'ObjectID', 'DeletionDate'],
            limit: Infinity,
            context: {
                workspace: Rally.util.Ref.getRelativeUri(),
                project: null
            }
        }).load({
            scope: this,
            callback: function (records, operation, success) {
                console.log(records);
                // _.each(records, function (record) {
                //     projectOidMap[record.get('ObjectID')] = record;
                // });
                // callbackFn();
            }
        });
    }
});





