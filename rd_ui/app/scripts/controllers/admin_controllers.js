(function () {
  var AdminStatusCtrl = function ($scope, Events, $http, $timeout) {
    Events.record(currentUser, "view", "page", "admin/status");
    $scope.$parent.pageTitle = "System Status";

    var refresh = function () {
      $scope.refresh_time = moment().add('minutes', 1);
      $http.get('/status.json').success(function (data) {
        $scope.workers = data.workers;
        delete data.workers;
        $scope.manager = data.manager;
        delete data.manager;
        $scope.status = data;
      });

      $timeout(refresh, 59 * 1000);
    };

    refresh();
  }   


  var AdminGroupFormCtrl = function ($scope, Events, Groups) {

    $scope.permissions = {create_dashboard: true, create_query: false, edit_dashboard: false, edit_query: false, view_query: false, view_source: false, execute_query:false};

    // available tables
    var tables = [
    { id: 'jss_pmuh', text: 'jss_pmuh' },
    { id: 'jss_allocation', text: 'jss_allocation' },
    { id: 'jss_fareQuote', text: 'jss_fareQuote' },
    ];

    // preselected tables
    $scope.multi2Value = [
    { id: 'jss_pmuh', text: 'jss_pmuh' },
    { id: 'jss_allocation', text: 'jss_allocation' }
    ];

    $scope.multi = {
      multiple: true,
      query: function (query) {
        query.callback({ results: tables });
      },
      initSelection: function (element, callback) {

        var val = $(element).select2('val'),
        results = [];
        for (var i=0; i<val.length; i++) {
          results.push(findState(val[i]));
        }
        callback(results);
      }
    };

    $scope.submit = function() {
      console.log($scope.permissions);
    };
  }

  var AdminUserFormCtrl = function ($scope, Events, Users) {
    $scope.submitUser = function() {
      console.log($scope.permissions);
    };
  }

  var AdminUsersCtrl = function ($scope, Events, Users) {

    $scope.userColumns =[
    {
      "label": "Name",
      "map": "name"
    },
    {
      "label": "ID",
      "map": "id"
    },    
    {
      "label": "Email",
      "map": "email"
    }
    ]

    var users = new Users();
    users.getUsers().$promise.then(function(result) {
      $scope.users = result;
    });
  }

  var AdminGroupsCtrl = function ($scope, Events, Groups) {    

    var dateFormatter = function (date) {
      value = moment(date);
      if (!value) return "-";
      return value.format("DD/MM/YY HH:mm");
    }

    var permissionsFormatter = function (permissions) {
      value = permissions.join(', ');      
      if (!value) return "-";
      return value.replace(new RegExp("_", "g"), " ");
    }

    var tableFormatter = function (table) {
      return table;
    }

    $scope.groupColumns = [
    {
      "label": "Name",
      "map": "name"
    },
    {
      "label": "ID",
      "map": "id"
    },
    {
      'label': 'Tables',
      'map': 'tables',
      'formatFunction': tableFormatter     
    },    
    {
      "label": "Created At",
      "map": "created_at",
      'formatFunction': dateFormatter           
    },      
    {
      "label": "Permissions",
      "map": "permissions",
      'formatFunction': permissionsFormatter
    }                  
    ]

    var groups = new Groups();
    groups.get().$promise.then(function(res) {
      $scope.groups = res;
    });
  }

  angular.module('redash.admin_controllers', [])
  .controller('AdminStatusCtrl', ['$scope', 'Events', '$http', '$timeout', AdminStatusCtrl])
  .controller('AdminUsersCtrl', ['$scope', 'Events', 'Users', AdminUsersCtrl])
  .controller('AdminUserFormCtrl', ['$scope', 'Events', 'Users', AdminUserFormCtrl])
  .controller('AdminGroupsCtrl', ['$scope', 'Events', 'Groups', AdminGroupsCtrl])
  .controller('AdminGroupFormCtrl', ['$scope', 'Events', 'Groups', AdminGroupFormCtrl])
         // .directive('applystyle', function() {
         //    return {
         //        // Restrict it to be an attribute in this case
         //        restrict: 'A',
         //        // responsible for registering DOM listeners as well as updating the DOM
         //        link: function(scope, element, attrs) {
         //          $('#select2-choices').class('form-control');
         //        }
         //    };
         //  });

})();

