sub init()
    m.video = m.top.findNode("video")
    m.title = m.top.findNode("title")
end sub

function onKeyEvent(key as String, press as Boolean) as Boolean
    if press = false then return false

    if key = "back"
        stopPlayback()
        m.top.backRequested = true
        return true
    end if

    return false
end function

sub playChannel(payload as Object)
    if payload = invalid then return

    m.title.text = payload.title

    content = CreateObject("roSGNode", "ContentNode")
    content.url = payload.url
    content.title = payload.title
    content.streamformat = "hls"

    m.video.content = content
    m.video.control = "play"
end sub

sub stopPlayback()
    m.video.control = "stop"
    m.video.content = invalid
end sub
