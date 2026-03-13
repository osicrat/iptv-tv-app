sub init()
    m.list = m.top.findNode("list")
    m.frame = m.top.findNode("frame")
    m.items = []

    if m.top.width > 0 then
        m.frame.width = m.top.width
        m.list.width = m.top.width - 24
    end if
    if m.top.height > 0 then
        m.frame.height = m.top.height
        m.list.height = m.top.height - 24
    end if

    m.list.observeField("itemSelected", "onItemSelected")
end sub

function handleKey(key as String) as Boolean
    if key = "up" and m.list.itemFocused > 0
        m.list.jumpToItem = m.list.itemFocused - 1
        return true
    else if key = "down" and m.list.itemFocused < m.items.count() - 1
        m.list.jumpToItem = m.list.itemFocused + 1
        return true
    else if key = "OK"
        emitSelection(m.list.itemFocused)
        return true
    end if
    return false
end function

sub setItems(items as Object)
    m.items = items
    content = createObject("roSGNode", "ContentNode")
    for each item in m.items
        node = createObject("roSGNode", "ContentNode")
        node.title = item.title
        node.addFields(item, true)
        content.appendChild(node)
    end for
    m.list.content = content
end sub

sub setFocused(focused as Boolean)
    if focused
        m.frame.color = "0x2B2B2BFF"
    else
        m.frame.color = "0x1B1B1BFF"
    end if
end sub

sub onItemSelected(event as Object)
    idx = event.getData()
    emitSelection(idx)
end sub

sub emitSelection(idx as Integer)
    if idx < 0 or idx >= m.items.count() then return
    m.top.itemSelected = m.items[idx]
end sub
