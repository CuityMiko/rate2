var Redis = require('ioredis');
var debug = require('debug')('rate2')

module.exports = function (cfg) {
    var all_count = cfg.count
    var config = cfg.conn
    var key = cfg.key
    var redirect_url = cfg.redirect_url
    var count = all_count / cfg.conn.length

    var redisClient = []

    for (var i in config) {
        var conn = config[i]
        console.log(conn)

        var redis = new Redis(conn);
        redisClient.push(redis)
    }

    var n_requrest = 0 // 请求总数
    var m_redis = redisClient.length // redis个数

    return {
        disable: function(url){
            var key = cfg.key
            var all_count = cfg.count
            var connections = cfg.conn
            var count = all_count / connections.length 
            
            console.log(count)
            
            for(var i in connections) {
                var conn = connections[i]
                debug(conn)
            
                var redis = new Redis(conn);
            
                redis.mset('enable', 0, 'url', url)
            }   
            // 断开redis连接
        },
        enable: function(){
            var key = cfg.key
            var all_count = cfg.count
            var connections = cfg.conn
            var count = all_count / connections.length 
            
            // console.log(count)
            
            for(var i in connections) {
                var conn = connections[i]
                debug(conn)
            
                var redis = new Redis(conn);
            
                redis.mset('enable', 1, 'url', '')
            } 

            // 断开redis连接
        },
        makeData: function(){
            var key = cfg.key
            var all_count = cfg.count
            var connections = cfg.conn
            var count = all_count / connections.length 

            console.log(count)

            for(var i in connections) {
                var conn = connections[i]
                debug(conn)

                var redis = new Redis(conn);

                var arr = []
                for (var j = 1; j <= count; j++) {
                    arr.push(j)
                }

                redis.lpush(key, arr).then(function(result){
                    debug('done = ' + result)
                    // 断开redis连接
                })
            }

        },
        middleware: function (req, res, next) {
            n_requrest++;
    
            var i_redis = n_requrest % m_redis;
    
            var c_client = redisClient[i_redis] //获取第i个redis连接
            var conn = config[i_redis]
            console.log(conn)
    
            c_client.mget('enable','url').then(function(result) {
                console.log('check if enable ' + result)
                if (parseInt(result[0]) == 1) {
                    console.log('rate now')
                    rate ()
                } else {
                    res.redirect(result[1])
                }
            })
    
            function rate () {
                c_client.exists(key).then(function (isKeyExists) {
                    if (isKeyExists === 1) {
                        // 如果存在，则blpop
                        c_client.blpop(key, 100).then(function (res) {
                            console.log(conn + " - " + res)
                            next()
                        }).catch(function (err) {
                            console.log(err)
                            next()
                        })
                    } else {
                        // 重定向
                        res.redirect(redirect_url)
                    }
                })
            }
        }
    
    }

}
