function XtreamApiDefaultBaseUrl() as String
    return "https://supertvcine.com.br:443"
end function

function XtreamApiValidateUser(cfg as Object) as Object
    return XtreamApiRequest(cfg, { action: "" })
end function

function XtreamApiGetLiveCategories(cfg as Object) as Object
    return XtreamApiRequest(cfg, { action: "get_live_categories" })
end function

function XtreamApiGetLiveStreams(cfg as Object) as Object
    return XtreamApiRequest(cfg, { action: "get_live_streams" })
end function

function XtreamApiBuildLiveUrl(cfg as Object, streamId as Dynamic, preferTs as Dynamic) as String
    base = normalizeServer(cfg.server)
    if base = "" then base = XtreamApiDefaultBaseUrl()
    ext = "m3u8"
    if preferTs <> invalid and preferTs = true then ext = "ts"
    return base + "/live/" + cfg.username + "/" + cfg.password + "/" + streamId.toStr() + "." + ext
end function

function XtreamApiRequest(cfg as Object, options as Object) as Object
    if cfg = invalid or cfg.username = invalid or cfg.password = invalid
        return { success: false, error: "Configuração inválida" }
    end if

    base = normalizeServer(cfg.server)
    if base = "" then base = XtreamApiDefaultBaseUrl()

    endpoint = base + "/player_api.php"
    endpoint = endpoint + "?username=" + cfg.username + "&password=" + cfg.password

    if options.action <> invalid and options.action <> ""
        endpoint = endpoint + "&action=" + options.action
    end if

    transfer = createObject("roUrlTransfer")
    transfer.setUrl(endpoint)
    transfer.setCertificatesFile("common:/certs/ca-bundle.crt")
    transfer.initClientCertificates()

    response = transfer.getToString()
    if response = invalid or response = ""
        return { success: false, error: "Sem resposta da API" }
    end if

    data = parseJson(response)
    if data = invalid
        return { success: false, error: "Resposta inválida da API" }
    end if

    if options.action = ""
        userInfo = data.user_info
        if userInfo <> invalid and userInfo.auth = 1
            return { success: true, data: data }
        end if
        return { success: false, error: "Usuário não autenticado" }
    end if

    return { success: true, data: data }
end function

function normalizeServer(server as String) as String
    if server = invalid then return ""
    value = trim(server)
    if value = "" then return ""
    if right(value, 1) = "/"
        value = left(value, value.len() - 1)
    end if
    return value
end function
