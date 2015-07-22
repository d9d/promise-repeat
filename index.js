function delay( ms ){
  return new Promise(function( resolve ){
    ( ms > 0 ) ? setTimeout( resolve, ms ) : resolve();
  });
}

function retryPromise( fn, options ){
  return function( result ){
    return new Promise( function( resolve, reject ){
      if( !options ){ options = {}; }

      var maxAttempts        = options.maxAttempts        || 3;
      var minTimeout         = options.minTimeout         || 0;
      var maxTimeout         = options.maxTimeout         || 3000;
      var debounce           = options.debounce           || 0;
      var debounceFn         = options.debounceFn         || function(retries, debounce){ return debounce; };
      var boolRetryFn        = options.boolRetryFn        || function(){ return true; };
      var resolveAfterReject = options.resolveAfterReject || function(){};

      var startTime  = +new Date();
      var retryCount = 0;

      // reject if fn (or subsequent call) is taking too long
      setTimeout( function(){
        reject( new Error( 'PromiseRepeat: Function failed to resolve after ' + (1+retryCount) + ' attempts and ' + maxTimeout + 'ms.' ) );
      }, maxTimeout );

      function run(){
        var now = +new Date();

        return Promise.resolve( result ).then( fn ).then(

          // Success!  Either pass the value through or call `resolveAfterReject`
            function( result ){
              var now = +new Date();

              if( now >= ( startTime + maxTimeout ) ){
                resolveAfterReject( result );

              } else {
                return result;
              }
            }
          , function( err ){
            if(
                 ( ++retryCount < maxAttempts )
              && ( now < ( startTime + maxTimeout ) )
              && boolRetryFn( err, {retryCount: retryCount} )
            ){
              return delay( ( minTimeout - now + startTime ) || debounceFn( retryCount, debounce ) )
                .then( run );
            }

            reject( err );
          }
        ).then( resolve );
      }

      return run();
    });
  };
}

if( typeof module !== 'undefined' ){
  module.exports = retryPromise;
}
