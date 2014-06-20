var GLOBAL = {};

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
            listeners: {
                scope: this,
                artifactChosen: function(picker, selectedRecord) {
                    GLOBAL.itemHierarchy = selectedRecord.get('ObjectID');
                    GLOBAL.initiative = selectedRecord;
                    $($('.rally-app')[0]).hide();

                    // change to angular app
                    angular.bootstrap(document.body, ['angularBlastdown']);
                    var scope = angular.element(document.body).scope();

                    scope.app = App.getContext().map.map;
                    scope.$digest();
                    $('#root').show();
                    $('body').removeClass('x-body');
                    $('html').removeClass('x-viewport');
                }
            }
        }
    ],
    launch: function() {
        App = this;
    }
});


