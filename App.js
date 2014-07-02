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
    }
});


