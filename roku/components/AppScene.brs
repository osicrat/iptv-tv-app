sub init()
    m.top.backgroundURI = ""

    m.loginScreen = m.top.findNode("loginScreen")
    m.homeScreen = m.top.findNode("homeScreen")
    m.liveScreen = m.top.findNode("liveScreen")
    m.playerScreen = m.top.findNode("playerScreen")

    m.loginScreen.observeField("submitRequested", "onLoginRequested")
    m.homeScreen.observeField("menuSelected", "onHomeMenuSelected")
    m.liveScreen.observeField("channelSelected", "onChannelSelected")
    m.liveScreen.observeField("backRequested", "onLiveBackRequested")
    m.playerScreen.observeField("backRequested", "onPlayerBackRequested")

    m.apiConfig = {}
    loadSavedSessionAndBoot()
end sub

sub loadSavedSessionAndBoot()
    creds = StorageLoadCredentials()
    if creds = invalid
        showScreen("login")
        return
    end if

    m.apiConfig = {
        server: creds.server
        username: creds.username
        password: creds.password
    }

    result = XtreamApiValidateUser(m.apiConfig)
    if result.success = true
        loadHomeData()
        showScreen("home")
    else
        showScreen("login")
    end if
end sub

sub onLoginRequested(event as Object)
    payload = event.getData()
    if payload = invalid then return

    cfg = {
        server: payload.server
        username: payload.username
        password: payload.password
    }

    result = XtreamApiValidateUser(cfg)
    if result.success <> true
        m.loginScreen.callFunc("setStatus", "Falha no login. Verifique os dados.")
        return
    end if

    StorageSaveCredentials(cfg)
    m.apiConfig = cfg
    loadHomeData()
    m.loginScreen.callFunc("setStatus", "")
    showScreen("home")
end sub

sub onHomeMenuSelected(event as Object)
    action = event.getData()
    if action = "live"
        loadLiveData()
        showScreen("live")
    else if action = "logout"
        StorageClearCredentials()
        m.apiConfig = {}
        showScreen("login")
    end if
end sub

sub onLiveBackRequested(_event as Object)
    showScreen("home")
end sub

sub onChannelSelected(event as Object)
    item = event.getData()
    if item = invalid then return

    if item.stream_id = invalid then return

    streamUrl = XtreamApiBuildLiveUrl(m.apiConfig, item.stream_id)
    m.playerScreen.callFunc("playChannel", {
        title: item.name
        url: streamUrl
    })
    showScreen("player")
end sub

sub onPlayerBackRequested(_event as Object)
    showScreen("live")
end sub

sub loadHomeData()
    m.homeScreen.callFunc("setWelcome", "Bem-vindo, " + m.apiConfig.username)
end sub

sub loadLiveData()
    categoriesResult = XtreamApiGetLiveCategories(m.apiConfig)
    channelsResult = XtreamApiGetLiveStreams(m.apiConfig)

    categories = []
    if categoriesResult.success and categoriesResult.data <> invalid
        categories = categoriesResult.data
    end if

    channelsByCategory = {}
    if channelsResult.success and channelsResult.data <> invalid
        for each stream in channelsResult.data
            catId = stream.category_id
            if catId = invalid then catId = ""
            key = catId.toStr()
            if channelsByCategory[key] = invalid
                channelsByCategory[key] = []
            end if
            channelsByCategory[key].push(stream)
        end for
    end if

    m.liveScreen.callFunc("setData", {
        categories: categories
        channelsByCategory: channelsByCategory
    })
end sub

sub showScreen(screenName as String)
    m.loginScreen.visible = false
    m.homeScreen.visible = false
    m.liveScreen.visible = false
    m.playerScreen.visible = false

    if screenName = "login"
        m.loginScreen.visible = true
        m.loginScreen.setFocus(true)
    else if screenName = "home"
        m.homeScreen.visible = true
        m.homeScreen.setFocus(true)
    else if screenName = "live"
        m.liveScreen.visible = true
        m.liveScreen.setFocus(true)
    else if screenName = "player"
        m.playerScreen.visible = true
        m.playerScreen.setFocus(true)
    end if

    m.top.activeScreen = screenName
end sub
