sub init()
    m.serverValue = m.top.findNode("serverValue")
    m.userValue = m.top.findNode("userValue")
    m.passValue = m.top.findNode("passValue")
    m.focusRect = m.top.findNode("focusRect")
    m.status = m.top.findNode("status")
    m.submitButton = m.top.findNode("submitButton")

    m.fields = ["server", "username", "password", "submit"]
    m.focusIndex = 0
    m.form = {
        server: "http://"
        username: ""
        password: ""
    }

    refreshView()
end sub

function onKeyEvent(key as String, press as Boolean) as Boolean
    if press = false then return false

    if key = "up"
        m.focusIndex = m.focusIndex - 1
        if m.focusIndex < 0 then m.focusIndex = 0
        refreshFocus()
        return true
    else if key = "down"
        m.focusIndex = m.focusIndex + 1
        if m.focusIndex > m.fields.count() - 1 then m.focusIndex = m.fields.count() - 1
        refreshFocus()
        return true
    else if key = "OK"
        selected = m.fields[m.focusIndex]
        if selected = "submit"
            m.top.submitRequested = {
                server: m.form.server
                username: m.form.username
                password: m.form.password
            }
        else
            openKeyboard(selected)
        end if
        return true
    end if

    return false
end function

sub openKeyboard(fieldName as String)
    kb = createObject("roSGNode", "KeyboardDialog")
    kb.title = "Digite " + fieldName
    kb.text = m.form[fieldName]
    kb.buttons = ["Salvar", "Cancelar"]
    kb.observeField("buttonSelected", "onKeyboardSelected")
    kb.observeField("wasClosed", "onKeyboardClosed")
    m.currentFieldName = fieldName
    m.keyboardDialog = kb
    m.top.getScene().dialog = kb
end sub

sub onKeyboardSelected(event as Object)
    index = event.getData()
    if index = 0 and m.keyboardDialog <> invalid
        m.form[m.currentFieldName] = m.keyboardDialog.text
        refreshView()
    end if
end sub

sub onKeyboardClosed(_event as Object)
    m.keyboardDialog = invalid
    m.currentFieldName = ""
end sub

sub refreshView()
    m.serverValue.text = m.form.server
    m.userValue.text = m.form.username
    m.passValue.text = maskText(m.form.password)
    refreshFocus()
end sub

sub refreshFocus()
    rowY = [215, 310, 405, 490]
    rowHeight = [42, 42, 42, 52]

    m.focusRect.translation = [70, rowY[m.focusIndex]]
    m.focusRect.height = rowHeight[m.focusIndex]

    if m.fields[m.focusIndex] = "submit"
        m.submitButton.color = "0x5DD39EFF"
    else
        m.submitButton.color = "0xFFFFFFFF"
    end if
end sub

function maskText(value as String) as String
    if value = invalid then return ""
    masked = ""
    for i = 0 to value.len() - 1
        masked = masked + "*"
    end for
    return masked
end function

sub setStatus(message as String)
    m.status.text = message
end sub
