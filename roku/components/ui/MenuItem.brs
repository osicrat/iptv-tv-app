sub init()
    m.bg = m.top.findNode("bg")
    m.title = m.top.findNode("title")
end sub

sub onItemContentChanged()
    if m.top.itemContent <> invalid
        m.title.text = m.top.itemContent.title
    end if
end sub

sub onFocusPercentChanged()
    if m.top.focusPercent > 0
        m.bg.color = "0x5DD39EFF"
    else
        m.bg.color = "0x242424FF"
    end if
end sub
