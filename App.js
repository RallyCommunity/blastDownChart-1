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
            artifactChosen: function(picker, selectedRecord) {
                App._getArtifacts(selectedRecord);
            },
            scope: this
        }
      }
    ],
    launch: function() {
        //Write app code here
        App = this;
    },

    _passFn: function(result) {
        console.log('success', result);
    },

    _failFn: function(result) {
        console.log('fail', result);
    },

    _getArtifacts: function(scope) {
        var hierarchy = scope.get('ObjectID');
        console.log("Querying lbAPI for artifacts under " + hierarchy);

        App.organizedData = {
            initiative: scope.data,
            features: [],
            stories: [],
            defects: [],
            tasks: [],

        };

        Ext.getBody().mask('Loading');
        Ext.create('Rally.data.lookback.SnapshotStore', {
            listeners: {
                load: function(store, data, success) {
                    // TODO optimize
                    Ext.getBody().unmask();
                    Ext.Array.each(data, function(artifact) {
                        var types = artifact.raw._TypeHierarchy;
                        console.log(types);
                        switch (types[types.length - 1]) {
                            case "Defect":
                                Ext.Array.push(App.organizedData.defects, artifact.data);
                                break;
                            case "HierarchicalRequirement":
                                Ext.Array.push(App.organizedData.stories, artifact.data);
                                break;
                            case "PortfolioItem/Feature": // TODO PI/Feature or Feature
                                Ext.Array.push(App.organizedData.features, artifact.data);
                                break;
                            case "Task":
                                Ext.Array.push(App.organizedData.tasks, artifact.data);
                                break;
                            default: // ignore
                        }
                    });
                    // App._getStories(hierarchy);
                    console.log(App.organizedData);

                }
            },
            fetch: true,
            hydrate: ["ScheduleState", "State", "_TypeHierarchy"],
            findConfig: {
                "_ItemHierarchy" : hierarchy,
                "__At" : "current"
            }
        }).load();

        /*

        //process data
        console.log(store);
        console.log(success);
        console.log('data returned', data);

        Ext.getBody().unmask();
        if (success) {
          console.log(data);
          if (data.length === 0) {
              Ext.Msg.alert('Nothing here...', 'No data returned');
          }
          App._processData(scope, data);
        } else {
          Ext.Msg.alert('Error', 'Failed to get associated artifacts.  Please try again');
        }

        */
    },

    _processData: function(scope, data) {
        console.log('processing', scope, data);
        var organizedData = {
            initiative: {

                features: []
            }
        };

        Ext.Array.each(data, function(one) {
            // if it is a feature add it

            console.log(one.get('FormattedID'));
        });
    }
});
