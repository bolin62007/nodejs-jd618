const http = require('http');
const fs =require('fs');
const config = require("./config");
let url,
    ck,
    phone,
    axios,
    nowTime,//当前服务器时间
    getCnt = 0,
    startTime,
    endTime,
    options,
    t1,
    conf = config,
    coupons = conf.coupons,
    couponTime,
    req;



function formateDate(date) {
    let dateObj = new Date(+date);
    let year = dateObj.getFullYear();
    let month = dateObj.getMonth()+1;
    let day = dateObj.getDate();
    let hours = dateObj.getHours();
    let mins = dateObj.getMinutes();
    let secs = dateObj.getSeconds();
    let msecs = dateObj.getMilliseconds();
    if(month<10) {
        month = "0"+month;
    }
    if(day<10) {
        day = "0"+day;
    }
    if(hours<10){
        hours = "0"+hours;
    }
    if(mins<10){
        mins = "0"+mins;
    }
    if(secs<10){
        secs ="0"+secs;
    }
    if(msecs<10) {
        msecs = "00"+msecs;
    }else if(msecs<100&&msecs>=10){
        msecs = "0"+msecs;
    }
    return year+month+day+hours+mins+secs+msecs;
}

//http请求配置
// api.m.jd.com/client.action?functionId=babelActivityGetShareInfo&client=wh5
options = {
    hostname:'api.m.jd.com',     //此处不能写协议否则会报错
    path:'/client.action?functionId=babelActivityGetShareInfo&client=wh5',
    method:'GET',
    headers: {
        'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8'
    }
};

t1 = setInterval(function(){
    req = http.request(options,function(res){
        res.setEncoding('utf8');
        res.on('data',function(chunk){
            getCnt++;
            nowTime = formateDate(JSON.parse(chunk).time);
            nowTime =+(nowTime.substr(8));
            fs.appendFileSync(`${__dirname}/time_log.txt`,`\n${getCnt}:${nowTime}`,function (){});
            for(let i =0,len= config.coupons.length;i<len;i++){
                couponTime = coupons[i].time;
                startTime = couponTime - 500;//开始时间
                endTime = couponTime + 500;
                if( nowTime <= endTime && nowTime >= startTime ){
                    url = coupons[i].url;
                    getCoupon();
                }
            }
        });
    });
    req.end();
},config.interval);

async function getCoupon(){
    for(let i = 0,len = config.user.length;i<len;i++){
        ck = config.user[i].ck;
        phone = config.user[i].phone;
        axios = require("axios").create({
            headers: {
                'Cookie': ck,
                'Host': 'opencredit.jd.com',
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1'
            }
        });
        await axios.get(url)
            .then(function (response) {
                fs.appendFileSync(`${__dirname}/log.txt`,`\n${nowTime}:${phone}:${response.data.isSuccess},${response.data.responseCode}`,function () {
                    // console.log('追加内容完成');
                });
            })
            .catch(function (error) {
                // console.log(error);
                fs.appendFileSync(`${__dirname}/fail_log.txt`,`\n${error}`,function () {
                    // console.log('追加内容完成');
                });
            });
        axios = null;
    }
}
