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
                    load: function(el, records, successful, eOpts) {
                        if (!successful) {
                            //console.error(el, records, successful);
                            alert("An error occured - please try again later");
                        }
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
                    var scope = angular.element(document.body).scope();
                    scope.app = Rally.getApp().getContext().map.map;
                    
                    scope.$digest();  
                    injector.get('LookbackService').connect(selectedRecord.get('ObjectID'));

                    $('#mute').click(function() {
                        game.toggleMute();
                    });
                    $('#playPause').click(function() {
                        game.togglePlayPause();
                    });

                    $("#legend").click(function() {
                        game.showHowItWorks();
                    });

                    $("#howItWorksButton").click(function() {
                        game.showHowItWorks();
                    });

                    $("#scoreboardToggle").click(function() {
                        game.toggleScoreboard();
                    });

                }
            }
        }
    ],
    launch: function() {
        Ext.getBody().mask('Loading');
    }
});





