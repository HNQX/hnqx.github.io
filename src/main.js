$(document).ready(function () {
    const APIVERSION = '/v1'
    setUrlCount()

    $('#changeColor').click(function () {
        let color1 = randomColor(64, 255)
        let color2 = randomColor(192, 255)
        let color3 = randomColor(230, 242)
        document.body.style.setProperty('--instanceColor', color2)
        document.body.style.setProperty('--globeColor', color1)
        document.body.style.setProperty('--mainColor', color3)
        this.style.color = randomColor(0, 64)
    })

    $('.linkLi').click(function () { window.location.href = this.title })

    $('.mask').click(function () { $(this).hide() })
    $('#urlCount').click(function () { setUrlCount(), info('刷新URL数目成功^o^') })
    $('.go').click(function () { window.open($('#shorturl').text(), '_blank') })

    new ClipboardJS('#copy-button');

    /** 路由按钮绑定，REGISTER LOGIN SHORT */
    $('#router *').click(function () { show(this.title) })

    /** 绑定键盘的enter事件 */
    $('.login').bind('keyup', function (e) { e.keyCode === 13 && $('.login button[title="login"]').click() })

    $('.routeBtn').click(function () {
        console.log(this.title)
        switch (this.title) {
            case 'getShortUrl':
                var url = $('#url').val()
                if (!checkUrl(url)) {
                    info('不规范的URL,请重新输入噢 😘')
                    return
                }
                const { username } = _getLogin() || {}
                var data = { url, username }
                $.post(APIVERSION + '/short', data, function (result) {
                    let rUrl = window.location.protocol + '//' + window.location.host + '/' + result.data.code
                    console.log(rUrl);
                    $('.mask').show()
                    $('#shorturl').text(rUrl)
                    $('#qrcode').html('')
                    $('#qrcode').qrcode(rUrl)
                    $("#copy-button").attr("data-clipboard-text", rUrl)
                    $('.input-container').val('')
                    setUrlCount()
                })
                break
            case 'toLogin': show('login'); break
            case 'toRegister': show('register'); break
            case 'query':
                query()
                break
            case 'forget': info(); break
            case 'login':
                const i = getText().login || {}
                if (!i.username) info('USERNAME REQUIRED')
                else if (!i.password) info('PASSWORD REQUIRED')
                else login(i)
                break
            case 'register':
                const r = getText().register || {}
                if (!r.username) info('USERNAME REQUIRED')
                else if (!r.password) info('PASSWORD REQUIRED')
                else if (!r.confirmPassword) info('CONFIRM PASSWORD REQUIRED')
                else if (r.password !== r.confirmPassword) info('PLZ KEEP THE PASSWORD SAME')
                else register(r)
                break
            default:
                break
        }
    })
    $('.some').click(function () {
        console.log(this.title)
        switch (this.title) {
            case 'logout': loginOut(); break
            default:
                break
        }
    })

    show('short')
    weather()
    checkLogin()


    function getText(typeArr) {
        return {
            login: { username: $('.login>:nth-child(1)').val(), password: $('.login>:nth-child(2)').val() },
            register: {
                username: $('.register>:nth-child(1)').val(),
                password: $('.register>:nth-child(2)').val(),
                confirmPassword: $('.register>:nth-child(3)').val(),
            }
        }
    }

    /** 查询已登录用户的所有的URL */
    function query() {
        const { username } = _getLogin() || {}
        if (username) $.post(APIVERSION + '/short/getCodeWithUser', { username }, r => { info(`共${r.data.length}个URL`), _list(r.data) })
        else info('PLEASE LOGIN')
    }

    /** 生成一个列表 */
    function _generateList(data) {
        const headArr = ['code', 'visit', 'note']
        const head = `<tr>${headArr.map(i => `<th>${i.toUpperCase()}</th>`).join('')}
        <th>EDIT</th>
        </tr>`

        let body = ''
        for (let i = 0; i < data.length; i++) {
            body += `<tr>${headArr.map(h => `<td class="linkLi" title="/${data[i].code}">${data[i][h]}</td>`).join('')}
            <td class="edit" title="${data[i]._id}">⚙</td>
            </tr>`
        }
        return head + body
    }

    /** 展示列表 */
    function _list(data) {
        const content = data && data.length > 0 ? `<table class="urlList">${_generateList(data)}</table>` : '是空的哦😆'
        $('.list').html(content), linkLi(), show('list')
    }

    function linkLi() {
        $('.linkLi').click(function () { window.location.href = this.title }),
            $('.edit').click(function () {
                $('.edit').removeClass('active')
                $(this).addClass('active')
                layer.open({
                    type: 2, skin: 'layui-layer-demo', title: false,
                    closeBtn: 0, anim: 2, shadeClose: true,
                    content: `https://me.22222223.xyz/src/edit.html`,
                    success: function (e) {
                        window[e.find('iframe')[0]['name']].setRow(query)
                    }
                })
            })
    }

    /** 注册 */
    function register(params) {
        const { username, password, email, age } = params || {}
        $.post(APIVERSION + '/users/register', { username, password, email, age }, function (r) {
            if (r.code === 200) info(`${r.data.username}注册成功`), show('login')
            else info(r.data)
        })
    }

    /** 登录 */
    function login(params) {
        const { username, password } = params || {}
        $.post(APIVERSION + '/users/login', { username, password }, function (r) {
            if (r.code === 200) setLogin({ username, raw: r.data }), show('short')
            else info(r.data)
        })
    }

    /** 登出 */
    function loginOut() { localStorage.clear(), info('已登出'), checkLogin() }

    /** 检查登录信息 */
    function checkLogin() {
        const { raw } = _getLogin() || {}
        if (raw) $.post(APIVERSION + '/users/getInfo', { raw }, function (r) {
            if (r.code === 200 && r.data) {
                showUser(r.data)
            } else showUser(), info('ERROR PLEASE LOGIN AGAIN')
        })
        else showUser()
    }

    /** 展示用户名 */
    function showUser(r) { $('#user').html(!!r ? `${r.username}[${r.role}]` : ''), !r && localStorage.clear() }

    /** 设置登录信息 */
    function setLogin(login) { localStorage.setItem('loginUser', JSON.stringify(login)), info(`${login.username}已登陆`), checkLogin() }

    /** 获取登录信息 */
    function _getLogin() { return JSON.parse(localStorage.getItem('loginUser')) }

    /** 信息弹窗 */
    function info(msg) { layer.msg(msg || '施工中。。（；´д｀）ゞ', { offset: '10%', time: 2500 }) }

    /** 根据路由显示页面 */
    function show(type) {
        const contentArr = {
            short: { el: $('.short'), title: 'SHORT URL' },
            login: { el: $('.login'), title: 'LOGIN' },
            register: { el: $('.register'), title: 'REGISTER' },
            list: { el: $('.list'), title: 'LIST' }
        }
        for (let i in contentArr) if (contentArr.hasOwnProperty(i)) contentArr[i].el.hide()
        $('.title').html(contentArr[type].title)
        contentArr[type].el.show()
    }

    /** 获取并设置URL数目 */
    function setUrlCount() { $.post(APIVERSION + '/short/getUrlCount', function (r) { (r.code === 200) && $('#urlCount').text(r.data) }) }

    /** 随机颜色 */
    function randomColor(min, max) {
        let random = (min, max) => Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min) + 1)) + Math.ceil(min)
        min = min || 0, max = max || 255
        let r = random(min, max), g = random(min, max), b = random(min, max)
        return `rgb(${r},${g},${b})`
    }

    /** 网址检查 */
    function checkUrl(str_url) {
        let strRegex = "((https|http|ftp|rtsp|mms)://)(([a-zA-Z0-9\._-]+\.[a-zA-Z]{2,6})|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,4})*(/[a-zA-Z0-9\&%_\./-~-]*)?"
        let re = new RegExp(strRegex);
        return re.test(str_url);
    }

    function weather() {
        (function (a, h, g, f, e, d, c, b) { b = function () { d = h.createElement(g); c = h.getElementsByTagName(g)[0]; d.src = e; d.charset = "utf-8"; d.async = 1; c.parentNode.insertBefore(d, c) }; a["SeniverseWeatherWidgetObject"] = f; a[f] || (a[f] = function () { (a[f].q = a[f].q || []).push(arguments) }); a[f].l = +new Date(); if (a.attachEvent) { a.attachEvent("onload", b) } else { a.addEventListener("load", b, false) } }(window, document, "script", "SeniverseWeatherWidget", "//cdn.sencdn.com/widget2/static/js/bundle.js?t=" + parseInt((new Date().getTime() / 100000000).toString(), 10)));
        window.SeniverseWeatherWidget('show', {
            flavor: "bubble",
            location: "WTTDPCGXTWUS",
            geolocation: true,
            language: "auto",
            unit: "c",
            theme: "auto",
            token: "656f029f-3597-4408-8cd3-fa5cc8e07747",
            hover: "enabled",
            container: "tp-weather-widget"
        })
    }
})
