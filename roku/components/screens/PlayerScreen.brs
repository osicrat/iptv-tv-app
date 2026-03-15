sub init()
    m.video = m.top.findNode("video")
    m.title = m.top.findNode("title")
    m.subtitle = m.top.findNode("subtitle")
    m.hint = m.top.findNode("hint")
    m.overlay = m.top.findNode("overlay")
    m.overlayTimer = m.top.findNode("overlayTimer")

    m.overlayTimer.observeField("fire", "onOverlayTimerFire")
end sub

function onKeyEvent(key as String, press as Boolean) as Boolean
    if press = false then return false

    if key = "back"
        stopPlayback()
        m.top.backRequested = true
        return true
    else if key = "info"
        m.overlay.visible = not m.overlay.visible
        if m.overlay.visible then startOverlayTimer()
        return true
    end if

    return false
end function

sub playChannel(payload as Object)
    if payload = invalid then return

    m.title.text = payload.title
    if payload.subtitle <> invalid
        m.subtitle.text = payload.subtitle
    else
        m.subtitle.text = "Ao vivo"
    end if

    m.hint.text = "Info: detalhes • Back: voltar"
    m.subtitle.text = "Conectando..."
    m.overlay.visible = true
    startOverlayTimer()

    content = CreateObject("roSGNode", "ContentNode")
    content.url = payload.url
    content.title = payload.title
    content.streamformat = "hls"

    m.video.content = content
    m.video.control = "play"
    m.subtitle.text = "Ao vivo"
end sub

sub startOverlayTimer()
    m.overlayTimer.control = "stop"
    m.overlayTimer.control = "start"
end sub

sub onOverlayTimerFire(_event as Object)
    m.overlay.visible = false
end sub

sub stopPlayback()
    m.overlayTimer.control = "stop"
    m.video.control = "stop"
    m.video.content = invalid
end sub
