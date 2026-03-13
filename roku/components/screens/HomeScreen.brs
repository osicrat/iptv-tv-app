sub init()
    m.menuBar = m.top.findNode("menuBar")
    m.welcome = m.top.findNode("welcome")

    m.menuBar.callFunc("setItems", [
        { title: "Live TV", action: "live" },
        { title: "Logout", action: "logout" }
    ])
    m.menuBar.observeField("itemSelected", "onMenuSelected")
end sub

function onKeyEvent(key as String, press as Boolean) as Boolean
    if press = false then return false
    return m.menuBar.callFunc("handleKey", key)
end function

sub onMenuSelected(event as Object)
    payload = event.getData()
    if payload = invalid then return
    m.top.menuSelected = payload.action
end sub

sub setWelcome(text as String)
    m.welcome.text = text
end sub
