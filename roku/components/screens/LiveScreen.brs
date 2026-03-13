sub init()
    m.categoryList = m.top.findNode("categoryList")
    m.channelList = m.top.findNode("channelList")

    m.categoryList.observeField("itemSelected", "onCategorySelected")
    m.channelList.observeField("itemSelected", "onChannelSelected")

    m.focusArea = "categories"
    m.categories = []
    m.channelsByCategory = {}
end sub

function onKeyEvent(key as String, press as Boolean) as Boolean
    if press = false then return false

    if key = "back"
        m.top.backRequested = true
        return true
    end if

    if key = "right"
        m.focusArea = "channels"
        refreshFocus()
        return true
    else if key = "left"
        m.focusArea = "categories"
        refreshFocus()
        return true
    end if

    if m.focusArea = "categories"
        return m.categoryList.callFunc("handleKey", key)
    else
        return m.channelList.callFunc("handleKey", key)
    end if
end function

sub setData(payload as Object)
    if payload = invalid then return

    m.categories = payload.categories
    m.channelsByCategory = payload.channelsByCategory

    categoryItems = []
    for each cat in m.categories
        categoryItems.push({
            id: cat.category_id
            title: cat.category_name
        })
    end for

    m.categoryList.callFunc("setItems", categoryItems)
    if categoryItems.count() > 0
        updateChannelsForCategory(categoryItems[0].id.toStr())
    else
        m.channelList.callFunc("setItems", [])
    end if

    m.focusArea = "categories"
    refreshFocus()
end sub

sub onCategorySelected(event as Object)
    item = event.getData()
    if item = invalid then return
    updateChannelsForCategory(item.id.toStr())
end sub

sub updateChannelsForCategory(catId as String)
    streams = m.channelsByCategory[catId]
    if streams = invalid then streams = []

    channelItems = []
    for each stream in streams
        channelItems.push({
            stream_id: stream.stream_id
            title: stream.name
            name: stream.name
        })
    end for

    m.channelList.callFunc("setItems", channelItems)
end sub

sub onChannelSelected(event as Object)
    item = event.getData()
    if item = invalid then return
    if m.focusArea = "channels"
        m.top.channelSelected = item
    end if
end sub

sub refreshFocus()
    m.categoryList.callFunc("setFocused", m.focusArea = "categories")
    m.channelList.callFunc("setFocused", m.focusArea = "channels")
end sub
