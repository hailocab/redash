(function() {
  var DashboardCtrl = function($scope, Events, Widget, $routeParams, $http, $timeout, Dashboard) {
    Events.record(currentUser, "view", "dashboard", dashboard.id);    

    $scope.refreshEnabled = false;
    $scope.refreshRate = 60;
    $scope.dashboard = Dashboard.get({ slug: $routeParams.dashboardSlug }, function (dashboard) {
      $scope.$parent.pageTitle = dashboard.name;
      var filters = {};      
      var i = 0;

      $scope.dashboard.widgets = _.map($scope.dashboard.widgets, function (row) {

        return _.map(row, function (widget) {
          var w = new Widget(widget);         

          if (w.visualization && dashboard.dashboard_filters_enabled) {            
            var queryFilters = w.getQuery().getQueryResult().getFilters();
            _.each(queryFilters, function (filter) {
              if (!_.has(filters, filter.name)) {
                // TODO: first object should be a copy, otherwise one of the chart filters behaves different than the others.
                filters[filter.name] = filter;
                filters[filter.name].originFilters = [];

                $scope.$watch(function() { return filter.current }, function (value) {
                  _.each(filter.originFilters, function(originFilter) {
                    originFilter.current = value;
                  })
                });
              };

              // TODO: merge values.
              filters[filter.name].originFilters.push(filter);
            });
          }

          if (w.visualization.query.error == null) {          
          i =- 1              
          return w;         
          
          }
          else {
            i += 1;          
            if(i == dashboard.widgets.length) {
              $scope.dashboard.allWidgetPerm = true            
            }
            else if ($scope.dashboard.widgetPerm != true){               
              $scope.dashboard.widgetPerm = true                               
           }         
            return null;
          }          
        });
      });

      if (dashboard.dashboard_filters_enabled) {
        $scope.filters = _.values(filters);
      }
    });

    var autoRefresh = function() {
      if ($scope.refreshEnabled) {
        $timeout(function() {
          Dashboard.get({
            slug: $routeParams.dashboardSlug
          }, function(dashboard) {
            var newWidgets = _.groupBy(_.flatten(dashboard.widgets), 'id');

            _.each($scope.dashboard.widgets, function(row) {
              _.each(row, function(widget, i) {
                var newWidget = newWidgets[widget.id];
                if (newWidget && newWidget[0].visualization.query.latest_query_data_id != widget.visualization.query.latest_query_data_id) {
                  row[i] = newWidget[0];
                }
              });
            });

            autoRefresh();
          });

        }, $scope.refreshRate);
      };
    }

    $scope.triggerRefresh = function() {
      $scope.refreshEnabled = !$scope.refreshEnabled;

      Events.record(currentUser, "autorefresh", "dashboard", dashboard.id, {'enable': $scope.refreshEnabled});

      if ($scope.refreshEnabled) {
        var refreshRate = _.min(_.flatten($scope.dashboard.widgets), function(widget) {
          return widget.visualization.query.ttl;
        }).visualization.query.ttl;

        $scope.refreshRate = _.max([120, refreshRate * 2]) * 1000;

        autoRefresh();
      }
    };
  };

  var WidgetCtrl = function($scope, Events, Query) {
    $scope.deleteWidget = function() {
      if (!confirm('Are you sure you want to remove "' + $scope.widget.getName() + '" from the dashboard?')) {
        return;
      }

      Events.record(currentUser, "delete", "widget", $scope.widget.id);

      $scope.widget.$delete(function() {
        $scope.dashboard.widgets = _.map($scope.dashboard.widgets, function(row) {
          return _.filter(row, function(widget) {

            return widget.id != undefined;
          })
        });
      });
    };

    if ($scope.widget != null && $scope.widget.visualization) {
      
      Events.record(currentUser, "view", "widget", $scope.widget.id);

      if ($scope.widget.visualization) {
        Events.record(currentUser, "view", "query", $scope.widget.visualization.query.id);
        Events.record(currentUser, "view", "visualization", $scope.widget.visualization.id);


        $scope.query = $scope.widget.getQuery();
        $scope.queryResult = $scope.query.getQueryResult();        
        $scope.nextUpdateTime = moment(new Date(($scope.query.updated_at + $scope.query.ttl + $scope.query.runtime + 300) * 1000)).fromNow();

  


        $scope.type = 'visualization';
      } else {
        $scope.type = 'textbox';
      }

    }
  };


  angular.module('redash.controllers')
    .controller('DashboardCtrl', ['$scope', 'Events', 'Widget', '$routeParams', '$http', '$timeout', 'Dashboard', DashboardCtrl])
    .controller('WidgetCtrl', ['$scope', 'Events', 'Query', WidgetCtrl])

})();