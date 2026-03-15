sub init()
    m.homeScreen = m.top.findNode("homeScreen")
    m.playerScreen = m.top.findNode("playerScreen")
    m.statusLabel = m.top.findNode("statusLabel")

    m.homeScreen.observeField("channelSelected", "onChannelSelected")
    m.playerScreen.observeField("backRequested", "onPlayerBackRequested")

    m.settings = StorageLoadSettings()
    boot()
end sub

sub boot()
    session = resolveSessionConfig()
    openSession(session)
end sub

function resolveSessionConfig() as Object
    provisioned = StorageLoadProvisionedSession()
    return SessionConfigResolve(provisioned)
end function

sub openSession(session as Object)
    m.apiConfig = {
        server: session.server
        username: session.username
        password: session.password
    }

    validateResult = XtreamApiValidateUser(m.apiConfig)
    if validateResult.success <> true
        showStatus("Falha de autenticação da configuração do app.")
        return
    end if

    categoriesResult = XtreamApiGetLiveCategories(m.apiConfig)
    streamsResult = XtreamApiGetLiveStreams(m.apiConfig)
    if categoriesResult.success <> true or streamsResult.success <> true
        showStatus("Falha ao carregar catálogo Live.")
        return
    end if

    categories = categoriesResult.data
    streams = streamsResult.data
    if categories = invalid then categories = []
    if streams = invalid then streams = []

    channelsByCategory = {}
    for each stream in streams
        key = ""
        if stream.category_id <> invalid then key = stream.category_id.toStr()
        if channelsByCategory[key] = invalid then channelsByCategory[key] = []
        channelsByCategory[key].push(stream)
    end for

    m.homeScreen.callFunc("setHeaderData", {
        title: "Canais ao vivo"
        subtitle: "Categorias e canais"
    })
    m.homeScreen.callFunc("setData", {
        categories: categories
        channelsByCategory: channelsByCategory
    })

    showScreen("home")
end sub

sub onChannelSelected(event as Object)
    item = event.getData()
    if item = invalid or item.stream_id = invalid then return

    preferTs = m.settings.streamPreference = "ts-first"
    streamUrl = XtreamApiBuildLiveUrl(m.apiConfig, item.stream_id, preferTs)
    m.playerScreen.callFunc("playChannel", {
        title: item.name
        subtitle: "Ao vivo"
        url: streamUrl
    })
    showScreen("player")
end sub

sub onPlayerBackRequested(_event as Object)
    showScreen("home")
end sub

sub showStatus(message as String)
    m.homeScreen.visible = false
    m.playerScreen.visible = false
    m.statusLabel.visible = true
    m.statusLabel.text = message
    m.top.activeScreen = "status"
end sub

sub showScreen(name as String)
    m.homeScreen.visible = false
    m.playerScreen.visible = false
    m.statusLabel.visible = false

    if name = "home"
        m.homeScreen.visible = true
        m.homeScreen.setFocus(true)
    else if name = "player"
        m.playerScreen.visible = true
        m.playerScreen.setFocus(true)
    end if

    m.top.activeScreen = name
end sub
