function StorageLoadProvisionedSession() as Dynamic
    section = createObject("roRegistrySection", "apptvs")

    cfgServer = section.read("cfg_server")
    cfgUser = section.read("cfg_username")
    cfgPass = section.read("cfg_password")

    if cfgServer = invalid or cfgUser = invalid or cfgPass = invalid
        return invalid
    end if

    cfgServer = trim(cfgServer)
    cfgUser = trim(cfgUser)
    cfgPass = trim(cfgPass)

    if cfgServer = "" or cfgUser = "" or cfgPass = ""
        return invalid
    end if

    return {
        server: cfgServer
        username: cfgUser
        password: cfgPass
    }
end function

function StorageLoadSettings() as Object
    section = createObject("roRegistrySection", "apptvs")
    pref = section.read("streamPreference")
    if pref = invalid then pref = "ts-first"
    pref = trim(pref)
    if pref <> "hls-first" and pref <> "ts-first"
        pref = "ts-first"
    end if
    return { streamPreference: pref }
end function

sub StorageSaveSettings(settings as Object)
    if settings = invalid then return
    section = createObject("roRegistrySection", "apptvs")
    pref = settings.streamPreference
    if pref = invalid then pref = "ts-first"
    section.write("streamPreference", pref)
    section.flush()
end sub
