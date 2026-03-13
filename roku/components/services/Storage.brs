sub StorageSaveCredentials(cfg as Object)
    section = createObject("roRegistrySection", "apptvs")
    section.write("server", cfg.server)
    section.write("username", cfg.username)
    section.write("password", cfg.password)
    section.flush()
end sub

function StorageLoadCredentials() as Dynamic
    section = createObject("roRegistrySection", "apptvs")
    server = section.read("server", "")
    username = section.read("username", "")
    password = section.read("password", "")

    if server = "" or username = "" or password = ""
        return invalid
    end if

    return {
        server: server
        username: username
        password: password
    }
end function

sub StorageClearCredentials()
    section = createObject("roRegistrySection", "apptvs")
    section.delete("server")
    section.delete("username")
    section.delete("password")
    section.flush()
end sub
