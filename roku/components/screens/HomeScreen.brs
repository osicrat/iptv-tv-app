sub init()
    m.screenTitle = m.top.findNode("screenTitle")
    m.screenSubTitle = m.top.findNode("screenSubTitle")

    m.categoryList = m.top.findNode("categoryList")
    m.contentList = m.top.findNode("contentList")

    m.categoryList.observeField("itemSelected", "onCategorySelected")
    m.contentList.observeField("itemSelected", "onContentSelected")

    m.focusArea = "left"
    m.categories = []
    m.channelsByCategory = {}

    refreshFocus()
end sub

function onKeyEvent(key as String, press as Boolean) as Boolean
    if press = false then return false

    if key = "left"
        m.focusArea = "left"
        refreshFocus()
        return true
    else if key = "right"
        m.focusArea = "right"
        refreshFocus()
        return true
    else if key = "ChannelUp"
        return m.contentList.callFunc("stepSelection", -1)
    else if key = "ChannelDown"
        return m.contentList.callFunc("stepSelection", 1)
    else if key = "back"
        return true
    end if

    if m.focusArea = "left"
        return m.categoryList.callFunc("handleKey", key)
    else
        return m.contentList.callFunc("handleKey", key)
    end if
end function

sub setHeaderData(data as Object)
    if data = invalid then return
    if data.title <> invalid then m.screenTitle.text = data.title
    if data.subtitle <> invalid then m.screenSubTitle.text = data.subtitle
end sub

sub setData(payload as Object)
    if payload = invalid then return

    m.categories = payload.categories
    m.channelsByCategory = payload.channelsByCategory

    if m.categories = invalid then m.categories = []
    if m.channelsByCategory = invalid then m.channelsByCategory = {}

    leftItems = []
    for each cat in m.categories
        leftItems.push({ id: cat.category_id, title: cat.category_name })
    end for
    m.categoryList.callFunc("setItems", leftItems)

    if leftItems.count() > 0
        updateLiveRows(leftItems[0].id.toStr())
    else
        m.contentList.callFunc("setItems", [])
    end if
end sub

sub onCategorySelected(event as Object)
    item = event.getData()
    if item = invalid then return
    updateLiveRows(item.id.toStr())
end sub

sub updateLiveRows(catId as String)
    streams = m.channelsByCategory[catId]
    if streams = invalid then streams = []

    items = []
    for each s in streams
        items.push({ stream_id: s.stream_id, title: s.name, name: s.name })
    end for
    m.contentList.callFunc("setItems", items)
end sub

sub onContentSelected(event as Object)
    item = event.getData()
    if item = invalid then return

    if m.focusArea = "right"
        m.top.channelSelected = item
    end if
end sub

sub refreshFocus()
    m.categoryList.callFunc("setFocused", m.focusArea = "left")
    m.contentList.callFunc("setFocused", m.focusArea = "right")
end sub
