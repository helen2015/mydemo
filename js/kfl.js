/**
 * Created by bjwsl-001 on 2017/9/6.
 */


var app = angular.module('kflModule', ['ionic']);

//创建一个自定义的服务
app.service('$kflHttp',
  function ($ionicLoading, $http) {
    //封装一个方法
    this.sendRequest = function (url, func) {
      //显示一个加载中的窗口 $ionicLoading
      $ionicLoading.show(
        {
          template: '正在加载数据'
        }
      );
      //发起网络请求
      $http
        .get(url)
        .success(function (data) {
          //data就是服务器返回的数据
          $ionicLoading.hide();
          func(data);
        })
        .error(function () {
          $ionicLoading.hide();
        })
    }
  });


//采用uiRouter来管理ionic所有的代码片段的访问、跳转、传参
app.config(
  function ($stateProvider, $urlRouterProvider) {
    //给每一个代码片段来添加状态
    $stateProvider
      .state('kflStart', {
        url: '/start',
        templateUrl: 'tpl/start.html'
      })
      .state('kflMain', {
        url: '/main',
        templateUrl: 'tpl/main.html',
        controller:'mainCtrl'
      })
      .state('kflDetail', {
        url: '/detail/:id',
        templateUrl: 'tpl/detail.html',
        controller:'detailCtrl'
      })
      .state('kflOrder', {
        url: '/order/:myId',
        templateUrl: 'tpl/order.html',
        controller:'orderCtrl'
      })
      .state('kflMyOrder', {
        url: '/myOrder',
        templateUrl: 'tpl/myOrder.html',
        controller:'myOrderCtrl'
      })
      .state('kflSettings', {
        url: '/settings',
        templateUrl: 'tpl/settings.html',
        controller:'settingsCtrl'
      })
      .state('kflCart', {
        url: '/cart',
        templateUrl: 'tpl/myCart.html',
        controller:'cartCtrl'
      })

    //异常处理
    $urlRouterProvider.otherwise('/start');

  });

//给body创建一个控制器
app.controller('bodyCtrl', ['$scope', '$state',
  function ($scope, $state) {
    $scope.jump = function (desState, args) {
      $state.go(desState, args);
    }
  }
]);

//给main创建一个控制器
app.controller('mainCtrl', ['$scope', '$kflHttp',
  function ($scope, $kflHttp) {
    $scope.dishList = [];
    $scope.hasMore = true;
    $scope.myInput = {
      kw:''
    }
    //①页面加载就有列表 ②加载更多 ③搜索功能
    $kflHttp.sendRequest(
      'data/dish_getbypage.php?start=0',
      function (data) {
        console.log(data);
        $scope.dishList = data;
      }
    );
    //加载更多
    $scope.loadMore = function () {
      $kflHttp.sendRequest(
        'data/dish_getbypage.php?start='+$scope.dishList.length,
        function (data) {
          if(data.length < 5)
          {
            $scope.hasMore = false;
          }
          $scope.dishList =
            $scope.dishList.concat(data);
          //通过广播结束掉加载更多的刷新动作
          $scope.$broadcast('scroll.infiniteScrollComplete');
        }
      )
    }

    //监听
    $scope.$watch('myInput.kw', function () {
      console.log($scope.myInput.kw);
      if($scope.myInput.kw.length > 0)
      {
        //发起请求
        $kflHttp.sendRequest(
          'data/dish_getbykw.php?kw='
            +$scope.myInput.kw,
          function (data) {
            if(data.length > 0)
            {
              $scope.dishList = data;
            }
          }
        )
      }
    })
  }
])

//详情页
app.controller('detailCtrl', ['$scope', '$stateParams','$kflHttp','$ionicPopup',
  function ($scope, $stateParams,$kflHttp,$ionicPopup) {
    var did=$stateParams.id;
    $kflHttp.sendRequest(
        'data/dish_getbyid.php?id='+did,
        function (data) {
          console.log(data);
          $scope.dish = data;
        }
    );

    //定义一个添加到购物车的方法
    $scope.addToCart=function(){
      $kflHttp.sendRequest(
        'data/cart_update.php?uid=1&did='+$scope.dish.did+"&count=-1",
        function(data){
          if(data.msg=='succ'){
            //$ionicPopup
          }
        });
    }
  }
]);

//订单页
app.controller('orderCtrl', ['$scope', '$stateParams','$kflHttp','$httpParamSerializerJQLike',
  function ($scope, $stateParams,$kflHttp,$httpParamSerializerJQLike) {
    $scope.myInput={did:$stateParams.myId};

    $scope.submitOrder=function(){
      //拿到用户的输入信息
      var str=$httpParamSerializerJQLike($scope.myInput);
      //发送给服务器
      //uName\uAddr\uPhone\uSex\did
      $kflHttp.sendRequest(
          'data/order_add.php?'+str,
          function (data) {
            if(data.msg=='succ'){
              sessionStorage.setItem('myPhone',$scope.myInput.uPhone);
              $scope.result='下单成功，订单编号为：'+data.oid;
            }else{
              $scope.result='下单失败';
            }
          }
      );
    }
  }
]);

//个人订单页
app.controller('myOrderCtrl', ['$scope','$kflHttp',
  function ($scope,$kflHttp) {

    var phone=sessionStorage.getItem('myPhone');
    $kflHttp.sendRequest(
        'data/order_getbyphone.php?phone='+phone,
        function (data) {
          console.log(data);
          $scope.dishList = data;
        }
    );
  }
]);

//设置页
app.controller('settingsCtrl', ['$scope','$ionicModal',
  function ($scope,$ionicModal) {
    //创建一个自定义弹窗
    $ionicModal
      .fromTemplateUrl('tpl/about.html',{scope:$scope})
      .then(function(modal){
          $scope.myModal=modal;
      });

    //定义一个显示自定义模态窗口的方法
    $scope.showAbout=function(){
      //显示弹窗
      $scope.myModal.show();
    }
    //定义一个隐藏自定义模态窗口的方法
    $scope.hideAbout=function(){
      $scope.myModal.hide();
    }
  }
]);

//给myCart指定一个控制器
app.controller('cartCtrl',['$scope','$kflHttp',
  function($scope,$kflHttp){
    $scope.cartList=[];
  //向服务器发请求：cart_select.php
    $kflHttp.sendRequest(
        'data/cart_select.php?uid=1',
        function(result){
          $scope.cartList=result.data;
        }
    );

    //定义一个方法用来计算合计多少钱
    $scope.calcAll=function(){
      for(var i=0;i<$scope.cartList.length;i++){
        var price=$scope.cartList[i].price;
      }
    }
}]);




























