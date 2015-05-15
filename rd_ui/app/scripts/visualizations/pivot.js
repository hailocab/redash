(function () {
  var pivotTableVisualization = angular.module('redash.visualization');
  pivotTableVisualization.config(['VisualizationProvider', function (VisualizationProvider) {
    VisualizationProvider.registerVisualization({
      type: 'PIVOT',
      name: 'pivot',
      renderTemplate: '<pivot-table-renderer visualization="visualization" query-result="queryResult"></pivot-table-renderer>',
      skipTypes: true
    });
  }]);
  var Pivot = function(Visualization, growl){
    return {
        restrict: 'E',
        scope: {
            query: '=',
            visualization: '=',
            queryResult: '=',
            edit: '='
        },
        templateUrl: "/views/visualizations/pivot.html",
        replace: false,
        link: function($scope, element, attrs) {
              var empty = function(){
                  return {
                    'query_id': $scope.query.id,
                    'type': "PIVOT",
                    'name': "pivot",
                    'description': $scope.query.description || '',
                    'options': {}
                  };
              };

            var visualization = $scope.visualization || empty();

            $scope.$watch('queryResult && queryResult.getData()', function (data) {
                if (!data) {
                    return;
                }

                if ($scope.queryResult.getData() == null) {
                } else {
                    // We need to give the pivot table its own copy of the data, because its change
                    // it which interferes with other visualizations.
                    var data = $.extend(true, [], $scope.queryResult.getData());
                    var pivotOptions = $.extend(true, {}, visualization.options);
                    pivotOptions.renderers = $.pivotUtilities.renderers;
                    pivotOptions.onRefresh = function(options) {
                        visualization.options = options;
                     };
                    delete pivotOptions["aggregators"];
                    delete pivotOptions["derivedAttributes"];
                    //delete some bulky default values
                    delete pivotOptions["rendererOptions"];
                    delete pivotOptions["localeStrings"];
                    $(element).find('#pivot_container').pivotUI(data, pivotOptions);
                }
            });

            $scope.submit = function(){
                Visualization.save(visualization, function success(result) {
                    growl.addSuccessMessage("Visualization saved");
                }, function error() {
                    growl.addErrorMessage("Visualization could not be saved");
                });
            }
        }
    }
  };
  pivotTableVisualization.directive('pivotTableRenderer', ['Visualization','growl', Pivot])
}());