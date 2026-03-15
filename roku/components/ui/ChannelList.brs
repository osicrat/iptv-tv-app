sub init()
    m.list = m.top.findNode("list")
    m.frame = m.top.findNode("frame")
    m.items = []

    applySize()
    m.list.observeField("itemSelected", "onItemSelected")
end sub

sub applySize()
    width = m.top.listWidth
    height = m.top.listHeight

    if width = invalid or width <= 0 then width = 420
    if height = invalid or height <= 0 then height = 520

    m.frame.width = width
    m.frame.height = height

    rowHeight = 48
    rows = int((height - 24) / rowHeight)
    if rows < 1 then rows = 1

    m.list.itemSize = [width - 24, rowHeight]
    m.list.numRows = rows
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

function getItems() as Object
    return m.items
end function

function stepSelection(step as Integer) as Boolean
    if m.items.count() = 0 then return false
    nextIndex = m.list.itemFocused + step
    if nextIndex < 0 then nextIndex = 0
    if nextIndex > m.items.count() - 1 then nextIndex = m.items.count() - 1
    m.list.jumpToItem = nextIndex
    emitSelection(nextIndex)
    return true
end function

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
