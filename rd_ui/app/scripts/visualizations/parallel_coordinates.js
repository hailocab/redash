(function () {
    var pcVisualization = angular.module('redash.visualization');

    pcVisualization.config(['VisualizationProvider', function(VisualizationProvider) {
        VisualizationProvider.registerVisualization({
            type: 'PC',
            name: 'Parallel Coordinates',
            renderTemplate: '<pc-renderer options="visualization.options" query-result="queryResult"></pc-renderer>',
            editorTemplate: '<pc-editor></pc-editor>'
        });
    }]);

    pcVisualization.directive('pcRenderer', function() {
        return {
            restrict: 'E',
            scope: {
                queryResult: '=',
                options: '='
            },
            template: "",
            replace: false,
            link: function($scope, element, attrs) {
                $scope.$watch('queryResult && queryResult.getData()', function (data) {
                    if (!data) {
                        return;
                    }

                    if ($scope.queryResult.getData() == null) {

                    } else {
                        var data = $.extend(true, [], $scope.queryResult.getData());
                        var container = angular.element(element)[0];
                        var dimensions = $scope.queryResult.getColumnNames().filter(function(d){
                           return typeof $scope.queryResult.getData()[0][d] === 'number';
                        });

                        var pc = parallel($scope.queryResult.getData(), element[0], $scope.options.category, dimensions);
                        pc.render();
                    }
                });
            }
        }
    });

    pcVisualization.directive('pcEditor', function(){
        return {
            restrict: 'E',
            templateUrl: '/views/visualizations/parallel_coordinates_editor.html',
            link: function (scope, element, attrs) {
                scope.category = "";
                scope.$watch('visualization', function (visualization) {
                    if (visualization && visualization.type == 'PC') {
                        if (scope.visualization.options.category === null) {
                            scope.category = "";
                        } else if (scope.visualization.options.category === undefined) {
                            scope.category = "";
                        } else {
                            scope.category = scope.visualization.options.category;
                        }

                        categoryUnwatch = scope.$watch("category", function (category) {
                            if (category == "") {
                                scope.visualization.options.category = null;
                            } else {
                                scope.visualization.options.category = category;
                            }
                        });
                    } else {
                        if (categoryUnwatch) {
                            categoryUnwatch();
                            categoryUnwatch = null;
                        }
                    }
                });
            }
        }
    });

}());