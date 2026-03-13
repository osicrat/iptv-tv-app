sub init()
    m.list = m.top.findNode("list")
    m.items = []

    m.list.observeField("itemSelected", "onItemSelected")
end sub

function handleKey(key as String) as Boolean
    if key = "left" and m.list.itemFocused > 0
        m.list.jumpToItem = m.list.itemFocused - 1
        return true
    else if key = "right" and m.list.itemFocused < m.items.count() - 1
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
        node.addFields({ action: item.action }, true)
        content.appendChild(node)
    end for
    m.list.content = content
end sub

sub onItemSelected(event as Object)
    idx = event.getData()
    emitSelection(idx)
end sub

sub emitSelection(idx as Integer)
    if idx < 0 or idx >= m.items.count() then return
    m.top.itemSelected = m.items[idx]
end sub
