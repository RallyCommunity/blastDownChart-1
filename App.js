GLOBAL = {}; // TODO how do you get around this?
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
                    //specify the workspace to search this.getContext().getWorkspace()
                    workspace: Rally.util.Ref.getRelativeUri(), //Rally.Environment.getContext().getWorkspace(),

                    //all projects
                    project: null
                }
            },
            listeners: {
                scope: this,
                artifactchosen: function(picker, selectedRecord) {
                    Ext.getBody().mask("Loading");
                    GLOBAL = selectedRecord.data;
                    angular.bootstrap(document.body, ['angularBlastdown']);
                    
                    var scope = angular.element(document.body).scope();
                    scope.app = App.getContext().map.map;
                    
                    scope.$digest();                  
                }
            }
        }
    ],
    launch: function() {
        App = this;
        var oid = 20185532021;

        // TODO why can't I get the exact same data using WSAPI?

        // Ext.create('Rally.data.WsapiDataStore', {
        //     model: 'User Story',
        //     fetch: true,
        //     limit: Infinity
        // }).load(oid, {
        //     scope: this,
        //     callback: function(records, operation, success) {
        //         console.log('wsapi', oid, records, operation, success);
        //     }
        // });

        

        // Rally.domain.WsapiModel.load(oid, {
        //     scope: this,
        //     callback: function(record, op, success) {
        //         console.log(record);
        //     }
        // });

        var ref = "/portfolioitem/feature/20093939763";


                            // console.log(record);
        // Ext.create('Rally.data.lookback.SnapshotStore', {
        //     fetch: true,
        //     findConfig: {
        //         "_TypeHierarchy": "HierarchicalRequirement",
        //         "__At": "current",
        //         "ObjectID": oid
        //     }
        // }).load({
        //     scope: this,
        //     callback: function(records, operation, success) {
        //         console.log('lbapi', oid, records, operation, success);
                
        //     }
        // });
    }
});


