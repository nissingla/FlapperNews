var app = angular.module("flapperNews", ['ui.router']);
app.controller("MainCtrl", ['$scope', 'posts', 'auth', function($scope, posts, auth){
	 $scope.posts = posts.posts;
	 $scope.isLoggedIn = auth.isLoggedIn;
	 $scope.addPost = function(){
		  if(!$scope.title || $scope.title === '') { return; }
		  posts.create({
		    title: $scope.title,
		    link: $scope.link,
		  });
		  $scope.title = '';
		  $scope.link = '';
	};
	 $scope.incrementUpvotes = function(post){
	 	posts.upvote(post);
	 };
	 $scope.getCountOfComments = function(post){
	 	return post.comments.length;
	 }
}]);
app.factory('posts', ['$http', 'auth', function($http, auth){
	var o = {};
	o.posts = [];
	o.getAll = function() {
    return $http.get('/posts').success(function(data){
      angular.copy(data, o.posts);
    });
  };
  o.create = function(post) {
  return $http.post('/posts', post, {
    headers: {Authorization: 'Bearer '+auth.getToken()}
  }).success(function(data){
    o.posts.push(data);
  		});
  };
  o.upvote = function(post) {
  return $http.put('/posts/' + post._id + '/upvote', null, { headers: { Authorization : 'Bearer ' + auth.getToken()}})
    	.success(function(data){
      	post.upvotes += 1;
     });
  };
  o.get = function(id) {
  return $http.get('/posts/' + id).then(function(res){
    	return res.data;
     });
  };
  o.addComment = function(id, comment) {
  		return $http.post('/posts/' + id + '/comments', comment, { headers: { Authorization : 'Bearer ' + auth.getToken()}});
  };
  o.upvoteComment = function(post, comment) {
  return $http.put('/posts/' + post._id + '/comments/'+ comment._id + '/upvote', null, { headers: { Authorization : 'Bearer ' + auth.getToken()}})
	    .success(function(data){
	      comment.upvotes += 1;
      });
	};
   return o;
}]);
app.config([
'$stateProvider',
'$urlRouterProvider',
function($stateProvider, $urlRouterProvider) {

  $stateProvider
    .state('home', {
      url: '/home',
      templateUrl: '/home.html',
      controller: 'MainCtrl',
      resolve: {
        postPromise: ['posts', function(posts){
      	return posts.getAll();
    	}]
  	  }
    })
    .state('posts', {
  	url: '/posts/{id}',
  	templateUrl: '/posts.html',
  	controller: 'PostsCtrl',
  	resolve: {
    post: ['$stateParams', 'posts', function($stateParams, posts) {
      	return posts.get($stateParams.id);
        }]
  	  }
	})
	.state('login', {
  url: '/login',
  templateUrl: '/login.html',
  controller: 'AuthCtrl',
  onEnter: ['$state', 'auth', function($state, auth){
    if(auth.isLoggedIn()){
      $state.go('home');
    }
  }]
})
.state('register', {
  url: '/register',
  templateUrl: '/register.html',
  controller: 'AuthCtrl',
  onEnter: ['$state', 'auth', function($state, auth){
    if(auth.isLoggedIn()){
      $state.go('home');
    }
  }]
});

  $urlRouterProvider.otherwise('home');
}]);
app.controller('PostsCtrl', [
'$scope',
'posts',
'post',
'auth',
function($scope, posts, post, auth){
	$scope.post = post;
	$scope.isLoggedIn = auth.isLoggedIn
	$scope.incrementUpvotes = function(comment){
		posts.upvoteComment(post, comment);
	};
	$scope.addComment = function(){
  		if($scope.body === '') { return; }
  		if($scope.post.comments === undefined)
  			$scope.post.comments = [];
  			posts.addComment(post._id, {
	    	body: $scope.body,
	    	author: 'user',
	    	upvotes: 0
  		})
  		.success(function(comment){
  			$scope.post.comments.push(comment);
  		});
  		$scope.body = '';
	};
}]);

app.controller('AuthCtrl', [
'$scope',
'$state',
'auth',
function($scope, $state, auth){
  $scope.user = {};

  $scope.register = function(){
    auth.register($scope.user).error(function(error){
      $scope.error = error;
    }).then(function(){
      $state.go('home');
    });
  };

  $scope.logIn = function(){
    auth.logIn($scope.user).error(function(error){
      $scope.error = error;
    }).then(function(){
      $state.go('home');
    });
  };
}]);

app.factory('auth', ['$http', '$window', function($http, $window){
	var oAuth = {};
	oAuth.saveToken = function(token){
		$window.localStorage['flapper-news-token'] = token;
	};
	oAuth.getToken = function(){
		return  $window.localStorage['flapper-news-token'];
	};
	oAuth.isLoggedIn = function(){
		var token = oAuth.getToken();
		if(token){
			var payload = JSON.parse($window.atob(token.split('.')[1]));
			return payload.exp > (Date.now() / 1000);
		}
		else{
			return false;
		}
	};
	oAuth.currentUser = function(){
		if(oAuth.isLoggedIn()){
			var token = oAuth.getToken();
			var payload = JSON.parse($window.atob(token.split('.')[1]));
			return payload.username;
		}
	};
	oAuth.register = function(user){
		return $http.post('/register', user).success(function(data){
			oAuth.saveToken(data.token);
		});
	};
	oAuth.logIn = function(user){		
  		return $http.post('/login', user).success(function(data){
    	oAuth.saveToken(data.token);
  		});
	};
	oAuth.logOut = function(){
  		$window.localStorage.removeItem('flapper-news-token');
	};		

	return oAuth;
}]);

app.controller('NavCtrl', [
'$scope',
'auth',
function($scope, auth){
  $scope.isLoggedIn = auth.isLoggedIn;
  $scope.currentUser = auth.currentUser;
  $scope.logOut = auth.logOut;
}]);



